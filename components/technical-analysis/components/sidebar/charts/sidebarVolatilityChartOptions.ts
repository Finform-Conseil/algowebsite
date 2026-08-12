import type { EChartsCoreOption } from "echarts/core";
import { getVolatilitySkew, getVolatilityTermStructure } from "@/shared/utils/volatility-engine";
import type { TechnicalIndicatorEntity } from "@/core/domain/entities/cours.entity";
import type { SidebarEChartsRuntime } from "./sidebarEChartsRuntime";
import { escapeSidebarTooltipText } from "./sidebarChartOptions";

const VOLATILITY_MATURITIES = ["1W", "2W", "1M", "2M", "3M", "6M", "9M", "1Y"] as const;

type VolatilityMaturity = typeof VOLATILITY_MATURITIES[number];
type VolatilityTermPoint = { label: VolatilityMaturity; value: number | null };

const readApiVolatilityValues = (apiTechnicalIndicator?: TechnicalIndicatorEntity | null): Record<VolatilityMaturity, number | null> => ({
  "1W": Number.isFinite(apiTechnicalIndicator?.hv_10) ? apiTechnicalIndicator!.hv_10! : null,
  "2W": Number.isFinite(apiTechnicalIndicator?.hv_10) ? apiTechnicalIndicator!.hv_10! : null,
  "1M": Number.isFinite(apiTechnicalIndicator?.hv_20) ? apiTechnicalIndicator!.hv_20! : null,
  "2M": Number.isFinite(apiTechnicalIndicator?.hv_30) ? apiTechnicalIndicator!.hv_30! : null,
  "3M": Number.isFinite(apiTechnicalIndicator?.hv_60) ? apiTechnicalIndicator!.hv_60! : null,
  "6M": Number.isFinite(apiTechnicalIndicator?.hv_90) ? apiTechnicalIndicator!.hv_90! : null,
  "9M": Number.isFinite(apiTechnicalIndicator?.hv_90) ? apiTechnicalIndicator!.hv_90! : null,
  "1Y": Number.isFinite(apiTechnicalIndicator?.hv_252) ? apiTechnicalIndicator!.hv_252! : null,
});

export const hasApiVolatilityTermStructure = (apiTechnicalIndicator?: TechnicalIndicatorEntity | null): boolean =>
  Object.values(readApiVolatilityValues(apiTechnicalIndicator)).some((value) => value !== null);

export function buildVolatilityTermStructureOption(
  closePrices: number[],
  echarts: SidebarEChartsRuntime,
  apiTechnicalIndicator?: TechnicalIndicatorEntity | null,
  dataMode: "mock" | "real" = "mock",
): EChartsCoreOption | null {
  const apiValues = readApiVolatilityValues(apiTechnicalIndicator);
  if (dataMode === "real" && !hasApiVolatilityTermStructure(apiTechnicalIndicator)) return null;

  const fallbackTermStructure = getVolatilityTermStructure(closePrices);
  const termStructure: VolatilityTermPoint[] = dataMode === "real"
    ? VOLATILITY_MATURITIES.map((label) => ({ label, value: apiValues[label] }))
    : fallbackTermStructure.map((row) => ({
      label: row.label as VolatilityMaturity,
      value: Number.isFinite(row.value) ? row.value : null,
    }));

  return {
    backgroundColor: "transparent",
    animation: true,
    grid: { top: 20, right: 10, bottom: 25, left: 10, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1e222d",
      borderColor: "#363a45",
      textStyle: { color: "#d1d4dc", fontSize: 11 },
      formatter: (params: { name: string; value: number | null }[]) => {
        const point = params[0];
        const value = typeof point.value === "number" ? `${point.value}%` : "N/A";
        return `<div style="font-weight:700;margin-bottom:4px">${escapeSidebarTooltipText(point.name)} Maturity</div><div style="color:#818cf8">HV: ${value}</div>`;
      },
    },
    xAxis: { type: "category", data: termStructure.map((row: { label: string }) => row.label), axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } }, axisLabel: { color: "#94a3b8", fontSize: 10, interval: 0 }, axisTick: { show: false } },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", fontSize: 10, formatter: (value: number) => `${value.toFixed(0)}%` },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
      min: (value: { min: number }) => Math.max(0, Math.floor(value.min - 5)),
      max: (value: { max: number }) => Math.ceil(value.max + 5),
    },
    series: [{
      data: termStructure.map((row) => row.value),
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      itemStyle: { color: "#818cf8", borderWidth: 2, borderColor: "#1e222d" },
      lineStyle: { width: 3, color: "#818cf8", shadowBlur: 10, shadowColor: "rgba(129, 140, 248, 0.5)" },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(129, 140, 248, 0.2)" }, { offset: 1, color: "rgba(129, 140, 248, 0)" }]) },
    }],
  };
}

export function buildVolatilityCurveOption(
  closePrices: number[],
  echarts: SidebarEChartsRuntime,
): EChartsCoreOption | null {
  const skewData = getVolatilitySkew(closePrices, 28);
  if (skewData.length === 0) return null;

  return {
    backgroundColor: "transparent",
    animation: true,
    grid: { top: 20, right: 10, bottom: 40, left: 10, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1e222d",
      borderColor: "#363a45",
      textStyle: { color: "#d1d4dc", fontSize: 11 },
      formatter: (params: { name: string; value: number }[]) => {
        const point = params[0];
        return `<div style="font-weight:700;margin-bottom:4px">Price: ${escapeSidebarTooltipText(point.name)}</div><div style="color:#6366f1">Vol: ${point.value.toFixed(2)}%</div>`;
      },
    },
    xAxis: {
      type: "category",
      data: skewData.map((row: { price: number }) => row.price.toString()),
      axisLine: { lineStyle: { color: "rgba(255,255,255,0.1)" } },
      axisLabel: { color: "#94a3b8", fontSize: 10, interval: Math.floor(skewData.length / 4), formatter: (value: string) => Math.round(parseFloat(value)).toString() },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      position: "right",
      axisLabel: { color: "#94a3b8", fontSize: 10, formatter: (value: number) => `${value.toFixed(2)}%` },
      splitLine: { lineStyle: { color: "rgba(255,255,255,0.05)" } },
      min: (value: { min: number }) => Math.max(0, Math.floor(value.min - 5)),
      max: (value: { max: number }) => Math.ceil(value.max + 5),
    },
    series: [{
      data: skewData.map((row: { value: number }) => row.value),
      type: "line",
      smooth: true,
      symbol: "none",
      lineStyle: { width: 4, color: "#8b5cf6", shadowBlur: 15, shadowColor: "rgba(139, 92, 246, 0.6)" },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "rgba(139, 92, 246, 0.15)" }, { offset: 1, color: "rgba(139, 92, 246, 0)" }]) },
    }],
  };
}
