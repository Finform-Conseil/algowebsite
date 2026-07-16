import type { IndicatorPeriods, MovingAverageTrendSignalId, MovingAverageTrendSignalsState } from "./advancedIndicatorsTypes";

export type MovingAverageFamily = "sma" | "ema";

export interface MovingAverageSeriesDefinition {
  id: string;
  dataKey: string;
  label: string;
  period: number;
  color: string;
}

export interface MovingAverageTrendSignalSpec {
  id: MovingAverageTrendSignalId;
  family: MovingAverageFamily;
  period: number;
  label: string;
  shortLabel: string;
  horizon: string;
  description: string;
  interpretation: string;
}

const SMA_SLOT_COLORS = ["#45c3a1", "#f06467", "#FF9F04"] as const;
const SMA_FALLBACK_COLORS = ["#45c3a1", "#f06467", "#FF9F04", "#2E93fA", "#7dd3fc", "#a78bfa", "#66DA26"] as const;
const EMA_FALLBACK_COLORS = ["#9C27B0", "#c026d3", "#f43f5e", "#fb7185", "#f97316", "#facc15", "#84cc16", "#22c55e"] as const;

export const SMA_STANDARD_COLORS_BY_PERIOD: Record<number, string> = {
  5: "#45c3a1",
  10: "#f06467",
  20: "#FF9F04",
  50: "#2E93fA",
  100: "#7dd3fc",
  150: "#a78bfa",
  200: "#66DA26",
};

export const EMA_STANDARD_COLORS_BY_PERIOD: Record<number, string> = {
  5: "#9C27B0",
  9: "#c026d3",
  10: "#E91E63",
  12: "#f43f5e",
  20: "#fb7185",
  26: "#f97316",
  50: "#facc15",
  100: "#84cc16",
  200: "#22c55e",
};

export const getSmaSeriesId = (period: number): string => `sma-${period}`;
export const getSmaSeriesDataKey = (period: number): string => `sma_${period}`;
export const getSmaSeriesLabel = (period: number): string => `SMA ${period}`;
export const getEmaSeriesId = (period: number): string => `ema-${period}`;
export const getEmaSeriesDataKey = (period: number): string => `ema_${period}`;
export const getEmaSeriesLabel = (period: number): string => `EMA ${period}`;

export const MOVING_AVERAGE_TREND_SIGNAL_SPECS: MovingAverageTrendSignalSpec[] = [
  {
    id: "is_above_ema20",
    family: "ema",
    period: 20,
    label: "Prix > EMA 20",
    shortLabel: "EMA20",
    horizon: "Court terme / momentum",
    description: "Momentum court terme positif si le close dépasse l'EMA 20.",
    interpretation: "Rebond ou accélération courte; à confirmer avec SMA50/SMA200.",
  },
  {
    id: "is_above_sma50",
    family: "sma",
    period: 50,
    label: "Prix > SMA 50",
    shortLabel: "SMA50",
    horizon: "Tendance intermédiaire",
    description: "Tendance intermédiaire favorable si le close dépasse la SMA 50.",
    interpretation: "Filtre de régime moyen terme, pas signal d'achat automatique.",
  },
  {
    id: "is_above_sma200",
    family: "sma",
    period: 200,
    label: "Prix > SMA 200",
    shortLabel: "SMA200",
    horizon: "Régime long terme",
    description: "Régime structurel positif si le close dépasse la SMA 200.",
    interpretation: "Filtre long terme; historique insuffisant si moins de 200 bougies.",
  },
];

export const createDefaultMovingAverageTrendSignals = (): MovingAverageTrendSignalsState => ({
  active: {
    is_above_ema20: false,
    is_above_sma50: false,
    is_above_sma200: false,
  },
  showSourceAverages: false,
});

export const normalizeMovingAverageTrendSignals = (
  value: unknown,
): MovingAverageTrendSignalsState => {
  const defaults = createDefaultMovingAverageTrendSignals();
  if (!value || typeof value !== "object") return defaults;

  const candidate = value as Partial<MovingAverageTrendSignalsState>;
  const rawActive = candidate.active && typeof candidate.active === "object"
    ? candidate.active as Partial<Record<MovingAverageTrendSignalId, unknown>>
    : {};

  MOVING_AVERAGE_TREND_SIGNAL_SPECS.forEach((spec) => {
    defaults.active[spec.id] = rawActive[spec.id] === true;
  });
  defaults.showSourceAverages = candidate.showSourceAverages === true;

  return defaults;
};

export const normalizeMovingAveragePeriod = (period: unknown): number | null => {
  const numericPeriod = Number(period);
  if (!Number.isFinite(numericPeriod)) return null;

  const normalizedPeriod = Math.trunc(numericPeriod);
  return normalizedPeriod > 0 ? normalizedPeriod : null;
};

