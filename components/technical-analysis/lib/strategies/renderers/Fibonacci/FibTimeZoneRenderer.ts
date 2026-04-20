import { HitTestResult, DrawingHelpers } from "../../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { getGridRect, getSortedEnabledLevels, getEnabledFibLevels, EChartsInstance } from "./support/FibonacciUtils";


export function renderFibTimeZone(
    pts: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    chart: EChartsInstance,
    isSelected: boolean,
    h: DrawingHelpers
) {
    if (pts.length < 1 || !drawing.fibProps) return;
    const { fibProps } = drawing;
    const p1 = pts[0]; const p2 = pts[1] || p1;
    const gridRect = getGridRect(chart);
    if (!gridRect) return;

    const intervalX = p2.x - p1.x;
    const direction = fibProps.reverse ? -1 : 1;
    const sortedLevels = getSortedEnabledLevels(fibProps);

    if (fibProps.fillBackground) {
        for (let i = 0; i < sortedLevels.length - 1; i++) {
            const l1 = sortedLevels[i]; const l2 = sortedLevels[i + 1];
            const x1 = p1.x + direction * intervalX * l1.value;
            const x2 = p1.x + direction * intervalX * l2.value;
            const drawX1 = Math.max(gridRect.x, Math.min(x1, x2));
            const drawX2 = Math.min(gridRect.x + gridRect.width, Math.max(x1, x2));
            if (drawX2 > drawX1) {
                h.ctx.save();
                h.ctx.fillStyle = fibProps.useOneColor ? (fibProps.oneColor || drawing.style.color) : l2.color;
                h.ctx.globalAlpha = (fibProps.fillOpacity ?? 0.15);
                h.ctx.fillRect(drawX1, gridRect.y, drawX2 - drawX1, gridRect.height);
                h.ctx.restore();
            }
        }
    }

    sortedLevels.forEach((level: { value: number; color: string; lineWidth: number; lineStyle: "solid" | "dashed" | "dotted"; lineOpacity: number; }) => {
        const x = p1.x + direction * intervalX * level.value;
        if (x < gridRect.x - 100 || x > gridRect.x + gridRect.width + 100) return;
        h.ctx.save();
        const color = fibProps.useOneColor ? (fibProps.oneColor || drawing.style.color) : level.color;
        h.ctx.strokeStyle = color;
        h.ctx.lineWidth = level.lineWidth;
        h.ctx.globalAlpha = level.lineOpacity ?? 1;
        h.applyLineDash(level.lineStyle, level.lineWidth);
        h.drawSegment({ x, y: gridRect.y }, { x, y: gridRect.y + gridRect.height });

        if (fibProps.showLevels) {
            h.ctx.fillStyle = drawing.textColor || color;
            h.ctx.font = "11px Inter";
            h.ctx.fillText(level.value.toString(), x + 5, gridRect.y + 5);
        }
        h.ctx.restore();
    });

    if (isSelected) {
        h.drawHandle(p1);
        if (pts.length >= 2) h.drawHandle(p2);
    }
}

export function hitTestFibTimeZone(
    mx: number,
    my: number,
    points: { x: number; y: number }[],
    drawing: Drawing,
    chart: EChartsInstance,
    threshold: number
): HitTestResult {
    if (points.length < 1 || !drawing.fibProps) return { isHit: false, hitType: null };
    const p1 = points[0]; const p2 = points[1] || p1;
    const intervalX = p2.x - p1.x;
    const direction = drawing.fibProps.reverse ? -1 : 1;
    const gridRect = getGridRect(chart);
    if (gridRect) {
        const enabledLevels = getEnabledFibLevels(drawing);
        for (const level of enabledLevels) {
            const lx = p1.x + direction * intervalX * level.value;
            if (Math.abs(mx - lx) < threshold && my >= gridRect.y && my <= gridRect.y + gridRect.height) {
                return { isHit: true, hitType: 'shape' };
            }
        }
    }
    return { isHit: false, hitType: null };
}
