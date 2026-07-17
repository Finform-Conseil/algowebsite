import type { Drawing } from "./drawingModelTypes";
import type { DrawingStyle } from "./drawingPrimitiveTypes";
import type { SignpostHitPart } from "../../hooks/drawing/drawingSignpostProjection";

export interface HitTestResult {
  isHit: boolean;
  hitType: "point" | "shape" | "zone_tp" | "zone_sl" | "width_resize" | null;
  pointIndex?: number;
  cellRow?: number;
  cellCol?: number;
  colResizeIndex?: number;
  part?: SignpostHitPart;
  resizeEdge?: "top" | "bottom" | "left" | "right" | "topLeft" | "topRight" | "bottomLeft" | "bottomRight";
}

export interface DrawingHelpers {
  drawSegment(p1: { x: number; y: number }, p2: { x: number; y: number }): void;
  drawHandle(p: { x: number; y: number }, color?: string, radius?: number, shape?: 'circle' | 'square'): void;
  drawTextOnLine(p1: { x: number; y: number }, p2: { x: number; y: number }, drawing: Drawing): void;
  applyStyle(style: DrawingStyle, isPreview: boolean): void;
  applyLineDash(lineStyle: "solid" | "dashed" | "dotted", lineWidth: number): void;
  ctx: CanvasRenderingContext2D;
  logicalWidth: number;
  logicalHeight: number;
}

// ============================================================================
