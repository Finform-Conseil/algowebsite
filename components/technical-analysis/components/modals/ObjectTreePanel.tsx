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
import type { AdvancedIndicatorsState, ChartAppearance, ChartState, Drawing, IndicatorPeriods, ObjectTreePanelTab, DataWindowCandleValues } from "../../config/TechnicalAnalysisTypes";
import { setAdvancedIndicators, setChartAppearance, setChartConfig, removeComparisonSymbol } from "../../store/technicalAnalysisSlice";
import { getCompareSeriesId, resolveCompareSeriesSettings, type CompareSeriesSettingsMap } from "../../config/compareSeries";
import {
  buildEmaSeriesDefinitions,
  buildSmaSeriesDefinitions,
  mergeMovingAveragePeriods,
  resolveTrendSignalSourceAveragePeriods,
} from "../../config/movingAverageSeries";
import { resolvePriceVsSmaSourceAveragePeriods } from "../../config/priceVsSmaMetrics";
import { resolvePriceVsEmaSourceAveragePeriods } from "../../config/priceVsEmaMetrics";
import { buildAdvancedMovingAverageSeriesDefinitions } from "../../config/advancedMovingAverageSeries";
import type { RootState } from "@/core/infrastructure/store";

// ============================================================================
// CONSTANTS — Design System TV Light (PAT-143)
// ============================================================================
const TV = {
  bg: "var(--gp-bg-toolbar, #0d2136)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  shadow: "0 4px 24px rgba(0,0,0,0.4)",
  radius: "8px",
  tabActiveBg: "rgba(255, 255, 255, 0.04)",
  tabText: "#d1d4dc",
  tabMuted: "#787b86",
  tabActiveColor: "#d1d4dc",
  labelColor: "#b2b5be",
  valueColor: "#d1d4dc",
  bullColor: "#26a69a",
  bearColor: "#ef5350",
  rowHoverBg: "rgba(255, 255, 255, 0.04)",
  divider: "1px solid rgba(255, 255, 255, 0.06)",
  iconBtn: "#787b86",
  iconBtnHover: "#d1d4dc",
  trashHover: "#f23645",
} as const;

const VOLUME_COLOR = "#6256d9";
// ============================================================================
// UTILS
// ============================================================================
const TOOL_LABELS: Record<string, string> = {
  line: "Trendline",
  horizontal_line: "Horizontal Line",
  vertical_line: "Vertical Line",
  arrow: "Arrow",
  trend_angle: "Trend Angle",
  ray: "Ray",
  x_line: "Extended Line",
  horizontal_ray: "Horizontal Ray",
  polyline: "Polyline",
  path: "Path",
  curve: "Curve",
  crosshair: "Crosshair",
  arrow_marker: "Arrow Marker",
  projection: "Projection",
  date_range: "Date Range",
  price_range: "Price Range",
  date_price_range: "Date & Price Range",
  long_position: "Long Position",
  short_position: "Short Position",
  parallel_channel: "Parallel Channel",
  regression_trend: "Regression Trend",
  flat_top_bottom: "Flat Top & Bottom",
  disjoint_channel: "Disjoint Channel",
  pitchfork: "Andrews' Pitchfork",
  schiff_pitchfork: "Schiff Pitchfork",
  modified_schiff_pitchfork: "Modified Schiff Pitchfork",
  inside_pitchfork: "Inside Pitchfork",
  fib_retracement: "Fib Retracement",
  trend_based_fib_extension: "Trend-Based Fib Extension",
  fib_channel: "Fib Channel",
  fib_time_zone: "Fib Time Zone",
  fib_speed_resistance_fan: "Fib Speed/Resistance Fan",
  trend_based_fib_time: "Trend-Based Fib Time",
  fib_circles: "Fib Circles",
  fib_spiral: "Fib Spiral",
  fib_speed_resistance_arcs: "Fib Speed/Resistance Arcs",
  fib_wedge: "Fib Wedge",
  pitchfan: "Pitchfan",
  gann_box: "Gann Box",
  gann_square_fixed: "Gann Square Fixed",
  gann_square: "Gann Square",
  gann_fan: "Gann Fan",
  xabcd_pattern: "XABCD Pattern",
  cypher_pattern: "Cypher Pattern",
  abcd_pattern: "ABCD Pattern",
  triangle_pattern: "Triangle Pattern",
  three_drives_pattern: "Three Drives",
  head_and_shoulders: "Head & Shoulders",
  elliott_impulse_wave: "Elliott Impulse Wave",
  elliott_triangle_wave: "Elliott Triangle Wave",
  elliott_triple_combo_wave: "Elliott Triple Combo Wave",
  elliott_correction_wave: "Elliott Correction Wave",
  elliott_double_combo_wave: "Elliott Double Combo Wave",
  cyclic_lines: "Cyclic Lines",
  time_cycles: "Time Cycles",
  sine_line: "Sine Line",
  position_forecast: "Position Forecast",
  bar_pattern: "Bar Pattern",
  ghost_feed: "Ghost Feed",
  anchored_vwap: "Anchored VWAP",
  sector: "Sector",
  anchored_volume_profile: "Anchored Volume Profile",
};

const getDrawingLabel = (type: string, index: number): string => `${TOOL_LABELS[type] ?? type} ${index + 1}`;

