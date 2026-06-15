"use client";

const TICKER_SELECTOR_DB_NAME = "AlgowayTickerSelector_DB";
const TICKER_SELECTOR_STORE_NAME = "ticker_selector_store";
const TICKER_SELECTOR_DB_VERSION = 1;
const SELECTED_TICKER_KEY = "algoway_selected_ticker";

const canUseIndexedDB = () => typeof window !== "undefined" && "indexedDB" in window;

const openTickerSelectorDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (!canUseIndexedDB()) {
    reject(new Error("IndexedDB not supported"));
    return;
  }

  const request = window.indexedDB.open(TICKER_SELECTOR_DB_NAME, TICKER_SELECTOR_DB_VERSION);
  request.onerror = () => reject(request.error ?? new Error("Unable to open ticker selector IndexedDB"));
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(TICKER_SELECTOR_STORE_NAME)) {
      database.createObjectStore(TICKER_SELECTOR_STORE_NAME);
    }
  };
});

export const readPersistedTickerSymbol = async (): Promise<string | null> => {
  if (!canUseIndexedDB()) return null;

  try {
    const database = await openTickerSelectorDatabase();
    const value = await new Promise<unknown>((resolve, reject) => {
      const transaction = database.transaction(TICKER_SELECTOR_STORE_NAME, "readonly");
      const request = transaction.objectStore(TICKER_SELECTOR_STORE_NAME).get(SELECTED_TICKER_KEY);
      let result: unknown = null;

      request.onsuccess = () => {
        result = request.result;
      };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to read ticker selector IndexedDB"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Ticker selector IndexedDB read aborted"));
    });
    database.close();
    return typeof value === "string" && value.trim().length > 0 ? value.trim().toUpperCase() : null;
  } catch (error) {
    console.warn("Ticker selector IndexedDB read failed", error);
    return null;
  }
};

export const writePersistedTickerSymbol = async (ticker: string): Promise<void> => {
  if (!canUseIndexedDB()) return;
  const normalizedTicker = ticker.trim().toUpperCase();
  if (!normalizedTicker) return;

  try {
    const database = await openTickerSelectorDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(TICKER_SELECTOR_STORE_NAME, "readwrite");
      transaction.objectStore(TICKER_SELECTOR_STORE_NAME).put(normalizedTicker, SELECTED_TICKER_KEY);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write ticker selector IndexedDB"));
      transaction.onabort = () => reject(transaction.error ?? new Error("Ticker selector IndexedDB write aborted"));
    });
    database.close();
  } catch (error) {
    console.warn("Ticker selector IndexedDB write failed", error);
  }
};
