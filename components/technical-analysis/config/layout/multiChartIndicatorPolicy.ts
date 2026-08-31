import type { MultiChartIndicatorSnapshot } from "./multiChartCellState";

export const DEFAULT_MULTI_CHART_INDICATORS = Object.freeze(["volume"] as const);

export const createDefaultMultiChartIndicators = (): string[] => [
  ...DEFAULT_MULTI_CHART_INDICATORS,
];

/**
 * Entering multi-chart is a new panel workspace, not a clone of the single-chart
 * indicator defaults. SMA used to be enabled implicitly on chart_1; strip that
 * implicit default while preserving every other explicit indicator choice.
 * Once already in multi-chart, cell indicators are preserved unchanged.
 */
export const prepareIndicatorsForMultiChartEntry = (
  indicators: readonly string[] | undefined,
): string[] => (indicators ?? []).filter((indicator) => indicator !== "sma");

export const prepareIndicatorSnapshotForMultiChartEntry = (
  snapshot: MultiChartIndicatorSnapshot | null | undefined,
): MultiChartIndicatorSnapshot | null => snapshot
  ? {
      ...snapshot,
      chart: {
        ...snapshot.chart,
        sma: false,
      },
    }
  : null;
