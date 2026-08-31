"use client";

export const DEFAULT_PRIMARY_TICKER = "ORANGE_CI";

const DATABASE_NAME = "AlgowayPreferences";
const DATABASE_VERSION = 1;
const STORE_NAME = "preferences";
const SELECTED_TICKER_KEY = "primary_ticker";
const LEGACY_STORAGE_KEY = "algoway_selected_ticker";
let writeQueue: Promise<void> = Promise.resolve();

const normalizeTicker = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toUpperCase();
  return normalized || null;
};

const canUseIndexedDb = () =>
  typeof window !== "undefined" && typeof window.indexedDB !== "undefined";

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) {
      request.result.createObjectStore(STORE_NAME);
    }
  };
  request.onsuccess = () => {
    request.result.onversionchange = () => request.result.close();
    resolve(request.result);
  };
  request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  request.onblocked = () => reject(new Error("IndexedDB open blocked"));
});

const readTicker = (database: IDBDatabase): Promise<unknown> => new Promise((resolve, reject) => {
  const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(SELECTED_TICKER_KEY);
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
});

const writeTicker = (database: IDBDatabase, ticker: string): Promise<void> => new Promise((resolve, reject) => {
  const transaction = database.transaction(STORE_NAME, "readwrite");
  transaction.objectStore(STORE_NAME).put(ticker, SELECTED_TICKER_KEY);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB write failed"));
  transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB write aborted"));
});

const readLegacyTicker = (): string | null => {
  try {
    return normalizeTicker(window.localStorage.getItem(LEGACY_STORAGE_KEY));
  } catch {
    return null;
  }
};

const clearLegacyTicker = () => {
  try {
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // IndexedDB remains the sole authority even when legacy cleanup is blocked.
  }
};

export const readPersistedTickerSymbol = async (): Promise<string | null> => {
  if (!canUseIndexedDb()) return null;

  let database: IDBDatabase | null = null;

  try {
    database = await openDatabase();
    const persistedTicker = normalizeTicker(await readTicker(database));
    if (persistedTicker) return persistedTicker;

    const legacyTicker = readLegacyTicker();
    if (!legacyTicker) return null;
    await writeTicker(database, legacyTicker);
    clearLegacyTicker();
    return legacyTicker;
  } catch (error) {
    console.warn("[TickerSelector] Preference read failed", error);
    return null;
  } finally {
    database?.close();
  }
};

export const writePersistedTickerSymbol = async (ticker: string): Promise<void> => {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker || !canUseIndexedDb()) return;

  try {
    const operation = writeQueue.catch(() => undefined).then(async () => {
      const database = await openDatabase();
      try {
        await writeTicker(database, normalizedTicker);
        clearLegacyTicker();
      } finally {
        database.close();
      }
    });
    writeQueue = operation.then(() => undefined, () => undefined);
    await operation;
  } catch (error) {
    console.warn("[TickerSelector] Preference write failed", error);
  }
};
