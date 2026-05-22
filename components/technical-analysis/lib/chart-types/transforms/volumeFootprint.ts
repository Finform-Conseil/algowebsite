import { buildPriceRows } from "../domain/math";
import { resolveTickSize } from "../domain/tickSize";
import type {
  ChartTransformInput,
  ChartTransformResult,
  ChartWarning,
  FootprintCandle,
  FootprintLevel,
  IntrabarBar,
  NormalizedRawBar,
  TradeTick,
} from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { hasIntradayGranularity, hasUsableVolume } from "../domain/validateBars";
import { resolvePocIndex, resolveValueAreaIndexes } from "./valueArea";

export interface VolumeFootprintSettings {
  ticksPerRow?: number;
  imbalancePct?: number;
  valueAreaPct?: number;
}

type FlowSide = "buy" | "sell";

const DEFAULT_TICKS_PER_ROW = 10;
const MAX_FOOTPRINT_ROWS_PER_CANDLE = 80;

const resolveFootprintRowSize = (
  bar: NormalizedRawBar,
  tickSize: number,
  ticksPerRow?: number,
): number => {
  const requestedTicks = Math.max(1, ticksPerRow ?? DEFAULT_TICKS_PER_ROW);
  const requestedRowSize = requestedTicks * tickSize;
  const priceRange = Math.max(bar.high - bar.low, tickSize);
  const rowBudgetSize = Math.ceil(priceRange / MAX_FOOTPRINT_ROWS_PER_CANDLE / tickSize) * tickSize;

  return Math.max(requestedRowSize, rowBudgetSize, tickSize);
};

export const transformVolumeFootprint = (
  input: ChartTransformInput,
  settings: VolumeFootprintSettings = {},
): ChartTransformResult => {
  const warnings: ChartWarning[] = [];
  if (!hasUsableVolume(input.bars)) {
    warnings.push({ code: "VOLUME_MISSING", severity: "warning" as const, message: "Volume Footprint needs volume data." });
  }
  if (!input.ticks?.length && !input.intrabars?.length && !hasIntradayGranularity(input.bars)) {
    warnings.push({ code: "INTRABAR_MISSING", severity: "info" as const, message: "Footprint uses OHLCV approximation because tick/intrabar feed is unavailable." });
  }

  const candles = input.bars.map((bar, index) => buildFootprintCandle(input, bar, index, settings));
  return { kind: "footprint", synthetic: false, approximate: !input.ticks?.length, warnings, candles };
};

const buildFootprintCandle = (
  input: ChartTransformInput,
  bar: NormalizedRawBar,
  index: number,
  settings: VolumeFootprintSettings,
): FootprintCandle => {
  const tickSize = resolveTickSize(input.symbolMeta);
  const rowSize = resolveFootprintRowSize(bar, tickSize, settings.ticksPerRow);
  const levels = buildPriceRows(bar.low, bar.high, rowSize).map((row): FootprintLevel => ({
    ...row,
    buyVolume: 0,
    sellVolume: 0,
    totalVolume: 0,
    delta: 0,
    isPoc: false,
    isValueArea: false,
    buyImbalance: false,
    sellImbalance: false,
  }));

  const ticks = input.ticks?.filter((tick) => tick.time >= bar.time && tick.time <= bar.time);
  if (ticks?.length) distributeTicks(levels, ticks);
  else distributeApproximateIntrabars(levels, input.intrabars, bar, input.bars[index - 1]);

  finalizeFootprintLevels(levels, settings);
  const buyVolume = levels.reduce((sum, level) => sum + level.buyVolume, 0);
  const sellVolume = levels.reduce((sum, level) => sum + level.sellVolume, 0);
  const totalVolume = buyVolume + sellVolume;
  const delta = buyVolume - sellVolume;

  return {
    time: bar.time,
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
    volume: totalVolume,
    levels,
    delta,
    deltaPct: totalVolume > 0 ? delta / totalVolume * 100 : 0,
    sourceMap: makeSourceMap([bar.sourceIndex]),
  };
};

const distributeTicks = (levels: FootprintLevel[], ticks: TradeTick[]) => {
  ticks.forEach((tick) => {
    const level = levels.find((row) => tick.price >= row.priceLow && tick.price <= row.priceHigh);
    if (!level) return;

    if (tick.side === "sell") level.sellVolume += tick.volume;
    else level.buyVolume += tick.volume;
  });
};

const distributeApproximateIntrabars = (
  levels: FootprintLevel[],
  intrabars: IntrabarBar[] | undefined,
  bar: NormalizedRawBar,
  previousBar: NormalizedRawBar | undefined,
) => {
  const sourceBars = intrabars?.length ? intrabars : [bar];
  let previousSide: FlowSide = "buy";

  sourceBars.forEach((intrabar) => {
    const side = classifyIntrabar(intrabar, previousBar?.close, previousSide);
    previousSide = side;
    const touched = levels.filter((row) => row.priceHigh >= intrabar.low && row.priceLow <= intrabar.high);
    const volume = (intrabar.volume ?? 0) / Math.max(1, touched.length);

    touched.forEach((level) => {
      if (side === "buy") level.buyVolume += volume;
      else level.sellVolume += volume;
    });
  });
};

const classifyIntrabar = (
  intrabar: IntrabarBar,
  previousClose: number | undefined,
  fallback: FlowSide,
): FlowSide => {
  if (intrabar.close > intrabar.open) return "buy";
  if (intrabar.close < intrabar.open) return "sell";
  if (Number.isFinite(previousClose) && intrabar.close > (previousClose as number)) return "buy";
  if (Number.isFinite(previousClose) && intrabar.close < (previousClose as number)) return "sell";
  return fallback;
};

const finalizeFootprintLevels = (levels: FootprintLevel[], settings: VolumeFootprintSettings) => {
  levels.forEach((level) => {
    level.totalVolume = level.buyVolume + level.sellVolume;
    level.delta = level.buyVolume - level.sellVolume;
  });

  const pocIndex = resolvePocIndex(levels.map((level) => ({ total: level.totalVolume })));
  const valueAreaIndexes = resolveValueAreaIndexes(levels.map((level) => ({ total: level.totalVolume })), settings.valueAreaPct ?? 70);
  const threshold = (settings.imbalancePct ?? 300) / 100;

  levels.forEach((level, index) => {
    level.isPoc = index === pocIndex;
    level.isValueArea = valueAreaIndexes.has(index);
    const below = levels[index - 1];
    const above = levels[index + 1];
    level.buyImbalance = !!below && level.buyVolume >= threshold * below.sellVolume && level.buyVolume > 0;
    level.sellImbalance = !!above && level.sellVolume >= threshold * above.buyVolume && level.sellVolume > 0;
  });
};
