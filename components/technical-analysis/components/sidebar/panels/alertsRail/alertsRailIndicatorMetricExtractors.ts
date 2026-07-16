import * as TechnicalIndicators from "../../../../lib/Indicators/TechnicalIndicators";
import type { ChartDataPoint } from "../../../../lib/Indicators/TechnicalIndicators";
import { INDICATOR_RUNTIME_ALERT_DEFINITIONS } from "../../../../config/indicators/indicatorRuntimeAlertCatalog";
import type { IndicatorAlertValue } from "./alertsRailTypes";

export interface RuntimeIndicatorAlertBuildOptions {
  source: string;
  timeframe: string;
  updatedAt?: string;
}

interface RuntimeMetricReading {
  previousValue: number | null;
  value: number;
}

type IndicatorSeries = ReadonlyArray<number | string | null | undefined>;
type MetricExtractor = (data: ChartDataPoint[]) => RuntimeMetricReading | null;

const calculationCache = new WeakMap<ChartDataPoint[], Map<string, unknown>>();

const getCachedCalculation = <T>(data: ChartDataPoint[], key: string, calculate: () => T): T => {
  let scopedCache = calculationCache.get(data);
  if (!scopedCache) {
    scopedCache = new Map<string, unknown>();
    calculationCache.set(data, scopedCache);
  }
  if (scopedCache.has(key)) return scopedCache.get(key) as T;
  const value = calculate();
  scopedCache.set(key, value);
  return value;
};

const getStochastic = (data: ChartDataPoint[]) => getCachedCalculation(data, "stochastic", () => TechnicalIndicators.calculateStochastic(data));
const getStochasticRsi = (data: ChartDataPoint[]) => getCachedCalculation(data, "stochastic-rsi", () => TechnicalIndicators.calculateStochasticRSI(data));
const getTsi = (data: ChartDataPoint[]) => getCachedCalculation(data, "tsi", () => TechnicalIndicators.calculateTSI(data));
const getRvi = (data: ChartDataPoint[]) => getCachedCalculation(data, "rvi", () => TechnicalIndicators.calculateRVI(data));
const getFisher = (data: ChartDataPoint[]) => getCachedCalculation(data, "fisher", () => TechnicalIndicators.calculateFisherTransform(data));
const getElderPower = (data: ChartDataPoint[]) => getCachedCalculation(data, "elder-power", () => TechnicalIndicators.calculateElderBullBearPower(data));
const getMacd = (data: ChartDataPoint[]) => getCachedCalculation(data, "macd", () => TechnicalIndicators.calculateMACD(data));
const getPpo = (data: ChartDataPoint[]) => getCachedCalculation(data, "ppo", () => TechnicalIndicators.calculatePPO(data));
const getParabolicSar = (data: ChartDataPoint[]) => getCachedCalculation(data, "parabolic-sar", () => TechnicalIndicators.calculateParabolicSAR(data));
const getIchimoku = (data: ChartDataPoint[]) => getCachedCalculation(data, "ichimoku", () => TechnicalIndicators.calculateIchimoku(data));
const getAdx = (data: ChartDataPoint[]) => getCachedCalculation(data, "adx", () => TechnicalIndicators.calculateADX(data));
const getAroon = (data: ChartDataPoint[]) => getCachedCalculation(data, "aroon", () => TechnicalIndicators.calculateAroon(data));
const getSupertrend = (data: ChartDataPoint[]) => getCachedCalculation(data, "supertrend", () => TechnicalIndicators.calculateSupertrend(data));
const getVortex = (data: ChartDataPoint[]) => getCachedCalculation(data, "vortex", () => TechnicalIndicators.calculateVortex(data));
const getKst = (data: ChartDataPoint[]) => getCachedCalculation(data, "kst", () => TechnicalIndicators.calculateKST(data));
const getLinearRegression = (data: ChartDataPoint[]) => getCachedCalculation(data, "linear-regression", () => TechnicalIndicators.calculateLinearRegressionIndicator(data));
const getBollinger = (data: ChartDataPoint[]) => getCachedCalculation(data, "bollinger", () => TechnicalIndicators.calculateBollinger(data));
const getDonchian = (data: ChartDataPoint[]) => getCachedCalculation(data, "donchian", () => TechnicalIndicators.calculateDonchianChannels(data));
const getKeltner = (data: ChartDataPoint[]) => getCachedCalculation(data, "keltner", () => TechnicalIndicators.calculateKeltnerChannels(data));
const getVwap = (data: ChartDataPoint[]) => getCachedCalculation(data, "vwap", () => TechnicalIndicators.calculateVWAP(data));
const getKlinger = (data: ChartDataPoint[]) => getCachedCalculation(data, "klinger", () => TechnicalIndicators.calculateKlingerOscillator(data));
const getElderForce = (data: ChartDataPoint[]) => getCachedCalculation(data, "elder-force", () => TechnicalIndicators.calculateElderForceIndex(data));
const getVolumeProfile = (data: ChartDataPoint[]) => getCachedCalculation(data, "volume-profile", () => TechnicalIndicators.calculateVolumeProfile(data));

