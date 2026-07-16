export interface DrawingForecastProps {
  showSourceText?: boolean;
  sourceTextColor?: string;
  sourceBackgroundColor?: string;
  sourceBorderColor?: string;
  showTargetText?: boolean;
  targetTextColor?: string;
  targetBackgroundColor?: string;
  targetBorderColor?: string;
  showSuccessText?: boolean;
  successTextColor?: string;
  successBackgroundColor?: string;
  showFailureText?: boolean;
  failureTextColor?: string;
  failureBackgroundColor?: string;

}

export interface DrawingAnchoredVWAPProps {
  source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
  calculateStDev: boolean;
  fillBackground: boolean;
  transparency: number;
  levels: {
    multiplier: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    fillOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];

}

export interface DrawingAnchoredVolumeProfileProps {
  layout: "Number of Rows" | "Ticks Per Row";
  rowSize: number;
  volume: "Up/Down" | "Total" | "Delta";
  valueAreaVolume: number;
  upColor: string;
  downColor: string;
  vaUpColor: string;
  vaDownColor: string;
  pocColor: string;
  width: number;
  placement: "Left" | "Right";
  showLabels: boolean;
  extendLeft?: boolean;
  extendRight?: boolean;
  showPOC?: boolean;
  showValueArea?: boolean;

}
