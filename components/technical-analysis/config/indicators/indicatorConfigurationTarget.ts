import {
  ADVANCED_INDICATOR_REGISTRY_ENTRIES,
  type AdvancedIndicatorId,
} from "./indicatorRegistry";
import {
  ADVANCED_MOVING_AVERAGE_SPECS,
  getAdvancedMovingAverageSeriesId,
  type AdvancedMovingAverageSpec,
} from "./advancedMovingAverageSeries";
import type { BackendIndicatorItem, CompositeIndicatorSpec } from "./indicatorModalRegistry";

export type IndicatorConfigurationTargetKind = "sma" | "ema" | "rsi" | "bollinger" | "volume" | "advanced";

export interface IndicatorConfigurationTarget {
  id: string;
  label: string;
  kind: IndicatorConfigurationTargetKind;
  wiredId?: AdvancedIndicatorId | string;
  period?: number;
  seriesId?: string;
}

const stripSeriesSuffix = (value: string): string => value.trim().toLowerCase().replace(/-series$/, "");

const targetForRegistryEntry = (
  entry: typeof ADVANCED_INDICATOR_REGISTRY_ENTRIES[number],
  seriesId?: string,
): IndicatorConfigurationTarget => ({
  id: entry.id,
  label: entry.label,
  kind: entry.id === "rsi" ? "rsi" : entry.id === "bollinger" ? "bollinger" : "advanced",
  wiredId: entry.stateId,
  seriesId,
});

export const createMovingAverageConfigurationTarget = (
  family: "sma" | "ema",
  period: number,
): IndicatorConfigurationTarget => ({
  id: `${family}-${period}`,
  label: `${family.toUpperCase()} ${period}`,
  kind: family,
  period,
  seriesId: `${family}-${period}`,
});

export const createVolumeConfigurationTarget = (): IndicatorConfigurationTarget => ({
  id: "volume",
  label: "Volume",
  kind: "volume",
  seriesId: "volume-bar",
});

export const createAdvancedMovingAverageConfigurationTarget = (
  spec: AdvancedMovingAverageSpec,
): IndicatorConfigurationTarget => ({
  id: spec.id,
  label: spec.label,
  kind: "advanced",
  wiredId: spec.id,
  period: spec.period,
  seriesId: getAdvancedMovingAverageSeriesId(spec.family, spec.period),
});

export const createCatalogConfigurationTarget = (
  item: BackendIndicatorItem,
): IndicatorConfigurationTarget => {
  const rsiMatch = /^rsi_(9|14|25)$/.exec(item.key);
  if (rsiMatch) {
    return {
      id: item.key,
      label: item.name,
      kind: "rsi",
      period: Number(rsiMatch[1]),
      wiredId: item.wiredId,
    };
  }

  const entry = ADVANCED_INDICATOR_REGISTRY_ENTRIES.find((candidate) =>
    candidate.catalogKeys.includes(item.key),
  );
  if (!entry) return { id: item.key, label: item.name, kind: "advanced", wiredId: item.wiredId };
  return { ...targetForRegistryEntry(entry), id: item.key, label: item.name };
};

export const createCompositeConfigurationTarget = (
  spec: CompositeIndicatorSpec,
): IndicatorConfigurationTarget => {
  const entry = ADVANCED_INDICATOR_REGISTRY_ENTRIES.find((candidate) => candidate.id === spec.wiredId);
  if (!entry) return { id: spec.id, label: spec.title, kind: "advanced", wiredId: spec.wiredId };
  return { ...targetForRegistryEntry(entry), id: spec.id, label: spec.title };
};

export const resolveIndicatorConfigurationTargetFromSeries = (
  seriesId: unknown,
  seriesName?: unknown,
): IndicatorConfigurationTarget | null => {
  const rawId = typeof seriesId === "string" ? seriesId : "";
  const normalizedId = stripSeriesSuffix(rawId);
  const normalizedName = typeof seriesName === "string" ? seriesName.trim().toLowerCase() : "";

  if (normalizedId === "volume-bar" || normalizedId === "volume" || normalizedName === "volume") {
    return createVolumeConfigurationTarget();
  }

  const movingAverageMatch = /^(sma|ema)-(\d+)$/.exec(normalizedId);
  if (movingAverageMatch) {
    return createMovingAverageConfigurationTarget(
      movingAverageMatch[1] as "sma" | "ema",
      Number(movingAverageMatch[2]),
    );
  }

  const advancedMovingAverage = ADVANCED_MOVING_AVERAGE_SPECS.find((spec) =>
    getAdvancedMovingAverageSeriesId(spec.family, spec.period) === normalizedId,
  );
  if (advancedMovingAverage) {
    return {
      id: advancedMovingAverage.id,
      label: advancedMovingAverage.label,
      kind: "advanced",
      wiredId: advancedMovingAverage.id,
      period: advancedMovingAverage.period,
      seriesId: rawId,
    };
  }

  const entry = ADVANCED_INDICATOR_REGISTRY_ENTRIES.find((candidate) => {
    const ids = [candidate.id, candidate.key, ...candidate.objectTreeIds, ...candidate.children.map((child) => child.id)]
      .map(stripSeriesSuffix);
    return ids.includes(normalizedId) || ids.includes(normalizedName);
  });
  return entry ? targetForRegistryEntry(entry, rawId) : null;
};
