// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/ElliottImpulseWaveRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers, HitTestResult } from "../../interfaces/IDrawingStrategy";
import { renderElliottWaveBase, hitTestElliottWaveBase } from "./support/ElliottWaveUtils";

export function renderElliottImpulseWave(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    renderElliottWaveBase(pixelPoints, dataPoints, drawing, isSelected, helpers, ["0", "1", "2", "3", "4", "5"]);
}

export function hitTestElliottImpulseWave(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    threshold: number
): HitTestResult {
    return hitTestElliottWaveBase(mx, my, pixelPoints, threshold);
}
