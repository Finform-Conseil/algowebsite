import type { EChartsCoreOption } from "echarts/core";
import { getVolatilitySkew, getVolatilityTermStructure } from "@/shared/utils/volatility-engine";
import type { SidebarEChartsRuntime } from "./sidebarEChartsRuntime";
import { escapeSidebarTooltipText } from "./sidebarChartOptions";

export function buildVolatilityTermStructureOption(
  closePrices: number[],
  echarts: SidebarEChartsRuntime,
): EChartsCoreOption {
  const termStructure = getVolatilityTermStructure(closePrices);

  return {
    backgroundColor: "transparent",
    animation: true,
    grid: { top: 20, right: 10, bottom: 25, left: 10, containLabel: true },
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1e222d",
      borderColor: "#363a45",
      textStyle: { color: "#d1d4dc", fontSize: 11 },
      formatter: (params: { name: string; value: number }[]) => {
        const point = params[0];
        return `<div style="font-weight:700;margin-bottom:4px">${escapeSidebarTooltipText(point.name)} Maturity</div><div style="color:#818cf8">HV: ${point.value}%</div>`;
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
      data: termStructure.map((row: { value: number }) => row.value),
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
