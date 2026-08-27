// ================================================================================
// FICHIER : sidebarDataPortAdapter.ts
// RÔLE   : ADAPTER (implémentation du port) utilisant les repositories RTK.
// ================================================================================
// [MIGRATION API v2.16] Implémentation réelle du `SidebarDataPort` en tant que hook
// qui consomme les repos RTK (useResultRepository, useDividendRepository, etc.).
// Architecture Hexagonale respectée : AUCUN fetch brut, AUCUN import direct d'API,
// passage EXCLUSIF par use*Repository (cf. ARCHITECTURE_DATA_FLOW.md).
// ================================================================================

import { useCallback, useMemo } from "react";
import { useDividendRepository } from "@/core/infra/repositories/dividend.repository.impl";
import { useIndiceRepository } from "@/core/infra/repositories/indice.repository.impl";
import { usePrimaryRepository } from "@/core/infra/repositories/primary.repository.impl";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import type { DividendEntity } from "@/core/domain/entities/dividend.entity";
import type { PrimaryEntity } from "@/core/domain/entities/primary.entity";
import type { ActionQueryParams } from "@/core/domain/types/action.type";
import type { PaginatedResponse, QueryParams } from "@/core/domain/types/pagination.type";
import type { SidebarDataPort } from "./sidebarDataPort";
import type { BRVMFundamentals, BRVMFundamentalPoint, BRVMDividendPoint } from "./sidebarFundamentals";
import type { BRVMIndexData, BRVMNewsItem, BRVMBond, BRVMScreenerSecurity } from "./sidebarFetchers";
import { createEmptyFundamentals, normalizeTicker } from "./sidebarFundamentals";
import { createFundamentalsProvenance } from "./sidebarProvenance";
import {
  buildScopedDividendQuery,
  filterDividendsForTicker,
} from "./sidebarDividendPolicy";

const ACTION_PAGE_SIZE = 100;
const ACTION_PAGE_CONCURRENCY = 4;

const BRVM_NEWS_CACHE_TTL_MS = 5000;
let brvmNewsRequestInFlight: Promise<BRVMNewsItem[]> | null = null;
let brvmNewsCache: { expiresAt: number; value: BRVMNewsItem[] } | null = null;

const getSharedBrvmNews = (): Promise<BRVMNewsItem[]> => {
  if (brvmNewsCache && brvmNewsCache.expiresAt > Date.now()) {
    return Promise.resolve(brvmNewsCache.value);
  }
  brvmNewsCache = null;
  if (brvmNewsRequestInFlight) return brvmNewsRequestInFlight;

  const request = fetch("/api/market-data/brvm-news")
    .then(async (response) => {
      if (!response.ok) return [];
      const data: unknown = await response.json();
      if (!Array.isArray(data)) return [];
      return data.filter((item): item is BRVMNewsItem => (
        typeof item === "object" && item !== null
        && typeof item.title === "string" && Boolean(item.title)
        && typeof item.date === "string" && Boolean(item.date)
        && typeof item.link === "string" && Boolean(item.link)
      ));
    });

  brvmNewsRequestInFlight = request;
  const clearRequest = () => {
    if (brvmNewsRequestInFlight === request) brvmNewsRequestInFlight = null;
  };
  void request.then(
    (value) => {
      brvmNewsCache = { expiresAt: Date.now() + BRVM_NEWS_CACHE_TTL_MS, value };
      clearRequest();
    },
    () => {
      brvmNewsCache = null;
      clearRequest();
    },
  );
  return request;
};

const waitForAbortable = <T>(request: Promise<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) return Promise.reject(new DOMException("The news request was aborted.", "AbortError"));

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("The news request was aborted.", "AbortError"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    request.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
};

type GetAllActions = (params?: ActionQueryParams) => Promise<PaginatedResponse<ActionEntity>>;
type GetAllDividends = (params?: QueryParams) => Promise<PaginatedResponse<DividendEntity>>;

const fetchScopedDividends = async (
  getAllDividends: GetAllDividends,
  ticker: string,
  signal: AbortSignal,
): Promise<DividendEntity[]> => {
  throwIfAborted(signal);
  const query = buildScopedDividendQuery(ticker);
  if (!query) return [];

  const response = await getAllDividends(query);
  throwIfAborted(signal);
  return filterDividendsForTicker(response.data || [], ticker);
};

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) throw new DOMException("The screener request was aborted.", "AbortError");
};

const readFinite = (value: number | null | undefined): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const toScreenerSecurity = (action: ActionEntity): BRVMScreenerSecurity => ({
  country: action.society?.country?.name || "N/D",
  currency: action.bourse?.currency?.symbol || "N/D",
  epsT12M: null,
  exchange: action.bourse?.ticker || "",
  marketCap: readFinite(action.latest_valuation_ratio?.market_cap) === null
    ? null
    : (action.latest_valuation_ratio?.market_cap as number) / 1_000_000,
  name: action.society?.name || action.ticker,
  peRatio: readFinite(action.latest_valuation_ratio?.pe_ttm),
  price: readFinite(action.latest_price_metric?.price),
  priceChangeD1: readFinite(action.latest_price_metric?.change_1d_pct),
  returnYTD: readFinite(action.latest_price_metric?.change_ytd_pct),
  revenueT12M: null,
  sector: action.society?.industry?.name || action.society?.activity?.name || "N/D",
  status: "active",
  ticker: action.ticker,
  volume: readFinite(action.latest_price_metric?.volume),
});

