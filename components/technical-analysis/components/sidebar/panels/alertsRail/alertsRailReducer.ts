import { isBrvmBusinessDay } from "../../../../utils/brvmMarketSession";
import { MAX_ALERTS, MAX_LOG_ENTRIES } from "./alertsRailConstants";
import { buildDefaultDraft, setDraftOpen, trimDraftOpenByTicker, trimDrafts, upsertDraft } from "./alertsRailDrafts";
import { evaluateAlert } from "./alertsRailEngine";
import { emptyAlertsSnapshot } from "./alertsRailStorage";
import type {
  AlertDraft,
  AlertDraftUpdateValue,
  AlertLogEntry,
  AlertLogKind,
  AlertsRailAction,
  AlertsRailContext,
  AlertsRailContextByTicker,
  AlertsRailState,
  AlertsStoreSnapshot,
  AlertStatus,
  AlertTypeId,
  BrvmAlert,
  IndicatorAlertTarget,
} from "./alertsRailTypes";
import {
  buildDefaultMessage,
  coerceConditionForType,
  isNumericCondition,
  makeAlertId,
  validateDraft,
} from "./alertsRailValidation";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;
const BRVM_OPEN_UTC_MINUTE = 9 * 60;
const BRVM_CLOSE_UTC_MINUTE = 15 * 60;
export const createInitialState = (context: AlertsRailContext): AlertsRailState => {
  const stored = emptyAlertsSnapshot();
  const draft = stored.draftsByTicker[context.ticker] ?? buildDefaultDraft(context);
  return {
    ...stored,
    activeTab: "alerts",
    currentSymbolOnly: true,
    currentTicker: context.ticker,
    draft,
    draftOpen: Boolean(stored.draftOpenByTicker[context.ticker]),
    logFilter: "triggered",
    menuOpen: false,
    searchOpen: false,
    searchQuery: "",
    sortMode: "priority",
    typeFilter: "all",
    viewFilter: "all",
  };
};

export const serializeStore = (state: AlertsRailState): AlertsStoreSnapshot => ({
  alerts: state.alerts.slice(0, MAX_ALERTS),
  draftOpenByTicker: trimDraftOpenByTicker({ ...state.draftOpenByTicker, [state.currentTicker]: state.draftOpen }),
  draftsByTicker: trimDrafts(state.draftsByTicker),
  logs: state.logs.slice(0, MAX_LOG_ENTRIES),
  soundEnabled: state.soundEnabled,
});

export const alertsRailReducer = (state: AlertsRailState, action: AlertsRailAction): AlertsRailState => {
  switch (action.type) {
    case "clear_log":
      return appendLog({ ...state, logs: [] }, buildLog(null, action.ticker, "cleared", "Journal des alertes nettoye", action.now));
    case "delete_alert":
      return deleteAlert(state, action.alertId, action.now);
    case "delete_inactive":
      return deleteInactiveAlerts(state, action.ticker, action.now);
    case "hydrate":
      return hydrateState(state, action.snapshot, action.ticker, action.draft, action.now);
    case "open_draft":
      return openDraft(state, action.context, action.alertId);
    case "remove_log_entry":
      return { ...state, logs: state.logs.filter((entry) => entry.id !== action.logId) };
    case "restart_inactive":
      return restartInactiveAlerts(state, action.ticker, action.now);
    case "set_current_symbol_only":
      return { ...state, currentSymbolOnly: action.value };
    case "set_draft_open":
      return {
        ...state,
        draftOpen: action.value,
        draftOpenByTicker: setDraftOpen(state.draftOpenByTicker, state.currentTicker, action.value),
      };
    case "set_log_filter":
      return { ...state, logFilter: action.value };
    case "set_menu_open":
      return { ...state, menuOpen: action.value };
    case "set_search_open":
      return { ...state, searchOpen: action.value, searchQuery: action.value ? state.searchQuery : "" };
    case "set_search_query":
      return { ...state, searchQuery: action.value };
    case "set_sound_enabled":
      return { ...state, soundEnabled: action.value };
    case "set_sort_mode":
      return { ...state, sortMode: action.value };
    case "set_tab":
      return { ...state, activeTab: action.value, menuOpen: false };
    case "set_type_filter":
      return { ...state, typeFilter: action.value };
    case "set_view_filter":
      return { ...state, viewFilter: action.value };
    case "submit_draft":
      return submitDraft(state, action.context, action.now);
    case "sync_context":
      return syncDraftContext(state, action.context);
    case "toggle_alert_status":
      return toggleAlertStatus(state, action.alertId, action.now);
    case "trigger_alerts":
      return triggerAlerts(state, action.contextsByTicker, action.now);
    case "update_draft":
      return updateDraft(state, action.context, action.field, action.value);
    default:
      return state;
  }
};

