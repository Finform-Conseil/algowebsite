export type ChartGridLayoutOption = Record<string, unknown>;

export const DEFAULT_CHART_TOP_MARGIN_PERCENT = 8;
export const DEFAULT_PANE_SIZING_BOTTOM_BUDGET_PERCENT = 5;
export const DEFAULT_SINGLE_LOWER_PANE_HEIGHT_PERCENT = 20;

export interface PriceVolumePaneLayoutOptions {
  left: number;
  right: number;
  showVolume: boolean;
  timeAxisHeightPx: number;
}

export interface PriceVolumePaneLayout {
  grids: ChartGridLayoutOption[];
  visibleTimeAxisIndex: number;
}

/**
 * Anchors the final Cartesian pane to a fixed-height time-axis lane.
 *
 * ECharts positions axis labels outside the grid. A percentage-based bottom
 * reserve therefore grows with viewport height and creates visible dead space.
 * The last pane is the only pane that owns the visible time axis, so it is the
 * only grid that should be bottom-anchored in pixels. `height: "auto"` ensures
 * `top + bottom` determine its size and also clears any previously merged
 * percentage height during hot updates/history-preserving setOption calls.
 */
export const anchorLastPaneToFixedTimeAxis = (
  grids: ChartGridLayoutOption[],
  timeAxisHeightPx: number,
): ChartGridLayoutOption[] => {
  if (grids.length === 0) return grids;

  const safeTimeAxisHeight = Number.isFinite(timeAxisHeightPx)
    ? Math.max(0, timeAxisHeightPx)
    : 0;
  const lastGridIndex = grids.length - 1;

  return grids.map((grid, index) => (
    index === lastGridIndex
      ? { ...grid, bottom: safeTimeAxisHeight, height: "auto" }
      : grid
  ));
};

/**
 * Builds the canonical price + optional volume geometry used by compact peers.
 *
 * The percentages are only pane-sizing inputs. The final visible pane is always
 * re-anchored to a fixed time-axis lane so a 720p chart and a 4K chart reserve
 * the same number of pixels below their data. This mirrors the main renderer's
 * contract and prevents inactive multi-chart cells from drifting visually.
 */
export const buildPriceVolumePaneLayout = ({
  left,
  right,
  showVolume,
  timeAxisHeightPx,
}: PriceVolumePaneLayoutOptions): PriceVolumePaneLayout => {
  const lowerPaneCount = showVolume ? 1 : 0;
  const mainHeightPercent = 100
    - DEFAULT_CHART_TOP_MARGIN_PERCENT
    - DEFAULT_PANE_SIZING_BOTTOM_BUDGET_PERCENT
    - lowerPaneCount * DEFAULT_SINGLE_LOWER_PANE_HEIGHT_PERCENT;

  const grids: ChartGridLayoutOption[] = [{
    left,
    right,
    top: `${DEFAULT_CHART_TOP_MARGIN_PERCENT}%`,
    height: `${mainHeightPercent}%`,
    containLabel: false,
  }];

  if (showVolume) {
    grids.push({
      left,
      right,
      top: `${DEFAULT_CHART_TOP_MARGIN_PERCENT + mainHeightPercent}%`,
      height: `${DEFAULT_SINGLE_LOWER_PANE_HEIGHT_PERCENT}%`,
      containLabel: false,
    });
  }

  return {
    grids: anchorLastPaneToFixedTimeAxis(grids, timeAxisHeightPx),
    visibleTimeAxisIndex: showVolume ? 1 : 0,
  };
};
