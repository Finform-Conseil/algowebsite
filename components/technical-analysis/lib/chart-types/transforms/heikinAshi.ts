import type { ChartTransformInput, ChartTransformResult, OhlcBar } from "../domain/types";
import { makeSourceMap } from "../domain/types";

export const transformHeikinAshi = (input: ChartTransformInput): ChartTransformResult => {
  let previousOpen: number | null = null;
  let previousClose: number | null = null;

  const bars = input.bars.map((bar, index): OhlcBar => {
    const haClose = (bar.open + bar.high + bar.low + bar.close) / 4;
    const haOpen = index === 0 || previousOpen === null || previousClose === null
      ? (bar.open + bar.close) / 2
      : (previousOpen + previousClose) / 2;
    const haHigh = Math.max(bar.high, haOpen, haClose);
    const haLow = Math.min(bar.low, haOpen, haClose);

    previousOpen = haOpen;
    previousClose = haClose;

    return {
      time: bar.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose,
      volume: bar.volume,
      synthetic: true,
      sourceMap: makeSourceMap([bar.sourceIndex]),
    };
  });

  return {
    kind: "ohlc",
    synthetic: true,
    warnings: [{
      code: "SYNTHETIC_PRICE",
      severity: "info",
      message: "Heikin Ashi displays synthetic average prices, not executable market prices.",
    }],
    bars,
  };
};
