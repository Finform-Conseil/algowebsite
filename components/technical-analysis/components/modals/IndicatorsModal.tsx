// ================================================================================
// FICHIER : src/core/presentation/components/pages/Widget/TechnicalAnalysis/components/modals/IndicatorsModal.tsx
// [TENOR 2026 FIX] SCAR-125: Restored SMA/EMA toggles. Migrated to Smart Component.
// [TENOR 2026 FIX] SCAR-126: Premium UI Overhaul. Fixed overlapping cards.
// [TENOR 2026 SRE] SCAR-UI-FREEZE: Implemented Optimistic UI with Event Loop Yielding (setTimeout).
// [TENOR 2026 SRE] SCAR-SCROLL-JUMPING: Eradicated `content-visibility` hack. Restored pure native scroll.
// [TENOR 2026 FEAT] RSI 9, 14, 25 fully wired and functional per TradingView parity.
// [TENOR 2026 FIX] SCAR-DATA-BINDING: Wired Stochastic RSI to enable UI interaction.
// [TENOR 2026 HDR] BOLLINGER BANDS UPGRADE: Added inline settings panel and separated derived oscillators.
// ================================================================================

import React, { useCallback, useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { Check, Eye, EyeOff } from "lucide-react";
import { BaseModal } from "../common/BaseModal";
import { AdvancedIndicatorsState, BollingerSettings, MovingAverageTrendSignalId, PriceVsEmaMetricId, PriceVsSmaMetricId } from "../../config/TechnicalAnalysisTypes";
import {
  selectAdvancedIndicators,
  selectChartConfig,
  selectIndicatorPeriods,
  selectBollingerSettings,
  selectMarketData,
  selectMarketSnapshots,
  toggleAdvancedIndicator,
  setChartConfig,
  setIndicatorPeriods,
  setAdvancedIndicators,
  setBollingerSettings,
  setMovingAverageTrendSignal,
  setMovingAverageTrendSignals,
  setMovingAverageTrendSignalSourceAverages,
  setPriceVsSmaMetric,
  setPriceVsEmaMetric
} from "../../store/technicalAnalysisSlice";
import type { RootState } from "@/core/infrastructure/store";
import {
  SettingsNumberInput,
  SettingsColorOpacityInput,
  SettingsCheckbox,
  SettingsSelectInput
} from "../common/SettingsField";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import {
  MOVING_AVERAGE_TREND_SIGNAL_SPECS,
  buildSelectableEmaDefinitions,
  buildSelectableSmaDefinitions,
  normalizeMovingAverageTrendSignals,
  normalizeMovingAveragePeriods
} from "../../config/movingAverageSeries";
import {
  PRICE_VS_SMA_METRIC_SPECS,
  normalizePriceVsSmaMetrics,
} from "../../config/priceVsSmaMetrics";
import {
  PRICE_VS_EMA_METRIC_SPECS,
  normalizePriceVsEmaMetrics,
} from "../../config/priceVsEmaMetrics";
import {
  ADVANCED_MOVING_AVERAGE_SPECS,
  isAdvancedMovingAverageActive,
  toggleAdvancedMovingAverage,
  type AdvancedMovingAverageActivationState,
  type AdvancedMovingAverageId,
  type AdvancedMovingAverageSpec,
} from "../../config/advancedMovingAverageSeries";
import {
  calculateMovingAverageTrendSignals,
  type MovingAverageTrendSignalResult,
  type MovingAverageTrendState
} from "../../lib/Indicators/movingAverageTrendSignals";
import {
  calculatePriceVsSmaMetrics,
  type PriceVsSmaMetricResult,
} from "../../lib/Indicators/priceVsSmaMetrics";
import {
  calculatePriceVsEmaMetrics,
  type PriceVsEmaMetricResult,
} from "../../lib/Indicators/priceVsEmaMetrics";

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  advancedIndicators?: AdvancedIndicatorsState;
  onToggle?: (indicator: keyof AdvancedIndicatorsState) => void;
}

type BackendIndicatorItem = {
  key: string;
  name: string;
  desc: string;
  wiredId?: keyof AdvancedIndicatorsState | string; // Allowed string for custom routing (RSI)
};

type BackendIndicatorSection = {
  title: string;
  items: BackendIndicatorItem[];
  rowGrouping?: "name-prefix";
};

type BackendIndicatorGroup = {
  title: string;
  subtitle: string;
  sections: BackendIndicatorSection[];
};

type CompositeIndicatorSpec = {
  id: string;
  title: string;
  desc: string;
  outputKeys: string[];
  missingOutputs?: BackendIndicatorItem[];
  wiredId?: keyof AdvancedIndicatorsState | string;
  hasSettings?: boolean; // [TENOR 2026 HDR] Enables the settings gear icon
};

const MAX_BOTTOM_INDICATORS = 5;
const BOTTOM_PANEL_INDICATORS = [
  "rsi",
  "macd",
  "stochastic",
  "stochRsi",
  "atr",
  "cci",
  "cci14",
  "cci20",
  "mfi14",
  "williamsR",
  "williamsR14",
  "roc",
  "roc10",
  "roc20",
  "momentum10",
  "momentum20",
  "cmo14",
  "dymi",
  "ultimateOsc",
  "dpo20",
  "tsi",
  "awesomeOsc",
  "acOsc",
  "rvi",
  "fisherTransform",
  "elderBullBear",
  "coppock",
  "ppo",
  "apo",
  "adx",
  "aroon",
  "aroonOsc",
  "vortex",
  "trix",
  "stc",
  "massIndex",
  "obv",
  "bbWidth",
  "bbPercentB",
] satisfies Array<keyof AdvancedIndicatorsState>;

const isCciMomentumKey = (id: string): id is "cci" | "cci14" | "cci20" =>
  id === "cci" || id === "cci14" || id === "cci20";

const hasActiveCciMomentumPanel = (indicators: AdvancedIndicatorsState): boolean =>
  indicators.cci || indicators.cci14 || indicators.cci20;

const isWilliamsRKey = (id: string): id is "williamsR" | "williamsR14" =>
  id === "williamsR" || id === "williamsR14";

const hasActiveWilliamsRPanel = (indicators: AdvancedIndicatorsState): boolean =>
  indicators.williamsR || indicators.williamsR14;

const isRocMomentumKey = (id: string): id is "roc" | "roc10" | "roc20" =>
  id === "roc" || id === "roc10" || id === "roc20";

const hasActiveRocMomentumPanel = (indicators: AdvancedIndicatorsState): boolean =>
  indicators.roc || indicators.roc10 || indicators.roc20;

const isRawMomentumKey = (id: string): id is "momentum10" | "momentum20" =>
  id === "momentum10" || id === "momentum20";

const hasActiveRawMomentumPanel = (indicators: AdvancedIndicatorsState): boolean =>
  indicators.momentum10 || indicators.momentum20;

const countActiveBottomIndicators = (indicators: AdvancedIndicatorsState) =>
  BOTTOM_PANEL_INDICATORS.reduce((total, key) => {
    if (isCciMomentumKey(key) || isWilliamsRKey(key) || isRocMomentumKey(key) || isRawMomentumKey(key)) return total;
    return total + (indicators[key] ? 1 : 0);
  }, (hasActiveCciMomentumPanel(indicators) ? 1 : 0)
    + (hasActiveWilliamsRPanel(indicators) ? 1 : 0)
    + (hasActiveRocMomentumPanel(indicators) ? 1 : 0)
    + (hasActiveRawMomentumPanel(indicators) ? 1 : 0));

const isAdvancedIndicatorKey = (id: string): id is keyof AdvancedIndicatorsState =>
  id in {
    rsi: true,
    macd: true,
    bollinger: true,
    stochastic: true,
    atr: true,
    cci: true,
    cci14: true,
    cci20: true,
    mfi14: true,
    williamsR: true,
    williamsR14: true,
    roc: true,
    roc10: true,
    roc20: true,
    momentum10: true,
    momentum20: true,
    cmo14: true,
    dymi: true,
    ultimateOsc: true,
    dpo20: true,
    tsi: true,
    awesomeOsc: true,
    acOsc: true,
    rvi: true,
    fisherTransform: true,
    elderBullBear: true,
    coppock: true,
    ppo: true,
    apo: true,
    adx: true,
    aroon: true,
    aroonOsc: true,
    supertrend: true,
    vortex: true,
    trix: true,
    stc: true,
    massIndex: true,
    parabolicSar: true,
    obv: true,
    ichimoku: true,
    stochRsi: true,
    bbWidth: true,
    bbPercentB: true,
  };

const isBottomPanelIndicatorKey = (id: string): id is typeof BOTTOM_PANEL_INDICATORS[number] =>
  BOTTOM_PANEL_INDICATORS.includes(id as typeof BOTTOM_PANEL_INDICATORS[number]);

