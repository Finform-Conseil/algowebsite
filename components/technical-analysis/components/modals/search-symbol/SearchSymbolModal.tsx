"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useDispatch,
  useSelector,
} from "react-redux";
import clsx from "clsx";
import { BaseModal } from "../../common/primitives/BaseModal";
import {
  addComparisonSymbol,
  removeComparisonSymbol,
} from "../../../store/technicalAnalysisSlice";
import {
  selectActiveMarket,
  selectUiState,
  selectChartConfig,
} from "../../../store/selectors";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { BRVM_SECURITIES, type BRVMSecurity } from "@/core/data/brvm-securities";
import { BRVM_NAME_TO_TICKER } from "@/shared/utils/brvm-mapping";
import { BrvmLogoMark } from "@/components/design-system/commons/BrvmLogoMark/BrvmLogoMark";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { getMarketLogoUrl } from "@/core/data/market-logo-registry";
import { buildTickerCatalogQuery } from "@/components/design-system/commons/TickerSelectorModal/context/tickerCatalogPolicy";
import {
  readPersistedTickerCatalog,
  writePersistedTickerCatalog,
  type PersistedTickerCatalogSecurity,
} from "@/components/design-system/commons/TickerSelectorModal/context/tickerCatalogPersistence";
import { useGetAllBoursesQuery } from "@/core/infra/store/api";
import { EXCHANGE_STATIC_INFO } from "@/core/data/ExchangesStaticData";
import {
  createCompareInstrumentKey,
  parseCompareInstrumentKey,
} from "../../../config/compare-series/compareSeries";
import { MarketDirectoryContent, MarketDirectoryGrid, MarketDirectoryIntro } from "../../market/MarketDirectory";

// ============================================================================
// [TENOR 2026 HDR] TV-PARITY COMPARE MODAL
// SCAR-UX-01 FIX: Eradicated the broken "Replace" mode. This modal is now
// strictly dedicated to "Compare Symbols" exactly like TradingView (Image 2).
// It acts as a Smart Component, reading and dispatching directly to Redux.
// ============================================================================

type SymbolSearchMode = "replace" | "compare";
const MAX_SYMBOLS_STALE_AGE_MS = 5 * 60 * 1000;
type SymbolKindFilter = "all" | "stock" | "index";

const SYMBOL_KIND_FILTERS: Array<{ id: SymbolKindFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "stock", label: "Stocks" },
  { id: "index", label: "Indices" },
];

const SUPPORTED_COMPARE_MARKETS = ["BRVM", "CSE", "GSE", "JSE", "NGX", "NSE"] as const;
const SUPPORTED_COMPARE_MARKET_SET = new Set<string>(SUPPORTED_COMPARE_MARKETS);

const getMarketCurrency = (currency: unknown, fallback: string): string => {
  if (!currency || typeof currency !== "object") return fallback;
  const record = currency as { symbol?: unknown; code?: unknown };
  const value = record.symbol ?? record.code;
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : fallback;
};

interface SearchSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Legacy props kept optional to prevent breaking ModalOrchestrator during migration
  onSearch?: (symbol: string, mode: SymbolSearchMode) => void;
  initialMode?: SymbolSearchMode;
  currentSymbol?: string;
  comparisonSymbols?: string[];
}

const normalizeSearch = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const resolveSecurityTicker = (value: string): string => {
  const normalized = normalizeSearch(value);
  return BRVM_NAME_TO_TICKER[normalized] ?? normalized;
};

type SearchSecurity = BRVMSecurity & { searchAliases?: string[] };
type SymbolSourceState = "loading" | "api" | "api_empty" | "api_unavailable" | "api_stale";

const findSecurityBySymbol = (value: string, securities: SearchSecurity[]): SearchSecurity | undefined => {
  const ticker = resolveSecurityTicker(value);
  return securities.find((security) => (
    normalizeSearch(security.ticker) === ticker
    || security.searchAliases?.some((alias) => normalizeSearch(alias) === ticker)
  ));
};

const toSearchSector = (action: ActionEntity): SearchSecurity["sector"] => {
  const value = normalizeSearch(action.society?.industry?.name ?? action.society?.activity?.name ?? "");
  if (value.includes("BANK") || value.includes("FINANC")) return "Banking";
  if (value.includes("TELECOM")) return "Telecom";
  if (value.includes("ENERG") || value.includes("PETROL")) return "Energy";
  if (value.includes("DISTRIB") || value.includes("RETAIL")) return "Distribution";
  if (value.includes("INDUSTR")) return "Industry";
  return "Other";
};

