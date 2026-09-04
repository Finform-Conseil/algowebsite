"use client";

import React, { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useDispatch } from "react-redux";
import type { MultiChartLayoutState } from "../../config/layout/multiChartLayoutTypes";
import type {
  CompleteMultiChartLayoutCell,
  CompleteMultiChartLayoutState,
  MultiChartViewportState,
} from "../../config/layout/multiChartCellState";
import type { ChartAppearance } from "../../config/state/chartStateTypes";
import type { UiState } from "../../config/state/uiStateTypes";
import { getLayoutDefinition } from "../../config/layout/multiChartLayouts";
import { createTimeframeMarketDataCacheKey } from "../../config/market/timeframeCatalog";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";
import type { ComparisonLoadState } from "../../hooks/MarketData/useMarketData";
import {
  useMultiChartSync,
  type MultiChartSyncPeer,
} from "../../hooks/useMultiChartSync";
import {
  clearLayoutChart,
  duplicateLayoutChart,
  swapLayoutCharts,
  toggleMaximizeLayoutChart,
  updateLayoutChart,
} from "../../store/technicalAnalysisSlice";
import type { FullPeerChartProps } from "./FullPeerChart";
import { MultiChartCellControls } from "./MultiChartCellControls";
import { getRenderableOhlcvSeries } from "./layoutChartData";
import {
  resolveMultiChartDropTargetFromRects,
  type MultiChartDropTargetRect,
} from "./multiChartDragTarget";

const PeerChartFallback = () => (
  <div className="gp-multi-chart-cell gp-multi-chart-cell--secondary">
    <span className="gp-multi-chart-cell__loading" aria-live="polite">
      <span className="gp-mini-data-spinner" aria-hidden="true" />
      <strong>Chargement du graphique</strong>
      <em>Préparation du panneau</em>
    </span>
  </div>
);

const FullPeerChart = dynamic<FullPeerChartProps>(
  () => import("./FullPeerChart").then((module) => module.FullPeerChart),
  { ssr: false, loading: PeerChartFallback }
);

const MULTI_CHART_DRAG_MOVE_TOLERANCE_PX = 6;
const MULTI_CHART_DRAG_CLICK_SUPPRESSION_MS = 250;
const MULTI_CHART_DRAG_DISCOVERY_STORAGE_KEY = "technical-analysis.multiChartDragDiscovery.v1";
const MULTI_CHART_DRAG_DISCOVERY_DELAY_MS = 900;
const MULTI_CHART_DRAG_DISCOVERY_VISIBLE_MS = 6000;

type MultiChartDragInteraction = {
  pointerId: number;
  sourceChartId: string;
  slot: HTMLDivElement;
  startX: number;
  startY: number;
  activated: boolean;
  targetChartId: string | null;
};

const isPanelDragControl = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest(
    ".gp-multi-chart-cell-controls, button, select, input, textarea, a, [role='menu'], [role='dialog']",
  ));

const isPanelDragHandle = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest("[data-panel-drag-handle='true']"));

const isPanelDragSurface = (target: EventTarget | null): boolean =>
  target instanceof Element && (
    isPanelDragHandle(target)
    || (
      Boolean(target.closest("[data-panel-drag-surface='true']"))
      && !isPanelDragControl(target)
    )
  );

const resolveLatestFiniteClose = (data: readonly ChartDataPoint[]): number | null => {
  for (let index = data.length - 1; index >= 0; index -= 1) {
    const close = data[index]?.close;
    if (typeof close === "number" && Number.isFinite(close) && close > 0) return close;
  }
  return null;
};

export interface MultiChartContextMenuRequest {
  event: React.MouseEvent<HTMLDivElement>;
  cell: MultiChartLayoutState["charts"][number];
  chart: EChartsInstance | null;
  indicatorState: CompleteMultiChartLayoutCell["indicatorState"];
  referencePriceValue: number | null;
}

interface MultiChartLayoutGridProps {
  layout: MultiChartLayoutState;
  marketData: Record<string, ChartDataPoint[]>;
  dataLoadState: ComparisonLoadState;
  dataMode: "mock" | "real";
  activeChartInstanceRef: React.MutableRefObject<EChartsInstance | null>;
  chartAppearance: ChartAppearance;
  uiState: UiState;
  hiddenObjectIds?: Record<string, boolean>;
  children: ReactNode;
  onActivateChart: (chartId: string) => void;
  onChartContextMenu?: (request: MultiChartContextMenuRequest) => void;
  /** Open the canonical market directory for an empty cell. */
  onRequestMarketSelection: (chartId: string) => void;
  /** Route la cellule cible ET son exchange vers le sélecteur de titre en une seule intention. */
  onRequestTickerSelection: (chartId: string, exchange: string) => void;
  onHistoryBoundaryRequest?: (cell: MultiChartLayoutState["charts"][number], direction: "left" | "right") => void;
}

