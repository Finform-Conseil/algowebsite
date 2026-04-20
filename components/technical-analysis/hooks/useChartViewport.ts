import { useEffect, useRef, MutableRefObject, useCallback } from "react";
import type { ECharts } from "echarts/core";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

export type ViewportWindow = { startIdx: number; endIdx: number };

// ============================================================================
// [TENOR 2026 HDR] CONSTANTES PHYSIQUES TRADINGVIEW
// Exportées pour être réutilisées par le renderer principal et les badges
// ============================================================================
export const TV_Y_AXIS_WIDTH = 84;
export const TV_X_AXIS_HEIGHT = 28;
export const TV_ZOOM_VELOCITY = 0.001;
export const TV_AUTO_SCALE_PADDING = 0.08; // 8%
export const TV_MIN_VISIBLE_BARS = 10;
export const TV_CURSOR_INFLUENCE = 0.68;
export const TV_ZOOM_DRIFT_STRENGTH = 0.85;
export const TV_ZOOM_DRIFT_BASE_RATIO = 0.015;
export const TV_PAN_DRIFT_DAMPING = 0.85;
export const TV_RESET_VISIBLE_BARS = 120;
export const MAIN_GRID_LEFT = 15;

// ============================================================================
// MATH & GEOMETRY HELPERS
// ============================================================================
export const lerp = (start: number, end: number, weight: number): number => start + ((end - start) * weight);
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getViewportSpanBounds = (totalBars: number) => {
  const maxSpan = Math.max(1, totalBars - 1);
  const minSpan = Math.min(TV_MIN_VISIBLE_BARS, maxSpan);
  return { minSpan, maxSpan };
};

export const clampViewportWindow = (
  startIdx: number,
  endIdx: number,
  totalBars: number,
): ViewportWindow => {
  if (totalBars <= 1) {
    return { startIdx: 0, endIdx: 0 };
  }

  const { minSpan, maxSpan } = getViewportSpanBounds(totalBars);

  let start = Number.isFinite(startIdx) ? startIdx : 0;
  let end = Number.isFinite(endIdx) ? endIdx : maxSpan;
  let span = end - start;

  if (!Number.isFinite(span) || span <= 0) {
    span = minSpan;
  }

  span = Math.max(minSpan, Math.min(maxSpan, span));

  if (start < 0) {
    start = 0;
    end = span;
  } else {
    end = start + span;
  }

  if (end > maxSpan) {
    end = maxSpan;
    start = Math.max(0, end - span);
  }

  return {
    startIdx: Math.round(start),
    endIdx: Math.round(end),
  };
};

export const computeDirectionalZoomViewport = ({
  startIdx,
  endIdx,
  totalBars,
  cursorRatio,
  zoomFactor,
  deltaY,
}: {
  startIdx: number;
  endIdx: number;
  totalBars: number;
  cursorRatio: number;
  zoomFactor: number;
  deltaY: number;
}): ViewportWindow => {
  if (totalBars <= 1) {
    return { startIdx: 0, endIdx: 0 };
  }

  const { minSpan, maxSpan } = getViewportSpanBounds(totalBars);
  const normalizedCursorRatio = Math.max(0, Math.min(1, cursorRatio));

  const currentSpan = Math.max(minSpan, Math.min(maxSpan, endIdx - startIdx));
  const currentCenter = startIdx + (currentSpan / 2);
  const targetSpan = Math.max(minSpan, Math.min(maxSpan, currentSpan * zoomFactor));

  const focusIdx = startIdx + (normalizedCursorRatio * currentSpan);
  const centeredStart = currentCenter - (targetSpan / 2);
  const cursorAnchoredStart = focusIdx - (normalizedCursorRatio * targetSpan);

  const blendedStart = lerp(centeredStart, cursorAnchoredStart, TV_CURSOR_INFLUENCE);

  const zoomDirection = deltaY < 0 ? 1 : deltaY > 0 ? -1 : 0;
  const changedBars = Math.abs(targetSpan - currentSpan);

  const directionalWeight = zoomDirection > 0
    ? 0.45 + (normalizedCursorRatio * 0.55)
    : 0.45 + ((1 - normalizedCursorRatio) * 0.55);

  const driftMagnitude = Math.max(
    currentSpan * TV_ZOOM_DRIFT_BASE_RATIO,
    changedBars * TV_ZOOM_DRIFT_STRENGTH * directionalWeight,
  );

  const driftedStart = blendedStart + (zoomDirection * driftMagnitude);

  return clampViewportWindow(
    driftedStart,
    driftedStart + targetSpan,
    totalBars,
  );
};

