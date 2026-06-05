import type { BollingerSettings, IndicatorPeriods } from "../config/indicators/advancedIndicatorsTypes";
import type { TechnicalAnalysisState } from "../config/state/technicalAnalysisStateTypes";
import type { UiState } from "../config/state/uiStateTypes";
import type { RootState } from "@/core/infrastructure/store";

export const selectTA = (state: RootState): TechnicalAnalysisState => state.technicalAnalysis;
export const selectChartConfig = (state: RootState) => state.technicalAnalysis.chartConfig;
export const selectAdvancedIndicators = (state: RootState) => state.technicalAnalysis.advancedIndicators;
export const selectIndicatorPeriods = (state: RootState): IndicatorPeriods => state.technicalAnalysis.indicatorPeriods;
export const selectBollingerSettings = (state: RootState): BollingerSettings => state.technicalAnalysis.bollingerSettings;
export const selectChartAppearance = (state: RootState) => state.technicalAnalysis.chartAppearance;
export const selectUiState = (state: RootState): UiState => state.technicalAnalysis.ui;
export const selectModals = (state: RootState) => state.technicalAnalysis.ui.modals;
export const selectAlerts = (state: RootState) => state.technicalAnalysis.alerts;
export const selectOrders = (state: RootState) => state.technicalAnalysis.orders;
export const selectDataMode = (state: RootState): "mock" | "real" => state.technicalAnalysis.ui.dataMode || "real";
export const selectMarketData = (state: RootState) => state.technicalAnalysis.marketData;
export const selectMarketSnapshots = (state: RootState) => state.technicalAnalysis.marketSnapshots;
