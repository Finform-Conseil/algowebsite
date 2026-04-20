import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { diagonal, angleBetweenPoints, interpolateWedge } from "../../../math/geometry";

export function renderFibWedge(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.fibWedgeProps) return;
    const { levels, trendLine, background, showLabels } = drawing.fibWedgeProps;
    const p1 = pts[0]; const p2 = pts[1]; const p3 = pts[2];

    // 1. Boundary / Construction Rays
    if (trendLine.enabled) {
        h.ctx.save();
        h.ctx.strokeStyle = trendLine.color;
        h.ctx.lineWidth = trendLine.lineWidth;
        h.applyLineDash(trendLine.lineStyle as "solid" | "dashed" | "dotted", trendLine.lineWidth);
        h.drawSegment(p1, p2);
        if (p3) h.drawSegment(p1, p3);
        h.ctx.restore();
    }

    if (!p3) return;
    const r1 = diagonal(p1.x, p1.y, p2.x, p2.y);
    const r2 = diagonal(p1.x, p1.y, p3.x, p3.y);
    const a1 = angleBetweenPoints(p1.x, p1.y, p2.x, p2.y); const a2 = angleBetweenPoints(p1.x, p1.y, p3.x, p3.y);
    let da = a2 - a1;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da <= -Math.PI) da += 2 * Math.PI;

    const sortedLevels = [...levels].filter(l => l.enabled).sort((a, b) => b.value - a.value);
    const segments = 48;

    sortedLevels.forEach((l, idx) => {
        // 2. FILL
        if (background.enabled) {
            const nextVal = idx === sortedLevels.length - 1 ? 0 : sortedLevels[idx + 1].value;
            h.ctx.save();
            h.ctx.beginPath();
            for (let s = 0; s <= segments; s++) {
                const t = s / segments; const ang = a1 + t * da;
                const cr = (r1 + t * (r2 - r1)) * l.value;
                h.ctx.lineTo(p1.x + Math.cos(ang) * cr, p1.y + Math.sin(ang) * cr);
            }
            for (let s = segments; s >= 0; s--) {
                const t = s / segments; const ang = a1 + t * da;
                const cr = (r1 + t * (r2 - r1)) * nextVal;
                h.ctx.lineTo(p1.x + Math.cos(ang) * cr, p1.y + Math.sin(ang) * cr);
            }
            h.ctx.closePath();
            h.ctx.fillStyle = l.color; h.ctx.globalAlpha = (background.fillOpacity ?? 0.15);
            h.ctx.fill();
            h.ctx.restore();
        }

        // 3. STROKE
        h.ctx.save();
        h.ctx.beginPath();
        for (let s = 0; s <= segments; s++) {
            const t = s / segments; const ang = a1 + t * da;
            const cr = (r1 + t * (r2 - r1)) * l.value;
            if (s === 0) h.ctx.moveTo(p1.x + Math.cos(ang) * cr, p1.y + Math.sin(ang) * cr);
            else h.ctx.lineTo(p1.x + Math.cos(ang) * cr, p1.y + Math.sin(ang) * cr);
        }
        h.ctx.strokeStyle = l.color; h.ctx.lineWidth = l.lineWidth;
        h.ctx.globalAlpha = l.lineOpacity ?? 1;
        h.applyLineDash(l.lineStyle, l.lineWidth);
        h.ctx.stroke();
        h.ctx.restore();

        // 4. LABELS (HDR 2026 Restoration)
        if (showLabels) {
            const nextVal = idx === sortedLevels.length - 1 ? 0 : sortedLevels[idx + 1].value;
            const midLevel = (l.value + nextVal) / 2;
            // Calculate label position at the horizontal center (t=0.5) of the band
            const midAngle = a1 + da / 2;
            const midR = (r1 + 0.5 * (r2 - r1)) * midLevel;
            const lx = p1.x + Math.cos(midAngle) * midR;
            const ly = p1.y + Math.sin(midAngle) * midR;

            h.ctx.save();
            h.ctx.textAlign = "center";
            h.ctx.textBaseline = "middle";
            h.ctx.font = "11px Inter, Roboto, Arial, sans-serif";
            h.ctx.fillStyle = l.color;
            h.ctx.globalAlpha = 0.9;
            h.ctx.fillText(l.value.toString(), lx, ly);
            h.ctx.restore();
        }
    });
    if (isSelected) { h.drawHandle(p1); h.drawHandle(p2); h.drawHandle(p3); }
}

export function hitTestFibWedge(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 3 || !drawing.fibWedgeProps) return { isHit: false, hitType: null };
    const p1 = points[0]; const p2 = points[1]; const p3 = points[2];
    const r1 = diagonal(p1.x, p1.y, p2.x, p2.y);
    const r2 = diagonal(p1.x, p1.y, p3.x, p3.y);
    const a1 = angleBetweenPoints(p1.x, p1.y, p2.x, p2.y);
    const a2 = angleBetweenPoints(p1.x, p1.y, p3.x, p3.y);

    const { isInside, expectedRadius, mouseR } = interpolateWedge(mx, my, p1, r1, r2, a1, a2);
    if (isInside) {
        for (const l of drawing.fibWedgeProps.levels.filter(l => l.enabled)) {
            if (Math.abs(mouseR - expectedRadius * l.value) < threshold) { 
                return { isHit: true, hitType: 'shape' }; 
            }
        }
        if (drawing.fibWedgeProps.background.enabled) {
            const sorted = [...drawing.fibWedgeProps.levels].filter(l => l.enabled).sort((a, b) => a.value - b.value);
            if (sorted.length >= 1 && mouseR <= expectedRadius * sorted[sorted.length - 1].value) { 
                return { isHit: true, hitType: 'shape' }; 
            }
        }
    }
    return { isHit: false, hitType: null };
}
