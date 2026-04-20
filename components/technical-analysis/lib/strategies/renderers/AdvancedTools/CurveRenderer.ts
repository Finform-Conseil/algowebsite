import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { distToSegment } from "../../../math/geometry";

export function renderCurve(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
): void {
    if (pts.length < 2) {
        if (pts.length === 1 && isSelected) h.drawHandle(pts[0]);
        return;
    }
    h.ctx.beginPath();
    h.ctx.moveTo(pts[0].x, pts[0].y);
    if (pts.length === 2) {
        h.ctx.lineTo(pts[1].x, pts[1].y);
    } else if (pts.length >= 3) {
        h.ctx.quadraticCurveTo(pts[1].x, pts[1].y, pts[2].x, pts[2].y);
    }
    h.ctx.stroke();
    if (drawing.showText && drawing.text && pts.length >= 2) {
        const centerX = pts.length >= 3 ? pts[1].x : (pts[0].x + pts[1].x) / 2;
        const centerY = pts.length >= 3 ? pts[1].y : (pts[0].y + pts[1].y) / 2;
        h.drawTextOnLine({ x: centerX - 10, y: centerY }, { x: centerX + 10, y: centerY }, drawing);
    }
    if (isSelected) pts.forEach((p) => h.drawHandle(p));
}

export function hitTestCurve(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    threshold: number
): HitTestResult {
    let isHit = false;
    for (let j = 0; j < pixelPoints.length - 1; j++) {
        if (
            distToSegment(
                mx,
                my,
                pixelPoints[j].x,
                pixelPoints[j].y,
                pixelPoints[j + 1].x,
                pixelPoints[j + 1].y
            ) < threshold
        ) {
            isHit = true;
            break;
        }
    }
    return { isHit, hitType: isHit ? "shape" : null };
}
