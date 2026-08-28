export interface PresetReadRetryOptions {
  maxAttempts?: number;
  delaysMs?: readonly number[];
  sleep?: (delayMs: number) => Promise<void>;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_DELAYS_MS = [180, 520] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

export const shouldRetryPresetRead = (error: unknown): boolean => {
  if (!isRecord(error)) return false;
  const status = error.status;
  if (typeof status === "number") return status >= 500 && status <= 599;
  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") return true;
  const originalStatus = error.originalStatus;
  return typeof originalStatus === "number" && originalStatus >= 500 && originalStatus <= 599;
};

const defaultSleep = (delayMs: number): Promise<void> =>
  new Promise((resolve) => window.setTimeout(resolve, delayMs));

export const readPresetWithBoundedRetry = async <T>(
  operation: (attempt: number) => Promise<T>,
  options: PresetReadRetryOptions = {},
): Promise<T> => {
  const maxAttempts = Math.max(1, Math.min(5, Math.trunc(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)));
  const delaysMs = options.delaysMs ?? DEFAULT_DELAYS_MS;
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;
      if (attempt >= maxAttempts || !shouldRetryPresetRead(error)) throw error;
      const delayMs = Math.max(0, Math.trunc(delaysMs[Math.min(attempt - 1, delaysMs.length - 1)] ?? 0));
      if (delayMs > 0) await sleep(delayMs);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Preset read failed after bounded retries.");
};
