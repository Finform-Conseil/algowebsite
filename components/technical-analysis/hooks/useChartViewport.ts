import { useEffect, useLayoutEffect, useRef, MutableRefObject, useCallback } from "react";
import type { ECharts } from "echarts/core";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { isPriceAxisInteractiveTarget } from "./priceAxisInteractiveTargets";
import {
  MAIN_GRID_LEFT,
  TV_MAX_FUTURE_BARS,
  TV_MAX_HISTORY_GAP_BARS,
  TV_MIN_VISIBLE_BARS,
  TV_PAN_DRIFT_DAMPING,
  TV_RESET_VISIBLE_BARS,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  TV_ZOOM_VELOCITY,
  clamp,
  clampViewportWindowWithFuture,
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  computeTradingViewWheelZoomViewport,
  normalizeWheelDeltaPx,
  reconcileViewportAfterHistoryPrepend,
  resolveInitialViewportWindow,
  resolveTimeDataZoomAxisIndexes,
} from "./viewport/viewportMath";
import { resolveAutoViewportPriceRange } from "./viewport/viewportPriceRange";
import {
  buildOffscreenPriceLevelGraphics,
  getSafeGridRect,
  type PriceLevelViewportMarker,
} from "./viewport/viewportGraphics";

export type { ViewportWindow, ZoomRangeSnapshot } from "./viewport/viewportMath";
export {
  MAIN_GRID_LEFT,
  TV_AUTO_SCALE_PADDING,
  TV_COMPARE_PRICE_AXIS_DEZOOM_PADDING,
  TV_CURSOR_INFLUENCE,
  TV_INITIAL_VISIBLE_BARS,
  TV_MAX_FUTURE_BARS,
  TV_MAX_HISTORY_GAP_BARS,
  TV_MIN_VISIBLE_BARS,
  TV_PAN_DRIFT_DAMPING,
  TV_RESET_VISIBLE_BARS,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  TV_ZOOM_VELOCITY,
  clamp,
  clampViewportWindow,
  clampViewportWindowWithFuture,
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  computeTradingViewWheelZoomViewport,
  normalizeWheelDeltaPx,
  reconcileViewportAfterHistoryPrepend,
  resolveInitialViewportWindow,
  resolveTimeDataZoomAxisIndexes,
} from "./viewport/viewportMath";
export { resolveAutoViewportPriceRange } from "./viewport/viewportPriceRange";
export {
  buildOffscreenPriceLevelGraphics,
  getSafeGridRect,
  type PriceLevelViewportMarker,
} from "./viewport/viewportGraphics";

export type ChartMutationScheduler = (key: string, mutation: (chart: ECharts) => void) => void;
export type HistoryBoundaryDirection = "left" | "right";
type ViewportApplyMode = "queued" | "immediate";
type HistoryPrependCommit = {
  dataLength: number;
  prependedBars: number;
  firstTime: string;
};

export interface TradingViewTimeAxisControls {
  zoomIn: () => void;
  zoomOut: () => void;
  panLeft: () => void;
  panRight: () => void;
  reset: () => void;
}

export const TimeAxisRegistry = new WeakMap<ECharts, TradingViewTimeAxisControls>();


const isViewportChartUsable = (chart: ECharts | null): chart is ECharts => {
  if (!chart) return false;
  try {
    if (chart.isDisposed()) return false;
    const dom = chart.getDom();
    return Boolean(dom?.isConnected && chart.getWidth() > 0 && chart.getHeight() > 0);
  } catch {
    return false;
  }
};

// ============================================================================
// HOOK: VIEWPORT ENGINE (Absolute Coordinates & DOM Events)
// ============================================================================

export interface UseChartViewportProps {
  chartInstanceRef: MutableRefObject<ECharts | null>;
  getChartContainer: () => HTMLDivElement | null;
  chartData: ChartDataPoint[];
  lastZoomRangeRef?: MutableRefObject<{ start: number; end: number; barsFromRightStart?: number; barsFromRightEnd?: number; futureBarsFromRightEnd?: number; }>;
  updateCursorPriceAxisBadge: (x: number, y: number) => void;
  updateLastPriceAxisBadge: () => void;
  interactionScopeKey?: string;
  hasComparisonEndLabels?: boolean;
  lastPriceAxisValue?: number;
  priceLevelMarkers?: PriceLevelViewportMarker[];
  onHistoryBoundaryRequest?: (direction: HistoryBoundaryDirection) => void;
  scheduleChartMutation?: ChartMutationScheduler;
}

