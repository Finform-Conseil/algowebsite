import { useEffect, useLayoutEffect, useRef, MutableRefObject, useCallback } from "react";
import type { ECharts } from "echarts/core";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { resolveVisibleVolumeOverlayAxisMax } from "../lib/chart/directionalOhlcv";
import { isPriceAxisInteractiveTarget } from "./priceAxisInteractiveTargets";
import {
  MAIN_GRID_LEFT,
  TV_MAX_FUTURE_BARS,
  TV_MAX_HISTORY_GAP_BARS,
  TV_MIN_VISIBLE_BARS,
  TV_PAN_FLING_MAX_AGE_MS,
  TV_PAN_FLING_MIN_VELOCITY_PX_PER_MS,
  TV_PAN_MOMENTUM_TAU_MS,
  TV_PAN_STOP_VELOCITY_PX_PER_MS,
  TV_RESET_VISIBLE_BARS,
  TV_TIME_AXIS_DRAG_ZOOM_VELOCITY,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  TV_ZOOM_EASE_TAU_MS,
  TV_ZOOM_VELOCITY,
  clamp,
  clampViewportWindowWithFuture,
  decayPanVelocity,
  easeAutoScaleRange,
  exponentialApproach,
  filterPanVelocity,
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  computePriceAxisDragViewport,
  computePriceAxisPan,
  computePriceAxisWheelViewport,
  computeTradingViewWheelZoomViewport,
  computeVelaPinchViewport,
  reconcileViewportAfterHistoryPrepend,
  resolveInitialViewportWindow,
  resolveVelaInitialViewportWindow,
  resolveTimeDataZoomAxisIndexes,
} from "./viewport/viewportMath";
import { resolveAutoViewportPriceRange } from "./viewport/viewportPriceRange";
import { resolveRenderedTimeAxisWindow } from "./chart-rendering/chartHistoryAxisAlignment";
import {
  buildOffscreenPriceLevelGraphics,
  type PriceLevelViewportMarker,
} from "./viewport/viewportGraphics";
import {
  createTimeViewportSyncSnapshot,
  publishTimeViewportSync,
} from "./sync/timeViewportSyncBus";
import { ViewportChangeCommitBuffer } from "./viewport/viewportChangeCommit";
import {
  isDrawingPointerEventOwned,
  shouldDrawingOwnPointerEvent,
} from "./drawing/drawingPointerOwnership";

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
  resolveVelaInitialViewportWindow,
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
export interface ChartViewportChange {
  startTime: string;
  endTime: string;
  yScale: number;
  isYManual: boolean;
}
type ViewportApplyMode = "queued" | "immediate";
type HistoryPrependCommit = {
  dataLength: number;
  prependedBars: number;
  firstTime: string;
};

export interface TradingViewTimeAxisControls {
  zoomIn: () => void;
  zoomInAt: (cursorRatio: number) => void;
  zoomToSelection: (selection: {
    xStartRatio: number;
    xEndRatio: number;
    yStartRatio: number;
    yEndRatio: number;
  }) => void;
  zoomOut: () => void;
  undoInteractiveZoom: () => boolean;
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
  fitInitialData?: boolean;
  interactionScopeKey?: string;
  hasComparisonEndLabels?: boolean;
  lastPriceAxisValue?: number;
  priceLevelMarkers?: PriceLevelViewportMarker[];
  onHistoryBoundaryRequest?: (direction: HistoryBoundaryDirection) => void;
  onViewportChange?: (viewport: ChartViewportChange) => void;
  scheduleChartMutation?: ChartMutationScheduler;
}

