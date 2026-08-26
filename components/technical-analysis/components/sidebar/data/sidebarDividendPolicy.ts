import type { DividendEntity } from "@/core/domain/entities/dividend.entity";
import type { QueryParams } from "@/core/domain/types/pagination.type";
import { normalizeTicker } from "./sidebarFundamentals";

/**
 * The dividends endpoint currently returns a global catalogue even when
 * action_ticker is supplied. A sidebar must never follow that global count.
 */
export const DIVIDEND_INITIAL_PAGE = 1;
export const DIVIDEND_PAGE_LIMIT = 1;
export const DIVIDEND_PAGE_SIZE = 25;

export function buildScopedDividendQuery(ticker: string): QueryParams | null {
  const normalizedTicker = normalizeTicker(ticker);
  if (!normalizedTicker) return null;

  return {
    action_ticker: normalizedTicker,
    page: DIVIDEND_INITIAL_PAGE,
    page_size: DIVIDEND_PAGE_SIZE,
  };
}

export function isDividendForTicker(
  dividend: Pick<DividendEntity, "action_ticker">,
  ticker: string,
): boolean {
  const requestedTicker = normalizeTicker(ticker);
  return Boolean(requestedTicker)
    && typeof dividend.action_ticker === "string"
    && normalizeTicker(dividend.action_ticker) === requestedTicker;
}

export function filterDividendsForTicker<T extends Pick<DividendEntity, "action_ticker">>(
  dividends: T[],
  ticker: string,
): T[] {
  return dividends.filter((dividend) => isDividendForTicker(dividend, ticker));
}
