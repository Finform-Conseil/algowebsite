// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/implementations/ChannelsStrategy.ts

import { IDrawingStrategy, HitTestResult, DrawingHelpers } from "../interfaces/IDrawingStrategy";
import { Drawing, DrawingPoint } from "../../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import { CHANNEL_TOOLS } from "../../../config/TechnicalAnalysisConstants";
import type { EChartsInstance } from "../../types/echarts";

import { renderParallelChannel, hitTestParallelChannel } from "../renderers/Channels/ParallelChannelRenderer";
import { renderDisjointChannel, hitTestDisjointChannel } from "../renderers/Channels/DisjointChannelRenderer";
import { renderFlatTopBottom, hitTestFlatTopBottom } from "../renderers/Channels/FlatTopBottomRenderer";
import { renderRegressionTrend, hitTestRegressionTrend } from "../renderers/Channels/RegressionTrendRenderer";

export class ChannelsStrategy implements IDrawingStrategy {
    supportedTools = [...CHANNEL_TOOLS];

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
            case "parallel_channel":
                renderParallelChannel(pts, drawing, isSelected, h);
                break;
            case "disjoint_channel":
                renderDisjointChannel(pts, drawing, isSelected, h);
                break;
            case "flat_top_bottom":
                renderFlatTopBottom(pts, drawing, isSelected, h);
                break;
            case "regression_trend":
                renderRegressionTrend(pts, dataPoints, drawing, chart, isSelected, h);
                break;
        }
    }

    hitTest(mx: number, my: number, drawing: Drawing, chartInstance: EChartsInstance, threshold: number): HitTestResult {
        const points = drawing.points.map(p => {
            const pixel = chartInstance.convertToPixel({ seriesIndex: 0 }, [p.time, p.value]);
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
        
        if (type === "parallel_channel") {
            return hitTestParallelChannel(mx, my, points, drawing, threshold);
        } else if (type === "regression_trend") {
            return hitTestRegressionTrend(mx, my, points, drawing, threshold);
        } else if (type === "disjoint_channel") {
            return hitTestDisjointChannel(mx, my, points, drawing, threshold);
        } else if (type === "flat_top_bottom") {
            return hitTestFlatTopBottom(mx, my, points, drawing, threshold);
        }

        return { isHit: false, hitType: null };
    }
}
