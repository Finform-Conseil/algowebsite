/** Bounded, private undo journal, isolated from market-data caches. */
export type PersistedChartHistory<T> = {
  version: 1;
  scope: string;
  index: number;
  /** Optimistic concurrency token; legacy journals start at 0. */
  revision?: number;
  entries: Array<{ snapshot: T; fingerprint: string; committedAt?: number; label?: string }>;
};
const DB_NAME = "finform-ta-undo-history";
const STORE = "journals";
const open = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB unavailable"));
  const request = indexedDB.open(DB_NAME, 1);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
const transact = async <T>(scope: string, mode: IDBTransactionMode, value?: PersistedChartHistory<T>): Promise<unknown> => {
  const db = await open();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = mode === "readonly" ? tx.objectStore(STORE).get(scope) : tx.objectStore(STORE).put(value, scope);
      let result: unknown;
      req.onsuccess = () => { result = req.result; };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error ?? new Error("History transaction aborted"));
    });
  } finally { db.close(); }
};
export async function readChartHistory<T>(scope: string, maxStates: number): Promise<PersistedChartHistory<T> | null> {
  const value = await transact<T>(scope, "readonly") as PersistedChartHistory<T> | undefined;
  if (!value || value.version !== 1 || value.scope !== scope || !Array.isArray(value.entries)
    || !value.entries.length || value.entries.length > maxStates
    || !Number.isInteger(value.index) || value.index < 0 || value.index >= value.entries.length
    || (value.revision !== undefined && (!Number.isSafeInteger(value.revision) || value.revision < 0))
    || !value.entries.every(e => e && typeof e.fingerprint === "string" && e.snapshot !== undefined
      && (e.committedAt === undefined || Number.isFinite(e.committedAt))
      && (e.label === undefined || (typeof e.label === "string" && e.label.length <= 120)))) return null;
  return value;
}
export class ChartHistoryConflictError extends Error {
  constructor() {
    super("History updated by another browser tab");
    this.name = "ChartHistoryConflictError";
  }
}

/** Atomic compare-and-swap. Stale tabs keep local Undo/Redo, but never clobber newer durable history. */
export async function writeChartHistory<T>(
  journal: PersistedChartHistory<T>,
  expectedRevision: number,
): Promise<number> {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 0) {
    throw new Error("Invalid expected history revision");
  }
  const db = await open();
  try {
    return await new Promise<number>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      let failure: Error | null = null;
      const request = store.get(journal.scope);
      request.onsuccess = () => {
        const previous = request.result as PersistedChartHistory<T> | undefined;
        const actualRevision = previous?.revision ?? 0;
        if (!Number.isSafeInteger(actualRevision) || actualRevision !== expectedRevision) {
          failure = new ChartHistoryConflictError();
          tx.abort();
          return;
        }
        const write = store.put({ ...journal, revision: actualRevision + 1 }, journal.scope);
        write.onerror = () => { failure = write.error ?? new Error("History write failed"); };
      };
      request.onerror = () => { failure = request.error ?? new Error("History read failed"); };
      tx.oncomplete = () => resolve(expectedRevision + 1);
      tx.onerror = () => { failure ??= tx.error ?? new Error("History transaction failed"); };
      tx.onabort = () => reject(failure ?? tx.error ?? new Error("History transaction aborted"));
    });
  } finally {
    db.close();
  }
}
