import { getCandleDirectionColor, resolveCandleDirection, type CandleDirection } from "../../chart/directionalOhlcv";
import type { ChartTypeRenderer } from "./types";
import { buildLatestPriceMarkLine } from "./helpers";

// [TENOR 2026] barWidth/barMinWidth/barMaxWidth calibrés pour la parité TradingView.
// barWidth 68% : corps centré dans son slot sans débordement inter-bougies.
// MIN 7px  : garantit un corps VISIBLE même sur doji (open == close) — critique
//            pour marchés à faible liquidité (BRVM : BOAB, SGBCI, etc.) où de
//            longues séries de bougies identiques sont normales.
// MAX 22px : borne haute pour zooms très proches (< 10 bougies visibles).
//
// [FIX REGRESSION] Trois bugs introduits par un LLM intermédiaire, rétablis :
//   1. large:true  → supprimé : mode large ECharts ne rend que les mèches (wicks),
//      supprime entièrement le corps rectangulaire open/close.
//   2. barMinWidth:1 → restauré à 7 : valeur 1px rendait les dojis BRVM invisibles.
//   3. encode + date-prefix ([date,O,C,L,H]) → retiré : le format natif ECharts
//      candlestick [O,C,L,H] positionné par index catégorie est plus stable.
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
