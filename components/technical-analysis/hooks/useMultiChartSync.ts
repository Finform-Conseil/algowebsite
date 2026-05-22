import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { MultiChartLayoutState } from "../config/TechnicalAnalysisTypes";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../lib/types/echarts";
import {
  MULTI_CHART_MINI_DATA_ZOOM_ID,
  buildLookup,
  dispatchCrosshair,
  dispatchTimeRange,
  hideCrosshair,
  resolvePoint,
  resolveZoomRange,
  type DataZoomSyncPayload,
  type MultiChartSyncPeer,
  type SyncTarget,
} from "./useMultiChartSync.helpers";

type SyncReason = "time" | "crosshair";

interface UseMultiChartSyncProps {
  layout: MultiChartLayoutState;
  activeChartInstanceRef: MutableRefObject<EChartsInstance | null>;
  activeChartData: ChartDataPoint[];
  secondaryCharts: MultiChartSyncPeer[];
}

interface SyncLock {
  originChartId: string;
  reason: SyncReason;
  releaseFrameId: number | null;
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
}: UseMultiChartSyncProps) => {
  // ── Derive active chart interval from layout state ──────────────────────
  const activeInterval = useMemo(() => {
    const activeCell = layout.charts.find((c) => c.chartId === layout.activeChartId);
    return activeCell?.interval ?? "1D";
  }, [layout.activeChartId, layout.charts]);

  // ── Check if this is a genuine multi-timeframe layout ──────────────────
  // Proportional zoom is used when at least two charts have different intervals.
  const isMultiTimeframe = useMemo(() => {
    const intervals = new Set(layout.charts.map((c) => c.interval).filter(Boolean));
    return intervals.size > 1;
  }, [layout.charts]);

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
  const isMultiTimeframeRef = useRef(isMultiTimeframe);
  const syncLockRef = useRef<SyncLock | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const crosshairFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<DataZoomSyncPayload | null>(null);
  const pendingCrosshairTimeRef = useRef<string | null>(null);

  useEffect(() => { activeLookupRef.current = activeLookup; }, [activeLookup]);
  useEffect(() => { targetsRef.current = targets; }, [targets]);
  useEffect(() => { activeIntervalRef.current = activeInterval; }, [activeInterval]);
  useEffect(() => { isMultiTimeframeRef.current = isMultiTimeframe; }, [isMultiTimeframe]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      cancelFrame(zoomFrameRef);
      cancelFrame(crosshairFrameRef);
      const lock = syncLockRef.current;
      if (lock && lock.releaseFrameId !== null) {
        window.cancelAnimationFrame(lock.releaseFrameId);
      }
      syncLockRef.current = null;
    },
    []
  );

  // ── TIME / ZOOM SYNC ────────────────────────────────────────────────────
  useEffect(() => {
    const shouldAttach = layout.isEnabled && (layout.sync.time || layout.sync.dateRange);
    if (!shouldAttach) return;

    let cancelled = false;
    let attachFrameId: number | null = null;
    let detachListeners: (() => void) | null = null;

    const releaseLockNextFrame = (originChartId: string, reason: SyncReason) => {
      const existing = syncLockRef.current;
      if (existing && existing.releaseFrameId !== null) {
        window.cancelAnimationFrame(existing.releaseFrameId);
      }
      syncLockRef.current = { originChartId, reason, releaseFrameId: null };
      const frameId = window.requestAnimationFrame(() => {
        const cur = syncLockRef.current;
        if (cur?.originChartId === originChartId && cur.reason === reason) {
          syncLockRef.current = null;
        }
      });
      syncLockRef.current!.releaseFrameId = frameId;
    };

    const applyWithOriginLock = (
      originChartId: string,
      reason: SyncReason,
      applySync: () => void
    ) => {
      if (syncLockRef.current && syncLockRef.current.originChartId !== originChartId) return;
      releaseLockNextFrame(originChartId, reason);
      applySync();
    };

    /**
     * Enriches the raw zoom payload with proportional multi-timeframe fields
     * (centerTime, startValueIndex, endValueIndex) by inspecting the active lookup.
     */
    const enrichPayload = (
      range: Omit<DataZoomSyncPayload, "originChartId">
    ): DataZoomSyncPayload => {
      const active = activeLookupRef.current;
      const payload: DataZoomSyncPayload = { ...range, originChartId: layout.activeChartId };

      if (payload.startValue === null && payload.start !== null && active.data.length > 0) {
        const idx = Math.round((payload.start / 100) * (active.data.length - 1));
        payload.startValue = active.data[idx]?.time ?? null;
      }
      if (payload.endValue === null && payload.end !== null && active.data.length > 0) {
        const idx = Math.round((payload.end / 100) * (active.data.length - 1));
        payload.endValue = active.data[idx]?.time ?? null;
      }

      if (!isMultiTimeframeRef.current) return payload;

      const startPoint = resolvePoint(active, payload.startValue, null);
      const endPoint = resolvePoint(active, payload.endValue, null);

      if (startPoint && endPoint) {
        const si = Math.min(startPoint.index, endPoint.index);
        const ei = Math.max(startPoint.index, endPoint.index);
        const centerIdx = Math.round((si + ei) / 2);
        const centerPoint = active.data[centerIdx];

        payload.startValueIndex = si;
        payload.endValueIndex = ei;
        payload.centerTime = centerPoint?.time ?? null;
        payload.totalDataPoints = active.data.length;
      }

      return payload;
    };

    const scheduleTimeRange = (rawPayload: unknown) => {
      if (!(layout.sync.time || layout.sync.dateRange)) return;
      if (syncLockRef.current || targetsRef.current.length === 0) return;

      const range = resolveZoomRange(rawPayload);
      if (!range) return;

      pendingZoomRef.current = enrichPayload(range);

      if (zoomFrameRef.current !== null) return;
      zoomFrameRef.current = window.requestAnimationFrame(() => {
        zoomFrameRef.current = null;
        const pending = pendingZoomRef.current;
        pendingZoomRef.current = null;
        if (!pending) return;

        const active = activeLookupRef.current;
        const startPoint = resolvePoint(active, pending.startValue, null);
        const endPoint = resolvePoint(active, pending.endValue, null);
        const startTime = startPoint?.point.time ?? null;
        const endTime = endPoint?.point.time ?? null;
        const interval = activeIntervalRef.current;

        applyWithOriginLock(pending.originChartId, "time", () => {
          targetsRef.current.forEach((target) =>
            dispatchTimeRange(target, pending, startTime, endTime, interval)
          );
        });
      });
    };

    const attachListeners = () => {
      if (cancelled) return;
      const chart = activeChartInstanceRef.current;
      if (!chart || chart.isDisposed()) {
        attachFrameId = window.requestAnimationFrame(attachListeners);
        return;
      }

      chart.on("datazoom", scheduleTimeRange);

      // [TENOR 2026 HDR] Retroactive alignment on attach
      try {
        const option = chart.getOption();
        const dz = option?.dataZoom as unknown[];
        const mainDz = (dz as Record<string, unknown>[])?.find(
          (d) => d.type === "inside" || d.type === "slider"
        ) ?? (dz as Record<string, unknown>[])?.[0];
        if (mainDz) {
          const start = typeof mainDz.start === "number" ? mainDz.start : null;
          const end = typeof mainDz.end === "number" ? mainDz.end : null;
          const startValue =
            mainDz.startValue !== undefined ? (mainDz.startValue as string | number) : null;
          const endValue =
            mainDz.endValue !== undefined ? (mainDz.endValue as string | number) : null;

          const rawPayload = { start, end, startValue, endValue };
          const enriched = enrichPayload(rawPayload);

          const active = activeLookupRef.current;
          const startPoint = resolvePoint(active, startValue, null);
          const endPoint = resolvePoint(active, endValue, null);
          const startTime = startPoint?.point.time ?? null;
          const endTime = endPoint?.point.time ?? null;
          const interval = activeIntervalRef.current;

          targetsRef.current.forEach((target) =>
            dispatchTimeRange(target, enriched, startTime, endTime, interval)
          );
        }
      } catch (e) {
        console.warn("[MultiChartSync] Failed to retroactively align zoom viewport", e);
      }

      detachListeners = () => {
        if (chart.isDisposed()) return;
        chart.off("datazoom", scheduleTimeRange);
      };
    };

    attachListeners();

    return () => {
      cancelled = true;
      if (attachFrameId !== null) window.cancelAnimationFrame(attachFrameId);
      detachListeners?.();
      cancelFrame(zoomFrameRef);
    };
  }, [
    activeChartInstanceRef,
    layout.activeChartId,
    layout.isEnabled,
    layout.sync.dateRange,
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
