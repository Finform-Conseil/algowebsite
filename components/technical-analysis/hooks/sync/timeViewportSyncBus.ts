import type { MultiChartLayoutSync } from "../../config/layout/multiChartLayoutTypes";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";

export interface TimeViewportSyncSnapshot {
  startTime: string;
  endTime: string;
  centerTime: string;
  startDataIndex: number;
  endDataIndex: number;
  totalDataPoints: number;
  dataFirstTime: string;
  dataLastTime: string;
}

export type TimeViewportSyncListener = (snapshot: TimeViewportSyncSnapshot) => void;

export const shouldSynchronizeTimeViewport = (
  sync: Pick<MultiChartLayoutSync, "time">,
): boolean => sync.time === true;

const listenersByChart = new WeakMap<EChartsInstance, Set<TimeViewportSyncListener>>();
const latestSnapshotByChart = new WeakMap<EChartsInstance, TimeViewportSyncSnapshot>();

const clampDataIndex = (value: number, totalDataPoints: number): number => {
  const lastIndex = Math.max(0, totalDataPoints - 1);
  return Math.max(0, Math.min(lastIndex, Math.round(value)));
};

const snapshotsEqual = (
  left: TimeViewportSyncSnapshot | undefined,
  right: TimeViewportSyncSnapshot,
): boolean => {
  if (!left) return false;
  return left.startTime === right.startTime
    && left.endTime === right.endTime
    && left.centerTime === right.centerTime
    && left.startDataIndex === right.startDataIndex
    && left.endDataIndex === right.endDataIndex
    && left.totalDataPoints === right.totalDataPoints
    && left.dataFirstTime === right.dataFirstTime
    && left.dataLastTime === right.dataLastTime;
};

export const createTimeViewportSyncSnapshot = (
  data: readonly ChartDataPoint[],
  startIndex: number,
  endIndex: number,
): TimeViewportSyncSnapshot | null => {
  if (data.length === 0) return null;

  const boundedStart = clampDataIndex(Math.min(startIndex, endIndex), data.length);
  const boundedEnd = clampDataIndex(Math.max(startIndex, endIndex), data.length);
  const centerIndex = Math.round((boundedStart + boundedEnd) / 2);
  const startTime = String(data[boundedStart]?.time ?? "").trim();
  const endTime = String(data[boundedEnd]?.time ?? "").trim();
  const centerTime = String(data[centerIndex]?.time ?? "").trim();
  const dataFirstTime = String(data[0]?.time ?? "").trim();
  const dataLastTime = String(data[data.length - 1]?.time ?? "").trim();
  if (!startTime || !endTime || !centerTime || !dataFirstTime || !dataLastTime) return null;

  return Object.freeze({
    startTime,
    endTime,
    centerTime,
    startDataIndex: boundedStart,
    endDataIndex: boundedEnd,
    totalDataPoints: data.length,
    dataFirstTime,
    dataLastTime,
  });
};

export const isTimeViewportSnapshotForData = (
  snapshot: TimeViewportSyncSnapshot,
  data: readonly ChartDataPoint[],
): boolean => data.length === snapshot.totalDataPoints
  && String(data[0]?.time ?? "").trim() === snapshot.dataFirstTime
  && String(data[data.length - 1]?.time ?? "").trim() === snapshot.dataLastTime;

export const publishTimeViewportSync = (
  chart: EChartsInstance,
  snapshot: TimeViewportSyncSnapshot,
): boolean => {
  const previous = latestSnapshotByChart.get(chart);
  if (snapshotsEqual(previous, snapshot)) return false;

  const stableSnapshot = Object.freeze({ ...snapshot });
  latestSnapshotByChart.set(chart, stableSnapshot);
  listenersByChart.get(chart)?.forEach((listener) => listener(stableSnapshot));
  return true;
};

export const getLatestTimeViewportSyncSnapshot = (
  chart: EChartsInstance,
): TimeViewportSyncSnapshot | null => latestSnapshotByChart.get(chart) ?? null;

export const subscribeTimeViewportSync = (
  chart: EChartsInstance,
  listener: TimeViewportSyncListener,
): (() => void) => {
  let listeners = listenersByChart.get(chart);
  if (!listeners) {
    listeners = new Set<TimeViewportSyncListener>();
    listenersByChart.set(chart, listeners);
  }
  listeners.add(listener);

  return () => {
    const current = listenersByChart.get(chart);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) listenersByChart.delete(chart);
  };
};
