export interface DrawingGannBoxProps {
  reverse: boolean;
  useOneColor?: boolean;
  oneColor?: string;
  showAngles?: boolean;
  showLabels: { left: boolean; right: boolean; top: boolean; bottom: boolean };
  priceLevels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  timeLevels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  priceBackground?: { enabled: boolean; fillOpacity: number };
  timeBackground?: { enabled: boolean; fillOpacity: number };

}

export interface DrawingGannSquareFixedProps {
  reverse: boolean;
  levels: {
    id: number;
    label: string;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineOpacity: number;
    enabled: boolean;
  }[];
  fans: {
    ratio: string;
    label: string;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineOpacity: number;
    enabled: boolean;
  }[];
  arcs: {
    ratio: string;
    label: string;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineOpacity: number;
    enabled: boolean;
  }[];
  background: { enabled: boolean; color: string; opacity: number };
  showFans: boolean;
  showGrid: boolean;
  showArcs: boolean;
  showLabels: boolean;
  priceBarRatio: number;
  lockRatio: boolean;

}

export interface DrawingGannSquareProps {
  color: string;
  showAngles: boolean;
  showFans: boolean;
  showArcs: boolean;
  showGrid: boolean;
  showLabels: boolean;
  fillBackground: boolean;
  fillOpacity: number;
  mosaicFill: boolean;
  useOneColor: boolean;
  oneColor: string;
  reverse: boolean;
  priceBarRatio: number;
  fans: {
    ratio: string;
    label: string;
    color: string;
    enabled: boolean;
    lineOpacity?: number;
    lineWidth?: number;
    lineStyle?: "solid" | "dashed" | "dotted";
  }[];
  arcs: {
    ratio: string;
    label: string;
    color: string;
    enabled: boolean;
    lineOpacity?: number;
    lineWidth?: number;
    lineStyle?: "solid" | "dashed" | "dotted";
  }[];
  levels: {
    value: number;
    label: string;
    color: string;
    enabled: boolean;
    lineOpacity?: number;
    lineWidth?: number;
    lineStyle?: "solid" | "dashed" | "dotted";
  }[];

}

export interface DrawingGannFanProps {
  reverse: boolean;
  showLabels: boolean;
  fillBackground: boolean;
  lines: {
    ratio: string;
    numerator: number;
    denominator: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    lineWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
    fillColor: string;
    fillOpacity: number;
  }[];

}
