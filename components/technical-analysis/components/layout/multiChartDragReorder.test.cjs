/* eslint-env node */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

require("../../store/__tests__/testTypeScriptLoader.cjs");

const {
  technicalAnalysisSlice,
  swapLayoutCharts,
} = require("../../store/technicalAnalysisSlice.ts");
const { completeMultiChartLayout } = require("../../config/layout/multiChartCellState.ts");
const { resolveMultiChartDropTargetFromRects } = require("./multiChartDragTarget.ts");

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const gridSource = read("components/technical-analysis/components/layout/MultiChartLayoutGrid.tsx");
const styleSource = read("styles/pages/_technical-analysis-final.scss");
const peerSource = read("components/technical-analysis/components/layout/FullPeerChart.tsx");

const createCell = ({
  chartId,
  symbol,
  timeframe,
  active = false,
  drawingScope,
  viewportStart,
  indicator,
}) => ({
  chartId,
  symbol,
  exchange: "BRVM",
  interval: timeframe,
  indicators: [indicator],
  isActive: active,
  sourceKind: "equity",
  sourceId: `${symbol}-source`,
  chartType: "candles",
  timeframe,
  dateRange: "Tout",
  viewport: {
    startTime: viewportStart,
    endTime: "2026-08-31T00:00:00.000Z",
    yScale: 1.25,
    isYManual: true,
  },
  drawingScope,
  indicatorState: null,
  dataSource: "native",
});

const createTwoChartState = () => {
  const state = structuredClone(technicalAnalysisSlice.getInitialState());
  state.chartConfig.symbol = "ORANGE_CI";
  state.chartConfig.timeframe = "1D";
  state.chartConfig.indicators.sma = false;
  state.chartConfig.indicators.volume = true;
  state.ui.multiChartLayout = completeMultiChartLayout({
    layoutId: "two_horizontal",
    name: "2 charts",
    isEnabled: true,
    sync: {
      symbol: false,
      interval: false,
      crosshair: false,
      time: false,
      dateRange: false,
    },
    activeChartId: "chart_1",
    maximizedChartId: null,
    charts: [
      createCell({
        chartId: "chart_1",
        symbol: "ORANGE_CI",
        timeframe: "1D",
        active: true,
        drawingScope: "draw-orange",
        viewportStart: "2025-01-01T00:00:00.000Z",
        indicator: "volume",
      }),
      createCell({
        chartId: "chart_2",
        symbol: "SNTS",
        timeframe: "1W",
        drawingScope: "draw-snts",
        viewportStart: "2024-01-01T00:00:00.000Z",
        indicator: "sma",
      }),
    ],
  });
  return state;
};

test("swapLayoutCharts moves complete panel state while slot identities remain stable", () => {
  const before = createTwoChartState();
  const after = technicalAnalysisSlice.reducer(
    before,
    swapLayoutCharts({ sourceChartId: "chart_1", targetChartId: "chart_2" }),
  );

  const [left, right] = after.ui.multiChartLayout.charts;
  assert.equal(left.chartId, "chart_1");
  assert.equal(right.chartId, "chart_2");
  assert.equal(left.symbol, "SNTS");
  assert.equal(left.interval, "1W");
  assert.deepEqual(left.indicators, ["sma"]);
  assert.equal(left.drawingScope, "draw-snts");
  assert.equal(left.viewport.startTime, "2024-01-01T00:00:00.000Z");
  assert.equal(right.symbol, "ORANGE_CI");
  assert.equal(right.interval, "1D");
  assert.deepEqual(right.indicators, ["volume"]);
  assert.equal(right.drawingScope, "draw-orange");
  assert.equal(right.viewport.startTime, "2025-01-01T00:00:00.000Z");
  assert.equal(after.ui.multiChartLayout.activeChartId, "chart_2");
  assert.equal(right.isActive, true);
  assert.equal(left.isActive, false);
  assert.equal(after.chartConfig.symbol, "ORANGE_CI");
  assert.equal(after.chartConfig.timeframe, "1D");
});

test("swapLayoutCharts moves a bound panel into an empty physical slot", () => {
  const before = createTwoChartState();
  before.ui.multiChartLayout.charts[1] = completeMultiChartLayout({
    ...before.ui.multiChartLayout,
    charts: [
      before.ui.multiChartLayout.charts[0],
      {
        chartId: "chart_2",
        symbol: "",
        exchange: "",
        interval: "1D",
        indicators: [],
        isActive: false,
      },
    ],
  }).charts[1];

  const after = technicalAnalysisSlice.reducer(
    before,
    swapLayoutCharts({ sourceChartId: "chart_1", targetChartId: "chart_2" }),
  );

  const [sourceSlot, targetSlot] = after.ui.multiChartLayout.charts;
  assert.equal(sourceSlot.chartId, "chart_1");
  assert.equal(sourceSlot.symbol, "");
  assert.equal(targetSlot.chartId, "chart_2");
  assert.equal(targetSlot.symbol, "ORANGE_CI");
  assert.equal(targetSlot.exchange, "BRVM");
  assert.equal(targetSlot.interval, "1D");
  assert.deepEqual(targetSlot.indicators, ["volume"]);
  assert.equal(targetSlot.drawingScope, "draw-orange");
  assert.equal(targetSlot.viewport.startTime, "2025-01-01T00:00:00.000Z");
  assert.equal(after.ui.multiChartLayout.activeChartId, "chart_2");
  assert.equal(targetSlot.isActive, true);
});

