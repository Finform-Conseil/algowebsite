export type AlertsTab = "alerts" | "log";
export type AlertTone = "neutral" | "success" | "danger";
export type AlertSortMode = "priority" | "expiry" | "type";
export type AlertLogFilter = "triggered" | "all";
export type AlertViewFilter = "all" | "active" | "paused" | "triggered" | "expired";
export type AlertTypeId = "price" | "change" | "volume" | "dividend" | "news" | "indicator";
export type AlertConditionId =
  | "price_crossing"
  | "price_above"
  | "price_below"
  | "change_at_least"
  | "volume_ratio_at_least"
  | "indicator_cross_above"
  | "indicator_cross_below"
  | "indicator_above"
  | "indicator_below"
  | "dividend_available"
  | "news_available";
export type AlertChannelId = "interface" | "journal" | "local";
export type AlertExpirationId = "next_session" | "week" | "month" | "none";
export type AlertStatus = "active" | "paused" | "triggered" | "expired";
export type AlertLogKind = "created" | "triggered" | "paused" | "resumed" | "deleted" | "edited" | "cleared" | "expired";

export interface AlertsRailContext {
  changeLabel: string;
  changePercent: number | null;
  changeTone: AlertTone;
  currentPrice: number | null;
  defaultThreshold: string;
  dividendLabel: string;
  hasDividend: boolean;
  hasNews: boolean;
  marketLabel: string;
  name: string;
  newsLabel: string;
  priceLabel: string;
  sessionLabel: string;
  ticker: string;
  volumeLabel: string;
  volumeRatio: number | null;
  indicatorValuesByKey?: Record<string, IndicatorAlertValue>;
}

export type AlertsRailContextByTicker = Record<string, AlertsRailContext>;

export interface IndicatorAlertTarget {
  key: string;
  label: string;
  source?: string;
  timeframe?: string;
}

export interface IndicatorAlertValue extends IndicatorAlertTarget {
  previousValue?: number | null;
  updatedAt?: string;
  value: number | null;
}

export interface AlertDraft {
  channel: AlertChannelId;
  condition: AlertConditionId;
  expiration: AlertExpirationId;
  id: string | null;
  indicator: IndicatorAlertTarget | null;
  message: string;
  messageTouched: boolean;
  threshold: string;
  type: AlertTypeId;
}

export type AlertDraftUpdateValue = string | IndicatorAlertTarget | null;

export interface BrvmAlert {
  channel: AlertChannelId;
  condition: AlertConditionId;
  createdAt: string;
  expiration: AlertExpirationId;
  id: string;
  indicator: IndicatorAlertTarget | null;
  lastObservedValue: number | null;
  lastTriggeredAt: string | null;
  lastTriggeredSignature: string | null;
  lastTriggeredValue: number | null;
  message: string;
  status: AlertStatus;
  threshold: number | null;
  ticker: string;
  type: AlertTypeId;
  updatedAt: string;
}

export interface AlertLogEntry {
  alertId: string | null;
  createdAt: string;
  id: string;
  kind: AlertLogKind;
  message: string;
  ticker: string;
}

export interface AlertsStoreSnapshot {
  alerts: BrvmAlert[];
  draftOpenByTicker: Record<string, boolean>;
  draftsByTicker: Record<string, AlertDraft>;
  logs: AlertLogEntry[];
  soundEnabled: boolean;
}

export interface AlertsRailState extends AlertsStoreSnapshot {
  activeTab: AlertsTab;
  currentSymbolOnly: boolean;
  currentTicker: string;
  draft: AlertDraft;
  draftOpen: boolean;
  logFilter: AlertLogFilter;
  menuOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  sortMode: AlertSortMode;
  typeFilter: AlertTypeId | "all";
  viewFilter: AlertViewFilter;
}

export type AlertsRailAction =
  | { type: "clear_log"; now: string; ticker: string }
  | { type: "delete_alert"; alertId: string; now: string }
  | { type: "delete_inactive"; now: string; ticker: string }
  | { type: "hydrate"; draft: AlertDraft; now: string; snapshot: AlertsStoreSnapshot; ticker: string }
  | { type: "open_draft"; context: AlertsRailContext; alertId?: string }
  | { type: "remove_log_entry"; logId: string }
  | { type: "restart_inactive"; now: string; ticker: string }
  | { type: "set_current_symbol_only"; value: boolean }
  | { type: "set_draft_open"; value: boolean }
  | { type: "set_log_filter"; value: AlertLogFilter }
  | { type: "set_menu_open"; value: boolean }
  | { type: "set_search_open"; value: boolean }
  | { type: "set_search_query"; value: string }
  | { type: "set_sound_enabled"; value: boolean }
  | { type: "set_sort_mode"; value: AlertSortMode }
  | { type: "set_tab"; value: AlertsTab }
  | { type: "set_type_filter"; value: AlertTypeId | "all" }
  | { type: "set_view_filter"; value: AlertViewFilter }
  | { type: "submit_draft"; context: AlertsRailContext; now: string }
  | { type: "sync_context"; context: AlertsRailContext }
  | { type: "toggle_alert_status"; alertId: string; now: string }
  | { type: "trigger_alerts"; contextsByTicker: AlertsRailContextByTicker; now: string }
  | { type: "update_draft"; context: AlertsRailContext; field: keyof AlertDraft; value: AlertDraftUpdateValue };

export interface AlertOption<T extends string> {
  id: T;
  label: string;
}

export interface ValidationResult {
  error: string | null;
  threshold: number | null;
}

export interface AlertEvaluation {
  matched: boolean;
  metricLabel: string;
  observedValue: number | null;
  signature: string;
}
