const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');

const loadTs = (filename) => {
  const abs = path.resolve(filename);
  const source = fs.readFileSync(abs, 'utf8');
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const mod = new Module(abs, module);
  mod.filename = abs;
  mod.paths = Module._nodeModulePaths(path.dirname(abs));
  mod._compile(output, abs);
  return mod.exports;
};

const { resolveBenchmarkIndex, rankSectorPeers, rankMarketMonitorEquities } = loadTs('components/technical-analysis/config/layout/multiChartPresetPolicy.ts');

const action = (id, ticker, market, industry, volumeCurrency, volume, move, marketCap) => ({
  id,
  ticker,
  bourse: { ticker: market },
  society: { industry: { id: industry, name: industry } },
  latest_price_metric: { volume_currency: volumeCurrency, volume, change_1d_pct: move },
  latest_valuation_ratio: { market_cap: marketCap },
});

test('explicit principal index wins over catalog ranking', () => {
  const result = resolveBenchmarkIndex('CSE', [
    { id: 'catalog', name: 'CATALOG', bourse: { ticker: 'CSE' }, principal_index: true },
  ], { id: 'explicit', name: 'MASI' });
  assert.deepEqual(result, { id: 'explicit', symbol: 'MASI' });
});

test('benchmark fallback prefers principal then global and never sectorial', () => {
  const result = resolveBenchmarkIndex('CSE', [
    { id: 'sector', name: 'BANKS', bourse: { ticker: 'CSE' }, principal_index: true, sectorial_index: true },
    { id: 'global', name: 'MASI ESG', bourse: { ticker: 'CSE' }, global_index: true },
    { id: 'principal', name: 'MASI', bourse: { ticker: 'CSE' }, principal_index: true },
  ]);
  assert.deepEqual(result, { id: 'principal', symbol: 'MASI' });
});

test('sector peers stay on same market and same industry, ranked deterministically', () => {
  const primary = action('1', 'AAA', 'BRVM', 'BANK', 1, 1, 1, 1);
  const peers = rankSectorPeers(primary, [
    primary,
    action('2', 'BBB', 'BRVM', 'BANK', 100, 20, 1, 10),
    action('3', 'CCC', 'BRVM', 'BANK', 200, 10, 2, 20),
    action('4', 'DDD', 'CSE', 'BANK', 999, 999, 9, 99),
    action('5', 'EEE', 'BRVM', 'TELCO', 999, 999, 9, 99),
  ], 3);
  assert.deepEqual(peers.map((entry) => entry.ticker), ['CCC', 'BBB']);
});

test('market monitor ranks liquidity first and excludes requested tickers', () => {
  const ranked = rankMarketMonitorEquities([
    action('1', 'AAA', 'BRVM', 'BANK', 50, 1000, 8, 100),
    action('2', 'BBB', 'BRVM', 'BANK', 500, 10, 1, 10),
    action('3', 'CCC', 'BRVM', 'BANK', 200, 200, 20, 30),
    action('4', 'DDD', 'CSE', 'BANK', 5000, 5000, 50, 500),
  ], 'BRVM', 2, ['BBB']);
  assert.deepEqual(ranked.map((entry) => entry.ticker), ['CCC', 'AAA']);
});
