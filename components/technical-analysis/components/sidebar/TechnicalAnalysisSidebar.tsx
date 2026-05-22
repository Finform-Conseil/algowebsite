import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import * as echarts from "echarts";
import { GaugeChart, BarChart, LineChart } from "echarts/charts";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { setModalOpen, setSearchMode } from "../../store/technicalAnalysisSlice";
import { ChartDataPoint, calculateRSI, calculateSMA } from "../../lib/Indicators/TechnicalIndicators";
import {
  BRVM_DISPLAY_TIME_ZONE_LABEL,
  formatBrvmDisplayMinute,
  getBrvmMarketStatus,
} from "../../utils/brvmMarketSession";
import { getVolatilityTermStructure, getVolatilitySkew } from "@/shared/utils/volatility-engine";
import {
  createEmptyFundamentals,
  formatAuditDate,
  formatMillionsFcfa,
  getLatestFinancialYear,
  getLatestFundamentalValue,
  getLatestNumericValue,
  getLatestSeriesTime,
  getVerifiedSourceLabel,
  hasFinancialSeries,
  isFundamentalsForTicker,
  normalizeFundamentalsResponse,
  normalizeTicker,
} from "./TechnicalAnalysisSidebar.helpers";

import type { AuditTrailItem, BRVMFundamentals, FundamentalsStatus } from "./TechnicalAnalysisSidebar.helpers";
import type { DisplaySecurity } from "../../config/TechnicalAnalysisTypes";

const DividendHistoryModal = dynamic(
  () => import("./DividendHistoryModal").then((module) => module.DividendHistoryModal),
  {
    ssr: false,
    loading: () => null,
  },
);

interface TechnicalAnalysisSidebarProps {
  sidebarRef: React.RefObject<HTMLElement | null>;
  security: DisplaySecurity;
  chartData: ChartDataPoint[];
  livePrice: number;
  isMarketPositive: boolean;
  liveChange: number;
  liveChangePercent: number;
  lastUpdate?: string;
  liveVolume?: number;
  liveMarketCap?: number;
  liveReturnYTD?: number;
  livePeRatio?: number;
  isLoading?: boolean;
  currentVolume: number;
  avgVolume: number;
  benefitsChartRef: React.RefObject<HTMLDivElement | null>;
  dividendsChartRef: React.RefObject<HTMLDivElement | null>;

  dataMode: "mock" | "real";
  /** [TENOR 2026 FEAT] Object Tree overlay — remplace le contenu par le panneau Object Tree */
  overlayContent?: React.ReactNode;
  isObjectTreeOpen?: boolean;
  onToggleObjectTree?: () => void;
  openTickerSelector?: () => void;
}

interface BRVMNewsItem {
  title: string;
  date: string;
  link: string;
}

type IncomeViewMode = "annual" | "quarterly";

const FALLBACK_NEWS_ITEM: BRVMNewsItem = {
  title: "BRVM : Forte croissance des volumes en ce debut d'annee 2026",
  date: "aujourd'hui",
  link: "#",
};

const HIDDEN_AUDIT_LABELS = new Set(["Source", "Formule"]);

const SidebarUnavailableState = ({ message }: { message: string }) => (
  <div
    className="d-flex align-items-center justify-content-center text-center px-3 py-4"
    style={{ minHeight: "120px", color: "#94a3b8", fontSize: "11px", lineHeight: 1.45 }}
  >
    <span>
      <i className="bi bi-shield-exclamation me-1" style={{ color: "#f59e0b" }}></i>
      {message}
    </span>
  </div>
);

const SidebarAuditTrail = ({ items }: { items: AuditTrailItem[] }) => (
  <div
    className="d-flex flex-wrap align-items-center"
    style={{
      gap: "4px",
      width: "100%",
      justifyContent: "center",
      marginTop: "8px",
      marginBottom: "10px",
      paddingTop: "7px",
      borderTop: "1px solid rgba(42, 46, 57, 0.45)",
    }}
  >
    {items.map((item) => {
      const color = item.tone === "warning" ? "#f59e0b" : item.tone === "success" ? "#22ab94" : "#94a3b8";
      const isHiddenAuditItem = HIDDEN_AUDIT_LABELS.has(item.label);
      return (
        <span
          key={`${item.label}-${item.value}`}
          data-audit-hidden={isHiddenAuditItem ? "true" : undefined}
          title={`${item.label}: ${item.value}`}
          style={{
            display: isHiddenAuditItem ? "none" : "inline-flex",
            alignItems: "center",
            gap: "3px",
            maxWidth: "100%",
            padding: "2px 6px",
            borderRadius: "4px",
            background: "rgba(15, 23, 42, 0.55)",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            color,
            fontSize: "9.5px",
            lineHeight: 1.25,
            fontWeight: 600,
          }}
        >
          <span style={{ color: "#64748b", textTransform: "uppercase" }}>{item.label}</span>
          <span>{item.value}</span>
        </span>
      );
    })}
  </div>
);

interface BRVMIndexData {
  symbol: string;
  name: string;
  price: number;
  variation: string;
  timestamp: string;
}

export const TechnicalAnalysisSidebar: React.FC<
  TechnicalAnalysisSidebarProps
