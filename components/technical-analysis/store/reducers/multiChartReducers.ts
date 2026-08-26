import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartSyncKey,
} from "../../config/layout/multiChartLayoutTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import {
  getLayoutDefinition,
  isDenseMultiChartLayout,
  isMultiChartPresetAvailable,
  MULTI_CHART_PRESETS,
} from "../../config/layout/multiChartLayouts";
import {
  createDefaultMarketMultiChartLayout as createDefaultMultiChartLayout,
  createPresetLayout,
  reconcileMarketMultiChartLayout as reconcileMultiChartLayout,
} from "../../config/layout/brvmLayoutSymbols";

type SetMultiChartLayoutPayload = MultiChartLayoutId | {
  layoutId: MultiChartLayoutId;
  primarySymbol?: string;
  market?: string;
};

type ApplyMultiChartPresetPayload = string | {
  presetId: string;
  primarySymbol?: string;
  market?: string;
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

export const multiChartReducers = {
  setMultiChartLayout: (
    state: TechnicalAnalysisState,
    action: PayloadAction<SetMultiChartLayoutPayload>,
  ) => {
    const payload = typeof action.payload === "string"
      ? { layoutId: action.payload }
      : action.payload;
    const primarySymbol = normalizeLayoutBinding(payload.primarySymbol) || normalizeLayoutBinding(state.chartConfig.symbol);
    const market = normalizeLayoutBinding(payload.market) || normalizeLayoutBinding(state.ui.activeMarket.ticker) || "BRVM";
    const nextLayout = reconcileMultiChartLayout(
      state.ui.multiChartLayout,
      payload.layoutId,
      primarySymbol,
      state.ui.comparisonSymbols,
      market,
    );
    state.ui.multiChartLayout = isDenseMultiChartLayout(payload.layoutId)
      ? forcePrimaryLayoutChartActive({ ...nextLayout, sync: { ...nextLayout.sync, symbol: false, crosshair: false } })
      : nextLayout;
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
        const targetSymbol = activeChart ? activeChart.symbol : state.chartConfig.symbol;
        const targetExchange = normalizeLayoutBinding(activeChart?.exchange)
          || normalizeLayoutBinding(state.ui.activeMarket.ticker)
          || "BRVM";
        state.ui.multiChartLayout.charts.forEach((chart) => {
          chart.symbol = targetSymbol;
          chart.exchange = targetExchange;
        });
      } else if (action.payload.key === "interval") {
        const targetInterval = activeChart ? activeChart.interval : state.chartConfig.timeframe;
        state.ui.multiChartLayout.charts.forEach((chart) => {
          chart.interval = targetInterval;
        });
      }
    }
  },
  setActiveLayoutChart: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const target = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === action.payload);
    // An unbound slot is a configuration placeholder, never an interactive
    // canonical chart. Market/ticker selection for it is handled separately.
    if (!target?.symbol.trim()) return;

    state.ui.multiChartLayout.activeChartId = target.chartId;
    state.ui.multiChartLayout.charts.forEach((chart) => {
      chart.isActive = chart.chartId === target.chartId;
    });
    if (target.symbol) state.chartConfig.symbol = target.symbol;
    state.chartConfig.timeframe = target.interval;
  },
  setEditChartTarget: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const target = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === action.payload);
    if (!target?.symbol.trim()) return;
    state.ui.multiChartLayout.activeChartId = target.chartId;
    state.ui.multiChartLayout.charts.forEach((chart) => {
      chart.isActive = chart.chartId === target.chartId;
    });
  },
  updateLayoutChart: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ chartId: string; symbol?: string; interval?: string; exchange?: string }>,
  ) => {
    const layout = state.ui.multiChartLayout;
    const normalizedSymbol = action.payload.symbol?.trim().toUpperCase();
    const normalizedExchange = action.payload.exchange?.trim().toUpperCase();
    const target = layout.charts.find((chart) => chart.chartId === action.payload.chartId);
    if (!target) return;

    layout.charts.forEach((chart) => {
      const isTarget = chart.chartId === target.chartId;
      if (normalizedSymbol && (layout.sync.symbol || isTarget)) {
        chart.symbol = normalizedSymbol;
        // Exchange is part of the symbol binding. Never infer or preserve a
        // stale workspace/cell exchange when a caller changes the symbol
        // without supplying its market: fail closed to an unbound exchange.
        chart.exchange = normalizedExchange ?? "";
      }
      if (action.payload.interval && (layout.sync.interval || isTarget)) chart.interval = action.payload.interval;
    });

    if (target.chartId === layout.activeChartId) {
      if (normalizedSymbol) state.chartConfig.symbol = normalizedSymbol;
      if (action.payload.interval) state.chartConfig.timeframe = action.payload.interval;
    }
  },
  applyMultiChartPreset: (state: TechnicalAnalysisState, action: PayloadAction<ApplyMultiChartPresetPayload>) => {
    const payload = typeof action.payload === "string"
      ? { presetId: action.payload }
      : action.payload;
    const preset = MULTI_CHART_PRESETS.find((entry) => entry.id === payload.presetId);
    if (!preset || !isMultiChartPresetAvailable(preset)) return;
    const primarySymbol = normalizeLayoutBinding(payload.primarySymbol) || normalizeLayoutBinding(state.chartConfig.symbol);
    const market = normalizeLayoutBinding(payload.market) || normalizeLayoutBinding(state.ui.activeMarket.ticker) || "BRVM";
    state.ui.multiChartLayout = createPresetLayout(
      preset,
      primarySymbol,
      market,
      state.ui.comparisonSymbols,
    );
    const active = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === state.ui.multiChartLayout.activeChartId);
    if (active) {
      state.chartConfig.symbol = active.symbol;
      state.chartConfig.timeframe = active.interval;
    }
  },
  hydrateMultiChartLayout: (
    state: TechnicalAnalysisState,
    action: PayloadAction<MultiChartLayoutState>,
  ) => {
    const isDenseLayout = isDenseMultiChartLayout(action.payload.layoutId);
    const primarySymbol = state.chartConfig.symbol || action.payload.charts[0]?.symbol || "";
    const persistedPrimary = action.payload.charts[0];
    const persistedPrimarySymbol = normalizeLayoutBinding(persistedPrimary?.symbol);
    const persistedPrimaryMarket = normalizeLayoutBinding(persistedPrimary?.exchange);
    const hydrationMarket = persistedPrimarySymbol === primarySymbol && persistedPrimaryMarket
      ? persistedPrimaryMarket
      : state.ui.activeMarket.ticker;
    const hydrated = reconcileMultiChartLayout(
      action.payload,
      action.payload.layoutId,
      primarySymbol,
      state.ui.comparisonSymbols,
      hydrationMarket,
    );
    const normalizedHydrated = isDenseLayout ? forcePrimaryLayoutChartActive(hydrated) : hydrated;
    const persistedSync = action.payload.sync ?? normalizedHydrated.sync;
    state.ui.multiChartLayout = {
      ...normalizedHydrated,
      sync: {
        symbol: isDenseLayout ? false : Boolean(persistedSync.symbol),
        interval: Boolean(persistedSync.interval),
        crosshair: Boolean(persistedSync.crosshair),
        time: Boolean(persistedSync.time),
        dateRange: Boolean(persistedSync.dateRange),
      },
    };
  },
  resetMultiChartLayout: (state: TechnicalAnalysisState) => {
    state.ui.multiChartLayout = createDefaultMultiChartLayout(
      "single",
      state.chartConfig.symbol,
      state.ui.comparisonSymbols,
      state.ui.activeMarket.ticker,
    );
  },
};
