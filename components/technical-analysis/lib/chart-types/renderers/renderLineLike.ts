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
  dateLabels?: string[],
): ChartOptionPart => {
  const step = resolveMarkerStep(points.length);

  return {
    id: `${id}-markers`,
    type: "scatter",
    coordinateSystem: "cartesian2d",
    xAxisIndex: 0,
    yAxisIndex: 0,
    encode: { x: 0, y: 1 },
    data: points.map((point, index) => {
      const isEdgePoint = index === 0 || index === points.length - 1;
      const isVisible = isEdgePoint || index % step === 0;
      const val = isVisible ? point.value : null;
      const date = dateLabels?.[index];
      return date ? [date, val] : val;
    }),
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
  };
};

export const createLineLikeRenderer = (mode: LineLikeMode): ChartTypeRenderer =>
  ({ id, name, result, palette, latestPrice, visible, dateLabels }) => {
    if (result.kind !== "line") return [];

    const isMarkerMode = mode === "markers";
    const series: ChartOptionPart[] = [{
      id,
      name,
      type: "line",
      encode: { x: 0, y: 1 },
      data: result.points.map((point, index) => {
        const date = dateLabels?.[index];
        return date ? [date, point.value] : point.value;
      }),
      showSymbol: false,
      symbol: "none",
      step: mode === "step" ? "end" : undefined,
      areaStyle: mode === "area" ? { color: "rgba(41, 98, 255, 0.14)" } : undefined,
      itemStyle: { color: palette.upColor, opacity: visible ? 1 : 0 },
      lineStyle: { color: palette.upColor, opacity: visible ? 1 : 0, width: isMarkerMode ? 1.35 : 1.5 },
      markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
    }];

    if (isMarkerMode) {
      series.push(buildMarkerOverlaySeries(id, result.points, palette.upColor, visible, dateLabels));
    }

    return series;
  };
