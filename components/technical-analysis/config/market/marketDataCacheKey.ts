const MARKET_DATA_SCOPE_SEPARATOR = "::";

export const normalizeMarketDataScope = (market: string | null | undefined): string =>
  String(market ?? "").trim().toUpperCase();

export const createMarketDataCacheKey = (
  market: string | null | undefined,
  symbol: string | null | undefined,
): string => {
  const normalizedMarket = normalizeMarketDataScope(market);
  const normalizedSymbol = String(symbol ?? "").trim().toUpperCase();

  return normalizedMarket && normalizedSymbol
    ? `${normalizedMarket}${MARKET_DATA_SCOPE_SEPARATOR}${normalizedSymbol}`
    : normalizedSymbol;
};
