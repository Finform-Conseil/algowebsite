export type ViewportWindow = { startIdx: number; endIdx: number };

export type ZoomRangeSnapshot = {
  start: number;
  end: number;
  barsFromRightStart?: number;
  barsFromRightEnd?: number;
  futureBarsFromRightEnd?: number;
};

// Vela 0.7.2 native axis chrome: AXIS_MASTER_W=64, TIME_AXIS_H=22.
export const TV_Y_AXIS_WIDTH = 64;
export const TV_X_AXIS_HEIGHT = 22;
export const TV_ZOOM_VELOCITY = 0.004;
export const TV_PRICE_WHEEL_VELOCITY = 0.001;
export const TV_PRICE_DRAG_VELOCITY = 0.004;
export const TV_TIME_AXIS_DRAG_ZOOM_VELOCITY = 0.004;
export const TV_ZOOM_EASE_TAU_MS = 70;
export const TV_PAN_MOMENTUM_TAU_MS = 110;
export const TV_SCROLL_EASE_TAU_MS = 130;
export const TV_AUTOSCALE_EASE_TAU_MS = 80;
export const TV_PAN_VELOCITY_BLEND = 0.4;
export const TV_PAN_FLING_MIN_VELOCITY_PX_PER_MS = 0.04;
export const TV_PAN_FLING_MAX_AGE_MS = 60;
export const TV_PAN_STOP_VELOCITY_PX_PER_MS = 0.02;
export const TV_AUTO_SCALE_PADDING = 0.08;
export const TV_COMPARE_PRICE_AXIS_DEZOOM_PADDING = 0.22;
export const TV_MIN_VISIBLE_BARS = 2;
export const TV_CURSOR_INFLUENCE = 1.0;
export const TV_PAN_DRIFT_DAMPING = 1.0;
export const TV_INITIAL_VISIBLE_BARS = 100;
export const VELA_DEFAULT_BAR_SPACING_PX = 8;
export const VELA_DEFAULT_RIGHT_OFFSET_BARS = 6;
export const TV_RESET_VISIBLE_BARS = 120;
export const TV_MAX_FUTURE_BARS = 80;
export const TV_MAX_HISTORY_GAP_BARS = 80;
export const MAIN_GRID_LEFT = 0;

const WHEEL_DELTA_LINE_MODE = 1;
const WHEEL_DELTA_PAGE_MODE = 2;
const WHEEL_LINE_HEIGHT_PX = 16;
const WHEEL_PAGE_HEIGHT_PX = 240;
const TV_WHEEL_DELTA_CAP_PX = 80;

export const lerp = (start: number, end: number, weight: number): number =>
  start + ((end - start) * weight);

/** Frame-rate independent exponential approach used by viewport motion. */
export const exponentialApproach = (
  current: number,
  target: number,
  deltaMs: number,
  tauMs: number,
): number => {
  if (!Number.isFinite(current) || !Number.isFinite(target)) return target;
  const safeTau = Math.max(Number.EPSILON, Math.abs(tauMs));
  const safeDelta = Math.max(0, Math.min(64, Number.isFinite(deltaMs) ? deltaMs : 0));
  const alpha = 1 - Math.exp(-safeDelta / safeTau);
  return current + ((target - current) * alpha);
};

export type AutoScaleRange = { min: number; max: number };

export type EasedAutoScaleRange = AutoScaleRange & { moving: boolean };

/**
 * Vela 0.7.2 autoscale contract: min/max glide in the same animation tick as
 * viewport motion, using an 80 ms exponential time constant and snapping only
 * when both bounds are within 0.1% of the target span.
 */
