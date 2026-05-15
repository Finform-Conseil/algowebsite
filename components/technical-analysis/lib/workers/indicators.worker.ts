/**
 * [TENOR 2026] Web Worker for Technical Indicators (High-Performance Edition)
 * Uses Transferable Objects (Float64Array) for Zero-Copy memory transfer.
 * Strictly avoids SharedArrayBuffer to prevent Spectre/Meltdown vulnerabilities.
 *
 * [TENOR 2026 FIX] Race Condition Prevention (SCAR-162):
 * Implements Correlation ID (messageId) echo to allow the client to discard obsolete responses.
 *
 * [TENOR 2026 HDR] BOLLINGER BANDS UPGRADE:
 * Dynamically extracts length, multiplier, source, and offset from bollingerSettings.
 * Conditionally transfers bbWidth and bbPercentB buffers.
 *
 * [TENOR 2026 SRE] DYNAMIC BUFFER SIZING:
 * `toFloatArray` now dynamically sizes the output buffer to support indicators
 * that project into the future (e.g., Ichimoku Cloud, Bollinger with positive offset).
 */

import {
  ChartDataPoint,
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollinger,
  calculateStochastic,
  calculateStochasticRSI,
  calculateATR,
  calculateCCI,
  calculateWilliamsR,
  calculateROC,
  calculateOBV,
  calculateIchimoku,
} from "../Indicators/TechnicalIndicators";

// Constants for binary protocol
const FIELDS_PER_CANDLE = 6; // timestamp, open, high, low, close, volume

