import type { BRVMSecurity } from "@/core/data/brvm-securities";

export type DisplaySecurity = Omit<BRVMSecurity, "currency"> & { currency: string };
export interface LiveSnapshot {
  symbol: string;
  price: number;
  variation: string; // e.g., "+0,19%"
  prevClose: number;
  open: number;
  high: number;
  low: number;
  volume?: number; // [TENOR 2026] Added volume support
  tradesCount?: number | null;
  trades_count?: number | null;
  marketCap?: number; // [TENOR 2026] Live Capitalisation (Globale)
  sharesCount?: number; // [TENOR 2026] Nombre de titres réel
  peRatio?: number; // [TENOR 2026] Ratio dynamique
  returnYTD?: number; // [TENOR 2026] Performance annuelle réelle
  source?: string;
  sourceStatus?: "live" | "fallback" | "derived";
  sourceLabel?: string;
  capitalizationSource?: string;
  lastUpdate: string;
}
