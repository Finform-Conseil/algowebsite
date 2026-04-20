// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/support/ElliottWaveUtils.ts
import { Drawing, DrawingPoint } from "../../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers, HitTestResult } from "../../../interfaces/IDrawingStrategy";
import { drawHollowHandle, renderCustomText, isPointNearSegment } from "./BaseRendererUtils";

export function renderElliottWaveBase(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers,
    labels: string[]
): void {
    const { ctx, applyStyle } = helpers;
    const { style } = drawing;
    const n = pixelPoints.length;

    if (n < 2) return;

    applyStyle(style, false);
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < n; i++) {
        ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    }
    ctx.stroke();

    ctx.save();
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const circleRadius = 9;
    const labelOffset = 18;

    pixelPoints.forEach((p, i) => {
        if (i >= labels.length) return;
        const label = labels[i];
        const isHigh = i % 2 !== 0;
        const ly = p.y + (isHigh ? -labelOffset : labelOffset);
        const lx = p.x;

        ctx.save();
        ctx.fillStyle = style.color || "#2962FF";
        ctx.beginPath();
        ctx.arc(lx, ly, circleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, lx, ly);
        ctx.restore();
    });
    ctx.restore();

    if (isSelected) {
        pixelPoints.forEach((p) => {
            drawHollowHandle(p, style.color || "#2962FF", helpers);
        });
    }

    if (drawing.showText && drawing.text) {
        renderCustomText(pixelPoints, drawing, helpers);
    }
}

export function hitTestElliottWaveBase(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    threshold: number
): HitTestResult {
    for (let i = 0; i < pixelPoints.length; i++) {
        const dist = Math.sqrt(Math.pow(mx - pixelPoints[i].x, 2) + Math.pow(my - pixelPoints[i].y, 2));
        if (dist < threshold) return { isHit: true, hitType: "point", pointIndex: i };
    }
    for (let i = 0; i < pixelPoints.length - 1; i++) {
        if (isPointNearSegment(mx, my, pixelPoints[i], pixelPoints[i + 1], threshold)) {
            return { isHit: true, hitType: "shape" };
        }
    }
    if (pixelPoints.length >= 3) {
        for (let i = 0; i < pixelPoints.length - 1; i++) {
            if (isPointNearSegment(mx, my, pixelPoints[i], pixelPoints[i + 1], threshold + 4)) {
                return { isHit: true, hitType: "shape" };
            }
        }
    }
    return { isHit: false, hitType: null };
}
