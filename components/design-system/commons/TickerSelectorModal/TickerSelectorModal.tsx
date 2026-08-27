"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/core/infra/store/hooks";
import { createPortal } from "react-dom";
import { BRVMSecurity, SECTOR_COLORS } from "@/core/data/brvm-securities";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import type { PaginatedResponse } from "@/core/domain/types/pagination.type";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { BrvmLogoMark } from "@/components/design-system/commons/BrvmLogoMark/BrvmLogoMark";
import { useTickerSelector } from "./context/TickerSelectorContext";
import { selectActiveMarket, selectUiState } from "@/components/technical-analysis/store/selectors";
import { setActiveMarket, updateLayoutChart } from "@/components/technical-analysis/store/technicalAnalysisSlice";
import { writePersistedMarketPreference } from "@/components/technical-analysis/hooks/MarketData/marketPreferencePersistence";
import { getMarketLogoUrl } from "@/core/data/market-logo-registry";
import {
  BACKGROUND_PREFETCH_CONCURRENCY,
  getSpeculativeCatalogPages,
  readPersistedTickerCatalog,
  writePersistedTickerCatalog,
  type PersistedTickerCatalogSecurity,
  type PersistedTickerCatalogSnapshot,
} from "./context/tickerCatalogPersistence";
import { buildTickerCatalogQuery } from "./context/tickerCatalogPolicy";

// ============================================================================
// [TENOR 2026 SRE] ZERO-LAG TICKER SELECTOR MODAL
// Architecture:
// 1. useDeferredValue: Decouples typing (120Hz) from list filtering/rendering.
// 2. React.memo (O(1) Updates): Only the newly active and previously active rows re-render during keyboard navigation.
// 3. Stable native scrolling: containment without content-visibility layout jumps.
// 4. Safe Highlighting: No dangerouslySetInnerHTML (XSS Shield).
// ============================================================================

