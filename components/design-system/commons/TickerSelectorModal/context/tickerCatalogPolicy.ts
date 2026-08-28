import type { ActionQueryParams } from "@/core/domain/types/action.type";

export const TICKER_CATALOG_SNAPSHOT_VERSION = 2;
export const TICKER_CATALOG_PAGE_SIZE = 100;

const normalizeMarketTicker = (marketTicker: string): string => marketTicker.trim().toUpperCase();

export const resolveTickerCatalogApiTotalCount = (
  reportedCount: unknown,
  rawPageLength: number,
  marketPageLength: number,
): number | null => {
  if (typeof reportedCount !== "number" || !Number.isSafeInteger(reportedCount) || reportedCount < 0) return null;
  if (!Number.isSafeInteger(rawPageLength) || rawPageLength < 0) return null;
  if (!Number.isSafeInteger(marketPageLength) || marketPageLength < 0) return null;
  if (rawPageLength !== marketPageLength) return null;
  if (reportedCount < marketPageLength) return null;
  return reportedCount;
};

export const isCurrentTickerCatalogSnapshotVersion = (value: unknown): boolean =>
  value === TICKER_CATALOG_SNAPSHOT_VERSION;

export const buildTickerCatalogQuery = (
  marketTicker: string,
  page: number,
): ActionQueryParams => {
  const normalizedMarketTicker = normalizeMarketTicker(marketTicker);
  if (!normalizedMarketTicker) throw new Error("Ticker catalog market is required.");
  if (!Number.isSafeInteger(page) || page < 1) throw new Error("Ticker catalog page must be a positive integer.");

  return {
    view_type: "screener",
    bourse_tickers: normalizedMarketTicker,
    page,
    page_size: TICKER_CATALOG_PAGE_SIZE,
  };
};
