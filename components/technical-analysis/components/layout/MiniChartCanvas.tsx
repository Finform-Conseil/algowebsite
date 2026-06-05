"use client";

import React, { useEffect, useRef, useMemo } from "react";
import clsx from "clsx";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { EChartsInstance } from "../../lib/types/echarts";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { MultiChartLayoutCell } from "../../config/layout/multiChartLayoutTypes";
import type { ChartAppearance } from "../../config/state/chartStateTypes";
import type { ComparisonLoadStatus } from "../../hooks/MarketData/useMarketData";
import { buildDirectionalOhlcvSeries, buildDirectionalVolumeBarData } from "../../lib/chart/directionalOhlcv";
import { MULTI_CHART_MINI_DATA_ZOOM_ID } from "../../hooks/useMultiChartSync";
import {
  formatLayoutCompactPrice,
  formatLayoutDate,
  formatLayoutShortDate,
  getLayoutSeriesStats,
  getRenderableOhlcvSeries,
} from "./layoutChartData";

const MINI_CHART_POINTS = 120;
export type MiniChartRenderMode = "sparkline" | "ohlcv";

const buildMiniSparklineOption = (
  data: ChartDataPoint[],
  color: string,
  activeBounds?: { start: string; end: string }
): EChartsCoreOption => {
  const series = getRenderableOhlcvSeries(data);
  const defaultStart = activeBounds?.start || (series.length > MINI_CHART_POINTS ? series[series.length - MINI_CHART_POINTS].time : series[0]?.time);
  const defaultEnd = activeBounds?.end || series[series.length - 1]?.time;

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
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        startValue: defaultStart,
        endValue: defaultEnd,
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

const buildMiniOhlcvOption = (
  data: ChartDataPoint[],
  color: string,
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">,
  activeBounds?: { start: string; end: string }
): EChartsCoreOption => {
  const series = getRenderableOhlcvSeries(data);
  const upColor = chartAppearance.upColor;
  const downColor = chartAppearance.downColor;
  const { dates, candles: values, volumes: vols } = buildDirectionalOhlcvSeries(series, {
    upColor,
    downColor,
    volumeColorMode: chartAppearance.volumeColorMode,
  });

  const defaultStart = activeBounds?.start || (dates.length > MINI_CHART_POINTS ? dates[dates.length - MINI_CHART_POINTS] : dates[0]);
  const defaultEnd = activeBounds?.end || dates[dates.length - 1];

  return {
    animation: false,
    grid: [
      { left: 4, right: 58, top: 16, bottom: 40 },
      { left: 4, right: 58, height: "20%", bottom: 40 },
    ],
    tooltip: { show: false },
    axisPointer: {
      link: [{ xAxisIndex: "all" }],
      snap: true,
      label: { backgroundColor: "#0d1421" },
    },
    xAxis: [
      {
        id: "mini-time-x-ohlcv",
        type: "category",
        data: dates,
        boundaryGap: true,
        gridIndex: 0,
        show: true,
        axisLine: { lineStyle: { color: "#2a3143" } },
        axisTick: { show: false },
        axisLabel: {
          formatter: formatLayoutShortDate,
          color: "#94a3b8",
          fontSize: 10,
        },
      },
      { id: "mini-time-x-vol", type: "category", data: dates, boundaryGap: true, gridIndex: 1, show: false },
    ],
    yAxis: [
      {
        id: "mini-price-y-ohlcv",
        type: "value",
        scale: true,
        gridIndex: 0,
        position: "right",
        splitLine: { show: true, lineStyle: { color: "rgba(42, 49, 67, 0.6)", type: "dashed" } },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          show: true,
          color: "#94a3b8",
          fontSize: 10,
          fontFamily: "Inter, system-ui, sans-serif",
          formatter: (value: number) => formatLayoutCompactPrice(value),
        },
      },
      { id: "mini-price-y-vol", type: "value", scale: false, gridIndex: 1, position: "right", splitLine: { show: false }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { show: false } },
    ],
    dataZoom: [
      {
        id: MULTI_CHART_MINI_DATA_ZOOM_ID,
        type: "inside",
        xAxisIndex: [0, 1],
        filterMode: "none",
        zoomOnMouseWheel: true,
        moveOnMouseMove: true,
        startValue: defaultStart,
        endValue: defaultEnd,
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
        data: buildDirectionalVolumeBarData(vols, { upColor, downColor }, 0.82, dates.length),
        barWidth: "58%",
        barMinHeight: 2,
      },
    ],
  };
};

const buildMiniChartOption = (
  data: ChartDataPoint[],
  color: string,
  renderMode: MiniChartRenderMode,
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">,
  activeBounds?: { start: string; end: string }
): EChartsCoreOption =>
  renderMode === "ohlcv"
    ? buildMiniOhlcvOption(data, color, chartAppearance, activeBounds)
    : buildMiniSparklineOption(data, color, activeBounds);

export interface MiniChartCanvasProps {
  chartId: string;
  data: ChartDataPoint[];
  color: string;
  renderMode: MiniChartRenderMode;
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">;
  activeBounds?: { start: string; end: string };
  onChartReady: (id: string, chart: EChartsInstance) => void;
  onChartDispose: (id: string) => void;
}

