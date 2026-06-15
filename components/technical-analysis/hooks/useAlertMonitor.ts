import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

/**
 * [TENOR 2026] useAlertMonitor
 * Legacy adapter kept for import compatibility.
 * Runtime alert monitoring now belongs exclusively to the right-rail AlertsRailRuntime.
 */

interface UseAlertMonitorProps {
    chartData: ChartDataPoint[];
    addNotification: (notif: {
        title: string;
        message: string;
        type: "success" | "error" | "info" | "warning";
        iconType: string;
        link?: string;
    }) => void;
}

export const useAlertMonitor = (_props: UseAlertMonitorProps): void => {
  return;
};

// --- EOF ---
