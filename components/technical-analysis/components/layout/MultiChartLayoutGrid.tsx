"use client";

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { MultiChartLayoutCell, MultiChartLayoutState } from "../../config/layout/multiChartLayoutTypes";
import type { ChartAppearance } from "../../config/state/chartStateTypes";
import { getLayoutDefinition } from "../../config/layout/multiChartLayouts";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";
import type { ComparisonLoadState } from "../../hooks/MarketData/useMarketData";
import {
  useMultiChartSync,
  type MultiChartSyncPeer,
} from "../../hooks/useMultiChartSync";
import type { FullPeerChartProps } from "./FullPeerChart";
import type { ActiveChartPreviewProps, SecondaryChartCellProps, MiniChartRenderMode } from "./MiniChartCanvas";
import {
  createEmptyLayoutOhlcState,
  createLayoutOhlcState,
  getLayoutBullBearColor,
  getRenderableOhlcvSeries,
  type LayoutOhlcState,
} from "./layoutChartData";

const PeerChartFallback = () => (
  <div className="gp-multi-chart-cell gp-multi-chart-cell--secondary">
    <span className="gp-multi-chart-cell__loading" aria-live="polite">
      <span className="gp-mini-data-spinner" aria-hidden="true" />
      <strong>Loading chart</strong>
      <em>BRVM</em>
    </span>
  </div>
);

const ActivePreviewFallback = () => (
  <span className="gp-multi-chart-cell__loading" aria-live="polite">
    <span className="gp-mini-data-spinner" aria-hidden="true" />
    <strong>Loading preview</strong>
    <em>BRVM</em>
  </span>
);

const FullPeerChart = dynamic<FullPeerChartProps>(
  () => import("./FullPeerChart").then((module) => module.FullPeerChart),
  { ssr: false, loading: PeerChartFallback }
);

const ActiveChartPreview = dynamic<ActiveChartPreviewProps>(
  () => import("./MiniChartCanvas").then((module) => module.ActiveChartPreview),
  { ssr: false, loading: ActivePreviewFallback }
);

const SecondaryChartCell = dynamic<SecondaryChartCellProps>(
  () => import("./MiniChartCanvas").then((module) => module.SecondaryChartCell),
  { ssr: false, loading: PeerChartFallback }
);

interface MultiChartLayoutGridProps {
  layout: MultiChartLayoutState;
  marketData: Record<string, ChartDataPoint[]>;
  dataLoadState: ComparisonLoadState;
  dataMode: "mock" | "real";
  activeChartInstanceRef: React.MutableRefObject<EChartsInstance | null>;
  activeChartData: ChartDataPoint[];
  activeSymbol: string;
  activeInterval: string;
  chartAppearance: Pick<ChartAppearance, "upColor" | "downColor" | "volumeColorMode">;
  children: ReactNode;
  onActivateChart: (chartId: string) => void;
  /** [SCAR-MULTICHART-HEADER-CONTAMINATION FIX]
   * Appelé quand l'utilisateur clique le HEADER d'un chart secondaire pour éditer son ticker.
   * Utilise setEditChartTarget (routing-only) plutôt que setActiveLayoutChart (activation complète),
   * ce qui évite d'écraser chartConfig.symbol et de contaminer le TickerSelectorContext.
   */
  onEditChart: (chartId: string) => void;
  openTickerSelector: () => void;
}

