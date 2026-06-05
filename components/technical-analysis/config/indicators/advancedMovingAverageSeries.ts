import { normalizeMovingAveragePeriods } from "./movingAverageSeries";

export type AdvancedMovingAverageFamily =
  | "wma"
  | "dema"
  | "tema"
  | "hma"
  | "zlema"
  | "alma"
  | "smma"
  | "kama"
  | "vwma";

export type AdvancedMovingAverageId =
  | "wma_20"
  | "wma_50"
  | "dema_20"
  | "dema_50"
  | "tema_20"
  | "tema_50"
  | "hma_20"
  | "hma_50"
  | "zlema_20"
  | "alma_20"
  | "smma_20"
  | "kama_20"
  | "vwma_20";

export interface AdvancedMovingAverageSpec {
  id: AdvancedMovingAverageId;
  family: AdvancedMovingAverageFamily;
  period: 20 | 50;
  label: string;
  shortLabel: string;
  horizon: string;
  description: string;
  requiredBars: number;
  color: string;
}

export interface AdvancedMovingAverageSeriesDefinition extends AdvancedMovingAverageSpec {
  seriesId: string;
  dataKey: string;
}

export interface AdvancedMovingAverageActivationState {
  activeWma: number[];
  activeDema: number[];
  activeTema: number[];
  activeHma: number[];
  activeZlema: number[];
  activeAlma: number[];
  activeSmma: number[];
  activeKama: number[];
  activeVwma: number[];
}

export const ADVANCED_MOVING_AVERAGE_STATE_KEYS = {
  wma: "activeWma",
  dema: "activeDema",
  tema: "activeTema",
  hma: "activeHma",
  zlema: "activeZlema",
  alma: "activeAlma",
  smma: "activeSmma",
  kama: "activeKama",
  vwma: "activeVwma",
} as const satisfies Record<AdvancedMovingAverageFamily, keyof AdvancedMovingAverageActivationState>;

export const ADVANCED_MOVING_AVERAGE_SPECS: AdvancedMovingAverageSpec[] = [
  {
    id: "wma_20",
    family: "wma",
    period: 20,
    label: "WMA 20",
    shortLabel: "WMA20",
    horizon: "Pondération récente",
    description: "Weighted Moving Average sur les 20 dernières bougies de la timeframe courante.",
    requiredBars: 20,
    color: "#22d3ee",
  },
  {
    id: "wma_50",
    family: "wma",
    period: 50,
    label: "WMA 50",
    shortLabel: "WMA50",
    horizon: "Pondération intermédiaire",
    description: "Weighted Moving Average sur les 50 dernières bougies de la timeframe courante.",
    requiredBars: 50,
    color: "#06b6d4",
  },
  {
    id: "dema_20",
    family: "dema",
    period: 20,
    label: "DEMA 20",
    shortLabel: "DEMA20",
    horizon: "Low-lag court terme",
    description: "Double EMA: 2 x EMA1 moins EMA2, avec EMA initialisée par SMA.",
    requiredBars: 39,
    color: "#fb923c",
  },
  {
    id: "dema_50",
    family: "dema",
    period: 50,
    label: "DEMA 50",
    shortLabel: "DEMA50",
    horizon: "Low-lag intermédiaire",
    description: "Double EMA: 2 x EMA1 moins EMA2, avec lookback strict.",
    requiredBars: 99,
    color: "#f97316",
  },
  {
    id: "tema_20",
    family: "tema",
    period: 20,
    label: "TEMA 20",
    shortLabel: "TEMA20",
    horizon: "Triple EMA réactive",
    description: "Triple EMA: 3 x EMA1 moins 3 x EMA2 plus EMA3.",
    requiredBars: 58,
    color: "#c084fc",
  },
  {
    id: "tema_50",
    family: "tema",
    period: 50,
    label: "TEMA 50",
    shortLabel: "TEMA50",
    horizon: "Triple EMA structurelle",
    description: "Triple EMA: 3 x EMA1 moins 3 x EMA2 plus EMA3, avec lookback strict.",
    requiredBars: 148,
    color: "#a855f7",
  },
  {
    id: "hma_20",
    family: "hma",
    period: 20,
    label: "HMA 20",
    shortLabel: "HMA20",
    horizon: "Hull court terme",
    description: "Hull Moving Average: WMA4 de 2 x WMA10(Close) moins WMA20(Close).",
    requiredBars: 23,
    color: "#6366f1",
  },
  {
    id: "hma_50",
    family: "hma",
    period: 50,
    label: "HMA 50",
    shortLabel: "HMA50",
    horizon: "Hull intermédiaire",
    description: "Hull Moving Average: WMA7 de 2 x WMA25(Close) moins WMA50(Close).",
    requiredBars: 56,
    color: "#4f46e5",
  },
  {
    id: "zlema_20",
    family: "zlema",
    period: 20,
    label: "ZLEMA 20",
    shortLabel: "ZLEMA20",
    horizon: "EMA corrigée du retard",
    description: "Zero Lag EMA: EMA20 de 2 x Close moins Close[9].",
    requiredBars: 29,
    color: "#14b8a6",
  },
  {
    id: "alma_20",
    family: "alma",
    period: 20,
    label: "ALMA 20",
    shortLabel: "ALMA20",
    horizon: "Lissage gaussien réactif",
    description: "Arnaud Legoux Moving Average sur Close, avec offset 0.85 et sigma 6.",
    requiredBars: 20,
    color: "#38bdf8",
  },
  {
    id: "smma_20",
    family: "smma",
    period: 20,
    label: "SMMA 20",
    shortLabel: "SMMA20",
    horizon: "Lissage progressif long",
    description: "Smoothed Moving Average de type RMA/Wilder avec alpha 1 / 20.",
    requiredBars: 20,
    color: "#84cc16",
  },
  {
    id: "kama_20",
    family: "kama",
    period: 20,
    label: "KAMA 20",
    shortLabel: "KAMA20",
    horizon: "Moyenne adaptative au bruit du marché",
    description: "Kaufman Adaptive Moving Average sur Close, ER 20, fast 2, slow 30.",
    requiredBars: 20,
    color: "#f59e0b",
  },
  {
    id: "vwma_20",
    family: "vwma",
    period: 20,
    label: "VWMA 20",
    shortLabel: "VWMA20",
    horizon: "Moyenne pondérée par le volume traité",
    description: "Volume Weighted Moving Average: somme Close x Volume divisée par somme Volume.",
    requiredBars: 20,
    color: "#10b981",
  },
];

