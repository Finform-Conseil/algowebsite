import type { PriceVsSmaMetricId, PriceVsSmaMetricsState } from "./TechnicalAnalysisTypes";

export interface PriceVsSmaMetricSpec {
  id: PriceVsSmaMetricId;
  period: 20 | 50 | 150 | 200;
  label: string;
  shortLabel: string;
  horizon: string;
  description: string;
}

export const PRICE_VS_SMA_METRIC_SPECS: PriceVsSmaMetricSpec[] = [
  {
    id: "price_vs_sma20_pct",
    period: 20,
    label: "Prix / SMA 20",
    shortLabel: "SMA20",
    horizon: "Distance court terme",
    description: "Distance du close courant à la moyenne simple des 20 dernières bougies de la timeframe courante.",
  },
  {
    id: "price_vs_sma50_pct",
    period: 50,
    label: "Prix / SMA 50",
    shortLabel: "SMA50",
    horizon: "Distance tendance intermédiaire",
    description: "Distance du close courant à la moyenne simple des 50 dernières bougies de la timeframe courante.",
  },
  {
    id: "price_vs_sma150_pct",
    period: 150,
    label: "Prix / SMA 150",
    shortLabel: "SMA150",
    horizon: "Distance structurelle",
    description: "Distance du close courant à la moyenne simple des 150 dernières bougies de la timeframe courante.",
  },
  {
    id: "price_vs_sma200_pct",
    period: 200,
    label: "Prix / SMA 200",
    shortLabel: "SMA200",
    horizon: "Distance régime long terme",
    description: "Distance du close courant à la moyenne simple des 200 dernières bougies de la timeframe courante.",
  },
];

export const createDefaultPriceVsSmaMetrics = (): PriceVsSmaMetricsState => ({
  active: {
    price_vs_sma20_pct: false,
    price_vs_sma50_pct: false,
    price_vs_sma150_pct: false,
    price_vs_sma200_pct: false,
  },
});

export const normalizePriceVsSmaMetrics = (value: unknown): PriceVsSmaMetricsState => {
  const defaults = createDefaultPriceVsSmaMetrics();
  if (!value || typeof value !== "object") return defaults;

  const candidate = value as Partial<PriceVsSmaMetricsState>;
  const rawActive = candidate.active && typeof candidate.active === "object"
    ? candidate.active as Partial<Record<PriceVsSmaMetricId, unknown>>
    : {};

  PRICE_VS_SMA_METRIC_SPECS.forEach((spec) => {
    defaults.active[spec.id] = rawActive[spec.id] === true;
  });

  return defaults;
};

export const resolvePriceVsSmaSourceAveragePeriods = (value: unknown): number[] => {
  const metrics = normalizePriceVsSmaMetrics(value);

  return PRICE_VS_SMA_METRIC_SPECS
    .filter((spec) => metrics.active[spec.id])
    .map((spec) => spec.period);
};
