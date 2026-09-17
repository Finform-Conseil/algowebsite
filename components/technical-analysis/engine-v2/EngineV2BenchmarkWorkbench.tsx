"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

import { useChartStateContext } from "../context/TechnicalAnalysisProviders";
import { selectChartConfig } from "../store/selectors";
import { createBenchmarkDataset } from "./benchmark/benchmarkData";
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

const ENGINE_OPTIONS: ReadonlyArray<{ id: BenchmarkEngine; label: string }> = BENCHMARK_ENGINE_IDS.map((id) => ({
  id,
  label: ENGINE_LABELS[id],
}));
const CHART_COUNTS = BENCHMARK_CHART_COUNTS;
const LOAD_SIZES = BENCHMARK_LOAD_SIZES;

const formatMetric = (value: number, suffix = "") => `${value.toFixed(2)}${suffix}`;

export interface EngineV2BenchmarkWorkbenchProps {
  initialScenario: BenchmarkScenario;
}

export const EngineV2BenchmarkWorkbench = ({ initialScenario }: EngineV2BenchmarkWorkbenchProps) => {
  const chartState = useChartStateContext();
  const chartConfig = useSelector(selectChartConfig);
  const [engine, setEngine] = useState<BenchmarkEngine>(initialScenario.engine);
  const [chartCount, setChartCount] = useState<BenchmarkChartCount>(initialScenario.chartCount);
  const [loadSize, setLoadSize] = useState<BenchmarkLoadSize>(initialScenario.loadSize);
  const [readyByCell, setReadyByCell] = useState<Record<number, number>>({});

  const scenarioKey = `${engine}:${chartCount}:${loadSize}:${chartState.displayChartData.length}`;
  const { rootRef, metrics, visibilityState, performanceSampleValid } = useBenchmarkTelemetry(scenarioKey);
  const bars = useMemo(
    () => createBenchmarkDataset(chartState.displayChartData, loadSize),
    [chartState.displayChartData, loadSize],
  );
  const cells = useMemo(() => Array.from({ length: chartCount }, (_, index) => index), [chartCount]);
  const symbol = chartState.displaySymbolName || chartState.security.ticker || chartConfig.symbol || "N/A";
  const marketLabel = chartState.security.exchange || "AfriMarket";
  const timeframe = chartConfig.timeframe || "1D";

  useEffect(() => {
    setReadyByCell({});
  }, [scenarioKey]);

  useEffect(() => {
    const canonical = benchmarkScenarioSearchParams({ engine, chartCount, loadSize });
    const current = new URLSearchParams(window.location.search);
    for (const key of ["engine", "charts", "bars"]) current.delete(key);
    canonical.forEach((value, key) => current.set(key, value));
    const nextSearch = current.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [chartCount, engine, loadSize]);

  const reportReady = useCallback((cell: number, readyMs: number) => {
    setReadyByCell((current) => current[cell] === undefined
      ? { ...current, [cell]: readyMs }
      : current);
  }, []);

  const readyValues = Object.values(readyByCell);
  const allReady = bars.length > 0 && readyValues.length === chartCount;
  const renderReadyMs = readyValues.length > 0 ? Math.max(...readyValues) : 0;
  const derivedLoad = bars.length > chartState.displayChartData.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    (window as typeof window & { __AFRIMARKET_ENGINE_V2_BENCHMARK__?: unknown }).__AFRIMARKET_ENGINE_V2_BENCHMARK__ = {
      engine,
      chartCount,
      requestedBars: loadSize,
      renderedBarsPerChart: bars.length,
      sourceBars: chartState.displayChartData.length,
      derivedLoad,
      ready: allReady,
      renderReadyMs,
      performanceSampleValid,
      visibilityState,
      metrics,
      updatedAt: Date.now(),
    };
  }, [allReady, bars.length, chartCount, chartState.displayChartData.length, derivedLoad, engine, loadSize, metrics, performanceSampleValid, renderReadyMs, visibilityState]);

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
      data-benchmark-engine={engine}
      data-benchmark-chart-count={chartCount}
      data-benchmark-bars={loadSize}
      data-benchmark-ready={allReady ? "true" : "false"}
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        background: "#07111f",
        color: "#e2e8f0",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <section style={{ padding: 16, borderBottom: "1px solid #1e293b", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>AfriMarket · Engine V2 Benchmark Lab</h1>
          <span style={{ color: "#94a3b8" }}>{symbol} · {marketLabel} · {timeframe}</span>
          <span style={{ color: allReady ? "#86efac" : "#facc15" }}>
            {allReady ? "READY" : chartState.globalIsLoading ? "DATA LOADING" : "RENDERING"}
          </span>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {ENGINE_OPTIONS.map((option) => (
            <button key={option.id} type="button" style={controlButton(engine === option.id)} onClick={() => setEngine(option.id)}>
              {option.label}
            </button>
          ))}
          <span style={{ width: 1, background: "#334155", margin: "0 4px" }} />
          {CHART_COUNTS.map((count) => (
            <button key={count} type="button" style={controlButton(chartCount === count)} onClick={() => setChartCount(count)}>
              {count} chart{count > 1 ? "s" : ""}
            </button>
          ))}
          <span style={{ width: 1, background: "#334155", margin: "0 4px" }} />
          {LOAD_SIZES.map((count) => (
            <button key={count} type="button" style={controlButton(loadSize === count)} onClick={() => setLoadSize(count)}>
              {count >= 1000 ? `${count / 1000}k` : count} bars
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#cbd5e1" }}>
          <strong>source={chartState.displayChartData.length}</strong>
          <strong>render={bars.length}/chart</strong>
          <strong>{derivedLoad ? "load tier dérivé des OHLCV AfriMarket" : "historique réel direct"}</strong>
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

      <section
        style={{
          minHeight: 0,
          padding: 10,
          display: "grid",
          gap: 8,
          gridTemplateColumns: chartCount === 1 ? "1fr" : "repeat(2, minmax(0, 1fr))",
          gridTemplateRows: chartCount <= 2 ? "1fr" : "repeat(2, minmax(0, 1fr))",
        }}
      >
        {cells.map((cell) => (
          <article
            key={`${scenarioKey}:${cell}`}
            style={{ minWidth: 0, minHeight: 0, position: "relative", overflow: "hidden", border: "1px solid #1e293b", borderRadius: 10, background: "#0b1726" }}
          >
            <div style={{ position: "absolute", inset: 0 }}>
              {bars.length === 0 ? (
                <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#94a3b8" }}>Aucune donnée OHLCV disponible.</div>
              ) : engine === "legacy-echarts" ? (
                <LegacyEChartsChartAdapter
                  bars={bars}
                  symbol={symbol}
                  marketLabel={marketLabel}
                  onReady={(readyMs) => reportReady(cell, readyMs)}
                />
              ) : (
                <VelaChartAdapter
                  bars={bars}
                  symbol={symbol}
                  timeframe={timeframe}
                  backend={engine === "vela-webgl2" ? "webgl2" : "canvas2d"}
                  onReady={(readyMs) => reportReady(cell, readyMs)}
                />
              )}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};
