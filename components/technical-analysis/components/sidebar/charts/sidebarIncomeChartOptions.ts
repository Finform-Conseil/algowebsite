import type { EChartsCoreOption } from "echarts/core";
import type { BRVMFundamentals } from "../data/sidebarFundamentals";
import type { IncomeViewMode } from "../TechnicalAnalysisSidebar.types";
import type { SidebarEChartsRuntime } from "./sidebarEChartsRuntime";
import { escapeSidebarTooltipText } from "./sidebarChartOptions";

export function buildIncomeChartOption({
  dataMode,
  echarts,
  fundamentals,
  incomeViewMode,
  ticker,
}: {
  dataMode: "mock" | "real";
  echarts: SidebarEChartsRuntime;
  fundamentals: BRVMFundamentals | null;
  incomeViewMode: IncomeViewMode;
  ticker: string;
}): EChartsCoreOption {
  const hash = (ticker || "BOAB").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  let revenuesData: number[] = [];
  let earningsData: number[] = [];
  let labels: string[] = [];
  let hasFinancials = true;

  if (dataMode === "real" && fundamentals) {
    const revs = fundamentals.revenues || [];
    const erns = fundamentals.earnings || [];
    hasFinancials = revs.length > 0 || erns.length > 0;
    if (hasFinancials) {
      labels = Array.from(new Set([...revs.map((row) => row.year), ...erns.map((row) => row.year)]))
        .filter((year) => year.length === 4)
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      revenuesData = labels.map((year) => revs.find((row) => row.year === year)?.value || 0);
      earningsData = labels.map((year) => erns.find((row) => row.year === year)?.value || 0);
    }
  } else {
    labels = incomeViewMode === "annual" ? ["2021", "2022", "2023", "2024", "2025"] : ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26"];
    revenuesData = labels.map((_, index) => 120 + (hash % 50) + index * 10 + Math.sin(hash + index) * 5);
    earningsData = revenuesData.map((revenue) => revenue * (0.15 + (hash % 15) / 100));
  }

  const margins = earningsData.map((earning, index) => revenuesData[index] > 0 ? (earning / revenuesData[index]) * 100 : 0);

  return {
    backgroundColor: "transparent",
    title: !hasFinancials && dataMode === "real" ? {
      text: "(Estimation Secteur)",
      right: 0,
      top: 0,
      textStyle: { color: "#94a3b8", fontSize: 10, fontStyle: "italic", fontWeight: "normal" },
    } : undefined,
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow", shadowStyle: { color: "rgba(255,255,255,0.03)" } },
      backgroundColor: "#1e222d",
      borderColor: "#363a45",
      borderWidth: 1,
      padding: [10, 14],
      borderRadius: 6,
      textStyle: { color: "#d1d4dc", fontSize: 12, fontFamily: "Inter, sans-serif" },
      formatter: (params: unknown) => {
        const rows = (Array.isArray(params) ? params : [params]) as { name: string; seriesType: string; value: number; color: string; seriesName: string }[];
        let html = `<div style="font-weight:700;margin-bottom:8px;color:#fff;font-size:13px;border-bottom:1px solid #363a45;padding-bottom:6px;">${escapeSidebarTooltipText(rows[0]?.name)}</div>`;
        rows.forEach((row) => {
          const symbol = row.seriesType === "line" ? "○" : "●";
          const value = row.seriesType === "line"
            ? `<span style="color:#ff9800;">${row.value.toFixed(1)}%</span>`
            : `<span style="color:#fff;">${row.value.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} M</span>`;
          html += `<div style="display:flex;justify-content:space-between;gap:20px;align-items:center;margin-bottom:4px;">
            <span style="color:#94a3b8;font-size:11px;"><span style="color:${row.color};margin-right:6px;">${symbol}</span>${escapeSidebarTooltipText(row.seriesName)}</span>
            <span style="font-weight:600;font-size:11px;">${value}</span>
          </div>`;
        });
        return html;
      },
    },
    grid: { top: 20, left: 0, right: 0, bottom: 25, containLabel: false },
    xAxis: { type: "category", data: labels, axisLabel: { color: "#787b86", fontSize: 10, margin: 12, fontWeight: 500 }, axisTick: { show: false }, axisLine: { lineStyle: { color: "#2a2e39", width: 1 } } },
    yAxis: [{ type: "value", show: false }, { type: "value", show: false, min: 0 }],
    series: [
      {
        name: "Revenue",
        type: "bar",
        barWidth: "22%",
        data: revenuesData,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "#3d7eff" }, { offset: 1, color: "#2962ff" }]), borderRadius: [3, 3, 0, 0] },
      },
      {
        name: "Net income",
        type: "bar",
        barWidth: "22%",
        data: earningsData,
        itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: "#00e5ff" }, { offset: 1, color: "#00bcd4" }]), borderRadius: [3, 3, 0, 0] },
      },
      { name: "Net margin %", type: "line", yAxisIndex: 1, data: margins, symbol: "circle", symbolSize: 8, showSymbol: true, itemStyle: { color: "#ff9800", borderColor: "#1e222d", borderWidth: 2 }, lineStyle: { width: 3, color: "#ff9800" } },
    ],
  };
}
