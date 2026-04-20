// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/FibonacciStrategy.ts

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { FIB_PURE_TOOLS } from "../../../config/TechnicalAnalysisConstants";
import { distanceBetweenPoints } from "../../math/geometry";
import { EChartsInstance } from "../renderers/Fibonacci/support/FibonacciUtils";

import { renderFibRetracement, hitTestFibRetracement } from "../renderers/Fibonacci/FibRetracementRenderer";
import { renderTrendBasedFibExtension, hitTestTrendBasedFibExtension } from "../renderers/Fibonacci/TrendBasedFibExtensionRenderer";
import { renderFibChannel, hitTestFibChannel } from "../renderers/Fibonacci/FibChannelRenderer";
import { renderFibTimeZone, hitTestFibTimeZone } from "../renderers/Fibonacci/FibTimeZoneRenderer";
import { renderFibSpeedResistanceFan, hitTestFibSpeedResistanceFan } from "../renderers/Fibonacci/FibSpeedResistanceFanRenderer";
import { renderFibSpeedResistanceArcs, hitTestFibSpeedResistanceArcs } from "../renderers/Fibonacci/FibSpeedResistanceArcsRenderer";
import { renderTrendBasedFibTime, hitTestTrendBasedFibTime } from "../renderers/Fibonacci/TrendBasedFibTimeRenderer";
import { renderFibCircles, hitTestFibCircles } from "../renderers/Fibonacci/FibCirclesRenderer";
import { renderFibSpiral, hitTestFibSpiral } from "../renderers/Fibonacci/FibSpiralRenderer";
import { renderFibWedge, hitTestFibWedge } from "../renderers/Fibonacci/FibWedgeRenderer";
import { renderPitchfan, hitTestPitchfan } from "../renderers/Fibonacci/PitchfanRenderer";

export class FibonacciStrategy implements IDrawingStrategy {
    supportedTools = [
        ...FIB_PURE_TOOLS,
        "pitchfan"
    ].filter(t => !t.includes("gann"));

    render(
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
            case "fib_retracement":
                renderFibRetracement(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "trend_based_fib_extension":
                renderTrendBasedFibExtension(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "fib_channel":
                renderFibChannel(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "fib_time_zone":
                renderFibTimeZone(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "fib_speed_resistance_fan":
                renderFibSpeedResistanceFan(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "fib_speed_resistance_arcs":
                renderFibSpeedResistanceArcs(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "trend_based_fib_time":
                renderTrendBasedFibTime(pts, dataPoints, drawing, chart, isSelected, h);
                break;
            case "fib_circles":
                renderFibCircles(pts, drawing, isSelected, h);
                break;
            case "fib_spiral":
                renderFibSpiral(pts, drawing, isSelected, h);
                break;
            case "fib_wedge":
                renderFibWedge(pts, drawing, isSelected, h);
                break;
            case "pitchfan":
                renderPitchfan(pts, drawing, isSelected, h);
                break;
        }
    }

    hitTest(mx: number, my: number, drawing: Drawing, chartInstance: unknown, threshold: number): HitTestResult {
        const chart = chartInstance as EChartsInstance;
        const points = drawing.points.map(p => {
            const pixel = chart.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
            return pixel ? { x: pixel[0], y: pixel[1] } : null;
        }).filter((p): p is { x: number; y: number } => p !== null);

        if (points.length < 1) return { isHit: false, hitType: null };

        // 1. Handle detection (Priority)
        for (let i = 0; i < points.length; i++) {
            if (distanceBetweenPoints(mx, my, points[i].x, points[i].y) < 12) {
                return { isHit: true, hitType: 'point', pointIndex: i };
            }
        }

        const { type } = drawing;

        // 2. Tool-Specific Shape Detection
        switch (type) {
            case "fib_retracement":
                return hitTestFibRetracement(mx, my, points, drawing, chart, threshold);
            case "trend_based_fib_extension":
                return hitTestTrendBasedFibExtension(mx, my, points, drawing, chart, threshold);
            case "fib_channel":
                return hitTestFibChannel(mx, my, points, drawing, threshold);
            case "fib_time_zone":
                return hitTestFibTimeZone(mx, my, points, drawing, chart, threshold);
            case "fib_speed_resistance_fan":
                return hitTestFibSpeedResistanceFan(mx, my, points, drawing, threshold);
            case "fib_speed_resistance_arcs":
                return hitTestFibSpeedResistanceArcs(mx, my, points, drawing, threshold);
            case "trend_based_fib_time":
                return hitTestTrendBasedFibTime(mx, my, points, drawing, chart, threshold);
            case "fib_circles":
                return hitTestFibCircles(mx, my, points, drawing, threshold);
            case "fib_spiral":
                return hitTestFibSpiral(mx, my, points, drawing, threshold);
            case "fib_wedge":
                return hitTestFibWedge(mx, my, points, drawing, threshold);
            case "pitchfan":
                return hitTestPitchfan(mx, my, points, drawing, threshold);
        }

        return { isHit: false, hitType: null };
    }
}
