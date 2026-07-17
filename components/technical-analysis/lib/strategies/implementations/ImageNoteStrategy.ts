import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";
import { safeConvertToPixel } from "../../../hooks/drawing/drawingCoordinates";
import {
  getImageNoteImage,
  clearImageNoteImage,
} from "../../imageNote/imageNoteAssetLoader";

export type ImageNoteResizeEdge = "topLeft" | "topRight" | "bottomLeft" | "bottomRight";

const HANDLE_RADIUS = 6;
const HANDLE_HIT_RADIUS = 10;

export const IMAGE_NOTE_TOOL_ID = "image_note";

export class ImageNoteStrategy implements IDrawingStrategy {
  supportedTools = [IMAGE_NOTE_TOOL_ID];

  private computeGeometry(drawing: Drawing, chart: EChartsInstance) {
    if (drawing.points.length < 1) return null;
    const p0 = drawing.points[0];
    const pixel = safeConvertToPixel(chart, [p0.time, p0.value]);
    if (!pixel) return null;
    const props = drawing.imageNoteProps;
    if (!props) return null;
    const cx = Math.round(pixel[0]);
    const cy = Math.round(pixel[1]);
    const halfW = props.cssWidth / 2;
    const halfH = props.cssHeight / 2;
    const left = cx - halfW;
    const right = cx + halfW;
    const top = cy - halfH;
    const bottom = cy + halfH;
    return { cx, cy, left, right, top, bottom, halfW, halfH };
  }

  private corners(geo: { left: number; right: number; top: number; bottom: number }) {
    return [
      { x: geo.left, y: geo.top, edge: "topLeft" as ImageNoteResizeEdge },
      { x: geo.right, y: geo.top, edge: "topRight" as ImageNoteResizeEdge },
      { x: geo.left, y: geo.bottom, edge: "bottomLeft" as ImageNoteResizeEdge },
      { x: geo.right, y: geo.bottom, edge: "bottomRight" as ImageNoteResizeEdge },
    ];
  }

  render(
    _pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers,
    _chartData: ChartDataPoint[],
  ): void {
    const geo = this.computeGeometry(drawing, chart);
    if (!geo) return;
    const props = drawing.imageNoteProps!;
    const ctx = h.ctx;

    ctx.save();

    const img = getImageNoteImage(props.assetId);
    if (img) {
      const alpha = Math.max(0, Math.min(1, (100 - (props.transparency ?? 0)) / 100));
      ctx.globalAlpha = alpha;
      try {
        ctx.drawImage(img, geo.left, geo.top, props.cssWidth, props.cssHeight);
      } catch {
        // ignore invalid draw
      }
      ctx.globalAlpha = 1;
    } else {
      // Placeholder frame while the asset loads / if missing.
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#2a2e39";
      ctx.fillRect(geo.left, geo.top, props.cssWidth, props.cssHeight);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#787b86";
      ctx.lineWidth = 1;
      ctx.strokeRect(geo.left, geo.top, props.cssWidth, props.cssHeight);
    }

    if (isSelected) {
      const corners = this.corners(geo);
      for (let i = 0; i < corners.length; i++) {
        h.drawHandle({ x: corners[i].x, y: corners[i].y }, "#2962ff", HANDLE_RADIUS, "square");
      }
    }

    ctx.restore();
  }

  hitTest(
    mx: number,
    my: number,
    drawing: Drawing,
    chart: EChartsInstance,
    _threshold: number,
  ): HitTestResult {
    if (drawing.hidden) return { isHit: false, hitType: null };
    const geo = this.computeGeometry(drawing, chart);
    if (!geo) return { isHit: false, hitType: null };

    // Corner handles take priority (only meaningful when selected, but harmless otherwise).
    const corners = this.corners(geo);
    for (let i = 0; i < corners.length; i++) {
      const c = corners[i];
      if (Math.hypot(mx - c.x, my - c.y) <= HANDLE_HIT_RADIUS) {
        return { isHit: true, hitType: "shape", resizeEdge: c.edge };
      }
    }

    if (
      mx >= geo.left &&
      mx <= geo.right &&
      my >= geo.top &&
      my <= geo.bottom
    ) {
      return { isHit: true, hitType: "shape" };
    }

    return { isHit: false, hitType: null };
  }
}

/** Remove decoded image from cache when the drawing is deleted. */
export const disposeImageNoteAsset = (drawing: Drawing | null | undefined): void => {
  if (drawing && drawing.type === IMAGE_NOTE_TOOL_ID) {
    clearImageNoteImage(drawing.imageNoteProps?.assetId);
  }
};
