import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { getSortedEnabledLevels, yToValue, EChartsInstance } from "./support/FibonacciUtils";

import { distToSegment } from "../../../math/geometry";

export function renderFibChannel(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.fibProps) return;
    const { fibProps } = drawing;
    const p0 = pts[0]; const p1 = pts[1]; const p2 = pts[2] || p1;
    const dx = p1.x - p0.x; const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    const nx = -dy / len; const ny = dx / len;
    const dist = (p2.x - p0.x) * nx + (p2.y - p0.y) * ny;
    const effectiveDist = fibProps.reverse ? -dist : dist;
    const sortedLevels = getSortedEnabledLevels(fibProps);
    const extendLeft = fibProps.extendLines === "left" || fibProps.extendLines === "both";
    const extendRight = fibProps.extendLines === "right" || fibProps.extendLines === "both";

    if (fibProps.fillBackground && sortedLevels.length >= 2) {
        for (let i = 0; i < sortedLevels.length - 1; i++) {
            const l1 = sortedLevels[i]; const l2 = sortedLevels[i + 1];
            const d1 = effectiveDist * l1.value; const d2 = effectiveDist * l2.value;
            const pa = { x: p0.x + nx * d1, y: p0.y + ny * d1 };
            const pb = { x: p1.x + nx * d1, y: p1.y + ny * d1 };
            const pc = { x: p1.x + nx * d2, y: p1.y + ny * d2 };
            const pd = { x: p0.x + nx * d2, y: p0.y + ny * d2 };

            if (extendLeft) { pa.x -= (dx / len) * 10000; pa.y -= (dy / len) * 10000; pd.x -= (dx / len) * 10000; pd.y -= (dy / len) * 10000; }
            if (extendRight) { pb.x += (dx / len) * 10000; pb.y += (dy / len) * 10000; pc.x += (dx / len) * 10000; pc.y += (dy / len) * 10000; }

            h.ctx.save();
            h.ctx.fillStyle = fibProps.useOneColor ? (fibProps.oneColor || drawing.style.color) : l2.color;
            h.ctx.globalAlpha = (fibProps.fillOpacity ?? 0.15);
            h.ctx.beginPath();
            h.ctx.moveTo(pa.x, pa.y); h.ctx.lineTo(pb.x, pb.y); h.ctx.lineTo(pc.x, pc.y); h.ctx.lineTo(pd.x, pd.y);
            h.ctx.closePath(); h.ctx.fill(); h.ctx.restore();
        }
    }

    sortedLevels.forEach((level: { value: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; }) => {
        const d = effectiveDist * level.value;
        const pa = { x: p0.x + nx * d, y: p0.y + ny * d };
        const pb = { x: p1.x + nx * d, y: p1.y + ny * d };
        if (extendLeft) { pa.x -= (dx / len) * 10000; pa.y -= (dy / len) * 10000; }
        if (extendRight) { pb.x += (dx / len) * 10000; pb.y += (dy / len) * 10000; }

        h.ctx.save();
        const color = fibProps.useOneColor ? (fibProps.oneColor || drawing.style.color) : level.color;
        h.ctx.strokeStyle = color;
        h.ctx.lineWidth = level.lineWidth;
        h.ctx.globalAlpha = level.lineOpacity ?? 1;
        h.applyLineDash(level.lineStyle, level.lineWidth);
        h.drawSegment(pa, pb);
        h.ctx.restore();

        if (fibProps.showLevels || fibProps.showPrices) {
            h.ctx.save();
            const fontSize = drawing.fontSize || 11;
            h.ctx.font = `${drawing.textItalic ? "italic " : ""}${drawing.textBold ? "bold " : ""}${fontSize}px Inter, sans-serif`;
            h.ctx.fillStyle = drawing.textColor || color;

            const price = yToValue(pa.y, chart, dataPoints[0].time);
            const textParts = [];
            if (fibProps.showLevels) textParts.push(`${Number(level.value).toFixed(3)}`);
            if (fibProps.showPrices && price !== null) textParts.push(`(${price.toFixed(2)})`);
            const text = textParts.join(" ");

            const margin = 5;
            const isLeft = fibProps.labelsPosition === "left";
            const exL = fibProps.extendLines === "left" || fibProps.extendLines === "both";
            const exR = fibProps.extendLines === "right" || fibProps.extendLines === "both";

            h.ctx.textAlign = "left"; h.ctx.textBaseline = "bottom";
            let labelX: number;
            const textW = h.ctx.measureText(text).width;
            if (isLeft) {
                labelX = exL ? pa.x + margin : pa.x - textW - margin;
            } else {
                labelX = exR ? pb.x - textW - margin : pb.x + margin;
            }
            h.ctx.fillText(text, labelX, pa.y - 2);
            h.ctx.restore();
        }
    });

    if (fibProps.trendLine?.enabled) {
        h.ctx.save();
        h.ctx.strokeStyle = fibProps.trendLine.color;
        h.ctx.lineWidth = fibProps.trendLine.lineWidth;
        h.ctx.globalAlpha = fibProps.trendLine.lineOpacity ?? 1;
        h.applyLineDash(fibProps.trendLine.lineStyle as "solid" | "dashed" | "dotted", fibProps.trendLine.lineWidth);
        h.drawSegment(p0, p1);
        h.ctx.restore();
    }

    if (isSelected) {
        h.drawHandle(p0); h.drawHandle(p1);
        if (pts.length >= 3) h.drawHandle(p2);
    }
}

export function hitTestFibChannel(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (points.length < 2) return { isHit: false, hitType: null };
    const p0 = points[0]; const p1 = points[1]; const p2 = points[2] || p1;
    const dx = p1.x - p0.x; const dy = p1.y - p0.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
        const nx = -dy / len; const ny = dx / len;
        const dist = (p2.x - p0.x) * nx + (p2.y - p0.y) * ny;
        const extL = drawing.fibProps?.extendLines === "left" || drawing.fibProps?.extendLines === "both";
        const extR = drawing.fibProps?.extendLines === "right" || drawing.fibProps?.extendLines === "both";
        const enabledLevels = drawing.fibProps?.levels.filter(l => l.enabled) || [];

        for (const level of enabledLevels) {
            const d = dist * level.value;
            if (distToSegment(mx, my, p0.x + nx * d, p0.y + ny * d, p1.x + nx * d, p1.y + ny * d, extL, extR) < threshold) {
                return { isHit: true, hitType: 'shape' };
            }
        }
        if (drawing.fibProps?.fillBackground && enabledLevels.length >= 2) {
            const sorted = [...enabledLevels].sort((a, b) => a.value - b.value);
            const dMin = dist * sorted[0].value;
            const dMax = dist * sorted[sorted.length - 1].value;
            const poly = [
                { x: p0.x + nx * dMin, y: p0.y + ny * dMin }, { x: p1.x + nx * dMin, y: p1.y + ny * dMin },
                { x: p1.x + nx * dMax, y: p1.y + ny * dMax }, { x: p0.x + nx * dMax, y: p0.y + ny * dMax }
            ];
            let inside = false;
            for (let j = 0, k = poly.length - 1; j < poly.length; k = j++) {
                if (((poly[j].y > my) !== (poly[k].y > my)) && (mx < (poly[k].x - poly[j].x) * (my - poly[j].y) / (poly[k].y - poly[j].y) + poly[j].x)) inside = !inside;
            }
            if (inside) return { isHit: true, hitType: 'shape' };
        }
    }
    return { isHit: false, hitType: null };
}
