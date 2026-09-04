"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { MultiChartLayoutCell } from "../../config/layout/multiChartLayoutTypes";
import {
  completeMultiChartCell,
  type CompleteMultiChartLayoutCell,
  type MultiChartViewportState,
} from "../../config/layout/multiChartCellState";
import type { ChartAppearance, ChartState } from "../../config/state/chartStateTypes";
import { getMarketLogoUrl } from "@/core/data/market-logo-registry";
import type { UiState } from "../../config/state/uiStateTypes";
import { filterChartDataByDateRange } from "../../config/market/dateRangeSeries";
import type { ComparisonLoadStatus } from "../../hooks/MarketData/useMarketData";
import { useEChartsRenderer } from "../../hooks/useEChartsRenderer";
import {
  isAxisPointerPayload,
  readPrimaryXAxisCategories,
  resolveAxisPointerIndex,
  resolvePixelPointerIndex,
  type ZrMouseMovePayload,
} from "../../lib/chart/pointerCandleIndex";
import { resolveLastPriceAxisColor } from "../../lib/chart/lastPriceAxisVisuals";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";
import { createDefaultMultiChartIndicatorSnapshot } from "../../store/policies/multiChartIndicatorStatePolicy";
import { TimeAxisControls } from "../toolbar/time-axis/TimeAxisControls";
import {
  createEmptyLayoutOhlcState,
  createLayoutOhlcState,
  formatLayoutPrice,
  getLayoutPriceChangeColor,
  getRenderableOhlcvSeries,
  type LayoutOhlcState,
} from "./layoutChartData";

export interface FullPeerChartProps {
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  loadStatus: ComparisonLoadStatus;
  dataMode: "mock" | "real";
  chartAppearance: ChartAppearance;
  chartAppearancePreview?: UiState["chartAppearancePreview"];
  uiState: UiState;
  hiddenObjectIds?: Record<string, boolean>;
  activeBounds?: { start: string; end: string };
  headerActions?: React.ReactNode;
  isActive?: boolean;
  interactionOverlay?: React.ReactNode;
  onActivate: () => void;
  onHeaderClick: () => void;
  onChartReady: (chartId: string, chart: EChartsInstance) => void;
  onChartDispose: (chartId: string) => void;
  onViewportChange?: (chartId: string, viewport: MultiChartViewportState) => void;
  onHistoryBoundaryRequest?: (direction: "left" | "right") => void;
  /** Dense layouts keep only the indicator legend lane; comfortable layouts stack OHLC above it. */
  metaDensity?: "comfortable" | "dense";
}

const buildPeerUiState = (
  uiState: UiState,
  cell: CompleteMultiChartLayoutCell,
): UiState => {
  const snapshot = cell.indicatorState ?? createDefaultMultiChartIndicatorSnapshot(cell);
  return {
    ...uiState,
    comparisonSymbols: [],
    comparisonSettings: {},
    movingAverageTrendSignals: snapshot.ui.movingAverageTrendSignals,
    priceVsSmaMetrics: snapshot.ui.priceVsSmaMetrics,
    priceVsEmaMetrics: snapshot.ui.priceVsEmaMetrics,
    multiChartLayout: {
      ...uiState.multiChartLayout,
      activeChartId: cell.chartId,
    },
  };
};

const buildPeerChartState = (
  cell: CompleteMultiChartLayoutCell,
): ChartState => {
  const snapshot = cell.indicatorState ?? createDefaultMultiChartIndicatorSnapshot(cell);
  return {
    symbol: cell.symbol,
    timeframe: cell.timeframe,
    chartType: cell.sourceKind === "index" ? "line" : cell.chartType,
    indicators: snapshot.chart,
  };
};

