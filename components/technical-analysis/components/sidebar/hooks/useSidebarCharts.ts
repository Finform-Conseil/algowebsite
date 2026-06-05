import type React from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import type { BRVMFundamentals } from "../data/sidebarFundamentals";
import type { IncomeViewMode, SidebarAnalystData, SidebarFinancialMetrics, SidebarTechnicalData } from "../TechnicalAnalysisSidebar.types";
import { buildAnalystGaugeOption, buildTechnicalsGaugeOption } from "../charts/sidebarGaugeChartOptions";
import { buildBenefitsChartOption, buildDividendsChartOption } from "../charts/sidebarFundamentalsChartOptions";
import { buildIncomeChartOption } from "../charts/sidebarIncomeChartOptions";
import { buildSeasonalityChartOption } from "../charts/sidebarSeasonalityChartOptions";
import { buildVolatilityCurveOption, buildVolatilityTermStructureOption } from "../charts/sidebarVolatilityChartOptions";
import { useSidebarChart } from "../charts/useSidebarChart";

interface SidebarChartRefs {
  analystRatingChartRef: React.RefObject<HTMLDivElement | null>;
  benefitsChartRef: React.RefObject<HTMLDivElement | null>;
  dividendsChartRef: React.RefObject<HTMLDivElement | null>;
  incomeChartRef: React.RefObject<HTMLDivElement | null>;
  seasonalChartRef: React.RefObject<HTMLDivElement | null>;
  technicalsChartRef: React.RefObject<HTMLDivElement | null>;
  volatilityChartRef: React.RefObject<HTMLDivElement | null>;
  volatilityCurveChartRef: React.RefObject<HTMLDivElement | null>;
}

interface UseSidebarChartsInput extends SidebarChartRefs {
  analystData: SidebarAnalystData | null;
  canRenderIncomeStatement: boolean;
  chartData: ChartDataPoint[];
  dataMode: "mock" | "real";
  financialMetrics: SidebarFinancialMetrics;
  hasVerifiedDividends: boolean;
  hasVerifiedEarnings: boolean;
  incomeViewMode: IncomeViewMode;
  isChartRuntimeReady: boolean;
  isFundamentalsLoading: boolean;
  isFundamentalsPanelLoading: boolean;
  isLoading: boolean;
  normalizedSecurityTicker: string;
  seasonalYears: number[];
  technicalData: SidebarTechnicalData | null;
  validFundamentals: BRVMFundamentals | null;
}

export function useSidebarCharts(input: UseSidebarChartsInput): void {
  const {
    analystData,
    analystRatingChartRef,
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
    isFundamentalsLoading,
    isFundamentalsPanelLoading,
    isLoading,
    normalizedSecurityTicker,
    seasonalChartRef,
    seasonalYears,
    technicalData,
    technicalsChartRef,
    validFundamentals,
    volatilityChartRef,
    volatilityCurveChartRef,
  } = input;

  useSidebarChart({
    chartRef: benefitsChartRef,
    enabled: isChartRuntimeReady && !isFundamentalsPanelLoading && hasVerifiedEarnings,
    dependencies: [isChartRuntimeReady, dataMode, hasVerifiedEarnings, isFundamentalsPanelLoading, validFundamentals],
    render: () => buildBenefitsChartOption(dataMode, validFundamentals),
  });

  useSidebarChart({
    chartRef: dividendsChartRef,
    enabled: isChartRuntimeReady && !isFundamentalsPanelLoading && hasVerifiedDividends,
    dependencies: [isChartRuntimeReady, financialMetrics, hasVerifiedDividends, isFundamentalsPanelLoading],
    render: () => buildDividendsChartOption(financialMetrics),
  });

  useSidebarChart({
    chartRef: incomeChartRef,
    enabled: isChartRuntimeReady && !isFundamentalsPanelLoading && canRenderIncomeStatement,
    dependencies: [isChartRuntimeReady, canRenderIncomeStatement, dataMode, incomeViewMode, isFundamentalsPanelLoading, normalizedSecurityTicker, validFundamentals],
    render: (_chart, echarts) => buildIncomeChartOption({ dataMode, echarts, fundamentals: validFundamentals, incomeViewMode, ticker: normalizedSecurityTicker }),
    setOptionOptions: { notMerge: true },
  });

  useSidebarChart({
    chartRef: seasonalChartRef,
    enabled: isChartRuntimeReady && !isLoading && seasonalYears.length > 0,
    dependencies: [isChartRuntimeReady, chartData, isLoading, seasonalYears],
    render: () => buildSeasonalityChartOption(chartData, seasonalYears),
  });

  useSidebarChart({
    chartRef: analystRatingChartRef,
    enabled: isChartRuntimeReady && Boolean(analystData) && !isLoading && !isFundamentalsLoading,
    dependencies: [isChartRuntimeReady, analystData, isFundamentalsLoading, isLoading],
    render: () => analystData ? buildAnalystGaugeOption(analystData) : null,
  });

  useSidebarChart({
    chartRef: technicalsChartRef,
    enabled: isChartRuntimeReady && Boolean(technicalData) && !isLoading,
    dependencies: [isChartRuntimeReady, technicalData, isLoading],
    render: () => technicalData ? buildTechnicalsGaugeOption(technicalData) : null,
  });

  useSidebarChart({
    chartRef: volatilityChartRef,
    enabled: isChartRuntimeReady && chartData.length >= 5 && !isLoading,
    dependencies: [isChartRuntimeReady, chartData, isLoading],
    render: (_chart, echarts) => buildVolatilityTermStructureOption(chartData.map((point) => point.close), echarts),
  });

  useSidebarChart({
    chartRef: volatilityCurveChartRef,
    enabled: isChartRuntimeReady && chartData.length >= 28 && !isLoading,
    dependencies: [isChartRuntimeReady, chartData, isLoading],
    render: (_chart, echarts) => buildVolatilityCurveOption(chartData.map((point) => point.close), echarts),
  });
}
