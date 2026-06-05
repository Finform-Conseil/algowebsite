export interface DrawingFibProps {
  reverse: boolean;
  fillBackground: boolean;
  fillOpacity?: number;
  levels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    fillOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  showPrices: boolean;
  showLevels: boolean;
  labelsPosition: "left" | "right";
  oneColor?: string;
  useOneColor?: boolean;
  extendLines?: "none" | "left" | "right" | "both";
  trendLine?: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  fanProps?: {
    reverse: boolean;
    fillBackground: boolean;
    fillOpacity?: number;
    extendLines?: "none" | "left" | "right" | "both";
    priceLevels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity?: number;
    }[];
    timeLevels: {
      value: number;
      color: string;
      enabled: boolean;
      lineOpacity?: number;
    }[];
    showPriceLabels: { left: boolean; right: boolean };
    showTimeLabels: { top: boolean; bottom: boolean };
    useOneColor?: boolean;
    oneColor?: string;
    gridEnabled?: boolean;
    gridStyle?: "solid" | "dashed" | "dotted";
  };

}

export interface DrawingTrendBasedFibTimeProps {
  levels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  trendLine: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  extensionLine: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  labelsPosition: "top" | "bottom" | "middle";
  labelsHorizontalPosition: "left" | "center" | "right";
  fillBackground: boolean;
  fillOpacity: number;
  showPrices: boolean;
  showLevels: boolean;
  useOneColor?: boolean;
  oneColor?: string;

}

export interface DrawingFibCirclesProps {
  levels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    fillOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  trendLine: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  useOneColor?: boolean;
  oneColor?: string;
  background: {
    enabled: boolean;
    fillOpacity: number;
  };
  showLabels: boolean;

}

export interface DrawingFibSpiralProps {
  reverse: boolean;
  useOneColor?: boolean;
  oneColor?: string;
  levels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  trendLine: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  background?: {
    enabled: boolean;
    fillOpacity: number;
  };
  showLabels: boolean;
  counterclockwise: boolean;

}

export interface DrawingFibSpeedResistanceArcsProps {
  levels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  trendLine: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  background: {
    enabled: boolean;
    fillOpacity: number;
  };
  fullCircles: boolean;
  showLabels: boolean;

}

export interface DrawingFibWedgeProps {
  levels: {
    value: number;
    color: string;
    enabled: boolean;
    lineOpacity: number;
    fillOpacity: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  }[];
  trendLine: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
    lineOpacity?: number;
  };
  background: {
    enabled: boolean;
    fillOpacity: number;
  };
  useOneColor?: boolean;
  oneColor?: string;
  showLabels: boolean;

}

export interface DrawingPitchfanProps {
  levels: {
    t: number;
    color: string;
    lineWidth: number;
    lineStyle: "solid" | "dashed" | "dotted";
    lineOpacity: number;
    enabled: boolean;
  }[];
  fillBackground: boolean;
  fillOpacity: number;
  useOneColor?: boolean;
  oneColor?: string;
  showTrendLine?: boolean;
  trendLine?: {
    enabled: boolean;
    color: string;
    lineStyle: "solid" | "dashed" | "dotted";
    lineWidth: number;
  };

}
