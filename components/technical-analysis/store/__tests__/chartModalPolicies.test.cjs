/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("./testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  applyMultiChartPreset,
  closeAllModals,
  commitLayoutChartAppearance,
  hydrateMultiChartLayout,
  setChartConfig,
  setChartType,
  setChartAppearance,
  setChartAppearancePreview,
  setTimeRange,
  setModalOpen,
  setMultiChartLayout,
  setActiveLayoutChart,
  setActiveMarket,
  setMultiChartSync,
  setSymbol,
  setTimeframe,
  swapLayoutCharts,
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

test("setSymbol and setChartConfig update only the active multi-chart cell when symbol sync is disabled", () => {
  const makeState = () => {
    let state = technicalAnalysisSlice.reducer(
      createReducerState(),
      setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "BOA_NG", market: "BRVM" }),
    );
    state = technicalAnalysisSlice.reducer(
      state,
      updateLayoutChart({ chartId: "chart_2", symbol: "BOA_BJ", exchange: "BRVM" }),
    );
    return technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));
  };

  const viaSymbolAction = technicalAnalysisSlice.reducer(makeState(), setSymbol(" snts "));
  const viaChartConfigPatch = technicalAnalysisSlice.reducer(makeState(), setChartConfig({ symbol: " snts " }));

  assert.equal(viaSymbolAction.chartConfig.symbol, "SNTS");
  assert.equal(viaChartConfigPatch.chartConfig.symbol, "SNTS");
  assert.deepEqual(layoutSymbols(viaChartConfigPatch), layoutSymbols(viaSymbolAction));
  assert.equal(viaSymbolAction.ui.multiChartLayout.activeChartId, "chart_2");
  assert.equal(viaSymbolAction.ui.multiChartLayout.charts[1].isActive, true);
  assert.deepEqual(layoutSymbols(viaSymbolAction), ["BOA_NG", "SNTS"]);
});

test("entering multi-chart never inherits the single-chart SMA default", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "BOA_BJ";
  state.chartConfig.indicators.sma = true;
  state.chartConfig.indicators.volume = true;
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("single", "BOA_BJ", [], "BRVM");

  const next = technicalAnalysisSlice.reducer(
    state,
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "BOA_BJ", market: "BRVM" }),
  );
  const active = next.ui.multiChartLayout.charts.find(
    (chart) => chart.chartId === next.ui.multiChartLayout.activeChartId,
  );

  assert.ok(active);
  assert.equal(active.indicators.includes("sma"), false);
  assert.equal(active.indicators.includes("volume"), true);
  assert.equal(active.indicatorState?.chart?.sma, false);
  assert.equal(next.chartConfig.indicators.sma, false);
  assert.equal(next.chartConfig.indicators.volume, true);
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
  let state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  state.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("two_horizontal", "ORANGE_CI");

  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: " mtnng ", exchange: " ngx " }),
  );
  const next = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));

  assert.equal(next.ui.multiChartLayout.charts[0].symbol, "ORANGE_CI");
  assert.equal(next.ui.multiChartLayout.charts[0].exchange, "BRVM");
  assert.equal(next.ui.multiChartLayout.charts[1].symbol, "MTNNG");
  assert.equal(next.ui.multiChartLayout.charts[1].exchange, "NGX");
  assert.equal(next.chartConfig.symbol, "MTNNG");
});

test("hydration preserves a panel intentionally moved away from the first physical slot", () => {
  const initial = createReducerState();
  initial.chartConfig.symbol = "ORANGE_CI";
  initial.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("four_grid", "ORANGE_CI");

  const movedState = technicalAnalysisSlice.reducer(
    initial,
    swapLayoutCharts({ sourceChartId: "chart_1", targetChartId: "chart_4" }),
  );
  const persistedMovedLayout = structuredClone(movedState.ui.multiChartLayout);
  assert.equal(persistedMovedLayout.charts[0].symbol, "");
  assert.equal(persistedMovedLayout.charts[3].symbol, "ORANGE_CI");
  assert.equal(persistedMovedLayout.activeChartId, "chart_4");

  const fresh = createReducerState();
  fresh.chartConfig.symbol = "ORANGE_CI";
  const hydrated = technicalAnalysisSlice.reducer(fresh, hydrateMultiChartLayout(persistedMovedLayout));

  assert.equal(hydrated.ui.multiChartLayout.charts[0].symbol, "");
  assert.equal(hydrated.ui.multiChartLayout.charts[3].symbol, "ORANGE_CI");
  assert.equal(hydrated.ui.multiChartLayout.activeChartId, "chart_4");
  assert.equal(hydrated.ui.multiChartLayout.charts[3].isActive, true);
  assert.equal(hydrated.chartConfig.symbol, "ORANGE_CI");
});

