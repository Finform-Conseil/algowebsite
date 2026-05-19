// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/store/technicalAnalysisSlice.ts
// [TENOR 2026 FIX] SCAR-123: Default Indicators Cleanup. Purged default SMAs for TradingView parity.
// [TENOR 2026 FIX] Default Timeframe updated to "1D" for optimal FCP and UX.
// [TENOR 2026 SRE] SCAR-REDUX-MERGE: Eradicated Shallow Merge Data Loss.
// [TENOR 2026 SRE] SCAR-TS2322: Eradicated Spread Operator Type Errors with Explicit Assignments.
// [TENOR 2026 SRE] SCAR-TYPESYNC: Synchronized stochRsi with AdvancedIndicatorsState interface.
// [TENOR 2026 HDR] BOLLINGER BANDS UPGRADE: Added bollingerSettings, bbWidth, bbPercentB.
// ================================================================================

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  ChartState,
  AdvancedIndicatorsState,
  Alert,
  Order,
  IndicatorPeriods,
  ChartAppearance,
  UiState,
  TechnicalAnalysisState,
  CursorModeType,
  LiveSnapshot,
  BollingerSettings,
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartSyncKey,
} from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import {
  createDefaultMultiChartLayout,
  createPresetLayout,
  getLayoutDefinition,
  hasCollapsedLayoutSymbols,
  isDenseMultiChartLayout,
  MULTI_CHART_PRESETS,
  reconcileMultiChartLayout,
} from "../config/multiChartLayout";
import type { RootState } from "@/core/infrastructure/store";

const forcePrimaryLayoutChartActive = (layout: MultiChartLayoutState): MultiChartLayoutState => {
  const primaryChartId = layout.charts[0]?.chartId ?? layout.activeChartId;
  return {
    ...layout,
    activeChartId: primaryChartId,
    charts: layout.charts.map((chart, index) => ({ ...chart, isActive: index === 0 })),
  };
};

