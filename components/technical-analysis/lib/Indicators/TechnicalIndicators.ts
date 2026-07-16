// ================================================================================
// Technical indicators library.
// Several moving-window implementations are optimized, but not every indicator is incremental.
// Stochastic, StochRSI, RSI, Bollinger and Ichimoku follow TradingView-compatible formulas
// for the supported settings implemented in this file.
// Bollinger supports BB Width, BB %B, source, offset and population standard deviation (ddof=0).
// Missing/invalid values propagate as "-" where the indicator contract expects it.
// ================================================================================

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradesCount?: number | null;
  trades_count?: number | null;
}

export type VolumeProfileRangeMode = "visible_range" | "fixed_range" | "session" | "last_n_bars";
export type VolumeProfileCalculationQuality = "trade_based" | "intraday_based" | "daily_approximation" | "unavailable";

export interface VolumeProfileRow {
  priceLow: number;
  priceHigh: number;
  priceMid: number;
  totalVolume: number;
  upVolume: number;
  downVolume: number;
  isPoc: boolean;
  isValueArea: boolean;
}

export interface VolumeProfileResult {
  rangeStart: string;
  rangeEnd: string;
  rangeMode: VolumeProfileRangeMode;
  rowSize: number;
  valueAreaPercent: number;
  rows: VolumeProfileRow[];
  poc: number | null;
  vah: number | null;
  val: number | null;
  maxVolume: number;
  totalVolume: number;
  calculationQuality: VolumeProfileCalculationQuality;
}

export interface VolumeProfileOptions {
  rangeMode?: VolumeProfileRangeMode;
  numberOfRows?: number;
  rowSize?: number;
  valueAreaPercent?: number;
  maxBars?: number;
}

export interface PivotPointsSeries {
  pivot: (number | string)[];
  r1: (number | string)[];
  r2: (number | string)[];
  r3: (number | string)[];
  s1: (number | string)[];
  s2: (number | string)[];
  s3: (number | string)[];
}

export interface MovingAverageCrossSignals {
  goldenCross: (number | string)[];
  deathCross: (number | string)[];
}

export interface VwapSeries {
  vwap: (number | string)[];
  priceAboveVwap: (number | string)[];
  priceBelowVwap: (number | string)[];
  distance: (number | string)[];
  distancePct: (number | string)[];
}

export interface FiftyTwoWeekLevels {
  high: (number | string)[];
  low: (number | string)[];
  newHigh: (number | string)[];
  newLow: (number | string)[];
}

export interface HistoricalRecordLevels {
  ath: (number | string)[];
  atl: (number | string)[];
  newAth: (number | string)[];
  newAtl: (number | string)[];
}

export interface PriceActionSignalOptions {
  lookback?: number;
  tickSize?: number;
  minBreakTicks?: number;
  minGapTicks?: number;
}

export interface PriceActionSignals {
  resistance: (number | string)[];
  support: (number | string)[];
  breakoutResistance: (number | string)[];
  breakdownSupport: (number | string)[];
  gapUp: (number | string)[];
  gapDown: (number | string)[];
  trueGapUp: (number | string)[];
  trueGapDown: (number | string)[];
  gapAbs: (number | string)[];
  gapPct: (number | string)[];
  isUpDay: (number | string)[];
  isDownDay: (number | string)[];
  upStreak: (number | string)[];
  downStreak: (number | string)[];
  insideBar: (number | string)[];
  outsideBar: (number | string)[];
}

export type CandlestickPatternMode = "talib_compatible" | "strict_market";

export interface CandlestickPatternOptions {
  tickSize?: number;
  mode?: CandlestickPatternMode;
  bodyShortPeriod?: number;
  bodyLongPeriod?: number;
  bodyDojiPeriod?: number;
  shadowVeryShortPeriod?: number;
  nearPeriod?: number;
  trendFilterPeriod?: number;
  dojiAvgPeriod?: number;
  dojiFactor?: number;
  bodyDojiFactor?: number;
  veryShortShadowAvgPeriod?: number;
  veryShortShadowFactor?: number;
  shadowVeryShortFactor?: number;
  nearAvgPeriod?: number;
  nearFactor?: number;
  farPeriod?: number;
  farFactor?: number;
  equalFactor?: number;
  bodyLongFactor?: number;
  bodyShortFactor?: number;
  penetrationDarkCloud?: number;
  morningEveningPenetration?: number;
  abandonedBabyPenetration?: number;
  matHoldPenetration?: number;
  requireVolumeForPattern?: boolean;
}

export interface CandlestickPatternSignals {
  realBody: (number | string)[];
  highLowRange: (number | string)[];
  upperShadow: (number | string)[];
  lowerShadow: (number | string)[];
  bodyShortAvg: (number | string)[];
  bodyLongAvg: (number | string)[];
  bodyDojiMax: (number | string)[];
  shadowVeryShortMax: (number | string)[];
  nearTolerance: (number | string)[];
  farTolerance: (number | string)[];
  equalTolerance: (number | string)[];
  avgRange10: (number | string)[];
  avgRange5: (number | string)[];
  dojiMaxBody: (number | string)[];
  veryShortShadowMax: (number | string)[];
  nearMidTolerance: (number | string)[];
  uptrend: (number | string)[];
  downtrend: (number | string)[];
  doji: (number | string)[];
  longLeggedDoji: (number | string)[];
  rickshawMan: (number | string)[];
  dragonflyDoji: (number | string)[];
  gravestoneDoji: (number | string)[];
  tristar: (number | string)[];
  bullishTristar: (number | string)[];
  bearishTristar: (number | string)[];
  hammer: (number | string)[];
  hangingMan: (number | string)[];
  takuri: (number | string)[];
  invertedHammer: (number | string)[];
  shootingStar: (number | string)[];
  engulfingBullish: (number | string)[];
  engulfingBearish: (number | string)[];
  haramiBullish: (number | string)[];
  haramiBearish: (number | string)[];
  tweezerTop: (number | string)[];
  tweezerBottom: (number | string)[];
  piercingLine: (number | string)[];
  darkCloudCover: (number | string)[];
  tasukiGap: (number | string)[];
  separatingLines: (number | string)[];
  thrusting: (number | string)[];
  counterattack: (number | string)[];
  morningStar: (number | string)[];
  eveningStar: (number | string)[];
  threeWhiteSoldiers: (number | string)[];
  threeBlackCrows: (number | string)[];
  threeInsideUp: (number | string)[];
  threeInsideDown: (number | string)[];
  uniqueThreeRiver: (number | string)[];
  upsideGapTwoCrows: (number | string)[];
  kickerBull: (number | string)[];
  kickerBear: (number | string)[];
  abandonedBabyBull: (number | string)[];
  abandonedBabyBear: (number | string)[];
  beltHoldBull: (number | string)[];
  beltHoldBear: (number | string)[];
  breakawayBull: (number | string)[];
  breakawayBear: (number | string)[];
  risingThreeMethods: (number | string)[];
  fallingThreeMethods: (number | string)[];
  matHold: (number | string)[];
  gapSideBySideWhite: (number | string)[];
  hikkake: (number | string)[];
  concealingBabySwallow: (number | string)[];
  ladderBottom: (number | string)[];
  ladderBottomBrvm: (number | string)[];
  stickSandwich: (number | string)[];
  marubozuBull: (number | string)[];
  marubozuBear: (number | string)[];
  spinningTop: (number | string)[];
  hammerConfirmed: (number | string)[];
  hangingManConfirmed: (number | string)[];
  invertedHammerConfirmed: (number | string)[];
  shootingStarConfirmed: (number | string)[];
  engulfingBullishConfirmed: (number | string)[];
  engulfingBearishConfirmed: (number | string)[];
  haramiBullishConfirmed: (number | string)[];
  haramiBearishConfirmed: (number | string)[];
  tweezerTopConfirmed: (number | string)[];
  tweezerBottomConfirmed: (number | string)[];
  piercingLineConfirmed: (number | string)[];
  darkCloudCoverConfirmed: (number | string)[];
  tasukiGapConfirmed: (number | string)[];
  separatingLinesConfirmed: (number | string)[];
  thrustingConfirmed: (number | string)[];
  counterattackConfirmed: (number | string)[];
  morningStarConfirmed: (number | string)[];
  eveningStarConfirmed: (number | string)[];
  threeWhiteSoldiersConfirmed: (number | string)[];
  threeBlackCrowsConfirmed: (number | string)[];
  threeInsideUpConfirmed: (number | string)[];
  threeInsideDownConfirmed: (number | string)[];
  uniqueThreeRiverConfirmed: (number | string)[];
  upsideGapTwoCrowsConfirmed: (number | string)[];
  kickerBullConfirmed: (number | string)[];
  kickerBearConfirmed: (number | string)[];
  abandonedBabyBullConfirmed: (number | string)[];
  abandonedBabyBearConfirmed: (number | string)[];
  beltHoldBullConfirmed: (number | string)[];
  beltHoldBearConfirmed: (number | string)[];
  breakawayBullConfirmed: (number | string)[];
  breakawayBearConfirmed: (number | string)[];
  risingThreeMethodsConfirmed: (number | string)[];
  fallingThreeMethodsConfirmed: (number | string)[];
  matHoldConfirmed: (number | string)[];
  gapSideBySideWhiteConfirmed: (number | string)[];
  hikkakeConfirmed: (number | string)[];
  concealingBabySwallowConfirmed: (number | string)[];
  ladderBottomConfirmed: (number | string)[];
  ladderBottomBrvmConfirmed: (number | string)[];
  stickSandwichConfirmed: (number | string)[];
  insufficientHistory: (number | string)[];
  missingOHLC: (number | string)[];
  invalidOHLC: (number | string)[];
  zeroRange: (number | string)[];
  noTradeSession: (number | string)[];
  stalePrice: (number | string)[];
  corporateActionSuspected: (number | string)[];
  lowReliabilityBecauseIlliquid: (number | string)[];
}

/**
 * Generates synthetic chart data for mock mode and UI-only fallbacks.
 * This is not BRVM market data and must not be used for real analysis.
 */
export const generateInitialData = (count: number): ChartDataPoint[] => {
  const data: ChartDataPoint[] = [];
  let basePrice = 58.8;
  let time = new Date("2024-01-01T09:00:00").getTime();

  for (let i = 0; i < count; i++) {
    const volatility = 0.2;
    const change = (Math.random() - 0.5) * volatility;
    const open = basePrice;
    const close = basePrice + change;
    const high = Math.max(open, close) + Math.random() * 0.1;
    const low = Math.min(open, close) - Math.random() * 0.1;
    const volume = Math.floor(Math.random() * 10000) + 500;

    data.push({
      time: new Date(time).toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: volume,
    });

    basePrice = close;
    time += 60 * 60 * 1000;
  }
  return data;
};

/**
 * Simple Moving Average (SMA) - Optimized with Sliding Window.
 * Complexity: O(n)
 */
export const calculateSMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < period) return results;

  let sum = 0;
  // Initial window
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  results[period - 1] = parseFloat((sum / period).toFixed(2));

  // Sliding window
  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period].close + data[i].close;
    results[i] = parseFloat((sum / period).toFixed(2));
  }
  return results;
};

/**
 * Exponential Moving Average (EMA) - Optimized Recursive Implementation.
 * Complexity: O(n)
 */
export const calculateEMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < period) return results;

  const k = 2 / (period + 1);
  // Start with SMA for the first EMA point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEma = sum / period;
  results[period - 1] = parseFloat(prevEma.toFixed(2));

  // Recursive calculation
  for (let i = period; i < data.length; i++) {
    const currentEma = (data[i].close - prevEma) * k + prevEma;
    results[i] = parseFloat(currentEma.toFixed(2));
    prevEma = currentEma;
  }
  return results;
};

const toFinitePriceValue = (value: unknown): number | null => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const toFiniteVolumeValue = (value: unknown): number | null => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const toFiniteTradeCountValue = (point: ChartDataPoint): number | null => {
  const rawValue = point.tradesCount ?? point.trades_count;
  if (rawValue === null || rawValue === undefined) return null;
  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : null;
};

const parseBarTimestampMs = (time: string): number | null => {
  const numericValue = Number(time);
  if (Number.isFinite(numericValue) && numericValue > 0) return numericValue;

  const parsedValue = Date.parse(time);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const resolveSessionKey = (time: string): string | null => {
  const timestampMs = parseBarTimestampMs(time);
  if (timestampMs === null) return null;
  return new Date(timestampMs).toISOString().slice(0, 10);
};

const roundIndicatorValue = (value: number, fractionDigits = 2): number =>
  parseFloat(value.toFixed(fractionDigits));

const calculateMoneyFlowVolume = (point: ChartDataPoint): { moneyFlowVolume: number; volume: number } | null => {
  const high = toFinitePriceValue(point.high);
  const low = toFinitePriceValue(point.low);
  const close = toFinitePriceValue(point.close);
  const volume = toFiniteVolumeValue(point.volume);
  if (high === null || low === null || close === null || volume === null || high < low) return null;

  const moneyFlowMultiplier = high === low ? 0 : (2 * close - high - low) / (high - low);
  return { moneyFlowVolume: moneyFlowMultiplier * volume, volume };
};

const calculateEMAFloatSeries = (
  values: Array<number | string | null>,
  period: number,
): Array<number | null> => {
  const results: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return results;

  const k = 2 / (period + 1);
  let sum = 0;
  let validCount = 0;
  let previousEma: number | null = null;

  for (let index = 0; index < values.length; index++) {
    const currentValue = toFinitePriceValue(values[index]);

    if (currentValue === null) {
      sum = 0;
      validCount = 0;
      previousEma = null;
      continue;
    }

    if (previousEma === null) {
      sum += currentValue;
      validCount += 1;

      if (validCount === period) {
        previousEma = sum / period;
        results[index] = previousEma;
      }
      continue;
    }

    previousEma = currentValue * k + previousEma * (1 - k);
    results[index] = previousEma;
  }

  return results;
};

const calculateWMAFloatSeries = (
  values: Array<number | string | null>,
  period: number,
): Array<number | null> => {
  const results: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return results;

  const denominator = period * (period + 1) / 2;
  let windowSum = 0;
  let weightedSum = 0;
  let invalidCount = 0;

  for (let index = 0; index < period; index++) {
    const value = toFinitePriceValue(values[index]);
    if (value === null) {
      invalidCount += 1;
      continue;
    }
    windowSum += value;
    weightedSum += value * (index + 1);
  }

  if (invalidCount === 0) results[period - 1] = weightedSum / denominator;

  for (let index = period; index < values.length; index++) {
    const previousWindowSum = windowSum;
    const outgoing = toFinitePriceValue(values[index - period]);
    const incoming = toFinitePriceValue(values[index]);

    if (outgoing === null) invalidCount -= 1;
    else windowSum -= outgoing;

    if (incoming === null) invalidCount += 1;
    else windowSum += incoming;

    weightedSum = weightedSum - previousWindowSum + (incoming ?? 0) * period;
    if (invalidCount === 0) results[index] = weightedSum / denominator;
  }

  return results;
};

/**
 * Weighted Moving Average (WMA) on Close.
 * Recent closes receive the highest linear weight.
 * Complexity: O(n)
 */
export const calculateWMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  return calculateWMAFloatSeries(data.map((point) => point.close), period)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));
};

/**
 * Double Exponential Moving Average (DEMA) on Close.
 * Formula: 2 * EMA1 - EMA2, where each EMA is SMA-initialized.
 */
export const calculateDEMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const closeSeries = data.map((point) => point.close);
  const ema1 = calculateEMAFloatSeries(closeSeries, period);
  const ema2 = calculateEMAFloatSeries(ema1, period);

  return ema1.map((value, index) => {
    const secondEma = ema2[index];
    if (value === null || secondEma === null) return "-";
    return roundIndicatorValue(2 * value - secondEma);
  });
};

/**
 * Triple Exponential Moving Average (TEMA) on Close.
 * Formula: 3 * EMA1 - 3 * EMA2 + EMA3, with strict EMA warm-up at each level.
 */
export const calculateTEMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const closeSeries = data.map((point) => point.close);
  const ema1 = calculateEMAFloatSeries(closeSeries, period);
  const ema2 = calculateEMAFloatSeries(ema1, period);
  const ema3 = calculateEMAFloatSeries(ema2, period);

  return ema1.map((value, index) => {
    const secondEma = ema2[index];
    const thirdEma = ema3[index];
    if (value === null || secondEma === null || thirdEma === null) return "-";
    return roundIndicatorValue(3 * value - 3 * secondEma + thirdEma);
  });
};

/**
 * Hull Moving Average (HMA) on Close.
 * Formula: WMA(sqrt(n)) of (2 * WMA(n / 2) - WMA(n)).
 */
export const calculateHMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const halfPeriod = Math.max(1, Math.floor(period / 2));
  const smoothingPeriod = Math.max(1, Math.floor(Math.sqrt(period)));
  const closeSeries = data.map((point) => point.close);
  const halfWma = calculateWMAFloatSeries(closeSeries, halfPeriod);
  const fullWma = calculateWMAFloatSeries(closeSeries, period);
  const rawHma = halfWma.map((value, index) => {
    const fullValue = fullWma[index];
    if (value === null || fullValue === null) return null;
    return 2 * value - fullValue;
  });

  return calculateWMAFloatSeries(rawHma, smoothingPeriod)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));
};

/**
 * Zero Lag Exponential Moving Average (ZLEMA) on Close.
 * Formula: EMA(length) of (2 * Close - Close[lag]), lag = floor((length - 1) / 2).
 */
export const calculateZLEMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const lag = Math.max(0, Math.floor((period - 1) / 2));
  const deLaggedClose = data.map((point, index) => {
    if (index < lag) return null;
    const currentClose = toFinitePriceValue(point.close);
    const laggedClose = toFinitePriceValue(data[index - lag]?.close);
    if (currentClose === null || laggedClose === null) return null;
    return 2 * currentClose - laggedClose;
  });

  return calculateEMAFloatSeries(deLaggedClose, period)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));
};

/**
 * Arnaud Legoux Moving Average (ALMA) on Close.
 * Uses a Gaussian distribution with default offset 0.85 and sigma 6.
 */
export const calculateALMA = (
  data: ChartDataPoint[],
  period: number,
  offset = 0.85,
  sigma = 6,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || sigma <= 0 || data.length < period) return results;

  const m = offset * (period - 1);
  const s = period / sigma;
  const weights = Array.from({ length: period }, (_unused, index) =>
    Math.exp(-((index - m) ** 2) / (2 * s * s))
  );
  const weightSum = weights.reduce((sum, value) => sum + value, 0);

  for (let index = period - 1; index < data.length; index++) {
    let weightedSum = 0;
    let isValidWindow = true;

    for (let offsetIndex = 0; offsetIndex < period; offsetIndex++) {
      const close = toFinitePriceValue(data[index - period + 1 + offsetIndex].close);
      if (close === null) {
        isValidWindow = false;
        break;
      }
      weightedSum += close * weights[offsetIndex];
    }

    if (isValidWindow) results[index] = roundIndicatorValue(weightedSum / weightSum);
  }

  return results;
};

/**
 * Smoothed Moving Average (SMMA/RMA/Wilder style) on Close.
 * Initial value is SMA(n), then alpha = 1 / n.
 */
export const calculateSMMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return results;

  let sum = 0;
  for (let index = 0; index < period; index++) {
    const close = toFinitePriceValue(data[index].close);
    if (close === null) return results;
    sum += close;
  }

  let previousSmma = sum / period;
  results[period - 1] = roundIndicatorValue(previousSmma);

  for (let index = period; index < data.length; index++) {
    const close = toFinitePriceValue(data[index].close);
    if (close === null) continue;
    previousSmma = previousSmma + (close - previousSmma) / period;
    results[index] = roundIndicatorValue(previousSmma);
  }

  return results;
};

/**
 * Kaufman Adaptive Moving Average (KAMA) on Close.
 * ER length is the displayed period; fast and slow lengths default to 2 and 30.
 */
export const calculateKAMA = (
  data: ChartDataPoint[],
  erLength: number,
  fastLength = 2,
  slowLength = 30,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (erLength <= 0 || fastLength <= 0 || slowLength <= 0 || data.length < erLength) return results;

  let sum = 0;
  for (let index = 0; index < erLength; index++) {
    const close = toFinitePriceValue(data[index].close);
    if (close === null) return results;
    sum += close;
  }

  const fastSc = 2 / (fastLength + 1);
  const slowSc = 2 / (slowLength + 1);
  let previousKama = sum / erLength;
  results[erLength - 1] = roundIndicatorValue(previousKama);

  for (let index = erLength; index < data.length; index++) {
    const close = toFinitePriceValue(data[index].close);
    const laggedClose = toFinitePriceValue(data[index - erLength].close);
    if (close === null || laggedClose === null) continue;

    let volatility = 0;
    let validVolatility = true;

    for (let innerIndex = index - erLength + 1; innerIndex <= index; innerIndex++) {
      const currentClose = toFinitePriceValue(data[innerIndex].close);
      const previousClose = toFinitePriceValue(data[innerIndex - 1].close);
      if (currentClose === null || previousClose === null) {
        validVolatility = false;
        break;
      }
      volatility += Math.abs(currentClose - previousClose);
    }

    if (!validVolatility) continue;

    const change = Math.abs(close - laggedClose);
    const efficiencyRatio = volatility > 0 ? change / volatility : 0;
    const smoothingConstant = (efficiencyRatio * (fastSc - slowSc) + slowSc) ** 2;
    previousKama = previousKama + smoothingConstant * (close - previousKama);
    results[index] = roundIndicatorValue(previousKama);
  }

  return results;
};

/**
 * Volume Weighted Moving Average (VWMA) on Close.
 * Returns no value when the rolling volume sum is zero or unavailable.
 */
export const calculateVWMA = (data: ChartDataPoint[], period: number): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return results;

  let priceVolumeSum = 0;
  let volumeSum = 0;
  let invalidCount = 0;

  for (let index = 0; index < period; index++) {
    const close = toFinitePriceValue(data[index].close);
    const volume = toFinitePriceValue(data[index].volume);
    if (close === null || volume === null) {
      invalidCount += 1;
      continue;
    }
    priceVolumeSum += close * volume;
    volumeSum += volume;
  }

  if (invalidCount === 0 && volumeSum > 0) results[period - 1] = roundIndicatorValue(priceVolumeSum / volumeSum);

  for (let index = period; index < data.length; index++) {
    const outgoingClose = toFinitePriceValue(data[index - period].close);
    const outgoingVolume = toFinitePriceValue(data[index - period].volume);
    const incomingClose = toFinitePriceValue(data[index].close);
    const incomingVolume = toFinitePriceValue(data[index].volume);

    if (outgoingClose === null || outgoingVolume === null) {
      invalidCount -= 1;
    } else {
      priceVolumeSum -= outgoingClose * outgoingVolume;
      volumeSum -= outgoingVolume;
    }

    if (incomingClose === null || incomingVolume === null) {
      invalidCount += 1;
    } else {
      priceVolumeSum += incomingClose * incomingVolume;
      volumeSum += incomingVolume;
    }

    if (invalidCount === 0 && volumeSum > 0) results[index] = roundIndicatorValue(priceVolumeSum / volumeSum);
  }

  return results;
};

