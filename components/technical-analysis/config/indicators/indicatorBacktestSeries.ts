import * as TechnicalIndicators from "../../lib/Indicators/TechnicalIndicators";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { INDICATOR_RUNTIME_ALERT_DEFINITIONS } from "./indicatorRuntimeAlertCatalog";
import type { IndicatorResearchInventoryEntry } from "./indicatorResearchGradeTypes";

export type IndicatorBacktestSeries = ReadonlyArray<number | string | null | undefined>;

export interface IndicatorBacktestSeriesCache {
  results: Map<string, unknown>;
}

interface VolumeProfileLevelSeries {
  poc: IndicatorBacktestSeries;
  vah: IndicatorBacktestSeries;
  val: IndicatorBacktestSeries;
}

const runtimeCatalogKeyByInventoryId = new Map(
  INDICATOR_RUNTIME_ALERT_DEFINITIONS.map((definition) => [definition.inventoryId, definition.catalogKey]),
);

export const createIndicatorBacktestSeriesCache = (): IndicatorBacktestSeriesCache => ({ results: new Map<string, unknown>() });

export const resolveIndicatorBacktestSeries = (
  entry: Pick<IndicatorResearchInventoryEntry, "id" | "key" | "policy">,
  data: ChartDataPoint[],
  cache?: IndicatorBacktestSeriesCache,
): IndicatorBacktestSeries | null => {
  if (data.length === 0) return null;
  return resolveAverageSeries(entry.key, data, cache)
    ?? resolveRuntimeSeries(runtimeCatalogKeyByInventoryId.get(entry.id) ?? entry.key, data, cache)
    ?? resolveSupportResistanceSeries(entry.key, data, cache)
    ?? resolvePriceActionSeries(entry.key, data, cache)
    ?? resolveCandlestickSeries(entry.key, data, cache);
};

