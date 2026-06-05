"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  useDispatch,
  useSelector } from "react-redux";
import type { MultiChartLayoutId,
  MultiChartSyncKey } from "../../config/layout/multiChartLayoutTypes";
import {
  hasCollapsedLayoutSymbols,
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

const SYNC_OPTIONS: Array<{ key: MultiChartSyncKey; label: string; title: string }> = [
  { key: "symbol", label: "Symbol", title: "Synchronise le symbole entre tous les graphiques" },
  { key: "interval", label: "Interval", title: "Synchronise le timeframe entre tous les graphiques" },
  { key: "crosshair", label: "Curseur", title: "Synchronise le curseur en croix entre tous les graphiques" },
  { key: "time", label: "Time", title: "Synchronise le zoom et le scroll temporel" },
  { key: "dateRange", label: "Date range", title: "Synchronise les plages 1M, YTD, 1Y, Tout" },
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
  const [isOpen, setIsOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const didHydrateRef = useRef(false);

  const activeLayout = useMemo(
    () => MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutState.layoutId) ?? MULTI_CHART_LAYOUTS[0],
    [layoutState.layoutId]
  );

  useEffect(() => {
    if (didHydrateRef.current || typeof window === "undefined") return;
    didHydrateRef.current = true;
    const raw = window.localStorage.getItem(MULTI_CHART_STORAGE_KEY);
    if (!raw) return;

    try {
      dispatch(hydrateMultiChartLayout(JSON.parse(raw)));
    } catch (error) {
      console.warn("[LayoutSetup] Invalid persisted layout ignored", error);
      window.localStorage.removeItem(MULTI_CHART_STORAGE_KEY);
    }
  }, [dispatch]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(MULTI_CHART_STORAGE_KEY, JSON.stringify(layoutState));
  }, [layoutState]);

  useEffect(() => {
    if (!hasCollapsedLayoutSymbols(layoutState)) return;
    dispatch(setMultiChartLayout(layoutState.layoutId));
  }, [dispatch, layoutState]);

  useEffect(() => {
    if (activeLayout.chartCount < 8) return;
    const primarySymbol = chartConfig.symbol.trim().toUpperCase();
    const firstLayoutSymbol = layoutState.charts[0]?.symbol.trim().toUpperCase();
    if (!primarySymbol || firstLayoutSymbol === primarySymbol) return;
    dispatch(setMultiChartLayout(layoutState.layoutId));
  }, [activeLayout.chartCount, chartConfig.symbol, dispatch, layoutState.charts, layoutState.layoutId]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if ((target as HTMLElement).closest(".gp-layout-popover")) return;
      setIsOpen(false);
    };
    window.addEventListener("pointerdown", handleClickOutside);
    return () => window.removeEventListener("pointerdown", handleClickOutside);
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
            <span>Disposition multi-graphiques</span>
            <strong>{activeLayout.shortName}</strong>
          </div>

          <div className="gp-layout-popover__layouts">
            {MULTI_CHART_LAYOUTS.map((layout) => (
              <button
                key={layout.id}
                className={clsx("gp-layout-option", layoutState.layoutId === layout.id && "is-selected")}
                title={layout.description}
                onClick={() => dispatch(setMultiChartLayout(layout.id))}
              >
                <span className="gp-layout-option__count">{layout.shortName}</span>
                <LayoutGlyph layoutId={layout.id} />
                <span className="gp-layout-option__label">{layout.name}</span>
              </button>
            ))}

          </div>

          <div className="gp-layout-popover__section-title">Presets BRVM</div>
          <div className="gp-layout-presets">
            {MULTI_CHART_PRESETS.map((preset) => (
              <button key={preset.id} onClick={() => dispatch(applyMultiChartPreset(preset.id))}>
                {preset.name}
              </button>
            ))}
          </div>

          {activeLayout.chartCount > 1 && (
            <>
              <div className="gp-layout-popover__section-title">Sync in layout</div>
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
