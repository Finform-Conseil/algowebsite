const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "../../../..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const vela = read("node_modules/@luxalgo/vela/dist/chunk-PTNO3YK2.js");
const viewportSource = read("components/technical-analysis/hooks/viewport/viewportMath.ts");
const controllerSource = read("components/technical-analysis/hooks/useChartViewport.ts");
const rendererSource = read("components/technical-analysis/hooks/useEChartsRenderer.ts");
const axisSource = read("components/technical-analysis/hooks/chart-rendering/chartHistoryAxisAlignment.ts");
const technicalAnalysisSource = read("components/technical-analysis/TechnicalAnalysis.tsx");
const velaAdapterSource = read("components/technical-analysis/engine-v2/react/VelaChartAdapter.tsx");
const visualContractSource = read("components/technical-analysis/config/velaVisualContract.ts");
const cursorRendererSource = read("components/technical-analysis/hooks/useCursorRenderer.ts");

const compiled = ts.transpileModule(viewportSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", "require", compiled)(mod, mod.exports, require);

const {
  TV_ZOOM_VELOCITY,
  TV_TIME_AXIS_DRAG_ZOOM_VELOCITY,
  TV_ZOOM_EASE_TAU_MS,
  TV_AUTOSCALE_EASE_TAU_MS,
  TV_PAN_MOMENTUM_TAU_MS,
  TV_PAN_FLING_MIN_VELOCITY_PX_PER_MS,
  TV_PAN_FLING_MAX_AGE_MS,
  TV_PAN_STOP_VELOCITY_PX_PER_MS,
  TV_MIN_VISIBLE_BARS,
  TV_Y_AXIS_WIDTH,
  TV_X_AXIS_HEIGHT,
  computeTradingViewWheelZoomViewport,
  computeVelaPinchViewport,
  computeHorizontalPanViewport,
  clampViewportWindowWithFuture,
} = mod.exports;

const near = (actual, expected, epsilon = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
};

test("oracle Vela 0.7.2 exposes the exact interaction contract we replicate", () => {
  assert.match(vela, /var FLING_MIN_SPEED = 0\.04;/);
  assert.match(vela, /var FLING_STALE_MS = 60;/);
  assert.match(vela, /var DRAG_SLOP = 2;/);
  assert.match(vela, /var TOUCH_SLOP = 8;/);
  assert.match(vela, /var TIME_SCALE_K = 4e-3;/);
  assert.match(vela, /var WHEEL_ZOOM_K = 4e-3;/);
  assert.match(vela, /var WHEEL_PRICE_DRAG_PX = 0\.25;/);
  assert.match(vela, /this\.rightEdgeZoom = true;/);
  assert.match(vela, /return Math\.abs\(deltaX\) > Math\.abs\(deltaY\);/);
  assert.match(vela, /if \(shift2\) return deltaY;/);
  assert.match(vela, /this\.vx = this\.vx \* 0\.6 \+ inst \* 0\.4;/);
  assert.match(vela, /this\.deps\.fling\(-this\.vx \/ pitch\);/);
  assert.match(vela, /el\.style\.touchAction = "none";/);
  assert.match(vela, /Math\.min\(dt, 64\)/);
});

test("Vela native Volume visual contract is replicated structurally in ECharts", () => {
  assert.match(vela, /var VOLUME_FILL_ALPHA = 0\.5;/);
  assert.match(vela, /var VOLUME_PANE_FILL_FRAC = 0\.96;/);
  assert.match(vela, /Math\.floor\(barSpacing \* 0\.7\) \/ 2/);
  assert.match(vela, /var DEFAULT_HEIGHT_PCT = 20;/);
  assert.match(vela, /paneHint: "price"/);
  assert.match(vela, /overlay: true/);
  assert.match(rendererSource, /id: "volume-yaxis"[\s\S]*?gridIndex: 0/);
  assert.doesNotMatch(rendererSource, /id: "volume-xaxis"/);
  assert.match(rendererSource, /VELA_VOLUME_FILL_ALPHA/);
  assert.match(rendererSource, /VELA_VOLUME_BAR_WIDTH_RATIO \* 100/);
  assert.match(rendererSource, /resolveVisibleVolumeOverlayAxisMax/);
  assert.match(controllerSource, /id: 'volume-yaxis'[\s\S]*?resolveVisibleVolumeOverlayAxisMax\(chartData, state\.startIdx, state\.endIdx\)/);
});

test("ECharts time axis and price chips follow Vela chrome geometry", () => {
  assert.match(rendererSource, /timeAxisTargetTickCount = clamp\(Math\.floor\(timeAxisPlotWidthPx \/ 64\), 3, 8\)/);
  assert.match(rendererSource, /timeAxisLabelInterval/);
  assert.match(rendererSource, /showMinLabel: false/);
  assert.match(rendererSource, /showMaxLabel: false/);
  assert.match(rendererSource, /chartContainerWidthPx: stockChartRef\.current\?\.clientWidth \?\? 1280/);
});

test("FINFORM skin is decoupled from Vela mechanics without rewriting custom backgrounds", () => {
  assert.match(visualContractSource, /solidBackground: "#102a43"/);
  assert.match(visualContractSource, /gradientBottom: "#0b1f33"/);
  assert.match(visualContractSource, /gridLine: "#334155"/);
  assert.match(visualContractSource, /normalized === VELA_VISUAL_CONTRACT\.background\.toLowerCase\(\)/);
  assert.match(rendererSource, /resolveFinformSkinBackground\([\s\S]*?chartAppearance\.backgroundColor/);
  assert.doesNotMatch(rendererSource, /resolveVelaParityToken\(chartAppearance\.backgroundColor/);
  assert.match(rendererSource, /resolveFinformSkinGridLine\(chartAppearance\.gridLineColor/);
  assert.doesNotMatch(rendererSource, /resolveVelaParityToken\(chartAppearance\.gridLineColor/);
});

test("price-axis interactive controls survive the global cursor capture lifecycle", () => {
  assert.match(cursorRendererSource, /isPriceAxisInteractiveTarget/);
  assert.match(cursorRendererSource, /handlePointerMove[\s\S]*?if \(isPriceAxisInteractiveTarget\(event\.target\)\) return/);
  assert.match(cursorRendererSource, /handlePointerDown[\s\S]*?if \(isPriceAxisInteractiveTarget\(event\.target\)\)[\s\S]*?pointerGestureActiveRef\.current = false;[\s\S]*?return;/);
});

test("initial viewport never hides loaded history behind synthetic left whitespace", () => {
  assert.match(viewportSource, /const leftEdgeLogical = fitAllData[\s\S]*?Math\.max\(0, rightEdgeLogical - \(plotWidthPx \/ barSpacingPx\)\)/);
  assert.match(rendererSource, /hasAnchoredZoomRange[\s\S]*?Number\.isFinite\(zoomRange\?\.barsFromRightStart\)[\s\S]*?fitAllData/);
  assert.match(rendererSource, /fitInitialData: uiState\.selectedTimeRange === "Tout"/);
  assert.match(controllerSource, /fitAllBecameActive = fitInitialData && !lastFitInitialDataRef\.current/);
  assert.match(controllerSource, /wasStillFitAllBeforePrepend[\s\S]*?Math\.abs\(state\.startIdx\) <= 1e-6[\s\S]*?state\.endIdx >= \(lastLen - 1\) - 1e-6/);
  assert.match(controllerSource, /pendingTimeViewportInteractionRef = useRef\(false\)/);
  assert.match(controllerSource, /shouldRefitAllAfterPrepend =[\s\S]*?fitInitialData[\s\S]*?!pendingTimeViewportInteractionRef\.current[\s\S]*?wasStillFitAllBeforePrepend/);
  assert.match(controllerSource, /pendingTimeViewportInteractionRef\.current = true;[\s\S]*?pendingWheelDelta/);
  assert.match(controllerSource, /state\.startIdx = nextViewport\.startIdx;[\s\S]*?state\.endIdx = nextViewport\.endIdx;[\s\S]*?pendingTimeViewportInteractionRef\.current = false;/);
  assert.match(controllerSource, /fitInitialData && \(lastLen === 0 \|\| currentLen < lastLen \|\| fitAllBecameActive \|\| shouldRefitAllAfterPrepend\)/);
  assert.match(controllerSource, /else if \(isHistoryPrepend\)[\s\S]*?reconcileViewportAfterHistoryPrepend/);
});

test("ECharts constants are numerically locked to Vela", () => {
  assert.equal(TV_ZOOM_VELOCITY, 0.004);
  assert.equal(TV_TIME_AXIS_DRAG_ZOOM_VELOCITY, 0.004);
  assert.equal(TV_ZOOM_EASE_TAU_MS, 70);
  assert.equal(TV_AUTOSCALE_EASE_TAU_MS, 80);
  assert.equal(TV_PAN_MOMENTUM_TAU_MS, 110);
  assert.equal(TV_PAN_FLING_MIN_VELOCITY_PX_PER_MS, 0.04);
  assert.equal(TV_PAN_FLING_MAX_AGE_MS, 60);
  assert.equal(TV_PAN_STOP_VELOCITY_PX_PER_MS, 0.02);
  assert.equal(TV_MIN_VISIBLE_BARS, 2);
  assert.equal(TV_Y_AXIS_WIDTH, 64);
  assert.equal(TV_X_AXIS_HEIGHT, 22);
});

test("ECharts keeps autoscale frame-paced and avoids corrective second-frame paint", () => {
  assert.match(controllerSource, /easeAutoScaleRange\(currentRange, autoscaleTarget, deltaMs\)/);
  assert.match(controllerSource, /state\.renderedYMin = finalMin;/);
  assert.match(controllerSource, /state\.renderedYMax = finalMax;/);
  assert.match(controllerSource, /scheduleChartMutation\("viewport", commitViewport\)/);
  assert.match(controllerSource, /matching Vela's Scheduler semantics/);
  assert.match(rendererSource, /Number\.isFinite\(liveViewport\?\.renderedYMin\)/);
  assert.match(rendererSource, /min: liveViewport\.renderedYMin/);
  assert.match(rendererSource, /max: liveViewport\.renderedYMax/);
  const fullOptionBlock = rendererSource.match(/scheduleChartMutation\("full-option",[\s\S]*?scheduleVisualReadyFallback\(\);/)?.[0] ?? "";
  assert.doesNotMatch(fullOptionBlock, /applyViewport\("immediate"\)/);
});

test("ordinary wheel uses Vela right-edge anchoring and native deltas", () => {
  assert.match(controllerSource, /pendingWheelAnchorRatio = \(event\.ctrlKey \|\| event\.metaKey\) \? cursorRatio : 1/);
  assert.match(controllerSource, /const rawWheelDeltaY = event\.deltaY;/);
  assert.match(controllerSource, /const rawWheelDeltaX = event\.deltaX;/);
  assert.doesNotMatch(controllerSource, /normalizeWheelDeltaPx\(event\.deltaY/);

  const result = computeTradingViewWheelZoomViewport({
    startIdx: 20,
    endIdx: 100,
    totalBars: 200,
    deltaY: -40,
    cursorRatio: 1,
    maxHistoryGapBars: 80,
    maxFutureBars: 80,
  });
  near(result.endIdx, 100);
  near(result.endIdx - result.startIdx, 80 / Math.exp(0.16));
});

test("Ctrl/Cmd wheel pins the logical candle under the cursor", () => {
  const startIdx = 20;
  const endIdx = 100;
  const ratio = 0.25;
  const logical = startIdx + (endIdx - startIdx) * ratio;
  const result = computeTradingViewWheelZoomViewport({
    startIdx,
    endIdx,
    totalBars: 200,
    deltaY: -35,
    cursorRatio: ratio,
    maxHistoryGapBars: 80,
    maxFutureBars: 80,
  });
  near(result.startIdx + (result.endIdx - result.startIdx) * ratio, logical);
});

test("horizontal trackpad and Shift+wheel follow Vela wheelPanDelta semantics", () => {
  assert.match(controllerSource, /Math\.abs\(rawWheelDeltaX\) > Math\.abs\(rawWheelDeltaY\)/);
  assert.match(controllerSource, /event\.shiftKey\s*\?\s*rawWheelDeltaY/);
  assert.match(controllerSource, /if \(deltaX !== 0\)/);
  assert.match(controllerSource, /cancelZoomGlide\(\)/);

  const pan = computeHorizontalPanViewport({
    startIdx: 20,
    endIdx: 100,
    totalBars: 200,
    shift: 7.5,
    maxHistoryGapBars: 80,
    maxFutureBars: 80,
  });
  near(pan.startIdx, 27.5);
  near(pan.endIdx, 107.5);
});

test("drag is based on gesture origin and fling is pointer-type agnostic", () => {
  assert.match(controllerSource, /const deltaXFromStart = event\.clientX - state\.startX;/);
  assert.match(controllerSource, /const instantaneousDeltaX = event\.clientX - state\.lastPanX;/);
  assert.match(controllerSource, /state\.panStartIdx = state\.startIdx;/);
  assert.match(controllerSource, /state\.panStartEnd = state\.endIdx;/);
  assert.match(controllerSource, /if \(wasPanGesture && lastPanAgeMs <= TV_PAN_FLING_MAX_AGE_MS\)/);
  assert.doesNotMatch(controllerSource, /wasPanGesture && event\.pointerType === "touch"/);
});

test("pinch matches Vela distance-ratio scaling and midpoint pinning", () => {
  assert.match(vela, /startBarSpacing \* \(dist \/ Math\.max\(1, startDist\)\)/);
  assert.match(controllerSource, /computeVelaPinchViewport\(/);

  const result = computeVelaPinchViewport({
    startIdx: 20,
    endIdx: 100,
    totalBars: 200,
    startDistance: 100,
    currentDistance: 160,
    anchorLogical: 60,
    currentMidpointRatio: 0.4,
    maxHistoryGapBars: 80,
    maxFutureBars: 80,
  });
  near(result.endIdx - result.startIdx, 50);
  near(result.startIdx + 50 * 0.4, 60);
});

test("viewport stays fractional from interaction math through ECharts dataZoom projection", () => {
  const result = clampViewportWindowWithFuture(20.25, 100.75, 200, 80, 80);
  near(result.startIdx, 20.25);
  near(result.endIdx, 100.75);
  assert.match(axisSource, /Preserve fractional logical coordinates/);
  assert.doesNotMatch(axisSource, /safeHistoryGap \+ Math\.round\(sourceStartIdx\)/);
});

test("both primary engines prevent browser-native touch interference", () => {
  assert.match(technicalAnalysisSource, /data-engine-adapter="legacy-echarts"[\s\S]*touchAction: "none"/);
  assert.match(velaAdapterSource, /touchAction: "none"/);
  assert.match(velaAdapterSource, /overscrollBehavior: "contain"/);
});

test("pointercancel aborts the interaction without synthesizing a fling", () => {
  assert.match(controllerSource, /const onPointerCancel = \(event: PointerEvent\) => \{/);
  assert.match(controllerSource, /state\.activePointers\.clear\(\)/);
  assert.match(controllerSource, /state\.initialPinchDistance = 0;/);
  assert.match(controllerSource, /state\.initialPinchSpan = 0;/);
  assert.match(controllerSource, /state\.panVelocityPxPerMs = 0;/);
  assert.match(controllerSource, /cancelPanMomentum\(\)/);
  const cancelBlock = controllerSource.match(
    /const onPointerCancel = \(event: PointerEvent\) => \{[\s\S]*?\n    \};/,
  )?.[0] ?? "";
  assert.doesNotMatch(cancelBlock, /startPanMomentum\(\)/);
});

test("navigation remains outside global Undo/Redo history", () => {
  const chartHistory = read("components/technical-analysis/hooks/useChartHistory.ts");
  assert.doesNotMatch(chartHistory, /startIdx|endIdx|rightOffset|barSpacing/);
});
