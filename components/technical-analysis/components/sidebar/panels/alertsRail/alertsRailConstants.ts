import type {
  AlertChannelId,
  AlertConditionId,
  AlertExpirationId,
  AlertOption,
  AlertSortMode,
  AlertTypeId,
  AlertViewFilter,
} from "./alertsRailTypes";

export const ALERTS_DB_NAME = "AfriMarketTAAlerts_DB";
export const ALERTS_DB_VERSION = 1;
export const ALERTS_SNAPSHOT_KEY = "right-rail-alerts:v1";
export const ALERTS_STORE_NAME = "alerts_store";
export const ALERTS_SYNC_CHANNEL_NAME = "afrimarket:technical-analysis:alerts:v1";
export const MAX_ALERTS = 100;
export const MAX_DRAFTS = 80;
export const MAX_LOG_ENTRIES = 250;
export const MAX_MESSAGE_LENGTH = 180;

export const ALERT_TYPES: AlertOption<AlertTypeId>[] = [
  { id: "price", label: "Cours" },
  { id: "change", label: "Variation" },
  { id: "volume", label: "Volume" },
  { id: "dividend", label: "Dividende" },
  { id: "news", label: "News BRVM" },
  { id: "indicator", label: "Indicateur" },
];

export const CONDITIONS: AlertOption<AlertConditionId>[] = [
  { id: "price_crossing", label: "Crossing" },
  { id: "price_above", label: "Prix >= seuil" },
  { id: "price_below", label: "Prix <= seuil" },
  { id: "change_at_least", label: "Variation >= %" },
  { id: "volume_ratio_at_least", label: "Volume >= x moyenne" },
  { id: "indicator_cross_above", label: "Indicateur croise au-dessus" },
  { id: "indicator_cross_below", label: "Indicateur croise en dessous" },
  { id: "indicator_above", label: "Indicateur >= seuil" },
  { id: "indicator_below", label: "Indicateur <= seuil" },
  { id: "dividend_available", label: "Dividende disponible" },
  { id: "news_available", label: "News disponible" },
];

export const CHANNELS: AlertOption<AlertChannelId>[] = [
  { id: "interface", label: "Interface" },
  { id: "journal", label: "Journal" },
  { id: "local", label: "Notification locale" },
];

export const EXPIRATIONS: AlertOption<AlertExpirationId>[] = [
  { id: "next_session", label: "Prochaine seance" },
  { id: "week", label: "Fin de semaine BRVM" },
  { id: "month", label: "Fin de mois" },
  { id: "none", label: "Sans expiration" },
];

export const SORT_LABELS: Record<AlertSortMode, string> = {
  priority: "Priorite",
  expiry: "Echeance",
  type: "Type",
};

export const VIEW_FILTER_LABELS: Record<AlertViewFilter, string> = {
  active: "Actives",
  all: "Toutes",
  paused: "Pausees",
  triggered: "Declenchees",
  expired: "Expirees",
};

export const TYPE_FILTER_LABELS: Record<AlertTypeId | "all", string> = {
  all: "Tous types",
  change: "Variation",
  dividend: "Dividende",
  indicator: "Indicateur",
  news: "News",
  price: "Cours",
  volume: "Volume",
};
