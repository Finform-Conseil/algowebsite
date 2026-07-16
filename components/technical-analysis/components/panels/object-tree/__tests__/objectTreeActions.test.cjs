/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../../../store/__tests__/testTypeScriptLoader.cjs");

const { resolveObjectItemRemoveAction } = require("../objectTreeActions.ts");

const emptyIndicators = {};

test("object tree removal resolver handles comparison and advanced child rows", () => {
  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "compare-SNTS" },
      indicators: emptyIndicators,
      advancedIndicators: {},
    }),
    { type: "remove-comparison", symbol: "SNTS" },
  );

  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "macd-line" },
      indicators: emptyIndicators,
      advancedIndicators: { macd: true },
    }),
    { type: "set-advanced-indicator", patch: { macd: false } },
  );

  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "tsi-signal" },
      indicators: emptyIndicators,
      advancedIndicators: { tsi: true },
    }),
    { type: "set-advanced-indicator", patch: { tsi: false } },
  );
});
