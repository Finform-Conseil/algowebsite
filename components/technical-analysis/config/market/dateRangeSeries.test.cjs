const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.resolve("components/technical-analysis/config/market/dateRangeSeries.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = new Module(sourcePath, module);
mod.filename = sourcePath;
mod.paths = Module._nodeModulePaths(path.dirname(sourcePath));
mod._compile(output, sourcePath);

const {
  decodeCustomDateRange,
  encodeCustomDateRange,
  filterChartDataByDateRange,
  resolveChartDataDateBounds,
} = mod.exports;

const point = (time, close) => ({ time, open: close, high: close, low: close, close, volume: 0 });
const series = [
  point("2025-12-31T00:00:00.000Z", 1),
  point("2026-01-02T00:00:00.000Z", 2),
  point("2026-02-10T00:00:00.000Z", 3),
  point("2026-03-10T00:00:00.000Z", 4),
  point("2026-04-09T00:00:00.000Z", 5),
];

test("Tout preserves the complete series", () => {
  assert.equal(filterChartDataByDateRange(series, "Tout").length, 5);
});

test("preset ranges anchor to the latest loaded candle instead of wall-clock time", () => {
  assert.deepEqual(filterChartDataByDateRange(series, "1M").map((item) => item.close), [4, 5]);
});

test("YTD uses the year of the latest loaded candle", () => {
  assert.deepEqual(filterChartDataByDateRange(series, "YTD").map((item) => item.close), [2, 3, 4, 5]);
});

test("custom ranges are inclusive, deterministic and do not mutate source data", () => {
  const encoded = encodeCustomDateRange("2026-02-01", "2026-03-31");
  assert.deepEqual(decodeCustomDateRange(encoded), { start: "2026-02-01", end: "2026-03-31" });
  assert.deepEqual(filterChartDataByDateRange(series, encoded).map((item) => item.close), [3, 4]);
  assert.equal(series.length, 5);
});

test("invalid custom ranges fail closed", () => {
  assert.throws(() => encodeCustomDateRange("2026-04-10", "2026-04-01"), RangeError);
  assert.equal(decodeCustomDateRange("CUSTOM|2026-02-30|2026-03-01"), null);
});

test("bounds are derived exclusively from loaded data", () => {
  assert.deepEqual(resolveChartDataDateBounds(series), {
    minDate: "2025-12-31",
    maxDate: "2026-04-09",
    minTimestamp: Date.parse("2025-12-31T00:00:00.000Z"),
    maxTimestamp: Date.parse("2026-04-09T00:00:00.000Z"),
  });
});
