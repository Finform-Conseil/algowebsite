import type { AdvancedIndicatorsState } from "../indicators/advancedIndicatorsTypes";

export type IndicatorObjectId = string;

const ADVANCED_INDICATOR_CHILD_OBJECT_IDS: Partial<Record<keyof AdvancedIndicatorsState, readonly IndicatorObjectId[]>> = {
  macd: ["macd-line", "macd-signal", "macd-hist"],
  bollinger: ["boll-upper", "boll-mid", "boll-lower", "boll-fill", "bollinger-fill"],
  stochastic: ["stoch-k", "stoch-d"],
  stochRsi: ["stochrsi-k", "stochrsi-d"],
  ichimoku: ["ichimoku-tenkan", "ichimoku-kijun", "ichimoku-chikou", "ichimoku-senkouA", "ichimoku-senkouB", "ichimoku-cloud"],
  tsi: ["tsi-line", "tsi-signal"],
  rvi: ["rvi-line", "rvi-signal"],
  fisherTransform: ["fisher-line", "fisher-signal"],
  elderBullBear: ["elder-bull", "elder-bear"],
  ppo: ["ppo-line", "ppo-signal", "ppo-histogram"],
  adx: ["adx-line", "adx-plus-di", "adx-minus-di"],
  aroon: ["aroon-up", "aroon-down"],
  supertrend: ["supertrend-line", "supertrend-line-up", "supertrend-line-down", "supertrend-signal"],
  vortex: ["vortex-plus", "vortex-minus"],
  kst: ["kst-line", "kst-signal"],
  linearRegression: ["linear-reg-value", "linear-reg-slope"],
  donchian: ["donchian-upper", "donchian-middle", "donchian-lower", "donchian-fill"],
  keltner: ["keltner-upper", "keltner-middle", "keltner-lower", "keltner-fill"],
  klinger: ["klinger-osc", "klinger-signal"],
  elderForceIndex: ["elder-force-raw", "force-index-13"],
  volumeProfile: ["volume-profile-rows", "vp-poc", "vp-vah", "vp-val"],
  pivotPointsStandard: [
    "pivot-standard-p",
    "pivot-standard-r1",
    "pivot-standard-r2",
    "pivot-standard-r3",
    "pivot-standard-s1",
    "pivot-standard-s2",
    "pivot-standard-s3",
  ],
  pivotPointsFibonacci: [
    "pivot-fib-p",
    "pivot-fib-r1",
    "pivot-fib-r2",
    "pivot-fib-r3",
    "pivot-fib-s1",
    "pivot-fib-s2",
    "pivot-fib-s3",
  ],
  movingAverageCrosses: ["golden-cross-marker", "death-cross-marker"],
  vwap: ["vwap-line", "price-above-vwap-state"],
  fiftyTwoWeekHigh: ["52w-high-level", "new-52w-high-marker"],
  fiftyTwoWeekLow: ["52w-low-level", "new-52w-low-marker"],
  ath: ["ath-level", "new-ath-marker"],
  atl: ["atl-level", "new-atl-marker"],
  breakoutResistance: ["breakout-resistance-marker"],
  breakdownSupport: ["breakdown-support-marker"],
  gapUp: ["gap-up-marker"],
  gapDown: ["gap-down-marker"],
  trueGapUp: ["true-gap-up-marker"],
  trueGapDown: ["true-gap-down-marker"],
  gapPct: ["gap-pct-label"],
  consecutiveUpDays: ["up-streak-badge"],
  consecutiveDownDays: ["down-streak-badge"],
  insideBar: ["inside-bar-outline"],
  outsideBar: ["outside-bar-outline"],
  doji: ["doji-marker"],
  longLeggedDoji: ["long-legged-doji-marker"],
  rickshawMan: ["rickshaw-man-marker"],
  dragonflyDoji: ["dragonfly-doji-marker"],
  gravestoneDoji: ["gravestone-doji-marker"],
  tristar: ["tristar-zone"],
  hammer: ["hammer-marker"],
  hangingMan: ["hanging-man-marker"],
  takuri: ["takuri-marker"],
  invertedHammer: ["inverted-hammer-marker"],
  shootingStar: ["shooting-star-marker"],
  marubozuBull: ["marubozu-bull-outline"],
  marubozuBear: ["marubozu-bear-outline"],
  spinningTop: ["spinning-top-marker"],
  parabolicSar: ["parabolic-sar", "parabolic-sar-signal"],
  cci20: ["cci"],
  cci: ["cci20"],
  williamsR14: ["williamsR"],
  williamsR: ["williamsR14"],
  roc10: ["roc"],
  roc: ["roc10"],
};

export const getAdvancedIndicatorObjectIds = (indicatorId: keyof AdvancedIndicatorsState): IndicatorObjectId[] => {
  const ids = new Set<IndicatorObjectId>([indicatorId]);
  ADVANCED_INDICATOR_CHILD_OBJECT_IDS[indicatorId]?.forEach((id) => ids.add(id));
  return Array.from(ids);
};

export const getAdvancedIndicatorIdForObjectId = (
  objectId: IndicatorObjectId,
): keyof AdvancedIndicatorsState | null => {
  const advancedIndicatorIds = Object.keys(ADVANCED_INDICATOR_CHILD_OBJECT_IDS) as Array<keyof AdvancedIndicatorsState>;

  return (
    advancedIndicatorIds.find((indicatorId) => {
      if (indicatorId === objectId) return true;
      return ADVANCED_INDICATOR_CHILD_OBJECT_IDS[indicatorId]?.includes(objectId) === true;
    }) ?? null
  );
};

export const getSmaObjectIds = (period: number): IndicatorObjectId[] => [`sma-${period}`];

export const getEmaObjectIds = (period: number): IndicatorObjectId[] => [`ema-${period}`];

export const getAdvancedMovingAverageObjectIds = (family: string, period: number): IndicatorObjectId[] => [`${family}-${period}`];

export const revealHiddenObjectIds = (
  hiddenObjectIds: Record<string, boolean>,
  objectIds: readonly IndicatorObjectId[],
): Record<string, boolean> => {
  if (objectIds.length === 0) return hiddenObjectIds;

  let changed = false;
  const nextHiddenObjectIds = { ...hiddenObjectIds };

  objectIds.forEach((id) => {
    if (nextHiddenObjectIds[id] === true) {
      delete nextHiddenObjectIds[id];
      changed = true;
    }
  });

  return changed ? nextHiddenObjectIds : hiddenObjectIds;
};
