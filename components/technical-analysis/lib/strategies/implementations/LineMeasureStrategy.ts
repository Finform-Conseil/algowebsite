
import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { DrawingPoint } from "../../../config/drawing/drawingPrimitiveTypes";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import { distToSegment, angleBetweenPoints } from "../../math/geometry";
import { LINE_TOOLS, MEASURE_TOOLS } from "../../../config/drawing/drawingConstants";
import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { EChartsInstance } from "../../types/echarts";

export class LineMeasureStrategy implements IDrawingStrategy {
    supportedTools = [
        ...LINE_TOOLS,
        ...MEASURE_TOOLS,
        "horizontal_line",
        "vertical_line",
        "horizontal_ray",
        "crosshair",
        "arrow_marker",
        "arrow_mark_up",
        "arrow_mark_down",
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
        chart: EChartsInstance,                 // Ignored but required by interface
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
            case "arrow_mark_up":
                this._renderArrowMarkUp(pts, drawing, isSelected, h);
                break;
            case "arrow_mark_down":
                this._renderArrowMarkDown(pts, drawing, isSelected, h);
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
            const radius = 10 * (scale / 2);
            const dx = mx - p1.x;
            const dy = my - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= radius + threshold) return { isHit: true, hitType: 'shape' };
        }
        // 2.7 Arrow Mark Up/Down
        else if (type === "arrow_mark_up" || type === "arrow_mark_down") {
            const scale = drawing.style?.lineWidth || 2;
            const arrowHeight = 24 * (scale / 2);
            const arrowWidth = 14 * (scale / 2);
            const dx = mx - p1.x;
            const dy = my - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= arrowHeight + threshold) return { isHit: true, hitType: 'shape' };
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
                ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);
            } else if (drawing.type === "price_range") {
                ctx.fillRect(xMin, yMin, xMax - xMin, yMax - yMin);
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
            h.drawSegment({ x: xMin, y: yMin }, { x: xMin, y: yMax });
            h.drawSegment({ x: xMax, y: yMin }, { x: xMax, y: yMax });

            // Horizontal measurement line with directional arrow
            const midY = yMin + (yMax - yMin) / 2;
            const arrowSize = 8;
            h.drawSegment({ x: xMin, y: midY }, { x: xMax, y: midY });
            // Arrow points towards p2 (direction of drawing)
            const drawnLeftToRight = p1.x <= p2.x;
            if (drawnLeftToRight) {
                // Arrow pointing right at xMax (towards p2)
                ctx.beginPath();
                ctx.moveTo(xMax, midY);
                ctx.lineTo(xMax - arrowSize, midY - arrowSize / 2);
                ctx.lineTo(xMax - arrowSize, midY + arrowSize / 2);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            } else {
                // Arrow pointing left at xMin (towards p2)
                ctx.beginPath();
                ctx.moveTo(xMin, midY);
                ctx.lineTo(xMin + arrowSize, midY - arrowSize / 2);
                ctx.lineTo(xMin + arrowSize, midY + arrowSize / 2);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            }
        } else if (drawing.type === "price_range") {
            h.drawSegment({ x: xMin, y: yMin }, { x: xMax, y: yMin });
            h.drawSegment({ x: xMin, y: yMax }, { x: xMax, y: yMax });

            // Vertical measurement line with directional arrow
            const midX = xMin + (xMax - xMin) / 2;
            const arrowSize = 8;
            h.drawSegment({ x: midX, y: yMin }, { x: midX, y: yMax });
            // Arrow points towards p2 (direction of drawing)
            const drawnTopToBottom = p1.y <= p2.y;
            if (drawnTopToBottom) {
                // Arrow pointing down at yMax (towards p2)
                ctx.beginPath();
                ctx.moveTo(midX, yMax);
                ctx.lineTo(midX - arrowSize / 2, yMax - arrowSize);
                ctx.lineTo(midX + arrowSize / 2, yMax - arrowSize);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            } else {
                // Arrow pointing up at yMin (towards p2)
                ctx.beginPath();
                ctx.moveTo(midX, yMin);
                ctx.lineTo(midX - arrowSize / 2, yMin + arrowSize);
                ctx.lineTo(midX + arrowSize / 2, yMin + arrowSize);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            }
        } else {
            // date_price_range: both measurement lines
            // Horizontal measurement line at midY with arrow
            const midY = yMin + (yMax - yMin) / 2;
            const midX = xMin + (xMax - xMin) / 2;
            const arrowSize = 8;
            h.drawSegment({ x: xMin, y: midY }, { x: xMax, y: midY });
            const drawnLeftToRight = p1.x <= p2.x;
            if (drawnLeftToRight) {
                ctx.beginPath();
                ctx.moveTo(xMax, midY);
                ctx.lineTo(xMax - arrowSize, midY - arrowSize / 2);
                ctx.lineTo(xMax - arrowSize, midY + arrowSize / 2);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(xMin, midY);
                ctx.lineTo(xMin + arrowSize, midY - arrowSize / 2);
                ctx.lineTo(xMin + arrowSize, midY + arrowSize / 2);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            }

            // Vertical measurement line at midX with arrow
            h.drawSegment({ x: midX, y: yMin }, { x: midX, y: yMax });
            const drawnTopToBottom = p1.y <= p2.y;
            if (drawnTopToBottom) {
                ctx.beginPath();
                ctx.moveTo(midX, yMax);
                ctx.lineTo(midX - arrowSize / 2, yMax - arrowSize);
                ctx.lineTo(midX + arrowSize / 2, yMax - arrowSize);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.moveTo(midX, yMin);
                ctx.lineTo(midX - arrowSize / 2, yMin + arrowSize);
                ctx.lineTo(midX + arrowSize / 2, yMin + arrowSize);
                ctx.closePath();
                ctx.fillStyle = ctx.strokeStyle as string;
                ctx.fill();
            }
        }
        ctx.restore();

        ctx.restore();

        // Text rendering
        if (drawing.showText && drawing.text) {
            if (drawing.type === "date_range") {
                const midY = yMin + (yMax - yMin) / 2;
                h.drawTextOnLine({ x: xMin, y: midY }, { x: xMax, y: midY }, drawing);
            } else if (drawing.type === "price_range") {
                const midX = xMin + (xMax - xMin) / 2;
                h.drawTextOnLine({ x: midX, y: yMin }, { x: midX, y: yMax }, drawing);
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
        const scale = style.lineWidth || 2;
        const radius = 10 * (scale / 2);
        const orientation = drawing.arrowOrientation || "bottom";

        h.ctx.save();

        // Filled circle (TradingView style)
        h.ctx.beginPath();
        h.ctx.arc(x, y, radius, 0, Math.PI * 2);
        h.ctx.fillStyle = style.color;
        h.ctx.fill();

        // White arrow inside the circle
        h.ctx.save();
        h.ctx.translate(x, y);

        let rotation = 0;
        switch (orientation) {
            case "top":    rotation = -Math.PI / 2; break;
            case "bottom": rotation = Math.PI / 2;  break;
            case "left":   rotation = Math.PI;      break;
            case "right":  rotation = 0;             break;
        }
        h.ctx.rotate(rotation);

        const arrowLen = radius * 0.55;
        const headLen = radius * 0.45;
        const headWidth = radius * 0.4;

        // Arrow body (line from center to right)
        h.ctx.beginPath();
        h.ctx.moveTo(-arrowLen, 0);
        h.ctx.lineTo(arrowLen, 0);
        h.ctx.strokeStyle = "#fff";
        h.ctx.lineWidth = Math.max(1.5, radius * 0.15);
        h.ctx.lineCap = "round";
        h.ctx.stroke();

        // Arrow head (triangle pointing right)
        h.ctx.beginPath();
        h.ctx.moveTo(arrowLen + headLen * 0.3, 0);
        h.ctx.lineTo(arrowLen - headLen * 0.7, -headWidth);
        h.ctx.lineTo(arrowLen - headLen * 0.7, headWidth);
        h.ctx.closePath();
        h.ctx.fillStyle = "#fff";
        h.ctx.fill();

        h.ctx.restore(); // undo rotation/translate

        // Selection highlight
        if (isSelected) {
            h.ctx.beginPath();
            h.ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
            h.ctx.strokeStyle = "#fff";
            h.ctx.lineWidth = 2;
            h.ctx.setLineDash([4, 3]);
            h.ctx.stroke();
            h.ctx.setLineDash([]);
            h.drawHandle(pts[0]);
        }

        h.ctx.restore();
    }

    private _renderArrowMarkUp(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const { x, y } = pts[0];
        const style = drawing.style;
        const scale = style.lineWidth || 2;
        const arrowHeight = 24 * (scale / 2);
        const arrowWidth = 14 * (scale / 2);
        const color = style.color || "#089981";

        h.ctx.save();

        // Arrow pointing UP: triangle + stem
        h.ctx.beginPath();
        h.ctx.moveTo(x, y + arrowHeight * 0.4);
        h.ctx.lineTo(x, y - arrowHeight * 0.3);
        h.ctx.strokeStyle = color;
        h.ctx.lineWidth = Math.max(2, arrowWidth * 0.2);
        h.ctx.lineCap = "round";
        h.ctx.stroke();

        // Arrow head (triangle pointing up)
        h.ctx.beginPath();
        h.ctx.moveTo(x, y - arrowHeight * 0.5);
        h.ctx.lineTo(x - arrowWidth * 0.5, y - arrowHeight * 0.1);
        h.ctx.lineTo(x + arrowWidth * 0.5, y - arrowHeight * 0.1);
        h.ctx.closePath();
        h.ctx.fillStyle = color;
        h.ctx.fill();

        // Subtle selection indicator
        if (isSelected) {
            h.ctx.beginPath();
            h.ctx.arc(x, y, arrowHeight * 0.6 + 4, 0, Math.PI * 2);
            h.ctx.strokeStyle = "rgba(255,255,255,0.4)";
            h.ctx.lineWidth = 1.5;
            h.ctx.setLineDash([3, 4]);
            h.ctx.stroke();
            h.ctx.setLineDash([]);
        }

        h.ctx.restore();
    }

    private _renderArrowMarkDown(
        pts: { x: number; y: number }[],
        drawing: Drawing,
        isSelected: boolean,
        h: DrawingHelpers
    ): void {
        if (pts.length < 1) return;
        const { x, y } = pts[0];
        const style = drawing.style;
        const scale = style.lineWidth || 2;
        const arrowHeight = 24 * (scale / 2);
        const arrowWidth = 14 * (scale / 2);
        const color = style.color || "#ef5350";

        h.ctx.save();

        // Arrow pointing DOWN: stem + triangle
        h.ctx.beginPath();
        h.ctx.moveTo(x, y - arrowHeight * 0.4);
        h.ctx.lineTo(x, y + arrowHeight * 0.3);
        h.ctx.strokeStyle = color;
        h.ctx.lineWidth = Math.max(2, arrowWidth * 0.2);
        h.ctx.lineCap = "round";
        h.ctx.stroke();

        // Arrow head (triangle pointing down)
        h.ctx.beginPath();
        h.ctx.moveTo(x, y + arrowHeight * 0.5);
        h.ctx.lineTo(x - arrowWidth * 0.5, y + arrowHeight * 0.1);
        h.ctx.lineTo(x + arrowWidth * 0.5, y + arrowHeight * 0.1);
        h.ctx.closePath();
        h.ctx.fillStyle = color;
        h.ctx.fill();

        // Subtle selection indicator
        if (isSelected) {
            h.ctx.beginPath();
            h.ctx.arc(x, y, arrowHeight * 0.6 + 4, 0, Math.PI * 2);
            h.ctx.strokeStyle = "rgba(255,255,255,0.4)";
            h.ctx.lineWidth = 1.5;
            h.ctx.setLineDash([3, 4]);
            h.ctx.stroke();
            h.ctx.setLineDash([]);
        }

        h.ctx.restore();
    }
}
