export type ViewportWindow = { startIdx: number; endIdx: number };

export type ZoomRangeSnapshot = {
  start: number;
  end: number;
  barsFromRightStart?: number;
  barsFromRightEnd?: number;
  futureBarsFromRightEnd?: number;
};

export const TV_Y_AXIS_WIDTH = 78;
export const TV_X_AXIS_HEIGHT = 28;
export const TV_ZOOM_VELOCITY = 0.001;
export const TV_AUTO_SCALE_PADDING = 0.08;
export const TV_COMPARE_PRICE_AXIS_DEZOOM_PADDING = 0.22;
export const TV_MIN_VISIBLE_BARS = 10;
export const TV_CURSOR_INFLUENCE = 1.0;
export const TV_PAN_DRIFT_DAMPING = 0.85;
export const TV_INITIAL_VISIBLE_BARS = 100;
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

  return { startIdx: Math.round(start), endIdx: Math.round(end) };
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
 * Canonical TradingView-like price-axis wheel scaling shared by single and
 * multi-chart renderers. The price under the cursor remains anchored while the
 * scale changes, which prevents the axis from visually drifting during zoom.
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
  const safeBaseRange = Math.max(Number.EPSILON, Math.abs(baseRange));
  const safeScale = clamp(Number.isFinite(yScale) ? yScale : 1, 0.1, 5);
  const safePan = Number.isFinite(yPan) ? yPan : 0;
  const ratio = clamp(cursorRatio, 0, 1);
  const currentRange = safeBaseRange * safeScale;
  const oldPriceAtCursor = center + safePan + currentRange * (0.5 - ratio);
  const wheelStep = Math.sign(wheelDeltaY) * Math.min(1, Math.abs(wheelDeltaY) / TV_WHEEL_DELTA_CAP_PX);
  const nextScale = clamp(safeScale * Math.exp(wheelStep * TV_ZOOM_VELOCITY * TV_WHEEL_DELTA_CAP_PX), 0.1, 5);
  const nextRange = safeBaseRange * nextScale;
  const shiftedCursorRatio = clamp(ratio + ((15 * wheelStep) / Math.max(1, gridHeight)), 0, 1);

  return {
    yScale: nextScale,
    yPan: oldPriceAtCursor - center - nextRange * (0.5 - shiftedCursorRatio),
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
  const nextScale = clamp(safeInitialScale * Math.exp(deltaY * 0.01), 0.1, 5);
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
  maxHistoryGapBars = TV_MAX_HISTORY_GAP_BARS,
  maxFutureBars = TV_MAX_FUTURE_BARS,
}: {
  startIdx: number;
  endIdx: number;
  totalBars: number;
  deltaY: number;
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
  const normalizedWheelDirection =
    Math.sign(-deltaY) * Math.min(1, Math.abs(deltaY) / TV_WHEEL_DELTA_CAP_PX);
  const spacingFactor = 1 + (normalizedWheelDirection / 10);
  const targetSpan = clamp(currentSpan / spacingFactor, minSpan, maxViewportSpan);
  const rightEdge = Number.isFinite(endIdx) ? endIdx : maxSpan;

  return clampViewportWindowWithFuture(
    rightEdge - targetSpan,
    rightEdge,
    totalBars,
    maxFutureBars,
    historyGap,
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
