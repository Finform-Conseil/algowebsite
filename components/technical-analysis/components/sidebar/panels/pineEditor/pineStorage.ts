import { compilePineScript, normalizePineSource } from "./pineCompiler";
import type { PineAttachedOverlay, PineChartOverlayPayload, PineChartOverlaySeries, PineChartOverlaySignal, PineEditorState, PinePlot, PineSavedScript, PineScriptKind, PineSignal } from "./pineTypes";

const PINE_EDITOR_DB_NAME = "algoway-technical-analysis-pine-editor";
const PINE_EDITOR_DB_VERSION = 1;
const PINE_EDITOR_STORE_NAME = "snapshots";
const PINE_EDITOR_SNAPSHOT_KEY = "current";
const MAX_SAVED_SCRIPTS = 12;

interface StoredPineEditorSnapshot {
  activeTemplateId: string;
  attachedOverlay: PineAttachedOverlay | null;
  draftName: string;
  lastSavedAt: string | null;
  savedScripts: PineSavedScript[];
  source: string;
  version: 1;
}

export const serializePineEditorState = (state: PineEditorState): StoredPineEditorSnapshot => sanitizeSnapshot({
  activeTemplateId: state.activeTemplateId,
  attachedOverlay: state.attachedOverlay,
  draftName: state.draftName,
  lastSavedAt: state.lastSavedAt,
  savedScripts: state.savedScripts,
  source: state.source,
  version: 1,
});

export const parsePineEditorState = (value: unknown, fallback: PineEditorState): PineEditorState => {
  const snapshot = sanitizeSnapshot(value);
  const source = snapshot.source || fallback.source;
  const compileResult = compilePineScript(source);
  return {
    ...fallback,
    activeTemplateId: snapshot.activeTemplateId || fallback.activeTemplateId,
    attachedOverlay: snapshot.attachedOverlay,
    compileResult,
    draftName: snapshot.draftName || compileResult.title,
    isDirty: false,
    lastSavedAt: snapshot.lastSavedAt,
    runtimeStatus: snapshot.attachedOverlay ? "attached" : "compiled",
    savedScripts: snapshot.savedScripts,
    source,
    storageError: null,
  };
};

export const loadPineEditorState = async (fallback: PineEditorState): Promise<PineEditorState> => {
  if (!canUseIndexedDB()) return fallback;
  let database: IDBDatabase | null = null;
  try {
    database = await openPineEditorDatabase();
    const snapshot = await readSnapshot(database);
    return snapshot ? parsePineEditorState(snapshot, fallback) : fallback;
  } catch (error) {
    return withStorageError(fallback, buildStorageError("read", error));
  } finally {
    database?.close();
  }
};

export const savePineEditorState = async (state: PineEditorState): Promise<{ error: string | null }> => {
  if (!canUseIndexedDB()) return { error: "Browser IndexedDB is unavailable in this environment." };
  let database: IDBDatabase | null = null;
  try {
    database = await openPineEditorDatabase();
    await writeSnapshot(database, serializePineEditorState(state));
    return { error: null };
  } catch (error) {
    return { error: buildStorageError("write", error) };
  } finally {
    database?.close();
  }
};

const openPineEditorDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = window.indexedDB.open(PINE_EDITOR_DB_NAME, PINE_EDITOR_DB_VERSION);
  request.onerror = () => reject(request.error ?? new Error("Unable to open Pine IndexedDB"));
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(PINE_EDITOR_STORE_NAME)) database.createObjectStore(PINE_EDITOR_STORE_NAME);
  };
});

const readSnapshot = (database: IDBDatabase) => new Promise<unknown>((resolve, reject) => {
  let snapshot: unknown;
  const transaction = database.transaction(PINE_EDITOR_STORE_NAME, "readonly");
  const store = transaction.objectStore(PINE_EDITOR_STORE_NAME);
  const request = store.get(PINE_EDITOR_SNAPSHOT_KEY);
  request.onsuccess = () => {
    snapshot = request.result;
  };
  transaction.oncomplete = () => resolve(snapshot);
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to read Pine IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Pine IndexedDB read aborted"));
});

const writeSnapshot = (database: IDBDatabase, snapshot: StoredPineEditorSnapshot) => new Promise<void>((resolve, reject) => {
  const transaction = database.transaction(PINE_EDITOR_STORE_NAME, "readwrite");
  transaction.objectStore(PINE_EDITOR_STORE_NAME).put(snapshot, PINE_EDITOR_SNAPSHOT_KEY);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write Pine IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Pine IndexedDB write aborted"));
});

const sanitizeSnapshot = (value: unknown): StoredPineEditorSnapshot => {
  const record = asRecord(value);
  const source = normalizePineSource(text(record?.source));
  return {
    activeTemplateId: text(record?.activeTemplateId) || "brvm-rsi-sma",
    attachedOverlay: sanitizeAttachedOverlay(record?.attachedOverlay),
    draftName: text(record?.draftName).slice(0, 90) || "BRVM RSI + SMA Guard",
    lastSavedAt: normalizeDate(record?.lastSavedAt),
    savedScripts: normalizeSavedScripts(record?.savedScripts),
    source,
    version: 1,
  };
};

const normalizeSavedScripts = (value: unknown): PineSavedScript[] => (
  Array.isArray(value)
    ? value.map(normalizeSavedScript).filter((script): script is PineSavedScript => script !== null).slice(0, MAX_SAVED_SCRIPTS)
    : []
);

