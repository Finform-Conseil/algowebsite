import type { ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

export const renderHlcArea: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "ohlc") return [];

  const lows = result.bars.map((bar) => bar.low);
  const ranges = result.bars.map((bar) => Math.max(0, bar.high - bar.low));
  const closes = result.bars.map((bar) => bar.close);

  return [
    {
      id: `${id}-low`,
      name: `${name} Low`,
      type: "line",
      data: lows,
      stack: `${id}-band`,
      lineStyle: { opacity: 0 },
      itemStyle: { opacity: 0 },
      showSymbol: false,
      silent: true,
    },
    {
      id: `${id}-band`,
      name: `${name} Range`,
      type: "line",
      data: ranges,
      stack: `${id}-band`,
      showSymbol: false,
      lineStyle: { opacity: 0 },
      areaStyle: { color: "rgba(41, 98, 255, 0.16)", opacity: visible ? 1 : 0 },
      silent: true,
    },
    {
      id,
      name,
      type: "line",
      data: closes,
      showSymbol: false,
      itemStyle: { color: palette.upColor, opacity: visible ? 1 : 0 },
      lineStyle: { color: palette.upColor, opacity: visible ? 1 : 0, width: 1.4 },
      markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
    },
  ];
};
