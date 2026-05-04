// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/ChartPatternsStrategy.ts

import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import type { EChartsInstance } from "../../types/echarts";

// ─── UNIT RENDERERS (HDR 2026 - SOLID) ────────────────────────────────────────
import { renderXABCD } from "../renderers/ChartPatterns/XABCDPatternRenderer";
import { renderCypher } from "../renderers/ChartPatterns/CypherPatternRenderer";
import { renderABCD } from "../renderers/ChartPatterns/ABCDPatternRenderer";
import { renderTrianglePattern } from "../renderers/ChartPatterns/TrianglePatternRenderer";
import { renderThreeDrivesPattern } from "../renderers/ChartPatterns/ThreeDrivesPatternRenderer";
import { renderHeadAndShoulders } from "../renderers/ChartPatterns/HeadAndShouldersRenderer";
import { hitTestGeometric } from "../renderers/ChartPatterns/support/GeometricPatternUtils";

import { renderElliottImpulseWave, hitTestElliottImpulseWave } from "../renderers/ChartPatterns/ElliottImpulseWaveRenderer";
import { renderElliottTriangleWave, hitTestElliottTriangleWave } from "../renderers/ChartPatterns/ElliottTriangleWaveRenderer";
import { renderElliottTripleComboWave, hitTestElliottTripleComboWave } from "../renderers/ChartPatterns/ElliottTripleComboWaveRenderer";
import { renderElliottCorrectionWave, hitTestElliottCorrectionWave } from "../renderers/ChartPatterns/ElliottCorrectionWaveRenderer";
import { renderElliottDoubleComboWave, hitTestElliottDoubleComboWave } from "../renderers/ChartPatterns/ElliottDoubleComboWaveRenderer";

import { renderCyclicLines, hitTestCyclicLines } from "../renderers/ChartPatterns/CyclicLinesRenderer";
import { renderTimeCycles, hitTestTimeCycles } from "../renderers/ChartPatterns/TimeCyclesRenderer";
import { renderSineLine, hitTestSineLine } from "../renderers/ChartPatterns/SineLineRenderer";

/**
 * [HDR 2026] ChartPatternsStrategy — Orchestrator Only
 * This file is a pure Router. All rendering logic lives in /renderers/.
 */
export class ChartPatternsStrategy implements IDrawingStrategy {
    public supportedTools = [
        "xabcd_pattern",
        "cypher_pattern",
        "abcd_pattern",
        "triangle_pattern",
        "three_drives_pattern",
        "head_and_shoulders",
        "elliott_impulse_wave",
        "elliott_triangle_wave",
        "elliott_triple_combo_wave",
        "elliott_correction_wave",
        "elliott_double_combo_wave",
        "cyclic_lines",
        "time_cycles",
        "sine_line",
    ];

    public render(
        pixelPoints: { x: number; y: number }[],
        dataPoints: DrawingPoint[],
        drawing: Drawing,
        chart: EChartsInstance,
        isSelected: boolean,
        helpers: DrawingHelpers,
        _chartData: ChartDataPoint[]
    ): void {
        const { type } = drawing;

        switch (type) {
            case "xabcd_pattern":
                renderXABCD(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "cypher_pattern":
                renderCypher(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "abcd_pattern":
                renderABCD(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "triangle_pattern":
                renderTrianglePattern(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "three_drives_pattern":
                renderThreeDrivesPattern(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "head_and_shoulders":
                renderHeadAndShoulders(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "elliott_impulse_wave":
                renderElliottImpulseWave(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "elliott_triangle_wave":
                renderElliottTriangleWave(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "elliott_triple_combo_wave":
                renderElliottTripleComboWave(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "elliott_correction_wave":
                renderElliottCorrectionWave(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "elliott_double_combo_wave":
                renderElliottDoubleComboWave(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "cyclic_lines":
                renderCyclicLines(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "time_cycles":
                renderTimeCycles(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
            case "sine_line":
                renderSineLine(pixelPoints, dataPoints, drawing, isSelected, helpers);
                break;
        }
    }

    public hitTest(
        mx: number,
        my: number,
        drawing: Drawing,
        chart: ECharts,
        threshold: number
    ): HitTestResult {
        const pixelPoints = drawing.points
            .map((p) => {
                const pix = chart.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
                return pix ? ({ x: (pix as [number, number])[0], y: (pix as [number, number])[1] }) : null;
            })
            .filter(Boolean) as { x: number; y: number }[];

        for (let i = 0; i < pixelPoints.length; i++) {
            const dist = Math.sqrt(Math.pow(mx - pixelPoints[i].x, 2) + Math.pow(my - pixelPoints[i].y, 2));
            if (dist < threshold) return { isHit: true, hitType: "point", pointIndex: i };
        }

        const { type } = drawing;

        switch (type) {
            case "elliott_impulse_wave":
                return hitTestElliottImpulseWave(mx, my, pixelPoints, threshold);
            case "elliott_triangle_wave":
                return hitTestElliottTriangleWave(mx, my, pixelPoints, threshold);
            case "elliott_triple_combo_wave":
                return hitTestElliottTripleComboWave(mx, my, pixelPoints, threshold);
            case "elliott_correction_wave":
                return hitTestElliottCorrectionWave(mx, my, pixelPoints, threshold);
            case "elliott_double_combo_wave":
                return hitTestElliottDoubleComboWave(mx, my, pixelPoints, threshold);
            case "cyclic_lines":
                return hitTestCyclicLines(mx, my, pixelPoints, drawing, threshold);
            case "time_cycles":
                return hitTestTimeCycles(mx, my, pixelPoints, drawing, threshold);
            case "sine_line":
                return hitTestSineLine(mx, my, pixelPoints, threshold);
            default:
                // All geometric patterns (XABCD, Cypher, ABCD, Triangle, Three Drives, H&S)
                return hitTestGeometric(mx, my, pixelPoints, drawing, threshold);
        }
    }
}
