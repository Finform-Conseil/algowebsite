"use client";

import React, { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { MultiChartLayoutCell, MultiChartLayoutState } from "../../config/TechnicalAnalysisTypes";
import { getLayoutDefinition } from "../../config/multiChartLayout";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";
import type { ComparisonLoadState, ComparisonLoadStatus } from "../../hooks/MarketData/useMarketData";
import {
  MULTI_CHART_MINI_DATA_ZOOM_ID,
  useMultiChartSync,
  type MultiChartSyncPeer,
} from "../../hooks/useMultiChartSync";

const MINI_CHART_POINTS = 120;
type MiniChartRenderMode = "sparkline" | "ohlcv";

interface MultiChartLayoutGridProps {
  layout: MultiChartLayoutState;
  marketData: Record<string, ChartDataPoint[]>;
  dataLoadState: ComparisonLoadState;
  dataMode: "mock" | "real";
  activeChartInstanceRef: React.MutableRefObject<EChartsInstance | null>;
  activeChartData: ChartDataPoint[];
  activeSymbol: string;
  activeInterval: string;
  children: ReactNode;
  onActivateChart: (chartId: string) => void;
}

const formatDate = (value: string): string => {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return value || "No date";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(timestamp);
};

const getSeriesStats = (data: ChartDataPoint[]) => {
  if (data.length === 0) return null;
  const first = data.find((point) => Number.isFinite(point.close) && point.close > 0);
  const last = [...data].reverse().find((point) => Number.isFinite(point.close) && point.close > 0);
  if (!first || !last) return null;
  const changePercent = first.close === 0 ? 0 : ((last.close - first.close) / first.close) * 100;
  const lastTimestamp = Date.parse(last.time);
  const staleDays = Number.isFinite(lastTimestamp) ? (Date.now() - lastTimestamp) / 86_400_000 : Infinity;

  return {
    first,
    last,
    changePercent,
    isStale: staleDays > 10,
  };
};

const getMiniChartSeries = (data: ChartDataPoint[]): ChartDataPoint[] =>
  data
    .slice(-MINI_CHART_POINTS)
    .filter(
      (point) =>
        Number.isFinite(point.open) &&
        Number.isFinite(point.high) &&
        Number.isFinite(point.low) &&
        Number.isFinite(point.close) &&
        point.close > 0
    );

const formatCompactNumber = (value: number): string =>
  value.toLocaleString("fr-FR", { maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2 });

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

const buildMiniSparklineOption = (data: ChartDataPoint[], color: string): EChartsCoreOption => {
  const series = getMiniChartSeries(data);
  return {
    animation: false,
    grid: { left: 4, right: 4, top: 8, bottom: 4 },
    tooltip: { trigger: "axis", showContent: false, axisPointer: { type: "line" } },
    axisPointer: {
      show: true,
      snap: true,
      triggerTooltip: false,
      lineStyle: { color: "rgba(148, 163, 184, 0.85)", width: 1 },
      label: { show: false },
    },
    xAxis: { id: "mini-time-x", type: "category", data: series.map((point) => point.time), show: false, boundaryGap: false },
    yAxis: { id: "mini-price-y", type: "value", show: false, scale: true },
    dataZoom: [
      {
        id: MULTI_CHART_MINI_DATA_ZOOM_ID,
        type: "inside",
        xAxisIndex: 0,
        filterMode: "filter",
        zoomOnMouseWheel: false,
        moveOnMouseMove: false,
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        id: "mini-close-series",
        type: "line",
        data: series.map((point) => point.close),
        showSymbol: false,
        silent: true,
        lineStyle: { color, width: 1.8 },
        areaStyle: { color: `${color}1f` },
      },
    ],
  };
};

const buildMiniOhlcvTooltip = (point: ChartDataPoint): string => {
  const range = point.high - point.low;
  const body = Math.abs(point.close - point.open);
  const isPositive = point.close >= point.open;
  const closeColor = isPositive ? "#22c55e" : "#ef4444";
  const row = (label: string, value: string, color = "#e5eefc") => `
    <span style="display:grid;grid-template-columns:18px minmax(0,1fr);gap:8px;align-items:center;height:18px;">
      <span style="color:#94a3b8;font-weight:800;">${label}</span>
      <span style="color:${color};font-weight:900;text-align:right;">${escapeHtml(value)}</span>
    </span>`;

  return `
    <div style="min-width:236px;padding:8px 10px;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:11px;line-height:1;font-variant-numeric:tabular-nums;">
      <div style="margin-bottom:6px;color:#bfdbfe;font-weight:800;">${escapeHtml(formatDate(point.time))}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <span style="display:grid;">
          ${row("O", formatCompactNumber(point.open))}
          ${row("H", formatCompactNumber(point.high))}
          ${row("L", formatCompactNumber(point.low))}
          ${row("C", formatCompactNumber(point.close), closeColor)}
          ${row("V", `${formatCompactNumber(point.volume / 1000)}k`)}
        </span>
        <span style="display:grid;">
          ${row("R", formatCompactNumber(range), "#fb923c")}
          ${row("B", formatCompactNumber(body), "#fb923c")}
          ${row("UW", formatCompactNumber(point.high - Math.max(point.open, point.close)), "#fb923c")}
          ${row("DW", formatCompactNumber(Math.min(point.open, point.close) - point.low), "#fb923c")}
        </span>
      </div>
    </div>`;
};

const resolveTooltipPoint = (series: ChartDataPoint[], params: unknown): ChartDataPoint | null => {
  const records = Array.isArray(params) ? params : [params];
  const record = records.find((entry): entry is { dataIndex?: unknown } => entry !== null && typeof entry === "object");
  const dataIndex = typeof record?.dataIndex === "number" ? record.dataIndex : null;
  return dataIndex !== null ? series[dataIndex] ?? null : null;
};

const buildMiniOhlcvOption = (data: ChartDataPoint[]): EChartsCoreOption => {
  const series = getMiniChartSeries(data);
  const dates = series.map((point) => point.time);
  const values = series.map((point) => [point.open, point.close, point.low, point.high]);
  const volumes = series.map((point, index) => [index, point.volume, point.close >= point.open ? 1 : -1]);
  const upColor = "#00e676";
  const downColor = "#ff1744";
  const axisColor = "#94a3b8";

  return {
    animation: false,
    grid: [
      { id: "mini-price-grid", left: 8, right: 42, top: 8, height: "62%", containLabel: false },
      { id: "mini-volume-grid", left: 8, right: 42, bottom: 18, height: "18%", containLabel: false },
    ],
    tooltip: {
      trigger: "axis",
      confine: true,
      renderMode: "html",
      backgroundColor: "rgb(8, 13, 32)",
      borderColor: "rgba(96, 165, 250, 0.45)",
      borderWidth: 1,
      padding: 0,
      textStyle: { color: "#e5eefc" },
      axisPointer: { type: "cross", snap: true, label: { show: false } },
      formatter: (params: unknown) => {
        const point = resolveTooltipPoint(series, params);
        return point ? buildMiniOhlcvTooltip(point) : "";
      },
    },
    axisPointer: {
      link: [{ xAxisIndex: [0, 1] }],
      triggerTooltip: true,
      lineStyle: { color: "rgba(148, 163, 184, 0.72)", width: 1, type: "dashed" },
      label: { show: false },
    },
    xAxis: [
      {
        id: "mini-time-x",
        type: "category",
        gridIndex: 0,
        data: dates,
        show: false,
        boundaryGap: true,
        min: "dataMin",
        max: "dataMax",
      },
      {
        id: "mini-volume-time-x",
        type: "category",
        gridIndex: 1,
        data: dates,
        boundaryGap: true,
        min: "dataMin",
        max: "dataMax",
        axisLine: { show: true, lineStyle: { color: "rgba(148, 163, 184, 0.38)" } },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: {
          color: axisColor,
          fontSize: 10,
          hideOverlap: true,
          formatter: (value: string) => {
            const timestamp = Date.parse(value);
            if (!Number.isFinite(timestamp)) return "";
            return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit" }).format(timestamp);
          },
        },
      },
    ],
    yAxis: [
      {
        id: "mini-price-y",
        type: "value",
        position: "right",
        scale: true,
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: true, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" } },
        axisLabel: { color: axisColor, fontSize: 10, formatter: (value: number) => formatCompactNumber(value) },
      },
      {
        id: "mini-volume-y",
        type: "value",
        gridIndex: 1,
        scale: true,
        show: false,
        max: (value: { max: number }) => Math.max(1, value.max * 1.18),
      },
    ],
    dataZoom: [
      {
        id: MULTI_CHART_MINI_DATA_ZOOM_ID,
        type: "inside",
        xAxisIndex: [0, 1],
        filterMode: "filter",
        zoomOnMouseWheel: false,
        moveOnMouseMove: false,
        start: 0,
        end: 100,
      },
    ],
    series: [
      {
        id: "mini-ohlcv-series",
        name: "OHLC",
        type: "candlestick",
        data: values,
        itemStyle: { color: upColor, color0: downColor, borderColor: upColor, borderColor0: downColor },
      },
      {
        id: "mini-volume-bar",
        name: "Volume",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        barWidth: "58%",
        barMinHeight: 2,
        itemStyle: { color: (params: { value: (number | string)[] }) => Number(params.value[2]) >= 0 ? upColor : downColor, opacity: 0.82 },
        showBackground: true,
        backgroundStyle: { color: "rgba(255, 255, 255, 0.025)" },
      },
    ],
  };
};

const buildMiniChartOption = (
  data: ChartDataPoint[],
  color: string,
  renderMode: MiniChartRenderMode
): EChartsCoreOption =>
  renderMode === "ohlcv" ? buildMiniOhlcvOption(data) : buildMiniSparklineOption(data, color);

const MiniChartCanvas: React.FC<{
  chartId: string;
  data: ChartDataPoint[];
  color: string;
  renderMode: MiniChartRenderMode;
  onChartReady: (chartId: string, chart: EChartsInstance) => void;
  onChartDispose: (chartId: string) => void;
}> = ({ chartId, data, color, renderMode, onChartReady, onChartDispose }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);

  useEffect(() => () => {
    const chart = chartInstanceRef.current;
    if (chart && !chart.isDisposed()) chart.dispose();
    chartInstanceRef.current = null;
    onChartDispose(chartId);
  }, [chartId, onChartDispose]);

  useEffect(() => {
    const series = getMiniChartSeries(data);
    if (series.length < 2) {
      const chart = chartInstanceRef.current;
      if (chart && !chart.isDisposed()) chart.dispose();
      chartInstanceRef.current = null;
      onChartDispose(chartId);
      return;
    }

    const element = chartRef.current;
    if (!element) return;

    let chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) {
      chart = echarts.init(element, undefined, { renderer: "canvas" });
      chartInstanceRef.current = chart;
      onChartReady(chartId, chart);
    }

    chartInstanceRef.current = chart;
    chart.setOption(buildMiniChartOption(data, color, renderMode), true, true);

    const chartInstance = chart;
    const frameId = window.requestAnimationFrame(() => chartInstance.resize());
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => chartInstance.resize()) : null;
    resizeObserver?.observe(element);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [chartId, data, color, renderMode, onChartDispose, onChartReady]);

  return <div ref={chartRef} className={clsx("gp-multi-chart-cell__echart", renderMode === "ohlcv" && "is-interactive")} />;
};