// --- ICONS ---
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- SAFE HIGHLIGHTER ---
const HighlightMatch = React.memo(({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} style={{ color: "#ff9f04", fontWeight: 700 }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});
HighlightMatch.displayName = "HighlightMatch";

// --- FORMATTERS ---
const formatMarketCap = (value?: number | null) => {
  if (value == null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}B FCFA`;
  return `${value.toFixed(1)}M FCFA`;
};

type SelectorSecurity = Omit<
  BRVMSecurity,
  "marketCap" | "priceChangeD1" | "peRatio" | "returnYTD" | "revenueT12M" | "epsT12M"
> & {
  marketCap?: number | null;
  priceChangeD1?: number | null;
  peRatio?: number | null;
  returnYTD?: number | null;
  revenueT12M?: number | null;
  epsT12M?: number | null;
};

const SELECTOR_SECTORS: readonly SelectorSecurity["sector"][] = [
  "Banking",
  "Telecom",
  "Energy",
  "Industry",
  "Distribution",
  "Market Indices",
  "Delisted",
  "Other",
];

const restorePersistedCatalog = (
  snapshot: PersistedTickerCatalogSnapshot,
): SelectorSecurity[] => snapshot.securities.map((security) => ({
  ...security,
  sector: SELECTOR_SECTORS.includes(security.sector as SelectorSecurity["sector"])
    ? security.sector as SelectorSecurity["sector"]
    : "Other",
  status: security.status === "delisted" ? "delisted" : "active",
}));

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized || undefined;
};

const toPersistedCatalog = (
  securities: readonly SelectorSecurity[],
): PersistedTickerCatalogSecurity[] => securities.map((security) => {
  const {
    logoUrl: rawLogoUrl,
    isin: rawIsin,
    exchange: rawExchange,
    ...baseSecurity
  } = security;
  const logoUrl = normalizeOptionalString(rawLogoUrl);
  const isin = normalizeOptionalString(rawIsin);
  const exchange = normalizeOptionalString(rawExchange);

  return {
    ...baseSecurity,
    ...(logoUrl ? { logoUrl } : {}),
    ...(isin ? { isin } : {}),
    ...(exchange ? { exchange } : {}),
    status: security.status === "delisted" ? "delisted" : "active",
    marketCap: security.marketCap ?? null,
    priceChangeD1: security.priceChangeD1 ?? null,
    peRatio: security.peRatio ?? null,
    returnYTD: security.returnYTD ?? null,
    revenueT12M: security.revenueT12M ?? null,
    epsT12M: security.epsT12M ?? null,
  };
});

const normalizeSearch = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

const CATALOG_REVALIDATION_WINDOW_MS = 30_000;
const INITIAL_EAGER_LOGO_COUNT = 8;

const toSelectedTicker = (security: SelectorSecurity): BRVMSecurity => ({
  ...security,
  marketCap: security.marketCap ?? Number.NaN,
  priceChangeD1: security.priceChangeD1 ?? Number.NaN,
  peRatio: security.peRatio ?? Number.NaN,
  returnYTD: security.returnYTD ?? Number.NaN,
  revenueT12M: security.revenueT12M ?? Number.NaN,
  epsT12M: security.epsT12M ?? Number.NaN,
});

const toSelectorSector = (action: ActionEntity): SelectorSecurity["sector"] => {
  const value = normalizeSearch(
    `${action.society?.industry?.name ?? ""} ${action.society?.activity?.name ?? ""}`
  );
  if (value.includes("BANK") || value.includes("FINANC")) return "Banking";
  if (value.includes("TELECOM")) return "Telecom";
  if (value.includes("ENERG") || value.includes("PETROL")) return "Energy";
  if (value.includes("DISTRIB") || value.includes("RETAIL")) return "Distribution";
  if (
    value.includes("INDUSTR") ||
    value.includes("STAPLES") ||
    value.includes("MATERIAL") ||
    value.includes("MANUFACTUR") ||
    value.includes("CHEMICAL") ||
    value.includes("TOBACCO") ||
    value.includes("FOOD")
  ) return "Industry";
  return "Other";
};

const isActionInMarket = (action: ActionEntity | null | undefined, marketTicker: string): action is ActionEntity => {
  if (!action || typeof action !== "object") return false;
  const normalizedMarketTicker = normalizeSearch(marketTicker);
  return Boolean(normalizedMarketTicker)
    && normalizeSearch(action.bourse?.ticker) === normalizedMarketTicker;
};

const toSelectorSecurity = (action: ActionEntity): SelectorSecurity | null => {
  const ticker = normalizeSearch(action.ticker);
  if (!ticker) return null;
  return {
    name: String(action.society?.name || ticker),
    ticker,
    sector: toSelectorSector(action),
    marketCap: Number.isFinite(action.latest_valuation_ratio?.market_cap) ? (action.latest_valuation_ratio?.market_cap as number) / 1_000_000 : null,
    priceChangeD1: Number.isFinite(action.latest_price_metric?.change_1d_pct) ? action.latest_price_metric?.change_1d_pct : null,
    peRatio: Number.isFinite(action.latest_valuation_ratio?.pe_ttm) ? action.latest_valuation_ratio?.pe_ttm : null,
    returnYTD: Number.isFinite(action.latest_price_metric?.change_ytd_pct) ? action.latest_price_metric?.change_ytd_pct : null,
    revenueT12M: null,
    epsT12M: null,
    country: action.society?.country?.name || "UEMOA",
    isin: action.isin,
    exchange: String(action.bourse?.ticker ?? "N/D").trim().toUpperCase(),
    currency: String(action.bourse?.currency?.symbol ?? "N/D").trim().toUpperCase(),
    status: "active",
    logoUrl: getMarketLogoUrl(action.bourse?.ticker, ticker, String(action.society?.name ?? "")),
  };
};

const selectSecuritiesForMarket = (
  actions: readonly ActionEntity[] | null | undefined,
  marketTicker: string,
): SelectorSecurity[] => {
  if (!Array.isArray(actions) || !normalizeSearch(marketTicker)) return [];

  const uniqueByTicker = new Map<string, SelectorSecurity>();
  actions.forEach((action) => {
    if (!isActionInMarket(action, marketTicker)) return;
    const security = toSelectorSecurity(action);
    if (security && !uniqueByTicker.has(security.ticker)) {
      uniqueByTicker.set(security.ticker, security);
    }
  });
  return Array.from(uniqueByTicker.values());
};

export const actionToSelectedTicker = (action: ActionEntity): BRVMSecurity | null => {
  const security = toSelectorSecurity(action);
  return security ? toSelectedTicker(security) : null;
};

// --- TYPES ---
type FlattenedItem =
  | { type: "header"; label: string; count: number; color: string }
  | { type: "item"; data: SelectorSecurity; globalIndex: number };

// ============================================================================
// [TENOR 2026] O(1) MEMOIZED ROW COMPONENT
// ============================================================================
interface TickerRowProps {
  item: SelectorSecurity;
  globalIndex: number;
  isActive: boolean;
  query: string;
  onSelect: (ticker: string) => void;
  onHover: (ticker: string) => void;
}

const TickerRow = React.memo(({ item, globalIndex, isActive, query, onSelect, onHover }: TickerRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when navigated via keyboard
  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  const isPositive = (item.priceChangeD1 ?? 0) >= 0;
  const priceColor = item.priceChangeD1 == null ? "#a0aec0" : isPositive ? "#00da3c" : "#f23645";
  const sign = item.priceChangeD1 != null && isPositive ? "+" : "";

  return (
    <div
      ref={rowRef}
      className={`tsm-row ${isActive ? "active" : ""}`}
      onClick={() => onSelect(item.ticker)}
      onMouseEnter={() => onHover(item.ticker)}
    >
      {isActive && <div className="tsm-row-indicator" />}
      
      <BrvmLogoMark
        ticker={item.ticker}
        name={item.name}
        logoUrl={item.logoUrl}
        exchange={item.exchange}
        sector={item.sector}
        status={item.status}
        size={38}
        imageSizes="38px"
        loading={globalIndex < INITIAL_EAGER_LOGO_COUNT ? "eager" : "lazy"}
      />

      <div className="tsm-info">
        <div className="tsm-ticker"><HighlightMatch text={item.ticker} query={query} /></div>
        <div className="tsm-name"><HighlightMatch text={item.name} query={query} /></div>
      </div>

      <div className="tsm-metrics">
        <div className="tsm-price-change" style={{ color: priceColor }}>
          {item.priceChangeD1 == null ? "—" : `${sign}${item.priceChangeD1.toFixed(2)}%`}
        </div>
        <div className="tsm-market-cap">
          {formatMarketCap(item.marketCap)}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Strict equality check to guarantee O(1) re-renders
  return prev.item.ticker === next.item.ticker && 
         prev.isActive === next.isActive && 
         prev.query === next.query;
});
TickerRow.displayName = "TickerRow";

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================
export const TickerSelectorModal: React.FC = () => {
  const {
    isModalOpen,
    closeModal,
    selectedTicker,
    setSelectedTicker,
    preferredTicker,
    pendingMarket,
    pendingLayoutChartId,
    isLoading: isTickerSelectorLoading,
  } = useTickerSelector();
  const dispatch = useAppDispatch();
  const { getActionByTicker, getAllActions } = useActionRepository();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  const activeMarket = useSelector(selectActiveMarket);
  const uiState = useSelector(selectUiState);
  const isMultiChartSelection = uiState.multiChartLayout.isEnabled
    && uiState.multiChartLayout.charts.length > 1;
  const catalogMarketTicker = (pendingMarket?.ticker ?? activeMarket.ticker).trim().toUpperCase();


  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const [apiSecurities, setApiSecurities] = useState<SelectorSecurity[] | null>(null);
  const [sourceState, setSourceState] = useState<"loading" | "api" | "api_empty" | "api_error" | "api_stale">("loading");
  const [isLoadingSecurities, setIsLoadingSecurities] = useState(false);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [isPrefetching, setIsPrefetching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [apiTotalCount, setApiTotalCount] = useState<number | null>(null);
  const apiSecuritiesRef = useRef<SelectorSecurity[]>([]);
  const apiPagesRef = useRef(new Map<number, SelectorSecurity[]>());
  const totalPagesRef = useRef(1);
  const catalogExactRef = useRef(false);
  const catalogGenerationRef = useRef(0);
  const lastCatalogRevalidatedAtRef = useRef(0);
  const didCompleteInitialTickerResolutionRef = useRef(false);
  const catalogMarketRef = useRef(catalogMarketTicker);
  const isCatalogSynchronized = catalogMarketRef.current === catalogMarketTicker;

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadingPageRef = useRef(false);
  const loadCatalogPageRef = useRef<((page: number) => Promise<boolean>) | null>(null);
  const preservedCatalogRef = useRef<SelectorSecurity[] | null>(null);

  const loadNextPage = useCallback(async () => {
    if (loadingPageRef.current || isLoadingSecurities || !apiPagesRef.current.has(1)) return;
    const requestGeneration = catalogGenerationRef.current;
    const requestMarket = catalogMarketTicker;
    const isCurrentCatalog = () => catalogGenerationRef.current === requestGeneration
      && catalogMarketRef.current === requestMarket;

    const loadedPages = new Set(apiPagesRef.current.keys());
    const nextPage = Array.from(
      { length: totalPagesRef.current },
      (_, index) => index + 1,
    ).find((page) => !loadedPages.has(page));

    if (!nextPage) {
      if (isCurrentCatalog()) setIsLoadingMore(false);
      return;
    }

    const loadPage = loadCatalogPageRef.current;
    if (!loadPage) return;

    loadingPageRef.current = true;
    if (isCurrentCatalog()) setIsLoadingMore(true);
    try {
      await loadPage(nextPage);
    } finally {
      loadingPageRef.current = false;
      if (isCurrentCatalog()) setIsLoadingMore(false);
    }
  }, [catalogMarketTicker, isLoadingSecurities]);

  const handleListScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (element.scrollHeight - element.scrollTop - element.clientHeight < 80) void loadNextPage();
  }, [loadNextPage]);

  // Reset state on open
  useEffect(() => {
    if (!isModalOpen) return;
    setSearchQuery("");
    setActiveTicker(null);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimer);
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;

    const loadGeneration = catalogGenerationRef.current + 1;
    catalogGenerationRef.current = loadGeneration;
    let cancelled = false;
    const isCurrentLoad = () => !cancelled
      && catalogGenerationRef.current === loadGeneration
      && catalogMarketRef.current === catalogMarketTicker;

    const catalogMatchesMarket = catalogMarketRef.current === catalogMarketTicker;
    loadingPageRef.current = false;
    if (!catalogMatchesMarket) {
      apiPagesRef.current.clear();
      apiSecuritiesRef.current = [];
      preservedCatalogRef.current = null;
      catalogExactRef.current = false;
      setApiTotalCount(null);
      catalogMarketRef.current = catalogMarketTicker;
    }
    let previousCatalog = catalogMatchesMarket ? apiSecuritiesRef.current : [];
    let hasCachedCatalog = previousCatalog.length > 0;
    let cacheAge = Date.now() - lastCatalogRevalidatedAtRef.current;
    let shouldRevalidate = isModalOpen
      && catalogExactRef.current
      && hasCachedCatalog
      && cacheAge >= CATALOG_REVALIDATION_WINDOW_MS;

    setApiSecurities(hasCachedCatalog ? previousCatalog : null);
    setSourceState(hasCachedCatalog ? "api" : "loading");
    setIsLoadingSecurities(!hasCachedCatalog);
    setIsRevalidating(shouldRevalidate);
    setIsPrefetching(false);
    setIsLoadingMore(false);

    const rebuildCatalog = () => {
      const orderedPages = Array.from(apiPagesRef.current.entries())
        .sort(([left], [right]) => left - right)
        .flatMap(([, page]) => page);
      const uniqueByTicker = new Map<string, SelectorSecurity>();
      orderedPages.forEach((security) => {
        const ticker = normalizeSearch(security.ticker);
        if (ticker && !uniqueByTicker.has(ticker)) uniqueByTicker.set(ticker, security);
      });
      return Array.from(uniqueByTicker.values());
    };

    const publishPage = (page: number, response: PaginatedResponse<ActionEntity>) => {
      if (!isCurrentLoad()) return;
      if (Number.isFinite(response.total_pages)) totalPagesRef.current = Math.max(1, response.total_pages);
      const pageData = selectSecuritiesForMarket(response.data, catalogMarketTicker);
      apiPagesRef.current.set(page, pageData);
      const nextCatalog = rebuildCatalog();
      const visibleCatalog = preservedCatalogRef.current ?? nextCatalog;
      apiSecuritiesRef.current = visibleCatalog;
      setApiSecurities(visibleCatalog);
      setIsLoadingSecurities(false);
      setSourceState(visibleCatalog.length > 0 ? "api" : "api_empty");
      if (!catalogExactRef.current && visibleCatalog.length > 0) {
        void writePersistedTickerCatalog(
          catalogMarketTicker,
          toPersistedCatalog(visibleCatalog),
          visibleCatalog.length,
          false,
        );
      }
    };

    const retryDelaysMs = [250, 500];

    const waitBeforeRetry = (attempt: number) => new Promise<void>((resolve) => {
      window.setTimeout(resolve, retryDelaysMs[attempt] ?? retryDelaysMs[retryDelaysMs.length - 1]);
    });

    const pendingPageRequests = new Map<
      number,
      Promise<{ ok: boolean; response: PaginatedResponse<ActionEntity> | null }>
    >();

    const fetchPage = (page: number, forceRefetch: boolean) => {
      const existingRequest = pendingPageRequests.get(page);
      if (existingRequest) return existingRequest;

      const request = (async () => {
        for (let attempt = 0; attempt <= retryDelaysMs.length; attempt += 1) {
          if (!isCurrentLoad()) return { ok: false, response: null };

          try {
            const response = await getAllActions(
              buildTickerCatalogQuery(catalogMarketTicker, page),
              forceRefetch ? { forceRefetch: true } : undefined,
            );
            if (!isCurrentLoad()) return { ok: false, response: null };
            publishPage(page, response);
            return { ok: true, response };
          } catch (error) {
            if (attempt === retryDelaysMs.length) {
              console.warn("[TickerSelector] API catalog page failed", { page, error });
              return { ok: false, response: null };
            }
            await waitBeforeRetry(attempt);
          }
        }

        return { ok: false, response: null };
      })();

      pendingPageRequests.set(page, request);
      void request.then(
        () => {
          if (pendingPageRequests.get(page) === request) pendingPageRequests.delete(page);
        },
        () => {
          if (pendingPageRequests.get(page) === request) pendingPageRequests.delete(page);
        },
      );
      return request;
    };

    loadCatalogPageRef.current = (page) => fetchPage(page, false).then((result) => result.ok);

    const prefetchPages = async (pages: number[], forceRefetch: boolean) => {
      const results: Array<{ ok: boolean; response: PaginatedResponse<ActionEntity> | null }> = [];
      let nextIndex = 0;

      const worker = async () => {
        while (isCurrentLoad()) {
          const currentIndex = nextIndex;
          nextIndex += 1;
          if (currentIndex >= pages.length) return;
          results[currentIndex] = await fetchPage(pages[currentIndex], forceRefetch);
        }
      };

      const workerCount = Math.min(BACKGROUND_PREFETCH_CONCURRENCY, pages.length);
      await Promise.all(Array.from({ length: workerCount }, () => worker()));
      return results;
    };
    const loadApiSecurities = async () => {
      const hydratePersistedCatalog = async (): Promise<void> => {
        if (hasCachedCatalog) return;
        const snapshot = await readPersistedTickerCatalog(catalogMarketTicker);
        if (!isCurrentLoad() || !snapshot) return;

        const restoredCatalog = restorePersistedCatalog(snapshot);
        if (restoredCatalog.length === 0) return;

        const snapshotIsExact = snapshot.complete !== false;
        apiPagesRef.current.clear();
        catalogMarketRef.current = catalogMarketTicker;
        totalPagesRef.current = 1;
        catalogExactRef.current = snapshotIsExact;
        lastCatalogRevalidatedAtRef.current = snapshot.updatedAt;
        apiSecuritiesRef.current = restoredCatalog;
        preservedCatalogRef.current = restoredCatalog;
        previousCatalog = restoredCatalog;
        hasCachedCatalog = true;
        cacheAge = Math.max(0, Date.now() - snapshot.updatedAt);
        shouldRevalidate = cacheAge >= CATALOG_REVALIDATION_WINDOW_MS;
        setApiSecurities(restoredCatalog);
        setApiTotalCount(snapshotIsExact ? snapshot.totalCount : null);
        setSourceState("api");
        setIsLoadingSecurities(false);
      };

      let backgroundCompletionStarted = false;

      const publishExactCatalogIfComplete = (): boolean => {
        if (!isCurrentLoad()) return false;
        const expectedPages = totalPagesRef.current;
        const allPagesLoaded = Array.from(
          { length: expectedPages },
          (_, index) => index + 1,
        ).every((page) => apiPagesRef.current.has(page));
        if (!allPagesLoaded) return false;

        const exactCatalog = rebuildCatalog();
        apiSecuritiesRef.current = exactCatalog;
        setApiSecurities(exactCatalog);
        setApiTotalCount(exactCatalog.length);
        catalogExactRef.current = true;
        preservedCatalogRef.current = null;
        lastCatalogRevalidatedAtRef.current = Date.now();
        void writePersistedTickerCatalog(
          catalogMarketTicker,
          toPersistedCatalog(exactCatalog),
          exactCatalog.length,
          true,
        );
        return true;
      };

      const prefetchRemainingCatalogPages = async (forceRefetch: boolean): Promise<boolean> => {
        for (let round = 0; round < 4 && !cancelled; round += 1) {
          const pagesToLoad = Array.from(
            { length: totalPagesRef.current },
            (_, index) => index + 1,
          ).filter((page) => !apiPagesRef.current.has(page));
          if (pagesToLoad.length === 0) return publishExactCatalogIfComplete();

          const results = await prefetchPages(pagesToLoad, forceRefetch);
          if (!isCurrentLoad()) return false;
          const allPagesReported = results.length === pagesToLoad.length;
          const hasFailedPage = results.some((result) => !result.ok);
          if ((!allPagesReported || hasFailedPage) && round === 3) return false;
          if (publishExactCatalogIfComplete()) return true;
        }
        return false;
      };

      const scheduleBackgroundCompletion = (
        speculativePrefetch: Promise<Array<{ ok: boolean; response: PaginatedResponse<ActionEntity> | null }>>,
        forceRefetch: boolean,
      ) => {
        backgroundCompletionStarted = true;
        setIsPrefetching(true);
        void speculativePrefetch
          .then(async () => {
            if (!isCurrentLoad()) return false;
            for (const page of apiPagesRef.current.keys()) {
              if (page > totalPagesRef.current) apiPagesRef.current.delete(page);
            }
            if (publishExactCatalogIfComplete()) return true;
            return prefetchRemainingCatalogPages(forceRefetch);
          })
          .then((exactCatalogPublished) => {
            if (!isCurrentLoad()) return;
            const hasCatalog = apiSecuritiesRef.current.length > 0;
            setSourceState(exactCatalogPublished
              ? "api"
              : hasCatalog ? "api_stale" : "api_error");
          })
          .catch((error) => {
            if (!isCurrentLoad()) return;
            console.warn("[TickerSelector] Background catalog completion failed", {
              market: catalogMarketTicker,
              error,
            });
            setSourceState(apiSecuritiesRef.current.length > 0 ? "api_stale" : "api_error");
          })
          .finally(() => {
            if (isCurrentLoad()) setIsPrefetching(false);
          });
      };

      try {
        await hydratePersistedCatalog();
        if (!isCurrentLoad()) return;

        if (hasCachedCatalog && catalogExactRef.current && !shouldRevalidate) {
          setIsLoadingSecurities(false);
          setIsRevalidating(false);
          return;
        }

        preservedCatalogRef.current = shouldRevalidate && hasCachedCatalog
          ? previousCatalog
          : preservedCatalogRef.current;
        const firstResult = await fetchPage(1, shouldRevalidate);
        if (!isCurrentLoad()) return;

        if (!firstResult.ok) {
          setIsLoadingSecurities(false);
          return;
        }

        const totalPages = Math.max(
          1,
          firstResult.response?.total_pages
            ?? Math.max(1, ...Array.from(apiPagesRef.current.keys())),
        );
        totalPagesRef.current = totalPages;
        const speculativePages = getSpeculativeCatalogPages(totalPages);
        const speculativePrefetch = prefetchPages(speculativePages, shouldRevalidate);
        preservedCatalogRef.current = shouldRevalidate && hasCachedCatalog
          ? previousCatalog
          : preservedCatalogRef.current;
        for (const page of apiPagesRef.current.keys()) {
          if (page > totalPages) apiPagesRef.current.delete(page);
        }

        const visibleCatalog = preservedCatalogRef.current ?? rebuildCatalog();
        const catalogAvailable = visibleCatalog.length > 0;
        apiSecuritiesRef.current = visibleCatalog;
        setApiSecurities(visibleCatalog);
        setIsLoadingSecurities(false);
        setSourceState(catalogAvailable ? "api" : "api_empty");
        scheduleBackgroundCompletion(speculativePrefetch, shouldRevalidate);
      } finally {
        if (isCurrentLoad()) {
          setIsRevalidating(false);
          if (!backgroundCompletionStarted) setIsPrefetching(false);
        }
      }
    };

    void loadApiSecurities();
    return () => {
      cancelled = true;
      loadCatalogPageRef.current = null;
      pendingPageRequests.clear();
    };
  }, [catalogMarketTicker, getAllActions, isModalOpen]);

  useEffect(() => {
    if (
      didCompleteInitialTickerResolutionRef.current
      || isModalOpen
      || pendingMarket
      || selectedTicker
      || isTickerSelectorLoading
    ) return;

    // The bootstrap is complete only after a real API-backed ticker has been
    // resolved. The previous implementation marked it complete before awaiting
    // the API. If React then cleaned up the effect (market/preference hydration)
    // or the first cold request failed, selectedTicker stayed null forever and
    // the page remained behind its loading skeleton.
    let cancelled = false;
    const resolveInitialTicker = async () => {
      const retryDelaysMs = [0, 1500] as const;
      let lastError: unknown = null;

      for (const retryDelayMs of retryDelaysMs) {
        if (cancelled) return;
        if (retryDelayMs > 0) {
          await new Promise<void>((resolve) => window.setTimeout(resolve, retryDelayMs));
          if (cancelled) return;
        }

        try {
          // RTK Query owns the finite transport timeout (35s by default). This
          // layer retries only a failed bootstrap and never races/aborts a valid
          // slow cold-start response with a second competing timeout.
          const action = await (async () => {
            let preferredLookupError: unknown = null;
            if (preferredTicker) {
              try {
                const preferredAction = await getActionByTicker(preferredTicker);
                // A ticker chosen in a secondary multi-layout panel can belong to
                // CSE/NGX/etc. while the workspace market remains BRVM. Such a
                // persisted preference must never poison the next page bootstrap.
                if (preferredAction && isActionInMarket(preferredAction, activeMarket.ticker)) {
                  return preferredAction;
                }
              } catch (error) {
                // A stale/unavailable preferred ticker is not fatal: the active
                // market catalogue is the authoritative fallback for bootstrap.
                preferredLookupError = error;
              }
            }

            const fallbackResponse = await getAllActions(buildTickerCatalogQuery(activeMarket.ticker, 1));
            const fallbackAction = fallbackResponse?.data?.find(
              (candidate) => isActionInMarket(candidate, activeMarket.ticker),
            ) ?? null;
            if (!fallbackAction && preferredLookupError) throw preferredLookupError;
            return fallbackAction;
          })();

          if (cancelled) return;
          if (!action || !isActionInMarket(action, activeMarket.ticker)) {
            lastError = new Error(`No API ticker available for market ${activeMarket.ticker}.`);
            continue;
          }
          const ticker = actionToSelectedTicker(action);
          if (!ticker || cancelled) return;

          didCompleteInitialTickerResolutionRef.current = true;
          setSelectedTicker(ticker);
          return;
        } catch (error) {
          lastError = error;
        }
      }

      if (!cancelled && lastError) {
        console.warn("[TickerSelector] Initial API ticker resolution failed after retry", lastError);
      }
    };

    void resolveInitialTicker();
    return () => {
      cancelled = true;
    };
  }, [activeMarket.ticker, getActionByTicker, getAllActions, isModalOpen, isTickerSelectorLoading, pendingMarket, preferredTicker, selectedTicker, setSelectedTicker]);

  const searchCatalog = useMemo(
    () => (isCatalogSynchronized ? apiSecurities ?? [] : []),
    [apiSecurities, isCatalogSynchronized],
  );
  const isCatalogLoading = isLoadingSecurities || !isCatalogSynchronized;
  const catalogCountLabel = apiTotalCount === null
    ? searchCatalog.length > 0 ? String(searchCatalog.length) + "+" : "…"
    : String(apiTotalCount);

  useEffect(() => {
    if (pendingMarket || selectedTicker || searchCatalog.length === 0) return;
    const preferred = preferredTicker
      ? searchCatalog.find((security) => security.ticker === preferredTicker)
      : undefined;
    const firstApiSecurity = preferred ?? searchCatalog[0];
    setSelectedTicker(toSelectedTicker(firstApiSecurity));
  }, [pendingMarket, preferredTicker, searchCatalog, selectedTicker, setSelectedTicker]);

  // --- FILTERING & GROUPING (Background Thread via useDeferredValue) ---
  const { flattenedList, selectableTickers, totalCount } = useMemo(() => {
    const query = normalizeSearch(deferredQuery);

    // 1. Filter
    const filtered = searchCatalog.filter((s) =>
      normalizeSearch(s.ticker).includes(query) ||
      normalizeSearch(s.name).includes(query) ||
      normalizeSearch(s.sector).includes(query)
    );

    // 2. Group
    const grouped = filtered.reduce((acc, security) => {
      if (!acc[security.sector]) acc[security.sector] = [];
      acc[security.sector].push(security);
      return acc;
    }, {} as Record<string, SelectorSecurity[]>);

    // 3. Flatten for Virtualized/Keyboard Navigation
    const flat: FlattenedItem[] = [];
    const selectable: string[] = [];
    let globalIdx = 0;

    // Order: Market Indices first, then Banking, then others
    const sectorOrder = ["Market Indices", "Banking", "Telecom", "Energy", "Industry", "Distribution", "Other"];
    const availableSectors = Object.keys(grouped).sort((a, b) => {
      const idxA = sectorOrder.indexOf(a);
      const idxB = sectorOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    availableSectors.forEach(sector => {
      const items = grouped[sector];
      flat.push({ 
        type: "header", 
        label: sector.toUpperCase(), 
        count: items.length,
        color: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] || "#a0aec0"
      });
      
      items.forEach(item => {
        flat.push({ type: "item", data: item, globalIndex: globalIdx });
        selectable.push(item.ticker);
        globalIdx++;
      });
    });

    return { flattenedList: flat, selectableTickers: selectable, totalCount: filtered.length };
  }, [deferredQuery, searchCatalog]);

  // Auto-select first item when search changes
  useEffect(() => {
    if (selectableTickers.length > 0 && (!activeTicker || !selectableTickers.includes(activeTicker))) {
      setActiveTicker(selectableTickers[0]);
    } else if (selectableTickers.length === 0) {
      setActiveTicker(null);
    }
  }, [selectableTickers, activeTicker]);

  // --- HANDLERS ---
  const handleSelect = useCallback((ticker: string) => {
    const security = searchCatalog.find((item) => item.ticker === ticker);
    if (!security) return;

    const selectedSecurity = toSelectedTicker(security);
    if (pendingLayoutChartId && isMultiChartSelection) {
      const exchange = String(security.exchange ?? pendingMarket?.ticker ?? catalogMarketTicker)
        .trim()
        .toUpperCase();
      if (!exchange) return;

      // A layout edit is not a global ticker selection. Bind the chosen symbol
      // directly to its target cell and keep the currently active chart intact.
      dispatch(updateLayoutChart({
        chartId: pendingLayoutChartId,
        symbol: selectedSecurity.ticker,
        exchange,
      }));
      closeModal();
      return;
    }

    if (pendingMarket && !isMultiChartSelection) {
      dispatch(setActiveMarket(pendingMarket));
      void writePersistedMarketPreference(pendingMarket);
    }
    setSelectedTicker(selectedSecurity);
    closeModal();
  }, [
    catalogMarketTicker,
    closeModal,
    dispatch,
    isMultiChartSelection,
    pendingLayoutChartId,
    pendingMarket,
    searchCatalog,
    setSelectedTicker,
  ]);

  const handleHover = useCallback((ticker: string) => {
    setActiveTicker(ticker);
  }, []);

  // --- KEYBOARD ENGINE ---
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (selectableTickers.length === 0) return;

      const currentIndex = activeTicker ? selectableTickers.indexOf(activeTicker) : -1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < selectableTickers.length - 1 ? currentIndex + 1 : 0;
        setActiveTicker(selectableTickers[nextIndex]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : selectableTickers.length - 1;
        setActiveTicker(selectableTickers[prevIndex]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeTicker) handleSelect(activeTicker);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, activeTicker, selectableTickers, handleSelect, closeModal]);

  if (!isMounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={isModalOpen ? "tsm-overlay" : "tsm-overlay tsm-overlay-hidden"}
      aria-hidden={!isModalOpen}
      onMouseDown={closeModal}
    >
      {/* INJECTED CSS FOR EXACT FIDELITY */}
      <style>{`
        .tsm-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 13vh; animation: tsmFadeIn 0.2s ease-out;
        }
        .tsm-overlay-hidden {
          display: none;
        }
        .tsm-modal {
          width: 100%; max-width: 640px; background: rgba(16, 42, 67, 0.98);
          border: 1px solid var(--gp-border-color, #244869); border-radius: var(--bs-border-radius-lg, 12px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.06);
          display: flex; flex-direction: column; max-height: 80vh;
          overflow: hidden; animation: tsmSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tsm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--gp-border-color-light, #2d455c);
          background: linear-gradient(to right, rgba(255,255,255,0.035), transparent);
        }
        .tsm-title {
          display: flex; align-items: center; gap: 10px;
          color: var(--gp-text-primary, #f8f9fa); font-size: 16px; font-weight: 600; font-family: var(--gp-font-family-nav, 'Inter', sans-serif);
        }
        .tsm-title-icon { color: var(--gp-accent-gold, #ff9f04); }
        .tsm-close {
          background: rgba(255,255,255,0.04); border: 1px solid var(--gp-border-color-light, #2d455c); color: var(--gp-text-secondary, #a0aec0);
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .tsm-close:hover { background: rgba(255,255,255,0.1); color: var(--gp-text-primary, #f8f9fa); }
        .tsm-search-container { padding: 16px 20px; border-bottom: 1px solid var(--gp-border-color-light, #2d455c); }
        .tsm-search-box {
          position: relative; display: flex; align-items: center;
          background: rgba(28, 58, 87, 0.9); border: 1px solid var(--gp-accent-gold, #ff9f04); border-radius: var(--gp-radius-md, 8px);
          padding: 0 14px; height: 48px; box-shadow: 0 0 0 1px rgba(255, 159, 4, 0.2);
          transition: box-shadow 0.2s;
        }
        .tsm-search-box:focus-within { box-shadow: 0 0 0 3px rgba(255, 159, 4, 0.15); }
        .tsm-search-icon { color: var(--gp-accent-gold, #ff9f04); margin-right: 12px; }
        .tsm-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--gp-text-primary, #f8f9fa); font-size: 15px; font-family: var(--gp-font-family-base, 'Inter', sans-serif);
        }
        .tsm-input::placeholder { color: var(--gp-text-secondary, #a0aec0); }
        .tsm-list {
          flex: 1; overflow-y: auto; padding: 8px 0;
          scrollbar-width: thin; scrollbar-color: var(--gp-border-color-light, #2d455c) transparent;
        }
        .tsm-list::-webkit-scrollbar { width: 6px; }
        .tsm-list::-webkit-scrollbar-thumb { background: var(--gp-border-color-light, #2d455c); border-radius: 3px; }
        .tsm-sector-header {
          display: flex; align-items: center; gap: 8px;
          padding: 16px 20px 8px;
        }
        .tsm-sector-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 20px;
        }
        .tsm-sector-dot { width: 8px; height: 8px; border-radius: 50%; }
        .tsm-sector-name { color: var(--gp-text-primary, #f8f9fa); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
        .tsm-sector-count { color: var(--gp-text-secondary, #a0aec0); font-size: 11px; font-weight: 500; }
        .tsm-row {
          position: relative; display: flex; align-items: center; gap: 16px;
          padding: 10px 20px; cursor: pointer; transition: background 0.1s;
          contain: content;
        }
        .tsm-row.active { background: rgba(28, 58, 87, 0.86); }
        .tsm-row-indicator {
          position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
          background: var(--gp-accent-gold, #ff9f04); border-radius: 0 4px 4px 0;
        }
        .tsm-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .tsm-ticker { color: var(--gp-text-primary, #f8f9fa); font-size: 15px; font-weight: 700; font-family: var(--gp-font-family-base, 'Inter', sans-serif); }
        .tsm-name { color: var(--gp-text-secondary, #a0aec0); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tsm-metrics { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
        .tsm-price-change { font-size: 14px; font-weight: 600; font-family: var(--gp-font-family-base, 'Inter', sans-serif); }
        .tsm-market-cap { color: var(--gp-text-secondary, #a0aec0); font-size: 11px; }
        .tsm-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; border-top: 1px solid var(--gp-border-color-light, #2d455c); background: rgba(28, 58, 87, 0.58);
        }
        .tsm-shortcuts { display: flex; align-items: center; gap: 12px; }
        .tsm-key-group { display: flex; align-items: center; gap: 6px; }
        .tsm-key {
          background: rgba(255,255,255,0.08); color: var(--gp-text-secondary, #a0aec0); font-size: 11px;
          padding: 2px 6px; border-radius: 4px; border: 1px solid var(--gp-border-color-light, #2d455c);
          font-family: monospace;
        }
        .tsm-key-label { color: var(--gp-text-secondary, #a0aec0); font-size: 11px; }
        .tsm-total { color: var(--gp-accent-gold, #ff9f04); font-size: 12px; font-weight: 600; }
        .tsm-total span { color: var(--gp-text-secondary, #a0aec0); font-weight: 400; }
        .tsm-refresh-status, .tsm-stale-status {
          padding: 8px 20px; font-size: 11px; border-bottom: 1px solid var(--gp-border-color-light, #2d455c);
        }
        .tsm-refresh-status { color: var(--gp-text-secondary, #a0aec0); }
        .tsm-stale-status { color: #ffcf66; background: rgba(255, 159, 4, 0.08); }
        .tsm-empty { padding: 40px 20px; text-align: center; color: var(--gp-text-secondary, #a0aec0); font-size: 14px; }
        .tsm-load-more { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px 20px; color: var(--gp-text-secondary, #a0aec0); font-size: 11px; border-top: 1px solid var(--gp-border-color-light, #2d455c); }
        .tsm-load-more-spinner { width: 12px; height: 12px; border: 2px solid rgba(255, 159, 4, 0.25); border-top-color: #ff9f04; border-radius: 50%; animation: tsmSpin 0.8s linear infinite; }
        @keyframes tsmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tsmSlideDown { from { opacity: 0; transform: translateY(-20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes tsmSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tsm-modal" ref={modalRef} onMouseDown={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="tsm-header">
          <div className="tsm-title">
            <span className="tsm-title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </span>
            Sélectionner un titre · {catalogMarketTicker}
          </div>
          <button className="tsm-close" onClick={closeModal} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        {/* SEARCH */}
        <div className="tsm-search-container">
          <div className="tsm-search-box">
            <span className="tsm-search-icon"><SearchIcon /></span>
            <input
              ref={inputRef}
              id="ticker-selector-search"
              name="ticker"
              type="text"
              className="tsm-input"
              placeholder="Rechercher par nom, ticker ou secteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="tsm-list" ref={listRef} onScroll={handleListScroll}>
          {isRevalidating && searchCatalog.length > 0 ? (
            <div className="tsm-refresh-status" role="status" aria-live="polite">
              Mise à jour des titres…
            </div>
          ) : null}
          {sourceState === "api_stale" && searchCatalog.length > 0 && !isRevalidating ? (
            <div className="tsm-stale-status" role="alert">
              Données précédentes conservées — revalidation API indisponible.
            </div>
          ) : null}
          {isCatalogLoading ? (
            <div
              className="tsm-empty"
              role="status"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <span
                aria-hidden="true"
                style={{ display: "block", width: 22, height: 22, border: "3px solid rgba(255, 159, 4, 0.25)", borderTopColor: "#ff9f04", borderRadius: "50%", animation: "tsmSpin 0.8s linear infinite" }}
              />
              <span>Chargement des titres...</span>
            </div>
          ) : sourceState === "api_error" ? (
            <div className="tsm-empty" role="alert">Impossible de charger les titres depuis l’API.</div>
          ) : flattenedList.length === 0 ? (
            <div className="tsm-empty">Aucun titre trouvé pour "{searchQuery}"</div>
          ) : (
            flattenedList.map((item, idx) => {
              if (item.type === "header") {
                return (
                  <div key={`header-${item.label}`} className="tsm-sector-header">
                    <div className="tsm-sector-badge">
                      <div className="tsm-sector-dot" style={{ backgroundColor: item.color }} />
                      <span className="tsm-sector-name">{item.label}</span>
                      <span className="tsm-sector-count">({item.count})</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <TickerRow
                    key={item.data.ticker}
                    item={item.data}
                    globalIndex={item.globalIndex}
                    isActive={activeTicker === item.data.ticker}
                    query={deferredQuery}
                    onSelect={handleSelect}
                    onHover={handleHover}
                  />
                );
              }
            })
          )}
          {isLoadingMore ? (
            <div className="tsm-load-more" role="status" aria-live="polite">
              <span aria-hidden="true" className="tsm-load-more-spinner" />
            </div>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="tsm-footer">
          <div className="tsm-shortcuts">
            <div className="tsm-key-group">
              <span className="tsm-key">↑</span>
              <span className="tsm-key">↓</span>
              <span className="tsm-key-label">naviguer</span>
            </div>
            <div className="tsm-key-group">
              <span className="tsm-key">↵</span>
              <span className="tsm-key-label">sélectionner</span>
            </div>
            <div className="tsm-key-group">
              <span className="tsm-key">esc</span>
              <span className="tsm-key-label">fermer</span>
            </div>
          </div>
          <div className="tsm-total">
            {catalogCountLabel} <span>titres</span>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
// --- EOF ---
