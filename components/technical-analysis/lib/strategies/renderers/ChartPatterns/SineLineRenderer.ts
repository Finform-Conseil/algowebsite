// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/SineLineRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers, HitTestResult } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle } from "./support/BaseRendererUtils";

export function renderSineLine(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const { ctx, applyStyle } = helpers;
    const { style } = drawing;
    const n = pixelPoints.length;
    if (n < 1) return;

    const p0 = pixelPoints[0];
    const p1 = n > 1 ? pixelPoints[1] : p0;
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const period = Math.abs(dx) * 4;
    const amplitude = dy;

    if (period < 10) return;

    applyStyle(style, false);
    ctx.beginPath();

    const step = 2;
    const startX = 0;
    const endX = helpers.logicalWidth;

    for (let x = startX; x <= endX; x += step) {
        const relX = x - p0.x;
        const y = p0.y + amplitude * Math.sin((2 * Math.PI * relX) / period);
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (isSelected || drawing.isCreating) {
        drawHollowHandle(p0, style.color || "#00BCD4", helpers);
        if (n > 1 || drawing.isCreating) {
            drawHollowHandle(p1, style.color || "#00BCD4", helpers);
        }
    }
}

export function hitTestSineLine(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    threshold: number
): HitTestResult {
    if (pixelPoints.length < 2) return { isHit: false, hitType: null };
    const p0 = pixelPoints[0];
    const p1 = pixelPoints[1];
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const period = Math.abs(dx) * 4;
    const amplitude = dy;

    if (period > 1) {
        const relX = mx - p0.x;
        const expectedY = p0.y + amplitude * Math.sin((2 * Math.PI * relX) / period);
        if (Math.abs(my - expectedY) < threshold) return { isHit: true, hitType: "shape" };
    } else {
        if (Math.abs(my - p0.y) < threshold) return { isHit: true, hitType: "shape" };
    }
    return { isHit: false, hitType: null };
}
