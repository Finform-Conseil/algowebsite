export interface MultiChartDropTargetRect {
  chartId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

const containsPoint = (
  rect: MultiChartDropTargetRect,
  clientX: number,
  clientY: number,
): boolean => clientX >= rect.left
  && clientX <= rect.right
  && clientY >= rect.top
  && clientY <= rect.bottom;

/**
 * Resolve the physical multi-chart slot under a pointer independently from DOM
 * stacking order. The dragged slot can be transformed above its destination, so
 * geometry is the canonical fallback when element hit-testing is transiently
 * obscured during pointer capture.
 */
export const resolveMultiChartDropTargetFromRects = (
  clientX: number,
  clientY: number,
  sourceChartId: string,
  validChartIds: ReadonlySet<string>,
  rects: readonly MultiChartDropTargetRect[],
): string | null => {
  if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;

  for (const rect of rects) {
    const chartId = rect.chartId.trim();
    if (!chartId || chartId === sourceChartId || !validChartIds.has(chartId)) continue;
    if (containsPoint(rect, clientX, clientY)) return chartId;
  }

  return null;
};
