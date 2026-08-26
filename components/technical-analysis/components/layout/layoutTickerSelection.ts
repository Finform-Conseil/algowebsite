import { EXCHANGE_STATIC_INFO } from "@/core/data/ExchangesStaticData";

export interface LayoutTickerMarketSelection {
  ticker: string;
  name: string;
  currency: string;
}

/**
 * Resolves the market scope owned by a layout cell. Unknown/blank exchanges
 * return null so callers never silently inherit the workspace's global market.
 */
export const resolveLayoutTickerMarket = (
  exchange: string | null | undefined,
): LayoutTickerMarketSelection | null => {
  const ticker = String(exchange ?? "").trim().toUpperCase();
  if (!ticker) return null;

  const exchangeInfo = EXCHANGE_STATIC_INFO[ticker];
  if (!exchangeInfo) return null;

  return {
    ticker,
    name: ticker,
    currency: exchangeInfo.currency,
  };
};