export const getAdvancedMovingAverageSeriesId = (
  family: AdvancedMovingAverageFamily,
  period: number,
): string => `${family}-${period}`;

export const getAdvancedMovingAverageDataKey = (
  family: AdvancedMovingAverageFamily,
  period: number,
): string => `${family}_${period}`;

export const getAdvancedMovingAverageSpecById = (
  id: AdvancedMovingAverageId,
): AdvancedMovingAverageSpec => {
  const spec = ADVANCED_MOVING_AVERAGE_SPECS.find((entry) => entry.id === id);
  if (!spec) throw new Error(`Unknown advanced moving average id: ${id}`);
  return spec;
};

export const buildAdvancedMovingAverageSeriesDefinitions = (
  state: Partial<AdvancedMovingAverageActivationState>,
): AdvancedMovingAverageSeriesDefinition[] => {
  const activeByFamily = Object.fromEntries(
    Object.entries(ADVANCED_MOVING_AVERAGE_STATE_KEYS).map(([family, stateKey]) => [
      family,
      new Set(normalizeMovingAveragePeriods(state[stateKey])),
    ]),
  ) as Record<AdvancedMovingAverageFamily, Set<number>>;

  return ADVANCED_MOVING_AVERAGE_SPECS
    .filter((spec) => activeByFamily[spec.family].has(spec.period))
    .map((spec) => ({
      ...spec,
      seriesId: getAdvancedMovingAverageSeriesId(spec.family, spec.period),
      dataKey: getAdvancedMovingAverageDataKey(spec.family, spec.period),
    }));
};

export const isAdvancedMovingAverageActive = (
  state: Partial<AdvancedMovingAverageActivationState>,
  id: AdvancedMovingAverageId,
): boolean => {
  const spec = getAdvancedMovingAverageSpecById(id);
  const activePeriods = state[ADVANCED_MOVING_AVERAGE_STATE_KEYS[spec.family]];

  return normalizeMovingAveragePeriods(activePeriods).includes(spec.period);
};

export const toggleAdvancedMovingAverage = (
  state: AdvancedMovingAverageActivationState,
  id: AdvancedMovingAverageId,
  active: boolean,
): AdvancedMovingAverageActivationState => {
  const spec = getAdvancedMovingAverageSpecById(id);
  const stateKey = ADVANCED_MOVING_AVERAGE_STATE_KEYS[spec.family];
  const current = state[stateKey];
  const normalized = new Set(normalizeMovingAveragePeriods(current));

  if (active) normalized.add(spec.period);
  else normalized.delete(spec.period);

  const nextPeriods = Array.from(normalized).sort((a, b) => a - b);

  return { ...state, [stateKey]: nextPeriods };
};
