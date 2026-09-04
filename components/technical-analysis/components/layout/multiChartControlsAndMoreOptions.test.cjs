const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const controlsSource = read("components/technical-analysis/components/layout/MultiChartCellControls.tsx");
const peerSource = read("components/technical-analysis/components/layout/FullPeerChart.tsx");
const layoutGridSource = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const rendererSource = read("components/technical-analysis/hooks/useEChartsRenderer.ts");
const historyAlignmentSource = read("components/technical-analysis/hooks/chart-rendering/chartHistoryAxisAlignment.ts");
const modalSource = read("components/technical-analysis/components/modals/more-options/MoreOptionsModal.tsx");
const navigationSource = read("components/technical-analysis/components/sidebar/sidebarNavigation.ts");
const sidebarSource = read("components/technical-analysis/components/sidebar/TechnicalAnalysisSidebarContent.tsx");
const styleSource = read("styles/pages/_technical-analysis-final.scss");
const lastPriceVisualsSource = read("components/technical-analysis/lib/chart/lastPriceAxisVisuals.ts");
const priceAxisOverlaySource = read("components/technical-analysis/components/overlays/PriceAxisOverlay.tsx");
const chartTypeIconsSource = read("components/technical-analysis/components/toolbar/chart/chartTypeIcons.tsx");
const chartTypeMenuSource = read("components/technical-analysis/components/toolbar/chart/ChartTypeMenuContent.tsx");
const toolbarSource = read("components/technical-analysis/components/toolbar/ChartToolbar.tsx");

