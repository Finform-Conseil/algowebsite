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
const viewportEngineSource = read("components/technical-analysis/hooks/useChartViewport.ts");
const viewportCommitSource = read("components/technical-analysis/hooks/viewport/viewportChangeCommit.ts");
const layoutSetupSource = read("components/technical-analysis/components/toolbar/LayoutSetupControl.tsx");
const rendererSource = read("components/technical-analysis/hooks/useEChartsRenderer.ts");
const volumeLegendSource = read("components/technical-analysis/components/chart/VolumeStudyLegend.tsx");
const drawingManagerSource = read("components/technical-analysis/hooks/useDrawingManager.ts");
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
  assert.match(peerSource, /reserveLastPriceAxisBadge: isActive/);
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

test("inactive peers reserve the active quote-card gutter only on the configured price-scale side", () => {
  assert.match(rendererSource, /const COMPACT_PEER_PRICE_AXIS_GUTTER_PX = 42;/);
  assert.match(rendererSource, /reserveLastPriceAxisBadge = true/);
  assert.match(rendererSource, /const mainPriceAxisGutterPx = reserveLastPriceAxisBadge \? TV_Y_AXIS_WIDTH : COMPACT_PEER_PRICE_AXIS_GUTTER_PX;/);
  assert.match(rendererSource, /const gridLeft = priceScalePosition === "left"[\s\S]*?Math\.max\(naturalGridLeft, mainPriceAxisGutterPx\)[\s\S]*?: naturalGridLeft;/);
  assert.match(rendererSource, /const gridRight = priceScalePosition === "right"[\s\S]*?\? mainPriceAxisGutterPx[\s\S]*?: COMPACT_PEER_PRICE_AXIS_GUTTER_PX;/);
  assert.match(rendererSource, /rightOffsetBars: chartAppearance\.rightOffsetBars/);
  assert.match(rendererSource, /viewportWithConfiguredRightOffset/);
  assert.match(styleSource, /&__last-badge \{[\s\S]*?width:\s*42px;[\s\S]*?min-width:\s*42px;[\s\S]*?max-width:\s*42px;/);
});

test("volume study legend auto-collapses and its x closes only the toolbar, never the Volume study", () => {
  assert.match(volumeLegendSource, /isLegendCollapsed/);
  assert.match(volumeLegendSource, /data-volume-study-legend-restore="true"/);
  assert.match(volumeLegendSource, /aria-label="Masquer la barre Volume"/);
  assert.match(volumeLegendSource, /className="gp-volume-study-legend__action is-collapse"[\s\S]*?bi bi-x-lg/);
  assert.match(volumeLegendSource, /onClick=\{\(event\) => invokeWithoutChartPropagation\(event, collapseLegend\)\}/);
  assert.match(volumeLegendSource, /window\.setTimeout\([\s\S]*?setIsLegendCollapsed\(true\)[\s\S]*?1800\)/);
  assert.match(volumeLegendSource, /onPointerEnter=\{cancelAutoCollapse\}/);
  assert.match(volumeLegendSource, /onPointerLeave=\{scheduleAutoCollapse\}/);
  assert.match(volumeLegendSource, /Supprimer Volume/);
  assert.match(volumeLegendSource, /onRemove\(\)/);
  assert.match(styleSource, /\.gp-volume-study-legend__actions \{/);
  assert.match(styleSource, /max-width: 0;/);
  assert.match(styleSource, /pointer-events: none;/);
  assert.match(styleSource, /\.gp-volume-study-legend:hover \.gp-volume-study-legend__actions/);
  assert.match(styleSource, /\.gp-volume-study-legend:focus-within \.gp-volume-study-legend__actions/);
  assert.match(styleSource, /\.gp-volume-study-legend__restore \{/);
});

test("drawing drag owns its complete pointer stream and cannot pan the chart underneath", () => {
  assert.match(drawingManagerSource, /if \(e\.cancelable\) e\.preventDefault\(\)/);
  assert.match(drawingManagerSource, /stopImmediatePropagation/);
  assert.match(drawingManagerSource, /setPointerCapture\(e\.pointerId\)/);
  assert.match(drawingManagerSource, /if \(isDraggingRef\.current && dragTargetRef\.current && isChartUsable\(dragChart\)\) \{[\s\S]*?claimDrawingPointerEvent\(e\)/);
  assert.match(drawingManagerSource, /const drawingOwnedGesture = isDraggingRef\.current[\s\S]*?if \(drawingOwnedGesture\) claimDrawingPointerEvent\(e\)/);
  assert.doesNotMatch(drawingManagerSource, /dispatchAction\(\{\s*type:\s*["']dataZoom["']/);
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

test("peer viewport delegates desktop price/time interactions to the canonical chart renderer", () => {
  assert.match(peerSource, /useEChartsRenderer\(\{/);
  assert.match(rendererSource, /useChartViewport\(\{/);
  assert.match(viewportSource, /computeTradingViewWheelZoomViewport/);
  assert.match(viewportSource, /computePriceAxisWheelViewport/);
  assert.match(viewportSource, /computePriceAxisDragViewport/);
  assert.match(viewportSource, /computePriceAxisPan/);
  assert.match(viewportEngineSource, /computeTradingViewWheelZoomViewport/);
  assert.match(viewportEngineSource, /computePriceAxisWheelViewport/);
  assert.match(viewportEngineSource, /addEventListener\("dblclick", onDoubleClick\)/);
  assert.match(viewportEngineSource, /yPan\s*=\s*0/);
});

test("chart mutation scheduler defers resize and option work while ECharts is in its main process", () => {
  assert.match(rendererSource, /__flagInMainProcess/);
  assert.match(rendererSource, /if \(isEChartsMainProcessActive\(chart\)\) \{\s*chartMutationRafRef\.current = requestAnimationFrame\(flushChartMutationQueue\);\s*return;/);
  assert.match(rendererSource, /scheduleChartMutation\("resize", \(targetChart\) => \{[\s\S]*?targetChart\.resize\(\{ width: hostWidth, height: hostHeight \}\);/);
});

test("multi-chart hover cannot retrigger the full renderer through unstable empty inputs or hidden-title mutations", () => {
  assert.match(rendererSource, /const EMPTY_COMPARISON_SERIES/);
  assert.match(rendererSource, /comparisonSeries = EMPTY_COMPARISON_SERIES/);
  assert.match(rendererSource, /const EMPTY_HIDDEN_OBJECT_IDS/);
  assert.match(rendererSource, /hiddenObjectIds = EMPTY_HIDDEN_OBJECT_IDS/);
  assert.doesNotMatch(peerSource, /comparisonSeries:\s*\[\]/);
  assert.match(cursorSource, /if \(title\?\.show === false\) \{\s*hideHtmlTooltip\(\);\s*return;/);
});

test("multi-chart viewport persistence stays outside the 60fps ECharts interaction loop", () => {
  assert.match(viewportEngineSource, /ViewportChangeCommitBuffer/);
  assert.match(viewportEngineSource, /viewportChangeCommitRef\.current\?\.schedule\(viewportEmission\)/);
  assert.doesNotMatch(viewportEngineSource, /onViewportChangeRef\.current\?\.\(viewportEmission\)/);
  assert.match(viewportCommitSource, /VIEWPORT_CHANGE_COMMIT_IDLE_MS\s*=\s*140/);
  assert.match(viewportCommitSource, /this\.pending\s*=\s*snapshot/);
  assert.match(layoutSetupSource, /MULTI_CHART_PERSISTENCE_IDLE_MS\s*=\s*280/);
  assert.match(layoutSetupSource, /window\.setTimeout\(\(\) => \{\s*void idbSet/);
});