const fmtPrice = (v: number): string => v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtVol = (v: number): string => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(1)}K` : String(v);

type ObjectTreeItem = {
  id: string;
  label: string;
  kind: "series" | "volume" | "overlay" | "indicator" | "tool";
  visible: boolean;
  color: string;
  removable: boolean;
};

const ADVANCED_INDICATOR_LABELS: Record<keyof AdvancedIndicatorsState, { label: string; kind: ObjectTreeItem["kind"]; color: string }> = {
  rsi: { label: "RSI", kind: "indicator", color: "#7E57C2" },
  macd: { label: "MACD", kind: "indicator", color: "#FF9F04" },
  bollinger: { label: "Bollinger Bands", kind: "overlay", color: "#2962FF" },
  stochastic: { label: "Stochastic", kind: "indicator", color: "#2962FF" },
  atr: { label: "ATR", kind: "indicator", color: "#d50000" },
  cci: { label: "CCI 20", kind: "indicator", color: "#00E676" },
  cci14: { label: "CCI 14", kind: "indicator", color: "#f59e0b" },
  cci20: { label: "CCI 20", kind: "indicator", color: "#00E676" },
  mfi14: { label: "MFI 14", kind: "indicator", color: "#10b981" },
  williamsR: { label: "Williams %R 14", kind: "indicator", color: "#FFEB3B" },
  williamsR14: { label: "Williams %R 14", kind: "indicator", color: "#FFEB3B" },
  roc: { label: "ROC 10", kind: "indicator", color: "#2196F3" },
  roc10: { label: "ROC 10", kind: "indicator", color: "#2196F3" },
  roc20: { label: "ROC 20", kind: "indicator", color: "#38BDF8" },
  momentum10: { label: "Momentum 10", kind: "indicator", color: "#FF2E93" },
  momentum20: { label: "Momentum 20", kind: "indicator", color: "#F97316" },
  cmo14: { label: "CMO 14", kind: "indicator", color: "#FB7185" },
  dymi: { label: "DYMI", kind: "indicator", color: "#A855F7" },
  ultimateOsc: { label: "Ultimate Osc", kind: "indicator", color: "#F43F5E" },
  dpo20: { label: "DPO 20", kind: "indicator", color: "#06B6D4" },
  tsi: { label: "TSI", kind: "indicator", color: "#8B5CF6" },
  awesomeOsc: { label: "Awesome Osc", kind: "indicator", color: "#26a69a" },
  acOsc: { label: "AC Osc", kind: "indicator", color: "#26a69a" },
  rvi: { label: "RVI", kind: "indicator", color: "#22d3ee" },
  fisherTransform: { label: "Fisher Transform", kind: "indicator", color: "#e879f9" },
  elderBullBear: { label: "Elder Bull/Bear", kind: "indicator", color: "#f97316" },
  coppock: { label: "Coppock", kind: "indicator", color: "#84cc16" },
  ppo: { label: "PPO", kind: "indicator", color: "#38bdf8" },
  apo: { label: "APO", kind: "indicator", color: "#f97316" },
  parabolicSar: { label: "Parabolic SAR", kind: "overlay", color: "#facc15" },
  adx: { label: "ADX", kind: "indicator", color: "#22c55e" },
  aroon: { label: "Aroon", kind: "indicator", color: "#38bdf8" },
  aroonOsc: { label: "Aroon Osc", kind: "indicator", color: "#a78bfa" },
  supertrend: { label: "Supertrend", kind: "overlay", color: "#22c55e" },
  vortex: { label: "Vortex", kind: "indicator", color: "#38bdf8" },
  trix: { label: "TRIX", kind: "indicator", color: "#f97316" },
  stc: { label: "STC", kind: "indicator", color: "#a855f7" },
  massIndex: { label: "Mass Index", kind: "indicator", color: "#f59e0b" },
  obv: { label: "OBV", kind: "indicator", color: "#FF5722" },
  ichimoku: { label: "Ichimoku", kind: "overlay", color: "#2962FF" },
  stochRsi: { label: "Stochastic RSI", kind: "indicator", color: "#00BCD4" },
  bbWidth: { label: "BB Width", kind: "indicator", color: "#FF6D00" },
  bbPercentB: { label: "BB %B", kind: "indicator", color: "#2962FF" },
};

const buildObjectTreeItems = ({
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
}: {
  chartConfig: ChartState;
  indicatorPeriods: IndicatorPeriods;
  chartAppearance: ChartAppearance;
  advancedIndicators: AdvancedIndicatorsState;
  isMainChartVisible: boolean;
  activeTool: string | null;
  hiddenObjectIds: Record<string, boolean>;
  comparisonSymbols: string[];
  comparisonSettings: CompareSeriesSettingsMap;
  movingAverageTrendSignals: { sma: number[]; ema: number[] };
  priceVsSmaSourcePeriods: number[];
  priceVsEmaSourcePeriods: number[];
}): ObjectTreeItem[] => {
  const activeSmaWithSignalSources = mergeMovingAveragePeriods(
    chartConfig.indicators.activeSma,
    movingAverageTrendSignals.sma,
    priceVsSmaSourcePeriods,
  );
  const activeEmaWithSignalSources = mergeMovingAveragePeriods(
    chartConfig.indicators.activeEma,
    movingAverageTrendSignals.ema,
    priceVsEmaSourcePeriods,
  );
  const signalSourceSmaPeriods = new Set(mergeMovingAveragePeriods(movingAverageTrendSignals.sma, priceVsSmaSourcePeriods));
  const signalSourceEmaPeriods = new Set(mergeMovingAveragePeriods(movingAverageTrendSignals.ema, priceVsEmaSourcePeriods));

  const items: ObjectTreeItem[] = [
    {
      id: "main-series",
      label: chartConfig.symbol || "Main series",
      kind: "series",
      visible: isMainChartVisible && !hiddenObjectIds["main-series"],
      color: "#26a69a",
      removable: false
    },
  ];

  // [TENOR 2026 HDR] Inject Comparison Symbols
  comparisonSymbols.forEach((symbol, idx) => {
    const id = getCompareSeriesId(symbol);
    items.push({
      id,
      label: `${symbol}`,
      kind: "series",
      visible: !hiddenObjectIds[id],
      color: resolveCompareSeriesSettings(symbol, idx, comparisonSettings).color,
      removable: true
    });
  });

  if (activeTool) {
    const id = `active-tool-${activeTool}`;
    items.push({
      id,
      label: `Outil actif: ${TOOL_LABELS[activeTool] ?? activeTool}`,
      kind: "tool",
      visible: !hiddenObjectIds[id],
      color: "#facc15",
      removable: false
    });
  }

  if (chartConfig.indicators.volume || chartAppearance.showVolume) {
    items.push({
      id: "volume",
      label: "Volume",
      kind: "volume",
      visible: chartAppearance.showVolume && !hiddenObjectIds.volume,
      color: VOLUME_COLOR,
      removable: false
    });
  }

  buildSmaSeriesDefinitions(indicatorPeriods, activeSmaWithSignalSources).forEach((series) => {
    items.push({
      id: series.id,
      label: series.label,
      kind: "overlay",
      visible: (chartConfig.indicators.sma || signalSourceSmaPeriods.has(series.period)) && !hiddenObjectIds[series.id],
      color: series.color,
      removable: true
    });
  });

  buildEmaSeriesDefinitions(activeEmaWithSignalSources).forEach((series) => {
    items.push({
      id: series.id,
      label: series.label,
      kind: "overlay",
      visible: (chartConfig.indicators.ema || signalSourceEmaPeriods.has(series.period)) && !hiddenObjectIds[series.id],
      color: series.color,
      removable: true
    });
  });

  buildAdvancedMovingAverageSeriesDefinitions(chartConfig.indicators).forEach((series) => {
    items.push({
      id: series.seriesId,
      label: series.label,
      kind: "overlay",
      visible: !hiddenObjectIds[series.seriesId],
      color: series.color,
      removable: true
    });
  });

  Object.entries(ADVANCED_INDICATOR_LABELS).forEach(([key, meta]) => {
    if (advancedIndicators[key as keyof AdvancedIndicatorsState]) {
      items.push({
        id: key,
        label: meta.label,
        kind: meta.kind,
        visible: !hiddenObjectIds[key],
        color: meta.color,
        removable: true
      });
    }
  });

  if (advancedIndicators.tsi) {
    items.push(
      {
        id: "tsi-line",
        label: "TSI",
        kind: "indicator",
        visible: !hiddenObjectIds.tsi && !hiddenObjectIds["tsi-line"],
        color: "#8B5CF6",
        removable: true,
      },
      {
        id: "tsi-signal",
        label: "TSI Signal",
        kind: "indicator",
        visible: !hiddenObjectIds.tsi && !hiddenObjectIds["tsi-signal"],
        color: "#F59E0B",
        removable: true,
      },
    );
  }

  if (advancedIndicators.rvi) {
    items.push(
      {
        id: "rvi-line",
        label: "RVI",
        kind: "indicator",
        visible: !hiddenObjectIds.rvi && !hiddenObjectIds["rvi-line"],
        color: "#22d3ee",
        removable: true,
      },
      {
        id: "rvi-signal",
        label: "RVI Signal",
        kind: "indicator",
        visible: !hiddenObjectIds.rvi && !hiddenObjectIds["rvi-signal"],
        color: "#facc15",
        removable: true,
      },
    );
  }

  if (advancedIndicators.fisherTransform) {
    items.push(
      {
        id: "fisher-line",
        label: "Fisher",
        kind: "indicator",
        visible: !hiddenObjectIds.fisherTransform && !hiddenObjectIds["fisher-line"],
        color: "#e879f9",
        removable: true,
      },
      {
        id: "fisher-signal",
        label: "Fisher Signal",
        kind: "indicator",
        visible: !hiddenObjectIds.fisherTransform && !hiddenObjectIds["fisher-signal"],
        color: "#f59e0b",
        removable: true,
      },
    );
  }

  if (advancedIndicators.elderBullBear) {
    items.push(
      {
        id: "elder-bull",
        label: "Elder Bull",
        kind: "indicator",
        visible: !hiddenObjectIds.elderBullBear && !hiddenObjectIds["elder-bull"],
        color: "#22c55e",
        removable: true,
      },
      {
        id: "elder-bear",
        label: "Elder Bear",
        kind: "indicator",
        visible: !hiddenObjectIds.elderBullBear && !hiddenObjectIds["elder-bear"],
        color: "#ef4444",
        removable: true,
      },
    );
  }

  if (advancedIndicators.ppo) {
    items.push(
      {
        id: "ppo-line",
        label: "PPO Line",
        kind: "indicator",
        visible: !hiddenObjectIds.ppo && !hiddenObjectIds["ppo-line"],
        color: "#38bdf8",
        removable: true,
      },
      {
        id: "ppo-signal",
        label: "PPO Signal",
        kind: "indicator",
        visible: !hiddenObjectIds.ppo && !hiddenObjectIds["ppo-signal"],
        color: "#f59e0b",
        removable: true,
      },
      {
        id: "ppo-histogram",
        label: "PPO Histogram",
        kind: "indicator",
        visible: !hiddenObjectIds.ppo && !hiddenObjectIds["ppo-histogram"],
        color: "#22c55e",
        removable: true,
      },
    );
  }

  if (advancedIndicators.adx) {
    items.push(
      {
        id: "adx-line",
        label: "ADX",
        kind: "indicator",
        visible: !hiddenObjectIds.adx && !hiddenObjectIds["adx-line"],
        color: "#c084fc",
        removable: true,
      },
      {
        id: "adx-plus-di",
        label: "+DI",
        kind: "indicator",
        visible: !hiddenObjectIds.adx && !hiddenObjectIds["adx-plus-di"],
        color: "#22c55e",
        removable: true,
      },
      {
        id: "adx-minus-di",
        label: "-DI",
        kind: "indicator",
        visible: !hiddenObjectIds.adx && !hiddenObjectIds["adx-minus-di"],
        color: "#ef4444",
        removable: true,
      },
    );
  }

  if (advancedIndicators.aroon) {
    items.push(
      {
        id: "aroon-up",
        label: "Aroon Up",
        kind: "indicator",
        visible: !hiddenObjectIds.aroon && !hiddenObjectIds["aroon-up"],
        color: "#22c55e",
        removable: true,
      },
      {
        id: "aroon-down",
        label: "Aroon Down",
        kind: "indicator",
        visible: !hiddenObjectIds.aroon && !hiddenObjectIds["aroon-down"],
        color: "#ef4444",
        removable: true,
      },
    );
  }

  if (advancedIndicators.supertrend) {
    items.push(
      {
        id: "supertrend-line",
        label: "Supertrend",
        kind: "overlay",
        visible: !hiddenObjectIds.supertrend && !hiddenObjectIds["supertrend-line"],
        color: "#22c55e",
        removable: true,
      },
      {
        id: "supertrend-signal",
        label: "Supertrend Signal",
        kind: "indicator",
        visible: !hiddenObjectIds.supertrend && !hiddenObjectIds["supertrend-signal"],
        color: "#facc15",
        removable: true,
      },
    );
  }

  if (advancedIndicators.vortex) {
    items.push(
      {
        id: "vortex-plus",
        label: "Vortex +",
        kind: "indicator",
        visible: !hiddenObjectIds.vortex && !hiddenObjectIds["vortex-plus"],
        color: "#22c55e",
        removable: true,
      },
      {
        id: "vortex-minus",
        label: "Vortex -",
        kind: "indicator",
        visible: !hiddenObjectIds.vortex && !hiddenObjectIds["vortex-minus"],
        color: "#ef4444",
        removable: true,
      },
    );
  }

  if (advancedIndicators.parabolicSar) {
    items.push(
      {
        id: "parabolic-sar",
        label: "SAR",
        kind: "overlay",
        visible: !hiddenObjectIds.parabolicSar && !hiddenObjectIds["parabolic-sar"],
        color: "#facc15",
        removable: true,
      },
      {
        id: "parabolic-sar-signal",
        label: "SAR Signal",
        kind: "indicator",
        visible: !hiddenObjectIds.parabolicSar && !hiddenObjectIds["parabolic-sar-signal"],
        color: "#22c55e",
        removable: true,
      },
    );
  }

  return items;
};

// ============================================================================
// PROPS
// ============================================================================
interface ObjectTreePanelProps {
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
// SUB-COMPONENT: Drawing Row
// ============================================================================
interface DrawingRowProps {
  drawing: Drawing;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibilityToggle: (id: string, hidden: boolean) => void;
  onLockToggle: (id: string, locked: boolean) => void;
  onDelete: (id: string) => void;
}

const DrawingRow: React.FC<DrawingRowProps> = ({
  drawing,
  index,
  isSelected,
  onSelect,
  onVisibilityToggle,
  onLockToggle,
  onDelete,
}) => {
  const rowBg = isSelected ? "rgba(41, 98, 255, 0.12)" : "transparent";
  const labelColor = isSelected ? TV.tabActiveColor : TV.tabText;

  return (
    <div
      role="row"
      aria-selected={isSelected}
      onClick={() => onSelect(drawing.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        cursor: "pointer",
        background: rowBg,
        borderBottom: TV.divider,
        transition: "background 0.1s",
        userSelect: "none",
        borderLeft: isSelected ? "3px solid #2962ff" : "3px solid transparent",
      }}
      onMouseEnter={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = TV.rowHoverBg;
      }}
      onMouseLeave={(e) => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Color dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "1px",
          background: drawing.style.color ?? "#2962ff",
          flexShrink: 0,
        }}
      />
      {/* Tool label */}
      <span
        style={{
          flex: 1,
          fontSize: 12,
          fontWeight: isSelected ? 600 : 400,
          color: drawing.hidden ? TV.tabMuted : labelColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textDecoration: drawing.hidden ? "line-through" : "none",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {getDrawingLabel(drawing.type, index)}
      </span>

      {/* Control buttons */}
      <button
        id={`obj-tree-vis-${drawing.id}`}
        type="button"
        aria-label={drawing.hidden ? "Afficher le dessin" : "Masquer le dessin"}
        title={drawing.hidden ? "Afficher" : "Masquer"}
        onClick={(e) => {
          e.stopPropagation();
          onVisibilityToggle(drawing.id, !drawing.hidden);
        }}
        style={iconBtnStyle}
      >
        <i className={`bi ${drawing.hidden ? "bi-eye-slash" : "bi-eye"}`} />
      </button>
      <button
        id={`obj-tree-lock-${drawing.id}`}
        type="button"
        aria-label={drawing.locked ? "Déverrouiller" : "Verrouiller"}
        title={drawing.locked ? "Déverrouiller" : "Verrouiller"}
        onClick={(e) => {
          e.stopPropagation();
          onLockToggle(drawing.id, !drawing.locked);
        }}
        style={iconBtnStyle}
      >
        <i className={`bi ${drawing.locked ? "bi-lock-fill" : "bi-unlock"}`} />
      </button>
      <button
        id={`obj-tree-del-${drawing.id}`}
        type="button"
        aria-label="Supprimer le dessin"
        title="Supprimer"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(drawing.id);
        }}
        style={iconBtnStyle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = TV.trashHover;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = TV.iconBtn;
        }}
      >
        <i className="bi bi-trash" />
      </button>
    </div>
  );
};

const ObjectTreeItemRow: React.FC<{
  item: ObjectTreeItem;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVisibilityToggle?: (item: ObjectTreeItem) => void;
  onMainVisibilityToggle: () => void;
  onRemove?: (item: ObjectTreeItem) => void;
}> = ({ item, isSelected, onSelect, onVisibilityToggle, onMainVisibilityToggle, onRemove }) => (
  <div
    role="row"
    aria-selected={isSelected}
    onClick={() => onSelect(item.id)}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      padding: "7px 14px",
      borderBottom: TV.divider,
      background: isSelected ? "rgba(41, 98, 255, 0.12)" : "transparent",
      borderLeft: isSelected ? "3px solid #2962ff" : "3px solid transparent",
      cursor: "pointer",
      userSelect: "none",
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
    <span style={{ flex: 1, color: item.visible ? TV.tabText : TV.tabMuted, fontSize: 12, fontWeight: item.kind === "series" ? 700 : 500 }}>
      {item.label}
    </span>
    <span style={{ color: TV.tabMuted, fontSize: 10, textTransform: "uppercase" }}>{item.kind}</span>

    <button
      type="button"
      aria-label={item.visible ? "Masquer" : "Afficher"}
      title={item.visible ? "Masquer" : "Afficher"}
      onClick={(e) => {
        e.stopPropagation();
        if (item.id === "main-series") {
          onMainVisibilityToggle();
          return;
        }
        onVisibilityToggle?.(item);
      }}
      style={{ ...iconBtnStyle, opacity: 1, cursor: "pointer" }}
    >
      <i className={`bi ${item.visible ? "bi-eye" : "bi-eye-slash"}`} />
    </button>

    <button
      type="button"
      aria-label="Supprimer"
      title={item.removable ? "Supprimer du graphique" : "Non supprimable depuis cette ligne"}
      onClick={(e) => {
        e.stopPropagation();
        if (item.removable) onRemove?.(item);
      }}
      style={{ ...iconBtnStyle, opacity: item.removable ? 1 : 0.35, cursor: item.removable ? "pointer" : "default" }}
    >
      <i className="bi bi-trash" />
    </button>
  </div>
);

const iconBtnStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "2px 4px",
  cursor: "pointer",
  color: TV.iconBtn,
  fontSize: 12,
  display: "inline-flex",
  alignItems: "center",
  flexShrink: 0,
  transition: "color 0.1s",
};

const toolbarIconBtnStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: "4px 8px",
  cursor: "pointer",
  color: TV.iconBtn,
  fontSize: 15,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.15s",
  borderRadius: "4px"
};

const IconButton: React.FC<{ icon: string, title: string, style?: React.CSSProperties, onClick?: () => void, active?: boolean }> = ({ icon, title, style, onClick, active }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...toolbarIconBtnStyle,
        background: (isHovered || active) ? "rgba(255, 255, 255, 0.08)" : "transparent",
        color: (isHovered || active) ? TV.tabText : TV.iconBtn,
        ...style
      }}
    >
      <i className={icon}></i>
    </button>
  );
};

// ============================================================================
// SUB-COMPONENT: Data Window
// ============================================================================
const DataWindowTab: React.FC<{ data: DataWindowCandleValues | null }> = ({ data }) => {
  if (!data) {
    return (
      <div style={{ padding: "20px 14px", color: TV.labelColor, fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" }}>
        Survolez le graphique pour afficher les données.
      </div>
    );
  }

  const valueColor = data.isUp ? TV.bullColor : TV.bearColor;

  // [TENOR 2026 FIX] SCAR-PERF-05: DOM Anchors Injected
  // The map() loop is unrolled to inject static IDs (dw-open, dw-close, etc.)
  // This allows useObjectTreePanel to mutate the DOM directly at 60FPS.
  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Date header */}
      <div style={{ padding: "8px 14px 6px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: TV.labelColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Date
        </span>
        <span id="dw-date" style={{ fontSize: 12, fontWeight: 700, color: TV.tabText, float: "right" }}>
          {data.date}
        </span>
      </div>

      {/* Symbol header */}
      <div style={{ padding: "6px 14px 4px", display: "flex", alignItems: "center", gap: 6, borderBottom: TV.divider }}>
        <span style={{ fontSize: 11, color: TV.tabMuted }}>
          <i className="bi bi-layers" />
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: TV.tabText }}>OHLCV</span>
      </div>

      {/* OHLCV rows with Static IDs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 12, color: TV.labelColor }}>Open</span>
        <span id="dw-open" style={{ fontSize: 12, fontWeight: 600, color: valueColor }}>{fmtPrice(data.open)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 12, color: TV.labelColor }}>High</span>
        <span id="dw-high" style={{ fontSize: 12, fontWeight: 600, color: valueColor }}>{fmtPrice(data.high)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 12, color: TV.labelColor }}>Low</span>
        <span id="dw-low" style={{ fontSize: 12, fontWeight: 600, color: valueColor }}>{fmtPrice(data.low)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 12, color: TV.labelColor }}>Close</span>
        <span id="dw-close" style={{ fontSize: 12, fontWeight: 600, color: valueColor }}>{fmtPrice(data.close)}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 12, color: TV.labelColor }}>Change</span>
        <span id="dw-change" style={{ fontSize: 12, fontWeight: 600, color: valueColor }}>{`${data.change >= 0 ? "+" : ""}${fmtPrice(data.change)}`}</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}>
        <span style={{ fontSize: 12, color: TV.labelColor }}>Volume</span>
        <span id="dw-volume" style={{ fontSize: 12, fontWeight: 600, color: TV.valueColor }}>{fmtVol(data.volume)}</span>
      </div>

      {/* [TENOR 2026 HDR] 5 Static DOM Slots for Comparison Series (Zero-Lag) */}
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={`comp-slot-${i}`}
          id={`dw-comp-row-${i}`}
          style={{ display: "none", justifyContent: "space-between", alignItems: "center", padding: "5px 14px", borderBottom: TV.divider }}
        >
          <span id={`dw-comp-symbol-${i}`} style={{ fontSize: 12, color: TV.labelColor, fontWeight: 600 }}></span>
          <span id={`dw-comp-val-${i}`} style={{ fontSize: 12, fontWeight: 600 }}></span>
        </div>
      ))}
    </div>
  );
};

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

  const [activeMenu, setActiveMenu] = useState<"zorder" | "layouts" | null>(null);
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
    if (item.id === "volume") {
      dispatch(setChartAppearance({ showVolume: !chartAppearance.showVolume }));
      return;
    }
    setHiddenObjectIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
  }, [chartAppearance.showVolume, dispatch, setHiddenObjectIds]);

  const handleObjectItemRemove = useCallback((item: ObjectTreeItem) => {
    if (item.id === "volume") {
      showError("Le volume se masque avec l'icone oeil; il ne se supprime pas depuis l'arbre.");
      return;
    }
    
    // [TENOR 2026] Handle Comparison Symbol Removal
    if (item.id.startsWith("compare-")) {
      const symbol = item.id.replace("compare-", "");
      dispatch(removeComparisonSymbol(symbol));
      return;
    }

    if (item.id.startsWith("sma-")) {
      const period = Number(item.id.slice(4));
      const next = chartConfig.indicators.activeSma.filter((p) => p !== period);
      patchChartIndicators({ activeSma: next, sma: next.length > 0 ? chartConfig.indicators.sma : false });
      return;
    }
    if (item.id.startsWith("ema-")) {
      const period = Number(item.id.slice(4));
      const next = chartConfig.indicators.activeEma.filter((p) => p !== period);
      patchChartIndicators({ activeEma: next, ema: next.length > 0 ? chartConfig.indicators.ema : false });
      return;
    }
    if (item.id.startsWith("wma-")) {
      const period = Number(item.id.slice(4));
      patchChartIndicators({ activeWma: chartConfig.indicators.activeWma.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("dema-")) {
      const period = Number(item.id.slice(5));
      patchChartIndicators({ activeDema: chartConfig.indicators.activeDema.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("tema-")) {
      const period = Number(item.id.slice(5));
      patchChartIndicators({ activeTema: chartConfig.indicators.activeTema.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("hma-")) {
      const period = Number(item.id.slice(4));
      patchChartIndicators({ activeHma: chartConfig.indicators.activeHma.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("zlema-")) {
      const period = Number(item.id.slice(6));
      patchChartIndicators({ activeZlema: chartConfig.indicators.activeZlema.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("alma-")) {
      const period = Number(item.id.slice(5));
      patchChartIndicators({ activeAlma: chartConfig.indicators.activeAlma.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("smma-")) {
      const period = Number(item.id.slice(5));
      patchChartIndicators({ activeSmma: chartConfig.indicators.activeSmma.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("kama-")) {
      const period = Number(item.id.slice(5));
      patchChartIndicators({ activeKama: chartConfig.indicators.activeKama.filter((p) => p !== period) });
      return;
    }
    if (item.id.startsWith("vwma-")) {
      const period = Number(item.id.slice(5));
      patchChartIndicators({ activeVwma: chartConfig.indicators.activeVwma.filter((p) => p !== period) });
      return;
    }
    if (item.id in advancedIndicators) {
      dispatch(setAdvancedIndicators({ [item.id]: false } as Partial<AdvancedIndicatorsState>));
      return;
    }
    showError("Cet objet ne peut pas etre supprime depuis cette ligne.");
  }, [
    advancedIndicators,
    chartConfig.indicators.activeAlma,
    chartConfig.indicators.activeDema,
    chartConfig.indicators.activeEma,
    chartConfig.indicators.activeHma,
    chartConfig.indicators.activeKama,
    chartConfig.indicators.activeSmma,
    chartConfig.indicators.activeSma,
    chartConfig.indicators.activeTema,
    chartConfig.indicators.activeVwma,
    chartConfig.indicators.activeWma,
    chartConfig.indicators.activeZlema,
    chartConfig.indicators.ema,
    chartConfig.indicators.sma,
    dispatch,
    patchChartIndicators,
    showError
  ]);

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
    setActiveMenu(activeMenu === "zorder" ? null : "zorder");
  }, [activeMenu, selectedDrawingId, selectedObjectId, showError]);

  const handleZOrderClick = useCallback((dir: "front" | "back" | "forward" | "backward") => {
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

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const globalHideAll = () => {
    if (drawings.length === 0) {
      showError("Aucun dessin a masquer.");
      setActiveMenu(null);
      return;
    }
    drawings.forEach(d => updateDrawing(d.id, { hidden: true }));
    setActiveMenu(null);
  };

  const globalShowAll = () => {
    if (drawings.length === 0) {
      showError("Aucun dessin a afficher.");
      setActiveMenu(null);
      return;
    }
    drawings.forEach(d => updateDrawing(d.id, { hidden: false }));
    setActiveMenu(null);
  };

  const globalLockAll = () => {
    if (drawings.length === 0) {
      showError("Aucun dessin a verrouiller.");
      setActiveMenu(null);
      return;
    }
    drawings.forEach(d => updateDrawing(d.id, { locked: true }));
    setActiveMenu(null);
  };

  const globalUnlockAll = () => {
    if (drawings.length === 0) {
      showError("Aucun dessin a deverrouiller.");
      setActiveMenu(null);
      return;
    }
    drawings.forEach(d => updateDrawing(d.id, { locked: false }));
    setActiveMenu(null);
  };

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

  if (!isOpen) return null;

  // Grouping logic
  const drawingsByGroup: Record<string, Drawing[]> = {};
  const ungroupedDrawings: Drawing[] = [];

  drawings.forEach(d => {
    if (d.groupId) {
      if (!drawingsByGroup[d.groupId]) drawingsByGroup[d.groupId] = [];
      drawingsByGroup[d.groupId].push(d);
    } else {
      ungroupedDrawings.push(d);
    }
  });

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
      <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
        {activeTab === "object_tree" ? (
          <>
            {/* TV Object Tree Toolbar */}
            <div style={{ display: "flex", padding: "4px 14px 10px 14px", borderBottom: TV.divider, gap: "10px", alignItems: "center", flexShrink: 0, position: "relative" }}>
              <IconButton icon="bi bi-folder-plus" title="Create a group of drawings" onClick={handleGroupCreateClick} />
              <IconButton icon="bi bi-copy" title="Clone selected" onClick={handleCloneClick} />
              <IconButton icon="bi bi-arrow-down-up" title="Visual order" onClick={handleZOrderMenuClick} active={activeMenu === "zorder"} />
              <div style={{ flex: 1 }}></div>
              <IconButton icon="bi bi-diagram-3" title="Manage drawings and selected object" onClick={() => setActiveMenu(activeMenu === "layouts" ? null : "layouts")} active={activeMenu === "layouts"} />

              {/* Popups Layout (Z-Order) */}
              {activeMenu === "zorder" && (
                <div style={{ position: "absolute", top: "40px", left: "60px", background: "#1e222d", border: TV.border, borderRadius: 4, zIndex: 2000, padding: 4, boxShadow: "0 8px 16px rgba(0,0,0,0.4)", minWidth: 170 }}>
                  <button onClick={() => handleZOrderClick("forward")} style={menuItemStyle}><i className="bi bi-layer-forward" /> Bring Forward</button>
                  <button onClick={() => handleZOrderClick("backward")} style={menuItemStyle}><i className="bi bi-layer-backward" /> Send Backward</button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={() => handleZOrderClick("front")} style={menuItemStyle}><i className="bi bi-front" /> Bring to Front</button>
                  <button onClick={() => handleZOrderClick("back")} style={menuItemStyle}><i className="bi bi-back" /> Send to Back</button>
                </div>
              )}

              {/* Popups Layout (Global Actions) */}
              {activeMenu === "layouts" && (
                <div style={{ position: "absolute", top: "40px", right: "14px", background: "#1e222d", border: TV.border, borderRadius: 4, zIndex: 2000, padding: 4, boxShadow: "0 8px 16px rgba(0,0,0,0.4)", minWidth: 160 }}>
                  {selectedObject && (
                    <>
                      <button
                        onClick={() => {
                          handleObjectItemVisibilityToggle(selectedObject);
                          setActiveMenu(null);
                        }}
                        style={menuItemStyle}
                      >
                        <i className={`bi ${selectedObject.visible ? "bi-eye-slash" : "bi-eye"}`} />
                        {selectedObject.visible ? "Hide selected object" : "Show selected object"}
                      </button>
                      <button
                        onClick={() => {
                          handleObjectItemRemove(selectedObject);
                          setActiveMenu(null);
                        }}
                        style={{ ...menuItemStyle, color: selectedObject.removable ? "#f23645" : TV.tabMuted }}
                      >
                        <i className="bi bi-trash" /> Remove selected object
                      </button>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                    </>
                  )}
                  <button onClick={globalHideAll} style={menuItemStyle}><i className="bi bi-eye-slash" /> Hide all drawings</button>
                  <button onClick={globalShowAll} style={menuItemStyle}><i className="bi bi-eye" /> Show all drawings</button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={globalLockAll} style={menuItemStyle}><i className="bi bi-lock-fill" /> Lock all drawings</button>
                  <button onClick={globalUnlockAll} style={menuItemStyle}><i className="bi bi-unlock" /> Unlock all drawings</button>
                  <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
                  <button onClick={handleDeleteAllClick} style={{ ...menuItemStyle, color: "#f23645" }}><i className="bi bi-trash" /> Delete all drawings</button>
                </div>
              )}
            </div>

            {/* [TENOR 2026] INLINE UI STATES (Replaces native dialogs) */}
            {errorMsg && (
              <div style={{ padding: "6px 14px", background: "rgba(242, 54, 69, 0.1)", color: "#f23645", fontSize: "11px", borderBottom: TV.divider, display: "flex", alignItems: "center" }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i>{errorMsg}
              </div>
            )}

            {isCreatingGroup && (
              <div style={{ padding: "8px 14px", background: "rgba(41, 98, 255, 0.1)", borderBottom: TV.divider, display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  autoFocus
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') confirmGroupCreate();
                    if (e.key === 'Escape') setIsCreatingGroup(false);
                  }}
                  placeholder="Nom du groupe..."
                  style={{ flex: 1, background: "#1e222d", border: "1px solid #363a45", color: "#fff", fontSize: "12px", padding: "4px 8px", borderRadius: "4px", outline: "none" }}
                />
                <button onClick={confirmGroupCreate} style={{ background: "#2962ff", color: "#fff", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "12px", cursor: "pointer" }}>OK</button>
                <button onClick={() => setIsCreatingGroup(false)} style={{ background: "transparent", color: TV.tabMuted, border: "none", cursor: "pointer", padding: "0 4px" }}><i className="bi bi-x-lg"></i></button>
              </div>
            )}

            {isConfirmingDelete && (
              <div style={{ padding: "10px 14px", background: "rgba(242, 54, 69, 0.1)", borderBottom: TV.divider, display: "flex", flexDirection: "column", gap: "10px" }}>
                <span style={{ color: "#f23645", fontSize: "12px", fontWeight: 600 }}>Supprimer TOUS les dessins ?</span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={confirmDeleteAll} style={{ background: "#f23645", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 8px", fontSize: "11px", cursor: "pointer", flex: 1, fontWeight: 600 }}>Confirmer</button>
                  <button onClick={() => setIsConfirmingDelete(false)} style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 8px", fontSize: "11px", cursor: "pointer", flex: 1 }}>Annuler</button>
                </div>
              </div>
            )}

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

            {/* Drawings List with Groups */}
            <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
              {drawings.length === 0 ? (
                <div style={{ padding: "20px 14px", color: TV.labelColor, fontSize: 13, textAlign: "center", marginTop: "20px" }}>
                  <i className="bi bi-pencil-square" style={{ fontSize: 24, display: "block", marginBottom: 8 }} />
                  Aucun dessin sur le graphique.
                </div>
              ) : (
                <div role="rowgroup" aria-label="Liste des dessins">
                  {/* Groups Sections */}
                  {Object.entries(drawingsByGroup).map(([groupId, groupDrawings]) => (
                    <div key={groupId} style={{ borderBottom: TV.divider }}>
                      <div
                        onClick={() => toggleGroupCollapse(groupId)}
                        style={{ display: "flex", alignItems: "center", padding: "6px 14px", background: "rgba(255,255,255,0.03)", cursor: "pointer" }}
                      >
                        <i className={`bi bi-chevron-${collapsedGroups[groupId] ? "right" : "down"}`} style={{ fontSize: 10, color: TV.tabMuted, marginRight: 8 }} />
                        <i className="bi bi-folder-fill" style={{ fontSize: 14, color: "#ff9f04", marginRight: 10 }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: TV.tabText, flex: 1 }}>{groupId}</span>
                        <span style={{ fontSize: 10, color: TV.tabMuted }}>({groupDrawings.length})</span>
                      </div>
                      {!collapsedGroups[groupId] && [...groupDrawings].reverse().map((drawing, idx) => (
                        <div key={drawing.id} style={{ paddingLeft: 20 }}>
                          <DrawingRow
                            drawing={drawing}
                            index={idx}
                            isSelected={drawing.id === selectedDrawingId}
                            onSelect={handleDrawingSelect}
                            onVisibilityToggle={handleVisibilityToggle}
                            onLockToggle={handleLockToggle}
                            onDelete={deleteDrawing}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Ungrouped Section */}
                  {[...ungroupedDrawings].reverse().map((drawing, revIdx) => {
                    const originalIndex = ungroupedDrawings.length - 1 - revIdx;
                    return (
                      <DrawingRow
                        key={drawing.id}
                        drawing={drawing}
                        index={originalIndex}
                        isSelected={drawing.id === selectedDrawingId}
                        onSelect={handleDrawingSelect}
                        onVisibilityToggle={handleVisibilityToggle}
                        onLockToggle={handleLockToggle}
                        onDelete={deleteDrawing}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <DataWindowTab data={dataWindow} />
        )}
      </div>
    </div>
  );
};

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  width: "100%",
  padding: "8px 12px",
  background: "transparent",
  border: "none",
  color: "#d1d4dc",
  fontSize: "12px",
  textAlign: "left",
  cursor: "pointer",
  transition: "background 0.1s",
  borderRadius: 4
};

export default ObjectTreePanel;

// --- EOF ---
