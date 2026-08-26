"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  useDispatch,
  useSelector } from "react-redux";
import type { MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartSyncKey } from "../../config/layout/multiChartLayoutTypes";
import {
  hasCollapsedLayoutSymbols,
  isMultiChartPresetAvailable,
  MULTI_CHART_LAYOUTS,
  MULTI_CHART_PRESETS,
  MULTI_CHART_STORAGE_KEY,
  } from "../../config/layout/multiChartLayouts";
import {
  applyMultiChartPreset,
  hydrateMultiChartLayout,
  setMultiChartLayout,
  setMultiChartSync,
} from "../../store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectUiState,
} from "../../store/selectors";
import { idbGet, idbSet } from "../../hooks/drawing/drawingPersistence";
import { useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";

const SYNC_OPTIONS: Array<{ key: MultiChartSyncKey; label: string; title: string }> = [
  { key: "symbol", label: "Symbole", title: "Synchronise le symbole et sa bourse entre tous les graphiques" },
  { key: "interval", label: "Intervalle", title: "Synchronise l’intervalle entre tous les graphiques" },
  { key: "crosshair", label: "Curseur", title: "Synchronise le curseur en croix entre tous les graphiques" },
  { key: "time", label: "Temps", title: "Synchronise le zoom et le déplacement temporel" },
  { key: "dateRange", label: "Plage de dates", title: "Synchronise les plages 1M, YTD, 1Y et Tout" },
];

const LayoutGlyph: React.FC<{ layoutId?: MultiChartLayoutId; disabled?: boolean }> = ({ layoutId = "single", disabled = false }) => {
  const count = MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutId)?.chartCount ?? 1;

  return (
    <span className={clsx("gp-layout-glyph", `gp-layout-glyph--${layoutId}`, disabled && "is-disabled")}>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} />
      ))}
    </span>
  );
};

