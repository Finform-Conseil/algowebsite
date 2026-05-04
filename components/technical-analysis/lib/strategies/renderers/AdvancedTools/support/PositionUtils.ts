import { Drawing } from "../../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers } from "../../../interfaces/IDrawingStrategy";
import { calculatePositionStats } from "../../../../math/geometry";
import type { ECharts } from "echarts";

export type EChartsInstance = ECharts;

export function renderPositionStats(
    x: number,
    entryY: number,
    tpPrice: number,
    slPrice: number,
    entryPrice: number,
    drawing: Drawing,
    _isLong: boolean,
    h: DrawingHelpers
) {
    const stats = calculatePositionStats(entryPrice, tpPrice, slPrice);
    const boxW = 140;
    const boxH = 55;
    const boxX = x - boxW / 2;
    const boxY = entryY - boxH - 18;

    h.ctx.save();
    h.ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    h.ctx.shadowBlur = 8;
    h.ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
    h.ctx.beginPath();
    h.ctx.roundRect(boxX, boxY, boxW, boxH, 6);
    h.ctx.fill();
    h.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    h.ctx.lineWidth = 1;
    h.ctx.stroke();
    h.ctx.shadowBlur = 0;

    h.ctx.fillStyle = "#ffffff";
    const fs = drawing.fontSize || 12;
    const fst = drawing.textItalic ? "italic " : "";
    const fw = drawing.textBold ? "bold " : "";
    h.ctx.font = `${fst}${fw}${fs}px Inter, sans-serif`;
    h.ctx.textAlign = "center";
    h.ctx.fillText(`Ratio R:R: ${stats.ratio.toFixed(2)}`, x, boxY + 18);

    const subFs = Math.max(9, fs - 2);
    h.ctx.font = `${fst}${fw}${subFs}px Inter, sans-serif`;
    h.ctx.fillStyle = "#94a3b8";
    h.ctx.fillText(`Risque: ${stats.riskPercent.toFixed(2)}% | Cible: ${stats.rewardPercent.toFixed(2)}%`, x, boxY + 34);

    if (drawing.positionProps?.accountSize) {
        const riskAmt = (drawing.positionProps.accountSize * (drawing.positionProps.riskPercent / 100)).toFixed(2);
        h.ctx.fillStyle = "#fbbf24";
        h.ctx.fillText(`Montant Risqué: ${riskAmt} XOF`, x, boxY + 48);
    }
    h.ctx.restore();
}

export function renderPriceTag(
    x: number,
    y: number,
    price: number,
    color: string,
    align: "left" | "right" = "right",
    offsetY: number = 0,
    drawing: Drawing,
    h: DrawingHelpers
) {
    const text = price.toFixed(2);
    const fst = drawing.textItalic ? "italic " : "";
    const fw = drawing.textBold ? "bold " : "";
    const fs = drawing.fontSize || 11;
    h.ctx.font = `${fst}${fw}${fs}px Inter, sans-serif`;
    const tw = h.ctx.measureText(text).width;
    const padding = 6;
    const totalW = tw + padding * 2;

    h.ctx.save();
    h.ctx.fillStyle = color;
    h.ctx.beginPath();
    const rectX = align === "right" ? x + 12 : x - 12 - totalW;
    h.ctx.roundRect(rectX, y - 10 + offsetY, totalW, 20, 4);
    h.ctx.fill();
    h.ctx.fillStyle = "#ffffff";
    h.ctx.textBaseline = "middle";
    h.ctx.textAlign = "left";
    h.ctx.fillText(text, rectX + padding, y + offsetY);
    h.ctx.restore();
}