export const easeAutoScaleRange = (
  current: AutoScaleRange | null,
  target: AutoScaleRange,
  deltaMs: number,
  tauMs = TV_AUTOSCALE_EASE_TAU_MS,
): EasedAutoScaleRange => {
  if (
    current === null
    || !Number.isFinite(current.min)
    || !Number.isFinite(current.max)
    || current.min >= current.max
    || !Number.isFinite(target.min)
    || !Number.isFinite(target.max)
    || target.min >= target.max
  ) {
    return { min: target.min, max: target.max, moving: false };
  }

  const span = Math.max(1e-9, Math.abs(target.max - target.min));
  let min = exponentialApproach(current.min, target.min, deltaMs, tauMs);
  let max = exponentialApproach(current.max, target.max, deltaMs, tauMs);
  const epsilon = span * 1e-3;

  if (
    Math.abs(min - target.min) <= epsilon
    && Math.abs(max - target.max) <= epsilon
  ) {
    min = target.min;
    max = target.max;
    return { min, max, moving: false };
  }

  return { min, max, moving: true };
};

/** Low-pass pointer velocity: stable enough for a fling without making drag laggy. */
export const filterPanVelocity = (
  previousVelocity: number,
  instantaneousVelocity: number,
  blend = TV_PAN_VELOCITY_BLEND,
): number => {
  const safePrevious = Number.isFinite(previousVelocity) ? previousVelocity : 0;
  const safeInstantaneous = Number.isFinite(instantaneousVelocity) ? instantaneousVelocity : 0;
  const safeBlend = Math.max(0, Math.min(1, blend));
  return (safePrevious * (1 - safeBlend)) + (safeInstantaneous * safeBlend);
};

