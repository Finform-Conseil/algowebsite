const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const source = fs.readFileSync(path.join(process.cwd(), "components/technical-analysis/components/toolbar/drawing/DrawingToolDropdown.tsx"), "utf8");

const block = (start, end) => {
  const a = source.indexOf(start);
  const b = source.indexOf(end);
  assert.notEqual(a, -1, start);
  assert.notEqual(b, -1, end);
  return source.slice(a, b);
};

const annotation = block("const ANNOTATION_CATALOG_SECTIONS", "const FORECASTING_CATALOG_SECTIONS");
const forecasting = source.slice(source.indexOf("const FORECASTING_CATALOG_SECTIONS"));

test("annotation dropdown is a flat catalog with TEXT AND NOTES and CONTENT", () => {
  assert.match(annotation, /label: "TEXT AND NOTES"/);
  assert.match(annotation, /label: "CONTENT"/);
  assert.match(annotation, /filterAnnotationTools\(section\.view, props\.searchQuery\)/);
  assert.doesNotMatch(annotation, /renderCategoryRows|BackHeader/);
});

test("forecasting dropdown is a flat catalog with forecast, volume and measurers", () => {
  assert.match(forecasting, /label: "PRÉVISIONS"/);
  assert.match(forecasting, /label: "PROFILS DE VOLUME"/);
  assert.match(forecasting, /label: "MESUREURS"/);
  assert.match(forecasting, /filterForecastingTools\(section\.view, props\.searchQuery\)/);
  assert.doesNotMatch(forecasting, /ToolList|renderCategoryRows|BackHeader/);
});

test("remaining catalogs filter empty sections and select tools directly", () => {
  for (const section of [annotation, forecasting]) {
    assert.match(section, /\.filter\(\(section\) => section\.tools\.length > 0\)/);
    assert.match(section, /onSelectTool\(toolId\)/);
    assert.match(section, /onSearchChange\(""\)/);
    assert.match(section, /onClose\(\)/);
  }
});