export const useChartViewport = ({
  chartInstanceRef,
  getChartContainer,
  chartData,
  lastZoomRangeRef,
  fitInitialData = false,
  interactionScopeKey,
  hasComparisonEndLabels = false,
  lastPriceAxisValue,
  priceLevelMarkers = [],
  onHistoryBoundaryRequest,
  onViewportChange,
  scheduleChartMutation,
}: UseChartViewportProps) => {
  const viewportStateRef = useRef({
    startIdx: 0,
    endIdx: 100,
    historyGapBars: TV_MAX_HISTORY_GAP_BARS,
    yScale: 1.0,
    yPan: 0,
    isYManual: false,
    renderedYMin: Number.NaN,
    renderedYMax: Number.NaN,
    lastAutoscaleAt: 0,
    lastDataLength: 0,
    isDraggingXPan: false,
    isDraggingXScale: false,
    isDraggingYScale: false,
    isDraggingChart: false,
    gestureActivated: false,
    pointerDownX: 0,
    pointerDownY: 0,
    startX: 0,
    startY: 0,
    initialXSpan: 0,
    initialXEnd: 0,
    panStartIdx: 0,
    panStartEnd: 0,
    lastPanX: 0,
    panPriceManualAtStart: false,
    panVelocityPxPerMs: 0,
    lastPanAt: 0,
    initialYScale: 1.0,
    initialYPan: 0,
    lastTap: 0,
    activePointers: new Map<number, PointerEvent>(),
    initialPinchDistance: 0,
    initialPinchCenter: 0,
    initialPinchSpan: 0,
    pinchAnchorLogical: 0,
    cachedRect: null as DOMRect | null // [TENOR 2026 SRE] Cache rect on pointerdown
  });

  const interactiveZoomHistoryRef = useRef<Array<{
    startIdx: number;
    endIdx: number;
    yScale: number;
    yPan: number;
    isYManual: boolean;
    historyGapBars: number;
  }>>([]);

  const prevDataMaxRef = useRef<number>(0);
  const lastDataFirstTimeRef = useRef<string | null>(null);
  const lastFitInitialDataRef = useRef(fitInitialData);
  // Wheel input is frame-paced. A history response can land after the browser
  // accepts the wheel but before the first rAF mutates startIdx/endIdx. This barrier
  // records that user intent synchronously so an in-flight prepend cannot refit
  // "Tout" over the interaction during that narrow race window.
  const pendingTimeViewportInteractionRef = useRef(false);
  const previousPriceLevelGraphicIdsRef = useRef<Set<string>>(new Set());
  const onViewportChangeRef = useRef(onViewportChange);
  const viewportChangeCommitRef = useRef<ViewportChangeCommitBuffer | null>(null);
  if (viewportChangeCommitRef.current === null) {
    viewportChangeCommitRef.current = new ViewportChangeCommitBuffer((viewport) => {
      onViewportChangeRef.current?.(viewport);
    });
  }
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
  useLayoutEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);
  useLayoutEffect(() => {
    // A chart-cell switch owns a distinct viewport even when both cells happen to
    // expose the same date window. Drop any stale in-flight persistence snapshot;
    // the new scope will publish its own canonical seed after rendering.
    viewportChangeCommitRef.current?.reset();
  }, [interactionScopeKey]);
  useEffect(() => () => viewportChangeCommitRef.current?.cancel(), []);

  const enqueueChartMutation = useCallback((key: string, mutation: (chart: ECharts) => void, _mode: ViewportApplyMode = "queued") => {
    // Once a canonical scheduler exists, every viewport mutation must pass through
    // it — including interaction paths historically labelled "immediate". Bypassing
    // the scheduler can re-enter ECharts while a full-option commit is still inside
    // its main process, which ECharts explicitly rejects.
    if (scheduleChartMutation) {
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

    state.startIdx = Math.max(-state.historyGapBars, Math.min(totalBars - 1, state.startIdx));
    state.endIdx = Math.min(totalBars - 1 + TV_MAX_FUTURE_BARS, state.endIdx);

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
    let targetMin = autoRange.min;
    let targetMax = autoRange.max;

    if (state.isYManual) {
      const scaledRange = ((visibleMax - visibleMin) + padding * 2) * state.yScale;
      targetMin = center - (scaledRange / 2) + state.yPan;
      targetMax = center + (scaledRange / 2) + state.yPan;

      // TradingView permits panning the price scale beyond the visible candle extrema.
      // Reject only non-finite or inverted ranges.
      const isInvalidManualViewport =
        !Number.isFinite(targetMin) ||
        !Number.isFinite(targetMax) ||
        targetMin >= targetMax;

      if (isInvalidManualViewport) {
        state.isYManual = false;
        state.yScale = 1.0;
        state.yPan = 0;
        targetMin = autoRange.min;
        targetMax = autoRange.max;
      }
    }

    const autoscaleTarget = { min: targetMin, max: targetMax };

    const axisIndexOffset = state.historyGapBars;
    const primaryXAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
    const axisCategories = Array.isArray(primaryXAxis?.data) ? primaryXAxis.data : [];
    const renderedTimeWindow = resolveRenderedTimeAxisWindow({
      axisCategories,
      sourceTimes: chartData.map((point) => point.time),
      sourceStartIdx: state.startIdx,
      sourceEndIdx: state.endIdx,
      historyGapBars: axisIndexOffset,
    });
    const viewportOption = {
      xAxis: Array.isArray(option.xAxis)
        ? option.xAxis.map((axis: any, index: number) => ({ id: axis?.id ?? index }))
        : undefined,
      dataZoom: [{
        id: 'time-zoom',
        xAxisIndex: resolveTimeDataZoomAxisIndexes(option),
        filterMode: 'none',
        startValue: axisCategories.length > 0 ? renderedTimeWindow.startValue : axisIndexOffset + state.startIdx,
        endValue: axisCategories.length > 0 ? renderedTimeWindow.endValue : axisIndexOffset + state.endIdx,
      }],
    };

    const timeViewportSnapshot = createTimeViewportSyncSnapshot(
      chartData,
      state.startIdx,
      state.endIdx,
    );
    if (timeViewportSnapshot) {
      publishTimeViewportSync(chart, timeViewportSnapshot);

      const viewportEmission: ChartViewportChange = {
        startTime: timeViewportSnapshot.startTime,
        endTime: timeViewportSnapshot.endTime,
        yScale: state.yScale,
        isYManual: state.isYManual,
      };
      // The ECharts viewport remains imperative and frame-paced. Redux persistence
      // is deliberately kept out of this hot path and receives only the latest
      // snapshot after an interaction burst becomes idle.
      viewportChangeCommitRef.current?.schedule(viewportEmission);
    }

    const commitViewport = (targetChart: ECharts) => {
      let finalMin = autoscaleTarget.min;
      let finalMax = autoscaleTarget.max;
      let autoscaleMoving = false;

      if (!state.isYManual) {
        const now = performance.now();
        const deltaMs = state.lastAutoscaleAt > 0
          ? Math.max(1, Math.min(64, now - state.lastAutoscaleAt))
          : 1000 / 60;
        const currentRange = (
          Number.isFinite(state.renderedYMin)
          && Number.isFinite(state.renderedYMax)
          && state.renderedYMin < state.renderedYMax
        )
          ? { min: state.renderedYMin, max: state.renderedYMax }
          : null;
        const easedRange = easeAutoScaleRange(currentRange, autoscaleTarget, deltaMs);
        finalMin = easedRange.min;
        finalMax = easedRange.max;
        autoscaleMoving = easedRange.moving;
        state.lastAutoscaleAt = now;
      } else {
        state.lastAutoscaleAt = 0;
      }

      state.renderedYMin = finalMin;
      state.renderedYMax = finalMax;

      const offscreenPriceLevelGraphics = buildOffscreenPriceLevelGraphics({
        chart: targetChart,
        container: getChartContainer(),
        markers: priceLevelMarkers,
        yAxisMin: finalMin,
        yAxisMax: finalMax,
        previousGraphicIds: previousPriceLevelGraphicIdsRef.current,
      });

      const currentYAxis = Array.isArray(option.yAxis) ? option.yAxis : [option.yAxis];
      const hasVolumeAxis = currentYAxis.some((axis: any) => axis?.id === 'volume-yaxis');
      const yAxisViewportUpdates: any[] = [
        { id: 'price-yaxis', min: finalMin, max: finalMax, scale: false },
      ];
      if (hasVolumeAxis) {
        yAxisViewportUpdates.push({
          id: 'volume-yaxis',
          min: 0,
          max: resolveVisibleVolumeOverlayAxisMax(chartData, state.startIdx, state.endIdx),
          scale: false,
        });
      }

      targetChart.setOption({
        ...viewportOption,
        yAxis: yAxisViewportUpdates,
        ...(offscreenPriceLevelGraphics.length > 0 ? { graphic: offscreenPriceLevelGraphics } : {}),
      }, {
        notMerge: false,
        lazyUpdate: false,
        silent: true,
      });

      if (autoscaleMoving && scheduleChartMutation) {
        scheduleChartMutation("viewport", commitViewport);
      }
    };

    enqueueChartMutation("viewport", commitViewport, mode);

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
    scheduleChartMutation,
  ]);

  const scheduleViewportApply = useCallback((mode: ViewportApplyMode = "queued") => {
    // The renderer already owns the canonical rAF scheduler. Enqueue immediately
    // into its keyed viewport slot so rapid input coalesces to one latest-wins
    // chart mutation per browser frame, matching Vela's Scheduler semantics.
    if (scheduleChartMutation) {
      applyViewport(mode);
      return;
    }

    // Fallback only for isolated hook usage without the renderer scheduler.
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
  }, [applyViewport, scheduleChartMutation]);

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
    const fitAllBecameActive = fitInitialData && !lastFitInitialDataRef.current;
    const wasStillFitAllBeforePrepend =
      isHistoryPrepend
      && Math.abs(state.startIdx) <= 1e-6
      && state.endIdx >= (lastLen - 1) - 1e-6;
    const shouldRefitAllAfterPrepend =
      fitInitialData
      && !pendingTimeViewportInteractionRef.current
      && wasStillFitAllBeforePrepend;

    // "Tout" defines the initial/full-range intent. It must not overwrite a
    // viewport that the user has already narrowed or panned while a history page
    // is in flight. Only a viewport that is still genuinely fit-all may expand
    // when prepended history arrives; otherwise the branch below translates the
    // live logical window by the prepended bar count.
    if (fitInitialData && (lastLen === 0 || currentLen < lastLen || fitAllBecameActive || shouldRefitAllAfterPrepend)) {
      historyPrependCommitRef.current = null;
      const chartWidth = chartInstanceRef.current?.getWidth?.() ?? getChartContainer()?.clientWidth ?? 0;
      const plotWidthPx = Math.max(0, chartWidth - TV_Y_AXIS_WIDTH);
      const nextViewport = plotWidthPx > 0
        ? resolveVelaInitialViewportWindow(currentLen, plotWidthPx, undefined, undefined, true)
        : { startIdx: 0, endIdx: currentLen - 1 };
      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      state.yScale = 1.0;
      state.yPan = 0;
      state.isYManual = false;
      state.renderedYMin = Number.NaN;
      state.renderedYMax = Number.NaN;
      state.lastAutoscaleAt = 0;
      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;
      pendingTimeViewportInteractionRef.current = false;
    } else if (isHistoryPrepend) {
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
      const chartWidth = chartInstanceRef.current?.getWidth?.() ?? getChartContainer()?.clientWidth ?? 0;
      const plotWidthPx = Math.max(0, chartWidth - TV_Y_AXIS_WIDTH);
      const nextViewport = plotWidthPx > 0
        ? resolveVelaInitialViewportWindow(currentLen, plotWidthPx, undefined, undefined, fitInitialData)
        : fitInitialData
          ? { startIdx: 0, endIdx: currentLen - 1 }
          : resolveInitialViewportWindow(currentLen);
      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      state.yScale = 1.0;
      state.yPan = 0;
      state.isYManual = false;
      state.renderedYMin = Number.NaN;
      state.renderedYMax = Number.NaN;
      state.lastAutoscaleAt = 0;
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
    lastFitInitialDataRef.current = fitInitialData;
    state.lastDataLength = currentLen;
  }, [chartData, chartInstanceRef, fitInitialData, getChartContainer]);

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
    let pendingWheelAnchorRatio = 1;
    let zoomGlideFrameId: number | null = null;
    let zoomGlideLastTimestamp = 0;
    let zoomTargetSpan: number | null = null;
    let zoomAnchorLogical = 0;
    let zoomAnchorRatio = 1;
    let panMomentumFrameId: number | null = null;
    let panMomentumLastTimestamp = 0;

    const resolveExpandablePanViewport = (
      state: typeof viewportStateRef.current,
      totalBars: number,
      shift: number,
    ) => {
      // Match Vela's continuous rightOffset clamp: history and future reserves
      // stay in one stable coordinate space in both directions. Collapsing future
      // space when direction reverses changes the coordinate system mid-gesture.
      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;

      return computeHorizontalPanViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        shift,
        maxHistoryGapBars: TV_MAX_HISTORY_GAP_BARS,
        maxFutureBars: TV_MAX_FUTURE_BARS,
        preserveEnd: false,
      });
    };

    const cancelZoomGlide = () => {
      if (zoomGlideFrameId !== null) cancelAnimationFrame(zoomGlideFrameId);
      zoomGlideFrameId = null;
      zoomGlideLastTimestamp = 0;
      zoomTargetSpan = null;
    };

    const runZoomGlide = (timestamp: number) => {
      const targetSpan = zoomTargetSpan;
      const state = viewportStateRef.current;
      const totalBars = chartDataRef.current.length;
      if (targetSpan === null || !getLiveChart() || totalBars <= 1) {
        cancelZoomGlide();
        return;
      }

      const deltaMs = zoomGlideLastTimestamp === 0
        ? 1000 / 60
        : Math.max(1, Math.min(64, timestamp - zoomGlideLastTimestamp));
      zoomGlideLastTimestamp = timestamp;

      const currentSpan = Math.max(TV_MIN_VISIBLE_BARS, state.endIdx - state.startIdx);
      const currentSpacing = 1 / currentSpan;
      const targetSpacing = 1 / Math.max(TV_MIN_VISIBLE_BARS, targetSpan);
      const nextSpacing = exponentialApproach(currentSpacing, targetSpacing, deltaMs, TV_ZOOM_EASE_TAU_MS);
      const nextSpan = 1 / Math.max(Number.EPSILON, nextSpacing);
      const nextStart = zoomAnchorLogical - (nextSpan * zoomAnchorRatio);
      const nextViewport = clampViewportWindowWithFuture(
        nextStart,
        nextStart + nextSpan,
        totalBars,
        TV_MAX_FUTURE_BARS,
        TV_MAX_HISTORY_GAP_BARS,
      );

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      pendingTimeViewportInteractionRef.current = false;
      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      scheduleViewportApply("immediate");

      if (Math.abs(nextSpan - targetSpan) <= Math.max(0.002, targetSpan * 0.001)) {
        zoomGlideFrameId = null;
        zoomGlideLastTimestamp = 0;
        zoomTargetSpan = null;
        viewportChangeCommitRef.current?.flush();
        return;
      }
      zoomGlideFrameId = requestAnimationFrame(runZoomGlide);
    };

    const startZoomGlide = (targetSpan: number, anchorLogical: number, anchorRatio: number) => {
      zoomTargetSpan = Math.max(TV_MIN_VISIBLE_BARS, targetSpan);
      zoomAnchorLogical = anchorLogical;
      zoomAnchorRatio = clamp(anchorRatio, 0, 1);
      if (zoomGlideFrameId !== null) return;
      zoomGlideLastTimestamp = 0;
      zoomGlideFrameId = requestAnimationFrame(runZoomGlide);
    };

    const cancelPanMomentum = () => {
      if (panMomentumFrameId !== null) cancelAnimationFrame(panMomentumFrameId);
      panMomentumFrameId = null;
      panMomentumLastTimestamp = 0;
    };

    const runPanMomentum = (timestamp: number) => {
      const state = viewportStateRef.current;
      const chart = getLiveChart();
      if (!chart || Math.abs(state.panVelocityPxPerMs) < TV_PAN_STOP_VELOCITY_PX_PER_MS) {
        cancelPanMomentum();
        state.panVelocityPxPerMs = 0;
        viewportChangeCommitRef.current?.flush();
        return;
      }
      const deltaMs = panMomentumLastTimestamp === 0
        ? 1000 / 60
        : Math.max(1, Math.min(32, timestamp - panMomentumLastTimestamp));
      panMomentumLastTimestamp = timestamp;
      const rect = containerEl.getBoundingClientRect();
      const gridWidth = Math.max(1, rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH);
      const visibleCount = Math.max(1, state.endIdx - state.startIdx);
      const pixelTravel = state.panVelocityPxPerMs * deltaMs;
      const shift = -(pixelTravel / gridWidth) * visibleCount;
      const totalBars = chartDataRef.current.length;
      const nextViewport = resolveExpandablePanViewport(state, totalBars, shift);
      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      state.panVelocityPxPerMs = decayPanVelocity(
        state.panVelocityPxPerMs,
        deltaMs,
        TV_PAN_MOMENTUM_TAU_MS,
      );
      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      scheduleViewportApply("immediate");
      panMomentumFrameId = requestAnimationFrame(runPanMomentum);
    };

    const startPanMomentum = () => {
      if (Math.abs(viewportStateRef.current.panVelocityPxPerMs) < TV_PAN_FLING_MIN_VELOCITY_PX_PER_MS) return;
      cancelPanMomentum();
      panMomentumLastTimestamp = 0;
      panMomentumFrameId = requestAnimationFrame(runPanMomentum);
    };

    const pushInteractiveZoomSnapshot = () => {
      const state = viewportStateRef.current;
      interactiveZoomHistoryRef.current.push({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        yScale: state.yScale,
        yPan: state.yPan,
        isYManual: state.isYManual,
        historyGapBars: state.historyGapBars,
      });
    };

    const undoInteractiveZoom = (): boolean => {
      const previous = interactiveZoomHistoryRef.current.pop();
      if (!previous) return false;

      const state = viewportStateRef.current;
      state.startIdx = previous.startIdx;
      state.endIdx = previous.endIdx;
      state.yScale = previous.yScale;
      state.yPan = previous.yPan;
      state.isYManual = previous.isYManual;
      state.historyGapBars = previous.historyGapBars;
      notifyHistoryBoundary(state.startIdx, state.endIdx, chartDataRef.current.length);
      applyViewport("immediate");
      return true;
    };

    const applyExternalTimeZoom = (direction: "in" | "out", cursorRatio = 0.5, trackInteractive = false) => {
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;
      const state = viewportStateRef.current;
      const totalBars = chartDataRef.current.length;
      if (trackInteractive && direction === "in") {
        pushInteractiveZoomSnapshot();
      }
      const syntheticDeltaY = direction === "in" ? -120 : 120;
      const zoomFactor = Math.exp(syntheticDeltaY * TV_ZOOM_VELOCITY);
      const boundedCursorRatio = Math.max(0, Math.min(1, cursorRatio));

      const nextViewport = computeDirectionalZoomViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        cursorRatio: boundedCursorRatio,
        zoomFactor,
        deltaY: 0,
      });

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      applyViewport();
    };

    const applyExternalZoomSelection = ({
      xStartRatio,
      xEndRatio,
      yStartRatio,
      yEndRatio,
    }: {
      xStartRatio: number;
      xEndRatio: number;
      yStartRatio: number;
      yEndRatio: number;
    }) => {
      const chart = getLiveChart();
      if (!chart || chartDataRef.current.length === 0) return;

      const state = viewportStateRef.current;
      const totalBars = chartDataRef.current.length;
      pushInteractiveZoomSnapshot();
      const previousStart = state.startIdx;
      const previousEnd = state.endIdx;
      const previousSpan = Math.max(1, previousEnd - previousStart);
      const leftRatio = clamp(Math.min(xStartRatio, xEndRatio), 0, 1);
      const rightRatio = clamp(Math.max(xStartRatio, xEndRatio), 0, 1);

      const nextStart = previousStart + (previousSpan * leftRatio);
      const nextEnd = previousStart + (previousSpan * rightRatio);
      const nextViewport = clampViewportWindowWithFuture(
        nextStart,
        nextEnd,
        totalBars,
        Math.max(0, previousEnd - (totalBars - 1)),
      );

      const option = chart.getOption() as any;
      const primaryYAxis = Array.isArray(option?.yAxis) ? option.yAxis[0] : option?.yAxis;
      const currentMin = Number(primaryYAxis?.min);
      const currentMax = Number(primaryYAxis?.max);
      const topRatio = clamp(Math.min(yStartRatio, yEndRatio), 0, 1);
      const bottomRatio = clamp(Math.max(yStartRatio, yEndRatio), 0, 1);

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;

      if (
        Number.isFinite(currentMin)
        && Number.isFinite(currentMax)
        && currentMax > currentMin
        && bottomRatio - topRatio > 0.01
      ) {
        const currentRange = currentMax - currentMin;
        const selectedMax = currentMax - (currentRange * topRatio);
        const selectedMin = currentMax - (currentRange * bottomRatio);
        const selectedRange = selectedMax - selectedMin;
        const selectedCenter = (selectedMax + selectedMin) / 2;

        const autoRange = resolveAutoViewportPriceRange({
          chartData: chartDataRef.current,
          startIdx: Math.max(0, Math.floor(state.startIdx)),
          endIdx: Math.max(0, Math.min(totalBars - 1, Math.ceil(state.endIdx))),
          hasComparisonEndLabels,
          lastPriceAxisValue,
        });
        const autoBaseRange = Math.max(
          Number.EPSILON,
          (autoRange.visibleMax - autoRange.visibleMin) + (autoRange.padding * 2),
        );

        state.isYManual = true;
        state.yScale = selectedRange / autoBaseRange;
        state.yPan = selectedCenter - autoRange.center;
      }

      notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
      applyViewport("immediate");
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
      interactiveZoomHistoryRef.current = [];
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
        zoomInAt: (cursorRatio) => applyExternalTimeZoom("in", cursorRatio, true),
        zoomToSelection: (selection) => applyExternalZoomSelection(selection),
        zoomOut: () => applyExternalTimeZoom("out"),
        undoInteractiveZoom,
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
      if (deltaX !== 0) {
        cancelZoomGlide();
        const rect = containerEl.getBoundingClientRect();
        const gridWidth = Math.max(1, rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH);
        const visibleCount = Math.max(TV_MIN_VISIBLE_BARS, state.endIdx - state.startIdx);
        const shift = (deltaX / gridWidth) * visibleCount;
        const nextViewport = resolveExpandablePanViewport(state, totalBars, shift);
        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
        scheduleViewportApply("immediate");
        return;
      }

      const currentSpan = Math.max(TV_MIN_VISIBLE_BARS, state.endIdx - state.startIdx);
      const anchorRatio = pendingWheelAnchorRatio;
      const anchorLogical = state.startIdx + (currentSpan * anchorRatio);
      const targetViewport = computeTradingViewWheelZoomViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        deltaY,
        cursorRatio: anchorRatio,
        maxHistoryGapBars: TV_MAX_HISTORY_GAP_BARS,
        maxFutureBars: TV_MAX_FUTURE_BARS,
      });

      state.historyGapBars = TV_MAX_HISTORY_GAP_BARS;
      startZoomGlide(
        Math.max(TV_MIN_VISIBLE_BARS, targetViewport.endIdx - targetViewport.startIdx),
        anchorLogical,
        anchorRatio,
      );
    };

    const onWheel = (event: WheelEvent) => {
      // Vela owns wheel input regardless of grab/crosshair cursor styling.
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
      // Exact Vela 0.7.2 contract: native WheelEvent deltas are consumed directly.
      const rawWheelDeltaY = event.deltaY;
      const rawWheelDeltaX = event.deltaX;

      cancelPanMomentum();
      state.panVelocityPxPerMs = 0;

      if (isOnYAxis) {
        const totalBars = chartDataRef.current.length;
        const autoRange = resolveAutoViewportPriceRange({ chartData: chartDataRef.current, startIdx: state.startIdx, endIdx: Math.min(totalBars - 1, state.endIdx), hasComparisonEndLabels, lastPriceAxisValue });
        const baseRange = Math.max(1, autoRange.visibleMax - autoRange.visibleMin + autoRange.padding * 2);
        const gridHeight = Math.max(1, rect.height - TV_X_AXIS_HEIGHT);
        const nextPriceViewport = computePriceAxisWheelViewport({
          center: autoRange.center,
          baseRange,
          yScale: state.yScale,
          yPan: state.yPan,
          cursorRatio: mouseY / gridHeight,
          gridHeight,
          wheelDeltaY: rawWheelDeltaY,
        });
        state.yScale = nextPriceViewport.yScale;
        state.yPan = nextPriceViewport.yPan;
        state.isYManual = true;
        scheduleViewportApply("immediate");
        return;
      }

      if (isOnChart || isOnXAxis) {
        const horizontalPanDelta = Math.abs(rawWheelDeltaX) > Math.abs(rawWheelDeltaY)
          ? rawWheelDeltaX
          : event.shiftKey
            ? rawWheelDeltaY
            : null;
        const gridWidth = Math.max(1, gridRightPx - MAIN_GRID_LEFT);
        const cursorRatio = clamp((mouseX - MAIN_GRID_LEFT) / gridWidth, 0, 1);

        // Vela rightEdgeZoom=true: ordinary wheel pins the right edge.
        // Ctrl/Cmd temporarily pins the logical candle under the cursor.
        pendingWheelAnchorRatio = (event.ctrlKey || event.metaKey) ? cursorRatio : 1;
        // Mark the interaction before rAF. This closes the race where an
        // already in-flight history prepend resolves between the wheel event and
        // flushChartWheel/runZoomGlide mutating the logical viewport.
        pendingTimeViewportInteractionRef.current = true;
        if (horizontalPanDelta !== null) {
          pendingWheelDeltaX += horizontalPanDelta;
        } else {
          pendingWheelDeltaY += rawWheelDeltaY;
        }

        if (wheelFrameId === null) {
          wheelFrameId = requestAnimationFrame(flushChartWheel);
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      // Drawing ownership is decided during React root capture before this native
      // container-capture listener runs. A drawing drag and viewport pan are
      // mutually exclusive, matching TradingView's interaction contract.
      if (isDrawingPointerEventOwned(event)) return;
      if (!getLiveChart()) return;

      const state = viewportStateRef.current;
      cancelZoomGlide();
      cancelPanMomentum();
      state.panVelocityPxPerMs = 0;
      state.lastPanAt = event.timeStamp;
      state.gestureActivated = false;
      state.pointerDownX = event.clientX;
      state.pointerDownY = event.clientY;
      state.activePointers.set(event.pointerId, event);
      
      // [TENOR 2026 SRE] Cache rect on pointer down to avoid layout thrashing in pointermove
      state.cachedRect = containerEl.getBoundingClientRect();

      const now = Date.now();
      if (now - state.lastTap < 300 && state.activePointers.size === 1) {
        onDoubleClick(event);
        state.lastTap = 0;
        state.activePointers.delete(event.pointerId);
        state.cachedRect = null;
        return;
      }
      state.lastTap = now;

      const target = event.target as HTMLElement;
      if (target) {
        if (isPriceAxisInteractiveTarget(event.target)) {
          state.activePointers.delete(event.pointerId);
          state.cachedRect = null;
          return;
        }
        const drawingCanvas = target.closest('.gp-drawing-canvas') as HTMLCanvasElement | null;
        const drawingInteraction = drawingCanvas?.dataset.drawingInteraction;
        if (
          drawingInteraction === 'tool'
          || drawingInteraction === 'eraser'
          || drawingInteraction === 'magic'
          || (drawingInteraction === 'selection' && shouldDrawingOwnPointerEvent(drawingCanvas, event))
        ) {
          state.activePointers.delete(event.pointerId);
          state.cachedRect = null;
          return;
        }
        // Chart canvases may expose a move/grab cursor while still being the
        // horizontal pan surface. Drawing canvases remain protected above by their
        // explicit interaction modes, so cursor styling must not veto chart panning.
        if (target.closest('.gp-drawing-overlay-shield')) {
          state.activePointers.delete(event.pointerId);
          state.cachedRect = null;
          return;
        }
      }

      try {
        containerEl.setPointerCapture?.(event.pointerId);
      } catch {
        // Window capture listeners remain the fallback on browsers that reject capture here.
      }

      const rect = state.cachedRect;
      
      // [TENOR 2026 SRE FIX] Multi-touch Pinch Initialization
      if (state.activePointers.size >= 2) {
        const pointers = Array.from(state.activePointers.values()).slice(0, 2); // Strictly 2 fingers
        const p1 = pointers[0];
        const p2 = pointers[1];
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        
        state.initialPinchDistance = Math.max(1, Math.hypot(dx, dy));
        state.initialPinchCenter = ((p1.clientX + p2.clientX) / 2) - rect.left;
        state.initialPinchSpan = Math.max(TV_MIN_VISIBLE_BARS, state.endIdx - state.startIdx);
        state.panStartIdx = state.startIdx;
        state.panStartEnd = state.endIdx;
        const pinchGridWidth = Math.max(1, rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH);
        const pinchStartRatio = clamp((state.initialPinchCenter - MAIN_GRID_LEFT) / pinchGridWidth, 0, 1);
        state.pinchAnchorLogical = state.startIdx + (state.initialPinchSpan * pinchStartRatio);
        
        state.isDraggingXPan = false;
        state.isDraggingXScale = false;
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
        state.isDraggingXScale = true;
        state.startX = event.clientX;
        state.initialXSpan = Math.max(TV_MIN_VISIBLE_BARS, state.endIdx - state.startIdx);
        state.initialXEnd = state.endIdx;
      } else if (isOnChart) {
        state.isDraggingChart = true;
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.panStartIdx = state.startIdx;
        state.panStartEnd = state.endIdx;
        state.lastPanX = event.clientX;
        state.panPriceManualAtStart = state.isYManual;
        state.initialYPan = state.yPan;
        state.initialYScale = state.yScale;
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const chart = getLiveChart();
      if (!chart || chartData.length === 0) return;

      const state = viewportStateRef.current;

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

        const totalBars = chartDataRef.current.length;
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const gridWidth = Math.max(1, rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH);
        const liveMidX = (((p1.clientX + p2.clientX) / 2) - rect.left);
        const liveMidRatio = clamp((liveMidX - MAIN_GRID_LEFT) / gridWidth, 0, 1);

        const nextViewport = computeVelaPinchViewport({
          startIdx: state.panStartIdx,
          endIdx: state.panStartEnd,
          totalBars,
          startDistance: state.initialPinchDistance,
          currentDistance,
          anchorLogical: state.pinchAnchorLogical,
          currentMidpointRatio: liveMidRatio,
          maxHistoryGapBars: TV_MAX_HISTORY_GAP_BARS,
          maxFutureBars: TV_MAX_FUTURE_BARS,
        });

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
        scheduleViewportApply("immediate");
        return;
      }

      if (state.activePointers.size === 1 && !state.gestureActivated) {
        const threshold = event.pointerType === "touch" ? 8 : 2;
        if (Math.hypot(event.clientX - state.pointerDownX, event.clientY - state.pointerDownY) < threshold) return;
        state.gestureActivated = true;
      }

      if (state.isDraggingYScale) {
        const deltaY = event.clientY - state.startY;
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const totalBars = chartDataRef.current.length;
        const autoRange = resolveAutoViewportPriceRange({ chartData: chartDataRef.current, startIdx: state.startIdx, endIdx: Math.min(totalBars - 1, state.endIdx), hasComparisonEndLabels, lastPriceAxisValue });
        const baseRange = Math.max(1, autoRange.visibleMax - autoRange.visibleMin + autoRange.padding * 2);
        const gridHeight = Math.max(1, rect.height - TV_X_AXIS_HEIGHT);
        const nextPriceViewport = computePriceAxisDragViewport({
          center: autoRange.center,
          baseRange,
          initialYScale: state.initialYScale,
          initialYPan: state.initialYPan,
          startRatio: (state.startY - rect.top) / gridHeight,
          currentRatio: (event.clientY - rect.top) / gridHeight,
          deltaY,
        });
        state.yScale = nextPriceViewport.yScale;
        state.yPan = nextPriceViewport.yPan;
        state.isYManual = true;
        scheduleViewportApply("immediate");
      } else if (state.isDraggingXScale) {
        const deltaX = event.clientX - state.startX;
        const totalBars = chartDataRef.current.length;
        const targetSpan = state.initialXSpan * Math.exp(deltaX * TV_TIME_AXIS_DRAG_ZOOM_VELOCITY);
        const nextViewport = clampViewportWindowWithFuture(
          state.initialXEnd - targetSpan,
          state.initialXEnd,
          totalBars,
          Math.max(0, state.initialXEnd - (totalBars - 1)),
          TV_MAX_HISTORY_GAP_BARS,
        );
        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);
        scheduleViewportApply("immediate");
      } else if (state.isDraggingChart || state.isDraggingXPan) {
        const deltaXFromStart = event.clientX - state.startX;
        const instantaneousDeltaX = event.clientX - state.lastPanX;
        const deltaTime = Math.max(1, event.timeStamp - state.lastPanAt);
        state.panVelocityPxPerMs = filterPanVelocity(state.panVelocityPxPerMs, instantaneousDeltaX / deltaTime);
        state.lastPanX = event.clientX;
        state.lastPanAt = event.timeStamp;

        const totalBars = chartDataRef.current.length;
        const baseStart = state.panStartIdx;
        const baseEnd = state.panStartEnd > baseStart ? state.panStartEnd : state.endIdx;
        const visibleCount = Math.max(TV_MIN_VISIBLE_BARS, baseEnd - baseStart);
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const gridWidth = Math.max(1, rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH);
        const shiftX = -(deltaXFromStart / gridWidth) * visibleCount;

        const nextViewport = resolveExpandablePanViewport(
          { ...state, startIdx: baseStart, endIdx: baseEnd },
          totalBars,
          shiftX,
        );

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;
        notifyHistoryBoundary(state.startIdx, state.endIdx, totalBars);

        if (state.panPriceManualAtStart) {
          const autoRange = resolveAutoViewportPriceRange({
            chartData: chartDataRef.current,
            startIdx: Math.max(0, state.startIdx),
            endIdx: Math.max(0, Math.min(totalBars - 1, state.endIdx)),
            hasComparisonEndLabels,
            lastPriceAxisValue,
          });
          const gridHeight = Math.max(1, rect.height - TV_X_AXIS_HEIGHT);
          const priceRange = Math.max(1, autoRange.visibleMax - autoRange.visibleMin + autoRange.padding * 2);
          state.yPan = computePriceAxisPan({
            initialYPan: state.initialYPan,
            deltaY: event.clientY - state.startY,
            gridHeight,
            priceRange,
            yScale: state.initialYScale,
          });
        }
        scheduleViewportApply("immediate");
      }
    };

    const onPointerUp = (event: PointerEvent) => {
      const state = viewportStateRef.current;
      const wasPanGesture = state.gestureActivated && (state.isDraggingChart || state.isDraggingXPan);
      const lastPanAgeMs = Math.max(0, event.timeStamp - state.lastPanAt);
      state.activePointers.delete(event.pointerId);
      try {
        if (containerEl.hasPointerCapture?.(event.pointerId)) containerEl.releasePointerCapture(event.pointerId);
      } catch {
        // Global pointerup already terminates the gesture if capture release is rejected.
      }

      if (state.activePointers.size < 2) {
        state.initialPinchDistance = 0;
      }

      if (state.activePointers.size === 0) {
        state.isDraggingXPan = false;
        state.isDraggingXScale = false;
        state.isDraggingYScale = false;
        state.isDraggingChart = false;
        state.gestureActivated = false;
        state.cachedRect = null;
        if (wasPanGesture && lastPanAgeMs <= TV_PAN_FLING_MAX_AGE_MS) {
          startPanMomentum();
        } else {
          state.panVelocityPxPerMs = 0;
          viewportChangeCommitRef.current?.flush();
        }
      } else if (state.activePointers.size === 1) {
        const remainingPointer = Array.from(state.activePointers.values())[0];
        state.startX = remainingPointer.clientX;
        state.startY = remainingPointer.clientY;
        state.panStartIdx = state.startIdx;
        state.panStartEnd = state.endIdx;
        state.lastPanX = remainingPointer.clientX;
        state.lastPanAt = event.timeStamp;
        state.isDraggingXPan = true;
      }
    };

    const onPointerCancel = (event: PointerEvent) => {
      const state = viewportStateRef.current;

      // Match Vela's cancellation contract: the browser/system owns the pointer
      // again, so abandon the gesture exactly where it is. Never synthesize a
      // click or fling from pointercancel, and never leave a latent pinch/drag.
      state.activePointers.delete(event.pointerId);
      state.activePointers.clear();
      state.initialPinchDistance = 0;
      state.initialPinchCenter = 0;
      state.initialPinchSpan = 0;
      state.isDraggingXPan = false;
      state.isDraggingXScale = false;
      state.isDraggingYScale = false;
      state.isDraggingChart = false;
      state.gestureActivated = false;
      state.cachedRect = null;
      state.panVelocityPxPerMs = 0;
      cancelPanMomentum();

      try {
        if (containerEl.hasPointerCapture?.(event.pointerId)) containerEl.releasePointerCapture(event.pointerId);
      } catch {
        // A cancelled pointer may already have been released by the browser.
      }

      viewportChangeCommitRef.current?.flush();
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
    window.addEventListener("pointercancel", onPointerCancel, interactionListenerOptions);

    return () => {
      if (registryFrameId !== null) cancelAnimationFrame(registryFrameId);
      if (wheelFrameId !== null) cancelAnimationFrame(wheelFrameId);
      cancelZoomGlide();
      cancelPanMomentum();
      pendingWheelDeltaY = 0;
      pendingWheelDeltaX = 0;
      if (registeredChart) TimeAxisRegistry.delete(registeredChart);
      containerEl.removeEventListener("wheel", onWheel, wheelListenerOptions);
      containerEl.removeEventListener("pointerdown", onPointerDown, interactionListenerOptions);
      containerEl.removeEventListener("dblclick", onDoubleClick);
      
      window.removeEventListener("pointermove", onPointerMove, interactionListenerOptions);
      window.removeEventListener("pointerup", onPointerUp, interactionListenerOptions);
      window.removeEventListener("pointercancel", onPointerCancel, interactionListenerOptions);
    };
  }, [
    chartData.length,
    chartInstanceRef,
    getChartContainer,
    hasComparisonEndLabels,
    interactionScopeKey,
    lastPriceAxisValue,
    notifyHistoryBoundary,
    applyViewport,
    scheduleViewportApply,
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
    resetManualYViewport,
    viewportWindowRef,
    historyPrependCommitRef,
    completeHistoryPrependCommit,
  };
};

// --- EOF ---
