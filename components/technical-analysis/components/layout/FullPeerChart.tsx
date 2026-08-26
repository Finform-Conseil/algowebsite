"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import type { EChartsCoreOption } from "echarts/core";
import type { EChartsInstance } from "../../lib/types/echarts";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { MultiChartLayoutCell } from "../../config/layout/multiChartLayoutTypes";
import type { ChartAppearance } from "../../config/state/chartStateTypes";
import type { ComparisonLoadStatus } from "../../hooks/MarketData/useMarketData";
import {
  buildCandleDirections,
  buildDirectionalOhlcvSeries,
  buildDirectionalVolumeBarData,
  getCandleDirectionColor,
  type CandleDirection,
} from "../../lib/chart/directionalOhlcv";
import { MULTI_CHART_MINI_DATA_ZOOM_ID } from "../../hooks/useMultiChartSync";
import {
  MAIN_GRID_LEFT,
  TV_AUTO_SCALE_PADDING,
  TV_ZOOM_VELOCITY,
  computeDirectionalZoomViewport,
  computeHorizontalPanViewport,
  clampViewportWindow,
  normalizeWheelDeltaPx,
} from "../../hooks/useChartViewport";
import { ensureLayoutEChartsModulesRegistered } from "./layoutEChartsRegistry";
import {
  createEmptyLayoutOhlcState,
  createLayoutOhlcState,
  formatLayoutCompactPrice,
  getLayoutPriceChangeColor,
  formatLayoutPrice,
  formatLayoutShortDate,
  getRenderableOhlcvSeries,
  type LayoutOhlcState,
} from "./layoutChartData";

const PEER_MAX_CANDLES = 500;
const PEER_Y_AXIS_WIDTH = 58;
const PEER_DOJI_PRICE_EPSILON = 0.000001;
const PEER_DOJI_TICK_HALF_WIDTH = 4;

interface PeerViewportState {
  startIdx: number;
  endIdx: number;
  yScale: number;
  isYManual: boolean;
}

export interface FullPeerChartProps {
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  loadStatus: ComparisonLoadStatus;
  dataMode: "mock" | "real";
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">;
  activeBounds?: { start: string; end: string };
  onActivate: () => void;
  onHeaderClick: () => void;
  onChartReady: (chartId: string, chart: EChartsInstance) => void;
  onChartDispose: (chartId: string) => void;
}

type CustomRenderApi = {
  value: (dimension: number) => unknown;
  coord: (data: unknown[]) => number[];
};

type PeerDojiDatum = [number, number, CandleDirection];

const toFiniteNumber = (value: unknown): number | null => {
  const numericValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const isCollapsedCandleBody = (point: ChartDataPoint): boolean =>
  Math.abs(point.open - point.close) <= PEER_DOJI_PRICE_EPSILON;

const buildPeerDojiOverlayData = (
  points: ChartDataPoint[],
  directions: CandleDirection[]
): PeerDojiDatum[] => {
  const overlayData: PeerDojiDatum[] = [];

  for (let index = 0; index < points.length; index++) {
    const point = points[index];
    if (!point || !isCollapsedCandleBody(point)) continue;
    overlayData.push([index, point.close, directions[index] ?? 1]);
  }

  return overlayData;
};

const renderPeerDojiMarker = (api: CustomRenderApi, upColor: string, downColor: string) => {
  const xValue = toFiniteNumber(api.value(0));
  const price = toFiniteNumber(api.value(1));
  const direction = toFiniteNumber(api.value(2));
  if (xValue === null || price === null || direction === null) return null;

  const coord = api.coord([xValue, price]);
  const x = coord[0];
  const y = coord[1];
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  return {
    type: "line",
    shape: {
      x1: x - PEER_DOJI_TICK_HALF_WIDTH,
      y1: y,
      x2: x + PEER_DOJI_TICK_HALF_WIDTH,
      y2: y,
    },
    style: {
      stroke: direction >= 0 ? upColor : downColor,
      lineWidth: 2,
      lineCap: "round",
      opacity: 0.95,
    },
  };
};

const createInitialViewport = (): PeerViewportState => ({
  startIdx: 0,
  endIdx: 0,
  yScale: 1,
  isYManual: false,
});

const resolveDataIndex = (data: ChartDataPoint[], value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value === "string" && value.length > 0) {
    const index = data.findIndex((point) => point.time === value);
    return index >= 0 ? index : null;
  }
  return null;
};

