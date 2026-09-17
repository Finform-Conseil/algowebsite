import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

export const CHART_DATE_RANGES = ["1J", "5J", "1M", "3M", "6M", "YTD", "1Y", "5Y", "Tout"] as const;
export type ChartDateRange = (typeof CHART_DATE_RANGES)[number];

const CUSTOM_RANGE_PREFIX = "CUSTOM";
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface ChartCustomDateRange {
  start: string;
  end: string;
}

export interface ChartDataDateBounds {
  minDate: string;
  maxDate: string;
  minTimestamp: number;
  maxTimestamp: number;
}

const toDateKey = (timestamp: number): string => new Date(timestamp).toISOString().slice(0, 10);

const parseDateKey = (value: string): number | null => {
  if (!DATE_KEY_PATTERN.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(timestamp) && toDateKey(timestamp) === value ? timestamp : null;
};

const normalizePreset = (range: string | null | undefined): ChartDateRange | null => {
  const normalized = String(range ?? "Tout").trim() || "Tout";
  return (CHART_DATE_RANGES as readonly string[]).includes(normalized)
    ? normalized as ChartDateRange
    : null;
};

const subtractUtcMonths = (anchorTimestamp: number, months: number): number => {
  const anchor = new Date(anchorTimestamp);
  const day = anchor.getUTCDate();
  anchor.setUTCDate(1);
  anchor.setUTCMonth(anchor.getUTCMonth() - months);
  const daysInTargetMonth = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 0)).getUTCDate();
  anchor.setUTCDate(Math.min(day, daysInTargetMonth));
  return anchor.getTime();
};

const resolvePresetCutoffTimestamp = (range: ChartDateRange, anchorTimestamp: number): number | null => {
  const anchor = new Date(anchorTimestamp);
  switch (range) {
    case "1J":
      anchor.setUTCDate(anchor.getUTCDate() - 1);
      return anchor.getTime();
    case "5J":
      anchor.setUTCDate(anchor.getUTCDate() - 5);
      return anchor.getTime();
    case "1M":
      return subtractUtcMonths(anchorTimestamp, 1);
    case "3M":
      return subtractUtcMonths(anchorTimestamp, 3);
    case "6M":
      return subtractUtcMonths(anchorTimestamp, 6);
    case "YTD":
      return Date.UTC(anchor.getUTCFullYear(), 0, 1);
    case "1Y":
      return subtractUtcMonths(anchorTimestamp, 12);
    case "5Y":
      return subtractUtcMonths(anchorTimestamp, 60);
    case "Tout":
      return null;
  }
};

export const resolveChartDataDateBounds = (data: readonly ChartDataPoint[]): ChartDataDateBounds | null => {
  let minTimestamp = Number.POSITIVE_INFINITY;
  let maxTimestamp = Number.NEGATIVE_INFINITY;

  for (const point of data) {
    const timestamp = Date.parse(String(point.time));
    if (!Number.isFinite(timestamp)) continue;
    if (timestamp < minTimestamp) minTimestamp = timestamp;
    if (timestamp > maxTimestamp) maxTimestamp = timestamp;
  }

  if (!Number.isFinite(minTimestamp) || !Number.isFinite(maxTimestamp)) return null;
  return {
    minDate: toDateKey(minTimestamp),
    maxDate: toDateKey(maxTimestamp),
    minTimestamp,
    maxTimestamp,
  };
};

export const encodeCustomDateRange = (start: string, end: string): string => {
  const startTimestamp = parseDateKey(start);
  const endTimestamp = parseDateKey(end);
  if (startTimestamp === null || endTimestamp === null || startTimestamp > endTimestamp) {
    throw new RangeError("Invalid custom chart date range");
  }
  return `${CUSTOM_RANGE_PREFIX}|${start}|${end}`;
};

export const decodeCustomDateRange = (range: string | null | undefined): ChartCustomDateRange | null => {
  const [prefix, start = "", end = "", extra] = String(range ?? "").split("|");
  if (prefix !== CUSTOM_RANGE_PREFIX || extra !== undefined) return null;
  const startTimestamp = parseDateKey(start);
  const endTimestamp = parseDateKey(end);
  if (startTimestamp === null || endTimestamp === null || startTimestamp > endTimestamp) return null;
  return { start, end };
};

export const isCustomDateRange = (range: string | null | undefined): boolean => decodeCustomDateRange(range) !== null;

export const filterChartDataByDateRange = (
  data: readonly ChartDataPoint[],
  range: string | null | undefined,
): ChartDataPoint[] => {
  if (data.length === 0) return [];

  const customRange = decodeCustomDateRange(range);
  if (customRange) {
    const startTimestamp = Date.parse(`${customRange.start}T00:00:00.000Z`);
    const endTimestamp = Date.parse(`${customRange.end}T23:59:59.999Z`);
    return data.filter((point) => {
      const timestamp = Date.parse(String(point.time));
      return Number.isFinite(timestamp) && timestamp >= startTimestamp && timestamp <= endTimestamp;
    });
  }

  const preset = normalizePreset(range);
  if (!preset || preset === "Tout") return data as ChartDataPoint[];

  const bounds = resolveChartDataDateBounds(data);
  if (!bounds) return [];
  const cutoffTimestamp = resolvePresetCutoffTimestamp(preset, bounds.maxTimestamp);
  if (cutoffTimestamp === null) return data as ChartDataPoint[];

  const filtered = data.filter((point) => {
    const timestamp = Date.parse(String(point.time));
    return Number.isFinite(timestamp)
      && timestamp >= cutoffTimestamp
      && timestamp <= bounds.maxTimestamp;
  });

  if (filtered.length > 0) return filtered;
  const latestPoint = [...data].reverse().find((point) => Date.parse(String(point.time)) === bounds.maxTimestamp);
  return latestPoint ? [latestPoint] : [];
};
