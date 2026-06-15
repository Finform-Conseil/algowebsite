import {
  ALERTS_DB_NAME,
  ALERTS_DB_VERSION,
  ALERTS_SNAPSHOT_KEY,
  ALERTS_STORE_NAME,
  ALERTS_SYNC_CHANNEL_NAME,
  ALERT_TYPES,
  CHANNELS,
  CONDITIONS,
  EXPIRATIONS,
  MAX_ALERTS,
  MAX_DRAFTS,
  MAX_LOG_ENTRIES,
} from "./alertsRailConstants";
import type {
  AlertChannelId,
  AlertConditionId,
  AlertDraft,
  AlertExpirationId,
  AlertLogEntry,
  AlertLogKind,
  AlertsStoreSnapshot,
  AlertStatus,
  AlertTypeId,
  BrvmAlert,
  IndicatorAlertTarget,
} from "./alertsRailTypes";
import { buildDefaultMessage, coerceConditionForType } from "./alertsRailValidation";

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";
const ALERT_TYPE_IDS = new Set<AlertTypeId>(ALERT_TYPES.map((option) => option.id));
const ALERT_CONDITION_IDS = new Set<AlertConditionId>(CONDITIONS.map((option) => option.id));
const ALERT_CHANNEL_IDS = new Set<AlertChannelId>(CHANNELS.map((option) => option.id));
const ALERT_EXPIRATION_IDS = new Set<AlertExpirationId>(EXPIRATIONS.map((option) => option.id));
const ALERT_LOG_KIND_IDS = new Set<AlertLogKind>(["created", "triggered", "paused", "resumed", "deleted", "edited", "cleared", "expired"]);
const ALERT_STATUS_IDS = new Set<AlertStatus>(["active", "paused", "triggered", "expired"]);
const ALERTS_SYNC_MESSAGE_TYPE = "alerts_snapshot_changed";

export interface AlertsSyncMessage {
  sourceId: string;
  snapshot: AlertsStoreSnapshot;
  type: typeof ALERTS_SYNC_MESSAGE_TYPE;
  updatedAt: string;
}

export const emptyAlertsSnapshot = (): AlertsStoreSnapshot => ({
  alerts: [],
  draftOpenByTicker: {},
  draftsByTicker: {},
  logs: [],
  soundEnabled: true,
});

export const buildAlertsSnapshotSyncKey = (snapshot: AlertsStoreSnapshot): string => JSON.stringify(sanitizeSnapshot(snapshot));

export const buildAlertsSyncMessage = (sourceId: string, snapshot: AlertsStoreSnapshot, now = new Date()): AlertsSyncMessage => ({
  sourceId,
  snapshot: sanitizeSnapshot(snapshot),
  type: ALERTS_SYNC_MESSAGE_TYPE,
  updatedAt: now.toISOString(),
});

export const sanitizeAlertsSyncMessage = (value: unknown): AlertsSyncMessage | null => {
  const record = asRecord(value);
  const sourceId = textOrNull(record?.sourceId);
  if (!record || record.type !== ALERTS_SYNC_MESSAGE_TYPE || !sourceId) return null;
  return {
    sourceId,
    snapshot: sanitizeSnapshot(record.snapshot),
    type: ALERTS_SYNC_MESSAGE_TYPE,
    updatedAt: normalizeDateText(record.updatedAt, FALLBACK_DATE),
  };
};

export const isAlertsSyncMessageFromPeer = (value: unknown, currentSourceId: string): AlertsSyncMessage | null => {
  const message = sanitizeAlertsSyncMessage(value);
  return message && message.sourceId !== currentSourceId ? message : null;
};

export const openAlertsSyncChannel = (): BroadcastChannel | null => {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) return null;
  return new window.BroadcastChannel(ALERTS_SYNC_CHANNEL_NAME);
};

export const sanitizeSnapshot = (value: unknown): AlertsStoreSnapshot => {
  const record = asRecord(value);
  if (!record) return emptyAlertsSnapshot();
  return {
    alerts: Array.isArray(record.alerts) ? record.alerts.map(normalizeStoredAlert).filter((alert): alert is BrvmAlert => alert !== null).slice(0, MAX_ALERTS) : [],
    draftOpenByTicker: sanitizeDraftOpenByTicker(record.draftOpenByTicker),
    draftsByTicker: sanitizeDrafts(record.draftsByTicker),
    logs: Array.isArray(record.logs) ? record.logs.map(normalizeStoredLog).filter((entry): entry is AlertLogEntry => entry !== null).slice(0, MAX_LOG_ENTRIES) : [],
    soundEnabled: typeof record.soundEnabled === "boolean" ? record.soundEnabled : true,
  };
};

export const readStoredSnapshot = async (): Promise<AlertsStoreSnapshot> => {
  if (!canUseIndexedDB()) return emptyAlertsSnapshot();
  try {
    const database = await openAlertsDatabase();
    const snapshot = await readSnapshot(database);
    database.close();
    return sanitizeSnapshot(snapshot);
  } catch (error) {
    reportIndexedDBError("read", error);
    return emptyAlertsSnapshot();
  }
};