const fetchAllActionPages = async (
  getAllActions: GetAllActions,
  signal: AbortSignal,
): Promise<ActionEntity[]> => {
  throwIfAborted(signal);
  const firstPage = await getAllActions({ page: 1, page_size: ACTION_PAGE_SIZE });
  throwIfAborted(signal);
  const totalPages = Math.max(1, firstPage.total_pages || 1);
  const pages: ActionEntity[][] = [firstPage.data || []];

  for (let start = 2; start <= totalPages; start += ACTION_PAGE_CONCURRENCY) {
    const pageNumbers = Array.from(
      { length: Math.min(ACTION_PAGE_CONCURRENCY, totalPages - start + 1) },
      (_, offset) => start + offset,
    );
    const batch = await Promise.all(pageNumbers.map(async (page) => {
      throwIfAborted(signal);
      const response = await getAllActions({ page, page_size: ACTION_PAGE_SIZE });
      throwIfAborted(signal);
      return response.data || [];
    }));
    pages.push(...batch);
  }

  return pages.flat();
};

/**
 * Hook adapter RTK → SidebarDataPort.
 * Respecte ARCHITECTURE_DATA_FLOW.md : passage par use*Repository, jamais de fetch brut.
 */
export function useSidebarDataPort(): SidebarDataPort {
  const dividendRepo = useDividendRepository();
  const indiceRepo = useIndiceRepository();
  const primaryRepo = usePrimaryRepository();
  const actionRepo = useActionRepository();

  const { getAllDividends } = dividendRepo;
  const { getAllIndices, getIndicesCoursByIndice } = indiceRepo;
  const { getAllPrimaries } = primaryRepo;
  const { getActionByTicker, getAllActions } = actionRepo;

  const fetchFundamentals = useCallback(
    async (ticker: string, marketTicker: string, signal: AbortSignal): Promise<BRVMFundamentals> => {
      const normalized = normalizeTicker(ticker);
      const normalizedMarket = normalizeTicker(marketTicker);
      if (!normalized) return createEmptyFundamentals(ticker);

      try {
        throwIfAborted(signal);

        // The fundamentals endpoint is protected in anonymous mode.
        // Keep this public analysis page quiet and expose unavailable fundamentals as empty API data.
        const [actionResult, dividendsResult] = await Promise.allSettled([
          getActionByTicker({ ticker: normalized, marketTicker: normalizedMarket }),
          fetchScopedDividends(getAllDividends, normalized, signal),
        ]);

        throwIfAborted(signal);

        if (actionResult.status === "rejected") {
          console.warn(
            `[SidebarDataPort] Action profile fetch failed for ${normalized}:`,
            actionResult.reason instanceof Error ? actionResult.reason.message : actionResult.reason,
          );
        }
        if (dividendsResult.status === "rejected") {
          console.warn(
            `[SidebarDataPort] Dividends fetch failed for ${normalized}:`,
            dividendsResult.reason instanceof Error ? dividendsResult.reason.message : dividendsResult.reason,
          );
        }

        const action = actionResult.status === "fulfilled" ? actionResult.value : null;
        const earnings: BRVMFundamentalPoint[] = [];
        const revenues: BRVMFundamentalPoint[] = [];

        const divs = dividendsResult.status === "fulfilled" ? dividendsResult.value : [];
        const scopedDivs = filterDividendsForTicker(divs, normalized);
        if (scopedDivs.length !== divs.length) {
          console.warn("[SidebarDataPort] Dividend rows rejected by ticker scope", {
            requestedTicker: normalized,
            receivedCount: divs.length,
            acceptedCount: scopedDivs.length,
            rejectedCount: divs.length - scopedDivs.length,
          });
        }
        const dividends: BRVMDividendPoint[] = scopedDivs
          .filter((d) => d.amount != null && d.pay_date)
          .map((d) => ({
            year: new Date(d.pay_date).getFullYear().toString(),
            value: d.amount,
            isEstimate: false,
            exDate: d.ex_date || undefined,
            payDate: d.pay_date || undefined,
          }));

        const society = action?.society;
        const employeeCount = society?.employee_count;

        return {
          ticker: normalized,
          earnings: earnings.sort((a, b) => Number(a.year) - Number(b.year)),
          revenues: revenues.sort((a, b) => Number(a.year) - Number(b.year)),
          dividends: dividends.sort((a, b) => Number(a.year) - Number(b.year)),
          provenance: createFundamentalsProvenance("API"),
          fetchedAt: new Date().toISOString(),
          description: society?.description?.trim() || "",
          website: society?.website?.trim() || "",
          employees: typeof employeeCount === "number" && Number.isFinite(employeeCount)
            ? String(employeeCount)
            : "N/A",
          source: "API",
        };
      } catch (error) {
        if (signal.aborted) throw error;
        return createEmptyFundamentals(ticker);
      }
    },
    [getActionByTicker, getAllDividends]
  );

  const fetchIndices = useCallback(
    async (signal: AbortSignal): Promise<Record<string, BRVMIndexData>> => {
      try {
        const allIndices = await getAllIndices({ page_size: 100 });
        const record: Record<string, BRVMIndexData> = {};
        const apiSlugToUiKey: Record<string, string> = {
          "brvm-composite": "BRVMC",
          "brvm-30": "BRVM30",
          "brvm-prestige": "BRVMPR",
        };

        for (const idx of allIndices.data) {
          const uiKey = idx.slug ? apiSlugToUiKey[idx.slug.toLowerCase()] : undefined;
          if (!idx.id || !uiKey) continue;

          const firstPage = await getIndicesCoursByIndice(idx.id, { page_size: 100 });
          const lastPageNumber = firstPage.total_pages || 1;
          const latestPage = lastPageNumber > firstPage.current_page
            ? await getIndicesCoursByIndice(idx.id, { page: lastPageNumber, page_size: 100 })
            : firstPage;
          const lastCours = [...latestPage.data]
            .sort((a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp))
            .at(-1);
          if (!lastCours) continue;

          const change = lastCours.change_1d_pct;
          const variation = typeof change === "number" && Number.isFinite(change)
            ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
            : "N/D";

          record[uiKey] = {
            symbol: uiKey,
            name: idx.name,
            price: lastCours.close,
            variation,
            timestamp: lastCours.timestamp,
          };
        }

        return record;
      } catch (error) {
        if (signal.aborted) throw error;
        return {};
      }
    },
    [getAllIndices, getIndicesCoursByIndice]
  );

  const fetchNews = useCallback(
    async (signal: AbortSignal): Promise<BRVMNewsItem[]> => {
      // Exception validée : scraping BRVM news (aucune API).
      // Route locale préservée : /api/market-data/brvm-news.
      try {
        return await waitForAbortable(getSharedBrvmNews(), signal);
      } catch (error) {
        if (signal.aborted) throw error;
        return [];
      }
    },
    []
  );

  const fetchScreenerSecurities = useCallback(
    async (signal: AbortSignal): Promise<BRVMScreenerSecurity[]> => {
      const actions = await fetchAllActionPages(getAllActions, signal);
      const uniqueActions = new Map<string, ActionEntity>();
      for (const action of actions) {
        const key = action.id || action.ticker;
        if (!key) continue;
        uniqueActions.set(key, action);
      }
      return [...uniqueActions.values()].map(toScreenerSecurity);
    },
    [getAllActions],
  );

  const fetchBonds = useCallback(
    async (signal: AbortSignal): Promise<BRVMBond[]> => {
      try {
        const allPrimaries = await getAllPrimaries({ page_size: 100 });
        return allPrimaries.data
          .filter((primary) => primary.status === "ACTIVE")
          .map(toVerifiedApiBond)
          .filter((bond): bond is BRVMBond => bond !== null)
          .sort((left, right) => right.clearingYield - left.clearingYield)
          .slice(0, 3);
      } catch (error) {
        if (signal.aborted) throw error;
        return [];
      }
    },
    [getAllPrimaries]
  );

  return useMemo<SidebarDataPort>(
    () => ({ fetchFundamentals, fetchIndices, fetchNews, fetchBonds, fetchScreenerSecurities }),
    [fetchFundamentals, fetchIndices, fetchNews, fetchBonds, fetchScreenerSecurities]
  );
}

// Helpers
type ApiIssueLotWithClearingYield = {
  auction_date?: string | null;
  clearing_yield?: number | string | null;
  maturity_date?: string | null;
  status?: string | null;
};

function toVerifiedApiBond(primary: PrimaryEntity): BRVMBond | null {
  const issueLot = [...(primary.issue_lots ?? []) as ApiIssueLotWithClearingYield[]]
    .filter((candidate) => (
      Boolean(candidate.maturity_date)
      && candidate.clearing_yield !== null
      && candidate.clearing_yield !== undefined
      && (!candidate.status || candidate.status.toUpperCase() === "ACTIVE")
    ))
    .sort((left, right) => (
      String(left.auction_date ?? "").localeCompare(String(right.auction_date ?? ""))
    ))
    .pop();

  const clearingYield = parseApiPercentage(issueLot?.clearing_yield);
  if (clearingYield === null || !issueLot?.maturity_date) return null;

  return {
    name: primary.reference || primary.isin || primary.ticker || "N/A",
    maturityDate: issueLot.maturity_date,
    clearingYield,
  };
}

function parseApiPercentage(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const numericValue = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(numericValue)) return null;
  return Math.abs(numericValue) <= 1 ? numericValue * 100 : numericValue;
}

