import type { ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

export const renderColumns: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "columns") return [];

  return [{
    id,
    name,
    type: "bar",
    data: result.points.map((point) => point.value),
    barWidth: "65%",
    itemStyle: {
      color: (params: { dataIndex: number }) => {
        const point = result.points[params.dataIndex];
        return point?.direction === -1 ? palette.downColor : palette.upColor;
      },
      opacity: visible ? 0.85 : 0,
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