export const normalizeMovingAveragePeriods = (periods: unknown): number[] => {
  if (!Array.isArray(periods)) return [];

  const normalized = new Set<number>();
  periods.forEach((period) => {
    const normalizedPeriod = normalizeMovingAveragePeriod(period);
    if (normalizedPeriod !== null) normalized.add(normalizedPeriod);
  });

  return Array.from(normalized).sort((a, b) => a - b);
};

export const mergeMovingAveragePeriods = (...periodGroups: unknown[]): number[] =>
  normalizeMovingAveragePeriods(periodGroups.flatMap((periods) => Array.isArray(periods) ? periods : []));

const resolveSlotColor = (period: number, indicatorPeriods: IndicatorPeriods): string | null => {
  const configuredPeriods = [indicatorPeriods.sma1, indicatorPeriods.sma2, indicatorPeriods.sma3];

  for (let index = 0; index < configuredPeriods.length; index++) {
    if (normalizeMovingAveragePeriod(configuredPeriods[index]) === period) {
      return SMA_SLOT_COLORS[index];
    }
  }

  return null;
};

export const resolveSmaSeriesColor = (
  period: number,
  indicatorPeriods: IndicatorPeriods,
  orderIndex: number,
): string => (
  resolveSlotColor(period, indicatorPeriods) ??
  SMA_STANDARD_COLORS_BY_PERIOD[period] ??
  SMA_FALLBACK_COLORS[orderIndex % SMA_FALLBACK_COLORS.length]
);

export const resolveEmaSeriesColor = (
  period: number,
  orderIndex: number,
): string => EMA_STANDARD_COLORS_BY_PERIOD[period] ?? EMA_FALLBACK_COLORS[orderIndex % EMA_FALLBACK_COLORS.length];

export const buildSmaSeriesDefinitions = (
  indicatorPeriods: IndicatorPeriods,
  activePeriods: unknown,
): MovingAverageSeriesDefinition[] => normalizeMovingAveragePeriods(activePeriods).map((period, index) => ({
  id: getSmaSeriesId(period),
  dataKey: getSmaSeriesDataKey(period),
  label: getSmaSeriesLabel(period),
  period,
  color: resolveSmaSeriesColor(period, indicatorPeriods, index),
}));

export const buildEmaSeriesDefinitions = (
  activePeriods: unknown,
): MovingAverageSeriesDefinition[] => normalizeMovingAveragePeriods(activePeriods).map((period, index) => ({
  id: getEmaSeriesId(period),
  dataKey: getEmaSeriesDataKey(period),
  label: getEmaSeriesLabel(period),
  period,
  color: resolveEmaSeriesColor(period, index),
}));

export const buildSelectableSmaDefinitions = (
  indicatorPeriods: IndicatorPeriods,
): MovingAverageSeriesDefinition[] => {
  const candidatePeriods = [
    indicatorPeriods.sma1,
    indicatorPeriods.sma2,
    indicatorPeriods.sma3,
    100,
    150,
    50,
    200,
  ];

  return normalizeMovingAveragePeriods(candidatePeriods).map((period, index) => ({
    id: getSmaSeriesId(period),
    dataKey: getSmaSeriesDataKey(period),
    label: getSmaSeriesLabel(period),
    period,
    color: resolveSmaSeriesColor(period, indicatorPeriods, index),
  }));
};

export const buildSelectableEmaDefinitions = (): MovingAverageSeriesDefinition[] => {
  const candidatePeriods = [5, 9, 12, 20, 26, 50, 100, 200];

  return normalizeMovingAveragePeriods(candidatePeriods).map((period, index) => ({
    id: getEmaSeriesId(period),
    dataKey: getEmaSeriesDataKey(period),
    label: getEmaSeriesLabel(period),
    period,
    color: resolveEmaSeriesColor(period, index),
  }));
};

export const resolveTrendSignalSourceAveragePeriods = (
  trendSignals: MovingAverageTrendSignalsState | null | undefined,
): { sma: number[]; ema: number[] } => {
  const normalizedSignals = normalizeMovingAverageTrendSignals(trendSignals);
  if (!normalizedSignals.showSourceAverages) return { sma: [], ema: [] };

  const sma: number[] = [];
  const ema: number[] = [];

  MOVING_AVERAGE_TREND_SIGNAL_SPECS.forEach((spec) => {
    if (normalizedSignals.active[spec.id] !== true) return;
    if (spec.family === "sma") sma.push(spec.period);
    else ema.push(spec.period);
  });

  return {
    sma: normalizeMovingAveragePeriods(sma),
    ema: normalizeMovingAveragePeriods(ema),
  };
};
