/* eslint-env node */
const assert = require("node:assert/strict");
const test = require("node:test");

require("../../../../store/__tests__/testTypeScriptLoader.cjs");

const { resolveObjectItemRemoveAction } = require("../objectTreeActions.ts");
const { ADVANCED_INDICATOR_REGISTRY } = require("../../../../config/indicators/indicatorRegistry.ts");

const emptyIndicators = {};

test("object tree removal resolver handles Volume, moving averages, comparison and advanced child rows", () => {
  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "volume" },
      indicators: { volume: true },
      advancedIndicators: {},
    }),
    { type: "patch-indicators", patch: { volume: false } },
  );

  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "sma-20" },
      indicators: { activeSma: [20, 50], sma: true },
      advancedIndicators: {},
    }),
    { type: "remove-moving-average", family: "sma", period: 20, patch: { activeSma: [50], sma: true } },
  );

  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "ema-20" },
      indicators: { activeEma: [20], ema: true },
      advancedIndicators: {},
    }),
    { type: "remove-moving-average", family: "ema", period: 20, patch: { activeEma: [], ema: false } },
  );

  assert.deepEqual(
    resolveObjectItemRemoveAction({
      item: { id: "compare-BRVM-SNTS", comparisonKey: "BRVM::SNTS" },
      indicators: emptyIndicators,
      advancedIndicators: {},
    }),
    { type: "remove-comparison", symbol: "BRVM::SNTS" },
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

test("every removable Object Tree catalogue row resolves to a real delete action", () => {
  const indicators = {
    volume: true,
    sma: true,
    ema: true,
    activeSma: [5, 10, 20, 50, 100, 150, 200],
    activeEma: [5, 9, 10, 12, 20, 26, 50, 100, 200],
    activeWma: [20, 50],
    activeDema: [20, 50],
    activeTema: [20, 50],
    activeHma: [20, 50],
    activeZlema: [20, 50],
    activeAlma: [20, 50],
    activeSmma: [20, 50],
    activeKama: [20, 50],
    activeVwma: [20, 50],
  };
  const advancedIndicators = Object.fromEntries(
    Object.keys(ADVANCED_INDICATOR_REGISTRY).map((id) => [id, true]),
  );
  const rows = [
    { id: "volume" },
    { id: "pine-overlay" },
    { id: "compare-SNTS", comparisonKey: "BRVM::SNTS" },
  ];

  indicators.activeSma.forEach((period) => rows.push({ id: `sma-${period}` }));
  indicators.activeEma.forEach((period) => rows.push({ id: `ema-${period}` }));
  [
    ["wma", "activeWma"],
    ["dema", "activeDema"],
    ["tema", "activeTema"],
    ["hma", "activeHma"],
    ["zlema", "activeZlema"],
    ["alma", "activeAlma"],
    ["smma", "activeSmma"],
    ["kama", "activeKama"],
    ["vwma", "activeVwma"],
  ].forEach(([prefix, key]) => {
    indicators[key].forEach((period) => rows.push({ id: `${prefix}-${period}` }));
  });

  Object.entries(ADVANCED_INDICATOR_REGISTRY).forEach(([id, entry]) => {
    rows.push({ id });
    entry.children.forEach((child) => rows.push({ id: child.id }));
  });

  // Every top-level registry row must remove its exact owner, even when legacy
  // objectTreeIds overlap another registry state id.
  Object.keys(ADVANCED_INDICATOR_REGISTRY).forEach((id) => {
    const action = resolveObjectItemRemoveAction({ item: { id }, indicators, advancedIndicators });
    assert.equal(action.type, "set-advanced-indicator", `top-level ${id} must resolve to an indicator removal`);
    assert.deepEqual(action.patch, { [id]: false }, `top-level ${id} must remove itself, not an alias owner`);
  });

  // Every child row must detach the registry parent that owns that child.
  Object.entries(ADVANCED_INDICATOR_REGISTRY).forEach(([parentId, entry]) => {
    entry.children.forEach((child) => {
      const action = resolveObjectItemRemoveAction({ item: { id: child.id }, indicators, advancedIndicators });
      assert.equal(action.type, "set-advanced-indicator", `child ${child.id} must resolve to an indicator removal`);
      assert.deepEqual(action.patch, { [parentId]: false }, `child ${child.id} must remove parent ${parentId}`);
    });
  });

  const failures = rows
    .map((item) => ({
      id: item.id,
      type: resolveObjectItemRemoveAction({ item, indicators, advancedIndicators }).type,
    }))
    .filter(({ type }) => type === "unsupported" || type === "blocked");

  assert.deepEqual(failures, []);
  assert.ok(rows.length > 100, `expected exhaustive Object Tree coverage, got ${rows.length} rows`);
});
