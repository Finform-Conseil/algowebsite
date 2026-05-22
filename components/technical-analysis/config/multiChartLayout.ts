import type {
  MultiChartLayoutCell,
  MultiChartLayoutId,
  MultiChartLayoutState,
  MultiChartLayoutSync,
} from "./TechnicalAnalysisTypes";
import { BRVM_SECURITIES } from "@/core/data/brvm-securities";

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

const FALLBACK_LAYOUT_SYMBOLS = [
  "BRVMC",
  "SNTS",
  "BOAC",
  "SGBC",
  "ETIT",
  "SPHC",
  "PALC",
  "SIVC",
  "ORGT",
  "CIEC",
  "CABC",
  "NEIC",
  "UNXC",
  "SHEC",
  "BICC",
  "CFAC",
];

export const getLayoutDefinition = (layoutId: MultiChartLayoutId): MultiChartLayoutDefinition =>
  MULTI_CHART_LAYOUTS.find((layout) => layout.id === layoutId) ?? MULTI_CHART_LAYOUTS[0];

export const normalizeLayoutSymbol = (symbol: string): string => symbol.trim().toUpperCase();

export const resolveSectorCompareSymbols = (primarySymbol: string): string[] => {
  const primary = normalizeLayoutSymbol(primarySymbol) || "BOAB";
  const security = BRVM_SECURITIES.find((s) => s.ticker === primary);
  if (!security) return [primary, "BOAC", "SGBC", "BRVMC"];

  const sector = security.sector;
  if (sector === "Market Indices" || sector === "Delisted" || sector === "Other") {
    // Fallback par défaut sur les banques majeures et l'indice composite
    return [primary, "BOAC", "SGBC", "BRVMC"];
  }

  // Trouver les homologues du même secteur
  const peers = BRVM_SECURITIES.filter(
    (s) => s.sector === sector && s.ticker !== primary && s.status !== "delisted"
  );

  // Trier par capitalisation décroissante pour prendre les leaders
  peers.sort((a, b) => b.marketCap - a.marketCap);

  const result: string[] = [primary];
  if (peers[0]) result.push(peers[0].ticker);
  if (peers[1]) result.push(peers[1].ticker);

  // Compléter avec des fallbacks robustes si secteur trop étroit
  if (result.length < 2) result.push("BOAC");
  if (result.length < 3) result.push("SGBC");

  // Ajouter l'indice benchmark BRVMC
  result.push("BRVMC");

  return result;
};

export const resolveMarketMonitorSymbols = (): string[] => {
  const sectors: Array<"Telecom" | "Banking" | "Energy" | "Industry" | "Distribution"> = [
    "Telecom",
    "Banking",
    "Energy",
    "Industry",
    "Distribution",
  ];

  const result: string[] = ["BRVMC"];

  sectors.forEach((sector) => {
    const topStock = BRVM_SECURITIES
      .filter((s) => s.sector === sector && s.status !== "delisted")
      .sort((a, b) => b.marketCap - a.marketCap)[0];

    if (topStock) {
      result.push(topStock.ticker);
    } else {
      if (sector === "Telecom") result.push("SNTS");
      else if (sector === "Banking") result.push("SGBC");
      else if (sector === "Energy") result.push("TTLC");
      else if (sector === "Industry") result.push("PALC");
      else if (sector === "Distribution") result.push("CFAC");
    }
  });

  return result;
};

export const isDenseMultiChartLayout = (layoutId: MultiChartLayoutId): boolean =>
  getLayoutDefinition(layoutId).chartCount >= 8;

export const hasCollapsedLayoutSymbols = (layout: MultiChartLayoutState): boolean => {
  if (!isDenseMultiChartLayout(layout.layoutId)) return false;
  const symbols = new Set(layout.charts.map((chart) => normalizeLayoutSymbol(chart.symbol)).filter(Boolean));
  return layout.charts.length > 1 && symbols.size <= 1;
};

const getUniqueLayoutSymbols = (cells: MultiChartLayoutCell[]): string[] =>
  Array.from(new Set(cells.map((cell) => normalizeLayoutSymbol(cell.symbol)).filter(Boolean)));

const buildSecondarySymbolCandidates = (primary: string, comparisonSymbols: string[]): string[] =>
  Array.from(
    new Set(
      [...comparisonSymbols, ...FALLBACK_LAYOUT_SYMBOLS]
        .map((symbol) => normalizeLayoutSymbol(symbol))
        .filter((symbol) => symbol && symbol !== primary)
    )
  );

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
  const candidates = buildSecondarySymbolCandidates(primary, comparisonSymbols);
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
    sync: isDenseMultiChartLayout(layoutId)
      ? { ...current.sync, symbol: false, crosshair: false }
      : { ...current.sync },
    charts: charts.map((chart) => ({ ...chart, isActive: chart.chartId === activeChartId })),
    activeChartId,
  };
};

export const createPresetLayout = (preset: MultiChartPreset, primarySymbol: string): MultiChartLayoutState => {
  const definition = getLayoutDefinition(preset.layoutId);
  const symbols = preset.id === "sector_compare"
    ? resolveSectorCompareSymbols(primarySymbol)
    : preset.id === "market_monitor"
      ? resolveMarketMonitorSymbols()
      : preset.symbols.length > 0
        ? preset.symbols.map((symbol) => symbol || primarySymbol)
        : Array(definition.chartCount).fill(primarySymbol);
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
