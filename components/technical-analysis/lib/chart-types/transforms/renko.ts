import type { ChartTransformInput, ChartTransformResult, OhlcBar } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import {
  MAX_SYNTHETIC_OUTPUT_POINTS,
  makePerformanceBudgetWarning,
  resolvePriceBasedSize,
  syntheticPriceWarning,
  type PriceBasedSizeSettings,
} from "./priceBasedUtils";

export interface RenkoSettings extends PriceBasedSizeSettings {}

type RenkoDirection = "up" | "down";

const makeRenkoBrick = (
  time: number,
  open: number,
  close: number,
  sourceIndex: number,
): OhlcBar => ({
  time,
  open,
  close,
  high: Math.max(open, close),
  low: Math.min(open, close),
  volume: null,
  synthetic: true,
  sourceMap: makeSourceMap([sourceIndex]),
});

export const transformRenko = (
  input: ChartTransformInput,
  settings: RenkoSettings = {},
): ChartTransformResult => {
  const warnings = [syntheticPriceWarning("Renko")];

  if (input.bars.length === 0) {
    return { kind: "ohlc", synthetic: true, warnings, bars: [] };
  }

  const boxSize = resolvePriceBasedSize(input, settings);
  const bars: OhlcBar[] = [];
  let lastClose = input.bars[0].close;
  let direction: RenkoDirection | null = null;
  let capped = false;

  const pushBrick = (barTime: number, open: number, close: number, sourceIndex: number): boolean => {
    if (bars.length >= MAX_SYNTHETIC_OUTPUT_POINTS) {
      capped = true;
      return false;
    }

    bars.push(makeRenkoBrick(barTime, open, close, sourceIndex));
    return true;
  };

  for (const bar of input.bars) {
    let price = bar.close;

    if (direction === "up" && price <= lastClose - 2 * boxSize) {
      const close = lastClose - 2 * boxSize;
      if (!pushBrick(bar.time, lastClose - boxSize, close, bar.sourceIndex)) break;
      lastClose = close;
      direction = "down";
    } else if (direction === "down" && price >= lastClose + 2 * boxSize) {
      const close = lastClose + 2 * boxSize;
      if (!pushBrick(bar.time, lastClose + boxSize, close, bar.sourceIndex)) break;
      lastClose = close;
      direction = "up";
    }

    while ((direction === null || direction === "up") && price >= lastClose + boxSize) {
      const close = lastClose + boxSize;
      if (!pushBrick(bar.time, lastClose, close, bar.sourceIndex)) break;
      lastClose = close;
      direction = "up";
      price = bar.close;
    }

    while (!capped && (direction === null || direction === "down") && price <= lastClose - boxSize) {
      const close = lastClose - boxSize;
      if (!pushBrick(bar.time, lastClose, close, bar.sourceIndex)) break;
      lastClose = close;
      direction = "down";
      price = bar.close;
    }

    if (capped) break;
  }

  return {
    kind: "ohlc",
    synthetic: true,
    warnings: capped ? [...warnings, makePerformanceBudgetWarning("Renko", MAX_SYNTHETIC_OUTPUT_POINTS)] : warnings,
    bars,
  };
};