test("dense hydration preserves a relocated active panel while keeping symbol sync disabled", () => {
  const initial = createReducerState();
  initial.chartConfig.symbol = "ORANGE_CI";
  initial.ui.multiChartLayout = createDefaultBrvmMultiChartLayout("eight_grid", "ORANGE_CI");
  const movedState = technicalAnalysisSlice.reducer(
    initial,
    swapLayoutCharts({ sourceChartId: "chart_1", targetChartId: "chart_8" }),
  );
  const persistedMovedLayout = structuredClone(movedState.ui.multiChartLayout);
  persistedMovedLayout.sync.symbol = true;

  const fresh = createReducerState();
  fresh.chartConfig.symbol = "ORANGE_CI";
  const hydrated = technicalAnalysisSlice.reducer(fresh, hydrateMultiChartLayout(persistedMovedLayout));

  assert.equal(hydrated.ui.multiChartLayout.charts[0].symbol, "");
  assert.equal(hydrated.ui.multiChartLayout.charts[7].symbol, "ORANGE_CI");
  assert.equal(hydrated.ui.multiChartLayout.activeChartId, "chart_8");
  assert.equal(hydrated.ui.multiChartLayout.charts[7].isActive, true);
  assert.equal(hydrated.ui.multiChartLayout.sync.symbol, false);
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

test("multi-timeframe preset is renderable through native-first 1D plus weekly/monthly fallback", () => {
  const state = createReducerState();
  state.chartConfig.symbol = "ORANGE_CI";
  const next = technicalAnalysisSlice.reducer(state, applyMultiChartPreset("multi_timeframe"));
  assert.equal(next.ui.multiChartLayout.layoutId, "three_focus_right");
  assert.deepEqual(next.ui.multiChartLayout.charts.map((chart) => chart.interval), ["1D", "1W", "1M"]);
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

test("activating a panel restores its timeframe, type, date range and supported indicators", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({
      chartId: "chart_2",
      symbol: "MTNNG",
      exchange: "NGX",
      timeframe: "1W",
      chartType: "line",
      dateRange: "3M",
      indicators: ["sma"],
    }),
  );

  const next = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));

  assert.equal(next.chartConfig.symbol, "MTNNG");
  assert.equal(next.chartConfig.timeframe, "1W");
  assert.equal(next.chartConfig.chartType, "line");
  assert.equal(next.ui.selectedTimeRange, "3M");
  assert.equal(next.chartConfig.indicators.sma, true);
  assert.equal(next.chartConfig.indicators.volume, false);
  assert.equal(next.chartAppearance.showVolume, true);
});

test("Volume output appearance cannot reattach a removed study", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(state, setChartType("line"));
  state = technicalAnalysisSlice.reducer(state, setChartConfig({ indicators: { sma: true, volume: false } }));
  state = technicalAnalysisSlice.reducer(state, setChartAppearance({ showVolume: true }));

  const active = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === state.ui.multiChartLayout.activeChartId);
  assert.equal(active.chartType, "line");
  assert.equal(active.indicators.includes("sma"), true);
  assert.equal(active.indicators.includes("volume"), false);
  assert.equal(state.chartConfig.indicators.volume, false);
  assert.equal(state.chartAppearance.showVolume, true);
});

test("Volume Hide is panel-local and preserves attachment plus Style output", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: "MTNNG", exchange: "NGX" }),
  );

  const firstId = state.ui.multiChartLayout.activeChartId;
  state = technicalAnalysisSlice.reducer(state, setChartConfig({
    indicators: { ...state.chartConfig.indicators, volume: true, volumeVisible: false },
  }));

  const firstHidden = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === firstId);
  assert.equal(firstHidden.indicatorState.chart.volume, true);
  assert.equal(firstHidden.indicatorState.chart.volumeVisible, false);
  assert.equal(state.chartAppearance.showVolume, true);

  state = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));
  assert.equal(state.chartConfig.indicators.volumeVisible, true);
  assert.equal(state.chartConfig.indicators.volume, true);

  state = technicalAnalysisSlice.reducer(state, setActiveLayoutChart(firstId));
  assert.equal(state.chartConfig.indicators.volumeVisible, false);
  assert.equal(state.chartConfig.indicators.volume, true);
  assert.equal(state.chartAppearance.showVolume, true);
});

test("chart appearance preview is ephemeral and never mutates durable appearance", () => {
  const before = createReducerState();
  const durableVerticalGrid = before.chartAppearance.verticalGridLines;
  const previewAppearance = {
    ...structuredClone(before.chartAppearance),
    verticalGridLines: !durableVerticalGrid,
    backgroundMode: "gradient",
    backgroundGradientTopColor: "#112233",
    backgroundGradientBottomColor: "#445566",
  };

  const next = technicalAnalysisSlice.reducer(
    before,
    setChartAppearancePreview({ chartId: null, appearance: previewAppearance }),
  );

  assert.equal(next.ui.chartAppearancePreview.chartId, null);
  assert.equal(next.ui.chartAppearancePreview.appearance.verticalGridLines, !durableVerticalGrid);
  assert.equal(next.chartAppearance.verticalGridLines, durableVerticalGrid);
  assert.equal(next.chartAppearance.backgroundMode, "solid");
});

