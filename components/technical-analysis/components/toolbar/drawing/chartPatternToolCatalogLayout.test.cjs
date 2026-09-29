const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(
  path.join(process.cwd(), "components/technical-analysis/components/toolbar/drawing/DrawingToolDropdown.tsx"),
  "utf8",
);
const chartStart = source.indexOf("const CHART_PATTERN_CATALOG_SECTIONS");
const chartEnd = source.indexOf("const ANNOTATION_CATALOG_SECTIONS");
assert.notEqual(chartStart, -1);
assert.notEqual(chartEnd, -1);
const chartSource = source.slice(chartStart, chartEnd);

test("chart patterns dropdown is a flat sectioned catalog", () => {
  assert.match(chartSource, /const CHART_PATTERN_CATALOG_SECTIONS = \[/);
  assert.match(chartSource, /label: "FIGURES CHARTISTES"/);
  assert.match(chartSource, /label: "VAGUES D'ELLIOTT"/);
  assert.match(chartSource, /label: "CYCLES"/);
  assert.match(chartSource, /filterChartPatternTools\(section\.view, props\.searchQuery\)/);
  assert.doesNotMatch(chartSource, /props\.view === "categories" && \(/);
  assert.doesNotMatch(chartSource, /\["patterns", "elliott", "cycles"\]\.includes\(props\.view\)/);
});

test("chart patterns search removes empty sections", () => {
  assert.match(chartSource, /const visibleChartPatternSections = CHART_PATTERN_CATALOG_SECTIONS/);
  assert.match(chartSource, /\.filter\(\(section\) => section\.tools\.length > 0\)/);
  assert.match(chartSource, /visibleChartPatternSections\.map\(\(section, sectionIndex\) =>/);
  assert.match(chartSource, /Aucun outil trouvé/);
});

test("chart pattern tools are directly selectable and close the dropdown", () => {
  assert.match(chartSource, /props\.onSelectTool\(toolId\)/);
  assert.match(chartSource, /props\.onSearchChange\(""\)/);
  assert.match(chartSource, /props\.onClose\(\)/);
});
