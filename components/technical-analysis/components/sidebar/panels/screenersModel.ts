import type { BRVMScreenerSecurity } from "../data/sidebarFetchers";
import type { LiveSnapshot } from "../../../config/market/marketSnapshotTypes";

export type ScreenerFilterId = "all" | "brvm" | "exchange" | "watchlist" | "price" | "change" | "marketCap" | "pe" | "eps" | "sector" | "bonds";
export type ScreenerMetricKey = "price" | "change" | "marketCap" | "pe" | "eps";
export type ScreenerSortId = "ticker" | ScreenerMetricKey;
export type ScreenerRangeBound = "min" | "max";
export type ScreenerSortDirection = "asc" | "desc";

export interface ScreenerNumericRange {
  enabled: boolean;
  max: string;
  min: string;
}

export interface ScreenerState {
  activeFilter: ScreenerFilterId;
  query: string;
  ranges: Record<ScreenerMetricKey, ScreenerNumericRange>;
  sectors: string[];
  exchanges: string[];
  sortId: ScreenerSortId;
  sortDirection: ScreenerSortDirection;
  watchlistTickers: string[];
}

export interface ScreenerPersistenceSnapshot extends ScreenerState {
  schemaVersion: number;
}

export interface ScreenerRow {
  changePercent: number | null;
  changeLabel: string;
  country: string;
  epsLabel: string;
  epsValue: number | null;
  exchange: string;
  isActive: boolean;
  marketCapLabel: string;
  marketCapValue: number | null;
  name: string;
  peLabel: string;
  peValue: number | null;
  priceLabel: string;
  priceValue: number | null;
  searchText: string;
  sector: string;
  ticker: string;
  volumeLabel: string;
  ytdLabel: string;
  ytdPercent: number | null;
}

export interface ScreenerBuildInput {
  activeCurrency: string;
  activeTicker: string;
  livePrice: number | null | undefined;
  liveVolume: number | null | undefined;
  marketSnapshots: Record<string, LiveSnapshot>;
  securities: BRVMScreenerSecurity[];
}

export const SCREENERS_FILTERS: Array<{ id: ScreenerFilterId; label: string }> = [
  { id: "all", label: "All stocks" },
  { id: "brvm", label: "BRVM" },
  { id: "exchange", label: "Exchange" },
  { id: "watchlist", label: "Watchlist" },
  { id: "price", label: "Price" },
  { id: "change", label: "Chg %" },
  { id: "marketCap", label: "Mkt cap" },
  { id: "pe", label: "P/E" },
  { id: "eps", label: "EPS" },
  { id: "sector", label: "Sector" },
  { id: "bonds", label: "Bonds" },
];

export const SCREENER_METRIC_FILTERS: ScreenerMetricKey[] = ["price", "change", "marketCap", "pe", "eps"];
export const SCREENERS_PERSISTENCE_SCHEMA_VERSION = 1;

const MAX_QUERY_LENGTH = 80;
const MAX_SECTOR_FILTERS = 16;
const MAX_EXCHANGE_FILTERS = 16;
const MAX_WATCHLIST_TICKERS = 120;
const SEARCH_ACCENT_PATTERN = /[\u0300-\u036f]/g;
const TICKER_PATTERN = /^[A-Z0-9._-]{1,16}$/;

export const SECTOR_LABEL_OVERRIDES: Readonly<Record<string, string>> = {
  "Activités des ménages en tant qu'employeurs; activités indifférenciées": "Services aux ménages",
  "Activités immobilières, location et services aux entreprises": "Immobilier & services",
  "Administration publique et défense; sécurité sociale obligatoire": "Administration publique",
  "Commerce de gros et de détail; réparation de véhicules automobiles et de motocycles": "Commerce & réparations",
  "Hébergement et restauration": "Hôtellerie & restauration",
  "Industrie manufacturière": "Industrie",
  "Information et communication": "Médias & télécoms",
  "Mines, industries extractives et autres industries extractives": "Mines",
  "Production et distribution d'électricité, de gaz, de vapeur et d'air conditionné": "Énergie",
  "Production et distribution d'eau; assainissement, gestion des déchets et dépollution": "Eau & assainissement",
  "Santé humaine et action sociale": "Santé",
  "Services financiers et assurance": "Banques & assurances",
  "Transports et entreposage": "Transports",
};

