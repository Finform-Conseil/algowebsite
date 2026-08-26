import type { EChartsType } from "echarts/core";
import {
  MAIN_GRID_LEFT,
  TV_X_AXIS_HEIGHT,
  TV_Y_AXIS_WIDTH,
} from "../viewport/viewportMath";

export { MAIN_GRID_LEFT, TV_X_AXIS_HEIGHT, TV_Y_AXIS_WIDTH };

export interface ChartGridRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClientPointLike {
  clientX: number;
  clientY: number;
}

export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export const clientPointToLocalPixel = (
  point: ClientPointLike,
  rect: RectLike,
): { x: number; y: number } => ({
  x: point.clientX - rect.left,
  y: point.clientY - rect.top,
});

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

const parseAxisDateMs = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const resolveCategoryAxisTime = (
  chart: EChartsType,
  rawTime: string | number,
  seriesIndex: number,
): string | number => {
  if (typeof rawTime !== "number" || !Number.isFinite(rawTime)) return rawTime;

  try {
    const option = chart.getOption();
    const seriesList = (option.series as Array<{ xAxisIndex?: number }> | undefined) ?? [];
    const xAxisIndex = seriesList[seriesIndex]?.xAxisIndex ?? 0;
    const xAxes = Array.isArray(option.xAxis) ? option.xAxis : [option.xAxis];
    const xAxis = xAxes[xAxisIndex] as { type?: string; data?: unknown[] } | undefined;
    if (xAxis?.type !== "category" || !Array.isArray(xAxis.data) || xAxis.data.length === 0) {
      return rawTime;
    }

    const index = Math.round(rawTime);
    const direct = xAxis.data[index];
    if (typeof direct === "number" && Number.isFinite(direct)) return direct;
    if (typeof direct === "string" && parseAxisDateMs(direct) !== null) return direct;

    const findValidDate = (start: number, step: -1 | 1): { index: number; value: string; ms: number } | null => {
      for (let cursor = start; cursor >= 0 && cursor < xAxis.data!.length; cursor += step) {
        const candidate = xAxis.data![cursor];
        if (typeof candidate !== "string") continue;
        const ms = parseAxisDateMs(candidate);
        if (ms !== null) return { index: cursor, value: candidate, ms };
      }
      return null;
    };

    const left = findValidDate(Math.min(index, xAxis.data.length - 1), -1);
    const right = findValidDate(Math.max(index, 0), 1);

    if (left && right && left.index !== right.index) {
      const stepMs = (right.ms - left.ms) / (right.index - left.index);
      return new Date(left.ms + ((index - left.index) * stepMs)).toISOString();
    }

    if (left) {
      const previous = findValidDate(left.index - 1, -1);
      const stepMs = previous ? left.ms - previous.ms : 86_400_000;
      return new Date(left.ms + ((index - left.index) * stepMs)).toISOString();
    }

    if (right) {
      const next = findValidDate(right.index + 1, 1);
      const stepMs = next ? next.ms - right.ms : 86_400_000;
      return new Date(right.ms - ((right.index - index) * stepMs)).toISOString();
    }
  } catch {
    return rawTime;
  }

  return rawTime;
};

export const safeConvertFromPixelToChartPoint = (
  chart: EChartsType,
  point: [number, number],
  seriesIndex: number = 0,
): [string | number, number] | null => {
  const converted = safeConvertFromPixel(chart, point, seriesIndex);
  if (!converted) return null;
  return [resolveCategoryAxisTime(chart, converted[0], seriesIndex), converted[1]];
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
