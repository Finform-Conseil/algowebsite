import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle, renderCustomText } from "./support/BaseRendererUtils";
import { drawDiagonalWithRatio, drawPointLabelsBoxed } from "./support/GeometricPatternUtils";


export function renderXABCD(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const { ctx, applyStyle } = helpers;
    const { style } = drawing;
    const n = pixelPoints.length;
    const fillEnabled = style.fillEnabled !== false;

    if (n >= 3 && fillEnabled) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
        ctx.lineTo(pixelPoints[1].x, pixelPoints[1].y);
        ctx.lineTo(pixelPoints[2].x, pixelPoints[2].y);
        ctx.closePath();
        ctx.fillStyle = style.fillColor || style.color;
        ctx.globalAlpha = style.fillOpacity || 0.2;
        ctx.fill();
        ctx.restore();
    }
    if (n >= 5 && fillEnabled) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pixelPoints[2].x, pixelPoints[2].y);
        ctx.lineTo(pixelPoints[3].x, pixelPoints[3].y);
        ctx.lineTo(pixelPoints[4].x, pixelPoints[4].y);
        ctx.closePath();
        ctx.fillStyle = style.fillColor || style.color;
        ctx.globalAlpha = style.fillOpacity || 0.2;
        ctx.fill();
        ctx.restore();
    }

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
    if (n >= 3) drawDiagonalWithRatio(pixelPoints[0], pixelPoints[2], dataPoints[0], dataPoints[1], dataPoints[2], "XB", helpers);
    if (n >= 4) drawDiagonalWithRatio(pixelPoints[1], pixelPoints[3], dataPoints[1], dataPoints[2], dataPoints[3], "AC", helpers);
    if (n >= 5) drawDiagonalWithRatio(pixelPoints[2], pixelPoints[4], dataPoints[2], dataPoints[3], dataPoints[4], "BD", helpers);
    if (n >= 5) drawDiagonalWithRatio(pixelPoints[0], pixelPoints[4], dataPoints[0], dataPoints[1], dataPoints[4], "XD", helpers);
    ctx.restore();

    ctx.save();
    drawPointLabelsBoxed(pixelPoints, dataPoints, ["X", "A", "B", "C", "D"], style.color || "#2962FF", 18, helpers);
    ctx.restore();

    if (isSelected) pixelPoints.forEach((p) => drawHollowHandle(p, style.color || "#2962FF", helpers));
    if (drawing.showText && drawing.text) renderCustomText(pixelPoints, drawing, helpers);
}
