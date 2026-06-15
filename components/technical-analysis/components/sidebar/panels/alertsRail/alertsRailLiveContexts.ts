import { BRVM_SECURITIES } from "@/core/data/brvm-securities";
import { fetchDailyCsvData } from "../../../../hooks/MarketData/marketData.fetchers";
import { resolveBRVMDatasetTicker } from "../../../../hooks/MarketData/marketData.parsers";
import type { ChartDataPoint } from "../../../../lib/Indicators/TechnicalIndicators";
import { buildIndicatorAlertValuesFromSeries } from "./alertsRailIndicatorMetrics";
import type { AlertsRailContext, AlertsRailContextByTicker } from "./alertsRailTypes";

export interface AlertsRailLiveSnapshot {
  code?: unknown;
  price?: unknown;
  source?: unknown;
  sourceLabel?: unknown;
  symbol?: unknown;
  ticker?: unknown;
  variation?: unknown;
  variationNum?: unknown;
  volume?: unknown;
}

export const buildLiveAlertContext = (snapshot: AlertsRailLiveSnapshot): AlertsRailContext | null => {
  const ticker = readTicker(snapshot);
  const price = toFiniteNumber(snapshot.price);
  if (!ticker || price === null) return null;
  const security = BRVM_SECURITIES.find((entry) => entry.ticker === ticker);
  const currency = security?.currency || "XOF";
  const changePercent = readChangePercent(snapshot);
  const volume = toFiniteNumber(snapshot.volume);
  return {
    changeLabel: formatPercent(changePercent),
    changePercent,
    changeTone: (changePercent ?? 0) > 0 ? "success" : (changePercent ?? 0) < 0 ? "danger" : "neutral",
    currentPrice: price,
    defaultThreshold: price.toLocaleString("fr-FR", { maximumFractionDigits: 0 }),
    dividendLabel: "Dividende non charge",
    hasDividend: false,
    hasNews: false,
    marketLabel: (security?.exchange || "BRVM") + " · " + (security?.country || "UEMOA"),
    name: security?.name || ticker,
    newsLabel: "Flux non charge",
    priceLabel: formatCurrency(price, currency),
    sessionLabel: readText(snapshot.sourceLabel) || readText(snapshot.source) || "Snapshot marche",
    ticker,
    volumeLabel: volume === null ? "N/D" : volume.toLocaleString("fr-FR"),
    volumeRatio: null,
  };
};

export const fetchLiveAlertContexts = async (
  tickers: string[],
  signal?: AbortSignal,
  indicatorTickers: string[] = [],
): Promise<AlertsRailContextByTicker> => {
  const wanted = new Set(tickers.map(normalizeTicker).filter(Boolean));
  if (wanted.size === 0) return {};

  const contexts = await fetchBaseLiveAlertContexts(wanted, signal);
  const indicatorWanted = new Set(indicatorTickers.map(normalizeTicker).filter((ticker) => wanted.has(ticker)));
  if (indicatorWanted.size === 0 || signal?.aborted) return contexts;

  return enrichContextsWithDailyIndicators(contexts, indicatorWanted, signal);
};

const fetchBaseLiveAlertContexts = async (
  wanted: Set<string>,
  signal?: AbortSignal,
): Promise<AlertsRailContextByTicker> => {
  try {
    const response = await fetch("/api/market-data/brvm-live?ticker=ALL", { cache: "no-store", signal });
    if (!response.ok) return {};
    const rows = readRows(await response.json());
    return rows.reduce<AlertsRailContextByTicker>((contexts, row) => {
      const context = buildLiveAlertContext(row);
      if (context && wanted.has(context.ticker)) contexts[context.ticker] = context;
      return contexts;
    }, {});
  } catch (error) {
    if (signal?.aborted) throw error;
    return {};
  }
};

