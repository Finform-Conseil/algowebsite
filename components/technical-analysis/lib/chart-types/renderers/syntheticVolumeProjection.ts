import type { ChartDataPoint } from "../../Indicators/TechnicalIndicators";
import type { NormalizedRawBar, SourceMapEntry } from "../domain/types";

export interface SyntheticVolumeProjectionInput {
  sourceMaps: readonly SourceMapEntry[];
  renderDates: readonly string[];
  sourceBars: readonly NormalizedRawBar[];
}

const resolveFiniteVolume = (value: number | null | undefined): number =>
  Number.isFinite(value) && Number(value) > 0 ? Number(value) : 0;

const aggregateBars = (
  bars: readonly NormalizedRawBar[],
  fallback: NormalizedRawBar,
): Pick<ChartDataPoint, "open" | "high" | "low" | "close" | "volume"> => {
  if (bars.length === 0) {
    return {
      open: fallback.open,
      high: fallback.high,
      low: fallback.low,
      close: fallback.close,
      volume: resolveFiniteVolume(fallback.volume),
    };
  }

  let high = Number.NEGATIVE_INFINITY;
  let low = Number.POSITIVE_INFINITY;
  let volume = 0;
  for (const bar of bars) {
    high = Math.max(high, bar.high);
    low = Math.min(low, bar.low);
    volume += resolveFiniteVolume(bar.volume);
  }

  return {
    open: bars[0].open,
    high: Number.isFinite(high) ? high : fallback.high,
    low: Number.isFinite(low) ? low : fallback.low,
    close: bars[bars.length - 1].close,
    volume,
  };
};

/**
 * Projects real market volume onto a price-transformed chart axis without
 * inventing synthetic volume. Each source bar belongs to exactly one temporal
 * bucket. When one source timestamp creates several synthetic marks (Renko/Kagi),
 * that bucket is shared evenly so its volume is never double-counted.
 */
export const projectSyntheticVolumeToRenderedAxis = ({
  sourceMaps,
  renderDates,
  sourceBars,
}: SyntheticVolumeProjectionInput): ChartDataPoint[] => {
  if (sourceMaps.length === 0 || renderDates.length !== sourceMaps.length || sourceBars.length === 0) return [];

  const sortedBars = [...sourceBars].sort((left, right) => left.sourceIndex - right.sourceIndex);
  const barsBySourceIndex = new Map(sortedBars.map((bar) => [bar.sourceIndex, bar]));
  const finalSourceIndex = sortedBars[sortedBars.length - 1].sourceIndex;
  const endpointMultiplicity = new Map<number, number>();
  for (const sourceMap of sourceMaps) {
    const endpoint = Math.max(sourceMap.sourceStartIndex, sourceMap.sourceEndIndex);
    endpointMultiplicity.set(endpoint, (endpointMultiplicity.get(endpoint) ?? 0) + 1);
  }

  const bucketByEndpoint = new Map<number, Pick<ChartDataPoint, "open" | "high" | "low" | "close" | "volume">>();
  let previousEndpoint = sortedBars[0].sourceIndex - 1;
  const uniqueEndpoints = [...endpointMultiplicity.keys()].sort((left, right) => left - right);

  uniqueEndpoints.forEach((endpoint, endpointIndex) => {
    const effectiveEndpoint = endpointIndex === uniqueEndpoints.length - 1
      ? Math.max(endpoint, finalSourceIndex)
      : endpoint;
    const fallback = barsBySourceIndex.get(endpoint)
      ?? [...sortedBars].reverse().find((bar) => bar.sourceIndex <= endpoint)
      ?? sortedBars[0];
    const bucketBars = sortedBars.filter(
      (bar) => bar.sourceIndex > previousEndpoint && bar.sourceIndex <= effectiveEndpoint,
    );
    bucketByEndpoint.set(endpoint, aggregateBars(bucketBars, fallback));
    previousEndpoint = Math.max(previousEndpoint, effectiveEndpoint);
  });

  return sourceMaps.map((sourceMap, index) => {
    const endpoint = Math.max(sourceMap.sourceStartIndex, sourceMap.sourceEndIndex);
    const bucket = bucketByEndpoint.get(endpoint);
    const fallback = barsBySourceIndex.get(endpoint)
      ?? [...sortedBars].reverse().find((bar) => bar.sourceIndex <= endpoint)
      ?? sortedBars[0];
    const aggregate = bucket ?? aggregateBars([], fallback);
    const shareCount = Math.max(1, endpointMultiplicity.get(endpoint) ?? 1);

    return {
      time: renderDates[index],
      open: aggregate.open,
      high: aggregate.high,
      low: aggregate.low,
      close: aggregate.close,
      volume: aggregate.volume / shareCount,
    };
  });
};
