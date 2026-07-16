// ================================================================================
// FICHIER : components/technical-analysis/components/modals/indicators/IndicatorsModal.tsx
// [TENOR 2026 FIX] SCAR-125: Restored SMA/EMA toggles. Migrated to Smart Component.
// [TENOR 2026 FIX] SCAR-126: Premium UI Overhaul. Fixed overlapping cards.
// [TENOR 2026 SRE] SCAR-UI-FREEZE: Implemented Optimistic UI with Event Loop Yielding (setTimeout).
// [TENOR 2026 SRE] SCAR-SCROLL-JUMPING: Eradicated `content-visibility` hack. Restored pure native scroll.
// [TENOR 2026 FEAT] RSI 9, 14, 25 fully wired and functional per TradingView parity.
// [TENOR 2026 FIX] SCAR-DATA-BINDING: Wired Stochastic RSI to enable UI interaction.
// [TENOR 2026 HDR] BOLLINGER BANDS UPGRADE: Added inline settings panel and separated derived oscillators.
// ================================================================================

import React, { useCallback, useMemo, useState, useDeferredValue, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  shallowEqual,
  useDispatch,
  useSelector } from "react-redux";
import { Check,
  Eye,
  EyeOff } from "lucide-react";
import { BaseModal } from "../../common/primitives/BaseModal";
import { IndicatorBacktestPanel } from "./IndicatorBacktestPanel";
import { useIndicatorBacktestDashboard } from "./useIndicatorBacktestDashboard";
import type { AdvancedIndicatorsState,
  BollingerSettings,
  MovingAverageTrendSignalId,
  PriceVsEmaMetricId,
  PriceVsSmaMetricId } from "../../../config/indicators/advancedIndicatorsTypes";
import {
  getAdvancedIndicatorObjectIds,
  getAdvancedMovingAverageObjectIds,
  getEmaObjectIds,
  getSmaObjectIds,
  type IndicatorObjectId,
  } from "../../../config/object-tree/indicatorObjectVisibility";
import {
  toggleAdvancedIndicator,
  setChartConfig,
  setIndicatorPeriods,
  setAdvancedIndicators,
  setBollingerSettings,
  setMovingAverageTrendSignal,
  setMovingAverageTrendSignals,
  setMovingAverageTrendSignalSourceAverages,
  setPriceVsSmaMetric,
  setPriceVsEmaMetric,
} from "../../../store/technicalAnalysisSlice";
import {
  selectAdvancedIndicators,
  selectChartConfig,
  selectIndicatorPeriods,
  selectBollingerSettings,
  selectMarketData,
  selectMarketSnapshots,
} from "../../../store/selectors";
import type { RootState } from "@/core/infrastructure/store";

import {
  SettingsNumberInput,
  SettingsColorOpacityInput,
  SettingsCheckbox,
  SettingsSelectInput
} from "../../common/inputs/SettingsField";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import {
  MOVING_AVERAGE_TREND_SIGNAL_SPECS,
  buildSelectableEmaDefinitions,
  buildSelectableSmaDefinitions,
  normalizeMovingAverageTrendSignals,
  normalizeMovingAveragePeriods
} from "../../../config/indicators/movingAverageSeries";
import {
  PRICE_VS_SMA_METRIC_SPECS,
  normalizePriceVsSmaMetrics,
} from "../../../config/indicators/priceVsSmaMetrics";
import {
  PRICE_VS_EMA_METRIC_SPECS,
  normalizePriceVsEmaMetrics,
} from "../../../config/indicators/priceVsEmaMetrics";
import {
  ADVANCED_MOVING_AVERAGE_SPECS,
  isAdvancedMovingAverageActive,
  toggleAdvancedMovingAverage,
  type AdvancedMovingAverageActivationState,
  type AdvancedMovingAverageId,
  type AdvancedMovingAverageSpec,
} from "../../../config/indicators/advancedMovingAverageSeries";
import {
  BOTTOM_PANEL_INDICATOR_IDS,
  getAdvancedIndicatorRegistryEntry,
  isAdvancedIndicatorRegistryId,
} from "../../../config/indicators/indicatorRegistry";
import {
  COMPOSITE_INDICATOR_SPECS,
  INDICATOR_MODAL_GROUPS,
  type BackendIndicatorItem,
  type BackendIndicatorSection,
  type CompositeIndicatorSpec,
} from "../../../config/indicators/indicatorModalRegistry";
import {
  calculateMovingAverageTrendSignals,
  type MovingAverageTrendSignalResult,
  type MovingAverageTrendState
} from "../../../lib/Indicators/movingAverageTrendSignals";
import {
  calculatePriceVsSmaMetrics,
  type PriceVsSmaMetricResult,
} from "../../../lib/Indicators/priceVsSmaMetrics";
import {
  calculatePriceVsEmaMetrics,
  type PriceVsEmaMetricResult,
} from "../../../lib/Indicators/priceVsEmaMetrics";

