import type { ChartTransformInput, ChartTransformResult, OhlcBar } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { resolvePriceBasedSize, syntheticPriceWarning, type PriceBasedSizeSettings } from "./priceBasedUtils";

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
  if (input.bars.length === 0) {
    return { kind: "ohlc", synthetic: true, warnings: [syntheticPriceWarning("Renko")], bars: [] };
  }

  const boxSize = resolvePriceBasedSize(input, settings);
  const bars: OhlcBar[] = [];
  let lastClose = input.bars[0].close;
  let direction: RenkoDirection | null = null;

  input.bars.forEach((bar) => {
    let price = bar.close;

    if (direction === "up" && price <= lastClose - 2 * boxSize) {
      const close = lastClose - 2 * boxSize;
      bars.push(makeRenkoBrick(bar.time, lastClose - boxSize, close, bar.sourceIndex));
      lastClose = close;
      direction = "down";
    } else if (direction === "down" && price >= lastClose + 2 * boxSize) {
      const close = lastClose + 2 * boxSize;
      bars.push(makeRenkoBrick(bar.time, lastClose + boxSize, close, bar.sourceIndex));
      lastClose = close;
      direction = "up";
    }

    while ((direction === null || direction === "up") && price >= lastClose + boxSize) {
      const close = lastClose + boxSize;
      bars.push(makeRenkoBrick(bar.time, lastClose, close, bar.sourceIndex));
      lastClose = close;
      direction = "up";
      price = bar.close;
    }

    while ((direction === null || direction === "down") && price <= lastClose - boxSize) {
      const close = lastClose - boxSize;
      bars.push(makeRenkoBrick(bar.time, lastClose, close, bar.sourceIndex));
      lastClose = close;
      direction = "down";
      price = bar.close;
    }
  });

  return { kind: "ohlc", synthetic: true, warnings: [syntheticPriceWarning("Renko")], bars };
};
