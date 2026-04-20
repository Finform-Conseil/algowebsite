import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { distToSegment, diagonal } from "../../../math/geometry";

export function renderParallelChannel(
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
    const [p0, p1] = pts;
    const p2 = pts.length >= 3 ? pts[2] : pts[1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const len = diagonal(0, 0, dx, dy);
    if (len === 0) return;
    const A = p0.y - p1.y;
    const B = p1.x - p0.x;
    const C = p0.x * p1.y - p1.x * p0.y;
    const dist = (A * p2.x + B * p2.y + C) / len;
    const nx = -dy / len;
    const ny = dx / len;
    const p0_offset = { x: p0.x + nx * dist, y: p0.y + ny * dist };
    const p1_offset = { x: p1.x + nx * dist, y: p1.y + ny * dist };

    const p0_final = { ...p0 }; const p1_final = { ...p1 };
    const p0_off_final = { ...p0_offset }; const p1_off_final = { ...p1_offset };

    if (drawing.extendLeft) {
        p0_final.x -= dx * 100; p0_final.y -= dy * 100;
        p0_off_final.x -= dx * 100; p0_off_final.y -= dy * 100;
    }
    if (drawing.extendRight) {
        p1_final.x += dx * 100; p1_final.y += dy * 100;
        p1_off_final.x += dx * 100; p1_off_final.y += dy * 100;
    }

    if (style.fillEnabled !== false) {
        h.ctx.save();
        h.ctx.fillStyle = style.fillColor || "rgba(41, 98, 255, 0.1)";
        h.ctx.globalAlpha = style.fillOpacity ?? 0.15;
        h.ctx.beginPath();
        h.ctx.moveTo(p0_final.x, p0_final.y);
        h.ctx.lineTo(p1_final.x, p1_final.y);
        h.ctx.lineTo(p1_off_final.x, p1_off_final.y);
        h.ctx.lineTo(p0_off_final.x, p0_off_final.y);
        h.ctx.closePath();
        h.ctx.fill();
        h.ctx.restore();
    }

    h.drawSegment(p0_final, p1_final);
    h.drawSegment(p0_off_final, p1_off_final);

    if (drawing.showMiddleLine !== false) {
        const p0_mid_final = { x: p0_final.x + nx * dist / 2, y: p0_final.y + ny * dist / 2 };
        const p1_mid_final = { x: p1_final.x + nx * dist / 2, y: p1_final.y + ny * dist / 2 };
        h.ctx.save();
        h.applyLineDash("dashed", h.ctx.lineWidth);
        h.drawSegment(p0_mid_final, p1_mid_final);
        h.ctx.restore();
    }

    if (drawing.showText && drawing.text) {
        const p0_mid = { x: p0_final.x + nx * dist / 2, y: p0_final.y + ny * dist / 2 };
        const p1_mid = { x: p1_final.x + nx * dist / 2, y: p1_final.y + ny * dist / 2 };
        h.drawTextOnLine(p0_mid, p1_mid, drawing);
    }

    if (isSelected) {
        h.drawHandle(p0); h.drawHandle(p1);
        h.drawHandle(p0_offset); h.drawHandle(p1_offset);
    }
}

export function hitTestParallelChannel(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 2) return { isHit: false, hitType: null };
    
    let isHit = false;
    const p0 = points[0]; const p1 = points[1]; const p2 = points[2] || p1;
    const dx = p1.x - p0.x; const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len > 0) {
        const A = dy; const B = p0.x - p1.x; const C = p1.x * p0.y - p0.x * p1.y;
        const dist = (A * p2.x + B * p2.y + C) / len;
        const nx = -dy / len; const ny = dx / len;
        const p0_offset = { x: p0.x + nx * dist, y: p0.y + ny * dist };
        const p1_offset = { x: p1.x + nx * dist, y: p1.y + ny * dist };
        const extL = drawing.extendLeft || false; const extR = drawing.extendRight || false;

        if (Math.hypot(mx - p0_offset.x, my - p0_offset.y) < 12) return { isHit: true, hitType: 'point', pointIndex: 2 };
        if (Math.hypot(mx - p1_offset.x, my - p1_offset.y) < 12) return { isHit: true, hitType: 'point', pointIndex: 2 };

        if (distToSegment(mx, my, p0.x, p0.y, p1.x, p1.y, extL, extR) < threshold ||
            distToSegment(mx, my, p0_offset.x, p0_offset.y, p1_offset.x, p1_offset.y, extL, extR) < threshold) {
            isHit = true;
        }
        if (!isHit && drawing.showMiddleLine !== false) {
            const p0_mid = { x: p0.x + nx * dist / 2, y: p0.y + ny * dist / 2 };
            const p1_mid = { x: p1.x + nx * dist / 2, y: p1.y + ny * dist / 2 };
            if (distToSegment(mx, my, p0_mid.x, p0_mid.y, p1_mid.x, p1_mid.y, extL, extR) < threshold) isHit = true;
        }
        if (!isHit && drawing.style.fillEnabled !== false) {
            const poly = [
                { x: p0.x - (extL ? dx * 100 : 0), y: p0.y - (extL ? dy * 100 : 0) },
                { x: p1.x + (extR ? dx * 100 : 0), y: p1.y + (extR ? dy * 100 : 0) },
                { x: p1_offset.x + (extR ? dx * 100 : 0), y: p1_offset.y + (extR ? dy * 100 : 0) },
                { x: p0_offset.x - (extL ? dx * 100 : 0), y: p0_offset.y - (extL ? dy * 100 : 0) }
            ];
            let inside = false;
            for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
                if (((poly[j].y > my) !== (poly[k].y > my)) &&
                    (mx < (poly[k].x - poly[j].x) * (my - poly[j].y) / (poly[k].y - poly[j].y) + poly[j].x)) {
                    inside = !inside;
                }
            }
            if (inside) isHit = true;
        }
    }
    return { isHit, hitType: isHit ? 'shape' : null };
}
