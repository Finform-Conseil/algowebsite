import type { AlertEvaluation, AlertsRailContext, BrvmAlert, IndicatorAlertValue } from "./alertsRailTypes";

export const evaluateAlert = (alert: BrvmAlert, context: AlertsRailContext): AlertEvaluation => {
  const threshold = alert.threshold;
  if (alert.condition === "price_crossing") {
    const current = context.currentPrice;
    return buildNumericEvaluation(
      hasCrossedThreshold(alert.lastObservedValue, current, threshold),
      current,
      "prix",
      alert,
    );
  }
  if (alert.condition === "price_above") {
    const current = context.currentPrice;
    return buildNumericEvaluation(current !== null && threshold !== null && current >= threshold, current, "prix", alert);
  }
  if (alert.condition === "price_below") {
    const current = context.currentPrice;
    return buildNumericEvaluation(current !== null && threshold !== null && current <= threshold, current, "prix", alert);
  }
  if (alert.condition === "change_at_least") {
    const current = context.changePercent;
    return buildNumericEvaluation(current !== null && threshold !== null && current >= threshold, current, "variation", alert);
  }
  if (alert.condition === "volume_ratio_at_least") {
    const current = context.volumeRatio;
    return buildNumericEvaluation(current !== null && threshold !== null && current >= threshold, current, "volume", alert);
  }
  if (alert.type === "indicator") {
    return evaluateIndicatorAlert(alert, context);
  }
  if (alert.condition === "dividend_available") {
    return {
      matched: context.hasDividend,
      metricLabel: context.dividendLabel,
      observedValue: null,
      signature: `dividend:${context.hasDividend}:${context.dividendLabel}`,
    };
  }
  return {
    matched: context.hasNews,
    metricLabel: context.newsLabel,
    observedValue: null,
    signature: `news:${context.hasNews}:${context.newsLabel}`,
  };
};

const evaluateIndicatorAlert = (alert: BrvmAlert, context: AlertsRailContext): AlertEvaluation => {
  const target = alert.indicator;
  const threshold = alert.threshold;
  const indicatorValue = target ? context.indicatorValuesByKey?.[target.key] : undefined;
  const current = readIndicatorValue(indicatorValue);
  const previous = readPreviousIndicatorValue(indicatorValue, alert.lastObservedValue);
  const label = target?.label || "indicateur";

  if (threshold === null || current === null) {
    return buildIndicatorEvaluation(false, current, label, alert);
  }
  if (alert.condition === "indicator_above") {
    return buildIndicatorEvaluation(current >= threshold, current, label, alert);
  }
  if (alert.condition === "indicator_below") {
    return buildIndicatorEvaluation(current <= threshold, current, label, alert);
  }
  if (alert.condition === "indicator_cross_above") {
    return buildIndicatorEvaluation(hasCrossedAbove(previous, current, threshold), current, label, alert);
  }
  if (alert.condition === "indicator_cross_below") {
    return buildIndicatorEvaluation(hasCrossedBelow(previous, current, threshold), current, label, alert);
  }
  return buildIndicatorEvaluation(false, current, label, alert);
};

const readIndicatorValue = (value: IndicatorAlertValue | undefined): number | null => (
  typeof value?.value === "number" && Number.isFinite(value.value) ? value.value : null
);

const readPreviousIndicatorValue = (
  value: IndicatorAlertValue | undefined,
  fallback: number | null,
): number | null => {
  if (typeof value?.previousValue === "number" && Number.isFinite(value.previousValue)) return value.previousValue;
  return typeof fallback === "number" && Number.isFinite(fallback) ? fallback : null;
};

const hasCrossedThreshold = (
  previous: number | null,
  current: number | null,
  threshold: number | null,
) => {
  if (previous === null || current === null || threshold === null) return false;
  if (previous === threshold && current !== threshold) return true;
  return (previous < threshold && current >= threshold) || (previous > threshold && current <= threshold);
};

const hasCrossedAbove = (previous: number | null, current: number | null, threshold: number | null): boolean => {
  if (previous === null || current === null || threshold === null) return false;
  return previous < threshold && current >= threshold;
};

const hasCrossedBelow = (previous: number | null, current: number | null, threshold: number | null): boolean => {
  if (previous === null || current === null || threshold === null) return false;
  return previous > threshold && current <= threshold;
};

const buildNumericEvaluation = (
  matched: boolean,
  current: number | null,
  name: string,
  alert: BrvmAlert,
): AlertEvaluation => ({
  matched,
  metricLabel: current === null ? `${name} indisponible` : `${name} ${formatAlertValue(current)}`,
  observedValue: current,
  signature: `${alert.id}:${alert.condition}:${alert.threshold}:${current ?? "na"}`,
});

const buildIndicatorEvaluation = (
  matched: boolean,
  current: number | null,
  label: string,
  alert: BrvmAlert,
): AlertEvaluation => ({
  matched,
  metricLabel: current === null ? `${label} indisponible` : `${label} ${formatAlertValue(current)}`,
  observedValue: current,
  signature: `${alert.id}:${alert.condition}:${alert.indicator?.key ?? "indicator"}:${alert.threshold}:${current ?? "na"}`,
});

const formatAlertValue = (value: number): string => value.toLocaleString("fr-FR", { maximumFractionDigits: 4 });