/**
 * Relative Strength Index (RSI) - Optimized with Wilder's Smoothing (RMA).
 * Complexity: O(n)
 * Uses Wilder RMA smoothing, matching the supported RSI formula.
 */
export const calculateRSI = (data: ChartDataPoint[], period: number = 14): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= period) return results;

  let avgGain = 0;
  let avgLoss = 0;

  // Initial Average (Simple)
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }
  avgGain /= period;
  avgLoss /= period;

  const firstRS = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  results[period] = parseFloat(firstRS.toFixed(2));

  // Wilder's Smoothing (RMA)
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      results[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      results[i] = parseFloat((100 - 100 / (1 + rs)).toFixed(2));
    }
  }
  return results;
};

/**
 * Moving Average Convergence Divergence (MACD).
 */
export const calculateMACD = (
  data: ChartDataPoint[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);

  const macdLine: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  const histogram: (number | string)[] = new Array(data.length).fill("-");

  // Calculate MACD Line
  for (let i = 0; i < data.length; i++) {
    const f = emaFast[i];
    const s = emaSlow[i];
    if (typeof f === "number" && typeof s === "number") {
      macdLine[i] = f - s;
    }
  }

  // Calculate Signal Line (EMA of MACD Line)
  const k = 2 / (signalPeriod + 1);
  let firstValidIdx = -1;
  let signalEma = 0;

  for (let i = 0; i < macdLine.length; i++) {
    const val = macdLine[i];
    if (typeof val === "number") {
      if (firstValidIdx === -1) {
        // Wait for enough points to start Signal EMA
        let validCount = 0;
        let sum = 0;
        for (let j = 0; j <= i; j++) {
          if (typeof macdLine[j] === "number") {
            sum += macdLine[j] as number;
            validCount++;
          }
        }
        if (validCount >= signalPeriod) {
          firstValidIdx = i;
          signalEma = sum / validCount;
          signalLine[i] = parseFloat(signalEma.toFixed(4));
          histogram[i] = parseFloat((val - signalEma).toFixed(4));
        }
      } else {
        signalEma = (val - signalEma) * k + signalEma;
        signalLine[i] = parseFloat(signalEma.toFixed(4));
        histogram[i] = parseFloat((val - signalEma).toFixed(4));
      }
    }
  }

  return { macdLine, signalLine, histogram };
};

export const calculatePPO = (
  data: ChartDataPoint[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): { ppoLine: (number | string)[]; signalLine: (number | string)[]; histogram: (number | string)[] } => {
  const ppoLine: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  const histogram: (number | string)[] = new Array(data.length).fill("-");
  if (fastPeriod <= 0 || slowPeriod <= 0 || signalPeriod <= 0 || data.length < slowPeriod) {
    return { ppoLine, signalLine, histogram };
  }

  const closeSeries = data.map((point) => point.close);
  const emaFast = calculateEMAFloatSeries(closeSeries, fastPeriod);
  const emaSlow = calculateEMAFloatSeries(closeSeries, slowPeriod);
  const rawPpo: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 0; index < data.length; index++) {
    const fast = emaFast[index];
    const slow = emaSlow[index];
    if (fast === null || slow === null || slow === 0) continue;

    const value = ((fast - slow) / slow) * 100;
    rawPpo[index] = value;
    ppoLine[index] = roundIndicatorValue(value);
  }

  const signal = calculateEMAFloatSeries(rawPpo, signalPeriod);
  for (let index = 0; index < data.length; index++) {
    const ppoValue = rawPpo[index];
    const signalValue = signal[index];
    if (ppoValue === null || signalValue === null) continue;

    signalLine[index] = roundIndicatorValue(signalValue);
    histogram[index] = roundIndicatorValue(ppoValue - signalValue);
  }

  return { ppoLine, signalLine, histogram };
};

export const calculateAPO = (
  data: ChartDataPoint[],
  fastPeriod = 12,
  slowPeriod = 26,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (fastPeriod <= 0 || slowPeriod <= 0 || data.length < slowPeriod) return results;

  const closeSeries = data.map((point) => point.close);
  const emaFast = calculateEMAFloatSeries(closeSeries, fastPeriod);
  const emaSlow = calculateEMAFloatSeries(closeSeries, slowPeriod);

  for (let index = 0; index < data.length; index++) {
    const fast = emaFast[index];
    const slow = emaSlow[index];
    if (fast === null || slow === null) continue;
    results[index] = roundIndicatorValue(fast - slow);
  }

  return results;
};

export const calculateParabolicSAR = (
  data: ChartDataPoint[],
  start = 0.02,
  increment = 0.02,
  maximum = 0.2,
): { sar: (number | string)[]; signal: (number | string)[] } => {
  const sar: (number | string)[] = new Array(data.length).fill("-");
  const signal: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < 2 || start <= 0 || increment <= 0 || maximum <= 0) return { sar, signal };

  const first = data[0];
  const second = data[1];
  if (![first.high, first.low, first.close, second.high, second.low, second.close].every(Number.isFinite)) {
    return { sar, signal };
  }

  let isUptrend = second.close >= first.close;
  let acceleration = start;
  let extremePoint = isUptrend ? Math.max(first.high, second.high) : Math.min(first.low, second.low);
  let previousSar = isUptrend ? Math.min(first.low, second.low) : Math.max(first.high, second.high);

  sar[1] = roundIndicatorValue(previousSar);
  signal[1] = isUptrend ? 1 : -1;

  for (let index = 2; index < data.length; index++) {
    const current = data[index];
    const oneBack = data[index - 1];
    const twoBack = data[index - 2];
    const values = [current.high, current.low, oneBack.high, oneBack.low, twoBack.high, twoBack.low];
    if (!values.every(Number.isFinite)) continue;

    let nextSar = previousSar + acceleration * (extremePoint - previousSar);

    if (isUptrend) {
      nextSar = Math.min(nextSar, oneBack.low, twoBack.low);
      if (current.low < nextSar) {
        isUptrend = false;
        nextSar = extremePoint;
        extremePoint = current.low;
        acceleration = start;
      } else if (current.high > extremePoint) {
        extremePoint = current.high;
        acceleration = Math.min(maximum, acceleration + increment);
      }
    } else {
      nextSar = Math.max(nextSar, oneBack.high, twoBack.high);
      if (current.high > nextSar) {
        isUptrend = true;
        nextSar = extremePoint;
        extremePoint = current.high;
        acceleration = start;
      } else if (current.low < extremePoint) {
        extremePoint = current.low;
        acceleration = Math.min(maximum, acceleration + increment);
      }
    }

    sar[index] = roundIndicatorValue(nextSar);
    signal[index] = isUptrend ? 1 : -1;
    previousSar = nextSar;
  }

  return { sar, signal };
};

/**
 * Bollinger Bands for the supported TradingView-compatible settings.
 * Optimized with O(n) Sliding Window Variance.
 * Enforces ddof=0 (population standard deviation) and supports source/offset inputs.
 */
export const calculateBollinger = (
  data: ChartDataPoint[],
  period = 20,
  multiplier = 2,
  source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4" = "close",
  offset = 0
) => {
  // If offset > 0, the arrays need to be longer to hold the future projection
  const outLen = data.length + Math.max(0, offset);
  const upper: (number | string)[] = new Array(outLen).fill("-");
  const middle: (number | string)[] = new Array(outLen).fill("-");
  const lower: (number | string)[] = new Array(outLen).fill("-");
  const width: (number | string)[] = new Array(outLen).fill("-");
  const percentB: (number | string)[] = new Array(outLen).fill("-");

  if (data.length < period) return { upper, middle, lower, width, percentB };

  const getSourcePrice = (bar: ChartDataPoint) => {
    switch (source) {
      case "open": return bar.open;
      case "high": return bar.high;
      case "low": return bar.low;
      case "close": return bar.close;
      case "hl2": return (bar.high + bar.low) / 2;
      case "hlc3": return (bar.high + bar.low + bar.close) / 3;
      case "ohlc4": return (bar.open + bar.high + bar.low + bar.close) / 4;
      case "hlcc4": return (bar.high + bar.low + bar.close + bar.close) / 4;
      default: return bar.close;
    }
  };

  let sum = 0;
  let sumSq = 0;

  // Initial window
  for (let i = 0; i < period; i++) {
    const val = getSourcePrice(data[i]);
    sum += val;
    sumSq += val * val;
  }

  const updateBands = (idx: number, s: number, s2: number) => {
    const targetIdx = idx + offset;
    if (targetIdx < 0 || targetIdx >= outLen) return;

    const avg = s / period;
    // Population variance (ddof=0) matches TradingView standard
    const variance = (s2 / period) - (avg * avg);
    // Zero-Division Shield & Float Precision Guard
    const stdDev = Math.sqrt(Math.max(0, variance));

    const up = avg + multiplier * stdDev;
    const dn = avg - multiplier * stdDev;

    middle[targetIdx] = parseFloat(avg.toFixed(4));
    upper[targetIdx] = parseFloat(up.toFixed(4));
    lower[targetIdx] = parseFloat(dn.toFixed(4));
  };

  // Calculate for the first valid window
  updateBands(period - 1, sum, sumSq);

  // Sliding window for the rest
  for (let i = period; i < data.length; i++) {
    const outVal = getSourcePrice(data[i - period]);
    const inVal = getSourcePrice(data[i]);
    sum = sum - outVal + inVal;
    sumSq = sumSq - (outVal * outVal) + (inVal * inVal);
    updateBands(i, sum, sumSq);
  }

  // Calculate Width and %B from the shifted bands and current close.
  for (let i = 0; i < data.length; i++) {
    const up = upper[i];
    const dn = lower[i];
    const mid = middle[i];

    if (typeof up === "number" && typeof dn === "number" && typeof mid === "number") {
      if (mid !== 0) {
        width[i] = parseFloat((((up - dn) / mid) * 100).toFixed(4));
      }
      const bandRange = up - dn;
      if (bandRange !== 0) {
        percentB[i] = parseFloat(((data[i].close - dn) / bandRange).toFixed(4));
      }
    }
  }

  return { upper, middle, lower, width, percentB };
};

/**
 * Stochastic Oscillator for the supported TradingView-compatible settings.
 * Formula:
 * rawK = 100 * (close - lowest(low, periodK)) / (highest(high, periodK) - lowest(low, periodK))
 * %K = SMA(rawK, smoothK)
 * %D = SMA(%K, periodD)
 * Strict NaN ("-") propagation.
 */
export const calculateStochastic = (
  data: ChartDataPoint[],
  periodK = 14,
  smoothK = 3,
  periodD = 3
) => {
  const rawK: (number | string)[] = new Array(data.length).fill("-");
  const kLine: (number | string)[] = new Array(data.length).fill("-");
  const dLine: (number | string)[] = new Array(data.length).fill("-");

  if (data.length < periodK) return { kLine, dLine };

  // 1. Calculate Raw %K
  for (let i = periodK - 1; i < data.length; i++) {
    let low = Infinity;
    let high = -Infinity;
    for (let j = 0; j < periodK; j++) {
      const d = data[i - j];
      if (d.low < low) low = d.low;
      if (d.high > high) high = d.high;
    }
    const denom = high - low;
    // Zero-Division Shield
    rawK[i] = denom === 0 ? "-" : ((data[i].close - low) / denom) * 100;
  }

  // 2. Smooth %K (SMA of rawK)
  for (let i = periodK + smoothK - 2; i < data.length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = 0; j < smoothK; j++) {
      const val = rawK[i - j];
      if (val === "-") {
        valid = false;
        break;
      }
      sum += val as number;
    }
    kLine[i] = valid ? parseFloat((sum / smoothK).toFixed(2)) : "-";
  }

  // 3. Smooth %D (SMA of kLine)
  for (let i = periodK + smoothK + periodD - 3; i < data.length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = 0; j < periodD; j++) {
      const val = kLine[i - j];
      if (val === "-") {
        valid = false;
        break;
      }
      sum += val as number;
    }
    dLine[i] = valid ? parseFloat((sum / periodD).toFixed(2)) : "-";
  }

  return { kLine, dLine };
};

/**
 * Stochastic RSI for the supported TradingView-compatible settings.
 * Formula:
 * rsi = RSI(close, rsiLength)
 * rawStochRsi = 100 * (rsi - lowest(rsi, stochLength)) / (highest(rsi, stochLength) - lowest(rsi, stochLength))
 * %K = SMA(rawStochRsi, smoothK)
 * %D = SMA(%K, smoothD)
 * Strict NaN ("-") propagation.
 */
export const calculateStochasticRSI = (
  data: ChartDataPoint[],
  rsiLength = 14,
  stochLength = 14,
  smoothK = 3,
  smoothD = 3
) => {
  const rsi = calculateRSI(data, rsiLength);
  const rawStochRsi: (number | string)[] = new Array(data.length).fill("-");
  const kLine: (number | string)[] = new Array(data.length).fill("-");
  const dLine: (number | string)[] = new Array(data.length).fill("-");

  // 1. Calculate Raw StochRSI
  for (let i = rsiLength + stochLength - 1; i < data.length; i++) {
    let low = Infinity;
    let high = -Infinity;
    let valid = true;

    for (let j = 0; j < stochLength; j++) {
      const val = rsi[i - j];
      if (val === "-") {
        valid = false;
        break;
      }
      const num = val as number;
      if (num < low) low = num;
      if (num > high) high = num;
    }

    if (!valid) continue;

    const denom = high - low;
    // Zero-Division Shield
    rawStochRsi[i] = denom === 0 ? "-" : (((rsi[i] as number) - low) / denom) * 100;
  }

  // 2. Smooth %K (SMA of rawStochRsi)
  for (let i = rsiLength + stochLength + smoothK - 2; i < data.length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = 0; j < smoothK; j++) {
      const val = rawStochRsi[i - j];
      if (val === "-") {
        valid = false;
        break;
      }
      sum += val as number;
    }
    kLine[i] = valid ? parseFloat((sum / smoothK).toFixed(2)) : "-";
  }

  // 3. Smooth %D (SMA of kLine)
  for (let i = rsiLength + stochLength + smoothK + smoothD - 3; i < data.length; i++) {
    let sum = 0;
    let valid = true;
    for (let j = 0; j < smoothD; j++) {
      const val = kLine[i - j];
      if (val === "-") {
        valid = false;
        break;
      }
      sum += val as number;
    }
    dLine[i] = valid ? parseFloat((sum / smoothD).toFixed(2)) : "-";
  }

  return { kLine, dLine };
};

/**
 * Average True Range (ATR).
 */
export const calculateATR = (data: ChartDataPoint[], period = 14): (number | string)[] => {
  return calculateTrueRangeRmaSeries(data, period)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));
};

export const calculateNATR = (data: ChartDataPoint[], period = 14): (number | string)[] => {
  const atrSeries = calculateTrueRangeRmaSeries(data, period);
  return atrSeries.map((atrValue, index) => {
    const close = toFinitePriceValue(data[index]?.close);
    if (atrValue === null || close === null || close <= 0) return "-";
    return roundIndicatorValue((atrValue / close) * 100, 4);
  });
};

const calculateRollingExtremeSeries = (
  data: ChartDataPoint[],
  period: number,
  field: "high" | "low",
  mode: "highest" | "lowest",
): Array<number | null> => {
  const results: Array<number | null> = new Array(data.length).fill(null);
  if (period <= 0 || data.length < period) return results;

  const deque: number[] = [];
  let invalidCount = 0;

  for (let index = 0; index < data.length; index++) {
    const incoming = toFinitePriceValue(data[index][field]);
    if (incoming === null) {
      invalidCount += 1;
    } else {
      while (deque.length > 0) {
        const queued = toFinitePriceValue(data[deque[deque.length - 1]][field]);
        if (queued === null) break;
        const shouldReplace = mode === "highest" ? incoming >= queued : incoming <= queued;
        if (!shouldReplace) break;
        deque.pop();
      }
      deque.push(index);
    }

    if (index >= period) {
      const outgoing = toFinitePriceValue(data[index - period][field]);
      if (outgoing === null) invalidCount -= 1;
    }

    while (deque.length > 0 && deque[0] <= index - period) {
      deque.shift();
    }

    if (index >= period - 1 && invalidCount === 0 && deque.length > 0) {
      results[index] = toFinitePriceValue(data[deque[0]][field]);
    }
  }

  return results;
};

export const calculateDonchianChannels = (
  data: ChartDataPoint[],
  period = 20,
): { upper: (number | string)[]; middle: (number | string)[]; lower: (number | string)[] } => {
  const upper: (number | string)[] = new Array(data.length).fill("-");
  const middle: (number | string)[] = new Array(data.length).fill("-");
  const lower: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return { upper, middle, lower };

  const highSeries = calculateRollingExtremeSeries(data, period, "high", "highest");
  const lowSeries = calculateRollingExtremeSeries(data, period, "low", "lowest");

  for (let index = 0; index < data.length; index++) {
    const high = highSeries[index];
    const low = lowSeries[index];
    if (high === null || low === null) continue;
    upper[index] = roundIndicatorValue(high);
    middle[index] = roundIndicatorValue((high + low) / 2);
    lower[index] = roundIndicatorValue(low);
  }

  return { upper, middle, lower };
};

export const calculateKeltnerChannels = (
  data: ChartDataPoint[],
  length = 20,
  multiplier = 2,
  atrLength = 20,
): { upper: (number | string)[]; middle: (number | string)[]; lower: (number | string)[] } => {
  const upper: (number | string)[] = new Array(data.length).fill("-");
  const middle: (number | string)[] = new Array(data.length).fill("-");
  const lower: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || atrLength <= 0 || multiplier < 0 || data.length < Math.max(length, atrLength)) {
    return { upper, middle, lower };
  }

  const basisSeries = calculateEMAFloatSeries(data.map((point) => point.close), length);
  const atrSeries = calculateTrueRangeRmaSeries(data, atrLength);

  for (let index = 0; index < data.length; index++) {
    const basis = basisSeries[index];
    const atr = atrSeries[index];
    if (basis === null || atr === null) continue;
    upper[index] = roundIndicatorValue(basis + multiplier * atr);
    middle[index] = roundIndicatorValue(basis);
    lower[index] = roundIndicatorValue(basis - multiplier * atr);
  }

  return { upper, middle, lower };
};

const calculateRollingPopulationStdDevSeries = (
  values: Array<number | string | null>,
  period: number,
): Array<number | null> => {
  const results: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return results;

  let sum = 0;
  let sumSquares = 0;
  let invalidCount = 0;

  for (let index = 0; index < values.length; index++) {
    const incoming = toFinitePriceValue(values[index]);
    if (incoming === null) {
      invalidCount += 1;
    } else {
      sum += incoming;
      sumSquares += incoming * incoming;
    }

    if (index >= period) {
      const outgoing = toFinitePriceValue(values[index - period]);
      if (outgoing === null) invalidCount -= 1;
      else {
        sum -= outgoing;
        sumSquares -= outgoing * outgoing;
      }
    }

    if (index >= period - 1 && invalidCount === 0) {
      const mean = sum / period;
      const variance = Math.max(0, sumSquares / period - mean * mean);
      results[index] = Math.sqrt(variance);
    }
  }

  return results;
};

export const calculateHistoricalVolatility = (
  data: ChartDataPoint[],
  period: number,
  annualizationFactor = 252,
): (number | string)[] => {
  const logReturns: Array<number | null> = new Array(data.length).fill(null);
  if (period <= 0 || annualizationFactor <= 0 || data.length < period + 1) {
    return new Array(data.length).fill("-");
  }

  for (let index = 1; index < data.length; index++) {
    const currentClose = toFinitePriceValue(data[index].close);
    const previousClose = toFinitePriceValue(data[index - 1].close);
    if (currentClose === null || previousClose === null || currentClose <= 0 || previousClose <= 0) continue;
    logReturns[index] = Math.log(currentClose / previousClose);
  }

  const annualizationScale = Math.sqrt(annualizationFactor) * 100;
  return calculateRollingPopulationStdDevSeries(logReturns, period)
    .map((value) => value === null ? "-" : roundIndicatorValue(value * annualizationScale));
};

export const calculatePriceStdDev = (
  data: ChartDataPoint[],
  period = 20,
): (number | string)[] => {
  return calculateRollingPopulationStdDevSeries(data.map((point) => point.close), period)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));
};

export const calculateChaikinVolatility = (
  data: ChartDataPoint[],
  emaLength = 10,
  rocLength = 10,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (emaLength <= 0 || rocLength <= 0 || data.length < emaLength + rocLength) return results;

  const ranges = data.map((point) => {
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    if (high === null || low === null || high < low) return null;
    return high - low;
  });
  const smoothedRange = calculateEMAFloatSeries(ranges, emaLength);

  for (let index = rocLength; index < data.length; index++) {
    const current = smoothedRange[index];
    const previous = smoothedRange[index - rocLength];
    if (current === null || previous === null || previous === 0) continue;
    results[index] = roundIndicatorValue(((current - previous) / previous) * 100);
  }

  return results;
};

export const calculateCMF = (
  data: ChartDataPoint[],
  period = 20,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return results;

  const moneyFlow = data.map(calculateMoneyFlowVolume);
  let moneyFlowVolumeSum = 0;
  let volumeSum = 0;
  let invalidCount = 0;

  for (let index = 0; index < period; index++) {
    const point = moneyFlow[index];
    if (point === null) {
      invalidCount += 1;
      continue;
    }
    moneyFlowVolumeSum += point.moneyFlowVolume;
    volumeSum += point.volume;
  }

  if (invalidCount === 0 && volumeSum > 0) {
    results[period - 1] = roundIndicatorValue(moneyFlowVolumeSum / volumeSum, 4);
  }

  for (let index = period; index < data.length; index++) {
    const outgoing = moneyFlow[index - period];
    const incoming = moneyFlow[index];

    if (outgoing === null) {
      invalidCount -= 1;
    } else {
      moneyFlowVolumeSum -= outgoing.moneyFlowVolume;
      volumeSum -= outgoing.volume;
    }

    if (incoming === null) {
      invalidCount += 1;
    } else {
      moneyFlowVolumeSum += incoming.moneyFlowVolume;
      volumeSum += incoming.volume;
    }

    if (invalidCount === 0 && volumeSum > 0) {
      results[index] = roundIndicatorValue(moneyFlowVolumeSum / volumeSum, 4);
    }
  }

  return results;
};

export const calculateUlcerIndex = (
  data: ChartDataPoint[],
  length = 14,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || data.length < length) return results;

  for (let index = length - 1; index < data.length; index++) {
    let highestClose = Number.NEGATIVE_INFINITY;
    let isValid = true;

    for (let offset = 0; offset < length; offset++) {
      const close = toFinitePriceValue(data[index - offset].close);
      if (close === null) {
        isValid = false;
        break;
      }
      highestClose = Math.max(highestClose, close);
    }

    if (!isValid || highestClose <= 0) continue;

    let squaredDrawdownSum = 0;
    for (let offset = 0; offset < length; offset++) {
      const close = toFinitePriceValue(data[index - offset].close);
      if (close === null) {
        isValid = false;
        break;
      }
      const drawdownPct = ((close - highestClose) / highestClose) * 100;
      squaredDrawdownSum += drawdownPct * drawdownPct;
    }

    if (isValid) results[index] = roundIndicatorValue(Math.sqrt(squaredDrawdownSum / length));
  }

  return results;
};

