import type { PayloadAction } from "@reduxjs/toolkit";

import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import type { UiState } from "../../config/state/uiStateTypes";

export type ChartHistoryReduxSnapshot = {
  chartConfig: TechnicalAnalysisState["chartConfig"];
  advancedIndicators: TechnicalAnalysisState["advancedIndicators"];
  indicatorPeriods: TechnicalAnalysisState["indicatorPeriods"];
  bollingerSettings: TechnicalAnalysisState["bollingerSettings"];
  chartAppearance: TechnicalAnalysisState["chartAppearance"];
  pineChartOverlay: TechnicalAnalysisState["pineChartOverlay"];
  ui: Pick<
    UiState,
    | "activeMarket"
    | "selectedTimeRange"
    | "comparisonSymbols"
    | "comparisonSettings"
    | "movingAverageTrendSignals"
    | "priceVsSmaMetrics"
    | "priceVsEmaMetrics"
    | "isLockedAll"
    | "areDrawingsHidden"
  >;
};

export const chartHistoryReducers = {
  restoreChartHistorySnapshot: (
    state: TechnicalAnalysisState,
    action: PayloadAction<ChartHistoryReduxSnapshot>,
  ) => {
    const snapshot = action.payload;

    state.chartConfig = snapshot.chartConfig;
    state.advancedIndicators = snapshot.advancedIndicators;
    state.indicatorPeriods = snapshot.indicatorPeriods;
    state.bollingerSettings = snapshot.bollingerSettings;
    state.chartAppearance = snapshot.chartAppearance;
    state.pineChartOverlay = snapshot.pineChartOverlay;

    state.ui.activeMarket = snapshot.ui.activeMarket;
    state.ui.selectedTimeRange = snapshot.ui.selectedTimeRange;
    state.ui.comparisonSymbols = snapshot.ui.comparisonSymbols;
    state.ui.comparisonSettings = snapshot.ui.comparisonSettings;
    state.ui.movingAverageTrendSignals = snapshot.ui.movingAverageTrendSignals;
    state.ui.priceVsSmaMetrics = snapshot.ui.priceVsSmaMetrics;
    state.ui.priceVsEmaMetrics = snapshot.ui.priceVsEmaMetrics;
    state.ui.isLockedAll = snapshot.ui.isLockedAll;
    state.ui.areDrawingsHidden = snapshot.ui.areDrawingsHidden;

    state.ui.chartAppearancePreview = null;
  },
};
