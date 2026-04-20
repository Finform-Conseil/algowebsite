import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { EChartsInstance } from "./support/FibonacciUtils";


export function renderFibSpeedResistanceArcs(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.fibSpeedResistanceArcsProps) return;
    const { levels, trendLine, background, showLabels } = drawing.fibSpeedResistanceArcsProps;
    const p1 = pts[0]; const p2 = pts[1]; const p3 = pts[2];

    // 1. Construction Lines
    if (trendLine.enabled) {
        h.ctx.save();
        h.ctx.strokeStyle = trendLine.color;
        h.ctx.lineWidth = trendLine.lineWidth;
        h.ctx.globalAlpha = trendLine.lineOpacity ?? 1;
        h.applyLineDash(trendLine.lineStyle as "solid" | "dashed" | "dotted", trendLine.lineWidth);
        h.drawSegment(p1, p2);
        if (p3) h.drawSegment(p2, p3);
        h.ctx.restore();
    }

    if (!p3) return;
    const rx_base = Math.abs(p2.x - p1.x);
    const ry_base = Math.abs(p3.y - p1.y);
    const isRight = p2.x >= p1.x;
    const startAngle = isRight ? -Math.PI / 2 : Math.PI / 2;
    const endAngle = isRight ? Math.PI / 2 : 3 * Math.PI / 2;

    const activeLevels = [...levels].filter(l => l.enabled).sort((a, b) => b.value - a.value);

    activeLevels.forEach((l, idx) => {
        const rx = rx_base * l.value;
        const ry = ry_base * l.value;
        if (rx < 0.5 || ry < 0.5) return;

        // 2. FILL (Donut)
        if (background.enabled) {
            const nextVal = idx === activeLevels.length - 1 ? 0 : activeLevels[idx + 1].value;
            const nextRx = rx_base * nextVal;
            const nextRy = ry_base * nextVal;
            h.ctx.save();
            h.ctx.beginPath();
            h.ctx.ellipse(p1.x, p1.y, rx, ry, 0, startAngle, endAngle, false);
            h.ctx.ellipse(p1.x, p1.y, nextRx, nextRy, 0, endAngle, startAngle, true);
            h.ctx.closePath();
            h.ctx.fillStyle = l.color;
            h.ctx.globalAlpha = (background.fillOpacity ?? 0.15);
            h.ctx.fill();
            h.ctx.restore();
        }

        // 3. STROKE
        h.ctx.save();
        h.ctx.beginPath();
        h.ctx.ellipse(p1.x, p1.y, rx, ry, 0, startAngle, endAngle);
        h.ctx.strokeStyle = l.color;
        h.ctx.lineWidth = l.lineWidth;
        h.ctx.globalAlpha = l.lineOpacity ?? 1;
        h.applyLineDash(l.lineStyle, l.lineWidth);
        h.ctx.stroke();

        // 4. LABELS
        if (showLabels) {
            h.ctx.save();
            h.ctx.font = "11px Inter, sans-serif";
            h.ctx.fillStyle = l.color;
            h.ctx.textAlign = isRight ? "left" : "right";
            h.ctx.textBaseline = "middle";
            h.ctx.fillText(` ${l.value} `, p1.x + (isRight ? rx : -rx), p1.y);
            h.ctx.restore();
        }
        h.ctx.restore();
    });

    if (isSelected) { h.drawHandle(p1); h.drawHandle(p2); h.drawHandle(p3); }
}

export function hitTestFibSpeedResistanceArcs(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 3 || !drawing.fibSpeedResistanceArcsProps) return { isHit: false, hitType: null };
    const p1 = points[0];
    const rxBase = Math.abs(points[1].x - p1.x);
    const ryBase = Math.abs(points[2].y - p1.y);
    const dx = (mx - p1.x) / rxBase;
    const dy = (my - p1.y) / ryBase;
    const distNormalized = Math.sqrt(dx * dx + dy * dy);
    for (const l of drawing.fibSpeedResistanceArcsProps.levels.filter(l => l.enabled)) {
        if (Math.abs(distNormalized - l.value) < threshold / Math.max(rxBase, ryBase)) { 
            return { isHit: true, hitType: 'shape' }; 
        }
    }
    return { isHit: false, hitType: null };
}
