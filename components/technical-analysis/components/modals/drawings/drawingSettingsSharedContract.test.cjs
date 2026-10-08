const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.resolve(__dirname, "../../../../..");
const modal = fs.readFileSync(path.join(root, "components/technical-analysis/components/modals/drawings/DrawingSettingsModal.tsx"), "utf8");
const helper = fs.readFileSync(path.join(root, "components/technical-analysis/config/drawing/drawingIntervalVisibility.ts"), "utf8");
const manager = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/useDrawingManager.ts"), "utf8");
const styles = fs.readFileSync(path.join(root, "styles/pages/_technical-analysis-final.scss"), "utf8");
const model = fs.readFileSync(path.join(root, "components/technical-analysis/config/drawing/drawingModelTypes.ts"), "utf8");

test("coordinates use the dedicated non-overlapping shared grid", () => {
  assert.match(modal, /className="gp-drawing-coordinate-grid"/);
  assert.match(modal, /className="gp-drawing-coordinate-field"/);
  assert.doesNotMatch(modal, /className="d-flex gap-2">\s*<SettingsNumberInput\s*label="Barre"/);
  assert.match(styles, /\.gp-drawing-coordinate-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.gp-drawing-coordinate-field[\s\S]*?\.gp-settings-field-row[\s\S]*?display:\s*grid/);
});

test("visibility is shared by every drawing settings modal and has no placeholder branch", () => {
  assert.match(modal, /activeTab === "visibility"/);
  assert.match(modal, /DRAWING_INTERVAL_KINDS\.map/);
  assert.match(modal, /Visibilité par intervalle/);
  assert.doesNotMatch(modal, /Bientôt disponible/);
  assert.doesNotMatch(modal, /dr\.type === "signpost" \|\| dr\.type === "flag_mark" \|\| dr\.type === "image_note"/);
});

test("interval visibility is enforced by the drawing render and interaction pipeline", () => {
  assert.match(helper, /isDrawingVisibleAtInterval/);
  assert.match(helper, /if \(drawing\.hidden\) return false/);
  assert.match(manager, /renderDrawings = renderDrawings\.filter\(\(drawing\) =>\s*isDrawingVisibleAtInterval\(drawing, activeDrawingInterval\)\s*\)/);
  assert.match(manager, /spatialGridRef\.current\.build\(renderDrawings, chart\)/);
  assert.match(manager, /\[drawingCanvasRef, chartInstanceRef, drawingInteractionScopeKey, markDirty, setSelectedDrawingId, activeDrawingInterval\]/);
});

test("drawing interval catalog includes every supported chart interval including 30m", () => {
  assert.match(model, /"1m" \| "5m" \| "15m" \| "30m" \| "1H" \| "4H" \| "1D" \| "1W" \| "1M"/);
  for (const interval of ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W", "1M"]) {
    assert.match(helper, new RegExp(`"${interval}"`));
  }
});
