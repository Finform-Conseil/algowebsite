import { useEffect, useRef, MutableRefObject, useCallback } from "react";
import type { ECharts } from "echarts/core";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { isPriceAxisInteractiveTarget } from "./priceAxisInteractiveTargets";
import {
  MAIN_GRID_LEFT,
  TV_MIN_VISIBLE_BARS,
  TV_RESET_VISIBLE_BARS,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  TV_ZOOM_VELOCITY,
  clamp,
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  normalizeWheelDeltaPx,
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
  TV_MIN_VISIBLE_BARS,
  TV_PAN_DRIFT_DAMPING,
  TV_RESET_VISIBLE_BARS,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
  TV_ZOOM_DRIFT_BASE_RATIO,
  TV_ZOOM_DRIFT_STRENGTH,
  TV_ZOOM_VELOCITY,
  clamp,
  clampViewportWindow,
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  normalizeWheelDeltaPx,
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
type ViewportApplyMode = "queued" | "immediate";

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
  lastZoomRangeRef?: MutableRefObject<{ start: number; end: number; barsFromRightStart?: number; barsFromRightEnd?: number; }>;
  updateCursorPriceAxisBadge: (x: number, y: number) => void;
  updateLastPriceAxisBadge: () => void;
  interactionScopeKey?: string;
  hasComparisonEndLabels?: boolean;
  lastPriceAxisValue?: number;
  priceLevelMarkers?: PriceLevelViewportMarker[];
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
  scheduleChartMutation,
}: UseChartViewportProps) => {
  const viewportStateRef = useRef({
    startIdx: 0,
    endIdx: 100,
    yScale: 1.0,
    yPan: 0,
    isYManual: false,
    lastDataLength: 0,
    isDraggingXPan: false,
    isDraggingYScale: false,
    isDraggingChart: false,
    startX: 0,
    startY: 0,
    lastTap: 0,
    activePointers: new Map<number, PointerEvent>(),
    initialPinchDistance: 0,
    initialPinchCenter: 0,
    cachedRect: null as DOMRect | null // [TENOR 2026 SRE] Cache rect on pointerdown
  });

  const lastCursorClientPointRef = useRef<{ x: number; y: number } | null>(null);
  const prevDataMaxRef = useRef<number>(0);
  const previousPriceLevelGraphicIdsRef = useRef<Set<string>>(new Set());
  const viewportApplyRafRef = useRef<number | null>(null);
  const viewportApplyModeRef = useRef<ViewportApplyMode>("queued");

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

  const applyViewport = useCallback((mode: ViewportApplyMode = "queued") => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed() || chartData.length === 0) return;

    // [TENOR 2026 SRE] Guard against empty ECharts option state during asset transition/loading.
    // Prevents "Cannot read properties of undefined (reading 'coordinateSystem')" crash.
    const option = chart.getOption() as any;
    if (!option || !option.series || option.series.length === 0 || !option.yAxis) return;

    const state = viewportStateRef.current;
    const totalBars = chartData.length;

    state.startIdx = Math.max(0, Math.min(totalBars - 1, Math.round(state.startIdx)));
    state.endIdx = Math.max(0, Math.min(totalBars - 1, Math.round(state.endIdx)));

    if (state.startIdx >= state.endIdx) {
      state.startIdx = Math.max(0, state.endIdx - 10);
    }

    const autoRange = resolveAutoViewportPriceRange({
      chartData,
      startIdx: state.startIdx,
      endIdx: state.endIdx,
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

      const isInvalidManualViewport =
        !Number.isFinite(finalMin) ||
        !Number.isFinite(finalMax) ||
        finalMin >= finalMax ||
        finalMax < visibleMin ||
        finalMin > visibleMax;

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

    const viewportOption = {
      yAxis: [{ id: 'price-yaxis', min: finalMin, max: finalMax, scale: false }],
      dataZoom: [{
        id: 'time-zoom',
        xAxisIndex: resolveTimeDataZoomAxisIndexes(option),
        filterMode: 'none',
        startValue: state.startIdx,
        endValue: state.endIdx,
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
        barsFromRightEnd: totalBars - state.endIdx
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

  // Silent Hydration Shift
  useEffect(() => {
    const currentLen = chartData.length;
    const lastLen = viewportStateRef.current.lastDataLength;

    if (currentLen === 0) return;

    if (lastLen > 0 && currentLen > lastLen) {
      const diff = currentLen - lastLen;
      viewportStateRef.current.startIdx += diff;
      viewportStateRef.current.endIdx += diff;
      applyViewport();
    } else if (lastLen === 0 || currentLen < lastLen) {
      const nextViewport = resolveInitialViewportWindow(currentLen);
      viewportStateRef.current.startIdx = nextViewport.startIdx;
      viewportStateRef.current.endIdx = nextViewport.endIdx;
      viewportStateRef.current.yScale = 1.0;
      viewportStateRef.current.yPan = 0;
      viewportStateRef.current.isYManual = false;
      applyViewport();
    }
    viewportStateRef.current.lastDataLength = currentLen;
  }, [chartData.length, applyViewport]);

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
    let registeredChart: ECharts | null = null;
    let registryFrameId: number | null = null;
    let registryAttempts = 0;
    const maxRegistryAttempts = 12;

    const getLiveChart = (): ECharts | null => {
      const chart = chartInstanceRef.current;
      return isViewportChartUsable(chart) ? chart : null;
    };

    const applyExternalTimeZoom = (direction: "in" | "out") => {
      const chart = getLiveChart();
      if (!chart || chartData.length === 0) return;
      const state = viewportStateRef.current;
      const totalBars = chartData.length;
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
      applyViewport();
    };

    const applyExternalTimePan = (direction: "left" | "right") => {
      const chart = getLiveChart();
      if (!chart || chartData.length === 0) return;
      const state = viewportStateRef.current;
      const totalBars = chartData.length;
      const visibleCount = state.endIdx - state.startIdx;
      const directionMultiplier = direction === "left" ? -1 : 1;
      const shift = visibleCount * 0.18 * directionMultiplier;

      const nextViewport = computeHorizontalPanViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        shift,
      });

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      applyViewport();
    };

    const resetExternalTimeViewport = () => {
      const chart = getLiveChart();
      if (!chart || chartData.length === 0) return;
      const totalBars = chartData.length;
      const span = Math.min(Math.max(TV_MIN_VISIBLE_BARS, TV_RESET_VISIBLE_BARS), Math.max(1, totalBars - 1));
      const state = viewportStateRef.current;

      state.endIdx = totalBars - 1;
      state.startIdx = Math.max(0, state.endIdx - span);
      state.isYManual = false;
      state.yScale = 1.0;
      state.yPan = 0;
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
      if (!chart || chartData.length === 0) return;

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
        const zoomFactor = Math.exp(wheelDeltaY * TV_ZOOM_VELOCITY);
        state.yScale = Math.max(0.1, Math.min(5, state.yScale * zoomFactor));
        state.isYManual = true;
        scheduleViewportApply("immediate");
      } else if (isOnChart || isOnXAxis) {
        const totalBars = chartData.length;
        const visibleCount = state.endIdx - state.startIdx;

        if (Math.abs(wheelDeltaY) > Math.abs(wheelDeltaX)) {
          const zoomFactor = Math.exp(wheelDeltaY * TV_ZOOM_VELOCITY);
          const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
          const cursorRatio = Math.max(0, Math.min(1, (mouseX - MAIN_GRID_LEFT) / gridWidth));

          const nextViewport = computeDirectionalZoomViewport({
            startIdx: state.startIdx,
            endIdx: state.endIdx,
            totalBars,
            cursorRatio,
            zoomFactor,
            deltaY: wheelDeltaY,
          });

          state.startIdx = nextViewport.startIdx;
          state.endIdx = nextViewport.endIdx;
          scheduleViewportApply("immediate");
        } else {
          const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
          const shift = (wheelDeltaX / gridWidth) * visibleCount;

          const nextViewport = computeHorizontalPanViewport({
            startIdx: state.startIdx,
            endIdx: state.endIdx,
            totalBars,
            shift,
          });

          state.startIdx = nextViewport.startIdx;
          state.endIdx = nextViewport.endIdx;
          scheduleViewportApply("immediate");
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
        if (target.tagName === 'CANVAS') {
          const cursor = target.style.cursor;
          if (cursor === 'move' || cursor === 'grab' || cursor === 'grabbing' || cursor === 'ns-resize') {
            return;
          }
        }
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

        const totalBars = chartData.length;
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
        scheduleViewportApply("immediate");

        state.initialPinchDistance = currentDistance;
        return;
      }

      if (state.isDraggingYScale) {
        const deltaY = event.clientY - state.startY;
        state.startY = event.clientY;
        const scaleFactor = Math.exp(deltaY * 0.01);
        state.yScale = Math.max(0.1, Math.min(5, state.yScale * scaleFactor));
        state.isYManual = true;
        scheduleViewportApply("immediate");
      } else if (state.isDraggingChart || state.isDraggingXPan) {
        const deltaX = event.clientX - state.startX;
        state.startX = event.clientX;

        const totalBars = chartData.length;
        const visibleCount = state.endIdx - state.startIdx;
        
        const rect = state.cachedRect || containerEl.getBoundingClientRect();
        const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
        const shiftX = -(deltaX / gridWidth) * visibleCount;

        const nextViewport = computeHorizontalPanViewport({
          startIdx: state.startIdx,
          endIdx: state.endIdx,
          totalBars,
          shift: shiftX,
        });

        state.startIdx = nextViewport.startIdx;
        state.endIdx = nextViewport.endIdx;

        if (state.isDraggingChart) {
          const deltaY = event.clientY - state.startY;
          state.startY = event.clientY;

          if (state.isYManual) {
            const gridHeight = Math.max(1, rect.height - (rect.height * 0.08) - 30);
            let visibleMin = Infinity, visibleMax = -Infinity;
            for (let i = state.startIdx; i <= state.endIdx; i++) {
              if (chartData[i]) {
                visibleMin = Math.min(visibleMin, chartData[i].low);
                visibleMax = Math.max(visibleMax, chartData[i].high);
              }
            }
            const priceRange = (visibleMax - visibleMin) * state.yScale;
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
        if (target.tagName === 'CANVAS') {
          const cursor = target.style.cursor;
          if (cursor === 'move' || cursor === 'grab' || cursor === 'grabbing' || cursor === 'ns-resize') {
            return;
          }
        }
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
    containerEl.addEventListener("pointerdown", onPointerDown);
    containerEl.addEventListener("dblclick", onDoubleClick);
    
    // [TENOR 2026 SRE FIX] Attach to window to catch fast swipes and ensure cleanup
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointerout", onPointerUp);

    return () => {
      if (registryFrameId !== null) cancelAnimationFrame(registryFrameId);
      if (registeredChart) TimeAxisRegistry.delete(registeredChart);
      containerEl.removeEventListener("wheel", onWheel, wheelListenerOptions);
      containerEl.removeEventListener("pointerdown", onPointerDown);
      containerEl.removeEventListener("dblclick", onDoubleClick);
      
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerout", onPointerUp);
    };
  }, [
    chartData,
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

  return { applyViewport, lastCursorClientPointRef, resetManualYViewport };
};

// --- EOF ---
