const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const controlsSource = read("components/technical-analysis/components/layout/MultiChartCellControls.tsx");
const peerSource = read("components/technical-analysis/components/layout/FullPeerChart.tsx");
const modalSource = read("components/technical-analysis/components/modals/more-options/MoreOptionsModal.tsx");
const navigationSource = read("components/technical-analysis/components/sidebar/sidebarNavigation.ts");
const sidebarSource = read("components/technical-analysis/components/sidebar/TechnicalAnalysisSidebarContent.tsx");
const styleSource = read("styles/pages/_technical-analysis-final.scss");
const lastPriceVisualsSource = read("components/technical-analysis/lib/chart/lastPriceAxisVisuals.ts");
const priceAxisOverlaySource = read("components/technical-analysis/components/overlays/PriceAxisOverlay.tsx");

const registrySource = read("components/technical-analysis/lib/chart-types/registry/chartTypeRegistry.ts");
const registeredChartTypes = [...registrySource.matchAll(/^  ([a-z_]+): entry\(/gm)].map((match) => match[1]);

test("multi-chart exposes the canonical chart-type registry and delegates rendering to it", () => {
  assert.equal(registeredChartTypes.length, 21);
  assert.match(controlsSource, /CHART_TYPE_MENU_GROUPS\.map/);
  assert.match(controlsSource, /Object\.values\(CHART_TYPE_REGISTRY\)/);
  assert.doesNotMatch(controlsSource, /<option value="candles">/);
  assert.match(peerSource, /buildChartTypeSeries\(\{/);
  assert.match(peerSource, /\.\.\.chartTypePlan\.series/);
  assert.doesNotMatch(peerSource, /completeCell\.chartType === "line" \? "line" : "candles"/);
});

test("multi-chart renders visible horizontal and vertical grid lines", () => {
  assert.match(peerSource, /const PEER_GRID_LINE_COLOR = "rgba\(148, 163, 184, 0\.18\)"/);
  assert.equal((peerSource.match(/splitLine:\s*\{\s*show: true,\s*lineStyle: \{ color: PEER_GRID_LINE_COLOR/g) ?? []).length, 3);
});

test("multi-chart header controls override global select dimensions consistently", () => {
  assert.match(styleSource, /\.technical-analysis-root \.gp-multi-chart-cell-select \{[\s\S]*?height: 26px;[\s\S]*?min-height: 26px;[\s\S]*?border-radius: 4px;[\s\S]*?font-size: 10px;/);
  assert.match(styleSource, /\.gp-multi-chart-cell-select \{\n  flex: 0 0 auto;/);
  assert.match(styleSource, /\.gp-multi-chart-cell-select,\n\.gp-multi-chart-cell-action \{[\s\S]*?height: 26px;[\s\S]*?border-radius: 4px;/);
});

test("multi-chart reserves a right gutter wider than the canonical last-price badge", () => {
  assert.match(lastPriceVisualsSource, /LAST_PRICE_AXIS_BADGE_WIDTH_PX = 80/);
  assert.match(lastPriceVisualsSource, /LAST_PRICE_AXIS_GUTTER_PX = LAST_PRICE_AXIS_BADGE_WIDTH_PX \+ 16/);
  assert.match(priceAxisOverlaySource, /LAST_PRICE_AXIS_BADGE_WIDTH_PX\}px/);
  assert.equal((peerSource.match(/LAST_PRICE_AXIS_GUTTER_PX/g) ?? []).length, 7);
  assert.doesNotMatch(peerSource, /PEER_Y_AXIS_WIDTH/);
});

test("more-options cards navigate to real sidebar destinations without alerts or inert apply action", () => {
  assert.match(modalSource, /hideFooter/);
  assert.match(modalSource, /openTechnicalAnalysisSidebarDestination\(destination\)/);
  assert.doesNotMatch(modalSource, /alert\s*\(/);
  for (const destination of ["fundamentals", "profile", "news", "calendar"]) {
    assert.match(modalSource, new RegExp(`destination: "${destination}"`));
  }
  assert.match(navigationSource, /new CustomEvent\(TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE/);
  assert.match(sidebarSource, /addEventListener\(TECHNICAL_ANALYSIS_SIDEBAR_NAVIGATE/);
  assert.match(sidebarSource, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
});
