import type { ChartTypeRenderer, CustomRenderApi } from "./types";
import { buildLatestPriceMarkLine, getCategoryBandWidth, makeLineShape, makeRectShape } from "./helpers";

export const renderHollowCandles: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "ohlc") return [];

  return [{
    id,
    name,
    type: "custom",
    data: result.bars.map((bar, index) => [
      index,
      bar.open,
      bar.high,
      bar.low,
      bar.close,
      index === 0 || bar.close >= result.bars[index - 1].close ? 1 : -1,
      bar.close >= bar.open ? 1 : 0,
    ]),
    renderItem: (_params: unknown, api: CustomRenderApi) => {
      const index = Number(api.value(0));
      const open = Number(api.value(1));
      const high = Number(api.value(2));
      const low = Number(api.value(3));
      const close = Number(api.value(4));
      const direction = Number(api.value(5));
      const hollow = Number(api.value(6)) > 0;
      if (![index, open, high, low, close].every(Number.isFinite)) return undefined;

      const color = direction >= 0 ? palette.upColor : palette.downColor;
      const x = api.coord([index, close])[0];
      const yOpen = api.coord([index, open])[1];
      const yHigh = api.coord([index, high])[1];
      const yLow = api.coord([index, low])[1];
      const yClose = api.coord([index, close])[1];
      const width = Math.max(3, getCategoryBandWidth(api) * 0.58);
      const top = Math.min(yOpen, yClose);
      const height = Math.max(1, Math.abs(yOpen - yClose));

      return {
        type: "group",
        children: [
          makeLineShape(x, yHigh, x, yLow, color),
          makeRectShape(x - width / 2, top, width, height, hollow ? "transparent" : color, color, visible ? 1 : 0),
        ],
      };
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
