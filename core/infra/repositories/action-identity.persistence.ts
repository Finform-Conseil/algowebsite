"use client";

import type { ActionEntity } from "@/core/domain/entities/action.entity";

export type PersistedActionIdentity = {
  ticker: string;
  marketTicker: string;
  actionId: string;
  instrumentId: string;
  isin?: string;
  updatedAt: number;
};

type ActionIdentityRegistry = Record<string, PersistedActionIdentity>;

const STORAGE_KEY = "algoway_action_identity_registry_v1";
const MAX_IDENTITY_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_REGISTRY_ENTRIES = 1_024;
const memoryRegistry = new Map<string, PersistedActionIdentity>();

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toUpperCase() : "";

const buildKey = (marketTicker: string, ticker: string): string =>
  `${normalize(marketTicker) || "UNKNOWN"}:${normalize(ticker)}`;

const isValidIdentity = (value: unknown): value is PersistedActionIdentity => {
  if (!value || typeof value !== "object") return false;
  const identity = value as Partial<PersistedActionIdentity>;
  return Boolean(
    normalize(identity.ticker)
    && normalize(identity.marketTicker)
    && typeof identity.actionId === "string"
    && identity.actionId.trim()
    && typeof identity.instrumentId === "string"
    && identity.instrumentId.trim()
    && (identity.isin === undefined || typeof identity.isin === "string")
    && typeof identity.updatedAt === "number"
    && Number.isFinite(identity.updatedAt)
    && identity.updatedAt > 0,
  );
};

const isFresh = (identity: PersistedActionIdentity): boolean =>
  Date.now() - identity.updatedAt <= MAX_IDENTITY_AGE_MS;

const readRegistry = (): ActionIdentityRegistry => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as ActionIdentityRegistry;
  } catch {
    return {};
  }
};

const persistRegistry = (registry: ActionIdentityRegistry): void => {
  if (typeof window === "undefined") return;
  const entries = Object.entries(registry)
    .filter(([, identity]) => isValidIdentity(identity) && isFresh(identity))
    .sort(([, left], [, right]) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_REGISTRY_ENTRIES);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (error) {
    console.warn("[ActionIdentity] Persistence write failed", error);
  }
};

export const readPersistedActionIdentity = (
  marketTicker: string,
  ticker: string,
  expectedIsin?: string,
): PersistedActionIdentity | null => {
  const key = buildKey(marketTicker, ticker);
  const normalizedIsin = normalize(expectedIsin);
  const memoryIdentity = memoryRegistry.get(key);
  if (memoryIdentity && isFresh(memoryIdentity)) {
    if (!normalizedIsin || normalize(memoryIdentity.isin) === normalizedIsin) return memoryIdentity;
  }

  const registry = readRegistry();
  const identity = registry[key];
  if (!isValidIdentity(identity) || !isFresh(identity)) return null;
  if (normalizedIsin && normalize(identity.isin) !== normalizedIsin) return null;
  memoryRegistry.set(key, identity);
  return identity;
};

export const writePersistedActionIdentities = (actions: readonly ActionEntity[]): void => {
  if (typeof window === "undefined" || actions.length === 0) return;
  const registry = readRegistry();
  const updatedAt = Date.now();

  for (const action of actions) {
    const ticker = normalize(action.ticker);
    const marketTicker = normalize(action.bourse?.ticker);
    const actionId = typeof action.id === "string" ? action.id.trim() : "";
    const instrumentId = typeof action.instrument === "string" ? action.instrument.trim() : "";
    if (!ticker || !marketTicker || !actionId || !instrumentId) continue;

    const identity: PersistedActionIdentity = {
      ticker,
      marketTicker,
      actionId,
      instrumentId,
      ...(normalize(action.isin) ? { isin: normalize(action.isin) } : {}),
      updatedAt,
    };
    const key = buildKey(marketTicker, ticker);
    registry[key] = identity;
    memoryRegistry.set(key, identity);
  }

  persistRegistry(registry);
};

export const writePersistedActionIdentity = (action: ActionEntity): void => {
  writePersistedActionIdentities([action]);
};
