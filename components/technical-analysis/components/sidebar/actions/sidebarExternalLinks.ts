export type SidebarExternalLinkTarget = "equity" | "bonds";

const BRVM_BASE_URL = "https://www.brvm.org/fr";

export function buildBrvmEquityUrl(ticker: string): string | null {
  const normalizedTicker = normalizeTickerForUrl(ticker);
  if (!normalizedTicker) return null;
  return `${BRVM_BASE_URL}/cours-actions/${encodeURIComponent(normalizedTicker)}`;
}

export function buildBrvmBondsUrl(): string {
  return `${BRVM_BASE_URL}/cours-obligations/0`;
}

export function openSidebarExternalUrl(url: string | null): boolean {
  if (!url || typeof window === "undefined") return false;

  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) {
    openedWindow.opener = null;
    return true;
  }

  return false;
}

export function openBrvmEquityPage(ticker: string): boolean {
  return openSidebarExternalUrl(buildBrvmEquityUrl(ticker));
}

export function openBrvmBondsPage(): boolean {
  return openSidebarExternalUrl(buildBrvmBondsUrl());
}

function normalizeTickerForUrl(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}