test("multi-chart appearance commit is panel-local and follows the active panel", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: "MTNNG", exchange: "NGX" }),
  );

  const baseline = structuredClone(state.chartAppearance);
  const customized = {
    ...baseline,
    verticalGridLines: false,
    horizontalGridLines: true,
    verticalGridLineStyle: "dotted",
    verticalGridLineColor: "#123456",
    verticalGridLineOpacity: 0.35,
    backgroundMode: "gradient",
    backgroundGradientTopColor: "#112233",
    backgroundGradientBottomColor: "#445566",
    showVolume: false,
  };

  state = technicalAnalysisSlice.reducer(
    state,
    commitLayoutChartAppearance({ chartId: "chart_1", appearance: customized }),
  );

  const chart1 = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === "chart_1");
  const chart2 = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === "chart_2");
  assert.equal(chart1.appearance.verticalGridLines, false);
  assert.equal(chart1.appearance.backgroundMode, "gradient");
  assert.equal(chart1.appearance.verticalGridLineOpacity, 0.35);
  assert.equal(chart1.appearance.showVolume, false);
  assert.equal(chart1.indicators.includes("volume"), true);
  assert.equal(chart2.appearance.verticalGridLines, baseline.verticalGridLines);
  assert.equal(chart2.appearance.backgroundMode, baseline.backgroundMode);
  assert.equal(chart2.appearance.showVolume, baseline.showVolume);
  assert.equal(state.chartAppearance.verticalGridLines, false);
  assert.equal(state.chartAppearance.showVolume, false);
  assert.equal(state.chartConfig.indicators.volume, true);

  state = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));
  assert.equal(state.chartAppearance.verticalGridLines, baseline.verticalGridLines);
  assert.equal(state.chartAppearance.backgroundMode, baseline.backgroundMode);
});

test("single-chart appearance commit survives persisted layout hydration", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "single", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  const customized = {
    ...structuredClone(state.chartAppearance),
    verticalGridLines: false,
    horizontalGridLines: true,
    backgroundMode: "gradient",
    backgroundGradientTopColor: "#112233",
    backgroundGradientBottomColor: "#445566",
  };

  state = technicalAnalysisSlice.reducer(
    state,
    commitLayoutChartAppearance({ chartId: "chart_1", appearance: customized }),
  );
  const persistedLayout = structuredClone(state.ui.multiChartLayout);

  assert.equal(persistedLayout.charts[0].appearance.verticalGridLines, false);
  assert.equal(persistedLayout.charts[0].appearance.backgroundMode, "gradient");

  const fresh = createReducerState();
  fresh.chartConfig.symbol = "ORANGE_CI";
  fresh.ui.activeMarket.ticker = "BRVM";
  const hydrated = technicalAnalysisSlice.reducer(fresh, hydrateMultiChartLayout(persistedLayout));

  assert.equal(hydrated.chartAppearance.verticalGridLines, false);
  assert.equal(hydrated.chartAppearance.horizontalGridLines, true);
  assert.equal(hydrated.chartAppearance.backgroundMode, "gradient");
  assert.equal(hydrated.ui.multiChartLayout.charts[0].appearance.verticalGridLines, false);
});