const classifyAdxTrendStrength = (adx: number): number => {
  if (adx < 20) return 0;
  if (adx < 25) return 1;
  if (adx < 50) return 2;
  if (adx < 75) return 3;
  return 4;
};

export const calculateADX = (
  data: ChartDataPoint[],
  period = 14,
): {
  adx: (number | string)[];
  plusDI: (number | string)[];
  minusDI: (number | string)[];
  trendStrength: (number | string)[];
} => {
  const adx: (number | string)[] = new Array(data.length).fill("-");
  const plusDI: (number | string)[] = new Array(data.length).fill("-");
  const minusDI: (number | string)[] = new Array(data.length).fill("-");
  const trendStrength: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length <= period) return { adx, plusDI, minusDI, trendStrength };

  let smoothedTrueRange = 0;
  let smoothedPlusDm = 0;
  let smoothedMinusDm = 0;

  const directionalMoveAt = (index: number): { tr: number; plusDm: number; minusDm: number } | null => {
    const current = data[index];
    const previous = data[index - 1];
    if (!current || !previous) return null;
    const values = [current.high, current.low, current.close, previous.high, previous.low, previous.close];
    if (!values.every(Number.isFinite)) return null;

    const upMove = current.high - previous.high;
    const downMove = previous.low - current.low;
    const plusDm = upMove > downMove && upMove > 0 ? upMove : 0;
    const minusDm = downMove > upMove && downMove > 0 ? downMove : 0;
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    );

    return { tr, plusDm, minusDm };
  };

  for (let index = 1; index <= period; index++) {
    const move = directionalMoveAt(index);
    if (move === null) return { adx, plusDI, minusDI, trendStrength };
    smoothedTrueRange += move.tr;
    smoothedPlusDm += move.plusDm;
    smoothedMinusDm += move.minusDm;
  }

  let dxSum = 0;
  let dxCount = 0;
  let previousAdx: number | null = null;

  const pushDirectionalValues = (index: number): number | null => {
    if (smoothedTrueRange <= 0) return null;

    const plus = 100 * smoothedPlusDm / smoothedTrueRange;
    const minus = 100 * smoothedMinusDm / smoothedTrueRange;
    plusDI[index] = roundIndicatorValue(plus);
    minusDI[index] = roundIndicatorValue(minus);

    const directionalSum = plus + minus;
    if (directionalSum <= 0) return null;
    return 100 * Math.abs(plus - minus) / directionalSum;
  };

  const pushAdxValue = (index: number, dx: number | null): void => {
    if (dx === null) return;
    if (previousAdx === null) {
      dxSum += dx;
      dxCount += 1;
      if (dxCount === period) {
        previousAdx = dxSum / period;
        adx[index] = roundIndicatorValue(previousAdx);
        trendStrength[index] = classifyAdxTrendStrength(previousAdx);
      }
      return;
    }

    previousAdx = (previousAdx * (period - 1) + dx) / period;
    adx[index] = roundIndicatorValue(previousAdx);
    trendStrength[index] = classifyAdxTrendStrength(previousAdx);
  };

  pushAdxValue(period, pushDirectionalValues(period));

  for (let index = period + 1; index < data.length; index++) {
    const move = directionalMoveAt(index);
    if (move === null) continue;

    smoothedTrueRange = smoothedTrueRange - smoothedTrueRange / period + move.tr;
    smoothedPlusDm = smoothedPlusDm - smoothedPlusDm / period + move.plusDm;
    smoothedMinusDm = smoothedMinusDm - smoothedMinusDm / period + move.minusDm;

    pushAdxValue(index, pushDirectionalValues(index));
  }

  return { adx, plusDI, minusDI, trendStrength };
};

export const calculateAroon = (
  data: ChartDataPoint[],
  period = 14,
): { up: (number | string)[]; down: (number | string)[] } => {
  const up: (number | string)[] = new Array(data.length).fill("-");
  const down: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return { up, down };

  for (let index = period - 1; index < data.length; index++) {
    let highestHigh = Number.NEGATIVE_INFINITY;
    let lowestLow = Number.POSITIVE_INFINITY;
    let highestIndex = -1;
    let lowestIndex = -1;
    let validWindow = true;

    for (let offset = 0; offset < period; offset++) {
      const windowIndex = index - period + 1 + offset;
      const high = toFinitePriceValue(data[windowIndex]?.high);
      const low = toFinitePriceValue(data[windowIndex]?.low);
      if (high === null || low === null) {
        validWindow = false;
        break;
      }
      if (high >= highestHigh) {
        highestHigh = high;
        highestIndex = windowIndex;
      }
      if (low <= lowestLow) {
        lowestLow = low;
        lowestIndex = windowIndex;
      }
    }

    if (!validWindow || highestIndex < 0 || lowestIndex < 0) continue;

    up[index] = roundIndicatorValue(((period - (index - highestIndex)) / period) * 100);
    down[index] = roundIndicatorValue(((period - (index - lowestIndex)) / period) * 100);
  }

  return { up, down };
};

export const calculateAroonOscillator = (data: ChartDataPoint[], period = 14): (number | string)[] => {
  const aroon = calculateAroon(data, period);
  return aroon.up.map((value, index) => {
    const up = toFinitePriceValue(value);
    const down = toFinitePriceValue(aroon.down[index]);
    if (up === null || down === null) return "-";
    return roundIndicatorValue(up - down);
  });
};

/**
 * Commodity Channel Index (CCI).
 * Formula: (TypicalPrice - SMA(TypicalPrice, n)) / (0.015 * MeanDeviation).
 */
export const calculateCCI = (data: ChartDataPoint[], period = 20): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return results;

  const typicalPrices = data.map((point) => {
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    const close = toFinitePriceValue(point.close);
    if (high === null || low === null || close === null) return null;
    return (high + low + close) / 3;
  });

  for (let index = period - 1; index < data.length; index++) {
    let typicalPriceSum = 0;
    let isValidWindow = true;

    for (let offset = 0; offset < period; offset++) {
      const value = typicalPrices[index - offset];
      if (value === null) {
        isValidWindow = false;
        break;
      }
      typicalPriceSum += value;
    }

    if (!isValidWindow) continue;

    const typicalPriceAverage = typicalPriceSum / period;
    let meanDeviation = 0;

    for (let offset = 0; offset < period; offset++) {
      const value = typicalPrices[index - offset] as number;
      meanDeviation += Math.abs(value - typicalPriceAverage);
    }

    meanDeviation /= period;
    if (meanDeviation === 0) continue;

    const currentTypicalPrice = typicalPrices[index] as number;
    results[index] = roundIndicatorValue((currentTypicalPrice - typicalPriceAverage) / (0.015 * meanDeviation));
  }

  return results;
};

const calculateMoneyFlowContribution = (
  currentTypicalPrice: number | null,
  previousTypicalPrice: number | null,
  rawMoneyFlow: number | null,
): { positive: number; negative: number; valid: boolean } => {
  if (currentTypicalPrice === null || previousTypicalPrice === null || rawMoneyFlow === null) {
    return { positive: 0, negative: 0, valid: false };
  }
  if (currentTypicalPrice > previousTypicalPrice) return { positive: rawMoneyFlow, negative: 0, valid: true };
  if (currentTypicalPrice < previousTypicalPrice) return { positive: 0, negative: rawMoneyFlow, valid: true };
  return { positive: 0, negative: 0, valid: true };
};

const resolveMoneyFlowIndexValue = (positiveFlow: number, negativeFlow: number): number | null => {
  if (positiveFlow === 0 && negativeFlow === 0) return null;
  if (negativeFlow === 0) return 100;
  if (positiveFlow === 0) return 0;
  return 100 - 100 / (1 + positiveFlow / negativeFlow);
};

/**
 * Money Flow Index (MFI) on HLC3 and Volume.
 * Requires n classified money-flow periods, so MFI14 first appears after 15 candles.
 */
export const calculateMFI = (data: ChartDataPoint[], period = 14): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length <= period) return results;

  const typicalPrices = data.map((point) => {
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    const close = toFinitePriceValue(point.close);
    if (high === null || low === null || close === null) return null;
    return (high + low + close) / 3;
  });
  const rawMoneyFlows = data.map((point, index) => {
    const typicalPrice = typicalPrices[index];
    const volume = toFinitePriceValue(point.volume);
    if (typicalPrice === null || volume === null || volume < 0) return null;
    return typicalPrice * volume;
  });

  let positiveFlow = 0;
  let negativeFlow = 0;
  let invalidCount = 0;

  for (let index = 1; index <= period; index++) {
    const contribution = calculateMoneyFlowContribution(
      typicalPrices[index],
      typicalPrices[index - 1],
      rawMoneyFlows[index],
    );
    if (!contribution.valid) invalidCount += 1;
    positiveFlow += contribution.positive;
    negativeFlow += contribution.negative;
  }

  const firstValue = invalidCount === 0 ? resolveMoneyFlowIndexValue(positiveFlow, negativeFlow) : null;
  if (firstValue !== null) results[period] = roundIndicatorValue(firstValue);

  for (let index = period + 1; index < data.length; index++) {
    const outgoingIndex = index - period;
    const outgoing = calculateMoneyFlowContribution(
      typicalPrices[outgoingIndex],
      typicalPrices[outgoingIndex - 1],
      rawMoneyFlows[outgoingIndex],
    );
    const incoming = calculateMoneyFlowContribution(
      typicalPrices[index],
      typicalPrices[index - 1],
      rawMoneyFlows[index],
    );

    if (!outgoing.valid) invalidCount -= 1;
    else {
      positiveFlow -= outgoing.positive;
      negativeFlow -= outgoing.negative;
    }

    if (!incoming.valid) invalidCount += 1;
    else {
      positiveFlow += incoming.positive;
      negativeFlow += incoming.negative;
    }

    const value = invalidCount === 0 ? resolveMoneyFlowIndexValue(positiveFlow, negativeFlow) : null;
    if (value !== null) results[index] = roundIndicatorValue(value);
  }

  return results;
};

/**
 * Williams %R — Momentum Oscillator.
 * Ranges from -100 to 0. Overbought: > -20. Oversold: < -80.
 * Complexity: O(n*period) — acceptable for typical periods (14-28).
 */
export const calculateWilliamsR = (data: ChartDataPoint[], period = 14): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < period) return results;

  for (let i = period - 1; i < data.length; i++) {
    let highMax = -Infinity;
    let lowMin = Infinity;
    for (let j = 0; j < period; j++) {
      const { high, low } = data[i - j];
      if (!Number.isFinite(high) || !Number.isFinite(low)) {
        highMax = NaN;
        lowMin = NaN;
        break;
      }
      if (high > highMax) highMax = high;
      if (low < lowMin) lowMin = low;
    }
    const den = highMax - lowMin;
    const close = data[i].close;
    if (Number.isFinite(den) && den > 0 && Number.isFinite(close)) {
      results[i] = parseFloat((((highMax - close) / den) * -100).toFixed(2));
    }
  }
  return results;
};

/**
 * Rate of Change (ROC) — Price Momentum Indicator.
 * ROC = ((Close - Close[period]) / Close[period]) * 100
 * Positive values indicate upward momentum. Complexity: O(n).
 */
export const calculateROC = (data: ChartDataPoint[], period = 10): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= period) return results;

  for (let i = period; i < data.length; i++) {
    const prevClose = data[i - period].close;
    if (Number.isFinite(prevClose) && prevClose !== 0 && Number.isFinite(data[i].close)) {
      results[i] = parseFloat((((data[i].close - prevClose) / prevClose) * 100).toFixed(2));
    }
  }
  return results;
};

export const calculateMomentum = (data: ChartDataPoint[], period = 10): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= period) return results;

  for (let index = period; index < data.length; index++) {
    const currentClose = data[index].close;
    const previousClose = data[index - period].close;
    if (Number.isFinite(currentClose) && Number.isFinite(previousClose)) {
      results[index] = roundIndicatorValue(currentClose - previousClose);
    }
  }

  return results;
};

export const calculateCMO = (data: ChartDataPoint[], period = 14): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= period) return results;

  let sumUp = 0;
  let sumDown = 0;
  let invalidCount = 0;
  const flows: Array<{ valid: boolean; up: number; down: number }> = new Array(data.length).fill(null).map(() => ({
    valid: false,
    up: 0,
    down: 0,
  }));

  for (let index = 1; index < data.length; index++) {
    const currentClose = data[index].close;
    const previousClose = data[index - 1].close;
    const change = currentClose - previousClose;
    const valid = Number.isFinite(currentClose) && Number.isFinite(previousClose) && Number.isFinite(change);
    const up = valid ? Math.max(change, 0) : 0;
    const down = valid ? Math.max(-change, 0) : 0;
    flows[index] = { valid, up, down };

    if (!valid) invalidCount += 1;
    else {
      sumUp += up;
      sumDown += down;
    }

    if (index > period) {
      const outgoing = flows[index - period];
      if (!outgoing.valid) invalidCount -= 1;
      else {
        sumUp -= outgoing.up;
        sumDown -= outgoing.down;
      }
    }

    if (index >= period && invalidCount === 0) {
      const totalMovement = sumUp + sumDown;
      if (totalMovement > 0) {
        results[index] = roundIndicatorValue(100 * (sumUp - sumDown) / totalMovement);
      }
    }
  }

  return results;
};

const calculateRollingCloseStd = (data: ChartDataPoint[], period: number): Array<number | null> => {
  const results: Array<number | null> = new Array(data.length).fill(null);
  if (period <= 0 || data.length < period) return results;

  let sum = 0;
  let sumSquares = 0;
  let invalidCount = 0;

  for (let index = 0; index < data.length; index++) {
    const incoming = toFinitePriceValue(data[index].close);
    if (incoming === null) invalidCount += 1;
    else {
      sum += incoming;
      sumSquares += incoming * incoming;
    }

    if (index >= period) {
      const outgoing = toFinitePriceValue(data[index - period].close);
      if (outgoing === null) invalidCount -= 1;
      else {
        sum -= outgoing;
        sumSquares -= outgoing * outgoing;
      }
    }

    if (index >= period - 1 && invalidCount === 0) {
      const mean = sum / period;
      const variance = Math.max(0, sumSquares / period - mean * mean);
      results[index] = Math.sqrt(variance);
    }
  }

  return results;
};

const calculateNullableSmaSeries = (values: Array<number | null>, period: number): Array<number | null> => {
  const results: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return results;

  let sum = 0;
  let invalidCount = 0;

  for (let index = 0; index < values.length; index++) {
    const incoming = values[index];
    if (incoming === null || !Number.isFinite(incoming)) invalidCount += 1;
    else sum += incoming;

    if (index >= period) {
      const outgoing = values[index - period];
      if (outgoing === null || !Number.isFinite(outgoing)) invalidCount -= 1;
      else sum -= outgoing;
    }

    if (index >= period - 1 && invalidCount === 0) {
      results[index] = sum / period;
    }
  }

  return results;
};

export const calculateDYMI = (
  data: ChartDataPoint[],
  baseLength = 14,
  volatilityLength = 5,
  volatilitySmoothing = 10,
  minLength = 5,
  maxLength = 30,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= maxLength) return results;

  const stdSeries = calculateRollingCloseStd(data, volatilityLength);
  const avgStdSeries = calculateNullableSmaSeries(stdSeries, volatilitySmoothing);
  const rsiByLength = new Map<number, (number | string)[]>();
  for (let length = minLength; length <= maxLength; length++) {
    rsiByLength.set(length, calculateRSI(data, length));
  }

  for (let index = maxLength; index < data.length; index++) {
    const currentStd = stdSeries[index];
    const averageStd = avgStdSeries[index];
    if (currentStd === null || averageStd === null || averageStd <= 0) continue;

    const volatilityIndex = currentStd / averageStd;
    const rawLength = volatilityIndex === 0 ? maxLength : Math.floor(baseLength / volatilityIndex);
    const dynamicLength = Math.min(maxLength, Math.max(minLength, rawLength));
    const selectedRsi = rsiByLength.get(dynamicLength)?.[index];
    if (typeof selectedRsi === "number" && Number.isFinite(selectedRsi)) {
      results[index] = selectedRsi;
    }
  }

  return results;
};

const calculateRollingSum = (values: Array<number | null>, period: number): Array<number | null> => {
  const results: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return results;

  let sum = 0;
  let invalidCount = 0;

  for (let index = 0; index < values.length; index++) {
    const incoming = values[index];
    if (incoming === null || !Number.isFinite(incoming)) invalidCount += 1;
    else sum += incoming;

    if (index >= period) {
      const outgoing = values[index - period];
      if (outgoing === null || !Number.isFinite(outgoing)) invalidCount -= 1;
      else sum -= outgoing;
    }

    if (index >= period - 1 && invalidCount === 0) {
      results[index] = sum;
    }
  }

  return results;
};

const calculateTrueRangeRmaSeries = (data: ChartDataPoint[], period: number): Array<number | null> => {
  const results: Array<number | null> = new Array(data.length).fill(null);
  if (period <= 0 || data.length < period) return results;

  let sum = 0;
  let validCount = 0;
  let previousRma: number | null = null;

  for (let index = 0; index < data.length; index++) {
    const current = data[index];
    const previous = index > 0 ? data[index - 1] : null;
    const high = toFinitePriceValue(current.high);
    const low = toFinitePriceValue(current.low);
    const previousClose = previous ? toFinitePriceValue(previous.close) : null;

    if (high === null || low === null || (index > 0 && previousClose === null)) {
      sum = 0;
      validCount = 0;
      previousRma = null;
      continue;
    }

    const trueRange = previousClose === null
      ? high - low
      : Math.max(high - low, Math.abs(high - previousClose), Math.abs(low - previousClose));

    if (previousRma === null) {
      sum += trueRange;
      validCount += 1;
      if (validCount === period) {
        previousRma = sum / period;
        results[index] = previousRma;
      }
      continue;
    }

    previousRma = (previousRma * (period - 1) + trueRange) / period;
    results[index] = previousRma;
  }

  return results;
};

export const calculateSupertrend = (
  data: ChartDataPoint[],
  atrLength = 10,
  multiplier = 3,
): { supertrend: (number | string)[]; signal: (number | string)[] } => {
  const supertrend: (number | string)[] = new Array(data.length).fill("-");
  const signal: (number | string)[] = new Array(data.length).fill("-");
  if (atrLength <= 0 || multiplier <= 0 || data.length < atrLength) return { supertrend, signal };

  const atrSeries = calculateTrueRangeRmaSeries(data, atrLength);
  let previousUpperBand: number | null = null;
  let previousLowerBand: number | null = null;
  let previousDirection: 1 | -1 | null = null;

  for (let index = 0; index < data.length; index++) {
    const current = data[index];
    const previousClose = index > 0 ? toFinitePriceValue(data[index - 1].close) : null;
    const high = toFinitePriceValue(current.high);
    const low = toFinitePriceValue(current.low);
    const close = toFinitePriceValue(current.close);
    const atr = atrSeries[index];

    if (high === null || low === null || close === null || atr === null || (index > 0 && previousClose === null)) {
      continue;
    }

    const hl2 = (high + low) / 2;
    const basicUpperBand = hl2 + multiplier * atr;
    const basicLowerBand = hl2 - multiplier * atr;
    const upperBand: number = previousUpperBand === null
      || previousClose === null
      || basicUpperBand < previousUpperBand
      || previousClose > previousUpperBand
      ? basicUpperBand
      : previousUpperBand;
    const lowerBand: number = previousLowerBand === null
      || previousClose === null
      || basicLowerBand > previousLowerBand
      || previousClose < previousLowerBand
      ? basicLowerBand
      : previousLowerBand;

    let direction: 1 | -1 = previousDirection ?? (close >= hl2 ? 1 : -1);
    if (previousUpperBand !== null && close > previousUpperBand) direction = 1;
    else if (previousLowerBand !== null && close < previousLowerBand) direction = -1;

    supertrend[index] = roundIndicatorValue(direction === 1 ? lowerBand : upperBand);
    signal[index] = direction;
    previousUpperBand = upperBand;
    previousLowerBand = lowerBand;
    previousDirection = direction;
  }

  return { supertrend, signal };
};

export const calculateVortex = (
  data: ChartDataPoint[],
  period = 14,
): { plus: (number | string)[]; minus: (number | string)[] } => {
  const plus: (number | string)[] = new Array(data.length).fill("-");
  const minus: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length <= period) return { plus, minus };

  const trueRange: Array<number | null> = new Array(data.length).fill(null);
  const positiveMovement: Array<number | null> = new Array(data.length).fill(null);
  const negativeMovement: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 1; index < data.length; index++) {
    const current = data[index];
    const previous = data[index - 1];
    const values = [current.high, current.low, previous.high, previous.low, previous.close];
    if (!values.every(Number.isFinite)) continue;

    trueRange[index] = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close),
    );
    positiveMovement[index] = Math.abs(current.high - previous.low);
    negativeMovement[index] = Math.abs(current.low - previous.high);
  }

  const trueRangeSum = calculateRollingSum(trueRange, period);
  const positiveMovementSum = calculateRollingSum(positiveMovement, period);
  const negativeMovementSum = calculateRollingSum(negativeMovement, period);

  for (let index = period; index < data.length; index++) {
    const rangeSum = trueRangeSum[index];
    const plusSum = positiveMovementSum[index];
    const minusSum = negativeMovementSum[index];
    if (
      rangeSum === null
      || plusSum === null
      || minusSum === null
      || rangeSum <= 0
    ) continue;

    plus[index] = roundIndicatorValue(plusSum / rangeSum);
    minus[index] = roundIndicatorValue(minusSum / rangeSum);
  }

  return { plus, minus };
};

export const calculateTRIX = (data: ChartDataPoint[], length = 18): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || data.length < length) return results;

  const closeSeries = data.map((point) => point.close);
  const ema1 = calculateEMAFloatSeries(closeSeries, length);
  const ema2 = calculateEMAFloatSeries(ema1, length);
  const ema3 = calculateEMAFloatSeries(ema2, length);

  for (let index = 1; index < data.length; index++) {
    const current = ema3[index];
    const previous = ema3[index - 1];
    if (current === null || previous === null || previous === 0) continue;
    results[index] = roundIndicatorValue(((current - previous) / previous) * 100);
  }

  return results;
};

const calculateStochasticPercentSeries = (
  values: Array<number | string | null>,
  period: number,
): Array<number | null> => {
  const results: Array<number | null> = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return results;

  for (let index = period - 1; index < values.length; index++) {
    const current = toFinitePriceValue(values[index]);
    let highest = Number.NEGATIVE_INFINITY;
    let lowest = Number.POSITIVE_INFINITY;
    let validWindow = current !== null;

    for (let offset = 0; offset < period; offset++) {
      const value = toFinitePriceValue(values[index - offset]);
      if (value === null) {
        validWindow = false;
        break;
      }
      if (value > highest) highest = value;
      if (value < lowest) lowest = value;
    }

    const range = highest - lowest;
    if (!validWindow || current === null || range <= 0) continue;
    results[index] = 100 * (current - lowest) / range;
  }

  return results;
};

