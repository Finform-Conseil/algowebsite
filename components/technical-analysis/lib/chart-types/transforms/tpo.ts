import { buildPriceRows } from "../domain/math";
import { resolveTickSize } from "../domain/tickSize";
import type { ChartTransformInput, ChartTransformResult, NormalizedRawBar, TpoProfile, TpoRow } from "../domain/types";
import { makeSourceMap } from "../domain/types";
import { hasIntradayGranularity } from "../domain/validateBars";
import { resolvePocIndex, resolveValueAreaIndexes } from "./valueArea";

export interface TpoSettings {
  blockSizeMinutes?: 5 | 10 | 15 | 30 | 60 | 120 | 240;
  ticksPerRow?: number;
  valueAreaPct?: number;
}

const TPO_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

export const transformTpo = (
  input: ChartTransformInput,
  settings: TpoSettings = {},
): ChartTransformResult => {
  const warnings = hasIntradayGranularity(input.bars) ? [] : [{
    code: "INTRADAY_MISSING",
    severity: "warning" as const,
    message: "TPO needs intraday bars. Daily-only data produces a coarse approximation.",
  }];

  const sessions = groupBarsByUtcDay(input.bars);
  const profiles = sessions.map((bars) => buildTpoProfile(input, bars, settings));

  return { kind: "tpo", synthetic: false, approximate: warnings.length > 0, warnings, profiles };
};

const buildTpoProfile = (
  input: ChartTransformInput,
  bars: NormalizedRawBar[],
  settings: TpoSettings,
): TpoProfile => {
  const tickSize = resolveTickSize(input.symbolMeta);
  const rowSize = Math.max(1, settings.ticksPerRow ?? autoTicksPerRow(input.bars, tickSize)) * tickSize;
  const profileHigh = Math.max(...bars.map((bar) => bar.high));
  const profileLow = Math.min(...bars.map((bar) => bar.low));
  const rows = buildPriceRows(profileLow, profileHigh, rowSize).map((row): TpoRow => ({
    ...row,
    letters: [],
    blockCount: 0,
    isPoc: false,
    isValueArea: false,
  }));

  bars.forEach((bar, index) => {
    const letter = TPO_LETTERS[index % TPO_LETTERS.length];
    rows.forEach((row) => {
      if (row.priceHigh >= bar.low && row.priceLow <= bar.high) row.letters.push(letter);
    });
  });

  rows.forEach((row) => {
    row.blockCount = row.letters.length;
  });

  const pocIndex = resolvePocIndex(rows.map((row) => ({ total: row.blockCount })));
  const valueAreaIndexes = resolveValueAreaIndexes(rows.map((row) => ({ total: row.blockCount })), settings.valueAreaPct ?? 70);
  rows.forEach((row, index) => {
    row.isPoc = index === pocIndex;
    row.isValueArea = valueAreaIndexes.has(index);
  });

  const valueRows = rows.filter((row) => row.isValueArea);
  const pocRow = rows[pocIndex] ?? rows[0];

  return {
    sessionStart: bars[0].time,
    sessionEnd: bars[bars.length - 1].time,
    rows,
    pocPrice: (pocRow.priceLow + pocRow.priceHigh) / 2,
    vah: Math.max(...valueRows.map((row) => row.priceHigh), pocRow.priceHigh),
    val: Math.min(...valueRows.map((row) => row.priceLow), pocRow.priceLow),
    sourceMap: makeSourceMap(bars.map((bar) => bar.sourceIndex)),
  };
};

const autoTicksPerRow = (bars: NormalizedRawBar[], tickSize: number): number => {
  const visible = bars.slice(Math.max(0, bars.length - 300));
  const high = Math.max(...visible.map((bar) => bar.high));
  const low = Math.min(...visible.map((bar) => bar.low));
  const raw = ((high - low) / tickSize) / 80;
  if (raw <= 100) return Math.max(1, Math.round(raw / 5) * 5);
  if (raw <= 1_000) return Math.round(raw / 50) * 50;
  if (raw <= 10_000) return Math.round(raw / 500) * 500;
  return Math.round(raw / 5_000) * 5_000;
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
