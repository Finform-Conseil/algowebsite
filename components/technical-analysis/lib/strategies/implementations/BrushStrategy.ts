import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { distToSegment } from "../../math/geometry";
import type { EChartsInstance } from "../../types/echarts";

export class BrushStrategy implements IDrawingStrategy {
    supportedTools = ["brush", "highlighter"];

    render(
        pts: { x: number; y: number }[],
        dataPoints: DrawingPoint[],
        drawing: Drawing,
        chart: EChartsInstance,
        isSelected: boolean,
        h: DrawingHelpers,
        _chartData: ChartDataPoint[]
    ): void {
        if (pts.length < 1) return;

        const isHighlighter = drawing.type === "highlighter";
        const style = { ...drawing.style };

        if (isHighlighter) {
            style.lineOpacity = 0.28;
            style.lineWidth = Math.max(style.lineWidth, 14);
            style.lineStyle = "solid";
        }

        h.applyStyle(style, false);
        h.ctx.lineCap = "round";
        h.ctx.lineJoin = "round";

        if (pts.length === 1) {
            h.drawHandle(pts[0], style.color, isHighlighter ? 6 : 3, "circle");
            return;
        }

        const ctx = h.ctx;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);

        if (pts.length === 2) {
            ctx.lineTo(pts[1].x, pts[1].y);
        } else {
            for (let i = 1; i < pts.length - 1; i++) {
                const midX = (pts[i].x + pts[i + 1].x) / 2;
                const midY = (pts[i].y + pts[i + 1].y) / 2;
                ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
            }
            const last = pts[pts.length - 1];
            ctx.lineTo(last.x, last.y);
        }

        if (style.fillEnabled) {
            ctx.save();
            ctx.fillStyle = style.fillColor || style.color;
            ctx.globalAlpha = style.fillOpacity ?? 0.2;
            ctx.fill();
            ctx.restore();
        }

        ctx.stroke();

        if (isSelected && pts.length >= 2) {
            h.drawHandle(pts[0], style.color, 4, "circle");
            h.drawHandle(pts[pts.length - 1], style.color, 4, "circle");
        }
    }

    hitTest(
        mx: number,
        my: number,
        drawing: Drawing,
        chartInstance: EChartsInstance,
        threshold: number
    ): HitTestResult {
        const points = drawing.points
            .map((p) => {
                const pixel = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
                return pixel ? { x: pixel[0], y: pixel[1] } : null;
            })
            .filter((p): p is { x: number; y: number } => p !== null);

        if (points.length < 1) return { isHit: false, hitType: null };

        for (let i = 0; i < points.length; i++) {
            if (Math.hypot(mx - points[i].x, my - points[i].y) < 12) {
                return { isHit: true, hitType: "point", pointIndex: i };
            }
        }

        for (let i = 0; i < points.length - 1; i++) {
            const dist = distToSegment(mx, my, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y);
            if (dist < threshold) {
                return { isHit: true, hitType: "shape" };
            }
        }

        return { isHit: false, hitType: null };
    }
}
