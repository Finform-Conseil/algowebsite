import React, { useState, useEffect } from "react";
import clsx from "clsx";

interface TechnicalAnalysisFooterProps {
    chartFooterRef: React.Ref<HTMLDivElement>;
    selectedTimeRange: string;
    handleTimeRangeSelect: (range: string) => void;
    setIsDatePickerModalOpen: (open: boolean) => void;

}
export const TechnicalAnalysisFooter: React.FC<TechnicalAnalysisFooterProps> = ({
    chartFooterRef,
    selectedTimeRange,
    handleTimeRangeSelect,
    setIsDatePickerModalOpen,
}) => {
    // [TENOR 2026] Hydration Guard: The clock must only render on the client
    const [time, setTime] = useState<string>("");

    useEffect(() => {
        // Initial set to avoid 1s delay
        setTime(new Date().toLocaleTimeString());

        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div
            ref={chartFooterRef}
            className={clsx("gp-chart-footer", "gp-chart-footer")}
        >
            <div className={"gp-time-selector"}>
                {[
                    "1J",
                    "5J",
                    "1M",
                    "3M",
                    "6M",
                    "YTD",
                    "1Y",
                    "5Y",
                    "Tout",
                ].map((range) => (
                    <span
                        key={range}
                        className={clsx(
                            selectedTimeRange === range && "active",
                            "cursor-pointer",
                        )}
                        onClick={() => handleTimeRangeSelect(range)}
                        role="button"
                    >
                        {range}
                    </span>
                ))}
                <button
                    className={clsx(
                        "gp-toolbar-btn",
                        "gp-toolbar-btn",
                        "hover-lift",
                        "hover-lift",
                    )}
                    title="Plage de dates"
                    onClick={() => setIsDatePickerModalOpen(true)}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        className="bi bi-calendar-week"
                        viewBox="0 0 16 16"
                    >
                        <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm-5 3a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5z" />
                        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z" />
                    </svg>
                </button>
            </div>
            <div className={"gp-timestamp"}>
                <div
                    className={"gp-market-status"}
                    title="Marché simulé en temps réel"
                >
                    <div className={"gp-live-dot"}></div> Live
                </div>
                <span className="ms-3">
                    {time || "--:--:--"} (UTC)
                </span>
                <div
                    className={clsx("gp-toolbar-v-divider", "mx-2")}
                ></div>
                <span className="span2">ADJ</span>
            </div>
        </div>
    );
};
