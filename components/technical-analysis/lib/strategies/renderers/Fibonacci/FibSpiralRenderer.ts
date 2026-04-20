import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing } from "../../../../config/TechnicalAnalysisTypes";
import { diagonal, angleBetweenPoints, distanceBetweenPoints, calculateFibSpiralRadius } from "../../../math/geometry";

export function renderFibSpiral(
    pts: { x: number; y: number }[],
    drawing: Drawing,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 1 || !drawing.fibSpiralProps) return;
    const { fibSpiralProps } = drawing;
    const p1 = pts[0]; const p2 = pts[1] || p1;
    const rBase = diagonal(p1.x, p1.y, p2.x, p2.y);
    const thetaStart = angleBetweenPoints(p1.x, p1.y, p2.x, p2.y);
    const PHI = 1.618033988749895;
    const dir = fibSpiralProps.counterclockwise ? -1 : 1;

    // 1. Draw Trend Line
    if (fibSpiralProps.trendLine?.enabled && pts.length >= 2) {
        h.ctx.save();
        h.ctx.strokeStyle = fibSpiralProps.trendLine.color;
        h.ctx.lineWidth = fibSpiralProps.trendLine.lineWidth;
        h.applyLineDash(fibSpiralProps.trendLine.lineStyle as "solid" | "dashed" | "dotted", fibSpiralProps.trendLine.lineWidth);
        h.drawSegment(p1, p2);
        h.ctx.restore();
    }

    // 2. Background Fill
    if (fibSpiralProps.background?.enabled) {
        const sortedLevels = [...fibSpiralProps.levels].filter(l => l.enabled).sort((a, b) => b.value - a.value);
        sortedLevels.forEach((l, idx) => {
            if (idx === sortedLevels.length - 1) return;
            const nextL = sortedLevels[idx + 1];
            const rOuter = rBase * l.value;
            const rInner = rBase * nextL.value;
            const color = fibSpiralProps.useOneColor ? (fibSpiralProps.oneColor || drawing.style.color) : l.color;

            h.ctx.save();
            h.ctx.beginPath();
            // Outer spiral (forward)
            for (let t = -Math.PI * 2; t <= Math.PI * 8; t += 0.1) {
                const r = rOuter * Math.pow(PHI, (2 * t) / Math.PI);
                const angle = thetaStart + t * dir;
                h.ctx.lineTo(p1.x + r * Math.cos(angle), p1.y + r * Math.sin(angle));
            }
            // Inner spiral (backward)
            for (let t = Math.PI * 8; t >= -Math.PI * 2; t -= 0.1) {
                const r = rInner * Math.pow(PHI, (2 * t) / Math.PI);
                const angle = thetaStart + t * dir;
                h.ctx.lineTo(p1.x + r * Math.cos(angle), p1.y + r * Math.sin(angle));
            }
            h.ctx.closePath();
            h.ctx.fillStyle = color;
            h.ctx.globalAlpha = fibSpiralProps.background?.fillOpacity ?? 0.15;
            h.ctx.fill();
            h.ctx.restore();
        });
    }

    // 3. Spirals (Levels)
    fibSpiralProps.levels.filter(l => l.enabled).forEach((l: { value: number; color: string; lineStyle: "solid" | "dashed" | "dotted"; lineWidth: number; lineOpacity: number; }) => {
        const rLevel = rBase * l.value;
        h.ctx.save();
        const color = fibSpiralProps.useOneColor ? (fibSpiralProps.oneColor || drawing.style.color) : l.color;
        h.ctx.strokeStyle = color;
        h.ctx.lineWidth = l.lineWidth;
        h.ctx.globalAlpha = l.lineOpacity ?? 1;
        h.applyLineDash(l.lineStyle, l.lineWidth);

        h.ctx.beginPath();
        let first = true;
        for (let t = -Math.PI * 2; t <= Math.PI * 8; t += 0.05) {
            const r = rLevel * Math.pow(PHI, (2 * t) / Math.PI);
            const angle = thetaStart + t * dir;
            const x = p1.x + r * Math.cos(angle);
            const y = p1.y + r * Math.sin(angle);
            if (first) { h.ctx.moveTo(x, y); first = false; } else { h.ctx.lineTo(x, y); }
        }
        h.ctx.stroke();

        // LABELS
        if (fibSpiralProps.showLabels) {
            h.ctx.save();
            h.ctx.fillStyle = color;
            h.ctx.font = "10px Inter, sans-serif";
            h.ctx.textAlign = "left";
            h.ctx.textBaseline = "middle";
            const lx = p1.x + rLevel * Math.cos(thetaStart);
            const ly = p1.y + rLevel * Math.sin(thetaStart);
            const offX = 5 * Math.cos(thetaStart);
            const offY = 5 * Math.sin(thetaStart);
            h.ctx.fillText(l.value.toString(), lx + offX, ly + offY);
            h.ctx.restore();
        }
        h.ctx.restore();
    });

    // 3. Anchor Markers (Circles)
    const markerColor = fibSpiralProps.trendLine?.color || (fibSpiralProps.useOneColor ? fibSpiralProps.oneColor : "#00BCD4") || "#00BCD4";
    const drawMarker = (p: { x: number; y: number }) => {
        h.ctx.save();
        h.ctx.lineWidth = 1.5; h.ctx.setLineDash([]);
        h.ctx.beginPath(); h.ctx.strokeStyle = markerColor; h.ctx.fillStyle = "#FFFFFF";
        h.ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); h.ctx.stroke(); h.ctx.fill();
        h.ctx.beginPath(); h.ctx.fillStyle = markerColor;
        h.ctx.arc(p.x, p.y, 1, 0, Math.PI * 2); h.ctx.fill();
        h.ctx.restore();
    };
    drawMarker(p1);
    if (pts.length >= 2) drawMarker(p2);

    if (isSelected) { h.drawHandle(p1); if (pts.length >= 2) h.drawHandle(p2); }
}

export function hitTestFibSpiral(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 1 || !drawing.fibSpiralProps) return { isHit: false, hitType: null };
    const p1 = points[0]; const p2 = points[1] || p1;
    const rBase = diagonal(p1.x, p1.y, p2.x, p2.y);
    const thetaStart = angleBetweenPoints(p1.x, p1.y, p2.x, p2.y);
    const dir = drawing.fibSpiralProps.counterclockwise ? -1 : 1;
    const mouseR = distanceBetweenPoints(mx, my, p1.x, p1.y);
    const mouseAngle = angleBetweenPoints(p1.x, p1.y, mx, my);

    for (const l of drawing.fibSpiralProps.levels.filter(l => l.enabled)) {
        const rLevel = rBase * l.value;
        const rAtMouseAngle = calculateFibSpiralRadius(rLevel, thetaStart, mouseAngle, dir);
        if (Math.abs(mouseR - rAtMouseAngle) < threshold * 2) { // Tolerance
            return { isHit: true, hitType: 'shape' }; 
        }
    }
    return { isHit: false, hitType: null };
}
