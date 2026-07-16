import { percentile, clampNumber } from "../domain/math";
import { resolvePriceSource } from "../domain/priceSources";
import type {
  ChartTransformInput,
  ChartTransformResult,
  ColumnsPoint,
  HighLowItem,
  LinePoint,
  NormalizedRawBar,
  OhlcBar,
  VolumeCandle,
} from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { hasUsableVolume } from "../domain/validateBars";

export const transformOhlc = (input: ChartTransformInput): ChartTransformResult => ({
  kind: "ohlc",
  synthetic: false,
  warnings: [],
  bars: input.bars.map(toOhlcBar),
});

export const transformLine = (input: ChartTransformInput): ChartTransformResult => ({
  kind: "line",
  synthetic: false,
  warnings: [],
  points: input.bars.map((bar): LinePoint => ({
    time: bar.time,
    value: resolvePriceSource(bar, input.priceSource),
    sourceMap: makeSourceMap([bar.sourceIndex]),
  })),
});

export const transformColumns = (input: ChartTransformInput): ChartTransformResult => {
  let previousValue: number | null = null;
  const points = input.bars.map((bar): ColumnsPoint => {
    const value = resolvePriceSource(bar, input.priceSource);
    const direction = previousValue === null || value >= previousValue ? 1 : -1;
    previousValue = value;
    return { time: bar.time, value, direction, sourceMap: makeSourceMap([bar.sourceIndex]) };
  });

  return { kind: "columns", synthetic: false, warnings: [], points };
};

export const transformHighLow = (input: ChartTransformInput): ChartTransformResult => ({
  kind: "high_low",
  synthetic: false,
  warnings: [],
  items: input.bars.map((bar): HighLowItem => ({
    time: bar.time,
    high: bar.high,
    low: bar.low,
    sourceMap: makeSourceMap([bar.sourceIndex]),
  })),
});

export const transformVolumeCandles = (input: ChartTransformInput): ChartTransformResult => {
  const visibleBars = input.bars.slice(
    Math.max(0, input.visibleStartIndex ?? 0),
    Math.min(input.bars.length, (input.visibleEndIndex ?? input.bars.length - 1) + 1),
  );
  const p95 = percentile(visibleBars.map((bar) => Math.log1p(bar.volume ?? 0)), 95);
  const hasVolume = hasUsableVolume(input.bars);

  const bars = input.bars.map((bar): VolumeCandle => {
    const logVolume = Math.log1p(bar.volume ?? 0);
    const volumeWidthRatio = p95 > 0 ? clampNumber(logVolume / p95, 0, 1) : 0.5;
    return { ...toOhlcBar(bar), volumeWidthRatio };
  });

  return {
    kind: "volume_candles",
    synthetic: false,
    warnings: hasVolume ? [] : [{
      code: "VOLUME_MISSING",
      severity: "warning",
      message: "Volume candles need volume. Width falls back to neutral candles.",
    }],
    bars,
  };
};

export const toOhlcBar = (bar: NormalizedRawBar): OhlcBar => ({
  time: bar.time,
  open: bar.open,
  high: bar.high,
  low: bar.low,
  close: bar.close,
  volume: bar.volume,
  synthetic: false,
  sourceMap: makeSourceMap([bar.sourceIndex]),
});
