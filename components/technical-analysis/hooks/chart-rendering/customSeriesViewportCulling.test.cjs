const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const sourcePath = path.resolve(__dirname, 'customSeriesViewportCulling.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
new Function('module', 'exports', 'require', compiled)(loadedModule, loadedModule.exports, require);
const { isCustomSeriesPointOutsideViewport } = loadedModule.exports;

const params = { coordSys: { x: 100, width: 400 } };

const apiForX = (x, band = 5) => ({
  value: () => x,
  coord: ([value]) => [value, 0],
  size: () => [band, 0],
});

test('compact transformed point is kept based on rendered x, not params.dataIndex', () => {
  const compactParams = { ...params, dataIndex: 0 };
  assert.equal(isCustomSeriesPointOutsideViewport(compactParams, apiForX(280)), false);
});

test('point outside the visible cartesian grid plus safety margin is culled', () => {
  assert.equal(isCustomSeriesPointOutsideViewport(params, apiForX(700)), true);
  assert.equal(isCustomSeriesPointOutsideViewport(params, apiForX(0)), true);
});

test('partially visible points inside the 12-band safety margin are retained', () => {
  assert.equal(isCustomSeriesPointOutsideViewport(params, apiForX(545, 5)), false);
  assert.equal(isCustomSeriesPointOutsideViewport(params, apiForX(55, 5)), false);
});

test('invalid or unavailable geometry fails open instead of hiding data', () => {
  assert.equal(isCustomSeriesPointOutsideViewport({}, apiForX(700)), false);
  assert.equal(isCustomSeriesPointOutsideViewport(params, { value: () => 10 }), false);
});