const noopChartReady = () => {};
const noopChartDispose = () => {};

const ActiveChartPreview: React.FC<{
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  dataMode: "mock" | "real";
  displaySymbol: string;
}> = ({ cell, data, dataMode, displaySymbol }) => {
  const stats = useMemo(() => getSeriesStats(data), [data]);
  const isPositive = (stats?.changePercent ?? 0) >= 0;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";

  if (stats) {
    return (
      <div className="gp-multi-chart-cell__active-preview">
        <MiniChartCanvas
          chartId={`${cell.chartId}-active-preview`}
          data={data}
          color={chartColor}
          renderMode="sparkline"
          onChartReady={noopChartReady}
          onChartDispose={noopChartDispose}
        />
        <span className="gp-multi-chart-cell__metrics">
          <strong>{stats.last.close.toLocaleString("fr-FR")}</strong>
          <em className={isPositive ? "is-positive" : "is-negative"}>
            {isPositive ? "+" : ""}
            {stats.changePercent.toFixed(2)}%
          </em>
        </span>
        <span className={clsx("gp-multi-chart-cell__audit", stats.isStale && "is-warning")}>
          {stats.isStale ? "Stale data" : "BRVM OHLCV"} · {formatDate(stats.last.time)}
        </span>
      </div>
    );
  }

  if (dataMode === "real") {
    return (
      <span className="gp-multi-chart-cell__loading" aria-live="polite">
        <span className="gp-mini-data-spinner" aria-hidden="true" />
        <strong>Loading data</strong>
        <em>{displaySymbol}</em>
      </span>
    );
  }

  return (
    <span className="gp-multi-chart-cell__empty">
      <i className="bi bi-exclamation-triangle" aria-hidden="true" />
      No data
    </span>
  );
};

