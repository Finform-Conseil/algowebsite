// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/AdvancedToolsStrategy.ts

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { MULTI_POINT_TOOLS } from "../../../config/TechnicalAnalysisConstants";
import { distanceBetweenPoints } from "../../math/geometry";
import type { EChartsInstance } from "../../types/echarts";

// --- RENDERERS PURES (1 Fichier = 1 Outil) ---
import { renderPolyline, hitTestPolyline } from "../renderers/AdvancedTools/PolylineRenderer";
import { renderPath, hitTestPath } from "../renderers/AdvancedTools/PathRenderer";
import { renderCurve, hitTestCurve } from "../renderers/AdvancedTools/CurveRenderer";
import { renderProjection, hitTestProjection } from "../renderers/AdvancedTools/ProjectionRenderer";

/**
 * [HDR 2026] AdvancedToolsStrategy — Orchestrator Only
 * Handles multi-point drawings: polyline, path, curve, projection, and positions.
 * Rendering logic segregated for Single Responsibility (SOLID).
 */
export class AdvancedToolsStrategy implements IDrawingStrategy {
    public supportedTools = [
        ...MULTI_POINT_TOOLS,
        "curve"
        // Note: POSITION_TOOLS (long_position, short_position) et Forecasting tools
        // sont désormais gérés par ForecastingStrategy (enregistrée APRÈS dans le Registry,
        // ce qui signifie qu'elle ÉCRASE l'enregistrement de AdvancedToolsStrategy pour ces outils).
    ];

    public render(
        pts: { x: number; y: number }[],
        dataPoints: DrawingPoint[],
        drawing: Drawing,
        chart: EChartsInstance,
        isSelected: boolean,
        h: DrawingHelpers,
        _chartData: ChartDataPoint[]
    ): void {
        const { type } = drawing;

        switch (type) {
            case "polyline":
                renderPolyline(pts, drawing, isSelected, h);
                break;
            case "path":
                renderPath(pts, drawing, isSelected, h);
                break;
            case "curve":
                renderCurve(pts, drawing, isSelected, h);
                break;
            case "projection":
                renderProjection(pts, drawing, isSelected, h);
                break;
        }
    }

    public hitTest(
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

        const { type } = drawing;

        // 1. Generic Handle detection (Priority)
        for (let i = 0; i < points.length; i++) {
            if (distanceBetweenPoints(mx, my, points[i].x, points[i].y) < 12) {
                return { isHit: true, hitType: "point", pointIndex: i };
            }
        }

        if (type === "projection") {
            return hitTestProjection(mx, my, points, threshold);
        }
        if (type === "curve") {
            return hitTestCurve(mx, my, points, threshold);
        }
        if (type === "polyline") {
            return hitTestPolyline(mx, my, points, threshold);
        }
        if (type === "path") {
            return hitTestPath(mx, my, points, threshold);
        }

        return { isHit: false, hitType: null };
    }
}
