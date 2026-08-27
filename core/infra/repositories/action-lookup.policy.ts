import type { ActionEntity } from "@/core/domain/entities/action.entity";
import type { ActionLookupCriteria } from "@/core/domain/repositories/action.repository";
import type { ActionQueryParams } from "@/core/domain/types/action.type";

export type NormalizedActionLookupCriteria = Readonly<{
  ticker: string;
  isin?: string;
  marketTicker?: string;
}>;

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

export const normalizeActionLookupCriteria = (
  criteria: ActionLookupCriteria,
): NormalizedActionLookupCriteria => {
  const ticker = normalize(criteria.ticker);
  const isin = normalize(criteria.isin);
  const normalizedMarketTicker = normalize(criteria.marketTicker);
  const marketTicker = normalizedMarketTicker && normalizedMarketTicker !== "UNKNOWN"
    ? normalizedMarketTicker
    : "";

  return {
    ticker,
    ...(isin ? { isin } : {}),
    ...(marketTicker ? { marketTicker } : {}),
  };
};

export const buildActionLookupRequestKey = (
  criteria: NormalizedActionLookupCriteria,
): string => [
  "actions:lookup",
  `market:${criteria.marketTicker ?? ""}`,
  `ticker:${criteria.ticker}`,
  `isin:${criteria.isin ?? ""}`,
].join(":");

export const buildActionLookupQuery = (
  criteria: NormalizedActionLookupCriteria,
  field: "isin" | "ticker",
): ActionQueryParams => {
  const query: ActionQueryParams = {
    page: 1,
    page_size: criteria.marketTicker ? 1 : 2,
    ...(field === "isin" && criteria.isin ? { isin: criteria.isin } : { ticker: criteria.ticker }),
  };

  if (criteria.marketTicker) {
    // The list endpoint is an index lookup only. Multi-exchange full-list
    // projections can be expensive or fail server-side (notably CSE), while
    // the screener projection reliably exposes the canonical action id.
    // The repository hydrates that id through /actions/{id}/ before returning.
    query.bourse_tickers = criteria.marketTicker;
    query.view_type = "screener";
  }

  return query;
};

export const buildActionMarketCatalogQuery = (
  criteria: NormalizedActionLookupCriteria,
  page = 1,
): ActionQueryParams => {
  if (!criteria.marketTicker) {
    throw new Error("A market ticker is required for catalog fallback.");
  }
  return {
    page: Math.max(1, Math.floor(page)),
    page_size: 100,
    bourse_tickers: criteria.marketTicker,
    view_type: "screener",
  };
};

export const actionMatchesLookup = (
  action: ActionEntity,
  criteria: NormalizedActionLookupCriteria,
): boolean => {
  if (normalize(action.ticker) !== criteria.ticker) return false;
  if (criteria.marketTicker && normalize(action.bourse?.ticker) !== criteria.marketTicker) return false;
  if (criteria.isin && normalize(action.isin) !== criteria.isin) return false;
  return true;
};
