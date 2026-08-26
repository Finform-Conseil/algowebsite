import React from "react";
import { useCurrency } from "@/hooks/useCurrency";
import clsx from "clsx";
import { ChevronDown, LoaderCircle, RotateCcw, Search, Star, X } from "lucide-react";
import type { LiveSnapshot } from "../../../config/market/marketSnapshotTypes";
import { fetchSidebarScreenerSecurities, type BRVMBond, type BRVMScreenerSecurity } from "../data/sidebarFetchers";
import { useSidebarDataPort } from "../data/sidebarDataPortAdapter";
import {
  buildScreenerPersistenceSnapshot,
  buildScreenerRows,
  clearScreenerRange,
  compactSectorLabel,
  countActiveAdvancedFilters,
  createDefaultScreenerState,
  filterAndSortScreenerRows,
  getAvailableExchanges,
  getAvailableSectors,
  hasActiveRange,
  isMetricFilterId,
  normalizeScreenerState,
  resetScreenerFilters,
  SCREENERS_FILTERS,
  selectScreenerFilter,
  selectScreenerSort,
  setScreenerRangeValue,
  toggleScreenerExchange,
  toggleScreenerSector,
  toggleWatchlistTicker,
  type ScreenerFilterId,
  type ScreenerMetricKey,
  type ScreenerSortId,
  type ScreenerState,
} from "./screenersModel";
import {
  readPersistedScreenersState,
  writePersistedScreenersState,
} from "./screenersPersistence";

interface ScreenersPanelProps {
  activeCurrency: string;
  activeTicker: string;
  auditDate: string;
  bondsLoading: boolean;
  livePrice: number | null | undefined;
  liveVolume: number | null | undefined;
  marketSnapshots: Record<string, LiveSnapshot>;
  onOpenBondsPage: () => void;
  onOpenEquityPage: () => void;
  onOpenTickerSelector?: () => void;
  topBonds: BRVMBond[];
}

type ScreenerFetchStatus = "loading" | "ready" | "error";
type PersistenceStatus = "loading" | "ready";

const PERSISTENCE_WRITE_DEBOUNCE_MS = 260;
const SEARCH_MAX_LENGTH = 80;

const METRIC_FILTER_META: Record<ScreenerMetricKey, { label: string; maxLabel: string; minLabel: string }> = {
  change: { label: "Chg %", maxLabel: "Max %", minLabel: "Min %" },
  eps: { label: "EPS", maxLabel: "Max %", minLabel: "Min %" },
  marketCap: { label: "Mkt cap", maxLabel: "Max M", minLabel: "Min M" },
  pe: { label: "P/E", maxLabel: "Max", minLabel: "Min" },
  price: { label: "Price", maxLabel: "Max", minLabel: "Min" },
};

const getToneClassName = (value: number | null) => {
  if (value === null || value === 0) return "is-neutral";
  return value > 0 ? "is-positive" : "is-negative";
};

const isPanelFilter = (filterId: ScreenerFilterId) => (
  filterId === "sector" || filterId === "exchange" || filterId === "watchlist" || isMetricFilterId(filterId)
);

const getFilterLabel = (filterId: ScreenerFilterId) => (
  SCREENERS_FILTERS.find((filter) => filter.id === filterId)?.label || "All stocks"
);

