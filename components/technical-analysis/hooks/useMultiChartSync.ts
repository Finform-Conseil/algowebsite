import { useEffect, useMemo, useRef } from "react";
import type { MutableRefObject } from "react";
import type { MultiChartLayoutState } from "../config/TechnicalAnalysisTypes";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../lib/types/echarts";
import {
  MULTI_CHART_MINI_DATA_ZOOM_ID,
  buildLookup,
  dispatchTimeRange,
  resolvePoint,
  resolveZoomRange,
  type DataZoomSyncPayload,
  type MultiChartSyncPeer,
  type SyncTarget,
} from "./useMultiChartSync.helpers";

type SyncReason = "time";

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

export const useMultiChartSync = ({
  layout,
  activeChartInstanceRef,
  activeChartData,
  secondaryCharts,
}: UseMultiChartSyncProps) => {
  const activeLookup = useMemo(() => buildLookup(activeChartData), [activeChartData]);
  const targets = useMemo<SyncTarget[]>(
    () => secondaryCharts.map((peer) => ({ ...peer, lookup: buildLookup(peer.data) })),
    [secondaryCharts]
  );

  const activeLookupRef = useRef(activeLookup);
  const targetsRef = useRef(targets);
  const syncLockRef = useRef<SyncLock | null>(null);
  const zoomFrameRef = useRef<number | null>(null);
  const pendingZoomRef = useRef<DataZoomSyncPayload | null>(null);

  useEffect(() => {
    activeLookupRef.current = activeLookup;
  }, [activeLookup]);

  useEffect(() => {
    targetsRef.current = targets;
  }, [targets]);

  useEffect(() => () => {
    cancelFrame(zoomFrameRef);
    const lock = syncLockRef.current;
    if (lock && lock.releaseFrameId !== null) {
      window.cancelAnimationFrame(lock.releaseFrameId);
    }
    syncLockRef.current = null;
  }, []);

  useEffect(() => {
    const shouldAttach = layout.isEnabled && (layout.sync.time || layout.sync.dateRange);
    if (!shouldAttach) return;

    let cancelled = false;
    let attachFrameId: number | null = null;
    let detachListeners: (() => void) | null = null;

    const releaseLockNextFrame = (originChartId: string, reason: SyncReason) => {
      const existingLock = syncLockRef.current;
      if (existingLock && existingLock.releaseFrameId !== null) {
        window.cancelAnimationFrame(existingLock.releaseFrameId);
      }

      syncLockRef.current = { originChartId, reason, releaseFrameId: null };
      const releaseFrameId = window.requestAnimationFrame(() => {
        const currentLock = syncLockRef.current;
        if (currentLock?.originChartId === originChartId && currentLock.reason === reason) {
          syncLockRef.current = null;
        }
      });
      syncLockRef.current.releaseFrameId = releaseFrameId;
    };

    const applyWithOriginLock = (originChartId: string, reason: SyncReason, applySync: () => void) => {
      if (syncLockRef.current && syncLockRef.current.originChartId !== originChartId) return;
      releaseLockNextFrame(originChartId, reason);
      applySync();
    };

    const scheduleTimeRange = (payload: unknown) => {
      if (!(layout.sync.time || layout.sync.dateRange) || syncLockRef.current || targetsRef.current.length === 0) return;

      const range = resolveZoomRange(payload);
      if (!range) return;

      pendingZoomRef.current = { ...range, originChartId: layout.activeChartId };

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

        applyWithOriginLock(pending.originChartId, "time", () => {
          targetsRef.current.forEach((target) => dispatchTimeRange(target, pending, startTime, endTime));
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

      if (layout.sync.time || layout.sync.dateRange) chart.on("datazoom", scheduleTimeRange);

      // [TENOR 2026 HDR] RETROACTIVE TIME & DATE RANGE SYNC
      // Immediately aligns secondary charts' zoom viewport to the active chart's viewport when attached.
      if (layout.sync.time || layout.sync.dateRange) {
        try {
          const option = chart.getOption();
          const dz = option?.dataZoom as any[];
          const mainDz = dz?.find(d => d.type === "inside" || d.type === "slider") || dz?.[0];
          if (mainDz) {
            const start = typeof mainDz.start === "number" ? mainDz.start : null;
            const end = typeof mainDz.end === "number" ? mainDz.end : null;
            const startValue = mainDz.startValue !== undefined ? mainDz.startValue : null;
            const endValue = mainDz.endValue !== undefined ? mainDz.endValue : null;

            const active = activeLookupRef.current;
            const startPoint = resolvePoint(active, startValue, null);
            const endPoint = resolvePoint(active, endValue, null);
            const startTime = startPoint?.point.time ?? null;
            const endTime = endPoint?.point.time ?? null;

            targetsRef.current.forEach((target) => {
              dispatchTimeRange(
                target,
                { originChartId: layout.activeChartId, start, end, startValue, endValue },
                startTime,
                endTime
              );
            });
          }
        } catch (e) {
          console.warn("[MultiChartSync] Failed to retroactively align zoom viewport", e);
        }
      }

      detachListeners = () => {
        if (chart.isDisposed()) return;
        if (layout.sync.time || layout.sync.dateRange) chart.off("datazoom", scheduleTimeRange);
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
};

export { MULTI_CHART_MINI_DATA_ZOOM_ID };
export type { MultiChartSyncPeer };
