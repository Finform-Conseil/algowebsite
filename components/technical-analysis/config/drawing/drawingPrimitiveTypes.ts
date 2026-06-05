import type { BarPatternMode } from "./drawingToolTypes";

export interface DrawingPoint {
  time: string | number;
  value: number;
}

export interface DrawingStyle {
  color: string;
  lineWidth: number;
  lineStyle: "solid" | "dashed" | "dotted";
  lineOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
  fillEnabled?: boolean;
  borderColor?: string;
  borderEnabled?: boolean;
}

export interface BarPatternProps {
  color: string;
  mode: BarPatternMode;
  mirrored: boolean;
  flipped: boolean;
  opacity?: number;
  initialPriceDiff?: number;
  avgHL?: number;
  variance?: number;
  logMode?: boolean;
  seed?: number;
  mintick?: number;
  data?: { o: number; c: number; l: number; h: number; relT: number; idx: number }[];
  // [TENOR 2026 HDR] High Fidelity Style Props
  bullColor?: string;
  bearColor?: string;
  showBorders?: boolean;
  bullBorderColor?: string;
  bearBorderColor?: string;
  showWicks?: boolean;
  wickColor?: string;
}
