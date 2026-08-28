"use client";

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import { useDispatch } from "react-redux";
import type { MultiChartLayoutState } from "../../config/layout/multiChartLayoutTypes";
import type {
  CompleteMultiChartLayoutCell,
  CompleteMultiChartLayoutState,
  MultiChartViewportState,
} from "../../config/layout/multiChartCellState";
import type { ChartAppearance } from "../../config/state/chartStateTypes";
import { getLayoutDefinition } from "../../config/layout/multiChartLayouts";
import { createTimeframeMarketDataCacheKey, type TimeframeDataSourceKind } from "../../config/market/timeframeCatalog";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  isAxisPointerPayload,
  readPrimaryXAxisCategories,
  resolveAxisPointerIndex,
  resolvePixelPointerIndex,
  type AxisCategories,
  type ZrMouseMovePayload,
} from "../../lib/chart/pointerCandleIndex";
import type { EChartsInstance } from "../../lib/types/echarts";
import type { ComparisonLoadState } from "../../hooks/MarketData/useMarketData";
import {
  useMultiChartSync,
  type MultiChartSyncPeer,
} from "../../hooks/useMultiChartSync";
import {
  clearLayoutChart,
  duplicateLayoutChart,
  toggleMaximizeLayoutChart,
  updateLayoutChart,
} from "../../store/technicalAnalysisSlice";
import type { FullPeerChartProps } from "./FullPeerChart";
import { MultiChartCellControls } from "./MultiChartCellControls";
import type { SecondaryChartCellProps, MiniChartRenderMode } from "./MiniChartCanvas";
import {
  createEmptyLayoutOhlcState,
  createLayoutOhlcState,
  getLayoutPriceChangeColor,
  getRenderableOhlcvSeries,
  type LayoutOhlcState,
} from "./layoutChartData";

const PeerChartFallback = () => (
  <div className="gp-multi-chart-cell gp-multi-chart-cell--secondary">
    <span className="gp-multi-chart-cell__loading" aria-live="polite">
      <span className="gp-mini-data-spinner" aria-hidden="true" />
      <strong>Chargement du graphique</strong>
      <em>Préparation du panneau</em>
    </span>
  </div>
);

const FullPeerChart = dynamic<FullPeerChartProps>(
  () => import("./FullPeerChart").then((module) => module.FullPeerChart),
  { ssr: false, loading: PeerChartFallback }
);

const SecondaryChartCell = dynamic<SecondaryChartCellProps>(
  () => import("./MiniChartCanvas").then((module) => module.SecondaryChartCell),
  { ssr: false, loading: PeerChartFallback }
);

interface MultiChartLayoutGridProps {
  layout: MultiChartLayoutState;
  marketData: Record<string, ChartDataPoint[]>;
  dataLoadState: ComparisonLoadState;
  dataSourceByKey?: Record<string, TimeframeDataSourceKind | "unknown">;
  dataMode: "mock" | "real";
  activeChartInstanceRef: React.MutableRefObject<EChartsInstance | null>;
  activeChartData: ChartDataPoint[];
  activeInterval: string;
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">;
  children: ReactNode;
  onActivateChart: (chartId: string) => void;
  /** Open the canonical market directory for an empty cell. */
  onRequestMarketSelection: (chartId: string) => void;
  /** Route la cellule cible ET son exchange vers le sélecteur de titre en une seule intention. */
  onRequestTickerSelection: (chartId: string, exchange: string) => void;
}

