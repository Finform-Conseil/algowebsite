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

export const chartConfigReducers = {
  setSymbol: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    applyChartSymbolUpdate(state.chartConfig, state.ui.multiChartLayout, action.payload);
  },
  setTimeframe: (state: TechnicalAnalysisState, action: PayloadAction<string>) => {
    applyChartTimeframeUpdate(state.chartConfig, state.ui.multiChartLayout, action.payload);
  },
  setChartType: (state: TechnicalAnalysisState, action: PayloadAction<AnyChartType>) => {
    state.chartConfig.chartType = normalizeChartType(action.payload);
  },
  toggleChartType: (state: TechnicalAnalysisState) => {
    state.chartConfig.chartType =
      normalizeChartType(state.chartConfig.chartType) === "line" ? "candles" : "line";
  },
  setChartConfig: (state: TechnicalAnalysisState, action: PayloadAction<Partial<ChartState>>) => {
    const { symbol, timeframe, chartType, indicators } = action.payload;
    applyChartConfigTimingPatch(state.chartConfig, state.ui.multiChartLayout, {
      symbol,
      timeframe,
    });
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
  setChartAppearance: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<ChartAppearance>>,
  ) => {
    const p = action.payload;
    if (p.showGrid !== undefined) state.chartAppearance.showGrid = p.showGrid;
    if (p.upColor !== undefined) state.chartAppearance.upColor = p.upColor;
    if (p.downColor !== undefined) state.chartAppearance.downColor = p.downColor;
    if (p.backgroundColor !== undefined) state.chartAppearance.backgroundColor = p.backgroundColor;
    if (p.showVolume !== undefined) state.chartAppearance.showVolume = p.showVolume;
    if (p.volumeColorMode !== undefined) state.chartAppearance.volumeColorMode = p.volumeColorMode;
  },
  resetChartAppearance: (state: TechnicalAnalysisState) => {
    state.chartAppearance = initialState.chartAppearance;
    state.indicatorPeriods = initialState.indicatorPeriods;
    state.bollingerSettings = initialState.bollingerSettings;
  },
};
