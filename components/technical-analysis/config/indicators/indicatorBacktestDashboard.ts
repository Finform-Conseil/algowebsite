import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import {
  buildIndicatorFamilyBacktestSignals,
  getIndicatorBacktestPolicy,
  getIndicatorFamilyBacktestStrategy,
  summarizeIndicatorBacktest,
} from "./indicatorBacktestAlertPolicy";
import {
  buildIndicatorResearchGradeInventory,
  type IndicatorResearchInventoryOptions,
} from "./indicatorResearchGradePolicy";
import type { IndicatorResearchFamily } from "./indicatorResearchGradeTypes";
import { createIndicatorBacktestSeriesCache } from "./indicatorBacktestSeries";

export type IndicatorBacktestDashboardStatus = "ready" | "insufficient-data" | "no-trades";

export interface IndicatorFamilyBacktestDashboardRow {
  averageReturnPct: number | null;
  bestIndicatorLabel: string | null;
  bestIndicatorWinRate: number | null;
  caveat: string;
  entries: number;
  evaluatedIndicators: number;
  family: IndicatorResearchFamily;
  ignoredSignals: number;
  indicatorsWithSignals: number;
  label: string;
  maxAdverseReturnPct: number | null;
  signalModels: string[];
  status: IndicatorBacktestDashboardStatus;
  trades: number;
  winRate: number | null;
}

export interface IndicatorBacktestDashboard {
  averageReturnPct: number | null;
  bars: number;
  caveat: string;
  evaluatedIndicators: number;
  families: IndicatorFamilyBacktestDashboardRow[];
  ignoredSignals: number;
  maxSampleBars: number;
  minSampleBars: number;
  sampleBars: number;
  status: IndicatorBacktestDashboardStatus;
  topFamily: IndicatorFamilyBacktestDashboardRow | null;
  totalIndicators: number;
  trades: number;
  winRate: number | null;
}

type FamilyAccumulator = {
  bestIndicatorLabel: string | null;
  bestIndicatorTrades: number;
  bestIndicatorWinRate: number | null;
  entries: number;
  evaluatedIndicators: number;
  ignoredSignals: number;
  indicatorsWithSignals: number;
  losses: number;
  maxAdverseReturnPct: number | null;
  returnSum: number;
  signalModels: Set<string>;
  trades: number;
  wins: number;
};

const MAX_BACKTEST_SAMPLE_BARS = 360;
const MIN_BACKTEST_SAMPLE_BARS = 60;

const FAMILY_ORDER: IndicatorResearchFamily[] = [
  "moving-average",
  "trend-signal",
  "price-vs-average",
  "oscillator",
  "trend",
  "volatility",
  "volume-liquidity",
  "support-resistance",
  "price-action",
  "candlestick-pattern",
];

const FAMILY_LABELS: Record<IndicatorResearchFamily, string> = {
  "candlestick-pattern": "Chandeliers",
  "moving-average": "Moyennes",
  oscillator: "Oscillateurs",
  "price-action": "Price action",
  "price-vs-average": "Prix vs MA",
  "support-resistance": "Supports",
  trend: "Tendance",
  "trend-signal": "Signaux MA",
  volatility: "Volatilite",
  "volume-liquidity": "Volume",
};

