/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const projectRoot = path.resolve(__dirname, "../../../..");
const resolveProjectModule = (request) => {
  const basePath = request.startsWith("@/")
    ? path.join(projectRoot, request.slice(2))
    : request;

  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    `${basePath}.json`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
};

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function resolveFilename(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    const resolved = resolveProjectModule(request);
    if (resolved) return resolved;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const transpileTypeScript = (filename) => {
  const source = fs.readFileSync(filename, "utf8");
  return ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  }).outputText;
};

require.extensions[".ts"] = require.extensions[".tsx"] = function loadTypeScript(module, filename) {
  module._compile(transpileTypeScript(filename), filename);
};

const compareSeries = require("../compare-series/compareSeries.ts");
const movingAverageSeries = require("../indicators/movingAverageSeries.ts");
const advancedMovingAverageSeries = require("../indicators/advancedMovingAverageSeries.ts");
const priceVsSmaMetrics = require("../indicators/priceVsSmaMetrics.ts");
const priceVsEmaMetrics = require("../indicators/priceVsEmaMetrics.ts");
const indicatorObjectVisibility = require("../object-tree/indicatorObjectVisibility.ts");
const drawingConstants = require("../drawing/drawingConstants.ts");
const drawingToolSpecs = require("../drawing/drawingToolSpecs.ts");
const fibDefaults = require("../drawing/fibDefaults.ts");
const pureMultiChartLayouts = require("../layout/multiChartLayouts.ts");
const brvmLayoutSymbols = require("../layout/brvmLayoutSymbols.ts");

const createAdvancedMaState = (overrides = {}) => ({
  activeWma: [],
  activeDema: [],
  activeTema: [],
  activeHma: [],
  activeZlema: [],
  activeAlma: [],
  activeSmma: [],
  activeKama: [],
  activeVwma: [],
  ...overrides,
});

test("root config directory has no zombie compatibility modules", () => {
  const removedRootModules = [
    "index.ts",
    "TechnicalAnalysisTypes.ts",
    "TechnicalAnalysisConstants.ts",
    "DrawingToolsConfig.tsx",
    "multiChartLayout.ts",
    "movingAverageSeries.ts",
    "advancedMovingAverageSeries.ts",
    "priceVsSmaMetrics.ts",
    "priceVsEmaMetrics.ts",
    "candlestickPatternPresentation.ts",
    "compareSeries.ts",
    "indicatorObjectVisibility.ts",
    "anonymousPseudos.ts",
  ];

  removedRootModules.forEach((relativePath) => {
    assert.equal(fs.existsSync(path.join(__dirname, "..", relativePath)), false, `${relativePath} must stay deleted`);
  });

  assert.equal(fs.existsSync(path.join(__dirname, "..", "compare-series/compareSeries.ts")), true);
  assert.equal(fs.existsSync(path.join(__dirname, "..", "object-tree/indicatorObjectVisibility.ts")), true);
  assert.equal(fs.existsSync(path.join(__dirname, "..", "ui/anonymousPseudos.ts")), true);
});

test("compareSeries normalizes symbols, ids, colors, settings, and timeframe visibility", () => {
  assert.equal(compareSeries.normalizeCompareSymbol("  boab "), "BOAB");
  assert.equal(compareSeries.getCompareSeriesId(" sgbc "), "compare-SGBC");
  assert.equal(compareSeries.getCompareSeriesColor(0), "#00C853");
  assert.equal(compareSeries.getCompareSeriesColor(5), "#00C853");
  assert.equal(compareSeries.getCompareSeriesColor(-1), "#7C4DFF");

  const settings = compareSeries.normalizeCompareSeriesSettings(
    {
      priceSource: "invalid",
      color: " ",
      lineStyle: "invalid",
      lineWidth: 99,
      showPriceLine: true,
      overrideMinTick: "auto",
      visibility: {
        minutes: { enabled: false, min: 30, max: 5 },
      },
    },
    "#123456",
  );

  assert.equal(settings.priceSource, "close");
  assert.equal(settings.color, "#123456");
  assert.equal(settings.lineStyle, "solid");
  assert.equal(settings.lineWidth, 6);
  assert.equal(settings.showPriceLine, true);
  assert.equal(settings.overrideMinTick, "auto");
  assert.deepEqual(settings.visibility.minutes, { enabled: false, min: 5, max: 30 });
  assert.deepEqual(compareSeries.getCompareVisibilityKeyForTimeframe("15m"), { key: "minutes", value: 15 });
  assert.deepEqual(compareSeries.getCompareVisibilityKeyForTimeframe("3M"), { key: "months", value: 3 });
  assert.equal(compareSeries.isCompareSeriesVisibleForTimeframe(settings, "15m"), false);
});