const registrySource = read("components/technical-analysis/lib/chart-types/registry/chartTypeRegistry.ts");
const registeredChartTypes = [...registrySource.matchAll(/^  ([a-z_]+): entry\(/gm)].map((match) => match[1]);

test("multi-chart exposes the canonical chart-type registry and delegates rendering to it", () => {
  assert.equal(registeredChartTypes.length, 21);
  assert.match(controlsSource, /ChartTypeMenuContent/);
  assert.match(chartTypeMenuSource, /CHART_TYPE_MENU_SECTIONS\.map/);
  assert.match(chartTypeMenuSource, /CHART_TYPE_REGISTRY\[chartTypeId\]/);
  assert.match(controlsSource, /FloatingMenu/);
  assert.match(controlsSource, /gp-chart-type-menu gp-multi-chart-type-menu/);
  assert.match(chartTypeMenuSource, /role="menuitemradio"/);
  assert.match(controlsSource, /renderChartTypeIcon\(chartType\)/);
  assert.match(toolbarSource, /ChartTypeMenuContent/);
  assert.doesNotMatch(controlsSource, /Synthétique/);
  assert.doesNotMatch(toolbarSource, /Synthétique/);
  assert.doesNotMatch(controlsSource, /<option value="candles">/);
  assert.match(peerSource, /useEChartsRenderer\(\{/);
  assert.match(rendererSource, /buildChartTypeSeries\(\{/);
  assert.match(rendererSource, /alignCustomRenderItemWithHistoryAxis/);
  assert.match(historyAlignmentSource, /ECharts applies dataZoom filtering before `renderItem\(\)` runs/);
  assert.match(historyAlignmentSource, /api\.value\(0\).*stays unshifted for renderer lookups/);
  assert.doesNotMatch(peerSource, /completeCell\.chartType === "line" \? "line" : "candles"/);
});

test("chart-type selector preserves the professional trading order and distinct semantic glyphs", () => {
  const expectedOrder = [
    "bars", "candles", "hollow_candles", "volume_candles",
    "line", "line_with_markers", "step_line", "area", "hlc_area", "baseline", "columns", "high_low",
    "volume_footprint", "time_price_opportunity", "session_volume_profile",
    "heikin_ashi", "renko", "line_break", "kagi", "point_and_figure", "range",
  ];
  const menuSectionStart = registrySource.indexOf("export const CHART_TYPE_MENU_SECTIONS");
  const menuSectionEnd = registrySource.indexOf("export const CHART_TYPE_MENU_ORDER");
  const menuSectionSource = registrySource.slice(menuSectionStart, menuSectionEnd);
  let previousIndex = -1;
  for (const chartType of expectedOrder) {
    const nextIndex = menuSectionSource.indexOf(`\"${chartType}\"`);
    assert.ok(nextIndex > previousIndex, `${chartType} must keep its canonical menu position`);
    previousIndex = nextIndex;
    assert.match(chartTypeIconsSource, new RegExp(`case \\\"${chartType}\\\"`));
  }
  assert.doesNotMatch(chartTypeIconsSource, /chartBodyIconTypes/);
  assert.doesNotMatch(chartTypeMenuSource, /gp-chart-type-menu-title/);
  assert.match(chartTypeMenuSource, /syntheticBadge/);
  assert.match(chartTypeMenuSource, /approximateTooltip/);
});

test("multi-chart delegates visible horizontal and vertical grid lines to the canonical renderer", () => {
  assert.match(peerSource, /useEChartsRenderer\(\{/);
  assert.match(rendererSource, /const subtleHorizontalGrid = \{/);
  assert.match(rendererSource, /const subtleVerticalGrid = \{/);
  assert.match(rendererSource, /splitLine: subtleHorizontalGrid/);
  assert.match(rendererSource, /splitLine: subtleVerticalGrid/);
});

test("multi-chart resize reconciliation compares the host against the actual ECharts surface", () => {
  assert.match(rendererSource, /targetChart\.getWidth\(\)/);
  assert.match(rendererSource, /targetChart\.getHeight\(\)/);
  assert.match(rendererSource, /container\.clientWidth/);
  assert.match(rendererSource, /container\.clientHeight/);
  assert.match(rendererSource, /targetChart\.resize\(\{ width: hostWidth, height: hostHeight \}\)/);
  assert.doesNotMatch(rendererSource, /let observedWidth = container\.clientWidth/);
});

test("multi-chart header controls override global select dimensions consistently", () => {
  assert.match(styleSource, /\.technical-analysis-root \.gp-multi-chart-cell-select \{[\s\S]*?height: 26px;[\s\S]*?min-height: 26px;[\s\S]*?border-radius: 4px;[\s\S]*?font-size: 10px;/);
  assert.match(styleSource, /\.gp-multi-chart-cell-select \{\n  flex: 0 0 auto;/);
  assert.match(styleSource, /\.gp-multi-chart-chart-type-trigger \{[\s\S]*?width: 128px;[\s\S]*?display: inline-flex;/);
  assert.match(styleSource, /\.gp-chart-type-menu \{[\s\S]*?scrollbar-width: thin;[\s\S]*?::-webkit-scrollbar-thumb/);
  assert.match(styleSource, /\.gp-multi-chart-cell-select,\n\.gp-multi-chart-cell-action \{[\s\S]*?height: 26px;[\s\S]*?border-radius: 4px;/);
});

test("multi-chart keeps provenance badges out of the header and moves OHLC into the plot overlay", () => {
  const headerIndex = peerSource.indexOf('className="gp-peer-chart__header"');
  const canvasIndex = peerSource.indexOf('className="gp-peer-chart__canvas"');
  const ohlcOverlayIndex = peerSource.indexOf('className="gp-peer-chart__ohlc-overlay"');
  assert.ok(headerIndex >= 0);
  assert.ok(canvasIndex > headerIndex);
  assert.ok(ohlcOverlayIndex > canvasIndex);
  assert.doesNotMatch(controlsSource, /SOURCE_LABELS|gp-multi-chart-source-badge|dataSource/);
  assert.match(styleSource, /\.gp-peer-chart__ohlc-overlay \{/);
  assert.match(styleSource, /\.layout-four-grid,[\s\S]*?\.layout-sixteen-grid[\s\S]*?\.gp-peer-chart__ohlc-overlay \{\n  display: none;/);
  assert.match(styleSource, /\.gp-multi-chart-grid\.is-maximized \.gp-peer-chart__ohlc-overlay \{\n  display: flex;/);
  assert.match(styleSource, /@container gp-chart-slot \(max-width: 460px\)/);
  assert.match(styleSource, /@container gp-chart-slot \(max-width: 460px\)[\s\S]*?\.gp-multi-chart-chart-type-label,[\s\S]*?display: none;/);
  assert.match(styleSource, /@container gp-chart-slot \(max-width: 460px\)[\s\S]*?\.gp-peer-chart__interval,[\s\S]*?display: none;/);
});

test("multi-chart gives OHLC and indicator legends separate responsive metadata lanes", () => {
  assert.match(rendererSource, /LegendScrollComponent/);
  assert.match(rendererSource, /legendLayoutMode !== "default"/);
  assert.match(rendererSource, /type: "scroll" as const/);
  assert.match(rendererSource, /top: isCompactPeerLegendLayout \? 5 : 34/);
  assert.match(rendererSource, /right: gridRight \+ 4/);
  assert.match(peerSource, /legendLayoutMode: isCompactMeta \? "peer-compact" : "peer-stacked"/);
  assert.match(peerSource, /width <= 460 \|\| height <= 360/);
  assert.match(peerSource, /data-chart-meta-density=\{isCompactMeta \? "compact" : "stacked"\}/);
  assert.match(layoutGridSource, /metaDensity=\{!maximizedChartId && renderedCharts\.length >= 4 \? "dense" : "comfortable"\}/);
  assert.match(styleSource, /\.gp-peer-chart\.is-meta-compact \.gp-peer-chart__ohlc-overlay \{\n  display: none;/);
  assert.match(styleSource, /@media \(max-width: 720px\)[\s\S]*?\.gp-multi-chart-grid:not\(\.is-maximized\)[\s\S]*?grid-template-columns: minmax\(0, 1fr\) !important;[\s\S]*?grid-auto-rows: minmax\(280px, 58vh\);[\s\S]*?overflow-y: auto;/);
  assert.match(styleSource, /\.gp-multi-chart-grid\.layout-three-focus-right:not\(\.is-maximized\) \.gp-multi-chart-slot\.is-active \{\n    grid-row: auto;/);
});

test("multi-chart shares the canonical 78px TradingView-like price scale contract", () => {
  assert.match(lastPriceVisualsSource, /LAST_PRICE_AXIS_BADGE_WIDTH_PX = 78/);
  assert.match(lastPriceVisualsSource, /LAST_PRICE_AXIS_GUTTER_PX = 78/);
  assert.match(priceAxisOverlaySource, /LAST_PRICE_AXIS_BADGE_WIDTH_PX\}px/);
  assert.match(rendererSource, /const gridRight = reserveLastPriceAxisBadge \? TV_Y_AXIS_WIDTH : COMPACT_PEER_PRICE_AXIS_GUTTER_PX;/);
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
