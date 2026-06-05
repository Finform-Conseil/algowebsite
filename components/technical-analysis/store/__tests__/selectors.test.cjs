/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const { initialState } = require("../initialState.ts");
const selectors = require("../selectors.ts");

const createRootState = () => ({
  technicalAnalysis: structuredClone(initialState),
});

test("selectors read the canonical technicalAnalysis state branches", () => {
  const rootState = createRootState();
  const state = rootState.technicalAnalysis;

  assert.equal(selectors.selectTA(rootState), state);
  assert.equal(selectors.selectChartConfig(rootState), state.chartConfig);
  assert.equal(selectors.selectAdvancedIndicators(rootState), state.advancedIndicators);
  assert.equal(selectors.selectIndicatorPeriods(rootState), state.indicatorPeriods);
  assert.equal(selectors.selectBollingerSettings(rootState), state.bollingerSettings);
  assert.equal(selectors.selectChartAppearance(rootState), state.chartAppearance);
  assert.equal(selectors.selectUiState(rootState), state.ui);
  assert.equal(selectors.selectModals(rootState), state.ui.modals);
  assert.equal(selectors.selectAlerts(rootState), state.alerts);
  assert.equal(selectors.selectOrders(rootState), state.orders);
  assert.equal(selectors.selectDataMode(rootState), "real");
  assert.equal(selectors.selectMarketData(rootState), state.marketData);
  assert.equal(selectors.selectMarketSnapshots(rootState), state.marketSnapshots);
});

test("selectDataMode keeps the legacy real-data fallback", () => {
  const rootState = createRootState();
  delete rootState.technicalAnalysis.ui.dataMode;

  assert.equal(selectors.selectDataMode(rootState), "real");
});
