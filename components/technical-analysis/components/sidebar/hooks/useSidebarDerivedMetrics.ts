import { useMemo } from "react";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
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

interface UseSidebarDerivedMetricsInput {
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

const getClosePrice = (point: ChartDataPoint | undefined) => (
  point && Number.isFinite(point.close) ? point.close : null
);

const calculateLatestSmaValue = (data: ChartDataPoint[], period: number): number | null => {
  if (data.length < period) return null;
  let sum = 0;
  for (let index = data.length - period; index < data.length; index += 1) {
    const close = getClosePrice(data[index]);
    if (close === null) return null;
    sum += close;
  }
  return parseFloat((sum / period).toFixed(2));
};

const calculateLatestRsiValue = (data: ChartDataPoint[], period: number): number | null => {
  if (data.length <= period) return null;
  let avgGain = 0;
  let avgLoss = 0;

  for (let index = 1; index <= period; index += 1) {
    const currentClose = getClosePrice(data[index]);
    const previousClose = getClosePrice(data[index - 1]);
    if (currentClose === null || previousClose === null) return null;
    const diff = currentClose - previousClose;
    if (diff >= 0) avgGain += diff;
    else avgLoss -= diff;
  }

  avgGain /= period;
  avgLoss /= period;
  let latestRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let index = period + 1; index < data.length; index += 1) {
    const currentClose = getClosePrice(data[index]);
    const previousClose = getClosePrice(data[index - 1]);
    if (currentClose === null || previousClose === null) return null;
    const diff = currentClose - previousClose;
    avgGain = (avgGain * (period - 1) + (diff >= 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;
    latestRsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return parseFloat(latestRsi.toFixed(2));
};

export function useSidebarDerivedMetrics(input: UseSidebarDerivedMetricsInput) {
  const {
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
    ? "/api/market-data/brvm-fundamentals -> " + formatProvenanceLabel(fundamentalsProvenance)
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
      { label: "1W", value: getPerformance(7) },
      { label: "1M", value: getPerformance(30) },
      { label: "3M", value: getPerformance(90) },
      { label: "6M", value: getPerformance(180) },
      { label: "YTD", value: displayReturnYTD ?? null },
      { label: "1Y", value: getPerformance(365) },
    ];
  }, [chartData, displayReturnYTD, lastUpdate, livePrice]);

  const seasonalYears = useMemo(() => Array.from(new Set(chartData
    .map((point) => new Date(point.time).getFullYear())
    .filter((year) => Number.isInteger(year) && year >= 1900)))
    .sort((a, b) => b - a)
    .slice(0, 3), [chartData]);

  const technicalData = useMemo<SidebarTechnicalData | null>(() => {
    if (!isSecondaryWorkReady || chartData.length < 50) return null;
    const latestPrice = livePrice || chartData[chartData.length - 1].close;
    const rsi = calculateLatestRsiValue(chartData, 14);
    const sma20 = calculateLatestSmaValue(chartData, 20);
    const sma50 = calculateLatestSmaValue(chartData, 50);
    if (rsi === null || sma20 === null || sma50 === null || sma50 <= 0 || sma20 <= 0) return null;

    const rsiScore = Math.max(0, Math.min(100, (rsi - 30) * 2.5));
    const trendScore = Math.max(0, Math.min(100, 50 + ((sma20 - sma50) / sma50) * 500));
    const priceScore = Math.max(0, Math.min(100, 50 + ((latestPrice - sma20) / sma20) * 1000));
    const score = Math.max(0, Math.min(100, rsiScore * 0.4 + trendScore * 0.3 + priceScore * 0.3));
    const sentiment = score < 25 ? "Strong sell" : score < 45 ? "Sell" : score < 55 ? "Neutral" : score < 75 ? "Buy" : "Strong buy";

    return { rsi, score, sentiment, sma20, sma50 };
  }, [chartData, isSecondaryWorkReady, livePrice]);

  const analystData = useMemo<SidebarAnalystData | null>(() => {
    if (!isSecondaryWorkReady || !technicalData) return null;
    if (dataMode === "real" && (!validFundamentals || validFundamentals.dividends.length === 0)) return null;
    const latestPrice = livePrice || chartData.at(-1)?.close || 0;
    const verifiedPe = Number.isFinite(displayPeRatio) ? displayPeRatio : (Number.isFinite(security.peRatio) ? security.peRatio : null);
    if (dataMode === "real" && verifiedPe === null) return null;

    const pe = verifiedPe ?? 15;
    const lastDiv = validFundamentals?.dividends.at(-1)?.value ?? 0;
    const peScore = Math.max(0, Math.min(100, 50 + (15 - pe) * 5));
    const divScore = Math.max(0, Math.min(100, (latestPrice > 0 ? (lastDiv / latestPrice) * 100 : 0) * 8.33));
    const score = Math.min(100, Math.max(0, technicalData.score * 0.3 + peScore * 0.3 + divScore * 0.4));
    const lastNetIncome = validFundamentals?.earnings.at(-1)?.value ?? null;
    const sharesMillions = displayMarketCap && latestPrice > 0 ? displayMarketCap / latestPrice : null;
    const eps = lastNetIncome !== null && sharesMillions && sharesMillions > 0 ? lastNetIncome / sharesMillions : null;
    if (dataMode === "real" && eps === null) return null;

    const priceTarget = eps !== null ? parseFloat((eps * Math.min(pe * 1.1, 20)).toFixed(2)) : parseFloat((technicalData.sma50 * (1 + (score - 50) / 200)).toFixed(2));
    const targetFormula = eps !== null ? "EPS x min(P/E x 1.1, 20)" : "SMA50 fallback mock";
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