const hydrateState = (
  state: AlertsRailState,
  snapshot: AlertsStoreSnapshot,
  ticker: string,
  draft: AlertDraft,
  now: string,
): AlertsRailState => expireAlerts({
  ...state,
  alerts: snapshot.alerts,
  currentTicker: ticker,
  draft: snapshot.draftsByTicker[ticker] ?? draft,
  draftOpen: Boolean(snapshot.draftOpenByTicker[ticker]),
  draftOpenByTicker: snapshot.draftOpenByTicker,
  draftsByTicker: snapshot.draftsByTicker,
  logs: snapshot.logs,
  soundEnabled: snapshot.soundEnabled,
}, now);

const openDraft = (state: AlertsRailState, context: AlertsRailContext, alertId?: string): AlertsRailState => {
  const existing = alertId ? state.alerts.find((alert) => alert.id === alertId) : null;
  const draft = existing ? alertToDraft(existing) : state.draftsByTicker[context.ticker] ?? buildDefaultDraft(context);
  return {
    ...state,
    activeTab: "alerts",
    currentTicker: context.ticker,
    draft,
    draftOpen: true,
    draftOpenByTicker: setDraftOpen(state.draftOpenByTicker, context.ticker, true),
    draftsByTicker: upsertDraft(state.draftsByTicker, context.ticker, draft),
    menuOpen: false,
  };
};

const submitDraft = (state: AlertsRailState, context: AlertsRailContext, now: string): AlertsRailState => {
  const validation = validateDraft(state.draft);
  if (validation.error) return state;
  const alert = draftToAlert(state.draft, context, validation.threshold, now);
  const withoutExisting = state.alerts.filter((item) => item.id !== alert.id);
  const kind: AlertLogKind = state.alerts.some((item) => item.id === alert.id) ? "edited" : "created";
  const next = {
    ...state,
    alerts: [alert, ...withoutExisting].slice(0, MAX_ALERTS),
    draft: { ...state.draft, id: alert.id },
    draftOpen: false,
    draftOpenByTicker: setDraftOpen(state.draftOpenByTicker, context.ticker, false),
    draftsByTicker: upsertDraft(state.draftsByTicker, context.ticker, { ...state.draft, id: alert.id }),
    menuOpen: false,
  };
  return appendLog(next, buildLog(alert.id, context.ticker, kind, `${kind === "edited" ? "Alerte modifiee" : "Alerte creee"}: ${alert.message}`, now));
};

