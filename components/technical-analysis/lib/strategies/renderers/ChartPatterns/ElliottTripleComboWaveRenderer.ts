// src/core/presentation/components/pages/Widget/TechnicalAnalysis/lib/strategies/renderers/ChartPatterns/ElliottTripleComboWaveRenderer.ts
import { Drawing, DrawingPoint } from "../../../../config/TechnicalAnalysisTypes";
import { DrawingHelpers, HitTestResult } from "../../interfaces/IDrawingStrategy";
import { renderElliottWaveBase, hitTestElliottWaveBase } from "./support/ElliottWaveUtils";

export function renderElliottTripleComboWave(
    pixelPoints: { x: number; y: number }[],
    dataPoints: DrawingPoint[],
    drawing: Drawing,
    isSelected: boolean,
    helpers: DrawingHelpers
): void {
    renderElliottWaveBase(pixelPoints, dataPoints, drawing, isSelected, helpers, ["W", "X", "Y", "X", "Z"]);
}

export function hitTestElliottTripleComboWave(
    mx: number,
    my: number,
    pixelPoints: { x: number; y: number }[],
    threshold: number
): HitTestResult {
    return hitTestElliottWaveBase(mx, my, pixelPoints, threshold);
}