/** Exponential momentum decay, independent of refresh rate. */
export const decayPanVelocity = (
  velocity: number,
  deltaMs: number,
  tauMs = TV_PAN_MOMENTUM_TAU_MS,
): number => {
  if (!Number.isFinite(velocity)) return 0;
  const safeTau = Math.max(Number.EPSILON, Math.abs(tauMs));
  const safeDelta = Math.max(0, Math.min(64, Number.isFinite(deltaMs) ? deltaMs : 0));
  return velocity * Math.exp(-safeDelta / safeTau);
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const normalizeWheelDeltaPx = (delta: number, deltaMode: number): number => {
  const pixelDelta = deltaMode === WHEEL_DELTA_LINE_MODE
    ? delta * WHEEL_LINE_HEIGHT_PX
    : deltaMode === WHEEL_DELTA_PAGE_MODE
      ? delta * WHEEL_PAGE_HEIGHT_PX
      : delta;

  return clamp(pixelDelta, -TV_WHEEL_DELTA_CAP_PX, TV_WHEEL_DELTA_CAP_PX);
};

export const resolveTimeDataZoomAxisIndexes = (option: { xAxis?: unknown }): number[] => {
  const xAxis = option.xAxis;
  const axisCount = Array.isArray(xAxis) ? xAxis.length : 1;
  return Array.from({ length: Math.max(1, axisCount) }, (_unused, index) => index);
};

export const resolveInitialViewportWindow = (
  totalBars: number,
  zoomRange?: ZoomRangeSnapshot,
): ViewportWindow => {
  if (totalBars <= 1) return { startIdx: 0, endIdx: 0 };

  const lastIndex = totalBars - 1;
  const hasAnchoredSnapshot =
    Number.isFinite(zoomRange?.barsFromRightStart) &&
    Number.isFinite(zoomRange?.barsFromRightEnd);

  if (hasAnchoredSnapshot) {
    const barsFromRightEnd = zoomRange?.barsFromRightEnd as number;
    const futureBars = Math.max(
      0,
      Math.round(zoomRange?.futureBarsFromRightEnd ?? Math.max(0, -barsFromRightEnd)),
    );
    return clampViewportWindowWithFuture(
      totalBars - (zoomRange?.barsFromRightStart as number),
      totalBars - barsFromRightEnd,
      totalBars,
      futureBars,
    );
  }

  return {
    startIdx: Math.max(0, totalBars - TV_INITIAL_VISIBLE_BARS),
    endIdx: lastIndex,
  };
};

/**
 * Vela 0.7.2 initial time-scale projection:
 * rightEdgeLogical = barCount - 1 + rightOffset
 * leftEdgeLogical  = rightEdgeLogical - plotWidth / barSpacing
 */
export const resolveVelaInitialViewportWindow = (
  totalBars: number,
  plotWidthPx: number,
  barSpacingPx = VELA_DEFAULT_BAR_SPACING_PX,
  rightOffsetBars = VELA_DEFAULT_RIGHT_OFFSET_BARS,
  fitAllData = false,
): ViewportWindow => {
  if (totalBars <= 1) return { startIdx: 0, endIdx: 0 };
  if (!(plotWidthPx > 0) || !(barSpacingPx > 0)) return resolveInitialViewportWindow(totalBars);

  const rightEdgeLogical = totalBars - 1 + Math.max(0, rightOffsetBars);
  const leftEdgeLogical = fitAllData
    ? 0
    : Math.max(0, rightEdgeLogical - (plotWidthPx / barSpacingPx));

  // Synthetic history space is interaction-only. The initial viewport must never
  // begin before the first real candle; otherwise ECharts renders a blank lane on
  // the left and makes loaded historical candles look missing.
  return clampViewportWindowWithFuture(
    leftEdgeLogical,
    rightEdgeLogical,
    totalBars,
    TV_MAX_FUTURE_BARS,
    Math.max(0, Math.round(rightOffsetBars)),
  );
};

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

export const clampViewportWindowWithFuture = (
  startIdx: number,
  endIdx: number,
  totalBars: number,
  maxFutureBars = TV_MAX_FUTURE_BARS,
  maxHistoryGapBars = TV_MAX_HISTORY_GAP_BARS,
): ViewportWindow => {
  if (totalBars <= 1) return { startIdx: 0, endIdx: 0 };

  const { minSpan, maxSpan } = getViewportSpanBounds(totalBars);
  const historyGap = Math.max(0, Math.round(maxHistoryGapBars));
  const maxViewportSpan = maxSpan + historyGap;
  const span = Math.max(minSpan, Math.min(maxViewportSpan, endIdx - startIdx));
  const lastIndex = totalBars - 1;
  const maxEnd = lastIndex + Math.max(0, Math.round(maxFutureBars));
  const minStart = -Math.max(0, Math.round(maxHistoryGapBars));
  const maxStart = Math.max(0, maxEnd - minSpan);
  let start = Number.isFinite(startIdx) ? startIdx : 0;
  let end = start + span;

  start = clamp(start, minStart, maxStart);
  end = start + span;
  if (end > maxEnd) {
    end = maxEnd;
    start = Math.max(0, end - span);
  }

  // Keep logical viewport coordinates continuous. Vela operates on fractional
  // logical positions (barSpacing/rightOffset); rounding here quantizes every pan,
  // wheel and pinch to whole candles and is perceived as visual jumping.
  return { startIdx: start, endIdx: end };
};

export const reconcileViewportAfterHistoryPrepend = ({
  startIdx,
  endIdx,
  prependedBars,
  totalBars,
  maxFutureBars = TV_MAX_FUTURE_BARS,
  maxHistoryGapBars = TV_MAX_HISTORY_GAP_BARS,
}: {
  startIdx: number;
  endIdx: number;
  prependedBars: number;
  totalBars: number;
  maxFutureBars?: number;
  maxHistoryGapBars?: number;
}): ViewportWindow => {
  const insertedBars = Number.isFinite(prependedBars)
    ? Math.max(0, Math.round(prependedBars))
    : 0;

  // A prepend is a coordinate-system translation: each pre-existing candle is
  // shifted right by exactly the number of inserted bars. Translating both
  // viewport edges by the same amount preserves the logical candles and span.
  return clampViewportWindowWithFuture(
    startIdx + insertedBars,
    endIdx + insertedBars,
    totalBars,
    maxFutureBars,
    maxHistoryGapBars,
  );
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

  void deltaY;

  return clampViewportWindow(
    blendedStart,
    blendedStart + targetSpan,
    totalBars,
  );
};

export type PriceAxisViewport = { yScale: number; yPan: number };

/**
 * Vela 0.7.2 price-axis wheel contract.
 * InputController forwards deltaY * 0.25 to priceScaleBy(); PriceScale then
 * applies PRICE_SCALE_K=0.004 around the manual range center. No cursor drift,
 * wheel normalization or synthetic offset is injected.
 */
export const computePriceAxisWheelViewport = ({
  center,
  baseRange,
  yScale,
  yPan,
  cursorRatio,
  gridHeight,
  wheelDeltaY,
}: {
  center: number;
  baseRange: number;
  yScale: number;
  yPan: number;
  cursorRatio: number;
  gridHeight: number;
  wheelDeltaY: number;
}): PriceAxisViewport => {
  void center;
  void baseRange;
  void cursorRatio;
  void gridHeight;
  const safeScale = clamp(Number.isFinite(yScale) ? yScale : 1, 0.05, 20);
  const safePan = Number.isFinite(yPan) ? yPan : 0;
  const nextScale = clamp(
    safeScale * Math.exp(wheelDeltaY * 0.25 * TV_PRICE_DRAG_VELOCITY),
    0.05,
    20,
  );

  return {
    yScale: nextScale,
    yPan: safePan,
  };
};

/** Scale the price axis while dragging it, anchored between the drag start and current cursor. */
export const computePriceAxisDragViewport = ({
  center,
  baseRange,
  initialYScale,
  initialYPan,
  startRatio,
  currentRatio,
  deltaY,
}: {
  center: number;
  baseRange: number;
  initialYScale: number;
  initialYPan: number;
  startRatio: number;
  currentRatio: number;
  deltaY: number;
}): PriceAxisViewport => {
  const safeBaseRange = Math.max(Number.EPSILON, Math.abs(baseRange));
  const safeInitialScale = clamp(Number.isFinite(initialYScale) ? initialYScale : 1, 0.1, 5);
  const safeInitialPan = Number.isFinite(initialYPan) ? initialYPan : 0;
  const initialRange = safeBaseRange * safeInitialScale;
  const anchorPrice = center + safeInitialPan + initialRange * (0.5 - clamp(startRatio, 0, 1));
  const nextScale = clamp(safeInitialScale * Math.exp(deltaY * TV_PRICE_DRAG_VELOCITY), 0.1, 5);
  const nextRange = safeBaseRange * nextScale;
  return {
    yScale: nextScale,
    yPan: anchorPrice - center - nextRange * (0.5 - clamp(currentRatio, 0, 1)),
  };
};

/** Canonical vertical price-pan used when dragging inside the chart body. */
export const computePriceAxisPan = ({
  initialYPan,
  deltaY,
  gridHeight,
  priceRange,
  yScale,
}: {
  initialYPan: number;
  deltaY: number;
  gridHeight: number;
  priceRange: number;
  yScale: number;
}): number => {
  const safeGridHeight = Math.max(1, gridHeight);
  const scaledPriceRange = Math.max(Number.EPSILON, Math.abs(priceRange) * Math.max(0.1, yScale));
  const shiftY = (deltaY / safeGridHeight) * scaledPriceRange;
  const maxPan = scaledPriceRange * 0.8;
  const safeInitialPan = Number.isFinite(initialYPan) ? initialYPan : 0;
  return clamp(safeInitialPan + shiftY, -maxPan, maxPan);
};

export const computeTradingViewWheelZoomViewport = ({
  startIdx,
  endIdx,
  totalBars,
  deltaY,
  cursorRatio = 1,
  maxHistoryGapBars = TV_MAX_HISTORY_GAP_BARS,
  maxFutureBars = TV_MAX_FUTURE_BARS,
}: {
  startIdx: number;
  endIdx: number;
  totalBars: number;
  deltaY: number;
  cursorRatio?: number;
  maxHistoryGapBars?: number;
  maxFutureBars?: number;
}): ViewportWindow => {
  if (totalBars <= 1 || !Number.isFinite(deltaY)) {
    return { startIdx: 0, endIdx: 0 };
  }

  const { minSpan, maxSpan } = getViewportSpanBounds(totalBars);
  const historyGap = Math.max(0, Math.round(maxHistoryGapBars));
  const maxViewportSpan = maxSpan + historyGap;
  const currentSpan = Math.max(minSpan, Math.min(maxViewportSpan, endIdx - startIdx));
  // A time scale is perceptually linear in bar spacing, not in visible-bar count.
  // Exponential wheel scaling keeps mouse wheels and trackpads consistent.
  // Vela 0.7.2 InputController consumes the native wheel delta directly.
  // Trackpads deliberately emit small continuous deltas while mouse wheels emit
  // larger discrete ones; both feed the same exponential law.
  const spacingFactor = Math.exp(-deltaY * TV_ZOOM_VELOCITY);
  const targetSpan = clamp(currentSpan / spacingFactor, minSpan, maxViewportSpan);
  const ratio = clamp(Number.isFinite(cursorRatio) ? cursorRatio : 1, 0, 1);
  const focusIndex = startIdx + (currentSpan * ratio);
  const targetStart = focusIndex - (targetSpan * ratio);

  return clampViewportWindowWithFuture(
    targetStart,
    targetStart + targetSpan,
    totalBars,
    maxFutureBars,
    historyGap,
  );
};

/** Vela 0.7.2 pinch contract: distance ratio changes bar spacing while the
 * logical bar captured at the initial midpoint remains pinned under the live midpoint. */
export const computeVelaPinchViewport = ({
  startIdx,
  endIdx,
  totalBars,
  startDistance,
  currentDistance,
  anchorLogical,
  currentMidpointRatio,
  maxHistoryGapBars = TV_MAX_HISTORY_GAP_BARS,
  maxFutureBars = TV_MAX_FUTURE_BARS,
}: {
  startIdx: number;
  endIdx: number;
  totalBars: number;
  startDistance: number;
  currentDistance: number;
  anchorLogical: number;
  currentMidpointRatio: number;
  maxHistoryGapBars?: number;
  maxFutureBars?: number;
}): ViewportWindow => {
  const currentSpan = Math.max(TV_MIN_VISIBLE_BARS, endIdx - startIdx);
  const distanceRatio = Math.max(1e-6, currentDistance) / Math.max(1, startDistance);
  const targetSpan = currentSpan / distanceRatio;
  const ratio = clamp(currentMidpointRatio, 0, 1);
  const targetStart = anchorLogical - (targetSpan * ratio);
  return clampViewportWindowWithFuture(
    targetStart,
    targetStart + targetSpan,
    totalBars,
    maxFutureBars,
    maxHistoryGapBars,
  );
};

export const computeHorizontalPanViewport = ({
  startIdx,
  endIdx,
  totalBars,
  shift,
  maxHistoryGapBars = TV_MAX_HISTORY_GAP_BARS,
  maxFutureBars = TV_MAX_FUTURE_BARS,
  preserveEnd = false,
}: {
  startIdx: number;
  endIdx: number;
  totalBars: number;
  shift: number;
  maxHistoryGapBars?: number;
  maxFutureBars?: number;
  preserveEnd?: boolean;
}): ViewportWindow =>
  clampViewportWindowWithFuture(
    startIdx + (shift * TV_PAN_DRIFT_DAMPING),
    preserveEnd ? endIdx : endIdx + (shift * TV_PAN_DRIFT_DAMPING),
    totalBars,
    maxFutureBars,
    maxHistoryGapBars,
  );