const updateDraft = (
  state: AlertsRailState,
  context: AlertsRailContext,
  field: keyof AlertDraft,
  value: AlertDraftUpdateValue,
): AlertsRailState => {
  const nextDraft: AlertDraft = { ...state.draft };

  if (field === "indicator") {
    nextDraft.indicator = isIndicatorTargetValue(value) ? value : null;
  } else {
    if (typeof value !== "string") return state;
    if (field === "type") {
      const type = value as AlertTypeId;
      nextDraft.condition = coerceConditionForType(type, state.draft.condition);
      nextDraft.type = type;
      if (!isNumericCondition(nextDraft.condition)) nextDraft.threshold = "";
      nextDraft.indicator = type === "indicator" ? nextDraft.indicator ?? getDefaultIndicatorTarget(context) : null;
      if (type === "indicator") nextDraft.threshold = getDefaultIndicatorThreshold(context, nextDraft.indicator, nextDraft.threshold);
    }
    if (field === "condition") {
      nextDraft.condition = coerceConditionForType(nextDraft.type, value as AlertDraft["condition"]);
      if (!isNumericCondition(nextDraft.condition)) nextDraft.threshold = "";
    }
    if (field === "channel") nextDraft.channel = value as AlertDraft["channel"];
    if (field === "expiration") nextDraft.expiration = value as AlertDraft["expiration"];
    if (field === "id") nextDraft.id = value || null;
    if (field === "message") {
      nextDraft.message = value;
      nextDraft.messageTouched = true;
    }
    if (field === "threshold") nextDraft.threshold = value;
  }

  if (nextDraft.type === "indicator" && !nextDraft.indicator) nextDraft.indicator = getDefaultIndicatorTarget(context);
  if ((field === "type" || field === "condition" || field === "threshold" || field === "indicator") && !nextDraft.messageTouched) {
    nextDraft.message = buildDefaultMessage(context.ticker, nextDraft.type, nextDraft.condition, nextDraft.threshold, nextDraft.indicator?.label);
  }
  return {
    ...state,
    currentTicker: context.ticker,
    draft: nextDraft,
    draftOpen: true,
    draftOpenByTicker: setDraftOpen(state.draftOpenByTicker, context.ticker, true),
    draftsByTicker: upsertDraft(state.draftsByTicker, context.ticker, nextDraft),
  };
};
const syncDraftContext = (state: AlertsRailState, context: AlertsRailContext): AlertsRailState => {
  if (state.currentTicker !== context.ticker) {
    const draft = state.draftsByTicker[context.ticker] ?? buildDefaultDraft(context);
    return { ...state, currentTicker: context.ticker, draft, draftOpen: Boolean(state.draftOpenByTicker[context.ticker]), menuOpen: false, searchQuery: "" };
  }
  if (state.draftOpen || state.draft.messageTouched || state.draft.id) return state;
  const draft = buildDefaultDraft(context);
  return { ...state, draft, draftsByTicker: upsertDraft(state.draftsByTicker, context.ticker, draft) };
};

const triggerAlerts = (state: AlertsRailState, contextsByTicker: AlertsRailContextByTicker, now: string): AlertsRailState => {
  const baseState = expireAlerts(state, now);
  let changed = baseState !== state;
  let nextLogs = baseState.logs;
  const alerts = baseState.alerts.map((alert) => {
    const context = contextsByTicker[alert.ticker];
    if (!context || alert.status !== "active") return alert;
    const evaluation = evaluateAlert(alert, context);
    if (!evaluation.matched) {
      if (evaluation.observedValue !== alert.lastObservedValue) {
        changed = true;
        return { ...alert, lastObservedValue: evaluation.observedValue };
      }
      return alert;
    }
    if (evaluation.signature === alert.lastTriggeredSignature) return alert;
    changed = true;
    const triggered = {
      ...alert,
      lastObservedValue: evaluation.observedValue,
      lastTriggeredAt: now,
      lastTriggeredSignature: evaluation.signature,
      lastTriggeredValue: evaluation.observedValue,
      status: "triggered",
      updatedAt: now,
    } satisfies BrvmAlert;
    nextLogs = prependLog(nextLogs, buildLog(alert.id, alert.ticker, "triggered", `${alert.message} - declenche (${evaluation.metricLabel})`, now));
    return triggered;
  });
  return changed ? { ...baseState, alerts, logs: nextLogs } : baseState;
};

const toggleAlertStatus = (state: AlertsRailState, alertId: string, now: string): AlertsRailState => {
  let log: AlertLogEntry | null = null;
  const alerts = state.alerts.map((alert) => {
    if (alert.id !== alertId) return alert;
    const nextStatus: AlertStatus = alert.status === "active" ? "paused" : "active";
    const isResuming = nextStatus === "active";
    log = buildLog(alert.id, alert.ticker, isResuming ? "resumed" : "paused", `${isResuming ? "Alerte reprise" : "Alerte pausee"}: ${alert.message}`, now);
    return {
      ...alert,
      createdAt: isResuming ? now : alert.createdAt,
      lastTriggeredAt: isResuming ? null : alert.lastTriggeredAt,
      lastTriggeredSignature: isResuming ? null : alert.lastTriggeredSignature,
      lastTriggeredValue: isResuming ? null : alert.lastTriggeredValue,
      status: nextStatus,
      updatedAt: now,
    } satisfies BrvmAlert;
  });
  return log ? appendLog({ ...state, alerts }, log) : state;
};