export const MultiChartLayoutGrid: React.FC<MultiChartLayoutGridProps> = ({
  layout,
  marketData,
  dataLoadState,
  dataSourceByKey = {},
  dataMode,
  activeChartInstanceRef,
  activeChartData,
  activeInterval,
  chartAppearance,
  children,
  onActivateChart,
  onRequestMarketSelection,
  onRequestTickerSelection,
}) => {
  const dispatch = useDispatch();
  const definition = getLayoutDefinition(layout.layoutId);
  const completeLayout = layout as Partial<CompleteMultiChartLayoutState>;
  const maximizedChartId = completeLayout.maximizedChartId ?? null;
  const visibleCharts = maximizedChartId
    ? layout.charts.filter((cell) => cell.chartId === maximizedChartId)
    : layout.charts;
  const hasEmptySlot = layout.charts.some((cell) => !cell.symbol.trim());
  const effectiveActiveChartId = useMemo(() => {
    const requestedActive = layout.charts.find((cell) => cell.chartId === layout.activeChartId);
    if (requestedActive?.symbol.trim()) return requestedActive.chartId;
    return layout.charts.find((cell) => cell.symbol.trim())?.chartId ?? layout.activeChartId;
  }, [layout.activeChartId, layout.charts]);
  // Dense layouts may downgrade secondary peers for performance, but the active
  // chart must always remain the canonical interactive surface (zoom, pan,
  // drawings, overlays, indicators and keyboard/mouse interactions).
  const usesFullPeerChart = definition.chartCount <= 6;
  const secondaryRenderMode: MiniChartRenderMode = definition.chartCount <= 6 ? "ohlcv" : "sparkline";
  const [secondaryChartsById, setSecondaryChartsById] = useState<Record<string, EChartsInstance>>({});

  // Active chart OHLC dynamic hover state
  const [activeOhlc, setActiveOhlc] = useState<LayoutOhlcState>(createEmptyLayoutOhlcState());
  const [activeLastPriceColor, setActiveLastPriceColor] = useState<string>("#94a3b8");

  const activeFilteredData = useMemo(() => {
    return getRenderableOhlcvSeries(activeChartData);
  }, [activeChartData]);

  const activeLatestPoint = activeFilteredData[activeFilteredData.length - 1];

  const updateActiveOhlcFromPoint = useCallback((
    point: ChartDataPoint | undefined,
    previousPoint?: ChartDataPoint,
  ) => {
    if (!point) {
      setActiveOhlc(createEmptyLayoutOhlcState());
      setActiveLastPriceColor("#94a3b8");
      return;
    }
    setActiveOhlc(createLayoutOhlcState(point, previousPoint));
    setActiveLastPriceColor(getLayoutPriceChangeColor(
      point,
      previousPoint,
      chartAppearance.upColor,
      chartAppearance.downColor,
    ));
  }, [chartAppearance.downColor, chartAppearance.upColor]);

  // Keep the cell header on the same financial convention as the canonical chart:
  // daily change is latest close versus previous close, never close versus candle open.
  useEffect(() => {
    updateActiveOhlcFromPoint(
      activeLatestPoint,
      activeFilteredData[activeFilteredData.length - 2],
    );
  }, [activeFilteredData, activeLatestPoint, updateActiveOhlcFromPoint]);

  // Keep the active header driven by the same pointer source as the chart itself.
  // updateAxisPointer is useful when ECharts emits it, while ZRender mousemove is
  // the authoritative fallback when tooltip/axisPointer is disabled.
  useEffect(() => {
    let boundChart: EChartsInstance | null = null;
    let detachPointerListeners: (() => void) | null = null;
    let axisCategories: AxisCategories = [];
    let lastHoverIndex: number | null = null;

    const updateActiveOhlcAtIndex = (targetIndex: number | null) => {
      if (targetIndex === null || targetIndex < 0 || targetIndex >= activeFilteredData.length) return;
      if (targetIndex === lastHoverIndex) return;

      lastHoverIndex = targetIndex;
      updateActiveOhlcFromPoint(
        activeFilteredData[targetIndex],
        activeFilteredData[targetIndex - 1],
      );
    };

    const resetToLatestPoint = () => {
      lastHoverIndex = null;
      updateActiveOhlcFromPoint(
        activeLatestPoint,
        activeFilteredData[activeFilteredData.length - 2],
      );
    };

    const unbindChart = () => {
      detachPointerListeners?.();
      detachPointerListeners = null;
      boundChart = null;
      axisCategories = [];
    };

    const bindChart = (chart: EChartsInstance) => {
      const zr = chart.getZr();

      const onAxisPointerUpdate = (...args: unknown[]) => {
        const params = args[0];
        if (!isAxisPointerPayload(params)) return;
        updateActiveOhlcAtIndex(resolveAxisPointerIndex(params, activeFilteredData, axisCategories));
      };

      const onCanvasMouseMove = (payload: ZrMouseMovePayload) => {
        updateActiveOhlcAtIndex(resolvePixelPointerIndex(chart, payload, activeFilteredData, axisCategories));
      };

      axisCategories = readPrimaryXAxisCategories(chart);
      chart.on("updateAxisPointer", onAxisPointerUpdate);
      chart.on("globalout", resetToLatestPoint);
      zr.on("mousemove", onCanvasMouseMove);

      boundChart = chart;
      detachPointerListeners = () => {
        if (chart.isDisposed()) return;
        chart.off("updateAxisPointer", onAxisPointerUpdate);
        chart.off("globalout", resetToLatestPoint);
        zr.off("mousemove", onCanvasMouseMove);
      };
    };

    const syncChartBinding = () => {
      const nextChart = activeChartInstanceRef.current;
      if (!nextChart || nextChart.isDisposed()) {
        unbindChart();
        return;
      }
      if (nextChart === boundChart) return;

      unbindChart();
      bindChart(nextChart);
    };

    syncChartBinding();
    const bindingIntervalId = window.setInterval(syncChartBinding, 250);

    return () => {
      window.clearInterval(bindingIntervalId);
      unbindChart();
    };
  }, [
    activeChartInstanceRef,
    activeFilteredData,
    activeLatestPoint,
    updateActiveOhlcFromPoint,
    layout.activeChartId,
  ]);

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

  const activeBounds = useMemo(() => {
    if (!activeChartData || activeChartData.length === 0) return undefined;
    return {
      start: activeChartData[0].time,
      end: activeChartData[activeChartData.length - 1].time,
    };
  }, [activeChartData]);
  const synchronizedDateRangeBounds = layout.sync.dateRange ? activeBounds : undefined;

  const secondaryCharts = useMemo<MultiChartSyncPeer[]>(
    () => {
      const result: MultiChartSyncPeer[] = [];
      for (const cell of layout.charts) {
        if (cell.chartId === layout.activeChartId) continue;
        const chart = secondaryChartsById[cell.chartId];
        if (!chart) continue;
        const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
        const syncCacheKey = createTimeframeMarketDataCacheKey(
          cell.exchange,
          cell.symbol,
          cell.interval,
          completeCell.sourceKind ?? "equity",
          completeCell.sourceId,
        );
        result.push({
          chartId: cell.chartId,
          chart,
          data: getRenderableOhlcvSeries(marketData[syncCacheKey] ?? []),
          interval: cell.interval,
        });
      }
      return result;
    },
    [layout.activeChartId, layout.charts, marketData, secondaryChartsById]
  );

  const persistCellViewport = useCallback((chartId: string, viewport: MultiChartViewportState) => {
    dispatch(updateLayoutChart({ chartId, viewport }));
  }, [dispatch]);

  useMultiChartSync({
    layout,
    activeChartInstanceRef,
    activeChartData,
    secondaryCharts,
  });

  if (!layout.isEnabled || layout.charts.length <= 1) {
    return <>{children}</>;
  }

  const requestTickerSelectionForCell = (chartId: string, symbol: string, exchange: string) => {
    if (!symbol.trim()) {
      onRequestMarketSelection(chartId);
      return;
    }
    onRequestTickerSelection(chartId, exchange);
  };

  const handleActiveHeaderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    const activeCell = layout.charts.find((cell) => cell.chartId === layout.activeChartId);
    if (activeCell) requestTickerSelectionForCell(activeCell.chartId, activeCell.symbol, activeCell.exchange);
  };

  const handleActiveHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.stopPropagation();
      event.preventDefault();
      const activeCell = layout.charts.find((cell) => cell.chartId === layout.activeChartId);
      if (activeCell) requestTickerSelectionForCell(activeCell.chartId, activeCell.symbol, activeCell.exchange);
    }
  };

  const handleSecondaryHeaderClick = (chartId: string, symbol: string, exchange: string) => {
    requestTickerSelectionForCell(chartId, symbol, exchange);
  };

  return (
    <div className={clsx("gp-multi-chart-grid", definition.cssClass, maximizedChartId && "is-maximized")}>
      {visibleCharts.map((cell) => {
        const isActive = cell.chartId === effectiveActiveChartId;
        const hasSelectedSymbol = cell.symbol.trim().length > 0;

        // An unbound slot is a lightweight layout placeholder, not the canonical
        // active chart. Clicking it starts the market-first binding workflow
        // without changing activeChartId or mounting the primary chart inside it.
        if (!hasSelectedSymbol) {
          const requestMarketSelection = (event: React.SyntheticEvent) => {
            event.preventDefault();
            event.stopPropagation();
            onRequestMarketSelection(cell.chartId);
          };
          const handleEmptyKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            requestMarketSelection(event);
          };

          return (
            <div
              key={cell.chartId}
              className={clsx(
                "gp-multi-chart-cell",
                "gp-multi-chart-cell--secondary",
                "gp-multi-chart-cell--empty",
              )}
              onClick={requestMarketSelection}
              onKeyDown={handleEmptyKeyDown}
              role="button"
              tabIndex={0}
              aria-label="Choisir une bourse puis un titre pour ce graphique"
            >
              <div className="gp-multi-chart-cell__active-header gp-multi-chart-cell--interactive-header">
                <strong>Choisir un titre</strong>
                <span>{cell.interval || "1D"}</span>
                <i className="bi bi-search" style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.7 }} aria-hidden="true" />
              </div>
              <div className="gp-peer-chart__empty-state" aria-live="polite">
                <strong>Aucun titre sélectionné</strong>
                <span className="gp-multi-chart-cell__empty-action">
                  Choisir une bourse et un titre
                  <i className="bi bi-search" aria-hidden="true" />
                </span>
              </div>
            </div>
          );
        }

        const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
        const cellCacheKey = createTimeframeMarketDataCacheKey(
          cell.exchange,
          cell.symbol,
          cell.interval,
          completeCell.sourceKind ?? "equity",
          completeCell.sourceId,
        );
        const headerActions = (
          <MultiChartCellControls
            cell={cell}
            canDuplicate={hasEmptySlot}
            isMaximized={maximizedChartId === cell.chartId}
            dataSource={dataSourceByKey[cellCacheKey] ?? completeCell.dataSource ?? "unknown"}
            onTimeframeChange={(timeframe) => dispatch(updateLayoutChart({ chartId: cell.chartId, timeframe }))}
            onChartTypeChange={(chartType) => dispatch(updateLayoutChart({ chartId: cell.chartId, chartType }))}
            onToggleIndicator={(indicator) => {
              const current = cell.indicators ?? [];
              const indicators = current.includes(indicator)
                ? current.filter((entry) => entry !== indicator)
                : [...current, indicator];
              dispatch(updateLayoutChart({ chartId: cell.chartId, indicators }));
            }}
            onDuplicate={() => dispatch(duplicateLayoutChart({ chartId: cell.chartId }))}
            onClear={() => dispatch(clearLayoutChart(cell.chartId))}
            onToggleMaximize={() => dispatch(toggleMaximizeLayoutChart(cell.chartId))}
          />
        );
        if (isActive) {
          const displaySymbol = cell.symbol;
          const displayInterval = activeInterval || cell.interval;
          return (
            <div
              key={cell.chartId}
              className="gp-multi-chart-cell gp-multi-chart-cell--active"
            >
              <div
                className="gp-multi-chart-cell__active-header gp-multi-chart-cell--interactive-header"
                onClick={handleActiveHeaderClick}
                onKeyDown={handleActiveHeaderKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Rechercher un titre pour remplacer ${displaySymbol}`}
              >
                <strong>{displaySymbol}</strong>
                <span>{cell.exchange || "N/D"}</span>
                <span>{displayInterval}</span>
                <em>Active</em>

                {activeLatestPoint && (
                  <div className="gp-peer-chart__ohlc">
                    <span>O<span className="gp-peer-chart__ohlc-val">{activeOhlc.open}</span></span>
                    <span>H<span className="gp-peer-chart__ohlc-val">{activeOhlc.high}</span></span>
                    <span>L<span className="gp-peer-chart__ohlc-val">{activeOhlc.low}</span></span>
                    <span>C<span className="gp-peer-chart__ohlc-val" style={{ color: activeLastPriceColor }}>{activeOhlc.close}</span></span>
                    <span style={{ color: activeLastPriceColor }}>{activeOhlc.changePercent}</span>
                  </div>
                )}

                <i className="bi bi-search" style={{ marginLeft: "auto", fontSize: "10px", opacity: 0.7 }} aria-hidden="true" />
                {headerActions}
              </div>
              {children}
            </div>
          );
        }

        if (usesFullPeerChart) {
          return (
            <FullPeerChart
              key={cell.chartId}
              cell={cell}
              data={marketData[cellCacheKey] ?? []}
              loadStatus={dataLoadState[cellCacheKey] ?? "idle"}
              dataMode={dataMode}
              chartAppearance={chartAppearance}
              activeBounds={synchronizedDateRangeBounds}
              headerActions={headerActions}
              onActivate={() => onActivateChart(cell.chartId)}
              onHeaderClick={() => handleSecondaryHeaderClick(cell.chartId, cell.symbol, cell.exchange)}
              onChartReady={handleChartReady}
              onChartDispose={handleChartDispose}
              onViewportChange={persistCellViewport}
            />
          );
        }

        return (
          <SecondaryChartCell
            key={cell.chartId}
            cell={cell}
            data={marketData[cellCacheKey] ?? []}
            loadStatus={dataLoadState[cellCacheKey] ?? "idle"}
            dataMode={dataMode}
            renderMode={secondaryRenderMode}
            chartAppearance={chartAppearance}
            activeBounds={activeBounds}
            headerActions={headerActions}
            onActivate={() => onActivateChart(cell.chartId)}
            onHeaderClick={() => handleSecondaryHeaderClick(cell.chartId, cell.symbol, cell.exchange)}
            onChartReady={handleChartReady}
            onChartDispose={handleChartDispose}
          />
        );
      })}
    </div>
  );
};
