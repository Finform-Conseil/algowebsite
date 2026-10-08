const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const drawingManagerSource = fs.readFileSync(
  path.resolve(__dirname, "../useDrawingManager.ts"),
  "utf8",
);

test("an armed drawing tool has creation priority over existing drawing selection", () => {
  assert.match(
    drawingManagerSource,
    /if \(\s*!currentActiveTool\s*&&\s*!isShiftMeasureGesture\s*&&\s*drawingsRef\.current\.length > 0\s*&&\s*rendererRef\.current\s*\) \{/,
    "saved-drawing hit testing must be disabled while a creation tool is armed",
  );
});
