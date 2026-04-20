import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { angleBetweenPoints, distToSegment } from "../../../math/geometry";

export function renderPitchfan(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
) {
    const isCreating = pts.length < 3;
    if (isCreating) {
        if (pts.length >= 1) h.drawHandle(pts[0]);
        if (pts.length >= 2) {
            h.ctx.save();
            h.ctx.strokeStyle = "#E040FB";
            h.ctx.lineWidth = 1;
            h.applyLineDash("dashed", 1);
            h.ctx.beginPath(); h.ctx.moveTo(pts[0].x, pts[0].y); h.ctx.lineTo(pts[1].x, pts[1].y); h.ctx.stroke();
            h.ctx.restore();
            h.drawHandle(pts[1], "#fff", 3);
        }
        return;
    }
    if (pts.length < 3) return;
    const [p1, p2, p3] = pts;
    const angleToP2 = angleBetweenPoints(p1.x, p1.y, p2.x, p2.y);
    const angleToP3 = angleBetweenPoints(p1.x, p1.y, p3.x, p3.y);
    const { pitchfanProps } = drawing;
    const levels = pitchfanProps?.levels || [];
    const RAY_LENGTH = 20000;
    const fillEnabled = pitchfanProps?.fillBackground ?? drawing.style.fillEnabled ?? true;
    const fillOpacity = pitchfanProps?.fillOpacity ?? drawing.style.fillOpacity ?? 0.08;
    const enabledLevels = levels.filter(l => l.enabled).sort((a, b) => a.t - b.t);

    if (fillEnabled && enabledLevels.length >= 2) {
        for (let i = 0; i < enabledLevels.length - 1; i++) {
            const la = enabledLevels[i]; const lb = enabledLevels[i + 1];
            const angA = angleToP3 + la.t * (angleToP2 - angleToP3);
            const angB = angleToP3 + lb.t * (angleToP2 - angleToP3);
            const eA = { x: p1.x + Math.cos(angA) * RAY_LENGTH, y: p1.y + Math.sin(angA) * RAY_LENGTH };
            const eB = { x: p1.x + Math.cos(angB) * RAY_LENGTH, y: p1.y + Math.sin(angB) * RAY_LENGTH };
            h.ctx.save();
            h.ctx.fillStyle = la.color; h.ctx.globalAlpha = fillOpacity;
            h.ctx.beginPath(); h.ctx.moveTo(p1.x, p1.y); h.ctx.lineTo(eA.x, eA.y); h.ctx.lineTo(eB.x, eB.y); h.ctx.closePath();
            h.ctx.fill(); h.ctx.restore();
        }
    }

    levels.forEach(l => {
        if (!l.enabled) return;
        const angle = angleToP3 + l.t * (angleToP2 - angleToP3);
        const endPt = { x: p1.x + Math.cos(angle) * RAY_LENGTH, y: p1.y + Math.sin(angle) * RAY_LENGTH };
        h.ctx.save();
        const isMedian = l.t === 0.5;
        const levelColor = isMedian ? (drawing.style.color || l.color) : l.color;
        h.ctx.strokeStyle = levelColor;
        h.ctx.lineWidth = l.lineWidth;
        h.ctx.globalAlpha = l.lineOpacity ?? 1;
        h.applyLineDash(l.lineStyle, l.lineWidth);
        h.drawSegment(p1, endPt);
        h.ctx.restore();
    });

    const trendLineEnabled = pitchfanProps?.showTrendLine ?? pitchfanProps?.trendLine?.enabled ?? true;
    if (trendLineEnabled) {
        h.ctx.save();
        const tl = pitchfanProps?.trendLine;
        h.ctx.strokeStyle = tl?.color || drawing.style.color || "#f44336";
        h.ctx.lineWidth = tl?.lineWidth || 1;
        h.ctx.globalAlpha = 1;
        h.applyLineDash(tl?.lineStyle || "solid", tl?.lineWidth || 1);
        h.drawSegment(p2, p3);
        h.ctx.restore();
    }

    if (isSelected) { h.drawHandle(p1); h.drawHandle(p2); h.drawHandle(p3); }

    if (drawing.showText && drawing.text) {
        const pMid = { x: (p2.x + p3.x) / 2, y: (p2.y + p3.y) / 2 };
        h.drawTextOnLine(p1, pMid, drawing);
    }
}

export function hitTestPitchfan(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 3 || !drawing.pitchfanProps) return { isHit: false, hitType: null };
    const p1 = points[0]; const p2 = points[1]; const p3 = points[2];
    const a1 = angleBetweenPoints(p1.x, p1.y, p2.x, p2.y);
    const a2 = angleBetweenPoints(p1.x, p1.y, p3.x, p3.y);
    for (const l of drawing.pitchfanProps.levels.filter(l => l.enabled)) {
        const angle = a2 + l.t * (a1 - a2);
        const rayEndX = p1.x + Math.cos(angle) * 10000;
        const rayEndY = p1.y + Math.sin(angle) * 10000;
        if (distToSegment(mx, my, p1.x, p1.y, rayEndX, rayEndY, false, true) < threshold) { 
            return { isHit: true, hitType: 'shape' }; 
        }
    }
    return { isHit: false, hitType: null };
}
