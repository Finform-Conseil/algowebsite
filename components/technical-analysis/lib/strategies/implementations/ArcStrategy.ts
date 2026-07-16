import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_RADIUS = 5;
const HANDLE_HIT_THRESHOLD = 8;

interface Circumcircle {
  cx: number; cy: number; r: number;
}

function circumcircle(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): Circumcircle | null {
  const D = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  if (Math.abs(D) < 1e-10) return null;
  const a2 = a.x * a.x + a.y * a.y;
  const b2 = b.x * b.x + b.y * b.y;
  const c2 = c.x * c.x + c.y * c.y;
  const cx = (a2 * (b.y - c.y) + b2 * (c.y - a.y) + c2 * (a.y - b.y)) / D;
  const cy = (a2 * (c.x - b.x) + b2 * (a.x - c.x) + c2 * (b.x - a.x)) / D;
  const r = Math.hypot(cx - a.x, cy - a.y);
  return { cx, cy, r };
}

function modAngle(a: number): number {
  while (a < 0) a += Math.PI * 2;
  while (a >= Math.PI * 2) a -= Math.PI * 2;
  return a;
}

function angleBetween(cx: number, cy: number, p: { x: number; y: number }): number {
  return Math.atan2(p.y - cy, p.x - cx);
}

function isOnArc(testAngle: number, startAngle: number, endAngle: number, counterclockwise: boolean): boolean {
  const sa = modAngle(startAngle);
  const ea = modAngle(endAngle);
  const ta = modAngle(testAngle);
  if (counterclockwise) {
    if (sa > ea) return ta >= ea && ta <= sa;
    return ta >= sa && ta <= ea;
  }
  if (sa < ea) return ta >= ea || ta <= sa;
  return ta <= sa && ta >= ea;
}

function arcSweepFromMid(startAngle: number, endAngle: number, midAngle: number): boolean {
  return isOnArc(midAngle, startAngle, endAngle, false);
}

function pointOnArcEdge(px: number, py: number, cc: Circumcircle, startAngle: number, endAngle: number, counterclockwise: boolean, threshold: number): boolean {
  const dx = px - cc.cx;
  const dy = py - cc.cy;
  const dist = Math.abs(Math.hypot(dx, dy) - cc.r);
  if (dist >= threshold) return false;
  const angle = Math.atan2(dy, dx);
  return isOnArc(angle, startAngle, endAngle, counterclockwise);
}

function arcCenter(start: { x: number; y: number }, end: { x: number; y: number }, control: { x: number; y: number }): { x: number; y: number } {
  return {
    x: (start.x + end.x + control.x) / 3,
    y: (start.y + end.y + control.y) / 3,
  };
}

function drawArc(ctx: CanvasRenderingContext2D, cc: Circumcircle, startAngle: number, endAngle: number, counterclockwise: boolean): void {
  ctx.beginPath();
  ctx.arc(cc.cx, cc.cy, cc.r, startAngle, endAngle, counterclockwise);
}

export class ArcStrategy implements IDrawingStrategy {
  supportedTools = ["arc"];

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

    const cc = circumcircle(pts[0], pts[1], pts[2]);
    if (!cc || cc.r < 0.5) return;

    const sAngle = angleBetween(cc.cx, cc.cy, pts[0]);
    const eAngle = angleBetween(cc.cx, cc.cy, pts[1]);
    const cAngle = angleBetween(cc.cx, cc.cy, pts[2]);

    const counterclockwise = !arcSweepFromMid(sAngle, eAngle, cAngle);

    const { color, lineWidth = 2, lineStyle = "solid", fillColor, fillOpacity = 0.1, fillEnabled = true } = drawing.style;
    const ctx = h.ctx;

    ctx.save();
    h.applyStyle(drawing.style, false);
    h.applyLineDash(lineStyle, lineWidth);

    if (fillEnabled && fillColor) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      ctx.arc(cc.cx, cc.cy, cc.r, sAngle, eAngle, counterclockwise);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = fillOpacity;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    drawArc(ctx, cc, sAngle, eAngle, counterclockwise);

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.restore();

    if (drawing.showText && drawing.text) {
      const textPos = arcCenter(pts[0], pts[1], pts[2]);
      ctx.save();
      const textColor = drawing.textColor || "#FFFFFF";
      const fontSize = drawing.fontSize || 14;
      const weight = drawing.textBold ? "bold " : "";
      const style = drawing.textItalic ? "italic " : "";
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(drawing.text, textPos.x, textPos.y);
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

    const cc = circumcircle(points[0], points[1], points[2]);
    if (!cc) return { isHit: false, hitType: null };

    const sAngle = angleBetween(cc.cx, cc.cy, points[0]);
    const eAngle = angleBetween(cc.cx, cc.cy, points[1]);
    const cAngle = angleBetween(cc.cx, cc.cy, points[2]);
    const counterclockwise = !arcSweepFromMid(sAngle, eAngle, cAngle);

    if (pointOnArcEdge(mx, my, cc, sAngle, eAngle, counterclockwise, threshold)) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