export const useChartViewport = ({
  chartInstanceRef,
  getChartContainer,
  chartData,
  lastZoomRangeRef,
  updateCursorPriceAxisBadge,
  updateLastPriceAxisBadge,
  interactionScopeKey,
  hasComparisonEndLabels = false,
  lastPriceAxisValue,
  priceLevelMarkers = [],
  onHistoryBoundaryRequest,
  scheduleChartMutation,
}: UseChartViewportProps) => {
  const viewportStateRef = useRef({
    startIdx: 0,
    endIdx: 100,
    historyGapBars: TV_MAX_HISTORY_GAP_BARS,
    yScale: 1.0,
    yPan: 0,
    isYManual: false,
    lastDataLength: 0,
    isDraggingXPan: false,
    isDraggingYScale: false,
    isDraggingChart: false,
    startX: 0,
    startY: 0,
    initialYScale: 1.0,
    initialYPan: 0,
    lastTap: 0,
    activePointers: new Map<number, PointerEvent>(),
    initialPinchDistance: 0,
    initialPinchCenter: 0,
    cachedRect: null as DOMRect | null // [TENOR 2026 SRE] Cache rect on pointerdown
  });

  const lastCursorClientPointRef = useRef<{ x: number; y: number } | null>(null);
  const prevDataMaxRef = useRef<number>(0);
  const lastDataFirstTimeRef = useRef<string | null>(null);
  const previousPriceLevelGraphicIdsRef = useRef<Set<string>>(new Set());
  const viewportApplyRafRef = useRef<number | null>(null);
  const viewportApplyModeRef = useRef<ViewportApplyMode>("queued");
  // Commit barrier between the React dataset and the imperative ECharts model.
  // While a prepend is waiting for its full-option commit, interactions may keep
  // updating the logical viewport but must not mutate the still-old chart model.
  const historyPrependCommitRef = useRef<HistoryPrependCommit | null>(null);
  // Keep the synthetic history reserve fixed. Growing this offset during rapid
  // wheel/drag bursts forces every x-axis/series index to be rebuilt and is a
  // direct source of visual jitter while historical pages are prepended.
  const historyGapBars = TV_MAX_HISTORY_GAP_BARS;

  const chartDataRef = useRef(chartData);
  useLayoutEffect(() => {
    // Fast wheel/pointer bursts must never compute against the previous dataset
    // during the commit that installs a newly prepended history batch.
    chartDataRef.current = chartData;
  }, [chartData]);

  const enqueueChartMutation = useCallback((key: string, mutation: (chart: ECharts) => void, mode: ViewportApplyMode = "queued") => {
    if (mode === "queued" && scheduleChartMutation) {
      scheduleChartMutation(key, mutation);
      return;
    }

    const chart = chartInstanceRef.current;
    if (!isViewportChartUsable(chart)) return;
    try {
      mutation(chart);
    } catch (error) {
      console.warn("[SRE] ECharts viewport mutation failed", error);
    }
  }, [chartInstanceRef, scheduleChartMutation]);

  const notifyHistoryBoundary = useCallback((startIdx: number, endIdx: number, totalBars: number) => {
    if (!onHistoryBoundaryRequest || totalBars <= 0) return;
    const visibleSpan = Math.max(1, endIdx - startIdx);
    // Prefetch by viewport distance, not by total dataset size. A percentage of
    // the whole history becomes increasingly aggressive as more pages are loaded
    // and can create a cascade of prepend/render cycles under one fast gesture.
    const threshold = Math.max(
      20,
      Math.ceil(visibleSpan * 2),
    );
    if (startIdx <= threshold) onHistoryBoundaryRequest("left");
    if (endIdx >= totalBars - 1 - threshold) onHistoryBoundaryRequest("right");
  }, [onHistoryBoundaryRequest]);

  const applyViewport = useCallback((mode: ViewportApplyMode = "queued") => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed() || chartData.length === 0) return;

    // [TENOR 2026 SRE] Guard against empty ECharts option state during asset transition/loading.
    // Prevents "Cannot read properties of undefined (reading 'coordinateSystem')" crash.
    const option = chart.getOption() as any;
    if (!option || !option.series || option.series.length === 0 || !option.yAxis) return;

    const state = viewportStateRef.current;
    const totalBars = chartData.length;

    if (historyPrependCommitRef.current !== null) {
      // The latest pointer/wheel state is already stored synchronously in `state`.
      // Defer only the imperative ECharts mutation until the new dataset has been
      // installed, preventing new coordinates from ever touching the old series.
      return;
    }

    state.startIdx = Math.max(-state.historyGapBars, Math.min(totalBars - 1, Math.round(state.startIdx)));
    state.endIdx = Math.min(totalBars - 1 + TV_MAX_FUTURE_BARS, Math.round(state.endIdx));

    if (state.startIdx >= state.endIdx) {
      state.startIdx = Math.max(-state.historyGapBars, state.endIdx - 10);
    }

    const autoRange = resolveAutoViewportPriceRange({
      chartData,
      startIdx: Math.max(0, state.startIdx),
      endIdx: Math.max(0, Math.min(totalBars - 1, state.endIdx)),
      hasComparisonEndLabels,
      lastPriceAxisValue,
    });
    const { visibleMin, visibleMax, center, padding } = autoRange;
    let finalMin = autoRange.min;
    let finalMax = autoRange.max;

    if (state.isYManual) {
      const scaledRange = ((visibleMax - visibleMin) + padding * 2) * state.yScale;
      finalMin = center - (scaledRange / 2) + state.yPan;
      finalMax = center + (scaledRange / 2) + state.yPan;

      // TradingView permits panning the price scale beyond the visible candle extrema.
      // Reject only non-finite or inverted ranges.
      const isInvalidManualViewport =
        !Number.isFinite(finalMin) ||
        !Number.isFinite(finalMax) ||
        finalMin >= finalMax;

      if (isInvalidManualViewport) {
        state.isYManual = false;
        state.yScale = 1.0;
        state.yPan = 0;
        finalMin = autoRange.min;
        finalMax = autoRange.max;
      }
    }

    const offscreenPriceLevelGraphics = buildOffscreenPriceLevelGraphics({
      chart,
      container: getChartContainer(),
      markers: priceLevelMarkers,
      yAxisMin: finalMin,
      yAxisMax: finalMax,
      previousGraphicIds: previousPriceLevelGraphicIdsRef.current,
    });

    const axisIndexOffset = state.historyGapBars;
    const viewportOption = {
      xAxis: Array.isArray(option.xAxis)
        ? option.xAxis.map((axis: any, index: number) => ({ id: axis?.id ?? index }))
        : undefined,
      yAxis: [{ id: 'price-yaxis', min: finalMin, max: finalMax, scale: false }],
      dataZoom: [{
        id: 'time-zoom',
        xAxisIndex: resolveTimeDataZoomAxisIndexes(option),
        filterMode: 'none',
        startValue: axisIndexOffset + state.startIdx,
        endValue: axisIndexOffset + state.endIdx,
      }],
      ...(offscreenPriceLevelGraphics.length > 0 ? { graphic: offscreenPriceLevelGraphics } : {}),
    };

    enqueueChartMutation("viewport", (targetChart) => {
      targetChart.setOption(viewportOption, false, true);
      requestAnimationFrame(() => {
        updateLastPriceAxisBadge();
        if (lastCursorClientPointRef.current) {
          updateCursorPriceAxisBadge(lastCursorClientPointRef.current.x, lastCursorClientPointRef.current.y);
        }
      });
    }, mode);

    if (lastZoomRangeRef) {
      lastZoomRangeRef.current = {
        start: (state.startIdx / totalBars) * 100,
        end: (state.endIdx / totalBars) * 100,
        barsFromRightStart: totalBars - state.startIdx,
        barsFromRightEnd: totalBars - state.endIdx,
        futureBarsFromRightEnd: Math.max(0, state.endIdx - (totalBars - 1))
      };
    }
  }, [
    chartData,
    chartInstanceRef,
    enqueueChartMutation,
    getChartContainer,
    hasComparisonEndLabels,
    lastPriceAxisValue,
    lastZoomRangeRef,
    priceLevelMarkers,
    updateCursorPriceAxisBadge,
    updateLastPriceAxisBadge,
  ]);

  const scheduleViewportApply = useCallback((mode: ViewportApplyMode = "queued") => {
    if (mode === "immediate") {
      viewportApplyModeRef.current = "immediate";
    }
    if (viewportApplyRafRef.current !== null) return;

    viewportApplyRafRef.current = requestAnimationFrame(() => {
      const applyMode = viewportApplyModeRef.current;
      viewportApplyModeRef.current = "queued";
      viewportApplyRafRef.current = null;
      applyViewport(applyMode);
    });
  }, [applyViewport]);

  useEffect(() => () => {
    if (viewportApplyRafRef.current !== null) {
      cancelAnimationFrame(viewportApplyRafRef.current);
      viewportApplyRafRef.current = null;
    }
  }, []);

  // Currency Auto-Scaling Detector
  useEffect(() => {
    if (chartData.length === 0) return;
    const recentData = chartData.slice(-20);
    const currentMax = Math.max(...recentData.map(d => d.high));

    if (prevDataMaxRef.current !== 0 && currentMax !== 0) {
      const ratio = currentMax / prevDataMaxRef.current;
      if (ratio > 1.5 || ratio < 0.6) {
        viewportStateRef.current.isYManual = false;
        if (chartInstanceRef.current) {
          const option = chartInstanceRef.current.getOption() as any;
          const dzY = option?.dataZoom?.find((z: any) => z.id === 'price-zoom' || z.yAxisIndex !== null);
          if (dzY) {
            chartInstanceRef.current.dispatchAction({ type: 'dataZoom', dataZoomId: dzY.id, start: 0, end: 100 });
          }
        }
      }
    }
    prevDataMaxRef.current = currentMax;
  }, [chartData, chartInstanceRef]);

  // Atomic data/viewport reconciliation.
  //
  // Reconcile only the logical coordinates before the renderer's passive effect.
  // Applying shifted indexes immediately to the still-old ECharts dataset creates
  // a visible stale frame (candles + volumes jump, then settle) under fast panning.
  useLayoutEffect(() => {
    const currentLen = chartData.length;
    const state = viewportStateRef.current;
    const lastLen = state.lastDataLength;
    const firstTime = currentLen > 0 ? String(chartData[0]?.time ?? "") : null;

    if (currentLen === 0) {
      lastDataFirstTimeRef.current = null;
      historyPrependCommitRef.current = null;
      state.lastDataLength = 0;
      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;
      return;
    }

    const previousFirstTime = lastDataFirstTimeRef.current;
    const prependedBars = previousFirstTime === null
      ? -1
      : chartData.findIndex((point) => String(point.time) === previousFirstTime);
    const isHistoryPrepend = lastLen > 0 && currentLen > lastLen && prependedBars > 0;

    if (isHistoryPrepend) {
      historyPrependCommitRef.current = {
        dataLength: currentLen,
        prependedBars,
        firstTime: firstTime ?? "",
      };
      const nextViewport = reconcileViewportAfterHistoryPrepend({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        prependedBars,
        totalBars: currentLen,
        maxFutureBars: TV_MAX_FUTURE_BARS,
        maxHistoryGapBars: state.historyGapBars,
      });
      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
    } else if (lastLen === 0 || currentLen < lastLen) {
      historyPrependCommitRef.current = null;
      const nextViewport = resolveInitialViewportWindow(currentLen);
      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      state.yScale = 1.0;
      state.yPan = 0;
      state.isYManual = false;
      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;
    } else if (lastLen > 0 && prependedBars === -1 && currentLen >= lastLen) {
      historyPrependCommitRef.current = null;
      // Preserve intentional synthetic history/future whitespace across a structural
      // replacement; do not snap to the real-data boundaries during reconciliation.
      const nextViewport = clampViewportWindowWithFuture(
        state.startIdx,
        state.endIdx,
        currentLen,
        TV_MAX_FUTURE_BARS,
        state.historyGapBars,
      );
      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
    }

    lastDataFirstTimeRef.current = firstTime;
    state.lastDataLength = currentLen;
  }, [chartData]);

  const completeHistoryPrependCommit = useCallback((committedDataLength: number): boolean => {
    const pendingCommit = historyPrependCommitRef.current;
    if (!pendingCommit || pendingCommit.dataLength !== committedDataLength) return false;
    historyPrependCommitRef.current = null;
    return true;
  }, []);

  // DOM Event Listeners
  useEffect(() => {
    // [TENOR 2026 SRE FIX] SCAR-MULTICHART-EVENT-SCOPE:
    // getChartContainer() is now getLayersStack() — the stable gp-chart-layers-stack div.
    // We no longer call .parentElement because the caller (useEChartsRenderer) passes the
    // correct container directly. This fixes the bug where in multi-chart mode
    // stockChartRef.parentElement was a transient grid cell, not the stable layers stack.
    const containerEl = getChartContainer();
    if (!containerEl) return;

    // [TENOR 2026 SRE FIX] Enforce touch-action none to prevent native browser scrolling/zooming
    containerEl.style.touchAction = 'none';

    const wheelListenerOptions: AddEventListenerOptions = { passive: false, capture: true };
    const interactionListenerOptions: AddEventListenerOptions = { capture: true };
    let registeredChart: ECharts | null = null;
    let registryFrameId: number | null = null;
    let registryAttempts = 0;
    const maxRegistryAttempts = 12;

    const getLiveChart = (): ECharts | null => {
      const chart = chartInstanceRef.current;
      return isViewportChartUsable(chart) ? chart : null;
    };

    let wheelFrameId: number | null = null;
    let pendingWheelDeltaY = 0;
    let pendingWheelDeltaX = 0;

    const resolveExpandablePanViewport = (
      state: typeof viewportStateRef.current,
      totalBars: number,
      shift: number,
    ) => {
      const projectedStart = state.startIdx + (shift * TV_PAN_DRIFT_DAMPING);
      const currentFutureBars = Math.max(0, state.endIdx - (totalBars - 1));
      const isFutureDirectedPan = shift > 0;
      const isElasticHistoryPan = shift < 0 && projectedStart < 0 && currentFutureBars === 0;

      // The left elastic reserve is a fixed coordinate-space budget. Never grow
      // the synthetic axis while the pointer/wheel is moving: doing so changes the
      // index offset for every candle/volume point and causes a full-axis rebuild.
      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;

      return computeHorizontalPanViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        shift,
        maxHistoryGapBars: TV_MAX_HISTORY_GAP_BARS,
        // TradingView-style future whitespace remains available only while the
        // user intentionally pans toward the future. The instant the direction
        // reverses toward history, collapse the synthetic future reserve so no
        // right-hand gap can survive or be recreated during historical browsing.
        maxFutureBars: isFutureDirectedPan ? TV_MAX_FUTURE_BARS : 0,
        preserveEnd: isElasticHistoryPan,
      });
    };

    const applyExternalTimeZoom = (direction: "in" | "out") => {
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;
      const state = viewportStateRef.current;
      const totalBars = chartDataRef.current.length;
      const syntheticDeltaY = direction === "in" ? -120 : 120;
      const zoomFactor = Math.exp(syntheticDeltaY * TV_ZOOM_VELOCITY);

      const nextViewport = computeDirectionalZoomViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        cursorRatio: 0.5,
        zoomFactor,
        deltaY: 0,
      });

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      applyViewport();
    };

    const applyExternalTimePan = (direction: "left" | "right") => {
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;
      const state = viewportStateRef.current;
      const totalBars = chartDataRef.current.length;
      const visibleCount = state.endIdx - state.startIdx;
      const directionMultiplier = direction === "left" ? -1 : 1;
      const shift = visibleCount * 0.18 * directionMultiplier;

      const nextViewport = resolveExpandablePanViewport(state, totalBars, shift);

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      applyViewport();
    };

    const resetExternalTimeViewport = () => {
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;
      const totalBars = chartDataRef.current.length;
      const span = Math.min(Math.max(TV_MIN_VISIBLE_BARS, TV_RESET_VISIBLE_BARS), Math.max(1, totalBars - 1));
      const state = viewportStateRef.current;

      state.endIdx = totalBars - 1;
      state.startIdx = Math.max(0, state.endIdx - span);
      state.isYManual = false;
      state.yScale = 1.0;
      state.yPan = 0;
      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;
      applyViewport();
    };

    const registerTimeAxisControls = () => {
      const chart = getLiveChart();
      if (!chart) return;
      if (registeredChart && registeredChart !== chart) {
        TimeAxisRegistry.delete(registeredChart);
      }
      registeredChart = chart;
      TimeAxisRegistry.set(chart, {
        zoomIn: () => applyExternalTimeZoom("in"),
        zoomOut: () => applyExternalTimeZoom("out"),
        panLeft: () => applyExternalTimePan("left"),
        panRight: () => applyExternalTimePan("right"),
        reset: resetExternalTimeViewport,
      });
    };

    const scheduleTimeAxisRegistry = () => {
      registryFrameId = requestAnimationFrame(() => {
        registryFrameId = null;
        registerTimeAxisControls();
        if (!registeredChart && registryAttempts < maxRegistryAttempts) {
          registryAttempts++;
          scheduleTimeAxisRegistry();
        }
      });
    };

    scheduleTimeAxisRegistry();

    const flushChartWheel = () => {
      wheelFrameId = null;
      const deltaY = pendingWheelDeltaY;
      const deltaX = pendingWheelDeltaX;
      pendingWheelDeltaY = 0;
      pendingWheelDeltaX = 0;

      if (deltaY === 0 && deltaX === 0) return;
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;

      const state = viewportStateRef.current;
      const totalBars = chartDataRef.current.length;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        const currentFutureBars = Math.max(0, state.endIdx - (totalBars - 1));
        const isHistoryRevealWheel = deltaY > 0;
        const nextViewport = computeTradingViewWheelZoomViewport({
          startIdx: state.startIdx,
          endIdx: state.endIdx,
          totalBars,
          deltaY,
          maxHistoryGapBars: TV_MAX_HISTORY_GAP_BARS,
          // A wheel zoom-out reveals older history. On that first history-directed
          // gesture, collapse any previously intentional future whitespace so the
          // right edge snaps back to the latest real candle. Zoom-in may preserve
          // an already intentional future gap, but can never create one from zero.
          maxFutureBars: isHistoryRevealWheel ? 0 : currentFutureBars,
        });

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;
      } else {
        const rect = containerEl.getBoundingClientRect();
        const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
        const visibleCount = state.endIdx - state.startIdx;
        const shift = (deltaX / gridWidth) * visibleCount;
        const nextViewport = resolveExpandablePanViewport(state, totalBars, shift);

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
      }

      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      scheduleViewportApply("immediate");
    };

    const onWheel = (event: WheelEvent) => {
      const cursor = (event.target as HTMLElement)?.style?.cursor;

      if (cursor === 'move' || cursor === 'grab' || cursor === 'grabbing' || cursor === 'ns-resize') {
        return;
      }
      if (isPriceAxisInteractiveTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;

      const rect = containerEl.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const gridRightPx = rect.width - TV_Y_AXIS_WIDTH;
      const gridBottomPx = rect.height - TV_X_AXIS_HEIGHT;

      const isOnYAxis = mouseX >= gridRightPx;
      const isOnXAxis = mouseY >= gridBottomPx && mouseX < gridRightPx;
      const isOnChart = mouseX < gridRightPx && mouseY < gridBottomPx;

      const state = viewportStateRef.current;
      const wheelDeltaY = normalizeWheelDeltaPx(event.deltaY, event.deltaMode);
      const wheelDeltaX = normalizeWheelDeltaPx(event.deltaX, event.deltaMode);

      if (isOnYAxis) {
        const totalBars = chartDataRef.current.length;
        const autoRange = resolveAutoViewportPriceRange({ chartData: chartDataRef.current, startIdx: state.startIdx, endIdx: Math.min(totalBars - 1, state.endIdx), hasComparisonEndLabels, lastPriceAxisValue });
        const baseRange = Math.max(1, autoRange.visibleMax - autoRange.visibleMin + autoRange.padding * 2);
        const currentRange = baseRange * state.yScale;
        const gridHeight = Math.max(1, rect.height - TV_X_AXIS_HEIGHT);
        const cursorRatio = Math.max(0, Math.min(1, mouseY / gridHeight));
        const oldPriceAtCursor = autoRange.center + state.yPan + currentRange * (0.5 - cursorRatio);
        const wheelStep = Math.sign(wheelDeltaY) * Math.min(1, Math.abs(wheelDeltaY) / 80);
        const nextScale = Math.max(0.1, Math.min(5, state.yScale * Math.exp(wheelStep * TV_ZOOM_VELOCITY * 80)));
        const nextRange = baseRange * nextScale;
        const shiftedCursorRatio = Math.max(0, Math.min(1, (mouseY + 15 * wheelStep) / gridHeight));
        state.yScale = nextScale;
        state.yPan = oldPriceAtCursor - autoRange.center - nextRange * (0.5 - shiftedCursorRatio);
        state.isYManual = true;
        scheduleViewportApply("immediate");
      } else if (isOnChart || isOnXAxis) {
        const totalBars = chartDataRef.current.length;
        const visibleCount = state.endIdx - state.startIdx;

        if (Math.abs(wheelDeltaY) > Math.abs(wheelDeltaX)) {
          pendingWheelDeltaY += wheelDeltaY;
        } else {
          pendingWheelDeltaX += wheelDeltaX;
        }

        if (wheelFrameId === null) {
          wheelFrameId = requestAnimationFrame(flushChartWheel);
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (!getLiveChart()) return;

      const state = viewportStateRef.current;
      state.activePointers.set(event.pointerId, event);
      
      // [TENOR 2026 SRE] Cache rect on pointer down to avoid layout thrashing in pointermove
      state.cachedRect = containerEl.getBoundingClientRect();

      const now = Date.now();
      if (now - state.lastTap < 300 && state.activePointers.size === 1) {
        onDoubleClick(event);
        state.lastTap = 0;
        return;
      }
      state.lastTap = now;

      const target = event.target as HTMLElement;
      if (target) {
        if (isPriceAxisInteractiveTarget(event.target)) {
          return;
        }
        const drawingCanvas = target.closest('.gp-drawing-canvas') as HTMLCanvasElement | null;
        const drawingInteraction = drawingCanvas?.dataset.drawingInteraction;
        if (drawingInteraction === 'tool' || drawingInteraction === 'eraser' || drawingInteraction === 'magic') {
          return;
        }
        // Chart canvases may expose a move/grab cursor while still being the
        // horizontal pan surface. Drawing canvases remain protected above by their
        // explicit interaction modes, so cursor styling must not veto chart panning.
        if (target.closest('.gp-drawing-overlay-shield')) {
          return;
        }
      }

      const rect = state.cachedRect;
      
      // [TENOR 2026 SRE FIX] Multi-touch Pinch Initialization
      if (state.activePointers.size >= 2) {
        const pointers = Array.from(state.activePointers.values()).slice(0, 2); // Strictly 2 fingers
        const p1 = pointers[0];
        const p2 = pointers[1];
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        
        state.initialPinchDistance = Math.hypot(dx, dy);
        state.initialPinchCenter = ((p1.clientX + p2.clientX) / 2) - rect.left;
        
        state.isDraggingXPan = false;
        state.isDraggingYScale = false;
        state.isDraggingChart = false;
        return;
      }

      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const gridRightPx = rect.width - TV_Y_AXIS_WIDTH;
      const gridBottomPx = rect.height - TV_X_AXIS_HEIGHT;

      const isOnYAxis = mouseX >= gridRightPx;
      const isOnXAxis = mouseY >= gridBottomPx && mouseX < gridRightPx;
      const isOnChart = mouseX < gridRightPx && mouseY < gridBottomPx;

      if (isOnYAxis) {
        state.isDraggingYScale = true;
        state.startY = event.clientY;
        state.initialYScale = state.yScale;
        state.initialYPan = state.yPan;
      } else if (isOnXAxis) {
        state.isDraggingXPan = true;
        state.startX = event.clientX;
      } else if (isOnChart) {
        state.isDraggingChart = true;
        state.startX = event.clientX;
        state.startY = event.clientY;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const chart = getLiveChart();
      if (!chart || chartData.length === 0) return;

      const state = viewportStateRef.current;
      lastCursorClientPointRef.current = { x: event.clientX, y: event.clientY };
      updateCursorPriceAxisBadge(event.clientX, event.clientY);

      if (state.activePointers.has(event.pointerId)) {
        state.activePointers.set(event.pointerId, event);
      }

      // [TENOR 2026 SRE FIX] Robust Pinch-to-Zoom Logic
      if (state.activePointers.size >= 2) {
        const pointers = Array.from(state.activePointers.values()).slice(0, 2);
        const p1 = pointers[0];
        const p2 = pointers[1];
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        const currentDistance = Math.hypot(dx, dy);

        if (state.initialPinchDistance === 0) {
          state.initialPinchDistance = currentDistance;
          return;
        }

        // [JITTER PROTECTION] Ignore micro-movements (< 5px)
        if (Math.abs(currentDistance - state.initialPinchDistance) < 5) {
            return;
        }

        const rawRatio = state.initialPinchDistance / currentDistance;
        const zoomFactor = Math.pow(rawRatio, 0.5);

        const totalBars = chartDataRef.current.length;
        const visibleCount = state.endIdx - state.startIdx;
        
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
        const cursorRatio = Math.max(0, Math.min(1, (state.initialPinchCenter - MAIN_GRID_LEFT) / gridWidth));

        const pinchDeltaY = (visibleCount - (visibleCount * zoomFactor)) || 0;

        const nextViewport = computeDirectionalZoomViewport({
          startIdx: state.startIdx,
          endIdx: state.endIdx,
          totalBars,
          cursorRatio,
          zoomFactor,
          deltaY: pinchDeltaY,
        });

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
        scheduleViewportApply("immediate");

        state.initialPinchDistance = currentDistance;
        return;
      }

      if (state.isDraggingYScale) {
        const deltaY = event.clientY - state.startY;
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const totalBars = chartDataRef.current.length;
        const autoRange = resolveAutoViewportPriceRange({ chartData: chartDataRef.current, startIdx: state.startIdx, endIdx: Math.min(totalBars - 1, state.endIdx), hasComparisonEndLabels, lastPriceAxisValue });
        const baseRange = Math.max(1, autoRange.visibleMax - autoRange.visibleMin + autoRange.padding * 2);
        const gridHeight = Math.max(1, rect.height - TV_X_AXIS_HEIGHT);
        const startRatio = Math.max(0, Math.min(1, (state.startY - rect.top) / gridHeight));
        const currentRatio = Math.max(0, Math.min(1, (event.clientY - rect.top) / gridHeight));
        const initialRange = baseRange * state.initialYScale;
        const anchorPrice = autoRange.center + state.initialYPan + initialRange * (0.5 - startRatio);
        const nextScale = Math.max(0.1, Math.min(5, state.initialYScale * Math.exp(deltaY * 0.01)));
        const nextRange = baseRange * nextScale;
        state.yScale = nextScale;
        state.yPan = anchorPrice - autoRange.center - nextRange * (0.5 - currentRatio);
        state.isYManual = true;
        scheduleViewportApply("immediate");
      } else if (state.isDraggingChart || state.isDraggingXPan) {
        const deltaX = event.clientX - state.startX;
        state.startX = event.clientX;

        const totalBars = chartDataRef.current.length;
        const visibleCount = state.endIdx - state.startIdx;
        
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
        const shiftX = -(deltaX / gridWidth) * visibleCount;

        const nextViewport = resolveExpandablePanViewport(state, totalBars, shiftX);

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);

        if (state.isDraggingChart) {
          const deltaY = event.clientY - state.startY;
          state.startY = event.clientY;

          if (Math.abs(deltaY) > 0) {
            state.isYManual = true;
            const gridHeight = Math.max(1, rect.height - (rect.height * 0.08) - 30);
            let visibleMin = Infinity, visibleMax = -Infinity;
            for (let i = state.startIdx; i <= state.endIdx; i++) {
              if (chartDataRef.current[i]) {
                visibleMin = Math.min(visibleMin, chartDataRef.current[i].low);
                visibleMax = Math.max(visibleMax, chartDataRef.current[i].high);
              }
            }
            const priceRange = Math.max(1, (visibleMax - visibleMin) * state.yScale);
            const shiftY = (deltaY / gridHeight) * priceRange;
            const maxPan = priceRange * 0.8;
            state.yPan = clamp(state.yPan + shiftY, -maxPan, maxPan);
          }
        }
        scheduleViewportApply("immediate");
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const state = viewportStateRef.current;
      state.activePointers.delete(event.pointerId);

      if (state.activePointers.size < 2) {
        state.initialPinchDistance = 0;
      }

      if (state.activePointers.size === 0) {
        state.isDraggingXPan = false;
        state.isDraggingYScale = false;
        state.isDraggingChart = false;
        state.cachedRect = null;
      } else if (state.activePointers.size === 1) {
        const remainingPointer = Array.from(state.activePointers.values())[0];
        state.startX = remainingPointer.clientX;
        state.startY = remainingPointer.clientY;
        state.isDraggingXPan = true;
      }
    };

    const onDoubleClick = (event: MouseEvent | PointerEvent) => {
      if (!getLiveChart()) return;
      const target = event.target as HTMLElement;

      if (target) {
        if (isPriceAxisInteractiveTarget(event.target)) {
          return;
        }
        const drawingCanvas = target.closest('.gp-drawing-canvas') as HTMLCanvasElement | null;
        const drawingInteraction = drawingCanvas?.dataset.drawingInteraction;
        if (drawingInteraction === 'tool' || drawingInteraction === 'eraser' || drawingInteraction === 'magic') {
          return;
        }
        // Chart canvases may expose a move/grab cursor while still being the
        // horizontal pan surface. Drawing canvases remain protected above by their
        // explicit interaction modes, so cursor styling must not veto chart panning.
        if (target.closest('.gp-drawing-overlay-shield')) {
          return;
        }
      }

      const rect = containerEl.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const gridRightPx = rect.width - TV_Y_AXIS_WIDTH;

      if (mouseX >= gridRightPx) {
        viewportStateRef.current.isYManual = false;
        viewportStateRef.current.yScale = 1.0;
        viewportStateRef.current.yPan = 0;
        applyViewport();
      }
    };

    containerEl.addEventListener("wheel", onWheel, wheelListenerOptions);
    // ECharts can stop bubble-phase pointer events on its renderer canvas. Capture
    // the gesture before ZRender so the viewport always receives the full drag.
    containerEl.addEventListener("pointerdown", onPointerDown, interactionListenerOptions);
    containerEl.addEventListener("dblclick", onDoubleClick);
    
    // Capture movement/up events as well: ZRender may stop propagation at target.
    window.addEventListener("pointermove", onPointerMove, interactionListenerOptions);
    window.addEventListener("pointerup", onPointerUp, interactionListenerOptions);
    window.addEventListener("pointercancel", onPointerUp, interactionListenerOptions);

    return () => {
      if (registryFrameId !== null) cancelAnimationFrame(registryFrameId);
      if (wheelFrameId !== null) cancelAnimationFrame(wheelFrameId);
      pendingWheelDeltaY = 0;
      pendingWheelDeltaX = 0;
      if (registeredChart) TimeAxisRegistry.delete(registeredChart);
      containerEl.removeEventListener("wheel", onWheel, wheelListenerOptions);
      containerEl.removeEventListener("pointerdown", onPointerDown, interactionListenerOptions);
      containerEl.removeEventListener("dblclick", onDoubleClick);
      
      window.removeEventListener("pointermove", onPointerMove, interactionListenerOptions);
      window.removeEventListener("pointerup", onPointerUp, interactionListenerOptions);
      window.removeEventListener("pointercancel", onPointerUp, interactionListenerOptions);
    };
  }, [
    chartInstanceRef,
    getChartContainer,
    interactionScopeKey,
    applyViewport,
    scheduleViewportApply,
    updateCursorPriceAxisBadge,
  ]);

  const resetManualYViewport = useCallback(() => {
    viewportStateRef.current.isYManual = false;
    viewportStateRef.current.yScale = 1.0;
    viewportStateRef.current.yPan = 0;
    applyViewport();
  }, [applyViewport]);

  // [TENOR 2026 PERF] Stable ref exposing the live viewport window (startIdx/endIdx).
  // Consumers (useEChartsRenderer) can read this at any time without triggering a React
  // re-render. Updated synchronously inside applyViewport before enqueueChartMutation.
  const viewportWindowRef = viewportStateRef as typeof viewportStateRef;

  return {
    applyViewport,
    historyGapBars,
    lastCursorClientPointRef,
    resetManualYViewport,
    viewportWindowRef,
    historyPrependCommitRef,
    completeHistoryPrependCommit,
  };
};

// --- EOF ---
