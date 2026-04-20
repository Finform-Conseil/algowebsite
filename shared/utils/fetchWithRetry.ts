/**
 * [TENOR 2026] fetchWithRetry - HDR Grade Resilient Fetcher
 * Optimized for High-Performance Proxy & Market Data retrieval.
 */

interface FetchRetryOptions extends RequestInit {
  retries?: number;
  backoff?: number;
  timeout?: number;
}

/**
 * Executes a fetch request with exponential backoff and timeout handling.
 */
export async function fetchWithRetry(
  url: string | URL,
  options: FetchRetryOptions = {}
): Promise<Response> {
  const {
    retries = 3,
    backoff = 500,
    timeout = 10000,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      if (attempt > 0) {
        const delay = Math.pow(2, attempt - 1) * backoff;
        await new Promise((resolve) => setTimeout(resolve, delay));
        console.warn(`[RETRY] Attempt ${attempt}/${retries} for ${url}`);
      }

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(id);

      // Retry on specific status codes (5xx and 429)
      if (!response.ok && (response.status >= 500 || response.status === 429)) {
        if (attempt === retries) return response;
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(id);
      lastError = err;

      if (err.name === 'AbortError') {
        console.warn(`[FETCH] Timeout on ${url} after ${timeout}ms`);
      } else {
        console.warn(`[FETCH] Error on ${url}: ${err.message}`);
      }

      if (attempt === retries) throw err;
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${retries} retries`);
}
