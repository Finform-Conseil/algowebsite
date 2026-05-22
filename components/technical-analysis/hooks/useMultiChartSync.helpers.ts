import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../lib/types/echarts";

export const MULTI_CHART_MINI_DATA_ZOOM_ID = "multi-chart-mini-time-zoom";

export type AxisValue = string | number;

export interface MultiChartSyncPeer {
  chartId: string;
  chart: EChartsInstance;
  data: ChartDataPoint[];
  /** Timeframe interval of this chart's data, e.g. "1D", "1W", "1M" */
  interval?: string;
}

export interface ChartLookup {
  data: ChartDataPoint[];
  exactIndexByTime: Map<string, number>;
  dayIndexByKey: Map<string, number>;
}

export interface SyncTarget extends MultiChartSyncPeer {
  lookup: ChartLookup;
  interval?: string;
}

export interface DataZoomSyncPayload {
  originChartId: string;
  start: number | null;
  end: number | null;
  startValue: AxisValue | null;
  endValue: AxisValue | null;
  /** For proportional multi-timeframe sync */
  totalDataPoints?: number;
  startValueIndex?: number;
  endValueIndex?: number;
  centerTime?: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Interval → calendar days. Used to compute proportional zoom across timeframes.
// ─────────────────────────────────────────────────────────────────────────────
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

/** Minimum bars to always keep visible on a secondary chart. */
const MIN_VISIBLE_BARS = 3;

export const getIntervalDays = (interval: string | undefined): number =>
  INTERVAL_TO_DAYS[interval ?? "1D"] ?? 1;

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * Find the index in `lookup.data` closest to `time`.
 * Strategy: exact match → day-level match → binary search by epoch.
 */
const findClosestIndex = (lookup: ChartLookup, time: string): number | null => {
  const exact = lookup.exactIndexByTime.get(time);
  if (exact !== undefined) return exact;

  const dayKey = toDayKey(time);
  const dayMatch = dayKey ? lookup.dayIndexByKey.get(dayKey) : undefined;
  if (dayMatch !== undefined) return dayMatch;

  const targetTs = Date.parse(time);
  if (!Number.isFinite(targetTs) || lookup.data.length === 0) return null;

  // Binary search: find leftmost index where epoch >= targetTs
  let lo = 0;
  let hi = lookup.data.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (Date.parse(lookup.data[mid].time) < targetTs) lo = mid + 1;
    else hi = mid;
  }
  // Return whichever of lo-1 / lo is closest
  if (lo > 0) {
    const prevTs = Date.parse(lookup.data[lo - 1].time);
    const loTs = Date.parse(lookup.data[lo].time);
    if (Math.abs(prevTs - targetTs) < Math.abs(loTs - targetTs)) return lo - 1;
  }
  return lo;
};

const resolveTargetIndex = (target: SyncTarget, time: string): number | null => {
  const exact = target.lookup.exactIndexByTime.get(time);
  if (exact !== undefined) return exact;
  const dayKey = toDayKey(time);
  const dayIndex = dayKey ? target.lookup.dayIndexByKey.get(dayKey) : undefined;
  return dayIndex !== undefined ? dayIndex : null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Public: buildLookup
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Public: resolveZoomRange
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Public: resolvePoint
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Public: computeProportionalTimeRange
// Center-preserving proportional zoom for multi-timeframe mode.
// activeVisibleDays = number of calendar days currently visible on the active chart.
// Returns the [startIndex, endIndex] window the target chart should display.
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Public: dispatchTimeRange
// Applies datazoom to a secondary chart. Three paths (priority order):
//   1. Proportional multi-timeframe alignment (different intervals)
//   2. Absolute date-range sync (same interval)
//   3. Percentage fallback
// ─────────────────────────────────────────────────────────────────────────────
export const dispatchTimeRange = (
  target: SyncTarget,
  payload: DataZoomSyncPayload,
  startTime: string | null,
  endTime: string | null,
  activeInterval?: string
): void => {
  if (target.chart.isDisposed()) return;

  // Path 1 — Proportional: only when intervals differ and we have enriched payload
  if (
    payload.centerTime &&
    payload.startValueIndex !== undefined &&
    payload.endValueIndex !== undefined &&
    activeInterval &&
    target.interval &&
    target.interval !== activeInterval
  ) {
    const activeVisibleBars = Math.max(1, payload.endValueIndex - payload.startValueIndex + 1);
    const activeVisibleDays = activeVisibleBars * getIntervalDays(activeInterval);
    const result = computeProportionalTimeRange(payload.centerTime, activeVisibleDays, target);
    if (result) {
      const sp = target.lookup.data[result.startIndex];
      const ep = target.lookup.data[result.endIndex];
      if (sp && ep) {
        target.chart.dispatchAction({
          type: "dataZoom",
          dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
          startValue: sp.time,
          endValue: ep.time,
        });
        return;
      }
    }
  }

  // Path 2 — Absolute date range (with date clamping fallbacks)
  if (startTime && endTime) {
    const resolveWithFallback = (time: string, isStart: boolean): number => {
      const idx = resolveTargetIndex(target, time);
      if (idx !== null) return idx;

      const ts = Date.parse(time);
      if (!Number.isFinite(ts) || target.lookup.data.length === 0) {
        return isStart ? 0 : target.lookup.data.length - 1;
      }

      const firstTs = Date.parse(target.lookup.data[0].time);
      const lastTs = Date.parse(target.lookup.data[target.lookup.data.length - 1].time);

      if (ts < firstTs) return 0;
      if (ts > lastTs) return target.lookup.data.length - 1;

      return findClosestIndex(target.lookup, time) ?? (isStart ? 0 : target.lookup.data.length - 1);
    };

    const startIndex = resolveWithFallback(startTime, true);
    const endIndex = resolveWithFallback(endTime, false);

    const firstIndex = Math.min(startIndex, endIndex);
    const lastIndex = Math.max(startIndex, endIndex);
    const firstPoint = target.lookup.data[firstIndex];
    const lastPoint = target.lookup.data[lastIndex];
    if (firstPoint && lastPoint) {
      target.chart.dispatchAction({
        type: "dataZoom",
        dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
        startValue: firstPoint.time,
        endValue: lastPoint.time,
      });
      return;
    }
  }

  // Path 3 — Percentage fallback
  if (payload.start !== null || payload.end !== null) {
    target.chart.dispatchAction({
      type: "dataZoom",
      dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
      start: payload.start ?? 0,
      end: payload.end ?? 100,
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Public: dispatchCrosshair / hideCrosshair
// Propagates the active chart's crosshair position to a secondary chart
// by finding the nearest data point in the target's series.
// ─────────────────────────────────────────────────────────────────────────────
export const dispatchCrosshair = (target: SyncTarget, time: string): void => {
  if (target.chart.isDisposed()) return;
  const index = findClosestIndex(target.lookup, time);
  if (index === null) return;
  target.chart.dispatchAction({ type: "showTip", seriesIndex: 0, dataIndex: index });
};

export const hideCrosshair = (target: SyncTarget): void => {
  if (target.chart.isDisposed()) return;
  target.chart.dispatchAction({ type: "hideTip" });
};
