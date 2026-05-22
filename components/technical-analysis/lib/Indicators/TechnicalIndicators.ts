// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/Indicators/TechnicalIndicators.ts
// [TENOR 2026] Optimized Technical Indicators Library.
// Performance Warfare Edition: Implements Sliding Window and Incremental Updates.
// [TENOR 2026 SRE] SCAR-MATH-PRECISION: TradingView Parity for Stochastic & StochRSI.
// [TENOR 2026 SRE] SCAR-TIME-SHIFTING: Added Ichimoku Cloud with Future/Past Projections.
// [TENOR 2026 HDR] BOLLINGER BANDS UPGRADE: Added BB Width, BB %B, and enforced ddof=0.
// [TENOR 2026 FIX] BOLLINGER DEBT RESOLVED: Full support for Source and Offset.
// Strict NaN propagation ("-") and Zero-Division shields applied.
// ================================================================================

export interface ChartDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Generates initial mock data for the chart.
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

const roundIndicatorValue = (value: number): number => parseFloat(value.toFixed(2));

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
 * TradingView Parity: Exact Wilder's RMA implementation.
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
 * [TENOR 2026 HDR] Bollinger Bands (TradingView Parity)
 * Optimized with O(n) Sliding Window Variance.
 * Enforces ddof=0 (Population Standard Deviation) to match Pine Script exactly.
 * [FIX] Full support for Source and Offset.
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

  // [TENOR 2026] Calculate Width and %B based on the SHIFTED bands and CURRENT price
  // This guarantees mathematical parity with TradingView's oscillator behavior.
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
 * [TENOR 2026 HDR] Stochastic Oscillator (TradingView Parity)
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
 * [TENOR 2026 HDR] Stochastic RSI (TradingView Parity)
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
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= period) return results;

  const tr: number[] = new Array(data.length).fill(0);
  for (let i = 1; i < data.length; i++) {
    tr[i] = Math.max(
      data[i].high - data[i].low,
      Math.abs(data[i].high - data[i - 1].close),
      Math.abs(data[i].low - data[i - 1].close)
    );
  }

  let sumTr = 0;
  for (let i = 1; i <= period; i++) {
    sumTr += tr[i];
  }
  let prevAtr = sumTr / period;
  results[period] = parseFloat(prevAtr.toFixed(2));

  for (let i = period + 1; i < data.length; i++) {
    const currentAtr = (prevAtr * (period - 1) + tr[i]) / period;
    results[i] = parseFloat(currentAtr.toFixed(2));
    prevAtr = currentAtr;
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
 * [TENOR 2026 FEAT] Williams %R — Momentum Oscillator.
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
 * [TENOR 2026 FEAT] Rate of Change (ROC) — Price Momentum Indicator.
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
 * [TENOR 2026 FEAT] On Balance Volume (OBV) — Volume-Price Confirmation.
 * Cumulative volume indicator: adds volume on up-days, subtracts on down-days.
 * Confirms trends when OBV moves in the same direction as price. Complexity: O(n).
 */
export const calculateOBV = (data: ChartDataPoint[]): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length === 0) return results;

  let obv = 0;
  results[0] = 0;

  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i - 1].close) {
      obv += data[i].volume;
    } else if (data[i].close < data[i - 1].close) {
      obv -= data[i].volume;
    }
    // If close === prevClose, OBV stays unchanged
    results[i] = obv;
  }
  return results;
};

/**
 * [TENOR 2026 HDR] Ichimoku Cloud (TradingView Parity)
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
