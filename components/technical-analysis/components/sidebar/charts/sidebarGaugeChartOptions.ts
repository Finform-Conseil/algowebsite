import type { EChartsCoreOption } from "echarts/core";
import type { SidebarAnalystData, SidebarTechnicalData } from "../TechnicalAnalysisSidebar.types";

const gaugeAxisLabel = (value: number) => {
  if (value === 10) return "Strong sell";
  if (value === 30) return "Sell";
  if (value === 50) return "Neutral";
  if (value === 70) return "Buy";
  if (value === 90) return "Strong buy";
  return "";
};

const buildGaugeOption = (
  score: number,
  detailLabel: string,
  colorStops: [number, string][],
): EChartsCoreOption => ({
  series: [{
    type: "gauge",
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    radius: "68%",
    center: ["50%", "65%"],
    axisLine: { lineStyle: { width: 8, color: colorStops, shadowBlur: 10, shadowColor: "rgba(0,0,0,0.3)" } },
    pointer: { length: "75%", width: 3, offsetCenter: [0, "5%"], itemStyle: { color: "#d1d4dc", shadowBlur: 5, shadowColor: "rgba(0,0,0,0.5)" } },
    anchor: { show: true, showAbove: true, size: 10, itemStyle: { color: "#d1d4dc", borderWidth: 2, borderColor: "#1e222d" } },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: true, distance: -70, color: "#94a3b8", fontSize: 10, fontWeight: 500, formatter: gaugeAxisLabel },
    detail: { offsetCenter: [0, "65%"], formatter: () => detailLabel, color: "#f1f5f9", fontSize: 18, fontWeight: 800, textShadowBlur: 5, textShadowColor: "rgba(0,0,0,0.5)" },
    data: [{ value: score }],
  }],
});

export function buildAnalystGaugeOption(data: SidebarAnalystData): EChartsCoreOption {
  const score = data.score;
  return buildGaugeOption(data.score, data.label, [
    [0.25, score < 25 ? "#f23645" : "#2a2e39"],
    [0.45, score >= 25 && score < 45 ? "#ff9800" : "#2a2e39"],
    [0.55, score >= 45 && score < 55 ? "#d4af37" : "#2a2e39"],
    [0.75, score >= 55 && score < 75 ? "#22ab94" : "#2a2e39"],
    [1, score >= 75 ? "#00c853" : "#2a2e39"],
  ]);
}

export function buildTechnicalsGaugeOption(data: SidebarTechnicalData): EChartsCoreOption {
  const score = data.score;
  const label = data.sentiment === "Strong buy" ? "Buy" : data.sentiment === "Strong sell" ? "Sell" : data.sentiment;
  return buildGaugeOption(score, label, [
    [0.2, score < 25 ? "#f23645" : "#2a2e39"],
    [0.4, score >= 25 && score < 45 ? "#ff5252" : "#2a2e39"],
    [0.5, score >= 45 && score < 55 ? "#94a3b8" : "#2a2e39"],
    [0.6, score >= 45 && score < 55 ? "#94a3b8" : "#2a2e39"],
    [0.8, score >= 55 && score < 75 ? "#22ab94" : "#2a2e39"],
    [1, score >= 75 ? "#00c853" : "#2a2e39"],
  ]);
}
