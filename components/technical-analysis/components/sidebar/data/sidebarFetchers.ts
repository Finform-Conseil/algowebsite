// ================================================================================
// FICHIER : sidebarFetchers.ts — MIGRÉ vers port d'injection (v2.16)
// ================================================================================
// [MIGRATION API v2.16] Les fetchers acceptent désormais un `SidebarDataPort`
// injecté par l'orchestrateur `useSidebarDataFeeds`. Aucune route locale
// `/api/market-data/*` n'est requêtée directement (sauf news = scraping).
// Architecture DI Hexagonale : fetchers = purs, port = contrat, adapter = RTK.
// ================================================================================

import type { SidebarDataPort } from "./sidebarDataPort";
import type { BRVMFundamentals } from "./sidebarFundamentals";

export interface BRVMNewsItem {
  title: string;
  date: string;
  link: string;
}

export interface BRVMBond {
  name: string;
  maturityDate: string;
  ytm: number;
}

export interface BRVMScreenerSecurity {
  country: string;
  currency: string;
  epsT12M: number | null;
  exchange: string;
  marketCap: number | null;
  name: string;
  peRatio: number | null;
  price: number | null;
  priceChangeD1: number | null;
  returnYTD: number | null;
  revenueT12M: number | null;
  sector: string;
  status: "active" | "delisted";
  ticker: string;
  volume: number | null;
}

export interface BRVMIndexData {
  symbol: string;
  name: string;
  price: number;
  variation: string;
  timestamp: string;
}

/**
 * Récupère les fondamentaux via le port injecté (API backend).
 */
export async function fetchSidebarFundamentals(
  port: SidebarDataPort,
  ticker: string,
  signal: AbortSignal,
): Promise<BRVMFundamentals> {
  return port.fetchFundamentals(ticker, signal);
}

/**
 * Récupère les indices BRVM via le port injecté (API backend).
 */
export async function fetchSidebarIndices(
  port: SidebarDataPort,
  signal: AbortSignal,
): Promise<Record<string, BRVMIndexData>> {
  return port.fetchIndices(signal);
}

/**
 * Récupère les actualités BRVM via le port injecté (scraping exception).
 */
export async function fetchSidebarNews(
  port: SidebarDataPort,
  signal: AbortSignal,
): Promise<BRVMNewsItem[]> {
  return port.fetchNews(signal);
}

/**
 * Récupère les obligations via le port injecté (API backend).
 */
export async function fetchSidebarBonds(
  port: SidebarDataPort,
  signal: AbortSignal,
): Promise<BRVMBond[]> {
  return port.fetchBonds(signal);
}

/**
 * Récupère le catalogue d'actions BRVM exclusivement depuis l'API distante.
 */
export async function fetchSidebarScreenerSecurities(
  port: SidebarDataPort,
  signal: AbortSignal,
): Promise<BRVMScreenerSecurity[]> {
  return port.fetchScreenerSecurities(signal);
}
