import type { BRVMFundamentalPoint, BRVMFundamentals } from "./sidebarFundamentals";
import { getSourceHost } from "./sidebarProvenance";

export interface AuditTrailItem {
  label: string;
  value: string;
  tone?: "neutral" | "warning" | "success";
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

export function getVerifiedSourceLabel(source: string | null | undefined): string {
  const label = getSourceHost(source);
  return label || "Fallback catalogue local (non verifie live)";
}