export const writeStoredSnapshot = async (snapshot: AlertsStoreSnapshot): Promise<void> => {
  if (!canUseIndexedDB()) return;
  try {
    const database = await openAlertsDatabase();
    await writeSnapshot(database, sanitizeSnapshot(snapshot));
    database.close();
  } catch (error) {
    reportIndexedDBError("write", error);
  }
};

const normalizeStoredAlert = (value: unknown): BrvmAlert | null => {
  const record = asRecord(value);
  const id = textOrNull(record?.id);
  const ticker = textOrNull(record?.ticker);
  if (!record || !id || !ticker) return null;

  const type = normalizeAlertType(record.type);
  const condition = normalizeAlertCondition(record.condition, type);
  const indicator = type === "indicator" ? normalizeIndicatorTarget(record.indicator) : null;
  if (type === "indicator" && !indicator) return null;
  const threshold = toNullableNumber(record.threshold);
  const thresholdLabel = threshold === null ? "" : threshold.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  const fallbackMessage = buildDefaultMessage(ticker, type, condition, thresholdLabel, indicator?.label);
  const message = normalizeMessage(record.message, fallbackMessage);
  const createdAt = normalizeDateText(record.createdAt);
  const lastTriggeredAt = normalizeNullableDateText(record.lastTriggeredAt);

  return {
    channel: normalizeAlertChannel(record.channel),
    condition,
    createdAt,
    expiration: normalizeAlertExpiration(record.expiration),
    id,
    indicator,
    lastObservedValue: toNullableNumber(record.lastObservedValue),
    lastTriggeredAt,
    lastTriggeredSignature: textOrNull(record.lastTriggeredSignature),
    lastTriggeredValue: toNullableNumber(record.lastTriggeredValue),
    message,
    status: normalizeAlertStatus(record.status, lastTriggeredAt),
    threshold,
    ticker,
    type,
    updatedAt: normalizeDateText(record.updatedAt, createdAt),
  };
};

const normalizeStoredDraft = (ticker: string, value: unknown): AlertDraft | null => {
  const record = asRecord(value);
  if (!record) return null;
  const type = normalizeAlertType(record.type);
  const condition = normalizeAlertCondition(record.condition, type);
  const indicator = type === "indicator" ? normalizeIndicatorTarget(record.indicator) : null;
  if (type === "indicator" && !indicator) return null;
  const threshold = thresholdText(record.threshold);
  const fallbackMessage = buildDefaultMessage(ticker, type, condition, threshold, indicator?.label);
  return {
    channel: normalizeAlertChannel(record.channel),
    condition,
    expiration: normalizeAlertExpiration(record.expiration),
    id: textOrNull(record.id),
    indicator,
    message: normalizeMessage(record.message, fallbackMessage),
    messageTouched: typeof record.messageTouched === "boolean" ? record.messageTouched : Boolean(textOrNull(record.message)),
    threshold,
    type,
  };
};

const normalizeIndicatorTarget = (value: unknown): IndicatorAlertTarget | null => {
  const record = asRecord(value);
  const key = normalizeIndicatorKey(record?.key);
  const label = normalizeIndicatorLabel(record?.label);
  if (!record || !key || !label) return null;
  const source = normalizeOptionalIndicatorText(record.source);
  const timeframe = normalizeOptionalIndicatorText(record.timeframe);
  return {
    key,
    label,
    ...(source ? { source } : {}),
    ...(timeframe ? { timeframe } : {}),
  };
};

const normalizeIndicatorKey = (value: unknown) => {
  const text = textOrNull(value);
  if (!text || text.length > 96) return null;
  return /^[a-zA-Z0-9:_-]+$/.test(text) ? text : null;
};

const normalizeIndicatorLabel = (value: unknown) => {
  const text = textOrNull(value);
  if (!text) return null;
  return text.slice(0, 80);
};

const normalizeOptionalIndicatorText = (value: unknown) => {
  const text = textOrNull(value);
  return text ? text.slice(0, 40) : null;
};

const normalizeStoredLog = (value: unknown): AlertLogEntry | null => {
  const record = asRecord(value);
  const id = textOrNull(record?.id);
  const ticker = textOrNull(record?.ticker);
  if (!record || !id || !ticker) return null;
  return {
    alertId: textOrNull(record.alertId),
    createdAt: normalizeDateText(record.createdAt),
    id,
    kind: normalizeLogKind(record.kind),
    message: normalizeMessage(record.message, "Evenement alerte"),
    ticker,
  };
};

const canUseIndexedDB = () => typeof window !== "undefined" && "indexedDB" in window;

const openAlertsDatabase = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = window.indexedDB.open(ALERTS_DB_NAME, ALERTS_DB_VERSION);
  request.onerror = () => reject(request.error ?? new Error("Unable to open alerts IndexedDB"));
  request.onsuccess = () => resolve(request.result);
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(ALERTS_STORE_NAME)) {
      database.createObjectStore(ALERTS_STORE_NAME);
    }
  };
});

