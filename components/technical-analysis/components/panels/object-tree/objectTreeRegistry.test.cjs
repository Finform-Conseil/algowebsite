const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../../..");
const registry = fs.readFileSync(path.join(root, "components/technical-analysis/components/panels/object-tree/objectTreeRegistry.ts"), "utf8");
const panel = fs.readFileSync(path.join(root, "components/technical-analysis/components/panels/object-tree/ObjectTreePanel.tsx"), "utf8");
const rows = fs.readFileSync(path.join(root, "components/technical-analysis/components/panels/object-tree/objectTreeRows.tsx"), "utf8");

test("Object Tree has one registry joining configured objects, runtime series and drawings", () => {
  assert.match(registry, /buildChartObjectRegistry/);
  assert.match(registry, /runtimeSeries/);
  assert.match(registry, /drawings\.map/);
  assert.match(panel, /const chartObjectRegistry = buildChartObjectRegistry/);
  assert.match(panel, /registryDrawings/);
});

test("unknown rendered ECharts series are visible in the registry without fake actions", () => {
  assert.match(registry, /runtimeOnly: true/);
  assert.match(registry, /visibility: false/);
  assert.match(registry, /remove: false/);
  assert.match(panel, /chart\.getOption\(\)/);
});

test("unsupported row actions are not rendered as decorative buttons", () => {
  assert.match(rows, /item\.capabilities\?\.visibility/);
  assert.match(rows, /item\.capabilities\?\.remove/);
});

test("renderer-only helper series do not pollute Object Tree", () => {
  assert.match(registry, /isInternalRendererSeries/);
  assert.match(registry, /volume-panel-background/);
  assert.match(registry, /viewport-boundary-/);
  assert.match(registry, /filter\(\(series\) => !isInternalRendererSeries\(series\)\)/);
});

test("canvas-rendered alerts and active orders join the same registry projection", () => {
  assert.match(panel, /state\.technicalAnalysis\.alerts/);
  assert.match(panel, /state\.technicalAnalysis\.orders/);
  assert.match(panel, /kind: "alert"/);
  assert.match(panel, /kind: "order"/);
  assert.match(panel, /capabilities: \{ visibility: false, remove: false \}/);
});
