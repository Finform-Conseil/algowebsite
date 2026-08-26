import type { MultiChartLayoutCell, MultiChartLayoutId, MultiChartLayoutState } from "./multiChartLayoutTypes";
import {
  createDefaultMultiChartLayout,
  createLayoutCells,
  getLayoutDefinition,
  normalizeLayoutSymbol,
  reconcileMultiChartLayout,
  type MultiChartPreset,
} from "./multiChartLayouts";

const collectSecondarySymbols = (primarySymbol: string, comparisonSymbols: string[]): string[] => {
  const primary = normalizeLayoutSymbol(primarySymbol);
  return Array.from(
    new Set(
      comparisonSymbols
        .map((symbol) => normalizeLayoutSymbol(symbol))
        .filter((symbol) => symbol && symbol !== primary),
    ),
  );
};

export const createMarketLayoutCells = (
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
  previousCells: MultiChartLayoutCell[] = [],
  intervals?: string[],
  presetSymbols?: string[],
  market = "BRVM",
) => createLayoutCells(
  layoutId,
  primarySymbol,
  comparisonSymbols,
  previousCells,
  intervals,
  presetSymbols,
  market,
);

export const createDefaultMarketMultiChartLayout = (
  layoutId: MultiChartLayoutId = "single",
  primarySymbol = "BOAB",
  comparisonSymbols: string[] = [],
  market = "BRVM",
): MultiChartLayoutState => createDefaultMultiChartLayout(
  layoutId,
  primarySymbol,
  comparisonSymbols,
  market,
);

export const reconcileMarketMultiChartLayout = (
  current: MultiChartLayoutState,
  layoutId: MultiChartLayoutId,
  primarySymbol: string,
  comparisonSymbols: string[] = [],
  market = "BRVM",
): MultiChartLayoutState => reconcileMultiChartLayout(
  current,
  layoutId,
  primarySymbol,
  comparisonSymbols,
  market,
);

const buildPresetSymbols = (
  preset: MultiChartPreset,
  primarySymbol: string,
  comparisonSymbols: string[],
): string[] => {
  const definition = getLayoutDefinition(preset.layoutId);
  const primary = normalizeLayoutSymbol(primarySymbol);

  if (preset.id === "multi_timeframe") return Array(definition.chartCount).fill(primary);

  return [primary, ...collectSecondarySymbols(primary, comparisonSymbols)];
};

export const createPresetLayout = (
  preset: MultiChartPreset,
  primarySymbol: string,
  market = "BRVM",
  comparisonSymbols: string[] = [],
): MultiChartLayoutState => {
  const definition = getLayoutDefinition(preset.layoutId);
  const symbols = buildPresetSymbols(preset, primarySymbol, comparisonSymbols);
  const charts = createMarketLayoutCells(
    preset.layoutId,
    primarySymbol,
    comparisonSymbols,
    [],
    preset.intervals,
    symbols,
    market,
  );

  return {
    layoutId: preset.layoutId,
    name: preset.name,
    isEnabled: definition.chartCount > 1,
    sync: { ...preset.sync },
    charts,
    activeChartId: charts[0]?.chartId ?? "chart_1",
  };
};

/** @deprecated Use createMarketLayoutCells. */
export const createBrvmLayoutCells = createMarketLayoutCells;
/** @deprecated Use createDefaultMarketMultiChartLayout. */
export const createDefaultBrvmMultiChartLayout = createDefaultMarketMultiChartLayout;
/** @deprecated Use reconcileMarketMultiChartLayout. */
export const reconcileBrvmMultiChartLayout = reconcileMarketMultiChartLayout;
