
import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { distToSegment, distanceBetweenPoints, angleBetweenPoints } from "../../math/geometry";

const HANDLE_HIT_THRESHOLD = 8;
const TEXT_PADDING = 8;
const ADD_TEXT_BTN_WIDTH = 72;
const ADD_TEXT_BTN_HEIGHT = 22;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export class NoteStrategy implements IDrawingStrategy {
  supportedTools = ["note", "price_note"];

  render(
    pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    _chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[]
  ): void {
    if (pts.length < 2) return;

    const isPriceNote = drawing.type === "price_note";
    const [p1, p2] = pts;
    const ctx = h.ctx;
    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
    const hasText = displayText.length > 0;
    const textColor = isPriceNote ? "#ffffff" : (drawing.textColor || drawing.style.color || "#2962FF");
    const fontSize = drawing.fontSize || 14;
    const weight = isPriceNote ? "bold " : (drawing.textBold ? "bold " : "");
    const style = drawing.textItalic ? "italic " : "";
    const baseColor = isPriceNote ? "#2962FF" : (drawing.style.color || "#ffffff");

    ctx.save();

    const sf = drawing.style;
    const useFill = isPriceNote ? true : (sf.fillEnabled && sf.fillColor);
    const chipBg = useFill && sf.fillColor
      ? hexToRgba(sf.fillColor, sf.fillOpacity ?? 0.9)
      : "rgba(19, 23, 34, 0.9)";

    // Connector line
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = drawing.style.lineWidth || 2;
    h.applyLineDash(drawing.style.lineStyle || "solid", drawing.style.lineWidth || 2);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Anchor node (small filled circle at starting point)
    ctx.fillStyle = baseColor;
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
    ctx.fill();

    // Text label at p2
    ctx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
    const textWidth = ctx.measureText(displayText).width;

    if (hasText) {
      // Chip background
      const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, 40);
      const chipHeight = Math.max(fontSize + 8, 20);
      const chipX = p2.x - chipWidth / 2;
      const chipY = p2.y - chipHeight - 8;

      ctx.fillStyle = chipBg;
      ctx.strokeStyle = isPriceNote ? "transparent" : baseColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(chipX, chipY, chipWidth, chipHeight, 4);
      ctx.fill();
      if (!isPriceNote) ctx.stroke();

      // Text
      ctx.fillStyle = textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(displayText, p2.x, chipY + chipHeight / 2);
    } else if (!isPriceNote) {
      // "Add text" affordance when no text (only for regular note)
      const btnX = p2.x - ADD_TEXT_BTN_WIDTH / 2;
      const btnY = p2.y - ADD_TEXT_BTN_HEIGHT - 8;

      ctx.fillStyle = "#ff1744";
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, ADD_TEXT_BTN_WIDTH, ADD_TEXT_BTN_HEIGHT, 4);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "600 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Add text", p2.x, btnY + ADD_TEXT_BTN_HEIGHT / 2);
    }

    // Node at p2 (only for regular note; price_note omits the second anchor)
    if (!isPriceNote) {
      ctx.fillStyle = "rgba(41, 98, 255, 0.2)";
      ctx.strokeStyle = "#2962FF";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // Selection state
    if (isSelected) {
      ctx.save();
      ctx.strokeStyle = "#2962FF";
      ctx.lineWidth = 1.5;

      // Selection handles on both endpoints
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p2.x, p2.y, 5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
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

    if (points.length < 2) return { isHit: false, hitType: null };

    const [p1, p2] = points;
    const d = threshold || HANDLE_HIT_THRESHOLD;

    // Endpoint hit tests
    if (distanceBetweenPoints(mx, my, p1.x, p1.y) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 0 };
    }
    if (distanceBetweenPoints(mx, my, p2.x, p2.y) < HANDLE_HIT_THRESHOLD) {
      return { isHit: true, hitType: "point", pointIndex: 1 };
    }

    // Line hit test
    if (points.length >= 2) {
      const segDist = distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y);
      if (segDist < d * 2) {
        return { isHit: true, hitType: "shape" };
      }
    }

    // Text chip / "Add text" area hit test
    const canvas = document.createElement("canvas");
    const tempCtx = canvas.getContext("2d");
    if (!tempCtx) return { isHit: false, hitType: null };

    const displayText = drawing.text && drawing.showText && drawing.text.trim() ? drawing.text : "";
    const hasText = displayText.length > 0;
    const fontSize = drawing.fontSize || 14;
    const weight = drawing.textBold ? "bold " : "";
    const style = drawing.textItalic ? "italic " : "";
    tempCtx.font = `${style}${weight}${fontSize}px Inter, sans-serif`;
    const textWidth = tempCtx.measureText(displayText).width;

    if (hasText) {
      const chipWidth = Math.max(textWidth + TEXT_PADDING * 2, 40);
      const chipHeight = Math.max(fontSize + 8, 20);
      const chipX = p2.x - chipWidth / 2;
      const chipY = p2.y - chipHeight - 8;

      if (mx >= chipX && mx <= chipX + chipWidth && my >= chipY && my <= chipY + chipHeight) {
        return { isHit: true, hitType: "shape" };
      }
    } else {
      const btnX = p2.x - ADD_TEXT_BTN_WIDTH / 2;
      const btnY = p2.y - ADD_TEXT_BTN_HEIGHT - 8;
      if (mx >= btnX && mx <= btnX + ADD_TEXT_BTN_WIDTH && my >= btnY && my <= btnY + ADD_TEXT_BTN_HEIGHT) {
        return { isHit: true, hitType: "shape" };
      }
    }

    return { isHit: false, hitType: null };
  }
}
