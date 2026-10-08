const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "../../../../..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const dropdown = read("components/technical-analysis/components/toolbar/drawing/DrawingToolDropdown.tsx");
const cursor = read("components/technical-analysis/components/toolbar/drawing/CursorModeSelector.tsx");
const toolbar = read("components/technical-analysis/components/toolbar/VerticalDrawingToolbar.tsx");
const styles = read("styles/pages/_technical-analysis-final.scss");

test("five drawing catalogs share the same selectable favorite-capable row", () => {
  for (const catalog of ["TrendToolDropdown", "FibToolDropdown", "ChartPatternsToolDropdown", "AnnotationToolDropdown", "ForecastingToolDropdown"]) {
    assert.ok(dropdown.includes("export const " + catalog));
  }
  assert.equal((dropdown.match(/<ToolRow/g) || []).length, 5);
  assert.ok(dropdown.includes("gp-drawing-tool-option-row"));
  assert.ok(dropdown.includes("gp-cursor-favorite-button"));
  assert.ok(dropdown.includes("aria-pressed={isFavorite}"));
  assert.ok(dropdown.includes("event.stopPropagation(); toggle(tool.id);"));
});

test("CSS hover is not blocked by inactive inline transparency", () => {
  assert.ok(!dropdown.includes("getActiveOptionStyle"));
  assert.ok(!cursor.includes("getActiveOptionStyle"));
  assert.ok(styles.includes(".gp-drawing-tool-option-row"));
  assert.ok(styles.includes("background: var(--surface-hover"));
  assert.ok(styles.includes(".gp-cursor-option:hover"));
});

test("favorited drawings are stored, synchronized and usable from shared floating bar", () => {
  assert.ok(dropdown.includes("finform.ta.drawing-tool-favorites.v1"));
  assert.ok(dropdown.includes('window.addEventListener("storage", onStorage)'));
  assert.ok(dropdown.includes("export const useDrawingFavorites"));
  assert.ok(cursor.includes("useDrawingFavorites()"));
  assert.ok(cursor.includes("favoriteCount = favorites.length + drawingFavorites.length"));
  assert.ok(cursor.includes("onSelectDrawingTool(toolId)"));
  assert.ok(toolbar.includes("onSelectDrawingTool={handleSelectDrawingTool}"));
  assert.ok(!dropdown.includes('title={isFavorite ?'));
});