export const calculateSTC = (
  data: ChartDataPoint[],
  fastLength = 23,
  slowLength = 50,
  cycleLength = 10,
  smooth1 = 3,
  smooth2 = 3,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (
    fastLength <= 0
    || slowLength <= 0
    || cycleLength <= 0
    || smooth1 <= 0
    || smooth2 <= 0
    || data.length < slowLength + cycleLength
  ) return results;

  const closeSeries = data.map((point) => point.close);
  const emaFast = calculateEMAFloatSeries(closeSeries, fastLength);
  const emaSlow = calculateEMAFloatSeries(closeSeries, slowLength);
  const macdSeries: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 0; index < data.length; index++) {
    const fast = emaFast[index];
    const slow = emaSlow[index];
    if (fast === null || slow === null) continue;
    macdSeries[index] = fast - slow;
  }

  const k1 = calculateStochasticPercentSeries(macdSeries, cycleLength);
  const d1 = calculateEMAFloatSeries(k1, smooth1);
  const k2 = calculateStochasticPercentSeries(d1, cycleLength);
  const stcSeries = calculateEMAFloatSeries(k2, smooth2);

  for (let index = 0; index < stcSeries.length; index++) {
    const value = stcSeries[index];
    if (value === null || !Number.isFinite(value)) continue;
    results[index] = roundIndicatorValue(Math.max(0, Math.min(100, value)));
  }

  return results;
};

export const calculateMassIndex = (
  data: ChartDataPoint[],
  emaLength = 9,
  sumLength = 25,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (emaLength <= 0 || sumLength <= 0 || data.length < emaLength * 2 + sumLength - 2) return results;

  const rangeSeries = data.map((point) => {
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    return high === null || low === null ? null : high - low;
  });
  const ema1 = calculateEMAFloatSeries(rangeSeries, emaLength);
  const ema2 = calculateEMAFloatSeries(ema1, emaLength);
  const ratioSeries: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 0; index < data.length; index++) {
    const numerator = ema1[index];
    const denominator = ema2[index];
    if (numerator === null || denominator === null || denominator <= 0) continue;
    ratioSeries[index] = numerator / denominator;
  }

  const massIndexSeries = calculateRollingSum(ratioSeries, sumLength);
  for (let index = 0; index < massIndexSeries.length; index++) {
    const value = massIndexSeries[index];
    if (value === null || !Number.isFinite(value)) continue;
    results[index] = roundIndicatorValue(value);
  }

  return results;
};

const calculateRateOfChangeSeries = (data: ChartDataPoint[], period: number): Array<number | null> => {
  const results: Array<number | null> = new Array(data.length).fill(null);
  if (period <= 0 || data.length <= period) return results;

  for (let index = period; index < data.length; index++) {
    const currentClose = toFinitePriceValue(data[index].close);
    const previousClose = toFinitePriceValue(data[index - period].close);
    if (currentClose === null || previousClose === null || previousClose === 0) continue;
    results[index] = ((currentClose - previousClose) / previousClose) * 100;
  }

  return results;
};

export const calculateKST = (
  data: ChartDataPoint[],
  rocLengths: ReadonlyArray<number> = [10, 15, 20, 30],
  smaLengths: ReadonlyArray<number> = [10, 10, 10, 15],
  signalLength = 9,
  weights: ReadonlyArray<number> = [1, 2, 3, 4],
): { kst: (number | string)[]; signalLine: (number | string)[] } => {
  const kst: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  if (rocLengths.length !== 4 || smaLengths.length !== 4 || weights.length !== 4 || signalLength <= 0) {
    return { kst, signalLine };
  }
  if ([...rocLengths, ...smaLengths, ...weights].some((value) => value <= 0 || !Number.isFinite(value))) {
    return { kst, signalLine };
  }

  const rocSeries = rocLengths.map((period) => calculateRateOfChangeSeries(data, period));
  const smoothedSeries = rocSeries.map((series, index) => calculateNullableSmaSeries(series, smaLengths[index]));
  const rawKst: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 0; index < data.length; index++) {
    let total = 0;
    let isValid = true;
    for (let component = 0; component < smoothedSeries.length; component++) {
      const value = smoothedSeries[component][index];
      if (value === null || !Number.isFinite(value)) {
        isValid = false;
        break;
      }
      total += value * weights[component];
    }
    if (!isValid) continue;
    rawKst[index] = total;
    kst[index] = roundIndicatorValue(total);
  }

  const rawSignal = calculateNullableSmaSeries(rawKst, signalLength);
  for (let index = 0; index < rawSignal.length; index++) {
    const value = rawSignal[index];
    if (value !== null && Number.isFinite(value)) signalLine[index] = roundIndicatorValue(value);
  }

  return { kst, signalLine };
};

const calculateRegressionDenominator = (length: number): number =>
  length * (length * length - 1) / 12;

export const calculateLinearRegressionIndicator = (
  data: ChartDataPoint[],
  length = 100,
): { value: (number | string)[]; slope: (number | string)[]; slopePct: (number | string)[] } => {
  const value: (number | string)[] = new Array(data.length).fill("-");
  const slope: (number | string)[] = new Array(data.length).fill("-");
  const slopePct: (number | string)[] = new Array(data.length).fill("-");
  if (length < 2 || data.length < length) return { value, slope, slopePct };

  const denominator = calculateRegressionDenominator(length);
  if (!Number.isFinite(denominator) || denominator <= 0) return { value, slope, slopePct };

  const closes = data.map((point) => toFinitePriceValue(point.close));
  const xMean = (length - 1) / 2;
  let sumY = 0;
  let sumXY = 0;
  let invalidCount = 0;

  for (let offset = 0; offset < length; offset++) {
    const close = closes[offset];
    if (close === null) invalidCount += 1;
    else {
      sumY += close;
      sumXY += offset * close;
    }
  }

  const writeWindow = (index: number) => {
    if (invalidCount !== 0) return;
    const slopeValue = (sumXY - xMean * sumY) / denominator;
    const intercept = sumY / length - slopeValue * xMean;
    const lineValue = intercept + slopeValue * (length - 1);
    if (!Number.isFinite(lineValue) || !Number.isFinite(slopeValue)) return;
    value[index] = roundIndicatorValue(lineValue);
    slope[index] = roundIndicatorValue(slopeValue, 4);
    if (lineValue !== 0) slopePct[index] = roundIndicatorValue((slopeValue / lineValue) * 100, 4);
  };

  writeWindow(length - 1);
  for (let index = length; index < data.length; index++) {
    const outgoing = closes[index - length];
    if (outgoing === null) invalidCount -= 1;
    else sumY -= outgoing;
    sumXY -= sumY;

    const incoming = closes[index];
    if (incoming === null) invalidCount += 1;
    else {
      sumY += incoming;
      sumXY += (length - 1) * incoming;
    }
    writeWindow(index);
  }

  return { value, slope, slopePct };
};

export const calculateUltimateOscillator = (data: ChartDataPoint[]): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < 29) return results;

  const buyingPressure: Array<number | null> = new Array(data.length).fill(null);
  const trueRange: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 1; index < data.length; index++) {
    const { high, low, close } = data[index];
    const previousClose = data[index - 1].close;
    if (![high, low, close, previousClose].every(Number.isFinite)) continue;

    const lowReference = Math.min(low, previousClose);
    buyingPressure[index] = close - lowReference;
    trueRange[index] = Math.max(high, previousClose) - lowReference;
  }

  const bp7 = calculateRollingSum(buyingPressure, 7);
  const tr7 = calculateRollingSum(trueRange, 7);
  const bp14 = calculateRollingSum(buyingPressure, 14);
  const tr14 = calculateRollingSum(trueRange, 14);
  const bp28 = calculateRollingSum(buyingPressure, 28);
  const tr28 = calculateRollingSum(trueRange, 28);

  for (let index = 28; index < data.length; index++) {
    const values = [bp7[index], tr7[index], bp14[index], tr14[index], bp28[index], tr28[index]];
    if (!values.every((value): value is number => typeof value === "number" && Number.isFinite(value))) continue;
    const [bpShort, trShort, bpMedium, trMedium, bpLong, trLong] = values;
    if (trShort <= 0 || trMedium <= 0 || trLong <= 0) continue;

    const avg7 = bpShort / trShort;
    const avg14 = bpMedium / trMedium;
    const avg28 = bpLong / trLong;
    results[index] = roundIndicatorValue(100 * ((4 * avg7 + 2 * avg14 + avg28) / 7));
  }

  return results;
};

export const calculateDPO = (data: ChartDataPoint[], period = 20): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (period <= 0 || data.length < period) return results;

  const offset = Math.floor(period / 2) + 1;
  let sum = 0;
  let invalidCount = 0;

  for (let index = 0; index < data.length; index++) {
    const incomingClose = toFinitePriceValue(data[index].close);
    if (incomingClose === null) invalidCount += 1;
    else sum += incomingClose;

    if (index >= period) {
      const outgoingClose = toFinitePriceValue(data[index - period].close);
      if (outgoingClose === null) invalidCount -= 1;
      else sum -= outgoingClose;
    }

    if (index >= period - 1 && invalidCount === 0) {
      const displayIndex = index - offset;
      const shiftedClose = displayIndex >= 0 ? toFinitePriceValue(data[displayIndex].close) : null;
      if (shiftedClose !== null) {
        results[displayIndex] = roundIndicatorValue(shiftedClose - sum / period);
      }
    }
  }

  return results;
};

export const calculateTSI = (
  data: ChartDataPoint[],
  longLength = 25,
  shortLength = 13,
  signalLength = 13,
): { tsi: (number | string)[]; signalLine: (number | string)[] } => {
  const tsi: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < longLength + shortLength) return { tsi, signalLine };

  const priceChange: Array<number | null> = new Array(data.length).fill(null);
  const absolutePriceChange: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 1; index < data.length; index++) {
    const currentClose = toFinitePriceValue(data[index].close);
    const previousClose = toFinitePriceValue(data[index - 1].close);
    if (currentClose === null || previousClose === null) continue;

    const change = currentClose - previousClose;
    priceChange[index] = change;
    absolutePriceChange[index] = Math.abs(change);
  }

  const smoothedPriceChange = calculateEMAFloatSeries(
    calculateEMAFloatSeries(priceChange, longLength),
    shortLength,
  );
  const smoothedAbsoluteChange = calculateEMAFloatSeries(
    calculateEMAFloatSeries(absolutePriceChange, longLength),
    shortLength,
  );

  const rawTsi: Array<number | null> = new Array(data.length).fill(null);
  for (let index = 0; index < data.length; index++) {
    const numerator = smoothedPriceChange[index];
    const denominator = smoothedAbsoluteChange[index];
    if (numerator === null || denominator === null || denominator <= 0) continue;

    const tsiValue = 100 * numerator / denominator;
    rawTsi[index] = tsiValue;
    tsi[index] = roundIndicatorValue(tsiValue);
  }

  const smoothedSignal = calculateEMAFloatSeries(rawTsi, signalLength);
  for (let index = 0; index < smoothedSignal.length; index++) {
    const value = smoothedSignal[index];
    if (value !== null && Number.isFinite(value)) {
      signalLine[index] = roundIndicatorValue(value);
    }
  }

  return { tsi, signalLine };
};

export const calculateRVI = (
  data: ChartDataPoint[],
  length = 10,
): { rvi: (number | string)[]; signalLine: (number | string)[] } => {
  const rvi: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || data.length < length + 3) return { rvi, signalLine };

  const numeratorRaw: Array<number | null> = new Array(data.length).fill(null);
  const denominatorRaw: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 3; index < data.length; index++) {
    const current = data[index];
    const oneBack = data[index - 1];
    const twoBack = data[index - 2];
    const threeBack = data[index - 3];
    const values = [
      current.close, current.open, current.high, current.low,
      oneBack.close, oneBack.open, oneBack.high, oneBack.low,
      twoBack.close, twoBack.open, twoBack.high, twoBack.low,
      threeBack.close, threeBack.open, threeBack.high, threeBack.low,
    ];
    if (!values.every(Number.isFinite)) continue;

    const a = current.close - current.open;
    const b = oneBack.close - oneBack.open;
    const c = twoBack.close - twoBack.open;
    const d = threeBack.close - threeBack.open;
    const e = current.high - current.low;
    const f = oneBack.high - oneBack.low;
    const g = twoBack.high - twoBack.low;
    const h = threeBack.high - threeBack.low;

    numeratorRaw[index] = (a + 2 * b + 2 * c + d) / 6;
    denominatorRaw[index] = (e + 2 * f + 2 * g + h) / 6;
  }

  const numerator = calculateNullableSmaSeries(numeratorRaw, length);
  const denominator = calculateNullableSmaSeries(denominatorRaw, length);
  const rawRvi: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 0; index < data.length; index++) {
    const numeratorValue = numerator[index];
    const denominatorValue = denominator[index];
    if (numeratorValue === null || denominatorValue === null || denominatorValue <= 0) continue;

    const value = numeratorValue / denominatorValue;
    rawRvi[index] = value;
    rvi[index] = roundIndicatorValue(value);
  }

  for (let index = 3; index < data.length; index++) {
    const current = rawRvi[index];
    const oneBack = rawRvi[index - 1];
    const twoBack = rawRvi[index - 2];
    const threeBack = rawRvi[index - 3];
    if (
      current !== null
      && oneBack !== null
      && twoBack !== null
      && threeBack !== null
      && [current, oneBack, twoBack, threeBack].every(Number.isFinite)
    ) {
      signalLine[index] = roundIndicatorValue((current + 2 * oneBack + 2 * twoBack + threeBack) / 6);
    }
  }

  return { rvi, signalLine };
};

export const calculateFisherTransform = (
  data: ChartDataPoint[],
  length = 9,
): { fisher: (number | string)[]; signalLine: (number | string)[] } => {
  const fisher: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || data.length < length) return { fisher, signalLine };

  const hl2Series = data.map((point) => {
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    return high === null || low === null ? null : (high + low) / 2;
  });

  let previousNormalized: number | null = null;
  let previousFisher: number | null = null;

  for (let index = length - 1; index < data.length; index++) {
    const currentHl2 = hl2Series[index];
    let highest = Number.NEGATIVE_INFINITY;
    let lowest = Number.POSITIVE_INFINITY;
    let isValidWindow = currentHl2 !== null;

    for (let offset = 0; offset < length; offset++) {
      const value = hl2Series[index - offset];
      if (value === null || !Number.isFinite(value)) {
        isValidWindow = false;
        break;
      }
      if (value > highest) highest = value;
      if (value < lowest) lowest = value;
    }

    const range = highest - lowest;
    if (!isValidWindow || currentHl2 === null || !Number.isFinite(range) || range <= 0) {
      previousNormalized = null;
      previousFisher = null;
      continue;
    }

    const raw = 2 * ((currentHl2 - lowest) / range - 0.5);
    const smoothed = 0.66 * raw + 0.67 * (previousNormalized ?? 0);
    const normalized = Math.max(-0.999, Math.min(0.999, smoothed));
    const fisherValue: number = 0.5 * Math.log((1 + normalized) / (1 - normalized)) + 0.5 * (previousFisher ?? 0);

    if (previousFisher !== null) signalLine[index] = roundIndicatorValue(previousFisher);
    fisher[index] = roundIndicatorValue(fisherValue);
    previousNormalized = normalized;
    previousFisher = fisherValue;
  }

  return { fisher, signalLine };
};

export const calculateElderBullBearPower = (
  data: ChartDataPoint[],
  emaLength = 13,
): { bull: (number | string)[]; bear: (number | string)[] } => {
  const bull: (number | string)[] = new Array(data.length).fill("-");
  const bear: (number | string)[] = new Array(data.length).fill("-");
  if (emaLength <= 0 || data.length < emaLength) return { bull, bear };

  const ema = calculateEMAFloatSeries(data.map((point) => point.close), emaLength);
  for (let index = 0; index < data.length; index++) {
    const emaValue = ema[index];
    const high = toFinitePriceValue(data[index].high);
    const low = toFinitePriceValue(data[index].low);
    if (emaValue === null || high === null || low === null) continue;

    bull[index] = roundIndicatorValue(high - emaValue);
    bear[index] = roundIndicatorValue(low - emaValue);
  }

  return { bull, bear };
};

export const calculateCoppockCurve = (
  data: ChartDataPoint[],
  shortRocLength = 11,
  longRocLength = 14,
  wmaLength = 10,
): (number | string)[] => {
  const rocSum: Array<number | null> = new Array(data.length).fill(null);
  if (shortRocLength <= 0 || longRocLength <= 0 || wmaLength <= 0) {
    return new Array(data.length).fill("-");
  }

  for (let index = Math.max(shortRocLength, longRocLength); index < data.length; index++) {
    const close = toFinitePriceValue(data[index].close);
    const shortReference = toFinitePriceValue(data[index - shortRocLength]?.close);
    const longReference = toFinitePriceValue(data[index - longRocLength]?.close);
    if (close === null || shortReference === null || longReference === null || shortReference === 0 || longReference === 0) continue;

    const shortRoc = ((close - shortReference) / shortReference) * 100;
    const longRoc = ((close - longReference) / longReference) * 100;
    rocSum[index] = shortRoc + longRoc;
  }

  return calculateWMAFloatSeries(rocSum, wmaLength)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));
};

const calculateAwesomeOscillatorFloatSeries = (
  data: ChartDataPoint[],
  fastLength = 5,
  slowLength = 34,
): Array<number | null> => {
  const medianPrices = data.map((point) => {
    if (!Number.isFinite(point.high) || !Number.isFinite(point.low)) return null;
    return (point.high + point.low) / 2;
  });
  const fastSma = calculateNullableSmaSeries(medianPrices, fastLength);
  const slowSma = calculateNullableSmaSeries(medianPrices, slowLength);

  return data.map((_, index) => {
    const fast = fastSma[index];
    const slow = slowSma[index];
    return fast !== null && slow !== null ? fast - slow : null;
  });
};

export const calculateAwesomeOscillator = (
  data: ChartDataPoint[],
  fastLength = 5,
  slowLength = 34,
): (number | string)[] =>
  calculateAwesomeOscillatorFloatSeries(data, fastLength, slowLength)
    .map((value) => value === null ? "-" : roundIndicatorValue(value));

export const calculateAcceleratorOscillator = (
  data: ChartDataPoint[],
  fastLength = 5,
  slowLength = 34,
  signalLength = 5,
): (number | string)[] => {
  const ao = calculateAwesomeOscillatorFloatSeries(data, fastLength, slowLength);
  const aoSignal = calculateNullableSmaSeries(ao, signalLength);
  return ao.map((value, index) => {
    const signal = aoSignal[index];
    return value !== null && signal !== null ? roundIndicatorValue(value - signal) : "-";
  });
};

/**
 * On Balance Volume (OBV) — Volume-Price Confirmation.
 * Cumulative volume indicator: adds volume on up-days, subtracts on down-days.
 * Confirms trends when OBV moves in the same direction as price. Complexity: O(n).
 */
export const calculateOBV = (data: ChartDataPoint[]): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < 2) return results;

  let obv = 0;
  let hasActiveSegment = false;

  for (let i = 1; i < data.length; i++) {
    const currentClose = toFinitePriceValue(data[i].close);
    const previousClose = toFinitePriceValue(data[i - 1].close);
    const volume = toFiniteVolumeValue(data[i].volume);
    if (currentClose === null || previousClose === null || volume === null) {
      obv = 0;
      hasActiveSegment = false;
      continue;
    }

    if (!hasActiveSegment) {
      obv = 0;
      hasActiveSegment = true;
    }

    if (currentClose > previousClose) {
      obv += volume;
    } else if (currentClose < previousClose) {
      obv -= volume;
    }
    results[i] = obv;
  }
  return results;
};

export const calculateADLine = (data: ChartDataPoint[]): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length === 0) return results;

  let adLine = 0;
  let hasActiveSegment = false;

  for (let index = 0; index < data.length; index++) {
    const high = toFinitePriceValue(data[index].high);
    const low = toFinitePriceValue(data[index].low);
    const close = toFinitePriceValue(data[index].close);
    const volume = toFiniteVolumeValue(data[index].volume);
    if (high === null || low === null || close === null || volume === null || high < low) {
      adLine = 0;
      hasActiveSegment = false;
      continue;
    }

    if (!hasActiveSegment) {
      adLine = 0;
      hasActiveSegment = true;
      results[index] = 0;
      continue;
    }

    const moneyFlowMultiplier = high === low
      ? 0
      : (2 * close - high - low) / (high - low);
    adLine += moneyFlowMultiplier * volume;
    results[index] = roundIndicatorValue(adLine);
  }

  return results;
};

const calculateVolumeIndex = (
  data: ChartDataPoint[],
  shouldUpdate: (currentVolume: number, previousVolume: number) => boolean,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length === 0) return results;

  let indexValue = 1000;
  let hasActiveSegment = false;
  const firstClose = toFinitePriceValue(data[0].close);
  const firstVolume = toFiniteVolumeValue(data[0].volume);

  if (firstClose !== null && firstClose > 0 && firstVolume !== null) {
    hasActiveSegment = true;
    results[0] = indexValue;
  }

  for (let index = 1; index < data.length; index++) {
    const currentClose = toFinitePriceValue(data[index].close);
    const previousClose = toFinitePriceValue(data[index - 1].close);
    const currentVolume = toFiniteVolumeValue(data[index].volume);
    const previousVolume = toFiniteVolumeValue(data[index - 1].volume);

    if (
      currentClose === null
      || currentClose <= 0
      || previousClose === null
      || previousClose <= 0
      || currentVolume === null
      || previousVolume === null
    ) {
      indexValue = 1000;
      hasActiveSegment = false;
      continue;
    }

    if (!hasActiveSegment) {
      indexValue = 1000;
      hasActiveSegment = true;
    }

    if (shouldUpdate(currentVolume, previousVolume)) {
      indexValue *= 1 + (currentClose - previousClose) / previousClose;
    }
    results[index] = roundIndicatorValue(indexValue);
  }

  return results;
};

export const calculateNVI = (data: ChartDataPoint[]): (number | string)[] =>
  calculateVolumeIndex(data, (currentVolume, previousVolume) => currentVolume < previousVolume);

export const calculatePVI = (data: ChartDataPoint[]): (number | string)[] =>
  calculateVolumeIndex(data, (currentVolume, previousVolume) => currentVolume > previousVolume);

export const calculateChaikinOscillator = (
  data: ChartDataPoint[],
  fastLength = 3,
  slowLength = 10,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (fastLength <= 0 || slowLength <= 0 || fastLength >= slowLength || data.length < slowLength) return results;

  const adLineSeries: Array<number | null> = new Array(data.length).fill(null);
  let adLine = 0;
  let hasActiveSegment = false;

  for (let index = 0; index < data.length; index++) {
    const moneyFlow = calculateMoneyFlowVolume(data[index]);
    if (moneyFlow === null) {
      adLine = 0;
      hasActiveSegment = false;
      continue;
    }

    if (!hasActiveSegment) {
      adLine = 0;
      hasActiveSegment = true;
    }

    adLine += moneyFlow.moneyFlowVolume;
    adLineSeries[index] = adLine;
  }

  const fastEma = calculateEMAFloatSeries(adLineSeries, fastLength);
  const slowEma = calculateEMAFloatSeries(adLineSeries, slowLength);
  for (let index = 0; index < data.length; index++) {
    const fast = fastEma[index];
    const slow = slowEma[index];
    if (fast === null || slow === null) continue;
    results[index] = roundIndicatorValue(fast - slow);
  }

  return results;
};