const normalizeSavedScript = (value: unknown): PineSavedScript | null => {
  const record = asRecord(value);
  const source = normalizePineSource(text(record?.source));
  if (!record || !source.trim()) return null;
  const compiled = compilePineScript(source);
  return {
    checksum: compiled.checksum,
    id: normalizeIdentifier(record.id) || "pine-" + compiled.checksum,
    kind: normalizeKind(record.kind) || compiled.kind,
    name: text(record.name).slice(0, 90) || compiled.title,
    source,
    updatedAt: normalizeDate(record.updatedAt) || new Date(0).toISOString(),
  };
};

const sanitizeAttachedOverlay = (value: unknown): PineAttachedOverlay | null => {
  const record = asRecord(value);
  const checksum = text(record?.checksum);
  const title = text(record?.title);
  if (!record || !checksum || !title) return null;
  return {
    chartOverlay: sanitizeChartOverlay(record.chartOverlay) ?? {
      checksum,
      generatedAt: "",
      kind: normalizeKind(record.kind) || "indicator",
      series: [],
      signals: [],
      title: title.slice(0, 90),
      unsupportedExpressions: [],
    },
    checksum,
    kind: normalizeKind(record.kind) || "indicator",
    plots: sanitizePlots(record.plots),
    signals: sanitizeSignals(record.signals),
    title: title.slice(0, 90),
    updatedAt: normalizeDate(record.updatedAt) || new Date(0).toISOString(),
  };
};

const sanitizePlots = (value: unknown): PinePlot[] => (
  Array.isArray(value)
    ? value.map((item) => {
      const record = asRecord(item);
      const expression = text(record?.expression).slice(0, 96);
      const title = text(record?.title).slice(0, 80);
      return expression && title ? { expression, title } : null;
    }).filter((plot): plot is PinePlot => plot !== null).slice(0, 8)
    : []
);

const sanitizeOverlaySeries = (value: unknown): PineChartOverlaySeries[] => (
  Array.isArray(value)
    ? value.map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const color = text(record.color).slice(0, 12) || "#8b5cf6";
      const expression = text(record.expression).slice(0, 96);
      const title = text(record.title).slice(0, 80);
      const points = Array.isArray(record.points)
        ? record.points.map((p: unknown) => {
          const precord = asRecord(p);
          if (!precord) return null;
          const time = text(precord.time);
          const value = Number(precord.value);
          return Number.isFinite(value) && time ? { time, value } : null;
        }).filter((p): p is { time: string; value: number } => p !== null).slice(0, 2500)
        : [];
      return { color, expression, points, title: title || "Series" };
    }).filter((s): s is PineChartOverlaySeries => s !== null).slice(0, 8)
    : []
);

const sanitizeOverlaySignals = (value: unknown): PineChartOverlaySignal[] => (
  Array.isArray(value)
    ? value.map((item) => {
      const record = asRecord(item);
      if (!record) return null;
      const color = text(record.color).slice(0, 12) || "#f97316";
      const marker = text(record.marker).slice(0, 4) || "•";
      const title = text(record.title).slice(0, 80);
      const points = Array.isArray(record.points)
        ? record.points.map((p: unknown) => {
          const precord = asRecord(p);
          if (!precord) return null;
          const time = text(precord.time);
          const value = Number(precord.value);
          return Number.isFinite(value) && time ? { time, value } : null;
        }).filter((p): p is { time: string; value: number } => p !== null).slice(0, 2500)
        : [];
      return { color, marker, points, title: title || "Signal" };
    }).filter((s): s is PineChartOverlaySignal => s !== null).slice(0, 8)
    : []
);

const sanitizeChartOverlay = (value: unknown): PineChartOverlayPayload | null => {
  const record = asRecord(value);
  if (!record) return null;
  const checksum = text(record.checksum);
  const title = text(record.title);
  if (!checksum) return null;
  return {
    checksum,
    generatedAt: normalizeDate(record.generatedAt) || "",
    kind: normalizeKind(record.kind) || "indicator",
    series: sanitizeOverlaySeries(record.series),
    signals: sanitizeOverlaySignals(record.signals),
    title: title.slice(0, 90) || "Pine overlay",
    unsupportedExpressions: Array.isArray(record.unsupportedExpressions)
      ? record.unsupportedExpressions.map((u: unknown) => text(u).slice(0, 120)).filter(Boolean).slice(0, 12)
      : [],
  };
};

const sanitizeSignals = (value: unknown): PineSignal[] => (
  Array.isArray(value)
    ? value.map((item) => {
      const record = asRecord(item);
      const expression = text(record?.expression).slice(0, 96);
      const marker = text(record?.marker).slice(0, 12) || "•";
      const title = text(record?.title).slice(0, 80);
      return expression && title ? { expression, marker, title } : null;
    }).filter((signal): signal is PineSignal => signal !== null).slice(0, 8)
    : []
);

const canUseIndexedDB = () => typeof window !== "undefined" && "indexedDB" in window;

const withStorageError = (state: PineEditorState, storageError: string): PineEditorState => ({
  ...state,
  runtimeStatus: "storage_error",
  storageError,
});

const buildStorageError = (operation: "read" | "write", error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown error";
  return "Pine IndexedDB " + operation + " failed: " + message;
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
);

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const normalizeIdentifier = (value: unknown) => /^[a-zA-Z0-9:_-]{3,80}$/.test(text(value)) ? text(value) : null;
const normalizeKind = (value: unknown): PineScriptKind | null => (
  value === "indicator" || value === "strategy" || value === "library" ? value : null
);

const normalizeDate = (value: unknown): string | null => {
  const raw = text(value);
  if (!raw) return null;
  return Number.isNaN(new Date(raw).getTime()) ? null : raw;
};
