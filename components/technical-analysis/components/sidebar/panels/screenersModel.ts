import type { BRVMSecurity } from "@/core/data/brvm-securities";
import type { LiveSnapshot } from "../../../config/market/marketSnapshotTypes";

export type ScreenerFilterId = "all" | "brvm" | "watchlist" | "price" | "change" | "marketCap" | "pe" | "eps" | "sector" | "bonds";
export type ScreenerMetricKey = "price" | "change" | "marketCap" | "pe" | "eps";
export type ScreenerSortId = "ticker" | ScreenerMetricKey;
export type ScreenerRangeBound = "min" | "max";

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
  sortId: ScreenerSortId;
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
  isActive: boolean;
  marketCapLabel: string;
  marketCapValue: number;
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
  securities: BRVMSecurity[];
}

export const SCREENERS_FILTERS: Array<{ id: ScreenerFilterId; label: string }> = [
  { id: "all", label: "All stocks" },
  { id: "brvm", label: "BRVM" },
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
const MAX_WATCHLIST_TICKERS = 120;
const SEARCH_ACCENT_PATTERN = /[\u0300-\u036f]/g;
const TICKER_PATTERN = /^[A-Z0-9._-]{1,16}$/;

const emptyRange = (): ScreenerNumericRange => ({ enabled: false, max: "", min: "" });

export const createEmptyScreenerRanges = (): Record<ScreenerMetricKey, ScreenerNumericRange> => ({
  change: emptyRange(),
  eps: emptyRange(),
  marketCap: emptyRange(),
  pe: emptyRange(),
  price: emptyRange(),
});

export const createDefaultScreenerState = (activeTicker = ""): ScreenerState => ({
  activeFilter: "all",
  query: "",
  ranges: createEmptyScreenerRanges(),
  sectors: [],
  sortId: "marketCap",
  watchlistTickers: sanitizeTickerList(activeTicker ? [activeTicker] : []),
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

export const isListedEquity = (security: BRVMSecurity) => (
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
    const price = toFiniteValue(snapshot?.price) ?? (isActive ? toFiniteValue(livePrice) : null);
    const volume = toFiniteValue(snapshot?.volume) ?? (isActive ? toFiniteValue(liveVolume) : null);
    const changePercent = readSnapshotChangePercent(snapshot) ?? security.priceChangeD1;
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
      isActive,
      marketCapLabel: formatMarketCap(security.marketCap),
      marketCapValue: security.marketCap,
      name: security.name,
      peLabel: formatNumber(security.peRatio),
      peValue: security.peRatio > 0 ? security.peRatio : null,
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

const compareNullableDesc = (left: number | null, right: number | null) => {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return right - left;
};

const compareNullableAsc = (left: number | null, right: number | null) => {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return left - right;
};

const getRowMetricValue = (row: ScreenerRow, metricKey: ScreenerMetricKey) => {
  if (metricKey === "price") return row.priceValue;
  if (metricKey === "change") return row.changePercent;
  if (metricKey === "marketCap") return row.marketCapValue;
  if (metricKey === "pe") return row.peValue;
  return row.epsValue;
};

const compareRows = (activeTicker: string, sortId: ScreenerSortId) => (left: ScreenerRow, right: ScreenerRow) => {
  if (sortId === "price") return compareNullableDesc(left.priceValue, right.priceValue) || right.marketCapValue - left.marketCapValue;
  if (sortId === "change") return compareNullableDesc(left.changePercent, right.changePercent) || right.marketCapValue - left.marketCapValue;
  if (sortId === "marketCap") return right.marketCapValue - left.marketCapValue;
  if (sortId === "pe") return compareNullableAsc(left.peValue, right.peValue) || right.marketCapValue - left.marketCapValue;
  if (sortId === "eps") return compareNullableDesc(left.epsValue, right.epsValue) || right.marketCapValue - left.marketCapValue;
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
  const watchlist = new Set(state.watchlistTickers);

  return rows
    .filter((row) => state.activeFilter !== "watchlist" || watchlist.has(row.ticker))
    .filter((row) => state.activeFilter !== "brvm" || row.ticker.length > 0)
    .filter((row) => query.length === 0 || row.searchText.includes(query))
    .filter((row) => sectors.size === 0 || sectors.has(row.sector))
    .filter((row) => SCREENER_METRIC_FILTERS.every((metricKey) => matchesNumericRange(row, metricKey, state.ranges[metricKey])))
    .sort(compareRows(activeTicker, state.sortId));
};

export const getAvailableSectors = (rows: ScreenerRow[]) => [...new Set(rows.map((row) => row.sector))]
  .filter(Boolean)
  .sort((left, right) => left.localeCompare(right));

export const hasActiveRange = (range: ScreenerNumericRange) => (
  range.enabled && (parseRangeNumber(range.min) !== null || parseRangeNumber(range.max) !== null)
);

export const countActiveAdvancedFilters = (state: ScreenerState) => (
  (state.query.trim() ? 1 : 0)
  + state.sectors.length
  + SCREENER_METRIC_FILTERS.filter((metricKey) => hasActiveRange(state.ranges[metricKey])).length
);

export const resetScreenerFilters = (state: ScreenerState): ScreenerState => ({
  ...state,
  activeFilter: "all",
  query: "",
  ranges: createEmptyScreenerRanges(),
  sectors: [],
  sortId: "marketCap",
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

export const toggleWatchlistTicker = (state: ScreenerState, ticker: string): ScreenerState => {
  const [cleanTicker] = sanitizeTickerList([ticker]);
  if (!cleanTicker) return state;
  const exists = state.watchlistTickers.includes(cleanTicker);
  const watchlistTickers = exists
    ? state.watchlistTickers.filter((entry) => entry !== cleanTicker)
    : [...state.watchlistTickers, cleanTicker].slice(-MAX_WATCHLIST_TICKERS);
  return { ...state, watchlistTickers };
};

export const selectScreenerFilter = (state: ScreenerState, filterId: ScreenerFilterId): ScreenerState => {
  if (filterId === "all") return resetScreenerFilters({ ...state, activeFilter: "all" });
  if (filterId === "brvm") return { ...state, activeFilter: "brvm", sortId: "ticker" };
  if (filterId === "watchlist") return { ...state, activeFilter: "watchlist", sortId: state.sortId };
  if (filterId === "bonds") return { ...state, activeFilter: "bonds" };
  if (filterId === "sector") return { ...state, activeFilter: "sector", sortId: "ticker" };
  return { ...state, activeFilter: filterId, sortId: filterId };
};

export const normalizeScreenerState = (value: unknown, activeTicker = ""): ScreenerState => {
  const fallback = createDefaultScreenerState(activeTicker);
  const record = asRecord(value);
  if (!record) return fallback;

  return {
    activeFilter: readFilterId(record.activeFilter, fallback.activeFilter),
    query: sanitizeQuery(record.query),
    ranges: normalizeRanges(record.ranges),
    sectors: sanitizeStringList(record.sectors, MAX_SECTOR_FILTERS),
    sortId: readSortId(record.sortId, fallback.sortId),
    watchlistTickers: sanitizeTickerList(record.watchlistTickers),
  };
};

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

const asRecord = (value: unknown): Record<string, unknown> | null => (
  typeof value === "object" && value !== null ? value as Record<string, unknown> : null
);