const readSnapshot = (database: IDBDatabase) => new Promise<unknown>((resolve, reject) => {
  let snapshot: unknown;
  const transaction = database.transaction(ALERTS_STORE_NAME, "readonly");
  const store = transaction.objectStore(ALERTS_STORE_NAME);
  const request = store.get(ALERTS_SNAPSHOT_KEY);

  request.onsuccess = () => {
    snapshot = request.result;
  };
  transaction.oncomplete = () => resolve(snapshot);
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to read alerts IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Alerts IndexedDB read aborted"));
});

const writeSnapshot = (database: IDBDatabase, snapshot: AlertsStoreSnapshot) => new Promise<void>((resolve, reject) => {
  const transaction = database.transaction(ALERTS_STORE_NAME, "readwrite");
  transaction.objectStore(ALERTS_STORE_NAME).put(snapshot, ALERTS_SNAPSHOT_KEY);
  transaction.oncomplete = () => resolve();
  transaction.onerror = () => reject(transaction.error ?? new Error("Unable to write alerts IndexedDB"));
  transaction.onabort = () => reject(transaction.error ?? new Error("Alerts IndexedDB write aborted"));
});

const reportIndexedDBError = (operation: "read" | "write", error: unknown) => {
  if (typeof console === "undefined") return;
  console.warn(`Alerts IndexedDB ${operation} failed`, error);
};

const sanitizeDraftOpenByTicker = (value: unknown): Record<string, boolean> => {
  const record = asRecord(value);
  if (!record) return {};
  return Object.entries(record)
    .filter(([ticker, isOpen]) => ticker.trim().length > 0 && typeof isOpen === "boolean")
    .slice(-MAX_DRAFTS)
    .reduce<Record<string, boolean>>((openByTicker, [ticker, isOpen]) => {
      openByTicker[ticker] = Boolean(isOpen);
      return openByTicker;
    }, {});
};

const sanitizeDrafts = (value: unknown): Record<string, AlertDraft> => {
  const record = asRecord(value);
  if (!record) return {};
  return Object.entries(record).slice(-MAX_DRAFTS).reduce<Record<string, AlertDraft>>((drafts, [ticker, draft]) => {
    const cleanTicker = ticker.trim();
    const normalized = cleanTicker ? normalizeStoredDraft(cleanTicker, draft) : null;
    if (normalized) drafts[cleanTicker] = normalized;
    return drafts;
  }, {});
};

const normalizeAlertType = (value: unknown): AlertTypeId => (
  typeof value === "string" && ALERT_TYPE_IDS.has(value as AlertTypeId) ? value as AlertTypeId : "price"
);

const normalizeAlertCondition = (value: unknown, type: AlertTypeId): AlertConditionId => {
  const condition = typeof value === "string" && ALERT_CONDITION_IDS.has(value as AlertConditionId)
    ? value as AlertConditionId
    : coerceConditionForType(type, "price_crossing");
  return coerceConditionForType(type, condition);
};

const normalizeAlertChannel = (value: unknown): AlertChannelId => (
  typeof value === "string" && ALERT_CHANNEL_IDS.has(value as AlertChannelId) ? value as AlertChannelId : "interface"
);

const normalizeAlertExpiration = (value: unknown): AlertExpirationId => (
  typeof value === "string" && ALERT_EXPIRATION_IDS.has(value as AlertExpirationId) ? value as AlertExpirationId : "next_session"
);

const normalizeAlertStatus = (value: unknown, lastTriggeredAt: string | null): AlertStatus => {
  if (typeof value === "string" && ALERT_STATUS_IDS.has(value as AlertStatus)) return value as AlertStatus;
  return lastTriggeredAt ? "triggered" : "active";
};

const normalizeLogKind = (value: unknown): AlertLogKind => (
  typeof value === "string" && ALERT_LOG_KIND_IDS.has(value as AlertLogKind) ? value as AlertLogKind : "created"
);

const toNullableNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.trim().replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const thresholdText = (value: unknown) => {
  if (typeof value === "string") return value;
  const number = toNullableNumber(value);
  return number === null ? "" : String(number);
};

const asRecord = (value: unknown): Record<string, unknown> | null => (
  value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null
);

const textOrNull = (value: unknown) => {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
};

const normalizeMessage = (value: unknown, fallback: string) => {
  const message = textOrNull(value);
  return message && message.length >= 4 ? message : fallback;
};

const normalizeDateText = (value: unknown, fallback = FALLBACK_DATE) => {
  const text = textOrNull(value);
  if (!text) return fallback;
  return Number.isNaN(new Date(text).getTime()) ? fallback : text;
};

const normalizeNullableDateText = (value: unknown) => {
  const text = textOrNull(value);
  if (!text) return null;
  return Number.isNaN(new Date(text).getTime()) ? null : text;
};
