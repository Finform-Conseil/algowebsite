import type { ChartTypeRenderer, CustomRenderApi } from "./types";
import { buildLatestPriceMarkLine, getCategoryBandWidth, makeRectShape } from "./helpers";

export const renderHighLow: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "high_low") return [];

  return [{
    id,
    name,
    type: "custom",
    data: result.items.map((item, index) => [index, item.high, item.low]),
    renderItem: (_params: unknown, api: CustomRenderApi) => {
      const index = Number(api.value(0));
      const high = Number(api.value(1));
      const low = Number(api.value(2));
      if (![index, high, low].every(Number.isFinite)) return undefined;

      const x = api.coord([index, high])[0];
      const yHigh = api.coord([index, high])[1];
      const yLow = api.coord([index, low])[1];
      const width = Math.max(2, getCategoryBandWidth(api) * 0.42);
      return makeRectShape(x - width / 2, yHigh, width, Math.max(1, yLow - yHigh), palette.textColor, palette.textColor, visible ? 0.42 : 0);
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
