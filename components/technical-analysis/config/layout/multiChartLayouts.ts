import type {
  MultiChartLayoutCell,
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartLayoutSync,
} from "./multiChartLayoutTypes";
import {
  completeMultiChartCell,
  type CompleteMultiChartLayoutCell,
} from "./multiChartCellState";
import { normalizeChartTimeframe } from "../market/timeframeCatalog";
import {
  createDefaultMultiChartIndicators,
  prepareIndicatorSnapshotForMultiChartEntry,
  prepareIndicatorsForMultiChartEntry,
} from "./multiChartIndicatorPolicy";

export interface MultiChartLayoutDefinition {
  id: MultiChartLayoutId;
  name: string;
  shortName: string;
  chartCount: number;
  cssClass: string;
  description: string;
}

export interface MultiChartPreset {
  id: string;
  name: string;
  layoutId: MultiChartLayoutId;
  sync: MultiChartLayoutSync;
  symbols: string[];
  intervals: string[];
}

export const MULTI_CHART_STORAGE_KEY = "technical-analysis.multiChartLayout.v1";

/**
 * Values emitted by the first multi-chart prototype. They were never selected
 * from the API and must not survive local-storage hydration as a real cell.
 */
const LEGACY_LAYOUT_PLACEHOLDER_SYMBOLS = new Set(["BRVMC"]);

export const DEFAULT_MULTI_CHART_SYNC: MultiChartLayoutSync = {
  symbol: false,
  interval: false,
  crosshair: false,
  time: false,
  dateRange: false,
};

export const MULTI_CHART_LAYOUTS: MultiChartLayoutDefinition[] = [
  {
    id: "single",
    name: "1 graphique",
    shortName: "1",
    chartCount: 1,
    cssClass: "layout-single",
    description: "Graphique principal unique",
  },
  {
    id: "two_horizontal",
    name: "2 graphiques horizontaux",
    shortName: "2H",
    chartCount: 2,
    cssClass: "layout-two-horizontal",
    description: "Deux graphiques côte à côte",
  },
  {
    id: "two_vertical",
    name: "2 graphiques verticaux",
    shortName: "2V",
    chartCount: 2,
    cssClass: "layout-two-vertical",
    description: "Deux graphiques empilés",
  },
  {
    id: "three_focus_right",
    name: "3 graphiques focus",
    shortName: "3",
    chartCount: 3,
    cssClass: "layout-three-focus-right",
    description: "Un grand graphique et deux panneaux de contrôle",
  },
  {
    id: "four_grid",
    name: "4 graphiques 2x2",
    shortName: "4",
    chartCount: 4,
    cssClass: "layout-four-grid",
    description: "Grille 2 par 2",
  },
  {
    id: "six_grid",
    name: "6 graphiques 3x2",
    shortName: "6",
    chartCount: 6,
    cssClass: "layout-six-grid",
    description: "Mini-terminal multi-marchés 3 par 2",
  },
  {
    id: "eight_grid",
    name: "8 graphiques 4x2",
    shortName: "8",
    chartCount: 8,
    cssClass: "layout-eight-grid",
    description: "Terminal multi-actifs 4 par 2",
  },
  {
    id: "nine_grid",
    name: "9 graphiques 3x3",
    shortName: "9",
    chartCount: 9,
    cssClass: "layout-nine-grid",
    description: "Matrice multi-actifs 3 par 3",
  },
  {
    id: "twelve_grid",
    name: "12 graphiques 4x3",
    shortName: "12",
    chartCount: 12,
    cssClass: "layout-twelve-grid",
    description: "Mur de surveillance multi-marchés 4 par 3",
  },
  {
    id: "sixteen_grid",
    name: "16 graphiques 4x4",
    shortName: "16",
    chartCount: 16,
    cssClass: "layout-sixteen-grid",
    description: "Mur de surveillance maximal 4 par 4",
  },
];

