import { useMemo } from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import type { PriceIndicatorEntity, TechnicalIndicatorEntity } from "@/core/domain/entities/cours.entity";
import type { DisplaySecurity } from "../../../config/market/marketSnapshotTypes";
import {
  formatAuditDate,
  formatMillionsFcfa,
  getLatestFinancialYear,
  getLatestFundamentalValue,
  getLatestSeriesTime,
} from "../data/sidebarDataTypes";
import type { AuditTrailItem } from "../data/sidebarDataTypes";
import type { BRVMFundamentals } from "../data/sidebarFundamentals";
import { createSyntheticMockProvenance, createUnavailableProvenance, formatProvenanceLabel } from "../data/sidebarProvenance";
import type { SidebarAnalystData, SidebarFinancialMetrics, SidebarTechnicalData } from "../TechnicalAnalysisSidebar.types";
import { calculateAlertTechnicalSnapshot } from "../panels/alertsRail/alertsRailIndicatorMetrics";

interface UseSidebarDerivedMetricsInput {
  apiPriceMetric?: PriceIndicatorEntity | null;
  apiTechnicalIndicator?: TechnicalIndicatorEntity | null;
  chartData: ChartDataPoint[];
  dataMode: "mock" | "real";
  displayMarketCap: number;
  displayPeRatio: number;
  displayReturnYTD: number;
  isSecondaryWorkReady: boolean;
  lastUpdate?: string;
  livePrice: number;
  marketSourceLabel?: string;
  marketSourceStatus?: "live" | "fallback" | "derived";
  normalizedSecurityTicker: string;
  security: DisplaySecurity;
  validFundamentals: BRVMFundamentals | null;
}