const fromSeries = (seriesFactory: (data: ChartDataPoint[]) => IndicatorSeries): MetricExtractor => (data) => {
  if (data.length === 0) return null;
  return readLatestPair(seriesFactory(data));
};

const fromAlignedSeries = (seriesFactory: (data: ChartDataPoint[]) => IndicatorSeries): MetricExtractor => (data) => {
  if (data.length === 0) return null;
  const series = seriesFactory(data);
  return readPairAtOrBefore(series, data.length - 1);
};

const fromRollingScalar = (scalarFactory: (data: ChartDataPoint[]) => number | null): MetricExtractor => (data) => {
  if (data.length === 0) return null;
  const value = toFiniteMetric(scalarFactory(data));
  if (value === null) return null;
  const previousValue = data.length > 1 ? toFiniteMetric(scalarFactory(data.slice(0, -1))) : null;
  return { previousValue, value };
};


const readLatestPair = (series: IndicatorSeries): RuntimeMetricReading | null => {
  for (let index = series.length - 1; index >= 0; index -= 1) {
    const value = toFiniteMetric(series[index]);
    if (value === null) continue;
    return { previousValue: readPreviousMetric(series, index - 1), value };
  }
  return null;
};

const readPairAtOrBefore = (series: IndicatorSeries, maxIndex: number): RuntimeMetricReading | null => {
  for (let index = Math.min(maxIndex, series.length - 1); index >= 0; index -= 1) {
    const value = toFiniteMetric(series[index]);
    if (value === null) continue;
    return { previousValue: readPreviousMetric(series, index - 1), value };
  }
  return null;
};

const readPreviousMetric = (series: IndicatorSeries, startIndex: number): number | null => {
  for (let index = startIndex; index >= 0; index -= 1) {
    const value = toFiniteMetric(series[index]);
    if (value !== null) return value;
  }
  return null;
};

const toFiniteMetric = (value: number | string | null | undefined): number | null => (
  typeof value === "number" && Number.isFinite(value) ? roundMetric(value) : null
);


const extractIchimokuCloudColor = (data: ChartDataPoint[]): RuntimeMetricReading | null => {
  const ichimoku = getIchimoku(data);
  return readDerivedAlignedPair(data.length, (index) => {
    const senkouA = toFiniteMetric(ichimoku.senkouA[index]);
    const senkouB = toFiniteMetric(ichimoku.senkouB[index]);
    if (senkouA === null || senkouB === null) return null;
    if (senkouA > senkouB) return 1;
    if (senkouA < senkouB) return -1;
    return 0;
  });
};

