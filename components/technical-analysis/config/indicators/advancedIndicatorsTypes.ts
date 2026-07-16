export interface BollingerSettings {
  length: number;
  source: "open" | "high" | "low" | "close" | "hl2" | "hlc3" | "ohlc4" | "hlcc4";
  multiplier: number;
  offset: number;
  showUpper: boolean;
  showMiddle: boolean;
  showLower: boolean;
  showFill: boolean;
  upperColor: string;
  middleColor: string;
  lowerColor: string;
  fillColor: string;
  fillOpacity: number;
}

export interface AdvancedIndicatorsState {
  rsi: boolean;
  macd: boolean;
  bollinger: boolean;
  stochastic: boolean;
  atr: boolean;
  atr20: boolean;
  natr14: boolean;
  donchian: boolean;
  keltner: boolean;
  hv10: boolean;
  hv20: boolean;
  hv30: boolean;
  hv60: boolean;
  hv90: boolean;
  hv252: boolean;
  stdDev20: boolean;
  chaikinVol: boolean;
  cci: boolean;
  cci14: boolean;
  cci20: boolean;
  mfi14: boolean;
  williamsR: boolean;
  williamsR14: boolean;
  roc: boolean;
  roc10: boolean;
  roc20: boolean;
  momentum10: boolean;
  momentum20: boolean;
  cmo14: boolean;
  dymi: boolean;
  ultimateOsc: boolean;
  dpo20: boolean;
  tsi: boolean;
  awesomeOsc: boolean;
  acOsc: boolean;
  rvi: boolean;
  fisherTransform: boolean;
  elderBullBear: boolean;
  coppock: boolean;
  ppo: boolean;
  apo: boolean;
  parabolicSar: boolean;
  adx: boolean;
  aroon: boolean;
  aroonOsc: boolean;
  supertrend: boolean;
  vortex: boolean;
  trix: boolean;
  stc: boolean;
  massIndex: boolean;
  kst: boolean;
  linearRegression: boolean;
  ulcerIndex: boolean;
  obv: boolean;
  adLine: boolean;
  cmf20: boolean;
  nvi: boolean;
  pvi: boolean;
  chaikinOsc: boolean;
  volumeOsc: boolean;
  vroc14: boolean;
  klinger: boolean;
  elderForceIndex: boolean;
  eom14: boolean;
  volumeProfile: boolean;
  pivotPointsStandard: boolean;
  pivotPointsFibonacci: boolean;
  movingAverageCrosses: boolean;
  vwap: boolean;
  fiftyTwoWeekHigh: boolean;
  fiftyTwoWeekLow: boolean;
  ath: boolean;
  atl: boolean;
  breakoutResistance: boolean;
  breakdownSupport: boolean;
  gapUp: boolean;
  gapDown: boolean;
  trueGapUp: boolean;
  trueGapDown: boolean;
  gapPct: boolean;
  consecutiveUpDays: boolean;
  consecutiveDownDays: boolean;
  insideBar: boolean;
  outsideBar: boolean;
  doji: boolean;
  longLeggedDoji: boolean;
  rickshawMan: boolean;
  dragonflyDoji: boolean;
  gravestoneDoji: boolean;
  tristar: boolean;
  hammer: boolean;
  hangingMan: boolean;
  takuri: boolean;
  invertedHammer: boolean;
  shootingStar: boolean;
  engulfingBullish: boolean;
  engulfingBearish: boolean;
  haramiBullish: boolean;
  haramiBearish: boolean;
  tweezerTop: boolean;
  tweezerBottom: boolean;
  piercingLine: boolean;
  darkCloudCover: boolean;
  tasukiGap: boolean;
  separatingLines: boolean;
  thrusting: boolean;
  counterattack: boolean;
  morningStar: boolean;
  eveningStar: boolean;
  threeWhiteSoldiers: boolean;
  threeBlackCrows: boolean;
  threeInsideUp: boolean;
  threeInsideDown: boolean;
  uniqueThreeRiver: boolean;
  upsideGapTwoCrows: boolean;
  kickerBull: boolean;
  kickerBear: boolean;
  abandonedBabyBull: boolean;
  abandonedBabyBear: boolean;
  beltHoldBull: boolean;
  beltHoldBear: boolean;
  breakawayBull: boolean;
  breakawayBear: boolean;
  risingThreeMethods: boolean;
  fallingThreeMethods: boolean;
  matHold: boolean;
  gapSideBySideWhite: boolean;
  hikkake: boolean;
  concealingBabySwallow: boolean;
  ladderBottom: boolean;
  stickSandwich: boolean;
  marubozuBull: boolean;
  marubozuBear: boolean;
  spinningTop: boolean;
  ichimoku: boolean;
  stochRsi: boolean;
  // [TENOR 2026 HDR] Bollinger Derived Metrics (Oscillators)
  bbWidth: boolean;
  bbPercentB: boolean;
}

// ============================================================================
// INDICATOR SUPPORT TYPES
// ============================================================================

export interface IndicatorPeriods {
  sma1: number;
  sma2: number;
  sma3: number;
  rsiPeriod: number;
  [key: string]: number;
}

export type MovingAverageTrendSignalId =
  | "is_above_ema20"
  | "is_above_sma50"
  | "is_above_sma200";

export interface MovingAverageTrendSignalsState {
  active: Record<MovingAverageTrendSignalId, boolean>;
  showSourceAverages: boolean;
}

export type PriceVsSmaMetricId =
  | "price_vs_sma20_pct"
  | "price_vs_sma50_pct"
  | "price_vs_sma150_pct"
  | "price_vs_sma200_pct";

export type PriceVsEmaMetricId =
  | "price_vs_ema20_pct"
  | "price_vs_ema50_pct"
  | "price_vs_ema200_pct";

export type PriceVsMovingAverageMetricState = "above" | "below" | "neutral" | "unknown";
export type PriceVsMovingAverageQualityTone = "success" | "warning" | "danger" | "muted";
export type PriceVsSmaMetricState = PriceVsMovingAverageMetricState;
export type PriceVsSmaQualityTone = PriceVsMovingAverageQualityTone;
export type PriceVsEmaMetricState = PriceVsMovingAverageMetricState;
export type PriceVsEmaQualityTone = PriceVsMovingAverageQualityTone;

export interface PriceVsSmaMetricsState {
  active: Record<PriceVsSmaMetricId, boolean>;
}

export interface PriceVsEmaMetricsState {
  active: Record<PriceVsEmaMetricId, boolean>;
}
