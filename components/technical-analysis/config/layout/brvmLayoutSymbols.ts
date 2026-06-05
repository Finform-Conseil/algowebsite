import { BRVM_SECURITIES } from "@/core/data/brvm-securities";

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
  const security = BRVM_SECURITIES.find((entry) => entry.ticker === primary);
  if (!security) return [primary, "BOAC", "SGBC", "BRVMC"];

  const sector = security.sector;
  if (sector === "Market Indices" || sector === "Delisted" || sector === "Other") {
    return [primary, "BOAC", "SGBC", "BRVMC"];
  }

  const peers = BRVM_SECURITIES
    .filter((entry) => entry.sector === sector && entry.ticker !== primary && entry.status !== "delisted")
    .sort((a, b) => b.marketCap - a.marketCap);

  const result: string[] = [primary];
  if (peers[0]) result.push(peers[0].ticker);
  if (peers[1]) result.push(peers[1].ticker);
  if (result.length < 2) result.push("BOAC");
  if (result.length < 3) result.push("SGBC");
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

  const sectorFallbacks = {
    Telecom: "SNTS",
    Banking: "SGBC",
    Energy: "TTLC",
    Industry: "PALC",
    Distribution: "CFAC",
  } as const;
  const result: string[] = ["BRVMC"];

  sectors.forEach((sector) => {
    const topStock = BRVM_SECURITIES
      .filter((entry) => entry.sector === sector && entry.status !== "delisted")
      .sort((a, b) => b.marketCap - a.marketCap)[0];

    result.push(topStock?.ticker ?? sectorFallbacks[sector]);
  });

  return result;
};

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
