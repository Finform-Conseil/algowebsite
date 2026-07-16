import type {
  MultiChartLayoutCell,
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartLayoutSync,
} from "./multiChartLayoutTypes";

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
    description: "Mini-terminal BRVM 3 par 2",
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
    description: "Mur de surveillance BRVM 4 par 3",
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
    sync: { symbol: true, interval: false, crosshair: true, time: true, dateRange: true },
    symbols: [],
    intervals: ["1D", "1W", "1M"],
  },
  {
    id: "symbol_vs_market",
    name: "Titre vs marché",
    layoutId: "two_horizontal",
    sync: { ...DEFAULT_MULTI_CHART_SYNC, crosshair: true },
    symbols: ["", "BRVMC"],
    intervals: ["1D", "1D"],
  },
  {
    id: "sector_compare",
    name: "Comparaison secteur",
    layoutId: "four_grid",
    sync: { ...DEFAULT_MULTI_CHART_SYNC, crosshair: true },
    symbols: ["", "BOAC", "SGBC", "BRVMC"],
    intervals: ["1D", "1D", "1D", "1D"],
  },
  {
    id: "market_monitor",
    name: "Market Monitor",
    layoutId: "six_grid",
    sync: { ...DEFAULT_MULTI_CHART_SYNC, crosshair: true },
    symbols: ["BRVMC", "SNTS", "BOAC", "SGBC", "ETIT", "SPHC"],
    intervals: ["1D", "1D", "1D", "1D", "1D", "1D"],
  },
];

export const getLayoutDefinition = (layoutId: MultiChartLayoutId): MultiChartLayoutDefinition =>
  MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutId) ?? MULTI_CHART_LAYOUTS[0];

export const normalizeLayoutSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const isDenseMultiChartLayout = (layoutId: MultiChartLayoutId): boolean =>
  getLayoutDefinition(layoutId).chartCount >= 8;

export const hasCollapsedLayoutSymbols = (layout: MultiChartLayoutState): boolean => {
  if (!isDenseMultiChartLayout(layout.layoutId)) return false;
  const symbols = new Set(layout.charts.map((chart) => normalizeLayoutSymbol(chart.symbol)).filter(Boolean));
  return layout.charts.length > 1 && symbols.size <= 1;
};

const getUniqueLayoutSymbols = (cells: MultiChartLayoutCell[]): string[] =>
  Array.from(new Set(cells.map((cell) => normalizeLayoutSymbol(cell.symbol)).filter(Boolean)));

const buildSecondarySymbolCandidates = (
  primary: string,
  comparisonSymbols: string[],
  fallbackSymbols: string[],
): string[] =>
  Array.from(
    new Set(
      [...comparisonSymbols, ...fallbackSymbols]
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
  fallbackSymbols: string[] = [],
): MultiChartLayoutCell[] => {
  const definition = getLayoutDefinition(layoutId);
  const primary = normalizeLayoutSymbol(primarySymbol) || "BOAB";
  const candidates = buildSecondarySymbolCandidates(primary, comparisonSymbols, fallbackSymbols);
  const previousSymbols = getUniqueLayoutSymbols(previousCells);
  const shouldPreservePreviousSymbols = !presetSymbols && !(definition.chartCount > 1 && previousCells.length > 1 && previousSymbols.length <= 1);

  return Array.from({ length: definition.chartCount }, (_, index) => {
    const existing = previousCells[index];
    const presetSymbol = presetSymbols?.[index];
    const symbol = presetSymbols ? normalizeLayoutSymbol(presetSymbol || primary) : index === 0 ? primary : candidates[index - 1] ?? primary;
    return {
      chartId: existing?.chartId ?? `chart_${index + 1}`,
      symbol: index > 0 && existing?.symbol && shouldPreservePreviousSymbols ? existing.symbol : symbol,
      exchange: "BRVM",
      interval: intervals?.[index] ?? existing?.interval ?? "1D",
      indicators: existing?.indicators ?? (index === 0 ? ["volume", "sma"] : ["volume"]),
      isActive: index === 0,
    };
  });
};

export const createDefaultMultiChartLayout = (
  layoutId: MultiChartLayoutId = "single",
  primarySymbol = "BOAB",
  comparisonSymbols: string[] = [],
  fallbackSymbols: string[] = [],
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(layoutId);
  const charts = createLayoutCells(layoutId, primarySymbol, comparisonSymbols, [], undefined, undefined, fallbackSymbols);
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
  fallbackSymbols: string[] = [],
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(layoutId);
  const charts = createLayoutCells(layoutId, primarySymbol, comparisonSymbols, current.charts, undefined, undefined, fallbackSymbols);
  const activeChartId = charts.some((chart) => chart.chartId === current.activeChartId)
    ? current.activeChartId
    : charts[0]?.chartId ?? "chart_1";

  return {
    ...current,
    layoutId,
    name: definition.name,
    isEnabled: definition.chartCount > 1,
    sync: isDenseMultiChartLayout(layoutId)
      ? { ...current.sync, symbol: false, crosshair: false }
      : { ...current.sync },
    charts: charts.map((chart) => ({ ...chart, isActive: chart.chartId === activeChartId })),
    activeChartId,
  };
};
