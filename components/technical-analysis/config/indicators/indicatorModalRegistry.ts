import type { AdvancedIndicatorsState } from "./advancedIndicatorsTypes";
import {
  ADVANCED_INDICATOR_REGISTRY,
  ADVANCED_INDICATOR_REGISTRY_ENTRIES,
  getAdvancedIndicatorRegistryEntry,
  type AdvancedIndicatorId,
} from "./indicatorRegistry";

export type BackendIndicatorItem = {
  key: string;
  name: string;
  desc: string;
  wiredId?: keyof AdvancedIndicatorsState | string;
};

export type BackendIndicatorSection = {
  title: string;
  items: BackendIndicatorItem[];
  rowGrouping?: "name-prefix";
  groupSwitch?: boolean;
};

export type BackendIndicatorGroup = {
  title: string;
  subtitle: string;
  sections: BackendIndicatorSection[];
};

export type CompositeIndicatorSpec = {
  id: string;
  title: string;
  desc: string;
  outputKeys: string[];
  missingOutputs?: BackendIndicatorItem[];
  wiredId?: keyof AdvancedIndicatorsState | string;
  sectionTitle?: string;
  requireCompleteOutputs?: boolean;
  hasSettings?: boolean;
};

type IndicatorModalGroupTemplate = {
  title: string;
  subtitle: string;
  sections: Array<{
    title: string;
    items: Array<Omit<BackendIndicatorItem, "wiredId">>;
    rowGrouping?: "name-prefix";
    groupSwitch?: boolean;
  }>;
};

type CompositeIndicatorMeta = Omit<CompositeIndicatorSpec, "outputKeys" | "wiredId"> & {
  stateId: AdvancedIndicatorId;
};

const SPECIAL_MODAL_WIRED_IDS: Record<string, string> = {
  rsi_9: "rsi_9",
  rsi_14: "rsi_14",
  rsi_25: "rsi_25",
};

const CATALOG_KEY_WIRING_OVERRIDES: Partial<Record<string, AdvancedIndicatorId>> = {
  cci_20: "cci20",
  roc_10: "roc10",
  williams_r_14: "williamsR14",
};

const buildCatalogKeyToIndicatorId = (): ReadonlyMap<string, AdvancedIndicatorId> => {
  const keyToId = new Map<string, AdvancedIndicatorId>();

  ADVANCED_INDICATOR_REGISTRY_ENTRIES.forEach((entry) => {
    entry.catalogKeys.forEach((key) => {
      if (!keyToId.has(key)) keyToId.set(key, entry.id);
    });
  });

  Object.entries(CATALOG_KEY_WIRING_OVERRIDES).forEach(([key, id]) => {
    if (id) keyToId.set(key, id);
  });

  return keyToId;
};

const CATALOG_KEY_TO_INDICATOR_ID = buildCatalogKeyToIndicatorId();

export const resolveIndicatorCatalogWiredId = (key: string): keyof AdvancedIndicatorsState | string | undefined =>
  SPECIAL_MODAL_WIRED_IDS[key] ?? CATALOG_KEY_TO_INDICATOR_ID.get(key);

const withRegistryWiring = (item: Omit<BackendIndicatorItem, "wiredId">): BackendIndicatorItem => {
  const wiredId = resolveIndicatorCatalogWiredId(item.key);
  return wiredId ? { ...item, wiredId } : item;
};

