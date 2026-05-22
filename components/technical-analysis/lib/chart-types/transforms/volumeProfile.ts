import { buildPriceRows, sumNumbers } from "../domain/math";
import { resolveTickSize } from "../domain/tickSize";
import type { ChartTransformInput, ChartTransformResult, ChartWarning, NormalizedRawBar, OhlcBar, VolumeProfile, VolumeProfileRow } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { hasIntradayGranularity, hasUsableVolume } from "../domain/validateBars";
import { resolvePocIndex, resolveValueAreaIndexes } from "./valueArea";

export interface VolumeProfileSettings {
  ticksPerRow?: number;
  valueAreaPct?: number;
}

const DEFAULT_TICKS_PER_ROW = 10;
const MAX_PROFILE_ROWS = 72;

const resolveProfileRowSize = (
  profileLow: number,
  profileHigh: number,
  tickSize: number,
  ticksPerRow?: number,
): number => {
  const requestedTicks = Math.max(1, ticksPerRow ?? DEFAULT_TICKS_PER_ROW);
  const requestedRowSize = requestedTicks * tickSize;
  const priceRange = Math.max(profileHigh - profileLow, tickSize);
  const budgetRowSize = Math.ceil(priceRange / MAX_PROFILE_ROWS / tickSize) * tickSize;

  return Math.max(requestedRowSize, budgetRowSize, tickSize);
};

export const transformSessionVolumeProfile = (
  input: ChartTransformInput,
  settings: VolumeProfileSettings = {},
): ChartTransformResult => {
  const warnings: ChartWarning[] = [];
  if (!hasUsableVolume(input.bars)) {
    warnings.push({ code: "VOLUME_MISSING", severity: "warning" as const, message: "Session Volume Profile needs volume data." });
  }
  if (!hasIntradayGranularity(input.bars)) {
    warnings.push({ code: "INTRADAY_MISSING", severity: "warning" as const, message: "Daily-only data produces an approximate session profile." });
  }

  const hasIntraday = hasIntradayGranularity(input.bars);
  const sessions = hasIntraday ? groupBarsByUtcDay(input.bars) : [input.bars];
  const profiles = sessions.map((sessionBars) => buildProfile(input, sessionBars, settings));
  const bars = input.bars.map(toProfileSourceBar);

  return { kind: "profile", synthetic: false, approximate: warnings.length > 0, warnings, profiles, bars };
};

const toProfileSourceBar = (bar: NormalizedRawBar): OhlcBar => ({
  time: bar.time,
  open: bar.open,
  high: bar.high,
  low: bar.low,
  close: bar.close,
  volume: bar.volume,
  synthetic: false,
  sourceMap: makeSourceMap([bar.sourceIndex]),
});

const buildProfile = (
  input: ChartTransformInput,
  bars: NormalizedRawBar[],
  settings: VolumeProfileSettings,
): VolumeProfile => {
  const tickSize = resolveTickSize(input.symbolMeta);
  const profileHigh = Math.max(...bars.map((bar) => bar.high));
  const profileLow = Math.min(...bars.map((bar) => bar.low));
  const rowSize = resolveProfileRowSize(profileLow, profileHigh, tickSize, settings.ticksPerRow);
  const rows = buildPriceRows(profileLow, profileHigh, rowSize).map((row): VolumeProfileRow => ({
    ...row,
    upVolume: 0,
    downVolume: 0,
    totalVolume: 0,
    delta: 0,
    isPoc: false,
    isValueArea: false,
  }));

  bars.forEach((bar) => distributeBarVolume(rows, bar));
  rows.forEach((row) => {
    row.totalVolume = row.upVolume + row.downVolume;
    row.delta = row.upVolume - row.downVolume;
  });

  const pocIndex = resolvePocIndex(rows.map((row) => ({ total: row.totalVolume })));
  const valueAreaIndexes = resolveValueAreaIndexes(rows.map((row) => ({ total: row.totalVolume })), settings.valueAreaPct ?? 70);
  rows.forEach((row, index) => {
    row.isPoc = index === pocIndex;
    row.isValueArea = valueAreaIndexes.has(index);
  });

  const valueRows = rows.filter((row) => row.isValueArea);
  const pocRow = rows[pocIndex] ?? rows[0];
  const totalVolume = sumNumbers(rows.map((row) => row.totalVolume));

  return {
    sessionStart: bars[0].time,
    sessionEnd: bars[bars.length - 1].time,
    rows,
    pocPrice: (pocRow.priceLow + pocRow.priceHigh) / 2,
    vah: Math.max(...valueRows.map((row) => row.priceHigh), pocRow.priceHigh),
    val: Math.min(...valueRows.map((row) => row.priceLow), pocRow.priceLow),
    profileHigh,
    profileLow,
    totalVolume,
    sourceMap: makeSourceMap(bars.map((bar) => bar.sourceIndex)),
  };
};

const distributeBarVolume = (rows: VolumeProfileRow[], bar: NormalizedRawBar) => {
  const touched = rows.filter((row) => row.priceHigh >= bar.low && row.priceLow <= bar.high);
  if (touched.length === 0) return;

  const volume = (bar.volume ?? 0) / touched.length;
  touched.forEach((row) => {
    if (bar.close >= bar.open) row.upVolume += volume;
    else row.downVolume += volume;
  });
};

const groupBarsByUtcDay = (bars: NormalizedRawBar[]): NormalizedRawBar[][] => {
  const groups = new Map<string, NormalizedRawBar[]>();

  bars.forEach((bar) => {
    const key = new Date(bar.time).toISOString().slice(0, 10);
    const group = groups.get(key);
    if (group) group.push(bar);
    else groups.set(key, [bar]);
  });

  return Array.from(groups.values());
};
