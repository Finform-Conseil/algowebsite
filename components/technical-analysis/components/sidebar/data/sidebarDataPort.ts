// ================================================================================
// FICHIER : components/technical-analysis/components/sidebar/data/sidebarDataPort.ts
// RÔLE   : PORT (interface) Hexagonal pour les données sidebar — contrat du domaine,
//          indépendant de l'implémentation (API vs scraping).
// ================================================================================
// [MIGRATION API v2.16] Port d'injection permettant aux fetchers (promise-based)
// de rester purs/testables tout en consommant les repos RTK (hook-based).
// L'adapter réel (`useSidebarDataPort`) wire les repos RTK + transformers.
// Aucune route locale /api/market-data n'est requêtée, SAUF les news (scraping,
// exception validée : aucune alternative API).
// ================================================================================

import type { BRVMFundamentals } from "./sidebarFundamentals";
import type { BRVMIndexData, BRVMNewsItem, BRVMBond, BRVMScreenerSecurity } from "./sidebarFetchers";

/**
 * Port (driven adapter interface) pour les données sidebar.
 * Chaque méthode retourne une Promise avec AbortSignal, permettant
 * l'injection dans des fetchers promise-based orchestrés par useEffect.
 */
export interface SidebarDataPort {
  /**
   * Fondamentaux (earnings/revenues/dividends) pour un ticker.
   * API : /results/ (net-income, revenue) + /dividends/.
   * Les champs description/website/employees restent vides (pas d'API).
   */
  fetchFundamentals(ticker: string, signal: AbortSignal): Promise<BRVMFundamentals>;

  /**
   * Indices BRVM + dernier cours (close, variation, timestamp).
   * API : /indices/ + /indices/{id}/cours/.
   * @returns Record<symbol, BRVMIndexData> où symbol = slug d'indice.
   */
  fetchIndices(signal: AbortSignal): Promise<Record<string, BRVMIndexData>>;

  /**
   * Actualités BRVM via scraping (exception validée).
   * Source : route locale /api/market-data/brvm-news (préservée hors _Old).
   */
  fetchNews(signal: AbortSignal): Promise<BRVMNewsItem[]>;

  /**
   * Obligations (bonds) BRVM.
   * API : /fixed-income/bond-securities/ (BondSecurity).
   */
  fetchBonds(signal: AbortSignal): Promise<BRVMBond[]>;

  /**
   * Actions BRVM pour le screener.
   * API : /actions/ avec pagination, puis filtrage strict sur bourse.ticker.
   */
  fetchScreenerSecurities(signal: AbortSignal): Promise<BRVMScreenerSecurity[]>;
}
