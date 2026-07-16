import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { distanceBetweenPoints } from "../../math/geometry";

const HANDLE_HIT_THRESHOLD = 8;
const TEXT_PADDING = 14;
const CHIP_RADIUS = 6;
const MIN_CHIP_WIDTH = 72;
const CHIP_HEIGHT = 30;
const ANCHOR_DOT_RADIUS = 4;
const TAIL_SPACING_X = 12;
const TAIL_SPACING_Y = 8;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawPriceLabelPath(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number,
  bw: number, bh: number,
  r: number,
  ax: number, ay: number
) {
  const radius = Math.min(r, bw / 2, bh / 2);
  ctx.beginPath();
  ctx.moveTo(bx + radius, by);
  ctx.lineTo(bx + bw - radius, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + radius, radius);
  ctx.lineTo(bx + bw, by + bh - radius);
  ctx.arcTo(bx + bw, by + bh, bx + bw - radius, by + bh, radius);
  ctx.lineTo(bx + radius, by + bh);
  ctx.lineTo(ax, ay);
  ctx.lineTo(bx, by + bh - radius);
  ctx.lineTo(bx, by + radius);
  ctx.arcTo(bx, by, bx + radius, by, radius);
  ctx.closePath();
}

function pointInTriangle(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number
): boolean {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0;
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(hasNeg && hasPos);
}

export class PriceLabelStrategy implements IDrawingStrategy {
  supportedTools = ["price_label"];

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

    const ctx = h.ctx;
    const sf = drawing.style;
    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
    const hasText = displayText.length > 0;
    const textColor = drawing.textColor || sf.color || "#ffffff";
    const fontSize = drawing.fontSize || 14;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";

    ctx.save();

    const ax = pts[0].x;
    const ay = pts[0].y;

    ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
    const textWidth = hasText ? ctx.measureText(displayText).width : 0;
    const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, MIN_CHIP_WIDTH);
    const chipHeight = Math.max(CHIP_HEIGHT, fontSize + 14);
    const boxX = ax + TAIL_SPACING_X;
    const boxY = ay - chipHeight - TAIL_SPACING_Y;

    const fillColor = sf.fillColor
      ? hexToRgba(sf.fillColor, sf.fillOpacity ?? 0.95)
      : hexToRgba(sf.color || "#2962FF", 0.95);

    drawPriceLabelPath(ctx, boxX, boxY, chipWidth, chipHeight, CHIP_RADIUS, ax, ay);
    ctx.fillStyle = fillColor;
    ctx.fill();

    if (hasText) {
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayText, boxX + chipWidth / 2, boxY + chipHeight / 2);
    }

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ax, ay, ANCHOR_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "rgba(41, 98, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      drawPriceLabelPath(ctx, boxX - 3, boxY - 3, chipWidth + 6, chipHeight + 6, CHIP_RADIUS + 2, ax, ay);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
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

    const ax = points[0].x;
    const ay = points[0].y;
    const d = threshold || HANDLE_HIT_THRESHOLD;

    if (distanceBetweenPoints(mx, my, ax, ay) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
    const hasText = displayText.length > 0;
    const fontSize = drawing.fontSize || 14;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";

    const canvas = document.createElement("canvas");
    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return { isHit: false, hitType: null };

    tempCtx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
    const textWidth = hasText ? tempCtx.measureText(displayText).width : 0;
    const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, MIN_CHIP_WIDTH);
    const chipHeight = Math.max(CHIP_HEIGHT, fontSize + 14);
    const boxX = ax + TAIL_SPACING_X;
    const boxY = ay - chipHeight - TAIL_SPACING_Y;

    if (
      mx >= boxX && mx <= boxX + chipWidth &&
      my >= boxY && my <= boxY + chipHeight
    ) {
      return { isHit: true, hitType: "shape" };
    }

    if (pointInTriangle(mx, my, ax, ay, boxX + chipWidth, boxY + chipHeight, boxX, boxY + chipHeight)) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}