export const ScreenersPanel = React.memo((props: ScreenersPanelProps) => {
  const sidebarDataPort = useSidebarDataPort();
  const { convert, displayCurrency } = useCurrency();
  const targetCurrency = displayCurrency || props.activeCurrency;
  const persistenceReadyRef = React.useRef(false);

  const [screenerSecurities, setScreenerSecurities] = React.useState<BRVMScreenerSecurity[]>([]);
  const [screenerFetchStatus, setScreenerFetchStatus] = React.useState<ScreenerFetchStatus>("loading");
  const [screenerFetchError, setScreenerFetchError] = React.useState<string | null>(null);
  const [screenerRetry, setScreenerRetry] = React.useState(0);
  const [screenerState, setScreenerState] = React.useState<ScreenerState>(() => createDefaultScreenerState());
  const [openFilter, setOpenFilter] = React.useState<ScreenerFilterId | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    setScreenerFetchStatus("loading");
    setScreenerFetchError(null);
    void fetchSidebarScreenerSecurities(sidebarDataPort, controller.signal)
      .then((securities) => {
        if (controller.signal.aborted) return;
        setScreenerSecurities(securities);
        setScreenerFetchStatus("ready");
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setScreenerFetchStatus("error");
        setScreenerFetchError(error instanceof Error ? error.message : "API screener indisponible");
      });
    return () => controller.abort();
  }, [screenerRetry, sidebarDataPort]);

  React.useEffect(() => {
    let cancelled = false;
    void readPersistedScreenersState()
      .then((snapshot) => {
        if (cancelled) return;
        setScreenerState(normalizeScreenerState(snapshot));
      })
      .finally(() => {
        if (cancelled) return;
        persistenceReadyRef.current = true;
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!persistenceReadyRef.current) return undefined;
    const timeoutId = window.setTimeout(() => {
      void writePersistedScreenersState(buildScreenerPersistenceSnapshot(screenerState));
    }, PERSISTENCE_WRITE_DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [screenerState]);



  const allRows = React.useMemo(() => buildScreenerRows({
    activeCurrency: targetCurrency,
    convertValue: convert,
    activeTicker: props.activeTicker,
    livePrice: props.livePrice,
    liveVolume: props.liveVolume,
    marketSnapshots: props.marketSnapshots,
    securities: screenerSecurities,
  }), [
    convert,
    targetCurrency,
    props.activeTicker,
    props.livePrice,
    props.liveVolume,
    props.marketSnapshots,
    screenerSecurities,
  ]);
  const visibleRows = React.useMemo(
    () => filterAndSortScreenerRows(allRows, screenerState, props.activeTicker),
    [allRows, props.activeTicker, screenerState],
  );
  const availableSectors = React.useMemo(() => getAvailableSectors(allRows), [allRows]);
  const availableExchanges = React.useMemo(() => getAvailableExchanges(allRows), [allRows]);
  const watchlistSet = React.useMemo(() => new Set(screenerState.watchlistTickers), [screenerState.watchlistTickers]);
  const activeAdvancedFilterCount = countActiveAdvancedFilters(screenerState);
  const visibleBonds = props.topBonds;
  const hasVisibleBonds = visibleBonds.length > 0;
  const isBondLoading = props.bondsLoading;
  const bondSummary = isBondLoading ? "Chargement" : hasVisibleBonds ? `${visibleBonds.length} obligations` : "Indisponible";
  const subtitle = screenerState.activeFilter === "bonds"
    ? "Bonds - BRVM - " + bondSummary
    : screenerState.activeFilter === "exchange"
      ? `Exchange - ${availableExchanges.length} bourses`
      : screenerState.activeFilter === "watchlist"
        ? `Watchlist - ${visibleRows.length.toLocaleString("fr-FR")}/${screenerState.watchlistTickers.length.toLocaleString("fr-FR")} symboles`
        : screenerFetchStatus === "loading"
        ? "Actions - Chargement API"
        : screenerFetchStatus === "error"
          ? "Actions - API indisponible"
          : `${getFilterLabel(screenerState.activeFilter)} - ${visibleRows.length.toLocaleString("fr-FR")}/${allRows.length.toLocaleString("fr-FR")} valeurs API`;

  const updateScreenerState = React.useCallback((updater: (state: ScreenerState) => ScreenerState) => {
    setScreenerState((current) => updater(current));
  }, []);

  const handleFilterSelect = React.useCallback((filterId: ScreenerFilterId) => {
    updateScreenerState((current) => selectScreenerFilter(current, filterId));
    setOpenFilter((current) => (isPanelFilter(filterId) ? (current === filterId ? null : filterId) : null));
  }, [updateScreenerState]);

  const handleSortSelect = React.useCallback((sortId: ScreenerSortId) => {
    updateScreenerState((current) => selectScreenerSort(current, sortId));
  }, [updateScreenerState]);

  const handleQueryChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.slice(0, SEARCH_MAX_LENGTH);
    updateScreenerState((current) => ({
      ...current,
      activeFilter: current.activeFilter === "bonds" ? "all" : current.activeFilter,
      query,
    }));
  }, [updateScreenerState]);

  const clearQuery = React.useCallback(() => {
    updateScreenerState((current) => ({ ...current, query: "" }));
  }, [updateScreenerState]);

  const resetFilters = React.useCallback(() => {
    updateScreenerState(resetScreenerFilters);
    setOpenFilter(null);
  }, [updateScreenerState]);

  const addActiveTickerToWatchlist = React.useCallback(() => {
    updateScreenerState((current) => toggleWatchlistTicker(current, props.activeTicker));
  }, [props.activeTicker, updateScreenerState]);

  const renderAdvancedPanel = () => {
    if (!openFilter || !isPanelFilter(openFilter)) return null;

    if (isMetricFilterId(openFilter)) {
      const meta = METRIC_FILTER_META[openFilter];
      const range = screenerState.ranges[openFilter];
      return (
        <div className="gp-screeners-advanced-panel">
          <div className="gp-screeners-advanced-head">
            <strong>{meta.label}</strong>
            <button type="button" aria-label="Close filter" onClick={() => setOpenFilter(null)}><X size={14} /></button>
          </div>
          <div className="gp-screeners-range-grid">
            <label>
              <span>{meta.minLabel}</span>
              <input
                inputMode="decimal"
                value={range.min}
                onChange={(event) => updateScreenerState((current) => setScreenerRangeValue(current, openFilter, "min", event.target.value))}
              />
            </label>
            <label>
              <span>{meta.maxLabel}</span>
              <input
                inputMode="decimal"
                value={range.max}
                onChange={(event) => updateScreenerState((current) => setScreenerRangeValue(current, openFilter, "max", event.target.value))}
              />
            </label>
            <button type="button" onClick={() => updateScreenerState((current) => clearScreenerRange(current, openFilter))}>Reset</button>
          </div>
        </div>
      );
    }

    if (openFilter === "sector") {
      return (
        <div className="gp-screeners-advanced-panel">
          <div className="gp-screeners-advanced-head">
            <strong>Sector</strong>
            <button type="button" aria-label="Close filter" onClick={() => setOpenFilter(null)}><X size={14} /></button>
          </div>
          <div className="gp-screeners-sector-grid">
            {availableSectors.map((sector) => (
              <button
                key={sector}
                type="button"
                className={clsx(screenerState.sectors.includes(sector) && "is-active")}
                aria-pressed={screenerState.sectors.includes(sector)}
                onClick={() => updateScreenerState((current) => toggleScreenerSector(current, sector))}
              >
                {compactSectorLabel(sector)}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (openFilter === "exchange") {
      return (
        <div className="gp-screeners-advanced-panel">
          <div className="gp-screeners-advanced-head">
            <strong>Exchange</strong>
            <button type="button" aria-label="Close filter" onClick={() => setOpenFilter(null)}><X size={14} /></button>
          </div>
          <div className="gp-screeners-sector-grid">
            {availableExchanges.map((exchange) => (
              <button
                key={exchange}
                type="button"
                className={clsx(screenerState.exchanges.includes(exchange) && "is-active")}
                aria-pressed={screenerState.exchanges.includes(exchange)}
                onClick={() => updateScreenerState((current) => toggleScreenerExchange(current, exchange))}
              >
                {exchange}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="gp-screeners-advanced-panel">
        <div className="gp-screeners-advanced-head">
          <strong>Watchlist</strong>
          <button type="button" aria-label="Close filter" onClick={() => setOpenFilter(null)}><X size={14} /></button>
        </div>
        <div className="gp-screeners-watchlist-tools">
          <span>{screenerState.watchlistTickers.length.toLocaleString("fr-FR")} {screenerState.watchlistTickers.length === 1 ? "symbol" : "symbols"}</span>
          <button type="button" onClick={addActiveTickerToWatchlist}>{watchlistSet.has(props.activeTicker) ? "Remove" : "Add"} {props.activeTicker}</button>
        </div>
      </div>
    );
  };

  const renderRows = () => {
    if (screenerFetchStatus === "loading") {
      return (
        <div className="gp-screeners-empty gp-screeners-empty--table gp-screeners-loading" aria-live="polite">
          <LoaderCircle size={22} aria-hidden="true" />
          <span>Chargement des actions</span>
        </div>
      );
    }
    if (screenerFetchStatus === "error") {
      return (
        <div className="gp-screeners-empty gp-screeners-empty--table" role="alert">
          <span>{screenerFetchError || "API screener indisponible."}</span>
          <button type="button" onClick={() => setScreenerRetry((value) => value + 1)}>Recharger</button>
        </div>
      );
    }
    if (visibleRows.length === 0) {
      return (
        <div className="gp-screeners-empty gp-screeners-empty--table">
          <span>{screenerState.activeFilter === "watchlist"
            ? (screenerState.watchlistTickers.length === 0 ? "Watchlist vide." : "Aucun symbole suivi coté.")
            : "Aucune valeur."}</span>
          {screenerState.activeFilter === "watchlist" ? (
            <button type="button" onClick={addActiveTickerToWatchlist}>{watchlistSet.has(props.activeTicker) ? "Remove" : "Add"} {props.activeTicker}</button>
          ) : (
            <button type="button" onClick={resetFilters}>Reset filters</button>
          )}
        </div>
      );
    }

    return (
      <div className="gp-screeners-table-wrap" role="region" aria-label="Table screener actions">
        <table className="gp-screeners-table">
          <thead>
            <tr>
              <th scope="col" aria-sort={screenerState.sortId === "ticker" ? (screenerState.sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button
                  type="button"
                  className="gp-screeners-sort-btn"
                  onClick={() => handleSortSelect("ticker")}
                >
                  <span>Symbol</span>
                  {screenerState.sortId === "ticker" && (
                    <span className="gp-screeners-sort-indicator" aria-hidden="true">
                      {screenerState.sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" aria-sort={screenerState.sortId === "price" ? (screenerState.sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button
                  type="button"
                  className="gp-screeners-sort-btn"
                  onClick={() => handleSortSelect("price")}
                >
                  <span>Price</span>
                  {screenerState.sortId === "price" && (
                    <span className="gp-screeners-sort-indicator" aria-hidden="true">
                      {screenerState.sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
              <th scope="col" aria-sort={screenerState.sortId === "change" ? (screenerState.sortDirection === "asc" ? "ascending" : "descending") : "none"}>
                <button
                  type="button"
                  className="gp-screeners-sort-btn"
                  onClick={() => handleSortSelect("change")}
                >
                  <span>Move</span>
                  {screenerState.sortId === "change" && (
                    <span className="gp-screeners-sort-indicator" aria-hidden="true">
                      {screenerState.sortDirection === "asc" ? "▲" : "▼"}
                    </span>
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isWatchlisted = watchlistSet.has(row.ticker);
              return (
                <tr key={row.ticker} className={clsx(row.isActive && "is-active")}>
                  <th scope="row">
                    <span className="gp-screeners-symbol-row">
                      <button
                        type="button"
                        className={clsx("gp-screeners-watch-toggle", isWatchlisted && "is-active")}
                        aria-label={`${isWatchlisted ? "Remove" : "Add"} ${row.ticker} watchlist`}
                        aria-pressed={isWatchlisted}
                        onClick={() => updateScreenerState((current) => toggleWatchlistTicker(current, row.ticker))}
                      >
                        <Star size={12} fill={isWatchlisted ? "currentColor" : "none"} />
                      </button>
                      <span className="gp-screeners-symbol">{row.ticker}</span>
                    </span>
                    <span className="gp-screeners-name">{row.name}</span>
                    <span className="gp-screeners-country">{compactSectorLabel(row.sector)} - {row.country}</span>
                  </th>
                  <td>
                    <span className="gp-screeners-price">{row.priceLabel}</span>
                    <span className="gp-screeners-metric">Cap {row.marketCapLabel}</span>
                    <span className="gp-screeners-metric">Vol {row.volumeLabel}</span>
                  </td>
                  <td>
                    <span className={clsx("gp-screeners-change", getToneClassName(row.changePercent))}>{row.changeLabel}</span>
                    <span className={clsx("gp-screeners-metric", getToneClassName(row.ytdPercent))}>YTD {row.ytdLabel}</span>
                    <span className="gp-screeners-metric">P/E {row.peLabel}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="gp-sidebar-section gp-screeners-panel" aria-labelledby="gp-screeners-title">
      <div className="gp-screeners-header">
        <div>
          <span id="gp-screeners-title" className="gp-sidebar-title">Stock Screener</span>
          <div className="gp-screeners-subtitle">{subtitle}</div>
        </div>
        <div className="gp-screeners-header-actions">
          {props.onOpenTickerSelector && <button type="button" onClick={props.onOpenTickerSelector}>Symbol</button>}
          <button type="button" onClick={props.onOpenEquityPage}>Profile</button>
        </div>
      </div>

      <div className="gp-screeners-search-row">
        <Search size={14} aria-hidden="true" />
        <input
          aria-label="Search screeners"
          type="search"
          value={screenerState.query}
          placeholder="Search"
          onChange={handleQueryChange}
        />
        {screenerState.query && (
          <button type="button" aria-label="Clear search" onClick={clearQuery}><X size={13} /></button>
        )}
        {activeAdvancedFilterCount > 0 && (
          <button type="button" aria-label="Reset filters" onClick={resetFilters}><RotateCcw size={13} /></button>
        )}
      </div>

      <div className="gp-screeners-filter-strip" aria-label="Filtres screener TradingView">
        {SCREENERS_FILTERS.map((filter) => {
          const isActive = screenerState.activeFilter === filter.id || (isMetricFilterId(filter.id) && hasActiveRange(screenerState.ranges[filter.id]));
          return (
            <button
              key={filter.id}
              type="button"
              className={clsx(isActive && "is-active", openFilter === filter.id && "is-open")}
              aria-expanded={isPanelFilter(filter.id) ? openFilter === filter.id : undefined}
              aria-pressed={screenerState.activeFilter === filter.id}
              onClick={() => handleFilterSelect(filter.id)}
            >
              <span>{filter.label}</span>
              {isPanelFilter(filter.id) && <ChevronDown size={11} aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      {renderAdvancedPanel()}

      {screenerState.activeFilter === "bonds" ? (
        <div className="gp-screeners-bonds gp-screeners-bonds--active">
          <div className="gp-screeners-bonds-head">
            <span>Bond Screener</span>
            <button type="button" onClick={props.onOpenBondsPage}>{bondSummary}</button>
          </div>
          {isBondLoading ? (
            <div className="gp-screeners-bond-skeleton" aria-label="Chargement obligations">
              <span />
              <span />
              <span />
            </div>
          ) : visibleBonds.length > 0 ? (
            visibleBonds.map((bond) => (
              <div key={`${bond.name}-${bond.maturityDate}`} className="gp-screeners-bond-row">
                <span>{bond.name}</span>
                <strong>{bond.clearingYield > 0 ? "+" : ""}{bond.clearingYield.toLocaleString("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%</strong>
                <small>{bond.maturityDate}</small>
              </div>
            ))
          ) : (
            <div className="gp-screeners-empty">
              <span>Donnees obligations indisponibles.</span>
              <button type="button" onClick={props.onOpenBondsPage}>Ouvrir la page obligations</button>
            </div>
          )}
        </div>
      ) : renderRows()}

      {screenerState.activeFilter !== "bonds" && (
        <div className="gp-screeners-bonds">
          <div className="gp-screeners-bonds-head">
            <span>Bond Screener</span>
            <button type="button" onClick={() => handleFilterSelect("bonds")}>{bondSummary}</button>
          </div>
          {visibleBonds.slice(0, 3).map((bond) => (
            <div key={`${bond.name}-${bond.maturityDate}`} className="gp-screeners-bond-row">
              <span>{bond.name}</span>
              <strong>{bond.clearingYield > 0 ? "+" : ""}{bond.clearingYield.toLocaleString("fr-FR", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}%</strong>
              <small>{bond.maturityDate}</small>
            </div>
          ))}
          {!isBondLoading && visibleBonds.length === 0 && <div className="gp-screeners-empty">Donnees obligations indisponibles.</div>}
        </div>
      )}

      <div className="gp-screeners-source">
        <span>Date: {props.auditDate}</span>
        <span>Formula: Search, ranges, sectors, watchlist, sort</span>
      </div>
    </section>
  );
});

ScreenersPanel.displayName = "ScreenersPanel";
