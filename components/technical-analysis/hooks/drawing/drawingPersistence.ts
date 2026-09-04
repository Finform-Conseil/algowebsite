export const TA_DB_NAME = "AlgowayTA_DB";
export const TA_STORE_NAME = "ta_store";
export const TA_ASSET_STORE_NAME = "ta_asset_store";
export const TA_DB_VERSION = 2;

export const LEGACY_DRAWINGS_STORAGE_KEY = "algoway_drawings";
export const DRAWINGS_SCOPE_STORAGE_PREFIX = "algoway_drawings:v2:";
export const PRIMARY_DRAWING_SCOPE = "chart_1";

const normalizeDrawingScope = (scope: string | null | undefined): string => {
  const normalized = String(scope ?? "").trim();
  return normalized || PRIMARY_DRAWING_SCOPE;
};

/**
 * Builds one durable IndexedDB key per multi-chart cell.
 * `encodeURIComponent` prevents separators in externally restored scopes from
 * colliding with the storage namespace while keeping the mapping deterministic.
 */
export const createDrawingsStorageKey = (scope: string | null | undefined): string =>
  `${DRAWINGS_SCOPE_STORAGE_PREFIX}${encodeURIComponent(normalizeDrawingScope(scope))}`;

/**
 * The historical application had exactly one global drawing bucket. Only the
 * canonical primary cell may inherit that bucket once; secondary cells must
 * start isolated or they would all clone the same legacy drawings.
 */
export const canMigrateLegacyDrawingsToScope = (scope: string | null | undefined): boolean =>
  normalizeDrawingScope(scope) === PRIMARY_DRAWING_SCOPE;

export type DrawingCloudPersistenceOperation = "save" | "restore";

export interface DisabledDrawingCloudPersistenceResult {
  status: "disabled";
  operation: DrawingCloudPersistenceOperation;
  reason: string;
}

export const DRAWING_CLOUD_PERSISTENCE_STATUS = {
  available: false,
  reason: "Cloud drawing persistence is not configured for this client.",
} as const;

export const getTADatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }

    const request = indexedDB.open(TA_DB_NAME, TA_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TA_STORE_NAME)) {
        db.createObjectStore(TA_STORE_NAME);
      }
      if (!db.objectStoreNames.contains(TA_ASSET_STORE_NAME)) {
        db.createObjectStore(TA_ASSET_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const idbGetStrict = async <T>(key: string): Promise<T | null> => {
  const db = await getTADatabase();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(TA_STORE_NAME, "readonly");
      const store = tx.objectStore(TA_STORE_NAME);
      const req = store.get(key);
      let value: T | null = null;

      req.onsuccess = () => {
        value = (req.result as T | undefined) ?? null;
      };
      req.onerror = () => reject(req.error ?? new Error(`IndexedDB read failed for ${key}`));
      tx.oncomplete = () => resolve(value);
      tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB read transaction failed for ${key}`));
      tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB read transaction aborted for ${key}`));
    });
  } finally {
    db.close();
  }
};

export const idbSetStrict = async <T>(key: string, value: T): Promise<void> => {
  const db = await getTADatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TA_STORE_NAME, "readwrite");
      const store = tx.objectStore(TA_STORE_NAME);
      const req = store.put(value, key);

      req.onerror = () => reject(req.error ?? new Error(`IndexedDB write failed for ${key}`));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error(`IndexedDB write transaction failed for ${key}`));
      tx.onabort = () => reject(tx.error ?? new Error(`IndexedDB write transaction aborted for ${key}`));
    });
  } finally {
    db.close();
  }
};

/** Lenient compatibility read for non-critical caches. */
export const idbGet = async <T>(key: string): Promise<T | null> => {
  try {
    return await idbGetStrict<T>(key);
  } catch (error) {
    console.warn("[SRE] IndexedDB Get Failed, falling back to null", error);
    return null;
  }
};

export const idbSet = async <T>(key: string, value: T): Promise<void> => {
  try {
    await idbSetStrict(key, value);
  } catch (error) {
    console.warn("[SRE] IndexedDB Set Failed", error);
  }
};

export const createDisabledDrawingCloudPersistence = (
  operation: DrawingCloudPersistenceOperation,
) => async (): Promise<DisabledDrawingCloudPersistenceResult> => ({
  status: "disabled",
  operation,
  reason: DRAWING_CLOUD_PERSISTENCE_STATUS.reason,
});

// ============================================================================
// [IMAGE NOTE] ISOLATED BINARY ASSET STORE
// Drawing metadata references assets by `assetId`; the binary Blob lives here,
// never inline in the Drawing object (no massive Base64 in state).
// ============================================================================
export const saveDrawingAsset = async (assetId: string, blob: Blob): Promise<void> => {
  try {
    const db = await getTADatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TA_ASSET_STORE_NAME, "readwrite");
      const store = tx.objectStore(TA_ASSET_STORE_NAME);
      const req = store.put(blob, assetId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn("[SRE] Drawing asset save failed", error);
  }
};

export const loadDrawingAsset = async (assetId: string): Promise<Blob | null> => {
  try {
    const db = await getTADatabase();
    return await new Promise<Blob | null>((resolve, reject) => {
      const tx = db.transaction(TA_ASSET_STORE_NAME, "readonly");
      const store = tx.objectStore(TA_ASSET_STORE_NAME);
      const req = store.get(assetId);
      req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn("[SRE] Drawing asset load failed", error);
    return null;
  }
};

export const deleteDrawingAsset = async (assetId: string | undefined | null): Promise<void> => {
  if (!assetId) return;
  try {
    const db = await getTADatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(TA_ASSET_STORE_NAME, "readwrite");
      const store = tx.objectStore(TA_ASSET_STORE_NAME);
      const req = store.delete(assetId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn("[SRE] Drawing asset delete failed", error);
  }
};
