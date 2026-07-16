import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { distToSegment, isPointInPolygon } from "../../math/geometry";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_HIT_THRESHOLD = 8;
const HANDLE_RX = 6;
const HANDLE_RY = 4.2;
const DEFAULT_PREVIEW_HEIGHT = 24;

interface Vec2 {
  x: number;
  y: number;
}

interface RectGeometry {
  corners: [Vec2, Vec2, Vec2, Vec2];
  topMid: Vec2;
  bottomMid: Vec2;
  center: Vec2;
}

const midpoint = (a: Vec2, b: Vec2): Vec2 => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
const scale = (v: Vec2, s: number): Vec2 => ({ x: v.x * s, y: v.y * s });
const length = (v: Vec2): number => Math.hypot(v.x, v.y);
const normalize = (v: Vec2): Vec2 => {
  const mag = length(v);
  if (!Number.isFinite(mag) || mag < 1e-6) return { x: 1, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};
const perpendicular = (v: Vec2): Vec2 => ({ x: -v.y, y: v.x });

function drawPolygonPath(ctx: CanvasRenderingContext2D, points: Vec2[]): void {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();
}

function drawOvalHandle(ctx: CanvasRenderingContext2D, point: Vec2, stroke: string): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(point.x, point.y, HANDLE_RX, HANDLE_RY, 0, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function computeGeometry(points: Vec2[]): RectGeometry | null {
  if (points.length < 2) return null;

  const topLeft = points[0];
  const topRight = points[1];
  const topMid = midpoint(topLeft, topRight);
  const base = sub(topRight, topLeft);
  const baseDir = normalize(base);
  const perpDir = perpendicular(baseDir);
  const previewBottomMid = add(topMid, scale(perpDir, DEFAULT_PREVIEW_HEIGHT));
  const rawBottomMid = points[2] ?? previewBottomMid;
  const toBottom = sub(rawBottomMid, topMid);
  const signedHeight = toBottom.x * perpDir.x + toBottom.y * perpDir.y;
  const offset = scale(perpDir, signedHeight);
  const bottomMid = add(topMid, offset);
  const topRightActual = topRight;
  const bottomRight = add(topRightActual, offset);
  const bottomLeft = add(topLeft, offset);
  const center = midpoint(topMid, bottomMid);

  return {
    corners: [topLeft, topRightActual, bottomRight, bottomLeft],
    topMid,
    bottomMid,
    center,
  };
}

function drawSelectionHandle(ctx: CanvasRenderingContext2D, point: Vec2, stroke: string): void {
  drawOvalHandle(ctx, point, stroke);
}

export class RotatedRectangleStrategy implements IDrawingStrategy {
  supportedTools = ["rotated_rectangle"];

  render(
    pixelPoints: Vec2[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    _chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[]
  ): void {
    if (pixelPoints.length < 1) return;

    if (pixelPoints.length === 1) {
      h.drawHandle(pixelPoints[0], drawing.style.color, 4, "circle");
      return;
    }

    const geometry = computeGeometry(pixelPoints);
    if (!geometry) return;

    const { color, lineWidth = 2, lineStyle = "solid", fillColor, fillOpacity = 0.1, fillEnabled = true } = drawing.style;
    const ctx = h.ctx;

    ctx.save();
    h.applyStyle(drawing.style, false);
    h.applyLineDash(lineStyle, lineWidth);

    if (fillEnabled && fillColor) {
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = fillOpacity;
      drawPolygonPath(ctx, geometry.corners);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    drawPolygonPath(ctx, geometry.corners);
    ctx.stroke();
    ctx.restore();

    if (isSelected) {
      const corners = geometry.corners;
      const handlePoints = [
        corners[0],
        geometry.topMid,
        corners[1],
        corners[2],
        geometry.bottomMid,
        corners[3],
      ];

      for (let i = 0; i < handlePoints.length; i++) {
        const point = handlePoints[i];
        drawSelectionHandle(ctx, point, color);
      }
    }
  }

  hitTest(
    mx: number,
    my: number,
    drawing: Drawing,
    chartInstance: EChartsInstance,
    threshold: number
  ): HitTestResult {
    const points = drawing.points
      .map((p) => {
        const pixel = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
        return pixel ? ({ x: pixel[0], y: pixel[1] } as Vec2) : null;
      })
      .filter((p): p is Vec2 => p !== null);

    if (points.length < 1) return { isHit: false, hitType: null };
    if (points.length === 1) {
      if (Math.hypot(mx - points[0].x, my - points[0].y) < HANDLE_HIT_THRESHOLD) {
        return { isHit: true, hitType: "point", pointIndex: 0 };
      }
      return { isHit: false, hitType: null };
    }

    const geometry = computeGeometry(points);
    if (!geometry) return { isHit: false, hitType: null };

    const handles = [
      geometry.corners[0],
      geometry.topMid,
      geometry.corners[1],
      geometry.center,
      geometry.corners[2],
      geometry.bottomMid,
      geometry.corners[3],
    ];

    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      if (handle && Math.hypot(mx - handle.x, my - handle.y) < HANDLE_HIT_THRESHOLD) {
        if (i === 3) return { isHit: true, hitType: "point", pointIndex: 2 };
        return { isHit: true, hitType: "point", pointIndex: i < 3 ? 0 : 1 };
      }
    }

    const edges: Array<[Vec2, Vec2]> = [
      [geometry.corners[0], geometry.corners[1]],
      [geometry.corners[1], geometry.corners[2]],
      [geometry.corners[2], geometry.corners[3]],
      [geometry.corners[3], geometry.corners[0]],
    ];

    for (const [a, b] of edges) {
      if (distToSegment(mx, my, a.x, a.y, b.x, b.y) < threshold) {
        return { isHit: true, hitType: "shape" };
      }
    }

    if (isPointInPolygon(mx, my, geometry.corners)) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
