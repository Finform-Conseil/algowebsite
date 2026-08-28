const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const sourcePath = path.resolve('components/technical-analysis/config/market/dateRangeSeries.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const mod = new Module(sourcePath, module);
mod.filename = sourcePath;
mod.paths = Module._nodeModulePaths(path.dirname(sourcePath));
mod._compile(output, sourcePath);
const { filterChartDataByDateRange } = mod.exports;

const point = (time, close) => ({ time, open: close, high: close, low: close, close, volume: 0 });
const now = new Date('2026-08-28T12:00:00.000Z');
const series = [
  point('2025-08-27T00:00:00.000Z', 1),
  point('2026-02-28T00:00:00.000Z', 2),
  point('2026-08-20T00:00:00.000Z', 3),
  point('2026-08-28T00:00:00.000Z', 4),
];

test('Tout preserves the complete series', () => {
  assert.equal(filterChartDataByDateRange(series, 'Tout', now).length, 4);
});

test('1M uses the same calendar semantics for every chart cell', () => {
  assert.deepEqual(filterChartDataByDateRange(series, '1M', now).map((item) => item.close), [3, 4]);
});

test('an empty date window fails closed to the latest real point', () => {
  const stale = [point('2020-01-01T00:00:00.000Z', 7)];
  assert.deepEqual(filterChartDataByDateRange(stale, '1J', now).map((item) => item.close), [7]);
});

test('unknown ranges never invent a cutoff', () => {
  assert.equal(filterChartDataByDateRange(series, 'CUSTOM', now).length, 4);
});
