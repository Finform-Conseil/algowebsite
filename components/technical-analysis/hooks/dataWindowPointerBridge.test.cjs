const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");
const source = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/useObjectTreePanel.ts"), "utf8");

test("Data Window listens on the shared chart surface in capture phase", () => {
  assert.match(source, /handleChartSurfaceMouseMove/);
  assert.match(source, /closest<HTMLElement>\("\.gp-chart-main-section"\)/);
  assert.match(source, /addEventListener\("mousemove", handleChartSurfaceMouseMove, true\)/);
});

test("overlay pointer coordinates are converted into ECharts local pixels", () => {
  assert.match(source, /event\.clientX - rect\.left/);
  assert.match(source, /event\.clientY - rect\.top/);
  assert.match(source, /resolvePixelPointerIndex\([\s\S]*?\{ offsetX, offsetY \}/);
});

test("pointer bridge is detached on rebind\/unmount", () => {
  assert.match(source, /removeEventListener\("mousemove", handleChartSurfaceMouseMove, true\)/);
});
