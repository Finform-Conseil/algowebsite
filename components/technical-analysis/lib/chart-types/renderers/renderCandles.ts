import { getCandleDirectionColor, resolveCandleDirection, type CandleDirection } from "../../chart/directionalOhlcv";
import type { ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

const CANDLE_BODY_WIDTH = "68%";
const MIN_CANDLE_BODY_WIDTH = 7;
const MAX_CANDLE_BODY_WIDTH = 22;

export const renderCandles: ChartTypeRenderer = ({ id, name, result, palette, latestPrice, visible }) => {
  if (result.kind !== "ohlc") return [];

  let lastDirection: CandleDirection = 1;

  return [{
    id,
    name,
    type: "candlestick",
    clip: true,
    large: false,
    barWidth: CANDLE_BODY_WIDTH,
    barMinWidth: MIN_CANDLE_BODY_WIDTH,
    barMaxWidth: MAX_CANDLE_BODY_WIDTH,
    data: result.bars.map((bar, index) => {
      const direction = resolveCandleDirection(bar, result.bars[index - 1], lastDirection);
      lastDirection = direction;
      const color = getCandleDirectionColor(direction, palette.upColor, palette.downColor);
      return {
        value: [bar.open, bar.close, bar.low, bar.high],
        itemStyle: {
          color,
          color0: color,
          borderColor: color,
          borderColor0: color,
          borderColorDoji: color,
          opacity: visible ? 1 : 0,
        },
      };
    }),
    itemStyle: {
      color: palette.upColor,
      color0: palette.downColor,
      borderColor: palette.upColor,
      borderColor0: palette.downColor,
      borderColorDoji: palette.upColor,
      borderWidth: 1,
    },
    emphasis: {
      itemStyle: {
        borderWidth: 1,
      },
    },
    markLine: buildLatestPriceMarkLine(latestPrice, palette.liveColor),
  }];
};