export const MAX_SECTOR_LABEL_LENGTH = 32;
const SECTOR_LABEL_SEPARATOR_PATTERN = /[,;]| -- /;

export const compactSectorLabel = (sector: string): string => {
  const trimmed = sector.trim();
  if (!trimmed) return trimmed;
  const override = SECTOR_LABEL_OVERRIDES[trimmed];
  if (override) return override;
  if (trimmed.length <= MAX_SECTOR_LABEL_LENGTH) return trimmed;
  const separator = trimmed.match(SECTOR_LABEL_SEPARATOR_PATTERN);
  if (!separator || separator.index === undefined) return trimmed;
  const truncated = trimmed.slice(0, separator.index).trim();
  return truncated || trimmed;
};

const emptyRange = (): ScreenerNumericRange => ({ enabled: false, max: "", min: "" });

export const createEmptyScreenerRanges = (): Record<ScreenerMetricKey, ScreenerNumericRange> => ({
  change: emptyRange(),
  eps: emptyRange(),
  marketCap: emptyRange(),
  pe: emptyRange(),
  price: emptyRange(),
});

export const createDefaultScreenerState = (): ScreenerState => ({
  activeFilter: "all",
  query: "",
  ranges: createEmptyScreenerRanges(),
  sectors: [],
  exchanges: [],
  sortId: "marketCap",
  sortDirection: "desc",
  watchlistTickers: [],
});

export const isMetricFilterId = (filterId: ScreenerFilterId): filterId is ScreenerMetricKey => (
  filterId === "price" || filterId === "change" || filterId === "marketCap" || filterId === "pe" || filterId === "eps"
);

export const normalizeSearchText = (value: string) => value
  .normalize("NFD")
  .replace(SEARCH_ACCENT_PATTERN, "")
  .trim()
  .toLowerCase();

const formatNumber = (value: number | null | undefined, digits = 2) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
};

const formatInteger = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  return `${value > 0 ? "+" : ""}${formatNumber(value)}%`;
};

const formatMarketCap = (value: number | null | undefined) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/D";
  if (Math.abs(value) >= 1000) return `${formatNumber(value / 1000, 1)} Md`;
  return `${formatNumber(value, 0)} M`;
};

