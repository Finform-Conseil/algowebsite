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
  calculateWMA,
  calculateDEMA,
  calculateTEMA,
  calculateHMA,
  calculateZLEMA,
  calculateALMA,
  calculateSMMA,
  calculateKAMA,
  calculateVWMA,
  calculateRSI,
  calculateMACD,
  calculatePPO,
  calculateAPO,
  calculateParabolicSAR,
  calculateADX,
  calculateAroon,
  calculateAroonOscillator,
  calculateSupertrend,
  calculateVortex,
  calculateTRIX,
  calculateSTC,
  calculateMassIndex,
  calculateBollinger,
  calculateStochastic,
  calculateStochasticRSI,
  calculateATR,
  calculateCCI,
  calculateMFI,
  calculateWilliamsR,
  calculateROC,
  calculateMomentum,
  calculateCMO,
  calculateDYMI,
  calculateUltimateOscillator,
  calculateDPO,
  calculateTSI,
  calculateAwesomeOscillator,
  calculateAcceleratorOscillator,
  calculateRVI,
  calculateFisherTransform,
  calculateElderBullBearPower,
  calculateCoppockCurve,
  calculateOBV,
  calculateIchimoku,
} from "../Indicators/TechnicalIndicators";
import { getEmaSeriesDataKey, getSmaSeriesDataKey, normalizeMovingAveragePeriods } from "../../config/movingAverageSeries";
import { getAdvancedMovingAverageDataKey } from "../../config/advancedMovingAverageSeries";

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
      const activeSmaPeriods = normalizeMovingAveragePeriods(indicators.activeSma);
      for (let index = 0; index < activeSmaPeriods.length; index++) {
        const period = activeSmaPeriods[index];
        results[getSmaSeriesDataKey(period)] = toFloatArray(calculateSMA(chartData, period));
      }
    }

    // --- EMA ---
    if (indicators.ema) {
      const activeEmaPeriods = normalizeMovingAveragePeriods(indicators.activeEma);
      for (let index = 0; index < activeEmaPeriods.length; index++) {
        const period = activeEmaPeriods[index];
        results[getEmaSeriesDataKey(period)] = toFloatArray(calculateEMA(chartData, period));
      }
    }

    // --- Advanced Moving Averages ---
    const activeWmaPeriods = normalizeMovingAveragePeriods(indicators.activeWma);
    for (let index = 0; index < activeWmaPeriods.length; index++) {
      const period = activeWmaPeriods[index];
      results[getAdvancedMovingAverageDataKey("wma", period)] = toFloatArray(calculateWMA(chartData, period));
    }

    const activeDemaPeriods = normalizeMovingAveragePeriods(indicators.activeDema);
    for (let index = 0; index < activeDemaPeriods.length; index++) {
      const period = activeDemaPeriods[index];
      results[getAdvancedMovingAverageDataKey("dema", period)] = toFloatArray(calculateDEMA(chartData, period));
    }

    const activeTemaPeriods = normalizeMovingAveragePeriods(indicators.activeTema);
    for (let index = 0; index < activeTemaPeriods.length; index++) {
      const period = activeTemaPeriods[index];
      results[getAdvancedMovingAverageDataKey("tema", period)] = toFloatArray(calculateTEMA(chartData, period));
    }

    const activeHmaPeriods = normalizeMovingAveragePeriods(indicators.activeHma);
    for (let index = 0; index < activeHmaPeriods.length; index++) {
      const period = activeHmaPeriods[index];
      results[getAdvancedMovingAverageDataKey("hma", period)] = toFloatArray(calculateHMA(chartData, period));
    }

    const activeZlemaPeriods = normalizeMovingAveragePeriods(indicators.activeZlema);
    for (let index = 0; index < activeZlemaPeriods.length; index++) {
      const period = activeZlemaPeriods[index];
      results[getAdvancedMovingAverageDataKey("zlema", period)] = toFloatArray(calculateZLEMA(chartData, period));
    }

    const activeAlmaPeriods = normalizeMovingAveragePeriods(indicators.activeAlma);
    for (let index = 0; index < activeAlmaPeriods.length; index++) {
      const period = activeAlmaPeriods[index];
      results[getAdvancedMovingAverageDataKey("alma", period)] = toFloatArray(calculateALMA(chartData, period));
    }

    const activeSmmaPeriods = normalizeMovingAveragePeriods(indicators.activeSmma);
    for (let index = 0; index < activeSmmaPeriods.length; index++) {
      const period = activeSmmaPeriods[index];
      results[getAdvancedMovingAverageDataKey("smma", period)] = toFloatArray(calculateSMMA(chartData, period));
    }

    const activeKamaPeriods = normalizeMovingAveragePeriods(indicators.activeKama);
    for (let index = 0; index < activeKamaPeriods.length; index++) {
      const period = activeKamaPeriods[index];
      results[getAdvancedMovingAverageDataKey("kama", period)] = toFloatArray(calculateKAMA(chartData, period));
    }

    const activeVwmaPeriods = normalizeMovingAveragePeriods(indicators.activeVwma);
    for (let index = 0; index < activeVwmaPeriods.length; index++) {
      const period = activeVwmaPeriods[index];
      results[getAdvancedMovingAverageDataKey("vwma", period)] = toFloatArray(calculateVWMA(chartData, period));
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

    if (advancedIndicators.ppo) {
      const ppo = calculatePPO(chartData);
      results.ppo = toFloatArray(ppo.ppoLine);
      results.ppoSignal = toFloatArray(ppo.signalLine);
      results.ppoHistogram = toFloatArray(ppo.histogram);
    }

    if (advancedIndicators.apo) {
      results.apo = toFloatArray(calculateAPO(chartData));
    }

    if (advancedIndicators.parabolicSar) {
      const sar = calculateParabolicSAR(chartData);
      results.parabolicSar = toFloatArray(sar.sar);
      results.parabolicSarSignal = toFloatArray(sar.signal);
    }

    if (advancedIndicators.adx) {
      const adx = calculateADX(chartData, 14);
      results.adx14 = toFloatArray(adx.adx);
      results.plusDI14 = toFloatArray(adx.plusDI);
      results.minusDI14 = toFloatArray(adx.minusDI);
      results.adxTrendStrength = toFloatArray(adx.trendStrength);
    }

    if (advancedIndicators.aroon) {
      const aroon = calculateAroon(chartData, 14);
      results.aroonUp14 = toFloatArray(aroon.up);
      results.aroonDown14 = toFloatArray(aroon.down);
    }

    if (advancedIndicators.aroonOsc) {
      results.aroonOsc14 = toFloatArray(calculateAroonOscillator(chartData, 14));
    }

    if (advancedIndicators.supertrend) {
      const supertrend = calculateSupertrend(chartData, 10, 3);
      results.supertrend = toFloatArray(supertrend.supertrend);
      results.supertrendSignal = toFloatArray(supertrend.signal);
    }

    if (advancedIndicators.vortex) {
      const vortex = calculateVortex(chartData, 14);
      results.vortexPlus14 = toFloatArray(vortex.plus);
      results.vortexMinus14 = toFloatArray(vortex.minus);
    }

    if (advancedIndicators.trix) {
      results.trix18 = toFloatArray(calculateTRIX(chartData, 18));
    }

    if (advancedIndicators.stc) {
      results.stc = toFloatArray(calculateSTC(chartData));
    }

    if (advancedIndicators.massIndex) {
      results.massIndex = toFloatArray(calculateMassIndex(chartData));
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

    if (advancedIndicators.cci14) {
      results.cci14 = toFloatArray(calculateCCI(chartData, 14));
    }

    if (advancedIndicators.cci20 || advancedIndicators.cci) {
      results.cci20 = toFloatArray(calculateCCI(chartData, 20));
    }

    if (advancedIndicators.mfi14) {
      results.mfi14 = toFloatArray(calculateMFI(chartData, 14));
    }

    if (advancedIndicators.williamsR14 || advancedIndicators.williamsR) {
      results.williamsR14 = toFloatArray(calculateWilliamsR(chartData, 14));
    }

    if (advancedIndicators.roc10 || advancedIndicators.roc) {
      results.roc10 = toFloatArray(calculateROC(chartData, 10));
    }

    if (advancedIndicators.roc20) {
      results.roc20 = toFloatArray(calculateROC(chartData, 20));
    }

    if (advancedIndicators.momentum10) {
      results.momentum10 = toFloatArray(calculateMomentum(chartData, 10));
    }

    if (advancedIndicators.momentum20) {
      results.momentum20 = toFloatArray(calculateMomentum(chartData, 20));
    }

    if (advancedIndicators.cmo14) {
      results.cmo14 = toFloatArray(calculateCMO(chartData, 14));
    }

    if (advancedIndicators.dymi) {
      results.dymi = toFloatArray(calculateDYMI(chartData));
    }

    if (advancedIndicators.ultimateOsc) {
      results.ultimateOsc = toFloatArray(calculateUltimateOscillator(chartData));
    }

    if (advancedIndicators.dpo20) {
      results.dpo20 = toFloatArray(calculateDPO(chartData, 20));
    }

    if (advancedIndicators.tsi) {
      const tsi = calculateTSI(chartData);
      results.tsi = toFloatArray(tsi.tsi);
      results.tsiSignal = toFloatArray(tsi.signalLine);
    }

    if (advancedIndicators.awesomeOsc) {
      results.awesomeOsc = toFloatArray(calculateAwesomeOscillator(chartData));
    }

    if (advancedIndicators.acOsc) {
      results.acOsc = toFloatArray(calculateAcceleratorOscillator(chartData));
    }

    if (advancedIndicators.rvi) {
      const rvi = calculateRVI(chartData);
      results.rvi = toFloatArray(rvi.rvi);
      results.rviSignal = toFloatArray(rvi.signalLine);
    }

    if (advancedIndicators.fisherTransform) {
      const fisher = calculateFisherTransform(chartData);
      results.fisher = toFloatArray(fisher.fisher);
      results.fisherSignal = toFloatArray(fisher.signalLine);
    }

    if (advancedIndicators.elderBullBear) {
      const elder = calculateElderBullBearPower(chartData);
      results.elderBull = toFloatArray(elder.bull);
      results.elderBear = toFloatArray(elder.bear);
    }

    if (advancedIndicators.coppock) {
      results.coppock = toFloatArray(calculateCoppockCurve(chartData));
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
