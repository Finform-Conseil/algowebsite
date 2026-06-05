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
  MULTI_CHART_PRESETS,
} from "../../config/layout/multiChartLayouts";
import {
  createDefaultBrvmMultiChartLayout as createDefaultMultiChartLayout,
  createPresetLayout,
  reconcileBrvmMultiChartLayout as reconcileMultiChartLayout,
} from "../../config/layout/brvmLayoutSymbols";

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
    action: PayloadAction<MultiChartLayoutId>,
  ) => {
    const nextLayout = reconcileMultiChartLayout(
      state.ui.multiChartLayout,
      action.payload,
      state.chartConfig.symbol,
      state.ui.comparisonSymbols,
    );
    state.ui.multiChartLayout = isDenseMultiChartLayout(action.payload)
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
        state.ui.multiChartLayout.charts.forEach((chart) => {
          chart.symbol = targetSymbol;
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
    if (!target) return;

    state.ui.multiChartLayout.activeChartId = target.chartId;
    state.ui.multiChartLayout.charts.forEach((chart) => {
      chart.isActive = chart.chartId === target.chartId;
    });
    state.chartConfig.symbol = target.symbol;
    state.chartConfig.timeframe = target.interval;
  },
  setEditChartTarget: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const target = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === action.payload);
    if (!target) return;
    state.ui.multiChartLayout.activeChartId = target.chartId;
    state.ui.multiChartLayout.charts.forEach((chart) => {
      chart.isActive = chart.chartId === target.chartId;
    });
  },
  updateLayoutChart: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ chartId: string; symbol?: string; interval?: string }>,
  ) => {
    const layout = state.ui.multiChartLayout;
    const normalizedSymbol = action.payload.symbol?.trim().toUpperCase();
    const target = layout.charts.find((chart) => chart.chartId === action.payload.chartId);
    if (!target) return;

    layout.charts.forEach((chart) => {
      const isTarget = chart.chartId === target.chartId;
      if (normalizedSymbol && (layout.sync.symbol || isTarget)) chart.symbol = normalizedSymbol;
      if (action.payload.interval && (layout.sync.interval || isTarget)) chart.interval = action.payload.interval;
    });

    if (target.chartId === layout.activeChartId) {
      if (normalizedSymbol) state.chartConfig.symbol = normalizedSymbol;
      if (action.payload.interval) state.chartConfig.timeframe = action.payload.interval;
    }
  },
  applyMultiChartPreset: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const preset = MULTI_CHART_PRESETS.find((entry) => entry.id === action.payload);
    if (!preset) return;
    state.ui.multiChartLayout = createPresetLayout(preset, state.chartConfig.symbol);
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
    const primarySymbol = isDenseLayout
      ? state.chartConfig.symbol
      : action.payload.charts[0]?.symbol || state.chartConfig.symbol;
    const hydrated = reconcileMultiChartLayout(
      action.payload,
      action.payload.layoutId,
      primarySymbol,
      state.ui.comparisonSymbols,
    );
    const normalizedHydrated = isDenseLayout ? forcePrimaryLayoutChartActive(hydrated) : hydrated;
    state.ui.multiChartLayout = {
      ...normalizedHydrated,
      sync: {
        symbol: false,
        interval: false,
        crosshair: false,
        time: false,
        dateRange: false,
      },
    };
  },
  resetMultiChartLayout: (state: TechnicalAnalysisState) => {
    state.ui.multiChartLayout = createDefaultMultiChartLayout("single", state.chartConfig.symbol);
  },
};
