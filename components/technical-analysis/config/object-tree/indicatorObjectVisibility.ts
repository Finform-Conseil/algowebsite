import type { AdvancedIndicatorsState } from "../indicators/advancedIndicatorsTypes";
import {
  getAdvancedIndicatorIdForObjectIdFromRegistry,
  getAdvancedIndicatorObjectIdsFromRegistry,
} from "../indicators/indicatorRegistry";

export type IndicatorObjectId = string;

export const getAdvancedIndicatorObjectIds = (indicatorId: keyof AdvancedIndicatorsState): IndicatorObjectId[] =>
  getAdvancedIndicatorObjectIdsFromRegistry(indicatorId);

export const getAdvancedIndicatorIdForObjectId = (
  objectId: IndicatorObjectId,
): keyof AdvancedIndicatorsState | null =>
  getAdvancedIndicatorIdForObjectIdFromRegistry(objectId);

export const getSmaObjectIds = (period: number): IndicatorObjectId[] => [`sma-${period}`];

export const getEmaObjectIds = (period: number): IndicatorObjectId[] => [`ema-${period}`];

export const getAdvancedMovingAverageObjectIds = (family: string, period: number): IndicatorObjectId[] => [`${family}-${period}`];

export const revealHiddenObjectIds = (
  hiddenObjectIds: Record<string, boolean>,
  objectIds: readonly IndicatorObjectId[],
): Record<string, boolean> => {
  if (objectIds.length === 0) return hiddenObjectIds;

  let changed = false;
  const nextHiddenObjectIds = { ...hiddenObjectIds };

  objectIds.forEach((id) => {
    if (nextHiddenObjectIds[id] === true) {
      delete nextHiddenObjectIds[id];
      changed = true;
    }
  });

  return changed ? nextHiddenObjectIds : hiddenObjectIds;
};
