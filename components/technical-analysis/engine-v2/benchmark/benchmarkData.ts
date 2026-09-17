import type { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";

const DEFAULT_CADENCE_MS = 24 * 60 * 60 * 1000;

const resolveCadenceMs = (bars: readonly ChartDataPoint[]): number => {
  const deltas: number[] = [];
  const sampleStart = Math.max(1, bars.length - 64);
  for (let index = sampleStart; index < bars.length; index += 1) {
    const previous = Date.parse(String(bars[index - 1]?.time ?? ""));
    const current = Date.parse(String(bars[index]?.time ?? ""));
    const delta = current - previous;
    if (Number.isFinite(delta) && delta > 0) deltas.push(delta);
  }
  if (deltas.length === 0) return DEFAULT_CADENCE_MS;
  deltas.sort((left, right) => left - right);
  return deltas[Math.floor(deltas.length / 2)] ?? DEFAULT_CADENCE_MS;
};

/**
 * Creates deterministic load tiers from the currently loaded AfriMarket series.
 * The price/volume shape stays sourced from real bars; only timestamps are extended
 * when the requested benchmark depth is larger than the available history.
 */
export const createBenchmarkDataset = (
  source: readonly ChartDataPoint[],
  targetCount: number,
): ChartDataPoint[] => {
  if (source.length === 0 || targetCount <= 0) return [];
  if (targetCount <= source.length) return source.slice(source.length - targetCount);

  const cadenceMs = resolveCadenceMs(source);
  const firstTimestamp = Date.parse(String(source[0]?.time ?? ""));
  const startTime = Number.isFinite(firstTimestamp) ? firstTimestamp : Date.now() - targetCount * cadenceMs;
  const result = new Array<ChartDataPoint>(targetCount);

  for (let index = 0; index < targetCount; index += 1) {
    const template = source[index % source.length];
    result[index] = {
      ...template,
      time: new Date(startTime + index * cadenceMs).toISOString(),
    };
  }

  return result;
};