export const calculateVolumeOscillator = (
  data: ChartDataPoint[],
  fastLength = 5,
  slowLength = 20,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (fastLength <= 0 || slowLength <= 0 || fastLength >= slowLength || data.length < slowLength) return results;

  const volumeSeries = data.map((point) => toFiniteVolumeValue(point.volume));
  const fastVolumeAverage = calculateNullableSmaSeries(volumeSeries, fastLength);
  const slowVolumeAverage = calculateNullableSmaSeries(volumeSeries, slowLength);

  for (let index = 0; index < data.length; index++) {
    const fastAverage = fastVolumeAverage[index];
    const slowAverage = slowVolumeAverage[index];
    if (fastAverage === null || slowAverage === null || slowAverage === 0) continue;
    results[index] = roundIndicatorValue(((fastAverage - slowAverage) / slowAverage) * 100);
  }

  return results;
};

export const calculateVROC = (
  data: ChartDataPoint[],
  length = 14,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || data.length < length + 1) return results;

  for (let index = length; index < data.length; index++) {
    const currentVolume = toFiniteVolumeValue(data[index].volume);
    const previousVolume = toFiniteVolumeValue(data[index - length].volume);
    if (currentVolume === null || previousVolume === null || previousVolume === 0) continue;
    results[index] = roundIndicatorValue(((currentVolume - previousVolume) / previousVolume) * 100);
  }

  return results;
};

export const calculateEOM = (
  data: ChartDataPoint[],
  length = 14,
  divisor = 100_000_000,
): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (length <= 0 || divisor <= 0 || data.length < length + 1) return results;

  const rawEom: Array<number | null> = new Array(data.length).fill(null);
  for (let index = 1; index < data.length; index++) {
    const high = toFinitePriceValue(data[index].high);
    const low = toFinitePriceValue(data[index].low);
    const previousHigh = toFinitePriceValue(data[index - 1].high);
    const previousLow = toFinitePriceValue(data[index - 1].low);
    const volume = toFiniteVolumeValue(data[index].volume);
    if (
      high === null
      || low === null
      || previousHigh === null
      || previousLow === null
      || volume === null
      || volume === 0
      || high <= low
      || previousHigh < previousLow
    ) {
      continue;
    }

    const midpoint = (high + low) / 2;
    const previousMidpoint = (previousHigh + previousLow) / 2;
    const boxRatio = (volume / divisor) / (high - low);
    if (boxRatio === 0) continue;
    rawEom[index] = (midpoint - previousMidpoint) / boxRatio;
  }

  const smoothedEom = calculateNullableSmaSeries(rawEom, length);
  for (let index = 0; index < data.length; index++) {
    const value = smoothedEom[index];
    if (value !== null) results[index] = roundIndicatorValue(value, 4);
  }

  return results;
};

export const calculateVolumeProfile = (
  data: ChartDataPoint[],
  options: VolumeProfileOptions = {},
): VolumeProfileResult | null => {
  const maxBars = Math.max(1, Math.floor(options.maxBars ?? 150));
  const rangeData = data.slice(Math.max(0, data.length - maxBars));
  if (rangeData.length === 0) return null;

  const validBars = rangeData.filter((point) => {
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    const close = toFinitePriceValue(point.close);
    const volume = toFiniteVolumeValue(point.volume);
    return high !== null && low !== null && close !== null && volume !== null && volume > 0 && high >= low;
  });
  if (validBars.length === 0) return null;

  const priceLow = Math.min(...validBars.map((point) => point.low));
  const priceHigh = Math.max(...validBars.map((point) => point.high));
  const totalVolume = validBars.reduce((sum, point) => sum + point.volume, 0);
  if (!Number.isFinite(priceLow) || !Number.isFinite(priceHigh) || priceHigh <= priceLow || totalVolume <= 0) return null;

  const explicitRowSize = options.rowSize && options.rowSize > 0 ? options.rowSize : null;
  const requestedRows = Math.max(10, Math.min(150, Math.floor(options.numberOfRows ?? 80)));
  const rowCount = explicitRowSize
    ? Math.max(1, Math.min(150, Math.ceil((priceHigh - priceLow) / explicitRowSize)))
    : requestedRows;
  const rowSize = explicitRowSize && rowCount < 150 ? explicitRowSize : (priceHigh - priceLow) / rowCount;
  if (!Number.isFinite(rowSize) || rowSize <= 0) return null;

  const rows: VolumeProfileRow[] = Array.from({ length: rowCount }, (_, index) => {
    const low = priceLow + index * rowSize;
    const high = index === rowCount - 1 ? priceHigh : low + rowSize;
    return {
      priceLow: roundIndicatorValue(low, 4),
      priceHigh: roundIndicatorValue(high, 4),
      priceMid: roundIndicatorValue((low + high) / 2, 4),
      totalVolume: 0,
      upVolume: 0,
      downVolume: 0,
      isPoc: false,
      isValueArea: false,
    };
  });

  const clampRowIndex = (index: number): number => Math.max(0, Math.min(rowCount - 1, index));
  for (const point of validBars) {
    const lowIndex = clampRowIndex(Math.floor((point.low - priceLow) / rowSize));
    const highIndex = clampRowIndex(Math.floor((point.high - priceLow) / rowSize));
    const firstIndex = Math.min(lowIndex, highIndex);
    const lastIndex = Math.max(lowIndex, highIndex);
    const touchedRows = lastIndex - firstIndex + 1;
    const volumeShare = point.volume / touchedRows;
    const open = toFinitePriceValue(point.open) ?? point.close;
    const isUpBar = point.close >= open;

    for (let rowIndex = firstIndex; rowIndex <= lastIndex; rowIndex++) {
      rows[rowIndex].totalVolume += volumeShare;
      if (isUpBar) rows[rowIndex].upVolume += volumeShare;
      else rows[rowIndex].downVolume += volumeShare;
    }
  }

  const maxVolume = Math.max(...rows.map((row) => row.totalVolume));
  if (!Number.isFinite(maxVolume) || maxVolume <= 0) return null;

  const lastClose = validBars[validBars.length - 1].close;
  const rangeCenter = (priceLow + priceHigh) / 2;
  const pocIndex = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row.totalVolume === maxVolume)
    .sort((a, b) => {
      const closeDistance = Math.abs(a.row.priceMid - lastClose) - Math.abs(b.row.priceMid - lastClose);
      if (closeDistance !== 0) return closeDistance;
      const centerDistance = Math.abs(a.row.priceMid - rangeCenter) - Math.abs(b.row.priceMid - rangeCenter);
      if (centerDistance !== 0) return centerDistance;
      return a.index - b.index;
    })[0]?.index;
  if (pocIndex === undefined) return null;

  rows[pocIndex].isPoc = true;
  const valueAreaPercent = Math.max(1, Math.min(100, options.valueAreaPercent ?? 70));
  const targetVolume = totalVolume * (valueAreaPercent / 100);
  let lowerIndex = pocIndex;
  let upperIndex = pocIndex;
  let valueAreaVolume = rows[pocIndex].totalVolume;

  while (valueAreaVolume < targetVolume && (lowerIndex > 0 || upperIndex < rowCount - 1)) {
    const nextLower = lowerIndex > 0 ? lowerIndex - 1 : null;
    const nextUpper = upperIndex < rowCount - 1 ? upperIndex + 1 : null;
    let chosenIndex: number;

    if (nextLower === null) chosenIndex = nextUpper as number;
    else if (nextUpper === null) chosenIndex = nextLower;
    else {
      const lowerVolume = rows[nextLower].totalVolume;
      const upperVolume = rows[nextUpper].totalVolume;
      if (upperVolume > lowerVolume) chosenIndex = nextUpper;
      else if (lowerVolume > upperVolume) chosenIndex = nextLower;
      else {
        const lowerDistance = Math.abs(nextLower - pocIndex);
        const upperDistance = Math.abs(nextUpper - pocIndex);
        chosenIndex = upperDistance <= lowerDistance ? nextUpper : nextLower;
      }
    }

    if (chosenIndex > upperIndex) upperIndex = chosenIndex;
    if (chosenIndex < lowerIndex) lowerIndex = chosenIndex;
    valueAreaVolume += rows[chosenIndex].totalVolume;
  }

  for (let rowIndex = lowerIndex; rowIndex <= upperIndex; rowIndex++) rows[rowIndex].isValueArea = true;

  return {
    rangeStart: validBars[0].time,
    rangeEnd: validBars[validBars.length - 1].time,
    rangeMode: options.rangeMode ?? "last_n_bars",
    rowSize: roundIndicatorValue(rowSize, 4),
    valueAreaPercent,
    rows: rows.map((row) => ({
      ...row,
      totalVolume: roundIndicatorValue(row.totalVolume),
      upVolume: roundIndicatorValue(row.upVolume),
      downVolume: roundIndicatorValue(row.downVolume),
    })),
    poc: rows[pocIndex].priceMid,
    vah: rows[upperIndex].priceHigh,
    val: rows[lowerIndex].priceLow,
    maxVolume: roundIndicatorValue(maxVolume),
    totalVolume: roundIndicatorValue(totalVolume),
    calculationQuality: "daily_approximation",
  };
};

const createEmptyPivotSeries = (length: number): PivotPointsSeries => ({
  pivot: new Array(length).fill("-"),
  r1: new Array(length).fill("-"),
  r2: new Array(length).fill("-"),
  r3: new Array(length).fill("-"),
  s1: new Array(length).fill("-"),
  s2: new Array(length).fill("-"),
  s3: new Array(length).fill("-"),
});

const getPreviousPivotSource = (
  data: ChartDataPoint[],
  index: number,
): { high: number; low: number; close: number } | null => {
  const previous = data[index - 1];
  if (!previous) return null;

  const high = toFinitePriceValue(previous.high);
  const low = toFinitePriceValue(previous.low);
  const close = toFinitePriceValue(previous.close);
  if (high === null || low === null || close === null || high < low) return null;
  return { high, low, close };
};

export const calculatePivotPointsStandard = (data: ChartDataPoint[]): PivotPointsSeries => {
  const result = createEmptyPivotSeries(data.length);
  if (data.length < 2) return result;

  for (let index = 1; index < data.length; index++) {
    const source = getPreviousPivotSource(data, index);
    if (!source) continue;

    const pivot = (source.high + source.low + source.close) / 3;
    const range = source.high - source.low;
    result.pivot[index] = roundIndicatorValue(pivot, 4);
    result.r1[index] = roundIndicatorValue(2 * pivot - source.low, 4);
    result.s1[index] = roundIndicatorValue(2 * pivot - source.high, 4);
    result.r2[index] = roundIndicatorValue(pivot + range, 4);
    result.s2[index] = roundIndicatorValue(pivot - range, 4);
    result.r3[index] = roundIndicatorValue(2 * pivot + source.high - 2 * source.low, 4);
    result.s3[index] = roundIndicatorValue(2 * pivot - (2 * source.high - source.low), 4);
  }

  return result;
};

export const calculatePivotPointsFibonacci = (data: ChartDataPoint[]): PivotPointsSeries => {
  const result = createEmptyPivotSeries(data.length);
  if (data.length < 2) return result;

  for (let index = 1; index < data.length; index++) {
    const source = getPreviousPivotSource(data, index);
    if (!source) continue;

    const pivot = (source.high + source.low + source.close) / 3;
    const range = source.high - source.low;
    result.pivot[index] = roundIndicatorValue(pivot, 4);
    result.r1[index] = roundIndicatorValue(pivot + 0.382 * range, 4);
    result.s1[index] = roundIndicatorValue(pivot - 0.382 * range, 4);
    result.r2[index] = roundIndicatorValue(pivot + 0.618 * range, 4);
    result.s2[index] = roundIndicatorValue(pivot - 0.618 * range, 4);
    result.r3[index] = roundIndicatorValue(pivot + range, 4);
    result.s3[index] = roundIndicatorValue(pivot - range, 4);
  }

  return result;
};

export const calculateMovingAverageCrossSignals = (
  data: ChartDataPoint[],
  fastLength = 50,
  slowLength = 200,
): MovingAverageCrossSignals => {
  const goldenCross: (number | string)[] = new Array(data.length).fill("-");
  const deathCross: (number | string)[] = new Array(data.length).fill("-");
  if (fastLength <= 0 || slowLength <= 0 || fastLength >= slowLength || data.length < slowLength + 1) {
    return { goldenCross, deathCross };
  }

  const closeSeries = data.map((point) => toFinitePriceValue(point.close));
  const fastSma = calculateNullableSmaSeries(closeSeries, fastLength);
  const slowSma = calculateNullableSmaSeries(closeSeries, slowLength);

  for (let index = 1; index < data.length; index++) {
    const previousFast = fastSma[index - 1];
    const previousSlow = slowSma[index - 1];
    const currentFast = fastSma[index];
    const currentSlow = slowSma[index];
    if (
      previousFast === null
      || previousSlow === null
      || currentFast === null
      || currentSlow === null
    ) {
      continue;
    }

    goldenCross[index] = previousFast <= previousSlow && currentFast > currentSlow ? 1 : 0;
    deathCross[index] = previousFast >= previousSlow && currentFast < currentSlow ? 1 : 0;
  }

  return { goldenCross, deathCross };
};

export const calculateVWAP = (data: ChartDataPoint[]): VwapSeries => {
  const vwap: (number | string)[] = new Array(data.length).fill("-");
  const priceAboveVwap: (number | string)[] = new Array(data.length).fill("-");
  const priceBelowVwap: (number | string)[] = new Array(data.length).fill("-");
  const distance: (number | string)[] = new Array(data.length).fill("-");
  const distancePct: (number | string)[] = new Array(data.length).fill("-");

  let activeSession: string | null = null;
  let cumulativePriceVolume = 0;
  let cumulativeVolume = 0;

  for (let index = 0; index < data.length; index++) {
    const point = data[index];
    const sessionKey = resolveSessionKey(point.time);
    if (sessionKey === null) {
      activeSession = null;
      cumulativePriceVolume = 0;
      cumulativeVolume = 0;
      continue;
    }
    if (sessionKey !== activeSession) {
      activeSession = sessionKey;
      cumulativePriceVolume = 0;
      cumulativeVolume = 0;
    }

    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    const close = toFinitePriceValue(point.close);
    const volume = toFiniteVolumeValue(point.volume);
    if (high === null || low === null || close === null || volume === null || high < low) continue;

    const typicalPrice = (high + low + close) / 3;
    if (volume > 0) {
      cumulativePriceVolume += typicalPrice * volume;
      cumulativeVolume += volume;
    }

    if (cumulativeVolume <= 0) continue;

    const currentVwap = cumulativePriceVolume / cumulativeVolume;
    const currentDistance = close - currentVwap;
    vwap[index] = roundIndicatorValue(currentVwap, 4);
    priceAboveVwap[index] = close > currentVwap ? 1 : 0;
    priceBelowVwap[index] = close < currentVwap ? 1 : 0;
    distance[index] = roundIndicatorValue(currentDistance, 4);
    distancePct[index] = currentVwap !== 0 ? roundIndicatorValue((currentDistance / currentVwap) * 100, 4) : "-";
  }

  return { vwap, priceAboveVwap, priceBelowVwap, distance, distancePct };
};

export const calculateFiftyTwoWeekLevels = (data: ChartDataPoint[]): FiftyTwoWeekLevels => {
  const high: (number | string)[] = new Array(data.length).fill("-");
  const low: (number | string)[] = new Array(data.length).fill("-");
  const newHigh: (number | string)[] = new Array(data.length).fill("-");
  const newLow: (number | string)[] = new Array(data.length).fill("-");
  const timestamps = data.map((point) => parseBarTimestampMs(point.time));
  const highDeque: number[] = [];
  const lowDeque: number[] = [];
  let highHead = 0;
  let lowHead = 0;
  const windowMs = 364 * 24 * 60 * 60 * 1000;

  for (let index = 0; index < data.length; index++) {
    const timestamp = timestamps[index];
    if (timestamp === null) continue;

    const windowStart = timestamp - windowMs;
    while (highHead < highDeque.length && (timestamps[highDeque[highHead]] ?? Number.NEGATIVE_INFINITY) < windowStart) highHead += 1;
    while (lowHead < lowDeque.length && (timestamps[lowDeque[lowHead]] ?? Number.NEGATIVE_INFINITY) < windowStart) lowHead += 1;

    const currentHigh = toFinitePriceValue(data[index].high);
    const currentLow = toFinitePriceValue(data[index].low);
    const previousHighIndex = highDeque[highHead];
    const previousLowIndex = lowDeque[lowHead];
    if (currentHigh !== null && previousHighIndex !== undefined) {
      const previousHigh = toFinitePriceValue(data[previousHighIndex].high);
      if (previousHigh !== null) newHigh[index] = currentHigh >= previousHigh ? 1 : 0;
    }
    if (currentLow !== null && previousLowIndex !== undefined) {
      const previousLow = toFinitePriceValue(data[previousLowIndex].low);
      if (previousLow !== null) newLow[index] = currentLow <= previousLow ? 1 : 0;
    }

    if (currentHigh !== null) {
      while (highDeque.length > highHead) {
        const dequeHigh = toFinitePriceValue(data[highDeque[highDeque.length - 1]].high);
        if (dequeHigh === null || dequeHigh > currentHigh) break;
        highDeque.pop();
      }
      highDeque.push(index);
    }
    if (currentLow !== null) {
      while (lowDeque.length > lowHead) {
        const dequeLow = toFinitePriceValue(data[lowDeque[lowDeque.length - 1]].low);
        if (dequeLow === null || dequeLow < currentLow) break;
        lowDeque.pop();
      }
      lowDeque.push(index);
    }

    const activeHighIndex = highDeque[highHead];
    const activeLowIndex = lowDeque[lowHead];
    const highValue = activeHighIndex !== undefined ? toFinitePriceValue(data[activeHighIndex].high) : null;
    const lowValue = activeLowIndex !== undefined ? toFinitePriceValue(data[activeLowIndex].low) : null;
    if (highValue !== null) high[index] = roundIndicatorValue(highValue, 4);
    if (lowValue !== null) low[index] = roundIndicatorValue(lowValue, 4);

    if (highHead > 512 && highHead * 2 > highDeque.length) {
      highDeque.splice(0, highHead);
      highHead = 0;
    }
    if (lowHead > 512 && lowHead * 2 > lowDeque.length) {
      lowDeque.splice(0, lowHead);
      lowHead = 0;
    }
  }

  return { high, low, newHigh, newLow };
};

export const calculateHistoricalRecordLevels = (data: ChartDataPoint[]): HistoricalRecordLevels => {
  const ath: (number | string)[] = new Array(data.length).fill("-");
  const atl: (number | string)[] = new Array(data.length).fill("-");
  const newAth: (number | string)[] = new Array(data.length).fill("-");
  const newAtl: (number | string)[] = new Array(data.length).fill("-");
  let allTimeHigh: number | null = null;
  let allTimeLow: number | null = null;

  for (let index = 0; index < data.length; index++) {
    const currentHigh = toFinitePriceValue(data[index].high);
    const currentLow = toFinitePriceValue(data[index].low);

    if (currentHigh !== null && allTimeHigh !== null) {
      newAth[index] = currentHigh >= allTimeHigh ? 1 : 0;
    }
    if (currentLow !== null && allTimeLow !== null) {
      newAtl[index] = currentLow <= allTimeLow ? 1 : 0;
    }

    if (currentHigh !== null) allTimeHigh = allTimeHigh === null ? currentHigh : Math.max(allTimeHigh, currentHigh);
    if (currentLow !== null) allTimeLow = allTimeLow === null ? currentLow : Math.min(allTimeLow, currentLow);

    if (allTimeHigh !== null) ath[index] = roundIndicatorValue(allTimeHigh, 4);
    if (allTimeLow !== null) atl[index] = roundIndicatorValue(allTimeLow, 4);
  }

  return { ath, atl, newAth, newAtl };
};

const createEmptyPriceActionSignals = (length: number): PriceActionSignals => ({
  resistance: new Array(length).fill("-"),
  support: new Array(length).fill("-"),
  breakoutResistance: new Array(length).fill("-"),
  breakdownSupport: new Array(length).fill("-"),
  gapUp: new Array(length).fill("-"),
  gapDown: new Array(length).fill("-"),
  trueGapUp: new Array(length).fill("-"),
  trueGapDown: new Array(length).fill("-"),
  gapAbs: new Array(length).fill("-"),
  gapPct: new Array(length).fill("-"),
  isUpDay: new Array(length).fill("-"),
  isDownDay: new Array(length).fill("-"),
  upStreak: new Array(length).fill("-"),
  downStreak: new Array(length).fill("-"),
  insideBar: new Array(length).fill("-"),
  outsideBar: new Array(length).fill("-"),
});

const getPriceDecimalPlaces = (value: number): number => {
  const normalized = value.toString().toLowerCase();
  if (!normalized.includes("e")) {
    const decimalPart = normalized.split(".")[1];
    return decimalPart ? decimalPart.length : 0;
  }

  const fixed = value.toFixed(8).replace(/0+$/, "");
  const decimalPart = fixed.split(".")[1];
  return decimalPart ? decimalPart.length : 0;
};

const inferPriceActionTickSize = (data: ChartDataPoint[]): number => {
  let maxDecimalPlaces = 0;
  for (const point of data) {
    const values = [point.open, point.high, point.low, point.close];
    for (const value of values) {
      const price = toFinitePriceValue(value);
      if (price !== null) maxDecimalPlaces = Math.max(maxDecimalPlaces, getPriceDecimalPlaces(price));
    }
  }

  if (maxDecimalPlaces <= 0) return 1;
  return 1 / 10 ** Math.min(maxDecimalPlaces, 6);
};

