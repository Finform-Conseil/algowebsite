import type { ECharts } from "echarts/core";

export const MAIN_GRID_LEFT = 35;

export interface OverlayChartUsabilityLike {
  isDisposed: () => boolean;
  getDom: () => HTMLElement;
  getWidth: () => number;
  getHeight: () => number;
}

export interface OverlayChartPixelLike {
  convertToPixel: ECharts["convertToPixel"];
}

export interface CanvasPointerPoint {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const isOverlayChartUsable = <TChart extends OverlayChartUsabilityLike>(
  chart: TChart | null,
): chart is TChart => {
  if (!chart) return false;
  try {
    if (chart.isDisposed()) return false;
    const dom = chart.getDom();
    return Boolean(dom?.isConnected && chart.getWidth() > 0 && chart.getHeight() > 0);
  } catch {
    return false;
  }
};

export const safeOverlayConvertToPixel = (
  chart: OverlayChartPixelLike,
  point: [string | number, number],
): [number, number] | null => {
  try {
    const pos = chart.convertToPixel({ seriesIndex: 0 }, point);
    if (!Array.isArray(pos) || !Number.isFinite(pos[0]) || !Number.isFinite(pos[1])) {
      return null;
    }
    return [pos[0], pos[1]];
  } catch {
    return null;
  }
};

export const resolveChartPixelFromClient = (
  chart: Pick<OverlayChartUsabilityLike, "getDom">,
  clientX: number,
  clientY: number,
): [number, number] => {
  const chartRect = chart.getDom().getBoundingClientRect();
  return [clientX - chartRect.left, clientY - chartRect.top];
};

export const resolveCanvasPoint = (
  canvas: HTMLCanvasElement,
  event: PointerEvent,
): CanvasPointerPoint | null => {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const cssX = event.clientX - rect.left;
  const cssY = event.clientY - rect.top;
  if (cssX < 0 || cssX > rect.width || cssY < 0 || cssY > rect.height) return null;

  return {
    x: cssX,
    y: cssY,
    clientX: event.clientX,
    clientY: event.clientY,
  };
};

export const getOverlayScale = (
  width: number,
  height: number,
  minScale: number,
): number => clamp(Math.min(width / 900, height / 480), minScale, 1);
