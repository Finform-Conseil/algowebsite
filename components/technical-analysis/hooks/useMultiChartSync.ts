import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { MultiChartLayoutState } from "../config/layout/multiChartLayoutTypes";
import type { MultiChartViewportState } from "../config/layout/multiChartCellState";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../lib/types/echarts";
import {
  MULTI_CHART_MINI_DATA_ZOOM_ID,
  type DataZoomSyncPayload,
  type MultiChartSyncPeer,
  type SyncTarget,
} from "./sync/multiChartSyncTypes";
import { buildLookup } from "./sync/multiChartSyncLookup";
import {
  dispatchCrosshair,
  dispatchTimeRange,
  hideCrosshair,
} from "./sync/multiChartSyncDispatch";
import {
  getLatestTimeViewportSyncSnapshot,
  isTimeViewportSnapshotForData,
  shouldSynchronizeTimeViewport,
  subscribeTimeViewportSync,
  type TimeViewportSyncSnapshot,
} from "./sync/timeViewportSyncBus";

interface UseMultiChartSyncProps {
  layout: MultiChartLayoutState;
  activeChartInstanceRef: MutableRefObject<EChartsInstance | null>;
  activeChartData: ChartDataPoint[];
  secondaryCharts: MultiChartSyncPeer[];
  onActiveViewportChange?: (viewport: Pick<MultiChartViewportState, "startTime" | "endTime">) => void;
}

const cancelFrame = (frameRef: MutableRefObject<number | null>) => {
  if (frameRef.current === null) return;
  window.cancelAnimationFrame(frameRef.current);
  frameRef.current = null;
};

