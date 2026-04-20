// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/CyclicLinesRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers, HitTestResult } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle } from "./support/BaseRendererUtils";

export function renderCyclicLines(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const n = pixelPoints.length;
    if (n < 1) return;

    const { ctx, applyStyle } = helpers;
    const { style, cyclesProps } = drawing;
    const p0 = pixelPoints[0];
    const p1 = n > 1 ? pixelPoints[1] : p0;
    const dx = p1.x - p0.x;
    const interval = Math.abs(dx);

    const drawSegment = (x: number) => {
        applyStyle(style, false);
        ctx.strokeStyle = style.color || "#00BCD4";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, helpers.logicalHeight);
        ctx.stroke();
    };

    const drawFill = (x0: number, i: number) => {
        if (cyclesProps?.fillBackground && cyclesProps.levels && cyclesProps.levels.length > 0) {
            const levelIndex = Math.abs(i) % cyclesProps.levels.length;
            const level = cyclesProps.levels[levelIndex];
            if (!level.enabled) return;
            ctx.save();
            ctx.fillStyle = level.color;
            ctx.globalAlpha = cyclesProps.fillOpacity !== undefined ? cyclesProps.fillOpacity : 0.1;
            const x1 = x0 + dx;
            ctx.fillRect(Math.min(x0, x1), 0, Math.abs(dx), helpers.logicalHeight);
            ctx.restore();
        }
    };

    if (interval < 0.1) {
        drawSegment(p0.x);
    } else {
        let count = 0;
        let currentX = p0.x;
        const step = dx;
        const limit = 500;
        while (count < limit) {
            if (step > 0 && currentX > helpers.logicalWidth + step) break;
            if (step < 0 && currentX < -Math.abs(step)) break;
            drawFill(currentX, count);
            drawSegment(currentX);
            currentX += step;
            count++;
        }
    }

    if (isSelected || drawing.isCreating) {
        if (n > 1 && p0 && p1) {
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = style.color || "#00BCD4";
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.stroke();
            ctx.restore();
        }
        drawHollowHandle(p0, style.color || "#00BCD4", helpers);
        if (n > 1 && p1) drawHollowHandle(p1, style.color || "#00BCD4", helpers);
    }
}

export function hitTestCyclicLines(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (pixelPoints.length < 2) return { isHit: false, hitType: null };
    const p0 = pixelPoints[0];
    const p1 = pixelPoints[1];
    const dx = p1.x - p0.x;
    const interval = Math.abs(dx);
    if (interval > 0.1) {
        const relX = ((mx - p0.x) % dx + dx) % dx;
        if (relX < threshold || relX > interval - threshold) return { isHit: true, hitType: "shape" };
        if (drawing.cyclesProps?.fillBackground) {
            const count = (mx - p0.x) / dx;
            if (count >= 0 && count < 500) return { isHit: true, hitType: "shape" };
        }
    } else {
        if (Math.abs(mx - p0.x) < threshold) return { isHit: true, hitType: "shape" };
    }
    return { isHit: false, hitType: null };
}
