export const REALTIME_ENRICHMENT_DELAY_MS = 8_000;
export const REALTIME_ENRICHMENT_TIMEOUT_MS = 90_000;

export const scheduleRealtimeEnrichment = (task: () => void): (() => void) => {
  const timeoutId = window.setTimeout(task, REALTIME_ENRICHMENT_DELAY_MS);
  return () => window.clearTimeout(timeoutId);
};
