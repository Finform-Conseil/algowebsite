import type { MultiChartLayoutCell, MultiChartLayoutId, MultiChartLayoutState } from "./multiChartLayoutTypes";
import {
  createDefaultMultiChartLayout,
  createLayoutCells,
  getLayoutDefinition,
  normalizeLayoutSymbol,
  reconcileMultiChartLayout,
  type MultiChartPreset,
} from "./multiChartLayouts";

export const BRVM_LAYOUT_SYMBOL_FALLBACKS = [
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
] as const;

export const resolveSectorCompareSymbols = (primarySymbol: string): string[] => {
  const primary = normalizeLayoutSymbol(primarySymbol) || "BOAB";
  return [primary, "BOAC", "SGBC", "BRVMC"];
};

export const resolveMarketMonitorSymbols = (): string[] => [
  "BRVMC",
  "SNTS",
  "SGBC",
  "TTLC",
  "PALC",
  "CFAC",
];

export const createBrvmLayoutCells = (
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
  previousCells: MultiChartLayoutCell[] = [],
  intervals?: string[],
  presetSymbols?: string[],
) => createLayoutCells(
  layoutId,
  primarySymbol,
  comparisonSymbols,
  previousCells,
  intervals,
  presetSymbols,
  [...BRVM_LAYOUT_SYMBOL_FALLBACKS],
);

export const createDefaultBrvmMultiChartLayout = (
  layoutId: MultiChartLayoutId = "single",
  primarySymbol = "BOAB",
  comparisonSymbols: string[] = [],
): MultiChartLayoutState => createDefaultMultiChartLayout(
  layoutId,
  primarySymbol,
  comparisonSymbols,
  [...BRVM_LAYOUT_SYMBOL_FALLBACKS],
);

export const reconcileBrvmMultiChartLayout = (
  current: MultiChartLayoutState,
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
): MultiChartLayoutState => reconcileMultiChartLayout(
  current,
  layoutId,
  primarySymbol,
  comparisonSymbols,
  [...BRVM_LAYOUT_SYMBOL_FALLBACKS],
);

export const createPresetLayout = (preset: MultiChartPreset, primarySymbol: string): MultiChartLayoutState => {
  const definition = getLayoutDefinition(preset.layoutId);
  const symbols = preset.id === "sector_compare"
    ? resolveSectorCompareSymbols(primarySymbol)
    : preset.id === "market_monitor"
      ? resolveMarketMonitorSymbols()
      : preset.symbols.length > 0
        ? preset.symbols.map((symbol) => symbol || primarySymbol)
        : Array(definition.chartCount).fill(primarySymbol);
  const charts = createBrvmLayoutCells(preset.layoutId, primarySymbol, [], [], preset.intervals, symbols);

  return {
    layoutId: preset.layoutId,
    name: preset.name,
    isEnabled: definition.chartCount > 1,
    sync: { ...preset.sync },
    charts,
    activeChartId: charts[0]?.chartId ?? "chart_1",
  };
};
