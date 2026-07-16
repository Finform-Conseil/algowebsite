import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../lib/types/echarts";

export const MULTI_CHART_MINI_DATA_ZOOM_ID = "multi-chart-mini-time-zoom";

export type AxisValue = string | number;

export interface MultiChartSyncPeer {
  chartId: string;
  chart: EChartsInstance;
  data: ChartDataPoint[];
  interval?: string;
}

export interface ChartLookup {
  data: ChartDataPoint[];
  exactIndexByTime: Map<string, number>;
  dayIndexByKey: Map<string, number>;
}

export interface SyncTarget extends MultiChartSyncPeer {
  lookup: ChartLookup;
  interval?: string;
}

export interface DataZoomSyncPayload {
  originChartId: string;
  start: number | null;
  end: number | null;
  startValue: AxisValue | null;
  endValue: AxisValue | null;
  totalDataPoints?: number;
  startValueIndex?: number;
  endValueIndex?: number;
  centerTime?: string | null;
}
