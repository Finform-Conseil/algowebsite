import type { PriceVsEmaMetricId, PriceVsEmaMetricsState } from "./advancedIndicatorsTypes";

export interface PriceVsEmaMetricSpec {
  id: PriceVsEmaMetricId;
  period: 20 | 50 | 200;
  label: string;
  shortLabel: string;
  horizon: string;
  description: string;
}

export const PRICE_VS_EMA_METRIC_SPECS: PriceVsEmaMetricSpec[] = [
  {
    id: "price_vs_ema20_pct",
    period: 20,
    label: "Prix / EMA 20",
    shortLabel: "EMA20",
    horizon: "Distance court terme, momentum récent",
    description: "Distance du close courant à la moyenne exponentielle des 20 dernières bougies de la timeframe courante.",
  },
  {
    id: "price_vs_ema50_pct",
    period: 50,
    label: "Prix / EMA 50",
    shortLabel: "EMA50",
    horizon: "Distance tendance intermédiaire",
    description: "Distance du close courant à la moyenne exponentielle des 50 dernières bougies de la timeframe courante.",
  },
  {
    id: "price_vs_ema200_pct",
    period: 200,
    label: "Prix / EMA 200",
    shortLabel: "EMA200",
    horizon: "Distance régime long terme",
    description: "Distance du close courant à la moyenne exponentielle des 200 dernières bougies de la timeframe courante.",
  },
];

export const createDefaultPriceVsEmaMetrics = (): PriceVsEmaMetricsState => ({
  active: {
    price_vs_ema20_pct: false,
    price_vs_ema50_pct: false,
    price_vs_ema200_pct: false,
  },
});

export const normalizePriceVsEmaMetrics = (value: unknown): PriceVsEmaMetricsState => {
  const defaults = createDefaultPriceVsEmaMetrics();
  if (!value || typeof value !== "object") return defaults;

  const candidate = value as Partial<PriceVsEmaMetricsState>;
  const rawActive = candidate.active && typeof candidate.active === "object"
    ? candidate.active as Partial<Record<PriceVsEmaMetricId, unknown>>
    : {};

  PRICE_VS_EMA_METRIC_SPECS.forEach((spec) => {
    defaults.active[spec.id] = rawActive[spec.id] === true;
  });

  return defaults;
};

export const resolvePriceVsEmaSourceAveragePeriods = (value: unknown): number[] => {
  const metrics = normalizePriceVsEmaMetrics(value);

  return PRICE_VS_EMA_METRIC_SPECS
    .filter((spec) => metrics.active[spec.id])
    .map((spec) => spec.period);
};
