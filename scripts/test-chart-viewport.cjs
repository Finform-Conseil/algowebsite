/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "components/technical-analysis/hooks/useChartViewport.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    esModuleInterop: true,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const sandboxModule = { exports: {} };

vm.runInNewContext(transpiled.outputText, {
  console,
  exports: sandboxModule.exports,
  module: sandboxModule,
  require,
  requestAnimationFrame: (callback) => setTimeout(() => callback(Date.now()), 0),
  cancelAnimationFrame: (id) => clearTimeout(id),
}, { filename: sourcePath });

const {
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  normalizeWheelDeltaPx,
} = sandboxModule.exports;

const zoomed = computeDirectionalZoomViewport({
  startIdx: 100,
  endIdx: 200,
  totalBars: 500,
  cursorRatio: 0.25,
  zoomFactor: 0.8,
  deltaY: -80,
});

assert.ok(zoomed.endIdx < 499, "Wheel zoom must not force the viewport back to the latest candle");
assert.ok(zoomed.endIdx - zoomed.startIdx < 100, "Wheel zoom-in must reduce the visible candle span");
assert.ok(zoomed.startIdx >= 80 && zoomed.startIdx <= 130, "Wheel zoom must stay near the cursor-focused region");

const panned = computeHorizontalPanViewport({
  startIdx: 100,
  endIdx: 200,
  totalBars: 500,
  shift: 12,
});

assert.ok(panned.startIdx > 100, "Positive horizontal wheel delta must pan the viewport forward");
assert.equal(panned.endIdx - panned.startIdx, 100, "Horizontal pan must preserve the visible candle span");
assert.equal(normalizeWheelDeltaPx(1_000, 0), 80, "Pixel wheel delta must be capped to keep trackpads smooth");
assert.equal(normalizeWheelDeltaPx(3, 1), 48, "Line-mode wheel delta must be normalized to pixels");

console.log("Chart viewport interaction tests passed");
