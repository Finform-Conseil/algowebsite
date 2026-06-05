import type { ChartOptionPart, CustomRenderApi } from "./types";

export const PRICE_CUSTOM_SERIES_BINDING = {
  coordinateSystem: "cartesian2d",
  xAxisIndex: 0,
  yAxisIndex: 0,
  encode: { x: 0 },
  clip: true,
} as const;

export const buildLatestPriceMarkLine = (latestPrice: number, liveColor: string): ChartOptionPart => ({
  symbol: ["none", "none"],
  animation: false,
  silent: true,
  data: [{
    yAxis: latestPrice,
    label: { show: false },
    lineStyle: { color: liveColor, type: "dashed", width: 1, opacity: 0.8 },
  }],
});

export const getCategoryBandWidth = (api: CustomRenderApi): number => {
  const size = api.size?.([1, 0]);
  const width = Array.isArray(size) && Number.isFinite(size[0]) ? Number(size[0]) : 8;
  return Math.max(4, width);
};

export const makeLineShape = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 1,
) => ({
  type: "line",
  shape: { x1, y1, x2, y2 },
  style: { stroke: color, lineWidth: width },
});

export const makeRectShape = (
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  stroke: string,
  opacity = 1,
) => ({
  type: "rect",
  shape: { x, y, width, height },
  style: { fill, stroke, lineWidth: 1, opacity },
});

export const makeTextShape = (
  x: number,
  y: number,
  text: string,
  color: string,
  fontSize = 10,
) => ({
  type: "text",
  style: { x, y, text, fill: color, fontSize, textAlign: "center", textVerticalAlign: "middle" },
});
