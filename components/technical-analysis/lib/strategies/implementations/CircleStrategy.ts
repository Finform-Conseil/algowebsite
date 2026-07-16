import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_RADIUS = 5;
const HANDLE_HIT_THRESHOLD = 8;

function computeCenterAndRadius(pts: { x: number; y: number }[]): { cx: number; cy: number; r: number } | null {
  if (pts.length < 1) return null;
  const cx = pts[0].x, cy = pts[0].y;
  if (pts.length < 2) return { cx, cy, r: 0 };
  const r = Math.hypot(pts[1].x - cx, pts[1].y - cy);
  return { cx, cy, r };
}

function pointNearCircleEdge(px: number, py: number, cx: number, cy: number, r: number, threshold: number): boolean {
  const dist = Math.abs(Math.hypot(px - cx, py - cy) - r);
  return dist < threshold;
}

function pointInsideCircle(px: number, py: number, cx: number, cy: number, r: number): boolean {
  return Math.hypot(px - cx, py - cy) <= r;
}

export class CircleStrategy implements IDrawingStrategy {
  supportedTools = ["circle"];

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

    const centerRadius = computeCenterAndRadius(pts);
    if (!centerRadius) return;

    const { cx, cy, r } = centerRadius;

    if (pts.length === 1) {
      h.drawHandle({ x: cx, y: cy }, drawing.style.color, 4, "circle");
      return;
    }

    if (r < 0.5) return;

    const { color, lineWidth = 2, lineStyle = "solid", fillColor, fillOpacity = 0.1, fillEnabled = true } = drawing.style;
    const ctx = h.ctx;

    ctx.save();
    h.applyStyle(drawing.style, false);
    h.applyLineDash(lineStyle, lineWidth);

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);

    if (fillEnabled && fillColor) {
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();

    if (drawing.showText && drawing.text) {
      ctx.save();
      const textColor = drawing.textColor || "#FFFFFF";
      const fontSize = drawing.fontSize || 14;
      const weight = drawing.textBold ? "bold " : "";
      const style = drawing.textItalic ? "italic " : "";
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(drawing.text, cx, cy - 16);
      ctx.restore();
    }

    if (isSelected) {
      h.drawHandle({ x: cx, y: cy }, color, HANDLE_RADIUS, "circle");
      h.drawHandle({ x: pts[1].x, y: pts[1].y }, color, HANDLE_RADIUS, "circle");
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

    const centerRadius = computeCenterAndRadius(points);
    if (!centerRadius) return { isHit: false, hitType: null };
    const { cx, cy, r } = centerRadius;

    if (Math.hypot(mx - cx, my - cy) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    if (Math.hypot(mx - points[1].x, my - points[1].y) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 1 };
    }

    if (pointNearCircleEdge(mx, my, cx, cy, r, threshold)) {
      return { isHit: true, hitType: "shape" };
    }

    if (pointInsideCircle(mx, my, cx, cy, r)) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
