export type ChartGridLayoutOption = Record<string, unknown>;

export const DEFAULT_CHART_TOP_MARGIN_PERCENT = 0;
export const DEFAULT_PANE_SIZING_BOTTOM_BUDGET_PERCENT = 0;
export const VELA_PRICE_PANE_HEIGHT_WEIGHT = 3;
export const VELA_STUDY_PANE_HEIGHT_WEIGHT = 1;

export interface VelaPaneWeightLayout {
  mainPaneHeightPercent: number;
  studyPaneHeightPercent: number;
}

/**
 * Mirrors Vela 0.7.2 pane allocation: price pane weight = 3, every study pane = 1.
 * Volume is a native overlay and therefore does not contribute a pane weight.
 */
export const resolveVelaPaneWeightLayout = (
  availableHeightPercent: number,
  studyPaneCount: number,
): VelaPaneWeightLayout => {
  const safeAvailable = Number.isFinite(availableHeightPercent)
    ? Math.max(0, availableHeightPercent)
    : 0;
  const safeStudyCount = Number.isFinite(studyPaneCount)
    ? Math.max(0, Math.floor(studyPaneCount))
    : 0;
  if (safeStudyCount === 0) {
    return { mainPaneHeightPercent: safeAvailable, studyPaneHeightPercent: 0 };
  }

  const totalWeight = VELA_PRICE_PANE_HEIGHT_WEIGHT
    + safeStudyCount * VELA_STUDY_PANE_HEIGHT_WEIGHT;
  const unit = totalWeight > 0 ? safeAvailable / totalWeight : 0;
  return {
    mainPaneHeightPercent: unit * VELA_PRICE_PANE_HEIGHT_WEIGHT,
    studyPaneHeightPercent: unit * VELA_STUDY_PANE_HEIGHT_WEIGHT,
  };
};

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
  // Vela native Volume is a price-pane overlay, not a lower pane. `showVolume`
  // intentionally does not alter grid geometry; it only controls the overlay.
  void showVolume;
  const grids: ChartGridLayoutOption[] = [{
    left,
    right,
    top: `${DEFAULT_CHART_TOP_MARGIN_PERCENT}%`,
    containLabel: false,
  }];

  return {
    grids: anchorLastPaneToFixedTimeAxis(grids, timeAxisHeightPx),
    visibleTimeAxisIndex: 0,
  };
};
