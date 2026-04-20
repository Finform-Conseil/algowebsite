import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { distToSegment } from "../../../math/geometry";

function drawArrowhead(
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    size: number = 10
) {
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    ctx.beginPath();
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(
        p2.x - size * Math.cos(angle - Math.PI / 6),
        p2.y - size * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(p2.x, p2.y);
    ctx.lineTo(
        p2.x - size * Math.cos(angle + Math.PI / 6),
        p2.y - size * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
}

export function renderPath(
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
    h.ctx.beginPath();
    h.ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        h.ctx.lineTo(pts[i].x, pts[i].y);
    }
    if (style.fillEnabled && style.fillColor) {
        h.ctx.save();
        h.ctx.fillStyle = style.fillColor;
        h.ctx.globalAlpha = style.fillOpacity ?? 0.2;
        h.ctx.fill();
        h.ctx.restore();
    }
    h.ctx.stroke();

    for (let i = 1; i < pts.length; i++) {
        drawArrowhead(h.ctx, pts[i-1], pts[i], 12);
    }

    if (drawing.showText && drawing.text && pts.length >= 2) {
        const minX = Math.min(...pts.map((p) => p.x));
        const maxX = Math.max(...pts.map((p) => p.x));
        const minY = Math.min(...pts.map((p) => p.y));
        const maxY = Math.max(...pts.map((p) => p.y));
        const centerY = minY + (maxY - minY) / 2;
        h.drawTextOnLine({ x: minX, y: centerY }, { x: maxX, y: centerY }, drawing);
    }
    if (isSelected) pts.forEach((p) => h.drawHandle(p));
}

export function hitTestPath(
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
