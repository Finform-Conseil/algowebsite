export interface DrawingPoint {
  xAxis: string;
  yAxis: number;
}

export interface DrawingStyle {
  color: string;
  lineWidth: number;
  lineDash?: number[];
  fill?: string;
  fillOpacity?: number;
}

export interface Drawing {
  id: string;
  type: string;
  points: DrawingPoint[];
  style: DrawingStyle;
  locked: boolean;
  visible: boolean;
  meta?: {
    text?: string;
    [key: string]: any;
  };
}

export type MagnetMode = 'off' | 'weak' | 'strong';
export type DrawingMode = 'idle' | 'placing' | 'editing';

export interface ToolSpec {
  id: string;
  label: string;
  groupId: string;
  icon: string;
  pointsNeeded: 0 | 1 | 2 | 3 | 'poly';
  defaultStyle: DrawingStyle;
  create: (points: DrawingPoint[], meta?: any) => Drawing;
}

export interface ToolGroup {
  id: string;
  label: string;
  icon: string;
  tools: string[];
}

export interface DrawingAction {
  id: string;
  label: string;
  icon: string;
  type: 'toggle' | 'button';
}

export interface DrawingState {
  activeToolId: string;
  magnetMode: MagnetMode;
  stayInDrawingMode: boolean;
  drawingsLocked: boolean;
  drawingsVisible: boolean;
  mode: DrawingMode;
  draftPoints: DrawingPoint[];
}
