import type { IndicatorPeriods } from "../../config/indicators/advancedIndicatorsTypes";

export type IndicatorPeriodKey = "sma1" | "sma2" | "sma3" | "rsiPeriod";

interface IndicatorPeriodLimit {
  min: number;
  max: number;
}

export const INDICATOR_PERIOD_KEYS: readonly IndicatorPeriodKey[] = [
  "sma1",
  "sma2",
  "sma3",
  "rsiPeriod",
];

export const INDICATOR_PERIOD_LIMITS: Record<IndicatorPeriodKey, IndicatorPeriodLimit> = {
  sma1: { min: 1, max: 500 },
  sma2: { min: 1, max: 500 },
  sma3: { min: 1, max: 500 },
  rsiPeriod: { min: 2, max: 100 },
};

export const isIndicatorPeriodKey = (key: string): key is IndicatorPeriodKey =>
  (INDICATOR_PERIOD_KEYS as readonly string[]).includes(key);

export const normalizeIndicatorPeriodValue = (
  key: IndicatorPeriodKey,
  value: unknown,
): number | null => {
  if (typeof value !== "number") return null;
  if (!Number.isFinite(value)) return null;
  if (!Number.isInteger(value)) return null;

  const limit = INDICATOR_PERIOD_LIMITS[key];
  return value >= limit.min && value <= limit.max ? value : null;
};

export const sanitizeIndicatorPeriodsPatch = (
  patch: Partial<IndicatorPeriods>,
): Partial<Pick<IndicatorPeriods, IndicatorPeriodKey>> => {
  const sanitized: Partial<Pick<IndicatorPeriods, IndicatorPeriodKey>> = {};

  INDICATOR_PERIOD_KEYS.forEach((key) => {
    const normalized = normalizeIndicatorPeriodValue(key, patch[key]);
    if (normalized !== null) {
      sanitized[key] = normalized;
    }
  });

  return sanitized;
};

export const applyIndicatorPeriodsPatch = (
  statePeriods: IndicatorPeriods,
  patch: Partial<IndicatorPeriods>,
): void => {
  const sanitized = sanitizeIndicatorPeriodsPatch(patch);

  INDICATOR_PERIOD_KEYS.forEach((key) => {
    const value = sanitized[key];
    if (value !== undefined) {
      statePeriods[key] = value;
    }
  });
};
