import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { distToSegment } from "../../../math/geometry";

export function renderProjection(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
): void {
    const { style } = drawing;
    if (pts.length < 2) {
        if (pts.length === 1 && isSelected) h.drawHandle(pts[0]);
        return;
    }
    h.ctx.save();
    h.applyStyle(style, false);
    h.drawSegment(pts[0], pts[1]);
    h.ctx.fillStyle = h.ctx.strokeStyle;
    const fs = drawing.textItalic ? "italic " : "";
    const fw = drawing.textBold ? "bold " : "";
    const fz = drawing.fontSize || 12;
    h.ctx.font = `${fs}${fw}${fz}px Inter, sans-serif`;
    h.ctx.fillText("A", pts[0].x - 15, pts[0].y);
    h.ctx.fillText("B", pts[1].x + 5, pts[1].y);
    if (pts.length >= 3) {
        h.ctx.setLineDash([5, 5]);
        h.drawSegment(pts[1], pts[2]);
        h.ctx.fillText("C", pts[2].x + 5, pts[2].y);
    }
    h.ctx.restore();
    if (drawing.showText && drawing.text) {
        const lastPt = pts[pts.length - 1];
        const prevPt = pts[pts.length - 2] || pts[0];
        h.drawTextOnLine(prevPt, lastPt, drawing);
    }
    if (isSelected) pts.forEach((p) => h.drawHandle(p));
}

export function hitTestProjection(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    threshold: number
): HitTestResult {
    let isHit = false;
    if (
        pixelPoints.length >= 2 &&
        distToSegment(
            mx,
            my,
            pixelPoints[0].x,
            pixelPoints[0].y,
            pixelPoints[1].x,
            pixelPoints[1].y
        ) < threshold
    ) {
        isHit = true;
    }
    if (
        !isHit &&
        pixelPoints.length >= 3 &&
        distToSegment(
            mx,
            my,
            pixelPoints[1].x,
            pixelPoints[1].y,
            pixelPoints[2].x,
            pixelPoints[2].y
        ) < threshold
    ) {
        isHit = true;
    }
    return { isHit, hitType: isHit ? "shape" : null };
}