export const MultiChartLayoutGrid: React.FC<MultiChartLayoutGridProps> = ({
  layout,
  marketData,
  dataLoadState,
  dataMode,
  activeChartInstanceRef,
  activeChartData,
  activeSymbol,
  activeInterval,
  chartAppearance,
  children,
  onActivateChart,
  onEditChart,
  openTickerSelector,
}) => {
  const definition = getLayoutDefinition(layout.layoutId);
  const usesActivePreview = definition.chartCount >= 8;
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

  const updateActiveOhlcFromPoint = useCallback((point: ChartDataPoint | undefined) => {
    if (!point) {
      setActiveOhlc(createEmptyLayoutOhlcState());
      setActiveLastPriceColor("#94a3b8");
      return;
    }
    setActiveOhlc(createLayoutOhlcState(point));
    setActiveLastPriceColor(getLayoutBullBearColor(point.close, point.open));
  }, []);

  // Sync to latest point when it changes (or when hover leaves)
  useEffect(() => {
    updateActiveOhlcFromPoint(activeLatestPoint);
  }, [activeLatestPoint, updateActiveOhlcFromPoint]);

  // High frequency active chart axis pointer interaction listener
  useEffect(() => {
    let cancelled = false;
    let attachFrameId: number | null = null;
    let detachCrosshair: (() => void) | null = null;

    const onAxisPointerUpdate = (params: any) => {
      if (!params || !params.axesInfo) return;
      const xInfo = params.axesInfo.find((info: any) => info.axisDim === "x" || info.axisIndex === 0);
      if (xInfo && xInfo.value !== undefined) {
        let targetIndex = -1;
        if (typeof xInfo.value === "string") {
          targetIndex = activeFilteredData.findIndex((p) => p.time === xInfo.value);
        } else if (typeof xInfo.value === "number") {
          targetIndex = xInfo.value;
        }
        if (targetIndex >= 0 && targetIndex < activeFilteredData.length) {
          updateActiveOhlcFromPoint(activeFilteredData[targetIndex]);
        }
      }
    };

    const onGlobalOut = () => {
      updateActiveOhlcFromPoint(activeLatestPoint);
    };

    const attachListeners = () => {
      if (cancelled) return;
      const chart = activeChartInstanceRef.current;
      if (!chart || chart.isDisposed()) {
        attachFrameId = window.requestAnimationFrame(attachListeners);
        return;
      }

      chart.on("updateAxisPointer", onAxisPointerUpdate);
      chart.on("globalout", onGlobalOut);

      detachCrosshair = () => {
        if (chart.isDisposed()) return;
        chart.off("updateAxisPointer", onAxisPointerUpdate);
        chart.off("globalout", onGlobalOut);
      };
    };

    attachListeners();

    return () => {
      cancelled = true;
      if (attachFrameId !== null) window.cancelAnimationFrame(attachFrameId);
      detachCrosshair?.();
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

  const secondaryCharts = useMemo<MultiChartSyncPeer[]>(
    () => {
      const result: MultiChartSyncPeer[] = [];
      for (const cell of layout.charts) {
        if (cell.chartId === layout.activeChartId) continue;
        const chart = secondaryChartsById[cell.chartId];
        if (!chart) continue;
        result.push({
          chartId: cell.chartId,
          chart,
          data: getRenderableOhlcvSeries(marketData[cell.symbol] ?? []),
          interval: cell.interval,
        });
      }
      return result;
    },
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

  const handleActiveHeaderClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.stopPropagation();
    openTickerSelector();
  };

  const handleActiveHeaderKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.stopPropagation();
      event.preventDefault();
      openTickerSelector();
    }
  };

  const handleSecondaryHeaderClick = (chartId: string) => {
    // [SCAR-MULTICHART-HEADER-CONTAMINATION FIX]
    // On utilise onEditChart (setEditChartTarget) et NON onActivateChart (setActiveLayoutChart).
    // setEditChartTarget route activeChartId vers le chart cible sans écraser chartConfig.symbol,
    // ce qui empêche le moteur de sync bidirectionnel de contaminer le TickerSelectorContext
    // avec le symbole du chart secondaire (ex: BOABF ne force plus chart1/BOAB à devenir BOABF).
    onEditChart(chartId);
    openTickerSelector();
  };

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
              <div
                className="gp-multi-chart-cell__active-header gp-multi-chart-cell--interactive-header"
                onClick={handleActiveHeaderClick}
                onKeyDown={handleActiveHeaderKeyDown}
                role="button"
                tabIndex={0}
                aria-label={`Rechercher un titre pour remplacer ${displaySymbol}`}
              >
                <strong>{displaySymbol}</strong>
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
              </div>
              {usesActivePreview ? (
                <>
                  <ActiveChartPreview
                    cell={cell}
                    data={activeChartData}
                    dataMode={dataMode}
                    displaySymbol={displaySymbol}
                    chartAppearance={chartAppearance}
                  />
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

        if (usesFullPeerChart) {
          return (
            <FullPeerChart
              key={cell.chartId}
              cell={cell}
              data={marketData[cell.symbol] ?? []}
              loadStatus={dataLoadState[cell.symbol] ?? "idle"}
              dataMode={dataMode}
              chartAppearance={chartAppearance}
              activeBounds={activeBounds}
              onActivate={() => onActivateChart(cell.chartId)}
              onHeaderClick={() => handleSecondaryHeaderClick(cell.chartId)}
              onChartReady={handleChartReady}
              onChartDispose={handleChartDispose}
            />
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
            chartAppearance={chartAppearance}
            activeBounds={activeBounds}
            onActivate={() => onActivateChart(cell.chartId)}
            onHeaderClick={() => handleSecondaryHeaderClick(cell.chartId)}
            onChartReady={handleChartReady}
            onChartDispose={handleChartDispose}
          />
        );
      })}
    </div>
  );
};
