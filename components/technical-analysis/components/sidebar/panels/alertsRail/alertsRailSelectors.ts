import { ALERT_TYPES, CONDITIONS } from "./alertsRailConstants";
import type { AlertLogEntry, AlertSortMode, AlertsRailState, AlertStatus, BrvmAlert } from "./alertsRailTypes";
import { getOptionLabel } from "./alertsRailValidation";

export const filterAndSortAlerts = (state: AlertsRailState, ticker: string) => {
  const query = state.searchQuery.trim().toLowerCase();
  const rows = state.alerts.filter((alert) => {
    if (state.currentSymbolOnly && alert.ticker !== ticker) return false;
    if (state.viewFilter !== "all" && alert.status !== state.viewFilter) return false;
    if (state.typeFilter !== "all" && alert.type !== state.typeFilter) return false;
    if (!query) return true;
    return [
      alert.ticker,
      alert.message,
      getOptionLabel(ALERT_TYPES, alert.type),
      getOptionLabel(CONDITIONS, alert.condition),
    ].join(" ").toLowerCase().includes(query);
  });
  return rows.sort((a, b) => compareAlerts(a, b, state.sortMode));
};

export const filterLogs = (state: AlertsRailState, ticker: string): AlertLogEntry[] => {
  const rows = getScopedLogs(state, ticker);
  const filteredRows = state.logFilter === "triggered" ? rows.filter((entry) => entry.kind === "triggered") : rows;
  return filteredRows.slice(0, 80);
};

export const getAlertLogCounts = (state: AlertsRailState, ticker: string) => {
  const rows = getScopedLogs(state, ticker);
  return {
    all: rows.length,
    triggered: rows.filter((entry) => entry.kind === "triggered").length,
  };
};

const getScopedLogs = (state: AlertsRailState, ticker: string) => (
  state.currentSymbolOnly ? state.logs.filter((entry) => entry.ticker === ticker) : state.logs
);

export const getCurrentTickerAlerts = (state: AlertsRailState, ticker: string) => (
  state.alerts.filter((alert) => alert.ticker === ticker)
);

export const getAlertCounts = (alerts: BrvmAlert[]) => ({
  active: alerts.filter((alert) => alert.status === "active").length,
  all: alerts.length,
  paused: alerts.filter((alert) => alert.status === "paused").length,
  triggered: alerts.filter((alert) => alert.status === "triggered").length,
  expired: alerts.filter((alert) => alert.status === "expired").length,
});

export const nextSortMode = (mode: AlertSortMode): AlertSortMode => {
  if (mode === "priority") return "expiry";
  if (mode === "expiry") return "type";
  return "priority";
};

const compareAlerts = (a: BrvmAlert, b: BrvmAlert, sortMode: AlertSortMode) => {
  if (sortMode === "type") {
    return getOptionLabel(ALERT_TYPES, a.type).localeCompare(getOptionLabel(ALERT_TYPES, b.type));
  }
  if (sortMode === "expiry") return a.expiration.localeCompare(b.expiration) || b.updatedAt.localeCompare(a.updatedAt);
  return statusRank(a.status) - statusRank(b.status) || b.updatedAt.localeCompare(a.updatedAt);
};

const statusRank = (status: AlertStatus) => {
  if (status === "active") return 0;
  if (status === "triggered") return 1;
  if (status === "paused") return 2;
  return 3;
};
