// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/LineMeasureStrategy.ts

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { distToSegment, angleBetweenPoints } from "../../math/geometry";
import { LINE_TOOLS, MEASURE_TOOLS } from "../../../config/TechnicalAnalysisConstants";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import * as echarts from 'echarts';

export class LineMeasureStrategy implements IDrawingStrategy {
    supportedTools = [
        ...LINE_TOOLS,
        ...MEASURE_TOOLS,
        "horizontal_line",
        "vertical_line",
        "horizontal_ray",
        "crosshair",
        "arrow_marker",
        "arrow",
        "trend_angle"
    ];

    // ============================================================================
    // RENDER
    // ============================================================================
    render(
        pts: { x: number; y: number }[],
        dataPoints: DrawingPoint[], // Ignored but required by interface
        drawing: Drawing,
        chart: echarts.ECharts,                 // Ignored but required by interface
        isSelected: boolean,
        h: DrawingHelpers,
        _chartData: ChartDataPoint[]
    ): void {
        const { type } = drawing;

        switch (type) {
            case "line":
                this._renderLine(pts, drawing, isSelected, h);
                break;
            case "horizontal_line":
                this._renderHorizontalLine(pts, drawing, isSelected, h);
                break;
            case "vertical_line":
                this._renderVerticalLine(pts, drawing, isSelected, h);
                break;
            case "ray":
                this._renderRay(pts, drawing, isSelected, h);
                break;
            case "x_line":
                this._renderXLine(pts, drawing, isSelected, h);
                break;
            case "horizontal_ray":
                this._renderHorizontalRay(pts, drawing, isSelected, h);
                break;
            case "crosshair":
                this._renderCrosshair(pts, isSelected, h);
                break;
            case "arrow":
                this._renderArrow(pts, drawing, isSelected, h);
                break;
            case "trend_angle":
                this._renderTrendAngle(pts, drawing, isSelected, h);
                break;
            case "date_range":
            case "price_range":
            case "date_price_range":
            case "sector":
                this._renderMeasureBox(pts, drawing, isSelected, h);
                break;
            case "arrow_marker":
                this._renderArrowMarker(pts, drawing, isSelected, h);
                break;
            default:
                break;
        }
    }

