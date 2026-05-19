import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../lib/types/echarts";

export const MULTI_CHART_MINI_DATA_ZOOM_ID = "multi-chart-mini-time-zoom";

export type AxisValue = string | number;

export interface MultiChartSyncPeer {
  chartId: string;
  chart: EChartsInstance;
  data: ChartDataPoint[];
}

export interface ChartLookup {
  data: ChartDataPoint[];
  exactIndexByTime: Map<string, number>;
  dayIndexByKey: Map<string, number>;
}

export interface SyncTarget extends MultiChartSyncPeer {
  lookup: ChartLookup;
}

export interface DataZoomSyncPayload {
  originChartId: string;
  start: number | null;
  end: number | null;
  startValue: AxisValue | null;
  endValue: AxisValue | null;
}

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

  const timestamp = typeof value === "number" ? value : Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
};

const firstRecord = (value: unknown): Record<string, unknown> | null => {
  if (!Array.isArray(value)) return null;
  return value.find(isRecord) ?? null;
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

export const resolveZoomRange = (payload: unknown): Omit<DataZoomSyncPayload, "originChartId"> | null => {
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

    const exactIndex = typeof axisValue === "string" ? lookup.exactIndexByTime.get(axisValue) : undefined;
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

export const resolveTargetIndex = (target: SyncTarget, originTime: string): number | null => {
  const point = resolvePoint(target.lookup, originTime, null);
  return point?.index ?? null;
};

export const dispatchTimeRange = (
  target: SyncTarget,
  payload: DataZoomSyncPayload,
  startTime: string | null,
  endTime: string | null
) => {
  if (target.chart.isDisposed()) return;

  if (startTime && endTime) {
    const startIndex = resolveTargetIndex(target, startTime);
    const endIndex = resolveTargetIndex(target, endTime);
    if (startIndex === null || endIndex === null) return;

    const firstIndex = Math.min(startIndex, endIndex);
    const lastIndex = Math.max(startIndex, endIndex);
    const firstPoint = target.lookup.data[firstIndex];
    const lastPoint = target.lookup.data[lastIndex];
    if (!firstPoint || !lastPoint) return;

    target.chart.dispatchAction({
      type: "dataZoom",
      dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
      startValue: firstPoint.time,
      endValue: lastPoint.time,
    });
    return;
  }

  if (payload.start !== null || payload.end !== null) {
    target.chart.dispatchAction({
      type: "dataZoom",
      dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
      start: payload.start ?? 0,
      end: payload.end ?? 100,
    });
  }
};