export const MULTI_CHART_PRESETS: MultiChartPreset[] = [
  {
    id: "multi_timeframe",
    name: "Analyse multi-timeframe",
    layoutId: "three_focus_right",
    sync: { symbol: true, interval: false, crosshair: false, time: false, dateRange: false },
    symbols: [],
    intervals: ["1D", "1W", "1M"],
  },
  {
    id: "symbol_vs_market",
    name: "Titre vs marché",
    layoutId: "two_horizontal",
    sync: { ...DEFAULT_MULTI_CHART_SYNC, crosshair: true },
    symbols: [],
    intervals: ["1D", "1D"],
  },
  {
    id: "sector_compare",
    name: "Comparaison secteur",
    layoutId: "four_grid",
    sync: { ...DEFAULT_MULTI_CHART_SYNC, crosshair: true },
    symbols: [],
    intervals: ["1D", "1D", "1D", "1D"],
  },
  {
    id: "market_monitor",
    name: "Market Monitor",
    layoutId: "six_grid",
    sync: { ...DEFAULT_MULTI_CHART_SYNC, crosshair: true },
    symbols: [],
    intervals: ["1D", "1D", "1D", "1D", "1D", "1D"],
  },
];

// API-first contract: every configured interval is queried natively first.
// Weekly/monthly have a deterministic 1D aggregation fallback; intraday remains
// unavailable when the backend has no rows and is never fabricated client-side.
export const MULTI_CHART_RENDERABLE_INTERVALS = new Set(["1D", "1W", "1M"]);
export const isMultiChartPresetAvailable = (preset: MultiChartPreset): boolean =>
  preset.intervals.every((interval) => {
    const normalized = normalizeChartTimeframe(interval);
    return normalized !== null && MULTI_CHART_RENDERABLE_INTERVALS.has(normalized);
  });

export const getLayoutDefinition = (layoutId: MultiChartLayoutId): MultiChartLayoutDefinition =>
  MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutId) ?? MULTI_CHART_LAYOUTS[0];

export const normalizeLayoutSymbol = (symbol: string): string => symbol.trim().toUpperCase();

/**
 * Physical slot order is presentation only. A bound symbol remains a valid
 * layout binding after the user moves its panel away from chart_1.
 */
export const hasBoundLayoutSymbol = (
  layout: MultiChartLayoutState,
  symbol?: string,
): boolean => {
  const requestedSymbol = normalizeLayoutSymbol(symbol ?? "");
  return layout.charts.some((chart) => {
    const boundSymbol = normalizeLayoutSymbol(chart.symbol);
    return requestedSymbol ? boundSymbol === requestedSymbol : Boolean(boundSymbol);
  });
};

const isLegacyLayoutPlaceholderSymbol = (symbol: string | undefined): boolean =>
  LEGACY_LAYOUT_PLACEHOLDER_SYMBOLS.has(normalizeLayoutSymbol(symbol ?? ""));

export const isDenseMultiChartLayout = (layoutId: MultiChartLayoutId): boolean =>
  getLayoutDefinition(layoutId).chartCount >= 8;

export const hasCollapsedLayoutSymbols = (layout: MultiChartLayoutState): boolean => {
  if (!isDenseMultiChartLayout(layout.layoutId)) return false;
  const boundSymbols = layout.charts
    .map((chart) => normalizeLayoutSymbol(chart.symbol))
    .filter(Boolean);
  if (boundSymbols.length < 2) return false;
  return new Set(boundSymbols).size === 1;
};

const getUniqueLayoutSymbols = (cells: MultiChartLayoutCell[]): string[] =>
  Array.from(new Set(cells.map((cell) => normalizeLayoutSymbol(cell.symbol)).filter(Boolean)));

const buildSecondarySymbolCandidates = (primary: string, comparisonSymbols: string[]): string[] =>
  Array.from(
    new Set(
      comparisonSymbols
        .map((symbol) => normalizeLayoutSymbol(symbol))
        .filter((symbol) => symbol && symbol !== primary),
    ),
  );

