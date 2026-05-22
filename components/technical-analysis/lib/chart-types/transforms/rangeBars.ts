import type { ChartTransformInput, ChartTransformResult, OhlcBar } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { resolveTickSize } from "../domain/tickSize";
import { syntheticPriceWarning } from "./priceBasedUtils";

export interface RangeBarsSettings {
  rangeTicks?: number;
}

export const transformRangeBars = (
  input: ChartTransformInput,
  settings: RangeBarsSettings = {},
): ChartTransformResult => {
  if (input.bars.length === 0) {
    return { kind: "ohlc", synthetic: true, warnings: [syntheticPriceWarning("Range")], bars: [] };
  }

  const tickSize = resolveTickSize(input.symbolMeta);
  const rangeSize = Math.max(1, Math.floor(settings.rangeTicks ?? 10)) * tickSize;
  const bars: OhlcBar[] = [];
  let currentOpen = input.bars[0].close;
  let currentHigh = currentOpen;
  let currentLow = currentOpen;
  let sourceIndices = [input.bars[0].sourceIndex];

  input.bars.forEach((bar) => {
    let price = bar.close;
    sourceIndices.push(bar.sourceIndex);
    currentHigh = Math.max(currentHigh, price);
    currentLow = Math.min(currentLow, price);

    while (price >= currentOpen + rangeSize || price <= currentOpen - rangeSize) {
      const isUp = price >= currentOpen + rangeSize;
      const close = currentOpen + (isUp ? rangeSize : -rangeSize);
      bars.push(makeRangeBar(bar.time, currentOpen, close, currentHigh, currentLow, sourceIndices));
      currentOpen = close;
      currentHigh = currentOpen;
      currentLow = currentOpen;
      sourceIndices = [bar.sourceIndex];
      price = bar.close;
    }
  });

  return { kind: "ohlc", synthetic: true, warnings: [syntheticPriceWarning("Range")], bars };
};

const makeRangeBar = (
  time: number,
  open: number,
  close: number,
  high: number,
  low: number,
  sourceIndices: number[],
): OhlcBar => ({
  time,
  open,
  close,
  high: Math.max(open, close, Math.min(high, Math.max(open, close))),
  low: Math.min(open, close, Math.max(low, Math.min(open, close))),
  volume: null,
  synthetic: true,
  sourceMap: makeSourceMap(Array.from(new Set(sourceIndices))),
});
