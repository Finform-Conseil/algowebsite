import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { diagonal, distanceBetweenPoints } from "../../../math/geometry";

export function renderFibCircles(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 1 || !drawing.fibCirclesProps) return;
    const { fibCirclesProps } = drawing;
    const p1 = pts[0]; const p2 = pts[1] || p1;
    const radius = diagonal(p1.x, p1.y, p2.x, p2.y);

    // 1. Draw Trend Line
    if (fibCirclesProps.trendLine.enabled && pts.length >= 2) {
        h.ctx.save();
        h.ctx.strokeStyle = fibCirclesProps.trendLine.color;
        h.ctx.lineWidth = fibCirclesProps.trendLine.lineWidth;
        h.applyLineDash(fibCirclesProps.trendLine.lineStyle as "solid" | "dashed" | "dotted", fibCirclesProps.trendLine.lineWidth);
        h.drawSegment(p1, p2);
        h.ctx.restore();
    }

    // 2. Sort and Draw Concentric Circles
    const enabledLevels = [...fibCirclesProps.levels]
        .filter((l) => l.enabled)
        .sort((a, b) => a.value - b.value);

    let prevRadius = 0; 
    enabledLevels.forEach((level) => {
        const targetRadius = radius * level.value;
        const color = fibCirclesProps.useOneColor ? (fibCirclesProps.oneColor || level.color) : level.color;

        // Fill zone between current level and previous radius (Donut pattern or Circle for center)
        if (fibCirclesProps.background.enabled && targetRadius > prevRadius) {
            h.ctx.save();
            h.ctx.beginPath();
            h.ctx.arc(p1.x, p1.y, targetRadius, 0, Math.PI * 2);
            if (prevRadius > 0) {
                h.ctx.arc(p1.x, p1.y, prevRadius, 0, Math.PI * 2, true);
            }
            h.ctx.fillStyle = color;
            // [TENOR 2026] Standard HDR fill calculation
            h.ctx.globalAlpha = (fibCirclesProps.background.fillOpacity ?? 0.2) * (level.fillOpacity ?? 1);
            h.ctx.fill();
            h.ctx.restore();
        }
        
        prevRadius = targetRadius;

        // Draw Circle Line
        h.ctx.save();
        h.ctx.strokeStyle = color;
        h.ctx.lineWidth = level.lineWidth;
        h.ctx.globalAlpha = level.lineOpacity ?? 1;
        h.applyLineDash(level.lineStyle, level.lineWidth);
        h.ctx.beginPath();
        h.ctx.arc(p1.x, p1.y, targetRadius, 0, 2 * Math.PI);
        h.ctx.stroke();

        // LABELS
        if (fibCirclesProps.showLabels && targetRadius > 0) {
            h.ctx.save();
            h.ctx.fillStyle = color;
            h.ctx.font = "12px Inter, sans-serif";
            h.ctx.textBaseline = "middle";
            h.ctx.textAlign = "left";
            h.ctx.fillText(level.value.toString(), p1.x + targetRadius + 5, p1.y);
            h.ctx.restore();
        }
        h.ctx.restore();
    });
    if (isSelected) { h.drawHandle(p1); if (pts.length >= 2) h.drawHandle(p2); }
}

export function hitTestFibCircles(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 1 || !drawing.fibCirclesProps) return { isHit: false, hitType: null };
    const p1 = points[0]; const p2 = points[1] || p1;
    const rBase = diagonal(p1.x, p1.y, p2.x, p2.y);
    const dist = distanceBetweenPoints(mx, my, p1.x, p1.y);
    const levels = drawing.fibCirclesProps.levels.filter(l => l.enabled);
    for (const l of levels) {
        if (Math.abs(dist - rBase * l.value) < threshold) { 
            return { isHit: true, hitType: 'shape' }; 
        }
    }
    if (drawing.fibCirclesProps.background.enabled && levels.length >= 1) {
        const maxR = rBase * Math.max(...levels.map(l => l.value));
        if (dist <= maxR) { 
            return { isHit: true, hitType: 'shape' }; 
        }
    }
    return { isHit: false, hitType: null };
}
