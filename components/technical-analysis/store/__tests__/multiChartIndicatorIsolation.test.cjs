/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  applyMultiChartPreset,
  hydrateMultiChartLayout,
  setActiveLayoutChart,
  setAdvancedIndicators,
  setBollingerSettings,
  setIndicatorPeriods,
  setMovingAverageTrendSignal,
  setPriceVsEmaMetric,
  setPriceVsSmaMetric,
  updateLayoutChart,
} = require("../technicalAnalysisSlice.ts");
const {
  createDefaultMarketMultiChartLayout,
} = require("../../config/layout/brvmLayoutSymbols.ts");

const createReducerState = () => structuredClone(technicalAnalysisSlice.getInitialState());

const reduce = (state, ...actions) =>
  actions.reduce((current, action) => technicalAnalysisSlice.reducer(current, action), state);

const createTwoPanelState = () => {
  const state = createReducerState();
  state.chartConfig.symbol = "BOAB";
  state.ui.multiChartLayout = createDefaultMarketMultiChartLayout(
    "two_horizontal",
    "BOAB",
    ["SNTS"],
    "BRVM",
  );
  return state;
};

test("switching active panels persists and restores the complete indicator configuration", () => {
  let state = createTwoPanelState();
  state = reduce(
    state,
    setAdvancedIndicators({ rsi: true, bollinger: true }),
    setIndicatorPeriods({ rsiPeriod: 9, sma1: 8 }),
    setBollingerSettings({ length: 34, multiplier: 2.5 }),
    setMovingAverageTrendSignal({ id: "is_above_sma50", active: true }),
    setPriceVsSmaMetric({ id: "price_vs_sma50_pct", active: true }),
    setActiveLayoutChart("chart_2"),
  );

  const first = state.ui.multiChartLayout.charts[0];
  assert.equal(first.indicatorState.advanced.rsi, true);
  assert.equal(first.indicatorState.advanced.bollinger, true);
  assert.equal(first.indicatorState.periods.rsiPeriod, 9);
  assert.equal(first.indicatorState.bollinger.length, 34);
  assert.equal(first.indicatorState.bollinger.multiplier, 2.5);
  assert.equal(first.indicatorState.ui.movingAverageTrendSignals.active.is_above_sma50, true);
  assert.equal(first.indicatorState.ui.priceVsSmaMetrics.active.price_vs_sma50_pct, true);

  assert.equal(state.advancedIndicators.rsi, false);
  assert.equal(state.indicatorPeriods.rsiPeriod, 14);
  assert.equal(state.ui.movingAverageTrendSignals.active.is_above_sma50, false);

  state = reduce(
    state,
    setAdvancedIndicators({ macd: true }),
    setPriceVsEmaMetric({ id: "price_vs_ema50_pct", active: true }),
    setActiveLayoutChart("chart_1"),
  );

  const second = state.ui.multiChartLayout.charts[1];
  assert.equal(second.indicatorState.advanced.macd, true);
  assert.equal(second.indicatorState.ui.priceVsEmaMetrics.active.price_vs_ema50_pct, true);
  assert.equal(state.advancedIndicators.rsi, true);
  assert.equal(state.advancedIndicators.macd, false);
  assert.equal(state.indicatorPeriods.rsiPeriod, 9);
  assert.equal(state.bollingerSettings.length, 34);
  assert.equal(state.ui.movingAverageTrendSignals.active.is_above_sma50, true);
  assert.equal(state.ui.priceVsSmaMetrics.active.price_vs_sma50_pct, true);
  assert.equal(state.ui.priceVsEmaMetrics.active.price_vs_ema50_pct, false);
});

test("editing a secondary panel indicator list does not leak into the active panel", () => {
  let state = createTwoPanelState();
  state = reduce(
    state,
    setAdvancedIndicators({ rsi: true }),
    setActiveLayoutChart("chart_2"),
    setAdvancedIndicators({ macd: true }),
    setActiveLayoutChart("chart_1"),
  );

  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", indicators: ["volume", "sma", "macd"] }),
  );

  const first = state.ui.multiChartLayout.charts[0];
  const second = state.ui.multiChartLayout.charts[1];
  assert.equal(state.advancedIndicators.rsi, true);
  assert.equal(state.advancedIndicators.macd, false);
  assert.equal(first.indicatorState.advanced.rsi, true);
  assert.equal(second.indicatorState.advanced.macd, true);
  assert.equal(second.indicatorState.chart.sma, true);
  assert.equal(second.indicatorState.chart.volume, true);

  state = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));
  assert.equal(state.advancedIndicators.rsi, false);
  assert.equal(state.advancedIndicators.macd, true);
  assert.equal(state.chartConfig.indicators.sma, true);
  assert.equal(state.chartConfig.indicators.volume, true);
});

test("multi-timeframe preset carries one logical indicator setup into isolated panel snapshots", () => {
  const base = createReducerState();
  base.chartConfig.symbol = "BOAB";
  base.ui.multiChartLayout = createDefaultMarketMultiChartLayout("single", "BOAB", [], "BRVM");

  const state = reduce(
    base,
    setAdvancedIndicators({ rsi: true, macd: true }),
    setIndicatorPeriods({ rsiPeriod: 25 }),
    setMovingAverageTrendSignalSourceAveragesForTest(),
    applyMultiChartPreset("multi_timeframe"),
  );

  const cells = state.ui.multiChartLayout.charts;
  assert.deepEqual(cells.map((cell) => cell.interval), ["1D", "1W", "1M"]);
  cells.forEach((cell) => {
    assert.equal(cell.indicatorState.advanced.rsi, true);
    assert.equal(cell.indicatorState.advanced.macd, true);
    assert.equal(cell.indicatorState.periods.rsiPeriod, 25);
    assert.equal(cell.indicatorState.ui.movingAverageTrendSignals.showSourceAverages, false);
  });
  assert.notEqual(cells[0].indicatorState, cells[1].indicatorState);
  assert.notEqual(cells[0].indicatorState.advanced, cells[1].indicatorState.advanced);
  assert.notEqual(cells[0].indicatorState.periods, cells[1].indicatorState.periods);
});

function setMovingAverageTrendSignalSourceAveragesForTest() {
  return {
    type: "technicalAnalysis/setMovingAverageTrendSignalSourceAverages",
    payload: false,
  };
}

test("hydration restores the persisted active-panel snapshot instead of global defaults", () => {
  let configured = createTwoPanelState();
  configured = reduce(
    configured,
    setAdvancedIndicators({ rsi: true, atr: true }),
    setIndicatorPeriods({ rsiPeriod: 9 }),
    setBollingerSettings({ length: 55 }),
  );
  const persisted = structuredClone(configured.ui.multiChartLayout);

  const fresh = createReducerState();
  fresh.chartConfig.symbol = "BOAB";
  const hydrated = technicalAnalysisSlice.reducer(fresh, hydrateMultiChartLayout(persisted));

  assert.equal(hydrated.ui.multiChartLayout.activeChartId, "chart_1");
  assert.equal(hydrated.advancedIndicators.rsi, true);
  assert.equal(hydrated.advancedIndicators.atr, true);
  assert.equal(hydrated.indicatorPeriods.rsiPeriod, 9);
  assert.equal(hydrated.bollingerSettings.length, 55);
});
