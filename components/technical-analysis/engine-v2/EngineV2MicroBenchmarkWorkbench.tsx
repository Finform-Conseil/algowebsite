"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type {
  FinancialChartInteractionController,
  FinancialChartVisibleRange,
} from "./domain/FinancialChartEngine";
import {
  BENCHMARK_CHART_COUNTS,
  BENCHMARK_ENGINE_IDS,
  BENCHMARK_LOAD_SIZES,
  benchmarkScenarioSearchParams,
  type BenchmarkChartCount,
  type BenchmarkEngine,
  type BenchmarkLoadSize,
  type BenchmarkScenario,
} from "./benchmark/benchmarkScenario";
import { useBenchmarkTelemetry } from "./benchmark/useBenchmarkTelemetry";
import { LegacyEChartsChartAdapter } from "./react/LegacyEChartsChartAdapter";
import { VelaChartAdapter } from "./react/VelaChartAdapter";

const ENGINE_LABELS: Readonly<Record<BenchmarkEngine, string>> = {
  "legacy-echarts": "ECharts actuel",
  "vela-canvas2d": "Vela Canvas2D",
  "vela-webgl2": "Vela WebGL2",
};

const createDeterministicBars = (count: BenchmarkLoadSize): ChartDataPoint[] => {
  const start = Date.UTC(2020, 0, 1);
  const dayMs = 86_400_000;
  const bars = new Array<ChartDataPoint>(count);
  let previousClose = 10_000;

  for (let index = 0; index < count; index += 1) {
    const cycle = Math.sin(index / 19) * 34 + Math.cos(index / 47) * 18;
    const drift = index * 0.025;
    const open = previousClose;
    const close = 10_000 + drift + cycle;
    const spread = 12 + Math.abs(Math.sin(index / 7) * 9);
    bars[index] = {
      time: new Date(start + index * dayMs).toISOString(),
      open,
      high: Math.max(open, close) + spread,
      low: Math.min(open, close) - spread,
      close,
      volume: 50_000 + (index % 97) * 1_250,
    };
    previousClose = close;
  }

  return bars;
};

const formatMetric = (value: number, suffix = "") => `${value.toFixed(2)}${suffix}`;

export interface EngineV2MicroBenchmarkWorkbenchProps {
  initialScenario: BenchmarkScenario;
}

