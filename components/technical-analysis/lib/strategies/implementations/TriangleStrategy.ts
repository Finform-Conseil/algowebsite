import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { distToSegment, isPointInPolygon } from "../../math/geometry";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_RADIUS = 5;
const HANDLE_HIT_THRESHOLD = 8;

function computeCentroid(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }): { x: number; y: number } {
  return { x: (a.x + b.x + c.x) / 3, y: (a.y + b.y + c.y) / 3 };
}

export class TriangleStrategy implements IDrawingStrategy {
  supportedTools = ["triangle"];

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

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();

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
      const centroid = computeCentroid(pts[0], pts[1], pts[2]);
      ctx.save();
      const textColor = drawing.textColor || "#FFFFFF";
      const fontSize = drawing.fontSize || 14;
      const weight = drawing.textBold ? "bold " : "";
      const style = drawing.textItalic ? "italic " : "";
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(drawing.text, centroid.x, centroid.y);
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

    const edges: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
      { x1: points[0].x, y1: points[0].y, x2: points[1].x, y2: points[1].y },
      { x1: points[1].x, y1: points[1].y, x2: points[2].x, y2: points[2].y },
      { x1: points[2].x, y1: points[2].y, x2: points[0].x, y2: points[0].y },
    ];

    for (const edge of edges) {
      if (distToSegment(mx, my, edge.x1, edge.y1, edge.x2, edge.y2) < threshold) {
        return { isHit: true, hitType: "shape" };
      }
    }

    if (isPointInPolygon(mx, my, points.slice(0, 3))) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
