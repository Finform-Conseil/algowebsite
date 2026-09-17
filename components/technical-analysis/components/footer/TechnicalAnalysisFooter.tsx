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

interface TechnicalAnalysisFooterProps {
  chartFooterRef: React.Ref<HTMLDivElement>;
  selectedTimeRange: string;
  handleTimeRangeSelect: (range: string) => void;
  isHistoricalDataUnavailable: boolean;
  setIsDatePickerModalOpen: (open: boolean) => void;
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
