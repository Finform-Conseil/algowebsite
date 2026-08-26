import type { PayloadAction } from "@reduxjs/toolkit";

import type { LiveSnapshot } from "../../config/market/marketSnapshotTypes";
import { createMarketDataCacheKey } from "../../config/market/marketDataCacheKey";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  normalizeMarketDataPayload,
  normalizeMarketSnapshotPayload,
} from "../policies/marketDataPolicy";

export const marketDataReducers = {
  updateMarketData: (
    state: TechnicalAnalysisState,
    action: PayloadAction<{ symbol: string; data: ChartDataPoint[]; market?: string }>,
  ) => {
    const payload = normalizeMarketDataPayload(action.payload);
    if (!payload) return;
    state.marketData[createMarketDataCacheKey(payload.market, payload.symbol)] = payload.data;
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