export const EngineV2MicroBenchmarkWorkbench = ({ initialScenario }: EngineV2MicroBenchmarkWorkbenchProps) => {
  const [engine, setEngine] = useState<BenchmarkEngine>(initialScenario.engine);
  const [chartCount, setChartCount] = useState<BenchmarkChartCount>(initialScenario.chartCount);
  const [loadSize, setLoadSize] = useState<BenchmarkLoadSize>(initialScenario.loadSize);
  const [readyByCell, setReadyByCell] = useState<Record<number, number>>({});
  const [primaryController, setPrimaryController] = useState<FinancialChartInteractionController | null>(null);
  const [primaryViewport, setPrimaryViewport] = useState<FinancialChartVisibleRange | null>(null);
  const [currentPriceLineVisible, setCurrentPriceLineVisible] = useState(true);

  const scenarioKey = `${engine}:${chartCount}:${loadSize}`;
  const { rootRef, metrics, visibilityState, performanceSampleValid } = useBenchmarkTelemetry(scenarioKey);
  const bars = useMemo(() => createDeterministicBars(loadSize), [loadSize]);
  const cells = useMemo(() => Array.from({ length: chartCount }, (_, index) => index), [chartCount]);

  useEffect(() => {
    setReadyByCell({});
    setPrimaryController(null);
    setPrimaryViewport(null);
    setCurrentPriceLineVisible(true);
  }, [scenarioKey]);

  useEffect(() => {
    const canonical = benchmarkScenarioSearchParams({ engine, chartCount, loadSize });
    const current = new URLSearchParams(window.location.search);
    for (const key of ["engine", "charts", "bars"]) current.delete(key);
    canonical.forEach((value, key) => current.set(key, value));
    const search = current.toString();
    window.history.replaceState(window.history.state, "", `${window.location.pathname}${search ? `?${search}` : ""}`);
  }, [chartCount, engine, loadSize]);

  const reportReady = useCallback((cell: number, readyMs: number) => {
    setReadyByCell((current) => current[cell] === undefined ? { ...current, [cell]: readyMs } : current);
  }, []);

  const reportInteractionReady = useCallback((cell: number, controller: FinancialChartInteractionController | null) => {
    if (cell !== 0) return;
    setPrimaryController(controller);
    setPrimaryViewport(controller?.getVisibleRange() ?? null);
  }, []);

  const reportViewport = useCallback((cell: number, range: FinancialChartVisibleRange) => {
    if (cell === 0) setPrimaryViewport(range);
  }, []);

  const toggleCurrentPriceLine = useCallback(() => {
    if (!primaryController) return;
    setCurrentPriceLineVisible((visible) => {
      const next = !visible;
      primaryController.setCurrentPriceLineVisible(next);
      return next;
    });
  }, [primaryController]);

  const readyValues = Object.values(readyByCell);
  const allReady = readyValues.length === chartCount;
  const renderReadyMs = readyValues.length > 0 ? Math.max(...readyValues) : 0;

  useEffect(() => {
    (window as typeof window & { __AFRIMARKET_ENGINE_V2_BENCHMARK__?: unknown }).__AFRIMARKET_ENGINE_V2_BENCHMARK__ = {
      engine,
      chartCount,
      requestedBars: loadSize,
      renderedBarsPerChart: bars.length,
      sourceBars: bars.length,
      derivedLoad: false,
      isolatedMicroBenchmark: true,
      ready: allReady,
      renderReadyMs,
      performanceSampleValid,
      visibilityState,
      metrics,
      interactions: primaryController ? {
        capabilities: primaryController.capabilities,
        viewport: primaryViewport,
        currentPriceLineVisible,
      } : null,
      updatedAt: Date.now(),
    };
  }, [allReady, bars.length, chartCount, currentPriceLineVisible, engine, loadSize, metrics, performanceSampleValid, primaryController, primaryViewport, renderReadyMs, visibilityState]);

  const controlButton = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? "#38bdf8" : "#334155"}`,
    background: active ? "#0c4a6e" : "#111827",
    color: active ? "#e0f2fe" : "#cbd5e1",
    borderRadius: 8,
    padding: "8px 10px",
    cursor: "pointer",
    fontWeight: 700,
  });

  return (
    <div
      ref={rootRef}
      data-engine-v2-benchmark="true"
      data-engine-v2-micro-benchmark="true"
      data-benchmark-engine={engine}
      data-benchmark-chart-count={chartCount}
      data-benchmark-bars={loadSize}
      data-benchmark-ready={allReady ? "true" : "false"}
      style={{ minHeight: "100vh", display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", background: "#07111f", color: "#e2e8f0", fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <section style={{ padding: 16, borderBottom: "1px solid #1e293b", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>AfriMarket · Engine V2 Micro Benchmark</h1>
          <span style={{ color: "#94a3b8" }}>BENCH · deterministic OHLCV · 1D</span>
          <span style={{ color: allReady ? "#86efac" : "#facc15" }}>{allReady ? "READY" : "RENDERING"}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BENCHMARK_ENGINE_IDS.map((id) => <button key={id} type="button" style={controlButton(engine === id)} onClick={() => setEngine(id)}>{ENGINE_LABELS[id]}</button>)}
          <span style={{ width: 1, background: "#334155", margin: "0 4px" }} />
          {BENCHMARK_CHART_COUNTS.map((count) => <button key={count} type="button" style={controlButton(chartCount === count)} onClick={() => setChartCount(count)}>{count} chart{count > 1 ? "s" : ""}</button>)}
          <span style={{ width: 1, background: "#334155", margin: "0 4px" }} />
          {BENCHMARK_LOAD_SIZES.map((count) => <button key={count} type="button" style={controlButton(loadSize === count)} onClick={() => setLoadSize(count)}>{count / 1000}k bars</button>)}
        </div>
        {engine !== "legacy-echarts" && (
          <div data-engine-v2-interaction-controls="true" style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <strong style={{ fontSize: 12, color: primaryController ? "#86efac" : "#facc15" }}>
              Core interactions: {primaryController ? "READY" : "BINDING"}
            </strong>
            <button type="button" disabled={!primaryController} style={controlButton(false)} onClick={() => primaryController?.panBy(-0.2)}>Pan ←</button>
            <button type="button" disabled={!primaryController} style={controlButton(false)} onClick={() => primaryController?.panBy(0.2)}>Pan →</button>
            <button type="button" disabled={!primaryController} style={controlButton(false)} onClick={() => primaryController?.fitAll()}>Fit all</button>
            <button type="button" disabled={!primaryController} style={controlButton(currentPriceLineVisible)} onClick={toggleCurrentPriceLine}>
              Current price line {currentPriceLineVisible ? "ON" : "OFF"}
            </button>
            <span data-engine-v2-viewport="true" style={{ fontSize: 12, color: "#94a3b8" }}>
              viewport={primaryViewport ? `${Math.round(primaryViewport.from)}→${Math.round(primaryViewport.to)}` : "n/a"}
            </span>
          </div>
        )}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#cbd5e1" }}>
          <strong>render={bars.length}/chart</strong><strong>fixture déterministe locale</strong>
          <span>ready={formatMetric(renderReadyMs, " ms")}</span>
          <span>perf={performanceSampleValid ? "VALID" : `INVALID (${visibilityState})`}</span>
          <span>FPS={formatMetric(metrics.fps)}</span>
          <span>frame p50={formatMetric(metrics.frameP50Ms, " ms")}</span>
          <span>p95={formatMetric(metrics.frameP95Ms, " ms")}</span>
          <span>p99={formatMetric(metrics.frameP99Ms, " ms")}</span>
          <span>input p95={formatMetric(metrics.inputP95Ms, " ms")}</span>
          <span>long tasks={metrics.longTaskCount} / {formatMetric(metrics.longTaskTotalMs, " ms")}</span>
          <span>heap={metrics.heapUsedMb === null ? "n/a" : formatMetric(metrics.heapUsedMb, " MB")}</span>
        </div>
      </section>
      <section style={{ minHeight: 0, padding: 10, display: "grid", gap: 8, gridTemplateColumns: chartCount === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))", gridTemplateRows: chartCount <= 2 ? "1fr" : "repeat(2, minmax(0, 1fr))" }}>
        {cells.map((cell) => (
          <article key={`${scenarioKey}:${cell}`} style={{ minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden", border: "1px solid #1e293b", borderRadius: 10, background: "#0b1726" }}>
            <div style={{ position: "absolute", inset: 0 }}>
              {engine === "legacy-echarts" ? (
                <LegacyEChartsChartAdapter bars={bars} symbol="BENCH" marketLabel="MICRO" onReady={(readyMs) => reportReady(cell, readyMs)} />
              ) : (
                <VelaChartAdapter
                  bars={bars}
                  symbol="BENCH"
                  timeframe="1D"
                  backend={engine === "vela-webgl2" ? "webgl2" : "canvas2d"}
                  onReady={(readyMs) => reportReady(cell, readyMs)}
                  onInteractionReady={(controller) => reportInteractionReady(cell, controller)}
                  onViewportChange={(range) => reportViewport(cell, range)}
                />
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