export const MultiChartLayoutGrid: React.FC<MultiChartLayoutGridProps> = ({
  layout,
  marketData,
  dataLoadState,
  dataMode,
  activeChartInstanceRef,
  chartAppearance,
  uiState,
  hiddenObjectIds = {},
  children,
  onActivateChart,
  onChartContextMenu,
  onRequestMarketSelection,
  onRequestTickerSelection,
  onHistoryBoundaryRequest,
}) => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const definition = getLayoutDefinition(layout.layoutId);
  const completeLayout = layout as Partial<CompleteMultiChartLayoutState>;
  const maximizedChartId = completeLayout.maximizedChartId ?? null;
  const visibleCharts = maximizedChartId
    ? layout.charts.filter((cell) => cell.chartId === maximizedChartId)
    : layout.charts;
  const hasEmptySlot = layout.charts.some((cell) => !cell.symbol.trim());
  const effectiveActiveChartId = useMemo(() => {
    const requestedActive = layout.charts.find((cell) => cell.chartId === layout.activeChartId);
    if (requestedActive?.symbol.trim()) return requestedActive.chartId;
    return layout.charts.find((cell) => cell.symbol.trim())?.chartId ?? layout.activeChartId;
  }, [layout.activeChartId, layout.charts]);
  // TradingView-like multi-chart contract: every panel owns one persistent chart
  // instance and one immutable dataset. Activating a panel only changes which
  // instance is considered active; no canvas is moved or reparented.
  const isMultiChartMode = layout.isEnabled && layout.charts.length > 1;
  const renderedCharts = isMultiChartMode ? visibleCharts : visibleCharts.slice(0, 1);
  const [secondaryChartsById, setSecondaryChartsById] = useState<Record<string, EChartsInstance>>({});
  const activePeerChartRef = useRef<EChartsInstance | null>(null);
  const dragInteractionRef = useRef<MultiChartDragInteraction | null>(null);
  const suppressClickUntilRef = useRef(0);
  const [dragSourceChartId, setDragSourceChartId] = useState<string | null>(null);
  const [dropTargetChartId, setDropTargetChartId] = useState<string | null>(null);
  const [showDragDiscoveryHint, setShowDragDiscoveryHint] = useState(false);
  const validDragChartIds = useMemo(
    () => new Set(layout.charts.map((cell) => cell.chartId)),
    [layout.charts],
  );
  const isFrenchUi = pathname === "/fr" || pathname.startsWith("/fr/");
  const dragDiscoveryCopy = isFrenchUi
    ? {
        handleLabel: "Poignée pour déplacer ce graphique",
        tooltip: "Glisser pour déplacer",
        coachmark: "Glissez cette poignée vers un autre panneau pour échanger leur position.",
        dropLabel: "Déposer ici",
      }
    : {
        handleLabel: "Handle to move this chart",
        tooltip: "Drag to move",
        coachmark: "Drag this handle onto another panel to swap their positions.",
        dropLabel: "Drop here",
      };
  const discoveryChartId = renderedCharts[0]?.chartId ?? null;

  const dismissDragDiscovery = useCallback(() => {
    setShowDragDiscoveryHint(false);
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(MULTI_CHART_DRAG_DISCOVERY_STORAGE_KEY, "seen");
    } catch {
      // Storage can be unavailable in hardened/private contexts. The permanent
      // handle and tooltip remain sufficient affordances without persistence.
    }
  }, []);

  useEffect(() => {
    if (!isMultiChartMode || maximizedChartId || !discoveryChartId || typeof window === "undefined") {
      setShowDragDiscoveryHint(false);
      return;
    }

    try {
      if (window.localStorage.getItem(MULTI_CHART_DRAG_DISCOVERY_STORAGE_KEY) === "seen") return;
    } catch {
      // Continue with an in-memory one-shot hint when storage is unavailable.
    }

    let hideTimer = 0;
    const showTimer = window.setTimeout(() => {
      setShowDragDiscoveryHint(true);
      hideTimer = window.setTimeout(() => {
        setShowDragDiscoveryHint(false);
        try {
          // Persist only after the hint was actually exposed for its full window.
          // A transient hydration/layout remount must never consume onboarding.
          window.localStorage.setItem(MULTI_CHART_DRAG_DISCOVERY_STORAGE_KEY, "seen");
        } catch {
          // Non-fatal: the permanent handle and tooltip remain available.
        }
      }, MULTI_CHART_DRAG_DISCOVERY_VISIBLE_MS);
    }, MULTI_CHART_DRAG_DISCOVERY_DELAY_MS);

    return () => {
      window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [discoveryChartId, isMultiChartMode, maximizedChartId]);

  const getCellCacheKey = useCallback((cell: MultiChartLayoutState["charts"][number]): string => {
    const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
    return createTimeframeMarketDataCacheKey(
      cell.exchange,
      cell.symbol,
      cell.interval,
      completeCell.sourceKind ?? "equity",
      completeCell.sourceId,
    );
  }, []);

  const handleChartReady = useCallback((chartId: string, chart: EChartsInstance) => {
    setSecondaryChartsById((current) => (current[chartId] === chart ? current : { ...current, [chartId]: chart }));
  }, []);

  const handleChartDispose = useCallback((chartId: string) => {
    setSecondaryChartsById((current) => {
      if (!current[chartId]) return current;
      const next = { ...current };
      delete next[chartId];
      return next;
    });
  }, []);

  const activeDisplayCell = layout.charts.find((cell) => cell.chartId === effectiveActiveChartId);
  const activePeerData = useMemo(() => {
    if (!activeDisplayCell) return [];
    return getRenderableOhlcvSeries(marketData[getCellCacheKey(activeDisplayCell)] ?? []);
  }, [activeDisplayCell, getCellCacheKey, marketData]);

  useLayoutEffect(() => {
    if (!isMultiChartMode) {
      activePeerChartRef.current = null;
      return;
    }

    const activePeer = secondaryChartsById[effectiveActiveChartId] ?? null;
    activePeerChartRef.current = activePeer;
    activeChartInstanceRef.current = activePeer;

    return () => {
      if (activePeerChartRef.current === activePeer) activePeerChartRef.current = null;
      if (activeChartInstanceRef.current === activePeer) activeChartInstanceRef.current = null;
    };
  }, [activeChartInstanceRef, effectiveActiveChartId, isMultiChartMode, secondaryChartsById]);

  const secondaryCharts = useMemo<MultiChartSyncPeer[]>(() => {
    const result: MultiChartSyncPeer[] = [];
    for (const cell of layout.charts) {
      if (cell.chartId === effectiveActiveChartId) continue;
      const chart = secondaryChartsById[cell.chartId];
      if (!chart) continue;
      result.push({
        chartId: cell.chartId,
        chart,
        data: getRenderableOhlcvSeries(marketData[getCellCacheKey(cell)] ?? []),
        interval: cell.interval,
      });
    }
    return result;
  }, [effectiveActiveChartId, getCellCacheKey, layout.charts, marketData, secondaryChartsById]);

  const persistCellViewport = useCallback((chartId: string, viewport: MultiChartViewportState) => {
    dispatch(updateLayoutChart({ chartId, viewport }));
  }, [dispatch]);

  useMultiChartSync({
    layout,
    activeChartInstanceRef: activePeerChartRef,
    activeChartData: activePeerData,
    secondaryCharts,
  });

  const cancelPanelDrag = useCallback((suppressClick = false) => {
    const interaction = dragInteractionRef.current;
    if (!interaction) return;
    dragInteractionRef.current = null;

    if (interaction.activated && suppressClick) {
      suppressClickUntilRef.current = Date.now() + MULTI_CHART_DRAG_CLICK_SUPPRESSION_MS;
    }
    try {
      if (interaction.slot.hasPointerCapture(interaction.pointerId)) {
        interaction.slot.releasePointerCapture(interaction.pointerId);
      }
    } catch {
      // The slot may have been detached by a concurrent layout change. State is
      // already cleared above, so there is no retained listener to leak.
    }

    interaction.slot.style.removeProperty("--gp-panel-drag-x");
    interaction.slot.style.removeProperty("--gp-panel-drag-y");
    setDragSourceChartId(null);
    setDropTargetChartId(null);
  }, []);

  const resolvePanelDropTarget = useCallback((
    clientX: number,
    clientY: number,
    sourceChartId: string,
  ): string | null => {
    const hitStackTarget = document.elementsFromPoint(clientX, clientY)
      .map((element) => element.closest<HTMLElement>("[data-multi-chart-slot='true']"))
      .find((slot) => {
        const chartId = slot?.dataset.chartId?.trim() ?? "";
        return chartId
          && chartId !== sourceChartId
          && validDragChartIds.has(chartId);
      }) ?? null;
    const hitStackChartId = hitStackTarget?.dataset.chartId?.trim() ?? "";
    if (hitStackChartId) return hitStackChartId;

    const rects: MultiChartDropTargetRect[] = Array.from(
      document.querySelectorAll<HTMLElement>("[data-multi-chart-slot='true']"),
    ).map((slot) => {
      const rect = slot.getBoundingClientRect();
      return {
        chartId: slot.dataset.chartId?.trim() ?? "",
        left: rect.left,
        right: rect.right,
        top: rect.top,
        bottom: rect.bottom,
      };
    });

    return resolveMultiChartDropTargetFromRects(
      clientX,
      clientY,
      sourceChartId,
      validDragChartIds,
      rects,
    );
  }, [validDragChartIds]);

  const updateActivatedDragTarget = useCallback((
    pointerId: number,
    clientX: number,
    clientY: number,
  ): boolean => {
    const interaction = dragInteractionRef.current;
    if (!interaction || !interaction.activated || interaction.pointerId !== pointerId) return false;

    interaction.slot.style.setProperty("--gp-panel-drag-x", `${clientX - interaction.startX}px`);
    interaction.slot.style.setProperty("--gp-panel-drag-y", `${clientY - interaction.startY}px`);

    const targetChartId = resolvePanelDropTarget(clientX, clientY, interaction.sourceChartId);
    interaction.targetChartId = targetChartId;
    setDropTargetChartId((current) => current === targetChartId ? current : targetChartId);
    return true;
  }, [resolvePanelDropTarget]);

  const finishActivatedPanelDrag = useCallback((
    pointerId: number,
    clientX: number,
    clientY: number,
  ): boolean => {
    const interaction = dragInteractionRef.current;
    if (!interaction || !interaction.activated || interaction.pointerId !== pointerId) return false;

    const sourceChartId = interaction.sourceChartId;
    // Re-resolve from the final pointer coordinates. Browsers are not required to
    // deliver a pointermove at the exact pointerup position, and pointer capture
    // can transiently obscure an empty slot from the hit-test stack.
    const targetChartId = resolvePanelDropTarget(clientX, clientY, sourceChartId);
    cancelPanelDrag(true);

    if (targetChartId && targetChartId !== sourceChartId) {
      dispatch(swapLayoutCharts({ sourceChartId, targetChartId }));
    }
    return true;
  }, [cancelPanelDrag, dispatch, resolvePanelDropTarget]);

  useLayoutEffect(() => () => {
    const interaction = dragInteractionRef.current;
    dragInteractionRef.current = null;
    if (!interaction) return;
    interaction.slot.style.removeProperty("--gp-panel-drag-x");
    interaction.slot.style.removeProperty("--gp-panel-drag-y");
    try {
      if (interaction.slot.hasPointerCapture(interaction.pointerId)) {
        interaction.slot.releasePointerCapture(interaction.pointerId);
      }
    } catch {
      // Best-effort teardown only; the component is unmounting.
    }
  }, []);

  useLayoutEffect(() => {
    if (!isMultiChartMode || maximizedChartId) cancelPanelDrag(false);
  }, [cancelPanelDrag, isMultiChartMode, maximizedChartId]);

  const handleSlotPointerDown = useCallback((
    event: React.PointerEvent<HTMLDivElement>,
    cell: MultiChartLayoutState["charts"][number],
  ) => {
    if (maximizedChartId || event.button !== 0 || !event.isPrimary || !isPanelDragSurface(event.target)) {
      return;
    }

    dismissDragDiscovery();
    cancelPanelDrag(false);
    dragInteractionRef.current = {
      pointerId: event.pointerId,
      sourceChartId: cell.chartId,
      slot: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      activated: false,
      targetChartId: null,
    };
  }, [cancelPanelDrag, dismissDragDiscovery, maximizedChartId]);

  useLayoutEffect(() => {
    const handleWindowPointerMove = (event: PointerEvent) => {
      const interaction = dragInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;

      if (!interaction.activated) {
        const distance = Math.hypot(
          event.clientX - interaction.startX,
          event.clientY - interaction.startY,
        );
        if (distance < MULTI_CHART_DRAG_MOVE_TOLERANCE_PX) return;

        try {
          interaction.slot.setPointerCapture(event.pointerId);
        } catch {
          cancelPanelDrag(false);
          return;
        }
        interaction.activated = true;
        setDragSourceChartId(interaction.sourceChartId);
        setDropTargetChartId(null);
      }

      if (!updateActivatedDragTarget(event.pointerId, event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleWindowPointerUp = (event: PointerEvent) => {
      const interaction = dragInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;
      if (!interaction.activated) {
        cancelPanelDrag(false);
        return;
      }
      if (!finishActivatedPanelDrag(event.pointerId, event.clientX, event.clientY)) return;
      event.preventDefault();
      event.stopPropagation();
    };

    const handleWindowPointerCancel = (event: PointerEvent) => {
      const interaction = dragInteractionRef.current;
      if (!interaction || interaction.pointerId !== event.pointerId) return;
      if (interaction.activated) {
        event.preventDefault();
        event.stopPropagation();
      }
      cancelPanelDrag(interaction.activated);
    };

    const handleWindowMouseMove = (event: MouseEvent) => {
      const interaction = dragInteractionRef.current;
      if (!interaction?.activated) return;
      event.preventDefault();
      event.stopPropagation();
    };

    window.addEventListener("pointermove", handleWindowPointerMove, { capture: true, passive: false });
    window.addEventListener("pointerup", handleWindowPointerUp, { capture: true, passive: false });
    window.addEventListener("pointercancel", handleWindowPointerCancel, { capture: true, passive: false });
    window.addEventListener("mousemove", handleWindowMouseMove, { capture: true, passive: false });
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove, true);
      window.removeEventListener("pointerup", handleWindowPointerUp, true);
      window.removeEventListener("pointercancel", handleWindowPointerCancel, true);
      window.removeEventListener("mousemove", handleWindowMouseMove, true);
    };
  }, [cancelPanelDrag, finishActivatedPanelDrag, updateActivatedDragTarget]);

  const handleSlotClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() >= suppressClickUntilRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const requestTickerSelectionForCell = (chartId: string, symbol: string, exchange: string) => {
    if (!symbol.trim()) {
      onRequestMarketSelection(chartId);
      return;
    }
    onRequestTickerSelection(chartId, exchange);
  };

  const handleSecondaryHeaderClick = (chartId: string, symbol: string, exchange: string) => {
    requestTickerSelectionForCell(chartId, symbol, exchange);
  };

  const renderHeaderActions = (cell: MultiChartLayoutState["charts"][number]) => {
    return (
      <MultiChartCellControls
        cell={cell}
        canDuplicate={hasEmptySlot}
        isMaximized={maximizedChartId === cell.chartId}
        onTimeframeChange={(timeframe) => dispatch(updateLayoutChart({ chartId: cell.chartId, timeframe }))}
        onChartTypeChange={(chartType) => dispatch(updateLayoutChart({ chartId: cell.chartId, chartType }))}
        onToggleIndicator={(indicator) => {
          const current = cell.indicators ?? [];
          const indicators = current.includes(indicator)
            ? current.filter((entry) => entry !== indicator)
            : [...current, indicator];
          dispatch(updateLayoutChart({ chartId: cell.chartId, indicators }));
        }}
        onDuplicate={() => dispatch(duplicateLayoutChart({ chartId: cell.chartId }))}
        onClear={() => dispatch(clearLayoutChart(cell.chartId))}
        onToggleMaximize={() => dispatch(toggleMaximizeLayoutChart(cell.chartId))}
      />
    );
  };

  // Single-chart mode keeps the full canonical engine (drawings, advanced studies,
  // replay, etc.). Multi-chart mode deliberately does not mount a second renderer
  // on top of a panel: each cell below is its sole price surface.
  if (!isMultiChartMode) return <>{children}</>;

  return (
    <div className={clsx(
      "gp-multi-chart-grid",
      definition.cssClass,
      maximizedChartId && "is-maximized",
      dragSourceChartId && "is-dragging",
    )}>
      {renderedCharts.map((cell) => {
        const isActive = cell.chartId === effectiveActiveChartId;
        const hasSelectedSymbol = cell.symbol.trim().length > 0;
        const cellCacheKey = getCellCacheKey(cell);
        const cellData = marketData[cellCacheKey] ?? [];
        const referencePriceValue = resolveLatestFiniteClose(cellData);
        const headerActions = renderHeaderActions(cell);

        const requestMarketSelection = (event: React.SyntheticEvent) => {
          event.preventDefault();
          event.stopPropagation();
          onRequestMarketSelection(cell.chartId);
        };
        const handleEmptyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          requestMarketSelection(event);
        };

        return (
          <div
            key={`layout-slot:${cell.chartId}`}
            className={clsx(
              "gp-multi-chart-slot",
              isActive && "is-active",
              dragSourceChartId === cell.chartId && "is-drag-source",
              dropTargetChartId === cell.chartId && "is-drop-target",
            )}
            data-chart-id={cell.chartId}
            data-multi-chart-slot="true"
            data-panel-draggable={!maximizedChartId ? "true" : "false"}
            data-dragging={dragSourceChartId === cell.chartId ? "true" : "false"}
            data-drag-discovery={showDragDiscoveryHint && cell.chartId === discoveryChartId ? "true" : "false"}
            data-drop-label={dragDiscoveryCopy.dropLabel}
            onPointerDownCapture={(event) => handleSlotPointerDown(event, cell)}
            onClickCapture={handleSlotClickCapture}
            onContextMenuCapture={(event) => {
              if (dragSourceChartId === cell.chartId) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              if (!(event.target instanceof Element) || !event.target.closest(".gp-peer-chart")) return;
              event.preventDefault();
              event.stopPropagation();
              onActivateChart(cell.chartId);
              onChartContextMenu?.({
                event,
                cell,
                chart: secondaryChartsById[cell.chartId] ?? null,
                indicatorState: (cell as Partial<CompleteMultiChartLayoutCell>).indicatorState ?? null,
                referencePriceValue,
              });
            }}
          >
            {!maximizedChartId && (
              <button
                type="button"
                className="gp-multi-chart-drag-handle"
                data-panel-drag-handle="true"
                data-drag-tooltip={dragDiscoveryCopy.tooltip}
                data-drag-coachmark={dragDiscoveryCopy.coachmark}
                aria-label={dragDiscoveryCopy.handleLabel}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <i className="bi bi-grip-vertical" aria-hidden="true" />
              </button>
            )}
            {!hasSelectedSymbol ? (
              <div
                className="gp-multi-chart-cell gp-multi-chart-cell--secondary gp-multi-chart-cell--empty"
                onClick={requestMarketSelection}
                onKeyDown={handleEmptyKeyDown}
                role="button"
                tabIndex={0}
                aria-label="Choisir une bourse puis un titre pour ce graphique"
              >
                <div className="gp-multi-chart-cell__active-header gp-multi-chart-cell--interactive-header" data-panel-drag-surface="true">
                  <strong>Choisir un titre</strong>
                  <span>{cell.interval || "1D"}</span>
                  <i className="bi bi-search" style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.7 }} aria-hidden="true" />
                </div>
                <div className="gp-peer-chart__empty-state" aria-live="polite">
                  <strong>Aucun titre sélectionné</strong>
                  <span className="gp-multi-chart-cell__empty-action">
                    Choisir une bourse et un titre
                    <i className="bi bi-search" aria-hidden="true" />
                  </span>
                </div>
              </div>
            ) : (
              <FullPeerChart
                cell={cell}
                data={cellData}
                loadStatus={dataLoadState[cellCacheKey] ?? "idle"}
                dataMode={dataMode}
                chartAppearance={chartAppearance}
                chartAppearancePreview={uiState.chartAppearancePreview}
                uiState={uiState}
                hiddenObjectIds={hiddenObjectIds}
                headerActions={headerActions}
                isActive={isActive}
                interactionOverlay={isActive && secondaryChartsById[cell.chartId] ? children : null}
                metaDensity={!maximizedChartId && renderedCharts.length >= 4 ? "dense" : "comfortable"}
                onActivate={() => onActivateChart(cell.chartId)}
                onHeaderClick={() => handleSecondaryHeaderClick(cell.chartId, cell.symbol, cell.exchange)}
                onChartReady={handleChartReady}
                onChartDispose={handleChartDispose}
                onViewportChange={persistCellViewport}
                onHistoryBoundaryRequest={(direction) => onHistoryBoundaryRequest?.(cell, direction)}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
