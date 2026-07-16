import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { IndicatorBacktestSignal, IndicatorSignalDirection } from "./indicatorBacktestAlertPolicy";
import type { IndicatorResearchFamily, IndicatorResearchInventoryEntry } from "./indicatorResearchGradeTypes";
import { resolveIndicatorBacktestSeries, type IndicatorBacktestSeries, type IndicatorBacktestSeriesCache } from "./indicatorBacktestSeries";

export interface IndicatorFamilyBacktestStrategy {
  family: IndicatorResearchFamily;
  signalModel: "price-cross" | "threshold-cross" | "state-transition" | "event-confirmation" | "volatility-expansion";
  directionModel: "directional" | "state" | "neutral";
  reason: string;
}

const ZERO_LINE_KEYS = new Set(["cci_14", "cci_20", "dpo_20", "tsi", "tsi_signal", "awesome_osc", "ac_osc", "rvi", "rvi_signal", "fisher_transform", "fisher_transform_signal", "coppock_curve", "macd_line", "macd_signal", "macd_histogram", "macd_ppo", "macd_ppo_signal", "macd_ppo_histogram", "macd_apo", "elder_bull_power", "elder_bear_power", "aroon_oscillator", "trix", "kst", "kst_signal", "linear_reg_slope", "obv", "ad_line", "cmf_20", "chaikin_osc", "volume_osc", "vroc_14", "klinger_osc", "klinger_signal", "elder_force_raw", "force_index_13", "eom_14"]);
const STATE_KEYS = new Set(["parabolic_sar_signal", "supertrend_signal", "ichimoku_cloud_color", "price_vs_cloud", "is_above_vwap"]);
const PRICE_LEVEL_KEYS = new Set(["bb_upper", "bb_middle", "bb_lower", "donchian_upper", "donchian_middle", "donchian_lower", "keltner_upper", "keltner_middle", "keltner_lower", "vp_poc", "vp_vah", "vp_val", "vwap"]);
const NEUTRAL_VOLATILITY_KEYS = new Set(["bb_width", "atr_14", "atr_20", "natr_14", "hv_10", "hv_20", "hv_30", "hv_60", "hv_90", "hv_252", "std_dev_20", "chaikin_vol", "ulcer_index", "mass_index", "adx", "adx_trend_strength"]);

export const getIndicatorFamilyBacktestStrategy = (
  entry: Pick<IndicatorResearchInventoryEntry, "key" | "policy">,
): IndicatorFamilyBacktestStrategy => {
  const family = entry.policy.family;
  if (["moving-average", "trend-signal", "price-vs-average", "support-resistance"].includes(family)) {
    return buildStrategy(family, "price-cross", "directional", "Backtest price crossing the computed level, not a raw indicator threshold.");
  }
  if (family === "oscillator") return buildStrategy(family, "threshold-cross", "directional", "Backtest oscillator crosses around its neutral line or native midpoint.");
  if (family === "trend") return STATE_KEYS.has(entry.key)
    ? buildStrategy(family, "state-transition", "state", "Backtest trend regime transitions between bearish and bullish states.")
    : buildStrategy(family, "threshold-cross", "directional", "Backtest trend indicator zero-line or directional-strength crosses.");
  if (family === "volatility") return PRICE_LEVEL_KEYS.has(entry.key) || entry.key === "bb_pct"
    ? buildStrategy(family, "price-cross", "directional", "Backtest volatility bands only when price breaks a concrete level.")
    : buildStrategy(family, "volatility-expansion", "neutral", "Backtest volatility expansion as context, without inventing direction.");
  if (family === "volume-liquidity") return PRICE_LEVEL_KEYS.has(entry.key) || STATE_KEYS.has(entry.key)
    ? buildStrategy(family, "state-transition", "state", "Backtest liquidity state or price versus liquidity level.")
    : buildStrategy(family, "threshold-cross", "directional", "Backtest money-flow crosses with BRVM liquidity context.");
  return buildStrategy(family, "event-confirmation", "directional", "Backtest sparse pattern events with confirmation on the triggering close.");
};

