// ================================================================================
// Technical Analysis Redux slice.
// Public entrypoint for reducer and actions.
// ================================================================================

import { createSlice } from "@reduxjs/toolkit";
import { initialState } from "./initialState";
import { alertOrderReducers } from "./reducers/alertOrderReducers";
import { chartConfigReducers } from "./reducers/chartConfigReducers";
import { indicatorReducers } from "./reducers/indicatorReducers";
import { marketDataReducers } from "./reducers/marketDataReducers";
import { multiChartReducers } from "./reducers/multiChartReducers";
import { replayReducers } from "./reducers/replayReducers";
import { uiReducers } from "./reducers/uiReducers";

// ============================================================================
// SLICE DEFINITION
// ============================================================================

export const technicalAnalysisSlice = createSlice({
  name: "technicalAnalysis",
  initialState,
  reducers: {
    ...chartConfigReducers,
    ...indicatorReducers,
    ...uiReducers,
    ...multiChartReducers,
    ...replayReducers,
    ...alertOrderReducers,
    ...marketDataReducers,
  },
});

// ============================================================================
// ACTIONS EXPORT
// ============================================================================

export const {
  setSymbol,
  setTimeframe,
  setChartType,
  toggleChartType,
  setChartConfig,
  toggleAdvancedIndicator,
  setAdvancedIndicators,
  setIndicatorPeriods,
  setBollingerSettings,
  setChartAppearance,
  resetChartAppearance,
  applyTemplate,
  setZenMode,
  toggleZenMode,
  setAnonyme,
  setSelectedPseudo,
  setCursorMode,
  setTimeRange,
  setPublishing,
  setCapturing,
  setDataMode,
  setSearchMode,
  addComparisonSymbol,
  removeComparisonSymbol,
  clearComparisonSymbols,
  setComparisonSeriesSettings,
  resetComparisonSeriesSettings,
  setMovingAverageTrendSignal,
  setMovingAverageTrendSignals,
  setMovingAverageTrendSignalSourceAverages,
  setPriceVsSmaMetric,
  setPriceVsSmaMetrics,
  setPriceVsEmaMetric,
  setPriceVsEmaMetrics,
  setMultiChartLayout,
  setMultiChartSync,
  setActiveLayoutChart,
  setEditChartTarget,
  updateLayoutChart,
  applyMultiChartPreset,
  hydrateMultiChartLayout,
  resetMultiChartLayout,
  setModalOpen,
  closeAllModals,
  setReplayActive,
  setReplayPaused,
  setReplaySpeed,
  setLockedAll,
  toggleLockedAll,
  setAreDrawingsHidden,
  toggleAreDrawingsHidden,
  addAlert,
  removeAlert,
  updateAlert,
  deactivateAlert,
  setPrefilledAlert,
  addOrder,
  cancelOrder,
  updateOrder,
  updateMarketData,
  updateMarketSnapshot,
  setPineChartOverlay,
  clearPineChartOverlay,
} = technicalAnalysisSlice.actions;


// ============================================================================
// REDUCER EXPORT
// ============================================================================

export default technicalAnalysisSlice.reducer;

// --- EOF ---
