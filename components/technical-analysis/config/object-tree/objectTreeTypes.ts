export type ObjectTreePanelTab = "object_tree" | "data_window";

export interface DataWindowCandleValues {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  lastDayChange: number;
  lastDayChangePercent: number;
  isUp: boolean;
}
