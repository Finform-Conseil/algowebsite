import type { ChartTypeRenderer, CustomRenderApi } from "./types";
import { PRICE_CUSTOM_SERIES_BINDING, buildLatestPriceMarkLine, getCategoryBandWidth, makeLineShape } from "./helpers";

export const renderBars: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "ohlc") return [];

  return [{
    id,
    name,
    type: "custom",
    ...PRICE_CUSTOM_SERIES_BINDING,
    encode: { x: 0, y: [1, 2, 3, 4] },
    data: result.bars.map((bar, index) => [
      index,
      bar.open,
      bar.high,
      bar.low,
      bar.close,
      bar.close >= bar.open ? 1 : -1,
    ]),
    renderItem: (_params: unknown, api: CustomRenderApi) => {
      const index = Number(api.value(0));
      const open = Number(api.value(1));
      const high = Number(api.value(2));
      const low = Number(api.value(3));
      const close = Number(api.value(4));
      const direction = Number(api.value(5));
      if (![index, open, high, low, close].every(Number.isFinite)) return undefined;

      const color = direction >= 0 ? palette.upColor : palette.downColor;
      const x = api.coord([index, close])[0];
      const yOpen = api.coord([index, open])[1];
      const yHigh = api.coord([index, high])[1];
      const yLow = api.coord([index, low])[1];
      const yClose = api.coord([index, close])[1];
      if (![x, yOpen, yHigh, yLow, yClose].every(Number.isFinite)) return undefined;
      const tick = Math.max(3, getCategoryBandWidth(api) * 0.32);

      return {
        type: "group",
        children: [
          makeLineShape(x, yHigh, x, yLow, color),
          makeLineShape(x - tick, yOpen, x, yOpen, color),
          makeLineShape(x, yClose, x + tick, yClose, color),
        ],
        style: { opacity: visible ? 1 : 0 },
      };
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
