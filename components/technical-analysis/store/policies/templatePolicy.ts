import type { AdvancedIndicatorsState } from "../../config/indicators/advancedIndicatorsTypes";
import type { ChartState } from "../../config/state/chartStateTypes";
import type { TechnicalAnalysisState } from "../../config/state/technicalAnalysisStateTypes";
import { initialState } from "../initialState";
import {
  INDICATOR_TEMPLATE_SPECS,
  type IndicatorTemplateChartIndicators,
  type IndicatorTemplateId,
} from "../templates/indicatorTemplates";

const cloneNumberArray = (values: readonly number[]): number[] => [...values];

export const buildTemplateChartIndicators = (
  currentIndicators: ChartState["indicators"],
  templateIndicators: IndicatorTemplateChartIndicators,
): ChartState["indicators"] => ({
  ...currentIndicators,
  sma: templateIndicators.sma,
  ema: templateIndicators.ema,
  volume: templateIndicators.volume,
  activeSma: cloneNumberArray(templateIndicators.activeSma),
  activeEma: cloneNumberArray(templateIndicators.activeEma),
  activeWma: cloneNumberArray(templateIndicators.activeWma),
  activeDema: cloneNumberArray(templateIndicators.activeDema),
  activeTema: cloneNumberArray(templateIndicators.activeTema),
  activeHma: cloneNumberArray(templateIndicators.activeHma),
  activeZlema: cloneNumberArray(templateIndicators.activeZlema),
  activeAlma: cloneNumberArray(templateIndicators.activeAlma),
  activeSmma: cloneNumberArray(templateIndicators.activeSmma),
  activeKama: cloneNumberArray(templateIndicators.activeKama),
  activeVwma: cloneNumberArray(templateIndicators.activeVwma),
});

export const buildTemplateAdvancedIndicators = (
  activeIndicatorKeys: readonly (keyof AdvancedIndicatorsState)[],
): AdvancedIndicatorsState => {
  const nextIndicators: AdvancedIndicatorsState = { ...initialState.advancedIndicators };

  activeIndicatorKeys.forEach((key) => {
    nextIndicators[key] = true;
  });

  return nextIndicators;
};

export const applyIndicatorTemplate = (
  state: Pick<TechnicalAnalysisState, "advancedIndicators" | "chartConfig" | "ui">,
  templateId: IndicatorTemplateId,
): void => {
  const template = INDICATOR_TEMPLATE_SPECS[templateId];

  state.chartConfig.indicators = buildTemplateChartIndicators(
    state.chartConfig.indicators,
    template.chartIndicators,
  );
  state.advancedIndicators = buildTemplateAdvancedIndicators(template.activeAdvancedIndicators);
  state.ui.modals.templates = false;
};

export type { IndicatorTemplateId };
