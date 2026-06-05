import type { EChartsType } from "echarts/core";

export interface ChartGridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MAIN_GRID_LEFT = 15;
export const TV_Y_AXIS_WIDTH = 84;
export const TV_X_AXIS_HEIGHT = 28;

export const isChartTimeValue = (value: unknown): value is string | number =>
  typeof value === "string" || typeof value === "number";

export const isChartUsable = (chart: EChartsType | null): chart is EChartsType => {
  if (!chart) return false;
  try {
    if (chart.isDisposed()) return false;
    const dom = chart.getDom();
    return Boolean(dom?.isConnected && chart.getWidth() > 0 && chart.getHeight() > 0);
  } catch {
    return false;
  }
};

export const safeConvertToPixel = (
  chart: EChartsType,
  point: [string | number, number],
  seriesIndex: number = 0
): [number, number] | null => {
  try {
    const pix = chart.convertToPixel({ seriesIndex }, point);
    if (!Array.isArray(pix) || !Number.isFinite(pix[0]) || !Number.isFinite(pix[1])) {
      return null;
    }
    return [pix[0], pix[1]];
  } catch {
    return null;
  }
};

export const safeConvertFromPixel = (
  chart: EChartsType,
  point: [number, number],
  seriesIndex: number = 0
): [string | number, number] | null => {
  try {
    const coordinates = chart.convertFromPixel({ seriesIndex }, point);
    if (
      !Array.isArray(coordinates) ||
      coordinates.length < 2 ||
      !Number.isFinite(Number(coordinates[1]))
    ) {
      return null;
    }
    if (!isChartTimeValue(coordinates[0])) return null;
    return [coordinates[0], Number(coordinates[1])];
  } catch {
    return null;
  }
};

export const getInteractiveGridRect = (chart: EChartsType): ChartGridRect => {
  const width = chart.getWidth();
  const height = chart.getHeight();
  const top = Math.max(30, height * 0.08);
  const bottom = Math.max(top + 10, height - TV_X_AXIS_HEIGHT);
  const right = Math.max(MAIN_GRID_LEFT + 10, width - TV_Y_AXIS_WIDTH);

  return {
    x: MAIN_GRID_LEFT,
    y: top,
    width: right - MAIN_GRID_LEFT,
    height: bottom - top,
  };
};

export const isInsideGridRect = (
  point: { x: number; y: number },
  gridRect: ChartGridRect
): boolean =>
  point.x >= gridRect.x &&
  point.x <= gridRect.x + gridRect.width &&
  point.y >= gridRect.y &&
  point.y <= gridRect.y + gridRect.height;

export const getPriceSeriesIndex = (chart: EChartsType): number => {
  const option = chart.getOption();
  const seriesList = (option.series as Array<{ yAxisIndex?: number; type?: string }>) || [];
  const idx = seriesList.findIndex(
    (series) =>
      series.yAxisIndex === 0 ||
      series.yAxisIndex === undefined ||
      series.type === "candlestick"
  );
  return idx !== -1 ? idx : 0;
};