export const LayoutSetupControl: React.FC = () => {
  const dispatch = useDispatch();
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  const layoutState = uiState.multiChartLayout;
  const { selectedTicker, preferredTicker } = useTickerSelector();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const didHydrateRef = useRef(false);

  const activeLayout = useMemo(
    () => MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutState.layoutId) ?? MULTI_CHART_LAYOUTS[0],
    [layoutState.layoutId]
  );
  const currentLayoutBinding = useMemo(() => ({
    primarySymbol: String(selectedTicker?.ticker || chartConfig.symbol || preferredTicker || "").trim().toUpperCase(),
    market: String(selectedTicker?.exchange || uiState.activeMarket.ticker || "BRVM").trim().toUpperCase(),
  }), [chartConfig.symbol, preferredTicker, selectedTicker?.exchange, selectedTicker?.ticker, uiState.activeMarket.ticker]);

  const applyLayout = useCallback((layoutId: MultiChartLayoutId) => {
    dispatch(setMultiChartLayout({ layoutId, ...currentLayoutBinding }));
    setIsOpen(false);
  }, [currentLayoutBinding, dispatch]);

  const applyPreset = useCallback((presetId: string) => {
    const preset = MULTI_CHART_PRESETS.find((entry) => entry.id === presetId);
    if (!preset || !isMultiChartPresetAvailable(preset)) return;
    dispatch(applyMultiChartPreset({ presetId, ...currentLayoutBinding }));
    setIsOpen(false);
  }, [currentLayoutBinding, dispatch]);

  useEffect(() => {
    if (didHydrateRef.current || typeof window === "undefined") return;
    didHydrateRef.current = true;
    let isActive = true;

    const hydratePersistedLayout = async () => {
      const storedLayout = await idbGet<MultiChartLayoutState>(MULTI_CHART_STORAGE_KEY);
      if (!isActive || !storedLayout) return;

      try {
        dispatch(hydrateMultiChartLayout(storedLayout));
      } catch (error) {
        console.warn("[LayoutSetup] Invalid persisted layout ignored", error);
      }
    };

    void hydratePersistedLayout();
    return () => {
      isActive = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    void idbSet(MULTI_CHART_STORAGE_KEY, layoutState);
  }, [layoutState]);

  useEffect(() => {
    if (!hasCollapsedLayoutSymbols(layoutState)) return;
    applyLayout(layoutState.layoutId);
  }, [applyLayout, layoutState]);

  useEffect(() => {
    if (activeLayout.chartCount <= 1) return;
    const firstLayoutSymbol = layoutState.charts[0]?.symbol.trim().toUpperCase();
    if (firstLayoutSymbol || !currentLayoutBinding.primarySymbol) return;
    applyLayout(layoutState.layoutId);
  }, [
    activeLayout.chartCount,
    applyLayout,
    currentLayoutBinding.primarySymbol,
    layoutState.charts,
    layoutState.layoutId,
  ]);

  useEffect(() => {
    if (activeLayout.chartCount < 8) return;
    const primarySymbol = chartConfig.symbol.trim().toUpperCase();
    const firstLayoutSymbol = layoutState.charts[0]?.symbol.trim().toUpperCase();
    if (!primarySymbol || firstLayoutSymbol === primarySymbol) return;
    applyLayout(layoutState.layoutId);
  }, [activeLayout.chartCount, applyLayout, chartConfig.symbol, layoutState.charts, layoutState.layoutId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest(".gp-layout-popover")) return;
      setIsOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPopoverPos({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
    };
    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const togglePopover = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPopoverPos({ top: rect.bottom + 8, right: Math.max(12, window.innerWidth - rect.right) });
    }
    setIsOpen((current) => !current);
  };

  return (
    <div className="gp-layout-control">
      <button
        ref={buttonRef}
        className={clsx("gp-toolbar-btn", "hover-lift", "text-secondary", layoutState.isEnabled && "active")}
        title="Layout setup"
        onClick={togglePopover}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <LayoutGlyph layoutId={activeLayout.id} />
      </button>

      {isOpen && (
        <div
          className="gp-layout-popover"
          role="dialog"
          aria-label="Layout setup"
          style={{ top: popoverPos.top, right: popoverPos.right }}
        >
          <div className="gp-layout-popover__header">
            <div>
              <span>Disposition multi-graphiques</span>
              <small>Chaque panneau conserve son titre, sa bourse et son état.</small>
            </div>
            <strong>{activeLayout.shortName}</strong>
          </div>

          <div className="gp-layout-popover__layouts">
            {MULTI_CHART_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                className={clsx("gp-layout-option", layoutState.layoutId === layout.id && "is-selected")}
                title={layout.description}
                aria-pressed={layoutState.layoutId === layout.id}
                onClick={() => applyLayout(layout.id)}
              >
                <span className="gp-layout-option__count">{layout.shortName}</span>
                <LayoutGlyph layoutId={layout.id} />
                <span className="gp-layout-option__label">{layout.name}</span>
              </button>
            ))}

          </div>

          <div className="gp-layout-popover__section-title">Presets multi-marchés</div>
          <div className="gp-layout-presets">
            {MULTI_CHART_PRESETS.map((preset) => {
              const isAvailable = isMultiChartPresetAvailable(preset);
              return (
                <button
                  key={preset.id}
                  disabled={!isAvailable}
                  title={isAvailable ? preset.name : "Indisponible tant que l’API OHLCV ne fournit que des bougies 1D"}
                  onClick={() => applyPreset(preset.id)}
                >
                  <span>{preset.name}</span>
                  {!isAvailable && <small>API 1D uniquement</small>}
                </button>
              );
            })}
          </div>

          {activeLayout.chartCount > 1 && (
            <>
              <div className="gp-layout-popover__section-title">Synchronisation du layout</div>
              <div className="gp-layout-sync-list">
                {SYNC_OPTIONS.map((option) => (
                  <label
                    key={option.key}
                    className={clsx("gp-layout-sync-row", option.key === "symbol" && activeLayout.chartCount >= 8 && "is-disabled")}
                    title={option.key === "symbol" && activeLayout.chartCount >= 8 ? "Indisponible en mur de marché: ce mode doit conserver des symboles distincts" : option.title}
                  >
                    <span className="gp-layout-sync-label">
                      {option.label}
                      <i className="bi bi-info-circle" aria-hidden="true" />
                    </span>
                    <input
                      className="gp-layout-sync-toggle"
                      type="checkbox"
                      disabled={option.key === "symbol" && activeLayout.chartCount >= 8}
                      checked={option.key === "symbol" && activeLayout.chartCount >= 8 ? false : layoutState.sync[option.key]}
                      onChange={(event) => dispatch(setMultiChartSync({ key: option.key, value: event.target.checked }))}
                    />
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
