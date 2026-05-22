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
  MovingAverageTrendSignalId,
  PriceVsEmaMetricId,
  PriceVsSmaMetricId,
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartSyncKey,
} from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { normalizeChartType, type AnyChartType } from "../lib/chart-types";
import {
  createDefaultMultiChartLayout,
  createPresetLayout,
  getLayoutDefinition,
  hasCollapsedLayoutSymbols,
  isDenseMultiChartLayout,
  MULTI_CHART_PRESETS,
  reconcileMultiChartLayout,
  resolveSectorCompareSymbols,
} from "../config/multiChartLayout";
import {
  createDefaultCompareSeriesSettings,
  getCompareSeriesColor,
  normalizeCompareSeriesSettings,
  normalizeCompareSymbol,
  type CompareSeriesSettings,
} from "../config/compareSeries";
import {
  createDefaultMovingAverageTrendSignals,
  normalizeMovingAverageTrendSignals,
} from "../config/movingAverageSeries";
import {
  createDefaultPriceVsSmaMetrics,
  normalizePriceVsSmaMetrics,
} from "../config/priceVsSmaMetrics";
import {
  createDefaultPriceVsEmaMetrics,
  normalizePriceVsEmaMetrics,
} from "../config/priceVsEmaMetrics";
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

  // [TENOR 2026] Sector Compare Dynamic Real-time Recalculation
  // Identifie si l'utilisateur est actuellement sur le preset de comparaison secteur
  const isSectorPreset = layout.name === "Comparaison secteur" || (layout.layoutId === "four_grid" && layout.charts.some(c => c.symbol === "BRVMC"));
  let sectorSymbols: string[] = [];
  if (isSectorPreset) {
    sectorSymbols = resolveSectorCompareSymbols(normalized);
  }

  layout.charts.forEach((chart, index) => {
    if (index === 0 || layout.sync.symbol) {
      chart.symbol = normalized;
    } else if (isSectorPreset && sectorSymbols[index]) {
      chart.symbol = sectorSymbols[index];
    }
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
    chartType: "candles",
    indicators: {
      sma: true,
      ema: false,
      volume: true,
      // [TENOR 2026 FIX] Purged default arrays to ensure a clean, professional chart on first load.
      activeSma: [],
      activeEma: [],
      activeWma: [],
      activeDema: [],
      activeTema: [],
      activeHma: [],
      activeZlema: [],
      activeAlma: [],
      activeSmma: [],
      activeKama: [],
      activeVwma: [],
    },
  },
  advancedIndicators: {
    rsi: false,
    macd: false,
    bollinger: false,
    stochastic: false,
    atr: false,
    cci: false,
    cci14: false,
    cci20: false,
    mfi14: false,
    // [TENOR 2026 FEAT] New indicators
    williamsR: false,
    williamsR14: false,
    roc: false,
    roc10: false,
    roc20: false,
    momentum10: false,
    momentum20: false,
    cmo14: false,
    dymi: false,
    ultimateOsc: false,
    dpo20: false,
    tsi: false,
    awesomeOsc: false,
    acOsc: false,
    rvi: false,
    fisherTransform: false,
    elderBullBear: false,
    coppock: false,
    ppo: false,
    apo: false,
    parabolicSar: false,
    adx: false,
    aroon: false,
    aroonOsc: false,
    supertrend: false,
    vortex: false,
    trix: false,
    stc: false,
    massIndex: false,
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
    volumeColorMode: "candle-body",
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
    comparisonSettings: {},
    movingAverageTrendSignals: createDefaultMovingAverageTrendSignals(),
    priceVsSmaMetrics: createDefaultPriceVsSmaMetrics(),
    priceVsEmaMetrics: createDefaultPriceVsEmaMetrics(),
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
    setChartType: (state, action: PayloadAction<AnyChartType>) => {
      state.chartConfig.chartType = normalizeChartType(action.payload);
    },
    toggleChartType: (state) => {
      state.chartConfig.chartType =
        normalizeChartType(state.chartConfig.chartType) === "line" ? "candles" : "line";
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
      if (chartType !== undefined) state.chartConfig.chartType = normalizeChartType(chartType);

      if (indicators !== undefined) {
        if (indicators.sma !== undefined) state.chartConfig.indicators.sma = indicators.sma;
        if (indicators.ema !== undefined) state.chartConfig.indicators.ema = indicators.ema;
        if (indicators.volume !== undefined) state.chartConfig.indicators.volume = indicators.volume;
        if (indicators.activeSma !== undefined) state.chartConfig.indicators.activeSma = indicators.activeSma;
        if (indicators.activeEma !== undefined) state.chartConfig.indicators.activeEma = indicators.activeEma;
        if (indicators.activeWma !== undefined) state.chartConfig.indicators.activeWma = indicators.activeWma;
        if (indicators.activeDema !== undefined) state.chartConfig.indicators.activeDema = indicators.activeDema;
        if (indicators.activeTema !== undefined) state.chartConfig.indicators.activeTema = indicators.activeTema;
        if (indicators.activeHma !== undefined) state.chartConfig.indicators.activeHma = indicators.activeHma;
        if (indicators.activeZlema !== undefined) state.chartConfig.indicators.activeZlema = indicators.activeZlema;
        if (indicators.activeAlma !== undefined) state.chartConfig.indicators.activeAlma = indicators.activeAlma;
        if (indicators.activeSmma !== undefined) state.chartConfig.indicators.activeSmma = indicators.activeSmma;
        if (indicators.activeKama !== undefined) state.chartConfig.indicators.activeKama = indicators.activeKama;
        if (indicators.activeVwma !== undefined) state.chartConfig.indicators.activeVwma = indicators.activeVwma;
      }
    },

    // --- INDICATORS REDUCERS ---
    toggleAdvancedIndicator: (
      state,
      action: PayloadAction<keyof AdvancedIndicatorsState>
    ) => {
      const key = action.payload;
      state.advancedIndicators[key] = !state.advancedIndicators[key];
      if (key === "cci20" && state.advancedIndicators.cci20) state.advancedIndicators.cci = false;
      if (key === "cci" && state.advancedIndicators.cci) state.advancedIndicators.cci20 = false;
      if (key === "williamsR14" && state.advancedIndicators.williamsR14) state.advancedIndicators.williamsR = false;
      if (key === "williamsR" && state.advancedIndicators.williamsR) state.advancedIndicators.williamsR14 = false;
      if (key === "roc10" && state.advancedIndicators.roc10) state.advancedIndicators.roc = false;
      if (key === "roc" && state.advancedIndicators.roc) state.advancedIndicators.roc10 = false;
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
      if (p.cci14 !== undefined) state.advancedIndicators.cci14 = p.cci14;
      if (p.cci20 !== undefined) state.advancedIndicators.cci20 = p.cci20;
      if (p.mfi14 !== undefined) state.advancedIndicators.mfi14 = p.mfi14;
      if (p.cci) state.advancedIndicators.cci20 = false;
      if (p.cci20) state.advancedIndicators.cci = false;
      if (p.williamsR !== undefined) state.advancedIndicators.williamsR = p.williamsR;
      if (p.williamsR14 !== undefined) state.advancedIndicators.williamsR14 = p.williamsR14;
      if (p.williamsR) state.advancedIndicators.williamsR14 = false;
      if (p.williamsR14) state.advancedIndicators.williamsR = false;
      if (p.roc !== undefined) state.advancedIndicators.roc = p.roc;
      if (p.roc10 !== undefined) state.advancedIndicators.roc10 = p.roc10;
      if (p.roc20 !== undefined) state.advancedIndicators.roc20 = p.roc20;
      if (p.roc) state.advancedIndicators.roc10 = false;
      if (p.roc10) state.advancedIndicators.roc = false;
      if (p.momentum10 !== undefined) state.advancedIndicators.momentum10 = p.momentum10;
      if (p.momentum20 !== undefined) state.advancedIndicators.momentum20 = p.momentum20;
      if (p.cmo14 !== undefined) state.advancedIndicators.cmo14 = p.cmo14;
      if (p.dymi !== undefined) state.advancedIndicators.dymi = p.dymi;
      if (p.ultimateOsc !== undefined) state.advancedIndicators.ultimateOsc = p.ultimateOsc;
      if (p.dpo20 !== undefined) state.advancedIndicators.dpo20 = p.dpo20;
      if (p.tsi !== undefined) state.advancedIndicators.tsi = p.tsi;
      if (p.awesomeOsc !== undefined) state.advancedIndicators.awesomeOsc = p.awesomeOsc;
      if (p.acOsc !== undefined) state.advancedIndicators.acOsc = p.acOsc;
      if (p.rvi !== undefined) state.advancedIndicators.rvi = p.rvi;
      if (p.fisherTransform !== undefined) state.advancedIndicators.fisherTransform = p.fisherTransform;
      if (p.elderBullBear !== undefined) state.advancedIndicators.elderBullBear = p.elderBullBear;
      if (p.coppock !== undefined) state.advancedIndicators.coppock = p.coppock;
      if (p.ppo !== undefined) state.advancedIndicators.ppo = p.ppo;
      if (p.apo !== undefined) state.advancedIndicators.apo = p.apo;
      if (p.parabolicSar !== undefined) state.advancedIndicators.parabolicSar = p.parabolicSar;
      if (p.adx !== undefined) state.advancedIndicators.adx = p.adx;
      if (p.aroon !== undefined) state.advancedIndicators.aroon = p.aroon;
      if (p.aroonOsc !== undefined) state.advancedIndicators.aroonOsc = p.aroonOsc;
      if (p.supertrend !== undefined) state.advancedIndicators.supertrend = p.supertrend;
      if (p.vortex !== undefined) state.advancedIndicators.vortex = p.vortex;
      if (p.trix !== undefined) state.advancedIndicators.trix = p.trix;
      if (p.stc !== undefined) state.advancedIndicators.stc = p.stc;
      if (p.massIndex !== undefined) state.advancedIndicators.massIndex = p.massIndex;
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
      if (p.volumeColorMode !== undefined) state.chartAppearance.volumeColorMode = p.volumeColorMode;
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
            activeWma: [],
            activeDema: [],
            activeTema: [],
            activeHma: [],
            activeZlema: [],
            activeAlma: [],
            activeSmma: [],
            activeKama: [],
            activeVwma: [],
          };
          state.advancedIndicators = {
            rsi: true,
            macd: true,
            bollinger: false,
            stochastic: false,
            atr: false,
            cci: false,
            cci14: false,
            cci20: false,
            mfi14: false,
            williamsR: false,
            williamsR14: false,
            roc: false,
            roc10: true,
            roc20: false,
            momentum10: false,
            momentum20: false,
            cmo14: false,
            dymi: false,
            ultimateOsc: false,
            dpo20: false,
            tsi: false,
            awesomeOsc: false,
            acOsc: false,
            rvi: false,
            fisherTransform: false,
            elderBullBear: false,
            coppock: false,
            ppo: false,
            apo: false,
            parabolicSar: false,
            adx: false,
            aroon: false,
            aroonOsc: false,
            supertrend: false,
            vortex: false,
            trix: false,
            stc: false,
            massIndex: false,
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
            activeWma: [],
            activeDema: [],
            activeTema: [],
            activeHma: [],
            activeZlema: [],
            activeAlma: [],
            activeSmma: [],
            activeKama: [],
            activeVwma: [],
          };
          state.advancedIndicators = {
            rsi: false,
            macd: false,
            bollinger: true,
            stochastic: true,
            atr: false,
            cci: false,
            cci14: false,
            cci20: false,
            mfi14: false,
            williamsR: false,
            williamsR14: true,
            roc: false,
            roc10: false,
            roc20: false,
            momentum10: false,
            momentum20: false,
            cmo14: false,
            dymi: false,
            ultimateOsc: false,
            dpo20: false,
            tsi: false,
            awesomeOsc: false,
            acOsc: false,
            rvi: false,
            fisherTransform: false,
            elderBullBear: false,
            coppock: false,
            ppo: false,
            apo: false,
            parabolicSar: false,
            adx: false,
            aroon: false,
            aroonOsc: false,
            supertrend: false,
            vortex: false,
            trix: false,
            stc: false,
            massIndex: false,
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
            activeWma: [],
            activeDema: [],
            activeTema: [],
            activeHma: [],
            activeZlema: [],
            activeAlma: [],
            activeSmma: [],
            activeKama: [],
            activeVwma: [],
          };
          state.advancedIndicators = {
            rsi: false,
            macd: false,
            bollinger: false,
            stochastic: false,
            atr: true,
            cci: false,
            cci14: false,
            cci20: false,
            mfi14: false,
            williamsR: false,
            williamsR14: false,
            roc: false,
            roc10: true,
            roc20: false,
            momentum10: false,
            momentum20: false,
            cmo14: false,
            dymi: false,
            ultimateOsc: false,
            dpo20: false,
            tsi: false,
            awesomeOsc: false,
            acOsc: false,
            rvi: false,
            fisherTransform: false,
            elderBullBear: false,
            coppock: false,
            ppo: false,
            apo: false,
            parabolicSar: false,
            adx: false,
            aroon: false,
            aroonOsc: false,
            supertrend: false,
            vortex: false,
            trix: false,
            stc: false,
            massIndex: false,
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
            activeWma: [],
            activeDema: [],
            activeTema: [],
            activeHma: [],
            activeZlema: [],
            activeAlma: [],
            activeSmma: [],
            activeKama: [],
            activeVwma: [],
          };
          state.advancedIndicators = {
            rsi: false,
            macd: false,
            bollinger: false,
            stochastic: false,
            atr: false,
            cci: false,
            cci14: false,
            cci20: false,
            mfi14: false,
            williamsR: false,
            williamsR14: false,
            roc: false,
            roc10: false,
            roc20: false,
            momentum10: false,
            momentum20: false,
            cmo14: false,
            dymi: false,
            ultimateOsc: false,
            dpo20: false,
            tsi: false,
            awesomeOsc: false,
            acOsc: false,
            rvi: false,
            fisherTransform: false,
            elderBullBear: false,
            coppock: false,
            ppo: false,
            apo: false,
            parabolicSar: false,
            adx: false,
            aroon: false,
            aroonOsc: false,
            supertrend: false,
            vortex: false,
            trix: false,
            stc: false,
            massIndex: false,
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
      const normalized = normalizeCompareSymbol(action.payload);
      if (!normalized) return;
      if (normalized === state.chartConfig.symbol.trim().toUpperCase()) return;
      if (state.ui.comparisonSymbols.includes(normalized)) return;
      if (state.ui.comparisonSymbols.length >= 5) return;
      
      state.ui.comparisonSymbols.push(normalized);
      state.ui.comparisonSettings[normalized] = createDefaultCompareSeriesSettings(
        getCompareSeriesColor(state.ui.comparisonSymbols.length - 1)
      );
    },
    removeComparisonSymbol: (state, action: PayloadAction<string>) => {
      const normalized = normalizeCompareSymbol(action.payload);
      state.ui.comparisonSymbols = state.ui.comparisonSymbols.filter((s) => s !== normalized);
      delete state.ui.comparisonSettings[normalized];
    },
    clearComparisonSymbols: (state) => {
      state.ui.comparisonSymbols = [];
      state.ui.comparisonSettings = {};
    },
    setComparisonSeriesSettings: (
      state,
      action: PayloadAction<{ symbol: string; settings: CompareSeriesSettings }>
    ) => {
      const normalized = normalizeCompareSymbol(action.payload.symbol);
      if (!normalized || !state.ui.comparisonSymbols.includes(normalized)) return;
      const index = state.ui.comparisonSymbols.indexOf(normalized);
      state.ui.comparisonSettings[normalized] = normalizeCompareSeriesSettings(
        action.payload.settings,
        getCompareSeriesColor(index)
      );
    },
    resetComparisonSeriesSettings: (state, action: PayloadAction<{ symbol: string; color?: string }>) => {
      const normalized = normalizeCompareSymbol(action.payload.symbol);
      if (!normalized || !state.ui.comparisonSymbols.includes(normalized)) return;
      const index = state.ui.comparisonSymbols.indexOf(normalized);
      state.ui.comparisonSettings[normalized] = createDefaultCompareSeriesSettings(
        action.payload.color ?? getCompareSeriesColor(index)
      );
    },
    setMovingAverageTrendSignal: (
      state,
      action: PayloadAction<{ id: MovingAverageTrendSignalId; active: boolean }>
    ) => {
      const signals = normalizeMovingAverageTrendSignals(state.ui.movingAverageTrendSignals);
      signals.active[action.payload.id] = action.payload.active;
      state.ui.movingAverageTrendSignals = signals;
    },
    setMovingAverageTrendSignals: (
      state,
      action: PayloadAction<Partial<Record<MovingAverageTrendSignalId, boolean>>>
    ) => {
      const signals = normalizeMovingAverageTrendSignals(state.ui.movingAverageTrendSignals);
      Object.entries(action.payload).forEach(([id, active]) => {
        signals.active[id as MovingAverageTrendSignalId] = active === true;
      });
      state.ui.movingAverageTrendSignals = signals;
    },
    setMovingAverageTrendSignalSourceAverages: (state, action: PayloadAction<boolean>) => {
      const signals = normalizeMovingAverageTrendSignals(state.ui.movingAverageTrendSignals);
      signals.showSourceAverages = action.payload;
      state.ui.movingAverageTrendSignals = signals;
    },
    setPriceVsSmaMetric: (
      state,
      action: PayloadAction<{ id: PriceVsSmaMetricId; active: boolean }>
    ) => {
      const metrics = normalizePriceVsSmaMetrics(state.ui.priceVsSmaMetrics);
      metrics.active[action.payload.id] = action.payload.active;
      state.ui.priceVsSmaMetrics = metrics;
    },
    setPriceVsSmaMetrics: (
      state,
      action: PayloadAction<Partial<Record<PriceVsSmaMetricId, boolean>>>
    ) => {
      const metrics = normalizePriceVsSmaMetrics(state.ui.priceVsSmaMetrics);
      Object.entries(action.payload).forEach(([id, active]) => {
        metrics.active[id as PriceVsSmaMetricId] = active === true;
      });
      state.ui.priceVsSmaMetrics = metrics;
    },
    setPriceVsEmaMetric: (
      state,
      action: PayloadAction<{ id: PriceVsEmaMetricId; active: boolean }>
    ) => {
      const metrics = normalizePriceVsEmaMetrics(state.ui.priceVsEmaMetrics);
      metrics.active[action.payload.id] = action.payload.active;
      state.ui.priceVsEmaMetrics = metrics;
    },
    setPriceVsEmaMetrics: (
      state,
      action: PayloadAction<Partial<Record<PriceVsEmaMetricId, boolean>>>
    ) => {
      const metrics = normalizePriceVsEmaMetrics(state.ui.priceVsEmaMetrics);
      Object.entries(action.payload).forEach(([id, active]) => {
        metrics.active[id as PriceVsEmaMetricId] = active === true;
      });
      state.ui.priceVsEmaMetrics = metrics;
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
        : nextLayout;
    },
    setMultiChartSync: (state, action: PayloadAction<{ key: MultiChartSyncKey; value: boolean }>) => {

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
    // [SCAR-MULTICHART-HEADER-CONTAMINATION FIX]
    // Séparation critique : cliquer le BODY d'un chart secondaire = activation complète (setActiveLayoutChart).
    // Cliquer le HEADER d'un chart secondaire pour éditer son ticker = ciblage de routing uniquement.
    // Cette action change activeChartId (pour que updateLayoutChart sache où envoyer la sélection)
    // mais NE TOUCHE PAS chartConfig.symbol — le moteur de synchronisation bidirectionnel
    // dans ChartUI ne voit donc aucun changement de reduxSymbol et n'écrase pas le contexte
    // TickerSelector avec le symbole du chart secondaire. Résultat : chart1 (BOAB) reste BOAB.
    setEditChartTarget: (state, action: PayloadAction<string>) => {
      const target = state.ui.multiChartLayout.charts.find((chart) => chart.chartId === action.payload);
      if (!target) return;
      state.ui.multiChartLayout.activeChartId = target.chartId;
      state.ui.multiChartLayout.charts.forEach((chart) => {
        chart.isActive = chart.chartId === target.chartId;
      });
      // chartConfig.symbol intentionnellement NON modifié — préserve le ticker primaire dans le contexte.
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
          symbol: false,
          interval: false,
          crosshair: false,
          time: false,
          dateRange: false,
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
