import type {
  BackendIndicatorGroup,
  BackendIndicatorItem,
  BackendIndicatorSection,
} from "./indicatorModalRegistry";

export type IndicatorFocusFilter =
  | "all"
  | "trend"
  | "momentum"
  | "volatility"
  | "volume"
  | "levels"
  | "patterns";

export const INDICATOR_FOCUS_FILTERS: ReadonlyArray<{
  id: IndicatorFocusFilter;
  label: string;
  shortLabel: string;
}> = [
  { id: "all", label: "Tous", shortLabel: "Tous" },
  { id: "trend", label: "Tendance", shortLabel: "Trend" },
  { id: "momentum", label: "Momentum", shortLabel: "Momentum" },
  { id: "volatility", label: "Volatilité", shortLabel: "Volatilité" },
  { id: "volume", label: "Volume", shortLabel: "Volume" },
  { id: "levels", label: "Niveaux", shortLabel: "Niveaux" },
  { id: "patterns", label: "Patterns", shortLabel: "Patterns" },
];

const GROUP_RELEVANCE: Record<string, number> = {
  "Moyennes & Comparaisons": 1000,
  Tendance: 920,
  Oscillateurs: 860,
  Volatilité: 800,
  Volume: 740,
  "Pivots & Signaux": 660,
  "Patterns Chandeliers": 560,
};

const SECTION_RELEVANCE: Record<string, number> = {
  "Prix vs SMA": 1000,
  "Prix vs EMA": 990,
  RSI: 970,
  "Convergence / Divergence": 960,
  Bollinger: 950,
  "ADX / Directional": 940,
  "Parabolic SAR": 930,
  Ichimoku: 920,
  "Overlay de tendance": 910,
  Stochastic: 900,
  ATR: 890,
  "Position intraday / volume": 880,
  "Flux cumulatifs": 840,
  "Pivot Points Standard": 820,
  "Pivot Points Fibonacci": 810,
};

const FOCUS_GROUPS: Record<Exclude<IndicatorFocusFilter, "all">, ReadonlySet<string>> = {
  trend: new Set(["Moyennes & Comparaisons", "Tendance"]),
  momentum: new Set(["Oscillateurs"]),
  volatility: new Set(["Volatilité"]),
  volume: new Set(["Volume"]),
  levels: new Set(["Pivots & Signaux"]),
  patterns: new Set(["Patterns Chandeliers"]),
};

const SEARCH_ALIASES: ReadonlyArray<readonly [string, string]> = [
  ["sma", "simple moving average moyenne mobile moyenne tendance"],
  ["ema", "exponential moving average moyenne mobile exponentielle moyenne tendance"],
  ["rsi", "relative strength index force relative momentum oscillateur"],
  ["macd", "moving average convergence divergence convergence divergence momentum"],
  ["bb", "bollinger bandes volatility volatilite"],
  ["atr", "average true range range volatilite risque"],
  ["hv", "historical volatility volatilite historique risque"],
  ["vwap", "volume weighted average price prix volume intraday"],
  ["adx", "average directional index force tendance direction"],
  ["doji", "chandelier pattern bougie indecision"],
];

const foldText = (value: unknown): string => String(value ?? "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase();

export const tokenizeIndicatorSearch = (query: string): string[] => foldText(query)
  .split(/[^a-z0-9%]+/)
  .map((token) => token.trim())
  .filter(Boolean);

const aliasesFor = (fields: readonly string[]): string => {
  const folded = fields.map(foldText).join(" ");
  return SEARCH_ALIASES
    .filter(([needle]) => folded.includes(needle))
    .map(([, aliases]) => aliases)
    .join(" ");
};

export const buildIndicatorSearchCorpus = (fields: readonly unknown[]): string => {
  const normalizedFields = fields.map((field) => foldText(field));
  return [...normalizedFields, aliasesFor(normalizedFields)].join(" ");
};

export const scoreIndicatorSearch = (
  query: string,
  fields: readonly unknown[],
): number => {
  const tokens = tokenizeIndicatorSearch(query);
  if (tokens.length === 0) return 0;

  const corpus = buildIndicatorSearchCorpus(fields);
  if (!tokens.every((token) => corpus.includes(token))) return -1;

  const primary = foldText(fields[0]);
  const key = foldText(fields[1]);
  const exactPhrase = foldText(query).trim();
  let score = 100;
  if (primary === exactPhrase) score += 900;
  else if (key === exactPhrase) score += 850;
  else if (primary.startsWith(exactPhrase)) score += 550;
  else if (key.startsWith(exactPhrase)) score += 500;

  tokens.forEach((token) => {
    if (primary.includes(token)) score += 70;
    if (key.includes(token)) score += 55;
  });

  return score;
};

export const matchesIndicatorSearch360 = (
  query: string,
  fields: readonly unknown[],
): boolean => scoreIndicatorSearch(query, fields) >= 0;

export const getIndicatorFocusForGroup = (
  groupTitle: string,
): Exclude<IndicatorFocusFilter, "all"> | null => {
  const entry = (Object.entries(FOCUS_GROUPS) as Array<[
    Exclude<IndicatorFocusFilter, "all">,
    ReadonlySet<string>,
  ]>).find(([, groups]) => groups.has(groupTitle));
  return entry?.[0] ?? null;
};

export const matchesIndicatorFocus = (
  groupTitle: string,
  focus: IndicatorFocusFilter,
): boolean => focus === "all" || getIndicatorFocusForGroup(groupTitle) === focus;

export const getIndicatorRelevance = (
  groupTitle: string,
  sectionTitle: string,
  item?: Pick<BackendIndicatorItem, "key" | "name" | "desc">,
): number => {
  const groupScore = GROUP_RELEVANCE[groupTitle] ?? 100;
  const sectionScore = SECTION_RELEVANCE[sectionTitle] ?? 100;
  const itemScore = item ? scoreIndicatorSearch(sectionTitle, [item.name, item.key, item.desc]) : 0;
  return groupScore * 1000 + sectionScore * 10 + Math.max(0, itemScore);
};

const compareRanked = <T,>(left: { value: T; score: number; index: number }, right: { value: T; score: number; index: number }): number => (
  right.score - left.score || left.index - right.index
);

const rankItem = (
  group: BackendIndicatorGroup,
  section: BackendIndicatorSection,
  item: BackendIndicatorItem,
  query: string,
  index: number,
) => ({
  value: item,
  score: getIndicatorRelevance(group.title, section.title, item) + Math.max(
    0,
    scoreIndicatorSearch(query, [item.name, item.key, item.desc, section.title, group.title, group.subtitle]),
  ) * 1000,
  index,
});

export const sortIndicatorGroupsForTrader = (
  groups: readonly BackendIndicatorGroup[],
  query: string,
): BackendIndicatorGroup[] => groups
  .map((group, groupIndex) => {
    const sections = group.sections
      .map((section, sectionIndex) => {
        const items = section.items
          .map((item, itemIndex) => rankItem(group, section, item, query, itemIndex))
          .sort(compareRanked)
          .map(({ value }) => value);
        return {
          value: { ...section, items },
          score: getIndicatorRelevance(group.title, section.title),
          index: sectionIndex,
        };
      })
      .sort(compareRanked)
      .map(({ value }) => value);
    const queryScore = scoreIndicatorSearch(query, [group.title, group.subtitle]);
    return {
      value: { ...group, sections },
      score: (GROUP_RELEVANCE[group.title] ?? 100) * 1000 + Math.max(0, queryScore) * 1000,
      index: groupIndex,
    };
  })
  .sort(compareRanked)
  .map(({ value }) => value);
