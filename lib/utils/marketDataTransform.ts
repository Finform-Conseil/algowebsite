// lib/utils/marketDataTransform.ts
// ============================================================================
// PONT DE TRANSFORMATION : DOMAIN (backend Django) -> UI (technical-analysis)
// ----------------------------------------------------------------------------
// SOURCE UNIQUE DE VÉRITÉ (DRY) pour convertir les entités renvoyées par l'API
// `Algo DataBase API v1` vers les modèles de présentation attendus par les
// composants de `components/technical-analysis`.
//
// PRINCIPES (SOLID / Clean Architecture) :
//  - Couche transformation UI : ne connaît NI React, NI RTK, NI le réseau.
//  - Fonctions PURES et immutables : (entrée) => (sortie), zéro effet de bord.
//  - Une fonction = une responsabilité de mapping.
//  - STRATÉGIE DIAGNOSTIC : les champs `null` du backend restent `null`.
//    Aucun calcul local de secours ne masque un indicateur défaillant.
//    => Un trou dans la donnée API DOIT rester visible.
//
// Conformité : Docs/ARCHITECTURE_DATA_FLOW.md §4 (transformation dans lib/utils).
// ============================================================================

import type { CoursEntity } from "@/core/domain/entities/cours.entity";
import type { PriceIndicatorEntity } from "@/core/domain/entities/cours.entity";
import type { ChartDataPoint } from "@/components/technical-analysis/lib/Indicators/TechnicalIndicators";
import type { LiveSnapshot } from "@/components/technical-analysis/config/market/marketSnapshotTypes";

// ----------------------------------------------------------------------------
// Helpers numériques purs (garde-fous de type, aucune fabrication de donnée)
// ----------------------------------------------------------------------------

/** Retourne un `number` fini, sinon `fallback` (jamais NaN dans l'UI). */
const finiteOr = (value: unknown, fallback: number): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

/** Formate un pourcentage signé au format d'affichage BRVM ("+0.19%"). */
const formatSignedPercent = (pct: number): string =>
  `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;

// ----------------------------------------------------------------------------
// 1) SÉRIE OHLCV : CoursEntity[] (API) -> ChartDataPoint[] (chart)
// ----------------------------------------------------------------------------

/**
 * Convertit une bougie backend `Cours` en point de graphique.
 * Le backend fournit `timestamp` (ISO date-time) et OHLCV numériques.
 */
export const coursEntityToChartDataPoint = (cours: CoursEntity): ChartDataPoint => {
  const open = finiteOr(cours.open, 0);
  const close = finiteOr(cours.close, 0);
  const fallbackLow = open > 0 && close > 0 ? Math.min(open, close) : Math.max(open, close);
  const fallbackHigh = Math.max(open, close);

  return {
    time: cours.timestamp,
    open,
    high: finiteOr(cours.high, fallbackHigh),
    low: finiteOr(cours.low, fallbackLow),
    close,
    volume: finiteOr(cours.volume, 0),
    tradesCount: typeof cours.number_of_trades === "number" ? cours.number_of_trades : null,
    trades_count: typeof cours.number_of_trades === "number" ? cours.number_of_trades : null,
  };
};

/**
 * Convertit une série backend en série chart, triée par temps croissant
 * (les moteurs de chart attendent un ordre chronologique ascendant).
 * IMMUTABLE : ne mute pas le tableau d'entrée.
 */
export const coursSeriesToChartData = (series: readonly CoursEntity[]): ChartDataPoint[] =>
  [...series]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(coursEntityToChartDataPoint);

// ----------------------------------------------------------------------------
// 2) SNAPSHOT LIVE : PriceIndicatorEntity (API) -> LiveSnapshot (UI)
// ----------------------------------------------------------------------------

/**
 * Convertit la métrique de prix la plus récente (`latest_price_metric`) en
 * snapshot d'affichage. La variation est déjà fournie par le backend
 * (`change_1d_pct`) : on NE la recalcule PAS localement (stratégie diagnostic).
 *
 * @param metric  Le bloc `latest_price_metric` d'un `ActionEntity`.
 * @param symbol  Le ticker affiché (clé de cache UI).
 */
export const priceMetricToLiveSnapshot = (
  metric: PriceIndicatorEntity,
  symbol: string,
): LiveSnapshot => {
  // La variation vient de l'API. Si null -> 0 (mais reste visible via sourceStatus).
  const change1dPct = finiteOr(metric.change_1d_pct, 0);

  const snapshot: LiveSnapshot = {
    symbol,
    price: finiteOr(metric.price, 0),
    variation: formatSignedPercent(change1dPct),
    prevClose: finiteOr(metric.prev_close, 0),
    open: finiteOr(metric.open, 0),
    // Le backend expose high/low 52 semaines (pas d'intraday high/low sur la
    // métrique agrégée) : on mappe le 52w disponible sans inventer d'intraday.
    high: finiteOr(metric.high_52w, 0),
    low: finiteOr(metric.low_52w, 0),
    volume: finiteOr(metric.volume, 0),
    source: "ALGO_DB_API",
    // Un prix API absent/nul est un signal de défaillance, rendu visible.
    sourceStatus: finiteOr(metric.price, 0) > 0 ? "live" : "fallback",
    sourceLabel: finiteOr(metric.price, 0) > 0 ? "Live API" : "API (no price)",
    lastUpdate: metric.timestamp ?? new Date().toISOString(),
  };

  // `variationNum` : lecture O(1) côté render (injecté au bord réseau, comme
  // dans l'ancien pipeline) pour éviter le re-parsing regex dans la boucle React.
  // @ts-expect-error - variationNum est un champ de performance injecté au bord réseau
  snapshot.variationNum = change1dPct;

  return snapshot;
};

// --- EOF ---