const INDICATOR_SEARCH_INPUT_ID = "technical-analysis-indicator-search";
const EMPTY_CHART_DATA: ReturnType<typeof selectMarketData>[string] = [];

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  advancedIndicators?: AdvancedIndicatorsState;
  onToggle?: (indicator: keyof AdvancedIndicatorsState) => void;
  onRevealObjectIds?: (objectIds: readonly IndicatorObjectId[]) => void;
  initialScrollTop?: number;
  onScrollPositionChange?: (scrollTop: number) => void;
}

const MAX_BOTTOM_INDICATORS = 5;
const BOTTOM_PANEL_INDICATORS = BOTTOM_PANEL_INDICATOR_IDS;

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

const HISTORICAL_VOLATILITY_KEYS = ["hv10", "hv20", "hv30", "hv60", "hv90", "hv252"] as const;

const isHistoricalVolatilityKey = (id: string): id is typeof HISTORICAL_VOLATILITY_KEYS[number] =>
  HISTORICAL_VOLATILITY_KEYS.includes(id as typeof HISTORICAL_VOLATILITY_KEYS[number]);

const hasActiveHistoricalVolatilityPanel = (indicators: AdvancedIndicatorsState): boolean =>
  HISTORICAL_VOLATILITY_KEYS.some((key) => indicators[key]);

const CONSOLIDATED_BOTTOM_PANEL_KEYS = new Set<string>([
  "cci",
  "cci14",
  "cci20",
  "williamsR",
  "williamsR14",
  "roc",
  "roc10",
  "roc20",
  "momentum10",
  "momentum20",
  ...HISTORICAL_VOLATILITY_KEYS,
]);

const getRequestedBottomPanelIndicatorLabel = (id: string): string => {
  if (id.startsWith("rsi_")) return `RSI ${id.slice(4)}`;
  if (isAdvancedIndicatorRegistryId(id)) return getAdvancedIndicatorRegistryEntry(id).label;
  return id;
};

const getActiveBottomPanelLabels = (indicators: AdvancedIndicatorsState): string[] => {
  const labels: string[] = [];

  if (hasActiveCciMomentumPanel(indicators)) labels.push("CCI");
  if (hasActiveWilliamsRPanel(indicators)) labels.push("Williams %R");
  if (hasActiveRocMomentumPanel(indicators)) labels.push("ROC");
  if (hasActiveRawMomentumPanel(indicators)) labels.push("Momentum");
  if (hasActiveHistoricalVolatilityPanel(indicators)) labels.push("Historical Volatility");

  BOTTOM_PANEL_INDICATORS.forEach((key) => {
    if (CONSOLIDATED_BOTTOM_PANEL_KEYS.has(key)) return;
    if (indicators[key]) labels.push(getAdvancedIndicatorRegistryEntry(key).label);
  });

  return labels;
};

const countActiveBottomIndicators = (indicators: AdvancedIndicatorsState) =>
  BOTTOM_PANEL_INDICATORS.reduce((total, key) => {
    if (isCciMomentumKey(key) || isWilliamsRKey(key) || isRocMomentumKey(key) || isRawMomentumKey(key) || isHistoricalVolatilityKey(key)) return total;
    return total + (indicators[key] ? 1 : 0);
  }, (hasActiveCciMomentumPanel(indicators) ? 1 : 0)
    + (hasActiveWilliamsRPanel(indicators) ? 1 : 0)
    + (hasActiveRocMomentumPanel(indicators) ? 1 : 0)
    + (hasActiveRawMomentumPanel(indicators) ? 1 : 0)
    + (hasActiveHistoricalVolatilityPanel(indicators) ? 1 : 0));

const isAdvancedIndicatorKey = isAdvancedIndicatorRegistryId;

const isBottomPanelIndicatorKey = (id: string): id is typeof BOTTOM_PANEL_INDICATORS[number] =>
  BOTTOM_PANEL_INDICATORS.includes(id as typeof BOTTOM_PANEL_INDICATORS[number]);

const normalizeCompositeSectionTitle = (value: string): string =>
  value.trim().toLowerCase();

const getCompositeItemsForSection = (
  spec: CompositeIndicatorSpec,
  section: BackendIndicatorSection,
): BackendIndicatorItem[] =>
  section.items.filter((item) => spec.outputKeys.includes(item.key));

const isCompositeSpecAllowedInSection = (
  spec: CompositeIndicatorSpec,
  section: BackendIndicatorSection,
): boolean => {
  if (
    spec.sectionTitle
    && normalizeCompositeSectionTitle(spec.sectionTitle) !== normalizeCompositeSectionTitle(section.title)
  ) {
    return false;
  }

  const matchedItems = getCompositeItemsForSection(spec, section);
  if (matchedItems.length === 0) return false;
  if (spec.requireCompleteOutputs && matchedItems.length !== spec.outputKeys.length) return false;
  if (!spec.wiredId) return true;

  return matchedItems.every((item) => !item.wiredId || item.wiredId === spec.wiredId);
};

