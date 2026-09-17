"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export interface BenchmarkMetrics {
  fps: number;
  frameP50Ms: number;
  frameP95Ms: number;
  frameP99Ms: number;
  inputP95Ms: number;
  longTaskCount: number;
  longTaskTotalMs: number;
  heapUsedMb: number | null;
}

const EMPTY_METRICS: BenchmarkMetrics = {
  fps: 0,
  frameP50Ms: 0,
  frameP95Ms: 0,
  frameP99Ms: 0,
  inputP95Ms: 0,
  longTaskCount: 0,
  longTaskTotalMs: 0,
  heapUsedMb: null,
};

const percentile = (values: readonly number[], quantile: number): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index] ?? 0;
};

const round = (value: number): number => Math.round(value * 100) / 100;

type PerformanceWithMemory = Performance & {
  memory?: { usedJSHeapSize?: number };
};

export const useBenchmarkTelemetry = (scenarioKey: string) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const frameSamplesRef = useRef<number[]>([]);
  const inputSamplesRef = useRef<number[]>([]);
  const longTaskRef = useRef({ count: 0, totalMs: 0 });
  const [metrics, setMetrics] = useState<BenchmarkMetrics>(EMPTY_METRICS);
  const [visibilityState, setVisibilityState] = useState<DocumentVisibilityState>("hidden");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resetSamples = () => {
      frameSamplesRef.current = [];
      inputSamplesRef.current = [];
      longTaskRef.current = { count: 0, totalMs: 0 };
      setMetrics(EMPTY_METRICS);
    };

    resetSamples();
    setVisibilityState(document.visibilityState);

    let rafId = 0;
    let lastFrame = performance.now();
    const onVisibilityChange = () => {
      setVisibilityState(document.visibilityState);
      lastFrame = performance.now();
      resetSamples();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onFrame = (now: number) => {
      const delta = now - lastFrame;
      lastFrame = now;
      if (document.visibilityState === "visible" && Number.isFinite(delta) && delta > 0) {
        const samples = frameSamplesRef.current;
        samples.push(delta);
        if (samples.length > 3600) samples.splice(0, samples.length - 3600);
      }
      rafId = requestAnimationFrame(onFrame);
    };
    rafId = requestAnimationFrame(onFrame);

    const sampleInputToNextFrame = () => {
      const startedAt = performance.now();
      requestAnimationFrame(() => {
        const samples = inputSamplesRef.current;
        samples.push(performance.now() - startedAt);
        if (samples.length > 512) samples.splice(0, samples.length - 512);
      });
    };
    root.addEventListener("wheel", sampleInputToNextFrame, { passive: true });
    root.addEventListener("pointerdown", sampleInputToNextFrame, { passive: true });
    root.addEventListener("pointermove", sampleInputToNextFrame, { passive: true });

    let observer: PerformanceObserver | null = null;
    if (typeof PerformanceObserver !== "undefined") {
      try {
        observer = new PerformanceObserver((list) => {
          if (document.visibilityState !== "visible") return;
          for (const entry of list.getEntries()) {
            longTaskRef.current.count += 1;
            longTaskRef.current.totalMs += entry.duration;
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch {
        observer = null;
      }
    }

    const interval = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        setMetrics(EMPTY_METRICS);
        return;
      }
      const frames = frameSamplesRef.current;
      const inputs = inputSamplesRef.current;
      const meanFrameMs = frames.length > 0
        ? frames.reduce((sum, value) => sum + value, 0) / frames.length
        : 0;
      const memory = (performance as PerformanceWithMemory).memory?.usedJSHeapSize;
      setMetrics({
        fps: round(meanFrameMs > 0 ? 1000 / meanFrameMs : 0),
        frameP50Ms: round(percentile(frames, 0.5)),
        frameP95Ms: round(percentile(frames, 0.95)),
        frameP99Ms: round(percentile(frames, 0.99)),
        inputP95Ms: round(percentile(inputs, 0.95)),
        longTaskCount: longTaskRef.current.count,
        longTaskTotalMs: round(longTaskRef.current.totalMs),
        heapUsedMb: Number.isFinite(memory)
          ? round((memory as number) / (1024 * 1024))
          : null,
      });
    }, 1000);

    return () => {
      cancelAnimationFrame(rafId);
      window.clearInterval(interval);
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      root.removeEventListener("wheel", sampleInputToNextFrame);
      root.removeEventListener("pointerdown", sampleInputToNextFrame);
      root.removeEventListener("pointermove", sampleInputToNextFrame);
    };
  }, [scenarioKey]);

  return useMemo(
    () => ({ rootRef, metrics, visibilityState, performanceSampleValid: visibilityState === "visible" }),
    [metrics, visibilityState],
  );
};
