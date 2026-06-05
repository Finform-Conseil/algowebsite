import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type {
  AxisValue,
  ChartLookup,
  DataZoomSyncPayload,
  SyncTarget,
} from "./multiChartSyncTypes";

const INTERVAL_TO_DAYS: Record<string, number> = {
  "1m": 1 / 1440,
  "5m": 5 / 1440,
  "15m": 15 / 1440,
  "30m": 30 / 1440,
  "1H": 1 / 24,
  "4H": 4 / 24,
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 91,
  "6M": 182,
  "1Y": 365,
};

const MIN_VISIBLE_BARS = 3;

export const getIntervalDays = (interval: string | undefined): number =>
  INTERVAL_TO_DAYS[interval ?? "1D"] ?? 1;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const readNumber = (record: Record<string, unknown>, key: string): number | null => {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const readAxisValue = (record: Record<string, unknown>, key: string): AxisValue | null => {
  const value = record[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
};

const toDayKey = (value: AxisValue): string | null => {
  if (typeof value === "string") {
    const match = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  const timestamp = typeof value === "number" ? value : Date.parse(value as string);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
};

const firstRecord = (value: unknown): Record<string, unknown> | null => {
  if (!Array.isArray(value)) return null;
  return value.find(isRecord) ?? null;
};

export const findClosestIndex = (lookup: ChartLookup, time: string): number | null => {
  const exact = lookup.exactIndexByTime.get(time);
  if (exact !== undefined) return exact;

  const dayKey = toDayKey(time);
  const dayMatch = dayKey ? lookup.dayIndexByKey.get(dayKey) : undefined;
  if (dayMatch !== undefined) return dayMatch;

  const targetTs = Date.parse(time);
  if (!Number.isFinite(targetTs) || lookup.data.length === 0) return null;

  let lo = 0;
  let hi = lookup.data.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (Date.parse(lookup.data[mid].time) < targetTs) lo = mid + 1;
    else hi = mid;
  }

  if (lo > 0) {
    const prevTs = Date.parse(lookup.data[lo - 1].time);
    const loTs = Date.parse(lookup.data[lo].time);
    if (Math.abs(prevTs - targetTs) < Math.abs(loTs - targetTs)) return lo - 1;
  }
  return lo;
};

export const resolveTargetIndex = (target: SyncTarget, time: string): number | null => {
  const exact = target.lookup.exactIndexByTime.get(time);
  if (exact !== undefined) return exact;
  const dayKey = toDayKey(time);
  const dayIndex = dayKey ? target.lookup.dayIndexByKey.get(dayKey) : undefined;
  return dayIndex !== undefined ? dayIndex : null;
};

export const buildLookup = (data: ChartDataPoint[]): ChartLookup => {
  const exactIndexByTime = new Map<string, number>();
  const dayIndexByKey = new Map<string, number>();
  data.forEach((point, index) => {
    exactIndexByTime.set(point.time, index);
    const dayKey = toDayKey(point.time);
    if (dayKey) dayIndexByKey.set(dayKey, index);
  });
  return { data, exactIndexByTime, dayIndexByKey };
};

export const resolveZoomRange = (
  payload: unknown
): Omit<DataZoomSyncPayload, "originChartId"> | null => {
  if (!isRecord(payload)) return null;
  const batchRecord = firstRecord(payload.batch);
  const record = batchRecord ?? payload;
  const start = readNumber(record, "start");
  const end = readNumber(record, "end");
  const startValue = readAxisValue(record, "startValue");
  const endValue = readAxisValue(record, "endValue");
  if (start === null && end === null && startValue === null && endValue === null) return null;
  return { start, end, startValue, endValue };
};

export const resolvePoint = (
  lookup: ChartLookup,
  axisValue: AxisValue | null,
  fallbackDataIndex: number | null
): { index: number; point: ChartDataPoint } | null => {
  if (axisValue !== null) {
    if (typeof axisValue === "number" && Number.isInteger(axisValue) && lookup.data[axisValue]) {
      return { index: axisValue, point: lookup.data[axisValue] };
    }
    const exactIndex =
      typeof axisValue === "string" ? lookup.exactIndexByTime.get(axisValue) : undefined;
    if (exactIndex !== undefined) return { index: exactIndex, point: lookup.data[exactIndex] };

    const dayKey = toDayKey(axisValue);
    const dayIndex = dayKey ? lookup.dayIndexByKey.get(dayKey) : undefined;
    if (dayIndex !== undefined) return { index: dayIndex, point: lookup.data[dayIndex] };
  }
  if (fallbackDataIndex !== null && lookup.data[fallbackDataIndex]) {
    return { index: fallbackDataIndex, point: lookup.data[fallbackDataIndex] };
  }
  return null;
};

export const computeProportionalTimeRange = (
  activeCenterTime: string,
  activeVisibleDays: number,
  target: SyncTarget
): { startIndex: number; endIndex: number } | null => {
  const { lookup, interval: targetInterval } = target;
  if (lookup.data.length === 0) return null;

  const targetCandleDays = getIntervalDays(targetInterval);
  const targetVisibleBars = Math.max(
    MIN_VISIBLE_BARS,
    Math.round(activeVisibleDays / targetCandleDays)
  );

  const centerIndex = findClosestIndex(lookup, activeCenterTime);
  if (centerIndex === null) return null;

  const half = Math.ceil(targetVisibleBars / 2);
  const startIndex = Math.max(0, centerIndex - half);
  const endIndex = Math.min(lookup.data.length - 1, centerIndex + half);
  return { startIndex, endIndex };
};
