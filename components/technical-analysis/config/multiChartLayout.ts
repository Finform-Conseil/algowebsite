import type {
  MultiChartLayoutCell,
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartLayoutSync,
} from "./TechnicalAnalysisTypes";

export interface MultiChartLayoutDefinition {
  id: MultiChartLayoutId;
  name: string;
  shortName: string;
  chartCount: number;
  cssClass: string;
  description: string;
}

export interface PlannedLayoutDefinition {
  chartCount: number;
  name: string;
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
  interval: true,
  crosshair: true,
  time: true,
  dateRange: true,
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
];

export const PLANNED_MULTI_CHART_LAYOUTS: PlannedLayoutDefinition[] = [
  { chartCount: 8, name: "8 graphiques" },
  { chartCount: 9, name: "9 graphiques" },
  { chartCount: 12, name: "12 graphiques" },
  { chartCount: 16, name: "16 graphiques" },
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
    sync: DEFAULT_MULTI_CHART_SYNC,
    symbols: ["", "BRVMC"],
    intervals: ["1D", "1D"],
  },
  {
    id: "sector_compare",
    name: "Comparaison secteur",
    layoutId: "four_grid",
    sync: DEFAULT_MULTI_CHART_SYNC,
    symbols: ["", "BOAC", "SGBC", "BRVMC"],
    intervals: ["1D", "1D", "1D", "1D"],
  },
  {
    id: "market_monitor",
    name: "Market Monitor",
    layoutId: "six_grid",
    sync: DEFAULT_MULTI_CHART_SYNC,
    symbols: ["BRVMC", "SNTS", "BOAC", "SGBC", "ETIT", "SPHC"],
    intervals: ["1D", "1D", "1D", "1D", "1D", "1D"],
  },
];

const FALLBACK_LAYOUT_SYMBOLS = ["BRVMC", "SNTS", "BOAC", "SGBC", "ETIT", "SPHC"];

export const getLayoutDefinition = (layoutId: MultiChartLayoutId): MultiChartLayoutDefinition =>
  MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutId) ?? MULTI_CHART_LAYOUTS[0];

export const normalizeLayoutSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const createLayoutCells = (
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
  previousCells: MultiChartLayoutCell[] = [],
  intervals?: string[],
  presetSymbols?: string[]
): MultiChartLayoutCell[] => {
  const definition = getLayoutDefinition(layoutId);
  const primary = normalizeLayoutSymbol(primarySymbol) || "BOAB";
  const candidates = [...(presetSymbols ?? []), ...comparisonSymbols, ...FALLBACK_LAYOUT_SYMBOLS]
    .map((symbol) => normalizeLayoutSymbol(symbol || primary))
    .filter(Boolean);

  return Array.from({ length: definition.chartCount }, (_, index) => {
    const existing = previousCells[index];
    const presetSymbol = presetSymbols?.[index];
    const symbol = presetSymbols ? normalizeLayoutSymbol(presetSymbol || primary) : index === 0 ? primary : candidates[index - 1] ?? primary;
    return {
      chartId: existing?.chartId ?? `chart_${index + 1}`,
      symbol: existing?.symbol && !presetSymbols ? existing.symbol : symbol,
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
  comparisonSymbols: string[] = []
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(layoutId);
  const charts = createLayoutCells(layoutId, primarySymbol, comparisonSymbols);
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
  comparisonSymbols: string[] = []
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(layoutId);
  const charts = createLayoutCells(layoutId, primarySymbol, comparisonSymbols, current.charts);
  const activeChartId = charts.some((chart) => chart.chartId === current.activeChartId)
    ? current.activeChartId
    : charts[0]?.chartId ?? "chart_1";

  return {
    ...current,
    layoutId,
    name: definition.name,
    isEnabled: definition.chartCount > 1,
    charts: charts.map((chart) => ({ ...chart, isActive: chart.chartId === activeChartId })),
    activeChartId,
  };
};

export const createPresetLayout = (preset: MultiChartPreset, primarySymbol: string): MultiChartLayoutState => {
  const definition = getLayoutDefinition(preset.layoutId);
  const symbols = preset.symbols.map((symbol) => symbol || primarySymbol);
  const charts = createLayoutCells(preset.layoutId, primarySymbol, [], [], preset.intervals, symbols);
  return {
    layoutId: preset.layoutId,
    name: preset.name,
    isEnabled: definition.chartCount > 1,
    sync: { ...preset.sync },
    charts,
    activeChartId: charts[0]?.chartId ?? "chart_1",
  };
};