const enrichContextsWithDailyIndicators = async (
  contexts: AlertsRailContextByTicker,
  tickers: Set<string>,
  signal?: AbortSignal,
): Promise<AlertsRailContextByTicker> => {
  const next: AlertsRailContextByTicker = { ...contexts };
  await Promise.all(Array.from(tickers).map(async (ticker) => {
    if (signal?.aborted) return;
    try {
      const daily = await fetchDailyCsvData(resolveBRVMDatasetTicker(ticker));
      if (signal?.aborted || daily.length === 0) return;
      const baseContext = next[ticker] ?? buildDailyAlertContext(ticker, daily);
      if (!baseContext) return;
      const indicatorValues = buildIndicatorAlertValuesFromSeries(daily, {
        livePrice: baseContext.currentPrice,
        source: "daily-csv",
        timeframe: "1D",
        updatedAt: daily[daily.length - 1]?.time,
      });
      if (!indicatorValues) return;
      next[ticker] = { ...baseContext, indicatorValuesByKey: indicatorValues };
    } catch (error) {
      if (!signal?.aborted && typeof console !== "undefined") {
        console.warn("Alerts indicator context refresh failed for " + ticker, error);
      }
    }
  }));
  return next;
};

export const buildDailyAlertContext = (ticker: string, data: ChartDataPoint[]): AlertsRailContext | null => {
  const normalizedTicker = normalizeTicker(ticker);
  const last = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;
  if (!normalizedTicker || !last || !Number.isFinite(last.close) || last.close <= 0) return null;

  const security = BRVM_SECURITIES.find((entry) => entry.ticker === normalizedTicker);
  const currency = security?.currency || "XOF";
  const changePercent = previous && Number.isFinite(previous.close) && previous.close > 0
    ? ((last.close - previous.close) / previous.close) * 100
    : null;
  const volume = Number.isFinite(last.volume) && last.volume > 0 ? last.volume : null;
  const averageVolume = calculateAverageVolume(data.slice(0, -1), 30);

  return {
    changeLabel: formatPercent(changePercent),
    changePercent,
    changeTone: (changePercent ?? 0) > 0 ? "success" : (changePercent ?? 0) < 0 ? "danger" : "neutral",
    currentPrice: last.close,
    defaultThreshold: last.close.toLocaleString("fr-FR", { maximumFractionDigits: 0 }),
    dividendLabel: "Dividende non charge",
    hasDividend: false,
    hasNews: false,
    marketLabel: (security?.exchange || "BRVM") + " · " + (security?.country || "UEMOA"),
    name: security?.name || normalizedTicker,
    newsLabel: "Flux non charge",
    priceLabel: formatCurrency(last.close, currency),
    sessionLabel: "Daily CSV",
    ticker: normalizedTicker,
    volumeLabel: volume === null ? "N/D" : volume.toLocaleString("fr-FR"),
    volumeRatio: volume !== null && averageVolume !== null && averageVolume > 0 ? volume / averageVolume : null,
  };
};
const readRows = (value: unknown): AlertsRailLiveSnapshot[] => {
  if (Array.isArray(value)) return value as AlertsRailLiveSnapshot[];
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (Array.isArray(record.data)) return record.data as AlertsRailLiveSnapshot[];
  if (Array.isArray(record.rows)) return record.rows as AlertsRailLiveSnapshot[];
  if (Array.isArray(record.securities)) return record.securities as AlertsRailLiveSnapshot[];
  return [];
};

const readTicker = (snapshot: AlertsRailLiveSnapshot) => normalizeTicker(
  readText(snapshot.symbol) || readText(snapshot.ticker) || readText(snapshot.code) || "",
);

const normalizeTicker = (ticker: string) => ticker.trim().toUpperCase();

const readChangePercent = (snapshot: AlertsRailLiveSnapshot) => {
  const injected = toFiniteNumber(snapshot.variationNum);
  if (injected !== null) return injected;
  const text = readText(snapshot.variation);
  if (!text) return null;
  const parsed = Number(text.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}%`;
};

const formatCurrency = (value: number | null | undefined, currency: string) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return `${formatNumber(value)} ${currency}`;
};

const readText = (value: unknown) => (typeof value === "string" && value.trim().length > 0 ? value.trim() : null);

const toFiniteNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const calculateAverageVolume = (data: ChartDataPoint[], period: number): number | null => {
  const values = data.slice(-period).map((point) => point.volume).filter((value) => Number.isFinite(value) && value > 0);
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};
