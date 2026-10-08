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
  computeVelaPinchViewport,
  exponentialApproach,
  filterPanVelocity,
  decayPanVelocity,
  TV_ZOOM_EASE_TAU_MS,
  TV_PAN_MOMENTUM_TAU_MS,
  TV_PAN_STOP_VELOCITY_PX_PER_MS,
  TV_MIN_VISIBLE_BARS,
  resolveVelaInitialViewportWindow,
  VELA_DEFAULT_BAR_SPACING_PX,
  VELA_DEFAULT_RIGHT_OFFSET_BARS,
} = loadedModule.exports;

const nearlyEqual = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
};

test("initial viewport follows Vela 8px spacing and +6 right offset exactly", () => {
  assert.equal(VELA_DEFAULT_BAR_SPACING_PX, 8);
  assert.equal(VELA_DEFAULT_RIGHT_OFFSET_BARS, 6);
  const result = resolveVelaInitialViewportWindow(500, 800);
  nearlyEqual(result.endIdx, 505);
  nearlyEqual(result.startIdx, 405);
});

test("initial viewport never creates blank synthetic history before the first candle", () => {
  const result = resolveVelaInitialViewportWindow(60, 1200);
  nearlyEqual(result.startIdx, 0);
  nearlyEqual(result.endIdx, 65);
});

test("fit-all initial viewport exposes the complete loaded history from the first candle", () => {
  const result = resolveVelaInitialViewportWindow(500, 800, undefined, undefined, true);
  nearlyEqual(result.startIdx, 0);
  nearlyEqual(result.endIdx, 505);
});

test("price-axis wheel matches Vela's centered 0.25 × 0.004 scale law", () => {
  const result = computePriceAxisWheelViewport({
    center: 100,
    baseRange: 20,
    yScale: 1,
    yPan: 3,
    cursorRatio: 0.25,
    gridHeight: 500,
    wheelDeltaY: 80,
  });
  nearlyEqual(result.yScale, Math.exp(80 * 0.25 * 0.004), 1e-12);
  nearlyEqual(result.yPan, 3, 1e-12);
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

test("ordinary time-wheel zoom matches Vela rightEdgeZoom=true", () => {
  const result = computeTradingViewWheelZoomViewport({
    startIdx: 20,
    endIdx: 99,
    totalBars: 100,
    deltaY: -80,
    maxHistoryGapBars: 0,
    maxFutureBars: 0,
  });
  nearlyEqual(result.endIdx, 99, 1e-9);
  assert.ok((result.endIdx - result.startIdx) < 79, "wheel-up must zoom in around the right edge");
});

test("Ctrl/Cmd-style time-wheel zoom pins the logical candle under the cursor", () => {
  const startIdx = 20;
  const endIdx = 99;
  const cursorRatio = 0.25;
  const focusBefore = startIdx + ((endIdx - startIdx) * cursorRatio);
  const result = computeTradingViewWheelZoomViewport({
    startIdx,
    endIdx,
    totalBars: 100,
    deltaY: -30,
    cursorRatio,
    maxHistoryGapBars: 0,
    maxFutureBars: 0,
  });
  const focusAfter = result.startIdx + ((result.endIdx - result.startIdx) * cursorRatio);
  nearlyEqual(focusAfter, focusBefore, 1e-9);
});

test("pinch uses Vela distance ratio and keeps initial logical anchor under live midpoint", () => {
  const result = computeVelaPinchViewport({
    startIdx: 20,
    endIdx: 100,
    totalBars: 200,
    startDistance: 100,
    currentDistance: 200,
    anchorLogical: 60,
    currentMidpointRatio: 0.25,
    maxHistoryGapBars: 0,
    maxFutureBars: 0,
  });
  nearlyEqual(result.endIdx - result.startIdx, 40, 1e-9);
  nearlyEqual(result.startIdx + ((result.endIdx - result.startIdx) * 0.25), 60, 1e-9);
});

test("Vela interaction constants keep 2 visible bars and stop fling at 0.02 px/ms", () => {
  assert.equal(TV_MIN_VISIBLE_BARS, 2);
  assert.equal(TV_PAN_STOP_VELOCITY_PX_PER_MS, 0.02);
  assert.equal(TV_ZOOM_EASE_TAU_MS, 70);
  assert.equal(TV_PAN_MOMENTUM_TAU_MS, 110);
});

test("viewport easing is frame-rate independent and converges without overshoot", () => {
  const oneFrame = exponentialApproach(0, 100, 16, TV_ZOOM_EASE_TAU_MS);
  const twoHalfFrames = exponentialApproach(
    exponentialApproach(0, 100, 8, TV_ZOOM_EASE_TAU_MS),
    100,
    8,
    TV_ZOOM_EASE_TAU_MS,
  );
  nearlyEqual(oneFrame, twoHalfFrames, 1e-10);
  assert.ok(oneFrame > 0 && oneFrame < 100);
});

test("pan velocity filter rejects pointer noise and momentum decays exponentially", () => {
  const filtered = filterPanVelocity(0.5, 1);
  nearlyEqual(filtered, 0.7);
  const decayed = decayPanVelocity(filtered, TV_PAN_MOMENTUM_TAU_MS, TV_PAN_MOMENTUM_TAU_MS);
  nearlyEqual(decayed, filtered * Math.exp(-64 / TV_PAN_MOMENTUM_TAU_MS), 1e-10);
});
