export type ViewportWindow = { startIdx: number; endIdx: number };

export type ZoomRangeSnapshot = {
  start: number;
  end: number;
  barsFromRightStart?: number;
  barsFromRightEnd?: number;
};

export const TV_Y_AXIS_WIDTH = 84;
export const TV_X_AXIS_HEIGHT = 28;
export const TV_ZOOM_VELOCITY = 0.001;
export const TV_AUTO_SCALE_PADDING = 0.08;
export const TV_COMPARE_PRICE_AXIS_DEZOOM_PADDING = 0.22;
export const TV_MIN_VISIBLE_BARS = 10;
export const TV_CURSOR_INFLUENCE = 0.68;
export const TV_ZOOM_DRIFT_STRENGTH = 0.85;
export const TV_ZOOM_DRIFT_BASE_RATIO = 0.015;
export const TV_PAN_DRIFT_DAMPING = 0.85;
export const TV_INITIAL_VISIBLE_BARS = 100;
export const TV_RESET_VISIBLE_BARS = 120;
export const MAIN_GRID_LEFT = 15;

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
    return clampViewportWindow(
      totalBars - (zoomRange?.barsFromRightStart as number),
      totalBars - (zoomRange?.barsFromRightEnd as number),
      totalBars,
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
}): ViewportWindow =>
  clampViewportWindow(
    startIdx + (shift * TV_PAN_DRIFT_DAMPING),
    endIdx + (shift * TV_PAN_DRIFT_DAMPING),
    totalBars,
  );