export function useSidebarDerivedMetrics(input: UseSidebarDerivedMetricsInput) {
  const {
    apiPriceMetric,
    apiTechnicalIndicator,
    chartData,
    dataMode,
    displayMarketCap,
    displayPeRatio,
    displayReturnYTD,
    isSecondaryWorkReady,
    lastUpdate,
    livePrice,
    marketSourceLabel,
    marketSourceStatus,
    normalizedSecurityTicker,
    security,
    validFundamentals,
  } = input;

  const latestRevenueT12M = getLatestFundamentalValue(validFundamentals?.revenues);
  const displayRevenueT12M = latestRevenueT12M !== null
    ? formatMillionsFcfa(latestRevenueT12M)
    : (dataMode !== "real" && Number.isFinite(security.revenueT12M) ? `${security.revenueT12M.toFixed(2).replace(".", ",")} %` : "N/D");
  const latestSeriesTime = getLatestSeriesTime(chartData);
  const marketAuditDate = formatAuditDate(lastUpdate || latestSeriesTime);
  const fundamentalsAuditYear = getLatestFinancialYear(validFundamentals);
  const auditCurrency = security.currency || "XOF";
  const marketDataSource = dataMode === "real" ? marketSourceLabel || "Daily CSV" : formatProvenanceLabel(createSyntheticMockProvenance("Mock dataset"));
  const fundamentalsProvenance = dataMode === "real"
    ? validFundamentals?.provenance ?? createUnavailableProvenance("Fondamentaux indisponibles")
    : createSyntheticMockProvenance("Mock/catalog");
  const fundamentalsSource = dataMode === "real"
    ? "API /results/ + /dividends/ -> " + formatProvenanceLabel(fundamentalsProvenance)
    : formatProvenanceLabel(fundamentalsProvenance);
  const auditTone: AuditTrailItem["tone"] = dataMode === "real" && marketSourceStatus === "live" ? "success" : "warning";
  const fundamentalsAuditTone: AuditTrailItem["tone"] = fundamentalsProvenance.tone;
  const combinedAuditTone: AuditTrailItem["tone"] = auditTone === "success" && fundamentalsAuditTone === "success" ? "success" : "warning";

  const financialMetrics = useMemo<SidebarFinancialMetrics>(() => {
    const ticker = security.ticker || "BOAB";
    const hash = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let payoutRatio = 0;
    let hasValidPayout = false;
    let calculatedYield = 0;
    let hasValidYield = false;

    if (dataMode === "real") {
      const lastDiv = validFundamentals?.dividends.at(-1);
      if (lastDiv?.value && livePrice > 0) {
        calculatedYield = (lastDiv.value / livePrice) * 100;
        hasValidYield = true;
      }
      const matchingEarning = validFundamentals?.earnings.find((earning) => earning.year === lastDiv?.year);
      const shares = displayMarketCap && livePrice > 0 ? displayMarketCap / livePrice : 1;
      if (lastDiv?.value && matchingEarning?.value && matchingEarning.value > 0) {
        payoutRatio = Math.min(100, Math.max(0, (lastDiv.value / (matchingEarning.value / shares)) * 100));
        hasValidPayout = true;
      }
    } else {
      payoutRatio = parseFloat((30 + (hash % 40) + Math.sin(hash) * 5).toFixed(2));
      calculatedYield = parseFloat((4 + (hash % 6)).toFixed(2));
      hasValidPayout = true;
      hasValidYield = true;
    }

    return { calculatedYield, hasValidPayout, hasValidYield, payoutRatio };
  }, [dataMode, displayMarketCap, livePrice, security.ticker, validFundamentals]);

  const performanceRows = useMemo(() => {
    const apiValue = (value: number | null | undefined): number | null => typeof value === "number" && Number.isFinite(value) ? value : null;
    const referenceTime = lastUpdate ? new Date(lastUpdate).getTime() : (chartData.at(-1) ? new Date(chartData.at(-1)!.time).getTime() : 0);
    const getPerformance = (daysOffset: number) => {
      if (chartData.length < 2 || referenceTime <= 0) return null;
      const currentPrice = livePrice || chartData[chartData.length - 1].close;
      const targetDate = new Date(referenceTime - daysOffset * 24 * 60 * 60 * 1000);
      const historicalPoint = [...chartData].reverse().find((point) => new Date(point.time) <= targetDate);
      if (!historicalPoint || historicalPoint.close === 0) return null;
      return ((currentPrice - historicalPoint.close) / historicalPoint.close) * 100;
    };

    return [
      { label: "1W", value: apiValue(apiPriceMetric?.total_return_1w_pct ?? apiPriceMetric?.change_1w_pct) ?? getPerformance(7) },
      { label: "1M", value: apiValue(apiPriceMetric?.total_return_1m_pct ?? apiPriceMetric?.change_1m_pct) ?? getPerformance(30) },
      { label: "3M", value: apiValue(apiPriceMetric?.total_return_3m_pct ?? apiPriceMetric?.change_3m_pct) ?? getPerformance(90) },
      { label: "6M", value: apiValue(apiPriceMetric?.total_return_6m_pct ?? apiPriceMetric?.change_6m_pct) ?? getPerformance(180) },
      { label: "YTD", value: apiValue(apiPriceMetric?.total_return_ytd_pct ?? apiPriceMetric?.change_ytd_pct) ?? displayReturnYTD ?? null },
      { label: "1Y", value: apiValue(apiPriceMetric?.total_return_1y_pct ?? apiPriceMetric?.change_1y_pct) ?? getPerformance(365) },
    ];
  }, [apiPriceMetric, chartData, displayReturnYTD, lastUpdate, livePrice]);

  const seasonalYears = useMemo(() => Array.from(new Set(chartData
    .map((point) => new Date(point.time).getFullYear())
    .filter((year) => Number.isInteger(year) && year >= 1900)))
    .sort((a, b) => b - a)
    .slice(0, 3), [chartData]);

  const technicalData = useMemo<SidebarTechnicalData | null>(() => {
    if (!isSecondaryWorkReady) return null;
    const apiRsi = apiTechnicalIndicator?.rsi_14;
    const apiSma20 = apiTechnicalIndicator?.sma_20;
    const apiSma50 = apiTechnicalIndicator?.sma_50;
    if ([apiRsi, apiSma20, apiSma50].every((value) => typeof value === "number" && Number.isFinite(value)) && apiSma20! > 0 && apiSma50! > 0) {
      const rsiScore = Math.max(0, Math.min(100, (apiRsi! - 30) * 2.5));
      const trendScore = Math.max(0, Math.min(100, 50 + ((apiSma20! - apiSma50!) / apiSma50!) * 500));
      const price = livePrice > 0 ? livePrice : apiSma20!;
      const priceScore = Math.max(0, Math.min(100, 50 + ((price - apiSma20!) / apiSma20!) * 1000));
      const score = Math.max(0, Math.min(100, rsiScore * 0.4 + trendScore * 0.3 + priceScore * 0.3));
      const sentiment = score < 25 ? "Strong sell" : score < 45 ? "Sell" : score < 55 ? "Neutral" : score < 75 ? "Buy" : "Strong buy";
      return { rsi: apiRsi!, score, sentiment, sma20: apiSma20!, sma50: apiSma50! };
    }
    return calculateAlertTechnicalSnapshot(chartData, livePrice);
  }, [apiTechnicalIndicator, chartData, isSecondaryWorkReady, livePrice]);

  const analystData = useMemo<SidebarAnalystData | null>(() => {
    if (!isSecondaryWorkReady || !technicalData) return null;
    const latestPrice = livePrice || chartData.at(-1)?.close || 0;
    const verifiedPe = Number.isFinite(displayPeRatio) ? displayPeRatio : (Number.isFinite(security.peRatio) ? security.peRatio : null);
    if (verifiedPe === null) return null;

    const pe = verifiedPe;
    const lastDiv = validFundamentals?.dividends.at(-1)?.value ?? 0;
    const hasVerifiedDividend = dataMode !== "real" || Boolean(validFundamentals?.dividends.length);
    const peScore = Math.max(0, Math.min(100, 50 + (15 - pe) * 5));
    const divScore = Math.max(0, Math.min(100, (latestPrice > 0 ? (lastDiv / latestPrice) * 100 : 0) * 8.33));
    const score = hasVerifiedDividend
      ? Math.min(100, Math.max(0, technicalData.score * 0.3 + peScore * 0.3 + divScore * 0.4))
      : Math.min(100, Math.max(0, technicalData.score * 0.6 + peScore * 0.4));

    const lastNetIncome = validFundamentals?.earnings.at(-1)?.value ?? null;
    const sharesMillions = displayMarketCap && latestPrice > 0 ? displayMarketCap / latestPrice : null;
    const eps = lastNetIncome !== null && sharesMillions && sharesMillions > 0 ? lastNetIncome / sharesMillions : null;
    const priceTarget = eps !== null
      ? parseFloat((eps * Math.min(pe * 1.1, 20)).toFixed(2))
      : parseFloat((technicalData.sma50 * (1 + (score - 50) / 200)).toFixed(2));
    const targetFormula = eps !== null ? "EPS x min(P/E x 1.1, 20)" : "SMA50 fallback; fondamentaux BRVM indisponibles";
    const label = score < 25 ? "Strong sell" : score < 45 ? "Sell" : score < 55 ? "Neutral" : score < 75 ? "Buy" : "Strong buy";

    return { label, pctChange: latestPrice > 0 ? ((priceTarget - latestPrice) / latestPrice) * 100 : 0, priceTarget, score, targetFormula };
  }, [chartData, dataMode, displayMarketCap, displayPeRatio, isSecondaryWorkReady, livePrice, security.peRatio, technicalData, validFundamentals]);


  return {
    analystData,
    auditCurrency,
    auditTone,
    combinedAuditTone,
    displayRevenueT12M,
    financialMetrics,
    fundamentalsAuditTone,
    fundamentalsAuditYear,
    fundamentalsSource,
    marketAuditDate,
    marketDataSource,
    performanceRows,
    seasonalYears,
    technicalData,
    canRenderIncomeStatement: (dataMode !== "real" || Boolean(validFundamentals?.revenues.length && validFundamentals?.earnings.length)),
    hasVerifiedDividends: dataMode !== "real" || Boolean(validFundamentals?.dividends.length),
    hasVerifiedEarnings: dataMode !== "real" || Boolean(validFundamentals?.earnings.length),
  };
}