export const buildIndicatorBacktestDashboard = (
  data: readonly ChartDataPoint[],
  options: IndicatorResearchInventoryOptions,
): IndicatorBacktestDashboard => {
  const inventory = buildIndicatorResearchGradeInventory(options);
  const sampleData = getBacktestSampleData(data);
  const accumulators = createFamilyAccumulators();

  inventory.forEach((entry) => {
    const accumulator = accumulators.get(entry.policy.family);
    if (!accumulator) return;
    accumulator.entries += 1;
    accumulator.signalModels.add(getIndicatorFamilyBacktestStrategy(entry).signalModel);
  });

  if (sampleData.length >= MIN_BACKTEST_SAMPLE_BARS) {
    const seriesCache = createIndicatorBacktestSeriesCache();
    inventory.forEach((entry) => {
      const accumulator = accumulators.get(entry.policy.family);
      if (!accumulator) return;
      const policy = getIndicatorBacktestPolicy(entry);
      if (!policy.enabled) return;

      accumulator.evaluatedIndicators += 1;
      const signals = buildIndicatorFamilyBacktestSignals(sampleData, entry, seriesCache);
      if (signals.length > 0) accumulator.indicatorsWithSignals += 1;

      const summary = summarizeIndicatorBacktest(sampleData, signals, policy);
      accumulator.trades += summary.trades;
      accumulator.wins += summary.wins;
      accumulator.losses += summary.losses;
      accumulator.ignoredSignals += summary.ignored;
      if (summary.averageReturnPct !== null) {
        accumulator.returnSum += summary.averageReturnPct * summary.trades;
      }
      if (summary.maxAdverseReturnPct !== null) {
        accumulator.maxAdverseReturnPct = accumulator.maxAdverseReturnPct === null
          ? summary.maxAdverseReturnPct
          : Math.min(accumulator.maxAdverseReturnPct, summary.maxAdverseReturnPct);
      }
      if (summary.winRate !== null && isBetterIndicator(summary, accumulator)) {
        accumulator.bestIndicatorLabel = entry.label;
        accumulator.bestIndicatorTrades = summary.trades;
        accumulator.bestIndicatorWinRate = summary.winRate;
      }
    });
  }

  const families = FAMILY_ORDER.map((family) => buildFamilyRow(family, accumulators.get(family), sampleData.length));
  const trades = families.reduce((total, row) => total + row.trades, 0);
  const wins = families.reduce((total, row) => total + Math.round((row.winRate ?? 0) * row.trades / 100), 0);
  const ignoredSignals = families.reduce((total, row) => total + row.ignoredSignals, 0);
  const returnSum = families.reduce((total, row) => total + ((row.averageReturnPct ?? 0) * row.trades), 0);
  const topFamily = getTopFamily(families);
  const status = resolveDashboardStatus(sampleData.length, trades);

  return {
    averageReturnPct: trades > 0 ? roundMetric(returnSum / trades) : null,
    bars: countValidBars(data),
    caveat: resolveDashboardCaveat(status),
    evaluatedIndicators: families.reduce((total, row) => total + row.evaluatedIndicators, 0),
    families,
    ignoredSignals,
    maxSampleBars: MAX_BACKTEST_SAMPLE_BARS,
    minSampleBars: MIN_BACKTEST_SAMPLE_BARS,
    sampleBars: sampleData.length,
    status,
    topFamily,
    totalIndicators: inventory.length,
    trades,
    winRate: trades > 0 ? roundMetric((wins / trades) * 100) : null,
  };
};

const getBacktestSampleData = (data: readonly ChartDataPoint[]): ChartDataPoint[] =>
  data.filter(isValidChartDataPoint).slice(-MAX_BACKTEST_SAMPLE_BARS);

const isValidChartDataPoint = (point: ChartDataPoint): boolean =>
  isPositiveFinite(point.close)
  && isPositiveFinite(point.open)
  && isPositiveFinite(point.high)
  && isPositiveFinite(point.low)
  && Number.isFinite(point.volume);

const isPositiveFinite = (value: number): boolean => Number.isFinite(value) && value > 0;

const countValidBars = (data: readonly ChartDataPoint[]): number =>
  data.reduce((count, point) => count + (isValidChartDataPoint(point) ? 1 : 0), 0);

