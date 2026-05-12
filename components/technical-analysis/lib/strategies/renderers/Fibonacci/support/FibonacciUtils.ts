import { Drawing } from "../../../../../config/TechnicalAnalysisTypes";
import type { EChartsInstance } from "../../../../types/echarts";
import { getSafeGridRect } from "../../../../../hooks/useChartViewport";

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

/**
 * [TENOR 2026 SRE FIX] SCAR-API-01: ECharts API Decoupling
 * Eradicated the hacky `(chart as EChartsWithModel).getModel?.()`.
 * Now safely delegates to the robust `getSafeGridRect` adapter which includes DOM fallbacks.
 */
export function getGridRect(chart: EChartsInstance) {
  try {
    const dom = chart.getDom() as HTMLElement | null;
    return getSafeGridRect(chart, dom);
  } catch (e) {
    console.warn("[SRE] FibonacciUtils getGridRect delegation failed.", e);
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
// --- EOF ---
