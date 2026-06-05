import {
  createFundamentalsProvenance,
  createUnavailableProvenance,
  type SidebarProvenance,
} from "./sidebarProvenance";

export interface BRVMFundamentalPoint {
  year: string;
  value: number;
  isEstimate?: boolean;
}

export interface BRVMDividendPoint extends BRVMFundamentalPoint {
  exDate?: string;
  payDate?: string;
}

export interface BRVMFundamentals {
  ticker: string;
  earnings: BRVMFundamentalPoint[];
  revenues: BRVMFundamentalPoint[];
  dividends: BRVMDividendPoint[];
  provenance: SidebarProvenance;
  fetchedAt?: string;
  description?: string;
  website?: string;
  employees?: string;
  source?: string;
}

export type FundamentalsStatus = "idle" | "loading" | "ready" | "error";

export function normalizeTicker(value: string | null | undefined): string {
  return (value || "").trim().toUpperCase();
}

export function createEmptyFundamentals(ticker: string): BRVMFundamentals {
  return {
    ticker: normalizeTicker(ticker),
    description: "",
    website: "",
    employees: "N/A",
    earnings: [],
    revenues: [],
    dividends: [],
    provenance: createUnavailableProvenance("Fondamentaux indisponibles"),
  };
}

export function normalizeFundamentalsResponse(payload: unknown, fallbackTicker: string): BRVMFundamentals {
  if (!isRecord(payload)) {
    return createEmptyFundamentals(fallbackTicker);
  }

  const source = readString(payload.source);

  return {
    ticker: normalizeTicker(readString(payload.ticker) || fallbackTicker),
    description: readString(payload.description),
    website: readString(payload.website),
    employees: readString(payload.employees) || "N/A",
    source,
    earnings: normalizeFundamentalSeries(payload.earnings),
    revenues: normalizeFundamentalSeries(payload.revenues),
    dividends: normalizeDividendSeries(payload.dividends),
    provenance: createFundamentalsProvenance(source),
    fetchedAt: new Date().toISOString(),
  };
}

export function isFundamentalsForTicker(
  fundamentals: BRVMFundamentals | null,
  ticker: string,
): fundamentals is BRVMFundamentals {
  return !!fundamentals && normalizeTicker(fundamentals.ticker) === normalizeTicker(ticker);
}

export function hasFinancialSeries(fundamentals: BRVMFundamentals | null): boolean {
  return Boolean(fundamentals && (fundamentals.earnings.length > 0 || fundamentals.revenues.length > 0));
}

function normalizeFundamentalSeries(value: unknown): BRVMFundamentalPoint[] {
  if (!Array.isArray(value)) return [];
  const rows: BRVMFundamentalPoint[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const year = readYear(entry.year);
    const pointValue = readNumber(entry.value);
    if (year && pointValue !== null) {
      rows.push({
        year,
        value: pointValue,
        isEstimate: entry.isEstimate === true,
      });
    }
  }

  return rows.sort((a, b) => Number(a.year) - Number(b.year));
}

function normalizeDividendSeries(value: unknown): BRVMDividendPoint[] {
  if (!Array.isArray(value)) return [];
  const rows: BRVMDividendPoint[] = [];

  for (const entry of value) {
    if (!isRecord(entry)) continue;

    const year = readYear(entry.year);
    const pointValue = readNumber(entry.value);
    if (year && pointValue !== null) {
      rows.push({
        year,
        value: pointValue,
        isEstimate: entry.isEstimate === true,
        exDate: readString(entry.exDate),
        payDate: readString(entry.payDate),
      });
    }
  }

  return rows.sort((a, b) => Number(a.year) - Number(b.year));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function readString(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.trim();
  return /^(n\/a|na|n\.d\.?|non disponible)$/i.test(text) ? "" : text;
}

function readYear(value: unknown): string {
  const text = typeof value === "number" ? String(value) : readString(value);
  const match = text.match(/\b(20\d{2})\b/);
  return match?.[1] || "";
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/[\s\xa0]/g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}
