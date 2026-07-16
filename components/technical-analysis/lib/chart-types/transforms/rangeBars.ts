import type { ChartTransformInput, ChartTransformResult, OhlcBar } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { resolveTickSize } from "../domain/tickSize";
import {
  MAX_SYNTHETIC_OUTPUT_POINTS,
  makePerformanceBudgetWarning,
  resolvePriceBasedSize,
  syntheticPriceWarning,
} from "./priceBasedUtils";

export interface RangeBarsSettings {
  rangeTicks?: number;
}

export const transformRangeBars = (
  input: ChartTransformInput,
  settings: RangeBarsSettings = {},
): ChartTransformResult => {
  const warnings = [syntheticPriceWarning("Range")];

  if (input.bars.length === 0) {
    return { kind: "ohlc", synthetic: true, warnings, bars: [] };
  }

  const rangeSize = resolveRangeSize(input, settings);
  const bars: OhlcBar[] = [];
  let currentOpen = input.bars[0].close;
  let currentHigh = currentOpen;
  let currentLow = currentOpen;
  let sourceIndices = [input.bars[0].sourceIndex];
  let capped = false;

  for (const bar of input.bars) {
    let price = bar.close;
    sourceIndices.push(bar.sourceIndex);
    currentHigh = Math.max(currentHigh, price);
    currentLow = Math.min(currentLow, price);

    while (price >= currentOpen + rangeSize || price <= currentOpen - rangeSize) {
      if (bars.length >= MAX_SYNTHETIC_OUTPUT_POINTS) {
        capped = true;
        break;
      }

      const isUp = price >= currentOpen + rangeSize;
      const close = currentOpen + (isUp ? rangeSize : -rangeSize);
      bars.push(makeRangeBar(bar.time, currentOpen, close, currentHigh, currentLow, sourceIndices));
      currentOpen = close;
      currentHigh = currentOpen;
      currentLow = currentOpen;
      sourceIndices = [bar.sourceIndex];
      price = bar.close;
    }

    if (capped) break;
  }

  return {
    kind: "ohlc",
    synthetic: true,
    warnings: capped ? [...warnings, makePerformanceBudgetWarning("Range", MAX_SYNTHETIC_OUTPUT_POINTS)] : warnings,
    bars,
  };
};

const resolveRangeSize = (
  input: ChartTransformInput,
  settings: RangeBarsSettings,
): number => {
  if (!Number.isFinite(settings.rangeTicks)) return resolvePriceBasedSize(input);

  const tickSize = resolveTickSize(input.symbolMeta);
  const requestedSize = Math.max(1, Math.floor(settings.rangeTicks ?? 10)) * tickSize;
  const adaptiveMinimum = resolvePriceBasedSize(input, { method: "percentage_ltp", percentage: 0.25 });
  return Math.max(requestedSize, adaptiveMinimum, tickSize);
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
