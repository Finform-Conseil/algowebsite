import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_RADIUS = 5;
const HANDLE_HIT_THRESHOLD = 8;

function quadraticBezierPoint(t: number, p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function distanceToQuadraticBezier(mx: number, my: number, pts: { x: number; y: number }[], threshold: number): boolean {
  const steps = 30;
  let minDist = Infinity;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const p = quadraticBezierPoint(t, pts[0], pts[1], pts[2]);
    const d = Math.hypot(mx - p.x, my - p.y);
    if (d < minDist) minDist = d;
  }
  return minDist < threshold;
}

function bezierCenter(p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }): { x: number; y: number } {
  return {
    x: (p0.x + p1.x + p2.x) / 3,
    y: (p0.y + p1.y + p2.y) / 3,
  };
}

export class CurveStrategy implements IDrawingStrategy {
  supportedTools = ["curve"];

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

    if (pts.length < 3) {
      for (const p of pts) {
        h.drawHandle(p, drawing.style.color, 4, "circle");
      }
      if (pts.length === 2) {
        const ctx = h.ctx;
        ctx.save();
        ctx.strokeStyle = drawing.style.color;
        ctx.lineWidth = drawing.style.lineWidth || 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.stroke();
        ctx.restore();
      }
      return;
    }

    const { color, lineWidth = 2, lineStyle = "solid", fillColor, fillOpacity = 0.1, fillEnabled = true } = drawing.style;
    const ctx = h.ctx;

    ctx.save();
    h.applyStyle(drawing.style, false);
    h.applyLineDash(lineStyle, lineWidth);

    if (fillEnabled && fillColor) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();

    if (drawing.showText && drawing.text) {
      const center = bezierCenter(pts[0], pts[1], pts[2]);
      ctx.save();
      const textColor = drawing.textColor || "#FFFFFF";
      const fontSize = drawing.fontSize || 14;
      const weight = drawing.textBold ? "bold " : "";
      const style = drawing.textItalic ? "italic " : "";
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(drawing.text, center.x, center.y);
      ctx.restore();
    }

    if (isSelected) {
      for (const p of pts.slice(0, 3)) {
        h.drawHandle(p, color, HANDLE_RADIUS, "circle");
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

    for (let i = 0; i < Math.min(points.length, 3); i++) {
      if (Math.hypot(mx - points[i].x, my - points[i].y) < HANDLE_HIT_THRESHOLD) {
        return { isHit: true, hitType: "point", pointIndex: i };
      }
    }

    if (points.length < 3) return { isHit: false, hitType: null };

    if (distanceToQuadraticBezier(mx, my, points.slice(0, 3), threshold)) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
