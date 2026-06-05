import type { AdvancedIndicatorsState } from "../../config/indicators/advancedIndicatorsTypes";
import type { ChartState } from "../../config/state/chartStateTypes";

export type IndicatorTemplateId = "day" | "swing" | "scalping" | "long";

type IndicatorTemplateMovingAverageKey =
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

export type IndicatorTemplateChartIndicators = Pick<ChartState["indicators"], "sma" | "ema" | "volume">
  & Record<IndicatorTemplateMovingAverageKey, readonly number[]>;

export interface IndicatorTemplateSpec {
  chartIndicators: IndicatorTemplateChartIndicators;
  activeAdvancedIndicators: readonly (keyof AdvancedIndicatorsState)[];
}

const emptyAdvancedMovingAverages = {
  activeWma: [],
  activeDema: [],
  activeTema: [],
  activeHma: [],
  activeZlema: [],
  activeAlma: [],
  activeSmma: [],
  activeKama: [],
  activeVwma: [],
} satisfies Pick<
  IndicatorTemplateChartIndicators,
  Exclude<IndicatorTemplateMovingAverageKey, "activeSma" | "activeEma">
>;

export const INDICATOR_TEMPLATE_IDS: readonly IndicatorTemplateId[] = [
  "day",
  "swing",
  "scalping",
  "long",
];

export const INDICATOR_TEMPLATE_SPECS = {
  day: {
    chartIndicators: {
      sma: true,
      ema: false,
      volume: false,
      activeSma: [5, 10],
      activeEma: [],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["rsi", "macd", "roc10"],
  },
  swing: {
    chartIndicators: {
      sma: true,
      ema: false,
      volume: true,
      activeSma: [20, 50],
      activeEma: [],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["bollinger", "stochastic", "williamsR14", "obv"],
  },
  scalping: {
    chartIndicators: {
      sma: false,
      ema: true,
      volume: true,
      activeSma: [],
      activeEma: [5, 10],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["atr", "roc10"],
  },
  long: {
    chartIndicators: {
      sma: true,
      ema: false,
      volume: true,
      activeSma: [50, 200],
      activeEma: [],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["obv"],
  },
} as const satisfies Record<IndicatorTemplateId, IndicatorTemplateSpec>;
