import type { LinePoint } from "../domain/types";
import type { ChartOptionPart, ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

export type LineLikeMode = "line" | "markers" | "step" | "area";

const MAX_MARKER_OVERLAY_POINTS = 900;

const resolveMarkerStep = (pointCount: number): number =>
  Math.max(1, Math.ceil(pointCount / MAX_MARKER_OVERLAY_POINTS));

const buildMarkerOverlayData = (points: LinePoint[]): Array<number | null> => {
  const step = resolveMarkerStep(points.length);

  return points.map((point, index) => {
    const isEdgePoint = index === 0 || index === points.length - 1;
    return isEdgePoint || index % step === 0 ? point.value : null;
  });
};

const buildMarkerOverlaySeries = (
  id: string,
  points: LinePoint[],
  color: string,
  visible: boolean,
): ChartOptionPart => ({
  id: `${id}-markers`,
  type: "scatter",
  coordinateSystem: "cartesian2d",
  xAxisIndex: 0,
  yAxisIndex: 0,
  data: buildMarkerOverlayData(points),
  symbol: "circle",
  symbolSize: 6,
  silent: true,
  z: 18,
  itemStyle: {
    color: "rgba(15, 23, 42, 0.96)",
    borderColor: color,
    borderWidth: 1.8,
    opacity: visible ? 1 : 0,
  },
  emphasis: { disabled: true },
});

export const createLineLikeRenderer = (mode: LineLikeMode): ChartTypeRenderer =>
  ({ id, name, result, palette, latestPrice, visible }) => {
    if (result.kind !== "line") return [];

    const isMarkerMode = mode === "markers";
    const series: ChartOptionPart[] = [{
      id,
      name,
      type: "line",
      data: result.points.map((point) => point.value),
      showSymbol: false,
      symbol: "none",
      step: mode === "step" ? "end" : undefined,
      areaStyle: mode === "area" ? { color: "rgba(41, 98, 255, 0.14)" } : undefined,
      itemStyle: { color: palette.upColor, opacity: visible ? 1 : 0 },
      lineStyle: { color: palette.upColor, opacity: visible ? 1 : 0, width: isMarkerMode ? 1.35 : 1.5 },
      markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
    }];

    if (isMarkerMode) {
      series.push(buildMarkerOverlaySeries(id, result.points, palette.upColor, visible));
    }

    return series;
  };
