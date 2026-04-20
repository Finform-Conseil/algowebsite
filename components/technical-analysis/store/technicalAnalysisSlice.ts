// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/store/technicalAnalysisSlice.ts
// [TENOR 2026 FIX] SCAR-123: Default Indicators Cleanup. Purged default SMAs for TradingView parity.
// [TENOR 2026 FIX] Default Timeframe updated to "1D" for optimal FCP and UX.
// ================================================================================

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ChartState,
  AdvancedIndicatorsState,
  Alert,
  IndicatorPeriods,
  ChartAppearance,
  UiState,
  TechnicalAnalysisState,
  CursorModeType,
  LiveSnapshot,
} from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import type { RootState } from "@/core/infrastructure/store";

// ============================================================================
// INITIAL STATE
// ============================================================================
const initialState: TechnicalAnalysisState = {
  chartConfig: {
    symbol: "BOAB", // Default, will be synced with TickerSelectorContext
    timeframe: "1D", // [TENOR 2026 FIX] Changed from "1m" to "1D" for optimal initial load
    chartType: "candlestick",
    indicators: {
      sma: true,
      ema: false,
      volume: true,
      // [TENOR 2026 FIX] Purged default arrays to ensure a clean, professional chart on first load.
      activeSma: [],
      activeEma: [],
    },
  },
  advancedIndicators: {
    rsi: false,
    macd: false,
    bollinger: false,
    stochastic: false,
    atr: false,
    cci: false,
    // [TENOR 2026 FEAT] New indicators
    williamsR: false,
    roc: false,
    obv: false,
  },
  indicatorPeriods: {
    sma1: 5,
    sma2: 10,
    sma3: 20,
    rsiPeriod: 14,
  },
  chartAppearance: {
    showGrid: true,
    upColor: "#00da3c",
    downColor: "#ec0000",
    backgroundColor: "transparent",
    showVolume: true,
  },
  ui: {
    isZenMode: false,
    isAnonyme: false,
    selectedPseudo: "Trader_700",
    cursorMode: "cross",
    selectedTimeRange: "Tout",
    isPublishing: false,
    isCapturing: false,
    dataMode: "real", // [TENOR 2026] Default to Real (BRVM) as requested by user
    modals: {
      search: false,
      indicators: false,
      replay: false,
      templates: false,
      settings: false,
      options: false,
      datePicker: false,
      loadAnalysis: false,
      alerts: false,
      drawingSettings: false,
    },
    replay: {
      isActive: false,
      isPaused: false,
      speed: 1000,
    },
    isLockedAll: false,
    areDrawingsHidden: false,
  },
  alerts: [],
  marketData: {}, // [TENOR 2026] Cache initialized
  marketSnapshots: {}, // [TENOR 2026] Snapshots cache initialized
};

