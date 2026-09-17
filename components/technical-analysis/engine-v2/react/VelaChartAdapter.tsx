"use client";

import { useEffect, useRef } from "react";

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
  onInteractionReady?: (controller: FinancialChartInteractionController | null) => void;
  onViewportChange?: FinancialChartViewportListener;
}

export const VelaChartAdapter = ({
  bars,
  symbol,
  timeframe,
  backend,
  onReady,
  onInteractionReady,
  onViewportChange,
}: VelaChartAdapterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const onInteractionReadyRef = useRef(onInteractionReady);
  const onViewportChangeRef = useRef(onViewportChange);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    onInteractionReadyRef.current = onInteractionReady;
  }, [onInteractionReady]);

  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || bars.length === 0) return;

    const engine = new VelaChartEngine();
    const mountedAt = performance.now();
    let active = true;
    const unsubscribeViewport = engine.onViewportChange((range) => onViewportChangeRef.current?.(range));

    void engine.mount(container, bars, { symbol, timeframe, backend }).then(() => {
      if (!active) return;
      onInteractionReadyRef.current?.(engine);
      onReadyRef.current?.(performance.now() - mountedAt);
    });

    const observer = new ResizeObserver(() => engine.resize());
    observer.observe(container);

    return () => {
      active = false;
      observer.disconnect();
      unsubscribeViewport();
      onInteractionReadyRef.current?.(null);
      engine.destroy();
    };
  }, [backend, bars, symbol, timeframe]);

  return (
    <div
      ref={containerRef}
      data-engine-adapter="vela"
      data-vela-backend={backend}
      style={{ width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }}
    />
  );
};
