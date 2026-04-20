// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/TechnicalIndicators.ts

/**
 * [TENOR 2026] Optimized Technical Indicators Library.
 * Performance Warfare Edition: Implements Sliding Window and Incremental Updates.
 * Reduces complexity from O(n*p) to O(n).
 */

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

/**
 * Relative Strength Index (RSI) - Optimized with Wilder's Smoothing.
 * Complexity: O(n)
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

  // Wilder's Smoothing
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

/**
 * Bollinger Bands - Optimized with Sliding Window Variance.
 */
export const calculateBollinger = (
  data: ChartDataPoint[],
  period = 20,
  multiplier = 2
) => {
  const upper: (number | string)[] = new Array(data.length).fill("-");
  const middle: (number | string)[] = new Array(data.length).fill("-");
  const lower: (number | string)[] = new Array(data.length).fill("-");

  if (data.length < period) return { upper, middle, lower };

  let sum = 0;
  let sumSq = 0;

  for (let i = 0; i < period; i++) {
    const val = data[i].close;
    sum += val;
    sumSq += val * val;
  }

  const updateBands = (idx: number, s: number, s2: number) => {
    const avg = s / period;
    const variance = (s2 / period) - (avg * avg);
    const stdDev = Math.sqrt(Math.max(0, variance));
    middle[idx] = parseFloat(avg.toFixed(2));
    upper[idx] = parseFloat((avg + multiplier * stdDev).toFixed(2));
    lower[idx] = parseFloat((avg - multiplier * stdDev).toFixed(2));
  };

  updateBands(period - 1, sum, sumSq);

  for (let i = period; i < data.length; i++) {
    const out = data[i - period].close;
    const inv = data[i].close;
    sum = sum - out + inv;
    sumSq = sumSq - (out * out) + (inv * inv);
    updateBands(i, sum, sumSq);
  }

  return { upper, middle, lower };
};

/**
 * Stochastic Oscillator.
 */
export const calculateStochastic = (
  data: ChartDataPoint[],
  period = 14,
  smoothK = 3,
  smoothD = 3
) => {
  const rawK: (number | string)[] = new Array(data.length).fill("-");
  const kLine: (number | string)[] = new Array(data.length).fill("-");
  const dLine: (number | string)[] = new Array(data.length).fill("-");

  if (data.length < period) return { kLine, dLine };

  // 1. Calculate Raw %K
  for (let i = period - 1; i < data.length; i++) {
    let low = Infinity;
    let high = -Infinity;
    for (let j = 0; j < period; j++) {
      const d = data[i - j];
      if (d.low < low) low = d.low;
      if (d.high > high) high = d.high;
    }
    const den = high - low;
    rawK[i] = den === 0 ? 100 : ((data[i].close - low) / den) * 100;
  }

  // 2. Smooth %K
  for (let i = period + smoothK - 2; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothK; j++) {
      sum += rawK[i - j] as number;
    }
    kLine[i] = parseFloat((sum / smoothK).toFixed(2));
  }

  // 3. Smooth %D
  for (let i = period + smoothK + smoothD - 3; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < smoothD; j++) {
      sum += kLine[i - j] as number;
    }
    dLine[i] = parseFloat((sum / smoothD).toFixed(2));
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

/**
 * Commodity Channel Index (CCI).
 */
export const calculateCCI = (data: ChartDataPoint[], period = 20): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length < period) return results;

  const tp = data.map(d => (d.high + d.low + d.close) / 3);

  for (let i = period - 1; i < data.length; i++) {
    let sumTp = 0;
    for (let j = 0; j < period; j++) sumTp += tp[i - j];
    const smaTp = sumTp / period;

    let meanDev = 0;
    for (let j = 0; j < period; j++) meanDev += Math.abs(tp[i - j] - smaTp);
    meanDev /= period;

    if (meanDev === 0) results[i] = 0;
    else results[i] = parseFloat(((tp[i] - smaTp) / (0.015 * meanDev)).toFixed(2));
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
      if (data[i - j].high > highMax) highMax = data[i - j].high;
      if (data[i - j].low < lowMin) lowMin = data[i - j].low;
    }
    const den = highMax - lowMin;
    results[i] = den === 0 ? -50 : parseFloat((((highMax - data[i].close) / den) * -100).toFixed(2));
  }

  return results;
};

/**
 * [TENOR 2026 FEAT] Rate of Change (ROC) — Price Momentum Indicator.
 * ROC = ((Close - Close[period]) / Close[period]) * 100
 * Positive values indicate upward momentum. Complexity: O(n).
 */
export const calculateROC = (data: ChartDataPoint[], period = 12): (number | string)[] => {
  const results: (number | string)[] = new Array(data.length).fill("-");
  if (data.length <= period) return results;

  for (let i = period; i < data.length; i++) {
    const prevClose = data[i - period].close;
    if (prevClose === 0) {
      results[i] = 0;
    } else {
      results[i] = parseFloat((((data[i].close - prevClose) / prevClose) * 100).toFixed(2));
    }
  }

  return results;
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
// --- EOF ---