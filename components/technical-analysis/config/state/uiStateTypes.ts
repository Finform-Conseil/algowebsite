import type { CompareSeriesSettingsMap } from "../compare-series/compareSeries";
import type { MovingAverageTrendSignalsState, PriceVsEmaMetricsState, PriceVsSmaMetricsState } from "../indicators/advancedIndicatorsTypes";
import type { MultiChartLayoutState } from "../layout/multiChartLayoutTypes";

export type CursorModeType =
  | "cross"
  | "dot"
  | "arrow"
  | "demonstration"
  | "magic"
  | "eraser"
  | "arrow-tooltip"
  | "cross-tooltip";

export interface UiState {
  isZenMode: boolean;
  isAnonyme: boolean;
  selectedPseudo: string;
  cursorMode: CursorModeType;
  selectedTimeRange: string;
  isPublishing: boolean;
  isCapturing: boolean;
  dataMode: "mock" | "real";
  comparisonSymbols: string[];
  comparisonSettings: CompareSeriesSettingsMap;
  movingAverageTrendSignals: MovingAverageTrendSignalsState;
  priceVsSmaMetrics: PriceVsSmaMetricsState;
  priceVsEmaMetrics: PriceVsEmaMetricsState;
  multiChartLayout: MultiChartLayoutState;
  searchMode: "replace" | "compare";
  modals: {
    search: boolean;
    indicators: boolean;
    replay: boolean;
    templates: boolean;
    settings: boolean;
    options: boolean;
    datePicker: boolean;
    loadAnalysis: boolean;
    alerts: boolean;
    publish: boolean;
    drawingSettings: boolean;
  };
  replay: {
    isActive: boolean;
    isPaused: boolean;
    speed: number;
  };
  isLockedAll: boolean;
  areDrawingsHidden: boolean;
  prefilledAlertPrice?: number;
  prefilledAlertCondition?: "GREATER_THAN" | "LESS_THAN";
}
