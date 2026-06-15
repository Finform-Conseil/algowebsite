import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { isIndicatorRuntimeAlertInventoryId } from "./indicatorRuntimeAlertCatalog";
import type { IndicatorResearchFamily, IndicatorResearchInventoryEntry } from "./indicatorResearchGradeTypes";

export type IndicatorAlertRoute =
  | "legacy-price-modal"
  | "right-rail-volume"
  | "indicator-runtime"
  | "indicator-engine-required"
  | "not-alertable";
export type IndicatorAlertCondition =
  | "GREATER_THAN"
  | "LESS_THAN"
  | "CROSS_ABOVE"
  | "CROSS_BELOW"
  | "STATE_TRUE"
  | "VOLUME_RATIO_AT_LEAST";
export type IndicatorSignalDirection = "bullish" | "bearish" | "neutral";

export { buildIndicatorFamilyBacktestSignals, getIndicatorFamilyBacktestStrategy, type IndicatorFamilyBacktestStrategy } from "./indicatorFamilyBacktestSignals";

export interface IndicatorAlertTemplate {
  route: IndicatorAlertRoute;
  condition: IndicatorAlertCondition | null;
  metric: "price" | "indicator" | "volume-ratio" | "event" | "none";
  defaultThreshold: number | null;
  requiresConfirmation: boolean;
  reason: string;
}

export interface IndicatorBacktestPolicy {
  enabled: boolean;
  horizonBars: number;
  minTrades: number;
  cooldownBars: number;
  maxSignals: number;
  rejectsSparseLiquidity: boolean;
  reason: string;
}

export interface IndicatorBacktestSignal {
  index: number;
  direction: IndicatorSignalDirection;
  triggerPrice?: number | null;
  label?: string;
}

export interface IndicatorBacktestSummary {
  trades: number;
  wins: number;
  losses: number;
  ignored: number;
  winRate: number | null;
  averageReturnPct: number | null;
  maxAdverseReturnPct: number | null;
}

const FAMILY_ALERT_TEMPLATES: Record<IndicatorResearchFamily, IndicatorAlertTemplate> = {
  "moving-average": buildAlert(
    "legacy-price-modal",
    "CROSS_ABOVE",
    "price",
    null,
    false,
    "Alert when price crosses the moving average level.",
  ),
  "trend-signal": buildAlert(
    "legacy-price-modal",
    "GREATER_THAN",
    "price",
    null,
    true,
    "Alert on confirmed price regime above or below the source average.",
  ),
  "price-vs-average": buildAlert(
    "legacy-price-modal",
    "GREATER_THAN",
    "price",
    null,
    true,
    "Alert on price reclaiming or losing the selected moving average.",
  ),
  oscillator: buildAlert(
    "indicator-engine-required",
    "CROSS_ABOVE",
    "indicator",
    50,
    true,
    "Oscillator alerts need indicator-value thresholds, not price-only alerts.",
  ),
  trend: buildAlert(
    "indicator-engine-required",
    "CROSS_ABOVE",
    "indicator",
    0,
    true,
    "Trend alerts need a regime or zero-line indicator condition.",
  ),
  volatility: buildAlert(
    "indicator-engine-required",
    "STATE_TRUE",
    "indicator",
    null,
    true,
    "Volatility alerts need derived context rather than a raw price threshold.",
  ),
  "volume-liquidity": buildAlert(
    "right-rail-volume",
    "VOLUME_RATIO_AT_LEAST",
    "volume-ratio",
    2,
    true,
    "Volume/liquidity alerts should trigger on volume ratio with BRVM liquidity context.",
  ),
  "support-resistance": buildAlert(
    "legacy-price-modal",
    "CROSS_ABOVE",
    "price",
    null,
    true,
    "Support/resistance alerts map to price crossing a computed level.",
  ),
  "price-action": buildAlert(
    "legacy-price-modal",
    "GREATER_THAN",
    "price",
    null,
    true,
    "Price-action alerts map to confirmation above or below the triggering candle.",
  ),
  "candlestick-pattern": buildAlert(
    "legacy-price-modal",
    "GREATER_THAN",
    "price",
    null,
    true,
    "Candlestick alerts map to a confirmation price, not the pattern label itself.",
  ),
};

export const getIndicatorAlertTemplate = (
  entry: Pick<IndicatorResearchInventoryEntry, "id" | "policy">,
): IndicatorAlertTemplate => {
  if (isIndicatorRuntimeAlertInventoryId(entry.id)) return buildRuntimeAlert(entry.policy.family);
  return FAMILY_ALERT_TEMPLATES[entry.policy.family];
};

