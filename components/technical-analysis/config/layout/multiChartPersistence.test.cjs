/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MULTI_CHART_PERSISTENCE_VERSION,
  migratePersistedMultiChartLayout,
  serializeMultiChartLayout,
} = require("./multiChartPersistence.ts");

const sync = { symbol: false, interval: false, crosshair: false, time: false, dateRange: false };

const legacyLayout = {
  layoutId: "two_horizontal",
  name: "2 graphiques horizontaux",
  isEnabled: true,
  sync,
  charts: [
    { chartId: "chart_1", symbol: "ORANGE_CI", exchange: "BRVM", interval: "1D", indicators: ["volume"], isActive: true },
    { chartId: "chart_2", symbol: "BOA", exchange: "CSE", interval: "1W", indicators: ["volume"], isActive: false },
  ],
  activeChartId: "chart_1",
};

test("legacy v1 layout migrates deterministically to the complete v2 cell contract", () => {
  const migrated = migratePersistedMultiChartLayout(legacyLayout);
  assert.ok(migrated);
  assert.equal(MULTI_CHART_PERSISTENCE_VERSION, 3);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.charts[0].timeframe, "1D");
  assert.equal(migrated.charts[0].chartType, "candles");
  assert.equal(migrated.charts[0].dateRange, "Tout");
  assert.equal(migrated.charts[0].drawingScope, "chart_1");
  assert.equal(migrated.charts[1].timeframe, "1W");
  assert.equal(migrated.charts[1].exchange, "CSE");
  assert.equal(migrated.maximizedChartId, null);
});

test("legacy persisted sync flags are reset once so panels reopen independently", () => {
  const migrated = migratePersistedMultiChartLayout({
    ...legacyLayout,
    sync: { symbol: true, interval: true, crosshair: true, time: true, dateRange: true },
  }, { resetSyncToDefault: true });
  assert.ok(migrated);
  assert.deepEqual(migrated.sync, sync);
});

test("current persisted sync flags remain explicit opt-in state", () => {
  const explicit = { symbol: false, interval: false, crosshair: true, time: true, dateRange: false };
  const migrated = migratePersistedMultiChartLayout({ ...legacyLayout, sync: explicit });
  assert.ok(migrated);
  assert.deepEqual(migrated.sync, explicit);
});

test("index cells are always restored as line charts because index history has close only", () => {
  const current = {
    ...legacyLayout,
    schemaVersion: 2,
    charts: [
      { ...legacyLayout.charts[0], sourceKind: "index", chartType: "candles", timeframe: "1D" },
      { ...legacyLayout.charts[1], sourceKind: "equity", chartType: "area", timeframe: "1W" },
    ],
  };
  const migrated = migratePersistedMultiChartLayout(current);
  assert.ok(migrated);
  assert.equal(migrated.charts[0].chartType, "line");
  assert.equal(migrated.charts[1].chartType, "area");
});

test("invalid persisted geometry fails closed instead of inventing missing cells", () => {
  assert.equal(migratePersistedMultiChartLayout({ ...legacyLayout, charts: [legacyLayout.charts[0]] }), null);
  assert.equal(migratePersistedMultiChartLayout({ ...legacyLayout, layoutId: "unknown" }), null);
  assert.equal(migratePersistedMultiChartLayout(null), null);
});

test("serialization repairs an empty active slot and invalid maximized id", () => {
  const serialized = serializeMultiChartLayout({
    ...legacyLayout,
    activeChartId: "chart_1",
    maximizedChartId: "missing",
    charts: [
      { ...legacyLayout.charts[0], symbol: "", exchange: "" },
      { ...legacyLayout.charts[1], isActive: false },
    ],
  });
  assert.equal(serialized.activeChartId, "chart_2");
  assert.equal(serialized.charts[1].isActive, true);
  assert.equal(serialized.maximizedChartId, null);
});
