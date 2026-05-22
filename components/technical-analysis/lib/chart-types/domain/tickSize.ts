import type { SymbolMeta } from "./types";

const EXCHANGE_DEFAULT_TICK_SIZE: Record<string, number> = {
  BRVM: 1,
  NGX: 0.01,
  GSE: 0.01,
  NSE: 0.01,
  JSE: 0.01,
  CSE: 0.01,
};

export const resolveTickSize = (symbolMeta?: Partial<SymbolMeta>): number => {
  if (symbolMeta?.tickSize && Number.isFinite(symbolMeta.tickSize) && symbolMeta.tickSize > 0) {
    return symbolMeta.tickSize;
  }

  const exchange = symbolMeta?.exchange?.toUpperCase();
  if (exchange && EXCHANGE_DEFAULT_TICK_SIZE[exchange]) return EXCHANGE_DEFAULT_TICK_SIZE[exchange];

  return 0.01;
};

export const resolvePricePrecision = (symbolMeta?: Partial<SymbolMeta>): number => {
  if (Number.isInteger(symbolMeta?.pricePrecision) && (symbolMeta?.pricePrecision ?? 0) >= 0) {
    return symbolMeta?.pricePrecision ?? 2;
  }

  const tickSize = resolveTickSize(symbolMeta);
  const text = tickSize.toString();
  const decimals = text.includes(".") ? text.split(".")[1].length : 0;
  return Math.min(8, Math.max(0, decimals));
};
