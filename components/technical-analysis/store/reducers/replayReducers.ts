/**
 * [TENOR 2026 FEAT] replayReducers
 *
 * Reducers Redux pour le Replay Mode.
 *
 * Invariants :
 * - setReplayCurrentIndex : toujours clampé dans [0, totalCandles[
 *   pour éviter un index hors-borne même si un caller bugué envoie -1 ou MAX_SAFE_INT.
 * - setReplayTotalCandles : force currentIndex à 0 si la nouvelle valeur de totalCandles
 *   rend l'index actuel invalide — garantie d'état cohérent.
 * - setReplaySpeed : délègue à normalizeReplaySpeed pour valider [50ms, 60_000ms].
 * - setReplayActive / setReplayPaused : reset currentIndex et totalCandles à 0
 *   quand le replay est désactivé, pour éviter un état "fantôme" entre deux sessions.
 *
 * [SRE] Tous les reducers sont purs (aucun side-effect, aucun appel réseau)
 * et idempotents (appliquer deux fois le même payload = résultat identique).
 */

import type { PayloadAction } from "@reduxjs/toolkit";

import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import { normalizeReplaySpeed } from "../policies/replayPolicy";

export const replayReducers = {
  // ── Active / Paused ──────────────────────────────────────────────────────

  setReplayActive: (
    state: TechnicalAnalysisState,
    action: PayloadAction<boolean>,
  ) => {
    state.ui.replay.isActive = action.payload;
    // [SRE] Reset progress when replay ends to prevent stale progress display
    if (!action.payload) {
      state.ui.replay.currentIndex = 0;
      state.ui.replay.totalCandles = 0;
      state.ui.replay.isPaused = false;
    }
  },

  setReplayPaused: (
    state: TechnicalAnalysisState,
    action: PayloadAction<boolean>,
  ) => {
    state.ui.replay.isPaused = action.payload;
  },

  // ── Speed ─────────────────────────────────────────────────────────────────

  setReplaySpeed: (
    state: TechnicalAnalysisState,
    action: PayloadAction<number>,
  ) => {
    const speed = normalizeReplaySpeed(action.payload);
    // [SRE] Reject invalid speeds silently (out-of-range or non-finite)
    if (speed === null) return;
    state.ui.replay.speed = speed;
  },

  // ── Progress tracking ─────────────────────────────────────────────────────

  /**
   * Met à jour le nombre total de bougies disponibles.
   * Appelé par useMarketData.startReplay() après avoir calculé le slice initial.
   * [SRE] Clamps currentIndex si l'ancien index est déjà hors-borne.
   */
  setReplayTotalCandles: (
    state: TechnicalAnalysisState,
    action: PayloadAction<number>,
  ) => {
    const total = Math.max(0, Math.trunc(action.payload));
    state.ui.replay.totalCandles = total;
    // Clamp currentIndex in case it overshoots the new total
    if (state.ui.replay.currentIndex >= total) {
      state.ui.replay.currentIndex = Math.max(0, total - 1);
    }
  },

  /**
   * Met à jour l'index courant de la bougie affichée.
   * Appelé à chaque tick du setInterval du replay ET après chaque step manuel.
   * [SRE] Clamps dans [0, totalCandles[ pour qu'un caller défaillant
   * ne puisse jamais corrompre l'état Redux.
   */
  setReplayCurrentIndex: (
    state: TechnicalAnalysisState,
    action: PayloadAction<number>,
  ) => {
    const total = state.ui.replay.totalCandles;
    const clamped = Math.max(0, Math.min(Math.trunc(action.payload), total - 1));
    state.ui.replay.currentIndex = clamped;
  },

  // ── Existing non-replay reducers (co-located for slice cohesion) ──────────

  setLockedAll: (
    state: TechnicalAnalysisState,
    action: PayloadAction<boolean>,
  ) => {
    state.ui.isLockedAll = action.payload;
  },

  toggleLockedAll: (state: TechnicalAnalysisState) => {
    state.ui.isLockedAll = !state.ui.isLockedAll;
  },

  setAreDrawingsHidden: (
    state: TechnicalAnalysisState,
    action: PayloadAction<boolean>,
  ) => {
    state.ui.areDrawingsHidden = action.payload;
  },

  toggleAreDrawingsHidden: (state: TechnicalAnalysisState) => {
    state.ui.areDrawingsHidden = !state.ui.areDrawingsHidden;
  },
};