const compositeIndicatorSpecs: CompositeIndicatorSpec[] = [
  {
    id: "ichimoku",
    title: "Ichimoku",
    desc: "Tenkan, Kijun, Senkou, Chikou et nuage",
    outputKeys: [
      "ichimoku_tenkan",
      "ichimoku_kijun",
      "ichimoku_senkou_a",
      "ichimoku_senkou_b",
      "ichimoku_chikou",
      "ichimoku_cloud_color",
      "price_vs_cloud",
    ],
    wiredId: "ichimoku",
  },
  {
    id: "bollinger",
    title: "Bollinger Bands",
    desc: "Bandes supérieure, médiane, inférieure",
    outputKeys: ["bb_upper", "bb_middle", "bb_lower"], // Width and %B are now standalone
    wiredId: "bollinger",
    hasSettings: true, // [TENOR 2026 HDR] Enable settings panel
  },
  {
    id: "macd",
    title: "MACD",
    desc: "Ligne MACD, signal et histogramme",
    outputKeys: ["macd_line", "macd_signal", "macd_histogram"],
    wiredId: "macd",
  },
  {
    id: "adx",
    title: "ADX / DMI",
    desc: "Force de tendance, +DI et -DI",
    outputKeys: ["adx", "adx_plus_di", "adx_minus_di", "adx_trend_strength"],
    wiredId: "adx",
  },
  {
    id: "stochastic",
    title: "Stochastic",
    desc: "Oscillateur %K et ligne signal %D",
    outputKeys: ["stoch_k", "stoch_d"],
    wiredId: "stochastic",
  },
  {
    id: "stochastic-rsi",
    title: "Stochastic RSI",
    desc: "Stochastique appliqué au RSI avec %K et %D",
    outputKeys: ["stoch_rsi_k", "stoch_rsi_d"],
    wiredId: "stochRsi",
  },
  {
    id: "tsi",
    title: "TSI",
    desc: "True Strength Index et ligne signal",
    outputKeys: ["tsi", "tsi_signal"],
    wiredId: "tsi",
  },
  {
    id: "ppo",
    title: "PPO",
    desc: "MACD normalisé (%) + signal/hist.",
    outputKeys: ["macd_ppo", "macd_ppo_signal", "macd_ppo_histogram"],
    wiredId: "ppo",
  },
  {
    id: "parabolic-sar",
    title: "Parabolic SAR",
    desc: "Points SAR et signal de retournement",
    outputKeys: ["parabolic_sar", "parabolic_sar_signal"],
    wiredId: "parabolicSar",
  },
  {
    id: "rvi",
    title: "RVI",
    desc: "Relative Vigor Index et ligne signal",
    outputKeys: ["rvi", "rvi_signal"],
    wiredId: "rvi",
  },
  {
    id: "fisher-transform",
    title: "Fisher Transform",
    desc: "Fisher et ligne signal",
    outputKeys: ["fisher_transform", "fisher_transform_signal"],
    wiredId: "fisherTransform",
  },
  {
    id: "elder-ray",
    title: "Elder Bull/Bear Power",
    desc: "Pression acheteuse et vendeuse",
    outputKeys: ["elder_bull_power", "elder_bear_power"],
    wiredId: "elderBullBear",
  },
  {
    id: "aroon",
    title: "Aroon",
    desc: "Récence des plus hauts et plus bas",
    outputKeys: ["aroon_up", "aroon_down"],
    wiredId: "aroon",
  },
  {
    id: "supertrend",
    title: "Supertrend",
    desc: "Ligne et signal de régime",
    outputKeys: ["supertrend", "supertrend_signal"],
    wiredId: "supertrend",
  },
  {
    id: "vortex",
    title: "Vortex Indicator",
    desc: "VI+ et VI-",
    outputKeys: ["vortex_plus", "vortex_minus"],
    wiredId: "vortex",
  },
  {
    id: "kst",
    title: "KST",
    desc: "Know Sure Thing et ligne signal",
    outputKeys: ["kst", "kst_signal"],
  },
  {
    id: "linear-regression",
    title: "Linear Regression",
    desc: "Valeur de régression et pente analytique",
    outputKeys: ["linear_reg_value", "linear_reg_slope"],
  },
  {
    id: "klinger",
    title: "Klinger Oscillator",
    desc: "Oscillateur volume-prix et ligne signal",
    outputKeys: ["klinger_osc", "klinger_signal"],
  },
  {
    id: "pivot-points-standard",
    title: "Pivot Points Standard",
    desc: "Pivot central, résistances R1-R3 et supports S1-S3",
    outputKeys: [
      "pivot_standard",
      "pivot_r1",
      "pivot_r2",
      "pivot_r3",
      "pivot_s1",
      "pivot_s2",
      "pivot_s3",
    ],
  },
  {
    id: "pivot-points-fibonacci",
    title: "Pivot Points Fibonacci",
    desc: "Pivot central, résistances et supports Fibonacci",
    outputKeys: ["pivot_standard", "pivot_fib_r1", "pivot_fib_r2", "pivot_fib_s1", "pivot_fib_s2"],
  },
  {
    id: "moving-average-crosses",
    title: "Croisements de moyennes",
    desc: "Signaux Golden Cross et Death Cross",
    outputKeys: ["golden_cross", "death_cross"],
  },
  {
    id: "donchian",
    title: "Donchian Channels",
    desc: "Canal prix basé sur les plus hauts et plus bas",
    outputKeys: ["donchian_upper", "donchian_middle", "donchian_lower"],
  },
  {
    id: "keltner",
    title: "Keltner Channels",
    desc: "Canal de volatilité basé sur moyenne et ATR",
    outputKeys: ["keltner_upper", "keltner_lower"],
    missingOutputs: [
      { key: "keltner_middle", name: "Keltner Middle", desc: "Recommandé, non fourni par le backend" },
    ],
  },
  {
    id: "volume-profile",
    title: "Volume Profile",
    desc: "POC, VAH et VAL",
    outputKeys: ["vp_poc", "vp_vah", "vp_val"],
  },
];

// ============================================================================
// [TENOR 2026 SRE] BARE-METAL LEAF COMPONENTS WITH OPTIMISTIC UI
// ============================================================================

const MACard = React.memo(({
  type,
  period,
  label,
  color,
  isActive,
  onToggle
}: {
  type: "sma" | "ema";
  period: number;
  label: string;
  color: string;
  isActive: boolean;
  onToggle: (type: "sma" | "ema", period: number) => void;
}) => {
  const [optimisticActive, setOptimisticActive] = useState(isActive);

  useEffect(() => {
    setOptimisticActive(isActive);
  }, [isActive]);

  const handleClick = () => {
    setOptimisticActive(!optimisticActive);
    setTimeout(() => {
      onToggle(type, period);
    }, 16);
  };

  return (
    <div className="col p-1">
      <div
        className="d-flex align-items-center p-2 rounded h-100"
        style={{
          border: `1px solid ${optimisticActive ? color : '#1e293b'}`,
          cursor: "pointer",
          backgroundColor: optimisticActive ? `${color}1A` : "#0f172a",
        }}
        onClick={handleClick}
      >
        <div
          className="d-flex align-items-center justify-content-center me-2 flex-shrink-0"
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '4px',
            border: `1px solid ${optimisticActive ? color : '#334155'}`,
            backgroundColor: optimisticActive ? color : 'transparent',
          }}
        >
          {optimisticActive && (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <div className="d-flex align-items-center gap-2 flex-grow-1 overflow-hidden">
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}></span>
          <strong className="text-truncate" style={{ color: optimisticActive ? '#fff' : '#94a3b8', fontSize: "12px" }}>
            {label}
          </strong>
        </div>
      </div>
    </div>
  );
});
MACard.displayName = "MACard";

