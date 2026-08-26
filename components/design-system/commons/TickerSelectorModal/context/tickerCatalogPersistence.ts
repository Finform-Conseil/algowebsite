"use client";

export interface PersistedTickerCatalogSecurity {
  name: string;
  ticker: string;
  sector: string;
  marketCap: number | null;
  priceChangeD1: number | null;
  peRatio: number | null;
  returnYTD: number | null;
  revenueT12M: number | null;
  epsT12M: number | null;
  country: string;
  logoUrl?: string;
  isin?: string;
  exchange?: string;
  currency: string;
  status: "active" | "delisted";
}

export interface PersistedTickerCatalogSnapshot {
  marketTicker: string;
  securities: PersistedTickerCatalogSecurity[];
  totalCount: number;
  updatedAt: number;
  complete?: boolean;
}

const DATABASE_NAME = "AlgowayTickerCatalog";
const DATABASE_VERSION = 1;
const STORE_NAME = "ticker_catalog_snapshots";
const OPERATION_TIMEOUT_MS = 5000;
/**
 * Exact API snapshots remain displayable for one day while the caller
 * revalidates them silently after the short freshness window.
 */
const MAX_USABLE_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_SECURITIES = 5000;
const catalogWritesInFlight = new Map<string, Promise<boolean>>();
const inMemoryCatalogSnapshots = new Map<string, PersistedTickerCatalogSnapshot>();

// The API currently ignores the market filter and reports the mixed 635-row
// catalogue. Load its bounded seven-page envelope in parallel so the frontend
// can produce the exact market-scoped count without serial multi-minute waits.
export const CATALOG_SPECULATIVE_PAGE_LIMIT = 8;
export const BACKGROUND_PREFETCH_CONCURRENCY = 6;

export const getSpeculativeCatalogPages = (totalPages: number): number[] => {
  if (!Number.isSafeInteger(totalPages) || totalPages <= 1) return [];

  const lastSpeculativePage = Math.min(totalPages, CATALOG_SPECULATIVE_PAGE_LIMIT);
  return Array.from(
    { length: lastSpeculativePage - 1 },
    (_, index) => index + 2,
  );
};
let catalogDatabasePromise: Promise<IDBDatabase | null> | null = null;
let catalogDatabaseWriteQueue: Promise<void> = Promise.resolve();

const normalizeMarketTicker = (value: string) => value.trim().toUpperCase();
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const isNullableFiniteNumber = (value: unknown): value is number | null =>
  value === null || (typeof value === "number" && Number.isFinite(value));

const isPersistedSecurity = (value: unknown): value is PersistedTickerCatalogSecurity => {
  if (!isRecord(value)) return false;
  return typeof value.name === "string"
    && typeof value.ticker === "string"
    && typeof value.sector === "string"
    && isNullableFiniteNumber(value.marketCap)
    && isNullableFiniteNumber(value.priceChangeD1)
    && isNullableFiniteNumber(value.peRatio)
    && isNullableFiniteNumber(value.returnYTD)
    && isNullableFiniteNumber(value.revenueT12M)
    && isNullableFiniteNumber(value.epsT12M)
    && typeof value.country === "string"
    && (value.logoUrl === undefined || typeof value.logoUrl === "string")
    && (value.isin === undefined || typeof value.isin === "string")
    && (value.exchange === undefined || typeof value.exchange === "string")
    && typeof value.currency === "string"
    && (value.status === "active" || value.status === "delisted");
};

const isUsableSnapshot = (
  value: unknown,
  marketTicker: string,
): value is PersistedTickerCatalogSnapshot => {
  if (!isRecord(value) || value.marketTicker !== marketTicker) return false;
  if (!Array.isArray(value.securities) || value.securities.length > MAX_SECURITIES) return false;
  const totalCount = value.totalCount;
  if (typeof totalCount !== "number" || !Number.isSafeInteger(totalCount) || totalCount < value.securities.length) return false;
  if (value.complete !== undefined && typeof value.complete !== "boolean") return false;
  if (typeof value.updatedAt !== "number" || !Number.isFinite(value.updatedAt) || value.updatedAt <= 0) return false;
  if (Date.now() - value.updatedAt > MAX_USABLE_SNAPSHOT_AGE_MS) return false;
  return value.securities.every(isPersistedSecurity);
};

const canUseIndexedDb = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDatabase = (): Promise<IDBDatabase | null> => {
  if (!canUseIndexedDb()) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) database.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    request.onblocked = () => reject(new Error("IndexedDB open blocked"));
  });
};

