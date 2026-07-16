import type { IndicatorResearchFamily } from "./indicatorResearchGradeTypes";

export interface IndicatorRuntimeAlertDefinition {
  family: Extract<IndicatorResearchFamily, "oscillator" | "trend" | "volatility" | "volume-liquidity">;
  inventoryId: string;
  catalogKey: string;
  runtimeKey: string;
  label: string;
}

type RuntimeAlertRow = readonly [
  family: IndicatorRuntimeAlertDefinition["family"],
  inventoryId: string,
  catalogKey: string,
  label: string,
];

const RUNTIME_ALERT_ROWS: readonly RuntimeAlertRow[] = [
  ["oscillator", "advanced:rsi", "rsi_9", "RSI 9"],
  ["oscillator", "catalog:rsi_14", "rsi_14", "RSI 14"],
  ["oscillator", "catalog:rsi_25", "rsi_25", "RSI 25"],
  ["oscillator", "advanced:stochastic", "stoch_k", "Stoch %K"],
  ["oscillator", "catalog:stoch_d", "stoch_d", "Stoch %D"],
  ["oscillator", "advanced:stochRsi", "stoch_rsi_k", "Stoch RSI %K"],
  ["oscillator", "catalog:stoch_rsi_d", "stoch_rsi_d", "Stoch RSI %D"],
  ["oscillator", "advanced:cci14", "cci_14", "CCI 14"],
  ["oscillator", "advanced:cci20", "cci_20", "CCI 20"],
  ["volume-liquidity", "advanced:mfi14", "mfi_14", "MFI 14"],
  ["oscillator", "advanced:williamsR14", "williams_r_14", "Williams %R 14"],
  ["oscillator", "advanced:roc10", "roc_10", "ROC 10"],
  ["oscillator", "advanced:roc20", "roc_20", "ROC 20"],
  ["oscillator", "advanced:momentum10", "momentum_10", "Momentum 10"],
  ["oscillator", "advanced:momentum20", "momentum_20", "Momentum 20"],
  ["oscillator", "advanced:cmo14", "cmo_14", "CMO 14"],
  ["oscillator", "advanced:dymi", "dymi", "DYMI"],
  ["oscillator", "advanced:ultimateOsc", "ultimate_osc", "Ultimate Osc"],
  ["oscillator", "advanced:dpo20", "dpo_20", "DPO 20"],
  ["oscillator", "advanced:tsi", "tsi", "TSI"],
  ["oscillator", "catalog:tsi_signal", "tsi_signal", "TSI Signal"],
  ["oscillator", "advanced:awesomeOsc", "awesome_osc", "Awesome Osc"],
  ["oscillator", "advanced:acOsc", "ac_osc", "AC Osc"],
  ["oscillator", "advanced:rvi", "rvi", "RVI"],
  ["oscillator", "catalog:rvi_signal", "rvi_signal", "RVI Signal"],
  ["oscillator", "advanced:fisherTransform", "fisher_transform", "Fisher"],
  ["oscillator", "catalog:fisher_transform_signal", "fisher_transform_signal", "Fisher Signal"],
  ["trend", "advanced:elderBullBear", "elder_bull_power", "Elder Bull"],
  ["trend", "catalog:elder_bear_power", "elder_bear_power", "Elder Bear"],
  ["oscillator", "advanced:coppock", "coppock_curve", "Coppock"],
  ["trend", "advanced:macd", "macd_line", "MACD Line"],
  ["trend", "catalog:macd_signal", "macd_signal", "MACD Signal"],
  ["trend", "catalog:macd_histogram", "macd_histogram", "MACD Histogram"],
  ["oscillator", "advanced:ppo", "macd_ppo", "PPO Line"],
  ["oscillator", "catalog:macd_ppo_signal", "macd_ppo_signal", "PPO Signal"],
  ["oscillator", "catalog:macd_ppo_histogram", "macd_ppo_histogram", "PPO Histogram"],
  ["oscillator", "advanced:apo", "macd_apo", "APO"],
  ["trend", "advanced:parabolicSar", "parabolic_sar", "SAR"],
  ["trend", "catalog:parabolic_sar_signal", "parabolic_sar_signal", "SAR Signal"],
  ["trend", "advanced:ichimoku", "ichimoku_tenkan", "Tenkan"],
  ["trend", "catalog:ichimoku_kijun", "ichimoku_kijun", "Kijun"],
  ["trend", "catalog:ichimoku_senkou_a", "ichimoku_senkou_a", "Senkou A"],
  ["trend", "catalog:ichimoku_senkou_b", "ichimoku_senkou_b", "Senkou B"],
  ["trend", "catalog:ichimoku_chikou", "ichimoku_chikou", "Chikou"],
  ["trend", "catalog:ichimoku_cloud_color", "ichimoku_cloud_color", "Cloud Color"],
  ["trend", "catalog:price_vs_cloud", "price_vs_cloud", "Prix / Nuage"],
  ["trend", "advanced:adx", "adx", "ADX"],
  ["trend", "catalog:adx_plus_di", "adx_plus_di", "+DI"],
  ["trend", "catalog:adx_minus_di", "adx_minus_di", "-DI"],
  ["trend", "catalog:adx_trend_strength", "adx_trend_strength", "Trend Strength"],
  ["trend", "advanced:aroon", "aroon_up", "Aroon Up"],
  ["trend", "catalog:aroon_down", "aroon_down", "Aroon Down"],
  ["trend", "advanced:aroonOsc", "aroon_oscillator", "Aroon Osc"],
  ["trend", "advanced:supertrend", "supertrend", "Supertrend"],
  ["trend", "catalog:supertrend_signal", "supertrend_signal", "Supertrend Signal"],
  ["trend", "advanced:vortex", "vortex_plus", "Vortex +"],
  ["trend", "catalog:vortex_minus", "vortex_minus", "Vortex -"],
  ["trend", "advanced:trix", "trix", "TRIX"],
  ["trend", "advanced:stc", "stc", "STC"],
  ["trend", "advanced:massIndex", "mass_index", "Mass Index"],
  ["trend", "advanced:kst", "kst", "KST"],
  ["trend", "catalog:kst_signal", "kst_signal", "KST Signal"],
  ["trend", "advanced:linearRegression", "linear_reg_value", "LinReg Value"],
  ["trend", "catalog:linear_reg_slope", "linear_reg_slope", "LinReg Slope"],
  ["volatility", "advanced:bollinger", "bb_upper", "BB Upper"],
  ["volatility", "catalog:bb_middle", "bb_middle", "BB Middle"],
  ["volatility", "catalog:bb_lower", "bb_lower", "BB Lower"],
  ["volatility", "advanced:bbWidth", "bb_width", "BB Width"],
  ["volatility", "advanced:bbPercentB", "bb_pct", "BB %B"],
  ["volatility", "advanced:atr", "atr_14", "ATR 14"],
  ["volatility", "advanced:atr20", "atr_20", "ATR 20"],
  ["volatility", "advanced:natr14", "natr_14", "NATR 14"],
  ["volatility", "advanced:donchian", "donchian_upper", "Donchian Upper"],
  ["volatility", "catalog:donchian_middle", "donchian_middle", "Donchian Middle"],
  ["volatility", "catalog:donchian_lower", "donchian_lower", "Donchian Lower"],
  ["volatility", "advanced:keltner", "keltner_upper", "Keltner Upper"],
  ["volatility", "catalog:keltner_middle", "keltner_middle", "Keltner Middle"],
  ["volatility", "catalog:keltner_lower", "keltner_lower", "Keltner Lower"],
  ["volatility", "advanced:hv10", "hv_10", "HV 10"],
  ["volatility", "advanced:hv20", "hv_20", "HV 20"],
  ["volatility", "advanced:hv30", "hv_30", "HV 30"],
  ["volatility", "advanced:hv60", "hv_60", "HV 60"],
  ["volatility", "advanced:hv90", "hv_90", "HV 90"],
  ["volatility", "advanced:hv252", "hv_252", "HV 252"],
  ["volatility", "advanced:stdDev20", "std_dev_20", "Std Dev 20"],
  ["volatility", "advanced:chaikinVol", "chaikin_vol", "Chaikin Volatility"],
  ["volatility", "advanced:ulcerIndex", "ulcer_index", "Ulcer Index"],
  ["volume-liquidity", "advanced:obv", "obv", "OBV"],
  ["volume-liquidity", "advanced:adLine", "ad_line", "A/D Line"],
  ["volume-liquidity", "advanced:cmf20", "cmf_20", "CMF 20"],
  ["volume-liquidity", "advanced:nvi", "nvi", "NVI"],
  ["volume-liquidity", "advanced:pvi", "pvi", "PVI"],
  ["volume-liquidity", "advanced:chaikinOsc", "chaikin_osc", "Chaikin Oscillator"],
  ["volume-liquidity", "advanced:volumeOsc", "volume_osc", "Volume Oscillator"],
  ["volume-liquidity", "advanced:vroc14", "vroc_14", "VROC 14"],
  ["volume-liquidity", "advanced:klinger", "klinger_osc", "Klinger Osc"],
  ["volume-liquidity", "catalog:klinger_signal", "klinger_signal", "Klinger Signal"],
  ["volume-liquidity", "advanced:elderForceIndex", "elder_force_raw", "Elder Force Raw"],
  ["volume-liquidity", "catalog:force_index_13", "force_index_13", "Force Index 13"],
  ["volume-liquidity", "advanced:eom14", "eom_14", "EOM 14"],
  ["volume-liquidity", "advanced:volumeProfile", "vp_poc", "POC"],
  ["volume-liquidity", "catalog:vp_vah", "vp_vah", "VAH"],
  ["volume-liquidity", "catalog:vp_val", "vp_val", "VAL"],
  ["volume-liquidity", "advanced:vwap", "vwap", "VWAP"],
  ["volume-liquidity", "catalog:is_above_vwap", "is_above_vwap", "Prix > VWAP"],
];