const readCurrentViewport = (
  chart: EChartsInstance,
  data: ChartDataPoint[],
  fallback: PeerViewportState
) => {
  if (data.length <= 1) return { startIdx: 0, endIdx: 0 };

  try {
    const option = chart.getOption() as { dataZoom?: Array<Record<string, unknown>> };
    const dataZoom = option.dataZoom?.find((item) => item.id === MULTI_CHART_MINI_DATA_ZOOM_ID)
      ?? option.dataZoom?.[0];

    const startValue = resolveDataIndex(data, dataZoom?.startValue);
    const endValue = resolveDataIndex(data, dataZoom?.endValue);

    if (startValue !== null && endValue !== null) {
      return clampViewportWindow(
        Math.min(startValue, endValue),
        Math.max(startValue, endValue),
        data.length
      );
    }

    const start = typeof dataZoom?.start === "number" ? dataZoom.start : null;
    const end = typeof dataZoom?.end === "number" ? dataZoom.end : null;
    if (start !== null && end !== null) {
      const maxIndex = data.length - 1;
      return clampViewportWindow(
        Math.round((start / 100) * maxIndex),
        Math.round((end / 100) * maxIndex),
        data.length
      );
    }
  } catch {
    // Keep the local fallback if ECharts is mid-transition.
  }

  return clampViewportWindow(fallback.startIdx, fallback.endIdx, data.length);
};

const getVisiblePriceRange = (data: ChartDataPoint[], startIdx: number, endIdx: number) => {
  let visibleMin = Infinity;
  let visibleMax = -Infinity;

  for (let i = startIdx; i <= endIdx; i++) {
    const point = data[i];
    if (!point) continue;
    visibleMin = Math.min(visibleMin, point.low);
    visibleMax = Math.max(visibleMax, point.high);
  }

  if (visibleMin === Infinity) {
    return { min: 0, max: 100 };
  }

  return { min: visibleMin, max: visibleMax };
};

