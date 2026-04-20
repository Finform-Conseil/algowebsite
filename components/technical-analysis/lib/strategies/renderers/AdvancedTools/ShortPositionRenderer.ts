import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { distanceBetweenPoints } from "../../../math/geometry";
import { EChartsInstance, renderPositionStats, renderPriceTag } from "./support/PositionUtils";


export function renderShortPosition(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
): void {
    if (pts.length < 1 || dataPoints.length < 1) return;
    const entry = pts[0];
    const entryTime = dataPoints[0].time;
    const entryPrice = dataPoints[0].value;
    const tpPrice = drawing.positionProps?.tpPrice || entryPrice - (drawing.tpOffset || entryPrice * 0.02);
    const slPrice = drawing.positionProps?.slPrice || entryPrice + (drawing.slOffset || entryPrice * 0.01);

    const valueToY = (val: number) => chart.convertToPixel({ seriesIndex: 0 }, [entryTime, val])?.[1];
    const tpY = valueToY(tpPrice);
    const slY = valueToY(slPrice);

    if (tpY === undefined || slY === undefined) return;
    const width = 160;
    const x = entry.x;
    const lineCol = drawing.style.color || "#2962ff";
    const lineW = drawing.style.lineWidth || 2;
    const fillAlpha = drawing.style.fillOpacity ?? 0.2;
    const isFillEnabled = drawing.style.fillEnabled !== false;
    const tpColor = drawing.positionProps?.tpColor || "#00da3c";
    const slColor = drawing.positionProps?.slColor || "#ec0000";
    const tpOpacity = drawing.positionProps?.tpOpacity ?? fillAlpha;
    const slOpacity = drawing.positionProps?.slOpacity ?? fillAlpha;

    if (isFillEnabled) {
        h.ctx.save();
        h.ctx.globalAlpha = tpOpacity;
        h.ctx.fillStyle = tpColor;
        h.ctx.fillRect(x - width / 2, entry.y, width, tpY - entry.y);
        h.ctx.strokeStyle = tpColor;
        h.ctx.globalAlpha = Math.min(1, tpOpacity * 2);
        h.ctx.lineWidth = 1;
        h.ctx.strokeRect(x - width / 2, entry.y, width, tpY - entry.y);

        h.ctx.globalAlpha = slOpacity;
        h.ctx.fillStyle = slColor;
        h.ctx.fillRect(x - width / 2, slY, width, entry.y - slY);
        h.ctx.strokeStyle = slColor;
        h.ctx.globalAlpha = Math.min(1, slOpacity * 2);
        h.ctx.lineWidth = 1;
        h.ctx.strokeRect(x - width / 2, slY, width, entry.y - slY);
        h.ctx.restore();
    }
    h.ctx.save();
    h.ctx.strokeStyle = lineCol;
    h.ctx.lineWidth = lineW;
    h.drawSegment({ x: x - width / 2, y: entry.y }, { x: x + width / 2, y: entry.y });
    h.ctx.restore();

    renderPositionStats(x, entry.y, tpPrice, slPrice, entryPrice, drawing, false, h);
    renderPriceTag(x + width / 2, tpY, tpPrice, tpColor, "right", 0, drawing, h);
    renderPriceTag(x + width / 2, slY, slPrice, slColor, "right", 12, drawing, h);
    renderPriceTag(x + width / 2, entry.y, entryPrice, lineCol, "right", 0, drawing, h);
    renderPriceTag(x - width / 2, entry.y, entryPrice, lineCol, "left", 0, drawing, h);

    if (isSelected) {
        h.drawHandle(entry, lineCol, 6);
        h.drawHandle({ x, y: tpY }, tpColor, 8);
        h.drawHandle({ x, y: slY }, slColor, 8);
    }
}

export function hitTestShortPosition(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    drawing: Drawing,
    chart: EChartsInstance,
    threshold: number
): HitTestResult {
    if (pixelPoints.length < 1) return { isHit: false, hitType: null };
    const entry = pixelPoints[0];
    const entryTime = drawing.points[0].time;
    const entryPrice = drawing.points[0].value;
    const tpPrice = drawing.positionProps?.tpPrice || entryPrice - (drawing.tpOffset || 0);
    const slPrice = drawing.positionProps?.slPrice || entryPrice + (drawing.slOffset || 0);

    const tpYPix = chart.convertToPixel({ seriesIndex: 0 }, [entryTime, tpPrice])?.[1];
    const slYPix = chart.convertToPixel({ seriesIndex: 0 }, [entryTime, slPrice])?.[1];

    const zoneThreshold = 25;
    if (tpYPix !== undefined && distanceBetweenPoints(mx, my, entry.x, tpYPix) < zoneThreshold) {
        return { isHit: true, hitType: "zone_tp" };
    }
    if (slYPix !== undefined && distanceBetweenPoints(mx, my, entry.x, slYPix) < zoneThreshold) {
        return { isHit: true, hitType: "zone_sl" };
    }

    let isHit = false;
    if (tpYPix !== undefined && slYPix !== undefined) {
        const yMin = Math.min(tpYPix, slYPix, entry.y);
        const yMax = Math.max(tpYPix, slYPix, entry.y);
        const width = 160;
        if (
            mx >= entry.x - width / 2 - threshold &&
            mx <= entry.x + width / 2 + threshold &&
            my >= yMin - threshold &&
            my <= yMax + threshold
        ) {
            isHit = true;
        }
    }
    return { isHit, hitType: isHit ? "shape" : null };
}
