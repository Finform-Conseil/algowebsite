"use client";

import React, { ReactNode, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import type { UiState } from "../../config/state/uiStateTypes";
import { getLayoutDefinition } from "../../config/layout/multiChartLayouts";
import { createTimeframeMarketDataCacheKey, type TimeframeDataSourceKind } from "../../config/market/timeframeCatalog";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
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
import { getRenderableOhlcvSeries } from "./layoutChartData";

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

interface MultiChartLayoutGridProps {
  layout: MultiChartLayoutState;
  marketData: Record<string, ChartDataPoint[]>;
  dataLoadState: ComparisonLoadState;
  dataSourceByKey?: Record<string, TimeframeDataSourceKind | "unknown">;
  dataMode: "mock" | "real";
  activeChartInstanceRef: React.MutableRefObject<EChartsInstance | null>;
  chartAppearance: ChartAppearance;
  uiState: UiState;
  hiddenObjectIds?: Record<string, boolean>;
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
  chartAppearance,
  uiState,
  hiddenObjectIds = {},
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
  // TradingView-like multi-chart contract: every panel owns one persistent chart
  // instance and one immutable dataset. Activating a panel only changes which
  // instance is considered active; no canvas is moved or reparented.
  const isMultiChartMode = layout.isEnabled && layout.charts.length > 1;
  const renderedCharts = isMultiChartMode ? visibleCharts : visibleCharts.slice(0, 1);
  const [secondaryChartsById, setSecondaryChartsById] = useState<Record<string, EChartsInstance>>({});
  const activePeerChartRef = useRef<EChartsInstance | null>(null);

  const getCellCacheKey = useCallback((cell: MultiChartLayoutState["charts"][number]): string => {
    const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
    return createTimeframeMarketDataCacheKey(
      cell.exchange,
      cell.symbol,
      cell.interval,
      completeCell.sourceKind ?? "equity",
      completeCell.sourceId,
    );
  }, []);

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

  const activeDisplayCell = layout.charts.find((cell) => cell.chartId === effectiveActiveChartId);
  const activePeerData = useMemo(() => {
    if (!activeDisplayCell) return [];
    return getRenderableOhlcvSeries(marketData[getCellCacheKey(activeDisplayCell)] ?? []);
  }, [activeDisplayCell, getCellCacheKey, marketData]);

  useLayoutEffect(() => {
    if (!isMultiChartMode) {
      activePeerChartRef.current = null;
      return;
    }

    const activePeer = secondaryChartsById[effectiveActiveChartId] ?? null;
    activePeerChartRef.current = activePeer;
    activeChartInstanceRef.current = activePeer;

    return () => {
      if (activePeerChartRef.current === activePeer) activePeerChartRef.current = null;
      if (activeChartInstanceRef.current === activePeer) activeChartInstanceRef.current = null;
    };
  }, [activeChartInstanceRef, effectiveActiveChartId, isMultiChartMode, secondaryChartsById]);

  const secondaryCharts = useMemo<MultiChartSyncPeer[]>(() => {
    const result: MultiChartSyncPeer[] = [];
    for (const cell of layout.charts) {
      if (cell.chartId === effectiveActiveChartId) continue;
      const chart = secondaryChartsById[cell.chartId];
      if (!chart) continue;
      result.push({
        chartId: cell.chartId,
        chart,
        data: getRenderableOhlcvSeries(marketData[getCellCacheKey(cell)] ?? []),
        interval: cell.interval,
      });
    }
    return result;
  }, [effectiveActiveChartId, getCellCacheKey, layout.charts, marketData, secondaryChartsById]);

  const persistCellViewport = useCallback((chartId: string, viewport: MultiChartViewportState) => {
    dispatch(updateLayoutChart({ chartId, viewport }));
  }, [dispatch]);

  useMultiChartSync({
    layout,
    activeChartInstanceRef: activePeerChartRef,
    activeChartData: activePeerData,
    secondaryCharts,
  });

  const requestTickerSelectionForCell = (chartId: string, symbol: string, exchange: string) => {
    if (!symbol.trim()) {
      onRequestMarketSelection(chartId);
      return;
    }
    onRequestTickerSelection(chartId, exchange);
  };

  const handleSecondaryHeaderClick = (chartId: string, symbol: string, exchange: string) => {
    requestTickerSelectionForCell(chartId, symbol, exchange);
  };

  const renderHeaderActions = (cell: MultiChartLayoutState["charts"][number]) => {
    const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
    const cellCacheKey = getCellCacheKey(cell);
    return (
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
  };

  // Single-chart mode keeps the full canonical engine (drawings, advanced studies,
  // replay, etc.). Multi-chart mode deliberately does not mount a second renderer
  // on top of a panel: each cell below is its sole price surface.
  if (!isMultiChartMode) return <>{children}</>;

  return (
    <div className={clsx("gp-multi-chart-grid", definition.cssClass, maximizedChartId && "is-maximized")}>
      {renderedCharts.map((cell) => {
        const isActive = cell.chartId === effectiveActiveChartId;
        const hasSelectedSymbol = cell.symbol.trim().length > 0;
        const cellCacheKey = getCellCacheKey(cell);
        const headerActions = renderHeaderActions(cell);

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
            key={`layout-slot:${cell.chartId}`}
            className={clsx("gp-multi-chart-slot", isActive && "is-active")}
            data-chart-id={cell.chartId}
          >
            {!hasSelectedSymbol ? (
              <div
                className="gp-multi-chart-cell gp-multi-chart-cell--secondary gp-multi-chart-cell--empty"
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
            ) : (
              <FullPeerChart
                cell={cell}
                data={marketData[cellCacheKey] ?? []}
                loadStatus={dataLoadState[cellCacheKey] ?? "idle"}
                dataMode={dataMode}
                chartAppearance={chartAppearance}
                uiState={uiState}
                hiddenObjectIds={hiddenObjectIds}
                headerActions={headerActions}
                isActive={isActive}
                interactionOverlay={isActive && secondaryChartsById[cell.chartId] ? children : null}
                onActivate={() => onActivateChart(cell.chartId)}
                onHeaderClick={() => handleSecondaryHeaderClick(cell.chartId, cell.symbol, cell.exchange)}
                onChartReady={handleChartReady}
                onChartDispose={handleChartDispose}
                onViewportChange={persistCellViewport}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
