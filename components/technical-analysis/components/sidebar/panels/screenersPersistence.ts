"use client";

import type { ScreenerPersistenceSnapshot } from "./screenersModel";
import type { BRVMBond } from "../data/sidebarFetchers";

const SCREENERS_DB_NAME = "AlgowayScreeners_DB";
const SCREENERS_STORE_NAME = "screeners_store";
const SCREENERS_DB_VERSION = 1;
const SCREENERS_STATE_KEY = "brvm_screeners_state_v1";
const SCREENERS_BONDS_KEY = "brvm_screeners_bonds_cache_v1";
const SCREENERS_IDB_TIMEOUT_MS = 1_800;
const SCREENERS_BONDS_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

interface BondsCacheSnapshot {
  createdAt: number;
  bonds: BRVMBond[];
}

const canUseIndexedDB = () => typeof window !== "undefined" && "indexedDB" in window;

const openScreenersDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  if (!canUseIndexedDB()) {
    reject(new Error("IndexedDB not supported"));
    return;
  }

  const request = window.indexedDB.open(SCREENERS_DB_NAME, SCREENERS_DB_VERSION);
  request.onerror = () => reject(request.error ?? new Error("Unable to open screeners IndexedDB"));
  request.onblocked = () => reject(new Error("Screeners IndexedDB open blocked"));
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(SCREENERS_STORE_NAME)) {
      database.createObjectStore(SCREENERS_STORE_NAME);
    }
  };
});

const withTimeout = <T,>(promise: Promise<T>, label: string) => new Promise<T>((resolve, reject) => {
  const timeoutId = window.setTimeout(() => reject(new Error(`${label} timed out`)), SCREENERS_IDB_TIMEOUT_MS);
  promise
    .then((value) => resolve(value))
    .catch((error) => reject(error))
    .finally(() => window.clearTimeout(timeoutId));
});

const readSnapshot = (database: IDBDatabase) => new Promise<unknown>((resolve, reject) => {
  let snapshot: unknown = null;
  const transaction = database.transaction(SCREENERS_STORE_NAME, "readonly");
  const request = transaction.objectStore(SCREENERS_STORE_NAME).get(SCREENERS_STATE_KEY);
  request.onsuccess = () => {
    snapshot = request.result ?? null;
  };
  transaction.oncomplete = () => resolve(snapshot);
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to read screeners IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Screeners IndexedDB read aborted"));
});

const writeSnapshot = (database: IDBDatabase, state: ScreenerPersistenceSnapshot) => new Promise<void>((resolve, reject) => {
  const transaction = database.transaction(SCREENERS_STORE_NAME, "readwrite");
  transaction.objectStore(SCREENERS_STORE_NAME).put(state, SCREENERS_STATE_KEY);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write screeners IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Screeners IndexedDB write aborted"));
});

const readBondsCacheSnapshot = (database: IDBDatabase) => new Promise<unknown>((resolve, reject) => {
  let snapshot: unknown = null;
  const transaction = database.transaction(SCREENERS_STORE_NAME, "readonly");
  const request = transaction.objectStore(SCREENERS_STORE_NAME).get(SCREENERS_BONDS_KEY);
  request.onsuccess = () => {
    snapshot = request.result ?? null;
  };
  transaction.oncomplete = () => resolve(snapshot);
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to read screeners bonds IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Screeners bonds IndexedDB read aborted"));
});

const writeBondsCacheSnapshot = (database: IDBDatabase, bonds: BRVMBond[]) => new Promise<void>((resolve, reject) => {
  const snapshot: BondsCacheSnapshot = { bonds, createdAt: Date.now() };
  const transaction = database.transaction(SCREENERS_STORE_NAME, "readwrite");
  transaction.objectStore(SCREENERS_STORE_NAME).put(snapshot, SCREENERS_BONDS_KEY);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write screeners bonds IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Screeners bonds IndexedDB write aborted"));
});

const normalizeBondsCacheSnapshot = (snapshot: unknown): BRVMBond[] => {
  if (!snapshot || typeof snapshot !== "object") return [];
  const candidate = snapshot as Partial<BondsCacheSnapshot>;
  if (typeof candidate.createdAt !== "number" || Date.now() - candidate.createdAt > SCREENERS_BONDS_CACHE_MAX_AGE_MS) return [];
  if (!Array.isArray(candidate.bonds)) return [];

  return candidate.bonds.flatMap((bond) => {
    if (!bond || typeof bond !== "object") return [];
    const value = bond as Partial<BRVMBond>;
    if (typeof value.name !== "string" || typeof value.maturityDate !== "string" || typeof value.ytm !== "number") return [];
    if (!Number.isFinite(value.ytm) || value.name.trim().length === 0 || value.maturityDate.trim().length === 0) return [];
    return [{ name: value.name.trim(), maturityDate: value.maturityDate.trim(), ytm: value.ytm }];
  });
};

const reportIndexedDBError = (operation: "read" | "write", error: unknown) => {
  if (typeof console === "undefined") return;
  console.warn(`Screeners IndexedDB ${operation} failed`, error);
};

export const readPersistedScreenersState = async (): Promise<unknown | null> => {
  if (!canUseIndexedDB()) return null;
  let database: IDBDatabase | null = null;

  try {
    database = await withTimeout(openScreenersDatabase(), "Screeners IndexedDB open");
    return await withTimeout(readSnapshot(database), "Screeners IndexedDB read");
  } catch (error) {
    reportIndexedDBError("read", error);
    return null;
  } finally {
    database?.close();
  }
};

export const writePersistedScreenersState = async (state: ScreenerPersistenceSnapshot): Promise<void> => {
  if (!canUseIndexedDB()) return;
  let database: IDBDatabase | null = null;

  try {
    database = await withTimeout(openScreenersDatabase(), "Screeners IndexedDB open");
    await withTimeout(writeSnapshot(database, state), "Screeners IndexedDB write");
  } catch (error) {
    reportIndexedDBError("write", error);
  } finally {
    database?.close();
  }
};

export const readCachedScreenersBonds = async (): Promise<BRVMBond[]> => {
  if (!canUseIndexedDB()) return [];
  let database: IDBDatabase | null = null;

  try {
    database = await withTimeout(openScreenersDatabase(), "Screeners IndexedDB open");
    const snapshot = await withTimeout(readBondsCacheSnapshot(database), "Screeners bonds IndexedDB read");
    return normalizeBondsCacheSnapshot(snapshot);
  } catch (error) {
    reportIndexedDBError("read", error);
    return [];
  } finally {
    database?.close();
  }
};

export const writeCachedScreenersBonds = async (bonds: BRVMBond[]): Promise<void> => {
  if (!canUseIndexedDB() || bonds.length === 0) return;
  let database: IDBDatabase | null = null;

  try {
    database = await withTimeout(openScreenersDatabase(), "Screeners IndexedDB open");
    await withTimeout(writeBondsCacheSnapshot(database, bonds), "Screeners bonds IndexedDB write");
  } catch (error) {
    reportIndexedDBError("write", error);
  } finally {
    database?.close();
  }
};
