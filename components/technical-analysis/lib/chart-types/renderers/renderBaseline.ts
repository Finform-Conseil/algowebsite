import type { ChartTypeRenderer, CustomRenderApi } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

const BASE_LEVEL_PERCENT = 50;

export const renderBaseline: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "line") return [];

  const values = result.points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const baseline = Number.isFinite(min) && Number.isFinite(max)
    ? min + (max - min) * BASE_LEVEL_PERCENT / 100
    : latestPrice;

  const data = result.points.map((point, index) => [
    index,
    point.value,
    baseline,
    index > 0 ? result.points[index - 1].value : point.value,
  ]);

  return [{
    id,
    name,
    type: "custom",
    data,
    renderItem: (_params: unknown, api: CustomRenderApi) => {
      const index = Number(api.value(0));
      const value = Number(api.value(1));
      const base = Number(api.value(2));
      const previous = Number(api.value(3));
      if (![index, value, base, previous].every(Number.isFinite) || index <= 0) return undefined;

      const color = value >= base ? palette.upColor : palette.downColor;
      const current = api.coord([index, value]);
      const prev = api.coord([index - 1, previous]);
      const baseCurrent = api.coord([index, base]);
      const basePrev = api.coord([index - 1, base]);

      return {
        type: "group",
        children: [
          {
            type: "polygon",
            shape: { points: [prev, current, baseCurrent, basePrev] },
            style: { fill: color, opacity: visible ? 0.16 : 0 },
          },
          {
            type: "line",
            shape: { x1: prev[0], y1: prev[1], x2: current[0], y2: current[1] },
            style: { stroke: color, lineWidth: 1.4, opacity: visible ? 1 : 0 },
          },
        ],
      };
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
