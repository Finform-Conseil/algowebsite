const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const sourcePath = path.resolve(__dirname, "viewportMath.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const loadedModule = { exports: {} };
new Function("module", "exports", "require", compiled)(loadedModule, loadedModule.exports, require);

const {
  computePriceAxisWheelViewport,
  computePriceAxisDragViewport,
  computePriceAxisPan,
  computeTradingViewWheelZoomViewport,
} = loadedModule.exports;

const nearlyEqual = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
};

test("price-axis wheel zoom preserves the price anchored under the shifted cursor", () => {
  const center = 100;
  const baseRange = 20;
  const cursorRatio = 0.25;
  const gridHeight = 500;
  const wheelDeltaY = 80;
  const oldPrice = center + baseRange * (0.5 - cursorRatio);
  const result = computePriceAxisWheelViewport({
    center,
    baseRange,
    yScale: 1,
    yPan: 0,
    cursorRatio,
    gridHeight,
    wheelDeltaY,
  });
  const wheelStep = 1;
  const shiftedRatio = cursorRatio + (15 * wheelStep) / gridHeight;
  const newPrice = center + result.yPan + baseRange * result.yScale * (0.5 - shiftedRatio);
  nearlyEqual(newPrice, oldPrice);
  assert.ok(result.yScale > 1);
});

test("price-axis drag scales around the drag anchor instead of drifting the price", () => {
  const result = computePriceAxisDragViewport({
    center: 50,
    baseRange: 10,
    initialYScale: 1,
    initialYPan: 0,
    startRatio: 0.25,
    currentRatio: 0.55,
    deltaY: 30,
  });
  const anchorBefore = 50 + 10 * (0.5 - 0.25);
  const anchorAfter = 50 + result.yPan + (10 * result.yScale) * (0.5 - 0.55);
  nearlyEqual(anchorAfter, anchorBefore);
  assert.ok(result.yScale > 1);
});

test("vertical chart pan is bounded to 80 percent of the scaled price range", () => {
  assert.equal(computePriceAxisPan({
    initialYPan: 0,
    deltaY: 10000,
    gridHeight: 100,
    priceRange: 20,
    yScale: 2,
  }), 32);
  assert.equal(computePriceAxisPan({
    initialYPan: Number.NaN,
    deltaY: -10000,
    gridHeight: 100,
    priceRange: 20,
    yScale: 2,
  }), -32);
});

test("multi-chart time-wheel helper uses the same bounded TradingView law as single chart", () => {
  const result = computeTradingViewWheelZoomViewport({
    startIdx: 20,
    endIdx: 99,
    totalBars: 100,
    deltaY: -80,
    maxHistoryGapBars: 0,
    maxFutureBars: 0,
  });
  assert.equal(result.endIdx, 99);
  assert.ok(result.startIdx > 20, "zoom-in must reduce visible span while preserving the right edge");
});
