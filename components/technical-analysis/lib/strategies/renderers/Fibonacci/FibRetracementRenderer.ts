import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { getGridRect, getSortedEnabledLevels, yToValue, getEnabledFibLevels, EChartsInstance } from "./support/FibonacciUtils";


export function renderFibRetracement(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.fibProps) return;
    const { fibProps } = drawing;
    const p1 = pts[0]; const p2 = pts[1];
    const yStart = fibProps.reverse ? p2.y : p1.y;
    const yEnd = fibProps.reverse ? p1.y : p2.y;
    const height = yEnd - yStart;
    const gridRect = getGridRect(chart);
    if (!gridRect) return;

    const extendLines = fibProps.extendLines || "none";
    const leftX = (extendLines === "left" || extendLines === "both") ? gridRect.x : Math.min(p1.x, p2.x);
    const rightX = (extendLines === "right" || extendLines === "both") ? gridRect.x + gridRect.width : Math.max(p1.x, p2.x);
    const sortedLevels = getSortedEnabledLevels(fibProps);

    if (fibProps.fillBackground) {
        for (let i = 0; i < sortedLevels.length - 1; i++) {
            const l1 = sortedLevels[i]; const l2 = sortedLevels[i + 1];
            const y1 = yStart + height * l1.value; const y2 = yStart + height * l2.value;
            h.ctx.save();
            h.ctx.fillStyle = l2.color;
            h.ctx.globalAlpha = (fibProps.fillOpacity ?? 0.1) * 0.5;
            h.ctx.beginPath(); h.ctx.rect(leftX, y1, rightX - leftX, y2 - y1); h.ctx.fill();
            h.ctx.restore();
        }
    }

    sortedLevels.forEach((level: { value: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; }) => {
        const y = yStart + height * level.value;
        h.ctx.save();
        const lineColor = fibProps.useOneColor ? (fibProps.oneColor || drawing.style.color) : level.color;
        h.ctx.strokeStyle = lineColor;
        h.ctx.lineWidth = level.lineWidth;
        h.ctx.globalAlpha = level.lineOpacity ?? 1;
        h.applyLineDash(level.lineStyle, level.lineWidth);
        h.drawSegment({ x: leftX, y }, { x: rightX, y });
        h.ctx.restore();

        if (fibProps.showPrices || fibProps.showLevels) {
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
                labelX = (extendLines === "left" || extendLines === "both") ? leftX + margin : leftX - h.ctx.measureText(text).width - margin;
            } else {
                labelX = (extendLines === "right" || extendLines === "both") ? rightX - h.ctx.measureText(text).width - margin : rightX + margin;
            }
            h.ctx.fillText(text, labelX, y - 2);
            h.ctx.restore();
        }
    });

    const trendLine = fibProps.trendLine || { enabled: true, color: "#787b86", lineStyle: "dashed", lineWidth: 1 };
    if (trendLine.enabled) {
        h.ctx.save();
        h.ctx.strokeStyle = trendLine.color;
        h.ctx.lineWidth = trendLine.lineWidth;
        h.ctx.globalAlpha = trendLine.lineOpacity ?? 1;
        h.applyLineDash(trendLine.lineStyle as "solid" | "dashed" | "dotted", trendLine.lineWidth);
        h.drawSegment(p1, p2);
        h.ctx.restore();
    }

    if (isSelected) {
        h.drawHandle(p1); h.drawHandle(p2);
    }
}

export function hitTestFibRetracement(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    chart: EChartsInstance,
    threshold: number
): HitTestResult {
    if (points.length < 2 || !drawing.fibProps) return { isHit: false, hitType: null };
    const [p1, p2] = points;
    const yStart = p1.y;
    const h = p2.y - p1.y;
    const gridRect = getGridRect(chart);
    if (!gridRect) return { isHit: false, hitType: null };

    const leftX = drawing.extendLeft ? gridRect.x : Math.min(p1.x, p2.x);
    const rightX = drawing.extendRight ? gridRect.x + gridRect.width : Math.max(p1.x, p2.x);
    const enabledLevels = getEnabledFibLevels(drawing);
    
    if (enabledLevels.length > 0) {
        const levelValues = enabledLevels.map((l) => l.value);
        const y1 = yStart + h * Math.min(...levelValues);
        const y2 = yStart + h * Math.max(...levelValues);
        const margin = threshold;
        if (mx >= leftX - margin && mx <= rightX + margin && my >= Math.min(y1, y2) - margin && my <= Math.max(y1, y2) + margin) {
            if (drawing.fibProps.fillBackground) {
                return { isHit: true, hitType: 'shape' };
            } else {
                for (const level of enabledLevels) {
                    const ly = yStart + h * level.value;
                    if (Math.abs(my - ly) < threshold) {
                        return { isHit: true, hitType: 'shape' };
                    }
                }
            }
        }
    }
    return { isHit: false, hitType: null };
}
