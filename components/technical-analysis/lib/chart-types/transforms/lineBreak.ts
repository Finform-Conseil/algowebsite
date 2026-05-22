import type { ChartTransformInput, ChartTransformResult, OhlcBar } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { syntheticPriceWarning } from "./priceBasedUtils";

export interface LineBreakSettings {
  numberOfLines?: number;
}

export const transformLineBreak = (
  input: ChartTransformInput,
  settings: LineBreakSettings = {},
): ChartTransformResult => {
  const numberOfLines = Math.max(1, Math.floor(settings.numberOfLines ?? 3));
  const lines: OhlcBar[] = [];

  input.bars.forEach((bar) => {
    if (lines.length === 0) {
      lines.push(makeLine(bar.time, bar.open, bar.close, bar.sourceIndex));
      return;
    }

    const recent = lines.slice(Math.max(0, lines.length - numberOfLines));
    const recentHigh = Math.max(...recent.map((line) => line.high));
    const recentLow = Math.min(...recent.map((line) => line.low));
    const previousClose = lines[lines.length - 1].close;

    if (bar.close > recentHigh || bar.close < recentLow) {
      lines.push(makeLine(bar.time, previousClose, bar.close, bar.sourceIndex));
    }
  });

  return { kind: "ohlc", synthetic: true, warnings: [syntheticPriceWarning("Line Break")], bars: lines };
};

const makeLine = (time: number, open: number, close: number, sourceIndex: number): OhlcBar => ({
  time,
  open,
  close,
  high: Math.max(open, close),
  low: Math.min(open, close),
  volume: null,
  synthetic: true,
  sourceMap: makeSourceMap([sourceIndex]),
});
