const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const grid = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const peer = read("components/technical-analysis/components/layout/FullPeerChart.tsx");
const renderer = read("components/technical-analysis/hooks/useEChartsRenderer.ts");

test("layouts with at most two rendered cells keep grids visible on every chart", () => {
  assert.match(grid, /const showGridLines = renderedCharts\.length <= 2 \|\| isActive;/);
});

test("dense layouts pass active-cell grid ownership into the peer chart", () => {
  assert.match(grid, /showGridLines=\{showGridLines\}/);
  assert.match(peer, /showGridLines\?: boolean/);
  assert.match(peer, /gridLinesVisible: showGridLines/);
  assert.match(peer, /data-grid-lines=\{showGridLines \? "visible" : "hidden"\}/);
});

test("renderer gates both horizontal and vertical split lines from one master policy", () => {
  assert.match(renderer, /gridLinesVisible\?: boolean/);
  assert.match(renderer, /const horizontalGridVisible = gridLinesVisible &&/);
  assert.match(renderer, /const verticalGridVisible = gridLinesVisible &&/);
});

test("active-cell changes are renderer inputs so split lines refresh immediately", () => {
  assert.match(renderer, /legendLayoutMode,\s*gridLinesVisible,\s*chartAppearance,/);
});
