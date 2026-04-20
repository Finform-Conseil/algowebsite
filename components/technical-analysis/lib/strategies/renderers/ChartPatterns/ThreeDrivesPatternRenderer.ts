// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/ThreeDrivesPatternRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle, fixedRoundRect, renderCustomText } from "./support/BaseRendererUtils";
import { drawDiagonalWithRatio } from "./support/GeometricPatternUtils";

export function renderThreeDrivesPattern(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const { ctx, applyStyle } = helpers;
    const { style } = drawing;
    const n = pixelPoints.length;

    applyStyle(style, false);
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = style.color;
    ctx.globalAlpha = 0.6;
    if (n >= 4) drawDiagonalWithRatio(pixelPoints[1], pixelPoints[3], dataPoints[1], dataPoints[2], dataPoints[3], "THREE_DRIVES", helpers);
    if (n >= 6) drawDiagonalWithRatio(pixelPoints[3], pixelPoints[5], dataPoints[3], dataPoints[4], dataPoints[5], "THREE_DRIVES", helpers);
    ctx.restore();

    ctx.save();
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labels = ["A", "B", "C", "D", "E", "F", "G"];
    pixelPoints.forEach((p, i) => {
        const label = labels[i];
        if (!label) return;
        const offset = 18;
        const isHigh = i % 2 === 0;
        const lx = p.x;
        const ly = p.y + (isHigh ? -1 : 1) * offset;
        ctx.save();
        ctx.fillStyle = style.color || "#2962FF";
        ctx.beginPath();
        fixedRoundRect(ctx, lx - 9, ly - 9, 18, 18, 4);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, lx, ly);
        ctx.restore();
    });
    ctx.restore();

    if (isSelected) pixelPoints.forEach((p) => drawHollowHandle(p, style.color || "#2962FF", helpers));
    if (drawing.showText && drawing.text) renderCustomText(pixelPoints, drawing, helpers);
}
