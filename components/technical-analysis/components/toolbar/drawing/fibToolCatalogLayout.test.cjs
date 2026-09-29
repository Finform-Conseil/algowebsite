const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
  path.join(process.cwd(), "components/technical-analysis/components/toolbar/drawing/DrawingToolDropdown.tsx"),
  "utf8",
);
const fibStart = source.indexOf("const FIB_CATALOG_SECTIONS");
const fibEnd = source.indexOf("export const ChartPatternsToolDropdown");
assert.notEqual(fibStart, -1);
assert.notEqual(fibEnd, -1);
const fibSource = source.slice(fibStart, fibEnd);

test("fib dropdown is a flat scrollable catalog", () => {
  assert.match(fibSource, /const FIB_CATALOG_SECTIONS = \[/);
  assert.match(fibSource, /label: "FIBONACCI"/);
  assert.match(fibSource, /label: "GANN"/);
  assert.match(fibSource, /getFibDropdownTools\(section\.view\)/);
  assert.doesNotMatch(fibSource, /props\.view === "categories" && \(/);
  assert.doesNotMatch(fibSource, /\["fibonacci", "gann"\]\.includes\(props\.view\)/);
});

test("fib catalog search filters tools while retaining matching sections only", () => {
  assert.match(fibSource, /const fibQuery = props\.searchQuery\.trim\(\)\.toLowerCase\(\)/);
  assert.match(fibSource, /const visibleFibSections = FIB_CATALOG_SECTIONS/);
  assert.match(fibSource, /\.filter\(\(section\) => section\.tools\.length > 0\)/);
  assert.match(fibSource, /visibleFibSections\.map\(\(section, sectionIndex\) =>/);
  assert.match(fibSource, /Aucun outil trouvé/);
});

test("fib catalog tools are directly selectable and close the dropdown", () => {
  assert.match(fibSource, /props\.onSelectTool\(toolId\)/);
  assert.match(fibSource, /props\.onSearchChange\(""\)/);
  assert.match(fibSource, /props\.onClose\(\)/);
});
