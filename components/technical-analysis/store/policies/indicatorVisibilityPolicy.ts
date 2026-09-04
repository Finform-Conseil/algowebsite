import type { AdvancedIndicatorsState, MovingAverageTrendSignalsState, PriceVsEmaMetricsState, PriceVsSmaMetricsState } from "../../config/indicators/advancedIndicatorsTypes";
import type { ChartState } from "../../config/state/chartStateTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import { syncActiveCellIndicatorSnapshot } from "./multiChartIndicatorStatePolicy";

type ChartIndicatorArrayKey =
  | "activeSma"
  | "activeEma"
  | "activeWma"
  | "activeDema"
  | "activeTema"
  | "activeHma"
  | "activeZlema"
  | "activeAlma"
  | "activeSmma"
  | "activeKama"
  | "activeVwma";

const MOVING_AVERAGE_ARRAY_KEYS: readonly ChartIndicatorArrayKey[] = [
  "activeSma",
  "activeEma",
  "activeWma",
  "activeDema",
  "activeTema",
  "activeHma",
  "activeZlema",
  "activeAlma",
  "activeSmma",
  "activeKama",
  "activeVwma",
];

const countTruthy = (values: Record<string, boolean>): number =>
  Object.values(values).reduce((count, enabled) => count + (enabled ? 1 : 0), 0);

export interface ActiveIndicatorStudySnapshot {
  chartIndicators: ChartState["indicators"];
  advancedIndicators: AdvancedIndicatorsState;
  movingAverageTrendSignals: MovingAverageTrendSignalsState;
  priceVsSmaMetrics: PriceVsSmaMetricsState;
  priceVsEmaMetrics: PriceVsEmaMetricsState;
}

/**
 * Counts user-visible study families, not individual ECharts series. A MACD study
 * remains one study even though it renders histogram/signal/line series, and a
 * moving-average family remains one study regardless of how many periods it owns.
 */
export const countActiveIndicatorStudies = ({
  chartIndicators,
  advancedIndicators,
  movingAverageTrendSignals,
  priceVsSmaMetrics,
  priceVsEmaMetrics,
}: ActiveIndicatorStudySnapshot): number => {
  let count = chartIndicators.volume ? 1 : 0;

  if (chartIndicators.sma || chartIndicators.activeSma.length > 0) count += 1;
  if (chartIndicators.ema || chartIndicators.activeEma.length > 0) count += 1;

  for (const key of MOVING_AVERAGE_ARRAY_KEYS) {
    if (key === "activeSma" || key === "activeEma") continue;
    if (chartIndicators[key].length > 0) count += 1;
  }

  count += countTruthy(advancedIndicators as unknown as Record<string, boolean>);
  count += countTruthy(movingAverageTrendSignals.active as unknown as Record<string, boolean>);
  count += countTruthy(priceVsSmaMetrics.active as unknown as Record<string, boolean>);
  count += countTruthy(priceVsEmaMetrics.active as unknown as Record<string, boolean>);

  return count;
};

/**
 * Canonical TradingView-style "Remove indicators" operation. It detaches studies
 * while preserving their reusable settings (periods/colors/output preferences).
 * Hide/show is a separate non-destructive visibility concern. The active
 * multi-chart cell is synchronized atomically through the existing snapshot policy.
 */
export const clearAllIndicatorVisibility = (state: TechnicalAnalysisState): void => {
  state.chartConfig.indicators.sma = false;
  state.chartConfig.indicators.ema = false;
  state.chartConfig.indicators.volume = false;
  // A future add creates a fresh visible study. Style/output preferences remain intact.
  state.chartConfig.indicators.volumeVisible = true;
  for (const key of MOVING_AVERAGE_ARRAY_KEYS) {
    state.chartConfig.indicators[key] = [];
  }

  (Object.keys(state.advancedIndicators) as Array<keyof AdvancedIndicatorsState>).forEach((key) => {
    state.advancedIndicators[key] = false;
  });

  Object.keys(state.ui.movingAverageTrendSignals.active).forEach((key) => {
    state.ui.movingAverageTrendSignals.active[key as keyof MovingAverageTrendSignalsState["active"]] = false;
  });
  state.ui.movingAverageTrendSignals.showSourceAverages = false;

  Object.keys(state.ui.priceVsSmaMetrics.active).forEach((key) => {
    state.ui.priceVsSmaMetrics.active[key as keyof PriceVsSmaMetricsState["active"]] = false;
  });
  Object.keys(state.ui.priceVsEmaMetrics.active).forEach((key) => {
    state.ui.priceVsEmaMetrics.active[key as keyof PriceVsEmaMetricsState["active"]] = false;
  });

  // Keep Volume output/style preferences intact. Removing the study must not
  // rewrite Settings > Style, otherwise re-adding it loses user configuration.
  syncActiveCellIndicatorSnapshot(state);
};