const applyPrimaryLayoutSymbol = (layout: MultiChartLayoutState, symbol: string): void => {
  const normalized = symbol.trim().toUpperCase();
  const primaryChartId = layout.charts[0]?.chartId;
  if (!normalized || !primaryChartId) return;

  layout.activeChartId = primaryChartId;
  layout.charts.forEach((chart, index) => {
    if (index === 0 || layout.sync.symbol) chart.symbol = normalized;
    chart.isActive = chart.chartId === primaryChartId;
  });
};

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
    ichimoku: false,
    // [TENOR 2026 SRE FIX] Synchronized with interface
    stochRsi: false,
    // [TENOR 2026 HDR] Bollinger Derived Metrics
    bbWidth: false,
    bbPercentB: false,
  },
  indicatorPeriods: {
    sma1: 5,
    sma2: 10,
    sma3: 20,
    rsiPeriod: 14,
  },
  // [TENOR 2026 HDR] Centralized Bollinger Config (TradingView Parity Defaults)
  bollingerSettings: {
    length: 20,
    source: "close",
    multiplier: 2.0,
    offset: 0,
    showUpper: true,
    showMiddle: true,
    showLower: true,
    showFill: true,
    upperColor: "#2962FF",
    middleColor: "#FF6D00",
    lowerColor: "#2962FF",
    fillColor: "#2196F3", // Base color, opacity handled separately
    fillOpacity: 0.05,
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
    comparisonSymbols: [],
    multiChartLayout: createDefaultMultiChartLayout("single", "BOAB"),
    searchMode: "replace",
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
    prefilledAlertPrice: undefined,
    prefilledAlertCondition: undefined,
  },
  alerts: [],
  orders: [],
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
      const normalized = action.payload.trim().toUpperCase();
      state.chartConfig.symbol = normalized || action.payload;
      applyPrimaryLayoutSymbol(state.ui.multiChartLayout, normalized);
    },
    setTimeframe: (state, action: PayloadAction<string>) => {
      state.chartConfig.timeframe = action.payload;
      const layout = state.ui.multiChartLayout;
      layout.charts.forEach((chart) => {
        if (layout.sync.interval || chart.chartId === layout.activeChartId) {
          chart.interval = action.payload;
        }
      });
    },
    setChartType: (state, action: PayloadAction<"candlestick" | "line">) => {
      state.chartConfig.chartType = action.payload;
    },
    toggleChartType: (state) => {
      state.chartConfig.chartType =
        state.chartConfig.chartType === "candlestick" ? "line" : "candlestick";
    },
    // [TENOR 2026 SRE FIX] Deep Merge & TS2322 Enforcement
    // Replaced shallow merge `{ ...state, ...payload }` with explicit property assignment
    // to prevent nested objects from being overwritten and to satisfy TypeScript's Partial<T> strictness.
    setChartConfig: (state, action: PayloadAction<Partial<ChartState>>) => {
      const { symbol, timeframe, chartType, indicators } = action.payload;
      if (symbol !== undefined) {
        const normalized = symbol.trim().toUpperCase();
        state.chartConfig.symbol = normalized || symbol;
        applyPrimaryLayoutSymbol(state.ui.multiChartLayout, normalized);
      }
      if (timeframe !== undefined) state.chartConfig.timeframe = timeframe;
      if (chartType !== undefined) state.chartConfig.chartType = chartType;

      if (indicators !== undefined) {
        if (indicators.sma !== undefined) state.chartConfig.indicators.sma = indicators.sma;
        if (indicators.ema !== undefined) state.chartConfig.indicators.ema = indicators.ema;
        if (indicators.volume !== undefined) state.chartConfig.indicators.volume = indicators.volume;
        if (indicators.activeSma !== undefined) state.chartConfig.indicators.activeSma = indicators.activeSma;
        if (indicators.activeEma !== undefined) state.chartConfig.indicators.activeEma = indicators.activeEma;
      }
    },

    // --- INDICATORS REDUCERS ---
    toggleAdvancedIndicator: (
      state,
      action: PayloadAction<keyof AdvancedIndicatorsState>
    ) => {
      state.advancedIndicators[action.payload] = !state.advancedIndicators[action.payload];
    },
    // [TENOR 2026 SRE FIX] Explicit assignment to satisfy TS2322
    setAdvancedIndicators: (
      state,
      action: PayloadAction<Partial<AdvancedIndicatorsState>>
    ) => {
      const p = action.payload;
      if (p.rsi !== undefined) state.advancedIndicators.rsi = p.rsi;
      if (p.macd !== undefined) state.advancedIndicators.macd = p.macd;
      if (p.bollinger !== undefined) state.advancedIndicators.bollinger = p.bollinger;
      if (p.stochastic !== undefined) state.advancedIndicators.stochastic = p.stochastic;
      if (p.atr !== undefined) state.advancedIndicators.atr = p.atr;
      if (p.cci !== undefined) state.advancedIndicators.cci = p.cci;
      if (p.williamsR !== undefined) state.advancedIndicators.williamsR = p.williamsR;
      if (p.roc !== undefined) state.advancedIndicators.roc = p.roc;
      if (p.obv !== undefined) state.advancedIndicators.obv = p.obv;
      if (p.ichimoku !== undefined) state.advancedIndicators.ichimoku = p.ichimoku;
      if (p.stochRsi !== undefined) state.advancedIndicators.stochRsi = p.stochRsi;
      if (p.bbWidth !== undefined) state.advancedIndicators.bbWidth = p.bbWidth;
      if (p.bbPercentB !== undefined) state.advancedIndicators.bbPercentB = p.bbPercentB;
    },
    // [TENOR 2026 SRE FIX] Explicit assignment to satisfy TS2322 (Index Signature)
    setIndicatorPeriods: (state, action: PayloadAction<Partial<IndicatorPeriods>>) => {
      const p = action.payload;
      if (p.sma1 !== undefined) state.indicatorPeriods.sma1 = p.sma1;
      if (p.sma2 !== undefined) state.indicatorPeriods.sma2 = p.sma2;
      if (p.sma3 !== undefined) state.indicatorPeriods.sma3 = p.sma3;
      if (p.rsiPeriod !== undefined) state.indicatorPeriods.rsiPeriod = p.rsiPeriod;
      
      // Handle dynamic keys from index signature safely
      for (const key in p) {
        if (Object.prototype.hasOwnProperty.call(p, key)) {
          const val = p[key];
          if (val !== undefined) {
            state.indicatorPeriods[key] = val;
          }
        }
      }
    },

    // [TENOR 2026 HDR] Bollinger Settings Reducer
    setBollingerSettings: (state, action: PayloadAction<Partial<BollingerSettings>>) => {
      const p = action.payload;
      if (p.length !== undefined) state.bollingerSettings.length = p.length;
      if (p.source !== undefined) state.bollingerSettings.source = p.source;
      if (p.multiplier !== undefined) state.bollingerSettings.multiplier = p.multiplier;
      if (p.offset !== undefined) state.bollingerSettings.offset = p.offset;
      if (p.showUpper !== undefined) state.bollingerSettings.showUpper = p.showUpper;
      if (p.showMiddle !== undefined) state.bollingerSettings.showMiddle = p.showMiddle;
      if (p.showLower !== undefined) state.bollingerSettings.showLower = p.showLower;
      if (p.showFill !== undefined) state.bollingerSettings.showFill = p.showFill;
      if (p.upperColor !== undefined) state.bollingerSettings.upperColor = p.upperColor;
      if (p.middleColor !== undefined) state.bollingerSettings.middleColor = p.middleColor;
      if (p.lowerColor !== undefined) state.bollingerSettings.lowerColor = p.lowerColor;
      if (p.fillColor !== undefined) state.bollingerSettings.fillColor = p.fillColor;
      if (p.fillOpacity !== undefined) state.bollingerSettings.fillOpacity = p.fillOpacity;
    },

    // [TENOR 2026 SRE FIX] Explicit assignment to satisfy TS2322
    setChartAppearance: (state, action: PayloadAction<Partial<ChartAppearance>>) => {
      const p = action.payload;
      if (p.showGrid !== undefined) state.chartAppearance.showGrid = p.showGrid;
      if (p.upColor !== undefined) state.chartAppearance.upColor = p.upColor;
      if (p.downColor !== undefined) state.chartAppearance.downColor = p.downColor;
      if (p.backgroundColor !== undefined) state.chartAppearance.backgroundColor = p.backgroundColor;
      if (p.showVolume !== undefined) state.chartAppearance.showVolume = p.showVolume;
    },
    resetChartAppearance: (state) => {
      state.chartAppearance = initialState.chartAppearance;
      state.indicatorPeriods = initialState.indicatorPeriods;
      state.bollingerSettings = initialState.bollingerSettings;
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
            ichimoku: false,
            stochRsi: false,
            bbWidth: false,
            bbPercentB: false,
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
            ichimoku: false,
            stochRsi: false,
            bbWidth: false,
            bbPercentB: false,
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
            ichimoku: false,
            stochRsi: false,
            bbWidth: false,
            bbPercentB: false,
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
            ichimoku: false,
            stochRsi: false,
            bbWidth: false,
            bbPercentB: false,
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
    setSearchMode: (state, action: PayloadAction<"replace" | "compare">) => {
      state.ui.searchMode = action.payload;
    },
    addComparisonSymbol: (state, action: PayloadAction<string>) => {
      const normalized = action.payload.trim().toUpperCase();
      if (!normalized) return;
      if (normalized === state.chartConfig.symbol.trim().toUpperCase()) return;
      if (state.ui.comparisonSymbols.includes(normalized)) return;
      if (state.ui.comparisonSymbols.length >= 5) return;
      
      state.ui.comparisonSymbols.push(normalized);
    },
    removeComparisonSymbol: (state, action: PayloadAction<string>) => {
      const normalized = action.payload.trim().toUpperCase();
      state.ui.comparisonSymbols = state.ui.comparisonSymbols.filter((s) => s !== normalized);
    },
    clearComparisonSymbols: (state) => {
      state.ui.comparisonSymbols = [];
    },
    setMultiChartLayout: (state, action: PayloadAction<MultiChartLayoutId>) => {
      const nextLayout = reconcileMultiChartLayout(
        state.ui.multiChartLayout,
        action.payload,
        state.chartConfig.symbol,
        state.ui.comparisonSymbols
      );
      state.ui.multiChartLayout = isDenseMultiChartLayout(action.payload)
        ? forcePrimaryLayoutChartActive({ ...nextLayout, sync: { ...nextLayout.sync, symbol: false, crosshair: false } })
        : { ...nextLayout, sync: { ...nextLayout.sync, crosshair: false } };
    },
    setMultiChartSync: (state, action: PayloadAction<{ key: MultiChartSyncKey; value: boolean }>) => {
      if (action.payload.key === "crosshair") {
        state.ui.multiChartLayout.sync.crosshair = false;
        return;
      }

      if (action.payload.key === "symbol" && action.payload.value) {
        const activeLayout = getLayoutDefinition(state.ui.multiChartLayout.layoutId);
        if (activeLayout.chartCount >= 8) return;
      }

      state.ui.multiChartLayout.sync[action.payload.key] = action.payload.value;

      // [TENOR 2026 HDR] RETROACTIVE SYMBOL & INTERVAL SYNC
      // Immediately synchronizes all layout cells when the respective sync setting is turned ON.
      if (action.payload.value) {
        const activeChart = state.ui.multiChartLayout.charts.find(
          (c) => c.chartId === state.ui.multiChartLayout.activeChartId
        );

        if (action.payload.key === "symbol") {
          const targetSymbol = activeChart ? activeChart.symbol : state.chartConfig.symbol;
          state.ui.multiChartLayout.charts.forEach((c) => {
            c.symbol = targetSymbol;
          });
        } else if (action.payload.key === "interval") {
          const targetInterval = activeChart ? activeChart.interval : state.chartConfig.timeframe;
          state.ui.multiChartLayout.charts.forEach((c) => {
            c.interval = targetInterval;
          });
        }
      }
    },
    setActiveLayoutChart: (state, action: PayloadAction<string>) => {
      const target = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === action.payload);
      if (!target) return;

      state.ui.multiChartLayout.activeChartId = target.chartId;
      state.ui.multiChartLayout.charts.forEach((chart) => {
        chart.isActive = chart.chartId === target.chartId;
      });
      state.chartConfig.symbol = target.symbol;
      state.chartConfig.timeframe = target.interval;
    },
    updateLayoutChart: (
      state,
      action: PayloadAction<{ chartId: string; symbol?: string; interval?: string }>
    ) => {
      const layout = state.ui.multiChartLayout;
      const normalizedSymbol = action.payload.symbol?.trim().toUpperCase();
      const target = layout.charts.find((chart) => chart.chartId === action.payload.chartId);
      if (!target) return;

      layout.charts.forEach((chart) => {
        const isTarget = chart.chartId === target.chartId;
        if (normalizedSymbol && (layout.sync.symbol || isTarget)) chart.symbol = normalizedSymbol;
        if (action.payload.interval && (layout.sync.interval || isTarget)) chart.interval = action.payload.interval;
      });

      if (target.chartId === layout.activeChartId) {
        if (normalizedSymbol) state.chartConfig.symbol = normalizedSymbol;
        if (action.payload.interval) state.chartConfig.timeframe = action.payload.interval;
      }
    },
    applyMultiChartPreset: (state, action: PayloadAction<string>) => {
      const preset = MULTI_CHART_PRESETS.find((entry) => entry.id === action.payload);
      if (!preset) return;
      state.ui.multiChartLayout = createPresetLayout(preset, state.chartConfig.symbol);
      const active = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === state.ui.multiChartLayout.activeChartId);
      if (active) {
        state.chartConfig.symbol = active.symbol;
        state.chartConfig.timeframe = active.interval;
      }
    },
    hydrateMultiChartLayout: (state, action: PayloadAction<MultiChartLayoutState>) => {
      const isDenseLayout = isDenseMultiChartLayout(action.payload.layoutId);
      const primarySymbol = isDenseLayout
        ? state.chartConfig.symbol
        : action.payload.charts[0]?.symbol || state.chartConfig.symbol;
      const hydrated = reconcileMultiChartLayout(
        action.payload,
        action.payload.layoutId,
        primarySymbol,
        state.ui.comparisonSymbols
      );
      const normalizedHydrated = isDenseLayout ? forcePrimaryLayoutChartActive(hydrated) : hydrated;
      state.ui.multiChartLayout = {
        ...normalizedHydrated,
        sync: {
          ...state.ui.multiChartLayout.sync,
          ...action.payload.sync,
          crosshair: false,
          ...(isDenseLayout || hasCollapsedLayoutSymbols(action.payload) ? { symbol: false } : {}),
        },
      };
    },
    resetMultiChartLayout: (state) => {
      state.ui.multiChartLayout = createDefaultMultiChartLayout("single", state.chartConfig.symbol);
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
        state.alerts[index] = action.payload; // Safe mutation via Immer
      }
    },
    deactivateAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a: Alert) => a.id === action.payload);
      if (alert) {
        alert.active = false;
      }
    },
    setPrefilledAlert: (
      state,
      action: PayloadAction<{ price: number; condition: "GREATER_THAN" | "LESS_THAN" } | null>
    ) => {
      if (action.payload === null) {
        state.ui.prefilledAlertPrice = undefined;
        state.ui.prefilledAlertCondition = undefined;
      } else {
        state.ui.prefilledAlertPrice = action.payload.price;
        state.ui.prefilledAlertCondition = action.payload.condition;
      }
    },

    // --- ORDERS REDUCERS ---
    addOrder: (state, action: PayloadAction<Order>) => {
      state.orders.push(action.payload);
    },
    cancelOrder: (state, action: PayloadAction<string>) => {
      const order = state.orders.find((o) => o.id === action.payload);
      if (order) {
        order.status = "cancelled";
      }
    },
    updateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.orders.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
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
  setMultiChartLayout,
  setMultiChartSync,
  setActiveLayoutChart,
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
} = technicalAnalysisSlice.actions;

