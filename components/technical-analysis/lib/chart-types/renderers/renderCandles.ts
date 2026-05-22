import type { ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

export const renderCandles: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "ohlc") return [];

  return [{
    id,
    name,
    type: "candlestick",
    data: result.bars.map((bar) => {
      const color = bar.close >= bar.open ? palette.upColor : palette.downColor;
      return {
        value: [bar.open, bar.close, bar.low, bar.high],
        itemStyle: { color, color0: color, borderColor: color, borderColor0: color, opacity: visible ? 1 : 0 },
      };
    }),
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