const resolveAverageSeries = (key: string, data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries | null => {
  const parsed = /^(sma|ema|wma|dema|tema|hma|zlema|alma|smma|kama|vwma)_(\d+)$/.exec(key);
  if (!parsed) return null;

  const period = Number(parsed[2]);
  if (!Number.isFinite(period) || period <= 0) return null;

  return getCachedResult(cache, "average:" + key, () => {
    switch (parsed[1]) {
      case "sma": return TechnicalIndicators.calculateSMA(data, period);
      case "ema": return TechnicalIndicators.calculateEMA(data, period);
      case "wma": return TechnicalIndicators.calculateWMA(data, period);
      case "dema": return TechnicalIndicators.calculateDEMA(data, period);
      case "tema": return TechnicalIndicators.calculateTEMA(data, period);
      case "hma": return TechnicalIndicators.calculateHMA(data, period);
      case "zlema": return TechnicalIndicators.calculateZLEMA(data, period);
      case "alma": return TechnicalIndicators.calculateALMA(data, period);
      case "smma": return TechnicalIndicators.calculateSMMA(data, period);
      case "kama": return TechnicalIndicators.calculateKAMA(data, period);
      case "vwma": return TechnicalIndicators.calculateVWMA(data, period);
      default: return null;
    }
  });
};

const resolveRuntimeSeries = (key: string, data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries | null => {
  const periodMatch = /_(\d+)$/.exec(key);
  const period = periodMatch ? Number(periodMatch[1]) : null;
  switch (key) {
    case "stoch_k": return getCachedResult(cache, "runtime:stochastic", () => TechnicalIndicators.calculateStochastic(data)).kLine;
    case "stoch_d": return getCachedResult(cache, "runtime:stochastic", () => TechnicalIndicators.calculateStochastic(data)).dLine;
    case "stoch_rsi_k": return getCachedResult(cache, "runtime:stoch_rsi", () => TechnicalIndicators.calculateStochasticRSI(data)).kLine;
    case "stoch_rsi_d": return getCachedResult(cache, "runtime:stoch_rsi", () => TechnicalIndicators.calculateStochasticRSI(data)).dLine;
    case "dymi": return getCachedResult(cache, "runtime:dymi", () => TechnicalIndicators.calculateDYMI(data));
    case "ultimate_osc": return getCachedResult(cache, "runtime:ultimate_osc", () => TechnicalIndicators.calculateUltimateOscillator(data));
    case "tsi": return getCachedResult(cache, "runtime:tsi", () => TechnicalIndicators.calculateTSI(data)).tsi;
    case "tsi_signal": return getCachedResult(cache, "runtime:tsi", () => TechnicalIndicators.calculateTSI(data)).signalLine;
    case "awesome_osc": return getCachedResult(cache, "runtime:awesome_osc", () => TechnicalIndicators.calculateAwesomeOscillator(data));
    case "ac_osc": return getCachedResult(cache, "runtime:ac_osc", () => TechnicalIndicators.calculateAcceleratorOscillator(data));
    case "rvi": return getCachedResult(cache, "runtime:rvi", () => TechnicalIndicators.calculateRVI(data)).rvi;
    case "rvi_signal": return getCachedResult(cache, "runtime:rvi", () => TechnicalIndicators.calculateRVI(data)).signalLine;
    case "fisher_transform": return getCachedResult(cache, "runtime:fisher_transform", () => TechnicalIndicators.calculateFisherTransform(data)).fisher;
    case "fisher_transform_signal": return getCachedResult(cache, "runtime:fisher_transform", () => TechnicalIndicators.calculateFisherTransform(data)).signalLine;
    case "elder_bull_power": return getCachedResult(cache, "runtime:elder_bull_bear", () => TechnicalIndicators.calculateElderBullBearPower(data)).bull;
    case "elder_bear_power": return getCachedResult(cache, "runtime:elder_bull_bear", () => TechnicalIndicators.calculateElderBullBearPower(data)).bear;
    case "coppock_curve": return getCachedResult(cache, "runtime:coppock_curve", () => TechnicalIndicators.calculateCoppockCurve(data));
    case "macd_line": return getCachedResult(cache, "runtime:macd", () => TechnicalIndicators.calculateMACD(data)).macdLine;
    case "macd_signal": return getCachedResult(cache, "runtime:macd", () => TechnicalIndicators.calculateMACD(data)).signalLine;
    case "macd_histogram": return getCachedResult(cache, "runtime:macd", () => TechnicalIndicators.calculateMACD(data)).histogram;
    case "macd_ppo": return getCachedResult(cache, "runtime:ppo", () => TechnicalIndicators.calculatePPO(data)).ppoLine;
    case "macd_ppo_signal": return getCachedResult(cache, "runtime:ppo", () => TechnicalIndicators.calculatePPO(data)).signalLine;
    case "macd_ppo_histogram": return getCachedResult(cache, "runtime:ppo", () => TechnicalIndicators.calculatePPO(data)).histogram;
    case "macd_apo": return getCachedResult(cache, "runtime:apo", () => TechnicalIndicators.calculateAPO(data));
    case "parabolic_sar": return getCachedResult(cache, "runtime:parabolic_sar", () => TechnicalIndicators.calculateParabolicSAR(data)).sar;
    case "parabolic_sar_signal": return getCachedResult(cache, "runtime:parabolic_sar", () => TechnicalIndicators.calculateParabolicSAR(data)).signal;
    case "ichimoku_tenkan": return getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data)).tenkan;
    case "ichimoku_kijun": return getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data)).kijun;
    case "ichimoku_senkou_a": return getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data)).senkouA;
    case "ichimoku_senkou_b": return getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data)).senkouB;
    case "ichimoku_chikou": return getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data)).chikou;
    case "ichimoku_cloud_color": return buildIchimokuCloudColor(data, cache);
    case "price_vs_cloud": return buildPriceVsCloud(data, cache);
    case "adx": return getCachedResult(cache, "runtime:adx", () => TechnicalIndicators.calculateADX(data)).adx;
    case "adx_plus_di": return getCachedResult(cache, "runtime:adx", () => TechnicalIndicators.calculateADX(data)).plusDI;
    case "adx_minus_di": return getCachedResult(cache, "runtime:adx", () => TechnicalIndicators.calculateADX(data)).minusDI;
    case "adx_trend_strength": return getCachedResult(cache, "runtime:adx", () => TechnicalIndicators.calculateADX(data)).trendStrength;
    case "aroon_up": return getCachedResult(cache, "runtime:aroon", () => TechnicalIndicators.calculateAroon(data)).up;
    case "aroon_down": return getCachedResult(cache, "runtime:aroon", () => TechnicalIndicators.calculateAroon(data)).down;
    case "aroon_oscillator": return getCachedResult(cache, "runtime:aroon_oscillator", () => TechnicalIndicators.calculateAroonOscillator(data));
    case "supertrend": return getCachedResult(cache, "runtime:supertrend", () => TechnicalIndicators.calculateSupertrend(data)).supertrend;
    case "supertrend_signal": return getCachedResult(cache, "runtime:supertrend", () => TechnicalIndicators.calculateSupertrend(data)).signal;
    case "vortex_plus": return getCachedResult(cache, "runtime:vortex", () => TechnicalIndicators.calculateVortex(data)).plus;
    case "vortex_minus": return getCachedResult(cache, "runtime:vortex", () => TechnicalIndicators.calculateVortex(data)).minus;
    case "trix": return getCachedResult(cache, "runtime:trix", () => TechnicalIndicators.calculateTRIX(data));
    case "stc": return getCachedResult(cache, "runtime:stc", () => TechnicalIndicators.calculateSTC(data));
    case "mass_index": return getCachedResult(cache, "runtime:mass_index", () => TechnicalIndicators.calculateMassIndex(data));
    case "kst": return getCachedResult(cache, "runtime:kst", () => TechnicalIndicators.calculateKST(data)).kst;
    case "kst_signal": return getCachedResult(cache, "runtime:kst", () => TechnicalIndicators.calculateKST(data)).signalLine;
    case "linear_reg_value": return getCachedResult(cache, "runtime:linear_regression", () => TechnicalIndicators.calculateLinearRegressionIndicator(data)).value;
    case "linear_reg_slope": return getCachedResult(cache, "runtime:linear_regression", () => TechnicalIndicators.calculateLinearRegressionIndicator(data)).slope;
    case "bb_upper": return getCachedResult(cache, "runtime:bollinger", () => TechnicalIndicators.calculateBollinger(data)).upper;
    case "bb_middle": return getCachedResult(cache, "runtime:bollinger", () => TechnicalIndicators.calculateBollinger(data)).middle;
    case "bb_lower": return getCachedResult(cache, "runtime:bollinger", () => TechnicalIndicators.calculateBollinger(data)).lower;
    case "bb_width": return getCachedResult(cache, "runtime:bollinger", () => TechnicalIndicators.calculateBollinger(data)).width;
    case "bb_pct": return getCachedResult(cache, "runtime:bollinger", () => TechnicalIndicators.calculateBollinger(data)).percentB;
    case "donchian_upper": return getCachedResult(cache, "runtime:donchian", () => TechnicalIndicators.calculateDonchianChannels(data)).upper;
    case "donchian_middle": return getCachedResult(cache, "runtime:donchian", () => TechnicalIndicators.calculateDonchianChannels(data)).middle;
    case "donchian_lower": return getCachedResult(cache, "runtime:donchian", () => TechnicalIndicators.calculateDonchianChannels(data)).lower;
    case "keltner_upper": return getCachedResult(cache, "runtime:keltner", () => TechnicalIndicators.calculateKeltnerChannels(data)).upper;
    case "keltner_middle": return getCachedResult(cache, "runtime:keltner", () => TechnicalIndicators.calculateKeltnerChannels(data)).middle;
    case "keltner_lower": return getCachedResult(cache, "runtime:keltner", () => TechnicalIndicators.calculateKeltnerChannels(data)).lower;
    case "std_dev_20": return getCachedResult(cache, "runtime:std_dev_20", () => TechnicalIndicators.calculatePriceStdDev(data, 20));
    case "chaikin_vol": return getCachedResult(cache, "runtime:chaikin_vol", () => TechnicalIndicators.calculateChaikinVolatility(data));
    case "ulcer_index": return getCachedResult(cache, "runtime:ulcer_index", () => TechnicalIndicators.calculateUlcerIndex(data));
    case "obv": return getCachedResult(cache, "runtime:obv", () => TechnicalIndicators.calculateOBV(data));
    case "ad_line": return getCachedResult(cache, "runtime:ad_line", () => TechnicalIndicators.calculateADLine(data));
    case "cmf_20": return getCachedResult(cache, "runtime:cmf_20", () => TechnicalIndicators.calculateCMF(data, 20));
    case "nvi": return getCachedResult(cache, "runtime:nvi", () => TechnicalIndicators.calculateNVI(data));
    case "pvi": return getCachedResult(cache, "runtime:pvi", () => TechnicalIndicators.calculatePVI(data));
    case "chaikin_osc": return getCachedResult(cache, "runtime:chaikin_osc", () => TechnicalIndicators.calculateChaikinOscillator(data));
    case "volume_osc": return getCachedResult(cache, "runtime:volume_osc", () => TechnicalIndicators.calculateVolumeOscillator(data));
    case "klinger_osc": return getCachedResult(cache, "runtime:klinger", () => TechnicalIndicators.calculateKlingerOscillator(data)).oscillator;
    case "klinger_signal": return getCachedResult(cache, "runtime:klinger", () => TechnicalIndicators.calculateKlingerOscillator(data)).signalLine;
    case "elder_force_raw": return getCachedResult(cache, "runtime:elder_force", () => TechnicalIndicators.calculateElderForceIndex(data)).raw;
    case "force_index_13": return getCachedResult(cache, "runtime:elder_force", () => TechnicalIndicators.calculateElderForceIndex(data)).forceIndex13;
    case "vp_poc": return buildVolumeProfileLevel(data, "poc", cache);
    case "vp_vah": return buildVolumeProfileLevel(data, "vah", cache);
    case "vp_val": return buildVolumeProfileLevel(data, "val", cache);
    case "vwap": return getCachedResult(cache, "runtime:vwap", () => TechnicalIndicators.calculateVWAP(data)).vwap;
    case "is_above_vwap": return getCachedResult(cache, "runtime:vwap", () => TechnicalIndicators.calculateVWAP(data)).priceAboveVwap;
    default: return resolveParameterizedRuntimeSeries(key, period, data, cache);
  }
};

