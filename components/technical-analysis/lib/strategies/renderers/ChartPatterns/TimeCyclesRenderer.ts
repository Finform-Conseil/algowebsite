// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/TimeCyclesRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers, HitTestResult } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle } from "./support/BaseRendererUtils";

export function renderTimeCycles(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const { ctx, applyStyle } = helpers;
    const { style, cyclesProps } = drawing;
    const n = pixelPoints.length;
    if (n < 1) return;

    const p0 = pixelPoints[0];
    const p1 = n > 1 ? pixelPoints[1] : p0;
    const dx = p1.x - p0.x;
    const radiusX = Math.abs(dx) / 2;
    if (radiusX < 1) return;

    applyStyle(style, false);

    const fillProps = cyclesProps && cyclesProps.levels && cyclesProps.levels.length > 0
        ? cyclesProps.levels[0]
        : null;

    const drawCycle = (centerX: number) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, p0.y, radiusX, Math.PI, 0);
        ctx.stroke();
        if (cyclesProps?.fillBackground && fillProps?.enabled) {
            ctx.globalAlpha = (cyclesProps.fillOpacity !== undefined ? cyclesProps.fillOpacity : 0.1) * (fillProps.opacity || 1);
            ctx.fillStyle = fillProps.color || style.color || "#00BCD4";
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    };

    let currentRightX = p0.x;
    while (currentRightX - radiusX * 2 < helpers.logicalWidth) {
        drawCycle(currentRightX + radiusX);
        currentRightX += radiusX * 2;
    }

    let currentLeftX = p0.x;
    while (currentLeftX + radiusX * 2 > 0) {
        drawCycle(currentLeftX - radiusX);
        currentLeftX -= radiusX * 2;
    }

    if (isSelected || drawing.isCreating) {
        if (n > 1) {
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = style.color || "#00BCD4";
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p0.y);
            ctx.stroke();
            ctx.restore();
        }
        drawHollowHandle(p0, style.color || "#00BCD4", helpers);
        if (n > 1) drawHollowHandle({ x: p1.x, y: p0.y }, style.color || "#00BCD4", helpers);
    }
}

export function hitTestTimeCycles(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    drawing: Drawing,
    threshold: number
): HitTestResult {
    if (pixelPoints.length < 2) return { isHit: false, hitType: null };
    const dx = pixelPoints[1].x - pixelPoints[0].x;
    if (Math.abs(dx) <= 1) return { isHit: false, hitType: null };

    const p0 = pixelPoints[0];
    const radiusX = Math.abs(dx) / 2;
    const radiusY = radiusX;
    const relXToP0 = mx - p0.x;
    const cycleIndex = Math.floor(Math.abs(relXToP0) / (radiusX * 2)) * Math.sign(relXToP0);
    const xCenter = p0.x + cycleIndex * (radiusX * 2) + radiusX * Math.sign(relXToP0 || 1);
    const yCenter = p0.y;

    if (radiusY > 0) {
        const dxNorm = (mx - xCenter) / radiusX;
        const dyNorm = (my - yCenter) / radiusY;
        const distCircle = Math.sqrt(dxNorm * dxNorm + dyNorm * dyNorm);
        if (Math.abs(distCircle - 1) < 0.15 && my <= p0.y + threshold) return { isHit: true, hitType: "shape" };
        if (drawing.cyclesProps?.fillBackground && distCircle <= 1 && my <= p0.y) return { isHit: true, hitType: "shape" };
    }
    if (Math.abs(my - p0.y) < threshold) return { isHit: true, hitType: "shape" };
    return { isHit: false, hitType: null };
}
