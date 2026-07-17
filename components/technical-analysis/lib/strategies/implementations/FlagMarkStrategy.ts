import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { safeConvertToPixel } from "../../../hooks/drawing/drawingCoordinates";

const FLAG_TOTAL_WIDTH = 19;
const FLAG_OFFSET_X = 2;
const FLAG_BODY_WIDTH = FLAG_TOTAL_WIDTH - FLAG_OFFSET_X;
const FLAG_HEIGHT = 12;
const MAST_LENGTH = 20;
const MAST_WIDTH = 1;
const FLAG_DEFAULT_COLOR = "#2962FF";
const MAST_COLOR = "#787b86";
const NOTCH_DEPTH = 3;
const HANDLE_RADIUS = 6;

export class FlagMarkStrategy implements IDrawingStrategy {
  supportedTools = ["flag_mark"];

  render(
    pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    _chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[],
  ): void {
    if (pts.length < 1) return;
    const { x: ax, y: ay } = pts[0];
    if (!Number.isFinite(ax) || !Number.isFinite(ay)) return;

    const anchorX = Math.round(ax);
    const anchorY = Math.round(ay);
    const flagColor = drawing.flagMarkProps?.flagColor || FLAG_DEFAULT_COLOR;
    const ctx = h.ctx;

    ctx.save();

    ctx.fillStyle = MAST_COLOR;
    ctx.fillRect(anchorX, anchorY - MAST_LENGTH, MAST_WIDTH, MAST_LENGTH);

    const flagLeft = anchorX + FLAG_OFFSET_X;
    const flagTop = anchorY - MAST_LENGTH;
    const flagBottom = flagTop + FLAG_HEIGHT;
    const flagRight = anchorX + FLAG_TOTAL_WIDTH;
    const notchCenterY = flagTop + FLAG_HEIGHT / 2;

    ctx.fillStyle = flagColor;
    ctx.beginPath();
    ctx.moveTo(flagLeft, flagTop);
    ctx.lineTo(flagRight, flagTop);
    ctx.lineTo(flagRight - NOTCH_DEPTH, notchCenterY);
    ctx.lineTo(flagRight, flagBottom);
    ctx.lineTo(flagLeft, flagBottom);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = flagColor;
    ctx.lineWidth = MAST_WIDTH;
    ctx.stroke();

    if (isSelected) {
      h.drawHandle({ x: anchorX, y: anchorY }, drawing.style.color || MAST_COLOR, HANDLE_RADIUS, "circle");
    }

    ctx.restore();
  }

  hitTest(
    mx: number,
    my: number,
    drawing: Drawing,
    chartInstance: EChartsInstance,
    threshold: number,
  ): HitTestResult {
    if (drawing.hidden) return { isHit: false, hitType: null };
    if (drawing.points.length < 1) return { isHit: false, hitType: null };

    const p0 = drawing.points[0];
    const pixel = safeConvertToPixel(chartInstance, [p0.time, p0.value]);
    if (!pixel) return { isHit: false, hitType: null };

    const anchorX = Math.round(pixel[0]);
    const anchorY = Math.round(pixel[1]);
    const t = threshold || 0;

    const hitLeft = anchorX - t;
    const hitRight = anchorX + FLAG_TOTAL_WIDTH + t;
    const hitTop = anchorY - MAST_LENGTH - t;
    const hitBottom = anchorY + t;

    if (mx >= hitLeft && mx <= hitRight && my >= hitTop && my <= hitBottom) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}