export const FullPeerChart: React.FC<FullPeerChartProps> = ({
  cell,
  data,
  loadStatus,
  dataMode,
  chartAppearance,
  chartAppearancePreview,
  uiState,
  hiddenObjectIds = {},
  activeBounds,
  headerActions,
  isActive = false,
  interactionOverlay,
  onActivate,
  onHeaderClick,
  onChartReady,
  onChartDispose,
  onViewportChange,
  onHistoryBoundaryRequest,
  metaDensity = "comfortable",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersStackRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<EChartsInstance | null>(null);
  const reportedChartRef = useRef<EChartsInstance | null>(null);
  const lastZoomRangeRef = useRef({ start: 0, end: 100 });
  const [chartReadyVersion, setChartReadyVersion] = useState(0);
  const [hasPaintedCandles, setHasPaintedCandles] = useState(false);
  const [ohlc, setOhlc] = useState<LayoutOhlcState>(createEmptyLayoutOhlcState());
  const [ohlcColor, setOhlcColor] = useState<string>("#94a3b8");
  const [lastPriceY, setLastPriceY] = useState<number | null>(null);
  const [lastPriceColor, setLastPriceColor] = useState<string>("#94a3b8");
  const [lastPriceText, setLastPriceText] = useState<string>("");
  const [isGeometryCompactMeta, setIsGeometryCompactMeta] = useState(false);
  const isCompactMeta = metaDensity === "dense" || isGeometryCompactMeta;

  const completeCell = useMemo(() => completeMultiChartCell(cell), [cell]);
  const peerLogoUrl = useMemo(
    () => getMarketLogoUrl(completeCell.exchange, completeCell.symbol),
    [completeCell.exchange, completeCell.symbol],
  );
  const indicatorSnapshot = useMemo(
    () => completeCell.indicatorState ?? createDefaultMultiChartIndicatorSnapshot(completeCell),
    [completeCell],
  );

  const filteredData = useMemo(() => filterChartDataByDateRange(
    getRenderableOhlcvSeries(data),
    completeCell.dateRange || "Tout",
  ), [completeCell.dateRange, data]);

  const displayData = filteredData;
  void activeBounds;

  const latestPoint = displayData[displayData.length - 1];
  const latestPointRef = useRef<ChartDataPoint | undefined>(latestPoint);
  const displayDataRef = useRef<ChartDataPoint[]>(displayData);
  useEffect(() => { latestPointRef.current = latestPoint; }, [latestPoint]);
  useEffect(() => { displayDataRef.current = displayData; }, [displayData]);

  const peerChartConfig = useMemo(() => buildPeerChartState(completeCell), [completeCell]);
  const peerUiState = useMemo(() => buildPeerUiState(uiState, completeCell), [completeCell, uiState]);
  const committedPeerAppearance = completeCell.appearance ?? chartAppearance;
  const previewPeerAppearance = chartAppearancePreview?.chartId === completeCell.chartId
    ? chartAppearancePreview.appearance
    : null;
  const peerChartAppearance = useMemo<ChartAppearance>(() => (
    previewPeerAppearance ?? committedPeerAppearance
  ), [committedPeerAppearance, previewPeerAppearance]);

  const updateOhlcFromPoint = useCallback((point: ChartDataPoint | undefined, previousPoint?: ChartDataPoint) => {
    if (!point) {
      setOhlc(createEmptyLayoutOhlcState());
      setOhlcColor("#94a3b8");
      return;
    }
    setOhlc(createLayoutOhlcState(point, previousPoint));
    setOhlcColor(getLayoutPriceChangeColor(
      point,
      previousPoint,
      peerChartAppearance.upColor,
      peerChartAppearance.downColor,
    ));
  }, [peerChartAppearance.downColor, peerChartAppearance.upColor]);

  useEffect(() => {
    const previousPoint = displayData[displayData.length - 2];
    updateOhlcFromPoint(latestPoint, previousPoint);
    if (!latestPoint) {
      setLastPriceY(null);
      setLastPriceText("");
      return;
    }
    setLastPriceColor(resolveLastPriceAxisColor(latestPoint.close, latestPoint.open));
    setLastPriceText(formatLayoutPrice(latestPoint.close));
  }, [displayData, latestPoint, updateOhlcFromPoint]);

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
      setLastPriceY(Number.isFinite(y) ? Number(y) : null);
    } catch {
      setLastPriceY(null);
    }
  }, []);

  const handleViewportChange = useCallback((viewport: {
    startTime: string;
    endTime: string;
    yScale: number;
    isYManual: boolean;
  }) => {
    onViewportChange?.(cell.chartId, viewport);
  }, [cell.chartId, onViewportChange]);

  const handleChartVisualReady = useCallback(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return;
    setHasPaintedCandles(true);
    if (reportedChartRef.current !== chart) {
      reportedChartRef.current = chart;
      onChartReady(cell.chartId, chart);
      setChartReadyVersion((version) => version + 1);
    }
    window.requestAnimationFrame(updateLastPriceBadgePosition);
  }, [cell.chartId, onChartReady, updateLastPriceBadgePosition]);

  useEChartsRenderer({
    stockChartRef: canvasRef,
    layersStackRef,
    chartInstanceRef,
    chartData: displayData,
    chartConfig: peerChartConfig,
    advancedIndicators: indicatorSnapshot.advanced,
    indicatorPeriods: indicatorSnapshot.periods,
    bollingerSettings: indicatorSnapshot.bollinger,
    chartAppearance: peerChartAppearance,
    uiState: peerUiState,
    displaySymbol: cell.symbol,
    marketLabel: cell.exchange,
    hideChartTitle: true,
    legendLayoutMode: isCompactMeta ? "peer-compact" : "peer-stacked",
    reserveLastPriceAxisBadge: isActive,
    lastZoomRangeRef,
    lastPriceAxisValue: latestPoint?.close,
    isMainChartVisible: true,
    isChartLoading: loadStatus === "loading",
    hiddenObjectIds,
    onChartVisualReady: handleChartVisualReady,
    onViewportChange: handleViewportChange,
    onHistoryBoundaryRequest,
  });

  useEffect(() => () => {
    reportedChartRef.current = null;
    onChartDispose(cell.chartId);
  }, [cell.chartId, onChartDispose]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed() || chartReadyVersion === 0) return;

    const zr = chart.getZr();
    let axisCategories = readPrimaryXAxisCategories(chart);
    let lastHoverIndex: number | null = null;

    const refreshAxisCategories = () => {
      axisCategories = readPrimaryXAxisCategories(chart);
      updateLastPriceBadgePosition();
    };
    const updateAtIndex = (index: number | null) => {
      const current = displayDataRef.current;
      if (index === null || index < 0 || index >= current.length || index === lastHoverIndex) return;
      lastHoverIndex = index;
      updateOhlcFromPoint(current[index], current[index - 1]);
    };
    const resetToLatest = () => {
      lastHoverIndex = null;
      const current = displayDataRef.current;
      const latestIndex = current.length - 1;
      updateOhlcFromPoint(current[latestIndex], current[latestIndex - 1]);
    };
    const handleAxisPointer = (...args: unknown[]) => {
      const payload = args[0];
      if (!isAxisPointerPayload(payload)) return;
      updateAtIndex(resolveAxisPointerIndex(payload, displayDataRef.current, axisCategories));
    };
    const handleCanvasMouseMove = (payload: ZrMouseMovePayload) => {
      updateAtIndex(resolvePixelPointerIndex(chart, payload, displayDataRef.current, axisCategories));
    };

    chart.on("updateAxisPointer", handleAxisPointer);
    chart.on("globalout", resetToLatest);
    chart.on("finished", refreshAxisCategories);
    zr.on("mousemove", handleCanvasMouseMove);
    refreshAxisCategories();

    return () => {
      if (chart.isDisposed()) return;
      chart.off("updateAxisPointer", handleAxisPointer);
      chart.off("globalout", resetToLatest);
      chart.off("finished", refreshAxisCategories);
      zr.off("mousemove", handleCanvasMouseMove);
    };
  }, [chartReadyVersion, updateLastPriceBadgePosition, updateOhlcFromPoint]);

  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    let resizeFrameId: number | null = null;
    const updateGeometryDensity = (width: number, height: number) => {
      const nextCompact = width <= 460 || height <= 360;
      setIsGeometryCompactMeta((current) => current === nextCompact ? current : nextCompact);
    };
    updateGeometryDensity(canvasEl.clientWidth, canvasEl.clientHeight);
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) updateGeometryDensity(entry.contentRect.width, entry.contentRect.height);
      if (resizeFrameId !== null) return;
      resizeFrameId = window.requestAnimationFrame(() => {
        resizeFrameId = null;
        updateLastPriceBadgePosition();
      });
    });
    resizeObserver.observe(canvasEl);
    return () => {
      resizeObserver.disconnect();
      if (resizeFrameId !== null) window.cancelAnimationFrame(resizeFrameId);
    };
  }, [updateLastPriceBadgePosition]);

  const handleHeaderClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    onHeaderClick();
  };
  const handleHeaderKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.stopPropagation();
    event.preventDefault();
    onHeaderClick();
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
  const intradayIntervalLabel: Partial<Record<string, string>> = {
    "1m": "1 min",
    "5m": "5 min",
    "15m": "15 min",
    "30m": "30 min",
    "1H": "1 h",
    "4H": "4 h",
  };
  const formattedIntradayInterval = intradayIntervalLabel[cell.interval];
  const isIntradayEmpty = loadStatus === "empty" && Boolean(formattedIntradayInterval);
  const peerEmptyLabel = loadStatus === "failed"
    ? "Impossible de charger les cotations"
    : isIntradayEmpty
      ? "Historique intraday indisponible"
      : "Historique de cotation indisponible";
  const peerEmptyDetail = isIntradayEmpty
    ? `Aucune bougie ${formattedIntradayInterval} n’est disponible pour ${displaySymbol}.`
    : `${displaySymbol} · ${cell.interval}`;

  return (
    <div
      ref={containerRef}
      className={`gp-peer-chart${isActive ? " is-active" : ""}${isCompactMeta ? " is-meta-compact" : ""}`}
      data-chart-activity={isActive ? "active" : "inactive"}
      data-chart-meta-density={isCompactMeta ? "compact" : "stacked"}
      onClick={hasSelectedSymbol ? onActivate : onHeaderClick}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        if (hasSelectedSymbol) onActivate();
        else onHeaderClick();
      }}
      aria-label={hasSelectedSymbol
        ? `Activer le graphique secondaire de ${displaySymbol}`
        : `Choisir un titre · ${cell.exchange || "N/D"}`}
    >
      <div className="gp-peer-chart__header" data-panel-drag-surface="true">
        <span
          className="gp-peer-chart__symbol-area gp-multi-chart-cell--interactive-header"
          onClick={handleHeaderClick}
          onKeyDown={handleHeaderKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`Modifier le symbole ${displaySymbol}`}
        >
          <strong className="gp-peer-chart__symbol">{displaySymbol}</strong>
          <span className="gp-peer-chart__interval">{cell.exchange || "N/D"}</span>
          <span className="gp-peer-chart__interval">{cell.interval}</span>
          {isActive && <em className="gp-peer-chart__active-badge">Active</em>}
          <i className="bi bi-search gp-peer-chart__search-icon" aria-hidden="true" />
        </span>

        {headerActions}
      </div>

      <div ref={layersStackRef} className="gp-peer-chart__canvas" data-interaction-scope={`peer:${cell.chartId}`}>
        <div className="gp-chart-world-map gp-peer-chart__world-map" aria-hidden="true" />
        <div
          ref={canvasRef}
          className="gp-peer-chart__echart"
          aria-hidden={shouldShowPeerLoader || shouldShowEmptyState || shouldShowSelectionState}
        />
        {latestPoint && (
          <div className="gp-peer-chart__ohlc-overlay" data-panel-ohlc-overlay="true" aria-hidden="true">
            {peerLogoUrl ? (
              <img
                src={peerLogoUrl}
                alt=""
                draggable={false}
                width={18}
                height={18}
                style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 4, flexShrink: 0, marginRight: 2 }}
              />
            ) : null}
            <span>O<span className="gp-peer-chart__ohlc-val">{ohlc.open}</span></span>
            <span>H<span className="gp-peer-chart__ohlc-val">{ohlc.high}</span></span>
            <span>L<span className="gp-peer-chart__ohlc-val">{ohlc.low}</span></span>
            <span>C<span className="gp-peer-chart__ohlc-val" style={{ color: ohlcColor }}>{ohlc.close}</span></span>
            <span className="gp-peer-chart__ohlc-change" style={{ color: ohlcColor }}>{ohlc.changePercent}</span>
          </div>
        )}
        {interactionOverlay}
        {hasRenderableCandles && (
          <TimeAxisControls
            chartInstanceRef={chartInstanceRef}
            className="gp-peer-chart__time-axis-controls"
          />
        )}
        {shouldShowPeerLoader && (
          <div className="gp-peer-chart__loading" aria-live="polite">
            <span className="gp-mini-data-spinner" aria-hidden="true" />
            <strong>Chargement des cotations</strong>
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
            <em>{peerEmptyDetail}</em>
          </div>
        )}
        {!isActive && lastPriceY !== null && hasPaintedCandles && !shouldShowPeerLoader && !shouldShowEmptyState && (
          <div
            className="gp-peer-chart__last-badge"
            style={{ top: `${lastPriceY}px`, backgroundColor: lastPriceColor }}
          >
            {lastPriceText}
          </div>
        )}
      </div>
    </div>
  );
};