const createFamilyAccumulators = (): Map<IndicatorResearchFamily, FamilyAccumulator> =>
  new Map(FAMILY_ORDER.map((family) => [family, {
    bestIndicatorLabel: null,
    bestIndicatorTrades: 0,
    bestIndicatorWinRate: null,
    entries: 0,
    evaluatedIndicators: 0,
    ignoredSignals: 0,
    indicatorsWithSignals: 0,
    losses: 0,
    maxAdverseReturnPct: null,
    returnSum: 0,
    signalModels: new Set<string>(),
    trades: 0,
    wins: 0,
  }]));

const buildFamilyRow = (
  family: IndicatorResearchFamily,
  accumulator: FamilyAccumulator | undefined,
  sampleBars: number,
): IndicatorFamilyBacktestDashboardRow => {
  const source = accumulator ?? createFamilyAccumulators().get(family);
  const trades = source?.trades ?? 0;
  const status = resolveDashboardStatus(sampleBars, trades);

  return {
    averageReturnPct: trades > 0 && source ? roundMetric(source.returnSum / trades) : null,
    bestIndicatorLabel: source?.bestIndicatorLabel ?? null,
    bestIndicatorWinRate: source?.bestIndicatorWinRate ?? null,
    caveat: resolveFamilyCaveat(status, family),
    entries: source?.entries ?? 0,
    evaluatedIndicators: source?.evaluatedIndicators ?? 0,
    family,
    ignoredSignals: source?.ignoredSignals ?? 0,
    indicatorsWithSignals: source?.indicatorsWithSignals ?? 0,
    label: FAMILY_LABELS[family],
    maxAdverseReturnPct: source?.maxAdverseReturnPct ?? null,
    signalModels: [...(source?.signalModels ?? [])].sort(),
    status,
    trades,
    winRate: trades > 0 && source ? roundMetric((source.wins / trades) * 100) : null,
  };
};

const isBetterIndicator = (
  summary: { trades: number; winRate: number | null },
  accumulator: FamilyAccumulator,
): boolean => {
  if (summary.winRate === null || summary.trades <= 0) return false;
  if (accumulator.bestIndicatorWinRate === null) return true;
  if (summary.winRate !== accumulator.bestIndicatorWinRate) return summary.winRate > accumulator.bestIndicatorWinRate;
  return summary.trades > accumulator.bestIndicatorTrades;
};

const getTopFamily = (families: IndicatorFamilyBacktestDashboardRow[]): IndicatorFamilyBacktestDashboardRow | null =>
  families.reduce<IndicatorFamilyBacktestDashboardRow | null>((best, row) => {
    if (row.winRate === null || row.trades === 0) return best;
    if (!best || best.winRate === null) return row;
    if (row.winRate !== best.winRate) return row.winRate > best.winRate ? row : best;
    return row.trades > best.trades ? row : best;
  }, null);

const resolveDashboardStatus = (sampleBars: number, trades: number): IndicatorBacktestDashboardStatus => {
  if (sampleBars < MIN_BACKTEST_SAMPLE_BARS) return "insufficient-data";
  return trades > 0 ? "ready" : "no-trades";
};

const resolveDashboardCaveat = (status: IndicatorBacktestDashboardStatus): string => {
  if (status === "insufficient-data") return "Historique insuffisant pour valider les familles en walk-forward.";
  if (status === "no-trades") return "Aucun signal directionnel exploitable sur la fenetre courante.";
  return "Validation close-to-close sur signaux directionnels uniquement.";
};

const resolveFamilyCaveat = (status: IndicatorBacktestDashboardStatus, family: IndicatorResearchFamily): string => {
  if (status !== "ready") return resolveDashboardCaveat(status);
  if (family === "volatility") return "Volatilite pure neutre; seules les bandes concretisent une direction.";
  if (family === "volume-liquidity") return "Lecture a confirmer par liquidite et volume BRVM.";
  if (family === "candlestick-pattern" || family === "price-action") return "Patterns rares: confirmation obligatoire.";
  return "Backtest directionnel actif.";
};

const roundMetric = (value: number): number => Number(value.toFixed(4));