const IndicatorCard = React.memo(({
  ind,
  isActive,
  isWired,
  canToggle,
  onToggle
}: {
  ind: BackendIndicatorItem;
  isActive: boolean;
  isWired: boolean;
  canToggle: (id: string) => boolean;
  onToggle: (id: string) => void;
}) => {
  const [optimisticActive, setOptimisticActive] = useState(isActive);

  useEffect(() => {
    setOptimisticActive(isActive);
  }, [isActive]);

  const activeColor = "#2962ff";

  const handleClick = () => {
    if (isWired && ind.wiredId) {
      const nextActive = !optimisticActive;
      if (!canToggle(ind.wiredId as string)) return;
      setOptimisticActive(nextActive);
      setTimeout(() => {
        onToggle(ind.wiredId as string);
      }, 16);
    }
  };

  return (
    <div className="col p-1">
      <div
        className={`gp-indicator-catalog-card ${optimisticActive ? "active" : ""} ${!isWired ? "is-backend-only" : ""}`}
        style={{
          border: `1px solid ${optimisticActive ? activeColor : '#1e293b'}`,
          cursor: isWired ? "pointer" : "default",
          backgroundColor: optimisticActive ? "rgba(41, 98, 255, 0.1)" : "#0f172a",
          padding: "8px 12px",
          borderRadius: "6px",
          display: "flex",
          alignItems: "center"
        }}
        onClick={handleClick}
      >
        <div
          className="d-flex align-items-center justify-content-center me-3 flex-shrink-0"
          style={{
            width: '18px',
            height: '18px',
            borderRadius: '4px',
            border: `1px solid ${optimisticActive ? activeColor : isWired ? '#334155' : '#1e293b'}`,
            backgroundColor: optimisticActive ? activeColor : 'transparent',
          }}
        >
          {optimisticActive && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </div>
        <div className="flex-grow-1 min-w-0 overflow-hidden">
          <strong className="d-block text-truncate" style={{ color: optimisticActive ? '#fff' : '#cbd5e1', fontSize: "13px" }}>
            {ind.name}
          </strong>
          <small className="d-block text-truncate" style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>
            {ind.desc}
          </small>
        </div>
        {!isWired && (
          <span style={{ fontSize: "9px", fontWeight: 600, color: "#94a3b8", backgroundColor: "#1e293b", padding: "2px 6px", borderRadius: "4px", marginLeft: "8px" }}>
            BACKEND
          </span>
        )}
      </div>
    </div>
  );
});
IndicatorCard.displayName = "IndicatorCard";

const formatSignalNumber = (value: number | null, fractionDigits = 2): string => {
  if (value === null || !Number.isFinite(value)) return "N/D";
  return value.toLocaleString("fr-FR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const formatSignalPercent = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return "N/D";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
};

const TREND_STATE_META: Record<MovingAverageTrendState, { label: string; color: string; background: string }> = {
  above: { label: "Au-dessus", color: "#00e676", background: "rgba(0, 230, 118, 0.14)" },
  below: { label: "En dessous", color: "#ff3b5f", background: "rgba(255, 59, 95, 0.14)" },
  neutral: { label: "Neutre", color: "#facc15", background: "rgba(250, 204, 21, 0.14)" },
  unknown: { label: "N/D", color: "#94a3b8", background: "rgba(148, 163, 184, 0.14)" },
};

const resolveAverageStateLabel = (state: MovingAverageTrendState, shortLabel: string): string => {
  if (state === "above") return `Close > ${shortLabel}`;
  if (state === "below") return `Close < ${shortLabel}`;
  if (state === "neutral") return "Neutre";
  return "N/D";
};

const MovingAverageTrendSignalCard = React.memo(({
  result,
  isActive,
  sourceLinesEnabled,
  onToggle,
}: {
  result: MovingAverageTrendSignalResult;
  isActive: boolean;
  sourceLinesEnabled: boolean;
  onToggle: (id: MovingAverageTrendSignalId, active: boolean) => void;
}) => {
  const meta = TREND_STATE_META[result.state];
  const [optimisticActive, setOptimisticActive] = useState(isActive);
  const optimisticActiveRef = useRef(isActive);

  useEffect(() => {
    optimisticActiveRef.current = isActive;
    setOptimisticActive(isActive);
  }, [isActive]);

  const handleToggle = useCallback(() => {
    const nextActive = !optimisticActiveRef.current;
    optimisticActiveRef.current = nextActive;
    setOptimisticActive(nextActive);
    globalThis.setTimeout(() => onToggle(result.spec.id, nextActive), 16);
  }, [onToggle, result.spec.id]);

  const sourceLineStatus = sourceLinesEnabled && optimisticActive
    ? "ligne visible"
    : optimisticActive
      ? "signal seul"
      : "signal inactif";
  const distanceLabel = result.distancePercent === null ? "N/D" : formatSignalPercent(result.distancePercent);
  const metricLine = result.distancePercent === null
    ? "Distance N/D"
    : `Distance ${distanceLabel} vs ${result.spec.shortLabel}`;
  const sourceLine = `Close ${formatSignalNumber(result.close)} · ${result.spec.shortLabel} ${formatSignalNumber(result.average)}`;
  const statusLabel = result.distancePercent === null
    ? "N/D"
    : result.isConfirmedBar
      ? "CONFIRMÉ"
      : "LIVE";
  const statusColor = result.distancePercent === null
    ? "#94a3b8"
    : result.isConfirmedBar
      ? "#00e676"
      : "#facc15";
  const stateLabel = resolveAverageStateLabel(result.state, result.spec.shortLabel);
  const detailsLabel = [
    result.spec.description,
    metricLine,
    sourceLine,
    `${statusLabel} · ${result.qualityLabel} · ${sourceLineStatus}`,
    `${result.availableBars}/${result.requiredBars} bougies`,
    result.reason,
  ].join("\n");

  return (
    <button
      aria-label={`${result.spec.label}: ${optimisticActive ? "actif" : "inactif"}, ${stateLabel}, ${metricLine}, ${statusLabel}`}
      aria-pressed={optimisticActive}
      className={`gp-ma-trend-output-card ${optimisticActive ? "active" : ""} is-${result.state}`}
      onClick={handleToggle}
      title={detailsLabel}
      type="button"
    >
      <span className="gp-composite-indicator-check gp-ma-trend-output-check" aria-hidden="true">
        {optimisticActive && <Check size={13} strokeWidth={3.4} />}
      </span>
      <span className="gp-ma-trend-output-copy">
        <span className="gp-ma-trend-output-head">
          <span className="gp-ma-trend-output-title">
            <strong>{result.spec.label}</strong>
          </span>
          <span className="gp-ma-trend-state gp-ma-trend-output-state" style={{ color: meta.color, background: meta.background, borderColor: `${meta.color}33` }}>
            {stateLabel}
          </span>
        </span>
        <small className="gp-ma-trend-output-horizon">{result.spec.horizon}</small>
        <span className="gp-ma-trend-output-value-row">
          <span className="gp-ma-trend-output-value" style={{ color: meta.color }}>
            {distanceLabel}
          </span>
          <span className="gp-ma-trend-output-status" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </span>
      </span>
    </button>
  );
});
MovingAverageTrendSignalCard.displayName = "MovingAverageTrendSignalCard";

const MovingAverageTrendSourceToggle = React.memo(({
  checked,
  activeCount,
  onToggle,
}: {
  checked: boolean;
  activeCount: number;
  onToggle: (checked: boolean) => void;
}) => {
  const Icon = checked ? Eye : EyeOff;
  const plural = activeCount > 1 ? "s" : "";
  const helperText = checked
    ? `${activeCount} ligne${plural} source${plural} synchronisée${plural}`
    : "Option de rendu: les signaux restent indépendants.";

  return (
    <button
      aria-pressed={checked}
      className={`gp-ma-source-toggle ${checked ? "is-active" : ""}`}
      onClick={() => onToggle(!checked)}
      type="button"
    >
      <span className="gp-ma-source-toggle-icon gp-composite-indicator-check" aria-hidden="true">
        <Icon size={16} strokeWidth={2.4} />
      </span>
      <span className="gp-ma-source-toggle-copy">
        <strong>Afficher les lignes sources activées</strong>
        <small>{helperText}</small>
      </span>
      <span className="gp-ma-source-toggle-switch" aria-hidden="true">
        <span />
      </span>
    </button>
  );
});
MovingAverageTrendSourceToggle.displayName = "MovingAverageTrendSourceToggle";

const PriceVsSmaMetricCard = React.memo(({
  result,
  isActive,
  onToggle,
}: {
  result: PriceVsSmaMetricResult;
  isActive: boolean;
  onToggle: (id: PriceVsSmaMetricId, active: boolean) => void;
}) => {
  const meta = TREND_STATE_META[result.state];
  const [optimisticActive, setOptimisticActive] = useState(isActive);
  const optimisticActiveRef = useRef(isActive);

  useEffect(() => {
    optimisticActiveRef.current = isActive;
    setOptimisticActive(isActive);
  }, [isActive]);

  const handleToggle = useCallback(() => {
    const nextActive = !optimisticActiveRef.current;
    optimisticActiveRef.current = nextActive;
    setOptimisticActive(nextActive);
    globalThis.setTimeout(() => onToggle(result.spec.id, nextActive), 16);
  }, [onToggle, result.spec.id]);

  const distanceLabel = result.distancePercent === null ? "N/D" : formatSignalPercent(result.distancePercent);
  const metricLine = result.distancePercent === null
    ? "Distance N/D"
    : `Distance ${distanceLabel} vs ${result.spec.shortLabel}`;
  const sourceLine = `Close ${formatSignalNumber(result.close)} · ${result.spec.shortLabel} ${formatSignalNumber(result.sma)}`;
  const statusLabel = result.distancePercent === null
    ? "N/D"
    : result.isConfirmedBar
      ? "CONFIRMÉ"
      : "LIVE";
  const statusColor = result.distancePercent === null
    ? "#94a3b8"
    : result.isConfirmedBar
      ? "#00e676"
      : "#facc15";
  const stateLabel = resolveAverageStateLabel(result.state, result.spec.shortLabel);
  const detailsLabel = [
    result.spec.description,
    metricLine,
    sourceLine,
    `${result.availableBars}/${result.requiredBars} bougies`,
    result.qualityLabel,
    result.reason,
  ].join("\n");

  return (
    <button
      aria-label={`${result.spec.label}: ${optimisticActive ? "actif" : "inactif"}, ${stateLabel}, ${metricLine}, ${statusLabel}, ${result.qualityLabel}`}
      aria-pressed={optimisticActive}
      className={`gp-price-vs-sma-card ${optimisticActive ? "active" : ""} is-${result.state}`}
      onClick={handleToggle}
      title={detailsLabel}
      type="button"
    >
      <span className="gp-composite-indicator-check gp-price-vs-sma-check" aria-hidden="true">
        {optimisticActive && <Check size={13} strokeWidth={3.4} />}
      </span>
      <span className="gp-price-vs-sma-copy">
        <span className="gp-price-vs-sma-head">
          <strong>{result.spec.label}</strong>
          <span className="gp-ma-trend-state gp-price-vs-sma-state" style={{ color: meta.color, background: meta.background, borderColor: `${meta.color}33` }}>
            {stateLabel}
          </span>
        </span>
        <small>{result.spec.horizon}</small>
        <span className="gp-price-vs-sma-value-row">
          <span className="gp-price-vs-sma-value" style={{ color: meta.color }}>
            {distanceLabel}
          </span>
          <span className="gp-price-vs-sma-status" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </span>
      </span>
    </button>
  );
});
PriceVsSmaMetricCard.displayName = "PriceVsSmaMetricCard";

const PriceVsEmaMetricCard = React.memo(({
  result,
  isActive,
  onToggle,
}: {
  result: PriceVsEmaMetricResult;
  isActive: boolean;
  onToggle: (id: PriceVsEmaMetricId, active: boolean) => void;
}) => {
  const meta = TREND_STATE_META[result.state];
  const [optimisticActive, setOptimisticActive] = useState(isActive);
  const optimisticActiveRef = useRef(isActive);

  useEffect(() => {
    optimisticActiveRef.current = isActive;
    setOptimisticActive(isActive);
  }, [isActive]);

  const handleToggle = useCallback(() => {
    const nextActive = !optimisticActiveRef.current;
    optimisticActiveRef.current = nextActive;
    setOptimisticActive(nextActive);
    globalThis.setTimeout(() => onToggle(result.spec.id, nextActive), 16);
  }, [onToggle, result.spec.id]);

  const distanceLabel = result.distancePercent === null ? "N/D" : formatSignalPercent(result.distancePercent);
  const metricLine = result.distancePercent === null
    ? "Distance N/D"
    : `Distance ${distanceLabel} vs ${result.spec.shortLabel}`;
  const sourceLine = `Close ${formatSignalNumber(result.close)} · ${result.spec.shortLabel} ${formatSignalNumber(result.ema)}`;
  const statusLabel = result.distancePercent === null
    ? "N/D"
    : result.isConfirmedBar
      ? "CONFIRMÉ"
      : "LIVE";
  const statusColor = result.distancePercent === null
    ? "#94a3b8"
    : result.isConfirmedBar
      ? "#00e676"
      : "#facc15";
  const stateLabel = resolveAverageStateLabel(result.state, result.spec.shortLabel);
  const detailsLabel = [
    result.spec.description,
    metricLine,
    sourceLine,
    `${result.availableBars}/${result.requiredBars} bougies`,
    result.qualityLabel,
    result.reason,
  ].join("\n");

  return (
    <button
      aria-label={`${result.spec.label}: ${optimisticActive ? "actif" : "inactif"}, ${stateLabel}, ${metricLine}, ${statusLabel}, ${result.qualityLabel}`}
      aria-pressed={optimisticActive}
      className={`gp-price-vs-sma-card gp-price-vs-ema-card ${optimisticActive ? "active" : ""} is-${result.state}`}
      onClick={handleToggle}
      title={detailsLabel}
      type="button"
    >
      <span className="gp-composite-indicator-check gp-price-vs-sma-check" aria-hidden="true">
        {optimisticActive && <Check size={13} strokeWidth={3.4} />}
      </span>
      <span className="gp-price-vs-sma-copy">
        <span className="gp-price-vs-sma-head">
          <strong>{result.spec.label}</strong>
          <span className="gp-ma-trend-state gp-price-vs-sma-state" style={{ color: meta.color, background: meta.background, borderColor: `${meta.color}33` }}>
            {stateLabel}
          </span>
        </span>
        <small>{result.spec.horizon}</small>
        <span className="gp-price-vs-sma-value-row">
          <span className="gp-price-vs-sma-value" style={{ color: meta.color }}>
            {distanceLabel}
          </span>
          <span className="gp-price-vs-sma-status" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </span>
      </span>
    </button>
  );
});
PriceVsEmaMetricCard.displayName = "PriceVsEmaMetricCard";

const AdvancedMovingAverageCard = React.memo(({
  spec,
  isActive,
  availableBars,
  onToggle,
}: {
  spec: AdvancedMovingAverageSpec;
  isActive: boolean;
  availableBars: number;
  onToggle: (id: AdvancedMovingAverageId, active: boolean) => void;
}) => {
  const [optimisticActive, setOptimisticActive] = useState(isActive);
  const optimisticActiveRef = useRef(isActive);

  useEffect(() => {
    optimisticActiveRef.current = isActive;
    setOptimisticActive(isActive);
  }, [isActive]);

  const handleToggle = useCallback(() => {
    const nextActive = !optimisticActiveRef.current;
    optimisticActiveRef.current = nextActive;
    setOptimisticActive(nextActive);
    globalThis.setTimeout(() => onToggle(spec.id, nextActive), 16);
  }, [onToggle, spec.id]);

  const isReady = availableBars >= spec.requiredBars;
  const statusLabel = isReady ? "LIVE" : "N/D";
  const statusColor = isReady ? "#facc15" : "#94a3b8";
  const visibleSourceLabel = spec.family === "vwma" ? "Src: Close x Vol" : "Src: Close";
  const sourceLabel = spec.family === "vwma" ? "Price source: Close · Weight: Volume" : "Price source: Close";
  const detailsLabel = [
    spec.description,
    sourceLabel,
    `Rendu: ligne overlay sur le graphique prix`,
    `Lookback strict: ${spec.requiredBars} bougies`,
    `${availableBars}/${spec.requiredBars} bougies disponibles`,
  ].join("\n");

  return (
    <button
      aria-label={`${spec.label}: ${optimisticActive ? "actif" : "inactif"}, ${spec.horizon}, ${statusLabel}`}
      aria-pressed={optimisticActive}
      className={`gp-advanced-ma-card ${optimisticActive ? "active" : ""} is-${spec.family}`}
      onClick={handleToggle}
      title={detailsLabel}
      type="button"
    >
      <span className="gp-composite-indicator-check gp-advanced-ma-check" aria-hidden="true">
        {optimisticActive && <Check size={13} strokeWidth={3.4} />}
      </span>
      <span className="gp-advanced-ma-copy">
        <span className="gp-advanced-ma-head">
          <strong>{spec.label}</strong>
          <span className="gp-advanced-ma-badge" style={{ color: spec.color, borderColor: `${spec.color}55`, background: `${spec.color}18` }}>
            {spec.shortLabel}
          </span>
        </span>
        <small>{spec.horizon}</small>
        <span className="gp-advanced-ma-value-row">
          <span className="gp-advanced-ma-source" style={{ color: spec.color }}>
            {visibleSourceLabel}
          </span>
          <span className="gp-advanced-ma-status" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </span>
      </span>
    </button>
  );
});
AdvancedMovingAverageCard.displayName = "AdvancedMovingAverageCard";

// ============================================================================
// [TENOR 2026 HDR] BOLLINGER SETTINGS PANEL
// ============================================================================
const BollingerSettingsPanel = React.memo(() => {
  const dispatch = useDispatch();
  const settings = useSelector(selectBollingerSettings, shallowEqual);

  const update = (patch: Partial<BollingerSettings>) => {
    dispatch(setBollingerSettings(patch));
  };

  return (
    <div className="p-3 mt-2 rounded" style={{ backgroundColor: "rgba(0,0,0,0.2)", border: "1px solid #1e293b" }}>
      <div className="row g-2 mb-3">
        <div className="col-4">
          <SettingsNumberInput
            label="Length"
            value={settings.length}
            onChange={v => update({ length: v })}
          />
        </div>
        <div className="col-4">
          <SettingsNumberInput
            label="StdDev"
            value={settings.multiplier}
            step={0.1}
            onChange={v => update({ multiplier: v })}
          />
        </div>
        <div className="col-4">
          <SettingsNumberInput
            label="Offset"
            value={settings.offset}
            onChange={v => update({ offset: v })}
          />
        </div>
      </div>
      <div className="mb-3">
        <SettingsSelectInput
          label="Source"
          value={settings.source}
          options={[
            { label: "Close", value: "close" },
            { label: "Open", value: "open" },
            { label: "High", value: "high" },
            { label: "Low", value: "low" },
            { label: "HL2", value: "hl2" },
            { label: "HLC3", value: "hlc3" },
            { label: "OHLC4", value: "ohlc4" },
            { label: "HLCC4", value: "hlcc4" }
          ]}
          onChange={v => update({ source: v as any })}
          width="100%"
        />
      </div>
      <hr className="gp-separator" />
      <div className="d-flex flex-column gap-2">
        <div className="d-flex align-items-center justify-content-between">
          <SettingsCheckbox label="Upper Band" checked={settings.showUpper} onChange={v => update({ showUpper: v })} />
          <SettingsColorOpacityInput color={settings.upperColor} opacity={1} onColorChange={v => update({ upperColor: v })} onOpacityChange={() => { }} />
        </div>
        <div className="d-flex align-items-center justify-content-between">
          <SettingsCheckbox label="Middle Band" checked={settings.showMiddle} onChange={v => update({ showMiddle: v })} />
          <SettingsColorOpacityInput color={settings.middleColor} opacity={1} onColorChange={v => update({ middleColor: v })} onOpacityChange={() => { }} />
        </div>
        <div className="d-flex align-items-center justify-content-between">
          <SettingsCheckbox label="Lower Band" checked={settings.showLower} onChange={v => update({ showLower: v })} />
          <SettingsColorOpacityInput color={settings.lowerColor} opacity={1} onColorChange={v => update({ lowerColor: v })} onOpacityChange={() => { }} />
        </div>
        <div className="d-flex align-items-center justify-content-between">
          <SettingsCheckbox label="Background Fill" checked={settings.showFill} onChange={v => update({ showFill: v })} />
          <SettingsColorOpacityInput color={settings.fillColor} opacity={settings.fillOpacity} onColorChange={v => update({ fillColor: v })} onOpacityChange={v => update({ fillOpacity: v })} />
        </div>
      </div>
    </div>
  );
});
BollingerSettingsPanel.displayName = "BollingerSettingsPanel";

const CompositeIndicatorCard = React.memo(({
  spec,
  items,
  isActive,
  isWired,
  canToggle,
  onToggle,
  children
}: {
  spec: CompositeIndicatorSpec;
  items: BackendIndicatorItem[];
  isActive: boolean;
  isWired: boolean;
  canToggle: (id: string) => boolean;
  onToggle: (id: string) => void;
  children?: React.ReactNode;
}) => {
  const [optimisticActive, setOptimisticActive] = useState(isActive);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setOptimisticActive(isActive);
  }, [isActive]);

  const activeColor = "#2962ff";

  const handleClick = () => {
    if (isWired && spec.wiredId) {
      const nextActive = !optimisticActive;
      if (!canToggle(spec.wiredId as string)) return;
      setOptimisticActive(nextActive);
      setTimeout(() => {
        onToggle(spec.wiredId as string);
      }, 16);
    }
  };

  return (
    <div className={`gp-composite-indicator ${optimisticActive ? "active" : ""} ${!isWired ? "is-backend-only" : ""}`} style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          aria-pressed={isWired ? optimisticActive : undefined}
          className="gp-composite-indicator-parent"
          disabled={!isWired}
          onClick={handleClick}
          type="button"
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            padding: "10px 12px",
            backgroundColor: optimisticActive ? "rgba(41, 98, 255, 0.1)" : "#0f172a",
            border: `1px solid ${optimisticActive ? activeColor : '#1e293b'}`,
            borderRadius: "6px",
            cursor: isWired ? "pointer" : "default",
            textAlign: "left"
          }}
        >
          <span
            className="gp-composite-indicator-check d-flex align-items-center justify-content-center me-3 flex-shrink-0"
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '4px',
              border: `1px solid ${optimisticActive ? activeColor : '#334155'}`,
              backgroundColor: optimisticActive ? activeColor : "transparent",
            }}
          >
            {optimisticActive && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
          </span>
          <span className="gp-composite-indicator-copy flex-grow-1">
            <strong style={{ display: "block", color: optimisticActive ? '#fff' : '#cbd5e1', fontSize: "13px" }}>{spec.title}</strong>
            <small style={{ display: "block", color: "#64748b", fontSize: "11px", marginTop: "2px" }}>{spec.desc}</small>
          </span>
          {!isWired && (
            <span style={{ fontSize: "9px", fontWeight: 600, color: "#94a3b8", backgroundColor: "#1e293b", padding: "2px 6px", borderRadius: "4px", marginLeft: "8px" }}>
              BACKEND
            </span>
          )}
        </button>
        
        {/* [TENOR 2026 HDR] Settings Gear Icon */}
        {spec.hasSettings && isWired && (
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="btn btn-link p-2"
            style={{
              color: isSettingsOpen ? activeColor : "#64748b",
              backgroundColor: isSettingsOpen ? "rgba(41, 98, 255, 0.1)" : "transparent",
              border: `1px solid ${isSettingsOpen ? activeColor : 'transparent'}`,
              borderRadius: "6px",
              transition: "all 0.2s ease"
            }}
            title="Paramètres de l'indicateur"
          >
            <i className="bi bi-gear-fill"></i>
          </button>
        )}
      </div>

      {/* [TENOR 2026 HDR] Inline Settings Panel */}
      {isSettingsOpen && children}

      <div className="gp-composite-indicator-children">
        {items.map((item) => (
          <span className="gp-composite-indicator-child" key={item.key}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#475569", marginRight: "8px" }}></span>
            <span style={{ color: "#cbd5e1", marginRight: "6px" }}>{item.name}</span>
            <small style={{ color: "#64748b", fontSize: "11px" }}>{item.desc}</small>
          </span>
        ))}
        {spec.missingOutputs?.map((item) => (
          <span className="gp-composite-indicator-child is-missing" key={item.key}>
            <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#334155", marginRight: "8px" }}></span>
            <span style={{ marginRight: "6px" }}>{item.name}</span>
            <small style={{ fontSize: "11px" }}>{item.desc}</small>
          </span>
        ))}
      </div>
    </div>
  );
});
CompositeIndicatorCard.displayName = "CompositeIndicatorCard";

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  const advancedIndicators = useSelector(selectAdvancedIndicators, shallowEqual);
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const chartIndicators = chartConfig.indicators;
  const advancedMovingAverages = useMemo<AdvancedMovingAverageActivationState>(() => ({
    activeWma: chartIndicators.activeWma ?? [],
    activeDema: chartIndicators.activeDema ?? [],
    activeTema: chartIndicators.activeTema ?? [],
    activeHma: chartIndicators.activeHma ?? [],
    activeZlema: chartIndicators.activeZlema ?? [],
    activeAlma: chartIndicators.activeAlma ?? [],
    activeSmma: chartIndicators.activeSmma ?? [],
    activeKama: chartIndicators.activeKama ?? [],
    activeVwma: chartIndicators.activeVwma ?? [],
  }), [
    chartIndicators.activeAlma,
    chartIndicators.activeDema,
    chartIndicators.activeHma,
    chartIndicators.activeKama,
    chartIndicators.activeSmma,
    chartIndicators.activeTema,
    chartIndicators.activeVwma,
    chartIndicators.activeWma,
    chartIndicators.activeZlema
  ]);
  const indicatorPeriods = useSelector(selectIndicatorPeriods, shallowEqual);
  const rawMovingAverageTrendSignals = useSelector((state: RootState) => state.technicalAnalysis.ui.movingAverageTrendSignals, shallowEqual);
  const movingAverageTrendSignals = useMemo(
    () => normalizeMovingAverageTrendSignals(rawMovingAverageTrendSignals),
    [rawMovingAverageTrendSignals],
  );
  const rawPriceVsSmaMetrics = useSelector((state: RootState) => state.technicalAnalysis.ui.priceVsSmaMetrics, shallowEqual);
  const priceVsSmaMetrics = useMemo(
    () => normalizePriceVsSmaMetrics(rawPriceVsSmaMetrics),
    [rawPriceVsSmaMetrics],
  );
  const rawPriceVsEmaMetrics = useSelector((state: RootState) => state.technicalAnalysis.ui.priceVsEmaMetrics, shallowEqual);
  const priceVsEmaMetrics = useMemo(
    () => normalizePriceVsEmaMetrics(rawPriceVsEmaMetrics),
    [rawPriceVsEmaMetrics],
  );
  const currentSymbol = (chartConfig.symbol || "BOAB").trim().toUpperCase();
  const currentChartData = useSelector((state: RootState) => selectMarketData(state)[currentSymbol] ?? []);
  const currentLiveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[currentSymbol] ?? null);

  const [indicatorSearch, setIndicatorSearch] = useState("");
  const deferredSearch = useDeferredValue(indicatorSearch);

  const smaIndicators = useMemo(
    () => buildSelectableSmaDefinitions(indicatorPeriods).map((definition) => ({
      key: definition.id,
      period: definition.period,
      label: definition.label,
      color: definition.color,
    })),
    [indicatorPeriods]
  );

  const emaIndicators = useMemo(
    () => buildSelectableEmaDefinitions().map((definition) => ({
      key: definition.id,
      period: definition.period,
      label: definition.label,
      color: definition.color,
    })),
    []
  );

  const movingAverageTrendSignalResults = useMemo(
    () => calculateMovingAverageTrendSignals(currentChartData, currentLiveSnapshot),
    [currentChartData, currentLiveSnapshot],
  );
  const movingAverageTrendSignalResultById = useMemo(
    () => new Map(movingAverageTrendSignalResults.map((result) => [result.spec.id, result])),
    [movingAverageTrendSignalResults],
  );
  const priceVsSmaMetricResults = useMemo(
    () => calculatePriceVsSmaMetrics(currentChartData, currentLiveSnapshot, chartConfig.timeframe),
    [chartConfig.timeframe, currentChartData, currentLiveSnapshot],
  );
  const priceVsSmaMetricResultById = useMemo(
    () => new Map(priceVsSmaMetricResults.map((result) => [result.spec.id, result])),
    [priceVsSmaMetricResults],
  );
  const priceVsEmaMetricResults = useMemo(
    () => calculatePriceVsEmaMetrics(currentChartData, currentLiveSnapshot, chartConfig.timeframe),
    [chartConfig.timeframe, currentChartData, currentLiveSnapshot],
  );
  const priceVsEmaMetricResultById = useMemo(
    () => new Map(priceVsEmaMetricResults.map((result) => [result.spec.id, result])),
    [priceVsEmaMetricResults],
  );

  const backendIndicatorGroups = useMemo<BackendIndicatorGroup[]>(() => [
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
            { key: "rsi_9", name: "RSI 9", desc: "Court terme", wiredId: "rsi_9" as any },
            { key: "rsi_14", name: "RSI 14", desc: "Standard", wiredId: "rsi_14" as any },
            { key: "rsi_25", name: "RSI 25", desc: "Lissé / long terme", wiredId: "rsi_25" as any },
          ],
        },
        {
          title: "Stochastic",
          rowGrouping: "name-prefix",
          items: [
            { key: "stoch_k", name: "Stoch %K", desc: "Stochastic oscillator", wiredId: "stochastic" },
            { key: "stoch_d", name: "Stoch %D", desc: "Signal stochastic" },
            { key: "stoch_rsi_k", name: "Stoch RSI %K", desc: "RSI stochastique" },
            { key: "stoch_rsi_d", name: "Stoch RSI %D", desc: "Signal Stoch RSI" },
          ],
        },
        {
          title: "Momentum prix",
          items: [
            { key: "cci_14", name: "CCI 14", desc: "Plus réactif · HLC3", wiredId: "cci14" },
            { key: "cci_20", name: "CCI 20", desc: "Plus lissé · HLC3", wiredId: "cci20" },
          ],
        },
        {
          title: "Momentum prix + volume",
          items: [
            { key: "mfi_14", name: "MFI 14", desc: "Pression achat/vente · Volume", wiredId: "mfi14" },
          ],
        },
        {
          title: "Oscillateur borné",
          items: [
            { key: "williams_r_14", name: "Williams %R 14", desc: "Surachat / survente · 0 à -100", wiredId: "williamsR14" },
          ],
        },
        {
          title: "Variation en pourcentage",
          items: [
            { key: "roc_10", name: "ROC 10", desc: "Variation court terme en %", wiredId: "roc10" },
            { key: "roc_20", name: "ROC 20", desc: "Variation longue en %", wiredId: "roc20" },
          ],
        },
        {
          title: "Momentum brut",
          items: [
            { key: "momentum_10", name: "Momentum 10", desc: "Close - Close[10]", wiredId: "momentum10" },
            { key: "momentum_20", name: "Momentum 20", desc: "Close - Close[20]", wiredId: "momentum20" },
          ],
        },
        {
          title: "Momentum pur",
          rowGrouping: "name-prefix",
          items: [
            { key: "cmo_14", name: "CMO 14", desc: "Chande · -100 à +100", wiredId: "cmo14" },
            { key: "dymi", name: "DYMI", desc: "RSI dynamique · Volatilité", wiredId: "dymi" },
            { key: "ultimate_osc", name: "Ultimate Osc", desc: "Pression achat 7 / 14 / 28", wiredId: "ultimateOsc" },
          ],
        },
        {
          title: "Cycle / Detrending",
          items: [
            { key: "dpo_20", name: "DPO 20", desc: "Cycle détrendé · shift -11", wiredId: "dpo20" },
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
            { key: "awesome_osc", name: "Awesome Osc", desc: "SMA5(HL2) - SMA34(HL2)", wiredId: "awesomeOsc" },
            { key: "ac_osc", name: "AC Osc", desc: "AO - SMA5(AO)", wiredId: "acOsc" },
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
            { key: "coppock_curve", name: "Coppock", desc: "WMA10(ROC11 + ROC14)", wiredId: "coppock" },
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
            { key: "macd_line", name: "MACD Line", desc: "EMA12 - EMA26", wiredId: "macd" },
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
            { key: "macd_apo", name: "APO", desc: "MACD Line absolue", wiredId: "apo" },
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
            { key: "aroon_oscillator", name: "Aroon Osc", desc: "Aroon Up - Aroon Down", wiredId: "aroonOsc" },
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
            { key: "trix", name: "TRIX", desc: "Triple EMA ROC %", wiredId: "trix" },
            { key: "stc", name: "STC", desc: "Schaff Trend Cycle", wiredId: "stc" },
            { key: "mass_index", name: "Mass Index", desc: "Range expansion", wiredId: "massIndex" },
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
            { key: "linear_reg_value", name: "LinReg Value", desc: "Valeur regression" },
            { key: "linear_reg_slope", name: "LinReg Slope", desc: "Pente regression" },
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
            { key: "bb_upper", name: "BB Upper", desc: "Bollinger supérieure", wiredId: "bollinger" },
            { key: "bb_middle", name: "BB Middle", desc: "Bollinger médiane" },
            { key: "bb_lower", name: "BB Lower", desc: "Bollinger inférieure" },
            // [TENOR 2026 HDR] Separated derived oscillators
            { key: "bb_width", name: "BB Width", desc: "Largeur des bandes", wiredId: "bbWidth" },
            { key: "bb_pct", name: "BB %B", desc: "Position dans les bandes", wiredId: "bbPercentB" },
          ],
        },
        {
          title: "ATR",
          rowGrouping: "name-prefix",
          items: [
            { key: "atr_14", name: "ATR 14", desc: "Average True Range", wiredId: "atr" },
            { key: "atr_20", name: "ATR 20", desc: "ATR période 20" },
            { key: "natr_14", name: "NATR 14", desc: "ATR normalisé" },
          ],
        },
        {
          title: "Canaux de prix",
          rowGrouping: "name-prefix",
          items: [
            { key: "donchian_upper", name: "Donchian Upper", desc: "Canal de Donchian haut" },
            { key: "donchian_middle", name: "Donchian Middle", desc: "Canal de Donchian median" },
            { key: "donchian_lower", name: "Donchian Lower", desc: "Canal de Donchian bas" },
            { key: "keltner_upper", name: "Keltner Upper", desc: "Canal de Keltner haut" },
            { key: "keltner_lower", name: "Keltner Lower", desc: "Canal de Keltner bas" },
          ],
        },
        {
          title: "Historical Volatility",
          rowGrouping: "name-prefix",
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
          title: "Dispersion du prix",
          items: [
            { key: "std_dev_20", name: "Std Dev 20", desc: "Dispersion sur 20 périodes" },
          ],
        },
        {
          title: "Expansion de volatilité",
          items: [
            { key: "chaikin_vol", name: "Chaikin Volatility", desc: "Expansion / contraction High-Low" },
          ],
        },
        {
          title: "Risque de drawdown",
          items: [
            { key: "ulcer_index", name: "Ulcer Index", desc: "Profondeur et durée des replis" },
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
            { key: "obv", name: "OBV", desc: "On Balance Volume", wiredId: "obv" },
            { key: "ad_line", name: "A/D Line", desc: "Accumulation/Distribution" },
          ],
        },
        {
          title: "Pression volume-prix",
          items: [
            { key: "cmf_20", name: "CMF 20", desc: "Chaikin Money Flow" },
          ],
        },
        {
          title: "Indices de volume",
          rowGrouping: "name-prefix",
          items: [
            { key: "nvi", name: "NVI", desc: "Negative Volume Index" },
            { key: "pvi", name: "PVI", desc: "Positive Volume Index" },
          ],
        },
        {
          title: "Flux accumulation / distribution",
          items: [
            { key: "chaikin_osc", name: "Chaikin Oscillator", desc: "Dynamique A/D autour de zéro" },
          ],
        },
        {
          title: "Variation du volume",
          items: [
            { key: "volume_osc", name: "Volume Oscillator", desc: "Écart entre moyennes de volume" },
            { key: "vroc_14", name: "VROC 14", desc: "Volume Rate of Change" },
          ],
        },
        {
          title: "Klinger Volume Oscillator",
          rowGrouping: "name-prefix",
          items: [
            { key: "klinger_osc", name: "Klinger Osc", desc: "Klinger oscillator" },
            { key: "klinger_signal", name: "Klinger Signal", desc: "Signal Klinger" },
          ],
        },
        {
          title: "Force du mouvement",
          rowGrouping: "name-prefix",
          items: [
            { key: "force_index_13", name: "Force Index 13", desc: "Puissance prix-volume" },
            { key: "elder_force_index", name: "Elder Force", desc: "Elder Force Index" },
          ],
        },
        {
          title: "Facilité du mouvement",
          items: [
            { key: "eom_14", name: "EOM 14", desc: "Ease of Movement" },
          ],
        },
        {
          title: "Volume Profile",
          rowGrouping: "name-prefix",
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
          title: "Pivot Points Standard",
          rowGrouping: "name-prefix",
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
          title: "Pivot Points Fibonacci",
          rowGrouping: "name-prefix",
          items: [
            { key: "pivot_standard", name: "Pivot", desc: "Pivot central commun" },
            { key: "pivot_fib_r1", name: "Fib R1", desc: "Résistance Fibonacci 1" },
            { key: "pivot_fib_r2", name: "Fib R2", desc: "Résistance Fibonacci 2" },
            { key: "pivot_fib_s1", name: "Fib S1", desc: "Support Fibonacci 1" },
            { key: "pivot_fib_s2", name: "Fib S2", desc: "Support Fibonacci 2" },
          ],
        },
        {
          title: "Croisements de moyennes",
          rowGrouping: "name-prefix",
          items: [
            { key: "golden_cross", name: "Golden Cross", desc: "Croisement haussier" },
            { key: "death_cross", name: "Death Cross", desc: "Croisement baissier" },
          ],
        },
        {
          title: "Position intraday / volume",
          items: [
            { key: "is_above_vwap", name: "Prix > VWAP", desc: "État au-dessus VWAP" },
          ],
        },
        {
          title: "Niveaux 52 semaines",
          rowGrouping: "name-prefix",
          items: [
            { key: "is_52w_high", name: "52W High", desc: "Plus haut 52 semaines" },
            { key: "is_52w_low", name: "52W Low", desc: "Plus bas 52 semaines" },
          ],
        },
        {
          title: "Records historiques",
          rowGrouping: "name-prefix",
          items: [
            { key: "is_ath", name: "ATH", desc: "Plus haut historique" },
            { key: "is_atl", name: "ATL", desc: "Plus bas historique" },
          ],
        },
        {
          title: "Cassures techniques",
          rowGrouping: "name-prefix",
          items: [
            { key: "breakout_resistance", name: "Breakout résistance", desc: "Cassure de résistance" },
            { key: "breakdown_support", name: "Breakdown support", desc: "Cassure de support" },
          ],
        },
        {
          title: "Gaps",
          rowGrouping: "name-prefix",
          items: [
            { key: "gap_up", name: "Gap Up", desc: "Marqueur de gap haussier" },
            { key: "gap_down", name: "Gap Down", desc: "Marqueur de gap baissier" },
            { key: "gap_pct", name: "Gap %", desc: "Amplitude du gap en métrique" },
          ],
        },
        {
          title: "Séquences directionnelles",
          rowGrouping: "name-prefix",
          items: [
            { key: "consecutive_up_days", name: "Jours hausse", desc: "Compteur de hausses consécutives" },
            { key: "consecutive_down_days", name: "Jours baisse", desc: "Compteur de baisses consécutives" },
          ],
        },
        {
          title: "Structure de barres",
          rowGrouping: "name-prefix",
          items: [
            { key: "inside_bar", name: "Inside Bar", desc: "Bougie contenue dans le range précédent" },
            { key: "outside_bar", name: "Outside Bar", desc: "Bougie englobant le range précédent" },
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
            { key: "pattern_doji", name: "Doji", desc: "Indécision générale" },
            { key: "pattern_doji_longleg", name: "Long-legged Doji", desc: "Doji à longues mèches" },
            { key: "pattern_rickshaw_man", name: "Rickshaw Man", desc: "Forte indécision avec longues mèches" },
          ],
        },
        {
          title: "Doji directionnels",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_doji_dragonfly", name: "Dragonfly Doji", desc: "Rejet bas potentiel" },
            { key: "pattern_doji_gravestone", name: "Gravestone Doji", desc: "Rejet haut potentiel" },
          ],
        },
        {
          title: "Structure rare",
          items: [
            { key: "pattern_tristar", name: "Tristar", desc: "Structure rare de retournement potentiel" },
          ],
        },
        {
          title: "Rejets bas",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_hammer", name: "Hammer", desc: "Rejet bas après baisse potentielle" },
            { key: "pattern_hanging_man", name: "Hanging Man", desc: "Rejet bas après hausse potentielle" },
            { key: "pattern_takuri", name: "Takuri", desc: "Rejet bas marqué" },
          ],
        },
        {
          title: "Rejets hauts",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_inv_hammer", name: "Inverted Hammer", desc: "Rejet haut après baisse potentielle" },
            { key: "pattern_shooting_star", name: "Shooting Star", desc: "Rejet haut après hausse potentielle" },
          ],
        },
        {
          title: "Bougies de force",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_marubozu_bull", name: "Marubozu Bull", desc: "Domination acheteuse" },
            { key: "pattern_marubozu_bear", name: "Marubozu Bear", desc: "Domination vendeuse" },
          ],
        },
        {
          title: "Indécision",
          items: [
            { key: "pattern_spinning_top", name: "Spinning Top", desc: "Petit corps avec mèches" },
          ],
        },
        {
          title: "Engulfing",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_engulfing_bull", name: "Engulfing Bullish", desc: "Englobante haussière" },
            { key: "pattern_engulfing_bear", name: "Engulfing Bearish", desc: "Englobante baissière" },
          ],
        },
        {
          title: "Harami",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_harami_bull", name: "Harami Bullish", desc: "Harami haussier" },
            { key: "pattern_harami_bear", name: "Harami Bearish", desc: "Harami baissier" },
          ],
        },
        {
          title: "Tweezer",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_tweezer_top", name: "Tweezer Top", desc: "Rejet haut sur même niveau" },
            { key: "pattern_tweezer_bottom", name: "Tweezer Bottom", desc: "Rejet bas sur même niveau" },
          ],
        },
        {
          title: "Retournements classiques",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_piercing_line", name: "Piercing Line", desc: "Retournement haussier potentiel" },
            { key: "pattern_dark_cloud_cover", name: "Dark Cloud Cover", desc: "Retournement baissier potentiel" },
          ],
        },
        {
          title: "Continuation / gap",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_tasuki_gap", name: "Tasuki Gap", desc: "Continuation autour d'un gap" },
            { key: "pattern_separating_lines", name: "Separating Lines", desc: "Continuation directionnelle" },
            { key: "pattern_thrusting", name: "Thrusting", desc: "Hésitation ou continuation baissière" },
          ],
        },
        {
          title: "Confrontation acheteurs vendeurs",
          items: [
            { key: "pattern_counterattack", name: "Counterattack", desc: "Opposition forte acheteurs / vendeurs" },
          ],
        },
        {
          title: "Retournements en étoile",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_morning_star", name: "Morning Star", desc: "Retournement haussier potentiel" },
            { key: "pattern_evening_star", name: "Evening Star", desc: "Retournement baissier potentiel" },
          ],
        },
        {
          title: "Impulsion directionnelle",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_3_white_soldiers", name: "Three White Soldiers", desc: "Séquence haussière forte" },
            { key: "pattern_3_black_crows", name: "Three Black Crows", desc: "Séquence baissière forte" },
          ],
        },
        {
          title: "Three Inside",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_3_inside_up", name: "Three Inside Up", desc: "Confirmation haussière après Harami" },
            { key: "pattern_3_inside_down", name: "Three Inside Down", desc: "Confirmation baissière après Harami" },
          ],
        },
        {
          title: "Patterns rares avancés",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_unique_3_river", name: "Unique Three River", desc: "Retournement haussier rare" },
            { key: "pattern_upside_gap_two_crows", name: "Upside Gap Two Crows", desc: "Retournement baissier rare" },
          ],
        },
        {
          title: "Retournements directionnels",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_kicker_bull", name: "Kicker Bull", desc: "Retournement haussier impulsif" },
            { key: "pattern_kicker_bear", name: "Kicker Bear", desc: "Retournement baissier impulsif" },
            { key: "pattern_abandoned_baby_bull", name: "Abandoned Baby Bull", desc: "Retournement haussier rare" },
            { key: "pattern_abandoned_baby_bear", name: "Abandoned Baby Bear", desc: "Retournement baissier rare" },
            { key: "pattern_belthold_bull", name: "Belt Hold Bull", desc: "Pression acheteuse directionnelle" },
            { key: "pattern_belthold_bear", name: "Belt Hold Bear", desc: "Pression vendeuse directionnelle" },
            { key: "pattern_breakaway_bull", name: "Breakaway Bull", desc: "Rupture haussière de retournement" },
            { key: "pattern_breakaway_bear", name: "Breakaway Bear", desc: "Rupture baissière de retournement" },
          ],
        },
        {
          title: "Continuation",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_rising_three_methods", name: "Rising Three Methods", desc: "Continuation haussière" },
            { key: "pattern_falling_three_methods", name: "Falling Three Methods", desc: "Continuation baissière" },
            { key: "pattern_mat_hold", name: "Mat Hold", desc: "Continuation après consolidation" },
          ],
        },
        {
          title: "Gap / structure avancée",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_gap_side_side_white", name: "Gap Side-by-Side White", desc: "Structure de gap avancée" },
            { key: "pattern_hikkake", name: "Hikkake", desc: "Fausse cassure de range" },
            { key: "pattern_concealing_baby_swallow", name: "Concealing Baby Swallow", desc: "Structure baissière avancée" },
          ],
        },
        {
          title: "Retournements rares",
          rowGrouping: "name-prefix",
          items: [
            { key: "pattern_ladder_bottom", name: "Ladder Bottom", desc: "Retournement haussier rare" },
            { key: "pattern_stick_sandwich", name: "Stick Sandwich", desc: "Retournement rare autour d'un niveau" },
          ],
        },
      ],
    },
  ], []);

  const indicatorSearchTerm = deferredSearch.trim().toLowerCase();
  const hasIndicatorSearch = indicatorSearchTerm.length > 0;

  const matchesIndicatorSearch = useCallback((...values: Array<string | number | undefined>) =>
    !hasIndicatorSearch || values.some((value) => String(value ?? "").toLowerCase().includes(indicatorSearchTerm)),
    [hasIndicatorSearch, indicatorSearchTerm]
  );

  const filteredSmaIndicators = useMemo(
    () => smaIndicators.filter(({ key, period, label }) =>
      matchesIndicatorSearch(key, period, label, "sma", "simple moving average", "moyenne mobile simple")
    ),
    [matchesIndicatorSearch, smaIndicators]
  );

  const filteredEmaIndicators = useMemo(
    () => emaIndicators.filter(({ key, period, label }) =>
      matchesIndicatorSearch(key, period, label, "ema", "exponential moving average", "moyenne mobile exponentielle")
    ),
    [emaIndicators, matchesIndicatorSearch]
  );

  const filteredMovingAverageTrendIndicators = useMemo(
    () => MOVING_AVERAGE_TREND_SIGNAL_SPECS.filter((item) =>
      matchesIndicatorSearch(
        item.id,
        item.label,
        item.horizon,
        item.description,
        item.interpretation,
        "tendance moyenne mobile",
        "prix au-dessus moyenne mobile",
        "sma",
        "ema"
      )
    ),
    [matchesIndicatorSearch]
  );

  const filteredBackendIndicatorGroups = useMemo(
    () => backendIndicatorGroups
      .map((group) => {
        const groupMatches = matchesIndicatorSearch(group.title, group.subtitle);
        const sections = group.sections
          .map((section) => {
            const sectionMatches = groupMatches || matchesIndicatorSearch(section.title);
            const items = sectionMatches ? section.items : section.items.filter((item) =>
              matchesIndicatorSearch(item.key, item.name, item.desc, group.title, group.subtitle, section.title)
            );
            return { ...section, items };
          })
          .filter((section) => section.items.length > 0);
        return { ...group, sections };
      })
      .filter((group) => group.sections.length > 0),
    [backendIndicatorGroups, matchesIndicatorSearch]
  );

  const visibleMovingAverageCount = filteredSmaIndicators.length + filteredEmaIndicators.length + filteredMovingAverageTrendIndicators.length;
  const visibleBackendIndicatorCount = useMemo(
    () => filteredBackendIndicatorGroups.reduce(
      (groupTotal, group) => groupTotal + group.sections.reduce((sectionTotal, section) => sectionTotal + section.items.length, 0),
      0
    ),
    [filteredBackendIndicatorGroups]
  );

  const visibleIndicatorCount = visibleMovingAverageCount + visibleBackendIndicatorCount;
  const hasVisibleMovingAverages = visibleMovingAverageCount > 0;
  const hasVisibleIndicators = visibleIndicatorCount > 0;
  const activeTrendSignalCount = MOVING_AVERAGE_TREND_SIGNAL_SPECS.filter(
    (spec) => movingAverageTrendSignals.active[spec.id]
  ).length;
  const areAllTrendSignalsActive = activeTrendSignalCount === MOVING_AVERAGE_TREND_SIGNAL_SPECS.length;

  // --- HANDLERS ---
  const handleToggleMA = useCallback((type: "sma" | "ema", period: number) => {
    const activeArray = type === "sma" ? chartIndicators.activeSma : chartIndicators.activeEma;
    const safeArray = activeArray || [];
    const newArray = safeArray.includes(period) ? safeArray.filter((p) => p !== period) : [...safeArray, period];
    const normalizedArray = normalizeMovingAveragePeriods(newArray);

    dispatch(
      setChartConfig({
        indicators: {
          ...chartIndicators,
          [type === "sma" ? "activeSma" : "activeEma"]: normalizedArray,
          [type]: normalizedArray.length > 0 ? true : chartIndicators[type],
        },
      })
    );
  }, [chartIndicators, dispatch]);

  const handleToggleMovingAverageTrendSignal = useCallback((id: MovingAverageTrendSignalId, active: boolean) => {
    dispatch(setMovingAverageTrendSignal({ id, active }));
    if (active || !movingAverageTrendSignals.showSourceAverages) return;

    const hasRemainingActiveSignal = MOVING_AVERAGE_TREND_SIGNAL_SPECS.some(
      (spec) => spec.id !== id && movingAverageTrendSignals.active[spec.id],
    );
    if (!hasRemainingActiveSignal) dispatch(setMovingAverageTrendSignalSourceAverages(false));
  }, [dispatch, movingAverageTrendSignals.active, movingAverageTrendSignals.showSourceAverages]);

  const handleToggleAllMovingAverageTrendSignals = useCallback(() => {
    const shouldActivate = MOVING_AVERAGE_TREND_SIGNAL_SPECS.some((spec) => !movingAverageTrendSignals.active[spec.id]);
    const patch = MOVING_AVERAGE_TREND_SIGNAL_SPECS.reduce<Partial<Record<MovingAverageTrendSignalId, boolean>>>(
      (acc, spec) => {
        acc[spec.id] = shouldActivate;
        return acc;
      },
      {},
    );

    dispatch(setMovingAverageTrendSignals(patch));
    if (!shouldActivate) dispatch(setMovingAverageTrendSignalSourceAverages(false));
  }, [dispatch, movingAverageTrendSignals.active]);

  const handleToggleTrendSignalSourceLines = useCallback((checked: boolean) => {
    if (checked && activeTrendSignalCount === 0) {
      const patch = MOVING_AVERAGE_TREND_SIGNAL_SPECS.reduce<Partial<Record<MovingAverageTrendSignalId, boolean>>>(
        (acc, spec) => {
          acc[spec.id] = true;
          return acc;
        },
        {},
      );
      dispatch(setMovingAverageTrendSignals(patch));
    }
    dispatch(setMovingAverageTrendSignalSourceAverages(checked));
  }, [activeTrendSignalCount, dispatch]);

  const handleTogglePriceVsSmaMetric = useCallback((id: PriceVsSmaMetricId, active: boolean) => {
    dispatch(setPriceVsSmaMetric({ id, active }));
  }, [dispatch]);

  const handleTogglePriceVsEmaMetric = useCallback((id: PriceVsEmaMetricId, active: boolean) => {
    dispatch(setPriceVsEmaMetric({ id, active }));
  }, [dispatch]);

  const handleToggleAdvancedMovingAverage = useCallback((id: AdvancedMovingAverageId, active: boolean) => {
    const next = toggleAdvancedMovingAverage(advancedMovingAverages, id, active);
    dispatch(setChartConfig({
      indicators: {
        ...chartIndicators,
        activeWma: next.activeWma,
        activeDema: next.activeDema,
        activeTema: next.activeTema,
        activeHma: next.activeHma,
        activeZlema: next.activeZlema,
        activeAlma: next.activeAlma,
        activeSmma: next.activeSmma,
        activeKama: next.activeKama,
        activeVwma: next.activeVwma,
      },
    }));
  }, [advancedMovingAverages, chartIndicators, dispatch]);

  const warnBottomIndicatorLimit = useCallback(() => {
    addNotification({
      title: "Limite d'indicateurs atteinte",
      message: `Maximum ${MAX_BOTTOM_INDICATORS} indicateurs sous le volume. Retirez un indicateur existant avant d'en ajouter un autre.`,
      type: "warning",
      iconType: "faExclamationTriangle",
      duration: 4500,
    });
  }, [addNotification]);

  const canActivateBottomIndicator = useCallback((id: string) => {
    const normalizedId = id.startsWith("rsi_") ? "rsi" : id;
    if (!isBottomPanelIndicatorKey(normalizedId)) return true;

    if (advancedIndicators[normalizedId]) return true;
    if (isCciMomentumKey(normalizedId) && hasActiveCciMomentumPanel(advancedIndicators)) return true;
    if (isWilliamsRKey(normalizedId) && hasActiveWilliamsRPanel(advancedIndicators)) return true;
    if (isRocMomentumKey(normalizedId) && hasActiveRocMomentumPanel(advancedIndicators)) return true;
    if (isRawMomentumKey(normalizedId) && hasActiveRawMomentumPanel(advancedIndicators)) return true;
    const canActivate = countActiveBottomIndicators(advancedIndicators) < MAX_BOTTOM_INDICATORS;
    if (!canActivate) warnBottomIndicatorLimit();
    return canActivate;
  }, [advancedIndicators, warnBottomIndicatorLimit]);

  // [TENOR 2026 SRE] RSI MULTI-PERIOD ROUTING
  const handleToggleAdvanced = useCallback((id: string) => {
    if (id === "rsi_9") {
      if (advancedIndicators.rsi && indicatorPeriods.rsiPeriod === 9) {
        dispatch(setAdvancedIndicators({ rsi: false }));
      } else {
        if (!canActivateBottomIndicator(id)) {
          return false;
        }
        dispatch(setIndicatorPeriods({ rsiPeriod: 9 }));
        dispatch(setAdvancedIndicators({ rsi: true }));
      }
      return true;
    }
    if (id === "rsi_14") {
      if (advancedIndicators.rsi && indicatorPeriods.rsiPeriod === 14) {
        dispatch(setAdvancedIndicators({ rsi: false }));
      } else {
        if (!canActivateBottomIndicator(id)) {
          return false;
        }
        dispatch(setIndicatorPeriods({ rsiPeriod: 14 }));
        dispatch(setAdvancedIndicators({ rsi: true }));
      }
      return true;
    }
    if (id === "rsi_25") {
      if (advancedIndicators.rsi && indicatorPeriods.rsiPeriod === 25) {
        dispatch(setAdvancedIndicators({ rsi: false }));
      } else {
        if (!canActivateBottomIndicator(id)) {
          return false;
        }
        dispatch(setIndicatorPeriods({ rsiPeriod: 25 }));
        dispatch(setAdvancedIndicators({ rsi: true }));
      }
      return true;
    }
    if (id === "cci20") {
      if (advancedIndicators.cci20 || advancedIndicators.cci) {
        dispatch(setAdvancedIndicators({ cci: false, cci20: false }));
      } else {
        if (!canActivateBottomIndicator(id)) {
          return false;
        }
        dispatch(setAdvancedIndicators({ cci: false, cci20: true }));
      }
      return true;
    }
    if (id === "williamsR14") {
      if (advancedIndicators.williamsR14 || advancedIndicators.williamsR) {
        dispatch(setAdvancedIndicators({ williamsR: false, williamsR14: false }));
      } else {
        if (!canActivateBottomIndicator(id)) {
          return false;
        }
        dispatch(setAdvancedIndicators({ williamsR: false, williamsR14: true }));
      }
      return true;
    }
    if (id === "roc10") {
      if (advancedIndicators.roc10 || advancedIndicators.roc) {
        dispatch(setAdvancedIndicators({ roc: false, roc10: false }));
      } else {
        if (!canActivateBottomIndicator(id)) {
          return false;
        }
        dispatch(setAdvancedIndicators({ roc: false, roc10: true }));
      }
      return true;
    }

    if (!canActivateBottomIndicator(id)) {
      return false;
    }
    dispatch(toggleAdvancedIndicator(id as keyof AdvancedIndicatorsState));
    return true;
  }, [
    advancedIndicators.cci,
    advancedIndicators.cci20,
    advancedIndicators.rsi,
    advancedIndicators.roc,
    advancedIndicators.roc10,
    advancedIndicators.williamsR,
    advancedIndicators.williamsR14,
    canActivateBottomIndicator,
    dispatch,
    indicatorPeriods.rsiPeriod,
  ]);

  const isIndicatorActive = useCallback((id: string) => {
    if (id === "rsi_9") return advancedIndicators.rsi && indicatorPeriods.rsiPeriod === 9;
    if (id === "rsi_14") return advancedIndicators.rsi && indicatorPeriods.rsiPeriod === 14;
    if (id === "rsi_25") return advancedIndicators.rsi && indicatorPeriods.rsiPeriod === 25;
    if (id === "cci20") return advancedIndicators.cci20 || advancedIndicators.cci;
    if (id === "williamsR14") return advancedIndicators.williamsR14 || advancedIndicators.williamsR;
    if (id === "roc10") return advancedIndicators.roc10 || advancedIndicators.roc;

    // [TENOR 2026 FIX] SCAR-DATA-BINDING: Safe dynamic read for injected keys like stochRsi
    return isAdvancedIndicatorKey(id) ? advancedIndicators[id] : false;
  }, [advancedIndicators, indicatorPeriods.rsiPeriod]);

  const getIndicatorSemanticGroup = useCallback((name: string) => {
    const multiWordPrefixes = [
      "Stoch RSI", "MACD", "Parabolic SAR", "Trend Strength", "Aroon", "Supertrend",
      "Vortex", "KST", "LinReg", "BB", "Keltner", "Donchian", "Chaikin", "Klinger",
      "Force Index", "Elder Force", "Volume Osc", "Fib", "Golden Cross", "Death Cross",
      "Gap", "Inside Bar", "Outside Bar", "Doji", "Marubozu", "Engulf", "Harami",
      "Tweezer", "Kicker", "Belthold", "Breakaway", "Abandoned",
    ];
    const matchingPrefix = multiWordPrefixes.find((prefix) => name.startsWith(prefix));
    if (matchingPrefix) {
      return matchingPrefix;
    }
    return name.split(" ")[0] || name;
  }, []);

  const renderIndicatorSectionItems = useCallback((section: BackendIndicatorSection) => {
    if (section.title === "Prix vs SMA") {
      const visibleKeys = new Set(section.items.map((item) => item.key));
      const visibleResults = PRICE_VS_SMA_METRIC_SPECS
        .filter((spec) => visibleKeys.has(spec.id))
        .map((spec) => priceVsSmaMetricResultById.get(spec.id))
        .filter((result): result is PriceVsSmaMetricResult => result !== undefined);

      return (
        <div className="gp-price-vs-sma-section">
          <div className="gp-price-vs-sma-grid">
            {visibleResults.map((result) => (
              <PriceVsSmaMetricCard
                key={result.spec.id}
                result={result}
                isActive={priceVsSmaMetrics.active[result.spec.id]}
                onToggle={handleTogglePriceVsSmaMetric}
              />
            ))}
          </div>
        </div>
      );
    }

    if (section.title === "Prix vs EMA") {
      const visibleKeys = new Set(section.items.map((item) => item.key));
      const visibleResults = PRICE_VS_EMA_METRIC_SPECS
        .filter((spec) => visibleKeys.has(spec.id))
        .map((spec) => priceVsEmaMetricResultById.get(spec.id))
        .filter((result): result is PriceVsEmaMetricResult => result !== undefined);

      return (
        <div className="gp-price-vs-sma-section gp-price-vs-ema-section">
          <div className="gp-price-vs-ema-grid">
            {visibleResults.map((result) => (
              <PriceVsEmaMetricCard
                key={result.spec.id}
                result={result}
                isActive={priceVsEmaMetrics.active[result.spec.id]}
                onToggle={handleTogglePriceVsEmaMetric}
              />
            ))}
          </div>
        </div>
      );
    }

    if (
      section.title === "WMA / DEMA / TEMA" ||
      section.title === "Réduction du retard" ||
      section.title === "Lissage avancé" ||
      section.title === "Adaptative" ||
      section.title === "Pondérée volume"
    ) {
      const visibleKeys = new Set(section.items.map((item) => item.key));
      const visibleSpecs = ADVANCED_MOVING_AVERAGE_SPECS.filter((spec) => visibleKeys.has(spec.id));

      return (
        <div className="gp-advanced-ma-section">
          <div className="gp-advanced-ma-grid">
            {visibleSpecs.map((spec) => (
              <AdvancedMovingAverageCard
                key={spec.id}
                spec={spec}
                isActive={isAdvancedMovingAverageActive(advancedMovingAverages, spec.id)}
                availableBars={currentChartData.length}
                onToggle={handleToggleAdvancedMovingAverage}
              />
            ))}
          </div>
        </div>
      );
    }

    const sectionCompositeSpecs = compositeIndicatorSpecs.filter((spec) =>
      spec.outputKeys.some((key) => section.items.some((item) => item.key === key))
    );

    const compositeOutputKeys = new Set(sectionCompositeSpecs.flatMap((spec) => spec.outputKeys));
    const standaloneItems = section.items.filter((item) => !compositeOutputKeys.has(item.key));

    if (sectionCompositeSpecs.length > 0) {
      return (
        <div className="gp-composite-indicators">
          {sectionCompositeSpecs.map((spec) => (
            <CompositeIndicatorCard
              key={spec.id}
              spec={spec}
              items={section.items.filter((item) => spec.outputKeys.includes(item.key))}
              isActive={!!spec.wiredId && isIndicatorActive(spec.wiredId as string)}
              isWired={!!spec.wiredId}
              canToggle={canActivateBottomIndicator}
              onToggle={handleToggleAdvanced}
            >
              {/* [TENOR 2026 HDR] Inject Bollinger Settings Panel if applicable */}
              {spec.id === "bollinger" && <BollingerSettingsPanel />}
            </CompositeIndicatorCard>
          ))}
          {standaloneItems.length > 0 && (
            <div className="gp-composite-standalone-items">
              {standaloneItems.map((item) => (
                <IndicatorCard
                  key={item.key}
                  ind={item}
                  isActive={!!item.wiredId && isIndicatorActive(item.wiredId as string)}
                  isWired={!!item.wiredId}
                  canToggle={canActivateBottomIndicator}
                  onToggle={handleToggleAdvanced}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (section.rowGrouping !== "name-prefix") {
      return (
        <div className="row row-cols-1 row-cols-md-2 row-cols-xl-3 mx-0">
          {section.items.map((item) => (
            <IndicatorCard
              key={item.key}
              ind={item}
              isActive={!!item.wiredId && isIndicatorActive(item.wiredId as string)}
              isWired={!!item.wiredId}
              canToggle={canActivateBottomIndicator}
              onToggle={handleToggleAdvanced}
            />
          ))}
        </div>
      );
    }

    const groupedItems = section.items.reduce<Array<{ label: string; items: BackendIndicatorItem[] }>>(
      (groups, item) => {
        const label = getIndicatorSemanticGroup(item.name);
        const lastGroup = groups[groups.length - 1];
        if (lastGroup?.label === label) {
          lastGroup.items.push(item);
          return groups;
        }
        groups.push({ label, items: [item] });
        return groups;
      },
      []
    );

    return (
      <div className="gp-indicator-row-groups">
        {groupedItems.map((group) => (
          <div className="gp-indicator-row-group" key={`${section.title}-${group.label}`}>
            {group.items.map((item) => (
              <IndicatorCard
                key={item.key}
                ind={item}
                isActive={!!item.wiredId && isIndicatorActive(item.wiredId as string)}
                isWired={!!item.wiredId}
                canToggle={canActivateBottomIndicator}
                onToggle={handleToggleAdvanced}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }, [
    canActivateBottomIndicator,
    getIndicatorSemanticGroup,
    handleToggleAdvanced,
    handleToggleAdvancedMovingAverage,
    handleTogglePriceVsEmaMetric,
    handleTogglePriceVsSmaMetric,
    isIndicatorActive,
    advancedMovingAverages,
    currentChartData.length,
    priceVsEmaMetricResultById,
    priceVsEmaMetrics.active,
    priceVsSmaMetricResultById,
    priceVsSmaMetrics.active,
  ]);

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
      className="gp-indicators-modal"
      overlayClassName="gp-indicators-modal-overlay"
    >
      {/* [TENOR 2026 SRE] CSS CONTAINMENT FOR NATIVE SCROLL */}
      <div style={{ contain: 'content', transform: 'translateZ(0)', WebkitFontSmoothing: 'antialiased' }}>
        <div className="gp-indicator-search-panel">
          <div className="gp-indicator-search-box">
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              aria-label="Rechercher un indicateur technique"
              className="gp-indicator-search-input"
              onChange={(event) => setIndicatorSearch(event.target.value)}
              placeholder="Rechercher RSI, EMA 20, Ichimoku, Doji..."
              type="search"
              value={indicatorSearch}
            />
            {hasIndicatorSearch && (
              <button
                aria-label="Effacer la recherche"
                className="gp-indicator-search-clear"
                onClick={() => setIndicatorSearch("")}
                type="button"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            )}
          </div>
          <div className="gp-indicator-search-meta" aria-live="polite">
            <span style={{ color: "#2962ff", fontWeight: 700, textTransform: "uppercase", fontSize: "11px" }}>
              {hasIndicatorSearch ? `${visibleIndicatorCount} résultats` : `${visibleIndicatorCount} indicateurs disponibles`}
            </span>
            {hasIndicatorSearch && <span style={{ color: "#ff9800", fontSize: "11px" }}>Filtre actif</span>}
          </div>
        </div>

        {/* --- SECTION 1: MOYENNES MOBILES --- */}
        {hasVisibleMovingAverages && (
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3 px-1">
              <div style={{ width: "3px", height: "16px", background: "linear-gradient(180deg, #ff9800, #ff5252)", borderRadius: "2px", marginRight: "8px" }} />
              <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
                Moyennes Mobiles
              </small>
            </div>
            <div className="gp-ma-groups">
              {filteredSmaIndicators.length > 0 && (
                <div className="gp-ma-group gp-ma-group-sma">
                  <div className="gp-ma-group-header" style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between" }}>
                    <span className="gp-ma-group-kicker" style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>Simple Moving Average</span>
                    <strong style={{ color: "#f8fafc", fontSize: "12px" }}>SMA</strong>
                  </div>
                  <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 mx-0 mt-2">
                    {filteredSmaIndicators.map(({ key, period, label, color }) => (
                      <MACard
                        key={key}
                        type="sma"
                        period={period}
                        label={label}
                        color={color}
                        isActive={(chartIndicators.activeSma || []).includes(period)}
                        onToggle={handleToggleMA}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredEmaIndicators.length > 0 && (
                <div className="gp-ma-group gp-ma-group-ema mt-3">
                  <div className="gp-ma-group-header" style={{ padding: "8px 12px", borderBottom: "1px solid #1e293b", display: "flex", justifyContent: "space-between" }}>
                    <span className="gp-ma-group-kicker" style={{ color: "#94a3b8", fontSize: "11px", textTransform: "uppercase" }}>Exponential Moving Average</span>
                    <strong style={{ color: "#f8fafc", fontSize: "12px" }}>EMA</strong>
                  </div>
                  <div className="row row-cols-1 row-cols-sm-2 mx-0 mt-2">
                    {filteredEmaIndicators.map(({ key, period, label, color }) => (
                      <MACard
                        key={key}
                        type="ema"
                        period={period}
                        label={label}
                        color={color}
                        isActive={(chartIndicators.activeEma || []).includes(period)}
                        onToggle={handleToggleMA}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredMovingAverageTrendIndicators.length > 0 && (
                <div className="gp-ma-group gp-ma-group-trend mt-3">
                  <div className="gp-ma-trend-header">
                    <span className="gp-ma-group-kicker">Tendance moyenne mobile</span>
                    <strong>Signaux</strong>
                  </div>
                  <div className={`gp-composite-indicator gp-ma-trend-composite ${areAllTrendSignalsActive ? "active" : ""}`}>
                    <div className="gp-ma-trend-parent-row">
                      <div className="gp-composite-indicator-parent gp-ma-trend-parent">
                        <span className="gp-composite-indicator-check gp-ma-trend-parent-check" aria-hidden="true">
                          {areAllTrendSignalsActive && <Check size={13} strokeWidth={3.4} />}
                        </span>
                        <span className="gp-composite-indicator-copy gp-ma-trend-parent-copy">
                          <strong>Prix vs Moyennes</strong>
                          <small>État du prix par rapport aux moyennes de référence de la timeframe courante.</small>
                        </span>
                      </div>
                      <button
                        className={`gp-ma-trend-bulk-btn ${areAllTrendSignalsActive ? "is-active" : ""}`}
                        onClick={handleToggleAllMovingAverageTrendSignals}
                        type="button"
                      >
                        {areAllTrendSignalsActive ? "Tout désactiver" : "Tout activer"}
                      </button>
                    </div>
                    <div className="gp-ma-trend-children">
                      {filteredMovingAverageTrendIndicators.map((spec) => {
                        const result = movingAverageTrendSignalResultById.get(spec.id);
                        if (!result) return null;

                        return (
                          <MovingAverageTrendSignalCard
                            key={spec.id}
                            result={result}
                            isActive={movingAverageTrendSignals.active[spec.id]}
                            sourceLinesEnabled={movingAverageTrendSignals.showSourceAverages}
                            onToggle={handleToggleMovingAverageTrendSignal}
                          />
                        );
                      })}
                    </div>
                  </div>
                  <div className="gp-ma-trend-secondary-row">
                    <MovingAverageTrendSourceToggle
                      activeCount={activeTrendSignalCount}
                      checked={movingAverageTrendSignals.showSourceAverages}
                      onToggle={handleToggleTrendSignalSourceLines}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SECTION 2: CATALOGUE BACKEND STRUCTURÉ --- */}
        {filteredBackendIndicatorGroups.length > 0 && (
          <div className="mb-4">
            <div className="d-flex align-items-center mb-3 px-1">
              <div style={{ width: "3px", height: "16px", background: "linear-gradient(180deg, #2962ff, #00bcd4)", borderRadius: "2px", marginRight: "8px" }} />
              <small className="text-secondary fw-semibold" style={{ letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "10px" }}>
                Catalogue Backend
              </small>
            </div>
            <div className="gp-indicator-catalog">
              {filteredBackendIndicatorGroups.map((group) => (
                <section className="gp-indicator-family mb-4" key={group.title}>
                  <div className="gp-indicator-family-header mb-2">
                    <div>
                      <strong style={{ color: "#f8fafc", fontSize: "14px", display: "block" }}>{group.title}</strong>
                      <span style={{ color: "#64748b", fontSize: "11px" }}>{group.subtitle}</span>
                    </div>
                  </div>
                  <div className="gp-indicator-subfamilies">
                    {group.sections.map((section) => (
                      <div className="gp-indicator-subfamily mb-3" data-family={section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")} key={`${group.title}-${section.title}`}>
                        <div className="gp-indicator-subfamily-title mb-2" style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>{section.title}</div>
                        {renderIndicatorSectionItems(section)}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}

        {!hasVisibleIndicators && (
          <div className="gp-indicator-empty-state" style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
            <i className="bi bi-search" aria-hidden="true" style={{ fontSize: "24px", display: "block", marginBottom: "10px" }}></i>
            <strong style={{ display: "block", color: "#cbd5e1" }}>Aucun indicateur trouvé</strong>
            <span style={{ fontSize: "12px" }}>Essaie un nom, une période, une famille ou une clé backend.</span>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

// --- EOF ---
