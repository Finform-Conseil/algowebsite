"use client";

import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    setTimeframe,
    setChartConfig,
    setModalOpen,
    selectChartConfig,
    selectAdvancedIndicators,
    selectUiState
} from "../store/technicalAnalysisSlice";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { SavedAnalysis } from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

export const useTechnicalAnalysisActions = (
    setChartData?: (data: ChartDataPoint[]) => void,
    setSavedAnalysesList?: (list: SavedAnalysis[]) => void
) => {
    const dispatch = useDispatch();
    const { addNotification } = useGlobalNotification();
    const chartConfig = useSelector(selectChartConfig);
    const advancedIndicators = useSelector(selectAdvancedIndicators);
    const uiState = useSelector(selectUiState);

    const handleTimeframeChange = useCallback((tf: string) => {
        dispatch(setTimeframe(tf));
    }, [dispatch]);

    const handleSaveAnalysis = useCallback(() => {
        try {
            const analysisConfig = {
                symbol: chartConfig.symbol,
                timeframe: chartConfig.timeframe,
                chartType: chartConfig.chartType,
                indicators: chartConfig.indicators,
                advancedIndicators: advancedIndicators,
                timeRange: uiState.selectedTimeRange,
                savedAt: new Date().toISOString(),
            };

            const savedAnalyses = JSON.parse(localStorage.getItem("savedAnalyses") || "[]");
            savedAnalyses.push({
                id: `analysis_${Date.now()}`,
                name: `${chartConfig.symbol} - ${new Date().toLocaleDateString()}`,
                config: analysisConfig,
            });

            localStorage.setItem("savedAnalyses", JSON.stringify(savedAnalyses));

            addNotification({
                title: "Analyse sauvegardée",
                message: `Configuration de ${chartConfig.symbol} enregistrée avec succès`,
                type: "success",
                iconType: "faSave",
                duration: 3000,
            });
        } catch (error) {
            console.error("Error saving analysis:", error);
        }
    }, [chartConfig, advancedIndicators, uiState.selectedTimeRange, addNotification]);

    const handleOpenLoadModal = useCallback(() => {
        const saved = JSON.parse(localStorage.getItem("savedAnalyses") || "[]");
        saved.sort(
            (a: SavedAnalysis, b: SavedAnalysis) =>
                new Date(b.config.savedAt).getTime() - new Date(a.config.savedAt).getTime(),
        );
        if (setSavedAnalysesList) {
            setSavedAnalysesList(saved);
        }
        dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: true }));
    }, [dispatch, setSavedAnalysesList]);

    const handleLoadAnalysis = useCallback((analysis: SavedAnalysis) => {
        const config = analysis.config;
        dispatch(setChartConfig({
            symbol: config.symbol,
            timeframe: config.timeframe,
            chartType: config.chartType as "line" | "candlestick",
            indicators: {
                ...config.indicators,
                activeSma: config.indicators.activeSma ?? [],
                activeEma: config.indicators.activeEma ?? [],
            },
        }));
        if (config.timeRange) dispatch(setTimeframe(config.timeRange));

        dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: false }));
        addNotification({
            title: "Analyse chargée",
            message: `Configuration ${config.symbol} restaurée avec succès`,
            type: "success",
            iconType: "faCheck",
        });
    }, [dispatch, addNotification]);

    return {
        handleTimeframeChange,
        handleSaveAnalysis,
        handleOpenLoadModal,
        handleLoadAnalysis,
    };
};
