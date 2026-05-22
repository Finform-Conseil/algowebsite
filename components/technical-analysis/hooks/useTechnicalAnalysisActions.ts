"use client";

import { normalizeChartType } from "../lib/chart-types";
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import DOMPurify from "dompurify";
import {
  setTimeframe,
  setChartConfig,
  setAdvancedIndicators,
  hydrateMultiChartLayout,
  setModalOpen,
  selectChartConfig,
  selectAdvancedIndicators,
  selectUiState
} from "../store/technicalAnalysisSlice";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { SavedAnalysis } from "../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";
import { idbGet, idbSet } from "./useDrawingManager";

/**
 * [TENOR 2026 SRE] useTechnicalAnalysisActions
 * Refactored to use IndexedDB (Asynchronous) instead of localStorage (Synchronous).
 * Eradicates the 5MB storage limit and prevents Main Thread blocking (UI Freezes)
 * when saving massive 10k+ candle analysis objects.
 */
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

  const handleSaveAnalysis = useCallback(async () => {
    try {
      const analysisConfig = {
        symbol: chartConfig.symbol,
        timeframe: chartConfig.timeframe,
        chartType: chartConfig.chartType,
        indicators: chartConfig.indicators,
        advancedIndicators: advancedIndicators,
        multiChartLayout: uiState.multiChartLayout,
        timeRange: uiState.selectedTimeRange,
        savedAt: new Date().toISOString(),
      };

      // 1. Fetch existing analyses from IndexedDB
      let savedAnalyses: SavedAnalysis[] = await idbGet<SavedAnalysis[]>("savedAnalyses") || [];

      // 2. Silent Migration Fallback (localStorage -> IndexedDB)
      if (savedAnalyses.length === 0) {
        const legacy = localStorage.getItem("savedAnalyses");
        if (legacy) {
          try {
            savedAnalyses = JSON.parse(legacy);
            localStorage.removeItem("savedAnalyses"); // Cleanup legacy
          } catch (e) {
            console.warn("[SRE] Failed to parse legacy savedAnalyses", e);
          }
        }
      }

      // 3. XSS Shield: Sanitize the symbol before using it in the name
      const safeSymbol = DOMPurify.sanitize(chartConfig.symbol, { ALLOWED_TAGS: [] }).trim() || "UNKNOWN";

      // 4. Append new analysis
      savedAnalyses.push({
        id: `analysis_${Date.now()}`,
        name: `${safeSymbol} - ${new Date().toLocaleDateString()}`,
        config: analysisConfig,
      });

      // 5. Save back to IndexedDB (Off-Main-Thread)
      await idbSet("savedAnalyses", savedAnalyses);

      addNotification({
        title: "Analyse sauvegardée",
        message: `Configuration de ${safeSymbol} enregistrée avec succès`,
        type: "success",
        iconType: "faSave",
        duration: 3000,
      });
    } catch (error) {
      console.error("[SRE] Error saving analysis to IndexedDB:", error);
      addNotification({
        title: "Erreur de sauvegarde",
        message: "Impossible de sauvegarder l'analyse. Espace insuffisant ou erreur système.",
        type: "error",
        iconType: "faTimesCircle",
      });
    }
  }, [chartConfig, advancedIndicators, uiState.selectedTimeRange, uiState.multiChartLayout, addNotification]);

  const handleOpenLoadModal = useCallback(async () => {
    try {
      // 1. Fetch existing analyses from IndexedDB
      let saved: SavedAnalysis[] = await idbGet<SavedAnalysis[]>("savedAnalyses") || [];

      // 2. Silent Migration Fallback (localStorage -> IndexedDB)
      if (saved.length === 0) {
        const legacy = localStorage.getItem("savedAnalyses");
        if (legacy) {
          try {
            saved = JSON.parse(legacy);
            await idbSet("savedAnalyses", saved); // Persist migrated data
            localStorage.removeItem("savedAnalyses"); // Cleanup legacy
          } catch (e) {
            console.warn("[SRE] Failed to parse legacy savedAnalyses", e);
          }
        }
      }

      // 3. Sort by date descending
      saved.sort(
        (a: SavedAnalysis, b: SavedAnalysis) =>
          new Date(b.config.savedAt).getTime() - new Date(a.config.savedAt).getTime(),
      );

      if (setSavedAnalysesList) {
        setSavedAnalysesList(saved);
      }
      dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: true }));
    } catch (error) {
      console.error("[SRE] Error loading analyses from IndexedDB:", error);
      addNotification({
        title: "Erreur de chargement",
        message: "Impossible de charger l'historique des analyses.",
        type: "error",
        iconType: "faTimesCircle",
      });
    }
  }, [dispatch, setSavedAnalysesList, addNotification]);

  const handleLoadAnalysis = useCallback((analysis: SavedAnalysis) => {
    const config = analysis.config;
    const savedAdvancedIndicators = config.advancedIndicators ?? {};
    
    dispatch(setChartConfig({
      symbol: config.symbol,
      timeframe: config.timeframe,
      chartType: normalizeChartType(config.chartType),
      indicators: {
        ...config.indicators,
        activeSma: config.indicators.activeSma ?? [],
        activeEma: config.indicators.activeEma ?? [],
        activeWma: config.indicators.activeWma ?? [],
        activeDema: config.indicators.activeDema ?? [],
        activeTema: config.indicators.activeTema ?? [],
        activeHma: config.indicators.activeHma ?? [],
        activeZlema: config.indicators.activeZlema ?? [],
        activeAlma: config.indicators.activeAlma ?? [],
        activeSmma: config.indicators.activeSmma ?? [],
        activeKama: config.indicators.activeKama ?? [],
        activeVwma: config.indicators.activeVwma ?? [],
      },
    }));

    dispatch(setAdvancedIndicators({
      rsi: savedAdvancedIndicators.rsi ?? false,
      macd: savedAdvancedIndicators.macd ?? false,
      bollinger: savedAdvancedIndicators.bollinger ?? false,
      stochastic: savedAdvancedIndicators.stochastic ?? false,
      atr: savedAdvancedIndicators.atr ?? false,
      cci: false,
      cci14: savedAdvancedIndicators.cci14 ?? false,
      cci20: savedAdvancedIndicators.cci20 ?? savedAdvancedIndicators.cci ?? false,
      mfi14: savedAdvancedIndicators.mfi14 ?? false,
      williamsR: false,
      williamsR14: savedAdvancedIndicators.williamsR14 ?? savedAdvancedIndicators.williamsR ?? false,
      roc: false,
      roc10: savedAdvancedIndicators.roc10 ?? savedAdvancedIndicators.roc ?? false,
      roc20: savedAdvancedIndicators.roc20 ?? false,
      momentum10: savedAdvancedIndicators.momentum10 ?? false,
      momentum20: savedAdvancedIndicators.momentum20 ?? false,
      cmo14: savedAdvancedIndicators.cmo14 ?? false,
      dymi: savedAdvancedIndicators.dymi ?? false,
      ultimateOsc: savedAdvancedIndicators.ultimateOsc ?? false,
      dpo20: savedAdvancedIndicators.dpo20 ?? false,
      tsi: savedAdvancedIndicators.tsi ?? false,
      awesomeOsc: savedAdvancedIndicators.awesomeOsc ?? false,
      acOsc: savedAdvancedIndicators.acOsc ?? false,
      rvi: savedAdvancedIndicators.rvi ?? false,
      fisherTransform: savedAdvancedIndicators.fisherTransform ?? false,
      elderBullBear: savedAdvancedIndicators.elderBullBear ?? false,
      coppock: savedAdvancedIndicators.coppock ?? false,
      ppo: savedAdvancedIndicators.ppo ?? false,
      apo: savedAdvancedIndicators.apo ?? false,
      parabolicSar: savedAdvancedIndicators.parabolicSar ?? false,
      obv: savedAdvancedIndicators.obv ?? false,
      ichimoku: savedAdvancedIndicators.ichimoku ?? false,
      stochRsi: savedAdvancedIndicators.stochRsi ?? false,
      bbWidth: savedAdvancedIndicators.bbWidth ?? false,
      bbPercentB: savedAdvancedIndicators.bbPercentB ?? false,
    }));

    if (config.timeRange) {
      dispatch(setTimeframe(config.timeRange));
    }

    if (config.multiChartLayout) {
      dispatch(hydrateMultiChartLayout(config.multiChartLayout));
    }

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
// --- EOF ---