const extractPriceVsCloud = (data: ChartDataPoint[]): RuntimeMetricReading | null => {
  const ichimoku = getIchimoku(data);
  return readDerivedAlignedPair(data.length, (index) => {
    const close = toFiniteMetric(data[index]?.close);
    const senkouA = toFiniteMetric(ichimoku.senkouA[index]);
    const senkouB = toFiniteMetric(ichimoku.senkouB[index]);
    if (close === null || senkouA === null || senkouB === null) return null;
    const cloudTop = Math.max(senkouA, senkouB);
    const cloudBottom = Math.min(senkouA, senkouB);
    if (close > cloudTop) return 1;
    if (close < cloudBottom) return -1;
    return 0;
  });
};

const readDerivedAlignedPair = (
  length: number,
  reader: (index: number) => number | null,
): RuntimeMetricReading | null => {
  for (let index = length - 1; index >= 0; index -= 1) {
    const value = toFiniteMetric(reader(index));
    if (value === null) continue;
    let previousValue: number | null = null;
    for (let previousIndex = index - 1; previousIndex >= 0; previousIndex -= 1) {
      previousValue = toFiniteMetric(reader(previousIndex));
      if (previousValue !== null) break;
    }
    return { previousValue, value };
  }
  return null;
};

const getVolumeProfileScalar = (
  data: ChartDataPoint[],
  key: "poc" | "vah" | "val",
): number | null => toFiniteMetric(getVolumeProfile(data)?.[key]);

