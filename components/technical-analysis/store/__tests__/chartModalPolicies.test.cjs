/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  applyMultiChartPreset,
  closeAllModals,
  hydrateMultiChartLayout,
  setChartConfig,
  setModalOpen,
  setMultiChartLayout,
  setActiveLayoutChart,
  setActiveMarket,
  setMultiChartSync,
  setSymbol,
  setTimeframe,
  updateLayoutChart,
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

test("setSymbol and setChartConfig normalize symbol without inventing secondary peers", () => {
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
  assert.deepEqual(layoutSymbols(viaSymbolAction), ["SNTS", "", "", ""]);
});

test("layout setup uses the visible ticker binding when Redux has not caught up yet", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "";

  const next = technicalAnalysisSlice.reducer(
    state,
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: " orange_ci ", market: " brvm " }),
  );

  assert.equal(next.ui.multiChartLayout.charts[0].symbol, "ORANGE_CI");
  assert.equal(next.ui.multiChartLayout.charts[0].exchange, "BRVM");
  assert.equal(next.ui.multiChartLayout.charts[1].symbol, "");
  assert.equal(next.ui.multiChartLayout.charts[1].exchange, "");
});

test("layout changes rebind the primary exchange instead of reviving the previous market", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI", [], "BRVM");

  const next = technicalAnalysisSlice.reducer(
    state,
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "BCP", market: "CSE" }),
  );

  assert.equal(next.ui.multiChartLayout.charts[0].symbol, "BCP");
  assert.equal(next.ui.multiChartLayout.charts[0].exchange, "CSE");
});

test("symbol sync propagates the active market binding with the ticker", () => {
  const state = createReducerState();
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI", [], "BRVM");
  state.ui.multiChartLayout.charts[1] = {
    ...state.ui.multiChartLayout.charts[1],
    symbol: "MTNNG",
    exchange: "NGX",
    isActive: true,
  };
  state.ui.multiChartLayout.charts[0].isActive = false;
  state.ui.multiChartLayout.activeChartId = "chart_2";

  const next = technicalAnalysisSlice.reducer(state, setMultiChartSync({ key: "symbol", value: true }));

  assert.deepEqual(next.ui.multiChartLayout.charts.map((chart) => chart.symbol), ["MTNNG", "MTNNG"]);
  assert.deepEqual(next.ui.multiChartLayout.charts.map((chart) => chart.exchange), ["NGX", "NGX"]);
});

test("a multi-chart cell keeps the exchange selected with its ticker", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI");
  state.ui.multiChartLayout.activeChartId = "chart_2";
  state.ui.multiChartLayout.charts = state.ui.multiChartLayout.charts.map((chart) => ({
    ...chart,
    isActive: chart.chartId === "chart_2",
  }));

  const next = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: " mtnng ", exchange: " ngx " }),
  );

  assert.equal(next.ui.multiChartLayout.charts[0].symbol, "ORANGE_CI");
  assert.equal(next.ui.multiChartLayout.charts[0].exchange, "BRVM");
  assert.equal(next.ui.multiChartLayout.charts[1].symbol, "MTNNG");
  assert.equal(next.ui.multiChartLayout.charts[1].exchange, "NGX");
  assert.equal(next.chartConfig.symbol, "MTNNG");
});

test("hydration preserves persisted sync preferences while enforcing dense-layout symbol safety", () => {
  const initial = createReducerState();
  initial.chartConfig.symbol = "ORANGE_CI";
  const persisted = createDefaultBrvmMultiChartLayout("four_grid", "ORANGE_CI");
  persisted.sync = { symbol: true, interval: true, crosshair: true, time: true, dateRange: true };

  const hydrated = technicalAnalysisSlice.reducer(initial, hydrateMultiChartLayout(persisted));
  assert.deepEqual(hydrated.ui.multiChartLayout.sync, persisted.sync);

  const densePersisted = createDefaultBrvmMultiChartLayout("eight_grid", "ORANGE_CI");
  densePersisted.sync = { symbol: true, interval: true, crosshair: true, time: true, dateRange: true };
  const denseHydrated = technicalAnalysisSlice.reducer(initial, hydrateMultiChartLayout(densePersisted));
  assert.equal(denseHydrated.ui.multiChartLayout.sync.symbol, false);
  assert.equal(denseHydrated.ui.multiChartLayout.sync.interval, true);
  assert.equal(denseHydrated.ui.multiChartLayout.sync.time, true);
});

