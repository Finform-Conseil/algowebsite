/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../../../store/__tests__/testTypeScriptLoader.cjs");

const { resolveDrawingBulkAction } = require("../objectTreeDrawingActions.ts");

test("drawing bulk action resolver blocks empty drawing operations", () => {
  assert.deepEqual(resolveDrawingBulkAction("hide-all", 0), {
    type: "blocked",
    message: "Aucun dessin a masquer.",
  });

  assert.deepEqual(resolveDrawingBulkAction("unlock-all", 0), {
    type: "blocked",
    message: "Aucun dessin a deverrouiller.",
  });
});

test("drawing bulk action resolver returns patches for drawing operations", () => {
  assert.deepEqual(resolveDrawingBulkAction("hide-all", 2), { type: "patch-all", patch: { hidden: true } });
  assert.deepEqual(resolveDrawingBulkAction("show-all", 2), { type: "patch-all", patch: { hidden: false } });
  assert.deepEqual(resolveDrawingBulkAction("lock-all", 2), { type: "patch-all", patch: { locked: true } });
  assert.deepEqual(resolveDrawingBulkAction("unlock-all", 2), { type: "patch-all", patch: { locked: false } });
});