const SecondaryChartCell: React.FC<{
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  loadStatus: ComparisonLoadStatus;
  dataMode: "mock" | "real";
  renderMode: MiniChartRenderMode;
  onActivate: () => void;
  onChartReady: (chartId: string, chart: EChartsInstance) => void;
  onChartDispose: (chartId: string) => void;
}> = ({ cell, data, loadStatus, dataMode, renderMode, onActivate, onChartReady, onChartDispose }) => {
  const stats = useMemo(() => getSeriesStats(data), [data]);
  const isPositive = (stats?.changePercent ?? 0) >= 0;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";
  const isWaitingForData = !stats && dataMode === "real" && (loadStatus === "idle" || loadStatus === "loading");
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate();
  };

  return (
    <div
      className={clsx("gp-multi-chart-cell gp-multi-chart-cell--secondary", renderMode === "ohlcv" && "is-full-ohlcv")}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title={`Activer ${cell.symbol}`}
    >
      <span className="gp-multi-chart-cell__header">
        <strong>{cell.symbol}</strong>
        <span>{cell.interval}</span>
      </span>

      {stats ? (
        <>
          <MiniChartCanvas
            chartId={cell.chartId}
            data={data}
            color={chartColor}
            renderMode={renderMode}
            onChartReady={onChartReady}
            onChartDispose={onChartDispose}
          />
          <span className="gp-multi-chart-cell__metrics">
            <strong>{stats.last.close.toLocaleString("fr-FR")}</strong>
            <em className={isPositive ? "is-positive" : "is-negative"}>
              {isPositive ? "+" : ""}
              {stats.changePercent.toFixed(2)}%
            </em>
          </span>
          <span className={clsx("gp-multi-chart-cell__audit", stats.isStale && "is-warning")}>
            {stats.isStale ? "Stale data" : "BRVM OHLCV"} · {formatDate(stats.last.time)}
          </span>
        </>
      ) : isWaitingForData ? (
        <span className="gp-multi-chart-cell__loading" aria-live="polite">
          <span className="gp-mini-data-spinner" aria-hidden="true" />
          <strong>Loading data</strong>
          <em>{cell.symbol}</em>
        </span>
      ) : (
        <span className="gp-multi-chart-cell__empty">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          No data
        </span>
      )}
    </div>
  );
};

