import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { distToSegment } from "../../math/geometry";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_RADIUS = 5;
const HANDLE_HIT_THRESHOLD = 8;

interface Rect {
  x: number; y: number; w: number; h: number;
}

function computeBounds(pts: { x: number; y: number }[]): Rect | null {
  if (pts.length < 2) return null;
  const x0 = pts[0].x, y0 = pts[0].y;
  const x1 = pts[1].x, y1 = pts[1].y;
  return {
    x: Math.min(x0, x1),
    y: Math.min(y0, y1),
    w: Math.abs(x1 - x0),
    h: Math.abs(y1 - y0),
  };
}

function drawRectPath(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.beginPath();
  ctx.rect(r.x, r.y, r.w, r.h);
  ctx.closePath();
}

function pointInRect(px: number, py: number, r: Rect, margin: number = 0): boolean {
  return px >= r.x - margin && px <= r.x + r.w + margin &&
         py >= r.y - margin && py <= r.y + r.h + margin;
}

interface HandleDef { x: number; y: number; cursor: string; }

function getHandles(r: Rect): HandleDef[] {
  const h = HANDLE_RADIUS;
  return [
    { x: r.x, y: r.y, cursor: "nwse-resize" },
    { x: r.x + r.w / 2, y: r.y, cursor: "ns-resize" },
    { x: r.x + r.w, y: r.y, cursor: "nesw-resize" },
    { x: r.x + r.w, y: r.y + r.h / 2, cursor: "ew-resize" },
    { x: r.x + r.w, y: r.y + r.h, cursor: "nwse-resize" },
    { x: r.x + r.w / 2, y: r.y + r.h, cursor: "ns-resize" },
    { x: r.x, y: r.y + r.h, cursor: "nesw-resize" },
    { x: r.x, y: r.y + r.h / 2, cursor: "ew-resize" },
  ];
}

export class RectangleStrategy implements IDrawingStrategy {
  supportedTools = ["rectangle"];

  render(
    pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    _chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[]
  ): void {
    if (pts.length < 1) return;
    if (pts.length === 1) {
      h.drawHandle(pts[0], drawing.style.color, 4, "circle");
      return;
    }
    const bounds = computeBounds(pts);
    if (!bounds) return;
    const { color, lineWidth = 2, lineStyle = "solid", fillColor, fillOpacity = 0.1, fillEnabled = true } = drawing.style;
    const ctx = h.ctx;

    ctx.save();
    h.applyStyle(drawing.style, false);
    h.applyLineDash(lineStyle, lineWidth);

    if (fillEnabled && fillColor) {
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = fillOpacity;
      drawRectPath(ctx, bounds);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    drawRectPath(ctx, bounds);
    ctx.stroke();
    ctx.restore();

    if (isSelected) {
      const handles = getHandles(bounds);
      for (const hh of handles) {
        h.drawHandle({ x: hh.x, y: hh.y }, color, HANDLE_RADIUS, "square");
      }
    }
  }

  hitTest(
    mx: number, my: number,
    drawing: Drawing,
    chartInstance: EChartsInstance,
    threshold: number
  ): HitTestResult {
    const points = drawing.points
      .map((p) => {
        const pixel = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
        return pixel ? { x: pixel[0], y: pixel[1] } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null);
    if (points.length < 1) return { isHit: false, hitType: null };
    if (points.length === 1) {
      if (Math.hypot(mx - points[0].x, my - points[0].y) < HANDLE_HIT_THRESHOLD) {
        return { isHit: true, hitType: "point", pointIndex: 0 };
      }
      return { isHit: false, hitType: null };
    }
    const bounds = computeBounds(points);
    if (!bounds) return { isHit: false, hitType: null };

    const handles = getHandles(bounds);
    for (let i = 0; i < handles.length; i++) {
      if (Math.hypot(mx - handles[i].x, my - handles[i].y) < HANDLE_HIT_THRESHOLD) {
        return { isHit: true, hitType: "point", pointIndex: i < 4 ? 0 : 1 };
      }
    }
    const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
      { x1: bounds.x, y1: bounds.y, x2: bounds.x + bounds.w, y2: bounds.y },
      { x1: bounds.x + bounds.w, y1: bounds.y, x2: bounds.x + bounds.w, y2: bounds.y + bounds.h },
      { x1: bounds.x, y1: bounds.y + bounds.h, x2: bounds.x + bounds.w, y2: bounds.y + bounds.h },
      { x1: bounds.x, y1: bounds.y, x2: bounds.x, y2: bounds.y + bounds.h },
    ];
    for (const edge of edges) {
      if (distToSegment(mx, my, edge.x1, edge.y1, edge.x2, edge.y2) < threshold) {
        return { isHit: true, hitType: "shape" };
      }
    }
    if (pointInRect(mx, my, bounds)) {
      return { isHit: true, hitType: "shape" };
    }
    return { isHit: false, hitType: null };
  }
}
