import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

const DATABASE_NAME = "AlgowayMarketData_DB";
const STORE_NAME = "ohlcv_cache";
const DATABASE_VERSION = 1;
const CACHE_KEY_PREFIX = "ohlcv:";
const STORAGE_TIMEOUT_MS = 5_000;
const STORAGE_FAILURE_COOLDOWN_MS = 30_000;
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

const createStorageTimeoutError = (operation: string): Error =>
  new Error(`Market data cache ${operation} timed out`);

let databasePromise: Promise<IDBDatabase> | null = null;
let databaseConnection: IDBDatabase | null = null;
let storageUnavailableUntil = 0;

const isStorageTemporarilyUnavailable = (): boolean => Date.now() < storageUnavailableUntil;

const isStorageLatencyFailure = (error: unknown): boolean => (
  error instanceof Error
  && /^Market data cache (open|read|write) timed out$/.test(error.message)
);

const tripStorageCircuit = (error: unknown): boolean => {
  if (!isStorageLatencyFailure(error)) return false;
  storageUnavailableUntil = Math.max(storageUnavailableUntil, Date.now() + STORAGE_FAILURE_COOLDOWN_MS);
  databaseConnection?.close();
  databaseConnection = null;
  databasePromise = null;
  return true;
};

const openDatabaseConnection = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!canUseIndexedDB()) {
    reject(new Error("IndexedDB is not supported"));
    return;
  }

  let settled = false;
  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  const timeoutId = window.setTimeout(() => {
    if (settled) return;
    settled = true;
    reject(createStorageTimeoutError("open"));
  }, STORAGE_TIMEOUT_MS);

  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    }
  };
  request.onsuccess = () => {
    if (settled) {
      request.result.close();
      return;
    }
    settled = true;
    window.clearTimeout(timeoutId);
    const database = request.result;
    databaseConnection = database;
    database.onversionchange = () => {
      database.close();
      if (databaseConnection === database) databaseConnection = null;
      databasePromise = null;
    };
    resolve(database);
  };
  request.onerror = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeoutId);
    reject(request.error ?? new Error("Unable to open market data cache"));
  };
});

const getDatabase = (): Promise<IDBDatabase> => {
  if (!databasePromise) {
    databasePromise = openDatabaseConnection().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
};

const runTransaction = <T,>(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  operation: string,
  execute: (store: IDBObjectStore, setResult: (value: T) => void) => void,
): Promise<T> => new Promise((resolve, reject) => {
  let settled = false;
  let result!: T;
  const transaction = database.transaction(STORE_NAME, mode);

  const finishWithError = (error: unknown) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeoutId);
    reject(error);
  };

  const timeoutId = window.setTimeout(() => {
    if (settled) return;
    const timeoutError = createStorageTimeoutError(operation);
    try {
      transaction.abort();
    } catch {
      // The transaction may already be finishing; the timeout remains authoritative.
    }
    finishWithError(timeoutError);
  }, STORAGE_TIMEOUT_MS);

  transaction.oncomplete = () => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeoutId);
    resolve(result);
  };
  transaction.onerror = () => finishWithError(
    transaction.error ?? new Error(`Unable to ${operation} market data cache`),
  );
  transaction.onabort = () => finishWithError(
    transaction.error ?? new Error(`Market data cache ${operation} aborted`),
  );

  try {
    execute(transaction.objectStore(STORE_NAME), (value) => {
      result = value;
    });
  } catch (error) {
    try {
      transaction.abort();
    } catch {
      // Preserve the original synchronous failure.
    }
    finishWithError(error);
  }
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
  const value = await runTransaction<unknown>(database, "readonly", "read", (store, setResult) => {
    const request = store.get(key);
    request.onsuccess = () => setResult(request.result);
  });
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
  if (!normalizedTicker || !canUseIndexedDB() || isStorageTemporarilyUnavailable()) return [];

  try {
    const database = await getDatabase();
    const scopedData = extractFreshData(await readRecord(database, buildScopedKey(normalizedMarketTicker, normalizedTicker)));
    if (scopedData.length > 0) return scopedData;
    if (normalizedMarketTicker !== "BRVM") return [];
    return extractFreshData(await readRecord(database, buildLegacyKey(normalizedTicker)));
  } catch (error) {
    if (!tripStorageCircuit(error)) {
      console.warn("Market data cache read failed", error);
    }
    return [];
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
  if (!normalizedTicker || validData.length === 0 || !canUseIndexedDB() || isStorageTemporarilyUnavailable()) return;

  try {
    const database = await getDatabase();
    await runTransaction<void>(database, "readwrite", "write", (store, setResult) => {
      store.put({
        key: buildScopedKey(normalizedMarketTicker, normalizedTicker),
        marketTicker: normalizedMarketTicker,
        ticker: normalizedTicker,
        data: validData,
        updatedAt: Date.now(),
      } satisfies PersistedMarketData);
      setResult(undefined);
    });
  } catch (error) {
    if (!tripStorageCircuit(error)) {
      console.warn("Market data cache write failed", error);
    }
  }
};

type PendingPersistedWrite = {
  marketTicker: string;
  ticker: string;
  data: ChartDataPoint[];
  waiters: Array<{ resolve: () => void; reject: (error: unknown) => void }>;
};

// A fast history/bootstrap sequence can commit several progressively larger
// snapshots before IndexedDB finishes the first transaction. Persisting every
// intermediate state only creates write amplification. Keep at most one pending
// snapshot per market/ticker and let the newest snapshot supersede older queued
// work; the write already in flight is allowed to finish normally.
const pendingWrites = new Map<string, PendingPersistedWrite>();
const activeWriteKeys = new Set<string>();

const drainPersistedWrites = async (key: string): Promise<void> => {
  if (activeWriteKeys.has(key)) return;
  activeWriteKeys.add(key);

  try {
    while (true) {
      const pending = pendingWrites.get(key);
      if (!pending) break;
      pendingWrites.delete(key);

      try {
        await persistMarketData(pending.marketTicker, pending.ticker, pending.data);
        pending.waiters.forEach(({ resolve }) => resolve());
      } catch (error) {
        pending.waiters.forEach(({ reject }) => reject(error));
      }
    }
  } finally {
    activeWriteKeys.delete(key);
    if (pendingWrites.has(key)) {
      void drainPersistedWrites(key);
    }
  }
};

export const writePersistedMarketData = (
  marketTicker: string,
  ticker: string,
  data: ChartDataPoint[],
): Promise<void> => {
  const key = buildScopedKey(marketTicker, ticker);

  return new Promise<void>((resolve, reject) => {
    const existing = pendingWrites.get(key);
    if (existing) {
      existing.marketTicker = marketTicker;
      existing.ticker = ticker;
      existing.data = data;
      existing.waiters.push({ resolve, reject });
    } else {
      pendingWrites.set(key, {
        marketTicker,
        ticker,
        data,
        waiters: [{ resolve, reject }],
      });
    }

    void drainPersistedWrites(key);
  });
};
