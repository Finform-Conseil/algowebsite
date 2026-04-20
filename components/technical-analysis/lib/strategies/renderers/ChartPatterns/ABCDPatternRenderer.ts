import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle, renderCustomText } from "./support/BaseRendererUtils";
import { drawDiagonalWithRatio } from "./support/GeometricPatternUtils";

export function renderABCD(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    const { ctx, applyStyle } = helpers;
    const { style } = drawing;
    const n = pixelPoints.length;
    if (n < 2) return;

    applyStyle(style, false);
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    ctx.stroke();

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = style.color || "#089981";
    ctx.globalAlpha = 0.7;
    if (n >= 3) drawDiagonalWithRatio(pixelPoints[0], pixelPoints[2], dataPoints[0], dataPoints[1], dataPoints[2], "ABCD_AC", helpers);
    if (n >= 4) drawDiagonalWithRatio(pixelPoints[1], pixelPoints[3], dataPoints[1], dataPoints[2], dataPoints[3], "ABCD_BD", helpers);
    ctx.restore();

    ctx.save();
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labels = ["A", "B", "C", "D"];
    const circleRadius = 9;
    const labelOffset = circleRadius + 6;
    const isAHigh = n >= 2 && dataPoints[0].value > dataPoints[1].value;

    pixelPoints.forEach((p, i) => {
        if (i >= labels.length) return;
        const isHigh = isAHigh ? (i % 2 === 0) : (i % 2 !== 0);
        const ly = p.y + (isHigh ? -labelOffset : labelOffset);
        ctx.save();
        ctx.fillStyle = style.color || "#089981";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(p.x, ly, circleRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(labels[i], p.x, ly);
        ctx.restore();
    });
    ctx.restore();

    if (isSelected || n < 4) pixelPoints.forEach((p) => drawHollowHandle(p, style.color || "#089981", helpers));
    if (drawing.showText && drawing.text) renderCustomText(pixelPoints, drawing, helpers);
}
