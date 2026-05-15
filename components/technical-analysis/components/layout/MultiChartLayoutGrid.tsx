"use client";

import React, { ReactNode, useMemo } from "react";
import clsx from "clsx";
import type { MultiChartLayoutCell, MultiChartLayoutState } from "../../config/TechnicalAnalysisTypes";
import { getLayoutDefinition } from "../../config/multiChartLayout";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

interface MultiChartLayoutGridProps {
  layout: MultiChartLayoutState;
  marketData: Record<string, ChartDataPoint[]>;
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

const buildSparklinePoints = (data: ChartDataPoint[]): string => {
  const closes = data
    .slice(-90)
    .map((point) => point.close)
    .filter((value) => Number.isFinite(value) && value > 0);
  if (closes.length < 2) return "";

  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;

  return closes
    .map((value, index) => {
      const x = (index / (closes.length - 1)) * 100;
      const y = 36 - ((value - min) / span) * 32;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
};

const SecondaryChartCell: React.FC<{
  cell: MultiChartLayoutCell;
  data: ChartDataPoint[];
  onActivate: () => void;
}> = ({ cell, data, onActivate }) => {
  const stats = useMemo(() => getSeriesStats(data), [data]);
  const sparkline = useMemo(() => buildSparklinePoints(data), [data]);
  const isPositive = (stats?.changePercent ?? 0) >= 0;

  return (
    <button className="gp-multi-chart-cell gp-multi-chart-cell--secondary" onClick={onActivate} title={`Activer ${cell.symbol}`}>
      <span className="gp-multi-chart-cell__header">
        <strong>{cell.symbol}</strong>
        <span>{cell.interval}</span>
      </span>

      {stats && sparkline ? (
        <>
          <svg className="gp-multi-chart-cell__sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
            <polyline points={sparkline} className={isPositive ? "is-positive" : "is-negative"} />
          </svg>
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
      ) : (
        <span className="gp-multi-chart-cell__empty">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          No data
        </span>
      )}
    </button>
  );
};

export const MultiChartLayoutGrid: React.FC<MultiChartLayoutGridProps> = ({
  layout,
  marketData,
  children,
  onActivateChart,
}) => {
  const definition = getLayoutDefinition(layout.layoutId);

  if (!layout.isEnabled || layout.charts.length <= 1) {
    return <>{children}</>;
  }

  return (
    <div className={clsx("gp-multi-chart-grid", definition.cssClass)}>
      {layout.charts.map((cell) => {
        const isActive = cell.chartId === layout.activeChartId;
        if (isActive) {
          return (
            <div key={cell.chartId} className="gp-multi-chart-cell gp-multi-chart-cell--active">
              <div className="gp-multi-chart-cell__active-header">
                <strong>{cell.symbol}</strong>
                <span>{cell.interval}</span>
                <em>Active</em>
              </div>
              {children}
            </div>
          );
        }

        return (
          <SecondaryChartCell
            key={cell.chartId}
            cell={cell}
            data={marketData[cell.symbol] ?? []}
            onActivate={() => onActivateChart(cell.chartId)}
          />
        );
      })}
    </div>
  );
};
