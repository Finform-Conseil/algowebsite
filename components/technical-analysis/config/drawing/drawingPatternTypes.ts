export interface DrawingXabcdProps {
  showLabels: boolean;
  showRatios: boolean;
  fillBackground: boolean;
  fillOpacity: number;

}

export interface DrawingCyclesProps {
  fillBackground: boolean;
  fillOpacity: number;
  levels: {
    id: number;
    color: string;
    enabled: boolean;
    opacity: number;
  }[];
  showLabels: boolean;

}
