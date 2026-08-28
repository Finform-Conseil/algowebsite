import type { PayloadAction } from "@reduxjs/toolkit";

import type { ChartAppearance, ChartState } from "../../config/state/chartStateTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import { normalizeChartType, type AnyChartType } from "../../lib/chart-types";
import { initialState } from "../initialState";
import {
  applyChartConfigTimingPatch,
  applyChartSymbolUpdate,
  applyChartTimeframeUpdate,
} from "../policies/chartConfigPolicy";
import type { PineChartOverlayPayload } from "../../components/sidebar/panels/pineEditor/pineTypes";
import type { CompleteMultiChartLayoutCell } from "../../config/layout/multiChartCellState";
import { syncActiveCellIndicatorSnapshot } from "../policies/multiChartIndicatorStatePolicy";

const getActiveBoundMultiChartCell = (
  state: TechnicalAnalysisState,
): CompleteMultiChartLayoutCell | null => {
  const layout = state.ui.multiChartLayout;
  const active = (layout.charts as CompleteMultiChartLayoutCell[]).find(
    (cell) => cell.chartId === layout.activeChartId,
  );
  return active?.symbol?.trim() ? active : null;
};

const setActiveCellIndicator = (
  state: TechnicalAnalysisState,
  indicator: "sma" | "volume",
  enabled: boolean,
): void => {
  const active = getActiveBoundMultiChartCell(state);
  if (!active) return;
  const next = new Set(active.indicators);
  if (enabled) next.add(indicator);
  else next.delete(indicator);
  active.indicators = [...next];
};

const setActiveCellChartType = (
  state: TechnicalAnalysisState,
  chartType: AnyChartType,
): void => {
  const active = getActiveBoundMultiChartCell(state);
  if (!active) return;
  active.chartType = active.sourceKind === "index" ? "line" : normalizeChartType(chartType);
};

export const chartConfigReducers = {
  setSymbol: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    applyChartSymbolUpdate(state.chartConfig, state.ui.multiChartLayout, action.payload);
  },
  setTimeframe: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    applyChartTimeframeUpdate(state.chartConfig, state.ui.multiChartLayout, action.payload);
  },
  setChartType: (state: TechnicalAnalysisState, action: PayloadAction<AnyChartType>) => {
    const active = getActiveBoundMultiChartCell(state);
    const nextType = active?.sourceKind === "index" ? "line" : normalizeChartType(action.payload);
    state.chartConfig.chartType = nextType;
    setActiveCellChartType(state, nextType);
  },
  toggleChartType: (state: TechnicalAnalysisState) => {
    const active = getActiveBoundMultiChartCell(state);
    const nextType = active?.sourceKind === "index"
      ? "line"
      : normalizeChartType(state.chartConfig.chartType) === "line" ? "candles" : "line";
    state.chartConfig.chartType = nextType;
    setActiveCellChartType(state, nextType);
  },
  setChartConfig: (state: TechnicalAnalysisState, action: PayloadAction<Partial<ChartState>>) => {
    const { symbol, timeframe, chartType, indicators } = action.payload;
    applyChartConfigTimingPatch(state.chartConfig, state.ui.multiChartLayout, {
      symbol,
      timeframe,
    });
    if (chartType !== undefined) {
      const active = getActiveBoundMultiChartCell(state);
      const nextType = active?.sourceKind === "index" ? "line" : normalizeChartType(chartType);
      state.chartConfig.chartType = nextType;
      setActiveCellChartType(state, nextType);
    }

    if (indicators !== undefined) {
      if (indicators.sma !== undefined) {
        state.chartConfig.indicators.sma = indicators.sma;
        setActiveCellIndicator(state, "sma", indicators.sma);
      }
      if (indicators.ema !== undefined) state.chartConfig.indicators.ema = indicators.ema;
      if (indicators.volume !== undefined) {
        state.chartConfig.indicators.volume = indicators.volume;
        state.chartAppearance.showVolume = indicators.volume;
        setActiveCellIndicator(state, "volume", indicators.volume);
      }
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
      syncActiveCellIndicatorSnapshot(state);
    }
  },
  setChartAppearance: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<ChartAppearance>>,
  ) => {
    const p = action.payload;
    if (p.showGrid !== undefined) state.chartAppearance.showGrid = p.showGrid;
    if (p.upColor !== undefined) state.chartAppearance.upColor = p.upColor;
    if (p.downColor !== undefined) state.chartAppearance.downColor = p.downColor;
    if (p.backgroundColor !== undefined) state.chartAppearance.backgroundColor = p.backgroundColor;
    if (p.showVolume !== undefined) {
      state.chartAppearance.showVolume = p.showVolume;
      state.chartConfig.indicators.volume = p.showVolume;
      setActiveCellIndicator(state, "volume", p.showVolume);
      syncActiveCellIndicatorSnapshot(state);
    }
    if (p.volumeColorMode !== undefined) state.chartAppearance.volumeColorMode = p.volumeColorMode;
    if (p.statusLine !== undefined) {
      const statusLine = p.statusLine;
      if (statusLine.showChange !== undefined) state.chartAppearance.statusLine.showChange = statusLine.showChange;
      if (statusLine.showChangePercent !== undefined) state.chartAppearance.statusLine.showChangePercent = statusLine.showChangePercent;
      if (statusLine.showLast !== undefined) state.chartAppearance.statusLine.showLast = statusLine.showLast;
      if (statusLine.showLogo !== undefined) state.chartAppearance.statusLine.showLogo = statusLine.showLogo;
      if (statusLine.showName !== undefined) state.chartAppearance.statusLine.showName = statusLine.showName;
      if (statusLine.showSymbol !== undefined) state.chartAppearance.statusLine.showSymbol = statusLine.showSymbol;
      if (statusLine.showVolume !== undefined) state.chartAppearance.statusLine.showVolume = statusLine.showVolume;
    }
  },
  resetChartAppearance: (state: TechnicalAnalysisState) => {
    state.chartAppearance = initialState.chartAppearance;
    state.indicatorPeriods = initialState.indicatorPeriods;
    state.bollingerSettings = initialState.bollingerSettings;
    syncActiveCellIndicatorSnapshot(state);
  },
  setPineChartOverlay: (state: TechnicalAnalysisState, action: PayloadAction<PineChartOverlayPayload | null>) => {
    state.pineChartOverlay = action.payload;
  },
  clearPineChartOverlay: (state: TechnicalAnalysisState) => {
    state.pineChartOverlay = null;
  },
};
