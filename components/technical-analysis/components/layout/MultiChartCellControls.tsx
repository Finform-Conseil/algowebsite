"use client";

import React from "react";
import clsx from "clsx";
import type { MultiChartLayoutCell } from "../../config/layout/multiChartLayoutTypes";
import type { CompleteMultiChartLayoutCell } from "../../config/layout/multiChartCellState";
import {
  CHART_TIMEFRAMES,
  normalizeChartTimeframe,
  type TimeframeDataSourceKind,
} from "../../config/market/timeframeCatalog";

interface MultiChartCellControlsProps {
  cell: MultiChartLayoutCell;
  canDuplicate: boolean;
  isMaximized: boolean;
  dataSource?: TimeframeDataSourceKind | "unknown";
  onTimeframeChange: (timeframe: string) => void;
  onChartTypeChange: (chartType: "candles" | "line") => void;
  onToggleIndicator: (indicator: "volume" | "sma") => void;
  onDuplicate: () => void;
  onClear: () => void;
  onToggleMaximize: () => void;
}

const SOURCE_LABELS: Record<TimeframeDataSourceKind | "unknown", string> = {
  native: "API",
  aggregate: "Agrégé 1D",
  unavailable: "Indisponible",
  unknown: "",
};

const stopPointerPropagation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

export const MultiChartCellControls: React.FC<MultiChartCellControlsProps> = ({
  cell,
  canDuplicate,
  isMaximized,
  dataSource = "unknown",
  onTimeframeChange,
  onChartTypeChange,
  onToggleIndicator,
  onDuplicate,
  onClear,
  onToggleMaximize,
}) => {
  const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
  const sourceKind = completeCell.sourceKind ?? "equity";
  const timeframe = normalizeChartTimeframe(completeCell.timeframe ?? cell.interval) ?? "1D";
  const chartType = sourceKind === "index" ? "line" : (completeCell.chartType === "line" ? "line" : "candles");
  const sourceLabel = SOURCE_LABELS[dataSource];
  const indicators = new Set(cell.indicators ?? []);
  const hasVolume = sourceKind === "equity" && indicators.has("volume");
  const hasSma = indicators.has("sma");
  const controlIdPrefix = `multi-chart-${cell.chartId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  return (
    <span className="gp-multi-chart-cell-controls" onClick={stopPointerPropagation} onPointerDown={stopPointerPropagation}>
      {sourceLabel && (
        <span className={clsx("gp-multi-chart-source-badge", dataSource === "unavailable" && "is-unavailable")}>
          {sourceLabel}
        </span>
      )}
      <select
        id={`${controlIdPrefix}-timeframe`}
        name={`${controlIdPrefix}-timeframe`}
        className="gp-multi-chart-cell-select"
        value={timeframe}
        title="Intervalle du panneau"
        aria-label="Intervalle du panneau"
        onChange={(event) => onTimeframeChange(event.target.value)}
      >
        {CHART_TIMEFRAMES.map((entry) => (
          <option key={entry} value={entry}>{entry}</option>
        ))}
      </select>
      <select
        id={`${controlIdPrefix}-chart-type`}
        name={`${controlIdPrefix}-chart-type`}
        className="gp-multi-chart-cell-select"
        value={chartType}
        disabled={sourceKind === "index"}
        title={sourceKind === "index" ? "Les indices sont rendus en ligne" : "Type de graphique du panneau"}
        aria-label="Type de graphique du panneau"
        onChange={(event) => onChartTypeChange(event.target.value === "line" ? "line" : "candles")}
      >
        <option value="candles">Bougies</option>
        <option value="line">Ligne</option>
      </select>
      <button
        type="button"
        className={clsx("gp-multi-chart-cell-action", "gp-multi-chart-indicator-toggle", hasVolume && "is-active")}
        disabled={sourceKind === "index"}
        title={sourceKind === "index" ? "Volume indisponible pour un indice close-only" : "Afficher ou masquer le volume de ce panneau"}
        aria-label="Basculer le volume du panneau"
        aria-pressed={hasVolume}
        onClick={() => onToggleIndicator("volume")}
      >
        VOL
      </button>
      <button
        type="button"
        className={clsx("gp-multi-chart-cell-action", "gp-multi-chart-indicator-toggle", hasSma && "is-active")}
        title="Afficher ou masquer la SMA 20 de ce panneau"
        aria-label="Basculer la SMA 20 du panneau"
        aria-pressed={hasSma}
        onClick={() => onToggleIndicator("sma")}
      >
        SMA
      </button>
      <button
        type="button"
        className="gp-multi-chart-cell-action"
        title={isMaximized ? "Restaurer la disposition" : "Maximiser le panneau"}
        aria-label={isMaximized ? "Restaurer la disposition" : "Maximiser le panneau"}
        onClick={onToggleMaximize}
      >
        <i className={clsx("bi", isMaximized ? "bi-fullscreen-exit" : "bi-arrows-fullscreen")} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="gp-multi-chart-cell-action"
        disabled={!canDuplicate}
        title={canDuplicate ? "Dupliquer vers une case vide" : "Aucune case vide disponible"}
        aria-label="Dupliquer le panneau"
        onClick={onDuplicate}
      >
        <i className="bi bi-copy" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="gp-multi-chart-cell-action is-danger"
        title="Vider le panneau"
        aria-label="Vider le panneau"
        onClick={onClear}
      >
        <i className="bi bi-x-lg" aria-hidden="true" />
      </button>
    </span>
  );
};