test("unsupported multi-timeframe preset is rejected while API data is 1D-only", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  const next = technicalAnalysisSlice.reducer(state, applyMultiChartPreset("multi_timeframe"));
  assert.equal(next.ui.multiChartLayout.layoutId, "single");
});

test("hydration prioritizes the live primary title and clears the legacy BRVMC cell", () => {
  const initial = createReducerState();
  initial.chartConfig.symbol = "ORANGE_CI";
  const persisted = createDefaultBrvmMultiChartLayout("two_horizontal", "BOAB", ["BRVMC"]);

  const hydrated = technicalAnalysisSlice.reducer(initial, hydrateMultiChartLayout(persisted));

  assert.equal(hydrated.ui.multiChartLayout.charts[0].symbol, "ORANGE_CI");
  assert.equal(hydrated.ui.multiChartLayout.charts[1].symbol, "");
  assert.deepEqual(hydrated.ui.multiChartLayout.charts.map((chart) => chart.exchange), ["BRVM", ""]);
});

test("an unbound multi-chart slot cannot replace the canonical active chart", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI", [], "BRVM");

  const next = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));

  assert.equal(next.ui.multiChartLayout.activeChartId, "chart_1");
  assert.equal(next.ui.multiChartLayout.charts[0].isActive, true);
  assert.equal(next.ui.multiChartLayout.charts[1].isActive, false);
  assert.equal(next.chartConfig.symbol, "ORANGE_CI");
});

test("layout ticker binding never invents the workspace exchange when exchange is omitted", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.activeMarket.ticker = "BRVM";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI", [], "BRVM");

  const next = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: "BCP" }),
  );

  assert.equal(next.ui.multiChartLayout.charts[1].symbol, "BCP");
  assert.equal(next.ui.multiChartLayout.charts[1].exchange, "");
});

test("global market changes keep empty layout slots exchange-agnostic", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("four_grid", "ORANGE_CI", [], "BRVM");

  const next = technicalAnalysisSlice.reducer(
    state,
    setActiveMarket({ ticker: "NGX", name: "NGX", currency: "NGN" }),
  );

  assert.deepEqual(next.ui.multiChartLayout.charts.map((chart) => chart.symbol), ["", "", "", ""]);
  assert.deepEqual(next.ui.multiChartLayout.charts.map((chart) => chart.exchange), ["", "", "", ""]);
  assert.equal(next.ui.activeMarket.ticker, "NGX");
});

test("changing a bound layout symbol without an exchange clears the stale exchange", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI", ["SITAB_CI"], "BRVM");

  const next = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: "BCP" }),
  );

  assert.equal(next.ui.multiChartLayout.charts[1].symbol, "BCP");
  assert.equal(next.ui.multiChartLayout.charts[1].exchange, "");
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


test("hydration preserves a persisted primary exchange when the symbol is unchanged", () => {
  const initial = createReducerState();
  initial.chartConfig.symbol = "BCP";
  initial.ui.activeMarket.ticker = "BRVM";
  const persisted = createDefaultBrvmMultiChartLayout("two_horizontal", "BCP", [], "CSE");

  const hydrated = technicalAnalysisSlice.reducer(initial, hydrateMultiChartLayout(persisted));

  assert.equal(hydrated.ui.multiChartLayout.charts[0].symbol, "BCP");
  assert.equal(hydrated.ui.multiChartLayout.charts[0].exchange, "CSE");
});