const readSnapshotChangePercent = (snapshot: LiveSnapshot | undefined): number | null => {
  if (!snapshot) return null;
  const injected = (snapshot as LiveSnapshot & { variationNum?: unknown }).variationNum;
  if (typeof injected === "number" && Number.isFinite(injected)) return injected;
  const parsed = Number(snapshot.variation.replace(/[^\d,.-]/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const toFiniteValue = (value: number | null | undefined) => (
  value !== null && value !== undefined && Number.isFinite(value) ? value : null
);

export const isListedEquity = (security: BRVMScreenerSecurity) => (
  security.status !== "delisted" && security.sector !== "Delisted" && security.sector !== "Market Indices"
);

export const buildScreenerRows = ({
  activeCurrency,
  activeTicker,
  livePrice,
  liveVolume,
  marketSnapshots,
  securities,
}: ScreenerBuildInput): ScreenerRow[] => securities
  .filter(isListedEquity)
  .map((security) => {
    const snapshot = marketSnapshots[security.ticker];
    const isActive = security.ticker === activeTicker;
    const price = toFiniteValue(security.price) ?? toFiniteValue(snapshot?.price) ?? (isActive ? toFiniteValue(livePrice) : null);
    const volume = toFiniteValue(security.volume) ?? toFiniteValue(snapshot?.volume) ?? (isActive ? toFiniteValue(liveVolume) : null);
    const changePercent = toFiniteValue(security.priceChangeD1) ?? readSnapshotChangePercent(snapshot);
    const currency = security.currency || activeCurrency;
    const searchText = normalizeSearchText([
      security.ticker,
      security.name,
      security.sector,
      security.country,
      security.exchange || "BRVM",
    ].join(" "));

    return {
      changePercent,
      changeLabel: formatPercent(changePercent),
      country: security.country || "UEMOA",
      epsLabel: formatPercent(security.epsT12M),
      epsValue: toFiniteValue(security.epsT12M),
      exchange: security.exchange || "BRVM",
      isActive,
      marketCapLabel: formatMarketCap(security.marketCap),
      marketCapValue: security.marketCap,
      name: security.name,
      peLabel: formatNumber(security.peRatio),
      peValue: security.peRatio !== null && security.peRatio > 0 ? security.peRatio : null,
      priceLabel: price === null ? "N/D" : `${formatInteger(price)} ${currency}`,
      priceValue: price,
      searchText,
      sector: security.sector,
      ticker: security.ticker,
      volumeLabel: volume === null ? "N/D" : formatInteger(volume),
      ytdLabel: formatPercent(security.returnYTD),
      ytdPercent: security.returnYTD,
    };
  });

const compareNullable = (left: number | null, right: number | null, direction: ScreenerSortDirection) => {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
};

const getRowMetricValue = (row: ScreenerRow, metricKey: ScreenerMetricKey) => {
  if (metricKey === "price") return row.priceValue;
  if (metricKey === "change") return row.changePercent;
  if (metricKey === "marketCap") return row.marketCapValue;
  if (metricKey === "pe") return row.peValue;
  return row.epsValue;
};

const compareRows = (activeTicker: string, sortId: ScreenerSortId, direction: ScreenerSortDirection) => (left: ScreenerRow, right: ScreenerRow) => {
  const marketCapDelta = (left: ScreenerRow, right: ScreenerRow, direction: ScreenerSortDirection) => {
    const a = left.marketCapValue ?? -Infinity;
    const b = right.marketCapValue ?? -Infinity;
    return direction === "asc" ? a - b : b - a;
  };
  if (sortId === "price") return compareNullable(left.priceValue, right.priceValue, direction) || marketCapDelta(left, right, direction);
  if (sortId === "change") return compareNullable(left.changePercent, right.changePercent, direction) || marketCapDelta(left, right, direction);
  if (sortId === "marketCap") return marketCapDelta(left, right, direction);
  if (sortId === "pe") return compareNullable(left.peValue, right.peValue, direction) || marketCapDelta(left, right, direction);
  if (sortId === "eps") return compareNullable(left.epsValue, right.epsValue, direction) || marketCapDelta(left, right, direction);
  if (left.ticker === activeTicker) return -1;
  if (right.ticker === activeTicker) return 1;
  return left.ticker.localeCompare(right.ticker);
};

const parseRangeNumber = (value: string) => {
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const matchesNumericRange = (row: ScreenerRow, metricKey: ScreenerMetricKey, range: ScreenerNumericRange) => {
  if (!range.enabled) return true;
  const min = parseRangeNumber(range.min);
  const max = parseRangeNumber(range.max);
  if (min === null && max === null) return true;
  const value = getRowMetricValue(row, metricKey);
  if (value === null) return false;
  if (min !== null && value < min) return false;
  return !(max !== null && value > max);
};

export const filterAndSortScreenerRows = (
  rows: ScreenerRow[],
  state: ScreenerState,
  activeTicker: string,
): ScreenerRow[] => {
  const query = normalizeSearchText(state.query);
  const sectors = new Set(state.sectors.map((sector) => sector.trim()).filter(Boolean));
  const exchanges = new Set(state.exchanges.map((exchange) => exchange.trim().toUpperCase()).filter(Boolean));
  const watchlist = new Set(state.watchlistTickers);

  return rows
    .filter((row) => state.activeFilter !== "watchlist" || watchlist.has(row.ticker))
    .filter((row) => state.activeFilter !== "brvm" || row.exchange === "BRVM")
    .filter((row) => exchanges.size === 0 || exchanges.has(row.exchange))
    .filter((row) => query.length === 0 || row.searchText.includes(query))
    .filter((row) => sectors.size === 0 || sectors.has(row.sector))
    .filter((row) => SCREENER_METRIC_FILTERS.every((metricKey) => matchesNumericRange(row, metricKey, state.ranges[metricKey])))
    .sort(compareRows(activeTicker, state.sortId, state.sortDirection));
};

export const getAvailableSectors = (rows: ScreenerRow[]) => [...new Set(rows.map((row) => row.sector))]
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));

export const getAvailableExchanges = (rows: ScreenerRow[]) => [...new Set(rows.map((row) => row.exchange))]
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));

