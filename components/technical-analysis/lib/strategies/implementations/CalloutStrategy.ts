import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { distToSegment, distanceBetweenPoints } from "../../math/geometry";

const HANDLE_HIT_THRESHOLD = 8;
const TEXT_PADDING = 12;
const CHIP_RADIUS = 6;
const MIN_CHIP_WIDTH = 64;
const CHIP_HEIGHT = 28;
const ANCHOR_RADIUS = 4;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawCalloutPath(
  ctx: CanvasRenderingContext2D,
  bx: number, by: number,
  bw: number, bh: number,
  r: number,
  cx: number,
  ax: number, ay: number
) {
  const radius = Math.min(r, bw / 2, bh / 2);
  ctx.beginPath();
  ctx.moveTo(bx, by + radius);
  ctx.arcTo(bx, by, bx + radius, by, radius);
  ctx.lineTo(bx + bw - radius, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + radius, radius);
  ctx.lineTo(bx + bw, by + bh - radius);
  ctx.arcTo(bx + bw, by + bh, bx + bw - radius, by + bh, radius);
  ctx.lineTo(cx, by + bh);
  ctx.lineTo(ax, ay);
  ctx.lineTo(bx + radius, by + bh);
  ctx.arcTo(bx, by + bh, bx, by + bh - radius, radius);
  ctx.lineTo(bx, by + radius);
  ctx.closePath();
}

export class CalloutStrategy implements IDrawingStrategy {
  supportedTools = ["callout"];

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
    const baseColor = sf.color || "#2962FF";
    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
    const hasText = displayText.length > 0;
    const textColor = drawing.textColor || "#ffffff";
    const fontSize = drawing.fontSize || 14;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";

    ctx.save();

    if (pts.length >= 2) {
      const [anchor, label] = pts;

      // Chip dimensions
      ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
      const textWidth = hasText ? ctx.measureText(displayText).width : 0;
      const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, MIN_CHIP_WIDTH);
      const chipHeight = Math.max(CHIP_HEIGHT, fontSize + 12);
      const boxX = label.x - chipWidth / 2;
      const boxY = label.y - chipHeight - 6;

      // Single unified fill for the entire callout shape
      const useFill = sf.fillEnabled && sf.fillColor;
      const fillColor = useFill && sf.fillColor
        ? hexToRgba(sf.fillColor, sf.fillOpacity ?? 0.95)
        : hexToRgba(baseColor, 0.92);

      drawCalloutPath(ctx, boxX, boxY, chipWidth, chipHeight, CHIP_RADIUS, label.x, anchor.x, anchor.y);
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Text
      if (hasText) {
        ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = textColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(displayText, label.x, boxY + chipHeight / 2);
      }

      // Anchor handle (white center + colored border)
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(anchor.x, anchor.y, ANCHOR_RADIUS, 0, Math.PI * 2);
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

        // Selection outline around the entire callout shape
        drawCalloutPath(ctx, boxX - 3, boxY - 3, chipWidth + 6, chipHeight + 6, CHIP_RADIUS, label.x, anchor.x, anchor.y);
        ctx.stroke();

        ctx.restore();
      }
    } else {
      const { x, y } = pts[0];
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, ANCHOR_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2962FF";
      ctx.lineWidth = 1.5;
      ctx.stroke();
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

    const d = threshold || HANDLE_HIT_THRESHOLD;

    const [p1] = points;
    if (distanceBetweenPoints(mx, my, p1.x, p1.y) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }

    if (points.length >= 2) {
      const [, p2] = points;

      if (distanceBetweenPoints(mx, my, p2.x, p2.y) < HANDLE_HIT_THRESHOLD) {
        return { isHit: true, hitType: "point", pointIndex: 1 };
      }

      const segDist = distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y);
      if (segDist < d * 2) {
        return { isHit: true, hitType: "shape" };
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
      const chipHeight = Math.max(CHIP_HEIGHT, fontSize + 12);
      const boxX = p2.x - chipWidth / 2;
      const boxY = p2.y - chipHeight - 6;

      // Bounding box hit test (covers chip + flare)
      const bottomMost = Math.max(boxY + chipHeight, p1.y);
      const topMost = boxY;
      const leftMost = Math.min(boxX, p1.x);
      const rightMost = Math.max(boxX + chipWidth, p1.x);

      if (
        mx >= leftMost && mx <= rightMost &&
        my >= topMost && my <= bottomMost
      ) {
        return { isHit: true, hitType: "shape" };
      }
    }

    return { isHit: false, hitType: null };
  }
}
