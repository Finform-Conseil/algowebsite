/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  applyMultiChartPreset,
  closeAllModals,
  setChartConfig,
  setModalOpen,
  setSymbol,
  setTimeframe,
} = require("../technicalAnalysisSlice.ts");
const { createDefaultBrvmMultiChartLayout } = require("../../config/layout/brvmLayoutSymbols.ts");

const createReducerState = () => structuredClone(technicalAnalysisSlice.getInitialState());

const layoutIntervals = (state) =>
  state.ui.multiChartLayout.charts.map((chart) => chart.interval);

const layoutSymbols = (state) =>
  state.ui.multiChartLayout.charts.map((chart) => chart.symbol);

const createActiveThirdChartState = (syncInterval = false) => {
  const state = createReducerState();
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("four_grid", "BOAB");
  state.ui.multiChartLayout.sync.interval = syncInterval;
  state.ui.multiChartLayout.activeChartId = "chart_3";
  state.ui.multiChartLayout.charts = state.ui.multiChartLayout.charts.map((chart, index) => ({
    ...chart,
    interval: ["1D", "1W", "1M", "3M"][index],
    isActive: chart.chartId === "chart_3",
  }));
  return state;
};

const createSectorPresetState = () =>
  technicalAnalysisSlice.reducer(createReducerState(), applyMultiChartPreset("sector_compare"));

const getOpenModals = (state) =>
  Object.entries(state.ui.modals)
    .filter(([, isOpen]) => isOpen)
    .map(([modal]) => modal);

test("setTimeframe and setChartConfig propagate active-chart interval equivalently", () => {
  const viaTimeframeAction = technicalAnalysisSlice.reducer(
    createActiveThirdChartState(false),
    setTimeframe("1H"),
  );
  const viaChartConfigPatch = technicalAnalysisSlice.reducer(
    createActiveThirdChartState(false),
    setChartConfig({ timeframe: "1H" }),
  );

  assert.equal(viaTimeframeAction.chartConfig.timeframe, "1H");
  assert.equal(viaChartConfigPatch.chartConfig.timeframe, "1H");
  assert.deepEqual(layoutIntervals(viaTimeframeAction), ["1D", "1W", "1H", "3M"]);
  assert.deepEqual(layoutIntervals(viaChartConfigPatch), layoutIntervals(viaTimeframeAction));
});

test("setTimeframe and setChartConfig propagate synced intervals equivalently", () => {
  const viaTimeframeAction = technicalAnalysisSlice.reducer(
    createActiveThirdChartState(true),
    setTimeframe("4H"),
  );
  const viaChartConfigPatch = technicalAnalysisSlice.reducer(
    createActiveThirdChartState(true),
    setChartConfig({ timeframe: "4H" }),
  );

  assert.deepEqual(layoutIntervals(viaTimeframeAction), ["4H", "4H", "4H", "4H"]);
  assert.deepEqual(layoutIntervals(viaChartConfigPatch), layoutIntervals(viaTimeframeAction));
});

test("setSymbol and setChartConfig normalize symbol and recalculate sector peers equivalently", () => {
  const viaSymbolAction = technicalAnalysisSlice.reducer(
    createSectorPresetState(),
    setSymbol(" snts "),
  );
  const viaChartConfigPatch = technicalAnalysisSlice.reducer(
    createSectorPresetState(),
    setChartConfig({ symbol: " snts " }),
  );

  assert.equal(viaSymbolAction.chartConfig.symbol, "SNTS");
  assert.equal(viaChartConfigPatch.chartConfig.symbol, "SNTS");
  assert.deepEqual(layoutSymbols(viaChartConfigPatch), layoutSymbols(viaSymbolAction));
  assert.equal(viaSymbolAction.ui.multiChartLayout.activeChartId, "chart_1");
  assert.equal(viaSymbolAction.ui.multiChartLayout.charts[0].isActive, true);
  assert.equal(viaSymbolAction.ui.multiChartLayout.charts.at(-1).symbol, "BRVMC");
});

test("opening a modal closes every other modal flag", () => {
  const searchOpen = technicalAnalysisSlice.reducer(
    createReducerState(),
    setModalOpen({ modal: "search", isOpen: true }),
  );
  const indicatorsOpen = technicalAnalysisSlice.reducer(
    searchOpen,
    setModalOpen({ modal: "indicators", isOpen: true }),
  );

  assert.deepEqual(getOpenModals(indicatorsOpen), ["indicators"]);
});

test("closing one modal and closeAllModals do not reopen unrelated modals", () => {
  const templatesOpen = technicalAnalysisSlice.reducer(
    createReducerState(),
    setModalOpen({ modal: "templates", isOpen: true }),
  );
  const templatesClosed = technicalAnalysisSlice.reducer(
    templatesOpen,
    setModalOpen({ modal: "templates", isOpen: false }),
  );
  const allClosed = technicalAnalysisSlice.reducer(
    templatesOpen,
    closeAllModals(),
  );

  assert.deepEqual(getOpenModals(templatesClosed), []);
  assert.deepEqual(getOpenModals(allClosed), []);
});