const RAW_INDICATOR_MODAL_GROUPS = [
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
          rowGrouping: "name-prefix",
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
          title: "Réduction du retard",
          rowGrouping: "name-prefix",
          items: [
            { key: "hma_20", name: "HMA 20", desc: "Hull Moving Average" },
            { key: "hma_50", name: "HMA 50", desc: "Hull Moving Average" },
            { key: "zlema_20", name: "ZLEMA 20", desc: "Zero Lag EMA" },
          ],
        },
        {
          title: "Lissage avancé",
          items: [
            { key: "alma_20", name: "ALMA 20", desc: "Arnaud Legoux MA" },
            { key: "smma_20", name: "SMMA 20", desc: "Smoothed Moving Average" },
          ],
        },
        {
          title: "Adaptative",
          items: [
            { key: "kama_20", name: "KAMA 20", desc: "Kaufman Adaptive MA" },
          ],
        },
        {
          title: "Pondérée volume",
          items: [
            { key: "vwma_20", name: "VWMA 20", desc: "Volume Weighted MA" },
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
            { key: "rsi_9", name: "RSI 9", desc: "Court terme" },
            { key: "rsi_14", name: "RSI 14", desc: "Standard" },
            { key: "rsi_25", name: "RSI 25", desc: "Lissé / long terme" },
          ],
        },
        {
          title: "Stochastic",
          rowGrouping: "name-prefix",
          items: [
            { key: "stoch_k", name: "Stoch %K", desc: "Stochastic oscillator"},
            { key: "stoch_d", name: "Stoch %D", desc: "Signal stochastic" },
            { key: "stoch_rsi_k", name: "Stoch RSI %K", desc: "RSI stochastique" },
            { key: "stoch_rsi_d", name: "Stoch RSI %D", desc: "Signal Stoch RSI" },
          ],
        },
        {
          title: "Momentum prix",
          items: [
            { key: "cci_14", name: "CCI 14", desc: "Plus réactif · HLC3"},
            { key: "cci_20", name: "CCI 20", desc: "Plus lissé · HLC3"},
          ],
        },
        {
          title: "Momentum prix + volume",
          items: [
            { key: "mfi_14", name: "MFI 14", desc: "Pression achat/vente · Volume"},
          ],
        },
        {
          title: "Oscillateur borné",
          items: [
            { key: "williams_r_14", name: "Williams %R 14", desc: "Surachat / survente · 0 à -100"},
          ],
        },
        {
          title: "Variation en pourcentage",
          items: [
            { key: "roc_10", name: "ROC 10", desc: "Variation court terme en %"},
            { key: "roc_20", name: "ROC 20", desc: "Variation longue en %"},
          ],
        },
        {
          title: "Momentum brut",
          items: [
            { key: "momentum_10", name: "Momentum 10", desc: "Close - Close[10]"},
            { key: "momentum_20", name: "Momentum 20", desc: "Close - Close[20]"},
          ],
        },
        {
          title: "Momentum pur",
          rowGrouping: "name-prefix",
          items: [
            { key: "cmo_14", name: "CMO 14", desc: "Chande · -100 à +100"},
            { key: "dymi", name: "DYMI", desc: "RSI dynamique · Volatilité"},
            { key: "ultimate_osc", name: "Ultimate Osc", desc: "Pression achat 7 / 14 / 28"},
          ],
        },
        {
          title: "Cycle / Detrending",
          items: [
            { key: "dpo_20", name: "DPO 20", desc: "Cycle détrendé · shift -11"},
          ],
        },
        {
          title: "Force + signal",
          rowGrouping: "name-prefix",
          items: [
            { key: "tsi", name: "TSI", desc: "True Strength Index et ligne signal" },
            { key: "tsi_signal", name: "TSI Signal", desc: "Signal TSI" },
          ],
        },
        {
          title: "Bill Williams",
          rowGrouping: "name-prefix",
          items: [
            { key: "awesome_osc", name: "Awesome Osc", desc: "SMA5(HL2) - SMA34(HL2)"},
            { key: "ac_osc", name: "AC Osc", desc: "AO - SMA5(AO)"},
          ],
        },
        {
          title: "Signal avancé",
          rowGrouping: "name-prefix",
          items: [
            { key: "rvi", name: "RVI", desc: "Relative Vigor Index" },
            { key: "rvi_signal", name: "RVI Signal", desc: "Signal RVI" },
            { key: "fisher_transform", name: "Fisher", desc: "Fisher Transform" },
            { key: "fisher_transform_signal", name: "Fisher Signal", desc: "Signal Fisher" },
            { key: "elder_bull_power", name: "Elder Bull", desc: "High - EMA13" },
            { key: "elder_bear_power", name: "Elder Bear", desc: "Low - EMA13" },
            { key: "coppock_curve", name: "Coppock", desc: "WMA10(ROC11 + ROC14)"},
          ],
        },
      ],
    },
    {
      title: "Tendance",
      subtitle: "Direction, force et suivi de tendance",
      sections: [
        {
          title: "Convergence / Divergence",
          rowGrouping: "name-prefix",
          items: [
            { key: "macd_line", name: "MACD Line", desc: "EMA12 - EMA26"},
            { key: "macd_signal", name: "MACD Signal", desc: "Signal MACD" },
            { key: "macd_histogram", name: "MACD Histogram", desc: "Histogramme MACD" },
          ],
        },
        {
          title: "Oscillateurs dérivés",
          items: [
            { key: "macd_ppo", name: "PPO Line", desc: "MACD normalisé %" },
            { key: "macd_ppo_signal", name: "PPO Signal", desc: "EMA9 du PPO" },
            { key: "macd_ppo_histogram", name: "PPO Histogram", desc: "PPO - Signal" },
            { key: "macd_apo", name: "APO", desc: "MACD Line absolue"},
          ],
        },
        {
          title: "Parabolic SAR",
          rowGrouping: "name-prefix",
          items: [
            { key: "parabolic_sar", name: "SAR", desc: "Stop and reverse" },
            { key: "parabolic_sar_signal", name: "SAR Signal", desc: "Signal Parabolic SAR" },
          ],
        },
        {
          title: "Ichimoku",
          rowGrouping: "name-prefix",
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
          rowGrouping: "name-prefix",
          items: [
            { key: "adx", name: "ADX", desc: "Force de tendance · Wilder 14" },
            { key: "adx_plus_di", name: "+DI", desc: "Direction haussière" },
            { key: "adx_minus_di", name: "-DI", desc: "Direction baissière" },
            { key: "adx_trend_strength", name: "Trend Strength", desc: "Badge dérivé ADX" },
          ],
        },
        {
          title: "Aroon — Détection de tendance",
          rowGrouping: "name-prefix",
          items: [
            { key: "aroon_up", name: "Aroon Up", desc: "Aroon haussier" },
            { key: "aroon_down", name: "Aroon Down", desc: "Aroon baissier" },
          ],
        },
        {
          title: "Aroon Oscillator",
          items: [
            { key: "aroon_oscillator", name: "Aroon Osc", desc: "Aroon Up - Aroon Down"},
          ],
        },
        {
          title: "Overlay de tendance",
          rowGrouping: "name-prefix",
          items: [
            { key: "supertrend", name: "Supertrend", desc: "Overlay ATR 10 × 3" },
            { key: "supertrend_signal", name: "Supertrend Signal", desc: "Signal Supertrend" },
          ],
        },
        {
          title: "Oscillateur directionnel",
          rowGrouping: "name-prefix",
          items: [
            { key: "vortex_plus", name: "Vortex +", desc: "Vortex positif" },
            { key: "vortex_minus", name: "Vortex -", desc: "Vortex négatif" },
          ],
        },
        {
          title: "Oscillateurs de tendance",
          items: [
            { key: "trix", name: "TRIX", desc: "Triple EMA ROC %"},
            { key: "stc", name: "STC", desc: "Schaff Trend Cycle"},
            { key: "mass_index", name: "Mass Index", desc: "Range expansion"},
          ],
        },
        {
          title: "KST — Know Sure Thing",
          rowGrouping: "name-prefix",
          items: [
            { key: "kst", name: "KST", desc: "Know Sure Thing" },
            { key: "kst_signal", name: "KST Signal", desc: "Signal KST" },
          ],
        },
        {
          title: "Régression linéaire",
          rowGrouping: "name-prefix",
          items: [
            { key: "linear_reg_value", name: "LinReg Value", desc: "Valeur régression prix" },
            { key: "linear_reg_slope", name: "LinReg Slope", desc: "Pente prix/bougie" },
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
          rowGrouping: "name-prefix",
          items: [
            { key: "bb_upper", name: "BB Upper", desc: "Bollinger supérieure"},
            { key: "bb_middle", name: "BB Middle", desc: "Bollinger médiane" },
            { key: "bb_lower", name: "BB Lower", desc: "Bollinger inférieure" },
            // [TENOR 2026 HDR] Separated derived oscillators
            { key: "bb_width", name: "BB Width", desc: "Largeur des bandes"},
            { key: "bb_pct", name: "BB %B", desc: "Position dans les bandes"},
          ],
        },
        {
          title: "ATR",
          rowGrouping: "name-prefix",
          items: [
            { key: "atr_14", name: "ATR 14", desc: "Average True Range"},
            { key: "atr_20", name: "ATR 20", desc: "ATR période 20"},
            { key: "natr_14", name: "NATR 14", desc: "ATR normalisé"},
          ],
        },
        {
          title: "Canaux de prix",
          rowGrouping: "name-prefix",
          items: [
            { key: "donchian_upper", name: "Donchian Upper", desc: "Canal de Donchian haut"},
            { key: "donchian_middle", name: "Donchian Middle", desc: "Canal de Donchian médian"},
            { key: "donchian_lower", name: "Donchian Lower", desc: "Canal de Donchian bas"},
            { key: "keltner_upper", name: "Keltner Upper", desc: "Canal de Keltner haut"},
            { key: "keltner_middle", name: "Keltner Middle", desc: "Base EMA 20 du canal"},
            { key: "keltner_lower", name: "Keltner Lower", desc: "Canal de Keltner bas"},
          ],
        },
        {
          title: "Historical Volatility",
          rowGrouping: "name-prefix",
          items: [
            { key: "hv_10", name: "HV 10", desc: "Volatilité annualisée des rendements log"},
            { key: "hv_20", name: "HV 20", desc: "Volatilité annualisée des rendements log"},
            { key: "hv_30", name: "HV 30", desc: "Volatilité annualisée des rendements log"},
            { key: "hv_60", name: "HV 60", desc: "Volatilité annualisée des rendements log"},
            { key: "hv_90", name: "HV 90", desc: "Volatilité annualisée des rendements log"},
            { key: "hv_252", name: "HV 252", desc: "Volatilité annualisée des rendements log"},
          ],
        },
        {
          title: "Dispersion du prix",
          items: [
            { key: "std_dev_20", name: "Std Dev 20", desc: "Dispersion du prix brut"},
          ],
        },
        {
          title: "Expansion de volatilité",
          items: [
            { key: "chaikin_vol", name: "Chaikin Volatility", desc: "Variation % du range High-Low lissé"},
          ],
        },
        {
          title: "Risque de drawdown",
          items: [
            { key: "ulcer_index", name: "Ulcer Index", desc: "Profondeur et durée des replis"},
          ],
        },
      ],
    },
    {
      title: "Volume",
      subtitle: "Flux, accumulation et pression volume-prix",
      sections: [
        {
          title: "Flux cumulatifs",
          rowGrouping: "name-prefix",
          items: [
            { key: "obv", name: "OBV", desc: "On Balance Volume"},
            { key: "ad_line", name: "A/D Line", desc: "Cumul du volume pondéré par le close"},
          ],
        },
        {
          title: "Pression volume-prix",
          items: [
            { key: "cmf_20", name: "CMF 20", desc: "Pression achat/vente bornée -1 à +1"},
          ],
        },
        {
          title: "Indices de volume",
          rowGrouping: "name-prefix",
          items: [
            { key: "nvi", name: "NVI", desc: "Indice cumulatif des séances à volume plus faible"},
            { key: "pvi", name: "PVI", desc: "Indice cumulatif des séances à volume plus fort"},
          ],
        },
        {
          title: "Flux accumulation / distribution",
          items: [
            { key: "chaikin_osc", name: "Chaikin Oscillator", desc: "Momentum dynamique de la ligne A/D"},
          ],
        },
        {
          title: "Variation du volume",
          items: [
            { key: "volume_osc", name: "Volume Oscillator", desc: "Écart relatif SMA5/SMA20 du volume"},
            { key: "vroc_14", name: "VROC 14", desc: "Variation du volume en % sur 14 bougies"},
          ],
        },
        {
          title: "Klinger Volume Oscillator",
          rowGrouping: "name-prefix",
          items: [
            { key: "klinger_osc", name: "Klinger Osc", desc: "Oscillateur volume-prix"},
            { key: "klinger_signal", name: "Klinger Signal", desc: "Signal EMA13 Klinger"},
          ],
        },
        {
          title: "Force du mouvement",
          rowGrouping: "name-prefix",
          items: [
            { key: "elder_force_raw", name: "Elder Force Raw", desc: "Force brute prix-volume"},
            { key: "force_index_13", name: "Force Index 13", desc: "EMA13 de la force brute"},
          ],
        },
        {
          title: "Facilité du mouvement",
          items: [
            { key: "eom_14", name: "EOM 14", desc: "Oscillateur prix-volume autour de zéro"},
          ],
        },
        {
          title: "Volume Profile",
          rowGrouping: "name-prefix",
          items: [
            { key: "vp_poc", name: "POC", desc: "Point of Control"},
            { key: "vp_vah", name: "VAH", desc: "Value Area High"},
            { key: "vp_val", name: "VAL", desc: "Value Area Low"},
          ],
        },
      ],
    },
    {
      title: "Pivots & Signaux",
      subtitle: "Niveaux pivots et signaux de marché",
      sections: [
        {
          title: "Pivot Points Standard",
          rowGrouping: "name-prefix",
          items: [
            { key: "pivot_standard", name: "Pivot", desc: "Pivot standard"},
            { key: "pivot_r1", name: "R1", desc: "Résistance 1"},
            { key: "pivot_r2", name: "R2", desc: "Résistance 2"},
            { key: "pivot_r3", name: "R3", desc: "Résistance 3"},
            { key: "pivot_s1", name: "S1", desc: "Support 1"},
            { key: "pivot_s2", name: "S2", desc: "Support 2"},
            { key: "pivot_s3", name: "S3", desc: "Support 3"},
          ],
        },
        {
          title: "Pivot Points Fibonacci",
          rowGrouping: "name-prefix",
          items: [
            { key: "pivot_fib_p", name: "Pivot", desc: "Pivot central Fibonacci"},
            { key: "pivot_fib_r1", name: "Fib R1", desc: "Résistance Fibonacci 0.382"},
            { key: "pivot_fib_r2", name: "Fib R2", desc: "Résistance Fibonacci 0.618"},
            { key: "pivot_fib_r3", name: "Fib R3", desc: "Résistance Fibonacci 1.000"},
            { key: "pivot_fib_s1", name: "Fib S1", desc: "Support Fibonacci 0.382"},
            { key: "pivot_fib_s2", name: "Fib S2", desc: "Support Fibonacci 0.618"},
            { key: "pivot_fib_s3", name: "Fib S3", desc: "Support Fibonacci 1.000"},
          ],
        },
        {
          title: "Croisements de moyennes",
          rowGrouping: "name-prefix",
          items: [
            { key: "golden_cross", name: "Golden Cross", desc: "SMA50 croise SMA200 vers le haut"},
            { key: "death_cross", name: "Death Cross", desc: "SMA50 croise SMA200 vers le bas"},
          ],
        },
        {
          title: "Position intraday / volume",
          rowGrouping: "name-prefix",
          items: [
            { key: "vwap", name: "VWAP", desc: "Prix moyen pondéré par volume"},
            { key: "is_above_vwap", name: "Prix > VWAP", desc: "État au-dessus VWAP"},
          ],
        },
        {
          title: "Niveaux 52 semaines",
          rowGrouping: "name-prefix",
          items: [
            { key: "fifty_two_week_high", name: "52W High", desc: "Niveau haut sur 364 jours"},
            { key: "fifty_two_week_low", name: "52W Low", desc: "Niveau bas sur 364 jours"},
          ],
        },
        {
          title: "Records historiques",
          rowGrouping: "name-prefix",
          items: [
            { key: "ath", name: "ATH", desc: "Plus haut historique"},
            { key: "atl", name: "ATL", desc: "Plus bas historique"},
          ],
        },
        {
          title: "Cassures techniques",
          rowGrouping: "name-prefix",
          items: [
            { key: "breakout_resistance", name: "Breakout résistance", desc: "Cassure confirmée au-dessus de la résistance roulante"},
            { key: "breakdown_support", name: "Breakdown support", desc: "Cassure confirmée sous le support roulant"},
          ],
        },
        {
          title: "Gaps",
          rowGrouping: "name-prefix",
          items: [
            { key: "gap_up", name: "Gap Up", desc: "Ouverture au-dessus de la clôture précédente"},
            { key: "gap_down", name: "Gap Down", desc: "Ouverture sous la clôture précédente"},
            { key: "gap_pct", name: "Gap %", desc: "Amplitude du gap d'ouverture"},
            { key: "true_gap_up", name: "True Gap Up", desc: "Bougie entièrement au-dessus du range précédent"},
            { key: "true_gap_down", name: "True Gap Down", desc: "Bougie entièrement sous le range précédent"},
          ],
        },
        {
          title: "Séquences directionnelles",
          rowGrouping: "name-prefix",
          items: [
            { key: "consecutive_up_days", name: "Jours hausse", desc: "Compteur de clôtures haussières consécutives"},
            { key: "consecutive_down_days", name: "Jours baisse", desc: "Compteur de clôtures baissières consécutives"},
          ],
        },
        {
          title: "Structure de barres",
          rowGrouping: "name-prefix",
          items: [
            { key: "inside_bar", name: "Inside Bar", desc: "Bougie contenue dans le range précédent"},
            { key: "outside_bar", name: "Outside Bar", desc: "Bougie englobant le range précédent"},
          ],
        },
      ],
    },
    {
      title: "Patterns Chandeliers",
      subtitle: "Reconnaissance des structures de chandeliers",
      sections: [
        {
          title: "Doji classiques",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_doji", name: "Doji", desc: "Corps quasi nul"},
            { key: "pattern_doji_longleg", name: "Long-legged Doji", desc: "Doji avec longue mèche"},
            { key: "pattern_rickshaw_man", name: "Rickshaw Man", desc: "Doji centré avec deux longues mèches"},
          ],
        },
        {
          title: "Doji directionnels",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_doji_dragonfly", name: "Dragonfly Doji", desc: "Doji avec mèche basse longue"},
            { key: "pattern_doji_gravestone", name: "Gravestone Doji", desc: "Doji avec mèche haute longue"},
          ],
        },
        {
          title: "Structure rare",
          items: [
            { key: "pattern_tristar", name: "Tristar", desc: "Trois doji consécutifs avec gap central"},
          ],
        },
        {
          title: "Rejets bas",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_hammer", name: "Hammer", desc: "Rejet bas après baisse potentielle"},
            { key: "pattern_hanging_man", name: "Hanging Man", desc: "Rejet bas après hausse potentielle"},
            { key: "pattern_takuri", name: "Takuri", desc: "Rejet bas marqué"},
          ],
        },
        {
          title: "Rejets hauts",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_inv_hammer", name: "Inverted Hammer", desc: "Rejet haut après baisse potentielle"},
            { key: "pattern_shooting_star", name: "Shooting Star", desc: "Rejet haut après hausse probable"},
          ],
        },
        {
          title: "Bougies de force",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_marubozu_bull", name: "Marubozu Bull", desc: "Corps plein, mèches faibles"},
            { key: "pattern_marubozu_bear", name: "Marubozu Bear", desc: "Domination vendeuse"},
          ],
        },
        {
          title: "Indécision",
          groupSwitch: true,
          items: [
            { key: "pattern_spinning_top", name: "Spinning Top", desc: "Petit corps avec mèches"},
          ],
        },
        {
          title: "Engulfing",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_engulfing_bull", name: "Engulfing Bullish", desc: "Corps haussier englobe le précédent"},
            { key: "pattern_engulfing_bear", name: "Engulfing Bearish", desc: "Corps baissier englobe le précédent"},
          ],
        },
        {
          title: "Harami",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_harami_bull", name: "Harami Bullish", desc: "Petit corps contenu après baisse"},
            { key: "pattern_harami_bear", name: "Harami Bearish", desc: "Petit corps contenu après hausse"},
          ],
        },
        {
          title: "Tweezer",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_tweezer_top", name: "Tweezer Top", desc: "Deux hauts égaux après hausse"},
            { key: "pattern_tweezer_bottom", name: "Tweezer Bottom", desc: "Deux bas égaux après baisse"},
          ],
        },
        {
          title: "Retournements classiques",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_piercing_line", name: "Piercing Line", desc: "Pénétration haussière > 50%"},
            { key: "pattern_dark_cloud_cover", name: "Dark Cloud Cover", desc: "Pénétration baissière > 50%"},
          ],
        },
        {
          title: "Continuation / gap",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_tasuki_gap", name: "Tasuki Gap", desc: "Continuation autour d'un gap"},
            { key: "pattern_separating_lines", name: "Separating Lines", desc: "Reprise au même open"},
            { key: "pattern_thrusting", name: "Thrusting", desc: "Rebond insuffisant sous midpoint"},
          ],
        },
        {
          title: "Confrontation acheteurs vendeurs",
          groupSwitch: true,
          items: [
            { key: "pattern_counterattack", name: "Counterattack", desc: "Clôtures quasi égales opposées"},
          ],
        },
        {
          title: "Retournements en étoile",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_morning_star", name: "Morning Star", desc: "Étoile haussière sur 3 bougies"},
            { key: "pattern_evening_star", name: "Evening Star", desc: "Étoile baissière sur 3 bougies"},
          ],
        },
        {
          title: "Impulsion directionnelle",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_3_white_soldiers", name: "Three White Soldiers", desc: "3 bougies haussières fortes"},
            { key: "pattern_3_black_crows", name: "Three Black Crows", desc: "3 bougies baissières fortes"},
          ],
        },
        {
          title: "Three Inside",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_3_inside_up", name: "Three Inside Up", desc: "Confirmation haussière après Harami"},
            { key: "pattern_3_inside_down", name: "Three Inside Down", desc: "Confirmation baissière après Harami"},
          ],
        },
        {
          title: "Patterns rares avancés",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_unique_3_river", name: "Unique Three River", desc: "Retournement haussier rare"},
            { key: "pattern_upside_gap_two_crows", name: "Upside Gap Two Crows", desc: "Retournement baissier rare"},
          ],
        },
        {
          title: "Retournements directionnels",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_kicker_bull", name: "Kicker Bull", desc: "2 Marubozu opposés avec gap haussier"},
            { key: "pattern_kicker_bear", name: "Kicker Bear", desc: "2 Marubozu opposés avec gap baissier"},
            { key: "pattern_abandoned_baby_bull", name: "Abandoned Baby Bull", desc: "Doji isolé après baisse"},
            { key: "pattern_abandoned_baby_bear", name: "Abandoned Baby Bear", desc: "Doji isolé après hausse"},
            { key: "pattern_belthold_bull", name: "Belt Hold Bull", desc: "Ouverture près du plus bas"},
            { key: "pattern_belthold_bear", name: "Belt Hold Bear", desc: "Ouverture près du plus haut"},
            { key: "pattern_breakaway_bull", name: "Breakaway Bull", desc: "Retournement haussier en 5 bougies"},
            { key: "pattern_breakaway_bear", name: "Breakaway Bear", desc: "Retournement baissier en 5 bougies"},
          ],
        },
        {
          title: "Continuation",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_rising_three_methods", name: "Rising Three Methods", desc: "Continuation haussière sur 5 bougies"},
            { key: "pattern_falling_three_methods", name: "Falling Three Methods", desc: "Continuation baissière sur 5 bougies"},
            { key: "pattern_mat_hold", name: "Mat Hold", desc: "Gap haussier puis consolidation"},
          ],
        },
        {
          title: "Gap / structure avancée",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_gap_side_side_white", name: "Gap Side-by-Side White", desc: "Gap puis deux bougies blanches similaires"},
            { key: "pattern_hikkake", name: "Hikkake", desc: "Fausse cassure après inside bar"},
            { key: "pattern_concealing_baby_swallow", name: "Concealing Baby Swallow", desc: "Retournement haussier rare en 4 bougies"},
          ],
        },
        {
          title: "Retournements rares",
          rowGrouping: "name-prefix",
          groupSwitch: true,
          items: [
            { key: "pattern_ladder_bottom", name: "Ladder Bottom", desc: "Retournement haussier rare en 5 bougies"},
            { key: "pattern_stick_sandwich", name: "Stick Sandwich", desc: "Retournement autour de clôtures égales"},
          ],
        },
      ],
    },

] satisfies readonly IndicatorModalGroupTemplate[];

