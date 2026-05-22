import { calculateAtrWilder, getLastFinite, roundToTick } from "../domain/math";
import { resolveTickSize } from "../domain/tickSize";
import type { ChartTransformInput } from "../domain/types";

export type PriceBasedSizeMethod = "traditional" | "atr" | "percentage_ltp";

export interface PriceBasedSizeSettings {
  method?: PriceBasedSizeMethod;
  traditionalSize?: number;
  atrLength?: number;
  percentage?: number;
}

export const resolvePriceBasedSize = (
  input: ChartTransformInput,
  settings: PriceBasedSizeSettings = {},
): number => {
  const tickSize = resolveTickSize(input.symbolMeta);
  const lastClose = input.bars[input.bars.length - 1]?.close ?? tickSize;
  const method = settings.method ?? "traditional";

  if (method === "atr") {
    const atr = getLastFinite(calculateAtrWilder(input.bars, settings.atrLength ?? 14));
    const fallback = Math.max(Math.abs(lastClose) * 0.01, 2 * tickSize);
    return roundToTick(Math.max(atr ?? fallback, tickSize), tickSize);
  }

  if (method === "percentage_ltp") {
    const percentage = settings.percentage ?? 1;
    return roundToTick(Math.max(Math.abs(lastClose) * percentage / 100, tickSize), tickSize);
  }

  const fallbackTraditional = Math.max(Math.abs(lastClose) * 0.01, 2 * tickSize);
  return roundToTick(Math.max(settings.traditionalSize ?? fallbackTraditional, tickSize), tickSize);
};

export const syntheticPriceWarning = (label: string) => ({
  code: "SYNTHETIC_PRICE",
  severity: "warning" as const,
  message: `${label} uses synthetic price-based construction. Do not use these prices for real order backtests.`,
});
