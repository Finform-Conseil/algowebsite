const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const cache = new Map();
const loadTs = (filename) => {
  const abs = path.resolve(filename);
  if (cache.has(abs)) return cache.get(abs).exports;
  const source = fs.readFileSync(abs, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = new Module(abs, module);
  mod.filename = abs;
  mod.paths = Module._nodeModulePaths(path.dirname(abs));
  cache.set(abs, mod);
  const original = mod.require.bind(mod);
  mod.require = (request) => {
    if (request.startsWith('./') || request.startsWith('../')) {
      const target = path.resolve(path.dirname(abs), request.endsWith('.ts') ? request : request + '.ts');
      if (fs.existsSync(target)) return loadTs(target);
    }
    return original(request);
  };
  mod._compile(output, abs);
  return mod.exports;
};

const { indiceCoursToLineChartData, resolveIndexTimeframeSeries } = loadTs('components/technical-analysis/config/market/indexSeriesAdapter.ts');

test('index close-only history is normalized for line transport without inventing volume', () => {
  const series = indiceCoursToLineChartData([
    { id: '2', indice: 'i', timestamp: '2026-08-04', close: 102 },
    { id: '1', indice: 'i', timestamp: '2026-08-03', close: 100 },
  ]);
  assert.equal(series.length, 2);
  assert.deepEqual(series[0], {
    time: '2026-08-03T00:00:00.000Z', open: 100, high: 100, low: 100, close: 100, volume: 0, tradesCount: null,
  });
});

test('index daily is native, weekly/monthly aggregate, intraday fails closed', () => {
  const daily = indiceCoursToLineChartData([
    { id: '1', indice: 'i', timestamp: '2026-08-03', close: 100 },
    { id: '2', indice: 'i', timestamp: '2026-08-04', close: 102 },
    { id: '3', indice: 'i', timestamp: '2026-08-10', close: 104 },
  ]);
  assert.equal(resolveIndexTimeframeSeries('1D', daily).source, 'native');
  assert.equal(resolveIndexTimeframeSeries('1W', daily).series.length, 2);
  assert.equal(resolveIndexTimeframeSeries('1M', daily).series.length, 1);
  assert.deepEqual(resolveIndexTimeframeSeries('1H', daily), { timeframe: '1H', source: 'unavailable', series: [] });
});
