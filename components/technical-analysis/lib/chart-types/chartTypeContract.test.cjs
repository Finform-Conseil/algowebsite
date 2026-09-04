const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  module._compile(transpiled.outputText, filename);
};

const root = path.join(__dirname, "../../../..");
const {
  CHART_TYPE_MENU_ORDER,
  CHART_TYPE_REGISTRY,
} = require(path.join(__dirname, "registry/chartTypeRegistry.ts"));
const { buildChartTypeSeries } = require(path.join(__dirname, "renderers/buildChartTypeSeries.ts"));

const EXPECTED_ORDER = [
  "bars", "candles", "hollow_candles", "volume_candles",
  "line", "line_with_markers", "step_line", "area", "hlc_area", "baseline", "columns", "high_low",
  "volume_footprint", "time_price_opportunity", "session_volume_profile",
  "heikin_ashi", "renko", "line_break", "kagi", "point_and_figure", "range",
];

const palette = {
  upColor: "#00e676",
  downColor: "#ff1744",
  textColor: "#d9e2ef",
  liveColor: "#00e676",
};

const chartData = Array.from({ length: 240 }, (_unused, index) => {
  const trend = 100 + index * 0.08;
  const wave = Math.sin(index / 3) * 7 + Math.cos(index / 7) * 3;
  const center = trend + wave;
  const open = center + (index % 2 === 0 ? -1.8 : 1.6);
  const close = center + ((index % 5) - 2) * 1.25;
  return {
    time: new Date(Date.UTC(2025, 0, 1 + index)).toISOString(),
    open,
    high: Math.max(open, close) + 3.2,
    low: Math.min(open, close) - 3.1,
    close,
    volume: 10_000 + (index % 17) * 1_250 + index * 11,
  };
});

const baseDates = chartData.map((bar) => bar.time);
const sourceVolume = chartData.reduce((sum, bar) => sum + bar.volume, 0);
const buildPlan = (chartType) => buildChartTypeSeries({
  chartType,
  chartData,
  baseDates,
  displaySymbol: "CONTRACT",
  palette,
  latestPrice: chartData[chartData.length - 1].close,
  visible: true,
});

test("chart-type registry exposes exactly the 21 canonical entries in professional order", () => {
  assert.deepEqual([...CHART_TYPE_MENU_ORDER], EXPECTED_ORDER);
  assert.deepEqual(Object.keys(CHART_TYPE_REGISTRY).sort(), [...EXPECTED_ORDER].sort());
  assert.equal(new Set(CHART_TYPE_MENU_ORDER).size, 21);
  for (const chartType of EXPECTED_ORDER) {
    const entry = CHART_TYPE_REGISTRY[chartType];
    assert.equal(entry.id, chartType);
    assert.equal(typeof entry.transform, "function", `${chartType} must own a transform`);
    assert.equal(typeof entry.renderer, "function", `${chartType} must own a renderer`);
  }
});

test("every chart type builds a non-empty canonical main series from valid OHLCV", () => {
  for (const chartType of EXPECTED_ORDER) {
    const plan = buildPlan(chartType);
    const mainSeries = plan.series.find((series) => series.id === "main-series");
    assert.ok(mainSeries, `${chartType} must expose main-series`);
    assert.ok(Array.isArray(mainSeries.data), `${chartType} main-series must expose data`);
    assert.ok(mainSeries.data.length > 0, `${chartType} main-series must not be empty`);
    assert.ok(plan.dates.length > 0, `${chartType} must expose a rendered time axis`);
  }
});

test("synthetic chart types project real source volume onto their transformed axis without amplification", () => {
  for (const chartType of EXPECTED_ORDER.filter((id) => CHART_TYPE_REGISTRY[id].synthetic)) {
    const plan = buildPlan(chartType);
    assert.equal(plan.synthetic, true, `${chartType} must remain explicitly synthetic`);
    assert.equal(plan.volumeSourceData.length, plan.dates.length, `${chartType} volume axis must align with rendered dates`);
    const projectedVolume = plan.volumeSourceData.reduce((sum, bar) => sum + Number(bar.volume || 0), 0);
    assert.ok(projectedVolume > 0, `${chartType} must retain source volume information`);
    assert.ok(projectedVolume <= sourceVolume * 1.000001, `${chartType} must never duplicate source volume`);
  }
});

test("intrabar-dependent chart types are explicitly and exclusively marked approximate without ticks", () => {
  const intrabarTypes = EXPECTED_ORDER.filter((id) => CHART_TYPE_REGISTRY[id].requires.includes("intrabar"));
  assert.deepEqual(intrabarTypes, ["volume_footprint", "time_price_opportunity", "session_volume_profile"]);
  for (const chartType of EXPECTED_ORDER) {
    const entry = CHART_TYPE_REGISTRY[chartType];
    assert.equal(Boolean(entry.approximateWithoutTicks), entry.requires.includes("intrabar"), `${chartType} approximation metadata must match its data requirements`);
  }
});

test("ECharts structural commits are last-write-wins and do not add a second RAF before the keyed scheduler", () => {
  const rendererSource = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/useEChartsRenderer.ts"), "utf8");
  assert.match(rendererSource, /const chartRenderGenerationRef = useRef\(0\)/);
  assert.match(rendererSource, /const renderGeneration = \+\+chartRenderGenerationRef\.current/);
  assert.match(rendererSource, /scheduleChartMutation\("full-option",[\s\S]*?renderGeneration !== chartRenderGenerationRef\.current/);
  const commitBlock = rendererSource.slice(
    rendererSource.indexOf("const chartStructureSignature = resolveChartStructureSignature"),
    rendererSource.indexOf("const handleLegendChange"),
  );
  assert.doesNotMatch(commitBlock, /rafId\s*=\s*requestAnimationFrame/);
});