export const MiniChartCanvas: React.FC<MiniChartCanvasProps> = ({
  chartId,
  data,
  color,
  renderMode,
  chartAppearance,
  activeBounds,
  onChartReady,
  onChartDispose,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);

  useEffect(() => () => {
    const chart = chartInstanceRef.current;
    if (chart && !chart.isDisposed()) chart.dispose();
    chartInstanceRef.current = null;
    onChartDispose(chartId);
  }, [chartId, onChartDispose]);

  useEffect(() => {
    const series = getRenderableOhlcvSeries(data);
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
    chart.setOption(buildMiniChartOption(data, color, renderMode, chartAppearance, activeBounds), true, true);

    const chartInstance = chart;
    const frameId = window.requestAnimationFrame(() => chartInstance.resize());
    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => chartInstance.resize()) : null;
    resizeObserver?.observe(element);

    return () => {
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
    };
  }, [activeBounds, chartAppearance, chartId, color, data, onChartDispose, onChartReady, renderMode]);

  return <div ref={chartRef} className={clsx("gp-multi-chart-cell__echart", renderMode === "ohlcv" && "is-interactive")} />;
};

const noopChartReady = () => {};
const noopChartDispose = () => {};

export interface ActiveChartPreviewProps {
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  dataMode: "mock" | "real";
  displaySymbol: string;
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">;
}

export const ActiveChartPreview: React.FC<ActiveChartPreviewProps> = ({ cell, data, dataMode, displaySymbol, chartAppearance }) => {
  const stats = useMemo(() => getLayoutSeriesStats(data), [data]);
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
          chartAppearance={chartAppearance}
          onChartReady={noopChartReady}
          onChartDispose={noopChartDispose}
        />
        <span className="gp-multi-chart-cell__metrics">
          <strong>{formatLayoutCompactPrice(stats.last.close)}</strong>
          <em className={isPositive ? "is-positive" : "is-negative"}>
            {isPositive ? "+" : ""}
            {stats.changePercent.toFixed(2)}%
          </em>
        </span>
        <span className={clsx("gp-multi-chart-cell__audit", stats.isStale && "is-warning")}>
          {stats.isStale ? "Stale data" : "BRVM OHLCV"} · {formatLayoutDate(stats.last.time)}
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

export interface SecondaryChartCellProps {
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  loadStatus: ComparisonLoadStatus;
  dataMode: "mock" | "real";
  renderMode: MiniChartRenderMode;
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">;
  activeBounds?: { start: string; end: string };
  onActivate: () => void;
  onHeaderClick: () => void;
  onChartReady: (chartId: string, chart: EChartsInstance) => void;
  onChartDispose: (chartId: string) => void;
}

export const SecondaryChartCell: React.FC<SecondaryChartCellProps> = ({
  cell,
  data,
  loadStatus,
  dataMode,
  renderMode,
  chartAppearance,
  activeBounds,
  onActivate,
  onHeaderClick,
  onChartReady,
  onChartDispose,
}) => {
  const stats = useMemo(() => getLayoutSeriesStats(data), [data]);
  const isPositive = (stats?.changePercent ?? 0) >= 0;
  const chartColor = isPositive ? "#22c55e" : "#ef4444";
  const isWaitingForData = !stats && dataMode === "real" && (loadStatus === "idle" || loadStatus === "loading");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onActivate();
  };

  const handleHeaderClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    onHeaderClick();
  };

  const handleHeaderKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.stopPropagation();
      event.preventDefault();
      onHeaderClick();
    }
  };

  return (
    <div
      className={clsx("gp-multi-chart-cell gp-multi-chart-cell--secondary", renderMode === "ohlcv" && "is-full-ohlcv")}
      onClick={onActivate}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Activer ${cell.symbol}`}
    >
      <span
        className="gp-multi-chart-cell__header gp-multi-chart-cell--interactive-header"
        onClick={handleHeaderClick}
        onKeyDown={handleHeaderKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Rechercher un titre pour remplacer ${cell.symbol}`}
      >
        <strong>{cell.symbol}</strong>
        <span>{cell.interval}</span>
        <i className="bi bi-search" style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.7 }} aria-hidden="true" />
      </span>

      {stats ? (
        <>
          <MiniChartCanvas
            chartId={cell.chartId}
            data={data}
            color={chartColor}
            renderMode={renderMode}
            chartAppearance={chartAppearance}
            activeBounds={activeBounds}
            onChartReady={onChartReady}
            onChartDispose={onChartDispose}
          />
          <span className="gp-multi-chart-cell__metrics">
            <strong>{formatLayoutCompactPrice(stats.last.close)}</strong>
            <em className={isPositive ? "is-positive" : "is-negative"}>
              {isPositive ? "+" : ""}
              {stats.changePercent.toFixed(2)}%
            </em>
          </span>
          <span className={clsx("gp-multi-chart-cell__audit", stats.isStale && "is-warning")}>
            {stats.isStale ? "Stale data" : "BRVM OHLCV"} · {formatLayoutDate(stats.last.time)}
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