export const FullPeerChart: React.FC<FullPeerChartProps> = ({
  cell,
  data,
  loadStatus,
  dataMode,
  chartAppearance,
  activeBounds,
  onActivate,
  onHeaderClick,
  onChartReady,
  onChartDispose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
  const viewportRef = useRef<PeerViewportState>(createInitialViewport());
  const peerViewportApplyRafRef = useRef<number | null>(null);
  const [chartReadyVersion, setChartReadyVersion] = useState(0);
  const [hasPaintedCandles, setHasPaintedCandles] = useState(false);
  const [ohlc, setOhlc] = useState<LayoutOhlcState>(createEmptyLayoutOhlcState());
  const [lastPriceY, setLastPriceY] = useState<number | null>(null);
  const [lastPriceColor, setLastPriceColor] = useState<string>("#94a3b8");
  const [lastPriceText, setLastPriceText] = useState<string>("");

  const filteredData = React.useMemo(() => {
    const valid = getRenderableOhlcvSeries(data);
    if (valid.length > PEER_MAX_CANDLES) {
      return valid.slice(valid.length - PEER_MAX_CANDLES);
    }
    return valid;
  }, [data]);

  const latestPoint = filteredData[filteredData.length - 1];
  const latestDirection = useMemo(() => {
    const directions = buildCandleDirections(filteredData);
    return directions[directions.length - 1] ?? 1;
  }, [filteredData]);
  const latestPointRef = useRef<ChartDataPoint | undefined>(latestPoint);
  useEffect(() => { latestPointRef.current = latestPoint; }, [latestPoint]);

  // Pre-slice data to activeBounds window so ECharts Y-axis always auto-scales correctly
  // to the visible data range only, rather than the full historical dataset.
  // This avoids Y-axis expansion on wide historical datasets while dataZoom windows the pre-sliced arrays.
  const displayData = useMemo<ChartDataPoint[]>(() => {
    const start = activeBounds?.start;
    const end = activeBounds?.end;
    if (!start && !end) {
      return filteredData.length > 120 ? filteredData.slice(filteredData.length - 120) : filteredData;
    }
    let result = filteredData;
    if (start) result = result.filter((p) => p.time >= start);
    if (end) result = result.filter((p) => p.time <= end);
    if (result.length === 0) {
      return filteredData.length > 120 ? filteredData.slice(filteredData.length - 120) : filteredData;
    }
    return result;
  }, [filteredData, activeBounds]);

  // Stable ref so the updateAxisPointer closure always reads current displayData
  const displayDataRef = useRef<ChartDataPoint[]>(displayData);
  useEffect(() => { displayDataRef.current = displayData; }, [displayData]);

  const updateOhlcFromPoint = useCallback((
    point: ChartDataPoint | undefined,
    previousPoint?: ChartDataPoint,
  ) => {
    if (!point) {
      setOhlc(createEmptyLayoutOhlcState());
      return;
    }
    setOhlc(createLayoutOhlcState(point, previousPoint));
  }, []);

  useEffect(() => {
    const previousPoint = filteredData[filteredData.length - 2];
    updateOhlcFromPoint(latestPoint, previousPoint);
    if (latestPoint) {
      setLastPriceColor(getLayoutPriceChangeColor(
        latestPoint,
        previousPoint,
        chartAppearance.upColor,
        chartAppearance.downColor,
      ));
      setLastPriceText(formatLayoutPrice(latestPoint.close));
    }
  }, [chartAppearance.downColor, chartAppearance.upColor, filteredData, latestPoint, updateOhlcFromPoint]);

  const updateLastPriceBadgePosition = useCallback(() => {
    const chart = chartInstanceRef.current;
    const point = latestPointRef.current;
    if (!chart || chart.isDisposed() || !point) {
      setLastPriceY(null);
      return;
    }
    try {
      const pixel = chart.convertToPixel({ yAxisIndex: 0 }, point.close);
      const y = Array.isArray(pixel) ? pixel[1] : pixel;
      if (Number.isFinite(y)) {
        setLastPriceY(y);
      }
    } catch {
      setLastPriceY(null);
    }
  }, []);

  const initChart = useCallback(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    let chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) {
      ensureLayoutEChartsModulesRegistered();
      chart = echarts.init(canvasEl, undefined, { renderer: "canvas" });
      chartInstanceRef.current = chart;
      onChartReady(cell.chartId, chart);
      setChartReadyVersion((version) => version + 1);

      chart.on("updateAxisPointer", (params: any) => {
        if (!params || !params.axesInfo) return;
        const xInfo = params.axesInfo.find((info: any) => info.axisDim === "x" || info.axisIndex === 0);
        if (xInfo && xInfo.value !== undefined) {
          const current = displayDataRef.current;
          let point: ChartDataPoint | undefined;
          let pointIndex = -1;
          if (typeof xInfo.value === "string") {
            pointIndex = current.findIndex((p) => p.time === xInfo.value);
            point = pointIndex >= 0 ? current[pointIndex] : undefined;
          } else if (typeof xInfo.value === "number") {
            pointIndex = xInfo.value;
            point = current[pointIndex];
          }
          if (point) updateOhlcFromPoint(point, current[pointIndex - 1]);
        }
      });
    }
  }, [cell.chartId, onChartReady, updateOhlcFromPoint]);

  const disposeChart = useCallback(() => {
    const chart = chartInstanceRef.current;
    if (chart && !chart.isDisposed()) {
      chart.dispose();
    }
    chartInstanceRef.current = null;
    setHasPaintedCandles(false);
    onChartDispose(cell.chartId);
  }, [cell.chartId, onChartDispose]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    let isVisible = false;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting && !isVisible) {
          isVisible = true;
          initChart();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      disposeChart();
    };
  }, [disposeChart, initChart]);

  const applyPeerViewport = useCallback(() => {
    const chart = chartInstanceRef.current;
    const dataWindow = displayDataRef.current;
    if (!chart || chart.isDisposed() || dataWindow.length === 0) return;

    const totalBars = dataWindow.length;
    const state = viewportRef.current;
    const next = clampViewportWindow(state.startIdx, state.endIdx, totalBars);
    state.startIdx = next.startIdx;
    state.endIdx = next.endIdx;

    const range = getVisiblePriceRange(dataWindow, state.startIdx, state.endIdx);
    const priceRange = range.max - range.min;
    const center = (range.max + range.min) / 2;
    const padding = priceRange === 0
      ? Math.max(Math.abs(range.min), 1) * TV_AUTO_SCALE_PADDING
      : priceRange * TV_AUTO_SCALE_PADDING;

    const scaledRange = state.isYManual
      ? Math.max(Number.EPSILON, (priceRange + padding * 2) * state.yScale)
      : priceRange + padding * 2;

    let finalMin = center - (scaledRange / 2);
    let finalMax = center + (scaledRange / 2);

    if (!Number.isFinite(finalMin) || !Number.isFinite(finalMax) || finalMin >= finalMax) {
      state.isYManual = false;
      state.yScale = 1;
      finalMin = range.min - padding;
      finalMax = range.max + padding;
    }

    chart.setOption({
      yAxis: [{ id: "peer-price-y-ohlcv", min: finalMin, max: finalMax }],
      dataZoom: [{
        id: MULTI_CHART_MINI_DATA_ZOOM_ID,
        xAxisIndex: [0, 1],
        filterMode: "none",
        startValue: state.startIdx,
        endValue: state.endIdx,
      }],
    });

    window.requestAnimationFrame(updateLastPriceBadgePosition);
  }, [updateLastPriceBadgePosition]);

  const schedulePeerViewportApply = useCallback(() => {
    if (peerViewportApplyRafRef.current !== null) return;
    peerViewportApplyRafRef.current = window.requestAnimationFrame(() => {
      peerViewportApplyRafRef.current = null;
      applyPeerViewport();
    });
  }, [applyPeerViewport]);

  useEffect(() => () => {
    if (peerViewportApplyRafRef.current !== null) {
      window.cancelAnimationFrame(peerViewportApplyRafRef.current);
      peerViewportApplyRafRef.current = null;
    }
  }, []);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    setHasPaintedCandles(false);
    if (!chart || chart.isDisposed() || displayData.length === 0) return;

    const upColor = chartAppearance.upColor;
    const downColor = chartAppearance.downColor;
    const {
      dates,
      candles: values,
      volumes,
      directions,
    } = buildDirectionalOhlcvSeries(displayData, {
      upColor,
      downColor,
      volumeColorMode: chartAppearance.volumeColorMode,
    });
    const dojiOverlayData = buildPeerDojiOverlayData(displayData, directions);

    const option: EChartsCoreOption = {
      animation: false,
      grid: [
        { left: 12, right: 58, top: 8, bottom: "24%" },
        { left: 12, right: 58, height: "16%", bottom: "4%" },
      ],
      axisPointer: {
        link: [{ xAxisIndex: "all" }],
        snap: true,
        label: { backgroundColor: "#0d1421" },
      },
      xAxis: [
        {
          id: "peer-time-x-ohlcv",
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
            fontSize: 9,
          },
        },
        {
          id: "peer-time-x-vol",
          type: "category",
          data: dates,
          boundaryGap: true,
          gridIndex: 1,
          show: false,
        },
      ],
      yAxis: [
        {
          id: "peer-price-y-ohlcv",
          type: "value",
          scale: true,
          gridIndex: 0,
          position: "right",
          splitLine: {
            show: true,
            lineStyle: { color: "rgba(42, 49, 67, 0.4)", type: "dashed" },
          },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            show: true,
            color: "#94a3b8",
            fontSize: 9,
            formatter: (v: number) => formatLayoutCompactPrice(v),
          },
        },
        {
          id: "peer-price-y-vol",
          type: "value",
          scale: false,
          gridIndex: 1,
          position: "right",
          splitLine: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
        },
      ],
      dataZoom: [
        {
          id: MULTI_CHART_MINI_DATA_ZOOM_ID,
          type: "inside",
          xAxisIndex: [0, 1],
          filterMode: "none",
          zoomOnMouseWheel: false,
          moveOnMouseWheel: false,
          moveOnMouseMove: false,
          // displayData is already pre-sliced to the activeBounds window
          // so we render 100% of what's passed in; no startValue/endValue needed
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          id: "peer-ohlcv-series",
          name: "OHLC",
          type: "candlestick",
          data: values,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor,
          },
          markLine: {
            symbol: ["none", "none"],
            animation: false,
            silent: true,
            data: [
              {
                yAxis: latestPoint?.close,
                label: { show: false },
                lineStyle: {
                  color: lastPriceColor,
                  type: "dashed",
                  width: 1,
                  opacity: 0.6,
                },
              },
            ],
          },
        },
        {
          id: "peer-doji-overlay",
          name: "Flat candles",
          type: "custom",
          xAxisIndex: 0,
          yAxisIndex: 0,
          encode: { x: 0 },
          clip: true,
          data: dojiOverlayData,
          silent: true,
          renderItem: (_params: unknown, api: CustomRenderApi) =>
            renderPeerDojiMarker(api, upColor, downColor),
          z: 6,
        },
        {
          id: "peer-volume-bar",
          name: "Volume",
          type: "bar",
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: buildDirectionalVolumeBarData(volumes, { upColor, downColor }, 0.7, dates.length),
          barWidth: "60%",
          barMinHeight: 1,
        },
      ],
    };

    const markCandlesPainted = () => {
      if (displayDataRef.current.length === 0) return;
      setHasPaintedCandles(true);
      updateLastPriceBadgePosition();
    };

    chart.on("finished", markCandlesPainted);
    chart.setOption(option, true);
    viewportRef.current = {
      startIdx: 0,
      endIdx: Math.max(0, displayData.length - 1),
      yScale: 1,
      isYManual: false,
    };
    updateLastPriceBadgePosition();

    return () => {
      if (!chart.isDisposed()) chart.off("finished", markCandlesPainted);
    };
  }, [
    chartAppearance.downColor,
    chartAppearance.upColor,
    chartAppearance.volumeColorMode,
    chartReadyVersion,
    displayData,
    filteredData,
    lastPriceColor,
    latestPoint,
    updateLastPriceBadgePosition,
  ]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    canvasEl.style.touchAction = "none";
    const wheelOptions: AddEventListenerOptions = { passive: false, capture: true };

    const onWheel = (event: WheelEvent) => {
      const chart = chartInstanceRef.current;
      const dataWindow = displayDataRef.current;
      if (!chart || chart.isDisposed() || dataWindow.length <= 1) return;

      event.preventDefault();
      event.stopPropagation();

      const totalBars = dataWindow.length;
      const state = viewportRef.current;
      const current = readCurrentViewport(chart, dataWindow, state);
      state.startIdx = current.startIdx;
      state.endIdx = current.endIdx;

      const rect = canvasEl.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const gridRightPx = rect.width - PEER_Y_AXIS_WIDTH;
      const isOnYAxis = mouseX >= gridRightPx;
      const isOnChartOrAxis = mouseX < gridRightPx;
      const wheelDeltaY = normalizeWheelDeltaPx(event.deltaY, event.deltaMode);
      const wheelDeltaX = normalizeWheelDeltaPx(event.deltaX, event.deltaMode);

      if (isOnYAxis) {
        state.yScale *= Math.exp(wheelDeltaY * TV_ZOOM_VELOCITY);
        state.isYManual = true;
        schedulePeerViewportApply();
        return;
      }

      if (!isOnChartOrAxis) return;

      const visibleCount = Math.max(1, state.endIdx - state.startIdx);
      const gridWidth = Math.max(1, rect.width - MAIN_GRID_LEFT - PEER_Y_AXIS_WIDTH);

      if (Math.abs(wheelDeltaY) > Math.abs(wheelDeltaX)) {
        const zoomFactor = Math.exp(wheelDeltaY * TV_ZOOM_VELOCITY);
        const cursorRatio = Math.max(0, Math.min(1, (mouseX - MAIN_GRID_LEFT) / gridWidth));
        const zoomed = computeDirectionalZoomViewport({
          startIdx: state.startIdx,
          endIdx: state.endIdx,
          totalBars,
          cursorRatio,
          zoomFactor,
          deltaY: wheelDeltaY,
        });
        state.startIdx = zoomed.startIdx;
        state.endIdx = zoomed.endIdx;
      } else {
        const shifted = computeHorizontalPanViewport({
          startIdx: state.startIdx,
          endIdx: state.endIdx,
          totalBars,
          shift: (wheelDeltaX / gridWidth) * visibleCount,
        });
        state.startIdx = shifted.startIdx;
        state.endIdx = shifted.endIdx;
      }

      schedulePeerViewportApply();
    };

    canvasEl.addEventListener("wheel", onWheel, wheelOptions);
    return () => {
      canvasEl.removeEventListener("wheel", onWheel, wheelOptions);
    };
  }, [schedulePeerViewportApply]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    let resizeFrameId: number | null = null;
    const resizeObserver = new ResizeObserver(() => {
      if (resizeFrameId !== null) return;
      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        const chart = chartInstanceRef.current;
        if (chart && !chart.isDisposed()) {
          chart.resize();
          updateLastPriceBadgePosition();
        }
      });
    });

    resizeObserver.observe(canvasEl);

    return () => {
      resizeObserver.disconnect();
      if (resizeFrameId !== null) {
        window.cancelAnimationFrame(resizeFrameId);
      }
    };
  }, [updateLastPriceBadgePosition]);

  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHeaderClick();
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation();
      e.preventDefault();
      onHeaderClick();
    }
  };

  const hasSelectedSymbol = cell.symbol.trim().length > 0;
  const displaySymbol = hasSelectedSymbol ? cell.symbol : "Choisir un titre";
  const hasRenderableCandles = displayData.length > 0;
  const hasTerminalNoData = hasSelectedSymbol
    && !hasRenderableCandles
    && (dataMode !== "real" || loadStatus === "empty" || loadStatus === "failed");
  const shouldShowPeerLoader = hasSelectedSymbol
    && dataMode === "real"
    && !hasTerminalNoData
    && !hasRenderableCandles;
  const shouldShowEmptyState = hasTerminalNoData;
  const shouldShowSelectionState = !hasSelectedSymbol;
  const peerLoaderLabel = "Chargement des données";
  const peerEmptyLabel = loadStatus === "failed" ? "Données indisponibles" : "Aucune donnée disponible";

  return (
    <div
      ref={containerRef}
      className="gp-peer-chart"
      onClick={hasSelectedSymbol ? onActivate : onHeaderClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (hasSelectedSymbol) onActivate();
          else onHeaderClick();
        }
      }}
      aria-label={hasSelectedSymbol
        ? "Activer le graphique secondaire de " + displaySymbol
        : `Choisir un titre · ${cell.exchange || "N/D"}`}
    >
      <div className="gp-peer-chart__header">
        <span
          className="gp-peer-chart__symbol-area gp-multi-chart-cell--interactive-header"
          onClick={handleHeaderClick}
          onKeyDown={handleHeaderKeyDown}
          role="button"
          tabIndex={0}
          aria-label={"Modifier le symbole " + displaySymbol}
        >
          <strong className="gp-peer-chart__symbol">{displaySymbol}</strong>
          <span className="gp-peer-chart__interval">{cell.exchange || "N/D"}</span>
          <span className="gp-peer-chart__interval">{cell.interval}</span>
          <i className="bi bi-search gp-peer-chart__search-icon" aria-hidden="true" />
        </span>

        {latestPoint && (
          <div className="gp-peer-chart__ohlc">
            <span>O<span className="gp-peer-chart__ohlc-val">{ohlc.open}</span></span>
            <span>H<span className="gp-peer-chart__ohlc-val">{ohlc.high}</span></span>
            <span>L<span className="gp-peer-chart__ohlc-val">{ohlc.low}</span></span>
            <span>C<span className="gp-peer-chart__ohlc-val" style={{ color: lastPriceColor }}>{ohlc.close}</span></span>
            <span style={{ color: lastPriceColor }}>{ohlc.changePercent}</span>
          </div>
        )}
      </div>

      <div className="gp-peer-chart__canvas">
        <div ref={canvasRef} className="gp-peer-chart__echart" aria-hidden={shouldShowPeerLoader || shouldShowEmptyState || shouldShowSelectionState} />
        {shouldShowPeerLoader && (
          <div className="gp-peer-chart__loading" aria-live="polite">
            <span className="gp-mini-data-spinner" aria-hidden="true" />
            <strong>{peerLoaderLabel}</strong>
            <em>{displaySymbol}</em>
          </div>
        )}
        {shouldShowSelectionState && (
          <div className="gp-peer-chart__empty-state" aria-live="polite">
            <i className="bi bi-plus-circle" aria-hidden="true" />
            <strong>Choisir un titre</strong>
            <em>{cell.exchange}</em>
          </div>
        )}
        {shouldShowEmptyState && (
          <div className="gp-peer-chart__empty-state" aria-live="polite">
            <i className="bi bi-exclamation-triangle" aria-hidden="true" />
            <strong>{peerEmptyLabel}</strong>
            <em>{displaySymbol}</em>
          </div>
        )}
        {lastPriceY !== null && hasPaintedCandles && !shouldShowPeerLoader && !shouldShowEmptyState && (
          <div
            className="gp-peer-chart__last-badge"
            style={{
              top: `${lastPriceY}px`,
              backgroundColor: lastPriceColor,
            }}
          >
            {lastPriceText}
          </div>
        )}
      </div>
    </div>
  );
};
