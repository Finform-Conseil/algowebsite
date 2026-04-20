import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { getGridRect, getSortedEnabledLevels, yToValue, valueToY, getEnabledFibLevels, EChartsInstance } from "./support/FibonacciUtils";

import { distToSegment } from "../../../math/geometry";

export function renderTrendBasedFibExtension(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.fibProps) return;
    const { fibProps } = drawing;
    const p1 = pts[0]; const p2 = pts[1]; const p3 = pts[2] || p2;
    const priceA = dataPoints[0].value; const priceB = dataPoints[1].value;
    const priceC = dataPoints[2]?.value ?? priceB;
    const priceRange = fibProps.reverse ? (priceA - priceB) : (priceB - priceA);
    const gridRect = getGridRect(chart);
    if (!gridRect) return;

    const sortedLevels = getSortedEnabledLevels(fibProps);
    const extend = fibProps.extendLines || "none";
    const leftX = (extend === "left" || extend === "both") ? gridRect.x : Math.min(p1.x, p2.x, p3.x);
    const rightX = (extend === "right" || extend === "both") ? gridRect.x + gridRect.width : Math.max(p1.x, p2.x, p3.x);

    if (fibProps.fillBackground) {
        for (let i = 0; i < sortedLevels.length - 1; i++) {
            const l1 = sortedLevels[i]; const l2 = sortedLevels[i + 1];
            const price1 = priceC + l1.value * priceRange;
            const price2 = priceC + l2.value * priceRange;
            const y1 = valueToY(price1, chart, dataPoints[0].time);
            const y2 = valueToY(price2, chart, dataPoints[0].time);
            if (y1 !== null && y2 !== null) {
                h.ctx.save();
                h.ctx.fillStyle = l2.color;
                h.ctx.globalAlpha = (fibProps.fillOpacity ?? 0.15);
                h.ctx.beginPath(); h.ctx.rect(leftX, Math.min(y1, y2), rightX - leftX, Math.abs(y2 - y1)); h.ctx.fill();
                h.ctx.restore();
            }
        }
    }

    sortedLevels.forEach((level: { value: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; }) => {
        const levelPrice = priceC + level.value * priceRange;
        const y = valueToY(levelPrice, chart, dataPoints[0].time);
        if (y === null) return;
        h.ctx.save();
        const lineColor = fibProps.useOneColor ? (fibProps.oneColor || drawing.style.color) : level.color;
        h.ctx.strokeStyle = lineColor;
        h.ctx.lineWidth = level.lineWidth;
        h.ctx.globalAlpha = level.lineOpacity ?? 1;
        h.applyLineDash(level.lineStyle, level.lineWidth);
        h.drawSegment({ x: leftX, y }, { x: rightX, y });
        h.ctx.restore();

        if (fibProps.showLevels || fibProps.showPrices) {
            h.ctx.save();
            const fontSize = drawing.fontSize || 11;
            h.ctx.font = `${drawing.textItalic ? "italic " : ""}${drawing.textBold ? "bold " : ""}${fontSize}px Inter, sans-serif`;
            h.ctx.fillStyle = drawing.textColor || level.color;

            const price = yToValue(y, chart, dataPoints[0].time);
            const textParts = [];
            if (fibProps.showLevels) textParts.push(`${Number(level.value).toFixed(3)}`);
            if (fibProps.showPrices && price !== null) textParts.push(`(${price.toFixed(2)})`);
            const text = textParts.join(" ");

            const margin = 5;
            const isLeft = fibProps.labelsPosition === "left";
            h.ctx.textAlign = "left"; h.ctx.textBaseline = "bottom";
            let labelX: number;
            if (isLeft) {
                labelX = (extend === "left" || extend === "both") ? leftX + margin : leftX - h.ctx.measureText(text).width - margin;
            } else {
                labelX = (extend === "right" || extend === "both") ? rightX - h.ctx.measureText(text).width - margin : rightX + margin;
            }
            h.ctx.fillText(text, labelX, y - 2);
            h.ctx.restore();
        }
    });

    const trendStyle = fibProps.trendLine || { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 };
    if (trendStyle.enabled) {
        h.ctx.save();
        h.ctx.strokeStyle = trendStyle.color;
        h.ctx.lineWidth = trendStyle.lineWidth;
        h.ctx.globalAlpha = trendStyle.lineOpacity ?? 1;
        h.applyLineDash(trendStyle.lineStyle as "solid" | "dashed" | "dotted", trendStyle.lineWidth);
        h.drawSegment(p1, p2);
        if (pts.length >= 3) h.drawSegment(p2, p3);
        h.ctx.restore();
    }

    if (isSelected) {
        h.drawHandle(p1); h.drawHandle(p2);
        if (pts.length >= 3) h.drawHandle(p3);
    }
}

export function hitTestTrendBasedFibExtension(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    chart: EChartsInstance,
    threshold: number
): HitTestResult {
    if (points.length < 2 || !drawing.fibProps) return { isHit: false, hitType: null };
    
    if (distToSegment(mx, my, points[0].x, points[0].y, points[1].x, points[1].y) < threshold) return { isHit: true, hitType: 'shape' };
    if (points.length >= 3 && distToSegment(mx, my, points[1].x, points[1].y, points[2].x, points[2].y) < threshold) return { isHit: true, hitType: 'shape' };

    if (points.length >= 3) {
        const priceA = drawing.points[0].value;
        const priceB = drawing.points[1].value;
        const priceC = drawing.points[2].value;
        const range = (drawing.fibProps.reverse ? priceA - priceB : priceB - priceA);
        const gridRect = getGridRect(chart);
        if (gridRect) {
            const extend = drawing.fibProps.extendLines || "none";
            const leftX = (extend === "left" || extend === "both") ? gridRect.x : Math.min(points[0].x, points[1].x, points[2].x);
            const rightX = (extend === "right" || extend === "both") ? gridRect.x + gridRect.width : Math.max(points[0].x, points[1].x, points[2].x);

            const enabledLevels = getEnabledFibLevels(drawing);
            for (const level of enabledLevels) {
                const levelPrice = priceC + level.value * range;
                const y = chart.convertToPixel({ seriesIndex: 0 }, [drawing.points[0].time, levelPrice])?.[1];
                if (y !== undefined && Math.abs(my - y) < threshold && mx >= leftX - threshold && mx <= rightX + threshold) {
                    return { isHit: true, hitType: 'shape' };
                }
            }
            if (drawing.fibProps.fillBackground && mx >= leftX && mx <= rightX) {
                const levelPrices = enabledLevels.map(l => priceC + l.value * range);
                const levelYs = levelPrices.map(p => chart.convertToPixel({ seriesIndex: 0 }, [drawing.points[0].time, p])?.[1]).filter(y => y !== undefined) as number[];
                if (levelYs.length >= 2 && my >= Math.min(...levelYs) && my <= Math.max(...levelYs)) {
                    return { isHit: true, hitType: 'shape' };
                }
            }
        }
    }
    return { isHit: false, hitType: null };
}