const COMPOSITE_INDICATOR_MODAL_META = [
  {
    "id": "ichimoku",
    "stateId": "ichimoku",
    "title": "Ichimoku",
    "desc": "Tenkan, Kijun, Senkou, Chikou et nuage"
  },
  {
    "id": "bollinger",
    "stateId": "bollinger",
    "title": "Bollinger Bands",
    "desc": "Bandes supérieure, médiane, inférieure",
    "hasSettings": true
  },
  {
    "id": "macd",
    "stateId": "macd",
    "title": "MACD",
    "desc": "Ligne MACD, signal et histogramme"
  },
  {
    "id": "adx",
    "stateId": "adx",
    "title": "ADX / DMI",
    "desc": "Force de tendance, +DI et -DI"
  },
  {
    "id": "stochastic",
    "stateId": "stochastic",
    "title": "Stochastic",
    "desc": "Oscillateur %K et ligne signal %D"
  },
  {
    "id": "stochastic-rsi",
    "stateId": "stochRsi",
    "title": "Stochastic RSI",
    "desc": "Stochastique appliqué au RSI avec %K et %D"
  },
  {
    "id": "tsi",
    "stateId": "tsi",
    "title": "TSI",
    "desc": "True Strength Index et ligne signal"
  },
  {
    "id": "ppo",
    "stateId": "ppo",
    "title": "PPO",
    "desc": "MACD normalisé (%) + signal/hist."
  },
  {
    "id": "parabolic-sar",
    "stateId": "parabolicSar",
    "title": "Parabolic SAR",
    "desc": "Points SAR et signal de retournement"
  },
  {
    "id": "rvi",
    "stateId": "rvi",
    "title": "RVI",
    "desc": "Relative Vigor Index et ligne signal"
  },
  {
    "id": "fisher-transform",
    "stateId": "fisherTransform",
    "title": "Fisher Transform",
    "desc": "Fisher et ligne signal"
  },
  {
    "id": "elder-ray",
    "stateId": "elderBullBear",
    "title": "Elder Bull/Bear Power",
    "desc": "Pression acheteuse et vendeuse"
  },
  {
    "id": "aroon",
    "stateId": "aroon",
    "title": "Aroon",
    "desc": "Récence des plus hauts et plus bas"
  },
  {
    "id": "supertrend",
    "stateId": "supertrend",
    "title": "Supertrend",
    "desc": "Ligne et signal de régime"
  },
  {
    "id": "vortex",
    "stateId": "vortex",
    "title": "Vortex Indicator",
    "desc": "VI+ et VI-"
  },
  {
    "id": "kst",
    "stateId": "kst",
    "title": "KST",
    "desc": "Know Sure Thing et ligne signal"
  },
  {
    "id": "linear-regression",
    "stateId": "linearRegression",
    "title": "Linear Regression",
    "desc": "Valeur de régression et pente analytique"
  },
  {
    "id": "klinger",
    "stateId": "klinger",
    "title": "Klinger Oscillator",
    "desc": "Oscillateur volume-prix et ligne signal"
  },
  {
    "id": "elder-force-index",
    "stateId": "elderForceIndex",
    "title": "Elder Force Index",
    "desc": "Force brute et EMA 13 prix-volume"
  },
  {
    "id": "pivot-points-standard",
    "stateId": "pivotPointsStandard",
    "title": "Pivot Points Standard",
    "desc": "Pivot central, résistances R1-R3 et supports S1-S3",
    "sectionTitle": "Pivot Points Standard",
    "requireCompleteOutputs": true
  },
  {
    "id": "pivot-points-fibonacci",
    "stateId": "pivotPointsFibonacci",
    "title": "Pivot Points Fibonacci",
    "desc": "Pivot central, résistances et supports Fibonacci",
    "sectionTitle": "Pivot Points Fibonacci",
    "requireCompleteOutputs": true
  },
  {
    "id": "moving-average-crosses",
    "stateId": "movingAverageCrosses",
    "title": "Croisements de moyennes",
    "desc": "Signaux Golden Cross et Death Cross",
    "sectionTitle": "Croisements de moyennes",
    "requireCompleteOutputs": true
  },
  {
    "id": "vwap",
    "stateId": "vwap",
    "title": "VWAP",
    "desc": "Ligne VWAP et état Prix > VWAP",
    "sectionTitle": "Position intraday / volume",
    "requireCompleteOutputs": true
  },
  {
    "id": "donchian",
    "stateId": "donchian",
    "title": "Donchian Channels",
    "desc": "Canal prix basé sur les plus hauts et plus bas"
  },
  {
    "id": "keltner",
    "stateId": "keltner",
    "title": "Keltner Channels",
    "desc": "Canal de volatilité basé sur moyenne et ATR"
  },
  {
    "id": "volume-profile",
    "stateId": "volumeProfile",
    "title": "Volume Profile",
    "desc": "POC, VAH et VAL"
  }
] satisfies readonly CompositeIndicatorMeta[];

