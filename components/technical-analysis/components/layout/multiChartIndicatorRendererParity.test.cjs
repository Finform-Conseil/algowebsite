const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) => fs.readFileSync(path.resolve(__dirname, relativePath), "utf8");

const peerSource = read("FullPeerChart.tsx");
const gridSource = read("MultiChartLayoutGrid.tsx");

test("multi-chart peers render through the canonical ECharts indicator engine", () => {
  assert.match(peerSource, /useEChartsRenderer\(\{/);
  assert.match(peerSource, /advancedIndicators:\s*indicatorSnapshot\.advanced/);
  assert.match(peerSource, /indicatorPeriods:\s*indicatorSnapshot\.periods/);
  assert.match(peerSource, /bollingerSettings:\s*indicatorSnapshot\.bollinger/);
  assert.match(peerSource, /indicators:\s*snapshot\.chart/);
});

test("multi-chart peers do not maintain a hard-coded supported-indicator list", () => {
  assert.doesNotMatch(peerSource, /indicatorIds\.has\("macd"\)/);
  assert.doesNotMatch(peerSource, /indicatorIds\.has\("rsi"\)/);
  assert.doesNotMatch(peerSource, /indicatorIds\.has\("bollinger"\)/);
  assert.doesNotMatch(peerSource, /showSma\s*=\s*indicatorIds/);
});

test("the grid forwards global renderer context while each peer owns its isolated indicator snapshot", () => {
  assert.match(gridSource, /uiState=\{uiState\}/);
  assert.match(gridSource, /hiddenObjectIds=\{hiddenObjectIds\}/);
  assert.match(peerSource, /completeCell\.indicatorState\s*\?\?/);
  assert.match(peerSource, /activeChartId:\s*cell\.chartId/);
});
