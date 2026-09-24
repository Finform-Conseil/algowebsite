import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Calendar } from "lucide-react";
import {
  BRVM_DISPLAY_TIME_ZONE_LABEL,
  formatBrvmDisplayClock,
  getBrvmMarketStatus,
  type BrvmMarketStatus,
} from "../../utils/brvmMarketSession";
import { CHART_DATE_RANGES, decodeCustomDateRange } from "../../config/market/dateRangeSeries";
import type { PrimaryChartRenderEngine } from "../../engine-v2/runtime/usePrimaryChartRenderEngine";

interface TechnicalAnalysisFooterProps {
  chartFooterRef: React.Ref<HTMLDivElement>;
  selectedTimeRange: string;
  handleTimeRangeSelect: (range: string) => void;
  isHistoricalDataUnavailable: boolean;
  setIsDatePickerModalOpen: (open: boolean) => void;
  renderEngine: PrimaryChartRenderEngine;
  onRenderEngineChange: (engine: PrimaryChartRenderEngine) => void;
  renderEngineSwitchDisabled?: boolean;
}

interface FooterClockState {
  time: string;
  marketStatus: BrvmMarketStatus;
}

const TIME_RANGES = CHART_DATE_RANGES;

const createInitialFooterClockState = (): FooterClockState => ({
  time: "",
  marketStatus: getBrvmMarketStatus(0),
});

const getCurrentFooterClockState = (): FooterClockState => {
  const now = Date.now();
  return {
    time: formatBrvmDisplayClock(new Date(now)),
    marketStatus: getBrvmMarketStatus(now),
  };
};

export const TechnicalAnalysisFooter: React.FC<TechnicalAnalysisFooterProps> = ({
  chartFooterRef,
  selectedTimeRange,
  handleTimeRangeSelect,
  isHistoricalDataUnavailable,
  setIsDatePickerModalOpen,
  renderEngine,
  onRenderEngineChange,
  renderEngineSwitchDisabled = false,
}) => {
  const [{ time, marketStatus }, setClockState] = useState(createInitialFooterClockState);

  useEffect(() => {
    const syncMarketClock = () => {
      setClockState(getCurrentFooterClockState());
    };

    syncMarketClock();

    const timer = window.setInterval(syncMarketClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const customRange = decodeCustomDateRange(selectedTimeRange);
  const datePickerLabel = customRange
    ? `Plage personnalisée du ${customRange.start} au ${customRange.end}`
    : "Plage de dates";

  return (
    <div ref={chartFooterRef} className="gp-chart-footer">
      <div className="gp-time-selector" aria-label="Plages temporelles">
        {TIME_RANGES.map((range) => {
          const isActive = selectedTimeRange === range;

          return (
            <button
              key={range}
              type="button"
              className={clsx("gp-time-range-btn", isActive && "active", isHistoricalDataUnavailable && "disabled")}
              aria-pressed={isActive}
              aria-disabled={isHistoricalDataUnavailable}
              disabled={isHistoricalDataUnavailable}
              onClick={() => {
                if (!isHistoricalDataUnavailable) handleTimeRangeSelect(range);
              }}
            >
              {range}
            </button>
          );
        })}
        <button
          type="button"
          className={clsx("gp-toolbar-btn", "hover-lift", customRange && "active", isHistoricalDataUnavailable && "disabled")}
          title={datePickerLabel}
          aria-label={customRange ? datePickerLabel : "Ouvrir la sélection de plage de dates"}
          aria-pressed={Boolean(customRange)}
          aria-disabled={isHistoricalDataUnavailable}
          disabled={isHistoricalDataUnavailable}
          onClick={() => {
            if (!isHistoricalDataUnavailable) setIsDatePickerModalOpen(true);
          }}
        >
          <Calendar size={16} strokeWidth={2} aria-hidden="true" focusable="false" />
        </button>
      </div>

      <div
        className="gp-render-engine-switch"
        role="group"
        aria-label="Moteur de rendu du graphique"
        data-render-engine={renderEngine}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: 2,
          marginLeft: "auto",
          marginRight: 8,
          border: "1px solid #2a2e39",
          borderRadius: 6,
          background: "#131722",
          whiteSpace: "nowrap",
        }}
      >
        {(["echarts", "vela"] as const).map((engine) => {
          const active = renderEngine === engine;
          const label = engine === "echarts" ? "ECharts" : "Vela";
          return (
            <button
              key={engine}
              type="button"
              className={clsx("gp-render-engine-btn", active && "active")}
              aria-pressed={active}
              disabled={renderEngineSwitchDisabled}
              title={renderEngineSwitchDisabled
                ? "Le changement de moteur est disponible en mode graphique unique"
                : `Utiliser le moteur ${label}`}
              onClick={() => onRenderEngineChange(engine)}
              style={{
                height: 24,
                padding: "0 9px",
                border: 0,
                borderRadius: 4,
                background: active ? "#2962ff" : "transparent",
                color: active ? "#ffffff" : "#9aa4b2",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: "24px",
                cursor: renderEngineSwitchDisabled ? "not-allowed" : "pointer",
                opacity: renderEngineSwitchDisabled ? 0.55 : 1,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="gp-timestamp">
        <div
          className={clsx("gp-market-status", !marketStatus.isOpen && "closed")}
          title={marketStatus.title}
          aria-label={marketStatus.title}
        >
          <span className="gp-live-dot" aria-hidden="true" />
          {marketStatus.label}
        </div>
        <span className="ms-3">
          {time || "--:--:--"} {BRVM_DISPLAY_TIME_ZONE_LABEL}
        </span>
        <div className={clsx("gp-toolbar-v-divider", "mx-2")} aria-hidden="true" />
        <span className="span2">ADJ</span>
      </div>
    </div>
  );
};
