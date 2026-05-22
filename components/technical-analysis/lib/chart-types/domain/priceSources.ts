import type { PriceSource, RawBar } from "./types";

export const PRICE_SOURCE_LABELS: Record<PriceSource, string> = {
  open: "Open",
  high: "High",
  low: "Low",
  close: "Close",
  hl2: "HL2",
  hlc3: "HLC3",
  ohlc4: "OHLC4",
};

export const resolvePriceSource = (bar: RawBar, source: PriceSource = "close"): number => {
  if (source === "open") return bar.open;
  if (source === "high") return bar.high;
  if (source === "low") return bar.low;
  if (source === "hl2") return (bar.high + bar.low) / 2;
  if (source === "hlc3") return (bar.high + bar.low + bar.close) / 3;
  if (source === "ohlc4") return (bar.open + bar.high + bar.low + bar.close) / 4;
  return bar.close;
};
