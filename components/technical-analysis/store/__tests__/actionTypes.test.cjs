/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const { technicalAnalysisSlice } = require("../technicalAnalysisSlice.ts");

const expectedActionNames = [
  "addAlert",
  "addComparisonSymbol",
  "addOrder",
  "applyMultiChartPreset",
  "applyTemplate",
  "cancelOrder",
  "clearComparisonSymbols",
  "closeAllModals",
  "deactivateAlert",
  "hydrateMultiChartLayout",
  "removeAlert",
  "removeComparisonSymbol",
  "resetChartAppearance",
  "resetComparisonSeriesSettings",
  "resetMultiChartLayout",
  "setActiveLayoutChart",
  "setAdvancedIndicators",
  "setAnonyme",
  "setAreDrawingsHidden",
  "setBollingerSettings",
  "setCapturing",
  "setChartAppearance",
  "setChartConfig",
  "setChartType",
  "setComparisonSeriesSettings",
  "setCursorMode",
  "setDataMode",
  "setEditChartTarget",
  "setIndicatorPeriods",
  "setLockedAll",
  "setModalOpen",
  "setMovingAverageTrendSignal",
  "setMovingAverageTrendSignalSourceAverages",
  "setMovingAverageTrendSignals",
  "setMultiChartLayout",
  "setMultiChartSync",
  "setPrefilledAlert",
  "setPriceVsEmaMetric",
  "setPriceVsEmaMetrics",
  "setPriceVsSmaMetric",
  "setPriceVsSmaMetrics",
  "setPublishing",
  "setReplayActive",
  "setReplayPaused",
  "setReplaySpeed",
  "setSearchMode",
  "setSelectedPseudo",
  "setSymbol",
  "setTimeRange",
  "setTimeframe",
  "setZenMode",
  "toggleAdvancedIndicator",
  "toggleAreDrawingsHidden",
  "toggleChartType",
  "toggleLockedAll",
  "toggleZenMode",
  "updateAlert",
  "updateLayoutChart",
  "updateMarketData",
  "updateMarketSnapshot",
  "updateOrder",
].sort();

test("slice action names and type strings remain stable after reducer extraction", () => {
  assert.deepEqual(Object.keys(technicalAnalysisSlice.actions).sort(), expectedActionNames);

  expectedActionNames.forEach((actionName) => {
    assert.equal(
      technicalAnalysisSlice.actions[actionName].type,
      `technicalAnalysis/${actionName}`,
    );
  });
});
