export interface DrawingPitchforkProps {
  style: "original" | "schiff" | "modified_schiff" | "inside";
  extendLines: boolean;
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
    fillColor?: string;
  }[];
  useOneColor?: boolean;
  oneColor?: string;

}
