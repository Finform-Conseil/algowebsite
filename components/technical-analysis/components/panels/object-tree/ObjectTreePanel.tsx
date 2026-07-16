"use client";

/**
 * [TENOR 2026 FEAT] ObjectTreePanel
 *
 * Panneau latéral "Object Tree & Data Window" en parité TradingView.
 * Design : fond blanc clair (PAT-143), ombre TV, 2 onglets.
 *
 * Onglet Object Tree : liste des drawings avec contrôles visibility/lock/trash.
 * Onglet Data Window : OHLCV + Change de la bougie pointée, en temps réel.
 *
 * [TENOR 2026 FIX] SCAR-192 : Eradication des appels natifs bloquants (prompt, confirm, alert).
 * Remplacement par une UI inline fluide et non-bloquante (Premium UI).
 *
 * [TENOR 2026 FIX] SCAR-PERF-05 : DataWindow DOM Anchors
 * Injection des IDs statiques (dw-open, dw-close, etc.) pour permettre au hook
 * useObjectTreePanel de muter le DOM en O(1) à 60FPS sans re-render React.
 *
 * [TENOR 2026 HDR] COMPARE SYMBOLS INTEGRATION
 * Les symboles comparés sont injectés dynamiquement depuis Redux dans l'Object Tree.
 * Les 5 slots statiques pour la DataWindow sont pré-alloués pour le Zero-Lag DOM Mutation.
 */

