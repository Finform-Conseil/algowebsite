import type { MultiChartLayoutState } from "./multiChartLayoutTypes";
import {
  completeMultiChartLayout,
  DEFAULT_MULTI_CHART_VIEWPORT,
  type CompleteMultiChartLayoutCell,
  type CompleteMultiChartLayoutState,
} from "./multiChartCellState";

/**
 * Structural layout changes are undoable; viewport navigation is not.
 * We exclude each cell viewport from the journal to avoid pan/zoom churn.
 */
export type ChartHistoryLayoutSnapshot = Omit<CompleteMultiChartLayoutState, "charts"> & {
  charts: Array<Omit<CompleteMultiChartLayoutCell, "viewport">>;
};

export const snapshotChartHistoryLayout = (layout: MultiChartLayoutState): ChartHistoryLayoutSnapshot => {
  const normalized = completeMultiChartLayout(layout);
  const cells: CompleteMultiChartLayoutCell[] = normalized.charts as CompleteMultiChartLayoutCell[];
  return {
    ...normalized,
    charts: cells.map((cell) => {
      const { viewport: _viewport, ...configurableCell } = cell;
      return configurableCell;
    }),
  };
};

export const restoreChartHistoryLayout = (
  saved: ChartHistoryLayoutSnapshot,
  current: MultiChartLayoutState,
): CompleteMultiChartLayoutState => {
  const currentCells = completeMultiChartLayout(current).charts as CompleteMultiChartLayoutCell[];
  const viewportById = new Map(currentCells.map((cell) => [cell.chartId, cell.viewport]));
  return completeMultiChartLayout({
    ...saved,
    charts: saved.charts.map((cell) => ({
      ...cell,
      viewport: viewportById.get(cell.chartId) ?? { ...DEFAULT_MULTI_CHART_VIEWPORT },
    })),
  });
};