    // ============================================================================
    // HIT-TEST
    // ============================================================================
    hitTest(mx: number, my: number, drawing: Drawing, chartInstance: unknown, threshold: number): HitTestResult {
        const chart = chartInstance as { convertToPixel: (opts: unknown, pt: unknown) => number[] | null };
        const points = drawing.points.map(p => {
            const pixel = chart.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
            return pixel ? { x: pixel[0], y: pixel[1] } : null;
        }).filter((p): p is { x: number; y: number } => p !== null);

        if (points.length < 1) return { isHit: false, hitType: null };

        // 1. Handle detection (Priority)
        for (let i = 0; i < points.length; i++) {
            if (Math.hypot(mx - points[i].x, my - points[i].y) < 12) {
                return { isHit: true, hitType: 'point', pointIndex: i };
            }
        }

        // 2. Shape detection
        const { type } = drawing;
        const p1 = points[0];

        // 2.1 Basic Lines & Rays
        if ((LINE_TOOLS as readonly string[]).includes(type) && points.length >= 2) {
            const p2 = points[1];
            const extendLeft = type === "x_line";
            const extendRight = type === "ray" || type === "x_line";
            if (distToSegment(mx, my, p1.x, p1.y, p2.x, p2.y, extendLeft, extendRight) < threshold) {
                return { isHit: true, hitType: 'shape' };
            }
        }
        // 2.2 Horizontal Tools
        else if (type === "horizontal_line" || type === "horizontal_ray") {
            const distY = Math.abs(my - p1.y);
            let isHit = distY < threshold;
            if (isHit && type === "horizontal_ray") {
                isHit = mx >= p1.x - threshold;
            }
            if (isHit) return { isHit: true, hitType: 'shape' };
        }
        // 2.3 Vertical Line
        else if (type === "vertical_line") {
            if (Math.abs(mx - p1.x) < threshold) return { isHit: true, hitType: 'shape' };
        }
        // 2.4 Crosshair
        else if (type === "crosshair") {
            if (Math.abs(mx - p1.x) < threshold || Math.abs(my - p1.y) < threshold) {
                return { isHit: true, hitType: 'shape' };
            }
        }
        // 2.5 Measure Tools
        else if ((MEASURE_TOOLS as readonly string[]).includes(type) && points.length >= 2) {
            const p2 = points[1];
            const xMin = Math.min(p1.x, p2.x), xMax = Math.max(p1.x, p2.x);
            const yMin = Math.min(p1.y, p2.y), yMax = Math.max(p1.y, p2.y);
            let isHit = false;

            if (type === "date_range") isHit = mx >= xMin - threshold && mx <= xMax + threshold;
            else if (type === "price_range") isHit = my >= yMin - threshold && my <= yMax + threshold;
            else if (type === "date_price_range" || type === "sector") {
                // date_price_range: hit if on border OR inside if fill is enabled
                const onBorder = distToSegment(mx, my, xMin, yMin, xMax, yMin) < threshold ||
                    distToSegment(mx, my, xMax, yMin, xMax, yMax) < threshold ||
                    distToSegment(mx, my, xMax, yMax, xMin, yMax) < threshold ||
                    distToSegment(mx, my, xMin, yMax, xMin, yMin) < threshold;
                const inside = mx >= xMin && mx <= xMax && my >= yMin && my <= yMax;
                isHit = onBorder || (drawing.style.fillEnabled !== false ? inside : false);
            }

            if (isHit) return { isHit: true, hitType: 'shape' };
        }
        // 2.6 Arrow Marker
        else if (type === "arrow_marker") {
            const scale = drawing.style?.lineWidth || 2;
            const bubbleHeight = 20 * (scale / 2);
            const pointerSize = 8 * (scale / 2);
            const totalHeight = bubbleHeight + pointerSize;
            const bubbleWidth = 40 * (scale / 2);

            const isInBubble = mx >= p1.x - bubbleWidth / 2 - threshold &&
                mx <= p1.x + bubbleWidth / 2 + threshold &&
                my >= p1.y - totalHeight - threshold &&
                my <= p1.y;

            if (isInBubble) return { isHit: true, hitType: 'shape' };
        }

        return { isHit: false, hitType: null };
    }

    // ============================================================================
    // PRIVATE RENDER HELPERS
    // ============================================================================

    private _extendLineToEdge(
        p1: { x: number; y: number },
        p2: { x: number; y: number }
    ): { x: number; y: number } {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        if (dx === 0 && dy === 0) return p2;
        const t = 10000;
        return { x: p1.x + dx * t, y: p1.y + dy * t };
    }

    private _drawArrowhead(
        from: { x: number; y: number },
        to: { x: number; y: number },
        size: number,
        h: DrawingHelpers
    ): void {
        const angle = Math.atan2(to.y - from.y, to.x - from.x);
        h.ctx.save();
        h.ctx.translate(to.x, to.y);
        h.ctx.rotate(angle);
        h.ctx.beginPath();
        h.ctx.moveTo(0, 0);
        h.ctx.lineTo(-size, -size / 2);
        h.ctx.lineTo(-size, size / 2);
        h.ctx.closePath();
        h.ctx.fillStyle = h.ctx.strokeStyle as string;
        h.ctx.fill();
        h.ctx.restore();
    }