import React, { useCallback, useMemo, useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { AdvancedIndicatorsState } from "../../../config/indicators/advancedIndicatorsTypes";
import type { ObjectTreePanelTab, DataWindowCandleValues } from "../../../config/object-tree/objectTreeTypes";
import type { ChartAppearance, ChartState } from "../../../config/state/chartStateTypes";
import type { PineChartOverlayPayload } from "../../../components/sidebar/panels/pineEditor/pineTypes";
import { setAdvancedIndicators, setChartAppearance, setChartConfig, removeComparisonSymbol, clearPineChartOverlay } from "../../../store/technicalAnalysisSlice";
import { resolveTrendSignalSourceAveragePeriods } from "../../../config/indicators/movingAverageSeries";
import { resolvePriceVsSmaSourceAveragePeriods } from "../../../config/indicators/priceVsSmaMetrics";
import { resolvePriceVsEmaSourceAveragePeriods } from "../../../config/indicators/priceVsEmaMetrics";
import type { RootState } from "@/core/infrastructure/store";
import { DataWindowTab } from "./DataWindowTab";
import { ObjectTreeActionToolbar, type ObjectTreePanelMenu, type VisualOrderDirection } from "./ObjectTreeActionToolbar";
import { ObjectTreeDrawingList } from "./ObjectTreeDrawingList";
import { ObjectTreeInlineStates } from "./ObjectTreeInlineStates";
import { resolveDrawingBulkAction, type DrawingBulkAction } from "./objectTreeDrawingActions";
import { buildObjectTreeItems } from "./objectTreeItems";
import type { ObjectTreeItem } from "./objectTreeItemTypes";
import { IconButton, ObjectTreeItemRow } from "./objectTreeRows";
import { TV } from "./objectTreePanelStyles";
import {
  resolveObjectItemRemoveAction,
  resolveObjectItemVisibilityAction,
} from "./objectTreeActions";

// ============================================================================
// PROPS
// ============================================================================
export interface ObjectTreePanelProps {
  isOpen: boolean;
  activeTab: ObjectTreePanelTab;
  setActiveTab: (tab: ObjectTreePanelTab) => void;
  drawings: Drawing[];
  selectedDrawingId: string | null;
  setSelectedDrawingId: (id: string | null) => void;
  updateDrawing: (id: string, patch: Partial<Drawing>) => void;
  deleteDrawing: (id: string) => void;
  handleClone: () => void;
  handleVisualOrder: (dir: "front" | "back" | "forward" | "backward") => void;
  dataWindow: DataWindowCandleValues | null;
  symbolDisplay?: string;
  isMainChartVisible: boolean;
  setIsMainChartVisible: (val: boolean) => void;
  chartConfig: ChartState;
  chartAppearance: ChartAppearance;
  advancedIndicators: AdvancedIndicatorsState;
  activeTool: string | null;
  hiddenObjectIds: Record<string, boolean>;
  setHiddenObjectIds: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const ObjectTreePanel: React.FC<ObjectTreePanelProps> = ({
  isOpen,
  activeTab,
  setActiveTab,
  drawings,
  selectedDrawingId,
  setSelectedDrawingId,
  updateDrawing,
  deleteDrawing,
  handleClone,
  handleVisualOrder,
  dataWindow,
  symbolDisplay = "BOAB · BRVM, 1D",
  isMainChartVisible,
  setIsMainChartVisible,
  chartConfig,
  chartAppearance,
  advancedIndicators,
  activeTool,
  hiddenObjectIds,
  setHiddenObjectIds,
}) => {
  const dispatch = useDispatch();

  // [TENOR 2026] Smart Component: Read comparison symbols directly from Redux
  const comparisonSymbols = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSymbols);
  const comparisonSettings = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSettings);
  const movingAverageTrendSignalState = useSelector((state: RootState) => state.technicalAnalysis.ui.movingAverageTrendSignals);
  const priceVsSmaMetricState = useSelector((state: RootState) => state.technicalAnalysis.ui.priceVsSmaMetrics);
  const priceVsEmaMetricState = useSelector((state: RootState) => state.technicalAnalysis.ui.priceVsEmaMetrics);
  const indicatorPeriods = useSelector((state: RootState) => state.technicalAnalysis.indicatorPeriods);
  const pineChartOverlay = useSelector((state: RootState) => state.technicalAnalysis.pineChartOverlay);
  const movingAverageTrendSignals = useMemo(
    () => resolveTrendSignalSourceAveragePeriods(movingAverageTrendSignalState),
    [movingAverageTrendSignalState],
  );
  const priceVsSmaSourcePeriods = useMemo(
    () => resolvePriceVsSmaSourceAveragePeriods(priceVsSmaMetricState),
    [priceVsSmaMetricState],
  );
  const priceVsEmaSourcePeriods = useMemo(
    () => resolvePriceVsEmaSourceAveragePeriods(priceVsEmaMetricState),
    [priceVsEmaMetricState],
  );

  const [activeMenu, setActiveMenu] = useState<ObjectTreePanelMenu | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  // [TENOR 2026] Inline UI States (Replacing native dialogs)
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setErrorMsg(null), 3000);
  }, []);

  const handleVisibilityToggle = useCallback(
    (id: string, hidden: boolean) => updateDrawing(id, { hidden }),
    [updateDrawing]
  );

  const patchChartIndicators = useCallback((patch: Partial<ChartState["indicators"]>) => {
    dispatch(setChartConfig({ indicators: { ...chartConfig.indicators, ...patch } }));
  }, [chartConfig.indicators, dispatch]);

  const handleObjectItemVisibilityToggle = useCallback((item: ObjectTreeItem) => {
    const action = resolveObjectItemVisibilityAction(item);

    if (action.type === "toggle-volume") {
      dispatch(setChartAppearance({ showVolume: !chartAppearance.showVolume }));
      return;
    }

    setHiddenObjectIds((prev) => ({ ...prev, [action.id]: !prev[action.id] }));
  }, [chartAppearance.showVolume, dispatch, setHiddenObjectIds]);

  const handleObjectItemRemove = useCallback((item: ObjectTreeItem) => {
    const action = resolveObjectItemRemoveAction({
      item,
      indicators: chartConfig.indicators,
      advancedIndicators,
    });

    switch (action.type) {
      case "blocked":
      case "unsupported":
        showError(action.message);
        return;
      case "remove-comparison":
        dispatch(removeComparisonSymbol(action.symbol));
        return;
      case "remove-pine-overlay":
        dispatch(clearPineChartOverlay());
        return;
      case "patch-indicators":
        patchChartIndicators(action.patch);
        return;
      case "set-advanced-indicator":
        dispatch(setAdvancedIndicators(action.patch));
        return;
    }
  }, [advancedIndicators, chartConfig.indicators, dispatch, patchChartIndicators, showError]);

  const handleLockToggle = useCallback(
    (id: string, locked: boolean) => updateDrawing(id, { locked }),
    [updateDrawing]
  );

  const handleGroupCreateClick = useCallback(() => {
    if (!selectedDrawingId) {
      showError(selectedObjectId ? "Les groupes s'appliquent uniquement aux dessins poses." : "Selectionnez un dessin pose pour creer un groupe.");
      return;
    }
    setIsCreatingGroup(true);
    setActiveMenu(null);
  }, [selectedDrawingId, selectedObjectId, showError]);

  const handleDrawingSelect = useCallback((id: string) => {
    setSelectedObjectId(null);
    setSelectedDrawingId(id);
  }, [setSelectedDrawingId]);

  const handleCloneClick = useCallback(() => {
    if (!selectedDrawingId) {
      showError(selectedObjectId ? "La duplication s'applique uniquement aux dessins poses." : "Selectionnez un dessin pose a dupliquer.");
      return;
    }
    handleClone();
  }, [handleClone, selectedDrawingId, selectedObjectId, showError]);

  const handleZOrderMenuClick = useCallback(() => {
    if (!selectedDrawingId) {
      showError(selectedObjectId ? "L'ordre visuel s'applique uniquement aux dessins poses; les indicateurs suivent le renderer." : "Selectionnez un dessin pose avant de changer l'ordre visuel.");
      setActiveMenu(null);
      return;
    }
    setActiveMenu((current) => current === "zorder" ? null : "zorder");
  }, [selectedDrawingId, selectedObjectId, showError]);

  const handleGlobalActionMenuClick = useCallback(() => {
    setActiveMenu((current) => current === "layouts" ? null : "layouts");
  }, []);

  const handleZOrderClick = useCallback((dir: VisualOrderDirection) => {
    if (!selectedDrawingId) {
      showError(selectedObjectId ? "L'ordre visuel s'applique uniquement aux dessins poses; les indicateurs suivent le renderer." : "Selectionnez un dessin pose avant de changer l'ordre visuel.");
      return;
    }
    handleVisualOrder(dir);
    setActiveMenu(null);
  }, [handleVisualOrder, selectedDrawingId, selectedObjectId, showError]);

  const confirmGroupCreate = useCallback(() => {
    if (newGroupName.trim() && selectedDrawingId) {
      updateDrawing(selectedDrawingId, { groupId: newGroupName.trim() });
    }
    setIsCreatingGroup(false);
    setNewGroupName("");
  }, [newGroupName, selectedDrawingId, updateDrawing]);

  const cancelGroupCreate = useCallback(() => {
    setIsCreatingGroup(false);
  }, []);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const applyDrawingBulkAction = useCallback((action: DrawingBulkAction) => {
    const resolution = resolveDrawingBulkAction(action, drawings.length);

    if (resolution.type === "blocked") {
      showError(resolution.message);
      setActiveMenu(null);
      return;
    }

    drawings.forEach((drawing) => updateDrawing(drawing.id, resolution.patch));
    setActiveMenu(null);
  }, [drawings, showError, updateDrawing]);

  const handleGlobalHideAll = useCallback(() => applyDrawingBulkAction("hide-all"), [applyDrawingBulkAction]);
  const handleGlobalShowAll = useCallback(() => applyDrawingBulkAction("show-all"), [applyDrawingBulkAction]);
  const handleGlobalLockAll = useCallback(() => applyDrawingBulkAction("lock-all"), [applyDrawingBulkAction]);
  const handleGlobalUnlockAll = useCallback(() => applyDrawingBulkAction("unlock-all"), [applyDrawingBulkAction]);

  const handleDeleteAllClick = useCallback(() => {
    if (drawings.length === 0) {
      showError("Aucun dessin à supprimer.");
      return;
    }
    setIsConfirmingDelete(true);
    setActiveMenu(null);
  }, [drawings.length, showError]);

  const confirmDeleteAll = useCallback(() => {
    drawings.forEach(d => deleteDrawing(d.id));
    setIsConfirmingDelete(false);
  }, [drawings, deleteDrawing]);

  const cancelDeleteAll = useCallback(() => {
    setIsConfirmingDelete(false);
  }, []);

  if (!isOpen) return null;

  const objectTreeItems = buildObjectTreeItems({
    chartConfig,
    indicatorPeriods,
    chartAppearance,
    advancedIndicators,
    isMainChartVisible,
    activeTool,
    hiddenObjectIds,
    comparisonSymbols,
    comparisonSettings,
    movingAverageTrendSignals,
    priceVsSmaSourcePeriods,
    priceVsEmaSourcePeriods,
    pineChartOverlay,
  });

  const selectedObject = objectTreeItems.find((item) => item.id === selectedObjectId) ?? null;

  return (
    <div
      id="gp-object-tree-panel"
      role="complementary"
      aria-label="Object tree and data window"
      onClick={() => setActiveMenu(null)}
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: TV.bg,
        borderLeft: TV.border,
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Segmented Tab Control (TV Pill Style) */}
      <div style={{ padding: "12px 14px 8px 14px", flexShrink: 0 }}>
        <div
          role="tablist"
          style={{
            display: "flex",
            background: "rgba(255, 255, 255, 0.04)",
            borderRadius: "6px",
            padding: "4px",
            gap: "4px",
          }}
        >
          {(["object_tree", "data_window"] as ObjectTreePanelTab[]).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "object_tree" ? "Object tree" : "Data window";
            return (
              <button
                key={tab}
                id={`gp-panel-tab-${tab}`}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  border: "none",
                  background: isActive ? "var(--gp-bg-toolbar, #0d2136)" : "transparent",
                  color: isActive ? TV.tabText : TV.tabMuted,
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  boxShadow: isActive ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content area (scrollable) */}
      <div className="gp-object-tree-scrollpane" style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "object_tree" ? (
          <>
            <ObjectTreeActionToolbar
              activeMenu={activeMenu}
              selectedObject={selectedObject}
              canUseDrawingActions={Boolean(selectedDrawingId)}
              onGroupCreate={handleGroupCreateClick}
              onCloneSelected={handleCloneClick}
              onToggleZOrderMenu={handleZOrderMenuClick}
              onToggleGlobalMenu={handleGlobalActionMenuClick}
              onVisualOrder={handleZOrderClick}
              onSelectedObjectVisibilityToggle={() => {
                if (!selectedObject) return;
                handleObjectItemVisibilityToggle(selectedObject);
                setActiveMenu(null);
              }}
              onSelectedObjectRemove={() => {
                if (!selectedObject) return;
                handleObjectItemRemove(selectedObject);
                setActiveMenu(null);
              }}
              onHideAllDrawings={handleGlobalHideAll}
              onShowAllDrawings={handleGlobalShowAll}
              onLockAllDrawings={handleGlobalLockAll}
              onUnlockAllDrawings={handleGlobalUnlockAll}
              onDeleteAllDrawings={handleDeleteAllClick}
            />

            <ObjectTreeInlineStates
              errorMessage={errorMsg}
              isCreatingGroup={isCreatingGroup}
              groupName={newGroupName}
              isConfirmingDelete={isConfirmingDelete}
              onGroupNameChange={setNewGroupName}
              onGroupCreateConfirm={confirmGroupCreate}
              onGroupCreateCancel={cancelGroupCreate}
              onDeleteAllConfirm={confirmDeleteAll}
              onDeleteAllCancel={cancelDeleteAll}
            />

            {/* TV Symbol Row */}
            <div style={{ display: "flex", padding: "10px 14px", alignItems: "center", borderBottom: TV.divider, background: "rgba(255,255,255,0.02)", flexShrink: 0 }}>
              <span style={{ color: TV.tabText, marginRight: "10px", opacity: 0.8, display: "flex", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="currentColor">
                  <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z"></path>
                  <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z"></path>
                  <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z"></path>
                  <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z"></path>
                </svg>
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: TV.tabText, flex: 1, textTransform: "uppercase" }}>
                {symbolDisplay}
              </span>
              <IconButton
                icon={isMainChartVisible ? "bi bi-eye" : "bi bi-eye-slash"}
                title={isMainChartVisible ? "Masquer le graphique" : "Afficher le graphique"}
                style={{ padding: "4px", fontSize: 14 }}
                onClick={() => setIsMainChartVisible(!isMainChartVisible)}
              />
            </div>

            {objectTreeItems.length > 0 && (
              <div role="rowgroup" aria-label="Objets du graphique" style={{ borderBottom: TV.divider }}>
                {objectTreeItems.map((item) => (
                  <ObjectTreeItemRow
                    key={item.id}
                    item={item}
                    isSelected={selectedObjectId === item.id}
                    onSelect={(id) => {
                      setSelectedObjectId(id);
                      setSelectedDrawingId(null);
                    }}
                    onVisibilityToggle={handleObjectItemVisibilityToggle}
                    onMainVisibilityToggle={() => setIsMainChartVisible(!isMainChartVisible)}
                    onRemove={handleObjectItemRemove}
                  />
                ))}
              </div>
            )}

            <ObjectTreeDrawingList
              drawings={drawings}
              selectedDrawingId={selectedDrawingId}
              collapsedGroups={collapsedGroups}
              onGroupToggle={toggleGroupCollapse}
              onSelect={handleDrawingSelect}
              onVisibilityToggle={handleVisibilityToggle}
              onLockToggle={handleLockToggle}
              onDelete={deleteDrawing}
            />

          </>
        ) : (
          <DataWindowTab data={dataWindow} symbolDisplay={symbolDisplay} />
        )}
      </div>
    </div>
  );
};


export default ObjectTreePanel;

// --- EOF ---