const toRuntimeKey = (catalogKey: string): string => {
  if (catalogKey === "rsi_9") return "technical:rsi9";
  if (catalogKey === "rsi_14") return "technical:rsi14";
  if (catalogKey === "rsi_25") return "technical:rsi25";
  return "technical:" + catalogKey;
};

const buildRuntimeDefinitions = (): readonly IndicatorRuntimeAlertDefinition[] => RUNTIME_ALERT_ROWS.map(([
  family,
  inventoryId,
  catalogKey,
  label,
]) => ({
  catalogKey,
  family,
  inventoryId,
  label,
  runtimeKey: toRuntimeKey(catalogKey),
}));

export const INDICATOR_RUNTIME_ALERT_DEFINITIONS = buildRuntimeDefinitions();

export const INDICATOR_RUNTIME_ALERT_KEY_BY_INVENTORY_ID: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(INDICATOR_RUNTIME_ALERT_DEFINITIONS.map((definition) => [
    definition.inventoryId,
    definition.runtimeKey,
  ])),
);

export const INDICATOR_RUNTIME_ALERT_CATALOG_KEY_BY_RUNTIME_KEY: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(INDICATOR_RUNTIME_ALERT_DEFINITIONS.map((definition) => [
    definition.runtimeKey,
    definition.catalogKey,
  ])),
);

export const getIndicatorRuntimeAlertKeyForInventoryId = (inventoryId: string): string | null => (
  INDICATOR_RUNTIME_ALERT_KEY_BY_INVENTORY_ID[inventoryId] ?? null
);

export const isIndicatorRuntimeAlertInventoryId = (inventoryId: string): boolean => (
  getIndicatorRuntimeAlertKeyForInventoryId(inventoryId) !== null
);
