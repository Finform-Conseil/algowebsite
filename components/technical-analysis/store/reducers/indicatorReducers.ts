import type { PayloadAction } from "@reduxjs/toolkit";

import type {
  AdvancedIndicatorsState,
  BollingerSettings,
  IndicatorPeriods,
} from "../../config/indicators/advancedIndicatorsTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import { initialState } from "../initialState";
import { applyIndicatorPeriodsPatch } from "../policies/indicatorPeriodPolicy";
import { applyIndicatorTemplate, type IndicatorTemplateId } from "../policies/templatePolicy";

const mutuallyExclusiveIndicatorPairs = [
  ["cci20", "cci"],
  ["cci", "cci20"],
  ["williamsR14", "williamsR"],
  ["williamsR", "williamsR14"],
  ["roc10", "roc"],
  ["roc", "roc10"],
] as const satisfies ReadonlyArray<readonly [keyof AdvancedIndicatorsState, keyof AdvancedIndicatorsState]>;

const advancedIndicatorPatchKeys = Object.keys(
  initialState.advancedIndicators,
) as Array<keyof AdvancedIndicatorsState>;

const applyDefinedAdvancedIndicatorPatch = (
  target: AdvancedIndicatorsState,
  patch: Partial<AdvancedIndicatorsState>,
): void => {
  advancedIndicatorPatchKeys.forEach((key) => {
    const value = patch[key];
    if (value !== undefined) target[key] = value;
  });
};

const enforceActivatedIndicatorExclusion = (
  target: AdvancedIndicatorsState,
  enabledKey: keyof AdvancedIndicatorsState,
): void => {
  mutuallyExclusiveIndicatorPairs.forEach(([activeKey, inactiveKey]) => {
    if (activeKey === enabledKey && target[activeKey]) target[inactiveKey] = false;
  });
};

const enforceMutuallyExclusiveIndicators = (
  target: AdvancedIndicatorsState,
  patch: Partial<AdvancedIndicatorsState>,
): void => {
  mutuallyExclusiveIndicatorPairs.forEach(([enabledKey, disabledKey]) => {
    if (patch[enabledKey]) target[disabledKey] = false;
  });
};

export const indicatorReducers = {
  toggleAdvancedIndicator: (
    state: TechnicalAnalysisState,
    action: PayloadAction<keyof AdvancedIndicatorsState>,
  ) => {
    const key = action.payload;
    state.advancedIndicators[key] = !state.advancedIndicators[key];
    enforceActivatedIndicatorExclusion(state.advancedIndicators, key);
  },
  setAdvancedIndicators: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<AdvancedIndicatorsState>>,
  ) => {
    applyDefinedAdvancedIndicatorPatch(state.advancedIndicators, action.payload);
    enforceMutuallyExclusiveIndicators(state.advancedIndicators, action.payload);
  },
  setIndicatorPeriods: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<IndicatorPeriods>>,
  ) => {
    applyIndicatorPeriodsPatch(state.indicatorPeriods, action.payload);
  },
  setBollingerSettings: (
    state: TechnicalAnalysisState,
    action: PayloadAction<Partial<BollingerSettings>>,
  ) => {
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
  applyTemplate: (
    state: TechnicalAnalysisState,
    action: PayloadAction<IndicatorTemplateId>,
  ) => {
    applyIndicatorTemplate(state, action.payload);
  },
};
