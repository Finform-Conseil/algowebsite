/**
 * Web Worker for Technical Indicators
 * Uses Transferable Objects (Float64Array) for one-way buffer transfer.
 * Avoids SharedArrayBuffer so the worker does not require cross-origin isolation.
 *
 * Response correlation:
 * Echoes messageId so the client can discard obsolete responses.
 *
 * Bollinger Bands:
 * Dynamically extracts length, multiplier, source, and offset from bollingerSettings.
 * Conditionally transfers bbWidth and bbPercentB buffers.
 *
 * Dynamic buffer sizing:
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
  calculateKST,
  calculateLinearRegressionIndicator,
  calculateBollinger,
  calculateStochastic,
  calculateStochasticRSI,
  calculateATR,
  calculateNATR,
  calculateDonchianChannels,
  calculateKeltnerChannels,
  calculateHistoricalVolatility,
  calculatePriceStdDev,
  calculateChaikinVolatility,
  calculateCMF,
  calculateUlcerIndex,
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
  calculateADLine,
  calculateNVI,
  calculatePVI,
  calculateChaikinOscillator,
  calculateVolumeOscillator,
  calculateVROC,
  calculateKlingerOscillator,
  calculateElderForceIndex,
  calculateEOM,
  calculatePivotPointsStandard,
  calculatePivotPointsFibonacci,
  calculateMovingAverageCrossSignals,
  calculateVWAP,
  calculateFiftyTwoWeekLevels,
  calculateHistoricalRecordLevels,
  calculatePriceActionSignals,
  calculateCandlestickPatterns,
  calculateIchimoku,
} from "../Indicators/TechnicalIndicators";
import { getEmaSeriesDataKey, getSmaSeriesDataKey, normalizeMovingAveragePeriods } from "../../config/indicators/movingAverageSeries";
import { getAdvancedMovingAverageDataKey } from "../../config/indicators/advancedMovingAverageSeries";

// Constants for binary protocol
const FIELDS_PER_CANDLE = 7; // timestamp, open, high, low, close, volume, tradesCount

self.onmessage = (e: MessageEvent) => {
  // Extract messageId outside the try block
  // so it can be echoed back even if payload parsing fails.
  const messageId = e.data?.messageId;

  try {
    const { buffer, length, config } = e.data;

    // 1. Security & Integrity Check
    if (!buffer || !(buffer instanceof ArrayBuffer) || typeof length !== "number") {
      throw new Error("Invalid payload: Expected ArrayBuffer and length.");
    }

    // 2. Reconstruct data from a transferred buffer view.
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
        tradesCount: Number.isFinite(flatData[offset + 6]) ? flatData[offset + 6] : null,
      };
    }

    // 3. Execute Math based on Config
    const { indicators, advancedIndicators, indicatorPeriods, bollingerSettings } = config;
    const results: Record<string, Float64Array> = {};
    const transferables: ArrayBuffer[] = [];

    // [worker] Helper to convert (number | string)[] to Float64Array
    // Dynamically sizes the buffer based on the input array length to support future projections.
    const toFloatArray = (arr: (number | string | null)[]) => {
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

    if (advancedIndicators.kst) {
      const kst = calculateKST(chartData);
      results.kst = toFloatArray(kst.kst);
      results.kstSignal = toFloatArray(kst.signalLine);
    }

    if (advancedIndicators.linearRegression) {
      const linearRegression = calculateLinearRegressionIndicator(chartData);
      results.linearRegValue = toFloatArray(linearRegression.value);
      results.linearRegSlope = toFloatArray(linearRegression.slope);
      results.linearRegSlopePct = toFloatArray(linearRegression.slopePct);
    }

    // BOLLINGER BANDS
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

    if (advancedIndicators.atr20) {
      results.atr20 = toFloatArray(calculateATR(chartData, 20));
    }

    if (advancedIndicators.natr14) {
      results.natr14 = toFloatArray(calculateNATR(chartData, 14));
    }

    if (advancedIndicators.donchian) {
      const donchian = calculateDonchianChannels(chartData, 20);
      results.donchianUpper = toFloatArray(donchian.upper);
      results.donchianMiddle = toFloatArray(donchian.middle);
      results.donchianLower = toFloatArray(donchian.lower);
    }

    if (advancedIndicators.keltner) {
      const keltner = calculateKeltnerChannels(chartData, 20, 2, 20);
      results.keltnerUpper = toFloatArray(keltner.upper);
      results.keltnerMiddle = toFloatArray(keltner.middle);
      results.keltnerLower = toFloatArray(keltner.lower);
    }

    if (advancedIndicators.hv10) {
      results.hv10 = toFloatArray(calculateHistoricalVolatility(chartData, 10));
    }

    if (advancedIndicators.hv20) {
      results.hv20 = toFloatArray(calculateHistoricalVolatility(chartData, 20));
    }

    if (advancedIndicators.hv30) {
      results.hv30 = toFloatArray(calculateHistoricalVolatility(chartData, 30));
    }

    if (advancedIndicators.hv60) {
      results.hv60 = toFloatArray(calculateHistoricalVolatility(chartData, 60));
    }

    if (advancedIndicators.hv90) {
      results.hv90 = toFloatArray(calculateHistoricalVolatility(chartData, 90));
    }

    if (advancedIndicators.hv252) {
      results.hv252 = toFloatArray(calculateHistoricalVolatility(chartData, 252));
    }

    if (advancedIndicators.stdDev20) {
      results.stdDev20 = toFloatArray(calculatePriceStdDev(chartData, 20));
    }

    if (advancedIndicators.chaikinVol) {
      results.chaikinVol = toFloatArray(calculateChaikinVolatility(chartData, 10, 10));
    }

    if (advancedIndicators.ulcerIndex) {
      results.ulcerIndex = toFloatArray(calculateUlcerIndex(chartData, 14));
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

    if (advancedIndicators.adLine) {
      results.adLine = toFloatArray(calculateADLine(chartData));
    }

    if (advancedIndicators.cmf20) {
      results.cmf20 = toFloatArray(calculateCMF(chartData, 20));
    }

    if (advancedIndicators.nvi) {
      results.nvi = toFloatArray(calculateNVI(chartData));
    }

    if (advancedIndicators.pvi) {
      results.pvi = toFloatArray(calculatePVI(chartData));
    }

    if (advancedIndicators.chaikinOsc) {
      results.chaikinOsc = toFloatArray(calculateChaikinOscillator(chartData, 3, 10));
    }

    if (advancedIndicators.volumeOsc) {
      results.volumeOsc = toFloatArray(calculateVolumeOscillator(chartData, 5, 20));
    }

    if (advancedIndicators.vroc14) {
      results.vroc14 = toFloatArray(calculateVROC(chartData, 14));
    }

    if (advancedIndicators.klinger) {
      const klinger = calculateKlingerOscillator(chartData, 34, 55, 13);
      results.klingerOsc = toFloatArray(klinger.oscillator);
      results.klingerSignal = toFloatArray(klinger.signalLine);
    }

    if (advancedIndicators.elderForceIndex) {
      const force = calculateElderForceIndex(chartData, 13);
      results.elderForceRaw = toFloatArray(force.raw);
      results.forceIndex13 = toFloatArray(force.forceIndex13);
    }

    if (advancedIndicators.eom14) {
      results.eom14 = toFloatArray(calculateEOM(chartData, 14, 100_000_000));
    }

    if (advancedIndicators.pivotPointsStandard) {
      const pivots = calculatePivotPointsStandard(chartData);
      results.pivotStandard = toFloatArray(pivots.pivot);
      results.pivotR1 = toFloatArray(pivots.r1);
      results.pivotR2 = toFloatArray(pivots.r2);
      results.pivotR3 = toFloatArray(pivots.r3);
      results.pivotS1 = toFloatArray(pivots.s1);
      results.pivotS2 = toFloatArray(pivots.s2);
      results.pivotS3 = toFloatArray(pivots.s3);
    }

    if (advancedIndicators.pivotPointsFibonacci) {
      const pivots = calculatePivotPointsFibonacci(chartData);
      results.pivotFibP = toFloatArray(pivots.pivot);
      results.pivotFibR1 = toFloatArray(pivots.r1);
      results.pivotFibR2 = toFloatArray(pivots.r2);
      results.pivotFibR3 = toFloatArray(pivots.r3);
      results.pivotFibS1 = toFloatArray(pivots.s1);
      results.pivotFibS2 = toFloatArray(pivots.s2);
      results.pivotFibS3 = toFloatArray(pivots.s3);
    }

    if (advancedIndicators.movingAverageCrosses) {
      const crosses = calculateMovingAverageCrossSignals(chartData, 50, 200);
      results.goldenCross = toFloatArray(crosses.goldenCross);
      results.deathCross = toFloatArray(crosses.deathCross);
    }

    if (advancedIndicators.vwap) {
      const vwap = calculateVWAP(chartData);
      results.vwap = toFloatArray(vwap.vwap);
      results.priceAboveVwap = toFloatArray(vwap.priceAboveVwap);
      results.priceBelowVwap = toFloatArray(vwap.priceBelowVwap);
      results.vwapDistance = toFloatArray(vwap.distance);
      results.vwapDistancePct = toFloatArray(vwap.distancePct);
    }

    if (advancedIndicators.fiftyTwoWeekHigh || advancedIndicators.fiftyTwoWeekLow) {
      const levels = calculateFiftyTwoWeekLevels(chartData);
      if (advancedIndicators.fiftyTwoWeekHigh) {
        results.fiftyTwoWeekHigh = toFloatArray(levels.high);
        results.newFiftyTwoWeekHigh = toFloatArray(levels.newHigh);
      }
      if (advancedIndicators.fiftyTwoWeekLow) {
        results.fiftyTwoWeekLow = toFloatArray(levels.low);
        results.newFiftyTwoWeekLow = toFloatArray(levels.newLow);
      }
    }

    if (advancedIndicators.ath || advancedIndicators.atl) {
      const records = calculateHistoricalRecordLevels(chartData);
      if (advancedIndicators.ath) {
        results.ath = toFloatArray(records.ath);
        results.newAth = toFloatArray(records.newAth);
      }
      if (advancedIndicators.atl) {
        results.atl = toFloatArray(records.atl);
        results.newAtl = toFloatArray(records.newAtl);
      }
    }

    const needsPriceActionSignals = advancedIndicators.breakoutResistance
      || advancedIndicators.breakdownSupport
      || advancedIndicators.gapUp
      || advancedIndicators.gapDown
      || advancedIndicators.trueGapUp
      || advancedIndicators.trueGapDown
      || advancedIndicators.gapPct
      || advancedIndicators.consecutiveUpDays
      || advancedIndicators.consecutiveDownDays
      || advancedIndicators.insideBar
      || advancedIndicators.outsideBar;
    if (needsPriceActionSignals) {
      const priceAction = calculatePriceActionSignals(chartData, { lookback: 20, minBreakTicks: 1, minGapTicks: 1 });
      if (advancedIndicators.breakoutResistance) {
        results.priceActionResistance = toFloatArray(priceAction.resistance);
        results.breakoutResistance = toFloatArray(priceAction.breakoutResistance);
      }
      if (advancedIndicators.breakdownSupport) {
        results.priceActionSupport = toFloatArray(priceAction.support);
        results.breakdownSupport = toFloatArray(priceAction.breakdownSupport);
      }
      if (advancedIndicators.gapUp) results.gapUp = toFloatArray(priceAction.gapUp);
      if (advancedIndicators.gapDown) results.gapDown = toFloatArray(priceAction.gapDown);
      if (advancedIndicators.trueGapUp) results.trueGapUp = toFloatArray(priceAction.trueGapUp);
      if (advancedIndicators.trueGapDown) results.trueGapDown = toFloatArray(priceAction.trueGapDown);
      if (advancedIndicators.gapPct || advancedIndicators.gapUp || advancedIndicators.gapDown || advancedIndicators.trueGapUp || advancedIndicators.trueGapDown) {
        results.gapAbs = toFloatArray(priceAction.gapAbs);
        results.gapPct = toFloatArray(priceAction.gapPct);
      }
      if (advancedIndicators.consecutiveUpDays) results.upStreak = toFloatArray(priceAction.upStreak);
      if (advancedIndicators.consecutiveDownDays) results.downStreak = toFloatArray(priceAction.downStreak);
      if (advancedIndicators.insideBar) results.insideBar = toFloatArray(priceAction.insideBar);
      if (advancedIndicators.outsideBar) results.outsideBar = toFloatArray(priceAction.outsideBar);
    }

    const needsCandlestickPatterns = advancedIndicators.doji
      || advancedIndicators.longLeggedDoji
      || advancedIndicators.rickshawMan
      || advancedIndicators.dragonflyDoji
      || advancedIndicators.gravestoneDoji
      || advancedIndicators.tristar
      || advancedIndicators.hammer
      || advancedIndicators.hangingMan
      || advancedIndicators.takuri
      || advancedIndicators.invertedHammer
      || advancedIndicators.shootingStar
      || advancedIndicators.marubozuBull
      || advancedIndicators.marubozuBear
      || advancedIndicators.spinningTop;
    if (needsCandlestickPatterns) {
      const patterns = calculateCandlestickPatterns(chartData, { requireVolumeForPattern: false });
      if (advancedIndicators.doji) results.doji = toFloatArray(patterns.doji);
      if (advancedIndicators.longLeggedDoji) results.longLeggedDoji = toFloatArray(patterns.longLeggedDoji);
      if (advancedIndicators.rickshawMan) results.rickshawMan = toFloatArray(patterns.rickshawMan);
      if (advancedIndicators.dragonflyDoji) results.dragonflyDoji = toFloatArray(patterns.dragonflyDoji);
      if (advancedIndicators.gravestoneDoji) results.gravestoneDoji = toFloatArray(patterns.gravestoneDoji);
      if (advancedIndicators.tristar) {
        results.tristar = toFloatArray(patterns.tristar);
        results.bullishTristar = toFloatArray(patterns.bullishTristar);
        results.bearishTristar = toFloatArray(patterns.bearishTristar);
      }
      if (advancedIndicators.hammer) {
        results.hammer = toFloatArray(patterns.hammer);
        results.hammerConfirmed = toFloatArray(patterns.hammerConfirmed);
      }
      if (advancedIndicators.hangingMan) {
        results.hangingMan = toFloatArray(patterns.hangingMan);
        results.hangingManConfirmed = toFloatArray(patterns.hangingManConfirmed);
      }
      if (advancedIndicators.takuri) results.takuri = toFloatArray(patterns.takuri);
      if (advancedIndicators.invertedHammer) {
        results.invertedHammer = toFloatArray(patterns.invertedHammer);
        results.invertedHammerConfirmed = toFloatArray(patterns.invertedHammerConfirmed);
      }
      if (advancedIndicators.shootingStar) {
        results.shootingStar = toFloatArray(patterns.shootingStar);
        results.shootingStarConfirmed = toFloatArray(patterns.shootingStarConfirmed);
      }
      if (advancedIndicators.marubozuBull) results.marubozuBull = toFloatArray(patterns.marubozuBull);
      if (advancedIndicators.marubozuBear) results.marubozuBear = toFloatArray(patterns.marubozuBear);
      if (advancedIndicators.spinningTop) results.spinningTop = toFloatArray(patterns.spinningTop);
      results.candlestickInsufficientHistory = toFloatArray(patterns.insufficientHistory);
      results.candlestickMissingOHLC = toFloatArray(patterns.missingOHLC);
      results.candlestickInvalidOHLC = toFloatArray(patterns.invalidOHLC);
      results.candlestickZeroRange = toFloatArray(patterns.zeroRange);
      results.candlestickNoTradeSession = toFloatArray(patterns.noTradeSession);
      results.candlestickStalePrice = toFloatArray(patterns.stalePrice);
      results.candlestickCorporateActionSuspected = toFloatArray(patterns.corporateActionSuspected);
      results.candlestickLowReliabilityBecauseIlliquid = toFloatArray(patterns.lowReliabilityBecauseIlliquid);
    }

    // 4. Send Results Back (Transferring ownership of all result buffers)
    // Echo messageId back to client
    (self as any).postMessage({ messageId, success: true, results }, transferables);

  } catch (error) {
    // Echo messageId back even on error
    (self as any).postMessage({
      messageId,
      success: false,
      error: error instanceof Error ? error.message : "Unknown Worker Error"
    });
  }
};

// --- EOF ---
