import type { PayloadAction } from "@reduxjs/toolkit";

import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import { createTimeframeMarketDataCacheKey, type ChartTimeframe } from "../../config/market/timeframeCatalog";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  normalizeMarketDataPayload,
  normalizeMarketSnapshotPayload,
} from "../policies/marketDataPolicy";

export const marketDataReducers = {
  updateMarketData: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{
      symbol: string;
      data: ChartDataPoint[];
      market?: string;
      timeframe?: ChartTimeframe;
      sourceKind?: "equity" | "index";
      sourceId?: string;
    }>,
  ) => {
    const payload = normalizeMarketDataPayload(action.payload);
    if (!payload) return;
    const cacheKey = createTimeframeMarketDataCacheKey(
      payload.market,
      payload.symbol,
      payload.timeframe,
      payload.sourceKind,
      payload.sourceId,
    );
    if (!cacheKey) return;
    state.marketData[cacheKey] = payload.data;
  },
  updateMarketSnapshot: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ symbol: string; snapshot: LiveSnapshot }>,
  ) => {
    const payload = normalizeMarketSnapshotPayload(action.payload);
    if (!payload) return;
    state.marketSnapshots[payload.symbol] = payload.snapshot;
  },
};
