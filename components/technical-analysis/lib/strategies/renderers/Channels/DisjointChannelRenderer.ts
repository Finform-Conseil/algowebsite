import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { distToSegment } from "../../../math/geometry";

export function renderDisjointChannel(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
) {
    const { style } = drawing;
    if (pts.length < 2) {
        if (pts.length === 1 && isSelected) h.drawHandle(pts[0]);
        return;
    }
    const [p1, p2] = pts;
    const p3 = pts.length >= 3 ? pts[2] : p2;
    let p4 = pts.length >= 4 ? pts[3] : p1;
    if (pts.length === 3) {
        const dx = p2.x - p1.x; const dy = p2.y - p1.y;
        p4 = { x: p3.x - dx, y: p3.y - dy };
    }

    const p1_f = { ...p1 }, p2_f = { ...p2 }, p3_f = { ...p3 }, p4_f = { ...p4 };

    if (drawing.extendLeft) {
        const v12 = { x: p1.x - p2.x, y: p1.y - p2.y };
        const v43 = { x: p4.x - p3.x, y: p4.y - p3.y };
        p1_f.x += v12.x * 100; p1_f.y += v12.y * 100;
        p4_f.x += v43.x * 100; p4_f.y += v43.y * 100;
    }
    if (drawing.extendRight) {
        const v21 = { x: p2.x - p1.x, y: p2.y - p1.y };
        const v34 = { x: p3.x - p4.x, y: p3.y - p4.y };
        p2_f.x += v21.x * 100; p2_f.y += v21.y * 100;
        p3_f.x += v34.x * 100; p3_f.y += v34.y * 100;
    }

    if (style.fillEnabled !== false) {
        h.ctx.save();
        h.ctx.fillStyle = style.fillColor || "rgba(41, 98, 255, 0.1)";
        h.ctx.globalAlpha = style.fillOpacity ?? 0.15;
        h.ctx.beginPath();
        h.ctx.moveTo(p1_f.x, p1_f.y); h.ctx.lineTo(p2_f.x, p2_f.y);
        h.ctx.lineTo(p3_f.x, p3_f.y); h.ctx.lineTo(p4_f.x, p4_f.y);
        h.ctx.closePath();
        h.ctx.fill();
        h.ctx.restore();
    }

    h.drawSegment(p1_f, p2_f);
    h.drawSegment(p4_f, p3_f);

    if (isSelected) {
        h.drawHandle(p1); h.drawHandle(p2);
        h.drawHandle(p3); if (pts.length >= 3) h.drawHandle(p4);
    }

    if (drawing.showText && drawing.text) {
        const mid1 = { x: (p1_f.x + p4_f.x) / 2, y: (p1_f.y + p4_f.y) / 2 };
        const mid2 = { x: (p2_f.x + p3_f.x) / 2, y: (p2_f.y + p3_f.y) / 2 };
        h.drawTextOnLine(mid1, mid2, drawing);
    }
}

export function hitTestDisjointChannel(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 2) return { isHit: false, hitType: null };
    let isHit = false;
    const p1 = points[0]; const p2 = points[1];
    const p3 = points[2] || p2;
    let p4 = points[3];
    if (!p4) {
        const dx = p2.x - p1.x; const dy = p2.y - p1.y;
        p4 = { x: p3.x - dx, y: p3.y - dy };
    }
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
