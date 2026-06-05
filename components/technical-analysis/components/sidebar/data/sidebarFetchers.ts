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

export async function fetchSidebarFundamentals(
  ticker: string,
  signal: AbortSignal,
): Promise<BRVMFundamentals> {
  const normalizedTicker = normalizeTicker(ticker);
  const cacheBuster = `&_t=${Date.now()}`;
  const data = await fetchJson(
    `/api/market-data/brvm-fundamentals?ticker=${encodeURIComponent(normalizedTicker)}${cacheBuster}`,
    signal,
    { cache: "no-store" },
  );
  const normalized = normalizeFundamentalsResponse(data, normalizedTicker);

  if (normalizeTicker(normalized.ticker) !== normalizedTicker) {
    throw new Error(`Ticker mismatch: requested ${normalizedTicker}, received ${normalized.ticker || "empty"}`);
  }

  return normalized;
}

export async function fetchSidebarIndices(signal: AbortSignal): Promise<Record<string, BRVMIndexData>> {
  const data = await fetchJson("/api/market-data/indices", signal);
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
  const data = await fetchJson("/api/market-data/brvm-news", signal);
  if (!Array.isArray(data)) return [];
  return data.flatMap((item) => {
    const newsItem = normalizeNewsItem(item);
    return newsItem ? [newsItem] : [];
  });
}

export async function fetchSidebarBonds(signal: AbortSignal): Promise<BRVMBond[]> {
  const data = await fetchJson("/api/market-data/brvm-bonds", signal);
  if (!isRecord(data) || !Array.isArray(data.bonds)) return [];
  return data.bonds.flatMap((item) => {
    const bond = normalizeBond(item);
    return bond ? [bond] : [];
  });
}

async function fetchJson(path: string, signal: AbortSignal, init?: RequestInit): Promise<unknown> {
  const requestInit: RequestInit = init ? { ...init, signal } : { signal };
  const response = await fetch(path, requestInit);
  if (!response.ok) throw new Error(`HTTP error ${response.status}`);
  return response.json() as Promise<unknown>;
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
