const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "multiChartIndicatorPolicy.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
  fileName: sourcePath,
}).outputText;

const runtimeModule = new Module(sourcePath, module);
runtimeModule.filename = sourcePath;
runtimeModule.paths = module.paths;
runtimeModule._compile(transpiled, sourcePath);

const {
  DEFAULT_MULTI_CHART_INDICATORS,
  createDefaultMultiChartIndicators,
  prepareIndicatorSnapshotForMultiChartEntry,
  prepareIndicatorsForMultiChartEntry,
} = runtimeModule.exports;

test("new multi-chart cells enable volume but never SMA by default", () => {
  assert.deepEqual([...DEFAULT_MULTI_CHART_INDICATORS], ["volume"]);
  assert.deepEqual(createDefaultMultiChartIndicators(), ["volume"]);
  assert.notEqual(createDefaultMultiChartIndicators(), createDefaultMultiChartIndicators());
});

test("entering multi-chart removes the legacy implicit SMA without touching other choices", () => {
  assert.deepEqual(
    prepareIndicatorsForMultiChartEntry(["volume", "sma", "ema", "rsi"]),
    ["volume", "ema", "rsi"],
  );
  assert.deepEqual(prepareIndicatorsForMultiChartEntry(undefined), []);
});

test("entering multi-chart also clears SMA from the persisted indicator snapshot", () => {
  const snapshot = {
    chart: { sma: true, ema: true, volume: true, activeSma: [20] },
    advanced: { rsi: true },
    periods: { sma1: 5 },
    bollinger: { length: 20 },
    ui: {
      movingAverageTrendSignals: {},
      priceVsSmaMetrics: {},
      priceVsEmaMetrics: {},
    },
  };
  const next = prepareIndicatorSnapshotForMultiChartEntry(snapshot);
  assert.equal(next.chart.sma, false);
  assert.equal(next.chart.ema, true);
  assert.equal(next.chart.volume, true);
  assert.notEqual(next.chart, snapshot.chart);
  assert.equal(snapshot.chart.sma, true);
  assert.equal(prepareIndicatorSnapshotForMultiChartEntry(null), null);
});