test("chart appearance settings modal fields persist through setChartAppearance", () => {
  const state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setChartAppearance({
      verticalGridLines: false,
      horizontalGridLines: true,
      verticalGridLineStyle: "dotted",
      horizontalGridLineStyle: "solid",
      gridLineColor: "#445566",
      verticalGridLineColor: "#123456",
      horizontalGridLineColor: "#654321",
      verticalGridLineOpacity: 0.25,
      horizontalGridLineOpacity: 0.75,
      backgroundMode: "gradient",
      backgroundGradientTopColor: "#111827",
      backgroundGradientBottomColor: "#0f172a",
      crosshairColor: "#778899",
      watermarkMode: "symbol",
      watermarkColor: "#112233",
      scaleTextColor: "#abcdef",
      scaleTextSize: 14,
      scaleLineColor: "#fedcba",
      marginTopPercent: 18,
      marginBottomPercent: 11,
      rightOffsetBars: 24,
    }),
  );

  assert.equal(state.chartAppearance.verticalGridLines, false);
  assert.equal(state.chartAppearance.horizontalGridLines, true);
  assert.equal(state.chartAppearance.verticalGridLineStyle, "dotted");
  assert.equal(state.chartAppearance.horizontalGridLineStyle, "solid");
  assert.equal(state.chartAppearance.gridLineColor, "#445566");
  assert.equal(state.chartAppearance.verticalGridLineColor, "#123456");
  assert.equal(state.chartAppearance.horizontalGridLineColor, "#654321");
  assert.equal(state.chartAppearance.verticalGridLineOpacity, 0.25);
  assert.equal(state.chartAppearance.horizontalGridLineOpacity, 0.75);
  assert.equal(state.chartAppearance.backgroundMode, "gradient");
  assert.equal(state.chartAppearance.backgroundGradientTopColor, "#111827");
  assert.equal(state.chartAppearance.backgroundGradientBottomColor, "#0f172a");
  assert.equal(state.chartAppearance.crosshairColor, "#778899");
  assert.equal(state.chartAppearance.watermarkMode, "symbol");
  assert.equal(state.chartAppearance.watermarkColor, "#112233");
  assert.equal(state.chartAppearance.scaleTextColor, "#abcdef");
  assert.equal(state.chartAppearance.scaleTextSize, 14);
  assert.equal(state.chartAppearance.scaleLineColor, "#fedcba");
  assert.equal(state.chartAppearance.marginTopPercent, 18);
  assert.equal(state.chartAppearance.marginBottomPercent, 11);
  assert.equal(state.chartAppearance.rightOffsetBars, 24);
});

test("date range remains panel-local until date-range synchronization is enabled", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: "MTNNG", exchange: "NGX" }),
  );
  state = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));
  state = technicalAnalysisSlice.reducer(state, setTimeRange("3M"));

  assert.deepEqual(state.ui.multiChartLayout.charts.map((chart) => chart.dateRange), ["Tout", "3M"]);

  state = technicalAnalysisSlice.reducer(state, setMultiChartSync({ key: "dateRange", value: true }));
  state = technicalAnalysisSlice.reducer(state, setTimeRange("1Y"));
  assert.deepEqual(state.ui.multiChartLayout.charts.map((chart) => chart.dateRange), ["1Y", "1Y"]);
});

test("viewport updates are copied into the targeted panel without sharing the action payload object", () => {
  const state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  const viewport = {
    startTime: "2026-01-02T00:00:00Z",
    endTime: "2026-04-30T00:00:00Z",
    yScale: 1.25,
    isYManual: true,
  };
  const next = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_1", viewport }),
  );
  viewport.yScale = 9;

  assert.deepEqual(next.ui.multiChartLayout.charts[0].viewport, {
    startTime: "2026-01-02T00:00:00Z",
    endTime: "2026-04-30T00:00:00Z",
    yScale: 1.25,
    isYManual: true,
  });
});

test("canonical timeframe writes both legacy interval and v2 timeframe", () => {
  const next = technicalAnalysisSlice.reducer(createActiveThirdChartState(false), setTimeframe("1H"));
  const active = next.ui.multiChartLayout.charts.find((chart) => chart.chartId === "chart_3");
  assert.equal(active.interval, "1H");
  assert.equal(active.timeframe, "1H");
});

test("selecting a new equity symbol clears stale index identity on the targeted active cell only", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({ chartId: "chart_2", symbol: "BOA_BJ", exchange: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({
      chartId: "chart_2",
      symbol: "MASI",
      exchange: "CSE",
      sourceKind: "index",
      sourceId: "index-masi",
      chartType: "line",
    }),
  );
  state = technicalAnalysisSlice.reducer(state, setActiveLayoutChart("chart_2"));
  const next = technicalAnalysisSlice.reducer(state, setSymbol("BCP"));
  const primary = next.ui.multiChartLayout.charts[0];
  const active = next.ui.multiChartLayout.charts[1];

  assert.equal(primary.symbol, "ORANGE_CI");
  assert.equal(active.symbol, "BCP");
  assert.equal(active.sourceKind, "equity");
  assert.equal(active.sourceId, "");
  assert.equal(next.ui.multiChartLayout.activeChartId, "chart_2");
});

test("an active index cannot be switched to candlesticks by the canonical chart-type control", () => {
  let state = technicalAnalysisSlice.reducer(
    createReducerState(),
    setMultiChartLayout({ layoutId: "two_horizontal", primarySymbol: "ORANGE_CI", market: "BRVM" }),
  );
  state = technicalAnalysisSlice.reducer(
    state,
    updateLayoutChart({
      chartId: "chart_1",
      symbol: "MASI",
      exchange: "CSE",
      sourceKind: "index",
      sourceId: "index-masi",
      chartType: "line",
    }),
  );
  const next = technicalAnalysisSlice.reducer(state, setChartType("candles"));

  assert.equal(next.chartConfig.chartType, "line");
  assert.equal(next.ui.multiChartLayout.charts[0].chartType, "line");
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