export const calculatePriceActionSignals = (
  data: ChartDataPoint[],
  options: PriceActionSignalOptions = {},
): PriceActionSignals => {
  const result = createEmptyPriceActionSignals(data.length);
  if (data.length === 0) return result;

  const lookback = Math.max(1, Math.floor(options.lookback ?? 20));
  const tickSize = options.tickSize && Number.isFinite(options.tickSize) && options.tickSize > 0
    ? options.tickSize
    : inferPriceActionTickSize(data);
  const minBreakTicks = Math.max(1, Math.floor(options.minBreakTicks ?? 1));
  const minGapTicks = Math.max(1, Math.floor(options.minGapTicks ?? 1));
  const openValues = data.map((point) => toFinitePriceValue(point.open));
  const highValues = data.map((point) => toFinitePriceValue(point.high));
  const lowValues = data.map((point) => toFinitePriceValue(point.low));
  const closeValues = data.map((point) => toFinitePriceValue(point.close));
  const volumeValues = data.map((point) => toFiniteVolumeValue(point.volume));
  const validBars = data.map((_, index) => {
    const open = openValues[index];
    const high = highValues[index];
    const low = lowValues[index];
    const close = closeValues[index];
    const volume = volumeValues[index];
    return open !== null
      && high !== null
      && low !== null
      && close !== null
      && volume !== null
      && volume > 0
      && high >= low;
  });
  const toTicks = (value: number) => Math.round(value / tickSize);
  const highDeque: number[] = [];
  const lowDeque: number[] = [];
  let highHead = 0;
  let lowHead = 0;
  let invalidWindowCount = 0;
  let upStreak = 0;
  let downStreak = 0;

  for (let index = 0; index < data.length; index++) {
    const expiredIndex = index - lookback - 1;
    if (expiredIndex >= 0 && !validBars[expiredIndex]) invalidWindowCount -= 1;
    while (highHead < highDeque.length && highDeque[highHead] < index - lookback) highHead += 1;
    while (lowHead < lowDeque.length && lowDeque[lowHead] < index - lookback) lowHead += 1;

    const currentValid = validBars[index];
    const previousValid = index > 0 && validBars[index - 1];
    const close = closeValues[index];
    const currentHigh = highValues[index];
    const currentLow = lowValues[index];
    const currentOpen = openValues[index];

    if (index >= lookback && invalidWindowCount === 0) {
      const resistanceIndex = highDeque[highHead];
      const supportIndex = lowDeque[lowHead];
      const resistance = resistanceIndex !== undefined ? highValues[resistanceIndex] : null;
      const support = supportIndex !== undefined ? lowValues[supportIndex] : null;
      if (resistance !== null) result.resistance[index] = roundIndicatorValue(resistance, 4);
      if (support !== null) result.support[index] = roundIndicatorValue(support, 4);
      if (currentValid && close !== null && resistance !== null && support !== null) {
        const closeTicks = toTicks(close);
        result.breakoutResistance[index] = closeTicks >= toTicks(resistance) + minBreakTicks ? 1 : 0;
        result.breakdownSupport[index] = closeTicks <= toTicks(support) - minBreakTicks ? 1 : 0;
      }
    }

    if (currentValid && previousValid) {
      const previousClose = closeValues[index - 1];
      const previousHigh = highValues[index - 1];
      const previousLow = lowValues[index - 1];
      if (currentOpen !== null && currentHigh !== null && currentLow !== null && close !== null && previousClose !== null && previousHigh !== null && previousLow !== null) {
        const openTicks = toTicks(currentOpen);
        const closeTicks = toTicks(close);
        const previousCloseTicks = toTicks(previousClose);
        const highTicks = toTicks(currentHigh);
        const lowTicks = toTicks(currentLow);
        const previousHighTicks = toTicks(previousHigh);
        const previousLowTicks = toTicks(previousLow);
        const gapAbsValue = currentOpen - previousClose;
        const isUpDay = closeTicks >= previousCloseTicks + 1;
        const isDownDay = closeTicks <= previousCloseTicks - 1;

        result.gapAbs[index] = roundIndicatorValue(gapAbsValue, 4);
        result.gapPct[index] = previousClose > 0 ? roundIndicatorValue((gapAbsValue / previousClose) * 100, 4) : "-";
        result.gapUp[index] = openTicks >= previousCloseTicks + minGapTicks ? 1 : 0;
        result.gapDown[index] = openTicks <= previousCloseTicks - minGapTicks ? 1 : 0;
        result.trueGapUp[index] = lowTicks >= previousHighTicks + minGapTicks ? 1 : 0;
        result.trueGapDown[index] = highTicks <= previousLowTicks - minGapTicks ? 1 : 0;
        result.isUpDay[index] = isUpDay ? 1 : 0;
        result.isDownDay[index] = isDownDay ? 1 : 0;
        upStreak = isUpDay ? upStreak + 1 : 0;
        downStreak = isDownDay ? downStreak + 1 : 0;
        result.upStreak[index] = upStreak;
        result.downStreak[index] = downStreak;
        result.insideBar[index] = highTicks <= previousHighTicks && lowTicks >= previousLowTicks ? 1 : 0;
        result.outsideBar[index] = highTicks >= previousHighTicks
          && lowTicks <= previousLowTicks
          && (highTicks > previousHighTicks || lowTicks < previousLowTicks)
          ? 1
          : 0;
      }
    } else {
      upStreak = 0;
      downStreak = 0;
    }

    if (!currentValid) invalidWindowCount += 1;
    if (currentValid && currentHigh !== null) {
      while (highDeque.length > highHead) {
        const queuedHigh = highValues[highDeque[highDeque.length - 1]];
        if (queuedHigh === null || queuedHigh > currentHigh) break;
        highDeque.pop();
      }
      highDeque.push(index);
    }
    if (currentValid && currentLow !== null) {
      while (lowDeque.length > lowHead) {
        const queuedLow = lowValues[lowDeque[lowDeque.length - 1]];
        if (queuedLow === null || queuedLow < currentLow) break;
        lowDeque.pop();
      }
      lowDeque.push(index);
    }
    if (highHead > 512 && highHead * 2 > highDeque.length) {
      highDeque.splice(0, highHead);
      highHead = 0;
    }
    if (lowHead > 512 && lowHead * 2 > lowDeque.length) {
      lowDeque.splice(0, lowHead);
      lowHead = 0;
    }
  }

  return result;
};


const createSignalSeries = (length: number, initial: number | string = "-"): (number | string)[] =>
  new Array(length).fill(initial);

const createEmptyCandlestickPatternSignals = (length: number): CandlestickPatternSignals => ({
  realBody: createSignalSeries(length),
  highLowRange: createSignalSeries(length),
  upperShadow: createSignalSeries(length),
  lowerShadow: createSignalSeries(length),
  bodyShortAvg: createSignalSeries(length),
  bodyLongAvg: createSignalSeries(length),
  bodyDojiMax: createSignalSeries(length),
  shadowVeryShortMax: createSignalSeries(length),
  nearTolerance: createSignalSeries(length),
  farTolerance: createSignalSeries(length),
  equalTolerance: createSignalSeries(length),
  avgRange10: createSignalSeries(length),
  avgRange5: createSignalSeries(length),
  dojiMaxBody: createSignalSeries(length),
  veryShortShadowMax: createSignalSeries(length),
  nearMidTolerance: createSignalSeries(length),
  uptrend: createSignalSeries(length),
  downtrend: createSignalSeries(length),
  doji: createSignalSeries(length),
  longLeggedDoji: createSignalSeries(length),
  rickshawMan: createSignalSeries(length),
  dragonflyDoji: createSignalSeries(length),
  gravestoneDoji: createSignalSeries(length),
  tristar: createSignalSeries(length),
  bullishTristar: createSignalSeries(length),
  bearishTristar: createSignalSeries(length),
  hammer: createSignalSeries(length),
  hangingMan: createSignalSeries(length),
  takuri: createSignalSeries(length),
  invertedHammer: createSignalSeries(length),
  shootingStar: createSignalSeries(length),
  engulfingBullish: createSignalSeries(length),
  engulfingBearish: createSignalSeries(length),
  haramiBullish: createSignalSeries(length),
  haramiBearish: createSignalSeries(length),
  tweezerTop: createSignalSeries(length),
  tweezerBottom: createSignalSeries(length),
  piercingLine: createSignalSeries(length),
  darkCloudCover: createSignalSeries(length),
  tasukiGap: createSignalSeries(length),
  separatingLines: createSignalSeries(length),
  thrusting: createSignalSeries(length),
  counterattack: createSignalSeries(length),
  morningStar: createSignalSeries(length),
  eveningStar: createSignalSeries(length),
  threeWhiteSoldiers: createSignalSeries(length),
  threeBlackCrows: createSignalSeries(length),
  threeInsideUp: createSignalSeries(length),
  threeInsideDown: createSignalSeries(length),
  uniqueThreeRiver: createSignalSeries(length),
  upsideGapTwoCrows: createSignalSeries(length),
  kickerBull: createSignalSeries(length),
  kickerBear: createSignalSeries(length),
  abandonedBabyBull: createSignalSeries(length),
  abandonedBabyBear: createSignalSeries(length),
  beltHoldBull: createSignalSeries(length),
  beltHoldBear: createSignalSeries(length),
  breakawayBull: createSignalSeries(length),
  breakawayBear: createSignalSeries(length),
  risingThreeMethods: createSignalSeries(length),
  fallingThreeMethods: createSignalSeries(length),
  matHold: createSignalSeries(length),
  gapSideBySideWhite: createSignalSeries(length),
  hikkake: createSignalSeries(length),
  concealingBabySwallow: createSignalSeries(length),
  ladderBottom: createSignalSeries(length),
  ladderBottomBrvm: createSignalSeries(length),
  stickSandwich: createSignalSeries(length),
  marubozuBull: createSignalSeries(length),
  marubozuBear: createSignalSeries(length),
  spinningTop: createSignalSeries(length),
  hammerConfirmed: createSignalSeries(length),
  hangingManConfirmed: createSignalSeries(length),
  invertedHammerConfirmed: createSignalSeries(length),
  shootingStarConfirmed: createSignalSeries(length),
  engulfingBullishConfirmed: createSignalSeries(length),
  engulfingBearishConfirmed: createSignalSeries(length),
  haramiBullishConfirmed: createSignalSeries(length),
  haramiBearishConfirmed: createSignalSeries(length),
  tweezerTopConfirmed: createSignalSeries(length),
  tweezerBottomConfirmed: createSignalSeries(length),
  piercingLineConfirmed: createSignalSeries(length),
  darkCloudCoverConfirmed: createSignalSeries(length),
  tasukiGapConfirmed: createSignalSeries(length),
  separatingLinesConfirmed: createSignalSeries(length),
  thrustingConfirmed: createSignalSeries(length),
  counterattackConfirmed: createSignalSeries(length),
  morningStarConfirmed: createSignalSeries(length),
  eveningStarConfirmed: createSignalSeries(length),
  threeWhiteSoldiersConfirmed: createSignalSeries(length),
  threeBlackCrowsConfirmed: createSignalSeries(length),
  threeInsideUpConfirmed: createSignalSeries(length),
  threeInsideDownConfirmed: createSignalSeries(length),
  uniqueThreeRiverConfirmed: createSignalSeries(length),
  upsideGapTwoCrowsConfirmed: createSignalSeries(length),
  kickerBullConfirmed: createSignalSeries(length),
  kickerBearConfirmed: createSignalSeries(length),
  abandonedBabyBullConfirmed: createSignalSeries(length),
  abandonedBabyBearConfirmed: createSignalSeries(length),
  beltHoldBullConfirmed: createSignalSeries(length),
  beltHoldBearConfirmed: createSignalSeries(length),
  breakawayBullConfirmed: createSignalSeries(length),
  breakawayBearConfirmed: createSignalSeries(length),
  risingThreeMethodsConfirmed: createSignalSeries(length),
  fallingThreeMethodsConfirmed: createSignalSeries(length),
  matHoldConfirmed: createSignalSeries(length),
  gapSideBySideWhiteConfirmed: createSignalSeries(length),
  hikkakeConfirmed: createSignalSeries(length),
  concealingBabySwallowConfirmed: createSignalSeries(length),
  ladderBottomConfirmed: createSignalSeries(length),
  ladderBottomBrvmConfirmed: createSignalSeries(length),
  stickSandwichConfirmed: createSignalSeries(length),
  insufficientHistory: createSignalSeries(length, 0),
  missingOHLC: createSignalSeries(length, 0),
  invalidOHLC: createSignalSeries(length, 0),
  zeroRange: createSignalSeries(length, 0),
  noTradeSession: createSignalSeries(length, 0),
  stalePrice: createSignalSeries(length, 0),
  corporateActionSuspected: createSignalSeries(length, 0),
  lowReliabilityBecauseIlliquid: createSignalSeries(length, 0),
});

type CandlestickMetrics = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  tradesCount: number | null;
  realBody: number;
  range: number;
  upperShadow: number;
  lowerShadow: number;
  bodyTop: number;
  bodyBottom: number;
};

const normalizeCandlestickPeriod = (value: number | undefined, fallback: number): number =>
  Math.max(1, Math.floor(value ?? fallback));

const readRollingAverage = (
  sumPrefix: number[],
  validPrefix: number[],
  index: number,
  period: number,
): number | null => {
  if (index < period) return null;
  const start = index - period;
  const validCount = validPrefix[index] - validPrefix[start];
  if (validCount !== period) return null;
  return (sumPrefix[index] - sumPrefix[start]) / period;
};

const readTrailingSma = (
  sumPrefix: number[],
  validPrefix: number[],
  endIndex: number,
  period: number,
): number | null => {
  if (endIndex < 0 || endIndex + 1 < period) return null;
  const start = endIndex + 1 - period;
  const validCount = validPrefix[endIndex + 1] - validPrefix[start];
  if (validCount !== period) return null;
  return (sumPrefix[endIndex + 1] - sumPrefix[start]) / period;
};

const writeBooleanSignal = (series: (number | string)[], index: number, value: boolean | null): void => {
  series[index] = value === null ? "-" : value ? 1 : 0;
};

const toPatternConfirmationSignal = (shape: boolean, trend: boolean | null): number | string => {
  if (!shape) return 0;
  return trend === null ? "-" : trend ? 1 : 0;
};

const resolveContainmentScore = (strict: boolean, loose: boolean): 100 | 80 | 0 => {
  if (strict) return 100;
  return loose ? 80 : 0;
};

const isWithinPriceTolerance = (left: number, right: number, tolerance: number): boolean => {
  const epsilon = Math.max(1e-10, Number.EPSILON * Math.max(Math.abs(left), Math.abs(right), tolerance, 1) * 8);
  return Math.abs(left - right) <= tolerance + epsilon;
};

const hasRealBodyGapUp = (right: CandlestickMetrics, left: CandlestickMetrics): boolean =>
  right.bodyBottom > left.bodyTop;

const hasRealBodyGapDown = (right: CandlestickMetrics, left: CandlestickMetrics): boolean =>
  right.bodyTop < left.bodyBottom;

const isOpenInsideBody = (target: CandlestickMetrics, container: CandlestickMetrics): boolean =>
  target.open >= container.bodyBottom && target.open <= container.bodyTop;

type PendingHikkakeSignal = {
  shapeIndex: number;
  expiresAt: number;
  direction: 1 | -1;
  insideHigh: number;
  insideLow: number;
};

