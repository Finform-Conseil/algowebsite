import type { IndicatorPeriods } from "./advancedIndicatorsTypes";
import { ADVANCED_MOVING_AVERAGE_SPECS } from "./advancedMovingAverageSeries";
import {
  buildSelectableEmaDefinitions,
  buildSelectableSmaDefinitions,
  MOVING_AVERAGE_TREND_SIGNAL_SPECS,
} from "./movingAverageSeries";
import { PRICE_VS_EMA_METRIC_SPECS } from "./priceVsEmaMetrics";
import { PRICE_VS_SMA_METRIC_SPECS } from "./priceVsSmaMetrics";
import {
  ADVANCED_INDICATOR_REGISTRY_ENTRIES,
  type AdvancedIndicatorRegistryEntry,
} from "./indicatorRegistry";
import {
  getIndicatorRegistryEntryForCatalogKey,
  INDICATOR_MODAL_GROUPS,
  type BackendIndicatorItem,
} from "./indicatorModalRegistry";
import {
  buildResearchBenchmark,
  RESEARCH_GRADE_BENCHMARK_DIMENSIONS,
  RESEARCH_SOURCE_IDS,
  TRADING_INDICATOR_RESEARCH_SOURCES,
  type IndicatorResearchFamily,
  type IndicatorResearchGradePolicy,
  type IndicatorResearchInventoryEntry,
} from "./indicatorResearchGradeTypes";

export {
  RESEARCH_GRADE_BENCHMARK_DIMENSIONS,
  TRADING_INDICATOR_RESEARCH_SOURCES,
};

export type { IndicatorResearchInventoryEntry } from "./indicatorResearchGradeTypes";

export type IndicatorResearchInventoryOptions = {
  indicatorPeriods: IndicatorPeriods;
};

const definePolicy = (policy: IndicatorResearchGradePolicy): IndicatorResearchGradePolicy => policy;

const FAMILY_POLICIES: Record<IndicatorResearchFamily, IndicatorResearchGradePolicy> = {
  "moving-average": definePolicy({
    family: "moving-average",
    marketFit: "standard",
    alertability: "explicit-condition",
    visualDensity: "line-series",
    collisionPolicy: "object-tree-gated",
    confirmationRequired: false,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("MA lines are calculated and selectable.", "MA periods are explicit regime filters, not standalone buy/sell calls.", "Keep distance, trend and required-bars wording visible."),
  }),
  "trend-signal": definePolicy({
    family: "trend-signal",
    marketFit: "brvm-sensitive",
    alertability: "explicit-condition",
    visualDensity: "sparse-capped",
    collisionPolicy: "hide-or-shift-with-bounds",
    confirmationRequired: true,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Trend conditions compare close to reference averages.", "Signal is actionable only with timeframe, distance and confirmation context.", "Gate as condition, not recommendation."),
  }),
  "price-vs-average": definePolicy({
    family: "price-vs-average",
    marketFit: "brvm-sensitive",
    alertability: "explicit-condition",
    visualDensity: "sparse-capped",
    collisionPolicy: "hide-or-shift-with-bounds",
    confirmationRequired: true,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Distance metrics are visible in the modal.", "Distance thresholds clarify regime, extension and mean-reversion risk.", "Show distance as context and avoid automatic trade wording."),
  }),
  oscillator: definePolicy({
    family: "oscillator",
    marketFit: "brvm-sensitive",
    alertability: "explicit-condition",
    visualDensity: "panel-line",
    collisionPolicy: "object-tree-gated",
    confirmationRequired: true,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Oscillator values render in bottom panels.", "Thresholds are interpreted with trend and confirmation context.", "Downgrade lone overbought/oversold readings."),
  }),
  trend: definePolicy({
    family: "trend",
    marketFit: "brvm-sensitive",
    alertability: "explicit-condition",
    visualDensity: "line-series",
    collisionPolicy: "object-tree-gated",
    confirmationRequired: true,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Trend indicators render as overlays or panels.", "Trend state distinguishes continuation, exhaustion and reversal risk.", "Require cross/zero-line or regime condition for alerts."),
  }),
  volatility: definePolicy({
    family: "volatility",
    marketFit: "brvm-sensitive",
    alertability: "derived-context",
    visualDensity: "panel-line",
    collisionPolicy: "object-tree-gated",
    confirmationRequired: true,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Volatility studies are calculated from price ranges.", "Volatility is context, not direction, and must expose expansion/contraction caveats.", "Avoid directional language unless confirmed by price action."),
  }),
  "volume-liquidity": definePolicy({
    family: "volume-liquidity",
    marketFit: "brvm-high-risk",
    alertability: "derived-context",
    visualDensity: "profile-band",
    collisionPolicy: "hide-or-shift-with-bounds",
    confirmationRequired: true,
    requiresLiquidityContext: true,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Volume studies render when volume data exists.", "Signals account for sparse sessions, zero volume and liquidity confirmation.", "Downgrade or annotate signals when volume quality is weak."),
  }),
  "support-resistance": definePolicy({
    family: "support-resistance",
    marketFit: "brvm-sensitive",
    alertability: "explicit-condition",
    visualDensity: "sparse-capped",
    collisionPolicy: "hide-or-shift-with-bounds",
    confirmationRequired: true,
    requiresLiquidityContext: false,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Levels and break conditions render on price.", "Breaks require close, distance and volume/liquidity context where available.", "Keep labels sparse and distinguish test from confirmed break."),
  }),
  "price-action": definePolicy({
    family: "price-action",
    marketFit: "brvm-high-risk",
    alertability: "explicit-condition",
    visualDensity: "sparse-capped",
    collisionPolicy: "hide-or-shift-with-bounds",
    confirmationRequired: true,
    requiresLiquidityContext: true,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Price-action markers are registry-backed.", "Patterns are rare, bounded and qualified by gap/volume/session quality.", "Suppress weak duplicates and explain invalidation price."),
  }),
  "candlestick-pattern": definePolicy({
    family: "candlestick-pattern",
    marketFit: "brvm-high-risk",
    alertability: "explicit-condition",
    visualDensity: "sparse-capped",
    collisionPolicy: "hide-or-shift-with-bounds",
    confirmationRequired: true,
    requiresLiquidityContext: true,
    sourceIds: RESEARCH_SOURCE_IDS,
    benchmark: buildResearchBenchmark("Candlestick patterns have markers and presentation metadata.", "Strong patterns suppress weaker overlaps and require context before action.", "Keep quality score, min bar gap and confirmation visible."),
  }),
};

