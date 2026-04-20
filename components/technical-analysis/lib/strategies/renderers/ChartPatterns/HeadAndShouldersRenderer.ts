// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/HeadAndShouldersRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { drawHollowHandle, fixedRoundRect } from "./support/BaseRendererUtils";

export function renderHeadAndShoulders(
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

    const pStartNeck = pixelPoints[2] || pixelPoints[n - 1];
    let pEndNeck = pStartNeck;
    if (n >= 5) pEndNeck = pixelPoints[4];
    else if (n >= 3) pEndNeck = pixelPoints[n - 1];

    const hasNeckline = n >= 3 && (pStartNeck.x !== pEndNeck.x || pStartNeck.y !== pEndNeck.y);

    const getIntersection = (pC: { x: number; y: number }, pD: { x: number; y: number }) => {
        if (!hasNeckline) return null;
        const pA = pStartNeck, pB = pEndNeck;
        const A1 = pB.y - pA.y, B1 = pA.x - pB.x, C1 = A1 * pA.x + B1 * pA.y;
        const A2 = pD.y - pC.y, B2 = pC.x - pD.x, C2 = A2 * pC.x + B2 * pC.y;
        const det = A1 * B2 - A2 * B1;
        if (Math.abs(det) < 0.0001) return null;
        const x = (B2 * C1 - B1 * C2) / det;
        const y = (A1 * C2 - A2 * C1) / det;
        const eps = 0.001;
        if (x >= Math.min(pC.x, pD.x) - eps && x <= Math.max(pC.x, pD.x) + eps && y >= Math.min(pC.y, pD.y) - eps && y <= Math.max(pC.y, pD.y) + eps) return { x, y };
        return null;
    };

    const fillEnabled = style.fillEnabled !== false;
    if (fillEnabled && n >= 3) {
        ctx.fillStyle = style.fillColor || style.color;
        ctx.globalAlpha = style.fillOpacity || 0.15;
        const iLeft = getIntersection(pixelPoints[0], pixelPoints[1]);
        if (iLeft) {
            ctx.beginPath();
            ctx.moveTo(iLeft.x, iLeft.y);
            ctx.lineTo(pixelPoints[1].x, pixelPoints[1].y);
            ctx.lineTo(pixelPoints[2].x, pixelPoints[2].y);
            ctx.closePath();
            ctx.fill();
        }
        if (n >= 4) {
            const pHeadEnd = n >= 5 ? pixelPoints[4] : pixelPoints[n - 1];
            ctx.beginPath();
            ctx.moveTo(pixelPoints[2].x, pixelPoints[2].y);
            ctx.lineTo(pixelPoints[3].x, pixelPoints[3].y);
            ctx.lineTo(pHeadEnd.x, pHeadEnd.y);
            ctx.closePath();
            ctx.fill();
        }
        if (n >= 6) {
            const pRightEnd = n >= 7 ? pixelPoints[6] : pixelPoints[n - 1];
            const iRight = getIntersection(pRightEnd, pixelPoints[5]);
            if (iRight) {
                ctx.beginPath();
                ctx.moveTo(pixelPoints[4].x, pixelPoints[4].y);
                ctx.lineTo(pixelPoints[5].x, pixelPoints[5].y);
                ctx.lineTo(iRight.x, iRight.y);
                ctx.closePath();
                ctx.fill();
            }
        }
    }

    applyStyle(style, false);
    ctx.beginPath();
    ctx.moveTo(pixelPoints[0].x, pixelPoints[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(pixelPoints[i].x, pixelPoints[i].y);
    ctx.stroke();

    if (hasNeckline) {
        ctx.save();
        ctx.setLineDash([2, 4]);
        ctx.strokeStyle = style.color;
        ctx.lineWidth = 1.5;
        const dx = pEndNeck.x - pStartNeck.x;
        const dy = pEndNeck.y - pStartNeck.y;
        const norm = Math.sqrt(dx * dx + dy * dy);
        if (norm > 0) {
            const len = 10000;
            ctx.beginPath();
            ctx.moveTo(pStartNeck.x - (dx / norm) * len, pStartNeck.y - (dy / norm) * len);
            ctx.lineTo(pStartNeck.x + (dx / norm) * len, pStartNeck.y + (dy / norm) * len);
            ctx.stroke();
        }
        ctx.restore();
    }

    ctx.save();
    ctx.font = "11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const hLabels = [{ idx: 1, text: "Left Shoulder" }, { idx: 3, text: "Head" }, { idx: 5, text: "Right Shoulder" }];
    hLabels.forEach((hl) => {
        if (n > hl.idx) {
            const p = pixelPoints[hl.idx];
            const isInverted = dataPoints[hl.idx].value < dataPoints[hl.idx - 1].value;
            const ly = p.y + (isInverted ? 1 : -1) * 24;
            const textWidth = ctx.measureText(hl.text).width;
            ctx.save();
            ctx.fillStyle = style.color || "#00bfa5";
            ctx.beginPath();
            fixedRoundRect(ctx, p.x - (textWidth + 12) / 2, ly - 8.5, textWidth + 12, 17, 3);
            ctx.fill();
            ctx.fillStyle = "#FFFFFF";
            ctx.fillText(hl.text, p.x, ly);
            ctx.restore();
        }
    });
    ctx.restore();

    if (isSelected || n < 7) pixelPoints.forEach((p) => drawHollowHandle(p, style.color || "#00bfa5", helpers));

    if (drawing.showText && drawing.text) {
        ctx.save();
        const fontSize = drawing.fontSize || 13;
        ctx.font = `${drawing.textBold ? "bold " : ""}${drawing.textItalic ? "italic " : ""}${fontSize}px Inter, sans-serif`;
        ctx.fillStyle = drawing.textColor || "#ffffff";
        ctx.textAlign = "center";
        const minY = Math.min(...pixelPoints.map((p) => p.y));
        ctx.fillText(drawing.text || "", (pixelPoints[0].x + pixelPoints[n - 1].x) / 2, minY - 20);
        ctx.restore();
    }
}
