import { CONDITIONS, MAX_MESSAGE_LENGTH } from "./alertsRailConstants";
import type { AlertConditionId, AlertDraft, AlertOption, AlertTypeId, ValidationResult } from "./alertsRailTypes";

const CONDITION_BY_TYPE: Record<AlertTypeId, AlertConditionId> = {
  change: "change_at_least",
  dividend: "dividend_available",
  news: "news_available",
  indicator: "indicator_cross_above",
  price: "price_crossing",
  volume: "volume_ratio_at_least",
};

const NUMERIC_CONDITIONS = new Set<AlertConditionId>([
  "change_at_least",
  "price_crossing",
  "price_above",
  "price_below",
  "volume_ratio_at_least",
  "indicator_cross_above",
  "indicator_cross_below",
  "indicator_above",
  "indicator_below",
]);

export const makeAlertId = (prefix = "brvm-alert") => (
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
);

export const getOptionLabel = <T extends string>(options: AlertOption<T>[], id: T) => (
  options.find((option) => option.id === id)?.label ?? id
);

export const normalizeNumberInput = (value: string) => value.trim().replace(/\s/g, "").replace(",", ".");

export const parseFiniteNumber = (value: string): number | null => {
  const parsed = Number(normalizeNumberInput(value));
  return Number.isFinite(parsed) ? parsed : null;
};

export const isNumericCondition = (condition: AlertConditionId) => NUMERIC_CONDITIONS.has(condition);

export const buildDefaultMessage = (
  ticker: string,
  type: AlertTypeId,
  condition: AlertConditionId,
  threshold: string,
  indicatorLabel?: string,
) => {
  if (condition === "price_crossing") return `${ticker} Crossing ${threshold}`;
  if (type === "indicator") {
    const label = indicatorLabel?.trim() || "Indicateur";
    return `${ticker} - ${label} ${getOptionLabel(CONDITIONS, condition).toLowerCase()} ${threshold}`;
  }
  const conditionLabel = getOptionLabel(CONDITIONS, condition).toLowerCase();
  if (!isNumericCondition(condition)) return `${ticker} - ${conditionLabel}`;
  return `${ticker} - ${conditionLabel} ${threshold}`;
};

export const coerceConditionForType = (type: AlertTypeId, condition: AlertConditionId) => {
  if (type === "price" && (
    condition === "price_crossing" ||
    condition === "price_above" ||
    condition === "price_below"
  )) return condition;
  if (type === "indicator" && (
    condition === "indicator_cross_above" ||
    condition === "indicator_cross_below" ||
    condition === "indicator_above" ||
    condition === "indicator_below"
  )) return condition;
  return CONDITION_BY_TYPE[type];
};

export const validateDraft = (draft: AlertDraft): ValidationResult => {
  const message = draft.message.trim();
  if (message.length < 4) return { error: "Message trop court", threshold: null };
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `Message limite a ${MAX_MESSAGE_LENGTH} caracteres`, threshold: null };
  }
  if (draft.type === "indicator" && !draft.indicator?.key) return { error: "Indicateur requis", threshold: null };
  if (!isNumericCondition(draft.condition)) return { error: null, threshold: null };
  const threshold = parseFiniteNumber(draft.threshold);
  if (threshold === null) return { error: "Seuil numerique invalide", threshold: null };
  if ((
    draft.condition === "price_crossing" ||
    draft.condition === "price_above" ||
    draft.condition === "price_below"
  ) && threshold <= 0) {
    return { error: "Prix strictement positif requis", threshold: null };
  }
  if (draft.condition === "volume_ratio_at_least" && threshold <= 0) {
    return { error: "Ratio volume strictement positif requis", threshold: null };
  }
  if (draft.type === "indicator" && !Number.isFinite(threshold)) {
    return { error: "Seuil indicateur invalide", threshold: null };
  }
  return { error: null, threshold };
};