const withTimeout = async <T,>(operation: Promise<T>): Promise<T> => {
  let timer: number | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error("Ticker catalog persistence timed out")), OPERATION_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
};

const getCatalogDatabase = async (): Promise<IDBDatabase | null> => {
  if (catalogDatabasePromise) return catalogDatabasePromise;

  catalogDatabasePromise = withTimeout(openDatabase()).catch((error) => {
    catalogDatabasePromise = null;
    throw error;
  });
  return catalogDatabasePromise;
};

const readSnapshot = (database: IDBDatabase, marketTicker: string) =>
  new Promise<unknown>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(marketTicker);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
  });

const writeSnapshot = (
  database: IDBDatabase,
  marketTicker: string,
  snapshot: PersistedTickerCatalogSnapshot,
) => new Promise<void>((resolve, reject) => {
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed"));
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB write aborted"));
  transaction.objectStore(STORE_NAME).put(snapshot, marketTicker);
});

const describePersistenceError = (error: unknown) => error instanceof Error
  ? { name: error.name, message: error.message }
  : { value: error };

export const readPersistedTickerCatalog = async (
  marketTicker: string,
): Promise<PersistedTickerCatalogSnapshot | null> => {
  const normalizedMarketTicker = normalizeMarketTicker(marketTicker);
  if (!normalizedMarketTicker || !canUseIndexedDb()) return null;

  const memorySnapshot = inMemoryCatalogSnapshots.get(normalizedMarketTicker);
  if (memorySnapshot && isUsableSnapshot(memorySnapshot, normalizedMarketTicker)) return memorySnapshot;
  if (memorySnapshot) inMemoryCatalogSnapshots.delete(normalizedMarketTicker);

  try {
    const database = await getCatalogDatabase();
    if (!database) return null;
    const value = await withTimeout(readSnapshot(database, normalizedMarketTicker));
    if (!isUsableSnapshot(value, normalizedMarketTicker)) return null;
    inMemoryCatalogSnapshots.set(normalizedMarketTicker, value);
    return value;
  } catch (error) {
    console.warn("[TickerSelector] Catalog cache read failed", {
      market: normalizedMarketTicker,
      error: describePersistenceError(error),
    });
    return null;
  }
};

const persistCatalogSnapshot = async (
  marketTicker: string,
  snapshot: PersistedTickerCatalogSnapshot,
): Promise<boolean> => {
  const writeOperation = catalogDatabaseWriteQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await getCatalogDatabase();
      if (!database) return false;
      await withTimeout(writeSnapshot(database, marketTicker, snapshot));
      return true;
    });
  catalogDatabaseWriteQueue = writeOperation.then(() => undefined, () => undefined);

  try {
    return await writeOperation;
  } catch (error) {
    console.warn("[TickerSelector] Catalog cache write failed", {
      market: marketTicker,
      error: describePersistenceError(error),
    });
    return false;
  }
};

export const writePersistedTickerCatalog = async (
  marketTicker: string,
  securities: readonly PersistedTickerCatalogSecurity[],
  totalCount: number,
  complete = true,
): Promise<boolean> => {
  const normalizedMarketTicker = normalizeMarketTicker(marketTicker);
  if (!normalizedMarketTicker || !canUseIndexedDb()) return false;
  if (!Number.isSafeInteger(totalCount) || totalCount < securities.length) return false;
  if (securities.length > MAX_SECURITIES || !securities.every(isPersistedSecurity)) return false;

  const existingWrite = catalogWritesInFlight.get(normalizedMarketTicker);
  if (existingWrite) {
    if (!complete) return existingWrite;
    await existingWrite;
  }

  const writeAfterWait = catalogWritesInFlight.get(normalizedMarketTicker);
  if (writeAfterWait) await writeAfterWait;

  const snapshot: PersistedTickerCatalogSnapshot = {
    marketTicker: normalizedMarketTicker,
    securities: securities.map((security) => ({ ...security })),
    totalCount,
    updatedAt: Date.now(),
    complete,
  };
  inMemoryCatalogSnapshots.set(normalizedMarketTicker, snapshot);
  const writePromise = persistCatalogSnapshot(normalizedMarketTicker, snapshot);
  catalogWritesInFlight.set(normalizedMarketTicker, writePromise);
  try {
    return await writePromise;
  } finally {
    if (catalogWritesInFlight.get(normalizedMarketTicker) === writePromise) {
      catalogWritesInFlight.delete(normalizedMarketTicker);
    }
  }
};