export const computeHorizontalPanViewport = ({
  startIdx,
  endIdx,
  totalBars,
  shift,
}: {
  startIdx: number;
  endIdx: number;
  totalBars: number;
  shift: number;
}): ViewportWindow => clampViewportWindow(
  startIdx + (shift * TV_PAN_DRIFT_DAMPING),
  endIdx + (shift * TV_PAN_DRIFT_DAMPING),
  totalBars,
);

// ============================================================================
// HOOK: VIEWPORT ENGINE (Absolute Coordinates & DOM Events)
// ============================================================================
export interface UseChartViewportProps {
  chartInstanceRef: MutableRefObject<ECharts | null>;
  getChartContainer: () => HTMLDivElement | null;
  chartData: ChartDataPoint[];
  lastZoomRangeRef?: MutableRefObject<{
    start: number;
    end: number;
    barsFromRightStart?: number;
    barsFromRightEnd?: number;
  }>;
  updateCursorPriceAxisBadge: (x: number, y: number) => void;
  updateLastPriceAxisBadge: () => void;
}

export const useChartViewport = ({
  chartInstanceRef,
  getChartContainer,
  chartData,
  lastZoomRangeRef,
  updateCursorPriceAxisBadge,
  updateLastPriceAxisBadge,
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
    initialPinchCenter: 0
  });

  const lastCursorClientPointRef = useRef<{ x: number; y: number } | null>(null);
  const prevDataMaxRef = useRef<number>(0);

  const applyViewport = useCallback(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed() || chartData.length === 0) return;

    const state = viewportStateRef.current;
    const totalBars = chartData.length;

    state.startIdx = Math.max(0, Math.min(totalBars - 1, Math.round(state.startIdx)));
    state.endIdx = Math.max(0, Math.min(totalBars - 1, Math.round(state.endIdx)));

    if (state.startIdx >= state.endIdx) {
      state.startIdx = Math.max(0, state.endIdx - 10);
    }

    let visibleMin = Infinity;
    let visibleMax = -Infinity;

    for (let i = state.startIdx; i <= state.endIdx; i++) {
      if (chartData[i]) {
        visibleMin = Math.min(visibleMin, chartData[i].low);
        visibleMax = Math.max(visibleMax, chartData[i].high);
      }
    }

    if (visibleMin === Infinity) {
      visibleMin = 0;
      visibleMax = 100;
    }

    const range = visibleMax - visibleMin;
    const center = (visibleMax + visibleMin) / 2;
    const padding = range === 0 ? visibleMin * TV_AUTO_SCALE_PADDING : range * TV_AUTO_SCALE_PADDING;

    let finalMin, finalMax;

    if (state.isYManual) {
      const scaledRange = (range + padding * 2) * state.yScale;
      finalMin = center - (scaledRange / 2) + state.yPan;
      finalMax = center + (scaledRange / 2) + state.yPan;

      const isInvalidManualViewport = !Number.isFinite(finalMin) || !Number.isFinite(finalMax) || finalMin >= finalMax || finalMax < visibleMin || finalMin > visibleMax;

      if (isInvalidManualViewport) {
        // Auto-recovery: if manual pan/zoom pushes the visible range fully out of price bounds,
        // reset to safe auto-scale so candles cannot disappear after resize/layout transitions.
        state.isYManual = false;
        state.yScale = 1.0;
        state.yPan = 0;
        finalMin = visibleMin - padding;
        finalMax = visibleMax + padding;
      }
    } else {
      finalMin = visibleMin - padding;
      finalMax = visibleMax + padding;
    }

    chart.setOption({
      yAxis: [{ min: finalMin, max: finalMax }],
      dataZoom: [{ id: 'time-zoom', startValue: state.startIdx, endValue: state.endIdx }]
    });

    requestAnimationFrame(() => {
      updateLastPriceAxisBadge();
      if (lastCursorClientPointRef.current) {
        updateCursorPriceAxisBadge(lastCursorClientPointRef.current.x, lastCursorClientPointRef.current.y);
      }
    });

    if (lastZoomRangeRef) {
      lastZoomRangeRef.current = {
        start: (state.startIdx / totalBars) * 100,
        end: (state.endIdx / totalBars) * 100,
        barsFromRightStart: totalBars - state.startIdx,
        barsFromRightEnd: totalBars - state.endIdx
      };
    }
  }, [chartData, chartInstanceRef, lastZoomRangeRef, updateCursorPriceAxisBadge, updateLastPriceAxisBadge]);

  // [TENOR 2026 FIX] SCAR-131: Currency Auto-Scaling Detector
  useEffect(() => {
    if (chartData.length === 0) return;
    const recentData = chartData.slice(-20);
    // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
    const currentMax = Math.max(...recentData.map(d => d.high));

    if (prevDataMaxRef.current !== 0 && currentMax !== 0) {
      const ratio = currentMax / prevDataMaxRef.current;
      if (ratio > 1.5 || ratio < 0.6) {
        viewportStateRef.current.isYManual = false;
        if (chartInstanceRef.current) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const option = chartInstanceRef.current.getOption() as any;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any, react-you-might-not-need-an-effect/no-pass-data-to-parent
          const dzY = option?.dataZoom?.find((z: any) => z.id === 'price-zoom' || z.yAxisIndex !== null);
          if (dzY) {
            chartInstanceRef.current.dispatchAction({
              type: 'dataZoom',
              dataZoomId: dzY.id,
              start: 0,
              end: 100
            });
          }
        }
      }
    }
    prevDataMaxRef.current = currentMax;
  }, [chartData, chartInstanceRef]);

  // [TENOR 2026 SRE] SILENT HYDRATION SHIFT
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
      const DEFAULT_VISIBLE = 100;
      viewportStateRef.current.endIdx = currentLen - 1;
      viewportStateRef.current.startIdx = Math.max(0, currentLen - DEFAULT_VISIBLE);
      viewportStateRef.current.yScale = 1.0;
      viewportStateRef.current.yPan = 0;
      viewportStateRef.current.isYManual = false;
      applyViewport();
    }

    viewportStateRef.current.lastDataLength = currentLen;
  }, [chartData.length, applyViewport]);

  // DOM Event Listeners
  useEffect(() => {
    const containerEl = getChartContainer()?.parentElement;
    const chart = chartInstanceRef.current;
    if (!containerEl || !chart) return;

    containerEl.style.touchAction = 'none';

    const wheelListenerOptions: AddEventListenerOptions = { passive: false, capture: true };

    const applyExternalTimeZoom = (direction: "in" | "out") => {
      if (chart.isDisposed() || chartData.length === 0) return;
      const state = viewportStateRef.current;
      const totalBars = chartData.length;
      const cursorRatio = 0.88;
      const syntheticDeltaY = direction === "in" ? -120 : 120;
      const zoomFactor = Math.exp(syntheticDeltaY * TV_ZOOM_VELOCITY);

      const nextViewport = computeDirectionalZoomViewport({
        startIdx: state.startIdx,
        endIdx: state.endIdx,
        totalBars,
        cursorRatio,
        zoomFactor,
        deltaY: syntheticDeltaY,
      });

      state.startIdx = nextViewport.startIdx;
      state.endIdx = nextViewport.endIdx;
      applyViewport();
    };

    const applyExternalTimePan = (direction: "left" | "right") => {
      if (chart.isDisposed() || chartData.length === 0) return;
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
      if (chart.isDisposed() || chartData.length === 0) return;
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (chart as any).__tvTimeAxisControls = {
      zoomIn: () => applyExternalTimeZoom("in"),
      zoomOut: () => applyExternalTimeZoom("out"),
      panLeft: () => applyExternalTimePan("left"),
      panRight: () => applyExternalTimePan("right"),
      reset: resetExternalTimeViewport,
    };

    const onWheel = (event: WheelEvent) => {
      const cursor = (event.target as HTMLElement)?.style?.cursor;
      const target = event.target as HTMLElement | null;

      if (cursor === 'move' || cursor === 'grab' || cursor === 'grabbing' || cursor === 'ns-resize') {
        return;
      }

      if (target?.closest('.gp-price-axis-action-menu') || target?.closest('.gp-price-axis-cursor-action')) {
        return;
      }

      event.preventDefault();
      if (chart.isDisposed() || chartData.length === 0) return;

      const rect = containerEl.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      const gridRightPx = rect.width - TV_Y_AXIS_WIDTH;
      const gridBottomPx = rect.height - TV_X_AXIS_HEIGHT;

      const isOnYAxis = mouseX >= gridRightPx;
      const isOnXAxis = mouseY >= gridBottomPx && mouseX < gridRightPx;
      const isOnChart = mouseX < gridRightPx && mouseY < gridBottomPx;

      const state = viewportStateRef.current;

      if (isOnYAxis) {
        const zoomFactor = Math.exp(event.deltaY * TV_ZOOM_VELOCITY);
        state.yScale *= zoomFactor;
        state.isYManual = true;
        applyViewport();
      } else if (isOnChart || isOnXAxis) {
        const totalBars = chartData.length;
        const visibleCount = state.endIdx - state.startIdx;

        if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
          const zoomFactor = Math.exp(event.deltaY * TV_ZOOM_VELOCITY);
          const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
          const cursorRatio = Math.max(0, Math.min(1, (mouseX - MAIN_GRID_LEFT) / gridWidth));

          const nextViewport = computeDirectionalZoomViewport({
            startIdx: state.startIdx,
            endIdx: state.endIdx,
            totalBars,
            cursorRatio,
            zoomFactor,
            deltaY: event.deltaY,
          });

          state.startIdx = nextViewport.startIdx;
          state.endIdx = nextViewport.endIdx;
          applyViewport();
        } else {
          const gridWidth = rect.width - MAIN_GRID_LEFT - TV_Y_AXIS_WIDTH;
          const shift = (event.deltaX / gridWidth) * visibleCount;

          const nextViewport = computeHorizontalPanViewport({
            startIdx: state.startIdx,
            endIdx: state.endIdx,
            totalBars,
            shift,
          });

          state.startIdx = nextViewport.startIdx;
          state.endIdx = nextViewport.endIdx;
          applyViewport();
        }
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (chart.isDisposed()) return;

      const state = viewportStateRef.current;
      state.activePointers.set(event.pointerId, event);

      const now = Date.now();
      if (now - state.lastTap < 300 && state.activePointers.size === 1) {
        onDoubleClick(event);
        state.lastTap = 0;
        return;
      }
      state.lastTap = now;

      const target = event.target as HTMLElement;
      if (target) {
        if (target.closest('.gp-price-axis-action-menu') || target.closest('.gp-price-axis-cursor-action')) {
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

      if (state.activePointers.size === 2) {
        const pointers = Array.from(state.activePointers.values());
        const p1 = pointers[0];
        const p2 = pointers[1];
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        state.initialPinchDistance = Math.hypot(dx, dy);
        const centerX = (p1.clientX + p2.clientX) / 2 - rect.left;
        state.initialPinchCenter = centerX;

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
      if (chart.isDisposed() || chartData.length === 0) return;
      const state = viewportStateRef.current;

      lastCursorClientPointRef.current = { x: event.clientX, y: event.clientY };
      updateCursorPriceAxisBadge(event.clientX, event.clientY);

      if (state.activePointers.has(event.pointerId)) {
        state.activePointers.set(event.pointerId, event);
      }

      if (state.activePointers.size === 2) {
        const pointers = Array.from(state.activePointers.values());
        const p1 = pointers[0];
        const p2 = pointers[1];
        const dx = p1.clientX - p2.clientX;
        const dy = p1.clientY - p2.clientY;
        const currentDistance = Math.hypot(dx, dy);

        if (state.initialPinchDistance === 0) {
          state.initialPinchDistance = currentDistance;
          return;
        }

        const rawRatio = state.initialPinchDistance / currentDistance;
        const zoomFactor = Math.pow(rawRatio, 0.5);

        const totalBars = chartData.length;
        const visibleCount = state.endIdx - state.startIdx;

        const rect = containerEl.getBoundingClientRect();
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
        applyViewport();

        state.initialPinchDistance = currentDistance;
        return;
      }

      if (state.isDraggingYScale) {
        const deltaY = event.clientY - state.startY;
        state.startY = event.clientY;
        const scaleFactor = Math.exp(deltaY * 0.01);
        state.yScale *= scaleFactor;
        state.isYManual = true;
        applyViewport();
      } else if (state.isDraggingChart || state.isDraggingXPan) {
        const deltaX = event.clientX - state.startX;
        state.startX = event.clientX;

        const totalBars = chartData.length;
        const visibleCount = state.endIdx - state.startIdx;
        const rect = containerEl.getBoundingClientRect();
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
            state.yPan += shiftY;
          }
        }

        applyViewport();
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
      } else if (state.activePointers.size === 1) {
        const remainingPointer = Array.from(state.activePointers.values())[0];
        state.startX = remainingPointer.clientX;
        state.startY = remainingPointer.clientY;
        state.isDraggingXPan = true;
      }
    };

    const onDoubleClick = (event: MouseEvent | PointerEvent) => {
      if (chart.isDisposed()) return;

      const target = event.target as HTMLElement;
      if (target) {
        if (target.closest('.gp-price-axis-action-menu') || target.closest('.gp-price-axis-cursor-action')) {
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
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    window.addEventListener("pointerout", onPointerUp);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (chart as any).__tvTimeAxisControls;
      containerEl.removeEventListener("wheel", onWheel, wheelListenerOptions);
      containerEl.removeEventListener("pointerdown", onPointerDown);
      containerEl.removeEventListener("dblclick", onDoubleClick);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      window.removeEventListener("pointerout", onPointerUp);
    };
  }, [chartData, chartInstanceRef, getChartContainer, applyViewport, updateCursorPriceAxisBadge]);

  const resetManualYViewport = useCallback(() => {
    viewportStateRef.current.isYManual = false;
    viewportStateRef.current.yScale = 1.0;
    viewportStateRef.current.yPan = 0;
    applyViewport();
  }, [applyViewport]);

  return { applyViewport, lastCursorClientPointRef, resetManualYViewport };
};
// --- EOF ---