import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

const DATABASE_NAME = "AlgowayMarketData_DB";
const STORE_NAME = "ohlcv_cache";
const DATABASE_VERSION = 1;
const CACHE_KEY_PREFIX = "ohlcv:";
const STORAGE_TIMEOUT_MS = 5_000;
// IndexedDB is a bootstrap snapshot, not a second historical database. Three
// API pages keep the first viewport useful while historical pagination remains
// owned by the API/Redux flow.
const BOOTSTRAP_PAGE_SIZE = 100;
const MAX_BOOTSTRAP_POINTS = BOOTSTRAP_PAGE_SIZE * 3;
const MAX_VISIBLE_STALE_AGE_MS = 10 * 60 * 1_000;

type PersistedMarketData = {
  key: string;
  marketTicker: string;
  ticker: string;
  data: ChartDataPoint[];
  updatedAt: number;
};

const canUseIndexedDB = (): boolean => (
  typeof window !== "undefined" && "indexedDB" in window
);

const normalizeTicker = (ticker: string): string => ticker.trim().toUpperCase();
const normalizeMarketTicker = (marketTicker: string): string => normalizeTicker(marketTicker) || "UNKNOWN";
const buildScopedKey = (marketTicker: string, ticker: string): string =>
  CACHE_KEY_PREFIX + normalizeMarketTicker(marketTicker) + ":" + normalizeTicker(ticker);
const buildLegacyKey = (ticker: string): string => CACHE_KEY_PREFIX + normalizeTicker(ticker);

const withTimeout = <T,>(request: Promise<T>): Promise<T> => new Promise((resolve, reject) => {
  const timer = window.setTimeout(() => reject(new Error("Market data cache timed out")), STORAGE_TIMEOUT_MS);
  request.then(
    (value) => { window.clearTimeout(timer); resolve(value); },
    (error: unknown) => { window.clearTimeout(timer); reject(error); },
  );
});

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!canUseIndexedDB()) {
    reject(new Error("IndexedDB is not supported"));
    return;
  }

  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("Unable to open market data cache"));
});

const isChartDataPoint = (value: unknown): value is ChartDataPoint => {
  if (!value || typeof value !== "object") return false;
  const point = value as Partial<ChartDataPoint>;
  const timeValue = point.time;
  const hasValidTime = Number.isFinite(Number(timeValue)) || (typeof timeValue === "string" && Number.isFinite(Date.parse(timeValue)));
  return hasValidTime
    && Number.isFinite(Number(point.open))
    && Number.isFinite(Number(point.high))
    && Number.isFinite(Number(point.low))
    && Number.isFinite(Number(point.close));
};

const readRecord = async (database: IDBDatabase, key: string): Promise<Partial<PersistedMarketData> | undefined> => {
  const value = await withTimeout(new Promise<unknown>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to read market data cache"));
  }));
  return value as Partial<PersistedMarketData> | undefined;
};

const extractFreshData = (record: Partial<PersistedMarketData> | undefined): ChartDataPoint[] => {
  if (!record || !Array.isArray(record.data)) return [];
  const updatedAt = record.updatedAt;
  if (typeof updatedAt !== "number" || !Number.isFinite(updatedAt) || Date.now() - updatedAt > MAX_VISIBLE_STALE_AGE_MS) return [];
  return record.data.filter(isChartDataPoint).slice(-MAX_BOOTSTRAP_POINTS);
};

export const readPersistedMarketData = async (marketTicker: string, ticker: string): Promise<ChartDataPoint[]> => {
  const normalizedMarketTicker = normalizeMarketTicker(marketTicker);
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker || !canUseIndexedDB()) return [];

  let database: IDBDatabase | null = null;
  try {
    database = await withTimeout(openDatabase());
    const scopedData = extractFreshData(await readRecord(database, buildScopedKey(normalizedMarketTicker, normalizedTicker)));
    if (scopedData.length > 0) return scopedData;
    if (normalizedMarketTicker !== "BRVM") return [];
    return extractFreshData(await readRecord(database, buildLegacyKey(normalizedTicker)));
  } catch (error) {
    console.warn("Market data cache read failed", error);
    return [];
  } finally {
    database?.close();
  }
};

const persistMarketData = async (
  marketTicker: string,
  ticker: string,
  data: ChartDataPoint[],
): Promise<void> => {
  const normalizedMarketTicker = normalizeMarketTicker(marketTicker);
  const normalizedTicker = normalizeTicker(ticker);
  const validData = data.filter(isChartDataPoint).slice(-MAX_BOOTSTRAP_POINTS);
  if (!normalizedTicker || validData.length === 0 || !canUseIndexedDB()) return;

  let database: IDBDatabase | null = null;
  try {
    database = await withTimeout(openDatabase());
    const databaseHandle = database;
    await withTimeout(new Promise<void>((resolve, reject) => {
      const transaction = databaseHandle.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({
        key: buildScopedKey(normalizedMarketTicker, normalizedTicker),
        marketTicker: normalizedMarketTicker,
        ticker: normalizedTicker,
        data: validData,
        updatedAt: Date.now(),
      } satisfies PersistedMarketData);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write market data cache"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Market data cache write aborted"));
    }));
  } catch (error) {
    console.warn("Market data cache write failed", error);
  } finally {
    database?.close();
  }
};

// Serialize writes so a delayed older response cannot overtake a newer commit
// and leave IndexedDB with a snapshot that predates the visible Redux series.
let persistedWriteQueue: Promise<void> = Promise.resolve();

export const writePersistedMarketData = (
  marketTicker: string,
  ticker: string,
  data: ChartDataPoint[],
): Promise<void> => {
  const nextWrite = persistedWriteQueue.then(() => persistMarketData(marketTicker, ticker, data));
  persistedWriteQueue = nextWrite.catch(() => undefined);
  return nextWrite;
};
