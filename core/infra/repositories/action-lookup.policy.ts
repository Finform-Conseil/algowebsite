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
    query.view_type = "screener";
    query.bourse_tickers = criteria.marketTicker;
  }

  return query;
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