const deleteAlert = (state: AlertsRailState, alertId: string, now: string): AlertsRailState => {
  const alert = state.alerts.find((item) => item.id === alertId);
  if (!alert) return state;
  const next = { ...state, alerts: state.alerts.filter((item) => item.id !== alertId) };
  return appendLog(next, buildLog(alert.id, alert.ticker, "deleted", `Alerte supprimee: ${alert.message}`, now));
};

const deleteInactiveAlerts = (state: AlertsRailState, ticker: string, now: string): AlertsRailState => {
  const inactive = state.alerts.filter((alert) => alert.ticker === ticker && alert.status !== "active");
  if (inactive.length === 0) return state;
  const next = { ...state, alerts: state.alerts.filter((alert) => !(alert.ticker === ticker && alert.status !== "active")) };
  return appendLog(next, buildLog(null, ticker, "deleted", `${inactive.length} alerte(s) inactive(s) supprimee(s)`, now));
};

const restartInactiveAlerts = (state: AlertsRailState, ticker: string, now: string): AlertsRailState => {
  let count = 0;
  const alerts = state.alerts.map((alert) => {
    if (alert.ticker !== ticker || alert.status === "active") return alert;
    count += 1;
    return {
      ...alert,
      createdAt: now,
      lastTriggeredAt: null,
      lastTriggeredSignature: null,
      lastTriggeredValue: null,
      status: "active",
      updatedAt: now,
    } satisfies BrvmAlert;
  });
  if (count === 0) return state;
  return appendLog({ ...state, alerts }, buildLog(null, ticker, "resumed", `${count} alerte(s) inactive(s) relancee(s)`, now));
};

const expireAlerts = (state: AlertsRailState, now: string): AlertsRailState => {
  let changed = false;
  let nextLogs = state.logs;
  const alerts = state.alerts.map((alert) => {
    if ((alert.status !== "active" && alert.status !== "paused") || !isAlertExpired(alert, now)) return alert;
    changed = true;
    nextLogs = prependLog(nextLogs, buildLog(alert.id, alert.ticker, "expired", `Alerte expiree: ${alert.message}`, now));
    return {
      ...alert,
      status: "expired",
      updatedAt: now,
    } satisfies BrvmAlert;
  });
  return changed ? { ...state, alerts, logs: nextLogs } : state;
};

export const isAlertExpired = (alert: BrvmAlert, now: string): boolean => {
  if (alert.expiration === "none") return false;
  const createdMs = Date.parse(alert.createdAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(createdMs) || !Number.isFinite(nowMs)) return false;
  const expirationMs = getAlertExpirationMs(alert.expiration, createdMs);
  return expirationMs !== null && nowMs >= expirationMs;
};

const getAlertExpirationMs = (expiration: BrvmAlert["expiration"], createdMs: number): number | null => {
  if (expiration === "next_session") return getNextBrvmOpenAfterMs(createdMs);
  if (expiration === "week") return getWeekCloseAfterMs(createdMs);
  if (expiration === "month") return getMonthCloseAfterMs(createdMs);
  return null;
};

const getNextBrvmOpenAfterMs = (createdMs: number): number | null => {
  const dayStartMs = getUtcDayStartMs(new Date(createdMs));
  for (let offset = 0; offset < 10; offset += 1) {
    const candidateDayStartMs = dayStartMs + offset * DAY_MS;
    if (!isBrvmBusinessDay(new Date(candidateDayStartMs))) continue;
    const openMs = getUtcSessionMs(candidateDayStartMs, BRVM_OPEN_UTC_MINUTE);
    if (openMs > createdMs) return openMs;
  }
  return null;
};

const getWeekCloseAfterMs = (createdMs: number): number | null => {
  const dayStartMs = getUtcDayStartMs(new Date(createdMs));
  for (let offset = 0; offset < 14; offset += 1) {
    const candidateDayStartMs = dayStartMs + offset * DAY_MS;
    const candidateDate = new Date(candidateDayStartMs);
    if (candidateDate.getUTCDay() !== 5) continue;
    const closeDayStartMs = getLastBrvmBusinessDayStartMsOnOrBefore(candidateDayStartMs, 4);
    if (closeDayStartMs === null) continue;
    const closeMs = getUtcSessionMs(closeDayStartMs, BRVM_CLOSE_UTC_MINUTE);
    if (closeMs > createdMs) return closeMs;
  }
  return null;
};

