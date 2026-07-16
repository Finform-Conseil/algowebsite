export type ObjectTreePanelTab = "object_tree" | "data_window";

/**
 * Codes d'anomalie détectées sur une bougie OHLCV.
 * Chaque flag correspond à une condition spécifique de données non prouvées.
 *
 * [TENOR 2026 — Option F] Financial Proof Mode.
 * Axiome : toute valeur affichée doit tendre vers la "preuve financière".
 * Une seule valeur fausse peut faire perdre de l'argent.
 */
export type DataAnomalyFlag =
  | "ZERO_VOLUME"      // Volume = 0 ou null : bougie non tradée ou données manquantes
  | "ZERO_PRICE"       // Close ou Open = 0 : donnée corrompue
  | "SUSPICIOUS_SPREAD" // High-Low > 3x ATR estimé : possible anomalie ou split non ajusté
  | "NO_TRADES"        // tradesCount = 0 : session sans transaction confirmée
  | "STALE_DATA"       // Données âgées de plus de 3 jours ouvrés (hors week-end)
  | "EXTREME_CHANGE";  // Variation > 20% en un jour : split potentiel ou donnée incorrecte

export interface DataWindowCandleValues {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  lastDayChange: number;
  lastDayChangePercent: number;
  isUp: boolean;
  // --- [TENOR 2026 — Option F] Financial Proof metadata ---
  /** Label de provenance de la donnée : "BRVM CSV", "BRVM Live", "Cache local" */
  provenanceLabel?: string;
  /** Âge de la bougie la plus récente en ms depuis now (0 si live) */
  dataAgeMs?: number;
  /** Liste des codes d'anomalie détectés sur cette bougie */
  anomalyFlags?: DataAnomalyFlag[];
}

