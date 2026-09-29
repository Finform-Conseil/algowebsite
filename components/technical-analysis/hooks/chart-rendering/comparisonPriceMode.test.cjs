const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../../../..");
const helper = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/chart-rendering/comparisonSeries.ts"), "utf8");
const renderer = fs.readFileSync(path.join(root, "components/technical-analysis/hooks/useEChartsRenderer.ts"), "utf8");
const technicalAnalysis = fs.readFileSync(path.join(root, "components/technical-analysis/TechnicalAnalysis.tsx"), "utf8");

test("comparison series use raw prices only", () => {
  assert.match(helper, /export const buildComparisonPriceValues/);
  assert.doesNotMatch(helper, /\(\(close - basePrice\) \/ basePrice\) \* 100/);
  assert.doesNotMatch(renderer, /normalizeComparisonValues/);
  assert.match(renderer, /priceValues: buildComparisonPriceValues/);
});

test("comparison axis is price-only and owns a data-sized left gutter", () => {
  assert.match(renderer, /id: "compare-yaxis"/);
  assert.match(renderer, /formatter: \(value: number\) => formatAxisPriceValue\(value\)/);
  assert.match(renderer, /resolveComparisonAxisGutterPx/);
  assert.match(renderer, /minimumDefaultTopMarginPercent = hasVisibleComparisonSeries \? 8\.5 : 5\.5/);
  assert.match(helper, /COMPARE_AXIS_MIN_GUTTER_PX = 72/);
  assert.match(helper, /COMPARE_AXIS_MAX_GUTTER_PX = 128/);
  assert.match(helper, /COMPARE_AXIS_SAFE_PADDING_PX = 8/);
  assert.doesNotMatch(renderer, /comparisonBaselineIndex/);
  assert.doesNotMatch(renderer, /scheduleComparisonBaselines/);
  assert.doesNotMatch(renderer, /updateComparisonBaselines/);
});

test("comparison strip and line are price-only UX", () => {
  assert.doesNotMatch(technicalAnalysis, /Compare %/);
  assert.match(technicalAnalysis, />Compare<\/span>/);
  assert.match(renderer, /smooth: false/);
  assert.match(renderer, /connectNulls: false/);
  assert.match(renderer, /step: false/);
  assert.match(renderer, /!seriesId\.startsWith\("compare-"\)/);
});

test("comparison uses one compact combined end label instead of stacked duplicate badges", () => {
  assert.doesNotMatch(renderer, /buildCompareSymbolMarkPoint/);
  assert.doesNotMatch(helper, /buildCompareSymbolMarkPoint/);
  assert.match(renderer, /priceLabel \? `\$\{entry\.label\}  \$\{priceLabel\}` : entry\.label/);
  assert.match(renderer, /backgroundColor: "rgba\(12, 34, 64, 0\.92\)"/);
  assert.match(renderer, /borderColor: color/);
  assert.match(renderer, /padding: \[4, 7\]/);
});
