import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { getGridRect, EChartsInstance } from "./support/FibonacciUtils";
import { distToSegment } from "../../../math/geometry";


export function renderTrendBasedFibTime(
    pts: { x: number; y: number }[],
    _dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 2 || !drawing.trendBasedFibTimeProps) return;
    const { trendBasedFibTimeProps } = drawing;
    const p1 = pts[0]; const p2 = pts[1]; const p3 = pts[2] || p2;
    const gridRect = getGridRect(chart);
    if (!gridRect) return;
    const baseDeltaX = p2.x - p1.x;

    const trendLine = trendBasedFibTimeProps.trendLine;
    if (trendLine?.enabled) {
        h.ctx.save();
        h.ctx.strokeStyle = trendLine.color;
        h.ctx.lineWidth = trendLine.lineWidth;
        h.ctx.globalAlpha = trendLine.lineOpacity ?? 1;
        h.applyLineDash(trendLine.lineStyle, trendLine.lineWidth);
        h.drawSegment(p1, p2);
        h.ctx.restore();
    }

    const extensionLine = trendBasedFibTimeProps.extensionLine;
    if (extensionLine?.enabled && pts.length >= 3) {
        h.ctx.save();
        h.ctx.strokeStyle = extensionLine.color;
        h.ctx.lineWidth = extensionLine.lineWidth;
        h.ctx.globalAlpha = extensionLine.lineOpacity ?? 1;
        h.applyLineDash(extensionLine.lineStyle, extensionLine.lineWidth);
        h.drawSegment(p2, p3);
        h.ctx.restore();
    }

    const enabledLevels = [...trendBasedFibTimeProps.levels]
        .filter(l => l.enabled)
        .sort((a, b) => a.value - b.value);

    // 3. BACKGROUND FILL
    if (trendBasedFibTimeProps.fillBackground && enabledLevels.length > 1) {
        for (let i = 0; i < enabledLevels.length - 1; i++) {
            const l1 = enabledLevels[i];
            const l2 = enabledLevels[i + 1];
            const x1 = p3.x + l1.value * baseDeltaX;
            const x2 = p3.x + l2.value * baseDeltaX;

            h.ctx.save();
            h.ctx.fillStyle = l1.color;
            h.ctx.globalAlpha = trendBasedFibTimeProps.fillOpacity ?? 0.15;
            const rectX = Math.min(x1, x2);
            const rectW = Math.abs(x2 - x1);
            h.ctx.fillRect(rectX, gridRect.y, rectW, gridRect.height);
            h.ctx.restore();
        }
    }

    // 4. LEVELS SCAN-LINE & LABELS
    enabledLevels.forEach((l) => {
        const x = p3.x + l.value * baseDeltaX;

        if (x < gridRect.x - 100 || x > gridRect.x + gridRect.width + 100) {
            return;
        }

        h.ctx.save();
        h.ctx.strokeStyle = l.color;
        h.ctx.lineWidth = l.lineWidth;
        h.ctx.globalAlpha = l.lineOpacity ?? 1;
        h.applyLineDash(l.lineStyle, l.lineWidth);
        h.drawSegment({ x, y: gridRect.y }, { x, y: gridRect.y + gridRect.height });

        if (trendBasedFibTimeProps.showLevels) {
            h.ctx.fillStyle = drawing.textColor || l.color;
            const fontSize = drawing.fontSize || 11;
            h.ctx.font = `${drawing.textItalic ? "italic " : ""}${drawing.textBold ? "bold " : ""}${fontSize}px Inter, sans-serif`;

            const align = trendBasedFibTimeProps.labelsHorizontalPosition || "right";
            h.ctx.textAlign = align === "left" ? "right" : (align === "center" ? "center" : "left");

            const labelPos = trendBasedFibTimeProps.labelsPosition || "bottom";
            h.ctx.textBaseline = labelPos === "top" ? "top" : (labelPos === "middle" ? "middle" : "bottom");

            const xOffset = align === "left" ? -4 : (align === "right" ? 4 : 0);
            const y = labelPos === "top" ? gridRect.y + 4 : (labelPos === "middle" ? gridRect.y + gridRect.height / 2 : gridRect.y + gridRect.height - 5);
            h.ctx.fillText(parseFloat(l.value.toFixed(3)).toString(), x + xOffset, y);
        }
        h.ctx.restore();
    });

    if (isSelected) { h.drawHandle(p1); h.drawHandle(p2); if (pts.length >= 3) h.drawHandle(p3); }
}

export function hitTestTrendBasedFibTime(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    chart: EChartsInstance,
    threshold: number
): HitTestResult {
    if (points.length < 2 || !drawing.trendBasedFibTimeProps) return { isHit: false, hitType: null };

    const p1 = points[0];
    const p2 = points[1];
    const p3 = points[2] || p2;
    const baseDeltaX = p2.x - p1.x;
    const gridRect = getGridRect(chart);

    if (drawing.trendBasedFibTimeProps.trendLine?.enabled) {
        if (distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y) < threshold) {
            return { isHit: true, hitType: 'shape' };
        }
    }

    if (drawing.trendBasedFibTimeProps.extensionLine?.enabled && points.length >= 3) {
        if (distToSegment(mx, my, p2.x, p2.y, p3.x, p3.y) < threshold) {
            return { isHit: true, hitType: 'shape' };
        }
    }

    if (gridRect) {
        for (const l of drawing.trendBasedFibTimeProps.levels.filter(l => l.enabled)) {
            const x = p3.x + l.value * baseDeltaX;
            if (Math.abs(mx - x) < threshold && my >= gridRect.y && my <= gridRect.y + gridRect.height) {
                return { isHit: true, hitType: 'shape' };
            }
        }
    }
    return { isHit: false, hitType: null };
}
