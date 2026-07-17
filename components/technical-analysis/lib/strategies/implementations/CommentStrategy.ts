import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";

const HANDLE_HIT_THRESHOLD = 8;
const TEXT_PADDING = 14;
const CHIP_RADIUS = 8;
const MIN_CHIP_WIDTH = 72;
const CHIP_HEIGHT = 32;
const ANCHOR_DOT_RADIUS = 4;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export class CommentStrategy implements IDrawingStrategy {
  supportedTools = ["comment"];

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
    const textColor = drawing.textColor || "#ffffff";
    const fontSize = drawing.fontSize || 16;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";

    ctx.save();

    const { x, y } = pts[0];

    ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
    const textWidth = hasText ? ctx.measureText(displayText).width : 0;
    const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, MIN_CHIP_WIDTH);
    const chipHeight = Math.max(CHIP_HEIGHT, fontSize + 14);
    const boxX = x - chipWidth / 2;
    const boxY = y - chipHeight / 2;

    // Fill color — always use the style color (Comment is fill-only, like TV)
    const fillColor = sf.fillColor
      ? hexToRgba(sf.fillColor, sf.fillOpacity ?? 0.95)
      : hexToRgba(sf.color || "#2962FF", 0.95);

    // Rounded rectangle bubble
    drawRoundedRect(ctx, boxX, boxY, chipWidth, chipHeight, CHIP_RADIUS);
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Text
    if (hasText) {
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayText, x, y);
    }

    // Anchor dot at bottom-left corner (acts as the tail, like TV)
    const dotX = boxX;
    const dotY = boxY + chipHeight;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(dotX, dotY, ANCHOR_DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#2962FF";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Selection state
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "rgba(41, 98, 255, 0.85)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([]);
      drawRoundedRect(ctx, boxX - 3, boxY - 3, chipWidth + 6, chipHeight + 6, CHIP_RADIUS + 2);
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

    const { x, y } = points[0];

    if (Math.hypot(mx - x, my - y) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
    const hasText = displayText.length > 0;
    const fontSize = drawing.fontSize || 16;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";

    const canvas = document.createElement("canvas");
    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return { isHit: false, hitType: null };

    tempCtx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
    const textWidth = hasText ? tempCtx.measureText(displayText).width : 0;
    const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, MIN_CHIP_WIDTH);
    const chipHeight = Math.max(CHIP_HEIGHT, fontSize + 14);
    const boxX = x - chipWidth / 2;
    const boxY = y - chipHeight / 2;

    if (
      mx >= boxX && mx <= boxX + chipWidth &&
      my >= boxY && my <= boxY + chipHeight
    ) {
      return { isHit: true, hitType: "shape" };
    }

    // Anchor dot hit test
    const dotDist = Math.hypot(mx - boxX, my - (boxY + chipHeight));
    if (dotDist < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    return { isHit: false, hitType: null };
  }
}