const OSCILLATOR_FORMULAS = new Set([
  "calculateRSI", "calculateStochastic", "calculateCCI", "calculateCMO", "calculateDYMI",
  "calculateUltimateOscillator", "calculateDPO", "calculateTSI", "calculateAwesomeOscillator",
  "calculateAcceleratorOscillator", "calculateRVI", "calculateFisherTransform", "calculateCoppockCurve",
  "calculatePPO", "calculateAPO", "calculateStochasticRSI", "calculateWilliamsR", "calculateROC",
  "calculateMomentum",
]);
const TREND_FORMULAS = new Set([
  "calculateMACD", "calculateADX", "calculateAroon", "calculateAroonOscillator", "calculateParabolicSAR",
  "calculateSupertrend", "calculateVortex", "calculateTRIX", "calculateSTC", "calculateKST",
  "calculateIchimoku", "calculateLinearRegressionIndicator", "calculateMassIndex", "calculateElderBullBearPower",
]);
const VOLATILITY_FORMULAS = new Set([
  "calculateATR", "calculateNATR", "calculateHistoricalVolatility", "calculatePriceStdDev",
  "calculateChaikinVolatility", "calculateUlcerIndex", "calculateBollinger", "calculateDonchianChannels",
  "calculateKeltnerChannels",
]);
const VOLUME_FORMULAS = new Set([
  "calculateOBV", "calculateADLine", "calculateCMF", "calculateNVI", "calculatePVI",
  "calculateChaikinOscillator", "calculateVolumeOscillator", "calculateVROC", "calculateKlingerOscillator",
  "calculateElderForceIndex", "calculateEOM", "calculateMFI", "calculateVolumeProfile", "calculateVWAP",
]);
const SUPPORT_RESISTANCE_FORMULAS = new Set([
  "calculatePivotPointsStandard", "calculatePivotPointsFibonacci", "calculateMovingAverageCrossSignals",
  "calculateFiftyTwoWeekLevels", "calculateHistoricalRecordLevels",
]);

const resolveFormulaFamily = (functions: readonly string[]): IndicatorResearchFamily => {
  if (functions.includes("calculateCandlestickPatterns")) return "candlestick-pattern";
  if (functions.includes("calculatePriceActionSignals")) return "price-action";
  if (functions.some((name) => VOLUME_FORMULAS.has(name))) return "volume-liquidity";
  if (functions.some((name) => SUPPORT_RESISTANCE_FORMULAS.has(name))) return "support-resistance";
  if (functions.some((name) => VOLATILITY_FORMULAS.has(name))) return "volatility";
  if (functions.some((name) => TREND_FORMULAS.has(name))) return "trend";
  if (functions.some((name) => OSCILLATOR_FORMULAS.has(name))) return "oscillator";
  return "oscillator";
};