export const createLayoutCells = (
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
  previousCells: MultiChartLayoutCell[] = [],
  intervals?: string[],
  presetSymbols?: string[],
  market = "BRVM",
  preservePrimaryBinding = false,
): MultiChartLayoutCell[] => {
  const definition = getLayoutDefinition(layoutId);
  const primary = normalizeLayoutSymbol(primarySymbol);
  const normalizedMarket = normalizeLayoutSymbol(market) || "BRVM";
  const candidates = buildSecondarySymbolCandidates(primary, comparisonSymbols);
  const previousSymbols = getUniqueLayoutSymbols(previousCells);
  const shouldPreservePreviousSymbols = !presetSymbols && !(definition.chartCount > 1 && previousCells.length > 1 && previousSymbols.length <= 1);

  return Array.from({ length: definition.chartCount }, (_, index) => {
    const existing = previousCells[index];
    const presetSymbol = presetSymbols?.[index];
    const defaultSymbol = index === 0 ? primary : candidates[index - 1] ?? "";
    const canReuseExistingBinding = Boolean(
      !presetSymbols
      && (index > 0 || preservePrimaryBinding)
      && existing?.symbol
      && !isLegacyLayoutPlaceholderSymbol(existing.symbol)
      && shouldPreservePreviousSymbols,
    );
    const symbol = canReuseExistingBinding
      ? normalizeLayoutSymbol(existing?.symbol ?? "")
      : normalizeLayoutSymbol(presetSymbols ? (presetSymbol ?? defaultSymbol) : defaultSymbol);
    // An exchange belongs to a concrete symbol binding, never to an empty slot.
    // Empty panels must remain market-agnostic until the user chooses a bourse.
    const exchange = symbol
      ? (canReuseExistingBinding
        ? normalizeLayoutSymbol(existing?.exchange ?? "") || normalizedMarket
        : normalizedMarket)
      : "";
    return completeMultiChartCell({
      ...existing,
      chartId: existing?.chartId ?? `chart_${index + 1}`,
      symbol,
      exchange,
      interval: intervals?.[index] ?? existing?.interval ?? "1D",
      indicators: existing?.indicators ?? createDefaultMultiChartIndicators(),
      isActive: index === 0,
    }, index);
  });
};

export const createDefaultMultiChartLayout = (
  layoutId: MultiChartLayoutId = "single",
  primarySymbol = "BOAB",
  comparisonSymbols: string[] = [],
  market = "BRVM",
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(layoutId);
  const charts = createLayoutCells(layoutId, primarySymbol, comparisonSymbols, [], undefined, undefined, market);
  return {
    layoutId,
    name: definition.name,
    isEnabled: definition.chartCount > 1,
    sync: { ...DEFAULT_MULTI_CHART_SYNC },
    charts,
    activeChartId: charts[0]?.chartId ?? "chart_1",
  };
};

export const reconcileMultiChartLayout = (
  current: MultiChartLayoutState,
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
  market = "BRVM",
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(layoutId);
  // A layout transition is a pure geometry change: existing chart bindings are
  // state, not defaults. Preserve chart_1 exactly like every peer so expanding
  // 2H -> 4 (or rotating 2H -> 2V) cannot overwrite a valid panel with the
  // currently focused symbol. Same-layout reconciliation intentionally keeps
  // the historical primary-rebind behavior used by state repair paths.
  const preservePrimaryBinding = current.layoutId !== layoutId;
  const isLayoutTransition = current.layoutId !== layoutId;
  const enteringMultiChart = getLayoutDefinition(current.layoutId).chartCount <= 1 && definition.chartCount > 1;
  const previousCells = enteringMultiChart
    ? current.charts.map((cell) => ({
        ...cell,
        indicators: prepareIndicatorsForMultiChartEntry(cell.indicators),
        indicatorState: prepareIndicatorSnapshotForMultiChartEntry(
          (cell as Partial<CompleteMultiChartLayoutCell>).indicatorState,
        ),
      }))
    : current.charts;
  const charts = createLayoutCells(
    layoutId,
    primarySymbol,
    comparisonSymbols,
    previousCells,
    undefined,
    undefined,
    market,
    preservePrimaryBinding,
  );
  const currentActive = charts.find((chart) => chart.chartId === current.activeChartId);
  const firstBoundChart = charts.find((chart) => chart.symbol.trim().length > 0);
  // An empty placeholder can never own the canonical active chart surface. This
  // repairs legacy/persisted layouts that marked an unbound slot active and
  // prevents the full chart engine from being mounted inside an empty panel.
  const activeChartId = currentActive?.symbol.trim()
    ? currentActive.chartId
    : firstBoundChart?.chartId ?? charts[0]?.chartId ?? "chart_1";

  return {
    ...current,
    layoutId,
    name: definition.name,
    isEnabled: definition.chartCount > 1,
    // A manual geometry change starts from independent panels. Sync is opt-in
    // state and must never leak from a previous preset/layout into a new grid.
    sync: isLayoutTransition
      ? { ...DEFAULT_MULTI_CHART_SYNC }
      : isDenseMultiChartLayout(layoutId)
        ? { ...current.sync, symbol: false, crosshair: false }
        : { ...current.sync },
    charts: charts.map((chart) => ({ ...chart, isActive: chart.chartId === activeChartId })),
    activeChartId,
  };
};
