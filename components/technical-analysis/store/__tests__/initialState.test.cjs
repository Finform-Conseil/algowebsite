/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const { technicalAnalysisSlice } = require("../technicalAnalysisSlice.ts");
const { initialState } = require("../initialState.ts");
const { createDefaultBrvmMultiChartLayout } = require("../../config/layout/brvmLayoutSymbols.ts");
const { createDefaultMovingAverageTrendSignals } = require("../../config/indicators/movingAverageSeries.ts");
const { createDefaultPriceVsSmaMetrics } = require("../../config/indicators/priceVsSmaMetrics.ts");
const { createDefaultPriceVsEmaMetrics } = require("../../config/indicators/priceVsEmaMetrics.ts");

const expectedAdvancedIndicatorKeys = [
  "rsi",
  "macd",
  "bollinger",
  "stochastic",
  "atr",
  "atr20",
  "natr14",
  "donchian",
  "keltner",
  "hv10",
  "hv20",
  "hv30",
  "hv60",
  "hv90",
  "hv252",
  "stdDev20",
  "chaikinVol",
  "cci",
  "cci14",
  "cci20",
  "mfi14",
  "williamsR",
  "williamsR14",
  "roc",
  "roc10",
  "roc20",
  "momentum10",
  "momentum20",
  "cmo14",
  "dymi",
  "ultimateOsc",
  "dpo20",
  "tsi",
  "awesomeOsc",
  "acOsc",
  "rvi",
  "fisherTransform",
  "elderBullBear",
  "coppock",
  "ppo",
  "apo",
  "parabolicSar",
  "adx",
  "aroon",
  "aroonOsc",
  "supertrend",
  "vortex",
  "trix",
  "stc",
  "massIndex",
  "kst",
  "linearRegression",
  "ulcerIndex",
  "obv",
  "adLine",
  "cmf20",
  "nvi",
  "pvi",
  "chaikinOsc",
  "volumeOsc",
  "vroc14",
  "klinger",
  "elderForceIndex",
  "eom14",
  "volumeProfile",
  "pivotPointsStandard",
  "pivotPointsFibonacci",
  "movingAverageCrosses",
  "vwap",
  "fiftyTwoWeekHigh",
  "fiftyTwoWeekLow",
  "ath",
  "atl",
  "breakoutResistance",
  "breakdownSupport",
  "gapUp",
  "gapDown",
  "trueGapUp",
  "trueGapDown",
  "gapPct",
  "consecutiveUpDays",
  "consecutiveDownDays",
  "insideBar",
  "outsideBar",
  "doji",
  "longLeggedDoji",
  "rickshawMan",
  "dragonflyDoji",
  "gravestoneDoji",
  "tristar",
  "hammer",
  "hangingMan",
  "takuri",
  "invertedHammer",
  "shootingStar",
  "marubozuBull",
  "marubozuBear",
  "spinningTop",
  "ichimoku",
  "stochRsi",
  "bbWidth",
  "bbPercentB",
].sort();

test("slice uses the extracted initialState as its default state", () => {
  assert.deepEqual(technicalAnalysisSlice.getInitialState(), initialState);
});

test("chart defaults remain identical to the Phase 1 extraction contract", () => {
  assert.deepEqual(initialState.chartConfig, {
    symbol: "BOAB",
    timeframe: "1D",
    chartType: "candles",
    indicators: {
      sma: true,
      ema: false,
      volume: true,
      activeSma: [],
      activeEma: [],
      activeWma: [],
      activeDema: [],
      activeTema: [],
      activeHma: [],
      activeZlema: [],
      activeAlma: [],
      activeSmma: [],
      activeKama: [],
      activeVwma: [],
    },
  });
});

test("advanced indicator defaults keep the complete false map", () => {
  assert.deepEqual(Object.keys(initialState.advancedIndicators).sort(), expectedAdvancedIndicatorKeys);
  Object.values(initialState.advancedIndicators).forEach((value) => {
    assert.equal(value, false);
  });
});

test("settings and appearance defaults remain stable", () => {
  assert.deepEqual(initialState.indicatorPeriods, {
    sma1: 5,
    sma2: 10,
    sma3: 20,
    rsiPeriod: 14,
  });
  assert.deepEqual(initialState.bollingerSettings, {
    length: 20,
    source: "close",
    multiplier: 2.0,
    offset: 0,
    showUpper: true,
    showMiddle: true,
    showLower: true,
    showFill: true,
    upperColor: "#2962FF",
    middleColor: "#FF6D00",
    lowerColor: "#2962FF",
    fillColor: "#2196F3",
    fillOpacity: 0.05,
  });
  assert.deepEqual(initialState.chartAppearance, {
    showGrid: true,
    upColor: "#00da3c",
    downColor: "#ec0000",
    backgroundColor: "transparent",
    showVolume: true,
    volumeColorMode: "candle-body",
  });
});

test("UI defaults remain aligned with the canonical factory helpers", () => {
  assert.equal(initialState.ui.isZenMode, false);
  assert.equal(initialState.ui.isAnonyme, false);
  assert.equal(initialState.ui.selectedPseudo, "Trader_700");
  assert.equal(initialState.ui.cursorMode, "cross");
  assert.equal(initialState.ui.selectedTimeRange, "Tout");
  assert.equal(initialState.ui.isPublishing, false);
  assert.equal(initialState.ui.isCapturing, false);
  assert.equal(initialState.ui.dataMode, "real");
  assert.deepEqual(initialState.ui.comparisonSymbols, []);
  assert.deepEqual(initialState.ui.comparisonSettings, {});
  assert.deepEqual(initialState.ui.movingAverageTrendSignals, createDefaultMovingAverageTrendSignals());
  assert.deepEqual(initialState.ui.priceVsSmaMetrics, createDefaultPriceVsSmaMetrics());
  assert.deepEqual(initialState.ui.priceVsEmaMetrics, createDefaultPriceVsEmaMetrics());
  assert.deepEqual(initialState.ui.multiChartLayout, createDefaultBrvmMultiChartLayout("single", "BOAB"));
  assert.equal(initialState.ui.searchMode, "replace");
  assert.deepEqual(initialState.ui.modals, {
    search: false,
    indicators: false,
    replay: false,
    templates: false,
    settings: false,
    options: false,
    datePicker: false,
    loadAnalysis: false,
    alerts: false,
    publish: false,
    drawingSettings: false,
  });
  assert.deepEqual(initialState.ui.replay, {
    isActive: false,
    isPaused: false,
    speed: 1000,
  });
  assert.equal(initialState.ui.isLockedAll, false);
  assert.equal(initialState.ui.areDrawingsHidden, false);
  assert.equal(initialState.ui.prefilledAlertPrice, undefined);
  assert.equal(initialState.ui.prefilledAlertCondition, undefined);
});

test("local collections start empty", () => {
  assert.deepEqual(initialState.alerts, []);
  assert.deepEqual(initialState.orders, []);
  assert.deepEqual(initialState.marketData, {});
  assert.deepEqual(initialState.marketSnapshots, {});
});