// ============================================================================
// SELECTORS (For easy access in components)
// ============================================================================

export const selectTA = (state: RootState): TechnicalAnalysisState => state.technicalAnalysis;
export const selectChartConfig = (state: RootState) => state.technicalAnalysis.chartConfig;
export const selectAdvancedIndicators = (state: RootState) => state.technicalAnalysis.advancedIndicators;
export const selectIndicatorPeriods = (state: RootState): IndicatorPeriods => state.technicalAnalysis.indicatorPeriods;
export const selectBollingerSettings = (state: RootState): BollingerSettings => state.technicalAnalysis.bollingerSettings;
export const selectChartAppearance = (state: RootState) => state.technicalAnalysis.chartAppearance;
export const selectUiState = (state: RootState): UiState => state.technicalAnalysis.ui;
export const selectModals = (state: RootState) => state.technicalAnalysis.ui.modals;
export const selectAlerts = (state: RootState) => state.technicalAnalysis.alerts;
export const selectOrders = (state: RootState) => state.technicalAnalysis.orders;
export const selectDataMode = (state: RootState): "mock" | "real" => state.technicalAnalysis.ui.dataMode || "real";
export const selectMarketData = (state: RootState) => state.technicalAnalysis.marketData;
export const selectMarketSnapshots = (state: RootState) => state.technicalAnalysis.marketSnapshots;

// ============================================================================
// REDUCER EXPORT
// ============================================================================

export default technicalAnalysisSlice.reducer;

// --- EOF ---