export const MultiChartLayoutGrid: React.FC<MultiChartLayoutGridProps> = ({
  layout,
  marketData,
  dataLoadState,
  dataMode,
  activeChartInstanceRef,
  activeChartData,
  activeSymbol,
  activeInterval,
  children,
  onActivateChart,
}) => {
  const definition = getLayoutDefinition(layout.layoutId);
  const usesActivePreview = definition.chartCount >= 8;
  const secondaryRenderMode: MiniChartRenderMode = definition.chartCount <= 6 ? "ohlcv" : "sparkline";
  const [secondaryChartsById, setSecondaryChartsById] = useState<Record<string, EChartsInstance>>({});

  const handleChartReady = useCallback((chartId: string, chart: EChartsInstance) => {
    setSecondaryChartsById((current) => (current[chartId] === chart ? current : { ...current, [chartId]: chart }));
  }, []);

  const handleChartDispose = useCallback((chartId: string) => {
    setSecondaryChartsById((current) => {
      if (!current[chartId]) return current;
      const next = { ...current };
      delete next[chartId];
      return next;
    });
  }, []);

  const secondaryCharts = useMemo<MultiChartSyncPeer[]>(
    () =>
      layout.charts
        .filter((cell) => cell.chartId !== layout.activeChartId)
        .map((cell) => {
          const chart = secondaryChartsById[cell.chartId];
          if (!chart) return null;
          return {
            chartId: cell.chartId,
            chart,
            data: getMiniChartSeries(marketData[cell.symbol] ?? []),
          };
        })
        .filter((peer): peer is MultiChartSyncPeer => peer !== null),
    [layout.activeChartId, layout.charts, marketData, secondaryChartsById]
  );

  useMultiChartSync({
    layout,
    activeChartInstanceRef,
    activeChartData,
    secondaryCharts,
  });

  if (!layout.isEnabled || layout.charts.length <= 1) {
    return <>{children}</>;
  }

  return (
    <div className={clsx("gp-multi-chart-grid", definition.cssClass)}>
      {layout.charts.map((cell) => {
        const isActive = cell.chartId === layout.activeChartId;
        if (isActive) {
          const displaySymbol = activeSymbol || cell.symbol;
          const displayInterval = activeInterval || cell.interval;
          return (
            <div
              key={cell.chartId}
              className={clsx("gp-multi-chart-cell gp-multi-chart-cell--active", usesActivePreview && "is-preview-mode")}
            >
              <div className="gp-multi-chart-cell__active-header">
                <strong>{displaySymbol}</strong>
                <span>{displayInterval}</span>
                <em>Active</em>
              </div>
              {usesActivePreview ? (
                <>
                  <ActiveChartPreview cell={cell} data={activeChartData} dataMode={dataMode} displaySymbol={displaySymbol} />
                  <div className="gp-multi-chart-cell__active-surface" aria-hidden="true">
                    {children}
                  </div>
                </>
              ) : (
                children
              )}
            </div>
          );
        }

        return (
          <SecondaryChartCell
            key={cell.chartId}
            cell={cell}
            data={marketData[cell.symbol] ?? []}
            loadStatus={dataLoadState[cell.symbol] ?? "idle"}
            dataMode={dataMode}
            renderMode={secondaryRenderMode}
            onActivate={() => onActivateChart(cell.chartId)}
            onChartReady={handleChartReady}
            onChartDispose={handleChartDispose}
          />
        );
      })}
    </div>
  );
};
