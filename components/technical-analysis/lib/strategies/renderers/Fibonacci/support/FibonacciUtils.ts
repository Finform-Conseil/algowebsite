import { Drawing } from "../../../../../config/TechnicalAnalysisTypes";
import type { EChartsInstance, EChartsWithModel } from "../../../../types/echarts";

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
        const model = (chart as EChartsWithModel).getModel?.();
        if (!model) return null;
        const grid = model.getComponent("grid");
        return grid?.coordinateSystem?.getRect() ?? null;
    } catch {
        return null;
    }
}

export function yToValue(y: number, chart: EChartsInstance, referenceTime: string | number): number | null {
    const x = timeToX(referenceTime, chart);
    if (x === null) return null;
    const data = chart.convertFromPixel({ seriesIndex: 0 }, [x, y]);
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
