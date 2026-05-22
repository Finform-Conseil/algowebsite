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
  description?: string;
  website?: string;
  employees?: string;
  source?: string;
}

export type FundamentalsStatus = "idle" | "loading" | "ready" | "error";

export interface AuditTrailItem {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success";
}

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
  };
}

export function normalizeFundamentalsResponse(payload: unknown, fallbackTicker: string): BRVMFundamentals {
  if (!isRecord(payload)) {
    return createEmptyFundamentals(fallbackTicker);
  }

  return {
    ticker: normalizeTicker(readString(payload.ticker) || fallbackTicker),
    description: readString(payload.description),
    website: readString(payload.website),
    employees: readString(payload.employees) || "N/A",
    source: readString(payload.source),
    earnings: normalizeFundamentalSeries(payload.earnings),
    revenues: normalizeFundamentalSeries(payload.revenues),
    dividends: normalizeDividendSeries(payload.dividends),
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

export function getLatestFundamentalValue(rows: BRVMFundamentalPoint[] | undefined): number | null {
  if (!rows || rows.length === 0) return null;
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index]?.value;
    if (Number.isFinite(value)) return value;
  }
  return null;
}

export function formatMillionsFcfa(value: number | null | undefined): string {
  if (!Number.isFinite(value)) return "N/D";
  const safeValue = Number(value);
  if (Math.abs(safeValue) >= 1000) {
    return `${(safeValue / 1000).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} B FCFA`;
  }
  return `${safeValue.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M FCFA`;
}

export function formatAuditDate(value: string | number | Date | null | undefined): string {
  if (!value) return "N/D";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "N/D";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getLatestSeriesTime<T extends { time: string }>(rows: T[]): string | null {
  return rows.length > 0 ? rows[rows.length - 1].time : null;
}

export function getLatestFinancialYear(fundamentals: BRVMFundamentals | null): string {
  const years = [
    ...(fundamentals?.earnings || []).map((row) => row.year),
    ...(fundamentals?.revenues || []).map((row) => row.year),
    ...(fundamentals?.dividends || []).map((row) => row.year),
  ];
  return years.length > 0 ? years.sort((a, b) => Number(b) - Number(a))[0] : "N/D";
}

export function getLatestNumericValue(rows: (number | string)[]): number | null {
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const value = rows[index];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}

export function getVerifiedSourceLabel(source: string | null | undefined): string {
  if (!source) return "Catalogue BRVM local";
  try {
    const url = new URL(source);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return source;
  }
}

function normalizeFundamentalSeries(value: unknown): BRVMFundamentalPoint[] {
  if (!Array.isArray(value)) return [];
  const rows: BRVMFundamentalPoint[] = [];

  for (const entry of value) {
    if (isRecord(entry)) {
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
  }

  return rows.sort((a, b) => Number(a.year) - Number(b.year));
}

function normalizeDividendSeries(value: unknown): BRVMDividendPoint[] {
  if (!Array.isArray(value)) return [];
  const rows: BRVMDividendPoint[] = [];

  for (const entry of value) {
    if (isRecord(entry)) {
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
