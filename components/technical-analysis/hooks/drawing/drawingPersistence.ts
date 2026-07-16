export const TA_DB_NAME = "AlgowayTA_DB";
export const TA_STORE_NAME = "ta_store";
export const TA_DB_VERSION = 1;

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