test("drop geometry resolves an empty destination independently from stacking order", () => {
  const validIds = new Set(["chart_1", "chart_2", "chart_3", "chart_4"]);
  const rects = [
    { chartId: "chart_1", left: 0, right: 100, top: 0, bottom: 100 },
    { chartId: "chart_2", left: 110, right: 210, top: 0, bottom: 100 },
    { chartId: "chart_3", left: 0, right: 100, top: 110, bottom: 210 },
    { chartId: "chart_4", left: 110, right: 210, top: 110, bottom: 210 },
  ];

  assert.equal(resolveMultiChartDropTargetFromRects(160, 160, "chart_1", validIds, rects), "chart_4");
  assert.equal(resolveMultiChartDropTargetFromRects(50, 50, "chart_1", validIds, rects), null);
  assert.equal(resolveMultiChartDropTargetFromRects(500, 500, "chart_1", validIds, rects), null);
});

test("swapLayoutCharts rejects invalid and same-slot requests without mutation", () => {
  const before = createTwoChartState();
  const invalid = technicalAnalysisSlice.reducer(
    before,
    swapLayoutCharts({ sourceChartId: "missing", targetChartId: "chart_2" }),
  );
  const sameSlot = technicalAnalysisSlice.reducer(
    before,
    swapLayoutCharts({ sourceChartId: "chart_1", targetChartId: "chart_1" }),
  );

  assert.deepEqual(invalid.ui.multiChartLayout, before.ui.multiChartLayout);
  assert.deepEqual(sameSlot.ui.multiChartLayout, before.ui.multiChartLayout);
});

test("drag reorder starts from an explicit handle or safe header and never competes with the ECharts canvas", () => {
  assert.match(gridSource, /MULTI_CHART_DRAG_MOVE_TOLERANCE_PX/);
  assert.doesNotMatch(gridSource, /MULTI_CHART_DRAG_LONG_PRESS_MS|setTimeout\([^)]*MULTI_CHART_DRAG/);
  assert.match(gridSource, /isPanelDragHandle\(target\)/);
  assert.match(gridSource, /isPanelDragSurface\(event\.target\)/);
  assert.match(gridSource, /data-panel-drag-handle="true"/);
  assert.match(peerSource, /gp-peer-chart__header[^>]*data-panel-drag-surface="true"/);
  assert.match(gridSource, /setPointerCapture\(event\.pointerId\)/);
  assert.match(gridSource, /releasePointerCapture\(interaction\.pointerId\)/);
  assert.match(gridSource, /document\.elementsFromPoint\(clientX, clientY\)/);
  assert.match(gridSource, /resolveMultiChartDropTargetFromRects/);
  assert.match(gridSource, /getBoundingClientRect\(\)/);
  assert.match(gridSource, /finishActivatedPanelDrag\(event\.pointerId, event\.clientX, event\.clientY\)/);
  assert.match(gridSource, /window\.addEventListener\("pointermove", handleWindowPointerMove, \{ capture: true, passive: false \}\)/);
  assert.match(gridSource, /window\.addEventListener\("pointerup", handleWindowPointerUp, \{ capture: true, passive: false \}\)/);
  assert.match(gridSource, /window\.addEventListener\("pointercancel", handleWindowPointerCancel, \{ capture: true, passive: false \}\)/);
  assert.match(gridSource, /swapLayoutCharts\(\{ sourceChartId, targetChartId \}\)/);
  assert.doesNotMatch(gridSource, /draggable=\{true\}|onDragStart=|dataTransfer/);
});

test("drag affordance is permanently discoverable and teaches the gesture once without hijacking the chart", () => {
  assert.match(gridSource, /MULTI_CHART_DRAG_DISCOVERY_STORAGE_KEY/);
  assert.match(gridSource, /technical-analysis\.multiChartDragDiscovery\.v1/);
  assert.match(gridSource, /MULTI_CHART_DRAG_DISCOVERY_DELAY_MS = 900/);
  assert.match(gridSource, /MULTI_CHART_DRAG_DISCOVERY_VISIBLE_MS = 6000/);
  assert.match(gridSource, /data-drag-tooltip=\{dragDiscoveryCopy\.tooltip\}/);
  assert.match(gridSource, /data-drag-coachmark=\{dragDiscoveryCopy\.coachmark\}/);
  assert.match(gridSource, /bi bi-grip-vertical/);
  assert.match(styleSource, /\.gp-multi-chart-drag-handle\s*\{/);
  assert.match(styleSource, /width:\s*24px/);
  assert.match(styleSource, /height:\s*24px/);
  assert.match(styleSource, /touch-action:\s*none/);
  assert.match(styleSource, /data-drag-discovery="true"/);
  assert.match(styleSource, /prefers-reduced-motion:\s*reduce/);
});

test("drag reorder exposes stable source, target and drop feedback without changing grid geometry", () => {
  assert.match(gridSource, /is-drag-source/);
  assert.match(gridSource, /is-drop-target/);
  assert.match(gridSource, /data-dragging=\{dragSourceChartId === cell\.chartId \? "true" : "false"\}/);
  assert.match(gridSource, /data-drop-label=\{dragDiscoveryCopy\.dropLabel\}/);
  assert.match(styleSource, /\.gp-multi-chart-slot\.is-drag-source/);
  assert.match(styleSource, /\.gp-multi-chart-slot\.is-drop-target/);
  assert.match(styleSource, /content:\s*attr\(data-drop-label\)/);
  assert.match(styleSource, /cursor:\s*grab/);
  assert.match(styleSource, /cursor:\s*grabbing/);
  assert.match(styleSource, /translate3d\(var\(--gp-panel-drag-x/);
  assert.match(styleSource, /pointer-events:\s*none/);
});
