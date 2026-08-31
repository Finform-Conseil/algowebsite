import type { BRVMBond, BRVMIndexData, BRVMNewsItem } from "./sidebarFetchers";
import type { BRVMFundamentals } from "./sidebarFundamentals";

const DATABASE_NAME = "AlgowaySidebar_DB";
const STORE_NAME = "sidebar_snapshots";
const DATABASE_VERSION = 1;

export type SidebarSnapshotKind = "fundamentals" | "news" | "indices" | "bonds";

export type SidebarSnapshot = {
  fundamentals: BRVMFundamentals;
  news: BRVMNewsItem[];
  indices: Record<string, BRVMIndexData>;
  bonds: BRVMBond[];
};

type StoredSidebarSnapshot<K extends SidebarSnapshotKind = SidebarSnapshotKind> = {
  key: string;
  kind: K;
  marketTicker: string;
  ticker: string;
  payload: SidebarSnapshot[K];
  updatedAt: number;
};

const TTL_BY_KIND: Record<SidebarSnapshotKind, number> = {
  fundamentals: 60 * 60 * 1_000,
  news: 15 * 60 * 1_000,
  indices: 10 * 60 * 1_000,
  bonds: 30 * 60 * 1_000,
};

const canUseIndexedDB = (): boolean => (
  typeof window !== "undefined" && "indexedDB" in window
);

const normalizePart = (value: string): string => value.trim().toUpperCase() || "UNKNOWN";

const buildKey = (kind: SidebarSnapshotKind, marketTicker: string, ticker: string): string => (
  `${kind}:${normalizePart(marketTicker)}:${normalizePart(ticker)}`
);

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
  request.onsuccess = () => {
    request.result.onversionchange = () => request.result.close();
    resolve(request.result);
  };
  request.onerror = () => reject(request.error ?? new Error("Unable to open sidebar IndexedDB"));
  request.onblocked = () => reject(new Error("Sidebar IndexedDB open blocked"));
});

const readRecord = (database: IDBDatabase, key: string): Promise<unknown> => new Promise((resolve, reject) => {
  let value: unknown;
  const transaction = database.transaction(STORE_NAME, "readonly");
  const request = transaction.objectStore(STORE_NAME).get(key);
  request.onsuccess = () => { value = request.result; };
  transaction.oncomplete = () => resolve(value);
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to read sidebar IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Sidebar IndexedDB read aborted"));
});

const writeRecord = (database: IDBDatabase, record: StoredSidebarSnapshot): Promise<void> => (
  new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write sidebar IndexedDB"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Sidebar IndexedDB write aborted"));
  })
);

const isStoredSnapshot = (value: unknown): value is StoredSidebarSnapshot => {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StoredSidebarSnapshot>;
  return typeof record.key === "string"
    && typeof record.kind === "string"
    && typeof record.updatedAt === "number"
    && Number.isFinite(record.updatedAt)
    && "payload" in record;
};

export const readSidebarSnapshot = async <K extends SidebarSnapshotKind>(
  kind: K,
  marketTicker: string,
  ticker: string,
): Promise<SidebarSnapshot[K] | null> => {
  if (!canUseIndexedDB()) return null;

  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    const key = buildKey(kind, marketTicker, ticker);
    const value = await readRecord(database, key);

    if (!isStoredSnapshot(value) || value.kind !== kind) return null;
    if (Date.now() - value.updatedAt > TTL_BY_KIND[kind]) return null;
    return value.payload as SidebarSnapshot[K];
  } catch (error) {
    console.warn(`Sidebar IndexedDB ${kind} read failed`, error);
    return null;
  } finally {
    database?.close();
  }
};

const persistSidebarSnapshot = async <K extends SidebarSnapshotKind>(
  kind: K,
  marketTicker: string,
  ticker: string,
  payload: SidebarSnapshot[K],
): Promise<void> => {
  if (!canUseIndexedDB()) return;

  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    const record: StoredSidebarSnapshot<K> = {
      key: buildKey(kind, marketTicker, ticker),
      kind,
      marketTicker: normalizePart(marketTicker),
      ticker: normalizePart(ticker),
      payload,
      updatedAt: Date.now(),
    };
    await writeRecord(database, record);
  } catch (error) {
    console.warn(`Sidebar IndexedDB ${kind} write failed`, error);
  } finally {
    database?.close();
  }
};

let sidebarWriteQueue: Promise<void> = Promise.resolve();

export const writeSidebarSnapshot = <K extends SidebarSnapshotKind>(
  kind: K,
  marketTicker: string,
  ticker: string,
  payload: SidebarSnapshot[K],
): Promise<void> => {
  const operation = sidebarWriteQueue.then(() => persistSidebarSnapshot(kind, marketTicker, ticker, payload));
  sidebarWriteQueue = operation.catch(() => undefined);
  return operation;
};