    private _renderLine(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 2) return;
        h.drawSegment(pts[0], pts[1]);
        if (drawing.showText && drawing.text) h.drawTextOnLine(pts[0], pts[1], drawing);
        if (isSelected) {
            h.drawHandle(pts[0]);
            h.drawHandle(pts[1]);
        }
    }

    private _renderArrow(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 2) return;
        const [start, end] = pts;
        h.drawSegment(start, end);
        this._drawArrowhead(start, end, 12, h);
        if (drawing.showText && drawing.text) h.drawTextOnLine(start, end, drawing);
        if (isSelected) {
            h.drawHandle(start);
            h.drawHandle(end);
        }
    }

    private _renderTrendAngle(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 2) return;
        const [start, end] = pts;
        h.drawSegment(start, end);

        const angle = angleBetweenPoints(end.x, end.y, start.x, start.y) * (180 / Math.PI);

        // Draw angle arc
        h.ctx.beginPath();
        h.ctx.arc(start.x, start.y, 30, 0, -angle * (Math.PI / 180), angle > 0);
        h.ctx.stroke();

        // Draw angle label — respect text settings from Drawing Settings Modal
        h.ctx.fillStyle = drawing.textColor || h.ctx.strokeStyle as string;
        const angleFontStyle = drawing.textItalic ? "italic " : "";
        const angleFontWeight = drawing.textBold ? "bold " : "";
        const angleFontSize = drawing.fontSize || 12;
        h.ctx.font = `${angleFontStyle}${angleFontWeight}${angleFontSize}px Inter, sans-serif`;
        h.ctx.fillText(`${angle.toFixed(1)}°`, start.x + 35, start.y - 5);

        if (drawing.showText && drawing.text) h.drawTextOnLine(start, end, drawing);
        if (isSelected) {
            h.drawHandle(start);
            h.drawHandle(end);
        }
    }

    private _renderHorizontalLine(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const p1 = { x: 0, y: pts[0].y };
        const p2 = { x: h.logicalWidth, y: pts[0].y };
        h.drawSegment(p1, p2);
        if (drawing.showText && drawing.text) h.drawTextOnLine(p1, p2, drawing);
        if (isSelected) h.drawHandle(pts[0]);
    }

    private _renderVerticalLine(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const p1 = { x: pts[0].x, y: 0 };
        const p2 = { x: pts[0].x, y: h.logicalHeight };
        h.drawSegment(p1, p2);
        if (drawing.showText && drawing.text) h.drawTextOnLine(p1, p2, drawing);
        if (isSelected) h.drawHandle(pts[0]);
    }

    private _renderRay(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 2) return;
        const extended = this._extendLineToEdge(pts[0], pts[1]);
        h.drawSegment(pts[0], extended);
        if (drawing.showText && drawing.text) h.drawTextOnLine(pts[0], extended, drawing);
        if (isSelected) {
            h.drawHandle(pts[0]);
            h.drawHandle(pts[1]);
        }
    }

    private _renderXLine(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 2) return;
        const extFwd = this._extendLineToEdge(pts[0], pts[1]);
        const extBwd = this._extendLineToEdge(pts[1], pts[0]);
        h.drawSegment(extBwd, extFwd);
        if (drawing.showText && drawing.text) h.drawTextOnLine(extBwd, extFwd, drawing);
        if (isSelected) {
            h.drawHandle(pts[0]);
            h.drawHandle(pts[1]);
        }
    }

    private _renderHorizontalRay(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const p1 = pts[0];
        const p2 = { x: h.logicalWidth, y: pts[0].y };
        h.drawSegment(p1, p2);
        if (drawing.showText && drawing.text) h.drawTextOnLine(p1, p2, drawing);
        if (isSelected) h.drawHandle(pts[0]);
    }

    private _renderCrosshair(
        pts: { x: number; y: number }[],
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const { x, y } = pts[0];
        h.drawSegment({ x: 0, y }, { x: h.logicalWidth, y });
        h.drawSegment({ x, y: 0 }, { x, y: h.logicalHeight });
        if (isSelected) h.drawHandle(pts[0]);
    }

    private _renderMeasureBox(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 2) return;
        const [p1, p2] = pts;
        const xMin = Math.min(p1.x, p2.x), xMax = Math.max(p1.x, p2.x);
        const yMin = Math.min(p1.y, p2.y), yMax = Math.max(p1.y, p2.y);
        const { style } = drawing;
        const ctx = h.ctx;

        ctx.save();
        // Style application (match DrawingRendererOld pattern)
        h.applyStyle(style, false);

        // Fill zone
        if (style.fillEnabled !== false) {
            ctx.save();
            ctx.fillStyle = style.fillColor || style.color || "#2962FF";
            ctx.globalAlpha = style.fillOpacity ?? 0.15;
            if (drawing.type === "date_range") {
                ctx.fillRect(xMin, 0, xMax - xMin, h.logicalHeight);
            } else if (drawing.type === "price_range") {
                ctx.fillRect(0, yMin, h.logicalWidth, yMax - yMin);
            } else {
                // date_price_range
                ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);
            }
            ctx.restore();
        }

        // Border lines
        ctx.save();
        h.applyStyle(style, false); // Re-apply for stroke consistency
        if (drawing.type === "date_range") {
            h.drawSegment({ x: xMin, y: 0 }, { x: xMin, y: h.logicalHeight });
            h.drawSegment({ x: xMax, y: 0 }, { x: xMax, y: h.logicalHeight });
        } else if (drawing.type === "price_range") {
            h.drawSegment({ x: 0, y: yMin }, { x: h.logicalWidth, y: yMin });
            h.drawSegment({ x: 0, y: yMax }, { x: h.logicalWidth, y: yMax });
        } else {
            // date_price_range: use strokeRect for proper corner rendering
            ctx.strokeRect(xMin, yMin, xMax - xMin, yMax - yMin);
        }
        ctx.restore();

        ctx.restore();

        // Text rendering
        if (drawing.showText && drawing.text) {
            if (drawing.type === "date_range") {
                h.drawTextOnLine({ x: xMin, y: h.logicalHeight / 2 }, { x: xMax, y: h.logicalHeight / 2 }, drawing);
            } else if (drawing.type === "price_range") {
                h.drawTextOnLine({ x: h.logicalWidth / 2, y: yMin }, { x: h.logicalWidth / 2, y: yMax }, drawing);
            } else {
                // date_price_range: centered text (matches DrawingRendererOld)
                ctx.save();
                const centerX = xMin + (xMax - xMin) / 2;
                const centerY = yMin + (yMax - yMin) / 2;
                ctx.font = `${drawing.textBold ? "bold " : ""}${drawing.textItalic ? "italic " : ""}${drawing.fontSize || 13}px Inter, sans-serif`;
                ctx.fillStyle = drawing.textColor || style.color || "#FFFFFF";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(drawing.text, centerX, centerY);
                ctx.restore();
            }
        }

        if (isSelected) {
            h.drawHandle(p1);
            h.drawHandle(p2);
        }
    }

    private _renderArrowMarker(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const { x, y } = pts[0];
        const style = drawing.style;

        const fontSize = drawing.fontSize || 13;
        const scale = style.lineWidth || 2;
        const scaledFontSize = Math.max(10, fontSize * (scale / 2));
        const fontStyle = `${drawing.textBold ? 'bold ' : ''}${drawing.textItalic ? 'italic ' : ''}`;

        h.ctx.save();
        h.ctx.font = `${fontStyle}${scaledFontSize}px Inter, sans-serif`;

        const textWidth = drawing.text ? h.ctx.measureText(drawing.text).width : 0;
        const padding = 8 * (scale / 2);
        const bubbleWidth = drawing.text ? textWidth + padding * 2 : 40 * (scale / 2);
        const bubbleHeight = scaledFontSize + padding;
        const cornerRadius = 4 * (scale / 2);
        const pointerSize = 8 * (scale / 2);

        const orientation = drawing.arrowOrientation || "bottom";

        h.ctx.fillStyle = style.color;
        h.ctx.strokeStyle = style.color;
        h.ctx.lineWidth = 1;

        let bx = 0, by = 0;

        h.ctx.beginPath();
        h.ctx.moveTo(x, y);

        switch (orientation) {
            case "bottom":
                bx = x - bubbleWidth / 2;
                by = y - pointerSize - bubbleHeight;
                h.ctx.lineTo(x - pointerSize / 2, y - pointerSize);
                h.ctx.lineTo(bx + cornerRadius, by + bubbleHeight);
                h.ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - cornerRadius);
                h.ctx.lineTo(bx, by + cornerRadius);
                h.ctx.quadraticCurveTo(bx, by, bx + cornerRadius, by);
                h.ctx.lineTo(bx + bubbleWidth - cornerRadius, by);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + cornerRadius);
                h.ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - cornerRadius);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - cornerRadius, by + bubbleHeight);
                h.ctx.lineTo(x + pointerSize / 2, y - pointerSize);
                break;

            case "top":
                bx = x - bubbleWidth / 2;
                by = y + pointerSize;
                h.ctx.lineTo(x + pointerSize / 2, y + pointerSize);
                h.ctx.lineTo(bx + bubbleWidth - cornerRadius, by);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + cornerRadius);
                h.ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - cornerRadius);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - cornerRadius, by + bubbleHeight);
                h.ctx.lineTo(bx + cornerRadius, by + bubbleHeight);
                h.ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - cornerRadius);
                h.ctx.lineTo(bx, by + cornerRadius);
                h.ctx.quadraticCurveTo(bx, by, bx + cornerRadius, by);
                h.ctx.lineTo(x - pointerSize / 2, y + pointerSize);
                break;

            case "left":
                bx = x + pointerSize;
                by = y - bubbleHeight / 2;
                h.ctx.lineTo(x + pointerSize, y - pointerSize / 2);
                h.ctx.lineTo(bx, by + cornerRadius);
                h.ctx.quadraticCurveTo(bx, by, bx + cornerRadius, by);
                h.ctx.lineTo(bx + bubbleWidth - cornerRadius, by);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + cornerRadius);
                h.ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - cornerRadius);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - cornerRadius, by + bubbleHeight);
                h.ctx.lineTo(bx + cornerRadius, by + bubbleHeight);
                h.ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - cornerRadius);
                h.ctx.lineTo(x + pointerSize, y + pointerSize / 2);
                break;

            case "right":
                bx = x - pointerSize - bubbleWidth;
                by = y - bubbleHeight / 2;
                h.ctx.lineTo(x - pointerSize, y + pointerSize / 2);
                h.ctx.lineTo(bx + bubbleWidth, by + bubbleHeight - cornerRadius);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by + bubbleHeight, bx + bubbleWidth - cornerRadius, by + bubbleHeight);
                h.ctx.lineTo(bx + cornerRadius, by + bubbleHeight);
                h.ctx.quadraticCurveTo(bx, by + bubbleHeight, bx, by + bubbleHeight - cornerRadius);
                h.ctx.lineTo(bx, by + cornerRadius);
                h.ctx.quadraticCurveTo(bx, by, bx + cornerRadius, by);
                h.ctx.lineTo(bx + bubbleWidth - cornerRadius, by);
                h.ctx.quadraticCurveTo(bx + bubbleWidth, by, bx + bubbleWidth, by + cornerRadius);
                h.ctx.lineTo(x - pointerSize, y - pointerSize / 2);
                break;
        }

        h.ctx.closePath();
        h.ctx.fill();

        if (drawing.text && drawing.showText !== false) {
            h.ctx.fillStyle = drawing.textColor || "#fff";
            h.ctx.textAlign = "center";
            h.ctx.textBaseline = "middle";
            h.ctx.fillText(drawing.text, bx + bubbleWidth / 2, by + bubbleHeight / 2);
        }

        if (isSelected) {
            h.ctx.strokeStyle = "#fff";
            h.ctx.lineWidth = 2;
            h.ctx.stroke();
            h.drawHandle(pts[0]);
        }

        h.ctx.restore();
    }
}
