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

export interface IndicatorTemplateModule {
  label: string;
  items: readonly string[];
}

export interface IndicatorTemplateSpec {
  title: string;
  badge: string;
  horizon: string;
  objective: string;
  modules: readonly IndicatorTemplateModule[];
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
    title: "Intraday Flow",
    badge: "DESK",
    horizon: "5m – 1h",
    objective: "Confluence tendance, volatilité, participation et niveaux intraday.",
    modules: [
      { label: "Execution", items: ["VWAP", "EMA 20/50", "ATR"] },
      { label: "Structure", items: ["ADX", "Breakout S/R", "Fib Pivots"] },
      { label: "Participation", items: ["Volume", "Volume Profile"] },
    ],
    chartIndicators: {
      sma: false,
      ema: true,
      volume: true,
      activeSma: [],
      activeEma: [20, 50],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["vwap", "atr", "adx", "volumeProfile", "pivotPointsFibonacci", "breakoutResistance", "breakdownSupport"],
  },
  swing: {
    title: "Swing Structure",
    badge: "PRO",
    horizon: "4h – 1D",
    objective: "Suivre les régimes de tendance et les ruptures avec confirmation de flux.",
    modules: [
      { label: "Trend", items: ["SMA 20/50", "Supertrend", "Ichimoku"] },
      { label: "Structure", items: ["Donchian", "Fib Pivots", "ATR"] },
      { label: "Flow", items: ["OBV", "Volume"] },
    ],
    chartIndicators: {
      sma: true,
      ema: false,
      volume: true,
      activeSma: [20, 50],
      activeEma: [],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["supertrend", "ichimoku", "donchian", "atr", "obv", "pivotPointsFibonacci"],
  },
  scalping: {
    title: "Scalping Liquidity",
    badge: "FAST",
    horizon: "1m – 15m",
    objective: "Lire rapidement le prix autour de la valeur, des gaps et des zones de réaction.",
    modules: [
      { label: "Execution", items: ["EMA 9/21", "VWAP", "ATR"] },
      { label: "Liquidity", items: ["Volume Profile", "Breakout S/R"] },
      { label: "Imbalance", items: ["True Gaps", "Volume"] },
    ],
    chartIndicators: {
      sma: false,
      ema: true,
      volume: true,
      activeSma: [],
      activeEma: [9, 21],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["vwap", "atr", "volumeProfile", "breakoutResistance", "breakdownSupport", "trueGapUp", "trueGapDown"],
  },
  long: {
    title: "Position Trend",
    badge: "MACRO",
    horizon: "1D – 1W",
    objective: "Identifier les tendances durables, les régimes forts et les niveaux structurels.",
    modules: [
      { label: "Regime", items: ["SMA 50/200", "ADX", "Supertrend"] },
      { label: "Context", items: ["Ichimoku", "52W High/Low", "MA Cross"] },
      { label: "Participation", items: ["OBV", "Volume"] },
    ],
    chartIndicators: {
      sma: true,
      ema: false,
      volume: true,
      activeSma: [50, 200],
      activeEma: [],
      ...emptyAdvancedMovingAverages,
    },
    activeAdvancedIndicators: ["adx", "supertrend", "ichimoku", "obv", "movingAverageCrosses", "fiftyTwoWeekHigh", "fiftyTwoWeekLow"],
  },
} as const satisfies Record<IndicatorTemplateId, IndicatorTemplateSpec>;