export const getExchangeCount = (rows: ScreenerRow[], exchange: string) => (
  rows.reduce((total, row) => total + (row.exchange === exchange ? 1 : 0), 0)
);

export const countExchangeSelections = (state: ScreenerState) => (
  state.exchanges.length > 0 ? state.exchanges.length : (state.activeFilter === "brvm" ? 1 : 0)
);

export const hasActiveRange = (range: ScreenerNumericRange) => (
  range.enabled && (parseRangeNumber(range.min) !== null || parseRangeNumber(range.max) !== null)
);

export const countActiveAdvancedFilters = (state: ScreenerState) => (
  (state.query.trim() ? 1 : 0)
  + state.sectors.length
  + state.exchanges.length
  + SCREENER_METRIC_FILTERS.filter((metricKey) => hasActiveRange(state.ranges[metricKey])).length
);

export const resetScreenerFilters = (state: ScreenerState): ScreenerState => ({
  ...state,
  activeFilter: "all",
  query: "",
  ranges: createEmptyScreenerRanges(),
  sectors: [],
  exchanges: [],
  sortId: "marketCap",
  sortDirection: "desc",
});

export const setScreenerRangeValue = (
  state: ScreenerState,
  metricKey: ScreenerMetricKey,
  bound: ScreenerRangeBound,
  value: string,
): ScreenerState => {
  const sanitized = sanitizeRangeText(value);
  const nextRange = {
    ...state.ranges[metricKey],
    [bound]: sanitized,
  };
  nextRange.enabled = nextRange.min.trim().length > 0 || nextRange.max.trim().length > 0;
  return {
    ...state,
    activeFilter: metricKey,
    ranges: { ...state.ranges, [metricKey]: nextRange },
    sortId: metricKey,
  };
};

export const clearScreenerRange = (state: ScreenerState, metricKey: ScreenerMetricKey): ScreenerState => ({
  ...state,
  ranges: { ...state.ranges, [metricKey]: emptyRange() },
});

export const toggleScreenerSector = (state: ScreenerState, sector: string): ScreenerState => {
  const cleanSector = sector.trim();
  if (!cleanSector) return state;
  const sectors = state.sectors.includes(cleanSector)
    ? state.sectors.filter((entry) => entry !== cleanSector)
    : [...state.sectors, cleanSector].slice(-MAX_SECTOR_FILTERS);
  return { ...state, activeFilter: "sector", sectors, sortId: "ticker" };
};

export const toggleScreenerExchange = (state: ScreenerState, exchange: string): ScreenerState => {
  const cleanExchange = exchange.trim().toUpperCase();
  if (!cleanExchange) return state;
  const exchanges = state.exchanges.includes(cleanExchange)
    ? state.exchanges.filter((entry) => entry !== cleanExchange)
    : [...state.exchanges, cleanExchange].slice(-MAX_EXCHANGE_FILTERS);
  return { ...state, activeFilter: "exchange", exchanges, sortId: "ticker" };
};

export const toggleWatchlistTicker = (state: ScreenerState, ticker: string): ScreenerState => {
  const [cleanTicker] = sanitizeTickerList([ticker]);
  if (!cleanTicker) return state;
  const exists = state.watchlistTickers.includes(cleanTicker);
  const watchlistTickers = exists
    ? state.watchlistTickers.filter((entry) => entry !== cleanTicker)
    : [...state.watchlistTickers, cleanTicker].slice(-MAX_WATCHLIST_TICKERS);
  return { ...state, watchlistTickers };
};

export const selectScreenerSort = (state: ScreenerState, sortId: ScreenerSortId): ScreenerState => {
  const nextDirection: ScreenerSortDirection = state.sortId === sortId ? (state.sortDirection === "asc" ? "desc" : "asc") : "desc";
  return { ...state, sortId, sortDirection: nextDirection };
};

