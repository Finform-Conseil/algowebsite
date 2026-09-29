const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const source = fs.readFileSync(path.join(process.cwd(), "components/technical-analysis/components/toolbar/drawing/DrawingToolDropdown.tsx"), "utf8");
test("drawing dropdown is one flat scrollable catalog merging trend and brush families", () => {
  assert.match(source, /DRAWING_CATALOG_SECTIONS/);
  for (const label of ["LIGNES ET MESURES", "CANAUX", "FOURCHETTES", "BROSSES", "FLÈCHES", "FORMES"]) {
    assert.ok(source.includes(`label: "${label}"`), `missing unified drawing section: ${label}`);
  }
  assert.match(source, /filteredTrendTools\.filter\(\(tool\) => tool\.category === section\.category\)/);
  assert.match(source, /filterBrushTools\(section\.view, searchQuery\)/);
  assert.doesNotMatch(source, /export const BrushToolDropdown/);
  assert.doesNotMatch(source, /view === "categories" && renderCategoryRows\(\[/);
  assert.doesNotMatch(source, /BackHeader title=\{view === "drawing_tools"/);
});
test("unified drawing catalog search filters tools while preserving only matching section headers", () => {
  assert.match(source, /const visibleSections = DRAWING_CATALOG_SECTIONS/);
  assert.match(source, /\.filter\(\(section\) => section\.tools\.length > 0\)/);
  assert.match(source, /visibleSections\.map\(\(section, sectionIndex\) =>/);
  assert.match(source, /Aucun outil trouvé/);
});
test("unified drawing catalog tools are directly selectable and close the dropdown", () => {
  assert.match(source, /onSelectTool\(toolId\)/);
  assert.match(source, /onSearchChange\(""\)/);
  assert.match(source, /onClose\(\)/);
});
