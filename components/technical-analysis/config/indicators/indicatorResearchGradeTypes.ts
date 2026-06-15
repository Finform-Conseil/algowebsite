export type IndicatorResearchFamily =
  | "moving-average"
  | "trend-signal"
  | "price-vs-average"
  | "oscillator"
  | "trend"
  | "volatility"
  | "volume-liquidity"
  | "support-resistance"
  | "price-action"
  | "candlestick-pattern";

export type IndicatorResearchMarketFit = "standard" | "brvm-sensitive" | "brvm-high-risk";
export type IndicatorResearchAlertability = "explicit-condition" | "derived-context" | "not-alertable";
export type IndicatorResearchVisualDensity = "line-series" | "panel-line" | "profile-band" | "sparse-capped";
export type IndicatorResearchCollisionPolicy = "not-applicable" | "object-tree-gated" | "hide-or-shift-with-bounds";

export const RESEARCH_GRADE_BENCHMARK_DIMENSIONS = [
  "signalValidity",
  "visualDensity",
  "labelCollisionHandling",
  "tooltipDomainExplanation",
  "alertActionability",
  "brvmAfricaMarketFit",
  "mobileViewportBehavior",
] as const;

export type ResearchGradeBenchmarkDimension = typeof RESEARCH_GRADE_BENCHMARK_DIMENSIONS[number];

export type ResearchGradeBenchmarkCell = {
  localCurrent: string;
  professionalTarget: string;
  requiredChange: string;
};

export type IndicatorResearchGradePolicy = {
  family: IndicatorResearchFamily;
  marketFit: IndicatorResearchMarketFit;
  alertability: IndicatorResearchAlertability;
  visualDensity: IndicatorResearchVisualDensity;
  collisionPolicy: IndicatorResearchCollisionPolicy;
  confirmationRequired: boolean;
  requiresLiquidityContext: boolean;
  benchmark: Record<ResearchGradeBenchmarkDimension, ResearchGradeBenchmarkCell>;
  sourceIds: readonly string[];
};

export type IndicatorResearchSource = {
  id: string;
  name: string;
  url: string;
  relevance: string;
};

export type IndicatorResearchInventoryEntry = {
  id: string;
  key: string;
  label: string;
  source: "modal-catalog" | "moving-average" | "trend-signal";
  policy: IndicatorResearchGradePolicy;
};

export const TRADING_INDICATOR_RESEARCH_SOURCES: readonly IndicatorResearchSource[] = [
  {
    id: "tradingview-rsi",
    name: "TradingView RSI Help Center",
    url: "https://www.tradingview.com/support/solutions/43000502338-relative-strength-index-rsi/",
    relevance: "RSI formula, default length, divergence and alert conditions.",
  },
  {
    id: "tradingview-bollinger",
    name: "TradingView Bollinger Bands Help Center",
    url: "https://www.tradingview.com/support/solutions/43000501840-bollinger-bands-bb/",
    relevance: "Volatility bands, confirmation requirements and walking-the-bands caveat.",
  },
  {
    id: "tradingview-macd",
    name: "TradingView MACD Help Center",
    url: "https://www.tradingview.com/support/solutions/43000502344-moving-average-convergence-divergence-macd-indicator/",
    relevance: "MACD line, signal, histogram, divergence and explicit alert conditions.",
  },
  {
    id: "gocharting-catalog",
    name: "GoCharting Technical Indicator Documentation",
    url: "https://docs.gocharting.com/docs/",
    relevance: "Professional terminal taxonomy: oscillators, overlays, momentum, volume and candlestick patterns.",
  },
  {
    id: "investopedia-confirmation",
    name: "Investopedia Bollinger Bands and RSI strategy",
    url: "https://www.investopedia.com/ask/answers/121014/how-do-i-create-trading-strategy-bollinger-bands-and-relative-strength-indicator-rsi.asp",
    relevance: "Independent reminder that indicators should confirm or reject signals instead of acting alone.",
  },
  {
    id: "brvm-liquidity",
    name: "BRVM liquidity and transaction-frequency context",
    url: "https://en.wikipedia.org/wiki/BRVM",
    relevance: "BRVM index methodology highlights transaction volume and frequency as liquidity gates.",
  },
];

export const RESEARCH_SOURCE_IDS = TRADING_INDICATOR_RESEARCH_SOURCES.map((source) => source.id);

export const createResearchBenchmarkCell = (
  localCurrent: string,
  professionalTarget: string,
  requiredChange: string,
): ResearchGradeBenchmarkCell => ({ localCurrent, professionalTarget, requiredChange });

export const buildResearchBenchmark = (
  localCurrent: string,
  professionalTarget: string,
  requiredChange: string,
  overrides: Partial<Record<ResearchGradeBenchmarkDimension, ResearchGradeBenchmarkCell>> = {},
): Record<ResearchGradeBenchmarkDimension, ResearchGradeBenchmarkCell> => ({
  signalValidity: createResearchBenchmarkCell(localCurrent, professionalTarget, requiredChange),
  visualDensity: createResearchBenchmarkCell("Catalog and object tree can toggle the signal.", "Chart remains readable under many active studies.", "Cap noisy markers and favor compact lines."),
  labelCollisionHandling: createResearchBenchmarkCell("Renderer-specific handling varies by family.", "No label escapes chart bounds or hides price action.", "Use object-tree gates, hide-overlap or bounded shifts."),
  tooltipDomainExplanation: createResearchBenchmarkCell("Formula labels are present but not always explanatory.", "Tooltip explains what happened, why it matters and what price condition matters.", "Attach family-specific domain wording before claiming parity."),
  alertActionability: createResearchBenchmarkCell("Some signals are visual only.", "Every alert-ready signal maps to a concrete condition.", "Expose explicit conditions or honestly mark as derived context."),
  brvmAfricaMarketFit: createResearchBenchmarkCell("BRVM liquidity is not uniformly encoded in every study.", "Low-liquidity, stale bars and sparse volume downgrade weak signals.", "Require liquidity context for volume-sensitive and sparse-market signals."),
  mobileViewportBehavior: createResearchBenchmarkCell("Modal and renderer have responsive paths but no per-family guarantee.", "Small screens preserve price readability and controls remain tappable.", "Smoke active families on mobile viewport before promotion."),
  ...overrides,
});