export const calculateCandlestickPatterns = (
  data: ChartDataPoint[],
  options: CandlestickPatternOptions = {},
): CandlestickPatternSignals => {
  const result = createEmptyCandlestickPatternSignals(data.length);
  if (data.length === 0) return result;

  const bodyShortPeriod = normalizeCandlestickPeriod(options.bodyShortPeriod, 10);
  const bodyLongPeriod = normalizeCandlestickPeriod(options.bodyLongPeriod, 10);
  const bodyDojiPeriod = normalizeCandlestickPeriod(options.bodyDojiPeriod ?? options.dojiAvgPeriod, 10);
  const shadowVeryShortPeriod = normalizeCandlestickPeriod(
    options.shadowVeryShortPeriod ?? options.veryShortShadowAvgPeriod,
    10,
  );
  const nearPeriod = normalizeCandlestickPeriod(options.nearPeriod ?? options.nearAvgPeriod, 5);
  const farPeriod = normalizeCandlestickPeriod(options.farPeriod ?? options.nearAvgPeriod, 5);
  const trendFilterPeriod = normalizeCandlestickPeriod(options.trendFilterPeriod, 20);
  const bodyDojiFactor = options.bodyDojiFactor ?? options.dojiFactor ?? 0.10;
  const shadowVeryShortFactor = options.shadowVeryShortFactor ?? options.veryShortShadowFactor ?? 0.10;
  const nearFactor = options.nearFactor ?? 0.20;
  const farFactor = options.farFactor ?? 0.60;
  const equalFactor = options.equalFactor ?? 0.05;
  const bodyLongFactor = options.bodyLongFactor ?? 1.0;
  const bodyShortFactor = options.bodyShortFactor ?? 1.0;
  const penetrationDarkCloud = options.penetrationDarkCloud ?? 0.5;
  const morningEveningPenetration = options.morningEveningPenetration ?? 0.30;
  const abandonedBabyPenetration = options.abandonedBabyPenetration ?? 0.30;
  const matHoldPenetration = options.matHoldPenetration ?? 0.50;
  const requireVolumeForPattern = options.requireVolumeForPattern ?? false;
  const tickSize = options.tickSize && Number.isFinite(options.tickSize) && options.tickSize > 0
    ? options.tickSize
    : inferPriceActionTickSize(data);
  const toTicks = (value: number) => Math.round(value / tickSize);
  const toPrice = (ticks: number) => ticks * tickSize;

  const metrics: Array<CandlestickMetrics | null> = new Array(data.length).fill(null);
  const validPrefix = new Array(data.length + 1).fill(0);
  const bodyPrefix = new Array(data.length + 1).fill(0);
  const rangePrefix = new Array(data.length + 1).fill(0);
  const closePrefix = new Array(data.length + 1).fill(0);
  const volumePrefix = new Array(data.length + 1).fill(0);
  const bodyTopValues: Array<number | null> = new Array(data.length).fill(null);
  const bodyBottomValues: Array<number | null> = new Array(data.length).fill(null);
  const dojiFlags: Array<boolean | null> = new Array(data.length).fill(null);
  const nearToleranceValues: Array<number | null> = new Array(data.length).fill(null);
  const pendingHikkakeSignals: PendingHikkakeSignal[] = [];

  for (let index = 0; index < data.length; index++) {
    const point = data[index];
    const open = toFinitePriceValue(point.open);
    const high = toFinitePriceValue(point.high);
    const low = toFinitePriceValue(point.low);
    const close = toFinitePriceValue(point.close);
    const volume = toFiniteVolumeValue(point.volume);
    const tradesCount = toFiniteTradeCountValue(point);
    const missingOHLC = open === null || high === null || low === null || close === null;
    const invalidOHLC = !missingOHLC && (high < low || open < low || open > high || close < low || close > high);
    const zeroRange = !missingOHLC && !invalidOHLC && high === low;
    const hasMissingVolume = volume === null;
    const noTradeSession = (!hasMissingVolume && volume <= 0) || (tradesCount !== null && tradesCount <= 0);
    const blockedByVolume = requireVolumeForPattern && (hasMissingVolume || noTradeSession);

    result.missingOHLC[index] = missingOHLC ? 1 : 0;
    result.invalidOHLC[index] = invalidOHLC ? 1 : 0;
    result.zeroRange[index] = zeroRange ? 1 : 0;
    result.noTradeSession[index] = noTradeSession ? 1 : 0;

    if (!missingOHLC && !invalidOHLC && !zeroRange && !blockedByVolume) {
      const o = toTicks(open);
      const h = toTicks(high);
      const l = toTicks(low);
      const c = toTicks(close);
      const bodyTop = Math.max(o, c);
      const bodyBottom = Math.min(o, c);
      const realBody = Math.abs(c - o) * tickSize;
      const range = (h - l) * tickSize;
      const upperShadow = (h - bodyTop) * tickSize;
      const lowerShadow = (bodyBottom - l) * tickSize;
      metrics[index] = {
        open: toPrice(o),
        high: toPrice(h),
        low: toPrice(l),
        close: toPrice(c),
        volume: volume ?? 0,
        tradesCount,
        realBody,
        range,
        upperShadow,
        lowerShadow,
        bodyTop: toPrice(bodyTop),
        bodyBottom: toPrice(bodyBottom),
      };
      bodyTopValues[index] = toPrice(bodyTop);
      bodyBottomValues[index] = toPrice(bodyBottom);
    }

    const current = metrics[index];
    const valid = current !== null;
    validPrefix[index + 1] = validPrefix[index] + (valid ? 1 : 0);
    bodyPrefix[index + 1] = bodyPrefix[index] + (current?.realBody ?? 0);
    rangePrefix[index + 1] = rangePrefix[index] + (current?.range ?? 0);
    closePrefix[index + 1] = closePrefix[index] + (current?.close ?? 0);
    volumePrefix[index + 1] = volumePrefix[index] + (current?.volume ?? 0);
  }

  const resolveTrend = (index: number): { uptrend: boolean | null; downtrend: boolean | null } => {
    const previousIndex = index - 1;
    const slopeAnchorIndex = index - 5;
    if (previousIndex < 0 || slopeAnchorIndex < 0) return { uptrend: null, downtrend: null };
    const previous = metrics[previousIndex];
    const previousSma = readTrailingSma(closePrefix, validPrefix, previousIndex, trendFilterPeriod);
    const anchorSma = readTrailingSma(closePrefix, validPrefix, slopeAnchorIndex, trendFilterPeriod);
    if (!previous || previousSma === null || anchorSma === null) return { uptrend: null, downtrend: null };
    return {
      uptrend: previous.close > previousSma && previousSma > anchorSma,
      downtrend: previous.close < previousSma && previousSma < anchorSma,
    };
  };

  const readBodyLongAverageAt = (targetIndex: number): number | null =>
    readRollingAverage(bodyPrefix, validPrefix, targetIndex, bodyLongPeriod);
  const readBodyShortAverageAt = (targetIndex: number): number | null =>
    readRollingAverage(bodyPrefix, validPrefix, targetIndex, bodyShortPeriod);
  const readShadowVeryShortMaxAt = (targetIndex: number): number | null => {
    const averageRange = readRollingAverage(rangePrefix, validPrefix, targetIndex, shadowVeryShortPeriod);
    return averageRange === null ? null : shadowVeryShortFactor * averageRange;
  };
  const readBodyDojiMaxAt = (targetIndex: number): number | null => {
    const averageRange = readRollingAverage(rangePrefix, validPrefix, targetIndex, bodyDojiPeriod);
    return averageRange === null ? null : bodyDojiFactor * averageRange;
  };
  const readNearToleranceAt = (targetIndex: number): number | null => {
    const averageRange = readRollingAverage(rangePrefix, validPrefix, targetIndex, nearPeriod);
    return averageRange === null ? null : nearFactor * averageRange;
  };
  const readFarToleranceAt = (targetIndex: number): number | null => {
    const averageRange = readRollingAverage(rangePrefix, validPrefix, targetIndex, farPeriod);
    return averageRange === null ? null : farFactor * averageRange;
  };
  const readEqualToleranceAt = (targetIndex: number): number | null => {
    const averageRange = readRollingAverage(rangePrefix, validPrefix, targetIndex, nearPeriod);
    return averageRange === null ? null : Math.max(tickSize, equalFactor * averageRange);
  };

  for (let index = 0; index < data.length; index++) {
    const current = metrics[index];
    if (!current) continue;

    const bodyShortAvg = readRollingAverage(bodyPrefix, validPrefix, index, bodyShortPeriod);
    const bodyLongAvg = readRollingAverage(bodyPrefix, validPrefix, index, bodyLongPeriod);
    const bodyDojiAvgRange = readRollingAverage(rangePrefix, validPrefix, index, bodyDojiPeriod);
    const shadowVeryShortAvgRange = readRollingAverage(rangePrefix, validPrefix, index, shadowVeryShortPeriod);
    const nearAvgRange = readRollingAverage(rangePrefix, validPrefix, index, nearPeriod);
    const farAvgRange = readRollingAverage(rangePrefix, validPrefix, index, farPeriod);
    const bodyDojiMax = bodyDojiAvgRange === null ? null : bodyDojiFactor * bodyDojiAvgRange;
    const shadowVeryShortMax = shadowVeryShortAvgRange === null ? null : shadowVeryShortFactor * shadowVeryShortAvgRange;
    const nearTolerance = nearAvgRange === null ? null : nearFactor * nearAvgRange;
    const farTolerance = farAvgRange === null ? null : farFactor * farAvgRange;
    const equalTolerance = nearAvgRange === null ? null : Math.max(tickSize, equalFactor * nearAvgRange);
    const previousVolumeAvg = readRollingAverage(volumePrefix, validPrefix, index, 10);
    const insufficientHistory = bodyShortAvg === null
      || bodyLongAvg === null
      || bodyDojiMax === null
      || shadowVeryShortMax === null
      || nearTolerance === null
      || farTolerance === null
      || equalTolerance === null;

    result.realBody[index] = roundIndicatorValue(current.realBody, 4);
    result.highLowRange[index] = roundIndicatorValue(current.range, 4);
    result.upperShadow[index] = roundIndicatorValue(current.upperShadow, 4);
    result.lowerShadow[index] = roundIndicatorValue(current.lowerShadow, 4);
    if (bodyShortAvg !== null) result.bodyShortAvg[index] = roundIndicatorValue(bodyShortAvg, 4);
    if (bodyLongAvg !== null) result.bodyLongAvg[index] = roundIndicatorValue(bodyLongAvg, 4);
    if (bodyDojiMax !== null) {
      result.bodyDojiMax[index] = roundIndicatorValue(bodyDojiMax, 4);
      result.dojiMaxBody[index] = roundIndicatorValue(bodyDojiMax, 4);
    }
    if (shadowVeryShortMax !== null) {
      result.shadowVeryShortMax[index] = roundIndicatorValue(shadowVeryShortMax, 4);
      result.veryShortShadowMax[index] = roundIndicatorValue(shadowVeryShortMax, 4);
    }
    if (nearTolerance !== null) {
      result.nearTolerance[index] = roundIndicatorValue(nearTolerance, 4);
      result.nearMidTolerance[index] = roundIndicatorValue(nearTolerance, 4);
      nearToleranceValues[index] = nearTolerance;
    }
    if (farTolerance !== null) result.farTolerance[index] = roundIndicatorValue(farTolerance, 4);
    if (equalTolerance !== null) result.equalTolerance[index] = roundIndicatorValue(equalTolerance, 4);
    if (bodyDojiAvgRange !== null) result.avgRange10[index] = roundIndicatorValue(bodyDojiAvgRange, 4);
    if (nearAvgRange !== null) result.avgRange5[index] = roundIndicatorValue(nearAvgRange, 4);
    result.insufficientHistory[index] = insufficientHistory ? 1 : 0;
    result.lowReliabilityBecauseIlliquid[index] = previousVolumeAvg !== null && current.volume <= Math.max(1, previousVolumeAvg * 0.10) ? 1 : 0;

    const { uptrend, downtrend } = resolveTrend(index);
    writeBooleanSignal(result.uptrend, index, uptrend);
    writeBooleanSignal(result.downtrend, index, downtrend);

    if (bodyShortAvg === null || bodyLongAvg === null || bodyDojiMax === null || shadowVeryShortMax === null || nearTolerance === null || farTolerance === null || equalTolerance === null) {
      continue;
    }

    const previous = index > 0 ? metrics[index - 1] : null;
    const twoBack = index > 1 ? metrics[index - 2] : null;
    const threeBack = index > 2 ? metrics[index - 3] : null;
    const fourBack = index > 3 ? metrics[index - 4] : null;
    const previousNearTolerance = index > 0 ? nearToleranceValues[index - 1] : null;
    const isDoji = current.realBody <= bodyDojiMax;
    const longLeggedDoji = isDoji && (current.upperShadow > current.realBody || current.lowerShadow > current.realBody);
    const midRange = current.low + current.range / 2;
    const rickshawMan = isDoji
      && current.upperShadow > current.realBody
      && current.lowerShadow > current.realBody
      && current.bodyBottom <= midRange + nearTolerance
      && current.bodyTop >= midRange - nearTolerance;
    const dragonflyDoji = isDoji && current.upperShadow < shadowVeryShortMax && current.lowerShadow > shadowVeryShortMax;
    const gravestoneDoji = isDoji && current.lowerShadow < shadowVeryShortMax && current.upperShadow > shadowVeryShortMax;
    const hasPreviousNear = previous !== null && previousNearTolerance !== null;
    const hammerShape = hasPreviousNear
      && current.realBody < bodyShortAvg
      && current.lowerShadow > current.realBody
      && current.upperShadow < shadowVeryShortMax
      && current.bodyBottom <= previous.low + previousNearTolerance;
    const hangingManShape = hasPreviousNear
      && current.realBody < bodyShortAvg
      && current.lowerShadow > current.realBody
      && current.upperShadow < shadowVeryShortMax
      && current.bodyBottom >= previous.high - previousNearTolerance;
    const takuri = isDoji
      && current.upperShadow < shadowVeryShortMax
      && current.lowerShadow > 2 * current.realBody;
    const invertedHammerShape = previous !== null
      && current.realBody < bodyShortAvg
      && current.upperShadow > current.realBody
      && current.lowerShadow < shadowVeryShortMax
      && current.bodyTop < previous.bodyBottom;
    const shootingStarShape = previous !== null
      && current.realBody < bodyShortAvg
      && current.upperShadow > current.realBody
      && current.lowerShadow < shadowVeryShortMax
      && current.bodyBottom > previous.bodyTop;
    const marubozu = current.realBody > bodyLongAvg
      && current.upperShadow < shadowVeryShortMax
      && current.lowerShadow < shadowVeryShortMax;
    const marubozuBull = marubozu && current.close > current.open;
    const marubozuBear = marubozu && current.close < current.open;
    const spinningTop = current.realBody < bodyShortAvg
      && current.upperShadow > current.realBody
      && current.lowerShadow > current.realBody;

    const previousBodyLongAvg = index > 0 ? readBodyLongAverageAt(index - 1) : null;
    const previousBodyShortAvg = index > 0 ? readBodyShortAverageAt(index - 1) : null;
    const twoBackBodyLongAvg = index > 1 ? readBodyLongAverageAt(index - 2) : null;
    const twoBackBodyShortAvg = index > 1 ? readBodyShortAverageAt(index - 2) : null;
    const threeBackBodyShortAvg = index > 2 ? readBodyShortAverageAt(index - 3) : null;
    const previousShadowVeryShortMax = index > 0 ? readShadowVeryShortMaxAt(index - 1) : null;
    const twoBackShadowVeryShortMax = index > 1 ? readShadowVeryShortMaxAt(index - 2) : null;
    const threeBackShadowVeryShortMax = index > 2 ? readShadowVeryShortMaxAt(index - 3) : null;
    const previousNearForPattern = index > 0 ? readNearToleranceAt(index - 1) : null;
    const twoBackNearForPattern = index > 1 ? readNearToleranceAt(index - 2) : null;
    const previousFarForPattern = index > 0 ? readFarToleranceAt(index - 1) : null;
    const twoBackFarForPattern = index > 1 ? readFarToleranceAt(index - 2) : null;
    const previousEqualForPattern = index > 0 ? readEqualToleranceAt(index - 1) : null;
    const twoBackEqualForPattern = index > 1 ? readEqualToleranceAt(index - 2) : null;
    const fourBackBodyLongAvg = index > 3 ? readBodyLongAverageAt(index - 4) : null;
    const previousBodyDojiMax = index > 0 ? readBodyDojiMaxAt(index - 1) : null;
    const isPreviousBullish = previous !== null && previous.close > previous.open;
    const isPreviousBearish = previous !== null && previous.close < previous.open;
    const isTwoBackBullish = twoBack !== null && twoBack.close > twoBack.open;
    const isTwoBackBearish = twoBack !== null && twoBack.close < twoBack.open;
    const isThreeBackBullish = threeBack !== null && threeBack.close > threeBack.open;
    const isThreeBackBearish = threeBack !== null && threeBack.close < threeBack.open;
    const isFourBackBullish = fourBack !== null && fourBack.close > fourBack.open;
    const isFourBackBearish = fourBack !== null && fourBack.close < fourBack.open;
    const isCurrentBullish = current.close > current.open;
    const isCurrentBearish = current.close < current.open;
    const isPreviousLong = previous !== null && previousBodyLongAvg !== null && previous.realBody > previousBodyLongAvg * bodyLongFactor;
    const isPreviousShort = previous !== null && previousBodyShortAvg !== null && previous.realBody <= previousBodyShortAvg * bodyShortFactor;
    const isTwoBackLong = twoBack !== null && twoBackBodyLongAvg !== null && twoBack.realBody > twoBackBodyLongAvg * bodyLongFactor;
    const isTwoBackShort = twoBack !== null && twoBackBodyShortAvg !== null && twoBack.realBody <= twoBackBodyShortAvg * bodyShortFactor;
    const isThreeBackShort = threeBack !== null && threeBackBodyShortAvg !== null && threeBack.realBody < threeBackBodyShortAvg * bodyShortFactor;
    const isFourBackLong = fourBack !== null && fourBackBodyLongAvg !== null && fourBack.realBody > fourBackBodyLongAvg * bodyLongFactor;
    const isCurrentLong = current.realBody > bodyLongAvg * bodyLongFactor;
    const isCurrentShort = current.realBody <= bodyShortAvg * bodyShortFactor;
    const isPreviousMarubozuBull = previous !== null
      && previousBodyLongAvg !== null
      && previousShadowVeryShortMax !== null
      && isPreviousBullish
      && previous.realBody > previousBodyLongAvg * bodyLongFactor
      && previous.upperShadow < previousShadowVeryShortMax
      && previous.lowerShadow < previousShadowVeryShortMax;
    const isPreviousMarubozuBear = previous !== null
      && previousBodyLongAvg !== null
      && previousShadowVeryShortMax !== null
      && isPreviousBearish
      && previous.realBody > previousBodyLongAvg * bodyLongFactor
      && previous.upperShadow < previousShadowVeryShortMax
      && previous.lowerShadow < previousShadowVeryShortMax;
    const bullishEngulfingStrict = Boolean(previous)
      && isPreviousBearish
      && isCurrentBullish
      && current.close > previous.open
      && current.open < previous.close;
    const bullishEngulfingLoose = Boolean(previous)
      && isPreviousBearish
      && isCurrentBullish
      && ((current.close >= previous.open && current.open < previous.close)
        || (current.close > previous.open && current.open <= previous.close));
    const bearishEngulfingStrict = Boolean(previous)
      && isPreviousBullish
      && isCurrentBearish
      && current.open > previous.close
      && current.close < previous.open;
    const bearishEngulfingLoose = Boolean(previous)
      && isPreviousBullish
      && isCurrentBearish
      && ((current.open >= previous.close && current.close < previous.open)
        || (current.open > previous.close && current.close <= previous.open));
    const engulfingBullishScore = resolveContainmentScore(bullishEngulfingStrict, bullishEngulfingLoose);
    const engulfingBearishScore = resolveContainmentScore(bearishEngulfingStrict, bearishEngulfingLoose);

    const haramiStrict = Boolean(previous)
      && isPreviousLong
      && isCurrentShort
      && current.bodyTop < previous.bodyTop
      && current.bodyBottom > previous.bodyBottom;
    const haramiLoose = Boolean(previous)
      && isPreviousLong
      && isCurrentShort
      && current.bodyTop <= previous.bodyTop
      && current.bodyBottom >= previous.bodyBottom;
    const haramiScore = resolveContainmentScore(haramiStrict, haramiLoose);
    const haramiBullishScore = isPreviousBearish ? haramiScore : 0;
    const haramiBearishScore = isPreviousBullish ? -haramiScore : 0;

    const sameHigh = previous !== null && isWithinPriceTolerance(current.high, previous.high, equalTolerance);
    const sameLow = previous !== null && isWithinPriceTolerance(current.low, previous.low, equalTolerance);
    const tweezerTopShape = sameHigh && previous.range > 0 && current.range > 0;
    const tweezerBottomShape = sameLow && previous.range > 0 && current.range > 0;

    const piercingLineBase = Boolean(previous)
      && isPreviousBearish
      && isPreviousLong
      && isCurrentBullish
      && isCurrentLong
      && current.close < previous.open
      && current.close > previous.close + previous.realBody * 0.5;
    const piercingLineStrictGap = previous !== null && current.open < previous.low;
    const piercingLineSessionOpen = previous !== null
      && current.open <= previous.close + equalTolerance
      && current.open < previous.open;
    const piercingLineShape = piercingLineBase && piercingLineStrictGap;
    const piercingLineSessionShape = piercingLineBase && !piercingLineStrictGap && piercingLineSessionOpen;
    const piercingLineScore = piercingLineShape ? 100 : piercingLineSessionShape ? 80 : 0;

    const darkCloudCoverBase = Boolean(previous)
      && isPreviousBullish
      && isPreviousLong
      && isCurrentBearish
      && current.close > previous.open
      && current.close < previous.close - previous.realBody * penetrationDarkCloud;
    const darkCloudCoverStrictGap = previous !== null && current.open > previous.high;
    const darkCloudCoverSessionOpen = previous !== null
      && current.open >= previous.close - equalTolerance
      && current.open > previous.open;
    const darkCloudCoverShape = darkCloudCoverBase && darkCloudCoverStrictGap;
    const darkCloudCoverSessionShape = darkCloudCoverBase && !darkCloudCoverStrictGap && darkCloudCoverSessionOpen;
    const darkCloudCoverScore = darkCloudCoverShape ? -100 : darkCloudCoverSessionShape ? -80 : 0;

    const tasukiGapUpsideShape = twoBack !== null
      && previous !== null
      && isTwoBackBullish
      && isPreviousBullish
      && isCurrentBearish
      && hasRealBodyGapUp(previous, twoBack)
      && isOpenInsideBody(current, previous)
      && current.close > twoBack.bodyTop
      && current.close < previous.bodyBottom;
    const tasukiGapDownsideShape = twoBack !== null
      && previous !== null
      && isTwoBackBearish
      && isPreviousBearish
      && isCurrentBullish
      && hasRealBodyGapDown(previous, twoBack)
      && isOpenInsideBody(current, previous)
      && current.close < twoBack.bodyBottom
      && current.close > previous.bodyTop;
    const tasukiGapScore = tasukiGapUpsideShape ? 100 : tasukiGapDownsideShape ? -100 : 0;

    const sameOpen = previous !== null && isWithinPriceTolerance(current.open, previous.open, equalTolerance);
    const separatingLinesScore = sameOpen && isCurrentLong
      ? isPreviousBearish && isCurrentBullish
        ? 100
        : isPreviousBullish && isCurrentBearish
          ? -100
          : 0
      : 0;

    const thrustingShape = previous !== null
      && isPreviousBearish
      && isPreviousLong
      && isCurrentBullish
      && current.open < previous.low
      && current.close > previous.close
      && current.close < previous.open - previous.realBody * 0.5;

    const sameClose = previous !== null && isWithinPriceTolerance(current.close, previous.close, equalTolerance);
    const counterattackScore = sameClose && isPreviousLong && isCurrentLong
      ? isPreviousBearish && isCurrentBullish
        ? 100
        : isPreviousBullish && isCurrentBearish
          ? -100
          : 0
      : 0;

    const morningStarShape = twoBack !== null
      && previous !== null
      && isTwoBackBearish
      && isTwoBackLong
      && isPreviousShort
      && hasRealBodyGapDown(previous, twoBack)
      && isCurrentBullish
      && current.realBody > bodyShortAvg * bodyShortFactor
      && current.close > twoBack.close + twoBack.realBody * morningEveningPenetration;
    const eveningStarShape = twoBack !== null
      && previous !== null
      && isTwoBackBullish
      && isTwoBackLong
      && isPreviousShort
      && hasRealBodyGapUp(previous, twoBack)
      && isCurrentBearish
      && current.realBody > bodyShortAvg * bodyShortFactor
      && current.close < twoBack.close - twoBack.realBody * morningEveningPenetration;

    const threeWhiteSoldiersShape = twoBack !== null
      && previous !== null
      && isTwoBackBullish
      && isPreviousBullish
      && isCurrentBullish
      && twoBack.close < previous.close
      && previous.close < current.close
      && twoBackShadowVeryShortMax !== null
      && previousShadowVeryShortMax !== null
      && twoBackNearForPattern !== null
      && previousNearForPattern !== null
      && twoBackFarForPattern !== null
      && previousFarForPattern !== null
      && twoBack.upperShadow < twoBackShadowVeryShortMax
      && previous.upperShadow < previousShadowVeryShortMax
      && current.upperShadow < shadowVeryShortMax
      && previous.open > twoBack.open
      && previous.open <= twoBack.close + twoBackNearForPattern
      && current.open > previous.open
      && current.open <= previous.close + previousNearForPattern
      && previous.realBody > twoBack.realBody - twoBackFarForPattern
      && current.realBody > previous.realBody - previousFarForPattern
      && current.realBody > bodyShortAvg * bodyShortFactor;

    const threeBlackCrowsShape = threeBack !== null
      && twoBack !== null
      && previous !== null
      && isThreeBackBullish
      && isTwoBackBearish
      && isPreviousBearish
      && isCurrentBearish
      && twoBackShadowVeryShortMax !== null
      && previousShadowVeryShortMax !== null
      && twoBack.lowerShadow < twoBackShadowVeryShortMax
      && previous.lowerShadow < previousShadowVeryShortMax
      && current.lowerShadow < shadowVeryShortMax
      && previous.open < twoBack.open
      && previous.open > twoBack.close
      && current.open < previous.open
      && current.open > previous.close
      && threeBack.high > twoBack.close
      && twoBack.close > previous.close
      && previous.close > current.close;

    const threeInsideUpShape = twoBack !== null
      && previous !== null
      && isTwoBackBearish
      && isTwoBackLong
      && isPreviousShort
      && previous.bodyTop < twoBack.bodyTop
      && previous.bodyBottom > twoBack.bodyBottom
      && isCurrentBullish
      && current.close > twoBack.open;
    const threeInsideDownShape = twoBack !== null
      && previous !== null
      && isTwoBackBullish
      && isTwoBackLong
      && isPreviousShort
      && previous.bodyTop < twoBack.bodyTop
      && previous.bodyBottom > twoBack.bodyBottom
      && isCurrentBearish
      && current.close < twoBack.open;

    const uniqueThreeRiverShape = twoBack !== null
      && previous !== null
      && isTwoBackBearish
      && isTwoBackLong
      && isPreviousBearish
      && isCurrentBullish
      && isCurrentShort
      && previous.open < twoBack.open
      && previous.open > twoBack.close
      && previous.close < twoBack.close
      && previous.low < twoBack.low
      && current.open > previous.low
      && current.close < previous.close;

    const upsideGapTwoCrowsShape = twoBack !== null
      && previous !== null
      && isTwoBackBullish
      && isTwoBackLong
      && isPreviousBearish
      && isCurrentBearish
      && previous.bodyBottom > twoBack.bodyTop
      && current.open > previous.open
      && current.close < previous.close
      && current.close > twoBack.close;

    const kickerBullShape = previous !== null
      && isPreviousMarubozuBear
      && marubozuBull
      && current.bodyBottom > previous.bodyTop;
    const kickerBearShape = previous !== null
      && isPreviousMarubozuBull
      && marubozuBear
      && current.bodyTop < previous.bodyBottom;

    const previousDoji = previous !== null
      && previousBodyDojiMax !== null
      && previous.realBody <= previousBodyDojiMax;
    const abandonedBabyBullShape = twoBack !== null
      && previous !== null
      && isTwoBackBearish
      && isTwoBackLong
      && previousDoji
      && previous.high < twoBack.low
      && isCurrentBullish
      && current.low > previous.high
      && current.close > twoBack.close + twoBack.realBody * abandonedBabyPenetration;
    const abandonedBabyBearShape = twoBack !== null
      && previous !== null
      && isTwoBackBullish
      && isTwoBackLong
      && previousDoji
      && previous.low > twoBack.high
      && isCurrentBearish
      && current.high < previous.low
      && current.close < twoBack.close - twoBack.realBody * abandonedBabyPenetration;

    const beltHoldBullShape = isCurrentBullish
      && isCurrentLong
      && current.lowerShadow < shadowVeryShortMax;
    const beltHoldBearShape = isCurrentBearish
      && isCurrentLong
      && current.upperShadow < shadowVeryShortMax;
    const beltHoldBullContext = downtrend === true || (previous !== null && current.close > previous.high);
    const beltHoldBearContext = uptrend === true || (previous !== null && current.close < previous.low);

    const breakawayBullShape = fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && isFourBackLong
      && isFourBackBearish
      && isThreeBackBearish
      && threeBack.bodyTop < fourBack.bodyBottom
      && twoBack.close < threeBack.close
      && previous.close < twoBack.close
      && isCurrentBullish
      && current.close > threeBack.open
      && current.close < fourBack.open;
    const breakawayBearShape = fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && isFourBackLong
      && isFourBackBullish
      && isThreeBackBullish
      && threeBack.bodyBottom > fourBack.bodyTop
      && twoBack.close > threeBack.close
      && previous.close > twoBack.close
      && isCurrentBearish
      && current.close < threeBack.open
      && current.close > fourBack.open;

    const risingThreeMethodsShape = fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && isFourBackBullish
      && isFourBackLong
      && isThreeBackBearish
      && isTwoBackBearish
      && isPreviousBearish
      && isThreeBackShort
      && isTwoBackShort
      && isPreviousShort
      && threeBack.bodyBottom < fourBack.high
      && threeBack.bodyTop > fourBack.low
      && twoBack.bodyBottom < fourBack.high
      && twoBack.bodyTop > fourBack.low
      && previous.bodyBottom < fourBack.high
      && previous.bodyTop > fourBack.low
      && twoBack.close < threeBack.close
      && previous.close < twoBack.close
      && isCurrentBullish
      && isCurrentLong
      && current.open > previous.close
      && current.close > fourBack.close;
    const fallingThreeMethodsShape = fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && isFourBackBearish
      && isFourBackLong
      && isThreeBackBullish
      && isTwoBackBullish
      && isPreviousBullish
      && isThreeBackShort
      && isTwoBackShort
      && isPreviousShort
      && threeBack.bodyBottom < fourBack.high
      && threeBack.bodyTop > fourBack.low
      && twoBack.bodyBottom < fourBack.high
      && twoBack.bodyTop > fourBack.low
      && previous.bodyBottom < fourBack.high
      && previous.bodyTop > fourBack.low
      && twoBack.close > threeBack.close
      && previous.close > twoBack.close
      && isCurrentBearish
      && isCurrentLong
      && current.open < previous.close
      && current.close < fourBack.close;

    const twoBackBodyBottom = twoBack === null ? null : Math.min(twoBack.open, twoBack.close);
    const previousBodyBottom = previous === null ? null : Math.min(previous.open, previous.close);
    const twoBackBodyTop = twoBack === null ? null : Math.max(twoBack.open, twoBack.close);
    const previousBodyTop = previous === null ? null : Math.max(previous.open, previous.close);
    const matHoldReactionFloor = fourBack === null ? null : fourBack.close - fourBack.realBody * matHoldPenetration;
    const matHoldShape = fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && twoBackBodyBottom !== null
      && previousBodyBottom !== null
      && twoBackBodyTop !== null
      && previousBodyTop !== null
      && matHoldReactionFloor !== null
      && isFourBackBullish
      && isFourBackLong
      && isThreeBackBearish
      && isThreeBackShort
      && hasRealBodyGapUp(threeBack, fourBack)
      && isTwoBackShort
      && isPreviousShort
      && twoBackBodyBottom < fourBack.close
      && previousBodyBottom < fourBack.close
      && twoBackBodyBottom > matHoldReactionFloor
      && previousBodyBottom > matHoldReactionFloor
      && twoBackBodyTop < threeBack.open
      && previousBodyTop < twoBackBodyTop
      && isCurrentBullish
      && current.open > previous.close
      && current.close > Math.max(threeBack.high, twoBack.high, previous.high);

    const gapSideBySideWhiteScore = twoBack !== null
      && previous !== null
      && previousNearForPattern !== null
      && previousEqualForPattern !== null
      && isPreviousBullish
      && isCurrentBullish
      && Math.abs(current.realBody - previous.realBody) <= previousNearForPattern
      && isWithinPriceTolerance(current.open, previous.open, previousEqualForPattern)
      ? hasRealBodyGapUp(previous, twoBack) && hasRealBodyGapUp(current, twoBack)
        ? 100
        : hasRealBodyGapDown(previous, twoBack) && hasRealBodyGapDown(current, twoBack)
          ? -100
          : 0
      : 0;

    let hikkakeScore = 0;
    let hikkakeConfirmedSignal: number | string = 0;
    for (let pendingIndex = pendingHikkakeSignals.length - 1; pendingIndex >= 0; pendingIndex--) {
      const pending = pendingHikkakeSignals[pendingIndex];
      if (index > pending.expiresAt) {
        pendingHikkakeSignals.splice(pendingIndex, 1);
        continue;
      }
      if (index <= pending.shapeIndex) continue;
      const confirmed = pending.direction > 0
        ? current.close > pending.insideHigh
        : current.close < pending.insideLow;
      if (confirmed) {
        hikkakeScore = pending.direction > 0 ? 200 : -200;
        hikkakeConfirmedSignal = 1;
        pendingHikkakeSignals.splice(pendingIndex, 1);
      }
    }
    const insideBar = twoBack !== null && previous !== null && previous.high < twoBack.high && previous.low > twoBack.low;
    const bullishHikkakeShape = insideBar && previous !== null && current.high < previous.high && current.low < previous.low;
    const bearishHikkakeShape = insideBar && previous !== null && current.high > previous.high && current.low > previous.low;
    if (hikkakeScore === 0 && previous !== null && (bullishHikkakeShape || bearishHikkakeShape)) {
      const direction = bullishHikkakeShape ? 1 : -1;
      hikkakeScore = direction > 0 ? 100 : -100;
      pendingHikkakeSignals.push({
        shapeIndex: index,
        expiresAt: index + 3,
        direction,
        insideHigh: previous.high,
        insideLow: previous.low,
      });
    }

    const concealingBabySwallowShape = threeBack !== null
      && twoBack !== null
      && previous !== null
      && threeBackShadowVeryShortMax !== null
      && twoBackShadowVeryShortMax !== null
      && previousShadowVeryShortMax !== null
      && isThreeBackBearish
      && isTwoBackBearish
      && isPreviousBearish
      && isCurrentBearish
      && threeBack.lowerShadow < threeBackShadowVeryShortMax
      && threeBack.upperShadow < threeBackShadowVeryShortMax
      && twoBack.lowerShadow < twoBackShadowVeryShortMax
      && twoBack.upperShadow < twoBackShadowVeryShortMax
      && hasRealBodyGapDown(previous, twoBack)
      && previous.upperShadow > previousShadowVeryShortMax
      && previous.high > twoBack.close
      && current.high > previous.high
      && current.low < previous.low;

    const ladderBottomShape = fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && previousShadowVeryShortMax !== null
      && isFourBackBearish
      && isThreeBackBearish
      && isTwoBackBearish
      && fourBack.open > threeBack.open
      && threeBack.open > twoBack.open
      && fourBack.close > threeBack.close
      && threeBack.close > twoBack.close
      && isPreviousBearish
      && previous.upperShadow > previousShadowVeryShortMax
      && isCurrentBullish
      && current.open > previous.open
      && current.close > previous.high;

    const ladderBottomBrvmShape = !ladderBottomShape
      && fourBack !== null
      && threeBack !== null
      && twoBack !== null
      && previous !== null
      && [isFourBackBearish, isThreeBackBearish, isTwoBackBearish, isPreviousBearish].filter(Boolean).length >= 3
      && fourBack.open >= threeBack.open
      && threeBack.open >= twoBack.open
      && twoBack.open >= previous.open
      && fourBack.close > threeBack.close
      && threeBack.close > twoBack.close
      && twoBack.close >= previous.close
      && previous.upperShadow >= Math.max(1, previous.realBody * 0.5, previous.range * 0.08)
      && isCurrentBullish
      && current.close > previous.close
      && current.close >= previous.bodyTop;

    const stickSandwichShape = twoBack !== null
      && previous !== null
      && twoBackEqualForPattern !== null
      && isTwoBackBearish
      && isPreviousBullish
      && isCurrentBearish
      && previous.low > twoBack.close
      && isWithinPriceTolerance(current.close, twoBack.close, twoBackEqualForPattern);

    dojiFlags[index] = isDoji;
    result.doji[index] = isDoji ? 1 : 0;
    result.longLeggedDoji[index] = longLeggedDoji ? 1 : 0;
    result.rickshawMan[index] = rickshawMan ? 1 : 0;
    result.dragonflyDoji[index] = dragonflyDoji ? 1 : 0;
    result.gravestoneDoji[index] = gravestoneDoji ? 1 : 0;
    result.hammer[index] = hammerShape ? 100 : 0;
    result.hangingMan[index] = hangingManShape ? -100 : 0;
    result.takuri[index] = takuri ? 100 : 0;
    result.invertedHammer[index] = invertedHammerShape ? 100 : 0;
    result.shootingStar[index] = shootingStarShape ? -100 : 0;
    result.engulfingBullish[index] = engulfingBullishScore;
    result.engulfingBearish[index] = -engulfingBearishScore;
    result.haramiBullish[index] = haramiBullishScore;
    result.haramiBearish[index] = haramiBearishScore;
    result.tweezerTop[index] = tweezerTopShape ? -100 : 0;
    result.tweezerBottom[index] = tweezerBottomShape ? 100 : 0;
    result.piercingLine[index] = piercingLineScore;
    result.darkCloudCover[index] = darkCloudCoverScore;
    result.tasukiGap[index] = tasukiGapScore;
    result.separatingLines[index] = separatingLinesScore;
    result.thrusting[index] = thrustingShape ? -100 : 0;
    result.counterattack[index] = counterattackScore;
    result.morningStar[index] = morningStarShape ? 100 : 0;
    result.eveningStar[index] = eveningStarShape ? -100 : 0;
    result.threeWhiteSoldiers[index] = threeWhiteSoldiersShape ? 100 : 0;
    result.threeBlackCrows[index] = threeBlackCrowsShape ? -100 : 0;
    if (twoBack !== null && previous !== null) {
      result.threeInsideUp[index] = threeInsideUpShape ? 100 : 0;
      result.threeInsideDown[index] = threeInsideDownShape ? -100 : 0;
      result.uniqueThreeRiver[index] = uniqueThreeRiverShape ? 100 : 0;
      result.upsideGapTwoCrows[index] = upsideGapTwoCrowsShape ? -100 : 0;
      result.abandonedBabyBull[index] = abandonedBabyBullShape ? 100 : 0;
      result.abandonedBabyBear[index] = abandonedBabyBearShape ? -100 : 0;
      result.gapSideBySideWhite[index] = gapSideBySideWhiteScore;
      result.hikkake[index] = hikkakeScore;
      result.stickSandwich[index] = stickSandwichShape ? 100 : 0;
    }
    if (previous !== null) {
      result.kickerBull[index] = kickerBullShape ? 100 : 0;
      result.kickerBear[index] = kickerBearShape ? -100 : 0;
    }
    result.beltHoldBull[index] = beltHoldBullShape ? 100 : 0;
    result.beltHoldBear[index] = beltHoldBearShape ? -100 : 0;
    if (fourBack !== null && threeBack !== null && twoBack !== null && previous !== null) {
      result.breakawayBull[index] = breakawayBullShape ? 100 : 0;
      result.breakawayBear[index] = breakawayBearShape ? -100 : 0;
      result.risingThreeMethods[index] = risingThreeMethodsShape ? 100 : 0;
      result.fallingThreeMethods[index] = fallingThreeMethodsShape ? -100 : 0;
      result.matHold[index] = matHoldShape ? 100 : 0;
      result.ladderBottom[index] = ladderBottomShape ? 100 : 0;
      result.ladderBottomBrvm[index] = ladderBottomBrvmShape ? 80 : 0;
    }
    if (threeBack !== null && twoBack !== null && previous !== null) {
      result.concealingBabySwallow[index] = concealingBabySwallowShape ? 100 : 0;
    }
    result.marubozuBull[index] = marubozuBull ? 100 : 0;
    result.marubozuBear[index] = marubozuBear ? -100 : 0;
    result.spinningTop[index] = spinningTop ? (current.close > current.open ? 100 : current.close < current.open ? -100 : 0) : 0;
    result.hammerConfirmed[index] = hammerShape ? (downtrend === null ? "-" : downtrend ? 1 : 0) : 0;
    result.hangingManConfirmed[index] = hangingManShape ? (uptrend === null ? "-" : uptrend ? 1 : 0) : 0;
    result.invertedHammerConfirmed[index] = invertedHammerShape ? (downtrend === null ? "-" : downtrend ? 1 : 0) : 0;
    result.shootingStarConfirmed[index] = toPatternConfirmationSignal(shootingStarShape, uptrend);
    result.engulfingBullishConfirmed[index] = toPatternConfirmationSignal(engulfingBullishScore > 0, downtrend);
    result.engulfingBearishConfirmed[index] = toPatternConfirmationSignal(engulfingBearishScore > 0, uptrend);
    result.haramiBullishConfirmed[index] = toPatternConfirmationSignal(haramiBullishScore > 0, downtrend);
    result.haramiBearishConfirmed[index] = toPatternConfirmationSignal(haramiBearishScore < 0, uptrend);
    result.tweezerTopConfirmed[index] = toPatternConfirmationSignal(tweezerTopShape, uptrend);
    result.tweezerBottomConfirmed[index] = toPatternConfirmationSignal(tweezerBottomShape, downtrend);
    result.piercingLineConfirmed[index] = toPatternConfirmationSignal(piercingLineScore > 0, downtrend);
    result.darkCloudCoverConfirmed[index] = toPatternConfirmationSignal(darkCloudCoverScore < 0, uptrend);
    result.tasukiGapConfirmed[index] = toPatternConfirmationSignal(
      tasukiGapScore !== 0,
      tasukiGapScore > 0 ? uptrend : tasukiGapScore < 0 ? downtrend : null,
    );
    result.separatingLinesConfirmed[index] = toPatternConfirmationSignal(
      separatingLinesScore !== 0,
      separatingLinesScore > 0 ? uptrend : separatingLinesScore < 0 ? downtrend : null,
    );
    result.thrustingConfirmed[index] = toPatternConfirmationSignal(thrustingShape, downtrend);
    result.counterattackConfirmed[index] = toPatternConfirmationSignal(
      counterattackScore !== 0,
      counterattackScore > 0 ? downtrend : counterattackScore < 0 ? uptrend : null,
    );
    result.morningStarConfirmed[index] = toPatternConfirmationSignal(morningStarShape, downtrend);
    result.eveningStarConfirmed[index] = toPatternConfirmationSignal(eveningStarShape, uptrend);
    result.threeWhiteSoldiersConfirmed[index] = toPatternConfirmationSignal(threeWhiteSoldiersShape, downtrend);
    result.threeBlackCrowsConfirmed[index] = toPatternConfirmationSignal(threeBlackCrowsShape, uptrend);
    if (twoBack !== null && previous !== null) {
      result.threeInsideUpConfirmed[index] = toPatternConfirmationSignal(threeInsideUpShape, downtrend);
      result.threeInsideDownConfirmed[index] = toPatternConfirmationSignal(threeInsideDownShape, uptrend);
      result.uniqueThreeRiverConfirmed[index] = toPatternConfirmationSignal(uniqueThreeRiverShape, downtrend);
      result.upsideGapTwoCrowsConfirmed[index] = toPatternConfirmationSignal(upsideGapTwoCrowsShape, uptrend);
      result.abandonedBabyBullConfirmed[index] = toPatternConfirmationSignal(abandonedBabyBullShape, downtrend);
      result.abandonedBabyBearConfirmed[index] = toPatternConfirmationSignal(abandonedBabyBearShape, uptrend);
      result.gapSideBySideWhiteConfirmed[index] = toPatternConfirmationSignal(
        gapSideBySideWhiteScore !== 0,
        gapSideBySideWhiteScore > 0 ? uptrend : gapSideBySideWhiteScore < 0 ? downtrend : null,
      );
      result.hikkakeConfirmed[index] = hikkakeConfirmedSignal;
      result.stickSandwichConfirmed[index] = toPatternConfirmationSignal(stickSandwichShape, downtrend);
    }
    if (previous !== null) {
      result.kickerBullConfirmed[index] = toPatternConfirmationSignal(kickerBullShape, downtrend);
      result.kickerBearConfirmed[index] = toPatternConfirmationSignal(kickerBearShape, uptrend);
    }
    result.beltHoldBullConfirmed[index] = toPatternConfirmationSignal(beltHoldBullShape, beltHoldBullContext);
    result.beltHoldBearConfirmed[index] = toPatternConfirmationSignal(beltHoldBearShape, beltHoldBearContext);
    if (fourBack !== null && threeBack !== null && twoBack !== null && previous !== null) {
      result.breakawayBullConfirmed[index] = toPatternConfirmationSignal(breakawayBullShape, downtrend);
      result.breakawayBearConfirmed[index] = toPatternConfirmationSignal(breakawayBearShape, uptrend);
      result.risingThreeMethodsConfirmed[index] = toPatternConfirmationSignal(risingThreeMethodsShape, uptrend);
      result.fallingThreeMethodsConfirmed[index] = toPatternConfirmationSignal(fallingThreeMethodsShape, downtrend);
      result.matHoldConfirmed[index] = toPatternConfirmationSignal(matHoldShape, uptrend);
      result.ladderBottomConfirmed[index] = toPatternConfirmationSignal(ladderBottomShape, downtrend);
      result.ladderBottomBrvmConfirmed[index] = toPatternConfirmationSignal(ladderBottomBrvmShape, downtrend);
    }
    if (threeBack !== null && twoBack !== null && previous !== null) {
      result.concealingBabySwallowConfirmed[index] = toPatternConfirmationSignal(concealingBabySwallowShape, downtrend);
    }
  }

  for (let index = 2; index < data.length; index++) {
    const dojiA = dojiFlags[index - 2];
    const dojiB = dojiFlags[index - 1];
    const dojiC = dojiFlags[index];
    const bodyTopA = bodyTopValues[index - 2];
    const bodyTopB = bodyTopValues[index - 1];
    const bodyTopC = bodyTopValues[index];
    const bodyBottomA = bodyBottomValues[index - 2];
    const bodyBottomB = bodyBottomValues[index - 1];
    const bodyBottomC = bodyBottomValues[index];
    if (dojiA === null || dojiB === null || dojiC === null || bodyTopA === null || bodyTopB === null || bodyTopC === null || bodyBottomA === null || bodyBottomB === null || bodyBottomC === null) {
      continue;
    }

    const tristarBase = dojiA && dojiB && dojiC;
    const bearishTristar = tristarBase && bodyBottomB > bodyTopA && bodyTopC < bodyTopB;
    const bullishTristar = tristarBase && bodyTopB < bodyBottomA && bodyBottomC > bodyBottomB;
    result.bearishTristar[index] = bearishTristar ? 1 : 0;
    result.bullishTristar[index] = bullishTristar ? 1 : 0;
    result.tristar[index] = bullishTristar ? 100 : bearishTristar ? -100 : 0;
  }

  return result;
};