test("movingAverageSeries normalizes periods and preserves SMA/EMA definitions", () => {
  const indicatorPeriods = { sma1: 20, sma2: 50, sma3: 200, rsiPeriod: 14 };

  assert.deepEqual(
    movingAverageSeries.normalizeMovingAveragePeriods([20, "10", 0, -5, 20, 50.9, Number.NaN]),
    [10, 20, 50],
  );
  assert.deepEqual(movingAverageSeries.mergeMovingAveragePeriods([20, 10], "bad", [10, 5]), [5, 10, 20]);

  const smaDefinitions = movingAverageSeries.buildSmaSeriesDefinitions(indicatorPeriods, [50, 20, 999]);
  assert.deepEqual(
    smaDefinitions.map((definition) => [definition.id, definition.dataKey, definition.label, definition.color]),
    [
      ["sma-20", "sma_20", "SMA 20", "#45c3a1"],
      ["sma-50", "sma_50", "SMA 50", "#f06467"],
      ["sma-999", "sma_999", "SMA 999", "#FF9F04"],
    ],
  );

  const emaDefinitions = movingAverageSeries.buildEmaSeriesDefinitions([20, 9]);
  assert.deepEqual(
    emaDefinitions.map((definition) => [definition.id, definition.dataKey, definition.color]),
    [
      ["ema-9", "ema_9", "#c026d3"],
      ["ema-20", "ema_20", "#fb7185"],
    ],
  );

  const trendSignals = movingAverageSeries.normalizeMovingAverageTrendSignals({
    active: {
      is_above_ema20: true,
      is_above_sma50: "yes",
      is_above_sma200: true,
    },
    showSourceAverages: true,
  });

  assert.deepEqual(trendSignals.active, {
    is_above_ema20: true,
    is_above_sma50: false,
    is_above_sma200: true,
  });
  assert.deepEqual(
    movingAverageSeries.resolveTrendSignalSourceAveragePeriods(trendSignals),
    { sma: [200], ema: [20] },
  );
});

test("advancedMovingAverageSeries emits active definitions and toggles families idempotently", () => {
  const state = createAdvancedMaState({
    activeWma: [20, 20, 50],
    activeDema: [50],
    activeVwma: [20],
  });

  const definitions = advancedMovingAverageSeries.buildAdvancedMovingAverageSeriesDefinitions(state);
  assert.deepEqual(
    definitions.map((definition) => [definition.id, definition.seriesId, definition.dataKey]),
    [
      ["wma_20", "wma-20", "wma_20"],
      ["wma_50", "wma-50", "wma_50"],
      ["dema_50", "dema-50", "dema_50"],
      ["vwma_20", "vwma-20", "vwma_20"],
    ],
  );

  assert.equal(advancedMovingAverageSeries.isAdvancedMovingAverageActive(state, "wma_20"), true);
  assert.equal(advancedMovingAverageSeries.isAdvancedMovingAverageActive(state, "tema_20"), false);

  const withTema = advancedMovingAverageSeries.toggleAdvancedMovingAverage(state, "tema_20", true);
  assert.deepEqual(withTema.activeTema, [20]);
  assert.deepEqual(withTema.activeWma, [20, 20, 50]);

  const withoutWma = advancedMovingAverageSeries.toggleAdvancedMovingAverage(withTema, "wma_20", false);
  assert.deepEqual(withoutWma.activeWma, [50]);
  assert.throws(
    () => advancedMovingAverageSeries.getAdvancedMovingAverageSpecById("unknown_20"),
    /Unknown advanced moving average id: unknown_20/,
  );
});

test("price-vs-average metrics normalize active flags and resolve source periods", () => {
  const smaMetrics = priceVsSmaMetrics.normalizePriceVsSmaMetrics({
    active: {
      price_vs_sma20_pct: true,
      price_vs_sma50_pct: "true",
      price_vs_sma150_pct: true,
    },
  });

  assert.deepEqual(smaMetrics.active, {
    price_vs_sma20_pct: true,
    price_vs_sma50_pct: false,
    price_vs_sma150_pct: true,
    price_vs_sma200_pct: false,
  });
  assert.deepEqual(priceVsSmaMetrics.resolvePriceVsSmaSourceAveragePeriods(smaMetrics), [20, 150]);

  const emaMetrics = priceVsEmaMetrics.normalizePriceVsEmaMetrics({
    active: {
      price_vs_ema20_pct: true,
      price_vs_ema50_pct: false,
      price_vs_ema200_pct: true,
    },
  });

  assert.deepEqual(emaMetrics.active, {
    price_vs_ema20_pct: true,
    price_vs_ema50_pct: false,
    price_vs_ema200_pct: true,
  });
  assert.deepEqual(priceVsEmaMetrics.resolvePriceVsEmaSourceAveragePeriods(emaMetrics), [20, 200]);
});

