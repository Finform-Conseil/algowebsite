"use client";

export type PersistedMarketPreference = {
  ticker: string;
  name: string;
  currency: string;
};

const STORAGE_KEY = "algoway_active_market";

const normalize = (value: unknown): string => (
  typeof value === "string" ? value.trim().toUpperCase() : ""
);

const toPreference = (value: unknown): PersistedMarketPreference | null => {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<PersistedMarketPreference>;
  const ticker = normalize(record.ticker);
  const name = typeof record.name === "string" ? record.name.trim() : "";
  const currency = normalize(record.currency);
  if (!ticker || !name || !currency) return null;
  return { ticker, name, currency };
};

export const readPersistedMarketPreference = (): PersistedMarketPreference | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? toPreference(JSON.parse(raw)) : null;
  } catch (error) {
    console.warn("Market preference read failed", error);
    return null;
  }
};

export const writePersistedMarketPreference = (market: PersistedMarketPreference): void => {
  if (typeof window === "undefined") return;
  const preference = toPreference(market);
  if (!preference) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preference));
  } catch (error) {
    console.warn("Market preference write failed", error);
  }
};