self.onmessage = (e: MessageEvent) => {
  // [TENOR 2026 FIX] Extract messageId safely outside the try block
  // so it can be echoed back even if payload parsing fails.
  const messageId = e.data?.messageId;

  try {
    const { buffer, length, config } = e.data;

    // 1. Security & Integrity Check
    if (!buffer || !(buffer instanceof ArrayBuffer) || typeof length !== "number") {
      throw new Error("Invalid payload: Expected ArrayBuffer and length.");
    }

    // 2. Reconstruct Data (Zero-Copy View)
    const flatData = new Float64Array(buffer);
    const chartData: ChartDataPoint[] = new Array(length);

    for (let i = 0; i < length; i++) {
      const offset = i * FIELDS_PER_CANDLE;
      chartData[i] = {
        time: flatData[offset + 0].toString(), // Reconstruct as string for compatibility
        open: flatData[offset + 1],
        high: flatData[offset + 2],
        low: flatData[offset + 3],
        close: flatData[offset + 4],
        volume: flatData[offset + 5],
      };
    }

    // 3. Execute Math based on Config
    const { indicators, advancedIndicators, indicatorPeriods, bollingerSettings } = config;
    const results: Record<string, Float64Array> = {};
    const transferables: ArrayBuffer[] = [];

    // [TENOR 2026 SRE] Helper to convert (number | string)[] to Float64Array
    // Dynamically sizes the buffer based on the input array length to support future projections.
    const toFloatArray = (arr: (number | string)[]) => {
      const arrLen = arr.length;
      const f64 = new Float64Array(arrLen);
      for (let i = 0; i < arrLen; i++) {
        f64[i] = typeof arr[i] === "number" ? (arr[i] as number) : NaN;
      }
      transferables.push(f64.buffer);
      return f64;
    };

    // --- SMA ---
    if (indicators.sma) {
      if (indicators.activeSma.includes(indicatorPeriods.sma1)) {
        results.sma1 = toFloatArray(calculateSMA(chartData, indicatorPeriods.sma1));
      }
      if (indicators.activeSma.includes(indicatorPeriods.sma2)) {
        results.sma2 = toFloatArray(calculateSMA(chartData, indicatorPeriods.sma2));
      }
      if (indicators.activeSma.includes(indicatorPeriods.sma3)) {
        results.sma3 = toFloatArray(calculateSMA(chartData, indicatorPeriods.sma3));
      }
      if (indicators.activeSma.includes(50)) {
        results.sma50 = toFloatArray(calculateSMA(chartData, 50));
      }
      if (indicators.activeSma.includes(200)) {
        results.sma200 = toFloatArray(calculateSMA(chartData, 200));
      }
    }

    // --- EMA ---
    if (indicators.ema) {
      if (indicators.activeEma.includes(5)) {
        results.ema5 = toFloatArray(calculateEMA(chartData, 5));
      }
      if (indicators.activeEma.includes(10)) {
        results.ema10 = toFloatArray(calculateEMA(chartData, 10));
      }
    }

    // --- Advanced Indicators ---
    if (advancedIndicators.rsi) {
      results.rsi = toFloatArray(calculateRSI(chartData, indicatorPeriods.rsiPeriod));
    }

    if (advancedIndicators.macd) {
      const macd = calculateMACD(chartData);
      results.macdLine = toFloatArray(macd.macdLine);
      results.macdSignal = toFloatArray(macd.signalLine);
      results.macdHist = toFloatArray(macd.histogram);
    }

    // [TENOR 2026 HDR] BOLLINGER BANDS
    // Calculate if either the main bands OR the derived oscillators are requested
    if (advancedIndicators.bollinger || advancedIndicators.bbWidth || advancedIndicators.bbPercentB) {
      // Extract dynamic settings with safe fallbacks to TradingView defaults
      const period = bollingerSettings?.length ?? 20;
      const multiplier = bollingerSettings?.multiplier ?? 2.0;
      const source = bollingerSettings?.source ?? "close";
      const offset = bollingerSettings?.offset ?? 0;

      const boll = calculateBollinger(chartData, period, multiplier, source, offset);

      // Only transfer the buffers that are actually requested by the UI
      if (advancedIndicators.bollinger) {
        results.bollUpper = toFloatArray(boll.upper);
        results.bollMiddle = toFloatArray(boll.middle);
        results.bollLower = toFloatArray(boll.lower);
      }
      if (advancedIndicators.bbWidth) {
        results.bbWidth = toFloatArray(boll.width);
      }
      if (advancedIndicators.bbPercentB) {
        results.bbPercentB = toFloatArray(boll.percentB);
      }
    }

    if (advancedIndicators.stochastic) {
      const stoch = calculateStochastic(chartData);
      results.stochK = toFloatArray(stoch.kLine);
      results.stochD = toFloatArray(stoch.dLine);
    }

    if (advancedIndicators.stochRsi) {
      const stochRsi = calculateStochasticRSI(chartData);
      results.stochRsiK = toFloatArray(stochRsi.kLine);
      results.stochRsiD = toFloatArray(stochRsi.dLine);
    }

    if (advancedIndicators.ichimoku) {
      const ichi = calculateIchimoku(chartData);
      results.tenkan = toFloatArray(ichi.tenkan);
      results.kijun = toFloatArray(ichi.kijun);
      results.senkouA = toFloatArray(ichi.senkouA);
      results.senkouB = toFloatArray(ichi.senkouB);
      results.chikou = toFloatArray(ichi.chikou);
    }

    if (advancedIndicators.atr) {
      results.atr = toFloatArray(calculateATR(chartData));
    }

    if (advancedIndicators.cci) {
      results.cci = toFloatArray(calculateCCI(chartData));
    }

    if (advancedIndicators.williamsR) {
      results.williamsR = toFloatArray(calculateWilliamsR(chartData));
    }

    if (advancedIndicators.roc) {
      results.roc = toFloatArray(calculateROC(chartData));
    }

    if (advancedIndicators.obv) {
      results.obv = toFloatArray(calculateOBV(chartData));
    }

    // 4. Send Results Back (Transferring ownership of all result buffers)
    // [TENOR 2026 FIX] Echo messageId back to client
    (self as any).postMessage({ messageId, success: true, results }, transferables);

  } catch (error) {
    // [TENOR 2026 FIX] Echo messageId back even on error
    (self as any).postMessage({
      messageId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown Worker Error"
    });
  }
};

// --- EOF ---