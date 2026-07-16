import type { MultiChartLayoutState } from "../../config/layout/multiChartLayoutTypes";
import { resolveSectorCompareSymbols } from "../../config/layout/brvmLayoutSymbols";
import type { ChartState } from "../../config/state/chartStateTypes";

export const normalizeChartSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const isSectorComparisonLayout = (layout: MultiChartLayoutState): boolean =>
  layout.layoutId === "four_grid"
  && layout.charts.some((chart, index) => index > 0 && normalizeChartSymbol(chart.symbol) === "BRVMC");

export const applyPrimaryLayoutSymbol = (
  layout: MultiChartLayoutState,
  symbol: string,
): void => {
  const normalized = normalizeChartSymbol(symbol);
  const primaryChartId = layout.charts[0]?.chartId;
  if (!normalized || !primaryChartId) return;

  layout.activeChartId = primaryChartId;

  const sectorSymbols = isSectorComparisonLayout(layout)
    ? resolveSectorCompareSymbols(normalized)
    : [];

  layout.charts.forEach((chart, index) => {
    if (index === 0 || layout.sync.symbol) {
      chart.symbol = normalized;
    } else if (sectorSymbols[index]) {
      chart.symbol = sectorSymbols[index];
    }
    chart.isActive = chart.chartId === primaryChartId;
  });
};

export const applyLayoutInterval = (
  layout: MultiChartLayoutState,
  timeframe: string,
): void => {
  layout.charts.forEach((chart) => {
    if (layout.sync.interval || chart.chartId === layout.activeChartId) {
      chart.interval = timeframe;
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
