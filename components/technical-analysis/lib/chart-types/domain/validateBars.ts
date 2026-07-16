import type { ChartWarning, NormalizedRawBar, RawBar } from "./types";

export type RawBarInput = Omit<RawBar, "time"> & { time: number | string | Date };

export interface NormalizedBarsResult {
  bars: NormalizedRawBar[];
  invalidBars: Array<{ sourceIndex: number; reason: string }>;
  projectionPlaceholders: Array<{ sourceIndex: number; reason: string }>;
  warnings: ChartWarning[];
}

export const parseBarTime = (time: number | string | Date): number => {
  if (typeof time === "number") return time > 0 && time < 10_000_000_000 ? time * 1000 : time;
  if (time instanceof Date) return time.getTime();
  const parsed = Date.parse(time);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const validateRawBar = (bar: RawBar): boolean =>
  Number.isFinite(bar.time)
  && Number.isFinite(bar.open)
  && Number.isFinite(bar.high)
  && Number.isFinite(bar.low)
  && Number.isFinite(bar.close)
  && bar.low <= Math.min(bar.open, bar.close)
  && bar.high >= Math.max(bar.open, bar.close)
  && bar.high >= bar.low;

const toVolume = (volume: unknown): number | null => {
  if (volume === null || volume === undefined) return null;
  const numericVolume = Number(volume);
  return Number.isFinite(numericVolume) && numericVolume >= 0 ? numericVolume : null;
};

const isExplicitProjectionSentinel = (bar: RawBar): boolean =>
  Number.isNaN(bar.open)
  && bar.high === Number.NEGATIVE_INFINITY
  && bar.low === Number.POSITIVE_INFINITY
  && Number.isNaN(bar.close);

export const isProjectionPlaceholderBar = (bar: RawBar): boolean =>
  Number.isFinite(bar.time)
  && bar.volume === 0
  && isExplicitProjectionSentinel(bar);

export const normalizeRawBars = (input: RawBarInput[]): NormalizedBarsResult => {
  const invalidBars: NormalizedBarsResult["invalidBars"] = [];
  const projectionPlaceholders: NormalizedBarsResult["projectionPlaceholders"] = [];
  const bars: NormalizedRawBar[] = [];

  input.forEach((bar, sourceIndex) => {
    const normalized: NormalizedRawBar = {
      time: parseBarTime(bar.time),
      open: Number(bar.open),
      high: Number(bar.high),
      low: Number(bar.low),
      close: Number(bar.close),
      volume: toVolume(bar.volume),
      sourceIndex,
    };

    if (isProjectionPlaceholderBar(normalized)) {
      projectionPlaceholders.push({ sourceIndex, reason: "Projection placeholder without executable OHLC" });
    } else if (validateRawBar(normalized)) {
      bars.push(normalized);
    } else {
      invalidBars.push({ sourceIndex, reason: "Invalid OHLC or timestamp" });
    }
  });

  bars.sort((left, right) => left.time - right.time || left.sourceIndex - right.sourceIndex);

  const warnings: ChartWarning[] = [];

  if (invalidBars.length > 0) {
    warnings.push({
      code: "INVALID_BARS_REMOVED",
      severity: "warning",
      message: `Data quality: ${invalidBars.length} source OHLC bar(s) ignored.`,
    });
  }

  if (projectionPlaceholders.length > 0) {
    warnings.push({
      code: "PROJECTION_PLACEHOLDERS_IGNORED",
      severity: "info",
      message: `${projectionPlaceholders.length} projection placeholder bar(s) were ignored by OHLC transforms.`,
    });
  }

  return { bars, invalidBars, projectionPlaceholders, warnings };
};

export const hasUsableVolume = (bars: RawBar[]): boolean =>
  bars.some((bar) => Number.isFinite(bar.volume) && (bar.volume ?? 0) > 0);

export const hasIntradayGranularity = (bars: RawBar[]): boolean => {
  if (bars.length < 2) return false;
  let smallestGap = Number.POSITIVE_INFINITY;

  for (let index = 1; index < bars.length; index++) {
    const gap = bars[index].time - bars[index - 1].time;
    if (gap > 0 && gap < smallestGap) smallestGap = gap;
  }

  return smallestGap < 20 * 60 * 60 * 1000;
};
