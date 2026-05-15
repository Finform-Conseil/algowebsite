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