> = ({
  sidebarRef,
  security,
  livePrice,
  isMarketPositive,
  liveChange,
  liveChangePercent,
  lastUpdate,
  liveVolume,
  liveMarketCap,
  liveReturnYTD,
  livePeRatio,
  currentVolume,
  avgVolume,
  benefitsChartRef,
  dividendsChartRef,
  isLoading,
  dataMode,
  chartData,
  overlayContent,
  isObjectTreeOpen,
  onToggleObjectTree,
  openTickerSelector,
}) => {
  // [TENOR 2026] Register ECharts components
  try {
    (echarts.use as (ext: unknown[]) => void)([GaugeChart, BarChart, LineChart]);
  } catch {
    // Ignore if already registered
  }

  const displayReturnYTD = liveReturnYTD !== undefined ? liveReturnYTD : security.returnYTD;
  const displayPeRatio = livePeRatio !== undefined ? livePeRatio : security.peRatio;
  const displayMarketCap = liveMarketCap !== undefined ? liveMarketCap : security.marketCap;
  const normalizedSecurityTicker = normalizeTicker(security.ticker);

  // [TENOR 2026] NEWS FEED LOGIC (Carousel + Hover Pause)
  const [news, setNews] = useState<BRVMNewsItem[]>([]);
  const [currentNewsIdx, setCurrentNewsIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const [fundamentals, setFundamentals] = useState<BRVMFundamentals | null>(null);
  const [fundamentalsStatus, setFundamentalsStatus] = useState<FundamentalsStatus>(
    dataMode === "real" ? "loading" : "idle",
  );
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDividendModalOpen, setIsDividendModalOpen] = useState(false);
  const [incomeViewMode, setIncomeViewMode] = useState<IncomeViewMode>("annual");
  const [isIndicesOpen, setIsIndicesOpen] = useState(false);
  const [indicesData, setIndicesData] = useState<Record<string, BRVMIndexData> | null>(null);
  const [indicesError, setIndicesError] = useState<string | null>(null);
  const [isIndicesLoading, setIsIndicesLoading] = useState(false);
  const [marketClockNow, setMarketClockNow] = useState<number | null>(null);

  const dispatch = useDispatch();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [watchlistSettings, setWatchlistSettings] = useState({
    showLast: true,
    showChange: true,
    showChangePercent: true,
    showVolume: true,
    showLogo: true,
    showSymbol: false,
    showName: true,
  });

  const fundamentalsCacheRef = useRef<Map<string, BRVMFundamentals>>(new Map());
  const fundamentalsRequestIdRef = useRef(0);

  const incomeChartRef = useRef<HTMLDivElement | null>(null);
  const seasonalChartRef = useRef<HTMLDivElement | null>(null);
  const technicalsChartRef = useRef<HTMLDivElement | null>(null);
  const analystRatingChartRef = useRef<HTMLDivElement | null>(null);
  const volatilityChartRef = useRef<HTMLDivElement | null>(null);
  const volatilityCurveChartRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const syncMarketClock = () => setMarketClockNow(Date.now());
    syncMarketClock();
    const intervalId = window.setInterval(syncMarketClock, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const sidebarMarketStatus = useMemo(
    () => getBrvmMarketStatus(marketClockNow ?? 0),
    [marketClockNow],
  );

  const sidebarLastUpdateLabel = useMemo(() => {
    if (lastUpdate) return formatBrvmDisplayMinute(new Date(lastUpdate));
    if (marketClockNow === null) return "--:--";
    return formatBrvmDisplayMinute(new Date(marketClockNow));
  }, [lastUpdate, marketClockNow]);

  // [TENOR 2026] HIGHEST YTM BONDS STATE
  const [topBonds, setTopBonds] = useState<{ name: string; maturityDate: string; ytm: number }[]>([]);
  const [bondsLoading, setBondsLoading] = useState(true);

  useEffect(() => {
    if (!isIndicesOpen) return;
    setIsIndicesLoading(true);
    setIndicesError(null);
    fetch("/api/market-data/indices")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setIndicesData(data);
        setIsIndicesLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching indices:", err);
        setIndicesError(err instanceof Error ? err.message : "Erreur réseau");
        setIsIndicesLoading(false);
      });
  }, [isIndicesOpen]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/market-data/brvm-news');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setNews(data);
        }
      } catch {
        console.warn("Failed to fetch news. Using fallback state.");
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const safeNews = useMemo(
    () =>
      news.filter(
        (item): item is BRVMNewsItem =>
          !!item &&
          typeof item.title === "string" &&
          typeof item.date === "string" &&
          typeof item.link === "string" &&
          item.link.length > 0,
      ),
    [news],
  );

  // [TENOR 2026] CONSOLIDATED VALIDATION
  const validFundamentals = isFundamentalsForTicker(fundamentals, normalizedSecurityTicker) ? fundamentals : null;
  const isFundamentalsPending = dataMode === "real" && normalizedSecurityTicker.length > 0 && !validFundamentals;
  const isFundamentalsLoading = isFundamentalsPending || fundamentalsStatus === "loading";
  const isFundamentalsPanelLoading = Boolean(isLoading || isFundamentalsLoading);
  const hasVerifiedFinancials = dataMode !== "real" || hasFinancialSeries(validFundamentals);
  const hasVerifiedEarnings = dataMode !== "real" || Boolean(validFundamentals?.earnings.length);
  const hasVerifiedDividends = dataMode !== "real" || Boolean(validFundamentals?.dividends.length);
  const canRenderIncomeStatement = hasVerifiedFinancials && (dataMode !== "real" || incomeViewMode === "annual");
  const latestRevenueT12M = getLatestFundamentalValue(validFundamentals?.revenues);
  const catalogRevenueT12M = dataMode !== "real" && Number.isFinite(security.revenueT12M)
    ? `${security.revenueT12M.toFixed(2).replace(".", ",")} %`
    : "N/D";
  const displayRevenueT12M = latestRevenueT12M !== null
    ? formatMillionsFcfa(latestRevenueT12M)
    : catalogRevenueT12M;
  const latestSeriesTime = getLatestSeriesTime(chartData);
  const marketAuditDate = formatAuditDate(lastUpdate || latestSeriesTime);
  const fundamentalsAuditYear = getLatestFinancialYear(validFundamentals);
  const auditCurrency = security.currency || "XOF";
  const marketDataSource = dataMode === "real" ? "BRVM real API" : "Mock dataset";
  const fundamentalsSource = dataMode === "real"
    ? `/api/brvm-fundamentals -> ${getVerifiedSourceLabel(validFundamentals?.source)}`
    : "Mock/catalog";
  const auditTone = dataMode === "real" ? "success" : "warning";

  // [TENOR 2026] FETCH REAL FUNDAMENTALS
  useEffect(() => {
    const ticker = normalizeTicker(security.ticker);

    setIsDescriptionExpanded(false);

    if (dataMode !== "real" || ticker.length === 0) {
      fundamentalsRequestIdRef.current += 1;
      setFundamentals(null);
      setFundamentalsStatus("idle");
      return;
    }

    const cachedFundamentals = fundamentalsCacheRef.current.get(ticker);
    if (cachedFundamentals) {
      setFundamentals(cachedFundamentals);
      setFundamentalsStatus("ready");
      return;
    }

    const requestId = fundamentalsRequestIdRef.current + 1;
    fundamentalsRequestIdRef.current = requestId;
    const controller = new AbortController();

    setFundamentals(null);
    setFundamentalsStatus("loading");

    const fetchFundamentals = async () => {
      try {
        const cacheBuster = `&_t=${Date.now()}`;
        const res = await fetch(`/api/market-data/brvm-fundamentals?ticker=${encodeURIComponent(ticker)}${cacheBuster}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }

        const data = await res.json();
        const normalized = normalizeFundamentalsResponse(data, ticker);

        if (normalizeTicker(normalized.ticker) !== ticker) {
          throw new Error(`Ticker mismatch: requested ${ticker}, received ${normalized.ticker || "empty"}`);
        }

        if (controller.signal.aborted || fundamentalsRequestIdRef.current !== requestId) return;

        fundamentalsCacheRef.current.set(ticker, normalized);
        setFundamentals(normalized);
        setFundamentalsStatus("ready");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (controller.signal.aborted || fundamentalsRequestIdRef.current !== requestId) return;

        console.error(`[HDR-UI] Failed to fetch fundamentals for ${ticker}`, error);
        setFundamentals(createEmptyFundamentals(ticker));
        setFundamentalsStatus("error");
      }
    };

    fetchFundamentals();

    return () => controller.abort();
  }, [security.ticker, dataMode]);

  useEffect(() => {
    if (currentNewsIdx === 0 && safeNews.length === 0) return;
    if (currentNewsIdx < safeNews.length) return;
    setCurrentNewsIdx(0);
  }, [currentNewsIdx, safeNews.length]);

  useEffect(() => {
    if (safeNews.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentNewsIdx((prev) => (prev + 1) % safeNews.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [safeNews.length, isHovered]);

  const activeNews = safeNews[currentNewsIdx] ?? FALLBACK_NEWS_ITEM;

  const formatNewsDate = (date: string) => {
    if (date.toLowerCase() === "aujourd'hui") return "Aujourd'hui";
    return date.charAt(0).toUpperCase() + date.slice(1);
  };

  const formatNewsTitle = (title: string) => {
    if (!title) return "";
    const isMostlyUpper = (title.match(/[A-Z]/g) || []).length > title.length * 0.5;
    if (isMostlyUpper) {
      return title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()
        .replace(/brvm/g, "BRVM")
        .replace(/uemoa/g, "UEMOA")
        .replace(/crrh/g, "CRRH")
        .replace(/bceao/g, "BCEAO");
    }
    return title;
  };

  // [TENOR 2026] FINANCIAL METRICS (Memoized for Charts & JSX)
  const financialMetrics = useMemo(() => {
    const ticker = security.ticker || "BOAB";
    const hash = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    let payoutRatio = 0;
    let hasValidPayout = false;
    let calculatedYield = 0;
    let hasValidYield = false;

    if (dataMode === "real") {
      if (validFundamentals && validFundamentals.dividends && validFundamentals.dividends.length > 0) {
        const lastDiv = validFundamentals.dividends[validFundamentals.dividends.length - 1];
        if (lastDiv.value && livePrice > 0) {
          calculatedYield = (lastDiv.value / livePrice) * 100;
          hasValidYield = true;
        }
        if (validFundamentals?.earnings && validFundamentals.earnings.length > 0) {
          const matchingEarning = validFundamentals.earnings.find(e => e.year === lastDiv.year);
          if (lastDiv.value && matchingEarning?.value && matchingEarning.value > 0) {
            payoutRatio = (lastDiv.value / (matchingEarning.value / (displayMarketCap && livePrice > 0 ? displayMarketCap / livePrice : 1))) * 100;
            payoutRatio = Math.min(100, Math.max(0, payoutRatio));
            hasValidPayout = true;
          }
        }
      }
    } else {
      payoutRatio = parseFloat((30 + (hash % 40) + Math.sin(hash) * 5).toFixed(2));
      hasValidPayout = true;
      calculatedYield = parseFloat((4 + (hash % 6)).toFixed(2));
      hasValidYield = true;
    }

    return { payoutRatio, hasValidPayout, calculatedYield, hasValidYield };
  }, [security.ticker, dataMode, livePrice, displayMarketCap, validFundamentals]);

  const performanceRows = useMemo(() => {
    const referenceTime = lastUpdate
      ? new Date(lastUpdate).getTime()
      : (chartData.length > 0 ? new Date(chartData[chartData.length - 1].time).getTime() : 0);

    const getPerformance = (daysOffset: number) => {
      if (!chartData || chartData.length < 2 || referenceTime <= 0) return null;
      const currentPrice = livePrice || chartData[chartData.length - 1].close;
      const targetDate = new Date(referenceTime - daysOffset * 24 * 60 * 60 * 1000);
      let historicalPoint: ChartDataPoint | undefined;
      for (let index = chartData.length - 1; index >= 0; index -= 1) {
        if (new Date(chartData[index].time) <= targetDate) {
          historicalPoint = chartData[index];
          break;
        }
      }
      if (!historicalPoint || historicalPoint.close === 0) return null;
      return ((currentPrice - historicalPoint.close) / historicalPoint.close) * 100;
    };

    return [
      { label: '1W', value: getPerformance(7) },
      { label: '1M', value: getPerformance(30) },
      { label: '3M', value: getPerformance(90) },
      { label: '6M', value: getPerformance(180) },
      { label: 'YTD', value: displayReturnYTD ?? null },
      { label: '1Y', value: getPerformance(365) }
    ];
  }, [chartData, displayReturnYTD, lastUpdate, livePrice]);

  const technicalData = useMemo(() => {
    if (chartData.length < 50) return null;

    const latestPrice = livePrice || chartData[chartData.length - 1].close;
    const rsi = getLatestNumericValue(calculateRSI(chartData, 14));
    const sma20 = getLatestNumericValue(calculateSMA(chartData, 20));
    const sma50 = getLatestNumericValue(calculateSMA(chartData, 50));

    if (rsi === null || sma20 === null || sma50 === null || sma50 <= 0 || sma20 <= 0) {
      return null;
    }

    const rsiScore = Math.max(0, Math.min(100, (rsi - 30) * 2.5));
    const trendGap = ((sma20 - sma50) / sma50) * 100;
    const trendScore = Math.max(0, Math.min(100, 50 + trendGap * 5));
    const priceGap = ((latestPrice - sma20) / sma20) * 100;
    const priceScore = Math.max(0, Math.min(100, 50 + priceGap * 10));
    const score = Math.max(0, Math.min(100, rsiScore * 0.4 + trendScore * 0.3 + priceScore * 0.3));

    const getSentimentLabel = (val: number) => {
      if (val < 25) return "Strong sell";
      if (val < 45) return "Sell";
      if (val < 55) return "Neutral";
      if (val < 75) return "Buy";
      return "Strong buy";
    };

    return {
      rsi,
      sma20,
      sma50,
      score,
      sentiment: getSentimentLabel(score),
    };
  }, [chartData, livePrice]);

  // ============================================================================
  // [TENOR 2026 SRE] ECHARTS LIFECYCLE SPLIT (MEMORY LEAK FIX)
  // ============================================================================

  // ----------------------------------------------------------------------------
  // 1. BENEFITS CHART (Lazy Loading)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const dom = benefitsChartRef.current;
    if (!dom || isFundamentalsPanelLoading || !hasVerifiedEarnings) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const earningsRows = dataMode === "real"
          ? (validFundamentals?.earnings || []).slice(-5)
          : [
              { year: "Q2 '25", value: 1.32, isEstimate: false },
              { year: "Q3 '25", value: 2.1, isEstimate: false },
              { year: "Q4 '25", value: 1.5, isEstimate: false },
              { year: "Q1 '26", value: 0.9, isEstimate: true },
              { year: "Q2 '26", value: 1.8, isEstimate: true },
            ];
        const labels = earningsRows.map((row) => row.year);
        const benefitsData = earningsRows.map((row) => row.value);
        const tooltipUnit = dataMode === "real" ? "M FCFA" : "%";

        const option: echarts.EChartsOption = {
          backgroundColor: "transparent",
          title: {
            text: "Bénéfices",
            left: 0,
            top: 0,
            bottom: 0,
            textStyle: { color: "#fff", fontWeight: 500, fontSize: 16 }
          },
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow" },
            backgroundColor: "rgba(30, 41, 59, 0.95)",
            borderColor: "#334155",
            borderWidth: 1,
            padding: [6, 8],
            borderRadius: 4,
            textStyle: { color: "#f1f5f9", fontSize: 10 },
            extraCssText: "box-shadow: 0 4px 6px rgba(0,0,0,0.2);",
            formatter: (params: unknown) => {
              const p = Array.isArray(params) ? params[0] : params;
              const data = p as { dataIndex: number; name: string; value: number };
              const isEstimate = Boolean(earningsRows[data.dataIndex]?.isEstimate);
              const formattedValue = dataMode === "real"
                ? data.value.toLocaleString("fr-FR", { maximumFractionDigits: 2 })
                : data.value.toFixed(2);
              return `<div style="display: flex; flex-direction: column; gap: 2px;">
                <div style="color: #94a3b8; font-size: 9px;">${data.name} ${isEstimate ? "(Estimate)" : "(Actual)"}</div>
                <div style="display: flex; justify-content: space-between; gap: 12px; align-items: center;">
                  <span style="font-weight: 500;">Bénéfices</span>
                  <span style="font-weight: 700; color: #10b981;">${formattedValue} ${tooltipUnit}</span>
                </div>
              </div>`;
            }
          },
          grid: { top: 40, right: 35, bottom: 25, left: 5, containLabel: false },
          xAxis: {
            type: "category",
            data: labels,
            axisLabel: { color: "#94a3b8", fontSize: 9, margin: 10 },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "#1e293b" } }
          },
          yAxis: {
            type: "value",
            position: "right",
            axisLabel: {
              color: "#94a3b8",
              fontSize: 9,
              formatter: (value: number) => dataMode === "real" ? value.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : `${value}%`,
            },
            splitLine: { lineStyle: { color: "#1e293b", type: "dashed" } }
          },
          series: [{
            name: "Bénéfices",
            type: "scatter",
            symbolSize: 14,
            data: benefitsData.map((val, idx) => ({
              value: val,
              itemStyle: {
                color: earningsRows[idx]?.isEstimate ? "transparent" : (idx === 0 || val >= benefitsData[idx - 1] ? "#22ab94" : "#f23645"),
                borderColor: earningsRows[idx]?.isEstimate ? "#787b86" : "transparent",
                borderWidth: earningsRows[idx]?.isEstimate ? 1.5 : 0
              }
            })),
            emphasis: { scale: 1.2 }
          }]
        };
        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [benefitsChartRef, dataMode, hasVerifiedEarnings, isFundamentalsPanelLoading, validFundamentals]);

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // 2. DIVIDENDS CHART (Lazy Loading)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const dom = dividendsChartRef.current;
    if (!dom || isFundamentalsPanelLoading || !hasVerifiedDividends) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const { payoutRatio, hasValidPayout, calculatedYield, hasValidYield } = financialMetrics;
        const displayValue = hasValidPayout ? `${payoutRatio.toFixed(1)}%` : (hasValidYield ? `${calculatedYield.toFixed(2)}%` : "N/A");
        const subText = hasValidPayout ? "Payout" : (hasValidYield ? "Yield" : "");
        const colorActive = (hasValidPayout || hasValidYield) ? "#10b981" : "#475569";
        const colorInactive = "#1e293b";

        const option: echarts.EChartsOption = {
          backgroundColor: "transparent",
          title: {
            text: displayValue,
            subtext: subText,
            left: "center",
            top: "center",
            textStyle: { color: colorActive, fontSize: 16, fontWeight: "bold" },
            subtextStyle: { color: "#94a3b8", fontSize: 10 }
          },
          series: [
            {
              type: "pie",
              radius: ["65%", "85%"],
              silent: true,
              label: { show: false },
              data: [
                {
                  value: (hasValidPayout || hasValidYield) ? (hasValidPayout ? payoutRatio : calculatedYield * 10) : 0,
                  itemStyle: { color: colorActive }
                },
                {
                  value: (hasValidPayout || hasValidYield) ? (hasValidPayout ? 100 - payoutRatio : 100 - (calculatedYield * 10)) : 100,
                  itemStyle: { color: colorInactive }
                }
              ]
            }
          ]
        };
        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [financialMetrics, dividendsChartRef, hasVerifiedDividends, isFundamentalsPanelLoading]);


  useEffect(() => {
    const dom = incomeChartRef.current;
    if (!dom || isFundamentalsPanelLoading || !canRenderIncomeStatement) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const ticker = normalizedSecurityTicker || "BOAB";
        const hash = ticker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        let revenuesData: number[] = [];
        let earningsData: number[] = [];
        let labels: string[] = [];
        let margins: number[] = [];
        let hasFinancials = true;

        if (dataMode === "real" && validFundamentals) {
          const revs = validFundamentals.revenues || [];
          const erns = validFundamentals.earnings || [];
          hasFinancials = revs.length > 0 || erns.length > 0;

          if (hasFinancials) {
            const years = Array.from(new Set([...revs.map(r => r.year), ...erns.map(e => e.year)]))
              .filter(y => y && y.length === 4)
              .sort((a, b) => parseInt(a) - parseInt(b));
            labels = years;
            revenuesData = years.map(y => revs.find(r => r.year === y)?.value || 0);
            earningsData = years.map(y => erns.find(e => e.year === y)?.value || 0);
            margins = years.map((_, i) => revenuesData[i] > 0 ? (earningsData[i] / revenuesData[i]) * 100 : 0);
          }
        } else {
          labels = incomeViewMode === 'annual' ? ["2021", "2022", "2023", "2024", "2025"] : ["Q1 '25", "Q2 '25", "Q3 '25", "Q4 '25", "Q1 '26"];
          revenuesData = labels.map((_, i) => 120 + (hash % 50) + i * 10 + Math.sin(hash + i) * 5);
          earningsData = revenuesData.map(r => r * (0.15 + (hash % 15) / 100));
          margins = earningsData.map((e, i) => (e / revenuesData[i]) * 100);
        }

        const option: echarts.EChartsOption = {
          backgroundColor: "transparent",
          title: !hasFinancials && dataMode === "real" ? {
            text: '(Estimation Secteur)',
            right: 0, top: 0,
            textStyle: { color: '#94a3b8', fontSize: 10, fontStyle: 'italic', fontWeight: 'normal' }
          } : undefined,
          tooltip: {
            trigger: "axis",
            axisPointer: { type: "shadow", shadowStyle: { color: 'rgba(255,255,255,0.03)' } },
            backgroundColor: "#1e222d",
            borderColor: "#363a45",
            borderWidth: 1,
            padding: [10, 14],
            borderRadius: 6,
            textStyle: { color: "#d1d4dc", fontSize: 12, fontFamily: "Inter, sans-serif" },
            extraCssText: "box-shadow: 0 8px 24px rgba(0,0,0,0.5); border-radius: 8px;",
            formatter: (params: unknown) => {
              const pList = (Array.isArray(params) ? params : [params]) as { name: string; seriesType: string; value: number; color: string; seriesName: string }[];
              let res = `<div style="font-weight: 700; margin-bottom: 8px; color: #fff; font-size: 13px; border-bottom: 1px solid #363a45; padding-bottom: 6px;">${pList[0].name}</div>`;
              pList.forEach((p) => {
                const symbol = p.seriesType === 'line' ? '○' : '●';
                const val = p.seriesType === 'line' ? `<span style="color: #ff9800;">${p.value.toFixed(1)}%</span>` : `<span style="color: #fff;">${p.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} M</span>`;
                res += `<div style="display: flex; justify-content: space-between; gap: 20px; align-items: center; margin-bottom: 4px;">
                  <span style="color: #94a3b8; font-size: 11px;"><span style="color: ${p.color}; margin-right: 6px;">${symbol}</span>${p.seriesName}</span>
                  <span style="font-weight: 600; font-size: 11px;">${val}</span>
                </div>`;
              });
              return res;
            }
          },
          grid: { top: 20, left: 0, right: 0, bottom: 25, containLabel: false },
          xAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: "#787b86", fontSize: 10, margin: 12, fontWeight: 500 },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "#2a2e39", width: 1 } }
          },
          yAxis: [{ type: 'value', show: false }, { type: 'value', show: false, min: 0 }],
          series: [
            {
              name: "Revenue",
              type: 'bar',
              barWidth: '22%',
              data: revenuesData,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#3d7eff' }, { offset: 1, color: '#2962ff' }]),
                borderRadius: [3, 3, 0, 0]
              }
            },
            {
              name: "Net income",
              type: 'bar',
              barWidth: '22%',
              data: earningsData,
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#00e5ff' }, { offset: 1, color: '#00bcd4' }]),
                borderRadius: [3, 3, 0, 0]
              }
            },
            {
              name: "Net margin %",
              type: 'line',
              yAxisIndex: 1,
              data: margins,
              symbol: 'circle',
              symbolSize: 8,
              showSymbol: true,
              itemStyle: { color: '#ff9800', borderColor: '#1e222d', borderWidth: 2 },
              lineStyle: { width: 3, color: '#ff9800' }
            }
          ]
        };
        chart.setOption(option, { notMerge: true });
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [canRenderIncomeStatement, dataMode, incomeChartRef, incomeViewMode, isFundamentalsPanelLoading, normalizedSecurityTicker, validFundamentals]);

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // 4. SEASONALS CHART (Lazy Loading)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const dom = seasonalChartRef.current;
    if (!dom || isLoading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const years = [2026, 2025, 2024];
        const colors = ['#2962ff', '#089981', '#f57c00'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const seasonalSeries = years.map((year, idx) => {
          const yearData = chartData.filter(d => new Date(d.time).getFullYear() === year);
          if (yearData.length === 0) return { name: year.toString(), type: 'line' as const, data: [] };

          const startPrice = yearData[0].close;
          const cumulativeData = yearData.map(d => ({
            date: new Date(d.time),
            value: ((d.close - startPrice) / startPrice) * 100
          }));

          const monthlyData = months.map((_, mIdx) => {
            const dayInData = cumulativeData.find(d => d.date.getMonth() === mIdx);
            return dayInData ? dayInData.value : null;
          });

          let lastValid = 0;
          const interpolated = monthlyData.map(v => {
            if (v !== null) { lastValid = v; return v; }
            return lastValid;
          });

          return {
            name: year.toString(),
            type: 'line' as const,
            data: interpolated,
            smooth: true,
            showSymbol: false,
            lineStyle: { width: idx === 0 ? 3 : 1.5, color: colors[idx] },
            itemStyle: { color: colors[idx] }
          };
        });

        const option: echarts.EChartsOption = {
          backgroundColor: 'transparent',
          animation: true,
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#1e222d',
            borderColor: '#363a45',
            borderWidth: 1,
            textStyle: { color: '#d1d4dc', fontSize: 11 },
            formatter: (params: unknown) => {
              const pList = (Array.isArray(params) ? params : [params]) as { name: string; color: string; seriesName: string; value: number | null }[];
              let res = `<div style="font-weight: 700; margin-bottom: 5px;">${pList[0].name}</div>`;
              pList.forEach((p) => {
                res += `<div style="display: flex; justify-content: space-between; gap: 10px;">
                  <span><span style="color: ${p.color}; margin-right: 5px;">●</span>${p.seriesName}</span>
                  <span style="font-weight: 600;">${p.value !== null ? p.value.toFixed(2) : '—'}%</span>
                </div>`;
              });
              return res;
            }
          },
          grid: { top: 10, left: 0, right: 0, bottom: 20, containLabel: false },
          xAxis: {
            type: 'category',
            data: months,
            axisLabel: { color: "#787b86", fontSize: 10 },
            axisTick: { show: false },
            axisLine: { lineStyle: { color: "#363a45" } },
            splitLine: { show: true, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: 'dashed' } }
          },
          yAxis: {
            type: 'value',
            show: false,
            splitLine: { show: true, lineStyle: { color: "rgba(42, 46, 57, 0.5)", type: 'dashed' } }
          },
          series: seasonalSeries
        };

        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [chartData, seasonalChartRef, isLoading]);

  // [TENOR 2026] FETCH BRVM BONDS (Highest YTM)
  useEffect(() => {
    const fetchBonds = async () => {
      try {
        const res = await fetch('/api/market-data/brvm-bonds');
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        const data = await res.json();
        if (data && Array.isArray(data.bonds) && data.bonds.length > 0) {
          setTopBonds(data.bonds.slice(0, 3));
        }
      } catch {
        console.warn('[UI] Failed to fetch bonds. Using fallback empty state.');
      } finally {
        setBondsLoading(false);
      }
    };
    fetchBonds();
  }, []);

  // [TENOR 2026] ANALYST RATING COMPUTATION via useMemo (no synchronous setState)
  const analystData = useMemo(() => {
    if (!technicalData) return null;
    if (dataMode === "real" && (!validFundamentals || validFundamentals.dividends.length === 0)) return null;

    const prices = chartData.map(d => d.close);
    const latestPrice = livePrice || prices[prices.length - 1];

    const verifiedPe = Number.isFinite(displayPeRatio)
      ? displayPeRatio
      : (Number.isFinite(security.peRatio) ? security.peRatio : null);
    if (dataMode === "real" && verifiedPe === null) return null;

    const pe = verifiedPe ?? 15;
    const peScore = Math.max(0, Math.min(100, 50 + (15 - pe) * 5));

    const lastDiv = validFundamentals ? (validFundamentals.dividends?.[validFundamentals.dividends.length - 1]?.value ?? 0) : 0;
    const yieldPct = latestPrice > 0 ? (lastDiv / latestPrice) * 100 : 0;
    const divScore = Math.max(0, Math.min(100, yieldPct * 8.33));

    const totalScore = Math.min(100, Math.max(0, technicalData.score * 0.3 + peScore * 0.3 + divScore * 0.4));

    const lastNetIncome = validFundamentals?.earnings?.[validFundamentals.earnings.length - 1]?.value ?? null;
    const sharesMillions = displayMarketCap && latestPrice > 0 ? displayMarketCap / latestPrice : null;
    const eps = lastNetIncome !== null && sharesMillions && sharesMillions > 0 ? lastNetIncome / sharesMillions : null;

    let priceTarget = 0;
    let targetFormula = "SMA50 fallback";
    if (eps !== null) {
      priceTarget = parseFloat((eps * Math.min(pe * 1.1, 20)).toFixed(2));
      targetFormula = "EPS x min(P/E x 1.1, 20)";
    } else {
      priceTarget = parseFloat((technicalData.sma50 * (1 + (totalScore - 50) / 200)).toFixed(2));
    }

    const pctChange = latestPrice > 0 ? ((priceTarget - latestPrice) / latestPrice) * 100 : 0;

    const getLabel = (v: number) => {
      if (v < 25) return 'Strong sell';
      if (v < 45) return 'Sell';
      if (v < 55) return 'Neutral';
      if (v < 75) return 'Buy';
      return 'Strong buy';
    };

    return { score: totalScore, label: getLabel(totalScore), priceTarget, pctChange, targetFormula };
  }, [chartData, dataMode, displayMarketCap, displayPeRatio, livePrice, security.peRatio, technicalData, validFundamentals]);

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // 5. ANALYST RATING CHART (Lazy Loading)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const dom = analystRatingChartRef.current;
    if (!dom || !analystData || isLoading || isFundamentalsLoading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const { score } = analystData;
        const arcColors: [number, string][] = [
          [0.25, score < 25 ? '#f23645' : '#2a2e39'],
          [0.45, score >= 25 && score < 45 ? '#ff9800' : '#2a2e39'],
          [0.55, score >= 45 && score < 55 ? '#d4af37' : '#2a2e39'],
          [0.75, score >= 55 && score < 75 ? '#22ab94' : '#2a2e39'],
          [1.0, score >= 75 ? '#00c853' : '#2a2e39'],
        ];

        const option: echarts.EChartsOption = {
          series: [{
            type: 'gauge',
            startAngle: 210,
            endAngle: -30,
            min: 0,
            max: 100,
            radius: '68%',
            center: ['50%', '65%'],
            axisLine: {
              lineStyle: { width: 8, color: arcColors, shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' }
            },
            pointer: {
              length: '75%', width: 3, offsetCenter: [0, '5%'],
              itemStyle: { color: '#d1d4dc', shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.5)' }
            },
            anchor: {
              show: true, showAbove: true, size: 10,
              itemStyle: { color: '#d1d4dc', borderWidth: 2, borderColor: '#1e222d' }
            },
            axisTick: { show: false },
            splitLine: { show: false },
            splitNumber: 10,
            axisLabel: {
              show: true, distance: -70, color: '#94a3b8', fontSize: 10, fontWeight: 500,
              formatter: (v) => {
                if (v === 10) return 'Strong sell';
                if (v === 30) return 'Sell';
                if (v === 50) return 'Neutral';
                if (v === 70) return 'Buy';
                if (v === 90) return 'Strong buy';
                return '';
              }
            },
            detail: {
              offsetCenter: [0, '65%'],
              formatter: () => analystData.label,
              color: '#f1f5f9', fontSize: 18, fontWeight: 800,
              textShadowBlur: 5, textShadowColor: 'rgba(0,0,0,0.5)'
            },
            data: [{ value: score }]
          }]
        };

        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [analystData, analystRatingChartRef, isFundamentalsLoading, isLoading]);

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // 6. TECHNICALS CHART (Lazy Loading)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const dom = technicalsChartRef.current;
    if (!dom || !technicalData || isLoading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const score = technicalData.score;
        const sentiment = technicalData.sentiment;

        const colors = {
          strongSell: '#f23645',
          sell: '#ff5252',
          neutral: '#94a3b8',
          buy: '#22ab94',
          strongBuy: '#00c853',
          track: '#2a2e39',
        };

        const option: echarts.EChartsOption = {
          series: [{
            type: 'gauge',
            startAngle: 210,
            endAngle: -30,
            min: 0,
            max: 100,
            radius: '68%',
            center: ['50%', '65%'],
            axisLine: {
              lineStyle: {
                width: 8,
                color: [
                  [0.2, score < 25 ? colors.strongSell : colors.track],
                  [0.4, (score >= 25 && score < 45) ? colors.sell : colors.track],
                  [0.5, (score >= 45 && score < 55) ? colors.neutral : colors.track],
                  [0.6, (score >= 45 && score < 55) ? colors.neutral : colors.track],
                  [0.8, (score >= 55 && score < 75) ? colors.buy : colors.track],
                  [1, score >= 75 ? colors.strongBuy : colors.track]
                ],
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            },
            pointer: {
              length: '75%', width: 3, offsetCenter: [0, '5%'],
              itemStyle: { color: '#d1d4dc', shadowBlur: 5, shadowColor: 'rgba(0,0,0,0.5)' }
            },
            anchor: {
              show: true, showAbove: true, size: 10,
              itemStyle: { color: '#d1d4dc', borderWidth: 2, borderColor: '#1e222d' }
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: {
              show: true, distance: -70, color: '#94a3b8', fontSize: 10, fontWeight: 500,
              formatter: (v) => {
                if (v === 10) return 'Strong sell';
                if (v === 30) return 'Sell';
                if (v === 50) return 'Neutral';
                if (v === 70) return 'Buy';
                if (v === 90) return 'Strong buy';
                return '';
              }
            },
            detail: {
              offsetCenter: [0, '65%'],
              formatter: () => {
                if (sentiment === 'Strong buy') return 'Buy';
                if (sentiment === 'Strong sell') return 'Sell';
                return sentiment;
              },
              color: '#f1f5f9', fontSize: 18, fontWeight: 800,
              textShadowBlur: 5, textShadowColor: 'rgba(0,0,0,0.5)'
            },
            data: [{ value: score }]
          }]
        };

        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [technicalData, technicalsChartRef, isLoading]);


  useEffect(() => {
    const dom = volatilityChartRef.current;
    if (!dom || chartData.length < 5 || isLoading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const closePrices = chartData.map(d => d.close);
        const termStructure = getVolatilityTermStructure(closePrices);

        const option = {
          backgroundColor: 'transparent',
          animation: true,
          grid: { top: 20, right: 10, bottom: 25, left: 10, containLabel: true },
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#1e222d',
            borderColor: '#363a45',
            textStyle: { color: '#d1d4dc', fontSize: 11 },
            formatter: (params: { name: string; value: number }[]) => {
              const p = params[0];
              return `<div style="font-weight:700;margin-bottom:4px">${p.name} Maturity</div>
                      <div style="color:#818cf8">HV: ${p.value}%</div>`;
            }
          },
          xAxis: {
            type: 'category',
            data: termStructure.map((d: { label: string; value: number }) => d.label),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: { color: '#94a3b8', fontSize: 10, interval: 0 },
            axisTick: { show: false }
          },
          yAxis: {
            type: 'value',
            axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => v.toFixed(0) + '%' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            min: (value: { min: number }) => Math.max(0, Math.floor(value.min - 5)),
            max: (value: { max: number }) => Math.ceil(value.max + 5)
          },
          series: [{
            data: termStructure.map((d: { label: string; value: number }) => d.value),
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#818cf8', borderWidth: 2, borderColor: '#1e222d' },
            lineStyle: { width: 3, color: '#818cf8', shadowBlur: 10, shadowColor: 'rgba(129, 140, 248, 0.5)' },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(129, 140, 248, 0.2)' },
                { offset: 1, color: 'rgba(129, 140, 248, 0)' }
              ])
            }
          }]
        };
        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [chartData, volatilityChartRef, isLoading]);

  // ----------------------------------------------------------------------------
  // ----------------------------------------------------------------------------
  // 8. VOLATILITY CURVE CHART (Lazy Loading)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const dom = volatilityCurveChartRef.current;
    if (!dom || chartData.length < 28 || isLoading) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let chart = echarts.getInstanceByDom(dom);
        if (!chart) chart = echarts.init(dom);

        const closePrices = chartData.map(d => d.close);
        const skewData = getVolatilitySkew(closePrices, 28);

        if (skewData.length === 0) return;

        const option = {
          backgroundColor: 'transparent',
          animation: true,
          grid: { top: 20, right: 10, bottom: 40, left: 10, containLabel: true },
          tooltip: {
            trigger: 'axis',
            backgroundColor: '#1e222d',
            borderColor: '#363a45',
            textStyle: { color: '#d1d4dc', fontSize: 11 },
            formatter: (params: { name: string; value: number }[]) => {
              const p = params[0];
              return `<div style="font-weight:700;margin-bottom:4px">Price: ${p.name}</div>
                      <div style="color:#6366f1">Vol: ${p.value.toFixed(2)}%</div>`;
            }
          },
          xAxis: {
            type: 'category',
            data: skewData.map((d: { price: number; value: number }) => d.price.toString()),
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            axisLabel: {
              color: '#94a3b8', fontSize: 10,
              interval: Math.floor(skewData.length / 4),
              formatter: (v: string) => Math.round(parseFloat(v)).toString()
            },
            axisTick: { show: false }
          },
          yAxis: {
            type: 'value',
            position: 'right',
            axisLabel: { color: '#94a3b8', fontSize: 10, formatter: (v: number) => v.toFixed(2) + '%' },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            min: (value: { min: number }) => Math.max(0, Math.floor(value.min - 5)),
            max: (value: { max: number }) => Math.ceil(value.max + 5)
          },
          series: [{
            data: skewData.map((d: { price: number; value: number }) => d.value),
            type: 'line',
            smooth: true,
            symbol: 'none',
            lineStyle: {
              width: 4,
              color: '#8b5cf6',
              shadowBlur: 15,
              shadowColor: 'rgba(139, 92, 246, 0.6)'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(139, 92, 246, 0.15)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0)' }
              ])
            }
          }]
        };
        chart.setOption(option);
      }
    }, { threshold: 0.1 });

    observer.observe(dom);
    return () => {
      observer.disconnect();
      const chart = echarts.getInstanceByDom(dom);
      if (chart) chart.dispose();
    };
  }, [chartData, isLoading]);

  return (
    <aside
      ref={sidebarRef as React.RefObject<HTMLDivElement>}
      className={clsx("gp-sidebar", "gp-sidebar", "gsap-target-sidebar", "animated-element")}
      style={{ position: "relative" }}
    >
      <div className={"gp-sidebar-main-content"} style={{ position: "relative" }}>
        {/* [TENOR 2026 FEAT] Object Tree panel overlay — covers financial content when active */}
        {overlayContent && (
          <div
            id="gp-object-tree-overlay"
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 100,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: "var(--gp-bg-toolbar, #0d2136)",
            }}
          >
            {overlayContent}
          </div>
        )}
        <div className={clsx("gp-sidebar-content", "gp-sidebar-content")}>
          <div className={"gp-sidebar-section"}>
            <div className={clsx("gp-sidebar-header", "head", "pt-1 py-1")}>
              <span
                className={"gp-sidebar-title"}
                style={{ cursor: "pointer", userSelect: "none" }}
                onClick={() => setIsIndicesOpen(prev => !prev)}
              >
                {" "}Liste de surveillance{" "}
                <i
                  className={clsx("bi", isIndicesOpen ? "bi-chevron-up" : "bi-chevron-down")}
                  style={{
                    fontSize: "0.6em",
                    verticalAlign: "middle",
                    display: "inline-block",
                    transition: "transform 0.2s ease",
                  }}
                ></i>
              </span>
              <div className={"gp-sidebar-actions"} style={{ position: "relative" }}>
                <button
                  className={clsx("btn", "hover-lift")}
                  title="Add symbol"
                  onClick={() => {
                    dispatch(setSearchMode("replace"));
                    dispatch(setModalOpen({ modal: "search", isOpen: true }));
                  }}
                >
                  <i className="bi bi-plus"></i>
                </button>
                <button
                  className={clsx("btn", "hover-lift")}
                  title="Advanced view"
                  onClick={() => {
                    openTickerSelector && openTickerSelector();
                  }}
                >
                  <i className="bi bi-pie-chart"></i>
                </button>
                <button
                  className={clsx("btn", "hover-lift")}
                  title="Settings"
                  onClick={() => setIsSettingsOpen(prev => !prev)}
                >
                  <i className="bi bi-three-dots"></i>
                </button>

                {isSettingsOpen && (
                  <div className="gp-watchlist-settings-dropdown">
                    <div className="dropdown-section">
                      <div className="dropdown-section-title">Customize Columns</div>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showLast}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showLast: e.target.checked }))}
                        />
                        <span>Last</span>
                      </label>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showChange}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showChange: e.target.checked }))}
                        />
                        <span>Change</span>
                      </label>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showChangePercent}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showChangePercent: e.target.checked }))}
                        />
                        <span>Change %</span>
                      </label>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showVolume}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showVolume: e.target.checked }))}
                        />
                        <span>Volume</span>
                      </label>
                    </div>
                    <div className="dropdown-divider" />
                    <div className="dropdown-section">
                      <div className="dropdown-section-title">Symbol Display</div>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showLogo}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showLogo: e.target.checked }))}
                        />
                        <span>Logo</span>
                      </label>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showSymbol}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showSymbol: e.target.checked }))}
                        />
                        <span>Symbol</span>
                      </label>
                      <label className="dropdown-item">
                        <input
                          type="checkbox"
                          checked={watchlistSettings.showName}
                          onChange={(e) => setWatchlistSettings(prev => ({ ...prev, showName: e.target.checked }))}
                        />
                        <span>Name</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible BRVM Indices panel */}
            <div className={clsx("gp-indices-panel", isIndicesOpen && "gp-indices-panel-open")}>
              <div className="gp-indices-table">
                <div className="gp-indices-table-header">
                  <span className="col-name">Name</span>
                  <span className="col-last">Last</span>
                  <span className="col-chg-pct">Chg%</span>
                </div>
                <div className="gp-indices-table-section-title">
                  <i className="bi bi-chevron-down me-1" style={{ fontSize: '0.8em' }}></i> INDICES
                </div>

                {isIndicesLoading ? (
                  <div className="d-flex flex-column gap-2 p-2">
                    <div className="is-loading-skeleton" style={{ height: "24px", borderRadius: "4px" }} />
                    <div className="is-loading-skeleton" style={{ height: "24px", borderRadius: "4px" }} />
                    <div className="is-loading-skeleton" style={{ height: "24px", borderRadius: "4px" }} />
                  </div>
                ) : indicesError ? (
                  <div className="text-warning text-center py-2 px-1" style={{ fontSize: '10px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Données non vérifiées ({indicesError})
                  </div>
                ) : !indicesData || Object.keys(indicesData).length === 0 ? (
                  <div className="text-warning text-center py-2 px-1" style={{ fontSize: '10px' }}>
                    <i className="bi bi-exclamation-triangle-fill me-1"></i> Données non vérifiées (indisponibles)
                  </div>
                ) : (
                  [
                    { key: "BRVMC", label: "BRVM Composite", icon: "C", iconClass: "icon-c" },
                    { key: "BRVM30", label: "BRVM 30", icon: "30", iconClass: "icon-30" },
                    { key: "BRVMPR", label: "BRVM Prestige", icon: "P", iconClass: "icon-p" }
                  ].map((idx) => {
                    const data = indicesData[idx.key];
                    if (!data) return null;
                    const isPositive = !data.variation.startsWith("-");
                    return (
                      <div key={idx.key} className="gp-indices-row">
                        <div className="gp-indices-cell-name">
                          <span className={clsx("gp-indices-icon", idx.iconClass)}>{idx.icon}</span>
                          <span className="gp-indices-ticker" title={data.name || idx.label}>{idx.label}</span>
                        </div>
                        <span className="gp-indices-cell-last">{data.price.toFixed(2).replace(".", ",")}</span>
                        <span className={clsx("gp-indices-cell-chg-pct", isPositive ? "text-success" : "text-danger")}>
                          {data.variation}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={"gp-watchlist-item-v3"}>
              {isLoading ? (
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className={"is-loading-skeleton"} style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
                    <div className="flex-1">
                      <div className={"is-loading-skeleton"} style={{ width: "60px", height: "1rem", marginBottom: "4px" }} />
                      <div className={"is-loading-skeleton"} style={{ width: "120px", height: "0.7rem" }} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className={"gp-brand-header-v3"}>
                    {watchlistSettings.showLogo && (
                      <div className={"gp-logo-v3"}>
                        {security.logoUrl ? (
                          <Image src={security.logoUrl} alt={security.ticker} width={32} height={32} style={{ objectFit: 'contain' }} />
                        ) : (
                          <div style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%', fontSize: '12px', fontWeight: 'bold', color: '#f1f5f9' }}>
                            {security.ticker.substring(0, 2)}
                          </div>
                        )}
                      </div>
                    )}
                    <div className={"gp-ticker-meta-v3"}>
                      {watchlistSettings.showSymbol && (
                        <div className={"gp-ticker-row-v3"}>
                          <span className={"gp-ticker-symbol-v3"}>{security.ticker}</span>
                        </div>
                      )}
                      <div className={"gp-company-info-v3"}>
                        {watchlistSettings.showName && <div className={"gp-company-name-v3"}>{security.name}</div>}
                        <span className={"gp-exchange-badge-v3"}> • BRVM</span>
                      </div>
                    </div>
                  </div>

                  <div className={"gp-price-block-v3"}>
                    <div className={"gp-main-price-container"}>
                      <div className={"gp-price-row-primary"}>
                        {watchlistSettings.showLast && (
                          <>
                            <span className={"gp-main-price-v3"}>{livePrice.toFixed(2).replace(".", ",")}</span>
                            <span className={"gp-currency-label-v3"}>{security.currency || "XOF"}</span>
                          </>
                        )}
                        {(watchlistSettings.showChange || watchlistSettings.showChangePercent) && (
                          <div className={"gp-price-change-row-v3"} style={{ color: isMarketPositive ? '#22ab94' : '#f23645' }}>
                            {watchlistSettings.showChange && (
                              <span>{isMarketPositive ? "+" : ""}{liveChange.toFixed(2).replace(".", ",")}</span>
                            )}
                            {watchlistSettings.showChangePercent && (
                              <span>({isMarketPositive ? "+" : ""}{liveChangePercent.toFixed(2)}%)</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className={"price-timestamp-v3"}>Last update at {sidebarLastUpdateLabel} {BRVM_DISPLAY_TIME_ZONE_LABEL}</div>
                    </div>
                  </div>

                  <div className={clsx("gp-market-status-v3", !sidebarMarketStatus.isOpen && "closed")} title={sidebarMarketStatus.title}>
                    <div className="d-flex align-items-center gap-2">
                      <div className={"status-indicator-dot"} />
                      <span className={"status-text"}>{sidebarMarketStatus.isOpen ? "Market open" : "Market closed"}</span>
                      {watchlistSettings.showVolume && (
                        <>
                          <span className={"status-separator"}>•</span>
                          <span className={"status-volume"}>Volume: {liveVolume?.toLocaleString("fr-FR") || "0"}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={"gp-security-details-v3"}>
                    <div className={"detail-item"}><b>Sector:</b> {security.sector}</div>
                    <span className={"detail-separator"}>•</span>
                    <div className={"detail-item"}><b>Country:</b> {security.country}</div>
                  </div>

                  <SidebarAuditTrail
                    items={[
                      { label: "Source", value: marketDataSource, tone: auditTone },
                      { label: "Date", value: marketAuditDate },
                      { label: "Formule", value: "Last, Δ, Δ% depuis OHLCV/live" },
                      { label: "Devise", value: auditCurrency },
                    ]}
                  />
                </>
              )}
            </div>
          </div>

          <div className={"gp-sidebar-news-container"} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{ overflow: 'hidden', minHeight: '70px', height: 'auto', position: 'relative', marginTop: '12px', marginBottom: '12px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
            <AnimatePresence initial={false}>
              <motion.a
                key={currentNewsIdx}
                href={activeNews.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '-100%', opacity: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 25 }}
                style={{ cursor: 'pointer', position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '8px 12px', background: 'transparent', border: 'none', textDecoration: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <i className="bi bi-lightning-fill" style={{ fontSize: '1.2rem', color: '#8b5cf6', flexShrink: 0 }}></i>
                  <div style={{ fontSize: '0.75rem', lineHeight: '1.25', color: '#f1f5f9', flex: 1, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', marginRight: '4px' }}>{formatNewsDate(activeNews.date)} •</span>
                    {formatNewsTitle(activeNews.title)}
                  </div>
                  <i className="bi bi-chevron-right" style={{ fontSize: '0.9rem', opacity: 0.7, color: '#94a3b8', flexShrink: 0 }}></i>
                </div>
              </motion.a>
            </AnimatePresence>
          </div>

          <div className={"gp-sidebar-section"}>
            <div className={"gp-sidebar-header"}><span className={"gp-sidebar-title"}>Statistiques clés</span></div>
            <div className={"gp-stats-table-v2"}>
              {isFundamentalsPanelLoading ? (
                <div className="d-flex flex-column gap-2 p-1">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center">
                      <div className={"is-loading-skeleton"} style={{ width: "45%", height: "0.8rem" }} />
                      <div className={"is-loading-skeleton"} style={{ width: "30%", height: "0.8rem" }} />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className={clsx("row", "g-0")}><span className={clsx("col", "stat-label")}>Rendement YTD</span><span className={clsx("col-auto", "stat-value")}><span className={displayReturnYTD > 0 ? "text-success" : displayReturnYTD < 0 ? "text-danger" : ""}>{displayReturnYTD > 0 ? "+" : ""}{displayReturnYTD?.toFixed(2).replace(".", ",")}%</span></span></div>
                  <div className={clsx("row", "g-0")}><span className={clsx("col", "stat-label")}>P/E Ratio</span><span className={clsx("col-auto", "stat-value")}>{displayPeRatio?.toFixed(2).replace(".", ",")}</span></div>
                  <div className={clsx("row", "g-0")}><span className={clsx("col", "stat-label")}>Volume</span><span className={clsx("col-auto", "stat-value")}>{currentVolume >= 1000 ? (currentVolume / 1000).toFixed(2).replace(".", ",") + " K" : currentVolume}</span></div>
                  <div className={clsx("row", "g-0")}>
                    <span className={clsx("col", "stat-label")}>Revenu/PNB (FY)</span>
                    <span className={clsx("col-auto", "stat-value")}>{displayRevenueT12M}</span>
                  </div>
                  <div className={clsx("row", "g-0")}><span className={clsx("col", "stat-label")}>Volume moyen (30)</span><span className={clsx("col-auto", "stat-value")}>{avgVolume >= 1000 ? (avgVolume / 1000).toFixed(2).replace(".", ",") + " K" : Math.round(avgVolume)}</span></div>
                  <div className={clsx("row", "g-0")}><span className={clsx("col", "stat-label")}>Capitalisation boursière</span><span className={clsx("col-auto", "stat-value")}>{(displayMarketCap !== undefined && displayMarketCap > 0) ? (displayMarketCap >= 1000 ? `${(displayMarketCap / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/\s/g, ".")} B FCFA` : `${displayMarketCap.toLocaleString("fr-FR", { minimumFractionDigits: 2 }).replace(/\s/g, ".")} M FCFA`) : "N/D"}</span></div>
                </>
              )}
            </div>
            {!isFundamentalsPanelLoading && (
              <SidebarAuditTrail
                items={[
                  { label: "Source", value: `${marketDataSource} + ${fundamentalsSource}`, tone: auditTone },
                  { label: "Date", value: `Prix ${marketAuditDate} / FY ${fundamentalsAuditYear}` },
                  { label: "Formule", value: "YTD, P/E, Vol, Avg30, Cap, PNB/FY" },
                  { label: "Devise", value: auditCurrency },
                ]}
              />
            )}
          </div>

          <div className={clsx("gp-sidebar-section", "gp-benefits-section-v2")} style={{ minHeight: "150px" }}>
            <div className={"gp-sidebar-header"}><span className={"gp-sidebar-title"}>Fondamentaux (FY)</span></div>
            {isFundamentalsPanelLoading ? (
              <div key="loading" className="p-2">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '120px', borderRadius: '8px' }} />
              </div>
            ) : !hasVerifiedEarnings ? (
              <SidebarUnavailableState message="Bénéfices non vérifiés pour ce titre via les sources BRVM disponibles." />
            ) : (
              <div key="ready">
                <div ref={benefitsChartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "120px" }}></div>
                <div className="d-flex justify-content-center gap-3 mt-1" style={{ fontSize: '0.75rem', color: '#787b86' }}>
                  <div className="d-flex align-items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22ab94' }}></span><span>Actual</span></div>
                  <div className="d-flex align-items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid #787b86' }}></span><span>Estimate</span></div>
                </div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: fundamentalsSource, tone: auditTone },
                    { label: "Date", value: `FY ${fundamentalsAuditYear}` },
                    { label: "Formule", value: "Bénéfice net lu BRVM, trié par exercice" },
                    { label: "Devise", value: "M FCFA" },
                  ]}
                />
              </div>
            )}
            {!isFundamentalsPanelLoading && hasVerifiedEarnings && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className={clsx("hover-lift", "hover-lift")}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                >
                  More info
                </button>
              </div>
            )}
          </div>

          <div className={"gp-sidebar-section"} style={{ borderBottom: 'none' }}>
            <div className={"gp-sidebar-header"}><span className={"gp-sidebar-title"}>Dividends</span></div>
            {isFundamentalsPanelLoading ? (
              <div key="loading" className="p-2">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '150px', borderRadius: '8px' }} />
              </div>
            ) : !hasVerifiedDividends ? (
              <SidebarUnavailableState message="Dividendes non vérifiés pour ce titre via les sources BRVM disponibles." />
            ) : (
              <div key="ready">
                <div ref={dividendsChartRef as React.RefObject<HTMLDivElement>} style={{ width: "100%", height: "150px" }}></div>
                <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                  <div className="d-flex align-items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#64748b' }}></span><span>Earnings retained</span></div>
                  <div className="d-flex align-items-center gap-1"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></span><span>Payout ratio</span></div>
                </div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: fundamentalsSource, tone: auditTone },
                    { label: "Date", value: `FY ${fundamentalsAuditYear}` },
                    { label: "Formule", value: "Yield=Div/Last; Payout=Div/EPS" },
                    { label: "Devise", value: auditCurrency },
                  ]}
                />
              </div>
            )}
            {!isFundamentalsPanelLoading && hasVerifiedDividends && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className={clsx("hover-lift", "hover-lift")}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                >
                  More info
                </button>
              </div>
            )}
          </div>

          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '8px' }}>
              <div className="d-flex justify-content-between align-items-center w-100">
                <span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Income statement</span>
                <div className="d-flex bg-[#1e222d] border border-[#363a45] p-[2px] rounded">
                  <button onClick={() => setIncomeViewMode('annual')} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '3px', border: 'none', backgroundColor: incomeViewMode === 'annual' ? '#2962ff' : 'transparent', color: incomeViewMode === 'annual' ? '#fff' : '#787b86' }}>Annual</button>
                  <button onClick={() => setIncomeViewMode('quarterly')} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '3px', border: 'none', backgroundColor: incomeViewMode === 'quarterly' ? '#2962ff' : 'transparent', color: incomeViewMode === 'quarterly' ? '#fff' : '#787b86' }}>Quarterly</button>
                </div>
              </div>
            </div>
            {isFundamentalsPanelLoading ? (
              <div key="loading" className="p-2">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '140px', borderRadius: '8px' }} />
              </div>
            ) : !canRenderIncomeStatement ? (
              <SidebarUnavailableState
                message={incomeViewMode === "quarterly" && dataMode === "real"
                  ? "Données trimestrielles non vérifiées: aucune estimation locale n'est affichée en mode réel."
                  : "Compte de résultat non vérifié pour ce titre via les sources BRVM disponibles."}
              />
            ) : (
              <div key="ready">
                <div ref={incomeChartRef} style={{ width: '100%', height: '140px' }}></div>
                <div className="d-flex justify-content-center gap-4 mt-2" style={{ fontSize: '11px', color: '#787b86' }}>
                  <div className="d-flex align-items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#2962ff' }}></span><span>Revenue</span></div>
                  <div className="d-flex align-items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ff9800' }}></span><span>Net margin %</span></div>
                </div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: fundamentalsSource, tone: auditTone },
                    { label: "Date", value: `FY ${fundamentalsAuditYear}` },
                    { label: "Formule", value: "Marge nette = Résultat net / Revenu" },
                    { label: "Devise", value: "M FCFA" },
                  ]}
                />
              </div>
            )}
            {!isFundamentalsPanelLoading && canRenderIncomeStatement && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className={clsx("hover-lift", "hover-lift")}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                >
                  More financials
                </button>
              </div>
            )}
          </div>

          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '12px' }}><span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Performance</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {performanceRows.map((p, i) => (
                <div key={i} className="d-flex flex-column align-items-center py-2" style={{ backgroundColor: (p.value || 0) >= 0 ? 'rgba(8, 153, 129, 0.08)' : 'rgba(242, 54, 69, 0.08)', borderRadius: '4px' }}>
                  <span style={{ fontSize: '10px', color: '#787b86' }}>{p.label}</span>
                  <span style={{ fontSize: '11px', color: (p.value || 0) >= 0 ? '#089981' : '#f23645', fontWeight: 700 }}>{p.value !== null ? `${p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}%` : '—'}</span>
                </div>
              ))}
            </div>
            <SidebarAuditTrail
              items={[
                { label: "Source", value: marketDataSource, tone: auditTone },
                { label: "Date", value: marketAuditDate },
                { label: "Formule", value: "(Close actuel - Close ancre) / Close ancre" },
                { label: "Devise", value: `% depuis clôtures ${auditCurrency}` },
              ]}
            />
          </div>

          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '12px' }}><span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Seasonals</span></div>
            {isLoading ? (
              <div key="loading" className="p-2">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '160px', borderRadius: '8px' }} />
              </div>
            ) : (
              <div key="ready">
                <div ref={seasonalChartRef} style={{ width: '100%', height: '160px' }}></div>
                <div className="d-flex justify-content-center gap-3 mt-2" style={{ fontSize: '11px', color: '#787b86' }}>
                  <div className="d-flex align-items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#2962ff' }}></span><span>2026</span></div>
                  <div className="d-flex align-items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#089981' }}></span><span>2025</span></div>
                  <div className="d-flex align-items-center gap-1.5"><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#f57c00' }}></span><span>2024</span></div>
                </div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: marketDataSource, tone: auditTone },
                    { label: "Date", value: marketAuditDate },
                    { label: "Formule", value: "(Close mois - Close début année) / Close début année" },
                    { label: "Devise", value: `% depuis clôtures ${auditCurrency}` },
                  ]}
                />
              </div>
            )}
            {!isLoading && (
              <div className="d-flex justify-content-center mt-3">
                <button
                  className={clsx("hover-lift", "hover-lift")}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                  onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                >
                  More seasonals
                </button>
              </div>
            )}
          </div>

          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '0px' }}><span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Technicals</span></div>
            {isLoading ? (
              <div key="loading" className="p-2">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '160px', borderRadius: '8px' }} />
              </div>
            ) : !technicalData ? (
              <SidebarUnavailableState message="Données techniques insuffisantes: RSI14 et SMA50 exigent au moins 50 clôtures vérifiées." />
            ) : (
              <div key="ready">
                <div ref={technicalsChartRef} style={{ width: '100%', height: '160px' }}></div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: marketDataSource, tone: auditTone },
                    { label: "Date", value: marketAuditDate },
                    { label: "Formule", value: "RSI14 Wilder + SMA20/SMA50; score 40/30/30" },
                    { label: "Devise", value: `Prix ${auditCurrency}` },
                  ]}
                />
                <div className="d-flex justify-content-center mt-2">
                  <button
                    className={clsx("hover-lift", "hover-lift")}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                  >
                    More technicals
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* [TENOR 2026] MODEL RATING WIDGET — derived from real fundamentals + technical data */}
          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '0px' }}>
              <span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Model rating</span>
            </div>
            {isLoading || isFundamentalsLoading ? (
              <div key="loading" style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className={"is-loading-skeleton"} style={{ width: '80%', height: '120px', borderRadius: '8px' }} />
              </div>
            ) : analystData ? (
              <div key="ready">
                <div ref={analystRatingChartRef} style={{ width: '100%', height: '160px' }} />
                {/* 1-year price target row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 4px 4px', borderTop: '1px solid rgba(42,46,57,0.5)', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>1 year model target</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#d1d4dc' }}>
                      {analystData.priceTarget > 0 ? analystData.priceTarget.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : 'N/A'}
                    </span>
                    {analystData.priceTarget > 0 && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: analystData.pctChange >= 0 ? '#22ab94' : '#f23645' }}>
                        ({analystData.pctChange >= 0 ? '+' : ''}{analystData.pctChange.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                </div>
                {/* See forecast button */}
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: `${marketDataSource} + ${fundamentalsSource}`, tone: auditTone },
                    { label: "Date", value: `Prix ${marketAuditDate} / FY ${fundamentalsAuditYear}` },
                    { label: "Formule", value: `Score=Tech 30% + P/E 30% + Yield 40%; Target=${analystData.targetFormula}` },
                    { label: "Devise", value: auditCurrency },
                  ]}
                />
                <div className="d-flex justify-content-center mt-2">
                  <button
                    className={clsx("hover-lift", "hover-lift")}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                  >
                    See source
                  </button>
                </div>
              </div>
            ) : (
              <SidebarUnavailableState message="Modèle indisponible: RSI/SMA50, P/E et dividendes vérifiés sont requis pour afficher un score traçable." />
            )}
          </div>

          {/* [TENOR 2026] HIGHEST YTM BONDS WIDGET */}
          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px', borderBottom: 'none' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '10px' }}>
              <span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Highest YTM bonds</span>
            </div>
            {bondsLoading ? (
              <div className="d-flex flex-column gap-2 px-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className="d-flex justify-content-between align-items-center">
                    <div className={"is-loading-skeleton"} style={{ width: '55%', height: '0.8rem' }} />
                    <div className={"is-loading-skeleton"} style={{ width: '20%', height: '0.8rem' }} />
                  </div>
                ))}
              </div>
            ) : topBonds.length > 0 ? (
              <>
                <div className="d-flex flex-column" style={{ gap: '0' }}>
                  {topBonds.map((bond, idx) => (
                    <div key={idx} className={clsx("row", "g-0")} style={{ padding: '7px 4px', borderBottom: idx < topBonds.length - 1 ? '1px solid rgba(42,46,57,0.4)' : 'none', }} >
                      <span className={clsx("col", "stat-label")} style={{ color: '#94a3b8', fontSize: '11px' }}>
                        {bond.maturityDate}
                      </span>
                      <span className={clsx("col-auto", "stat-value")} style={{ fontWeight: 700, color: '#22ab94', fontSize: '12px' }}>
                        {bond.ytm.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: "/api/market-data/brvm-bonds", tone: auditTone },
                    { label: "Date", value: marketAuditDate },
                    { label: "Formule", value: "Top 3 obligations triées par YTM décroissant" },
                    { label: "Devise", value: "% annualisé" },
                  ]}
                />
                <div className="d-flex justify-content-center mt-0">
                  <button
                    className={clsx("hover-lift", "hover-lift")}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    onClick={() => window.open(`https://www.brvm.org/fr/cours-obligations/0`, '_blank')}
                  >
                    More bonds
                  </button>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', padding: '12px 0' }}>
                Données obligataires indisponibles
              </div>
            )}
          </div>

          {/* [TENOR 2026] VOLATILITY TERM STRUCTURE WIDGET */}
          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px', borderBottom: 'none' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '10px' }}>
              <span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Historical volatility term structure</span>
            </div>
            {isLoading ? (
              <div key="loading" className="p-0">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '180px', borderRadius: '8px' }} />
              </div>
            ) : chartData.length < 5 ? (
              <SidebarUnavailableState message="Volatilité historique indisponible: au moins 5 clôtures vérifiées sont nécessaires." />
            ) : (
              <div key="ready">
                <div ref={volatilityChartRef} style={{ width: '100%', height: '180px' }}></div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: marketDataSource, tone: auditTone },
                    { label: "Date", value: marketAuditDate },
                    { label: "Formule", value: "HV=stdev(log returns) x sqrt(252)" },
                    { label: "Devise", value: "% annualisé" },
                  ]}
                />
              </div>
            )}
          </div>

          {/* [TENOR 2026] VOLATILITY CURVE (SKEW) WIDGET */}
          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '8px', paddingTop: '12px', borderBottom: 'none' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '10px' }}>
              <span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Historical volatility curve (28 days)</span>
            </div>
            {isLoading ? (
              <div key="loading" className="p-1">
                <div className={"is-loading-skeleton"} style={{ width: '100%', height: '180px', borderRadius: '8px' }} />
              </div>
            ) : chartData.length < 28 ? (
              <SidebarUnavailableState message="Courbe de volatilité indisponible: au moins 28 clôtures vérifiées sont nécessaires." />
            ) : (
              <div key="ready">
                <div ref={volatilityCurveChartRef} style={{ width: '100%', height: '180px' }}></div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: marketDataSource, tone: auditTone },
                    { label: "Date", value: marketAuditDate },
                    { label: "Formule", value: "Kernel gaussien sur rendements log² 28j" },
                    { label: "Devise", value: "% annualisé" },
                  ]}
                />
                <div className="d-flex justify-content-center mt-0 pt-0">
                  <button
                    className={clsx("hover-lift", "hover-lift")}
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#f1f5f9', border: '1px solid #363a45', borderRadius: '50px', padding: '4px 32px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
                    onClick={() => window.open(`https://www.brvm.org/fr/cours-actions/${security.ticker}`, '_blank')}
                  >
                    More on options
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* [TENOR 2026] COMPANY PROFILE WIDGET */}
          <div className={"gp-sidebar-section"} style={{ borderTop: '1px solid rgba(42, 46, 57, 0.5)', marginTop: '12px', paddingTop: '16px', borderBottom: 'none' }}>
            <div className={"gp-sidebar-header"} style={{ marginBottom: '12px' }}>
              <span className={"gp-sidebar-title"} style={{ fontSize: '14px', fontWeight: 700, color: '#d1d4dc' }}>Profile</span>
            </div>
            {isFundamentalsPanelLoading ? (
              <div className="d-flex flex-column gap-3 p-1">
                <div className="d-flex flex-column gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center">
                      <div className={"is-loading-skeleton"} style={{ width: "25%", height: "0.8rem" }} />
                      <div className={"is-loading-skeleton"} style={{ width: "40%", height: "0.8rem" }} />
                    </div>
                  ))}
                </div>
                <div style={{ position: 'relative', marginTop: '8px' }}>
                  <div className={"is-loading-skeleton"} style={{ width: '100%', height: '0.8rem', marginBottom: '6px' }} />
                  <div className={"is-loading-skeleton"} style={{ width: '90%', height: '0.8rem', marginBottom: '6px' }} />
                  <div className={"is-loading-skeleton"} style={{ width: '95%', height: '0.8rem', marginBottom: '6px' }} />
                  <div className={"is-loading-skeleton"} style={{ width: '70%', height: '0.8rem' }} />
                </div>
              </div>
            ) : (
              <>
                <div className="d-flex flex-column gap-2 mb-3">
                  {/* Website */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Website</span>
                    <a href={validFundamentals?.website || '#'} target="_blank" rel="noopener noreferrer" className="d-flex align-items-center gap-1" style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 600, textDecoration: 'none' }}>
                      {validFundamentals?.website ? (validFundamentals.website.replace(/^https?:\/\/|www\./g, '').split('/')[0]) : 'N/A'}
                      <i className="bi bi-box-arrow-up-right" style={{ fontSize: '10px' }}></i>
                    </a>
                  </div>
                  {/* Employees */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Employees (FY)</span>
                    <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 700 }}>{validFundamentals?.employees || 'N/A'}</span>
                  </div>
                  {/* ISIN */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>ISIN</span>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 700 }}>{security.isin || 'N/A'}</span>
                      <i className="bi bi-copy" style={{ fontSize: '10px', color: '#64748b', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(security.isin || '')}></i>
                    </div>
                  </div>
                  {/* FIGI */}
                  <div className="d-flex justify-content-between align-items-center">
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>FIGI</span>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{ fontSize: '12px', color: '#f1f5f9', fontWeight: 700 }}>{security.figi || 'N/A'}</span>
                      <i className="bi bi-copy" style={{ fontSize: '10px', color: '#64748b', cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(security.figi || '')}></i>
                    </div>
                  </div>
                </div>

                {/* Description (Expandable) */}
                <div style={{ position: 'relative' }}>
                  <p style={{
                    fontSize: '12px', lineHeight: '1.5', color: '#94a3b8', margin: 0,
                    display: '-webkit-box', WebkitLineClamp: isDescriptionExpanded ? 'none' : '4', WebkitBoxOrient: 'vertical', overflow: 'hidden'
                  }}>
                    {validFundamentals?.description || "Description de l'entreprise non disponible."}
                  </p>
                  <div className="d-flex justify-content-center mt-2">
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#f1f5f9' }}
                    >
                      <i className={clsx("bi", isDescriptionExpanded ? "bi-chevron-up" : "bi-chevron-down")} style={{ fontSize: '12px' }}></i>
                    </button>
                  </div>
                </div>
                <SidebarAuditTrail
                  items={[
                    { label: "Source", value: fundamentalsSource, tone: auditTone },
                    { label: "Date", value: `FY ${fundamentalsAuditYear}` },
                    { label: "Formule", value: "Profil BRVM normalisé; ISIN/FIGI catalogue" },
                    { label: "Devise", value: "N/A" },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <DividendHistoryModal
        isOpen={isDividendModalOpen}
        onClose={() => setIsDividendModalOpen(false)}
        ticker={security.ticker}
        dividends={validFundamentals?.dividends}
      />

      <div className={"gp-sidebar-toolbar"}>
        <div className={clsx("gp-toolbar-scroll-container", "p-1")}>
          {/* Watchlist Default Tab */}
          <button
            className={clsx(
              "gp-toolbar-btn",
              "hover-lift",
              !isObjectTreeOpen && "active",
              !isObjectTreeOpen && "btn-primary-outline",
              !isObjectTreeOpen && "border"
            )}
            title="Liste de surveillance"
            onClick={() => isObjectTreeOpen && onToggleObjectTree?.()}
          >
            <i className="bi bi-list" style={{ color: !isObjectTreeOpen ? "#2962ff" : "inherit" }}></i>
          </button>

          <button className={clsx("gp-toolbar-btn", "hover-lift")} title="Horaires"><i className="bi bi-stopwatch"></i></button>
          <button className={clsx("gp-toolbar-btn", "hover-lift")} title="Détails"><i className="bi bi-info-circle"></i></button>
          
          {/* [TENOR 2026 FEAT] Object Tree Toggle Button */}
          <button 
            className={clsx(
              "gp-toolbar-btn",
              "hover-lift",
              isObjectTreeOpen && "active",
              isObjectTreeOpen && "btn-primary-outline",
              isObjectTreeOpen && "border"
            )} 
            title="Object tree and data window"
            onClick={() => !isObjectTreeOpen && onToggleObjectTree?.()}
          >
            <i className="bi bi-stack" style={{ color: isObjectTreeOpen ? "#2962ff" : "inherit" }}></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default TechnicalAnalysisSidebar;