const resolveActionCurrency = (action: ActionEntity): string => {
  const value = action.bourse?.currency?.symbol ?? action.bourse?.currency?.code;
  return typeof value === "string" && value.trim() ? value.trim().toUpperCase() : "N/D";
};

const toSearchSecurity = (action: ActionEntity): SearchSecurity => {
  const name = action.society?.name || action.ticker;
  const exchange = normalizeSearch(action.bourse?.ticker || "N/D") || "N/D";
  const ticker = normalizeSearch(action.ticker);
  const searchAliases = BRVM_SECURITIES
    .filter((security) => normalizeSearch(security.name) === normalizeSearch(name))
    .flatMap((security) => [security.ticker, security.name]);

  return {
    name,
    ticker,
    sector: toSearchSector(action),
    marketCap: Number.isFinite(action.latest_valuation_ratio?.market_cap) ? (action.latest_valuation_ratio?.market_cap as number) / 1_000_000 : 0,
    priceChangeD1: Number.isFinite(action.latest_price_metric?.change_1d_pct) ? (action.latest_price_metric?.change_1d_pct as number) : 0,
    peRatio: Number.isFinite(action.latest_valuation_ratio?.pe_ttm) ? (action.latest_valuation_ratio?.pe_ttm as number) : 0,
    returnYTD: Number.isFinite(action.latest_price_metric?.change_ytd_pct) ? (action.latest_price_metric?.change_ytd_pct as number) : 0,
    revenueT12M: 0,
    epsT12M: 0,
    country: action.society?.country?.name || "UEMOA",
    logoUrl: getMarketLogoUrl(exchange, ticker, name),
    isin: action.isin,
    exchange,
    currency: resolveActionCurrency(action),
    status: "active",
    searchAliases,
  };
};

const isActionInMarket = (action: ActionEntity, marketTicker: string): boolean => {
  const normalizedMarketTicker = normalizeSearch(marketTicker);
  return Boolean(normalizedMarketTicker) && normalizeSearch(action.bourse?.ticker) === normalizedMarketTicker;
};

const mergeApiSecurities = (
  current: SearchSecurity[],
  actions: ActionEntity[],
  marketTicker: string,
): SearchSecurity[] => {
  const securitiesByTicker = new Map(
    current.map((security) => [normalizeSearch(security.ticker), security]),
  );

  actions.filter((action) => isActionInMarket(action, marketTicker)).forEach((action) => {
    const ticker = normalizeSearch(action.ticker);
    if (ticker && !securitiesByTicker.has(ticker)) {
      securitiesByTicker.set(ticker, toSearchSecurity(action));
    }
  });

  return Array.from(securitiesByTicker.values());
};

const getSecurityKind = (security: BRVMSecurity): Exclude<SymbolKindFilter, "all"> =>
  security.sector === "Market Indices" ? "index" : "stock";

const scoreSecurity = (security: SearchSecurity, query: string): number => {
  if (!query) return 0;
  const symbol = normalizeSearch(security.ticker);
  const name = normalizeSearch(security.name);
  const isin = normalizeSearch(security.isin ?? "");
  const sector = normalizeSearch(security.sector);
  const country = normalizeSearch(security.country);
  const aliases = (security.searchAliases ?? []).map((alias: string) => normalizeSearch(alias));

  if (symbol === query) return 120;
  if (aliases.includes(query)) return 118;
  if (resolveSecurityTicker(query) === symbol) return 116;
  if (symbol.startsWith(query)) return 105;
  if (aliases.some((alias) => alias.startsWith(query))) return 103;
  if (name.startsWith(query)) return 92;
  if (name.includes(query)) return 80;
  if (sector.includes(query)) return 58;
  if (country.includes(query)) return 54;
  if (isin.includes(query)) return 50;
  return 0;
};

