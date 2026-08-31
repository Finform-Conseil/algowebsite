export type TickerContextSyncMode = "single-chart-mirrored" | "multi-chart-isolated";

/**
 * A multi-chart layout owns one independent symbol binding per cell.
 * The workspace-level TickerSelector context is therefore not allowed to
 * hydrate, clear, or overwrite those bindings. Single-chart mode keeps the
 * historical bidirectional context mirroring contract.
 */
export const resolveTickerContextSyncMode = (
  layoutEnabled: boolean,
  chartCount: number,
): TickerContextSyncMode => (
  layoutEnabled && Number.isFinite(chartCount) && chartCount > 1
    ? "multi-chart-isolated"
    : "single-chart-mirrored"
);

export const isMultiChartTickerContextIsolated = (
  layoutEnabled: boolean,
  chartCount: number,
): boolean => resolveTickerContextSyncMode(layoutEnabled, chartCount) === "multi-chart-isolated";