export const buildIndicatorFamilyBacktestSignals = (
  data: ChartDataPoint[],
  entry: Pick<IndicatorResearchInventoryEntry, "id" | "key" | "label" | "policy">,
  cache?: IndicatorBacktestSeriesCache,
): IndicatorBacktestSignal[] => {
  const series = resolveIndicatorBacktestSeries(entry, data, cache);
  if (!series || data.length < 2) return [];

  switch (entry.policy.family) {
    case "moving-average":
    case "trend-signal":
    case "price-vs-average":
    case "support-resistance":
      return buildPriceCrossSignals(data, series, entry.label);
    case "oscillator":
      return buildOscillatorSignals(data, series, entry.key, entry.label);
    case "trend":
      return buildTrendSignals(data, series, entry.key, entry.label);
    case "volatility":
      return buildVolatilitySignals(data, series, entry.key, entry.label);
    case "volume-liquidity":
      return buildVolumeLiquiditySignals(data, series, entry.key, entry.label);
    case "price-action":
      return buildEventSignals(data, series, inferPriceActionDirection(entry.key), entry.label);
    case "candlestick-pattern":
      return buildEventSignals(data, series, inferCandlestickDirection(entry.key), entry.label);
    default:
      return [];
  }
};

const buildStrategy = (
  family: IndicatorResearchFamily,
  signalModel: IndicatorFamilyBacktestStrategy["signalModel"],
  directionModel: IndicatorFamilyBacktestStrategy["directionModel"],
  reason: string,
): IndicatorFamilyBacktestStrategy => ({ directionModel, family, reason, signalModel });

const buildPriceCrossSignals = (data: ChartDataPoint[], levelSeries: IndicatorBacktestSeries, label: string): IndicatorBacktestSignal[] => {
  const signals: IndicatorBacktestSignal[] = [];
  for (let index = 1; index < data.length; index += 1) {
    const previousClose = toFiniteNumber(data[index - 1]?.close);
    const currentClose = toFiniteNumber(data[index]?.close);
    const previousLevel = toFiniteNumber(levelSeries[index - 1]);
    const currentLevel = toFiniteNumber(levelSeries[index]);
    if (previousClose === null || currentClose === null || previousLevel === null || currentLevel === null) continue;
    if (previousClose <= previousLevel && currentClose > currentLevel) signals.push(buildSignal(index, "bullish", currentClose, label));
    if (previousClose >= previousLevel && currentClose < currentLevel) signals.push(buildSignal(index, "bearish", currentClose, label));
  }
  return signals;
};

const buildOscillatorSignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, key: string, label: string): IndicatorBacktestSignal[] => {
  if (key.startsWith("williams_r_")) return buildThresholdCrossSignals(data, series, -50, label);
  if (ZERO_LINE_KEYS.has(key)) return buildThresholdCrossSignals(data, series, 0, label);
  return buildThresholdCrossSignals(data, series, 50, label);
};

const buildTrendSignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, key: string, label: string): IndicatorBacktestSignal[] => {
  if (STATE_KEYS.has(key)) return buildStateTransitionSignals(data, series, label);
  if (NEUTRAL_VOLATILITY_KEYS.has(key)) return buildNeutralExpansionSignals(data, series, label);
  return buildThresholdCrossSignals(data, series, 0, label);
};

const buildVolatilitySignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, key: string, label: string): IndicatorBacktestSignal[] => {
  if (key === "bb_pct") return buildPercentBSignals(data, series, label);
  if (PRICE_LEVEL_KEYS.has(key)) return buildPriceCrossSignals(data, series, label);
  return buildNeutralExpansionSignals(data, series, label);
};

const buildVolumeLiquiditySignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, key: string, label: string): IndicatorBacktestSignal[] => {
  if (PRICE_LEVEL_KEYS.has(key)) return buildPriceCrossSignals(data, series, label);
  if (STATE_KEYS.has(key)) return buildStateTransitionSignals(data, series, label);
  if (key === "mfi_14") return buildThresholdCrossSignals(data, series, 50, label);
  return buildThresholdCrossSignals(data, series, 0, label);
};

const buildThresholdCrossSignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, threshold: number, label: string): IndicatorBacktestSignal[] => {
  const signals: IndicatorBacktestSignal[] = [];
  for (let index = 1; index < data.length; index += 1) {
    const previous = toFiniteNumber(series[index - 1]);
    const current = toFiniteNumber(series[index]);
    if (previous === null || current === null) continue;
    if (previous <= threshold && current > threshold) signals.push(buildSignal(index, "bullish", data[index]?.close, label));
    if (previous >= threshold && current < threshold) signals.push(buildSignal(index, "bearish", data[index]?.close, label));
  }
  return signals;
};

const buildPercentBSignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, label: string): IndicatorBacktestSignal[] => {
  const signals: IndicatorBacktestSignal[] = [];
  for (let index = 1; index < data.length; index += 1) {
    const previous = toFiniteNumber(series[index - 1]);
    const current = toFiniteNumber(series[index]);
    if (previous === null || current === null) continue;
    if (previous <= 1 && current > 1) signals.push(buildSignal(index, "bullish", data[index]?.close, label));
    if (previous >= 0 && current < 0) signals.push(buildSignal(index, "bearish", data[index]?.close, label));
  }
  return signals;
};

const buildStateTransitionSignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, label: string): IndicatorBacktestSignal[] => {
  const signals: IndicatorBacktestSignal[] = [];
  for (let index = 1; index < data.length; index += 1) {
    const previous = toFiniteNumber(series[index - 1]);
    const current = toFiniteNumber(series[index]);
    if (previous === null || current === null) continue;
    if (previous <= 0 && current > 0) signals.push(buildSignal(index, "bullish", data[index]?.close, label));
    if (previous >= 0 && current < 0) signals.push(buildSignal(index, "bearish", data[index]?.close, label));
  }
  return signals;
};

const buildNeutralExpansionSignals = (data: ChartDataPoint[], series: IndicatorBacktestSeries, label: string): IndicatorBacktestSignal[] => {
  const signals: IndicatorBacktestSignal[] = [];
  for (let index = 20; index < data.length; index += 1) {
    const current = toFiniteNumber(series[index]);
    const baseline = averageLastFinite(series, index - 1, 20);
    if (current !== null && baseline !== null && current > baseline * 1.2) {
      signals.push(buildSignal(index, "neutral", data[index]?.close, label));
    }
  }
  return signals;
};

const buildEventSignals = (
  data: ChartDataPoint[],
  series: IndicatorBacktestSeries,
  direction: IndicatorSignalDirection,
  label: string,
): IndicatorBacktestSignal[] => {
  const signals: IndicatorBacktestSignal[] = [];
  for (let index = 1; index < data.length; index += 1) {
    const current = toFiniteNumber(series[index]);
    const previous = toFiniteNumber(series[index - 1]);
    if (current === null || current === 0 || previous !== 0) continue;
    signals.push(buildSignal(index, current < 0 ? "bearish" : direction, data[index]?.close, label));
  }
  return signals;
};

const inferPriceActionDirection = (key: string): IndicatorSignalDirection => {
  if (key.includes("Down") || key.includes("breakdown") || key.includes("Support") || key === "gapDown" || key === "trueGapDown" || key === "consecutiveDownDays") return "bearish";
  if (key === "insideBar" || key === "outsideBar" || key === "gapPct") return "neutral";
  return "bullish";
};

const inferCandlestickDirection = (key: string): IndicatorSignalDirection => {
  if (/Bear|bear|hangingMan|shootingStar|eveningStar|threeBlackCrows|darkCloudCover|tweezerTop|upsideGapTwoCrows|concealingBabySwallow|fallingThreeMethods/.test(key)) return "bearish";
  if (/Bull|bull|hammer|takuri|invertedHammer|morningStar|threeWhiteSoldiers|piercingLine|tweezerBottom|ladderBottom|stickSandwich|risingThreeMethods/.test(key)) return "bullish";
  return "neutral";
};

const averageLastFinite = (series: IndicatorBacktestSeries, endIndex: number, size: number): number | null => {
  let count = 0;
  let sum = 0;
  for (let index = endIndex; index >= 0 && count < size; index -= 1) {
    const value = toFiniteNumber(series[index]);
    if (value === null) continue;
    sum += value;
    count += 1;
  }
  return count === size ? sum / count : null;
};

const buildSignal = (
  index: number,
  direction: IndicatorSignalDirection,
  triggerPrice: number | null | undefined,
  label: string,
): IndicatorBacktestSignal => ({
  direction,
  index,
  label,
  triggerPrice: toFiniteNumber(triggerPrice),
});

const toFiniteNumber = (value: number | string | null | undefined): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);