const expandRequiredCompositeSectionItems = (
  section: BackendIndicatorSection,
  visibleItems: BackendIndicatorItem[],
): BackendIndicatorItem[] => {
  if (visibleItems.length === 0 || visibleItems.length === section.items.length) return visibleItems;

  const visibleKeys = new Set(visibleItems.map((item) => item.key));
  COMPOSITE_INDICATOR_SPECS.forEach((spec) => {
    if (!spec.requireCompleteOutputs) return;
    if (
      spec.sectionTitle
      && normalizeCompositeSectionTitle(spec.sectionTitle) !== normalizeCompositeSectionTitle(section.title)
    ) {
      return;
    }
    if (!spec.outputKeys.some((key) => visibleKeys.has(key))) return;
    spec.outputKeys.forEach((key) => visibleKeys.add(key));
  });

  return section.items.filter((item) => visibleKeys.has(item.key));
};

const sanitizeIndicatorInfoId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase() || "indicator";

const getIndicatorInfoPanelId = (scope: string, key: string): string =>
  `indicator-info-${sanitizeIndicatorInfoId(scope)}-${sanitizeIndicatorInfoId(key)}`;

type IndicatorInfoPlacement = "top" | "bottom";

type IndicatorInfoPosition = {
  arrowLeft: number;
  left: number;
  placement: IndicatorInfoPlacement;
  top: number;
  width: number;
};

const INDICATOR_INFO_PANEL_MAX_WIDTH = 320;
const INDICATOR_INFO_PANEL_MIN_WIDTH = 224;
const INDICATOR_INFO_PANEL_MARGIN = 12;
const INDICATOR_INFO_PANEL_GAP = 8;
const INDICATOR_INFO_PANEL_FALLBACK_HEIGHT = 92;

const clampIndicatorInfoValue = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const getIndicatorInfoPosition = (anchor: HTMLElement, panel: HTMLElement | null): IndicatorInfoPosition => {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight || window.innerHeight;
  const availableWidth = Math.max(0, viewportWidth - INDICATOR_INFO_PANEL_MARGIN * 2);
  const width = Math.min(
    Math.max(rect.width, INDICATOR_INFO_PANEL_MIN_WIDTH),
    Math.min(INDICATOR_INFO_PANEL_MAX_WIDTH, availableWidth),
  );
  const height = panel?.offsetHeight || INDICATOR_INFO_PANEL_FALLBACK_HEIGHT;
  const spaceAbove = rect.top - INDICATOR_INFO_PANEL_MARGIN;
  const spaceBelow = viewportHeight - rect.bottom - INDICATOR_INFO_PANEL_MARGIN;
  const placement: IndicatorInfoPlacement =
    spaceBelow >= height + INDICATOR_INFO_PANEL_GAP || spaceBelow >= spaceAbove ? "bottom" : "top";
  const anchorCenterX = rect.left + rect.width / 2;
  const left = clampIndicatorInfoValue(
    anchorCenterX - width / 2,
    INDICATOR_INFO_PANEL_MARGIN,
    Math.max(INDICATOR_INFO_PANEL_MARGIN, viewportWidth - width - INDICATOR_INFO_PANEL_MARGIN),
  );
  const unclampedTop = placement === "bottom"
    ? rect.bottom + INDICATOR_INFO_PANEL_GAP
    : rect.top - height - INDICATOR_INFO_PANEL_GAP;
  const top = clampIndicatorInfoValue(
    unclampedTop,
    INDICATOR_INFO_PANEL_MARGIN,
    Math.max(INDICATOR_INFO_PANEL_MARGIN, viewportHeight - height - INDICATOR_INFO_PANEL_MARGIN),
  );
  const arrowLeft = clampIndicatorInfoValue(anchorCenterX - left, 18, Math.max(18, width - 18));

  return { arrowLeft, left, placement, top, width };
};