export const selectScreenerFilter = (state: ScreenerState, filterId: ScreenerFilterId): ScreenerState => {
  if (filterId === "all") return resetScreenerFilters({ ...state, activeFilter: "all" });
  if (filterId === "brvm") return { ...state, activeFilter: "brvm", exchanges: ["BRVM"], sortId: "ticker", sortDirection: "desc" };
  if (filterId === "exchange") return { ...state, activeFilter: "exchange", sortId: "ticker", sortDirection: "desc" };
  if (filterId === "watchlist") return { ...state, activeFilter: "watchlist", sortId: state.sortId, sortDirection: state.sortDirection };
  if (filterId === "bonds") return { ...state, activeFilter: "bonds" };
  if (filterId === "sector") return { ...state, activeFilter: "sector", sortId: "ticker", sortDirection: "desc" };
  return { ...state, activeFilter: filterId, sortId: filterId, sortDirection: "desc" };
};

export const normalizeScreenerState = (value: unknown): ScreenerState => {
  const fallback = createDefaultScreenerState();
  const record = asRecord(value);
  if (!record) return fallback;

  return {
    activeFilter: readFilterId(record.activeFilter, fallback.activeFilter),
    query: sanitizeQuery(record.query),
    ranges: normalizeRanges(record.ranges),
    sectors: sanitizeStringList(record.sectors, MAX_SECTOR_FILTERS),
    exchanges: sanitizeExchangeList(record.exchanges),
    sortId: readSortId(record.sortId, fallback.sortId),
    sortDirection: readSortDirection(record.sortDirection, fallback.sortDirection),
    watchlistTickers: sanitizeTickerList(record.watchlistTickers),
  };
};

export const sanitizeExchangeList = (value: unknown, maxLength = MAX_EXCHANGE_FILTERS): string[] => (
  sanitizeStringList((Array.isArray(value) ? value : []).map((entry) => typeof entry === "string" ? entry.toUpperCase() : entry), maxLength)
);

export const buildScreenerPersistenceSnapshot = (state: ScreenerState): ScreenerPersistenceSnapshot => ({
  schemaVersion: SCREENERS_PERSISTENCE_SCHEMA_VERSION,
  ...normalizeScreenerState(state),
});

const sanitizeQuery = (value: unknown) => (
  typeof value === "string" ? value.trim().slice(0, MAX_QUERY_LENGTH) : ""
);

const sanitizeRangeText = (value: string) => value.replace(/[^0-9,.-]/g, "").slice(0, 18);

const sanitizeStringList = (value: unknown, maxLength: number) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean))]
    .slice(-maxLength);
};

export const sanitizeTickerList = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().toUpperCase())
    .filter((entry) => TICKER_PATTERN.test(entry)))]
    .slice(-MAX_WATCHLIST_TICKERS);
};

const normalizeRanges = (value: unknown): Record<ScreenerMetricKey, ScreenerNumericRange> => {
  const record = asRecord(value);
  const ranges = createEmptyScreenerRanges();
  SCREENER_METRIC_FILTERS.forEach((metricKey) => {
    const rawRange = asRecord(record?.[metricKey]);
    if (!rawRange) return;
    const min = typeof rawRange.min === "string" ? sanitizeRangeText(rawRange.min) : "";
    const max = typeof rawRange.max === "string" ? sanitizeRangeText(rawRange.max) : "";
    ranges[metricKey] = {
      enabled: Boolean(rawRange.enabled) || min.length > 0 || max.length > 0,
      max,
      min,
    };
  });
  return ranges;
};

const readFilterId = (value: unknown, fallback: ScreenerFilterId): ScreenerFilterId => (
  typeof value === "string" && SCREENERS_FILTERS.some((filter) => filter.id === value) ? value as ScreenerFilterId : fallback
);

const readSortId = (value: unknown, fallback: ScreenerSortId): ScreenerSortId => {
  if (value === "ticker" || value === "price" || value === "change" || value === "marketCap" || value === "pe" || value === "eps") {
    return value;
  }
  return fallback;
};

const readSortDirection = (value: unknown, fallback: ScreenerSortDirection): ScreenerSortDirection => (
  value === "asc" || value === "desc" ? value : fallback
);

const asRecord = (value: unknown): Record<string, unknown> | null => (
  typeof value === "object" && value !== null ? value as Record<string, unknown> : null
);