// ============================================================================
// SLICE DEFINITION
// ============================================================================
export const technicalAnalysisSlice = createSlice({
  name: "technicalAnalysis",
  initialState,
  reducers: {
    // --- CHART CONFIG REDUCERS ---
    setSymbol: (state, action: PayloadAction<string>) => {
      state.chartConfig.symbol = action.payload;
    },
    setTimeframe: (state, action: PayloadAction<string>) => {
      state.chartConfig.timeframe = action.payload;
    },
    setChartType: (state, action: PayloadAction<"candlestick" | "line">) => {
      state.chartConfig.chartType = action.payload;
    },
    toggleChartType: (state) => {
      state.chartConfig.chartType =
        state.chartConfig.chartType === "candlestick" ? "line" : "candlestick";
    },
    setChartConfig: (state, action: PayloadAction<Partial<ChartState>>) => {
      state.chartConfig = { ...state.chartConfig, ...action.payload };
    },

    // --- INDICATORS REDUCERS ---
    toggleAdvancedIndicator: (
      state,
      action: PayloadAction<keyof AdvancedIndicatorsState>
    ) => {
      state.advancedIndicators[action.payload] =
        !state.advancedIndicators[action.payload];
    },
    setAdvancedIndicators: (
      state,
      action: PayloadAction<AdvancedIndicatorsState>
    ) => {
      state.advancedIndicators = action.payload;
    },
    setIndicatorPeriods: (state, action: PayloadAction<IndicatorPeriods>) => {
      state.indicatorPeriods = action.payload;
    },
    setChartAppearance: (state, action: PayloadAction<ChartAppearance>) => {
      state.chartAppearance = action.payload;
    },
    resetChartAppearance: (state) => {
      state.chartAppearance = initialState.chartAppearance;
      state.indicatorPeriods = initialState.indicatorPeriods;
    },

    // --- TEMPLATES REDUCER ---
    applyTemplate: (
      state,
      action: PayloadAction<"day" | "swing" | "scalping" | "long">
    ) => {
      switch (action.payload) {
        case "day":
          state.chartConfig.indicators = {
            ...state.chartConfig.indicators,
            sma: true,
            ema: false,
            volume: false,
            activeSma: [5, 10],
            activeEma: [],
          };
          state.advancedIndicators = {
            rsi: true,
            macd: true,
            bollinger: false,
            stochastic: false,
            atr: false,
            cci: false,
            williamsR: false,
            roc: true,
            obv: false,
          };
          break;
        case "swing":
          state.chartConfig.indicators = {
            ...state.chartConfig.indicators,
            sma: true,
            ema: false,
            volume: true,
            activeSma: [20, 50],
            activeEma: [],
          };
          state.advancedIndicators = {
            rsi: false,
            macd: false,
            bollinger: true,
            stochastic: true,
            atr: false,
            cci: false,
            williamsR: true,
            roc: false,
            obv: true,
          };
          break;
        case "scalping":
          state.chartConfig.indicators = {
            ...state.chartConfig.indicators,
            sma: false,
            ema: true,
            volume: true,
            activeSma: [],
            activeEma: [5, 10],
          };
          state.advancedIndicators = {
            rsi: false,
            macd: false,
            bollinger: false,
            stochastic: false,
            atr: true,
            cci: false,
            williamsR: false,
            roc: true,
            obv: false,
          };
          break;
        case "long":
          state.chartConfig.indicators = {
            ...state.chartConfig.indicators,
            sma: true,
            ema: false,
            volume: true,
            activeSma: [50, 200],
            activeEma: [],
          };
          state.advancedIndicators = {
            rsi: false,
            macd: false,
            bollinger: false,
            stochastic: false,
            atr: false,
            cci: false,
            williamsR: false,
            roc: false,
            obv: true,
          };
          break;
      }
      state.ui.modals.templates = false;
    },

    // --- UI REDUCERS ---
    setZenMode: (state, action: PayloadAction<boolean>) => {
      state.ui.isZenMode = action.payload;
    },
    toggleZenMode: (state) => {
      state.ui.isZenMode = !state.ui.isZenMode;
    },
    setAnonyme: (state, action: PayloadAction<boolean>) => {
      state.ui.isAnonyme = action.payload;
    },
    setSelectedPseudo: (state, action: PayloadAction<string>) => {
      state.ui.selectedPseudo = action.payload;
    },
    setCursorMode: (state, action: PayloadAction<CursorModeType>) => {
      state.ui.cursorMode = action.payload;
    },
    setTimeRange: (state, action: PayloadAction<string>) => {
      state.ui.selectedTimeRange = action.payload;
    },
    setPublishing: (state, action: PayloadAction<boolean>) => {
      state.ui.isPublishing = action.payload;
    },
    setCapturing: (state, action: PayloadAction<boolean>) => {
      state.ui.isCapturing = action.payload;
    },
    setDataMode: (state, action: PayloadAction<"mock" | "real">) => {
      state.ui.dataMode = action.payload;
    },

    // --- MODALS REDUCERS ---
    setModalOpen: (
      state,
      action: PayloadAction<{ modal: keyof UiState["modals"]; isOpen: boolean }>
    ) => {
      state.ui.modals[action.payload.modal] = action.payload.isOpen;
    },
    closeAllModals: (state) => {
      (Object.keys(state.ui.modals) as Array<keyof UiState["modals"]>).forEach(
        (key) => {
          state.ui.modals[key] = false;
        }
      );
    },

    // --- REPLAY REDUCERS ---
    setReplayActive: (state, action: PayloadAction<boolean>) => {
      state.ui.replay.isActive = action.payload;
    },
    setReplayPaused: (state, action: PayloadAction<boolean>) => {
      state.ui.replay.isPaused = action.payload;
    },
    setReplaySpeed: (state, action: PayloadAction<number>) => {
      state.ui.replay.speed = action.payload;
    },
    setLockedAll: (state, action: PayloadAction<boolean>) => {
      state.ui.isLockedAll = action.payload;
    },
    toggleLockedAll: (state) => {
      state.ui.isLockedAll = !state.ui.isLockedAll;
    },
    setAreDrawingsHidden: (state, action: PayloadAction<boolean>) => {
      state.ui.areDrawingsHidden = action.payload;
    },
    toggleAreDrawingsHidden: (state) => {
      state.ui.areDrawingsHidden = !state.ui.areDrawingsHidden;
    },

    // --- ALERTS REDUCERS ---
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.push(action.payload);
    },
    removeAlert: (state, action: PayloadAction<string>) => {
      state.alerts = state.alerts.filter((a: Alert) => a.id !== action.payload);
    },
    updateAlert: (state, action: PayloadAction<Alert>) => {
      const index = state.alerts.findIndex((a: Alert) => a.id === action.payload.id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    },
    deactivateAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a: Alert) => a.id === action.payload);
      if (alert) {
        alert.active = false;
      }
    },

    // --- MARKET DATA REDUCERS ---
    updateMarketData: (state, action: PayloadAction<{ symbol: string; data: ChartDataPoint[] }>) => {
      state.marketData[action.payload.symbol] = action.payload.data;
    },
    updateMarketSnapshot: (state, action: PayloadAction<{ symbol: string; snapshot: LiveSnapshot }>) => {
      state.marketSnapshots[action.payload.symbol] = action.payload.snapshot;
    },
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
  updateMarketData,
  updateMarketSnapshot,
} = technicalAnalysisSlice.actions;

// ============================================================================
// SELECTORS (For easy access in components)
// ============================================================================
export const selectTA = (state: RootState): TechnicalAnalysisState => state.technicalAnalysis;
export const selectChartConfig = (state: RootState) => state.technicalAnalysis.chartConfig;
export const selectAdvancedIndicators = (state: RootState) => state.technicalAnalysis.advancedIndicators;
export const selectIndicatorPeriods = (state: RootState): IndicatorPeriods => state.technicalAnalysis.indicatorPeriods;
export const selectChartAppearance = (state: RootState) => state.technicalAnalysis.chartAppearance;
export const selectUiState = (state: RootState): UiState => state.technicalAnalysis.ui;
export const selectModals = (state: RootState) => state.technicalAnalysis.ui.modals;
export const selectAlerts = (state: RootState) => state.technicalAnalysis.alerts;
export const selectDataMode = (state: RootState): "mock" | "real" => state.technicalAnalysis.ui.dataMode || "real";
export const selectMarketData = (state: RootState) => state.technicalAnalysis.marketData;
export const selectMarketSnapshots = (state: RootState) => state.technicalAnalysis.marketSnapshots;

// ============================================================================
// REDUCER EXPORT
// ============================================================================
export default technicalAnalysisSlice.reducer;