export const SearchSymbolModal: React.FC<SearchSymbolModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  const { getAllActions } = useActionRepository();
  
  // Smart Component: Read directly from Redux
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  const activeMarket = useSelector(selectActiveMarket);
  const marketsQuery = useGetAllBoursesQuery({ page: 1, page_size: 100 }, { skip: !isOpen });
  
  const comparisonSymbols = uiState.comparisonSymbols;
  const currentSymbol = chartConfig.symbol;
  const isMultiChartMode = uiState.multiChartLayout.isEnabled && uiState.multiChartLayout.charts.length > 1;
  const activeLayoutCell = isMultiChartMode
    ? uiState.multiChartLayout.charts.find((cell) => cell.chartId === uiState.multiChartLayout.activeChartId)
    : undefined;
  const currentMarketTicker = normalizeSearch(activeLayoutCell?.exchange || activeMarket.ticker);
  const [selectedMarketTicker, setSelectedMarketTicker] = useState<string | null>(null);
  const activeMarketTicker = selectedMarketTicker ?? "";
  const marketOptions = useMemo(() => {
    const apiRows = Array.isArray(marketsQuery.data?.data) ? marketsQuery.data.data : [];
    const apiByTicker = new Map(
      apiRows
        .filter((market) => SUPPORTED_COMPARE_MARKET_SET.has(normalizeSearch(market?.ticker)))
        .map((market) => [normalizeSearch(market.ticker), market] as const),
    );
    return SUPPORTED_COMPARE_MARKETS.map((ticker) => {
      const apiMarket = apiByTicker.get(ticker);
      const fallback = EXCHANGE_STATIC_INFO[ticker];
      return {
        ticker,
        name: apiMarket?.name?.trim() || ticker,
        currency: getMarketCurrency(apiMarket?.currency, fallback?.currency || "N/D"),
        country: fallback?.country || "Afrique",
        logo: fallback?.logo,
      };
    });
  }, [marketsQuery.data]);

  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const [apiSecurities, setApiSecurities] = useState<SearchSecurity[] | null>(null);
  const lastSuccessfulRefreshByMarketRef = useRef<Record<string, number>>({});
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [symbolSource, setSymbolSource] = useState<SymbolSourceState>("loading");
  const [activeKindFilter, setActiveKindFilter] = useState<SymbolKindFilter>("all");
  const normalizedInput = normalizeSearch(searchInput);

  useEffect(() => {
    if (!isOpen || !activeMarketTicker) {
      setApiSecurities(null);
      setIsLoadingSymbols(false);
      setSymbolSource("loading");
      return;
    }
    let cancelled = false;
    let cachedSecurities: SearchSecurity[] | null = null;

    setIsLoadingSymbols(true);
    setSymbolSource("loading");

    const applySecurities = (securities: SearchSecurity[]) => {
      if (cancelled) return;
      setApiSecurities(securities);
    };

    const restorePersistedSecurities = (
      securities: readonly PersistedTickerCatalogSecurity[],
    ): SearchSecurity[] => securities.map((security) => ({
      ...security,
      sector: security.sector as SearchSecurity["sector"],
      marketCap: security.marketCap ?? Number.NaN,
      priceChangeD1: security.priceChangeD1 ?? Number.NaN,
      peRatio: security.peRatio ?? Number.NaN,
      returnYTD: security.returnYTD ?? Number.NaN,
      revenueT12M: security.revenueT12M ?? Number.NaN,
      epsT12M: security.epsT12M ?? Number.NaN,
    }));

    const persistSecurities = (securities: SearchSecurity[], complete: boolean) => {
      const persistable: PersistedTickerCatalogSecurity[] = securities.map(({ searchAliases: _searchAliases, ...security }) => ({
        ...security,
        status: security.status === "delisted" ? "delisted" as const : "active" as const,
        marketCap: Number.isFinite(security.marketCap) ? security.marketCap : null,
        priceChangeD1: Number.isFinite(security.priceChangeD1) ? security.priceChangeD1 : null,
        peRatio: Number.isFinite(security.peRatio) ? security.peRatio : null,
        returnYTD: Number.isFinite(security.returnYTD) ? security.returnYTD : null,
        revenueT12M: Number.isFinite(security.revenueT12M) ? security.revenueT12M : null,
        epsT12M: Number.isFinite(security.epsT12M) ? security.epsT12M : null,
      }));
      void writePersistedTickerCatalog(activeMarketTicker, persistable, persistable.length, complete);
    };

    const revalidateCatalog = async (
      totalPages: number,
      initialSecurities: SearchSecurity[],
      firstPageActions: ActionEntity[],
    ) => {
      const refreshRequests = Array.from(
        { length: Math.max(0, totalPages - 1) },
        (_, index) => getAllActions(
          buildTickerCatalogQuery(activeMarketTicker, index + 2),
          { forceRefetch: true },
        ),
      );
      const refreshResults = await Promise.allSettled(refreshRequests);

      if (cancelled) return;

      const successfulActions: ActionEntity[] = [...firstPageActions];
      let hasRefreshFailure = false;
      refreshResults.forEach((result) => {
        if (result.status === "fulfilled") {
          successfulActions.push(...(result.value.data || []));
        } else {
          hasRefreshFailure = true;
        }
      });

      const refreshedSecurities = successfulActions.length > 0
        ? mergeApiSecurities([], successfulActions, activeMarketTicker)
        : hasRefreshFailure
          ? initialSecurities
          : [];

      applySecurities(refreshedSecurities);
      if (!hasRefreshFailure) {
        lastSuccessfulRefreshByMarketRef.current[activeMarketTicker] = Date.now();
        persistSecurities(refreshedSecurities, true);
      }
      setSymbolSource(
        hasRefreshFailure
          ? "api_stale"
          : refreshedSecurities.length > 0
            ? "api"
            : "api_empty",
      );
      setIsLoadingSymbols(false);
    };

    const loadApiSecurities = async () => {
      try {
        const persistedSnapshot = await readPersistedTickerCatalog(activeMarketTicker);
        if (cancelled) return;

        if (persistedSnapshot?.securities.length) {
          cachedSecurities = restorePersistedSecurities(persistedSnapshot.securities);
          applySecurities(cachedSecurities);
          lastSuccessfulRefreshByMarketRef.current[activeMarketTicker] = persistedSnapshot.updatedAt;
          const cacheAge = Date.now() - persistedSnapshot.updatedAt;
          setSymbolSource(cacheAge <= MAX_SYMBOLS_STALE_AGE_MS ? "api" : "api_stale");
          setIsLoadingSymbols(false);

          if (cacheAge <= MAX_SYMBOLS_STALE_AGE_MS) return;
        }

        const firstPage = await getAllActions(
          buildTickerCatalogQuery(activeMarketTicker, 1),
          { forceRefetch: cachedSecurities !== null },
        );
        const firstPageActions = firstPage.data || [];
        const firstSecurities = mergeApiSecurities([], firstPageActions, activeMarketTicker);

        if (cancelled) return;
        applySecurities(firstSecurities);
        lastSuccessfulRefreshByMarketRef.current[activeMarketTicker] = Date.now();
        persistSecurities(firstSecurities, false);
        setSymbolSource(firstSecurities.length > 0 ? "api" : "api_empty");
        setIsLoadingSymbols(false);

        const totalPages = Math.max(1, firstPage.total_pages || 1);
        void revalidateCatalog(totalPages, firstSecurities, firstPageActions);
      } catch {
        if (cancelled) return;

        if (cachedSecurities && cachedSecurities.length > 0) {
          applySecurities(cachedSecurities);
          setSymbolSource("api_stale");
          setIsLoadingSymbols(false);
          return;
        }

        applySecurities([]);
        setSymbolSource("api_unavailable");
        setIsLoadingSymbols(false);
      }
    };

    void loadApiSecurities();
    return () => {
      cancelled = true;
    };
  }, [activeMarketTicker, getAllActions, isOpen]);

  // --- DATA DERIVATION ---
  const searchCatalog = useMemo(() => apiSecurities ?? [], [apiSecurities]);
  const matchesKindFilter = useCallback((security: SearchSecurity) => (
    activeKindFilter === "all" || getSecurityKind(security) === activeKindFilter
  ), [activeKindFilter]);

  const results = useMemo(() => {
    if (!normalizedInput || isLoadingSymbols) return [];
    return searchCatalog
      .filter((security) => security.status !== "delisted")
      .filter(matchesKindFilter)
      .map((security) => ({ security, score: scoreSecurity(security, normalizedInput) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.security.ticker.localeCompare(b.security.ticker))
      .map((item) => item.security);
  }, [isLoadingSymbols, matchesKindFilter, normalizedInput, searchCatalog]);

  const sourceStatusMessage = symbolSource === "api_unavailable"
    ? `Impossible de charger les symboles ${activeMarketTicker} depuis l’API.`
    : symbolSource === "api_stale"
      ? `Données ${activeMarketTicker} précédentes conservées — revalidation API indisponible.`
      : symbolSource === "api_empty"
        ? `L’API n’a fourni aucun titre ${activeMarketTicker}.`
        : null;

  const normalizedCurrentSymbol = resolveSecurityTicker(currentSymbol);
  const normalizedComparisonSymbols = useMemo(
    () => new Set(comparisonSymbols.map((comparisonKey) => normalizeSearch(comparisonKey))),
    [comparisonSymbols]
  );
  const currentInstrumentKey = createCompareInstrumentKey(currentMarketTicker, normalizedCurrentSymbol);

  const addedInstruments = useMemo(
    () => comparisonSymbols
      .map((comparisonKey) => parseCompareInstrumentKey(comparisonKey, currentMarketTicker))
      .filter((instrument): instrument is NonNullable<typeof instrument> => Boolean(instrument))
      .filter((instrument) => instrument.market === activeMarketTicker)
      .map((instrument) => findSecurityBySymbol(instrument.symbol, searchCatalog))
      .filter((security): security is SearchSecurity => Boolean(security)),
    [activeMarketTicker, comparisonSymbols, currentMarketTicker, searchCatalog]
  );

  const catalogInstruments = useMemo(() => searchCatalog
    .filter((security) => security.status !== "delisted")
    .filter(matchesKindFilter)
    .filter((security) => !normalizedComparisonSymbols.has(createCompareInstrumentKey(activeMarketTicker, security.ticker)))
    .filter((security) => createCompareInstrumentKey(activeMarketTicker, security.ticker) !== currentInstrumentKey)
    .sort((left, right) => left.ticker.localeCompare(right.ticker)),
  [activeMarketTicker, currentInstrumentKey, matchesKindFilter, normalizedComparisonSymbols, searchCatalog]);

  const visibleInstruments = normalizedInput ? results : catalogInstruments;

  // --- HANDLERS ---
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleToggleSymbol = useCallback((security: SearchSecurity) => {
    if (!activeMarketTicker) return;
    const normalizedSymbol = resolveSecurityTicker(security.ticker);
    const comparisonKey = createCompareInstrumentKey(activeMarketTicker, normalizedSymbol);

    if (comparisonKey === currentInstrumentKey) {
      addNotification({ title: "Action impossible", message: `${security.ticker} est déjà le graphique principal sur ${activeMarketTicker}.`, type: "warning", iconType: "faExclamationTriangle" });
      return;
    }

    if (normalizedComparisonSymbols.has(comparisonKey)) {
      dispatch(removeComparisonSymbol(comparisonKey));
    } else {
      if (comparisonSymbols.length >= 5) {
        addNotification({ title: "Limite atteinte", message: "Maximum 5 symboles en comparaison.", type: "warning", iconType: "faExclamationTriangle" });
        return;
      }
      dispatch(addComparisonSymbol(comparisonKey));
      setSearchInput("");
    }
  }, [activeMarketTicker, addNotification, comparisonSymbols.length, currentInstrumentKey, dispatch, normalizedComparisonSymbols]);

  // Reset input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchInput("");
      setActiveKindFilter("all");
      setSelectedMarketTicker(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !activeMarketTicker) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimer);
  }, [activeMarketTicker, isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // --- RENDER HELPERS ---
  const renderInstrumentRow = (security: SearchSecurity, isAddedSection: boolean) => {
    const normalizedSymbol = resolveSecurityTicker(security.ticker);
    const comparisonKey = createCompareInstrumentKey(activeMarketTicker, normalizedSymbol);
    const isCurrent = comparisonKey === currentInstrumentKey;
    const isAdded = normalizedComparisonSymbols.has(comparisonKey);

    return (
      <div
        key={`${isAddedSection ? "added" : "result"}-${security.exchange ?? activeMarketTicker}-${security.ticker}`}
        className={clsx("tv-compare-row", isAdded && "is-selected", isCurrent && "is-current")}
        onClick={() => !isCurrent && handleToggleSymbol(security)}
        role="button"
        aria-disabled={isCurrent}
        tabIndex={isCurrent ? -1 : 0}
        onKeyDown={(event) => {
          if (!isCurrent && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            handleToggleSymbol(security);
          }
        }}
      >
        <BrvmLogoMark
          ticker={security.ticker}
          name={security.name}
          logoUrl={security.logoUrl}
          sector={security.sector}
          status={security.status}
          size={34}
          shape="rounded"
          imageSizes="34px"
          style={{ marginRight: "var(--gp-space-sm)" }}
        />

        <div className="tv-compare-row__identity">
          <div className="tv-compare-row__headline">
            <span className="tv-compare-row__ticker">{security.ticker}</span>
            <span className="tv-compare-row__name">{security.name}</span>
          </div>
          <span className="tv-compare-row__context">
            {security.country} · {security.sector}
          </span>
        </div>

        <div className="tv-compare-row__meta">
          <div className="tv-compare-row__market">
            <span className="tv-compare-row__exchange">{security.exchange ?? activeMarketTicker}</span>
            <span className="tv-compare-row__kind">{getSecurityKind(security)}</span>
          </div>
          <div className="tv-compare-row__state">
            {isAdded && <i className="bi bi-check-lg" aria-hidden="true"></i>}
            {isCurrent && <i className="bi bi-bar-chart-fill" title="Graphique principal" aria-hidden="true"></i>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compare symbols"
      icon={null} // TV doesn't use an icon here
      overlayRef={searchOverlayRef}
      contentRef={searchModalRef}
      maxWidth={activeMarketTicker ? "700px" : "860px"}
      hideFooter={true}
      className={clsx("tv-compare-modal-override", !activeMarketTicker && "tv-compare-modal--market-step")}
    >
      <div className="gp-compare-symbol-modal">
        {!activeMarketTicker ? (
          <MarketDirectoryContent className="gp-compare-market-directory">
            <MarketDirectoryIntro
              className="gp-compare-market-header"
              description="Choisissez la bourse du titre à comparer. Le graphique principal et son marché restent inchangés."
            />
            <MarketDirectoryGrid
              markets={marketOptions}
              activeMarketTicker={currentMarketTicker}
              onSelectMarket={(market) => setSelectedMarketTicker(market.ticker)}
              ariaLabel="Bourses disponibles pour la comparaison"
              activeCheckLabel="Marché du graphique principal"
            />
          </MarketDirectoryContent>
        ) : (
          <>
            <div className="gp-compare-market-toolbar">
              <button
                type="button"
                onClick={() => { setSelectedMarketTicker(null); setSearchInput(""); }}
                className="gp-compare-market-back"
              >
                <i className="bi bi-arrow-left" aria-hidden="true" /> Changer de bourse
              </button>
              <span className="gp-compare-market-meta">
                Bourse sélectionnée : <strong className="gp-compare-market-code">{activeMarketTicker}</strong>
              </span>
            </div>
        
        {/* Search Input Area */}
        <div className="gp-compare-search-section">
          <div className="gp-compare-search-field">
            <i className="bi bi-search gp-compare-search-icon" aria-hidden="true"></i>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Symbol, ISIN, or company name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="gp-compare-search-input"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            {searchInput && (
              <button
                type="button"
                className="gp-compare-search-clear"
                aria-label="Effacer la recherche"
                onClick={() => setSearchInput("")}
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            )}
          </div>
          <div className="gp-compare-filter-row" role="tablist" aria-label="Filtrer les symboles">
            {SYMBOL_KIND_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={activeKindFilter === filter.id}
                onClick={() => setActiveKindFilter(filter.id)}
                className={clsx("gp-compare-kind-filter", activeKindFilter === filter.id && "is-active")}
              >
                {filter.label}
              </button>
            ))}
            <span className="gp-compare-filter-count">
              {activeMarketTicker} · {searchCatalog.length} symbols
            </span>
          </div>
        </div>

        {/* Scrollable Lists Area */}
        <div className="gp-custom-scrollbar gp-compare-results-scroll">
          {sourceStatusMessage && (
            <div role="status" className="gp-compare-source-status">
              {sourceStatusMessage}
            </div>
          )}

          {/* ADDED SYMBOLS SECTION */}
          {!normalizedInput && addedInstruments.length > 0 && (
            <div className="gp-compare-section">
              <div className="gp-compare-section-title">
                Added Symbols
              </div>
              <div>
                {addedInstruments.map((instrument) => renderInstrumentRow(instrument, true))}
              </div>
            </div>
          )}

          {/* RECENT / SEARCH RESULTS SECTION */}
          <div>
            <div className="gp-compare-section-title">
              {normalizedInput ? "Search Results" : `All Symbols · ${activeMarketTicker}`}
            </div>
            <div>
              {isLoadingSymbols ? (
                <div className="gp-compare-empty">
                  <span aria-hidden="true" className="gp-compare-spinner" />
                  Loading symbols...
                </div>
              ) : visibleInstruments.length > 0 ? (
                visibleInstruments.map((instrument) => renderInstrumentRow(instrument, false))
              ) : (
                <div className="gp-compare-empty">
                  No symbols match your criteria
                </div>
              )}
            </div>
          </div>

        </div>
          </>
        )}
      </div>
    </BaseModal>
  );
};

// --- EOF ---
