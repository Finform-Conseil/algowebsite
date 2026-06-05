import type { EChartsCoreOption } from "echarts/core";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import { escapeSidebarTooltipText } from "./sidebarChartOptions";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const COLORS = ["#2962ff", "#089981", "#f57c00"];

export function buildSeasonalityChartOption(chartData: ChartDataPoint[], years: number[]): EChartsCoreOption {
  const seasonalSeries = years.map((year, index) => {
    const yearData = chartData.filter((point) => new Date(point.time).getFullYear() === year);
    if (yearData.length === 0) return { name: year.toString(), type: "line" as const, data: [] };

    const startPrice = yearData[0].close;
    const cumulativeData = yearData.map((point) => ({
      date: new Date(point.time),
      value: ((point.close - startPrice) / startPrice) * 100,
    }));
    const monthlyData = MONTHS.map((_, monthIndex) => cumulativeData.find((point) => point.date.getMonth() === monthIndex)?.value ?? null);
    let lastValid = 0;

    return {
      name: year.toString(),
      type: "line" as const,
      data: monthlyData.map((value) => {
        if (value !== null) lastValid = value;
        return lastValid;
      }),
      smooth: true,
      showSymbol: false,
      lineStyle: { width: index === 0 ? 3 : 1.5, color: COLORS[index] },
      itemStyle: { color: COLORS[index] },
    };
  });

  return {
    backgroundColor: "transparent",
    animation: true,
    tooltip: {
      trigger: "axis",
      backgroundColor: "#1e222d",
      borderColor: "#363a45",
      borderWidth: 1,
      textStyle: { color: "#d1d4dc", fontSize: 11 },
      formatter: (params: unknown) => {
        const rows = (Array.isArray(params) ? params : [params]) as { name: string; color: string; seriesName: string; value: number | null }[];
        let html = `<div style="font-weight:700;margin-bottom:5px;">${escapeSidebarTooltipText(rows[0]?.name)}</div>`;
        rows.forEach((row) => {
          html += `<div style="display:flex;justify-content:space-between;gap:10px;">
            <span><span style="color:${row.color};margin-right:5px;">●</span>${escapeSidebarTooltipText(row.seriesName)}</span>
            <span style="font-weight:600;">${row.value !== null ? row.value.toFixed(2) : "—"}%</span>
          </div>`;
        });
        return html;
      },
    },
    grid: { top: 10, left: 0, right: 0, bottom: 20, containLabel: false },
    xAxis: { type: "category", data: MONTHS, axisLabel: { color: "#787b86", fontSize: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: "#363a45" } }, splitLine: { show: true, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" } } },
    yAxis: { type: "value", show: false, splitLine: { show: true, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: "dashed" } } },
    series: seasonalSeries,
  };
}
