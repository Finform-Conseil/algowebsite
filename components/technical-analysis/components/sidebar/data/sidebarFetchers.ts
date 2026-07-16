import {
  normalizeFundamentalsResponse,
  normalizeTicker,
  type BRVMFundamentals,
} from "./sidebarFundamentals";

export interface BRVMNewsItem {
  title: string;
  date: string;
  link: string;
}

export interface BRVMBond {
  name: string;
  maturityDate: string;
  ytm: number;
}

export interface BRVMIndexData {
  symbol: string;
  name: string;
  price: number;
  variation: string;
  timestamp: string;
}

const SIDEBAR_FETCH_RETRY_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const SIDEBAR_FETCH_RETRY_BASE_DELAY_MS = 750;
const SIDEBAR_DEFAULT_FETCH_TIMEOUT_MS = 24_000;
const SIDEBAR_FUNDAMENTALS_FETCH_TIMEOUT_MS = 45_000;

interface SidebarFetchJsonOptions extends RequestInit {
  retryCount?: number;
  retryBaseDelayMs?: number;
  timeoutMs?: number;
}

export async function fetchSidebarFundamentals(
  ticker: string,
  signal: AbortSignal,
): Promise<BRVMFundamentals> {
  const normalizedTicker = normalizeTicker(ticker);
  const cacheBuster = `&_t=${Date.now()}`;
  const data = await fetchJson(
    `/api/market-data/brvm-fundamentals?ticker=${encodeURIComponent(normalizedTicker)}${cacheBuster}`,
    signal,
    {
      cache: "no-store",
      retryCount: 0,
      timeoutMs: SIDEBAR_FUNDAMENTALS_FETCH_TIMEOUT_MS,
    },
  );
  const normalized = normalizeFundamentalsResponse(data, normalizedTicker);

  if (normalizeTicker(normalized.ticker) !== normalizedTicker) {
    throw new Error(`Ticker mismatch: requested ${normalizedTicker}, received ${normalized.ticker || "empty"}`);
  }

  return normalized;
}

export async function fetchSidebarIndices(signal: AbortSignal): Promise<Record<string, BRVMIndexData>> {
  const data = await fetchJson("/api/market-data/indices", signal, { retryCount: 1 });
  if (!isRecord(data)) return {};

  const indices: Record<string, BRVMIndexData> = {};
  for (const [key, value] of Object.entries(data)) {
    if (isRecord(value)) {
      const indexData = normalizeIndexData(value);
      if (indexData) indices[key] = indexData;
    }
  }
  return indices;
}

export async function fetchSidebarNews(signal: AbortSignal): Promise<BRVMNewsItem[]> {
  const data = await fetchJson("/api/market-data/brvm-news", signal, { retryCount: 1 });
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const newsItem = normalizeNewsItem(item);
    return newsItem ? [newsItem] : [];
  });
}

export async function fetchSidebarBonds(signal: AbortSignal): Promise<BRVMBond[]> {
  const data = await fetchJson("/api/market-data/brvm-bonds", signal, { retryCount: 1 });
  if (!isRecord(data) || !Array.isArray(data.bonds)) return [];
  return data.bonds.flatMap((item) => {
    const bond = normalizeBond(item);
    return bond ? [bond] : [];
  });
}

async function fetchJson(
  path: string,
  signal: AbortSignal,
  options: SidebarFetchJsonOptions = {},
): Promise<unknown> {
  const {
    retryBaseDelayMs = SIDEBAR_FETCH_RETRY_BASE_DELAY_MS,
    retryCount = 0,
    timeoutMs = SIDEBAR_DEFAULT_FETCH_TIMEOUT_MS,
    ...init
  } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController();
    const releaseParentAbort = linkAbortSignal(signal, controller);
    const timeoutId = window.setTimeout(() => {
      abortOnce(controller, new Error(`Sidebar fetch timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    try {
      const response = await fetch(path, { ...init, signal: controller.signal });
      if (!response.ok) {
        const error = new Error(`HTTP error ${response.status}`);
        if (attempt < retryCount && SIDEBAR_FETCH_RETRY_STATUSES.has(response.status)) {
          lastError = error;
          await waitForRetry(retryBaseDelayMs * (attempt + 1), signal);
          continue;
        }
        throw error;
      }

      return response.json() as Promise<unknown>;
    } catch (error) {
      lastError = error;
      if (signal.aborted || attempt >= retryCount || !isRetryableFetchError(error)) {
        throw error;
      }
      await waitForRetry(retryBaseDelayMs * (attempt + 1), signal);
    } finally {
      window.clearTimeout(timeoutId);
      releaseParentAbort();
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Sidebar fetch failed");
}

function linkAbortSignal(source: AbortSignal, target: AbortController): () => void {
  if (source.aborted) {
    abortOnce(target, source.reason);
    return () => undefined;
  }

  const abortTarget = () => abortOnce(target, source.reason);
  source.addEventListener("abort", abortTarget, { once: true });
  return () => source.removeEventListener("abort", abortTarget);
}

function abortOnce(controller: AbortController, reason?: unknown) {
  if (!controller.signal.aborted) controller.abort(reason);
}

function waitForRetry(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(signal.reason);

  return new Promise((resolve, reject) => {
    let timeoutId = 0;
    const abortRetry = () => {
      cleanup();
      reject(signal.reason);
    };
    const cleanup = () => {
      window.clearTimeout(timeoutId);
      signal.removeEventListener("abort", abortRetry);
    };

    timeoutId = window.setTimeout(() => {
      cleanup();
      resolve();
    }, ms);
    signal.addEventListener("abort", abortRetry, { once: true });
  });
}

function isRetryableFetchError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (!(error instanceof Error)) return false;
  return /network|fetch|timeout|aborted|failed/i.test(error.message);
}

function normalizeNewsItem(value: unknown): BRVMNewsItem | null {
  if (!isRecord(value)) return null;

  const title = readString(value.title);
  const date = readString(value.date);
  const link = readString(value.link);
  if (!title || !date || !isVerifiedHttpUrl(link)) return null;

  return { title, date, link };
}

function normalizeBond(value: unknown): BRVMBond | null {
  if (!isRecord(value)) return null;

  const name = readString(value.name);
  const maturityDate = readString(value.maturityDate);
  const ytm = readFiniteNumber(value.ytm);
  if (!name || !maturityDate || ytm === null) return null;

  return { name, maturityDate, ytm };
}

function normalizeIndexData(value: Record<string, unknown>): BRVMIndexData | null {
  const symbol = readString(value.symbol);
  const name = readString(value.name);
  const price = readFiniteNumber(value.price);
  const variation = readString(value.variation);
  const timestamp = readString(value.timestamp);

  if (!symbol || !name || price === null || !variation || !timestamp) return null;
  return { symbol, name, price, variation, timestamp };
}

function isVerifiedHttpUrl(value: string): boolean {
  if (!value || value === "#") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}
