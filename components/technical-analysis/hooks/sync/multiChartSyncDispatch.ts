import {
  MULTI_CHART_MINI_DATA_ZOOM_ID,
  type DataZoomSyncPayload,
  type SyncTarget,
} from "./multiChartSyncTypes";
import {
  computeProportionalTimeRange,
  findClosestIndex,
  getIntervalDays,
  resolveTargetIndex,
} from "./multiChartSyncLookup";

export const dispatchTimeRange = (
  target: SyncTarget,
  payload: DataZoomSyncPayload,
  startTime: string | null,
  endTime: string | null,
  activeInterval?: string
): void => {
  if (target.chart.isDisposed()) return;

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
      const startPoint = target.lookup.data[result.startIndex];
      const endPoint = target.lookup.data[result.endIndex];
      if (startPoint && endPoint) {
        target.chart.dispatchAction({
          type: "dataZoom",
          dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
          startValue: startPoint.time,
          endValue: endPoint.time,
        });
        return;
      }
    }
  }

  if (startTime && endTime) {
    const resolveWithFallback = (time: string, isStart: boolean): number => {
      const index = resolveTargetIndex(target, time);
      if (index !== null) return index;

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

  if (payload.start !== null || payload.end !== null) {
    target.chart.dispatchAction({
      type: "dataZoom",
      dataZoomId: MULTI_CHART_MINI_DATA_ZOOM_ID,
      start: payload.start ?? 0,
      end: payload.end ?? 100,
    });
  }
};

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
