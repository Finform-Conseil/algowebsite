import type { EChartsCoreOption } from "echarts/core";
import type { BRVMFundamentals } from "../data/sidebarFundamentals";
import type { SidebarFinancialMetrics } from "../TechnicalAnalysisSidebar.types";
import { escapeSidebarTooltipText } from "./sidebarChartOptions";

export function buildBenefitsChartOption(
  dataMode: "mock" | "real",
  fundamentals: BRVMFundamentals | null,
): EChartsCoreOption {
  const earningsRows = dataMode === "real"
    ? (fundamentals?.earnings || []).slice(-5)
    : [
        { year: "Q2 '25", value: 1.32, isEstimate: false },
        { year: "Q3 '25", value: 2.1, isEstimate: false },
        { year: "Q4 '25", value: 1.5, isEstimate: false },
        { year: "Q1 '26", value: 0.9, isEstimate: true },
        { year: "Q2 '26", value: 1.8, isEstimate: true },
      ];
  const benefitsData = earningsRows.map((row) => row.value);
  const tooltipUnit = dataMode === "real" ? "M FCFA" : "%";

  return {
    backgroundColor: "transparent",
    title: { text: "Bénéfices", left: 0, top: 0, bottom: 0, textStyle: { color: "#fff", fontWeight: 500, fontSize: 16 } },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: "rgba(30, 41, 59, 0.95)",
      borderColor: "#334155",
      borderWidth: 1,
      padding: [6, 8],
      borderRadius: 4,
      textStyle: { color: "#f1f5f9", fontSize: 10 },
      formatter: (params: unknown) => {
        const data = (Array.isArray(params) ? params[0] : params) as { dataIndex: number; name: string; value: number };
        const isEstimate = Boolean(earningsRows[data.dataIndex]?.isEstimate);
        const formattedValue = dataMode === "real" ? data.value.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) : data.value.toFixed(2);
        return `<div style="display:flex;flex-direction:column;gap:2px;">
          <div style="color:#94a3b8;font-size:9px;">${escapeSidebarTooltipText(data.name)} ${isEstimate ? "(Estimate)" : "(Actual)"}</div>
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
            <span style="font-weight:500;">Bénéfices</span>
            <span style="font-weight:700;color:#10b981;">${formattedValue} ${tooltipUnit}</span>
          </div>
        </div>`;
      },
    },
    grid: { top: 40, right: 35, bottom: 25, left: 5, containLabel: false },
    xAxis: { type: "category", data: earningsRows.map((row) => row.year), axisLabel: { color: "#94a3b8", fontSize: 9, margin: 10 }, axisTick: { show: false }, axisLine: { lineStyle: { color: "#1e293b" } } },
    yAxis: {
      type: "value",
      position: "right",
      axisLabel: { color: "#94a3b8", fontSize: 9, formatter: (value: number) => dataMode === "real" ? value.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : `${value}%` },
      splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } },
    },
    series: [{
      name: "Bénéfices",
      type: "scatter",
      symbolSize: 14,
      data: benefitsData.map((value, index) => ({
        value,
        itemStyle: {
          color: earningsRows[index]?.isEstimate ? "transparent" : (index === 0 || value >= benefitsData[index - 1] ? "#22ab94" : "#f23645"),
          borderColor: earningsRows[index]?.isEstimate ? "#787b86" : "transparent",
          borderWidth: earningsRows[index]?.isEstimate ? 1.5 : 0,
        },
      })),
      emphasis: { scale: 1.2 },
    }],
  };
}

export function buildDividendsChartOption(metrics: SidebarFinancialMetrics): EChartsCoreOption {
  const { payoutRatio, hasValidPayout, calculatedYield, hasValidYield } = metrics;
  const hasAnyValue = hasValidPayout || hasValidYield;
  const displayValue = hasValidPayout ? `${payoutRatio.toFixed(1)}%` : (hasValidYield ? `${calculatedYield.toFixed(2)}%` : "N/A");
  const activeValue = hasValidPayout ? payoutRatio : calculatedYield * 10;

  return {
    backgroundColor: "transparent",
    title: {
      text: displayValue,
      subtext: hasValidPayout ? "Payout" : (hasValidYield ? "Yield" : ""),
      left: "center",
      top: "center",
      textStyle: { color: hasAnyValue ? "#10b981" : "#475569", fontSize: 16, fontWeight: "bold" },
      subtextStyle: { color: "#94a3b8", fontSize: 10 },
    },
    series: [{
      type: "pie",
      radius: ["65%", "85%"],
      silent: true,
      label: { show: false },
      data: [
        { value: hasAnyValue ? activeValue : 0, itemStyle: { color: hasAnyValue ? "#10b981" : "#475569" } },
        { value: hasAnyValue ? 100 - activeValue : 100, itemStyle: { color: "#1e293b" } },
      ],
    }],
  };
}