const resolveParameterizedRuntimeSeries = (key: string, period: number | null, data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache) => (
  getCachedResult(cache, "runtime:" + key, () => {
    if (key.startsWith("rsi_") && period) return TechnicalIndicators.calculateRSI(data, period);
    if (key.startsWith("cci_") && period) return TechnicalIndicators.calculateCCI(data, period);
    if (key.startsWith("mfi_") && period) return TechnicalIndicators.calculateMFI(data, period);
    if (key.startsWith("williams_r_") && period) return TechnicalIndicators.calculateWilliamsR(data, period);
    if (key.startsWith("roc_") && period) return TechnicalIndicators.calculateROC(data, period);
    if (key.startsWith("momentum_") && period) return TechnicalIndicators.calculateMomentum(data, period);
    if (key.startsWith("cmo_") && period) return TechnicalIndicators.calculateCMO(data, period);
    if (key.startsWith("dpo_") && period) return TechnicalIndicators.calculateDPO(data, period);
    if (key.startsWith("atr_") && period) return TechnicalIndicators.calculateATR(data, period);
    if (key.startsWith("natr_") && period) return TechnicalIndicators.calculateNATR(data, period);
    if (key.startsWith("hv_") && period) return TechnicalIndicators.calculateHistoricalVolatility(data, period);
    if (key.startsWith("vroc_") && period) return TechnicalIndicators.calculateVROC(data, period);
    if (key.startsWith("eom_") && period) return TechnicalIndicators.calculateEOM(data, period);
    return null;
  })
);

