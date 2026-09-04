import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartSyncKey,
} from "../../config/layout/multiChartLayoutTypes";
import type { ChartAppearance } from "../../config/state/chartStateTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import {
  getLayoutDefinition,
  hasBoundLayoutSymbol,
  isDenseMultiChartLayout,
  isMultiChartPresetAvailable,
  MULTI_CHART_PRESETS,
} from "../../config/layout/multiChartLayouts";
import {
  createDefaultMarketMultiChartLayout as createDefaultMultiChartLayout,
  createPresetLayout,
  reconcileMarketMultiChartLayout as reconcileMultiChartLayout,
} from "../../config/layout/brvmLayoutSymbols";
import {
  cloneMultiChartAppearance,
  completeMultiChartCell,
  completeMultiChartLayout,
  type CompleteMultiChartLayoutCell,
  type CompleteMultiChartLayoutState,
  type MultiChartViewportState,
} from "../../config/layout/multiChartCellState";
import { normalizeChartTimeframe } from "../../config/market/timeframeCatalog";
import { normalizeChartType, type AnyChartType } from "../../lib/chart-types";
import {
  createMultiChartIndicatorSnapshot,
  restoreCellIndicatorSnapshot,
  setCellIndicatorIds,
  setCellIndicatorSnapshot,
  syncActiveCellIndicatorSnapshot,
} from "../policies/multiChartIndicatorStatePolicy";

type SetMultiChartLayoutPayload = MultiChartLayoutId | {
  layoutId: MultiChartLayoutId;
  primarySymbol?: string;
  market?: string;
};

type ApplyMultiChartPresetPayload = string | {
  presetId: string;
  primarySymbol?: string;
  market?: string;
  bindings?: Array<{
    symbol: string;
    exchange: string;
    timeframe: string;
    sourceKind: "equity" | "index";
    sourceId: string;
    chartType: AnyChartType;
  }>;
};

const normalizeLayoutBinding = (value: string | undefined): string => value?.trim().toUpperCase() ?? "";

const forcePrimaryLayoutChartActive = (layout: MultiChartLayoutState): MultiChartLayoutState => {
  const primaryChartId = layout.charts[0]?.chartId ?? layout.activeChartId;
  return {
    ...layout,
    activeChartId: primaryChartId,
    charts: layout.charts.map((chart, index) => ({ ...chart, isActive: index === 0 })),
  };
};

const normalizeCompleteLayout = (state: TechnicalAnalysisState): CompleteMultiChartLayoutState => {
  const complete = completeMultiChartLayout(state.ui.multiChartLayout);
  state.ui.multiChartLayout = complete;
  return state.ui.multiChartLayout as unknown as CompleteMultiChartLayoutState;
};

const syncChartConfigFromCell = (
  state: TechnicalAnalysisState,
  cell: CompleteMultiChartLayoutCell,
): void => {
  if (cell.sourceKind === "equity" && cell.symbol) state.chartConfig.symbol = cell.symbol;
  state.chartConfig.timeframe = cell.timeframe;
  state.chartConfig.chartType = cell.sourceKind === "index" ? "line" : cell.chartType;
  state.ui.selectedTimeRange = cell.dateRange || "Tout";
  if (cell.appearance) {
    state.chartAppearance = cloneMultiChartAppearance(cell.appearance) ?? state.chartAppearance;
  }
  restoreCellIndicatorSnapshot(state, cell);
};

const activateCell = (
  state: TechnicalAnalysisState,
  layout: CompleteMultiChartLayoutState,
  chartId: string,
): CompleteMultiChartLayoutCell | null => {
  const charts = layout.charts as CompleteMultiChartLayoutCell[];
  const target = charts.find((chart) => chart.chartId === chartId);
  if (!target?.symbol.trim()) return null;
  syncActiveCellIndicatorSnapshot(state);
  layout.activeChartId = target.chartId;
  charts.forEach((chart) => {
    chart.isActive = chart.chartId === target.chartId;
  });
  syncChartConfigFromCell(state, target);
  return target;
};

