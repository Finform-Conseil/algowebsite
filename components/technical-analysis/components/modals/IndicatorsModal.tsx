// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/components/modals/IndicatorsModal.tsx
// [TENOR 2026 FIX] SCAR-125: Restored SMA/EMA toggles. Migrated to Smart Component.
// [TENOR 2026 FIX] SCAR-126: Premium UI Overhaul. Fixed overlapping cards and removed native checkboxes.
// ================================================================================

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { BaseModal } from "../common/BaseModal";
import { AdvancedIndicatorsState } from "../../config/TechnicalAnalysisTypes";
import {
  selectAdvancedIndicators,
  selectChartConfig,
  selectIndicatorPeriods,
  toggleAdvancedIndicator,
  setChartConfig,
} from "../../store/technicalAnalysisSlice";

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // [TENOR 2026] Soft Deprecation: Props made optional to avoid breaking ModalOrchestrator.
  // This component now reads directly from Redux (Smart Component pattern).
  advancedIndicators?: AdvancedIndicatorsState;
  onToggle?: (indicator: keyof AdvancedIndicatorsState) => void;
}

type BackendIndicatorItem = {
  key: string;
  name: string;
  desc: string;
  wiredId?: keyof AdvancedIndicatorsState;
};

type BackendIndicatorGroup = {
  title: string;
  subtitle: string;
  sections: {
    title: string;
    items: BackendIndicatorItem[];
  }[];
};

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const chartConfig = useSelector(selectChartConfig);
  const indicatorPeriods = useSelector(selectIndicatorPeriods);

  const smaIndicators = [
    { key: "sma_5", period: indicatorPeriods.sma1, label: `SMA ${indicatorPeriods.sma1}`, color: "#45c3a1" },
    { key: "sma_10", period: indicatorPeriods.sma2, label: `SMA ${indicatorPeriods.sma2}`, color: "#f06467" },
    { key: "sma_20", period: indicatorPeriods.sma3, label: `SMA ${indicatorPeriods.sma3}`, color: "#FF9F04" },
    { key: "sma_100", period: 100, label: "SMA 100", color: "#7dd3fc" },
    { key: "sma_150", period: 150, label: "SMA 150", color: "#a78bfa" },
    { key: "sma_50", period: 50, label: "SMA 50", color: "#2E93fA" },
    { key: "sma_200", period: 200, label: "SMA 200", color: "#66DA26" },
  ];

  const emaIndicators = [
    { key: "ema_5", period: 5, label: "EMA 5", color: "#9C27B0" },
    { key: "ema_9", period: 9, label: "EMA 9", color: "#c026d3" },
    { key: "ema_12", period: 12, label: "EMA 12", color: "#f43f5e" },
    { key: "ema_20", period: 20, label: "EMA 20", color: "#fb7185" },
    { key: "ema_26", period: 26, label: "EMA 26", color: "#f97316" },
    { key: "ema_50", period: 50, label: "EMA 50", color: "#facc15" },
    { key: "ema_100", period: 100, label: "EMA 100", color: "#84cc16" },
    { key: "ema_200", period: 200, label: "EMA 200", color: "#22c55e" },
  ];

  const backendIndicatorGroups: BackendIndicatorGroup[] = [
    {
      title: "Moyennes & Comparaisons",
      subtitle: "Moyennes avancées et distances prix/moyennes",
      sections: [
        {
          title: "Prix vs SMA",
          items: [
            { key: "price_vs_sma20_pct", name: "Prix / SMA 20", desc: "Distance en %" },
            { key: "price_vs_sma50_pct", name: "Prix / SMA 50", desc: "Distance en %" },
            { key: "price_vs_sma150_pct", name: "Prix / SMA 150", desc: "Distance en %" },
            { key: "price_vs_sma200_pct", name: "Prix / SMA 200", desc: "Distance en %" },
          ],
        },
        {
          title: "Prix vs EMA",
          items: [
            { key: "price_vs_ema20_pct", name: "Prix / EMA 20", desc: "Distance en %" },
            { key: "price_vs_ema50_pct", name: "Prix / EMA 50", desc: "Distance en %" },
            { key: "price_vs_ema200_pct", name: "Prix / EMA 200", desc: "Distance en %" },
          ],
        },
        {
          title: "WMA / DEMA / TEMA",
          items: [
            { key: "wma_20", name: "WMA 20", desc: "Weighted Moving Average" },
            { key: "wma_50", name: "WMA 50", desc: "Weighted Moving Average" },
            { key: "dema_20", name: "DEMA 20", desc: "Double EMA" },
            { key: "dema_50", name: "DEMA 50", desc: "Double EMA" },
            { key: "tema_20", name: "TEMA 20", desc: "Triple EMA" },
            { key: "tema_50", name: "TEMA 50", desc: "Triple EMA" },
          ],
        },
        {
          title: "Adaptive",
          items: [
            { key: "hma_20", name: "HMA 20", desc: "Hull Moving Average" },
            { key: "hma_50", name: "HMA 50", desc: "Hull Moving Average" },
            { key: "vwma_20", name: "VWMA 20", desc: "Volume Weighted MA" },
            { key: "alma_20", name: "ALMA 20", desc: "Arnaud Legoux MA" },
            { key: "kama_20", name: "KAMA 20", desc: "Kaufman Adaptive MA" },
            { key: "zlema_20", name: "ZLEMA 20", desc: "Zero Lag EMA" },
            { key: "smma_20", name: "SMMA 20", desc: "Smoothed Moving Average" },
          ],
        },
      ],
    },
    {
      title: "Oscillateurs",
      subtitle: "Surachat, survente, vitesse et retournements",
      sections: [
        {
          title: "RSI",
          items: [
            { key: "rsi_9", name: "RSI 9", desc: "RSI court terme" },
            { key: "rsi_14", name: "RSI 14", desc: "Relative Strength Index", wiredId: "rsi" },
            { key: "rsi_25", name: "RSI 25", desc: "RSI lissé long terme" },
          ],
        },
        {
          title: "Stochastic",
          items: [
            { key: "stoch_k", name: "Stoch %K", desc: "Stochastic oscillator", wiredId: "stochastic" },
            { key: "stoch_d", name: "Stoch %D", desc: "Signal stochastic" },
            { key: "stoch_rsi_k", name: "Stoch RSI %K", desc: "RSI stochastique" },
            { key: "stoch_rsi_d", name: "Stoch RSI %D", desc: "Signal Stoch RSI" },
          ],
        },
        {
          title: "CCI / MFI",
          items: [
            { key: "cci_14", name: "CCI 14", desc: "Commodity Channel Index", wiredId: "cci" },
            { key: "cci_20", name: "CCI 20", desc: "CCI période 20" },
            { key: "mfi_14", name: "MFI 14", desc: "Money Flow Index" },
          ],
        },
        {
          title: "ROC / Momentum",
          items: [
            { key: "williams_r", name: "Williams %R", desc: "Surachat/Survente (-100 à 0)", wiredId: "williamsR" },
            { key: "roc_10", name: "ROC 10", desc: "Rate of Change", wiredId: "roc" },
            { key: "roc_20", name: "ROC 20", desc: "Rate of Change long" },
            { key: "momentum_10", name: "Momentum 10", desc: "Momentum court terme" },
            { key: "momentum_20", name: "Momentum 20", desc: "Momentum long terme" },
          ],
        },
        {
          title: "Oscillateurs avancés",
          items: [
            { key: "cmo_14", name: "CMO 14", desc: "Chande Momentum Oscillator" },
            { key: "dpo_20", name: "DPO 20", desc: "Detrended Price Oscillator" },
            { key: "tsi", name: "TSI", desc: "True Strength Index" },
            { key: "tsi_signal", name: "TSI Signal", desc: "Signal TSI" },
            { key: "ultimate_osc", name: "Ultimate Osc", desc: "Ultimate Oscillator" },
            { key: "awesome_osc", name: "Awesome Osc", desc: "Awesome Oscillator" },
            { key: "ac_osc", name: "AC Osc", desc: "Acceleration/Deceleration" },
            { key: "dymi", name: "DYMI", desc: "Dynamic Momentum Index" },
          ],
        },
        {
          title: "Signal avancé",
          items: [
            { key: "rvi", name: "RVI", desc: "Relative Vigor Index" },
            { key: "rvi_signal", name: "RVI Signal", desc: "Signal RVI" },
            { key: "fisher_transform", name: "Fisher", desc: "Fisher Transform" },
            { key: "fisher_transform_signal", name: "Fisher Signal", desc: "Signal Fisher" },
            { key: "coppock_curve", name: "Coppock", desc: "Coppock Curve" },
            { key: "elder_bull_power", name: "Elder Bull", desc: "Bull Power" },
            { key: "elder_bear_power", name: "Elder Bear", desc: "Bear Power" },
          ],
        },
      ],
    },
    {
      title: "Tendance",
      subtitle: "Direction, force et suivi de tendance",
      sections: [
        {
          title: "MACD",
          items: [
            { key: "macd_line", name: "MACD Line", desc: "Ligne MACD", wiredId: "macd" },
            { key: "macd_signal", name: "MACD Signal", desc: "Signal MACD" },
            { key: "macd_histogram", name: "MACD Histogram", desc: "Histogramme MACD" },
            { key: "macd_ppo", name: "PPO", desc: "Percentage Price Oscillator" },
            { key: "macd_apo", name: "APO", desc: "Absolute Price Oscillator" },
          ],
        },
        {
          title: "Parabolic SAR",
          items: [
            { key: "parabolic_sar", name: "SAR", desc: "Stop and reverse" },
            { key: "parabolic_sar_signal", name: "SAR Signal", desc: "Signal Parabolic SAR" },
          ],
        },
        {
          title: "Ichimoku",
          items: [
            { key: "ichimoku_tenkan", name: "Tenkan", desc: "Ligne de conversion" },
            { key: "ichimoku_kijun", name: "Kijun", desc: "Ligne de base" },
            { key: "ichimoku_senkou_a", name: "Senkou A", desc: "Nuage Ichimoku A" },
            { key: "ichimoku_senkou_b", name: "Senkou B", desc: "Nuage Ichimoku B" },
            { key: "ichimoku_chikou", name: "Chikou", desc: "Ligne retardée" },
            { key: "ichimoku_cloud_color", name: "Cloud Color", desc: "Couleur du nuage" },
            { key: "price_vs_cloud", name: "Prix / Nuage", desc: "Position face au nuage" },
          ],
        },
        {
          title: "ADX / Directional",
          items: [
            { key: "adx", name: "ADX", desc: "Average Directional Index" },
            { key: "adx_plus_di", name: "+DI", desc: "Directional Indicator positif" },
            { key: "adx_minus_di", name: "-DI", desc: "Directional Indicator négatif" },
            { key: "adx_trend_strength", name: "Trend Strength", desc: "Force de tendance" },
          ],
        },
        {
          title: "Aroon",
          items: [
            { key: "aroon_up", name: "Aroon Up", desc: "Aroon haussier" },
            { key: "aroon_down", name: "Aroon Down", desc: "Aroon baissier" },
            { key: "aroon_oscillator", name: "Aroon Osc", desc: "Oscillateur Aroon" },
          ],
        },
        {
          title: "Supertrend / Vortex",
          items: [
            { key: "supertrend", name: "Supertrend", desc: "Suivi de tendance" },
            { key: "supertrend_signal", name: "Supertrend Signal", desc: "Signal Supertrend" },
            { key: "vortex_plus", name: "Vortex +", desc: "Vortex positif" },
            { key: "vortex_minus", name: "Vortex -", desc: "Vortex négatif" },
          ],
        },
        {
          title: "Trend avancé",
          items: [
            { key: "trix", name: "TRIX", desc: "Triple exponential oscillator" },
            { key: "kst", name: "KST", desc: "Know Sure Thing" },
            { key: "kst_signal", name: "KST Signal", desc: "Signal KST" },
            { key: "stc", name: "STC", desc: "Schaff Trend Cycle" },
            { key: "mass_index", name: "Mass Index", desc: "Mass Index" },
            { key: "linear_reg_slope", name: "LinReg Slope", desc: "Pente regression" },
            { key: "linear_reg_value", name: "LinReg Value", desc: "Valeur regression" },
          ],
        },
      ],
    },
    {
      title: "Volatilité",
      subtitle: "Bandes, range, dispersion et risque",
      sections: [
        {
          title: "Bollinger",
          items: [
            { key: "bb_upper", name: "BB Upper", desc: "Bollinger supérieure", wiredId: "bollinger" },
            { key: "bb_middle", name: "BB Middle", desc: "Bollinger médiane" },
            { key: "bb_lower", name: "BB Lower", desc: "Bollinger inférieure" },
            { key: "bb_width", name: "BB Width", desc: "Largeur des bandes" },
            { key: "bb_pct", name: "BB %B", desc: "Position dans les bandes" },
          ],
        },
        {
          title: "ATR",
          items: [
            { key: "atr_14", name: "ATR 14", desc: "Average True Range", wiredId: "atr" },
            { key: "atr_20", name: "ATR 20", desc: "ATR période 20" },
            { key: "natr_14", name: "NATR 14", desc: "ATR normalisé" },
          ],
        },
        {
          title: "Canaux",
          items: [
            { key: "keltner_upper", name: "Keltner Upper", desc: "Canal de Keltner haut" },
            { key: "keltner_lower", name: "Keltner Lower", desc: "Canal de Keltner bas" },
            { key: "donchian_upper", name: "Donchian Upper", desc: "Canal de Donchian haut" },
            { key: "donchian_middle", name: "Donchian Middle", desc: "Canal de Donchian median" },
            { key: "donchian_lower", name: "Donchian Lower", desc: "Canal de Donchian bas" },
          ],
        },
        {
          title: "Historical Volatility",
          items: [
            { key: "hv_10", name: "HV 10", desc: "Volatilité historique" },
            { key: "hv_20", name: "HV 20", desc: "Volatilité historique" },
            { key: "hv_30", name: "HV 30", desc: "Volatilité historique" },
            { key: "hv_60", name: "HV 60", desc: "Volatilité historique" },
            { key: "hv_90", name: "HV 90", desc: "Volatilité historique" },
            { key: "hv_252", name: "HV 252", desc: "Volatilité annuelle" },
          ],
        },
        {
          title: "Risque",
          items: [
            { key: "std_dev_20", name: "Std Dev 20", desc: "Ecart-type 20" },
            { key: "chaikin_vol", name: "Chaikin Vol", desc: "Chaikin Volatility" },
            { key: "ulcer_index", name: "Ulcer Index", desc: "Risque de drawdown" },
          ],
        },
      ],
    },
    {
      title: "Volume",
      subtitle: "Flux, accumulation et pression volume-prix",
      sections: [
        {
          title: "Accumulation",
          items: [
            { key: "obv", name: "OBV", desc: "On Balance Volume", wiredId: "obv" },
            { key: "ad_line", name: "A/D Line", desc: "Accumulation/Distribution" },
            { key: "cmf_20", name: "CMF 20", desc: "Chaikin Money Flow" },
            { key: "nvi", name: "NVI", desc: "Negative Volume Index" },
            { key: "pvi", name: "PVI", desc: "Positive Volume Index" },
          ],
        },
        {
          title: "Oscillateurs volume",
          items: [
            { key: "chaikin_osc", name: "Chaikin Osc", desc: "Oscillateur Chaikin" },
            { key: "volume_osc", name: "Volume Osc", desc: "Oscillateur de volume" },
            { key: "vroc_14", name: "VROC 14", desc: "Volume Rate of Change" },
            { key: "klinger_osc", name: "Klinger Osc", desc: "Klinger oscillator" },
            { key: "klinger_signal", name: "Klinger Signal", desc: "Signal Klinger" },
          ],
        },
        {
          title: "Force / Mouvement",
          items: [
            { key: "force_index_13", name: "Force Index 13", desc: "Force du mouvement" },
            { key: "elder_force_index", name: "Elder Force", desc: "Elder Force Index" },
            { key: "eom_14", name: "EOM 14", desc: "Ease of Movement" },
          ],
        },
        {
          title: "Volume Profile",
          items: [
            { key: "vp_poc", name: "POC", desc: "Point of Control" },
            { key: "vp_vah", name: "VAH", desc: "Value Area High" },
            { key: "vp_val", name: "VAL", desc: "Value Area Low" },
          ],
        },
      ],
    },
    {
      title: "Pivots & Signaux",
      subtitle: "Niveaux pivots et signaux de marché",
      sections: [
        {
          title: "Pivots standards",
          items: [
            { key: "pivot_standard", name: "Pivot", desc: "Pivot standard" },
            { key: "pivot_r1", name: "R1", desc: "Résistance 1" },
            { key: "pivot_r2", name: "R2", desc: "Résistance 2" },
            { key: "pivot_r3", name: "R3", desc: "Résistance 3" },
            { key: "pivot_s1", name: "S1", desc: "Support 1" },
            { key: "pivot_s2", name: "S2", desc: "Support 2" },
            { key: "pivot_s3", name: "S3", desc: "Support 3" },
          ],
        },
        {
          title: "Pivots Fibonacci",
          items: [
            { key: "pivot_fib_r1", name: "Fib R1", desc: "Résistance Fibonacci 1" },
            { key: "pivot_fib_r2", name: "Fib R2", desc: "Résistance Fibonacci 2" },
            { key: "pivot_fib_s1", name: "Fib S1", desc: "Support Fibonacci 1" },
            { key: "pivot_fib_s2", name: "Fib S2", desc: "Support Fibonacci 2" },
          ],
        },
        {
          title: "Croisements",
          items: [
            { key: "golden_cross", name: "Golden Cross", desc: "Croisement haussier" },
            { key: "death_cross", name: "Death Cross", desc: "Croisement baissier" },
          ],
        },
        {
          title: "Position prix",
          items: [
            { key: "is_above_sma50", name: "> SMA 50", desc: "Prix au-dessus SMA 50" },
            { key: "is_above_sma200", name: "> SMA 200", desc: "Prix au-dessus SMA 200" },
            { key: "is_above_ema20", name: "> EMA 20", desc: "Prix au-dessus EMA 20" },
            { key: "is_above_vwap", name: "> VWAP", desc: "Prix au-dessus VWAP" },
          ],
        },
        {
          title: "Extrêmes / Breakout",
          items: [
            { key: "is_52w_high", name: "52W High", desc: "Plus haut 52 semaines" },
            { key: "is_52w_low", name: "52W Low", desc: "Plus bas 52 semaines" },
            { key: "is_ath", name: "ATH", desc: "Plus haut historique" },
            { key: "is_atl", name: "ATL", desc: "Plus bas historique" },
            { key: "breakout_resistance", name: "Breakout", desc: "Cassure resistance" },
            { key: "breakdown_support", name: "Breakdown", desc: "Cassure support" },
          ],
        },
        {
          title: "Gaps / Barres",
          items: [
            { key: "gap_up", name: "Gap Up", desc: "Ouverture en gap haussier" },
            { key: "gap_down", name: "Gap Down", desc: "Ouverture en gap baissier" },
            { key: "gap_pct", name: "Gap %", desc: "Amplitude du gap" },
            { key: "consecutive_up_days", name: "Jours hausse", desc: "Hausses consecutives" },
            { key: "consecutive_down_days", name: "Jours baisse", desc: "Baisses consecutives" },
            { key: "inside_bar", name: "Inside Bar", desc: "Barre intérieure" },
            { key: "outside_bar", name: "Outside Bar", desc: "Barre extérieure" },
          ],
        },
      ],
    },
    {
      title: "Patterns Chandeliers",
      subtitle: "Reconnaissance des structures de chandeliers",
      sections: [
        {
          title: "Doji",
          items: [
            { key: "pattern_doji", name: "Doji", desc: "Indécision" },
            { key: "pattern_doji_dragonfly", name: "Dragonfly", desc: "Doji dragonfly" },
            { key: "pattern_doji_gravestone", name: "Gravestone", desc: "Doji gravestone" },
            { key: "pattern_doji_longleg", name: "Long Leg", desc: "Doji longues mèches" },
            { key: "pattern_tristar", name: "Tristar", desc: "Pattern tristar" },
            { key: "pattern_rickshaw_man", name: "Rickshaw", desc: "Rickshaw man" },
          ],
        },
        {
          title: "Bougie simple",
          items: [
            { key: "pattern_hammer", name: "Hammer", desc: "Marteau" },
            { key: "pattern_hanging_man", name: "Hanging Man", desc: "Pendu" },
            { key: "pattern_inv_hammer", name: "Inv Hammer", desc: "Marteau inversé" },
            { key: "pattern_shooting_star", name: "Shooting Star", desc: "Etoile filante" },
            { key: "pattern_marubozu_bull", name: "Marubozu Bull", desc: "Marubozu haussier" },
            { key: "pattern_marubozu_bear", name: "Marubozu Bear", desc: "Marubozu baissier" },
            { key: "pattern_spinning_top", name: "Spinning Top", desc: "Toupie" },
            { key: "pattern_takuri", name: "Takuri", desc: "Takuri" },
          ],
        },
        {
          title: "Deux bougies",
          items: [
            { key: "pattern_engulfing_bull", name: "Engulf Bull", desc: "Englobante haussiere" },
            { key: "pattern_engulfing_bear", name: "Engulf Bear", desc: "Englobante baissiere" },
            { key: "pattern_harami_bull", name: "Harami Bull", desc: "Harami haussier" },
            { key: "pattern_harami_bear", name: "Harami Bear", desc: "Harami baissier" },
            { key: "pattern_tweezer_top", name: "Tweezer Top", desc: "Sommet pince" },
            { key: "pattern_tweezer_bottom", name: "Tweezer Bottom", desc: "Creux pince" },
            { key: "pattern_dark_cloud_cover", name: "Dark Cloud", desc: "Couverture nuage noir" },
            { key: "pattern_piercing_line", name: "Piercing", desc: "Piercing line" },
            { key: "pattern_counterattack", name: "Counterattack", desc: "Contre-attaque" },
            { key: "pattern_separating_lines", name: "Separating", desc: "Lignes separatrices" },
            { key: "pattern_tasuki_gap", name: "Tasuki Gap", desc: "Tasuki gap" },
            { key: "pattern_thrusting", name: "Thrusting", desc: "Thrusting" },
          ],
        },
        {
          title: "Trois bougies",
          items: [
            { key: "pattern_morning_star", name: "Morning Star", desc: "Etoile du matin" },
            { key: "pattern_evening_star", name: "Evening Star", desc: "Etoile du soir" },
            { key: "pattern_3_white_soldiers", name: "3 Soldiers", desc: "Trois soldats blancs" },
            { key: "pattern_3_black_crows", name: "3 Crows", desc: "Trois corbeaux noirs" },
            { key: "pattern_3_inside_up", name: "3 Inside Up", desc: "Trois dedans haut" },
            { key: "pattern_3_inside_down", name: "3 Inside Down", desc: "Trois dedans bas" },
            { key: "pattern_unique_3_river", name: "Unique 3 River", desc: "Unique three river" },
            { key: "pattern_upside_gap_two_crows", name: "Upside Gap 2 Crows", desc: "Upside gap two crows" },
          ],
        },
        {
          title: "Patterns avancés",
          items: [
            { key: "pattern_kicker_bull", name: "Kicker Bull", desc: "Kicker haussier" },
            { key: "pattern_kicker_bear", name: "Kicker Bear", desc: "Kicker baissier" },
            { key: "pattern_abandoned_baby_bull", name: "Abandoned Bull", desc: "Bebe abandonne haussier" },
            { key: "pattern_abandoned_baby_bear", name: "Abandoned Bear", desc: "Bebe abandonne baissier" },
            { key: "pattern_belthold_bull", name: "Belthold Bull", desc: "Belt hold haussier" },
            { key: "pattern_belthold_bear", name: "Belthold Bear", desc: "Belt hold baissier" },
            { key: "pattern_breakaway_bull", name: "Breakaway Bull", desc: "Breakaway haussier" },
            { key: "pattern_breakaway_bear", name: "Breakaway Bear", desc: "Breakaway baissier" },
            { key: "pattern_concealing_baby_swallow", name: "Concealing Swallow", desc: "Concealing baby swallow" },
            { key: "pattern_gap_side_side_white", name: "Gap Side White", desc: "Gap side-by-side white" },
            { key: "pattern_hikkake", name: "Hikkake", desc: "Hikkake" },
            { key: "pattern_ladder_bottom", name: "Ladder Bottom", desc: "Ladder bottom" },
            { key: "pattern_mat_hold", name: "Mat Hold", desc: "Mat hold" },
            { key: "pattern_rising_three_methods", name: "Rising 3", desc: "Rising three methods" },
            { key: "pattern_falling_three_methods", name: "Falling 3", desc: "Falling three methods" },
            { key: "pattern_stick_sandwich", name: "Stick Sandwich", desc: "Stick sandwich" },
          ],
        },
      ],
    },
  ];

  // --- HANDLERS ---

  const handleToggleMA = (type: "sma" | "ema", period: number) => {
    const activeArray = type === "sma" ? chartConfig.indicators.activeSma : chartConfig.indicators.activeEma;
    const safeArray = activeArray || [];
    
    const newArray = safeArray.includes(period)
      ? safeArray.filter((p) => p !== period)
      : [...safeArray, period];

    dispatch(
      setChartConfig({
        indicators: {
          ...chartConfig.indicators,
          [type === "sma" ? "activeSma" : "activeEma"]: newArray,
          // Ensure the master switch is ON if we add an indicator
          [type]: newArray.length > 0 ? true : chartConfig.indicators[type as "sma" | "ema"],
        },
      })
    );
  };

  const handleToggleAdvanced = (ind: keyof AdvancedIndicatorsState) => {
    dispatch(toggleAdvancedIndicator(ind));
  };

  // --- RENDER HELPERS (PREMIUM UI) ---

  const renderMACard = (type: "sma" | "ema", period: number, label: string, color: string) => {
    const activeArray = type === "sma" ? chartConfig.indicators.activeSma : chartConfig.indicators.activeEma;
    const isActive = (activeArray || []).includes(period);

    return (
      <div className="col p-1" key={`${type}-${period}`}>
        <div
          className="d-flex align-items-center p-2 rounded h-100"
          style={{
            border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.08)'}`,
            cursor: "pointer",
            // 1A is ~10% opacity in hex, creating a subtle glow of the indicator's color
            backgroundColor: isActive ? `${color}1A` : "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease"
          }}
          onClick={() => handleToggleMA(type, period)}
        >
          {/* Custom Checkbox */}
          <div 
            className="d-flex align-items-center justify-content-center me-2 flex-shrink-0" 
            style={{ 
              width: '16px', 
              height: '16px', 
              borderRadius: '4px', 
              border: `1px solid ${isActive ? color : 'rgba(255,255,255,0.2)'}`,
              backgroundColor: isActive ? color : 'transparent',
              transition: "all 0.2s ease"
            }}
          >
            {isActive && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>
          
          <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></span>
            <strong className="text-truncate" style={{ color: isActive ? '#fff' : '#a0aec0', fontSize: "12px" }}>
              {label}
            </strong>
          </div>
        </div>
      </div>
    );
  };

  const renderIndicatorCard = (ind: BackendIndicatorItem) => {
    const isWired = !!ind.wiredId;
    const isActive = isWired ? !!advancedIndicators[ind.wiredId as keyof AdvancedIndicatorsState] : false;
    const activeColor = "#2962ff"; // TradingView Blue

    return (
      <div className="col p-1" key={ind.key}>
        <div
          className={`gp-indicator-catalog-card ${isActive ? "active" : ""} ${!isWired ? "is-backend-only" : ""}`}
          style={{
            border: `1px solid ${isActive ? activeColor : 'rgba(255,255,255,0.08)'}`,
            cursor: isWired ? "pointer" : "default",
            backgroundColor: isActive ? "rgba(41, 98, 255, 0.1)" : "rgba(0,0,0,0.2)",
            transition: "all 0.2s ease"
          }}
          onClick={() => {
            if (ind.wiredId) handleToggleAdvanced(ind.wiredId);
          }}
        >
          {/* Custom Checkbox */}
          <div 
            className="d-flex align-items-center justify-content-center me-3 flex-shrink-0" 
            style={{ 
              width: '18px', 
              height: '18px', 
              borderRadius: '4px', 
              border: `1px solid ${isActive ? activeColor : isWired ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
              backgroundColor: isActive ? activeColor : 'transparent',
              transition: "all 0.2s ease"
            }}
          >
            {isActive && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </div>

          <div className="flex-grow-1 min-w-0 overflow-hidden">
            <strong className="d-block text-truncate" style={{ color: isActive ? '#fff' : '#a0aec0', fontSize: "13px" }}>
              {ind.name}
            </strong>
            <small className="text-secondary d-block text-truncate" style={{ fontSize: "11px", marginTop: "2px" }}>
              {ind.desc}
            </small>
          </div>

          {!isWired && <span className="gp-indicator-backend-badge">Backend</span>}
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Indicateurs Techniques"
      icon={<i className="bi bi-activity me-2"></i>}
      primaryLabel="Appliquer"
      primaryAction={onClose}
      secondaryLabel="Fermer"
      maxWidth="750px"
    >
      {/* --- SECTION 1: MOYENNES MOBILES --- */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3 px-1">
          <div
            style={{
              width: "3px",
              height: "16px",
              background: "linear-gradient(180deg, #ff9800, #ff5252)",
              borderRadius: "2px",
              marginRight: "8px",
            }}
          />
          <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
            Moyennes Mobiles
          </small>
        </div>
        <div className="gp-ma-groups">
          <div className="gp-ma-group gp-ma-group-sma">
            <div className="gp-ma-group-header">
              <span className="gp-ma-group-kicker">Simple Moving Average</span>
              <strong>SMA</strong>
            </div>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 mx-0">
              {smaIndicators.map(({ key, period, label, color }) => (
                <React.Fragment key={key}>{renderMACard("sma", period, label, color)}</React.Fragment>
              ))}
            </div>
          </div>

          <div className="gp-ma-group gp-ma-group-ema">
            <div className="gp-ma-group-header">
              <span className="gp-ma-group-kicker">Exponential Moving Average</span>
              <strong>EMA</strong>
            </div>
            <div className="row row-cols-1 row-cols-sm-2 mx-0">
              {emaIndicators.map(({ key, period, label, color }) => (
                <React.Fragment key={key}>{renderMACard("ema", period, label, color)}</React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: CATALOGUE BACKEND STRUCTURÉ --- */}
      <div className="mb-4">
        <div className="d-flex align-items-center mb-3 px-1">
          <div
            style={{
              width: "3px",
              height: "16px",
              background: "linear-gradient(180deg, #2962ff, #00bcd4)",
              borderRadius: "2px",
              marginRight: "8px",
            }}
          />
          <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
            Catalogue Backend
          </small>
        </div>

        <div className="gp-indicator-catalog">
          {backendIndicatorGroups.map((group) => (
            <section className="gp-indicator-family" key={group.title}>
              <div className="gp-indicator-family-header">
                <div>
                  <strong>{group.title}</strong>
                  <span>{group.subtitle}</span>
                </div>
              </div>
              <div className="gp-indicator-subfamilies">
                {group.sections.map((section) => (
                  <div
                    className="gp-indicator-subfamily"
                    data-family={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                    key={`${group.title}-${section.title}`}
                  >
                    <div className="gp-indicator-subfamily-title">{section.title}</div>
                    <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 mx-0">
                      {section.items.map(renderIndicatorCard)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </BaseModal>
  );
};

// --- EOF ---
