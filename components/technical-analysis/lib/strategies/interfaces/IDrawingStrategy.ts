// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/IDrawingStrategy.ts

import { Drawing, DrawingStyle, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";

// ============================================================================
// HIT-TEST RESULT
// ============================================================================
export interface HitTestResult {
    isHit: boolean;
    hitType: 'point' | 'shape' | 'zone_tp' | 'zone_sl' | 'width_resize' | null;
    pointIndex?: number;
}

// ============================================================================
// DRAWING HELPERS
// ============================================================================
export interface DrawingHelpers {
    /** Draw a straight line segment between two pixel points */
    drawSegment(p1: { x: number; y: number }, p2: { x: number; y: number }): void;
    /** Draw a selection handle at a pixel point (circle or square) */
    drawHandle(p: { x: number; y: number }, color?: string, radius?: number, shape?: 'circle' | 'square'): void;
    /** Draw text along a line segment using drawing text settings */
    drawTextOnLine(p1: { x: number; y: number }, p2: { x: number; y: number }, drawing: Drawing): void;
    /** Apply line style (color, dash, opacity) to the canvas context */
    applyStyle(style: DrawingStyle, isPreview: boolean): void;
    /**
     * Apply only the dash pattern + lineWidth to the context.
     * Equivalent to the old DrawingRenderer.applyLineDash() private method.
     * Does NOT change strokeStyle or globalAlpha — safe to mix with ctx.save/restore.
     */
    applyLineDash(lineStyle: "solid" | "dashed" | "dotted", lineWidth: number): void;
    /** The raw canvas 2D context for advanced operations */
    ctx: CanvasRenderingContext2D;
    /** Logical canvas width (device-pixel-ratio adjusted) */
    logicalWidth: number;
    /** Logical canvas height (device-pixel-ratio adjusted) */
    logicalHeight: number;
}

// ============================================================================
// STRATEGY INTERFACE
// ============================================================================
export interface IDrawingStrategy {
    /**
     * List of tool identifiers handled by this strategy.
     * Example: ['line', 'ray', 'horizontal_line']
     */
    supportedTools: string[];

    /**
     * Renders the drawing on the canvas.
     * 
     * [UPDATED] Now accepts chart instance and data points for advanced calculations.
     *
     * @param pixelPoints - Points already converted to pixel space
     * @param dataPoints - Original data points (Time/Value)
     * @param drawing - The Drawing object (style, config, etc.)
     * @param chart - ECharts instance (for coordinate conversion if needed)
     * @param isSelected - Whether the drawing is currently selected
     * @param helpers - Canvas primitives provided by DrawingRenderer
     * @param chartData - Full chart data for indicator-based drawings (VWAP, etc.)
     */
    render(
        pixelPoints: { x: number; y: number }[],
        dataPoints: DrawingPoint[], 
        drawing: Drawing,
        chart: unknown,
        isSelected: boolean,
        helpers: DrawingHelpers,
        chartData: ChartDataPoint[]
    ): void;

    /**
     * Evaluates if mouse coordinates hit the drawing or its handles.
     *
     * @param mx - Mouse X in pixel space
     * @param my - Mouse Y in pixel space
     * @param drawing - The Drawing object
     * @param chartInstance - ECharts instance for coordinate conversion
     * @param threshold - Pixel distance threshold for hit detection
     */
    hitTest(
        mx: number,
        my: number,
        drawing: Drawing,
        chartInstance: unknown,
        threshold: number
    ): HitTestResult;
}