const isVolumeWeightedMovingAverage = (key: string): boolean => key.startsWith("vwma_");
const isPriceVsAverageKey = (key: string): boolean => key.startsWith("price_vs_sma") || key.startsWith("price_vs_ema");
const isAdvancedMovingAverageKey = (key: string): boolean => ADVANCED_MOVING_AVERAGE_SPECS.some((spec) => spec.id === key);

const withLiquidityContext = (policy: IndicatorResearchGradePolicy): IndicatorResearchGradePolicy => ({
  ...policy,
  marketFit: "brvm-high-risk",
  requiresLiquidityContext: true,
});

export const getIndicatorResearchGradePolicyForRegistryEntry = (
  entry: AdvancedIndicatorRegistryEntry,
): IndicatorResearchGradePolicy => FAMILY_POLICIES[resolveFormulaFamily(entry.formula.functions)];

export const getIndicatorResearchGradePolicyForCatalogKey = (key: string): IndicatorResearchGradePolicy => {
  const registryEntry = getIndicatorRegistryEntryForCatalogKey(key);
  if (registryEntry) return getIndicatorResearchGradePolicyForRegistryEntry(registryEntry);
  if (isPriceVsAverageKey(key)) return FAMILY_POLICIES["price-vs-average"];
  if (isVolumeWeightedMovingAverage(key)) return withLiquidityContext(FAMILY_POLICIES["moving-average"]);
  if (isAdvancedMovingAverageKey(key)) return FAMILY_POLICIES["moving-average"];
  return FAMILY_POLICIES.oscillator;
};

const getCatalogInventoryId = (item: BackendIndicatorItem): string => {
  const registryEntry = getIndicatorRegistryEntryForCatalogKey(item.key);
  if (!registryEntry) return "catalog:" + item.key;
  return registryEntry.key === item.key ? "advanced:" + registryEntry.id : "catalog:" + item.key;
};

const buildCatalogInventory = (): IndicatorResearchInventoryEntry[] => INDICATOR_MODAL_GROUPS.flatMap((group) =>
  group.sections.flatMap((section) => section.items.map((item) => ({
    id: getCatalogInventoryId(item),
    key: item.key,
    label: item.name,
    source: "modal-catalog" as const,
    policy: getIndicatorResearchGradePolicyForCatalogKey(item.key),
  }))),
);

const buildMovingAverageInventory = (
  indicatorPeriods: IndicatorPeriods,
): IndicatorResearchInventoryEntry[] => [
  ...buildSelectableSmaDefinitions(indicatorPeriods),
  ...buildSelectableEmaDefinitions(),
].map((definition) => ({
  id: "ma:" + definition.dataKey,
  key: definition.dataKey,
  label: definition.label,
  source: "moving-average" as const,
  policy: FAMILY_POLICIES["moving-average"],
}));

const buildTrendSignalInventory = (): IndicatorResearchInventoryEntry[] => MOVING_AVERAGE_TREND_SIGNAL_SPECS.map((spec) => ({
  id: "trend:" + spec.id,
  key: spec.id,
  label: spec.label,
  source: "trend-signal" as const,
  policy: FAMILY_POLICIES["trend-signal"],
}));

export const buildIndicatorResearchGradeInventory = (
  options: IndicatorResearchInventoryOptions,
): IndicatorResearchInventoryEntry[] => [
  ...buildCatalogInventory(),
  ...buildMovingAverageInventory(options.indicatorPeriods),
  ...buildTrendSignalInventory(),
];

export const getResearchGradePolicyCoverageSummary = (options: IndicatorResearchInventoryOptions) => {
  const inventory = buildIndicatorResearchGradeInventory(options);
  return {
    total: inventory.length,
    registryEntries: ADVANCED_INDICATOR_REGISTRY_ENTRIES.length,
    priceVsAverage: PRICE_VS_SMA_METRIC_SPECS.length + PRICE_VS_EMA_METRIC_SPECS.length,
    advancedMovingAverages: ADVANCED_MOVING_AVERAGE_SPECS.length,
    movingAverageTrendSignals: MOVING_AVERAGE_TREND_SIGNAL_SPECS.length,
  };
};
