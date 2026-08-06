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
import { useResultRepository } from "@/core/infra/repositories/result.repository.impl";
import { useDividendRepository } from "@/core/infra/repositories/dividend.repository.impl";
import { useIndiceRepository } from "@/core/infra/repositories/indice.repository.impl";
import { usePrimaryRepository } from "@/core/infra/repositories/primary.repository.impl";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import type { ActionQueryParams } from "@/core/domain/types/action.type";
import type { PaginatedResponse } from "@/core/domain/types/pagination.type";
import type { SidebarDataPort } from "./sidebarDataPort";
import type { BRVMFundamentals, BRVMFundamentalPoint, BRVMDividendPoint } from "./sidebarFundamentals";
import type { BRVMIndexData, BRVMNewsItem, BRVMBond, BRVMScreenerSecurity } from "./sidebarFetchers";
import { createEmptyFundamentals, normalizeTicker } from "./sidebarFundamentals";
import { createFundamentalsProvenance } from "./sidebarProvenance";

const ACTION_PAGE_SIZE = 100;
const ACTION_PAGE_CONCURRENCY = 4;

type GetAllActions = (params?: ActionQueryParams) => Promise<PaginatedResponse<ActionEntity>>;

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) throw new DOMException("The screener request was aborted.", "AbortError");
};

const readFinite = (value: number | null | undefined): number | null => (
  typeof value === "number" && Number.isFinite(value) ? value : null
);

const toScreenerSecurity = (action: ActionEntity): BRVMScreenerSecurity => ({
  country: action.society?.country?.name || "UEMOA",
  currency: action.bourse?.currency?.symbol || "XOF",
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
  sector: action.society?.industry?.name || action.society?.activity?.name || "Other",
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
  const resultRepo = useResultRepository();
  const dividendRepo = useDividendRepository();
  const indiceRepo = useIndiceRepository();
  const primaryRepo = usePrimaryRepository();
  const actionRepo = useActionRepository();

  const { getAllResults } = resultRepo;
  const { getAllDividends } = dividendRepo;
  const { getAllIndices, getIndicesCoursByIndice } = indiceRepo;
  const { getAllPrimaries } = primaryRepo;
  const { getAllActions } = actionRepo;

  const fetchFundamentals = useCallback(
    async (ticker: string, signal: AbortSignal): Promise<BRVMFundamentals> => {
      const normalized = normalizeTicker(ticker);
      if (!normalized) return createEmptyFundamentals(ticker);

      try {
        // Récupérer /results/ pour earnings (net-income) et revenues (revenue).
        // QueryParams supporte [key: string]: any → on peut passer action_ticker.
        const resultsResp = await getAllResults({
          action_ticker: normalized,
          page_size: 500,
        });
        const results = resultsResp.data || [];

        const earnings: BRVMFundamentalPoint[] = [];
        const revenues: BRVMFundamentalPoint[] = [];

        for (const r of results) {
          const metricSlug = (r.metric as any)?.slug || "";
          const year = (r.period as any)?.year;
          const value = r.value;
          if (typeof value !== "number" || !year) continue;

          if (metricSlug.includes("net-income") || metricSlug.includes("net_income")) {
            earnings.push({ year: String(year), value, isEstimate: false });
          }
          if (metricSlug.includes("revenue") && !metricSlug.includes("non-revenue")) {
            revenues.push({ year: String(year), value, isEstimate: false });
          }
        }

        // Récupérer /dividends/ filtré par action_ticker.
        const dividendsResp = await getAllDividends({
          action_ticker: normalized,
          page_size: 100,
        });
        const divs = dividendsResp.data || [];
        const dividends: BRVMDividendPoint[] = divs
          .filter((d) => d.amount != null && d.pay_date)
          .map((d) => ({
            year: new Date(d.pay_date).getFullYear().toString(),
            value: d.amount,
            isEstimate: false,
            exDate: d.ex_date || undefined,
            payDate: d.pay_date || undefined,
          }));

        return {
          ticker: normalized,
          earnings: earnings.sort((a, b) => Number(a.year) - Number(b.year)),
          revenues: revenues.sort((a, b) => Number(a.year) - Number(b.year)),
          dividends: dividends.sort((a, b) => Number(a.year) - Number(b.year)),
          provenance: createFundamentalsProvenance("API"),
          fetchedAt: new Date().toISOString(),
          description: "",
          website: "",
          employees: "N/A",
          source: "API",
        };
      } catch (error) {
        if (signal.aborted) throw error;
        return createEmptyFundamentals(ticker);
      }
    },
    [getAllResults, getAllDividends]
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
        const response = await fetch("/api/market-data/brvm-news", { signal });
        if (!response.ok) return [];
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        return data.filter((item) => item.title && item.date && item.link);
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
          .filter((p) => p.status === "ACTIVE" && p.tenor && p.coupon_rate)
          .slice(0, 5)
          .map((p) => ({
            name: p.isin || p.ticker || p.reference || "N/A",
            maturityDate: calculateMaturityDate(p.tenor),
            ytm: parseCouponRate(p.coupon_rate),
          }));
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
function calculateMaturityDate(tenor: string | number | undefined): string {
  if (!tenor) return "N/A";
  const years = typeof tenor === "string" ? parseFloat(tenor) : tenor;
  if (!Number.isFinite(years)) return "N/A";
  const now = new Date();
  const maturity = new Date(now.getFullYear() + Math.round(years), now.getMonth(), now.getDate());
  return maturity.toISOString().split("T")[0];
}

function parseCouponRate(rate: string | number | undefined): number {
  if (rate == null) return 0;
  const val = typeof rate === "string" ? parseFloat(rate) : rate;
  return Number.isFinite(val) ? val * 100 : 0;
}

