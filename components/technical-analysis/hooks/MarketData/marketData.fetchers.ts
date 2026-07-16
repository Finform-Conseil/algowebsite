import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { parseBRVMCSV } from "./marketData.parsers";

type ErrorWithStatus = Error & { status?: number };

const DAILY_FETCH_TIMEOUT_MS = 45_000;
const DAILY_FETCH_MAX_ATTEMPTS = 2;
const DAILY_FETCH_RETRY_BASE_DELAY_MS = 900;
const DAILY_REFRESH_BUCKET_MS = 5 * 60 * 1000;
const RETRYABLE_DAILY_FETCH_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const dailyDataCache = new Map<string, { data: ChartDataPoint[]; fetchedAt: number }>();
const dailyDataFetches = new Map<string, Promise<ChartDataPoint[]>>();

export const fetchDailyCsvData = (datasetTicker: string): Promise<ChartDataPoint[]> => {
  const now = Date.now();
  const cachedData = dailyDataCache.get(datasetTicker);
  if (cachedData && now - cachedData.fetchedAt < DAILY_REFRESH_BUCKET_MS) {
    return Promise.resolve(cachedData.data);
  }

  const inflightFetch = dailyDataFetches.get(datasetTicker);
  if (inflightFetch) return inflightFetch;

  const refreshBucket = Math.floor(now / DAILY_REFRESH_BUCKET_MS);
  const dailyUrl = `/api/proxy/9/Fredysessie/brvm-data-public/main/data/${datasetTicker}/${datasetTicker}.daily.csv?refresh=${refreshBucket}`;
  const request = fetchDailyCsvTextWithRetry(dailyUrl)
    .then((csvText) => {
      const parsedDaily = parseBRVMCSV(csvText);
      dailyDataCache.set(datasetTicker, { data: parsedDaily, fetchedAt: Date.now() });
      return parsedDaily;
    })
    .finally(() => {
      dailyDataFetches.delete(datasetTicker);
    });

  dailyDataFetches.set(datasetTicker, request);
  return request;
};


const fetchDailyCsvTextWithRetry = async (dailyUrl: string): Promise<string> => {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < DAILY_FETCH_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await fetchDailyCsvText(dailyUrl);
    } catch (error) {
      lastError = error;
      if (attempt >= DAILY_FETCH_MAX_ATTEMPTS - 1 || !isRetryableDailyFetchError(error)) throw error;
      await delayDailyFetchRetry(resolveDailyFetchRetryDelay(attempt));
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Daily data fetch failed.");
};

const fetchDailyCsvText = async (dailyUrl: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => {
    controller.abort("Daily data request timed out.");
  }, DAILY_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(dailyUrl, {
      cache: "no-store",
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const error: ErrorWithStatus = new Error(`HTTP ${response.status} for daily data`);
      error.status = response.status;
      throw error;
    }

    return response.text();
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
};

const isRetryableDailyFetchError = (error: unknown): boolean => {
  const status = error instanceof Error ? (error as ErrorWithStatus).status : undefined;
  return status === undefined || RETRYABLE_DAILY_FETCH_STATUSES.has(status);
};

const resolveDailyFetchRetryDelay = (attempt: number): number => (
  DAILY_FETCH_RETRY_BASE_DELAY_MS * (2 ** attempt)
);

const delayDailyFetchRetry = (delayMs: number): Promise<void> => new Promise((resolve) => {
  globalThis.setTimeout(resolve, delayMs);
});
