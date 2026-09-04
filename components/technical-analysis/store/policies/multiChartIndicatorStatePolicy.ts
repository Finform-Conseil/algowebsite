import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import {
  cloneMultiChartIndicatorSnapshot,
  type CompleteMultiChartLayoutCell,
  type MultiChartIndicatorSnapshot,
} from "../../config/layout/multiChartCellState";
import { initialState } from "../initialState";

const cloneSnapshot = (snapshot: MultiChartIndicatorSnapshot): MultiChartIndicatorSnapshot => {
  const cloned = cloneMultiChartIndicatorSnapshot(snapshot);
  if (!cloned) throw new Error("Invalid multi-chart indicator snapshot");
  return cloned;
};

export const createMultiChartIndicatorSnapshot = (
  state: Pick<TechnicalAnalysisState, "chartConfig" | "advancedIndicators" | "indicatorPeriods" | "bollingerSettings" | "ui">,
): MultiChartIndicatorSnapshot => cloneSnapshot({
  chart: state.chartConfig.indicators,
  advanced: state.advancedIndicators,
  periods: state.indicatorPeriods,
  bollinger: state.bollingerSettings,
  ui: {
    movingAverageTrendSignals: state.ui.movingAverageTrendSignals,
    priceVsSmaMetrics: state.ui.priceVsSmaMetrics,
    priceVsEmaMetrics: state.ui.priceVsEmaMetrics,
  },
});

export const createDefaultMultiChartIndicatorSnapshot = (
  cell: Pick<CompleteMultiChartLayoutCell, "indicators" | "sourceKind">,
): MultiChartIndicatorSnapshot => {
  const snapshot = createMultiChartIndicatorSnapshot(initialState);
  const indicatorIds = new Set(cell.indicators);

  snapshot.chart.sma = indicatorIds.has("sma");
  snapshot.chart.ema = indicatorIds.has("ema");
  snapshot.chart.volume = cell.sourceKind === "equity" && indicatorIds.has("volume");

  (Object.keys(snapshot.advanced) as Array<keyof typeof snapshot.advanced>).forEach((key) => {
    snapshot.advanced[key] = indicatorIds.has(key);
  });

  return snapshot;
};

export const applyMultiChartIndicatorSnapshot = (
  state: TechnicalAnalysisState,
  snapshot: MultiChartIndicatorSnapshot,
): void => {
  const next = cloneSnapshot(snapshot);
  state.chartConfig.indicators = next.chart;
  state.advancedIndicators = next.advanced;
  state.indicatorPeriods = next.periods;
  state.bollingerSettings = next.bollinger;
  state.ui.movingAverageTrendSignals = next.ui.movingAverageTrendSignals;
  state.ui.priceVsSmaMetrics = next.ui.priceVsSmaMetrics;
  state.ui.priceVsEmaMetrics = next.ui.priceVsEmaMetrics;
  // Deliberately do not mutate chartAppearance.showVolume here. Attachment and
  // output visibility are orthogonal; panel appearance is restored separately.
};

export const collectMultiChartIndicatorIds = (
  snapshot: MultiChartIndicatorSnapshot,
): string[] => {
  const ids: string[] = [];
  if (snapshot.chart.sma) ids.push("sma");
  if (snapshot.chart.ema) ids.push("ema");
  if (snapshot.chart.volume) ids.push("volume");
  Object.entries(snapshot.advanced).forEach(([key, enabled]) => {
    if (enabled) ids.push(key);
  });
  return ids;
};

export const setCellIndicatorSnapshot = (
  cell: CompleteMultiChartLayoutCell,
  snapshot: MultiChartIndicatorSnapshot,
): MultiChartIndicatorSnapshot => {
  const next = cloneSnapshot(snapshot);
  next.chart.volume = cell.sourceKind === "equity" && next.chart.volume;
  cell.indicatorState = cloneSnapshot(next);
  cell.indicators = collectMultiChartIndicatorIds(next);
  return next;
};

export const setCellIndicatorIds = (
  cell: CompleteMultiChartLayoutCell,
  indicatorIds: readonly string[],
): MultiChartIndicatorSnapshot => {
  const snapshot = cell.indicatorState
    ? cloneSnapshot(cell.indicatorState)
    : createDefaultMultiChartIndicatorSnapshot(cell);
  const ids = new Set(indicatorIds);

  snapshot.chart.sma = ids.has("sma");
  snapshot.chart.ema = ids.has("ema");
  const wasVolumeAttached = snapshot.chart.volume;
  snapshot.chart.volume = ids.has("volume");
  if (snapshot.chart.volume && !wasVolumeAttached) snapshot.chart.volumeVisible = true;
  (Object.keys(snapshot.advanced) as Array<keyof typeof snapshot.advanced>).forEach((key) => {
    snapshot.advanced[key] = ids.has(key);
  });

  return setCellIndicatorSnapshot(cell, snapshot);
};

export const syncActiveCellIndicatorSnapshot = (
  state: TechnicalAnalysisState,
): MultiChartIndicatorSnapshot | null => {
  const layout = state.ui.multiChartLayout;
  const active = (layout.charts as CompleteMultiChartLayoutCell[]).find(
    (cell) => cell.chartId === layout.activeChartId && Boolean(cell.symbol?.trim()),
  );
  if (!active) return null;

  const snapshot = createMultiChartIndicatorSnapshot(state);
  return setCellIndicatorSnapshot(active, snapshot);
};

export const restoreCellIndicatorSnapshot = (
  state: TechnicalAnalysisState,
  cell: CompleteMultiChartLayoutCell,
): void => {
  const snapshot = cell.indicatorState
    ? cloneSnapshot(cell.indicatorState)
    : createDefaultMultiChartIndicatorSnapshot(cell);
  const restored = setCellIndicatorSnapshot(cell, snapshot);
  applyMultiChartIndicatorSnapshot(state, restored);
};
