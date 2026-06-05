export type GridOption = {
  left?: string | number;
  right?: string | number;
  top?: string | number;
  height?: string | number;
  bottom?: string | number;
  containLabel?: boolean;
};

export type XAxisOption = Record<string, unknown>;
export type YAxisOption = Record<string, unknown>;
export type SeriesOption = Record<string, unknown>;

// ============================================================================
// MULTI-CHART LAYOUT TYPES
// ============================================================================

export type MultiChartLayoutId =
  | "single"
  | "two_horizontal"
  | "two_vertical"
  | "three_focus_right"
  | "four_grid"
  | "six_grid"
  | "eight_grid"
  | "nine_grid"
  | "twelve_grid"
  | "sixteen_grid";

export type MultiChartSyncKey = "symbol" | "interval" | "crosshair" | "time" | "dateRange";

export interface MultiChartLayoutSync {
  symbol: boolean;
  interval: boolean;
  crosshair: boolean;
  time: boolean;
  dateRange: boolean;
}

export interface MultiChartLayoutCell {
  chartId: string;
  symbol: string;
  exchange: "BRVM";
  interval: string;
  indicators: string[];
  isActive: boolean;
}

export interface MultiChartLayoutState {
  layoutId: MultiChartLayoutId;
  name: string;
  isEnabled: boolean;
  sync: MultiChartLayoutSync;
  charts: MultiChartLayoutCell[];
  activeChartId: string;
}

// ============================================================================
// PERSISTENCE TYPES
// ============================================================================
