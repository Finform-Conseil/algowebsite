import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { parseBRVMCSV } from "./marketData.parsers";

type ErrorWithStatus = Error & { status?: number };

const DAILY_FETCH_TIMEOUT_MS = 18_000;
const dailyDataCache = new Map<string, ChartDataPoint[]>();
const dailyDataFetches = new Map<string, Promise<ChartDataPoint[]>>();

export const fetchDailyCsvData = (datasetTicker: string): Promise<ChartDataPoint[]> => {
  const cachedData = dailyDataCache.get(datasetTicker);
  if (cachedData) return Promise.resolve(cachedData);

  const inflightFetch = dailyDataFetches.get(datasetTicker);
  if (inflightFetch) return inflightFetch;

  const dailyUrl = `/api/proxy/9/Fredysessie/brvm-data-public/main/data/${datasetTicker}/${datasetTicker}.daily.csv`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DAILY_FETCH_TIMEOUT_MS);

  const request = fetch(dailyUrl, { cache: "force-cache", signal: controller.signal })
    .then((response) => {
      if (!response.ok) {
        const error: ErrorWithStatus = new Error(`HTTP ${response.status} for daily data`);
        error.status = response.status;
        throw error;
      }
      return response.text();
    })
    .then((csvText) => {
      const parsedDaily = parseBRVMCSV(csvText);
      dailyDataCache.set(datasetTicker, parsedDaily);
      return parsedDaily;
    })
    .finally(() => {
      window.clearTimeout(timeoutId);
      dailyDataFetches.delete(datasetTicker);
    });

  dailyDataFetches.set(datasetTicker, request);
  return request;
};