export const COMPOSITE_INDICATOR_SPECS: readonly CompositeIndicatorSpec[] = COMPOSITE_INDICATOR_MODAL_META.map((meta) => {
  const registryEntry = getAdvancedIndicatorRegistryEntry(meta.stateId);

  return {
    ...meta,
    title: meta.title || registryEntry.label,
    outputKeys: [...registryEntry.catalogKeys],
    wiredId: registryEntry.stateId,
  };
});

export const INDICATOR_MODAL_GROUPS: readonly BackendIndicatorGroup[] = RAW_INDICATOR_MODAL_GROUPS.map((group) => ({
  ...group,
  sections: group.sections.map((section) => ({
    ...section,
    items: section.items.map(withRegistryWiring),
  })),
}));

export const INDICATOR_MODAL_CATALOG_KEYS = INDICATOR_MODAL_GROUPS.flatMap((group) =>
  group.sections.flatMap((section) => section.items.map((item) => item.key)),
);

export const REGISTRY_MODAL_CATALOG_KEYS = ADVANCED_INDICATOR_REGISTRY_ENTRIES.flatMap((entry) => entry.catalogKeys);

export const isRegistryBackedModalCatalogKey = (key: string): boolean =>
  Object.prototype.hasOwnProperty.call(SPECIAL_MODAL_WIRED_IDS, key)
  || CATALOG_KEY_TO_INDICATOR_ID.has(key);

export const getIndicatorRegistryEntryForCatalogKey = (key: string) => {
  const indicatorId = CATALOG_KEY_TO_INDICATOR_ID.get(key);
  return indicatorId ? ADVANCED_INDICATOR_REGISTRY[indicatorId] : null;
};
