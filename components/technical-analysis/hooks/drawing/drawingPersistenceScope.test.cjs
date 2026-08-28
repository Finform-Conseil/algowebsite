/* eslint-env node */
require("../../store/__tests__/testTypeScriptLoader.cjs");

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  DRAWINGS_SCOPE_STORAGE_PREFIX,
  LEGACY_DRAWINGS_STORAGE_KEY,
  PRIMARY_DRAWING_SCOPE,
  canMigrateLegacyDrawingsToScope,
  createDrawingsStorageKey,
} = require("./drawingPersistence.ts");

test("drawing storage keys are deterministic and isolated per chart scope", () => {
  assert.equal(LEGACY_DRAWINGS_STORAGE_KEY, "algoway_drawings");
  assert.equal(PRIMARY_DRAWING_SCOPE, "chart_1");
  assert.equal(createDrawingsStorageKey("chart_1"), `${DRAWINGS_SCOPE_STORAGE_PREFIX}chart_1`);
  assert.equal(createDrawingsStorageKey("chart_2"), `${DRAWINGS_SCOPE_STORAGE_PREFIX}chart_2`);
  assert.notEqual(createDrawingsStorageKey("chart_1"), createDrawingsStorageKey("chart_2"));
});

test("drawing storage keys fail closed to the primary scope and encode external separators", () => {
  assert.equal(createDrawingsStorageKey(""), `${DRAWINGS_SCOPE_STORAGE_PREFIX}chart_1`);
  assert.equal(createDrawingsStorageKey("   "), `${DRAWINGS_SCOPE_STORAGE_PREFIX}chart_1`);
  assert.equal(
    createDrawingsStorageKey("portfolio/A :: chart 7"),
    `${DRAWINGS_SCOPE_STORAGE_PREFIX}portfolio%2FA%20%3A%3A%20chart%207`,
  );
});

test("legacy global drawings migrate only into the canonical primary cell", () => {
  assert.equal(canMigrateLegacyDrawingsToScope("chart_1"), true);
  assert.equal(canMigrateLegacyDrawingsToScope(" chart_1 "), true);
  assert.equal(canMigrateLegacyDrawingsToScope(undefined), true);
  assert.equal(canMigrateLegacyDrawingsToScope("chart_2"), false);
  assert.equal(canMigrateLegacyDrawingsToScope("custom-secondary"), false);
});
