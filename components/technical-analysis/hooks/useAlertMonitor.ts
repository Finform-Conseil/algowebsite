import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    selectAlerts,
    selectChartConfig,
    selectUiState,
    deactivateAlert,
} from "../store/technicalAnalysisSlice";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { Alert } from "../config/TechnicalAnalysisTypes";

/**
 * [TENOR 2026] useAlertMonitor
 * Extracted from TechnicalAnalysis.tsx to enforce Single Responsibility Principle.
 * Monitors real-time price changes against user-defined alerts.
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

export const useAlertMonitor = ({
    chartData,
    addNotification,
}: UseAlertMonitorProps) => {
    const dispatch = useDispatch();
    const alerts = useSelector(selectAlerts);
    const chartConfig = useSelector(selectChartConfig);
    const uiState = useSelector(selectUiState);

    // Use a stable ref to hold the latest notification callback.
    // This avoids passing data directly to the parent via a prop function inside the effect,
    // resolving the `react-you-might-not-need-an-effect` lint warning.
    const addNotificationRef = useRef(addNotification);
    useEffect(() => {
        addNotificationRef.current = addNotification;
    }, [addNotification]);

    const displaySymbol = uiState.isAnonyme
        ? uiState.selectedPseudo
        : chartConfig.symbol;

    useEffect(() => {
        // Fail Fast: Guard against empty data
        if (!alerts || alerts.length === 0 || !chartData || chartData.length === 0) {
            return;
        }

        const currentPrice = chartData[chartData.length - 1].close;

        alerts.forEach((alert: Alert) => {
            // Only process active alerts for the current symbol
            if (!alert.active || alert.symbol !== chartConfig.symbol) return;

            let triggered = false;

            if (alert.condition === "GREATER_THAN" && currentPrice >= alert.value) {
                triggered = true;
            } else if (alert.condition === "LESS_THAN" && currentPrice <= alert.value) {
                triggered = true;
            }

            if (triggered) {
                // 1. Trigger visual notification
                addNotificationRef.current({
                    title: "Alerte de marché",
                    message: `${displaySymbol} a atteint votre seuil de ${alert.value.toFixed(2)}`,
                    type: "warning",
                    iconType: "faExclamationTriangle",
                    link: "#",
                });

                // 2. [BUG FIX] Deactivate the alert to prevent notification spam on every tick
                // Replaces the legacy `dispatch(setChartConfig({}))` which caused useless re-renders
                dispatch(deactivateAlert(alert.id));
            }
        });
    }, [
        chartData,
        alerts,
        chartConfig.symbol,
        displaySymbol,
        dispatch,
    ]);
};

// --- EOF ---