const resolveSupportResistanceSeries = (key: string, data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries | null => {
  if (key.startsWith("pivot_fib_")) {
    return readPivotSeries(getCachedResult(cache, "support:pivot_fibonacci", () => TechnicalIndicators.calculatePivotPointsFibonacci(data)), key.replace("pivot_fib_", ""));
  }
  if (key.startsWith("pivot_")) {
    return readPivotSeries(getCachedResult(cache, "support:pivot_standard", () => TechnicalIndicators.calculatePivotPointsStandard(data)), key.replace("pivot_", ""));
  }
  if (key === "golden_cross") return getCachedResult(cache, "support:ma_cross", () => TechnicalIndicators.calculateMovingAverageCrossSignals(data)).goldenCross;
  if (key === "death_cross") return getCachedResult(cache, "support:ma_cross", () => TechnicalIndicators.calculateMovingAverageCrossSignals(data)).deathCross;
  if (["52w_high", "52w_low", "new_52w_high", "new_52w_low"].includes(key)) {
    const levels = getCachedResult(cache, "support:52w", () => TechnicalIndicators.calculateFiftyTwoWeekLevels(data));
    return key === "52w_high" ? levels.high : key === "52w_low" ? levels.low : key === "new_52w_high" ? levels.newHigh : levels.newLow;
  }
  if (["ath", "atl", "new_ath", "new_atl"].includes(key)) {
    const levels = getCachedResult(cache, "support:records", () => TechnicalIndicators.calculateHistoricalRecordLevels(data));
    return key === "ath" ? levels.ath : key === "atl" ? levels.atl : key === "new_ath" ? levels.newAth : levels.newAtl;
  }
  return null;
};

const resolvePriceActionSeries = (key: string, data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries | null => {
  const signals = getCachedResult(cache, "pattern:price_action", () => TechnicalIndicators.calculatePriceActionSignals(data));
  return key in signals ? signals[key as keyof typeof signals] : null;
};

const resolveCandlestickSeries = (key: string, data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries | null => {
  const patterns = getCachedResult(cache, "pattern:candlestick", () => TechnicalIndicators.calculateCandlestickPatterns(data));
  return key in patterns ? patterns[key as keyof typeof patterns] : null;
};

const readPivotSeries = (
  series: ReturnType<typeof TechnicalIndicators.calculatePivotPointsStandard>,
  key: string,
): IndicatorBacktestSeries | null => {
  if (["pivot", "r1", "r2", "r3", "s1", "s2", "s3"].includes(key)) {
    return series[key as keyof typeof series];
  }
  return null;
};

const buildIchimokuCloudColor = (data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries => {
  const ichimoku = getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data));
  return data.map((_, index) => {
    const senkouA = toFiniteNumber(ichimoku.senkouA[index]);
    const senkouB = toFiniteNumber(ichimoku.senkouB[index]);
    if (senkouA === null || senkouB === null) return "-";
    return senkouA > senkouB ? 1 : senkouA < senkouB ? -1 : 0;
  });
};

const buildPriceVsCloud = (data: ChartDataPoint[], cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries => {
  const ichimoku = getCachedResult(cache, "runtime:ichimoku", () => TechnicalIndicators.calculateIchimoku(data));
  return data.map((point, index) => {
    const close = toFiniteNumber(point.close);
    const senkouA = toFiniteNumber(ichimoku.senkouA[index]);
    const senkouB = toFiniteNumber(ichimoku.senkouB[index]);
    if (close === null || senkouA === null || senkouB === null) return "-";
    if (close > Math.max(senkouA, senkouB)) return 1;
    if (close < Math.min(senkouA, senkouB)) return -1;
    return 0;
  });
};

const buildVolumeProfileLevel = (data: ChartDataPoint[], key: "poc" | "vah" | "val", cache?: IndicatorBacktestSeriesCache): IndicatorBacktestSeries => (
  getCachedResult(cache, "runtime:volume_profile_levels", () => buildVolumeProfileLevels(data))[key]
);

const buildVolumeProfileLevels = (data: ChartDataPoint[]): VolumeProfileLevelSeries => {
  const poc = new Array<number | string>(data.length).fill("-");
  const vah = new Array<number | string>(data.length).fill("-");
  const val = new Array<number | string>(data.length).fill("-");
  for (let index = 1; index < data.length; index += 1) {
    const profile = TechnicalIndicators.calculateVolumeProfile(data.slice(0, index + 1));
    if (typeof profile?.poc === "number" && Number.isFinite(profile.poc)) poc[index] = profile.poc;
    if (typeof profile?.vah === "number" && Number.isFinite(profile.vah)) vah[index] = profile.vah;
    if (typeof profile?.val === "number" && Number.isFinite(profile.val)) val[index] = profile.val;
  }
  return { poc, vah, val };
};

const getCachedResult = <T>(cache: IndicatorBacktestSeriesCache | undefined, key: string, factory: () => T): T => {
  if (!cache) return factory();
  if (cache.results.has(key)) return cache.results.get(key) as T;
  const value = factory();
  cache.results.set(key, value);
  return value;
};

const toFiniteNumber = (value: number | string | null | undefined): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);