const METRIC_EXTRACTORS_BY_CATALOG_KEY: Record<string, MetricExtractor> = {
  rsi_9: fromSeries((data) => TechnicalIndicators.calculateRSI(data, 9)),
  rsi_14: fromSeries((data) => TechnicalIndicators.calculateRSI(data, 14)),
  rsi_25: fromSeries((data) => TechnicalIndicators.calculateRSI(data, 25)),
  stoch_k: fromSeries((data) => getStochastic(data).kLine),
  stoch_d: fromSeries((data) => getStochastic(data).dLine),
  stoch_rsi_k: fromSeries((data) => getStochasticRsi(data).kLine),
  stoch_rsi_d: fromSeries((data) => getStochasticRsi(data).dLine),
  cci_14: fromSeries((data) => TechnicalIndicators.calculateCCI(data, 14)),
  cci_20: fromSeries((data) => TechnicalIndicators.calculateCCI(data, 20)),
  mfi_14: fromSeries((data) => TechnicalIndicators.calculateMFI(data, 14)),
  williams_r_14: fromSeries((data) => TechnicalIndicators.calculateWilliamsR(data, 14)),
  roc_10: fromSeries((data) => TechnicalIndicators.calculateROC(data, 10)),
  roc_20: fromSeries((data) => TechnicalIndicators.calculateROC(data, 20)),
  momentum_10: fromSeries((data) => TechnicalIndicators.calculateMomentum(data, 10)),
  momentum_20: fromSeries((data) => TechnicalIndicators.calculateMomentum(data, 20)),
  cmo_14: fromSeries((data) => TechnicalIndicators.calculateCMO(data, 14)),
  dymi: fromSeries((data) => TechnicalIndicators.calculateDYMI(data)),
  ultimate_osc: fromSeries((data) => TechnicalIndicators.calculateUltimateOscillator(data)),
  dpo_20: fromSeries((data) => TechnicalIndicators.calculateDPO(data, 20)),
  tsi: fromSeries((data) => getTsi(data).tsi),
  tsi_signal: fromSeries((data) => getTsi(data).signalLine),
  awesome_osc: fromSeries((data) => TechnicalIndicators.calculateAwesomeOscillator(data)),
  ac_osc: fromSeries((data) => TechnicalIndicators.calculateAcceleratorOscillator(data)),
  rvi: fromSeries((data) => getRvi(data).rvi),
  rvi_signal: fromSeries((data) => getRvi(data).signalLine),
  fisher_transform: fromSeries((data) => getFisher(data).fisher),
  fisher_transform_signal: fromSeries((data) => getFisher(data).signalLine),
  elder_bull_power: fromSeries((data) => getElderPower(data).bull),
  elder_bear_power: fromSeries((data) => getElderPower(data).bear),
  coppock_curve: fromSeries((data) => TechnicalIndicators.calculateCoppockCurve(data)),
  macd_line: fromSeries((data) => getMacd(data).macdLine),
  macd_signal: fromSeries((data) => getMacd(data).signalLine),
  macd_histogram: fromSeries((data) => getMacd(data).histogram),
  macd_ppo: fromSeries((data) => getPpo(data).ppoLine),
  macd_ppo_signal: fromSeries((data) => getPpo(data).signalLine),
  macd_ppo_histogram: fromSeries((data) => getPpo(data).histogram),
  macd_apo: fromSeries((data) => TechnicalIndicators.calculateAPO(data)),
  parabolic_sar: fromSeries((data) => getParabolicSar(data).sar),
  parabolic_sar_signal: fromSeries((data) => getParabolicSar(data).signal),
  ichimoku_tenkan: fromAlignedSeries((data) => getIchimoku(data).tenkan),
  ichimoku_kijun: fromAlignedSeries((data) => getIchimoku(data).kijun),
  ichimoku_senkou_a: fromAlignedSeries((data) => getIchimoku(data).senkouA),
  ichimoku_senkou_b: fromAlignedSeries((data) => getIchimoku(data).senkouB),
  ichimoku_chikou: fromSeries((data) => getIchimoku(data).chikou),
  ichimoku_cloud_color: extractIchimokuCloudColor,
  price_vs_cloud: extractPriceVsCloud,
  adx: fromSeries((data) => getAdx(data).adx),
  adx_plus_di: fromSeries((data) => getAdx(data).plusDI),
  adx_minus_di: fromSeries((data) => getAdx(data).minusDI),
  adx_trend_strength: fromSeries((data) => getAdx(data).trendStrength),
  aroon_up: fromSeries((data) => getAroon(data).up),
  aroon_down: fromSeries((data) => getAroon(data).down),
  aroon_oscillator: fromSeries((data) => TechnicalIndicators.calculateAroonOscillator(data)),
  supertrend: fromSeries((data) => getSupertrend(data).supertrend),
  supertrend_signal: fromSeries((data) => getSupertrend(data).signal),
  vortex_plus: fromSeries((data) => getVortex(data).plus),
  vortex_minus: fromSeries((data) => getVortex(data).minus),
  trix: fromSeries((data) => TechnicalIndicators.calculateTRIX(data)),
  stc: fromSeries((data) => TechnicalIndicators.calculateSTC(data)),
  mass_index: fromSeries((data) => TechnicalIndicators.calculateMassIndex(data)),
  kst: fromSeries((data) => getKst(data).kst),
  kst_signal: fromSeries((data) => getKst(data).signalLine),
  linear_reg_value: fromSeries((data) => getLinearRegression(data).value),
  linear_reg_slope: fromSeries((data) => getLinearRegression(data).slope),
  bb_upper: fromSeries((data) => getBollinger(data).upper),
  bb_middle: fromSeries((data) => getBollinger(data).middle),
  bb_lower: fromSeries((data) => getBollinger(data).lower),
  bb_width: fromSeries((data) => getBollinger(data).width),
  bb_pct: fromSeries((data) => getBollinger(data).percentB),
  atr_14: fromSeries((data) => TechnicalIndicators.calculateATR(data, 14)),
  atr_20: fromSeries((data) => TechnicalIndicators.calculateATR(data, 20)),
  natr_14: fromSeries((data) => TechnicalIndicators.calculateNATR(data, 14)),
  donchian_upper: fromSeries((data) => getDonchian(data).upper),
  donchian_middle: fromSeries((data) => getDonchian(data).middle),
  donchian_lower: fromSeries((data) => getDonchian(data).lower),
  keltner_upper: fromSeries((data) => getKeltner(data).upper),
  keltner_middle: fromSeries((data) => getKeltner(data).middle),
  keltner_lower: fromSeries((data) => getKeltner(data).lower),
  hv_10: fromSeries((data) => TechnicalIndicators.calculateHistoricalVolatility(data, 10)),
  hv_20: fromSeries((data) => TechnicalIndicators.calculateHistoricalVolatility(data, 20)),
  hv_30: fromSeries((data) => TechnicalIndicators.calculateHistoricalVolatility(data, 30)),
  hv_60: fromSeries((data) => TechnicalIndicators.calculateHistoricalVolatility(data, 60)),
  hv_90: fromSeries((data) => TechnicalIndicators.calculateHistoricalVolatility(data, 90)),
  hv_252: fromSeries((data) => TechnicalIndicators.calculateHistoricalVolatility(data, 252)),
  std_dev_20: fromSeries((data) => TechnicalIndicators.calculatePriceStdDev(data, 20)),
  chaikin_vol: fromSeries((data) => TechnicalIndicators.calculateChaikinVolatility(data)),
  ulcer_index: fromSeries((data) => TechnicalIndicators.calculateUlcerIndex(data)),
  obv: fromSeries((data) => TechnicalIndicators.calculateOBV(data)),
  ad_line: fromSeries((data) => TechnicalIndicators.calculateADLine(data)),
  cmf_20: fromSeries((data) => TechnicalIndicators.calculateCMF(data, 20)),
  nvi: fromSeries((data) => TechnicalIndicators.calculateNVI(data)),
  pvi: fromSeries((data) => TechnicalIndicators.calculatePVI(data)),
  chaikin_osc: fromSeries((data) => TechnicalIndicators.calculateChaikinOscillator(data)),
  volume_osc: fromSeries((data) => TechnicalIndicators.calculateVolumeOscillator(data)),
  vroc_14: fromSeries((data) => TechnicalIndicators.calculateVROC(data, 14)),
  klinger_osc: fromSeries((data) => getKlinger(data).oscillator),
  klinger_signal: fromSeries((data) => getKlinger(data).signalLine),
  elder_force_raw: fromSeries((data) => getElderForce(data).raw),
  force_index_13: fromSeries((data) => getElderForce(data).forceIndex13),
  eom_14: fromSeries((data) => TechnicalIndicators.calculateEOM(data, 14)),
  vp_poc: fromRollingScalar((data) => getVolumeProfileScalar(data, "poc")),
  vp_vah: fromRollingScalar((data) => getVolumeProfileScalar(data, "vah")),
  vp_val: fromRollingScalar((data) => getVolumeProfileScalar(data, "val")),
  vwap: fromSeries((data) => getVwap(data).vwap),
  is_above_vwap: fromSeries((data) => getVwap(data).priceAboveVwap),
};

