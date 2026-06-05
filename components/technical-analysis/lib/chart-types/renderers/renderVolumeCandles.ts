import type { ChartTypeRenderer, CustomRenderApi } from "./types";
import { PRICE_CUSTOM_SERIES_BINDING, buildLatestPriceMarkLine, getCategoryBandWidth, makeLineShape, makeRectShape } from "./helpers";

export const renderVolumeCandles: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "volume_candles") return [];

  return [{
    id,
    name,
    type: "custom",
    ...PRICE_CUSTOM_SERIES_BINDING,
    data: result.bars.map((bar, index) => [
      index,
      bar.open,
      bar.high,
      bar.low,
      bar.close,
      bar.close >= bar.open ? 1 : -1,
      bar.volumeWidthRatio,
    ]),
    renderItem: (_params: unknown, api: CustomRenderApi) => {
      const index = Number(api.value(0));
      const open = Number(api.value(1));
      const high = Number(api.value(2));
      const low = Number(api.value(3));
      const close = Number(api.value(4));
      const direction = Number(api.value(5));
      const ratio = Number(api.value(6));
      if (![index, open, high, low, close, ratio].every(Number.isFinite)) return undefined;

      const color = direction >= 0 ? palette.upColor : palette.downColor;
      const band = getCategoryBandWidth(api);
      const width = Math.max(2, 2 + ratio * (band * 0.9 - 2));
      const x = api.coord([index, close])[0];
      const yOpen = api.coord([index, open])[1];
      const yHigh = api.coord([index, high])[1];
      const yLow = api.coord([index, low])[1];
      const yClose = api.coord([index, close])[1];
      const top = Math.min(yOpen, yClose);
      const height = Math.max(1, Math.abs(yOpen - yClose));

      return {
        type: "group",
        children: [
          makeLineShape(x, yHigh, x, yLow, color),
          makeRectShape(x - width / 2, top, width, height, color, color, visible ? 0.86 : 0),
        ],
      };
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