const IndicatorHoverInfoPanel = React.memo(({
  anchorRef,
  id,
  title,
  description,
  code,
  contextLabel,
  statusLabel,
  tone = "default",
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  id: string;
  title: string;
  description: string;
  code: string;
  contextLabel?: string;
  statusLabel: string;
  tone?: "default" | "missing";
}) => {
  const panelRef = useRef<HTMLSpanElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<IndicatorInfoPosition | null>(null);

  const clearPendingClose = useCallback(() => {
    if (closeTimeoutRef.current === null) return;
    window.clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = null;
  }, []);

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor || typeof window === "undefined") return;
    setPosition(getIndicatorInfoPosition(anchor, panelRef.current));
  }, [anchorRef]);

  const schedulePositionUpdate = useCallback(() => {
    if (typeof window === "undefined") return;
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      updatePosition();
    });
  }, [updatePosition]);

  const showPanel = useCallback(() => {
    clearPendingClose();
    setIsVisible(true);
    schedulePositionUpdate();
  }, [clearPendingClose, schedulePositionUpdate]);

  const hidePanel = useCallback(() => {
    clearPendingClose();
    closeTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
      setPosition(null);
      closeTimeoutRef.current = null;
    }, 40);
  }, [clearPendingClose]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor || typeof window === "undefined") return undefined;

    const handleFocusOut = (event: FocusEvent) => {
      if (event.relatedTarget instanceof Node && anchor.contains(event.relatedTarget)) return;
      hidePanel();
    };

    anchor.addEventListener("pointerenter", showPanel);
    anchor.addEventListener("pointerleave", hidePanel);
    anchor.addEventListener("focusin", showPanel);
    anchor.addEventListener("focusout", handleFocusOut);

    return () => {
      anchor.removeEventListener("pointerenter", showPanel);
      anchor.removeEventListener("pointerleave", hidePanel);
      anchor.removeEventListener("focusin", showPanel);
      anchor.removeEventListener("focusout", handleFocusOut);
    };
  }, [anchorRef, hidePanel, showPanel]);

  useLayoutEffect(() => {
    if (!isVisible) return;
    schedulePositionUpdate();
  }, [isVisible, schedulePositionUpdate]);

  useEffect(() => {
    if (!isVisible || typeof window === "undefined") return undefined;

    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);

    return () => {
      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
    };
  }, [isVisible, schedulePositionUpdate]);

  useEffect(() => () => {
    if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current);
  }, []);

  const panelStyle = position
    ? ({
      "--indicator-info-arrow-left": `${position.arrowLeft}px`,
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${position.width}px`,
    } as React.CSSProperties)
    : undefined;

  const panel = isVisible && typeof document !== "undefined"
    ? createPortal(
      <span
        className={`gp-indicator-info-panel ${tone === "missing" ? "is-missing" : ""}`}
        data-placement={position?.placement ?? "bottom"}
        role="tooltip"
        ref={panelRef}
        style={panelStyle}
      >
        <span className="gp-indicator-info-panel__line">{title}: {description}</span>
        {contextLabel && <span className="gp-indicator-info-panel__line">Groupe: {contextLabel}</span>}
        <span className="gp-indicator-info-panel__line">Code: {code}</span>
        <span className="gp-indicator-info-panel__line">{statusLabel}</span>
      </span>,
      document.body,
    )
    : null;

  return (
    <>
      <span id={id} className="gp-indicator-info-sr-only">
        {title} {contextLabel ? `${contextLabel} ` : ""}{description} {code} {statusLabel}
      </span>
      {panel}
    </>
  );
});
IndicatorHoverInfoPanel.displayName = "IndicatorHoverInfoPanel";

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
  const anchorRef = useRef<HTMLElement | null>(null);
  const infoPanelId = getIndicatorInfoPanelId("catalog", ind.key);
  const statusLabel = isWired ? (optimisticActive ? "Actif" : "Disponible") : "Backend seulement";

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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isWired) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handleClick();
  };

  return (
    <div className="col p-1">
      <div
        aria-describedby={infoPanelId}
        aria-pressed={isWired ? optimisticActive : undefined}
        className={`gp-indicator-catalog-card gp-indicator-info-anchor ${optimisticActive ? "active" : ""} ${!isWired ? "is-backend-only" : ""}`}
        role={isWired ? "button" : "group"}
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
        onKeyDown={handleKeyDown}
        ref={(node) => { anchorRef.current = node; }}
        tabIndex={0}
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
        <IndicatorHoverInfoPanel
          anchorRef={anchorRef}
          id={infoPanelId}
          title={ind.name}
          description={ind.desc}
          code={ind.key}
          statusLabel={statusLabel}
        />
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

const CompositeIndicatorChildChip = React.memo(({
  item,
  parentTitle,
  missing = false,
}: {
  item: BackendIndicatorItem;
  parentTitle: string;
  missing?: boolean;
}) => {
  const anchorRef = useRef<HTMLElement | null>(null);
  const infoPanelId = getIndicatorInfoPanelId(parentTitle, item.key);
  const statusLabel = missing ? "Sortie attendue" : "Sortie calculée";

  return (
    <span
      aria-describedby={infoPanelId}
      className={`gp-composite-indicator-child gp-indicator-info-anchor ${missing ? "is-missing" : ""}`}
      ref={(node) => { anchorRef.current = node; }}
      tabIndex={0}
    >
      <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: missing ? "#334155" : "#475569", marginRight: "8px" }}></span>
      <span style={{ marginRight: "6px" }}>{item.name}</span>
      <small style={{ fontSize: "11px" }}>{item.desc}</small>
      <IndicatorHoverInfoPanel
        anchorRef={anchorRef}
        id={infoPanelId}
        title={item.name}
        description={item.desc}
        code={item.key}
        contextLabel={parentTitle}
        statusLabel={statusLabel}
        tone={missing ? "missing" : "default"}
      />
    </span>
  );
});
CompositeIndicatorChildChip.displayName = "CompositeIndicatorChildChip";

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
          <CompositeIndicatorChildChip item={item} key={item.key} parentTitle={spec.title} />
        ))}
        {spec.missingOutputs?.map((item) => (
          <CompositeIndicatorChildChip item={item} key={item.key} missing parentTitle={spec.title} />
        ))}
      </div>
    </div>
  );
});
CompositeIndicatorCard.displayName = "CompositeIndicatorCard";

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  onRevealObjectIds,
  initialScrollTop = 0,
  onScrollPositionChange,
}) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  const advancedIndicators = useSelector(selectAdvancedIndicators, shallowEqual);
  const chartConfig = useSelector(selectChartConfig, shallowEqual);
  const marketDataBySymbol = useSelector(selectMarketData, shallowEqual);
  const comparisonSymbols = useSelector((state: RootState) => state.technicalAnalysis.ui.comparisonSymbols, shallowEqual);
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
  const currentChartData = marketDataBySymbol[currentSymbol] ?? EMPTY_CHART_DATA;
  const currentLiveSnapshot = useSelector((state: RootState) => selectMarketSnapshots(state)[currentSymbol] ?? null);

  const [indicatorSearch, setIndicatorSearch] = useState("");
  const deferredSearch = useDeferredValue(indicatorSearch);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const savedScrollTopRef = useRef(Math.max(0, initialScrollTop));

  const getScrollableModalBody = useCallback(() => (
    modalContentRef.current?.querySelector<HTMLDivElement>(".gp-modal-body") ?? null
  ), []);

  const rememberScrollTop = useCallback((scrollTop: number) => {
    const nextScrollTop = Number.isFinite(scrollTop) ? Math.max(0, scrollTop) : 0;
    savedScrollTopRef.current = nextScrollTop;
    onScrollPositionChange?.(nextScrollTop);
  }, [onScrollPositionChange]);

  const persistCurrentScrollTop = useCallback(() => {
    const scrollableBody = getScrollableModalBody();
    if (scrollableBody) {
      rememberScrollTop(scrollableBody.scrollTop);
    }
  }, [getScrollableModalBody, rememberScrollTop]);

  const restoreSavedScrollTop = useCallback(() => {
    const scrollableBody = getScrollableModalBody();
    if (!scrollableBody) return false;

    const targetScrollTop = savedScrollTopRef.current;
    const maxScrollTop = Math.max(0, scrollableBody.scrollHeight - scrollableBody.clientHeight);
    if (targetScrollTop > 0 && maxScrollTop <= 0) return false;

    scrollableBody.scrollTop = Math.min(targetScrollTop, maxScrollTop);
    return true;
  }, [getScrollableModalBody]);

  const handleClose = useCallback(() => {
    persistCurrentScrollTop();
    onClose();
  }, [onClose, persistCurrentScrollTop]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    savedScrollTopRef.current = Math.max(0, initialScrollTop);
    restoreSavedScrollTop();

    if (typeof window === "undefined") return;

    let frameId = 0;
    let attempts = 0;
    const timeoutIds: number[] = [];
    const runRestoreAttempt = () => {
      attempts += 1;
      const restored = restoreSavedScrollTop();
      if (!restored && attempts < 24) {
        frameId = window.requestAnimationFrame(runRestoreAttempt);
      }
    };

    frameId = window.requestAnimationFrame(runRestoreAttempt);
    [80, 180, 360, 720, 1200, 2000].forEach((delay) => {
      timeoutIds.push(window.setTimeout(restoreSavedScrollTop, delay));
    });

    const scrollableBody = getScrollableModalBody();
    const resizeObserver = scrollableBody && typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => { restoreSavedScrollTop(); })
      : null;
    if (scrollableBody && resizeObserver) {
      resizeObserver.observe(scrollableBody);
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      resizeObserver?.disconnect();
    };
  }, [getScrollableModalBody, initialScrollTop, isOpen, restoreSavedScrollTop]);

  useEffect(() => {
    if (!isOpen) return;

    const scrollableBody = getScrollableModalBody();
    if (!scrollableBody) return;

    const handleBodyScroll = () => rememberScrollTop(scrollableBody.scrollTop);
    scrollableBody.addEventListener("scroll", handleBodyScroll, { passive: true });

    return () => {
      scrollableBody.removeEventListener("scroll", handleBodyScroll);
    };
  }, [getScrollableModalBody, isOpen, rememberScrollTop]);

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
  const comparisonBacktestData = useMemo(() => comparisonSymbols
    .map((rawSymbol) => rawSymbol.trim().toUpperCase())
    .filter((comparisonSymbol) => comparisonSymbol.length > 0 && comparisonSymbol !== currentSymbol)
    .map((comparisonSymbol) => ({
      data: marketDataBySymbol[comparisonSymbol] ?? EMPTY_CHART_DATA,
      symbol: comparisonSymbol,
    })), [comparisonSymbols, currentSymbol, marketDataBySymbol]);

  const indicatorBacktestState = useIndicatorBacktestDashboard({
    comparisonData: comparisonBacktestData,
    data: currentChartData,
    enabled: isOpen,
    indicatorPeriods,
    symbol: currentSymbol,
  });
  const indicatorBacktestDashboard = indicatorBacktestState.dashboard;

  const backendIndicatorGroups = INDICATOR_MODAL_GROUPS;

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
            const filteredItems = sectionMatches ? section.items : section.items.filter((item) =>
              matchesIndicatorSearch(item.key, item.name, item.desc, group.title, group.subtitle, section.title)
            );
            const items = expandRequiredCompositeSectionItems(section, filteredItems);
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
  const activeBottomIndicatorLabels = useMemo(() => getActiveBottomPanelLabels(advancedIndicators), [advancedIndicators]);
  const activeBottomIndicatorCount = countActiveBottomIndicators(advancedIndicators);
  const isBottomIndicatorLimitReached = activeBottomIndicatorCount >= MAX_BOTTOM_INDICATORS;
  const hasVisibleMovingAverages = visibleMovingAverageCount > 0;
  const hasVisibleIndicators = visibleIndicatorCount > 0;
  const activeTrendSignalCount = MOVING_AVERAGE_TREND_SIGNAL_SPECS.filter(
    (spec) => movingAverageTrendSignals.active[spec.id]
  ).length;
  const areAllTrendSignalsActive = activeTrendSignalCount === MOVING_AVERAGE_TREND_SIGNAL_SPECS.length;

  const revealObjectIds = useCallback((objectIds: readonly IndicatorObjectId[]) => {
    if (objectIds.length > 0) onRevealObjectIds?.(objectIds);
  }, [onRevealObjectIds]);

  const revealAdvancedIndicator = useCallback((indicatorId: keyof AdvancedIndicatorsState) => {
    revealObjectIds(getAdvancedIndicatorObjectIds(indicatorId));
  }, [revealObjectIds]);

  const revealTrendSignalSourceAverage = useCallback((id: MovingAverageTrendSignalId) => {
    const spec = MOVING_AVERAGE_TREND_SIGNAL_SPECS.find((entry) => entry.id === id);
    if (!spec) return;
    revealObjectIds(spec.family === "sma" ? getSmaObjectIds(spec.period) : getEmaObjectIds(spec.period));
  }, [revealObjectIds]);

  // --- HANDLERS ---
  const handleToggleMA = useCallback((type: "sma" | "ema", period: number) => {
    const activeArray = type === "sma" ? chartIndicators.activeSma : chartIndicators.activeEma;
    const safeArray = activeArray || [];
    const isActivating = !safeArray.includes(period);
    const newArray = isActivating ? [...safeArray, period] : safeArray.filter((p) => p !== period);
    const normalizedArray = normalizeMovingAveragePeriods(newArray);

    if (isActivating) {
      revealObjectIds(type === "sma" ? getSmaObjectIds(period) : getEmaObjectIds(period));
    }

    dispatch(
      setChartConfig({
        indicators: {
          ...chartIndicators,
          [type === "sma" ? "activeSma" : "activeEma"]: normalizedArray,
          [type]: normalizedArray.length > 0 ? true : chartIndicators[type],
        },
      })
    );
  }, [chartIndicators, dispatch, revealObjectIds]);

  const handleToggleMovingAverageTrendSignal = useCallback((id: MovingAverageTrendSignalId, active: boolean) => {
    if (active) revealTrendSignalSourceAverage(id);
    dispatch(setMovingAverageTrendSignal({ id, active }));
    if (active || !movingAverageTrendSignals.showSourceAverages) return;

    const hasRemainingActiveSignal = MOVING_AVERAGE_TREND_SIGNAL_SPECS.some(
      (spec) => spec.id !== id && movingAverageTrendSignals.active[spec.id],
    );
    if (!hasRemainingActiveSignal) dispatch(setMovingAverageTrendSignalSourceAverages(false));
  }, [dispatch, movingAverageTrendSignals.active, movingAverageTrendSignals.showSourceAverages, revealTrendSignalSourceAverage]);

  const handleToggleAllMovingAverageTrendSignals = useCallback(() => {
    const shouldActivate = MOVING_AVERAGE_TREND_SIGNAL_SPECS.some((spec) => !movingAverageTrendSignals.active[spec.id]);
    const patch = MOVING_AVERAGE_TREND_SIGNAL_SPECS.reduce<Partial<Record<MovingAverageTrendSignalId, boolean>>>(
      (acc, spec) => {
        acc[spec.id] = shouldActivate;
        return acc;
      },
      {},
    );

    if (shouldActivate) {
      MOVING_AVERAGE_TREND_SIGNAL_SPECS.forEach((spec) => revealTrendSignalSourceAverage(spec.id));
    }
    dispatch(setMovingAverageTrendSignals(patch));
    if (!shouldActivate) dispatch(setMovingAverageTrendSignalSourceAverages(false));
  }, [dispatch, movingAverageTrendSignals.active, revealTrendSignalSourceAverage]);

  const handleToggleTrendSignalSourceLines = useCallback((checked: boolean) => {
    if (checked && activeTrendSignalCount === 0) {
      const patch = MOVING_AVERAGE_TREND_SIGNAL_SPECS.reduce<Partial<Record<MovingAverageTrendSignalId, boolean>>>(
        (acc, spec) => {
          acc[spec.id] = true;
          return acc;
        },
        {},
      );
      MOVING_AVERAGE_TREND_SIGNAL_SPECS.forEach((spec) => revealTrendSignalSourceAverage(spec.id));
      dispatch(setMovingAverageTrendSignals(patch));
    } else if (checked) {
      MOVING_AVERAGE_TREND_SIGNAL_SPECS
        .filter((spec) => movingAverageTrendSignals.active[spec.id])
        .forEach((spec) => revealTrendSignalSourceAverage(spec.id));
    }
    dispatch(setMovingAverageTrendSignalSourceAverages(checked));
  }, [activeTrendSignalCount, dispatch, movingAverageTrendSignals.active, revealTrendSignalSourceAverage]);

  const handleTogglePriceVsSmaMetric = useCallback((id: PriceVsSmaMetricId, active: boolean) => {
    const spec = PRICE_VS_SMA_METRIC_SPECS.find((entry) => entry.id === id);
    if (active && spec) revealObjectIds(getSmaObjectIds(spec.period));
    dispatch(setPriceVsSmaMetric({ id, active }));
  }, [dispatch, revealObjectIds]);

  const handleTogglePriceVsEmaMetric = useCallback((id: PriceVsEmaMetricId, active: boolean) => {
    const spec = PRICE_VS_EMA_METRIC_SPECS.find((entry) => entry.id === id);
    if (active && spec) revealObjectIds(getEmaObjectIds(spec.period));
    dispatch(setPriceVsEmaMetric({ id, active }));
  }, [dispatch, revealObjectIds]);

  const handleToggleAdvancedMovingAverage = useCallback((id: AdvancedMovingAverageId, active: boolean) => {
    const spec = ADVANCED_MOVING_AVERAGE_SPECS.find((entry) => entry.id === id);
    if (active && spec) revealObjectIds(getAdvancedMovingAverageObjectIds(spec.family, spec.period));
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
  }, [advancedMovingAverages, chartIndicators, dispatch, revealObjectIds]);

  const warnBottomIndicatorLimit = useCallback((requestedId: string, activeLabels: readonly string[]) => {
    const requestedLabel = getRequestedBottomPanelIndicatorLabel(requestedId);
    const activeList = activeLabels.length > 0 ? activeLabels.join(", ") : "aucun panneau identifié";

    addNotification({
      title: "Limite de panneaux bas atteinte",
      message: `Impossible d'ajouter ${requestedLabel}: ${activeLabels.length}/${MAX_BOTTOM_INDICATORS} panneaux bas actifs (${activeList}). Désactive un panneau dans le modal ou l'Object Tree avant d'ajouter un autre oscillateur.`,
      type: "warning",
      iconType: "faExclamationTriangle",
      duration: 7000,
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
    if (isHistoricalVolatilityKey(normalizedId) && hasActiveHistoricalVolatilityPanel(advancedIndicators)) return true;
    const canActivate = countActiveBottomIndicators(advancedIndicators) < MAX_BOTTOM_INDICATORS;
    if (!canActivate) warnBottomIndicatorLimit(id, getActiveBottomPanelLabels(advancedIndicators));
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
        revealAdvancedIndicator("rsi");
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
        revealAdvancedIndicator("rsi");
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
        revealAdvancedIndicator("rsi");
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
        revealAdvancedIndicator("cci20");
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
        revealAdvancedIndicator("williamsR14");
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
        revealAdvancedIndicator("roc10");
        dispatch(setAdvancedIndicators({ roc: false, roc10: true }));
      }
      return true;
    }

    if (!canActivateBottomIndicator(id)) {
      return false;
    }
    if (isAdvancedIndicatorKey(id) && !advancedIndicators[id]) {
      revealAdvancedIndicator(id);
    }
    dispatch(toggleAdvancedIndicator(id as keyof AdvancedIndicatorsState));
    return true;
  }, [
    advancedIndicators,
    canActivateBottomIndicator,
    dispatch,
    indicatorPeriods.rsiPeriod,
    revealAdvancedIndicator,
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


  const getSectionWiredIds = useCallback((section: BackendIndicatorSection): Array<keyof AdvancedIndicatorsState> =>
    section.items
      .map((item) => item.wiredId)
      .filter((id): id is keyof AdvancedIndicatorsState => typeof id === "string" && isAdvancedIndicatorKey(id)),
    []
  );

  const isIndicatorGroupActive = useCallback((section: BackendIndicatorSection) => {
    const ids = getSectionWiredIds(section);
    return ids.length > 0 && ids.every((id) => isIndicatorActive(id));
  }, [getSectionWiredIds, isIndicatorActive]);

  const handleToggleIndicatorGroup = useCallback((section: BackendIndicatorSection) => {
    const ids = getSectionWiredIds(section);
    if (ids.length === 0) return;
    const shouldActivate = ids.some((id) => !isIndicatorActive(id));
    if (shouldActivate && ids.some((id) => !isIndicatorActive(id) && !canActivateBottomIndicator(id))) return;
    const patch = ids.reduce<Partial<AdvancedIndicatorsState>>((next, id) => {
      next[id] = shouldActivate;
      return next;
    }, {});
    if (shouldActivate) ids.forEach((id) => revealAdvancedIndicator(id));
    dispatch(setAdvancedIndicators(patch));
  }, [canActivateBottomIndicator, dispatch, getSectionWiredIds, isIndicatorActive, revealAdvancedIndicator]);

  const renderIndicatorSectionTitle = useCallback((section: BackendIndicatorSection) => {
    if (!section.groupSwitch) {
      return <div className="gp-indicator-subfamily-title mb-2" style={{ color: "#94a3b8", fontSize: "12px", fontWeight: 600 }}>{section.title}</div>;
    }

    const active = isIndicatorGroupActive(section);
    return (
      <button
        className={`gp-indicator-subfamily-title gp-indicator-group-switch mb-2 ${active ? "active" : ""}`}
        onClick={() => handleToggleIndicatorGroup(section)}
        style={{
          alignItems: "center",
          background: active ? "rgba(41, 98, 255, 0.12)" : "rgba(15, 23, 42, 0.8)",
          border: `1px solid ${active ? "#2962ff" : "#1e293b"}`,
          borderRadius: "6px",
          color: active ? "#f8fafc" : "#94a3b8",
          display: "inline-flex",
          fontSize: "12px",
          fontWeight: 700,
          gap: "8px",
          minHeight: "28px",
          padding: "4px 10px",
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          style={{
            alignItems: "center",
            border: `1px solid ${active ? "#2962ff" : "#334155"}`,
            borderRadius: "4px",
            background: active ? "#2962ff" : "transparent",
            display: "inline-flex",
            height: "16px",
            justifyContent: "center",
            width: "16px",
          }}
        >
          {active && <Check size={11} strokeWidth={3.4} />}
        </span>
        {section.title}
      </button>
    );
  }, [handleToggleIndicatorGroup, isIndicatorGroupActive]);

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

    const sectionCompositeSpecs = COMPOSITE_INDICATOR_SPECS.filter((spec) =>
      isCompositeSpecAllowedInSection(spec, section)
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
              items={getCompositeItemsForSection(spec, section)}
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
        <div className="gp-indicator-card-grid">
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
      <div className="gp-indicator-row-groups gp-indicator-card-grid">
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
      onClose={handleClose}
      title="Indicateurs Techniques"
      icon={<i className="bi bi-activity me-2"></i>}
      primaryLabel="Appliquer"
      primaryAction={handleClose}
      secondaryLabel="Fermer"
      maxWidth="750px"
      className="gp-indicators-modal"
      overlayClassName="gp-indicators-modal-overlay"
      contentRef={modalContentRef}
      draggable
    >
      <div className="gp-indicators-modal-scroll-content">
        <div className="gp-indicator-search-panel">
          <div className="gp-indicator-search-box">
            <i className="bi bi-search" aria-hidden="true"></i>
            <label htmlFor={INDICATOR_SEARCH_INPUT_ID} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>
              Rechercher un indicateur technique
            </label>
            <input
              id={INDICATOR_SEARCH_INPUT_ID}
              name="technicalAnalysisIndicatorSearch"
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
            {isBottomIndicatorLimitReached && (
              <span style={{ color: "#f59e0b", fontSize: "11px" }}>
                {activeBottomIndicatorCount}/{MAX_BOTTOM_INDICATORS} panneaux bas actifs · désactive un panneau pour ajouter un oscillateur
              </span>
            )}
          </div>
        </div>

        {indicatorBacktestDashboard && (
          <IndicatorBacktestPanel
            comparisonDashboards={indicatorBacktestState.dashboards.filter((entry) => entry.symbol !== currentSymbol)}
            dashboard={indicatorBacktestDashboard}
            symbol={currentSymbol}
            timeframe={String(chartConfig.timeframe || "1D")}
          />
        )}

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
                        {renderIndicatorSectionTitle(section)}
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