export const getMissingRuntimeIndicatorExtractorKeys = (): string[] => {
  const missing = INDICATOR_RUNTIME_ALERT_DEFINITIONS
    .filter((definition) => !METRIC_EXTRACTORS_BY_CATALOG_KEY[definition.catalogKey])
    .map((definition) => definition.catalogKey);
  return Array.from(new Set(missing)).sort();
};

export const buildRuntimeIndicatorAlertValues = (
  data: ChartDataPoint[],
  options: RuntimeIndicatorAlertBuildOptions,
): Record<string, IndicatorAlertValue> => {
  if (data.length === 0) return {};

  return INDICATOR_RUNTIME_ALERT_DEFINITIONS.reduce<Record<string, IndicatorAlertValue>>((values, definition) => {
    const extractor = METRIC_EXTRACTORS_BY_CATALOG_KEY[definition.catalogKey];
    if (!extractor) return values;

    const reading = extractor(data);
    if (!reading) return values;

    values[definition.runtimeKey] = {
      key: definition.runtimeKey,
      label: definition.label,
      previousValue: reading.previousValue,
      source: options.source,
      timeframe: options.timeframe,
      ...(options.updatedAt ? { updatedAt: options.updatedAt } : {}),
      value: reading.value,
    };
    return values;
  }, {});
};


const roundMetric = (value: number): number => Number(value.toFixed(4));
