const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const gridSource = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const peerSource = read("components/technical-analysis/components/layout/FullPeerChart.tsx");
const interactionSource = read("components/technical-analysis/components/chart/ChartInteractionEngine.tsx");
const technicalSource = read("components/technical-analysis/TechnicalAnalysis.tsx");
const cursorSource = read("components/technical-analysis/hooks/useCursorRenderer.ts");
const priceAxisBadgeSource = read("components/technical-analysis/hooks/overlays/cursorPriceAxisBadge.ts");
const viewportSource = read("components/technical-analysis/hooks/viewport/viewportMath.ts");
const rendererSource = read("components/technical-analysis/hooks/useEChartsRenderer.ts");
const styleSource = read("styles/pages/_technical-analysis-final.scss");

test("multi-chart keeps one price renderer per cell and mounts interaction-only logic on the active peer", () => {
  assert.match(gridSource, /interactionOverlay=\{isActive && secondaryChartsById\[cell\.chartId\] \? children : null\}/);
  assert.match(gridSource, /activeChartInstanceRef\.current = activePeer/);
  assert.match(technicalSource, /isMultiChartMode \? \(\s*<ChartInteractionEngine/s);
  assert.match(technicalSource, /background: isMultiChartMode \? "transparent" : undefined/);
  assert.match(technicalSource, /pointerEvents: isMultiChartMode \? "none" : undefined/);
  assert.match(interactionSource, /useOverlayRenderer\(overlay\)/);
  assert.match(interactionSource, /useCursorRenderer\(cursor\)/);
  assert.doesNotMatch(interactionSource, /useEChartsRenderer/);
});

test("peer charts preserve the world-map background and robust OHLC hover fallback", () => {
  assert.match(peerSource, /gp-chart-world-map gp-peer-chart__world-map/);
  assert.match(peerSource, /resolveAxisPointerIndex/);
  assert.match(peerSource, /resolvePixelPointerIndex/);
  assert.match(peerSource, /zr\.on\("mousemove", handleCanvasMouseMove\)/);
  assert.match(peerSource, /chart\.on\("globalout", resetToLatest\)/);
});

test("active peer delegates both price-axis badges to the canonical interaction layer", () => {
  assert.match(peerSource, /\{!isActive && lastPriceY !== null/);
  assert.match(technicalSource, /<ConnectedPriceAxisOverlay \/>/);
  assert.match(technicalSource, /lastPriceBadgeRef:\s*refs\.lastPriceBadgeRef/);
  assert.match(technicalSource, /lastPriceLineRef:\s*refs\.lastPriceLineRef/);
  assert.match(technicalSource, /lastPriceAxisValue:\s*shouldRenderLastPriceAxis \? lightweightLastPrice : undefined/);
  assert.match(cursorSource, /updateCursorPriceAxisBadge/);
  assert.match(cursorSource, /updateLastPriceAxisBadge/);
  assert.match(cursorSource, /syncLastPriceAxis\(\)/);
  assert.match(priceAxisBadgeSource, /export const updateCursorPriceAxisBadge/);
  assert.match(priceAxisBadgeSource, /export const updateLastPriceAxisBadge/);
});

test("multi-chart activity is visually asymmetric while the active peer matches single-chart", () => {
  assert.match(styleSource, /--gp-chart-surface-bg:\s*rgb\(16, 42, 67\)/);
  assert.match(styleSource, /--gp-chart-inactive-surface-bg:\s*#08182a/);
  assert.match(styleSource, /\.gp-chart-layers-stack[\s\S]*?background-color:\s*var\(--gp-chart-surface-bg\)/);
  assert.match(styleSource, /\.gp-peer-chart[\s\S]*?background-color:\s*var\(--gp-chart-inactive-surface-bg\)/);
  assert.match(styleSource, /&\.is-active\s*\{[\s\S]*?background-color:\s*var\(--gp-chart-surface-bg\)/);
  assert.match(styleSource, /&:not\(\.is-active\)[\s\S]*?\.gp-cursor-crosshair-line[\s\S]*?display:\s*none\s*!important/);
  assert.match(peerSource, /data-chart-activity=\{isActive \? "active" : "inactive"\}/);
});

test("peer viewport exposes the same desktop price/time interaction classes as the canonical chart", () => {
  assert.match(peerSource, /computeTradingViewWheelZoomViewport/);
  assert.match(peerSource, /computePriceAxisWheelViewport/);
  assert.match(peerSource, /computePriceAxisDragViewport/);
  assert.match(peerSource, /computePriceAxisPan/);
  assert.match(peerSource, /mode:\s*"chart" \| "x-axis" \| "y-axis"/);
  assert.match(peerSource, /canvasEl\.addEventListener\("dblclick", onDoubleClick\)/);
  assert.match(peerSource, /viewportRef\.current\.yPan = 0/);
  assert.match(viewportSource, /export const computePriceAxisWheelViewport/);
});

test("chart mutation scheduler defers resize and option work while ECharts is in its main process", () => {
  assert.match(rendererSource, /__flagInMainProcess/);
  assert.match(rendererSource, /if \(isEChartsMainProcessActive\(chart\)\) \{\s*chartMutationRafRef\.current = requestAnimationFrame\(flushChartMutationQueue\);\s*return;/);
  assert.match(rendererSource, /scheduleChartMutation\("resize", \(targetChart\) => \{\s*targetChart\.resize\(\);/);
});