// Lightweight runtime type guard reused in event handlers
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const useMultiChartSync = ({
  layout,
  activeChartInstanceRef,
  activeChartData,
  secondaryCharts,
  onActiveViewportChange,
}: UseMultiChartSyncProps) => {
  // ── Derive active chart interval from layout state ──────────────────────
  const activeInterval = useMemo(() => {
    const activeCell = layout.charts.find((c) => c.chartId === layout.activeChartId);
    return activeCell?.interval ?? "1D";
  }, [layout.activeChartId, layout.charts]);

  const activeLookup = useMemo(() => buildLookup(activeChartData), [activeChartData]);
  const targets = useMemo<SyncTarget[]>(
    () =>
      secondaryCharts.map((peer) => ({
        ...peer,
        lookup: buildLookup(peer.data),
        interval: peer.interval,
      })),
    [secondaryCharts]
  );

  const activeLookupRef = useRef(activeLookup);
  const targetsRef = useRef(targets);
  const activeIntervalRef = useRef(activeInterval);
  const zoomFrameRef = useRef<number | null>(null);
  const crosshairFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<DataZoomSyncPayload | null>(null);
  const pendingCrosshairTimeRef = useRef<string | null>(null);
  const onActiveViewportChangeRef = useRef(onActiveViewportChange);

  useEffect(() => { activeLookupRef.current = activeLookup; }, [activeLookup]);
  useEffect(() => { targetsRef.current = targets; }, [targets]);
  useEffect(() => { activeIntervalRef.current = activeInterval; }, [activeInterval]);
  useEffect(() => { onActiveViewportChangeRef.current = onActiveViewportChange; }, [onActiveViewportChange]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      cancelFrame(zoomFrameRef);
      cancelFrame(crosshairFrameRef);
    },
    []
  );

  // ── TIME / ZOOM SYNC ────────────────────────────────────────────────────
  // The logical viewport engine is the source of truth. ECharts is only the renderer:
  // listening to its `datazoom` side effect misses custom controls that project with setOption().
  useEffect(() => {
    if (!layout.isEnabled) return;

    let cancelled = false;
    let attachFrameId: number | null = null;
    let detachViewportBus: (() => void) | null = null;

    const createSyncPayload = (snapshot: TimeViewportSyncSnapshot): DataZoomSyncPayload => {
      const lastIndex = Math.max(0, snapshot.totalDataPoints - 1);
      const start = lastIndex > 0 ? (snapshot.startDataIndex / lastIndex) * 100 : 0;
      const end = lastIndex > 0 ? (snapshot.endDataIndex / lastIndex) * 100 : 100;
      return {
        originChartId: layout.activeChartId,
        start,
        end,
        startValue: snapshot.startTime,
        endValue: snapshot.endTime,
        totalDataPoints: snapshot.totalDataPoints,
        startValueIndex: snapshot.startDataIndex,
        endValueIndex: snapshot.endDataIndex,
        centerTime: snapshot.centerTime,
      };
    };

    const scheduleTimeRange = (snapshot: TimeViewportSyncSnapshot) => {
      pendingZoomRef.current = createSyncPayload(snapshot);

      if (zoomFrameRef.current !== null) return;
      zoomFrameRef.current = window.requestAnimationFrame(() => {
        zoomFrameRef.current = null;
        const pending = pendingZoomRef.current;
        pendingZoomRef.current = null;
        if (!pending) return;

        const startTime = typeof pending.startValue === "string" ? pending.startValue : null;
        const endTime = typeof pending.endValue === "string" ? pending.endValue : null;
        const interval = activeIntervalRef.current;
        onActiveViewportChangeRef.current?.({ startTime, endTime });

        if (!shouldSynchronizeTimeViewport(layout.sync) || targetsRef.current.length === 0) return;
        targetsRef.current.forEach((target) =>
          dispatchTimeRange(target, pending, startTime, endTime, interval)
        );
      });
    };

    const attachViewportBus = () => {
      if (cancelled) return;
      const chart = activeChartInstanceRef.current;
      if (!chart || chart.isDisposed()) {
        attachFrameId = window.requestAnimationFrame(attachViewportBus);
        return;
      }

      detachViewportBus = subscribeTimeViewportSync(chart, scheduleTimeRange);

      // Align immediately when Time is enabled, but never replay a snapshot that
      // belongs to the previous symbol/timeframe rendered by the same ECharts instance.
      const latest = getLatestTimeViewportSyncSnapshot(chart);
      if (latest && isTimeViewportSnapshotForData(latest, activeLookupRef.current.data)) {
        scheduleTimeRange(latest);
      }
    };

    attachViewportBus();

    return () => {
      cancelled = true;
      if (attachFrameId !== null) window.cancelAnimationFrame(attachFrameId);
      detachViewportBus?.();
      cancelFrame(zoomFrameRef);
    };
  }, [
    activeChartInstanceRef,
    layout.activeChartId,
    layout.isEnabled,
    layout.sync.time,
  ]);

  // ── CROSSHAIR SYNC ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!layout.isEnabled || !layout.sync.crosshair) return;

    let cancelled = false;
    let attachFrameId: number | null = null;
    let detachCrosshair: (() => void) | null = null;

    /**
     * ECharts fires `updateAxisPointer` on every mouse-move over the chart grid.
     * params.axesInfo: Array<{ axisDim: string; axisIndex: number; value: AxisValue }>
     * For a category x-axis, `value` is the category string (the time/date key).
     */
    const onAxisPointerUpdate = (params: unknown) => {
      if (targetsRef.current.length === 0) return;
      if (!isRecord(params)) return;

      const axesInfo = params.axesInfo as
        | Array<{ axisDim?: string; axisIndex?: number; value?: unknown }>
        | undefined;
      if (!Array.isArray(axesInfo)) return;

      // Find the x-axis pointer value (time string or index)
      const xInfo = axesInfo.find((info) => info.axisDim === "x" || info.axisIndex === 0);
      let time: string | null = null;
      if (typeof xInfo?.value === "string") {
        time = xInfo.value;
      } else if (typeof xInfo?.value === "number") {
        const point = activeLookupRef.current.data[xInfo?.value];
        if (point) time = point.time;
      }
      if (!time) return;

      pendingCrosshairTimeRef.current = time;

      if (crosshairFrameRef.current !== null) return;
      crosshairFrameRef.current = window.requestAnimationFrame(() => {
        crosshairFrameRef.current = null;
        const t = pendingCrosshairTimeRef.current;
        pendingCrosshairTimeRef.current = null;
        if (!t) return;
        targetsRef.current.forEach((target) => dispatchCrosshair(target, t));
      });
    };

    const onGlobalOut = () => {
      cancelFrame(crosshairFrameRef);
      pendingCrosshairTimeRef.current = null;
      targetsRef.current.forEach((target) => hideCrosshair(target));
    };

    const attachListeners = () => {
      if (cancelled) return;
      const chart = activeChartInstanceRef.current;
      if (!chart || chart.isDisposed()) {
        attachFrameId = window.requestAnimationFrame(attachListeners);
        return;
      }

      chart.on("updateAxisPointer", onAxisPointerUpdate);
      chart.on("globalout", onGlobalOut);

      detachCrosshair = () => {
        if (chart.isDisposed()) return;
        chart.off("updateAxisPointer", onAxisPointerUpdate);
        chart.off("globalout", onGlobalOut);
      };
    };

    attachListeners();

    return () => {
      cancelled = true;
      if (attachFrameId !== null) window.cancelAnimationFrame(attachFrameId);
      detachCrosshair?.();
      cancelFrame(crosshairFrameRef);
      // Hide all crosshairs when disabling
      targetsRef.current.forEach((target) => hideCrosshair(target));
    };
  }, [
    activeChartInstanceRef,
    layout.activeChartId,
    layout.isEnabled,
    layout.sync.crosshair,
  ]);
};

export { MULTI_CHART_MINI_DATA_ZOOM_ID };
export type { MultiChartSyncPeer };
