import { resolveCandleDirection, type CandleDirection } from "../../chart/directionalOhlcv";
import type { ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

// TradingView-like candle geometry, measured against the reference canvas.
//
// Reference capture at DPR=1:
// - candle slot: ~10-11 px
// - body: mostly 7 px
// - wick: one centered device pixel
//
// Our main chart uses wider category slots at the default viewport, so a 68% body
// produced visually heavy 10-11 px rectangles. Keep the width proportional, but
// lower the body occupancy and remove the artificial 7 px floor so zoomed-out
// charts can naturally converge to thin 1-3 px candles like TradingView.
//
// Important: wicks remain native ECharts candlestick strokes (borderWidth=1).
// We never synthesize High/Low. When the BRVM API provides high/low=null, the
// canonical market-data mapper collapses them to the real open/close envelope;
// therefore no fictitious wick is drawn.
const CANDLE_BODY_WIDTH = "48%";
const MIN_CANDLE_BODY_WIDTH = 1;
const MAX_CANDLE_BODY_WIDTH = 14;

export const renderCandles: ChartTypeRenderer = ({ id, name, result, palette, latestPrice }) => {
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
      const prevBar = index > 0 ? result.bars[index - 1] : undefined;
      const direction = resolveCandleDirection(bar, prevBar, lastDirection);
      lastDirection = direction;
      const color = direction > 0 ? palette.upColor : palette.downColor;
      return {
        value: [bar.open, bar.close, bar.low, bar.high],
        itemStyle: {
          color: color,
          color0: color,
          borderColor: color,
          borderColor0: color,
        },
      };
    }),
    itemStyle: {
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
