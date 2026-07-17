export const TA_DB_NAME = "AlgowayTA_DB";
export const TA_STORE_NAME = "ta_store";
export const TA_ASSET_STORE_NAME = "ta_asset_store";
export const TA_DB_VERSION = 2;

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

export const idbGet = async <T>(key: string): Promise<T | null> => {
  try {
    const db = await getTADatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TA_STORE_NAME, "readonly");
      const store = tx.objectStore(TA_STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | null);
      req.onerror = () => reject(req.error);
    });
  } catch (error) {
    console.warn("[SRE] IndexedDB Get Failed, falling back to null", error);
    return null;
  }
};

export const idbSet = async <T>(key: string, value: T): Promise<void> => {
  try {
    const db = await getTADatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TA_STORE_NAME, "readwrite");
      const store = tx.objectStore(TA_STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
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
