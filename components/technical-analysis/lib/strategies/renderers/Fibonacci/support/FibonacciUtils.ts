import { Drawing } from "../../../../../config/TechnicalAnalysisTypes";


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EChartsInstance = any;

export function getEnabledFibLevels(drawing: Drawing) {
    if (!drawing.fibProps) return [];
    return [...drawing.fibProps.levels]
        .filter((l) => l.enabled)
        .sort((a, b) => a.value - b.value);
}

export function getSortedEnabledLevels(fibProps: NonNullable<Drawing["fibProps"]>) {
    return [...fibProps.levels]
        .filter((l) => l.enabled)
        .sort((a, b) => a.value - b.value);
}

export function getGridRect(chart: EChartsInstance) {
    try {
        const model = chart.getModel();
        const grid = model.getComponent("grid");
        return grid ? grid.coordinateSystem.getRect() : null;
    } catch {
        return null;
    }
}

export function yToValue(y: number, chart: EChartsInstance, referenceTime: string | number): number | null {
    const data = chart.convertFromPixel({ seriesIndex: 0 }, [referenceTime, y]);
    return data ? Number(data[1]) : null;
}

export function valueToY(value: number, chart: EChartsInstance, referenceTime: string | number): number | null {
    const pos = chart.convertToPixel({ seriesIndex: 0 }, [referenceTime, value]);
    return pos ? pos[1] : null;
}

export function timeToX(time: number | string, chart: EChartsInstance): number | null {
    const referencePrice = 0;
    const pos = chart.convertToPixel({ seriesIndex: 0 }, [time, referencePrice]);
    return pos ? pos[0] : null;
}
