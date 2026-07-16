import type React from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import type { BRVMFundamentals } from "../data/sidebarFundamentals";
import type { IncomeViewMode, SidebarFinancialMetrics } from "../TechnicalAnalysisSidebar.types";
import { buildBenefitsChartOption, buildDividendsChartOption } from "../charts/sidebarFundamentalsChartOptions";
import { buildIncomeChartOption } from "../charts/sidebarIncomeChartOptions";
import { buildSeasonalityChartOption } from "../charts/sidebarSeasonalityChartOptions";
import { buildVolatilityCurveOption, buildVolatilityTermStructureOption } from "../charts/sidebarVolatilityChartOptions";
import { useSidebarChart } from "../charts/useSidebarChart";

interface SidebarChartRefs {
  benefitsChartRef: React.RefObject<HTMLDivElement | null>;
  dividendsChartRef: React.RefObject<HTMLDivElement | null>;
  incomeChartRef: React.RefObject<HTMLDivElement | null>;
  seasonalChartRef: React.RefObject<HTMLDivElement | null>;
  volatilityChartRef: React.RefObject<HTMLDivElement | null>;
  volatilityCurveChartRef: React.RefObject<HTMLDivElement | null>;
}

interface UseSidebarChartsInput extends SidebarChartRefs {
  canRenderIncomeStatement: boolean;
  chartData: ChartDataPoint[];
  dataMode: "mock" | "real";
  financialMetrics: SidebarFinancialMetrics;
  hasVerifiedDividends: boolean;
  hasVerifiedEarnings: boolean;
  incomeViewMode: IncomeViewMode;
  isChartRuntimeReady: boolean;
  isFundamentalsPanelLoading: boolean;
  isLoading: boolean;
  normalizedSecurityTicker: string;
  sidebarChartMountKey: string;
  seasonalYears: number[];
  validFundamentals: BRVMFundamentals | null;
}

export function useSidebarCharts(input: UseSidebarChartsInput): void {
  const {
    benefitsChartRef,
    canRenderIncomeStatement,
    chartData,
    dataMode,
    dividendsChartRef,
    financialMetrics,
    hasVerifiedDividends,
    hasVerifiedEarnings,
    incomeChartRef,
    incomeViewMode,
    isChartRuntimeReady,
    isFundamentalsPanelLoading,
    isLoading,
    normalizedSecurityTicker,
    sidebarChartMountKey,
    seasonalChartRef,
    seasonalYears,
    validFundamentals,
    volatilityChartRef,
    volatilityCurveChartRef,
  } = input;

  useSidebarChart({
    chartRef: benefitsChartRef,
    enabled: isChartRuntimeReady && !isFundamentalsPanelLoading && hasVerifiedEarnings,
    dependencies: [sidebarChartMountKey, isChartRuntimeReady, dataMode, hasVerifiedEarnings, isFundamentalsPanelLoading, validFundamentals],
    render: () => buildBenefitsChartOption(dataMode, validFundamentals),
  });

  useSidebarChart({
    chartRef: dividendsChartRef,
    enabled: isChartRuntimeReady && !isFundamentalsPanelLoading && hasVerifiedDividends,
    dependencies: [sidebarChartMountKey, isChartRuntimeReady, financialMetrics, hasVerifiedDividends, isFundamentalsPanelLoading],
    render: () => buildDividendsChartOption(financialMetrics),
  });

  useSidebarChart({
    chartRef: incomeChartRef,
    enabled: isChartRuntimeReady && !isFundamentalsPanelLoading && canRenderIncomeStatement,
    dependencies: [sidebarChartMountKey, isChartRuntimeReady, canRenderIncomeStatement, dataMode, incomeViewMode, isFundamentalsPanelLoading, normalizedSecurityTicker, validFundamentals],
    render: (_chart, echarts) => buildIncomeChartOption({ dataMode, echarts, fundamentals: validFundamentals, incomeViewMode, ticker: normalizedSecurityTicker }),
    setOptionOptions: { notMerge: true },
  });

  useSidebarChart({
    chartRef: seasonalChartRef,
    enabled: isChartRuntimeReady && !isLoading && seasonalYears.length > 0,
    dependencies: [sidebarChartMountKey, isChartRuntimeReady, chartData, isLoading, seasonalYears],
    render: () => buildSeasonalityChartOption(chartData, seasonalYears),
  });

  useSidebarChart({
    chartRef: volatilityChartRef,
    enabled: isChartRuntimeReady && chartData.length >= 5 && !isLoading,
    dependencies: [sidebarChartMountKey, isChartRuntimeReady, chartData, isLoading],
    render: (_chart, echarts) => buildVolatilityTermStructureOption(chartData.map((point) => point.close), echarts),
  });

  useSidebarChart({
    chartRef: volatilityCurveChartRef,
    enabled: isChartRuntimeReady && chartData.length >= 28 && !isLoading,
    dependencies: [sidebarChartMountKey, isChartRuntimeReady, chartData, isLoading],
    render: (_chart, echarts) => buildVolatilityCurveOption(chartData.map((point) => point.close), echarts),
  });
}
