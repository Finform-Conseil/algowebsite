import type { PayloadAction } from "@reduxjs/toolkit";

import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import { normalizeReplaySpeed } from "../policies/replayPolicy";

export const replayReducers = {
  setReplayActive: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.replay.isActive = action.payload;
  },
  setReplayPaused: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.replay.isPaused = action.payload;
  },
  setReplaySpeed: (state: TechnicalAnalysisState, action: PayloadAction<number>) => {
    const speed = normalizeReplaySpeed(action.payload);
    if (speed === null) return;
    state.ui.replay.speed = speed;
  },
  setLockedAll: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.isLockedAll = action.payload;
  },
  toggleLockedAll: (state: TechnicalAnalysisState) => {
    state.ui.isLockedAll = !state.ui.isLockedAll;
  },
  setAreDrawingsHidden: (state: TechnicalAnalysisState, action: PayloadAction<boolean>) => {
    state.ui.areDrawingsHidden = action.payload;
  },
  toggleAreDrawingsHidden: (state: TechnicalAnalysisState) => {
    state.ui.areDrawingsHidden = !state.ui.areDrawingsHidden;
  },
};