export const multiChartReducers = {
  setMultiChartLayout: (
    state: TechnicalAnalysisState,
    action: PayloadAction<SetMultiChartLayoutPayload>,
  ) => {
    const payload = typeof action.payload === "string"
      ? { layoutId: action.payload }
      : action.payload;
    syncActiveCellIndicatorSnapshot(state);
    const primarySymbol = normalizeLayoutBinding(payload.primarySymbol) || normalizeLayoutBinding(state.chartConfig.symbol);
    const market = normalizeLayoutBinding(payload.market) || normalizeLayoutBinding(state.ui.activeMarket.ticker) || "BRVM";
    const nextLayout = reconcileMultiChartLayout(
      state.ui.multiChartLayout,
      payload.layoutId,
      primarySymbol,
      state.ui.comparisonSymbols,
      market,
    );
    const normalizedNext = completeMultiChartLayout(
      isDenseMultiChartLayout(payload.layoutId)
        ? forcePrimaryLayoutChartActive({ ...nextLayout, sync: { ...nextLayout.sync, symbol: false, crosshair: false } })
        : nextLayout,
    );
    state.ui.multiChartLayout = normalizedNext;
    const active = (normalizedNext.charts as CompleteMultiChartLayoutCell[]).find(
      (chart) => chart.chartId === normalizedNext.activeChartId,
    );
    if (active?.symbol) syncChartConfigFromCell(state, active);
  },
  setMultiChartSync: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ key: MultiChartSyncKey; value: boolean }>,
  ) => {
    if (action.payload.key === "symbol" && action.payload.value) {
      const activeLayout = getLayoutDefinition(state.ui.multiChartLayout.layoutId);
      if (activeLayout.chartCount >= 8) return;
    }

    state.ui.multiChartLayout.sync[action.payload.key] = action.payload.value;

    if (action.payload.value) {
      const activeChart = state.ui.multiChartLayout.charts.find(
        (chart) => chart.chartId === state.ui.multiChartLayout.activeChartId,
      );

      if (action.payload.key === "symbol") {
        const layout = normalizeCompleteLayout(state);
        const completeCharts = layout.charts as CompleteMultiChartLayoutCell[];
        const completeActive = completeCharts.find((chart) => chart.chartId === layout.activeChartId);
        const targetSymbol = completeActive?.symbol || state.chartConfig.symbol;
        const targetExchange = normalizeLayoutBinding(completeActive?.exchange)
          || normalizeLayoutBinding(state.ui.activeMarket.ticker)
          || "BRVM";
        completeCharts.forEach((chart) => {
          chart.symbol = targetSymbol;
          chart.exchange = targetExchange;
          chart.sourceKind = completeActive?.sourceKind ?? "equity";
          chart.sourceId = completeActive?.sourceId ?? "";
          if (chart.sourceKind === "index") chart.chartType = "line";
        });
      } else if (action.payload.key === "interval") {
        const targetInterval = normalizeChartTimeframe(activeChart ? activeChart.interval : state.chartConfig.timeframe) ?? "1D";
        const layout = normalizeCompleteLayout(state);
        (layout.charts as CompleteMultiChartLayoutCell[]).forEach((chart) => {
          chart.interval = targetInterval;
          chart.timeframe = targetInterval;
        });
      }
    }
  },
  setActiveLayoutChart: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const layout = normalizeCompleteLayout(state);
    activateCell(state, layout, action.payload);
  },
  setEditChartTarget: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const layout = normalizeCompleteLayout(state);
    activateCell(state, layout, action.payload);
  },
  commitLayoutChartAppearance: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ chartId: string; appearance: ChartAppearance }>,
  ) => {
    const chartId = action.payload.chartId.trim();
    const nextAppearance = cloneMultiChartAppearance(action.payload.appearance);
    if (!chartId || !nextAppearance) return;

    const layout = normalizeCompleteLayout(state);
    const charts = layout.charts as CompleteMultiChartLayoutCell[];
    const target = charts.find((chart) => chart.chartId === chartId);
    if (!target?.symbol.trim()) return;

    // Materialize the current shared appearance before the first per-panel
    // customization. This prevents a later active-panel commit from leaking
    // into peers that previously inherited the global fallback.
    const baseline = cloneMultiChartAppearance(state.chartAppearance);
    if (baseline) {
      charts.forEach((chart) => {
        if (chart.appearance) return;
        const inheritedAppearance = cloneMultiChartAppearance(baseline);
        if (!inheritedAppearance) return;
        // Preserve style/output preferences independently from study attachment.
        // A peer without Volume may still remember its output settings for a later add.
        chart.appearance = inheritedAppearance;
      });
    }

    nextAppearance.showVolume = target.sourceKind === "equity" && nextAppearance.showVolume;
    // Appearance commits must never mutate the indicator attachment snapshot.
    target.appearance = nextAppearance;

    if (layout.activeChartId === target.chartId) {
      syncChartConfigFromCell(state, target);
    }
  },
  updateLayoutChart: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{
      chartId: string;
      symbol?: string;
      interval?: string;
      timeframe?: string;
      exchange?: string;
      chartType?: AnyChartType;
      dateRange?: string;
      indicators?: string[];
      viewport?: MultiChartViewportState;
      sourceKind?: "equity" | "index";
      sourceId?: string;
    }>,
  ) => {
    const layout = normalizeCompleteLayout(state);
    const charts = layout.charts as CompleteMultiChartLayoutCell[];
    const normalizedSymbol = action.payload.symbol?.trim().toUpperCase();
    const normalizedExchange = action.payload.exchange?.trim().toUpperCase();
    const requestedTimeframe = normalizeChartTimeframe(action.payload.timeframe ?? action.payload.interval);
    const target = charts.find((chart) => chart.chartId === action.payload.chartId);
    if (!target) return;

    charts.forEach((chart) => {
      const isTarget = chart.chartId === target.chartId;
      if (normalizedSymbol && (layout.sync.symbol || isTarget)) {
        chart.symbol = normalizedSymbol;
        chart.exchange = normalizedExchange ?? "";
      }
      if (requestedTimeframe && (layout.sync.interval || isTarget)) {
        chart.interval = requestedTimeframe;
        chart.timeframe = requestedTimeframe;
      }
      if (!isTarget) return;
      if (action.payload.sourceKind) chart.sourceKind = action.payload.sourceKind;
      if (action.payload.sourceId !== undefined) chart.sourceId = action.payload.sourceId.trim();
      if (action.payload.chartType !== undefined) {
        chart.chartType = chart.sourceKind === "index" ? "line" : normalizeChartType(action.payload.chartType);
      } else if (chart.sourceKind === "index") {
        chart.chartType = "line";
      }
      if (action.payload.dateRange !== undefined) chart.dateRange = action.payload.dateRange;
      if (action.payload.indicators !== undefined) {
        setCellIndicatorIds(chart, action.payload.indicators);
      } else if (action.payload.sourceKind !== undefined) {
        setCellIndicatorIds(chart, chart.indicators);
      }
      if (action.payload.viewport !== undefined) chart.viewport = { ...action.payload.viewport };
    });

    if (target.chartId === layout.activeChartId) syncChartConfigFromCell(state, target);
  },
  swapLayoutCharts: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ sourceChartId: string; targetChartId: string }>,
  ) => {
    const sourceChartId = action.payload.sourceChartId.trim();
    const targetChartId = action.payload.targetChartId.trim();
    if (!sourceChartId || !targetChartId || sourceChartId === targetChartId) return;

    // Fail closed before touching any live snapshot: an invalid drag request must
    // be a semantic no-op, including for indicator state and persistence observers.
    const rawCharts = state.ui.multiChartLayout.charts;
    if (!rawCharts.some((chart) => chart.chartId === sourceChartId)
      || !rawCharts.some((chart) => chart.chartId === targetChartId)) return;

    // Persist the live indicator configuration before moving the active panel so
    // the drag operation transfers one coherent panel snapshot, not stale state.
    syncActiveCellIndicatorSnapshot(state);
    const layout = normalizeCompleteLayout(state);
    const charts = layout.charts as CompleteMultiChartLayoutCell[];
    const sourceIndex = charts.findIndex((chart) => chart.chartId === sourceChartId);
    const targetIndex = charts.findIndex((chart) => chart.chartId === targetChartId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const source = charts[sourceIndex];
    const target = charts[targetIndex];
    const sourceWasActive = layout.activeChartId === source.chartId;
    const targetWasActive = layout.activeChartId === target.chartId;
    const sourceWasMaximized = layout.maximizedChartId === source.chartId;
    const targetWasMaximized = layout.maximizedChartId === target.chartId;

    // chartId is the physical slot identity and remains fixed. Every other field
    // is panel-owned and moves together, including drawingScope and viewport.
    const contentForSourceSlot = completeMultiChartCell({
      ...target,
      chartId: source.chartId,
      isActive: false,
    }, sourceIndex);
    const contentForTargetSlot = completeMultiChartCell({
      ...source,
      chartId: target.chartId,
      isActive: false,
    }, targetIndex);

    charts[sourceIndex] = contentForSourceSlot;
    charts[targetIndex] = contentForTargetSlot;

    if (sourceWasActive) layout.activeChartId = target.chartId;
    else if (targetWasActive) layout.activeChartId = source.chartId;

    if (sourceWasMaximized) layout.maximizedChartId = target.chartId;
    else if (targetWasMaximized) layout.maximizedChartId = source.chartId;

    const repaired = completeMultiChartLayout(layout);
    state.ui.multiChartLayout = repaired;
    const active = (repaired.charts as CompleteMultiChartLayoutCell[]).find(
      (chart) => chart.chartId === repaired.activeChartId,
    );
    if (active?.symbol) syncChartConfigFromCell(state, active);
  },
  duplicateLayoutChart: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ chartId: string; targetChartId?: string }>,
  ) => {
    const layout = normalizeCompleteLayout(state);
    const charts = layout.charts as CompleteMultiChartLayoutCell[];
    const source = charts.find((chart) => chart.chartId === action.payload.chartId);
    if (!source?.symbol.trim()) return;
    const target = action.payload.targetChartId
      ? charts.find((chart) => chart.chartId === action.payload.targetChartId && chart.chartId !== source.chartId)
      : charts.find((chart) => chart.chartId !== source.chartId && !chart.symbol.trim());
    if (!target || target.symbol.trim()) return;
    const targetIndex = charts.findIndex((chart) => chart.chartId === target.chartId);
    charts[targetIndex] = completeMultiChartCell({
      ...source,
      chartId: target.chartId,
      drawingScope: target.drawingScope || target.chartId,
      viewport: { ...source.viewport },
      indicators: [...source.indicators],
      isActive: false,
    }, targetIndex);
  },
  clearLayoutChart: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const layout = normalizeCompleteLayout(state);
    const charts = layout.charts as CompleteMultiChartLayoutCell[];
    const targetIndex = charts.findIndex((chart) => chart.chartId === action.payload);
    if (targetIndex < 0) return;
    const target = charts[targetIndex];
    charts[targetIndex] = completeMultiChartCell({
      chartId: target.chartId,
      symbol: "",
      exchange: "",
      interval: "1D",
      indicators: [],
      isActive: false,
      drawingScope: target.drawingScope || target.chartId,
    }, targetIndex);
    if (layout.maximizedChartId === target.chartId) layout.maximizedChartId = null;
    const repaired = completeMultiChartLayout(layout);
    state.ui.multiChartLayout = repaired;
    const active = (repaired.charts as CompleteMultiChartLayoutCell[]).find(
      (chart) => chart.chartId === repaired.activeChartId,
    );
    if (active?.symbol) syncChartConfigFromCell(state, active);
  },
  toggleMaximizeLayoutChart: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const layout = normalizeCompleteLayout(state);
    const target = (layout.charts as CompleteMultiChartLayoutCell[]).find(
      (chart) => chart.chartId === action.payload,
    );
    if (!target?.symbol.trim()) return;
    layout.maximizedChartId = layout.maximizedChartId === target.chartId ? null : target.chartId;
  },
  applyMultiChartPreset: (state: TechnicalAnalysisState, action: PayloadAction<ApplyMultiChartPresetPayload>) => {
    const payload = typeof action.payload === "string"
      ? { presetId: action.payload }
      : action.payload;
    const preset = MULTI_CHART_PRESETS.find((entry) => entry.id === payload.presetId);
    if (!preset || !isMultiChartPresetAvailable(preset)) return;
    const carriedIndicatorState = syncActiveCellIndicatorSnapshot(state) ?? createMultiChartIndicatorSnapshot(state);
    const primarySymbol = normalizeLayoutBinding(payload.primarySymbol) || normalizeLayoutBinding(state.chartConfig.symbol);
    const market = normalizeLayoutBinding(payload.market) || normalizeLayoutBinding(state.ui.activeMarket.ticker) || "BRVM";
    const presetLayout = completeMultiChartLayout(createPresetLayout(
      preset,
      primarySymbol,
      market,
      state.ui.comparisonSymbols,
    ));
    if (Array.isArray(payload.bindings)) {
      const charts = presetLayout.charts as CompleteMultiChartLayoutCell[];
      charts.forEach((chart, index) => {
        const binding = payload.bindings?.[index];
        const fallbackTimeframe = normalizeChartTimeframe(preset.intervals[index] ?? chart.interval) ?? "1D";
        if (!binding) {
          chart.symbol = "";
          chart.exchange = "";
          chart.interval = fallbackTimeframe;
          chart.timeframe = fallbackTimeframe;
          chart.sourceKind = "equity";
          chart.sourceId = "";
          chart.chartType = "candles";
          chart.dataSource = "unknown";
          chart.isActive = false;
          return;
        }
        const timeframe = normalizeChartTimeframe(binding.timeframe) ?? fallbackTimeframe;
        chart.symbol = normalizeLayoutBinding(binding.symbol);
        chart.exchange = normalizeLayoutBinding(binding.exchange);
        chart.interval = timeframe;
        chart.timeframe = timeframe;
        chart.sourceKind = binding.sourceKind;
        chart.sourceId = binding.sourceId.trim();
        chart.chartType = binding.sourceKind === "index" ? "line" : normalizeChartType(binding.chartType);
        chart.dataSource = "unknown";
      });
      const firstBound = charts.find((chart) => Boolean(chart.symbol));
      presetLayout.activeChartId = firstBound?.chartId ?? charts[0]?.chartId ?? "chart_1";
      charts.forEach((chart) => {
        chart.isActive = chart.chartId === presetLayout.activeChartId;
      });
    }
    const boundCharts = presetLayout.charts as CompleteMultiChartLayoutCell[];
    const firstBound = boundCharts.find((chart) => Boolean(chart.symbol));
    const indicatorTargets = preset.id === "multi_timeframe"
      ? boundCharts.filter((chart) => Boolean(chart.symbol))
      : firstBound ? [firstBound] : [];
    indicatorTargets.forEach((chart) => setCellIndicatorSnapshot(chart, carriedIndicatorState));
    state.ui.multiChartLayout = presetLayout;
    const active = (presetLayout.charts as CompleteMultiChartLayoutCell[]).find(
      (chart) => chart.chartId === presetLayout.activeChartId,
    );
    if (active?.symbol) syncChartConfigFromCell(state, active);
  },
  hydrateMultiChartLayout: (
    state: TechnicalAnalysisState,
    action: PayloadAction<MultiChartLayoutState>,
  ) => {
    const isDenseLayout = isDenseMultiChartLayout(action.payload.layoutId);
    const livePrimarySymbol = normalizeLayoutBinding(state.chartConfig.symbol);
    const persistedPrimary = action.payload.charts[0];
    const persistedPrimarySymbol = normalizeLayoutBinding(persistedPrimary?.symbol);
    const persistedPrimaryMarket = normalizeLayoutBinding(persistedPrimary?.exchange);
    const hydrationMarket = livePrimarySymbol && persistedPrimarySymbol === livePrimarySymbol && persistedPrimaryMarket
      ? persistedPrimaryMarket
      : normalizeLayoutBinding(state.ui.activeMarket.ticker) || persistedPrimaryMarket || "BRVM";
    const persistedContainsLivePrimary = Boolean(livePrimarySymbol)
      && hasBoundLayoutSymbol(action.payload, livePrimarySymbol);
    const shouldReconcilePrimaryBinding = Boolean(livePrimarySymbol) && !persistedContainsLivePrimary;
    const reconciled = shouldReconcilePrimaryBinding
      ? reconcileMultiChartLayout(
          action.payload,
          action.payload.layoutId,
          livePrimarySymbol,
          state.ui.comparisonSymbols,
          hydrationMarket,
        )
      : action.payload;
    const hydrated = completeMultiChartLayout(reconciled);
    if (shouldReconcilePrimaryBinding) {
      const primary = hydrated.charts[0] as CompleteMultiChartLayoutCell | undefined;
      if (primary) {
        primary.sourceKind = "equity";
        primary.sourceId = "";
      }
    }
    hydrated.sync = {
      symbol: isDenseLayout ? false : Boolean(hydrated.sync.symbol),
      interval: Boolean(hydrated.sync.interval),
      crosshair: isDenseLayout ? false : Boolean(hydrated.sync.crosshair),
      time: Boolean(hydrated.sync.time),
      dateRange: Boolean(hydrated.sync.dateRange),
    };
    state.ui.multiChartLayout = hydrated;
    const active = (hydrated.charts as CompleteMultiChartLayoutCell[]).find(
      (chart) => chart.chartId === hydrated.activeChartId,
    );
    if (active?.symbol) syncChartConfigFromCell(state, active);
  },
  resetMultiChartLayout: (state: TechnicalAnalysisState) => {
    const carriedIndicatorState = syncActiveCellIndicatorSnapshot(state) ?? createMultiChartIndicatorSnapshot(state);
    const resetLayout = completeMultiChartLayout(createDefaultMultiChartLayout(
      "single",
      state.chartConfig.symbol,
      state.ui.comparisonSymbols,
      state.ui.activeMarket.ticker,
    ));
    const primary = resetLayout.charts[0] as CompleteMultiChartLayoutCell | undefined;
    if (primary) setCellIndicatorSnapshot(primary, carriedIndicatorState);
    state.ui.multiChartLayout = resetLayout;
    if (primary?.symbol) syncChartConfigFromCell(state, primary);
  },
};
