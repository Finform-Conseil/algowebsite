const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const helperPath = path.resolve(__dirname, "drawingPointerOwnership.ts");
const helperSource = fs.readFileSync(helperPath, "utf8");
const helperCompiled = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const helperModule = { exports: {} };
new Function("module", "exports", "require", helperCompiled)(helperModule, helperModule.exports, require);

const {
  markDrawingPointerEventOwned,
  isDrawingPointerEventOwned,
  registerDrawingPointerHitTest,
  shouldDrawingOwnPointerEvent,
} = helperModule.exports;
const drawingManagerSource = fs.readFileSync(path.resolve(__dirname, "../useDrawingManager.ts"), "utf8");
const viewportSource = fs.readFileSync(path.resolve(__dirname, "../useChartViewport.ts"), "utf8");
const technicalAnalysisSource = fs.readFileSync(path.resolve(__dirname, "../../TechnicalAnalysis.tsx"), "utf8");

test("drawing pointer ownership is event-scoped and does not leak to unrelated pointers", () => {
  const drawingEvent = new Event("pointerdown");
  const chartEvent = new Event("pointerdown");

  assert.equal(isDrawingPointerEventOwned(drawingEvent), false);
  markDrawingPointerEventOwned(drawingEvent);
  assert.equal(isDrawingPointerEventOwned(drawingEvent), true);
  assert.equal(isDrawingPointerEventOwned(chartEvent), false);
});

test("drawing hit arbitration runs in capture before viewport pan initialization", () => {
  assert.match(technicalAnalysisSource, /onPointerDownCapture=\{handlePointerDownCapture\}/);
  assert.match(drawingManagerSource, /const handlePointerDownCapture = useCallback/);
  assert.match(drawingManagerSource, /markDrawingPointerEventOwned\(e\.nativeEvent\)/);

  const ownershipGuard = viewportSource.indexOf("if (isDrawingPointerEventOwned(event)) return;");
  const pointerRegistration = viewportSource.indexOf("state.activePointers.set(event.pointerId, event);");
  assert.ok(ownershipGuard >= 0, "viewport must guard drawing-owned pointerdown");
  assert.ok(pointerRegistration >= 0, "viewport pointer registration must exist");
  assert.ok(ownershipGuard < pointerRegistration, "ownership guard must run before viewport drag state is armed");
});

test("selection mode still allows background chart pan because ownership is hit-tested, not blanket-blocked", () => {
  assert.match(drawingManagerSource, /spatialGridRef\.current\.query\(pointerPixel\.x, pointerPixel\.y\)/);
  assert.match(drawingManagerSource, /if \(hit\.isHit\) \{/);
  assert.doesNotMatch(viewportSource, /drawingInteraction === ['"]selection['"]\)\s*\{\s*return/);
});
