"use client";

import React from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import type { MultiChartLayoutCell } from "../../config/layout/multiChartLayoutTypes";
import type { CompleteMultiChartLayoutCell } from "../../config/layout/multiChartCellState";
import type { ChartType } from "../../lib/chart-types/domain/types";
import { CHART_TYPE_REGISTRY } from "../../lib/chart-types/registry/chartTypeRegistry";
import { FloatingMenu } from "../common/primitives/FloatingMenu";
import { ChartTypeMenuContent } from "../toolbar/chart/ChartTypeMenuContent";
import { renderChartTypeIcon } from "../toolbar/chart/chartTypeIcons";
import {
  CHART_TIMEFRAMES,
  normalizeChartTimeframe,
} from "../../config/market/timeframeCatalog";

interface MultiChartCellControlsProps {
  cell: MultiChartLayoutCell;
  canDuplicate: boolean;
  isMaximized: boolean;
  onTimeframeChange: (timeframe: string) => void;
  onChartTypeChange: (chartType: ChartType) => void;
  onToggleIndicator: (indicator: "volume" | "sma") => void;
  onDuplicate: () => void;
  onClear: () => void;
  onToggleMaximize: () => void;
}

const stopPointerPropagation = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

export const MultiChartCellControls: React.FC<MultiChartCellControlsProps> = ({
  cell,
  canDuplicate,
  isMaximized,
  onTimeframeChange,
  onChartTypeChange,
  onToggleIndicator,
  onDuplicate,
  onClear,
  onToggleMaximize,
}) => {
  const chartTypeT = useTranslations("technicalAnalysis.chartTypes");
  const completeCell = cell as Partial<CompleteMultiChartLayoutCell>;
  const sourceKind = completeCell.sourceKind ?? "equity";
  const timeframe = normalizeChartTimeframe(completeCell.timeframe ?? cell.interval) ?? "1D";
  const chartType: ChartType = sourceKind === "index" ? "line" : (completeCell.chartType ?? "candles");
  const activeChartTypeEntry = CHART_TYPE_REGISTRY[chartType];
  const chartTypeButtonRef = React.useRef<HTMLButtonElement>(null);
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = React.useState(false);
  const [chartTypeAnchorRect, setChartTypeAnchorRect] = React.useState<DOMRect | null>(null);
  const indicators = new Set(cell.indicators ?? []);
  const hasVolume = sourceKind === "equity" && indicators.has("volume");
  const controlIdPrefix = `multi-chart-${cell.chartId.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

  const handleChartTypeMenuToggle = () => {
    if (sourceKind === "index") return;
    setChartTypeAnchorRect(chartTypeButtonRef.current?.getBoundingClientRect() ?? null);
    setIsChartTypeMenuOpen((open) => !open);
  };

  const handleChartTypeSelect = (nextChartType: ChartType) => {
    setIsChartTypeMenuOpen(false);
    onChartTypeChange(nextChartType);
  };

  return (
    <span className="gp-multi-chart-cell-controls" onClick={stopPointerPropagation} onPointerDown={stopPointerPropagation}>
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
      <button
        ref={chartTypeButtonRef}
        id={`${controlIdPrefix}-chart-type`}
        type="button"
        className="gp-multi-chart-cell-select gp-multi-chart-chart-type-trigger"
        disabled={sourceKind === "index"}
        title={sourceKind === "index"
          ? chartTypeT("indexLineOnly")
          : chartTypeT("panelTypeTitle", { label: activeChartTypeEntry.label })}
        aria-label={chartTypeT("panelTypeAria", { label: activeChartTypeEntry.label })}
        aria-haspopup="menu"
        aria-expanded={isChartTypeMenuOpen}
        onClick={handleChartTypeMenuToggle}
      >
        <span className="gp-multi-chart-chart-type-icon" aria-hidden="true">{renderChartTypeIcon(chartType)}</span>
        <span className="gp-multi-chart-chart-type-label">{activeChartTypeEntry.label}</span>
        <i className="bi bi-chevron-down gp-multi-chart-chart-type-chevron" aria-hidden="true" />
      </button>
      <FloatingMenu
        isOpen={isChartTypeMenuOpen}
        onClose={() => setIsChartTypeMenuOpen(false)}
        anchorRect={chartTypeAnchorRect}
        width={292}
        className="gp-chart-type-menu gp-multi-chart-type-menu"
        zIndex={6500}
      >
        <ChartTypeMenuContent activeChartType={chartType} onSelect={handleChartTypeSelect} />
      </FloatingMenu>
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