export const calculateKlingerOscillator = (
  data: ChartDataPoint[],
  fastLength = 34,
  slowLength = 55,
  signalLength = 13,
): { oscillator: (number | string)[]; signalLine: (number | string)[] } => {
  const oscillator: (number | string)[] = new Array(data.length).fill("-");
  const signalLine: (number | string)[] = new Array(data.length).fill("-");
  if (fastLength <= 0 || slowLength <= 0 || signalLength <= 0 || fastLength >= slowLength || data.length < slowLength) {
    return { oscillator, signalLine };
  }

  const volumeForce: Array<number | null> = new Array(data.length).fill(null);
  let previousHlc: number | null = null;
  let previousDm: number | null = null;
  let previousTrend: number | null = null;
  let previousCm = 0;

  for (let index = 0; index < data.length; index++) {
    const high = toFinitePriceValue(data[index].high);
    const low = toFinitePriceValue(data[index].low);
    const close = toFinitePriceValue(data[index].close);
    const volume = toFiniteVolumeValue(data[index].volume);
    if (high === null || low === null || close === null || volume === null || high < low) {
      previousHlc = null;
      previousDm = null;
      previousTrend = null;
      previousCm = 0;
      continue;
    }

    const hlc = high + low + close;
    const dm = high - low;
    if (previousHlc === null || previousDm === null) {
      previousHlc = hlc;
      previousDm = dm;
      previousCm = dm;
      continue;
    }

    const trend = hlc > previousHlc ? 1 : -1;
    const cm = previousTrend !== null && trend === previousTrend
      ? previousCm + dm
      : previousDm + dm;

    if (cm !== 0) {
      volumeForce[index] = volume * (2 * (dm / cm - 1)) * trend * 100;
    }

    previousHlc = hlc;
    previousDm = dm;
    previousTrend = trend;
    previousCm = cm;
  }

  const fastEma = calculateEMAFloatSeries(volumeForce, fastLength);
  const slowEma = calculateEMAFloatSeries(volumeForce, slowLength);
  const rawOscillator: Array<number | null> = new Array(data.length).fill(null);

  for (let index = 0; index < data.length; index++) {
    const fast = fastEma[index];
    const slow = slowEma[index];
    if (fast === null || slow === null) continue;
    const value = fast - slow;
    rawOscillator[index] = value;
    oscillator[index] = roundIndicatorValue(value);
  }

  const signal = calculateEMAFloatSeries(rawOscillator, signalLength);
  for (let index = 0; index < data.length; index++) {
    const signalValue = signal[index];
    if (signalValue !== null) signalLine[index] = roundIndicatorValue(signalValue);
  }

  return { oscillator, signalLine };
};

export const calculateElderForceIndex = (
  data: ChartDataPoint[],
  smoothLength = 13,
): { raw: (number | string)[]; forceIndex13: (number | string)[] } => {
  const raw: (number | string)[] = new Array(data.length).fill("-");
  const rawFloat: Array<number | null> = new Array(data.length).fill(null);
  const forceIndex13: (number | string)[] = new Array(data.length).fill("-");
  if (smoothLength <= 0 || data.length < 2) return { raw, forceIndex13 };

  for (let index = 1; index < data.length; index++) {
    const currentClose = toFinitePriceValue(data[index].close);
    const previousClose = toFinitePriceValue(data[index - 1].close);
    const volume = toFiniteVolumeValue(data[index].volume);
    if (currentClose === null || previousClose === null || volume === null) continue;
    const value = (currentClose - previousClose) * volume;
    rawFloat[index] = value;
    raw[index] = roundIndicatorValue(value);
  }

  const smoothedForce = calculateEMAFloatSeries(rawFloat, smoothLength);
  for (let index = 0; index < data.length; index++) {
    const value = smoothedForce[index];
    if (value !== null) forceIndex13[index] = roundIndicatorValue(value);
  }

  return { raw, forceIndex13 };
};

/**
 * Ichimoku Cloud for the supported TradingView-compatible displacement settings
 * Formula:
 * Tenkan = (Highest(9) + Lowest(9)) / 2
 * Kijun = (Highest(26) + Lowest(26)) / 2
 * Senkou A = (Tenkan + Kijun) / 2 -> Shifted forward by 26
 * Senkou B = (Highest(52) + Lowest(52)) / 2 -> Shifted forward by 26
 * Chikou = Close -> Shifted backward by 26
 */
export const calculateIchimoku = (
  data: ChartDataPoint[],
  tenkanPeriod = 9,
  kijunPeriod = 26,
  senkouBPeriod = 52,
  displacement = 26
) => {
  const N = data.length;
  const outLen = N + displacement;

  // Pre-allocate arrays with exact future size to prevent V8 deoptimizations
  const tenkan: (number | string)[] = new Array(outLen).fill("-");
  const kijun: (number | string)[] = new Array(outLen).fill("-");
  const senkouA: (number | string)[] = new Array(outLen).fill("-");
  const senkouB: (number | string)[] = new Array(outLen).fill("-");
  const chikou: (number | string)[] = new Array(outLen).fill("-");

  // Helper for Donchian Midpoint (Highest + Lowest) / 2
  const getDonchianMidpoint = (endIdx: number, period: number) => {
    if (endIdx - period + 1 < 0) return "-";
    let highest = -Infinity;
    let lowest = Infinity;
    for (let i = endIdx - period + 1; i <= endIdx; i++) {
      if (data[i].high > highest) highest = data[i].high;
      if (data[i].low < lowest) lowest = data[i].low;
    }
    return (highest + lowest) / 2;
  };

  for (let i = 0; i < N; i++) {
    const t = getDonchianMidpoint(i, tenkanPeriod);
    const k = getDonchianMidpoint(i, kijunPeriod);

    tenkan[i] = t !== "-" ? parseFloat((t as number).toFixed(4)) : "-";
    kijun[i] = k !== "-" ? parseFloat((k as number).toFixed(4)) : "-";

    if (t !== "-" && k !== "-") {
      const sa = ((t as number) + (k as number)) / 2;
      // Shift Senkou A into the future
      senkouA[i + displacement] = parseFloat(sa.toFixed(4));
    }

    const sb = getDonchianMidpoint(i, senkouBPeriod);
    if (sb !== "-") {
      // Shift Senkou B into the future
      senkouB[i + displacement] = parseFloat((sb as number).toFixed(4));
    }

    if (i >= displacement) {
      // Shift Chikou into the past
      chikou[i - displacement] = data[i].close;
    }
  }

  return { tenkan, kijun, senkouA, senkouB, chikou };
};
// --- EOF ---