test("indicatorObjectVisibility resolves aliases and preserves hidden-state identity when unchanged", () => {
  assert.deepEqual(
    indicatorObjectVisibility.getAdvancedIndicatorObjectIds("pivotPointsFibonacci"),
    [
      "pivotPointsFibonacci",
      "pivot-fib-p",
      "pivot-fib-r1",
      "pivot-fib-r2",
      "pivot-fib-r3",
      "pivot-fib-s1",
      "pivot-fib-s2",
      "pivot-fib-s3",
    ],
  );
  assert.deepEqual(indicatorObjectVisibility.getAdvancedIndicatorObjectIds("cci"), ["cci", "cci20"]);
  assert.deepEqual(indicatorObjectVisibility.getAdvancedIndicatorObjectIds("cci20"), ["cci20", "cci"]);
  assert.deepEqual(indicatorObjectVisibility.getSmaObjectIds(50), ["sma-50"]);
  assert.deepEqual(indicatorObjectVisibility.getEmaObjectIds(20), ["ema-20"]);
  assert.deepEqual(indicatorObjectVisibility.getAdvancedMovingAverageObjectIds("wma", 20), ["wma-20"]);

  const hiddenObjectIds = { cci: true, cci20: true, untouched: true };
  assert.deepEqual(
    indicatorObjectVisibility.revealHiddenObjectIds(hiddenObjectIds, ["cci", "cci20"]),
    { untouched: true },
  );
  assert.equal(
    indicatorObjectVisibility.revealHiddenObjectIds(hiddenObjectIds, ["missing-id"]),
    hiddenObjectIds,
  );
});

test("drawing config exposes pure specs and drawing constants without icon coupling", () => {
  const lineTool = drawingToolSpecs.DRAWING_TOOL_SPECS.find((tool) => tool.id === "line");
  const fibTool = drawingToolSpecs.DRAWING_TOOL_SPECS.find((tool) => tool.id === "fib_retracement");

  assert.equal(lineTool.category, drawingConstants.TOOL_CATEGORIES.LINES_MEASURES);
  assert.equal(fibTool.category, drawingConstants.TOOL_CATEGORIES.FIBONACCI);
  assert.equal(Object.hasOwn(lineTool, "icon"), false);
  assert.equal(drawingConstants.FIB_TOOLS_SET.has("fib_retracement"), true);
  assert.equal(fibDefaults.DEFAULT_FIB_WEDGE_LEVELS.length, 7);
});


test("multiChartLayout preserves layout counts, dense sync behavior, and preset symbols", () => {
  assert.equal(pureMultiChartLayouts.getLayoutDefinition("four_grid").chartCount, 4);
  assert.equal(pureMultiChartLayouts.getLayoutDefinition("unknown_layout").id, "single");
  assert.equal(pureMultiChartLayouts.normalizeLayoutSymbol(" boab "), "BOAB");
  assert.equal(pureMultiChartLayouts.isDenseMultiChartLayout("eight_grid"), true);
  assert.equal(pureMultiChartLayouts.isDenseMultiChartLayout("four_grid"), false);

  const pureFourGrid = pureMultiChartLayouts.createDefaultMultiChartLayout("four_grid", "BOAB", ["SGBC"]);
  assert.deepEqual(
    pureFourGrid.charts.map((chart) => chart.symbol),
    ["BOAB", "SGBC", "BOAB", "BOAB"],
  );
  assert.deepEqual(brvmLayoutSymbols.BRVM_LAYOUT_SYMBOL_FALLBACKS.slice(0, 3), ["BRVMC", "SNTS", "BOAC"]);

  const defaultFourGrid = brvmLayoutSymbols.createDefaultBrvmMultiChartLayout("four_grid", "BOAB", ["SGBC"]);
  assert.equal(defaultFourGrid.isEnabled, true);
  assert.equal(defaultFourGrid.activeChartId, "chart_1");
  assert.deepEqual(
    defaultFourGrid.charts.map((chart) => [chart.chartId, chart.symbol, chart.interval, chart.isActive]),
    [
      ["chart_1", "BOAB", "1D", true],
      ["chart_2", "SGBC", "1D", false],
      ["chart_3", "BRVMC", "1D", false],
      ["chart_4", "SNTS", "1D", false],
    ],
  );

  const denseCurrent = {
    ...defaultFourGrid,
    layoutId: "six_grid",
    sync: { symbol: true, interval: true, crosshair: true, time: true, dateRange: true },
  };
  const reconciled = brvmLayoutSymbols.reconcileBrvmMultiChartLayout(denseCurrent, "eight_grid", "BOAB", ["SGBC"]);
  assert.equal(reconciled.charts.length, 8);
  assert.deepEqual(reconciled.sync, {
    symbol: false,
    interval: true,
    crosshair: false,
    time: true,
    dateRange: true,
  });

  const sectorPreset = pureMultiChartLayouts.MULTI_CHART_PRESETS.find((preset) => preset.id === "sector_compare");
  const sectorLayout = brvmLayoutSymbols.createPresetLayout(sectorPreset, "BOAB");
  assert.equal(sectorLayout.layoutId, "four_grid");
  assert.deepEqual(sectorLayout.charts.map((chart) => chart.symbol), ["BOAB", "NSBC", "ETIT", "BRVMC"]);

  const marketMonitorPreset = pureMultiChartLayouts.MULTI_CHART_PRESETS.find((preset) => preset.id === "market_monitor");
  const marketMonitor = brvmLayoutSymbols.createPresetLayout(marketMonitorPreset, "BOAB");
  assert.equal(marketMonitor.charts.length, 6);
  assert.deepEqual(marketMonitor.charts.map((chart) => chart.symbol), ["BRVMC", "ORAC", "NSBC", "CIEC", "NTLC", "SDCC"]);
});
