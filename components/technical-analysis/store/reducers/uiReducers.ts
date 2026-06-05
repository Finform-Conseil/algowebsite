import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  MovingAverageTrendSignalId,
  PriceVsEmaMetricId,
  PriceVsSmaMetricId,
} from "../../config/indicators/advancedIndicatorsTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import type { CursorModeType, UiState } from "../../config/state/uiStateTypes";
import {
  createDefaultCompareSeriesSettings,
  getCompareSeriesColor,
  normalizeCompareSeriesSettings,
  normalizeCompareSymbol,
  type CompareSeriesSettings,
} from "../../config/compare-series/compareSeries";
import { normalizeMovingAverageTrendSignals } from "../../config/indicators/movingAverageSeries";
import { normalizePriceVsEmaMetrics } from "../../config/indicators/priceVsEmaMetrics";
import { normalizePriceVsSmaMetrics } from "../../config/indicators/priceVsSmaMetrics";
import { closeAllModalFlags, setModalOpenFlag } from "../policies/modalPolicy";

export const uiReducers = {
  setZenMode: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.isZenMode = action.payload;
  },
  toggleZenMode: (state: TechnicalAnalysisState) => {
    state.ui.isZenMode = !state.ui.isZenMode;
  },
  setAnonyme: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.isAnonyme = action.payload;
  },
  setSelectedPseudo: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    state.ui.selectedPseudo = action.payload;
  },
  setCursorMode: (state: TechnicalAnalysisState, action: PayloadAction<CursorModeType>) => {
    state.ui.cursorMode = action.payload;
  },
  setTimeRange: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    state.ui.selectedTimeRange = action.payload;
  },
  setPublishing: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.isPublishing = action.payload;
  },
  setCapturing: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.isCapturing = action.payload;
  },
  setDataMode: (state: TechnicalAnalysisState, action: PayloadAction<"mock" | "real">) => {
    state.ui.dataMode = action.payload;
  },
  setSearchMode: (state: TechnicalAnalysisState, action: PayloadAction<"replace" | "compare">) => {
    state.ui.searchMode = action.payload;
  },
  addComparisonSymbol: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const normalized = normalizeCompareSymbol(action.payload);
    if (!normalized) return;
    if (normalized === state.chartConfig.symbol.trim().toUpperCase()) return;
    if (state.ui.comparisonSymbols.includes(normalized)) return;
    if (state.ui.comparisonSymbols.length >= 5) return;

    state.ui.comparisonSymbols.push(normalized);
    state.ui.comparisonSettings[normalized] = createDefaultCompareSeriesSettings(
      getCompareSeriesColor(state.ui.comparisonSymbols.length - 1),
    );
  },
  removeComparisonSymbol: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    const normalized = normalizeCompareSymbol(action.payload);
    state.ui.comparisonSymbols = state.ui.comparisonSymbols.filter((symbol) => symbol !== normalized);
    delete state.ui.comparisonSettings[normalized];
  },
  clearComparisonSymbols: (state: TechnicalAnalysisState) => {
    state.ui.comparisonSymbols = [];
    state.ui.comparisonSettings = {};
  },
  setComparisonSeriesSettings: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ symbol: string; settings: CompareSeriesSettings }>,
  ) => {
    const normalized = normalizeCompareSymbol(action.payload.symbol);
    if (!normalized || !state.ui.comparisonSymbols.includes(normalized)) return;
    const index = state.ui.comparisonSymbols.indexOf(normalized);
    state.ui.comparisonSettings[normalized] = normalizeCompareSeriesSettings(
      action.payload.settings,
      getCompareSeriesColor(index),
    );
  },
  resetComparisonSeriesSettings: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ symbol: string; color?: string }>,
  ) => {
    const normalized = normalizeCompareSymbol(action.payload.symbol);
    if (!normalized || !state.ui.comparisonSymbols.includes(normalized)) return;
    const index = state.ui.comparisonSymbols.indexOf(normalized);
    state.ui.comparisonSettings[normalized] = createDefaultCompareSeriesSettings(
      action.payload.color ?? getCompareSeriesColor(index),
    );
  },
  setMovingAverageTrendSignal: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ id: MovingAverageTrendSignalId; active: boolean }>,
  ) => {
    const signals = normalizeMovingAverageTrendSignals(state.ui.movingAverageTrendSignals);
    signals.active[action.payload.id] = action.payload.active;
    state.ui.movingAverageTrendSignals = signals;
  },
  setMovingAverageTrendSignals: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<Record<MovingAverageTrendSignalId, boolean>>>,
  ) => {
    const signals = normalizeMovingAverageTrendSignals(state.ui.movingAverageTrendSignals);
    Object.entries(action.payload).forEach(([id, active]) => {
      signals.active[id as MovingAverageTrendSignalId] = active === true;
    });
    state.ui.movingAverageTrendSignals = signals;
  },
  setMovingAverageTrendSignalSourceAverages: (
    state: TechnicalAnalysisState,
    action: PayloadAction<boolean>,
  ) => {
    const signals = normalizeMovingAverageTrendSignals(state.ui.movingAverageTrendSignals);
    signals.showSourceAverages = action.payload;
    state.ui.movingAverageTrendSignals = signals;
  },
  setPriceVsSmaMetric: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ id: PriceVsSmaMetricId; active: boolean }>,
  ) => {
    const metrics = normalizePriceVsSmaMetrics(state.ui.priceVsSmaMetrics);
    metrics.active[action.payload.id] = action.payload.active;
    state.ui.priceVsSmaMetrics = metrics;
  },
  setPriceVsSmaMetrics: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<Record<PriceVsSmaMetricId, boolean>>>,
  ) => {
    const metrics = normalizePriceVsSmaMetrics(state.ui.priceVsSmaMetrics);
    Object.entries(action.payload).forEach(([id, active]) => {
      metrics.active[id as PriceVsSmaMetricId] = active === true;
    });
    state.ui.priceVsSmaMetrics = metrics;
  },
  setPriceVsEmaMetric: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ id: PriceVsEmaMetricId; active: boolean }>,
  ) => {
    const metrics = normalizePriceVsEmaMetrics(state.ui.priceVsEmaMetrics);
    metrics.active[action.payload.id] = action.payload.active;
    state.ui.priceVsEmaMetrics = metrics;
  },
  setPriceVsEmaMetrics: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<Record<PriceVsEmaMetricId, boolean>>>,
  ) => {
    const metrics = normalizePriceVsEmaMetrics(state.ui.priceVsEmaMetrics);
    Object.entries(action.payload).forEach(([id, active]) => {
      metrics.active[id as PriceVsEmaMetricId] = active === true;
    });
    state.ui.priceVsEmaMetrics = metrics;
  },
  setModalOpen: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ modal: keyof UiState["modals"]; isOpen: boolean }>,
  ) => {
    setModalOpenFlag(
      state.ui.modals,
      action.payload.modal,
      action.payload.isOpen,
    );
  },
  closeAllModals: (state: TechnicalAnalysisState) => {
    closeAllModalFlags(state.ui.modals);
  },
};