const getMonthCloseAfterMs = (createdMs: number): number | null => {
  const created = new Date(createdMs);
  for (let offset = 0; offset < 13; offset += 1) {
    const monthIndex = created.getUTCFullYear() * 12 + created.getUTCMonth() + offset;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12;
    const dayStartMs = getLastBrvmBusinessDayStartMs(year, month);
    const closeMs = getUtcSessionMs(dayStartMs, BRVM_CLOSE_UTC_MINUTE);
    if (closeMs > createdMs) return closeMs;
  }
  return null;
};

const getLastBrvmBusinessDayStartMs = (year: number, month: number): number => {
  const nextMonthStartMs = Date.UTC(year, month + 1, 1);
  return getLastBrvmBusinessDayStartMsOnOrBefore(nextMonthStartMs - DAY_MS, 7) ?? nextMonthStartMs - DAY_MS;
};

const getLastBrvmBusinessDayStartMsOnOrBefore = (dayStartMs: number, maxLookbackDays: number): number | null => {
  for (let offset = 0; offset <= maxLookbackDays; offset += 1) {
    const candidateDayStartMs = dayStartMs - offset * DAY_MS;
    if (isBrvmBusinessDay(new Date(candidateDayStartMs))) return candidateDayStartMs;
  }
  return null;
};

const getUtcDayStartMs = (date: Date): number => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const getUtcSessionMs = (dayStartMs: number, utcMinute: number): number => dayStartMs + utcMinute * MINUTE_MS;

const getDefaultIndicatorTarget = (context: AlertsRailContext): IndicatorAlertTarget | null => {
  const firstValue = Object.values(context.indicatorValuesByKey ?? {}).find((value) => (
    typeof value.value === "number" && Number.isFinite(value.value)
  ));
  return firstValue ? {
    key: firstValue.key,
    label: firstValue.label,
    ...(firstValue.source ? { source: firstValue.source } : {}),
    ...(firstValue.timeframe ? { timeframe: firstValue.timeframe } : {}),
  } : null;
};

const getDefaultIndicatorThreshold = (
  context: AlertsRailContext,
  indicator: IndicatorAlertTarget | null,
  fallback: string,
): string => {
  if (!indicator) return fallback;
  const value = context.indicatorValuesByKey?.[indicator.key]?.value;
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
};

const isIndicatorTargetValue = (value: AlertDraftUpdateValue): value is IndicatorAlertTarget => {
  if (value === null || typeof value !== "object") return false;
  return typeof value.key === "string" && typeof value.label === "string";
};

const draftToAlert = (draft: AlertDraft, context: AlertsRailContext, threshold: number | null, now: string): BrvmAlert => ({
  channel: draft.channel,
  condition: draft.condition,
  createdAt: now,
  expiration: draft.expiration,
  id: draft.id ?? makeAlertId(),
  indicator: draft.type === "indicator" ? draft.indicator : null,
  lastObservedValue: getInitialObservedValue(draft, context),
  lastTriggeredAt: null,
  lastTriggeredSignature: null,
  lastTriggeredValue: null,
  message: draft.message.trim(),
  status: "active",
  threshold,
  ticker: context.ticker,
  type: draft.type,
  updatedAt: now,
});

const alertToDraft = (alert: BrvmAlert): AlertDraft => ({
  channel: alert.channel,
  condition: alert.condition,
  expiration: alert.expiration,
  id: alert.id,
  indicator: alert.indicator ?? null,
  message: alert.message,
  messageTouched: true,
  threshold: alert.threshold === null ? "" : String(alert.threshold),
  type: alert.type,
});

const getInitialObservedValue = (draft: AlertDraft, context: AlertsRailContext): number | null => {
  if (draft.type !== "indicator" || !draft.indicator?.key) return context.currentPrice;
  const value = context.indicatorValuesByKey?.[draft.indicator.key]?.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

const appendLog = (state: AlertsRailState, log: AlertLogEntry) => ({ ...state, logs: prependLog(state.logs, log) });
const prependLog = (logs: AlertLogEntry[], log: AlertLogEntry) => [log, ...logs].slice(0, MAX_LOG_ENTRIES);

const buildLog = (alertId: string | null, ticker: string, kind: AlertLogKind, message: string, now: string): AlertLogEntry => ({
  alertId,
  createdAt: now,
  id: makeAlertId("brvm-alert-log"),
  kind,
  message,
  ticker,
});
