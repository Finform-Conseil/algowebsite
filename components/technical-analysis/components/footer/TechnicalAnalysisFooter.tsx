import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { Calendar } from "lucide-react";
import {
  BRVM_DISPLAY_TIME_ZONE_LABEL,
  formatBrvmDisplayClock,
  getBrvmMarketStatus,
  type BrvmMarketStatus,
} from "../../utils/brvmMarketSession";

interface TechnicalAnalysisFooterProps {
  chartFooterRef: React.Ref<HTMLDivElement>;
  selectedTimeRange: string;
  handleTimeRangeSelect: (range: string) => void;
  setIsDatePickerModalOpen: (open: boolean) => void;
}

interface FooterClockState {
  time: string;
  marketStatus: BrvmMarketStatus;
}

const TIME_RANGES = ["1J", "5J", "1M", "3M", "6M", "YTD", "1Y", "5Y", "Tout"];

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

  return (
    <div ref={chartFooterRef} className="gp-chart-footer">
      <div className="gp-time-selector" aria-label="Plages temporelles">
        {TIME_RANGES.map((range) => {
          const isActive = selectedTimeRange === range;

          return (
            <button
              key={range}
              type="button"
              className={clsx("gp-time-range-btn", isActive && "active")}
              aria-pressed={isActive}
              onClick={() => handleTimeRangeSelect(range)}
            >
              {range}
            </button>
          );
        })}
        <button
          type="button"
          className={clsx("gp-toolbar-btn", "hover-lift")}
          title="Plage de dates"
          aria-label="Ouvrir la selection de plage de dates"
          onClick={() => setIsDatePickerModalOpen(true)}
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
