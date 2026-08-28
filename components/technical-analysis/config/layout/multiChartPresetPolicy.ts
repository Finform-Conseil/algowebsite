export interface PresetIndustryRef {
  id?: string;
  name?: string;
}

export interface PresetActionCandidate {
  id: string;
  ticker: string;
  bourse?: { ticker?: string };
  society?: { industry?: PresetIndustryRef };
  latest_price_metric?: {
    volume_currency?: number | null;
    volume?: number | null;
    change_1d_pct?: number | null;
  };
  latest_valuation_ratio?: { market_cap?: number | null };
}

export interface PresetIndexCandidate {
  id: string;
  name: string;
  bourse?: { ticker?: string };
  sectorial_index?: boolean;
  global_index?: boolean;
  principal_index?: boolean;
}

export interface PresetPrincipalIndexRef {
  id: string;
  name: string;
}

export interface ResolvedBenchmarkIndex {
  id: string;
  symbol: string;
}

const normalize = (value: unknown): string => String(value ?? "").trim().toUpperCase();

const finite = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
};

const sameMarket = (candidate: PresetActionCandidate, market: string): boolean =>
  normalize(candidate.bourse?.ticker) === normalize(market);

const sameIndustry = (left: PresetIndustryRef | undefined, right: PresetIndustryRef | undefined): boolean => {
  const leftId = normalize(left?.id);
  const rightId = normalize(right?.id);
  if (leftId && rightId) return leftId === rightId;
  const leftName = normalize(left?.name);
  const rightName = normalize(right?.name);
  return Boolean(leftName && rightName && leftName === rightName);
};

const liquidityComparator = (left: PresetActionCandidate, right: PresetActionCandidate): number => {
  const volumeCurrencyDiff = finite(right.latest_price_metric?.volume_currency) - finite(left.latest_price_metric?.volume_currency);
  if (Number.isFinite(volumeCurrencyDiff) && volumeCurrencyDiff !== 0) return volumeCurrencyDiff;
  const volumeDiff = finite(right.latest_price_metric?.volume) - finite(left.latest_price_metric?.volume);
  if (Number.isFinite(volumeDiff) && volumeDiff !== 0) return volumeDiff;
  const leftMove = Math.abs(finite(left.latest_price_metric?.change_1d_pct));
  const rightMove = Math.abs(finite(right.latest_price_metric?.change_1d_pct));
  const moveDiff = rightMove - leftMove;
  if (Number.isFinite(moveDiff) && moveDiff !== 0) return moveDiff;
  const marketCapDiff = finite(right.latest_valuation_ratio?.market_cap) - finite(left.latest_valuation_ratio?.market_cap);
  if (Number.isFinite(marketCapDiff) && marketCapDiff !== 0) return marketCapDiff;
  return normalize(left.ticker).localeCompare(normalize(right.ticker));
};

export const resolveBenchmarkIndex = (
  market: string,
  indices: readonly PresetIndexCandidate[],
  principalIndex?: PresetPrincipalIndexRef | null,
): ResolvedBenchmarkIndex | null => {
  const explicitId = String(principalIndex?.id ?? "").trim();
  const explicitName = String(principalIndex?.name ?? "").trim();
  if (explicitId && explicitName) return { id: explicitId, symbol: explicitName };

  const normalizedMarket = normalize(market);
  const candidates = indices
    .filter((entry) => normalize(entry.bourse?.ticker) === normalizedMarket)
    .filter((entry) => !entry.sectorial_index)
    .slice()
    .sort((left, right) => {
      const leftRank = left.principal_index ? 3 : left.global_index ? 2 : 1;
      const rightRank = right.principal_index ? 3 : right.global_index ? 2 : 1;
      if (leftRank !== rightRank) return rightRank - leftRank;
      return normalize(left.name).localeCompare(normalize(right.name));
    });
  const winner = candidates[0];
  return winner ? { id: winner.id, symbol: winner.name } : null;
};

export const rankSectorPeers = <T extends PresetActionCandidate>(
  primary: T,
  actions: readonly T[],
  limit = 3,
): T[] => {
  if (!Number.isSafeInteger(limit) || limit <= 0) return [];
  const market = normalize(primary.bourse?.ticker);
  const industry = primary.society?.industry;
  if (!market || (!normalize(industry?.id) && !normalize(industry?.name))) return [];
  const primaryId = normalize(primary.id);
  const primaryTicker = normalize(primary.ticker);
  const unique = new Map<string, T>();
  for (const candidate of actions) {
    const ticker = normalize(candidate.ticker);
    if (!ticker || !sameMarket(candidate, market) || !sameIndustry(candidate.society?.industry, industry)) continue;
    if (normalize(candidate.id) === primaryId || ticker === primaryTicker) continue;
    if (!unique.has(ticker)) unique.set(ticker, candidate);
  }
  return Array.from(unique.values()).sort(liquidityComparator).slice(0, limit);
};

export const rankMarketMonitorEquities = <T extends PresetActionCandidate>(
  actions: readonly T[],
  market: string,
  limit: number,
  excludedTickers: readonly string[] = [],
): T[] => {
  if (!Number.isSafeInteger(limit) || limit <= 0) return [];
  const excluded = new Set(excludedTickers.map(normalize).filter(Boolean));
  const unique = new Map<string, T>();
  for (const candidate of actions) {
    const ticker = normalize(candidate.ticker);
    if (!ticker || excluded.has(ticker) || !sameMarket(candidate, market)) continue;
    const previous = unique.get(ticker);
    if (!previous || liquidityComparator(candidate, previous) < 0) unique.set(ticker, candidate);
  }
  return Array.from(unique.values()).sort(liquidityComparator).slice(0, limit);
};