export const getIndicatorBacktestPolicy = (
  entry: Pick<IndicatorResearchInventoryEntry, "id" | "policy">,
): IndicatorBacktestPolicy => {
  const template = getIndicatorAlertTemplate(entry);
  if (template.route === "not-alertable") {
    return buildBacktest(false, 0, 0, 0, 0, false, "Indicator is not alertable.");
  }

  const shortHorizon = entry.policy.family === "candlestick-pattern" || entry.policy.family === "price-action";
  const horizonBars = shortHorizon ? 5 : 20;
  const cooldownBars = entry.policy.visualDensity === "sparse-capped" ? 3 : 1;
  const minTrades = entry.policy.family === "candlestick-pattern" ? 5 : 10;
  return buildBacktest(
    true,
    horizonBars,
    minTrades,
    cooldownBars,
    500,
    entry.policy.requiresLiquidityContext,
    "Walk-forward close-to-close validation for signal direction.",
  );
};

export const summarizeIndicatorBacktest = (
  data: ChartDataPoint[],
  signals: IndicatorBacktestSignal[],
  policy: IndicatorBacktestPolicy,
): IndicatorBacktestSummary => {
  if (!policy.enabled || data.length === 0 || signals.length === 0) return emptySummary(signals.length);

  let lastAcceptedIndex = -Infinity;
  let ignored = 0;
  const returns: number[] = [];
  const sortedSignals = [...signals].sort((a, b) => a.index - b.index).slice(0, policy.maxSignals);

  for (const signal of sortedSignals) {
    if (signal.direction === "neutral" || signal.index <= lastAcceptedIndex + policy.cooldownBars) {
      ignored += 1;
      continue;
    }

    const entry = resolveEntryPrice(data, signal);
    const exit = resolveExitPrice(data, signal.index + policy.horizonBars);
    if (entry === null || exit === null) {
      ignored += 1;
      continue;
    }

    const directionMultiplier = signal.direction === "bearish" ? -1 : 1;
    returns.push(roundMetric(((exit - entry) / entry) * 100 * directionMultiplier));
    lastAcceptedIndex = signal.index;
  }

  if (returns.length === 0) return emptySummary(ignored);

  const wins = returns.filter((value) => value > 0).length;
  const average = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  return {
    trades: returns.length,
    wins,
    losses: returns.length - wins,
    ignored,
    winRate: roundMetric((wins / returns.length) * 100),
    averageReturnPct: roundMetric(average),
    maxAdverseReturnPct: Math.min(...returns),
  };
};

function buildRuntimeAlert(family: IndicatorResearchFamily): IndicatorAlertTemplate {
  if (family === "oscillator") {
    return buildAlert(
      "indicator-runtime",
      "CROSS_ABOVE",
      "indicator",
      50,
      true,
      "Runtime scalar indicator value is available from the alert rail and daily supplemental context.",
    );
  }

  if (family === "trend") {
    return buildAlert(
      "indicator-runtime",
      "CROSS_ABOVE",
      "indicator",
      0,
      true,
      "Runtime trend indicator value is available from the alert rail and daily supplemental context.",
    );
  }

  return buildAlert(
    "indicator-runtime",
    "GREATER_THAN",
    "indicator",
    null,
    true,
    "Runtime derived indicator value is available from the alert rail and daily supplemental context.",
  );
}

function buildAlert(
  route: IndicatorAlertRoute,
  condition: IndicatorAlertCondition | null,
  metric: IndicatorAlertTemplate["metric"],
  defaultThreshold: number | null,
  requiresConfirmation: boolean,
  reason: string,
): IndicatorAlertTemplate {
  return { route, condition, metric, defaultThreshold, requiresConfirmation, reason };
}

function buildBacktest(
  enabled: boolean,
  horizonBars: number,
  minTrades: number,
  cooldownBars: number,
  maxSignals: number,
  rejectsSparseLiquidity: boolean,
  reason: string,
): IndicatorBacktestPolicy {
  return { enabled, horizonBars, minTrades, cooldownBars, maxSignals, rejectsSparseLiquidity, reason };
}

function resolveEntryPrice(data: ChartDataPoint[], signal: IndicatorBacktestSignal): number | null {
  if (typeof signal.triggerPrice === "number" && Number.isFinite(signal.triggerPrice) && signal.triggerPrice > 0) {
    return signal.triggerPrice;
  }
  return resolveExitPrice(data, signal.index);
}

function resolveExitPrice(data: ChartDataPoint[], index: number): number | null {
  const value = data[index]?.close;
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function emptySummary(ignored: number): IndicatorBacktestSummary {
  return {
    trades: 0,
    wins: 0,
    losses: 0,
    ignored,
    winRate: null,
    averageReturnPct: null,
    maxAdverseReturnPct: null,
  };
}

function roundMetric(value: number): number {
  return Number(value.toFixed(4));
}
