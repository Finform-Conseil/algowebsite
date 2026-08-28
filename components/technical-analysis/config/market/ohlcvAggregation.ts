import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { ChartTimeframe } from "./timeframeCatalog";

export type AggregatableTimeframe = Extract<ChartTimeframe, "1W" | "1M">;

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isValidOhlcvPoint = (point: ChartDataPoint): boolean => {
  const timestamp = Date.parse(point.time);
  if (!Number.isFinite(timestamp)) return false;
  if (![point.open, point.high, point.low, point.close, point.volume].every(isFiniteNumber)) return false;
  if (point.volume < 0) return false;
  if (point.high < Math.max(point.open, point.close, point.low)) return false;
  if (point.low > Math.min(point.open, point.close, point.high)) return false;
  return true;
};

export const normalizeOhlcvSeries = (source: readonly ChartDataPoint[]): ChartDataPoint[] => {
  const byTimestamp = new Map<number, ChartDataPoint>();
  for (const point of source) {
    if (!point || !isValidOhlcvPoint(point)) continue;
    const timestamp = Date.parse(point.time);
    byTimestamp.set(timestamp, { ...point, time: new Date(timestamp).toISOString() });
  }
  return Array.from(byTimestamp.entries())
    .sort(([left], [right]) => left - right)
    .map(([, point]) => point);
};

const getMondayUtc = (timestamp: number): number => {
  const date = new Date(timestamp);
  const day = date.getUTCDay();
  const distanceFromMonday = (day + 6) % 7;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - distanceFromMonday);
};

const getMonthStartUtc = (timestamp: number): number => {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
};

export const getCalendarBucketKey = (time: string, target: AggregatableTimeframe): string => {
  const timestamp = Date.parse(time);
  if (!Number.isFinite(timestamp)) throw new Error(`Invalid OHLCV timestamp: ${time}`);
  const bucketStart = target === "1W" ? getMondayUtc(timestamp) : getMonthStartUtc(timestamp);
  return new Date(bucketStart).toISOString();
};

const mergeTradesCount = (current: number | null, point: ChartDataPoint): number | null => {
  const raw = point.tradesCount ?? point.trades_count;
  if (!isFiniteNumber(raw)) return current;
  return (current ?? 0) + raw;
};

export const aggregateOhlcv = (
  source: readonly ChartDataPoint[],
  target: ChartTimeframe,
): ChartDataPoint[] => {
  if (target !== "1W" && target !== "1M") {
    throw new Error(`Unsupported OHLCV aggregation target: ${target}`);
  }

  const normalized = normalizeOhlcvSeries(source);
  if (normalized.length === 0) return [];

  const buckets = new Map<string, ChartDataPoint>();
  for (const point of normalized) {
    const bucketTime = getCalendarBucketKey(point.time, target);
    const existing = buckets.get(bucketTime);
    if (!existing) {
      const rawTrades = point.tradesCount ?? point.trades_count;
      buckets.set(bucketTime, {
        time: bucketTime,
        open: point.open,
        high: point.high,
        low: point.low,
        close: point.close,
        volume: point.volume,
        tradesCount: isFiniteNumber(rawTrades) ? rawTrades : null,
      });
      continue;
    }

    existing.high = Math.max(existing.high, point.high);
    existing.low = Math.min(existing.low, point.low);
    existing.close = point.close;
    existing.volume += point.volume;
    existing.tradesCount = mergeTradesCount(existing.tradesCount ?? null, point);
  }

  return Array.from(buckets.values());
};
