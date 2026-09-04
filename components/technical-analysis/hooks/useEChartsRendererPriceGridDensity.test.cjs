/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { projectRoot } = require("../store/__tests__/testTypeScriptLoader.cjs");

const rendererSource = fs.readFileSync(
  path.join(projectRoot, "components/technical-analysis/hooks/useEChartsRenderer.ts"),
  "utf8",
);

test("price pane grid density is capped when lower panes are visible", () => {
  assert.match(
    rendererSource,
    /const MAX_PRICE_AXIS_SPLIT_LINES_WITH_LOWER_PANES = 4;/,
    "multi-pane charts must keep the candlestick price pane visually light",
  );
  assert.match(
    rendererSource,
    /const MAX_PRICE_AXIS_SPLIT_LINES_SINGLE_PANE = 6;/,
    "single-pane charts may keep a slightly denser standalone price scale",
  );
  assert.match(
    rendererSource,
    /const maxPriceAxisSplitLines = panelCount > 0\s*\?\s*MAX_PRICE_AXIS_SPLIT_LINES_WITH_LOWER_PANES\s*:\s*MAX_PRICE_AXIS_SPLIT_LINES_SINGLE_PANE;/,
    "the price grid cap must depend on lower pane presence",
  );
  assert.match(
    rendererSource,
    /const priceAxisSplitNumber = Math\.min\(\s*resolvePriceAxisSplitNumber\(chartContainerHeightPx, mainGridHeightPercent\),\s*maxPriceAxisSplitLines,\s*\);/,
    "the price y-axis split count must be capped after the responsive pane calculation",
  );
});

test("lower panes keep the shared horizontal grid contract", () => {
  const splitLineMatches = [...rendererSource.matchAll(/splitLine: subtleHorizontalGrid/g)];

  assert.ok(
    splitLineMatches.length >= 3,
    "price, volume and oscillator y-axes should remain independently wired to the shared horizontal grid setting",
  );
});
