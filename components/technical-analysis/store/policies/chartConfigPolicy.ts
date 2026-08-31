import type { MultiChartLayoutState } from "../../config/layout/multiChartLayoutTypes";
import type { ChartState } from "../../config/state/chartStateTypes";

export const normalizeChartSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const applyPrimaryLayoutSymbol = (
  layout: MultiChartLayoutState,
  symbol: string,
): void => {
  const normalized = normalizeChartSymbol(symbol);
  const primaryChartId = layout.charts[0]?.chartId;
  if (!normalized || !primaryChartId) return;

  const isMultiChartMode = layout.isEnabled && layout.charts.length > 1;
  const targetChartId = isMultiChartMode
    ? (layout.charts.some((chart) => chart.chartId === layout.activeChartId)
        ? layout.activeChartId
        : primaryChartId)
    : primaryChartId;

  // Symbol mutation and focus mutation are distinct operations. In multi-chart
  // mode, selecting/replacing a symbol updates the active cell (or all cells only
  // when explicit symbol sync is enabled) but must never force focus back to the
  // first slot. This prevents an active secondary ticker from overwriting chart_1.
  if (!isMultiChartMode) layout.activeChartId = primaryChartId;

  layout.charts.forEach((chart) => {
    if (chart.chartId === targetChartId || layout.sync.symbol) {
      chart.symbol = normalized;
      const runtimeChart = chart as typeof chart & { sourceKind?: "equity" | "index"; sourceId?: string };
      runtimeChart.sourceKind = "equity";
      runtimeChart.sourceId = "";
    }
    if (!isMultiChartMode) chart.isActive = chart.chartId === primaryChartId;
  });
};

export const applyLayoutInterval = (
  layout: MultiChartLayoutState,
  timeframe: string,
): void => {
  layout.charts.forEach((chart) => {
    if (layout.sync.interval || chart.chartId === layout.activeChartId) {
      chart.interval = timeframe;
      (chart as typeof chart & { timeframe?: string }).timeframe = timeframe;
    }
  });
};

export const applyChartSymbolUpdate = (
  chartConfig: ChartState,
  layout: MultiChartLayoutState,
  symbol: string,
): void => {
  const normalized = normalizeChartSymbol(symbol);
  chartConfig.symbol = normalized || symbol;
  applyPrimaryLayoutSymbol(layout, normalized);
};

export const applyChartTimeframeUpdate = (
  chartConfig: ChartState,
  layout: MultiChartLayoutState,
  timeframe: string,
): void => {
  chartConfig.timeframe = timeframe;
  applyLayoutInterval(layout, timeframe);
};

export const applyChartConfigTimingPatch = (
  chartConfig: ChartState,
  layout: MultiChartLayoutState,
  patch: Partial<Pick<ChartState, "symbol" | "timeframe">>,
): void => {
  if (patch.symbol !== undefined) {
    applyChartSymbolUpdate(chartConfig, layout, patch.symbol);
  }
  if (patch.timeframe !== undefined) {
    applyChartTimeframeUpdate(chartConfig, layout, patch.timeframe);
  }
};
