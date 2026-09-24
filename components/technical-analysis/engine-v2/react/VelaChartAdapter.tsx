"use client";

import { useEffect, useRef, useState } from "react";

import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { VelaChartEngine } from "../adapters/VelaChartEngine";
import type {
  FinancialChartInteractionController,
  FinancialChartViewportListener,
  VelaNativeBackend,
} from "../domain/FinancialChartEngine";

interface VelaChartAdapterProps {
  bars: readonly ChartDataPoint[];
  symbol: string;
  timeframe: string;
  backend: VelaNativeBackend;
  onReady?: (readyMs: number) => void;
  onError?: (error: unknown) => void;
  onInteractionReady?: (controller: FinancialChartInteractionController | null) => void;
  onViewportChange?: FinancialChartViewportListener;
}

export const VelaChartAdapter = ({
  bars,
  symbol,
  timeframe,
  backend,
  onReady,
  onError,
  onInteractionReady,
  onViewportChange,
}: VelaChartAdapterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<VelaChartEngine | null>(null);
  const barsRef = useRef(bars);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const onInteractionReadyRef = useRef(onInteractionReady);
  const onViewportChangeRef = useRef(onViewportChange);
  const [status, setStatus] = useState<"idle" | "mounting" | "ready" | "error">("idle");

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    onInteractionReadyRef.current = onInteractionReady;
  }, [onInteractionReady]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    barsRef.current = bars;
    const engine = engineRef.current;
    if (!engine || bars.length === 0) return;

    void engine.setBars(bars).catch((error) => {
      setStatus("error");
      onErrorRef.current?.(error);
    });
  }, [bars]);

  const hasBars = bars.length > 0;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hasBars) {
      setStatus("idle");
      return;
    }

    const engine = new VelaChartEngine();
    engineRef.current = engine;
    setStatus("mounting");

    const mountedAt = performance.now();
    let active = true;
    const unsubscribeViewport = engine.onViewportChange((range) => onViewportChangeRef.current?.(range));
    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(container);

    void engine.mount(container, barsRef.current, { symbol, timeframe, backend })
      .then(() => {
        if (!active || engineRef.current !== engine) return;
        setStatus("ready");
        onInteractionReadyRef.current?.(engine);
        onReadyRef.current?.(performance.now() - mountedAt);
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        if (engineRef.current === engine) engineRef.current = null;
        engine.destroy();
        onErrorRef.current?.(error);
      });

    return () => {
      active = false;
      observer.disconnect();
      unsubscribeViewport();
      if (engineRef.current === engine) engineRef.current = null;
      onInteractionReadyRef.current?.(null);
      engine.destroy();
    };
  }, [backend, hasBars, symbol, timeframe]);

  return (
    <div
      ref={containerRef}
      data-engine-adapter="vela"
      data-vela-backend={backend}
      data-vela-status={status}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        zIndex: 1,
      }}
    />
  );
};
