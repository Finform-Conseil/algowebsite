import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { distToSegment, diagonal } from "../../../math/geometry";

export function renderFlatTopBottom(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2) {
        if (pts.length === 1 && isSelected) h.drawHandle(pts[0]);
        return;
    }
    const { style } = drawing;
    const [p1, p2] = pts;
    let baseY = p1.y;
    if (pts.length >= 3) baseY = pts[2].y;

    const p3_proj = { x: p2.x, y: baseY };
    const p4_proj = { x: p1.x, y: baseY };
    const p1_f = { ...p1 }, p2_f = { ...p2 }, p3_f = { ...p3_proj }, p4_f = { ...p4_proj };

    const dx = p2.x - p1.x; const dy = p2.y - p1.y;
    const len = diagonal(0, 0, dx, dy);
    const dir = len > 0 ? { x: dx / len, y: dy / len } : { x: 0, y: 0 };

    if (drawing.extendLeft) {
        p1_f.x -= dir.x * 10000; p1_f.y -= dir.y * 10000;
        p4_f.x -= dir.x * 10000; p4_f.y -= dir.y * 10000;
    }
    if (drawing.extendRight) {
        p2_f.x += dir.x * 10000; p2_f.y += dir.y * 10000;
        p3_f.x += dir.x * 10000; p3_f.y += dir.y * 10000;
    }

    if (style.fillEnabled !== false) {
        h.ctx.save();
        h.ctx.fillStyle = style.fillColor || "#FF9800";
        h.ctx.globalAlpha = style.fillOpacity ?? 0.2;
        h.ctx.beginPath();
        h.ctx.moveTo(p1_f.x, p1_f.y); h.ctx.lineTo(p2_f.x, p2_f.y);
        h.ctx.lineTo(p3_f.x, p3_f.y); h.ctx.lineTo(p4_f.x, p4_f.y);
        h.ctx.closePath();
        h.ctx.fill();
        h.ctx.restore();
    }

    h.drawSegment(p1_f, p2_f);
    h.drawSegment(p4_f, p3_f);

    if (drawing.showText && drawing.text) {
        const p0_mid = { x: p1.x, y: (p1.y + baseY) / 2 };
        const p1_mid = { x: p2.x, y: (p2.y + baseY) / 2 };
        h.drawTextOnLine(p0_mid, p1_mid, drawing);
    }

    if (isSelected) {
        h.drawHandle(p1); h.drawHandle(p2);
        if (pts.length >= 3) h.drawHandle(pts[2]);
    }
}

export function hitTestFlatTopBottom(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 2) return { isHit: false, hitType: null };
    let isHit = false;
    const p1 = points[0]; const p2 = points[1];
    let p3 = points[2] || p2;
    p3 = { x: p2.x, y: p3.y }; 
    const p4 = { x: p1.x, y: p3.y };
    
    const extL = drawing.extendLeft || false; const extR = drawing.extendRight || false;
    if (distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y, extL, extR) < threshold ||
        distToSegment(mx, my, p4.x, p4.y, p3.x, p3.y, extL, extR) < threshold) {
        isHit = true;
    }
    if (!isHit && drawing.style.fillEnabled !== false) {
        const poly = [p1, p2, p3, p4];
        let inside = false;
        for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
            if (((poly[j].y > my) !== (poly[k].y > my)) &&
                (mx < (poly[k].x - poly[j].x) * (my - poly[j].y) / (poly[k].y - poly[j].y) + poly[j].x)) {
                inside = !inside;
            }
        }
        if (inside) isHit = true;
    }
    return { isHit, hitType: isHit ? 'shape' : null };
}
