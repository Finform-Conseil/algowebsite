/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
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

const root = path.join(__dirname, "..");
const { buildChartTypeSeries } = require(path.join(root, "components/technical-analysis/lib/chart-types/renderers/buildChartTypeSeries.ts"));
const { normalizeRawBars } = require(path.join(root, "components/technical-analysis/lib/chart-types/domain/validateBars.ts"));
const { transformPointFigure } = require(path.join(root, "components/technical-analysis/lib/chart-types/transforms/pointFigure.ts"));
const {
  MAX_HEAVY_CHART_SOURCE_BARS,
  MAX_SYNTHETIC_OUTPUT_POINTS,
  MAX_SYNTHETIC_POINT_FIGURE_BOXES,
} = require(path.join(root, "components/technical-analysis/lib/chart-types/transforms/priceBasedUtils.ts"));

const palette = {
  upColor: "#00ff5f",
  downColor: "#ff1744",
  textColor: "#d9e2ef",
  liveColor: "#e60039",
};

const makeBars = (count, volatile = false) => Array.from({ length: count }, (_unused, index) => {
  const time = new Date(Date.UTC(2022, 0, 1 + index)).toISOString();
  const base = volatile
    ? (index % 2 === 0 ? 4_000 : 16_000)
    : 8_000 + index * 2;
  const close = base + (index % 5) * 25;
  const open = close - (index % 2 === 0 ? 40 : -40);
  const high = Math.max(open, close) + 75;
  const low = Math.min(open, close) - 75;
  return { time, open, high, low, close, volume: 100_000 + index * 10 };
});

const buildPlan = (chartType, chartData) => buildChartTypeSeries({
  chartType,
  chartData,
  baseDates: chartData.map((bar) => bar.time),
  displaySymbol: "TEST",
  palette,
  latestPrice: chartData[chartData.length - 1].close,
  visible: true,
});

const getMainSeries = (plan) => plan.series.find((series) => series.id === "main-series");
const countPointFigureBoxes = (result) => result.items.reduce((sum, column) => sum + column.boxes.length, 0);

const longDailyBars = makeBars(1_500, false);
const volatileBars = makeBars(1_500, true);

const footprintPlan = buildPlan("volume_footprint", longDailyBars);
const footprintSeries = getMainSeries(footprintPlan);
assert.ok(footprintPlan.dates.length <= MAX_HEAVY_CHART_SOURCE_BARS, "Volume Footprint must not transform the full historical source window");
assert.ok(footprintSeries.data.length <= 260, "Volume Footprint custom series must sample render candles");
assert.ok(footprintPlan.warnings.some((warning) => warning.code === "VOLUME_FOOTPRINT_PERFORMANCE_LIMIT"), "Volume Footprint must report performance capping");

const tpoPlan = buildPlan("time_price_opportunity", longDailyBars);
const tpoSeries = getMainSeries(tpoPlan);
assert.ok(tpoSeries.data.length <= 260, "TPO custom series must sample render profiles");

const rangePlan = buildPlan("range", volatileBars);
const rangeSeries = getMainSeries(rangePlan);
assert.ok(rangeSeries.data.length <= MAX_SYNTHETIC_OUTPUT_POINTS, "Range bars must be hard-capped under pathological volatility");
assert.ok(rangePlan.warnings.some((warning) => warning.code === "RANGE_PERFORMANCE_LIMIT"), "Range must report performance capping");

const renkoPlan = buildPlan("renko", volatileBars);
const renkoSeries = getMainSeries(renkoPlan);
assert.ok(renkoSeries.data.length <= MAX_SYNTHETIC_OUTPUT_POINTS, "Renko bricks must be hard-capped under pathological volatility");

const normalized = normalizeRawBars(volatileBars).bars;
const pointFigureResult = transformPointFigure({ bars: normalized });
assert.ok(countPointFigureBoxes(pointFigureResult) <= MAX_SYNTHETIC_POINT_FIGURE_BOXES, "Point & Figure boxes must be hard-capped");

console.log("Chart type performance tests passed");
