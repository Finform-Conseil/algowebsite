export interface DrawingPositionProps {
  accountSize: number;
  riskPercent: number;
  riskAmount?: number;
  lotSize?: number;
  leverage?: number;
  entryPrice: number;
  tpPrice: number;
  tpTicks?: number;
  slPrice: number;
  slTicks?: number;
  riskDisplayMode?: "percent" | "amount";
  qtyPrecision?: number;
  qty?: number;
  pointValue?: number;
  ratio?: number;
  rewardAmount?: number;
  tpColor?: string;
  tpOpacity?: number;
  slColor?: string;
  slOpacity?: number;
  lineColor?: string;
  lineOpacity?: number;
  width?: number;

}

export interface DrawingRegressionProps {
  useUpperDev: boolean;
  upperDev: number;
  useLowerDev: boolean;
  lowerDev: number;
  source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
  showBaseLine: boolean;
  baseColor: string;
  baseLineWidth: number;
  baseLineStyle: "solid" | "dashed" | "dotted";
  showUpLine: boolean;
  upColor: string;
  upLineWidth: number;
  upLineStyle: "solid" | "dashed" | "dotted";
  showDownLine: boolean;
  downColor: string;
  downLineWidth: number;
  downLineStyle: "solid" | "dashed" | "dotted";
  fillBackground: boolean;
  upFillColor: string;
  downFillColor: string;
  extendLines: boolean;
  showPearsonsR: boolean;

}
