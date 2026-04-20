/**
 * [TENOR 2026 HDR] createIndicatorsWorker.ts
 *
 * [SCAR-WORKER-ROOT RESOLUTION] — Blob Worker Pattern
 * =======================================================
 * Problème fondamental: Next.js dev server sert `/public` sans `Cache-Control: no-cache`.
 * Le navigateur peut cacher l'ancien indicators.worker.js indéfiniment.
 * Un changement de fichier (suppression des `export const`) ne sera JAMAIS visible
 * tant que le navigateur n'est pas force-refreshé.
 *
 * Solution: Blob Worker — le code source du worker est embarqué dans ce module TS.
 * L'URL est créée via URL.createObjectURL(new Blob([WORKER_SOURCE])).
 * - Zéro réseau : pas de requête HTTP → pas de cache
 * - Zéro CSP : blob: est toujours autorisé pour les workers
 * - Zéro chemin : fonctionne sur tous les environnements (dev, prod, Turbopack)
 * - Source of truth : une seule copie du code worker, ici, dans le bundle TS
 */

// ============================================================================
// WORKER SOURCE — Classic Worker Script (NO import/export)
// Embarqué comme string template. Toujours synchronisé avec TechnicalIndicators.ts
// ============================================================================
const INDICATORS_WORKER_SOURCE = /* javascript */ `
const calculateSMA = (data, period) => {
  const results = new Array(data.length).fill('-');
  if (data.length < period) return results;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  results[period - 1] = parseFloat((sum / period).toFixed(2));
  for (let i = period; i < data.length; i++) {
    sum = sum - data[i - period].close + data[i].close;
    results[i] = parseFloat((sum / period).toFixed(2));
  }
  return results;
};

const calculateEMA = (data, period) => {
  const results = new Array(data.length).fill('-');
  if (data.length < period) return results;
  const k = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  let prevEma = sum / period;
  results[period - 1] = parseFloat(prevEma.toFixed(2));
  for (let i = period; i < data.length; i++) {
    const currentEma = (data[i].close - prevEma) * k + prevEma;
    results[i] = parseFloat(currentEma.toFixed(2));
    prevEma = currentEma;
  }
  return results;
};

const calculateRSI = (data, period = 14) => {
  const results = new Array(data.length).fill('-');
  if (data.length <= period) return results;
  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff >= 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;
  results[period] = parseFloat((avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    results[i] = avgLoss === 0 ? 100 : parseFloat((100 - 100 / (1 + avgGain / avgLoss)).toFixed(2));
  }
  return results;
};

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const emaFast = calculateEMA(data, fastPeriod);
  const emaSlow = calculateEMA(data, slowPeriod);
  const macdLine = new Array(data.length).fill('-');
  const signalLine = new Array(data.length).fill('-');
  const histogram = new Array(data.length).fill('-');
  for (let i = 0; i < data.length; i++) {
    const f = emaFast[i], s = emaSlow[i];
    if (typeof f === 'number' && typeof s === 'number') macdLine[i] = f - s;
  }
  const k = 2 / (signalPeriod + 1);
  let firstValidIdx = -1, signalEma = 0;
  for (let i = 0; i < macdLine.length; i++) {
    const val = macdLine[i];
    if (typeof val === 'number') {
      if (firstValidIdx === -1) {
        let validCount = 0, sum = 0;
        for (let j = 0; j <= i; j++) { if (typeof macdLine[j] === 'number') { sum += macdLine[j]; validCount++; } }
        if (validCount >= signalPeriod) {
          firstValidIdx = i; signalEma = sum / validCount;
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

const calculateBollinger = (data, period = 20, multiplier = 2) => {
  const upper = new Array(data.length).fill('-');
  const middle = new Array(data.length).fill('-');
  const lower = new Array(data.length).fill('-');
  if (data.length < period) return { upper, middle, lower };
  let sum = 0, sumSq = 0;
  for (let i = 0; i < period; i++) { const v = data[i].close; sum += v; sumSq += v * v; }
  const updateBands = (idx, s, s2) => {
    const avg = s / period;
    const stdDev = Math.sqrt(Math.max(0, (s2 / period) - avg * avg));
    middle[idx] = parseFloat(avg.toFixed(2));
    upper[idx] = parseFloat((avg + multiplier * stdDev).toFixed(2));
    lower[idx] = parseFloat((avg - multiplier * stdDev).toFixed(2));
  };
  updateBands(period - 1, sum, sumSq);
  for (let i = period; i < data.length; i++) {
    const out = data[i - period].close, inv = data[i].close;
    sum = sum - out + inv; sumSq = sumSq - out * out + inv * inv;
    updateBands(i, sum, sumSq);
  }
  return { upper, middle, lower };
};

const calculateStochastic = (data, period = 14, smoothK = 3, smoothD = 3) => {
  const rawK = new Array(data.length).fill('-');
  const kLine = new Array(data.length).fill('-');
  const dLine = new Array(data.length).fill('-');
  if (data.length < period) return { kLine, dLine };
  for (let i = period - 1; i < data.length; i++) {
    let low = Infinity, high = -Infinity;
    for (let j = 0; j < period; j++) { if (data[i-j].low < low) low = data[i-j].low; if (data[i-j].high > high) high = data[i-j].high; }
    const den = high - low;
    rawK[i] = den === 0 ? 100 : ((data[i].close - low) / den) * 100;
  }
  for (let i = period + smoothK - 2; i < data.length; i++) {
    let sum = 0; for (let j = 0; j < smoothK; j++) sum += rawK[i - j];
    kLine[i] = parseFloat((sum / smoothK).toFixed(2));
  }
  for (let i = period + smoothK + smoothD - 3; i < data.length; i++) {
    let sum = 0; for (let j = 0; j < smoothD; j++) sum += kLine[i - j];
    dLine[i] = parseFloat((sum / smoothD).toFixed(2));
  }
  return { kLine, dLine };
};

const calculateATR = (data, period = 14) => {
  const results = new Array(data.length).fill('-');
  if (data.length <= period) return results;
  const tr = new Array(data.length).fill(0);
  for (let i = 1; i < data.length; i++) {
    tr[i] = Math.max(data[i].high - data[i].low, Math.abs(data[i].high - data[i-1].close), Math.abs(data[i].low - data[i-1].close));
  }
  let sumTr = 0;
  for (let i = 1; i <= period; i++) sumTr += tr[i];
  let prevAtr = sumTr / period;
  results[period] = parseFloat(prevAtr.toFixed(2));
  for (let i = period + 1; i < data.length; i++) {
    prevAtr = (prevAtr * (period - 1) + tr[i]) / period;
    results[i] = parseFloat(prevAtr.toFixed(2));
  }
  return results;
};

const calculateCCI = (data, period = 20) => {
  const results = new Array(data.length).fill('-');
  if (data.length < period) return results;
  const tp = data.map(d => (d.high + d.low + d.close) / 3);
  for (let i = period - 1; i < data.length; i++) {
    let sumTp = 0; for (let j = 0; j < period; j++) sumTp += tp[i - j];
    const smaTp = sumTp / period;
    let meanDev = 0; for (let j = 0; j < period; j++) meanDev += Math.abs(tp[i - j] - smaTp);
    meanDev /= period;
    results[i] = meanDev === 0 ? 0 : parseFloat(((tp[i] - smaTp) / (0.015 * meanDev)).toFixed(2));
  }
  return results;
};

const calculateWilliamsR = (data, period = 14) => {
  const results = new Array(data.length).fill('-');
  if (data.length < period) return results;
  for (let i = period - 1; i < data.length; i++) {
    let highMax = -Infinity, lowMin = Infinity;
    for (let j = 0; j < period; j++) { if (data[i-j].high > highMax) highMax = data[i-j].high; if (data[i-j].low < lowMin) lowMin = data[i-j].low; }
    const den = highMax - lowMin;
    results[i] = den === 0 ? -50 : parseFloat((((highMax - data[i].close) / den) * -100).toFixed(2));
  }
  return results;
};

const calculateROC = (data, period = 12) => {
  const results = new Array(data.length).fill('-');
  if (data.length <= period) return results;
  for (let i = period; i < data.length; i++) {
    const prev = data[i - period].close;
    results[i] = prev === 0 ? 0 : parseFloat((((data[i].close - prev) / prev) * 100).toFixed(2));
  }
  return results;
};

const calculateOBV = (data) => {
  const results = new Array(data.length).fill('-');
  if (data.length === 0) return results;
  let obv = 0; results[0] = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i].close > data[i-1].close) obv += data[i].volume;
    else if (data[i].close < data[i-1].close) obv -= data[i].volume;
    results[i] = obv;
  }
  return results;
};

const FIELDS_PER_CANDLE = 6;

self.onmessage = (event) => {
  const messageId = event.data && event.data.messageId;
  try {
    const { buffer, length, config } = event.data;
    if (!buffer || !(buffer instanceof ArrayBuffer) || typeof length !== 'number') {
      throw new Error('Invalid payload: Expected ArrayBuffer and numeric length.');
    }
    const flatData = new Float64Array(buffer);
    const chartData = new Array(length);
    for (let i = 0; i < length; i++) {
      const o = i * FIELDS_PER_CANDLE;
      chartData[i] = { time: flatData[o].toString(), open: flatData[o+1], high: flatData[o+2], low: flatData[o+3], close: flatData[o+4], volume: flatData[o+5] };
    }
    const { indicators, advancedIndicators, indicatorPeriods } = config;
    const results = {};
    const transferables = [];
    const toFloat = (values) => {
      const out = new Float64Array(length);
      for (let i = 0; i < length; i++) out[i] = typeof values[i] === 'number' ? values[i] : NaN;
      transferables.push(out.buffer);
      return out;
    };
    if (indicators.sma) {
      if (indicators.activeSma.includes(indicatorPeriods.sma1)) results.sma1 = toFloat(calculateSMA(chartData, indicatorPeriods.sma1));
      if (indicators.activeSma.includes(indicatorPeriods.sma2)) results.sma2 = toFloat(calculateSMA(chartData, indicatorPeriods.sma2));
      if (indicators.activeSma.includes(indicatorPeriods.sma3)) results.sma3 = toFloat(calculateSMA(chartData, indicatorPeriods.sma3));
      if (indicators.activeSma.includes(50)) results.sma50 = toFloat(calculateSMA(chartData, 50));
      if (indicators.activeSma.includes(200)) results.sma200 = toFloat(calculateSMA(chartData, 200));
    }
    if (indicators.ema) {
      if (indicators.activeEma.includes(5)) results.ema5 = toFloat(calculateEMA(chartData, 5));
      if (indicators.activeEma.includes(10)) results.ema10 = toFloat(calculateEMA(chartData, 10));
    }
    if (advancedIndicators.rsi) results.rsi = toFloat(calculateRSI(chartData, indicatorPeriods.rsiPeriod));
    if (advancedIndicators.macd) {
      const macd = calculateMACD(chartData);
      results.macdLine = toFloat(macd.macdLine); results.macdSignal = toFloat(macd.signalLine); results.macdHist = toFloat(macd.histogram);
    }
    if (advancedIndicators.bollinger) {
      const b = calculateBollinger(chartData, 20, 2);
      results.bollUpper = toFloat(b.upper); results.bollMiddle = toFloat(b.middle); results.bollLower = toFloat(b.lower);
    }
    if (advancedIndicators.stochastic) {
      const s = calculateStochastic(chartData);
      results.stochK = toFloat(s.kLine); results.stochD = toFloat(s.dLine);
    }
    if (advancedIndicators.atr) results.atr = toFloat(calculateATR(chartData));
    if (advancedIndicators.cci) results.cci = toFloat(calculateCCI(chartData));
    if (advancedIndicators.williamsR) results.williamsR = toFloat(calculateWilliamsR(chartData));
    if (advancedIndicators.roc) results.roc = toFloat(calculateROC(chartData));
    if (advancedIndicators.obv) results.obv = toFloat(calculateOBV(chartData));
    self.postMessage({ messageId, success: true, results }, transferables);
  } catch (error) {
    self.postMessage({ messageId, success: false, error: error instanceof Error ? error.message : 'Unknown Worker Error' });
  }
};
`;

// ============================================================================
// FACTORY — Creates a Blob Worker, cached as a singleton per session.
// The blob URL is revoked on worker termination to prevent memory leaks.
// ============================================================================
let _blobUrl: string | null = null;

const getBlobUrl = (): string => {
  if (!_blobUrl) {
    const blob = new Blob([INDICATORS_WORKER_SOURCE], { type: "application/javascript" });
    _blobUrl = URL.createObjectURL(blob);
  }
  return _blobUrl;
};

/**
 * Creates a new Web Worker from an inline Blob URL.
 * This pattern bypasses browser HTTP caching entirely.
 * Call worker.terminate() when done; the Blob URL is shared across instances
 * and is NOT revoked on termination (singleton pattern for the session).
 */
export const createIndicatorsWorker = (): Worker => {
  return new Worker(getBlobUrl());
};
