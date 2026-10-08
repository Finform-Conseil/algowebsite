"use client";

import { normalizeChartType } from "../lib/chart-types";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setTimeframe,
  setTimeRange,
  setChartConfig,
  setAdvancedIndicators,
  setIndicatorPeriods,
  setBollingerSettings,
  setChartAppearance,
  hydrateMultiChartLayout,
  setModalOpen,
  setActiveMarket,
  clearComparisonSymbols,
  addComparisonSymbol,
  setComparisonSeriesSettings,
} from "../store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectIndicatorPeriods,
  selectBollingerSettings,
  selectChartAppearance,
  selectUiState,
} from "../store/selectors";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import type { SavedAnalysis } from "../config/persistence/savedAnalysisTypes";
import {
  deleteSavedAnalysis,
  duplicateSavedAnalysis,
  listSavedAnalyses,
  persistSavedAnalysis,
  renameSavedAnalysis,
} from "../config/persistence/savedAnalysisRepository";
import type { Drawing } from "../config/drawing/drawingModelTypes";
import type { ChartDataPoint } from "../lib/Indicators/TechnicalIndicators";

type SavedAnalysisRuntime = {
  drawings?: readonly Drawing[];
  replaceDrawings?: (drawings: Drawing[]) => void;
};

type SaveAnalysisOptions = {
  name?: string;
  mode?: "update" | "copy";
};

const createAnalysisId = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? `analysis_${crypto.randomUUID()}`
    : `analysis_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * Single source of truth for saved-analysis lifecycle.
 * IndexedDB owns durability; this hook owns the UI list and active analysis identity.
 */
export const useTechnicalAnalysisActions = (
  _setChartData?: (data: ChartDataPoint[]) => void,
  setExternalSavedAnalysesList?: (list: SavedAnalysis[]) => void,
  runtime?: SavedAnalysisRuntime,
) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  const [savedAnalysesList, setSavedAnalysesList] = useState<SavedAnalysis[]>([]);
  const [activeSavedAnalysisId, setActiveSavedAnalysisId] = useState<string | null>(null);
  const [activeSavedAnalysisName, setActiveSavedAnalysisName] = useState<string | null>(null);

  const chartConfig = useSelector(selectChartConfig);
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const indicatorPeriods = useSelector(selectIndicatorPeriods);
  const bollingerSettings = useSelector(selectBollingerSettings);
  const chartAppearance = useSelector(selectChartAppearance);
  const uiState = useSelector(selectUiState);

  const publishList = useCallback((list: SavedAnalysis[]) => {
    setSavedAnalysesList(list);
    setExternalSavedAnalysesList?.(list);
  }, [setExternalSavedAnalysesList]);

  const handleTimeframeChange = useCallback((tf: string) => {
    dispatch(setTimeframe(tf));
  }, [dispatch]);

  const handleSaveAnalysis = useCallback(async (options?: SaveAnalysisOptions) => {
    try {
      const now = new Date().toISOString();
      const DOMPurify = (await import("dompurify")).default;
      const safeSymbol = DOMPurify.sanitize(chartConfig.symbol, { ALLOWED_TAGS: [] }).trim() || "UNKNOWN";
      const isCopy = options?.mode === "copy";
      const id = !isCopy && activeSavedAnalysisId ? activeSavedAnalysisId : createAnalysisId();
      const existing = savedAnalysesList.find((item) => item.id === id);
      const requestedName = DOMPurify.sanitize(options?.name ?? "", { ALLOWED_TAGS: [] }).trim();
      const name = requestedName
        || (!isCopy && activeSavedAnalysisName)
        || `${safeSymbol} · ${chartConfig.timeframe}`;
      const drawings = runtime?.drawings ? structuredClone([...runtime.drawings]) : [];

      const analysis: SavedAnalysis = {
        id,
        name,
        config: {
          version: 3,
          symbol: chartConfig.symbol,
          timeframe: chartConfig.timeframe,
          chartType: chartConfig.chartType,
          indicators: chartConfig.indicators,
          advancedIndicators,
          indicatorPeriods,
          bollingerSettings,
          chartAppearance,
          multiChartLayout: uiState.multiChartLayout,
          comparisonSymbols: [...uiState.comparisonSymbols],
          comparisonSettings: uiState.comparisonSettings,
          activeMarket: uiState.activeMarket,
          timeRange: uiState.selectedTimeRange,
          drawings,
          createdAt: existing?.config.createdAt ?? existing?.config.savedAt ?? now,
          updatedAt: now,
          savedAt: now,
        },
      };

      const persisted = await persistSavedAnalysis(analysis);
      publishList(persisted);
      setActiveSavedAnalysisId(id);
      setActiveSavedAnalysisName(name);

      addNotification({
        title: existing && !isCopy ? "Analyse mise à jour" : "Analyse sauvegardée",
        message: `${name} · ${drawings.length} dessin${drawings.length > 1 ? "s" : ""} · ${safeSymbol} ${chartConfig.timeframe}`,
        type: "success",
        iconType: "faSave",
        duration: 3000,
      });
      return analysis;
    } catch (error) {
      console.error("[SRE] Error saving analysis to IndexedDB:", error);
      addNotification({
        title: "Erreur de sauvegarde",
        message: "La sauvegarde n'a pas été confirmée par IndexedDB. Aucun faux succès n'a été affiché.",
        type: "error",
        iconType: "faTimesCircle",
      });
      return null;
    }
  }, [
    activeSavedAnalysisId,
    activeSavedAnalysisName,
    addNotification,
    advancedIndicators,
    bollingerSettings,
    chartAppearance,
    chartConfig,
    indicatorPeriods,
    publishList,
    runtime?.drawings,
    savedAnalysesList,
    uiState.activeMarket,
    uiState.comparisonSettings,
    uiState.comparisonSymbols,
    uiState.multiChartLayout,
    uiState.selectedTimeRange,
  ]);

  const handleOpenLoadModal = useCallback(async () => {
    // Opening the history is a UI action and must never be blocked by IndexedDB.
    // Mount the modal first, then refresh its data asynchronously.
    dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: true }));

    try {
      const saved = await listSavedAnalyses();
      publishList(saved);
    } catch (error) {
      console.error("[SRE] Error loading analyses from IndexedDB:", error);
      addNotification({
        title: "Erreur de chargement",
        message: "Impossible de charger l'historique des analyses.",
        type: "error",
        iconType: "faTimesCircle",
      });
    }
  }, [addNotification, dispatch, publishList]);

  const handleDeleteAnalysis = useCallback(async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    try {
      const next = await deleteSavedAnalysis(id);
      publishList(next);
      if (activeSavedAnalysisId === id) {
        setActiveSavedAnalysisId(null);
        setActiveSavedAnalysisName(null);
      }
      addNotification({
        title: "Analyse supprimée",
        message: "L'analyse a été retirée de l'historique.",
        type: "info",
        iconType: "faTrash",
      });
    } catch (error) {
      console.error("[SRE] Error deleting saved analysis:", error);
      addNotification({
        title: "Erreur de suppression",
        message: "Impossible de supprimer cette analyse.",
        type: "error",
        iconType: "faTimesCircle",
      });
    }
  }, [activeSavedAnalysisId, addNotification, publishList]);

  const handleRenameAnalysis = useCallback(async (id: string, name: string) => {
    try {
      const next = await renameSavedAnalysis(id, name);
      publishList(next);
      if (activeSavedAnalysisId === id) setActiveSavedAnalysisName(name.trim());
      addNotification({ title: "Analyse renommée", message: name.trim(), type: "success", iconType: "faCheck" });
    } catch (error) {
      console.error("[SRE] Error renaming saved analysis:", error);
      addNotification({ title: "Renommage impossible", message: "Vérifiez le nom puis réessayez.", type: "error", iconType: "faTimesCircle" });
    }
  }, [activeSavedAnalysisId, addNotification, publishList]);

  const handleDuplicateAnalysis = useCallback(async (id: string) => {
    try {
      const { list, duplicate } = await duplicateSavedAnalysis(id, createAnalysisId);
      publishList(list);
      addNotification({ title: "Analyse dupliquée", message: duplicate.name, type: "success", iconType: "faCheck" });
    } catch (error) {
      console.error("[SRE] Error duplicating saved analysis:", error);
      addNotification({ title: "Duplication impossible", message: "Impossible de dupliquer cette analyse.", type: "error", iconType: "faTimesCircle" });
    }
  }, [addNotification, publishList]);

  const handleLoadAnalysis = useCallback((analysis: SavedAnalysis) => {
    const config = analysis.config;
    const savedAdvancedIndicators = config.advancedIndicators ?? {};

    // Restore workspace market first because changing market intentionally clears
    // symbol/layout bindings; the saved chart state is then applied deterministically.
    if (config.activeMarket) {
      dispatch(setActiveMarket(config.activeMarket));
    }

    dispatch(setChartConfig({
      symbol: config.symbol,
      timeframe: config.timeframe,
      chartType: normalizeChartType(config.chartType),
      indicators: {
        ...config.indicators,
        volumeVisible: config.indicators.volumeVisible ?? true,
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
      atr20: savedAdvancedIndicators.atr20 ?? false,
      natr14: savedAdvancedIndicators.natr14 ?? false,
      donchian: savedAdvancedIndicators.donchian ?? false,
      keltner: savedAdvancedIndicators.keltner ?? false,
      hv10: savedAdvancedIndicators.hv10 ?? false,
      hv20: savedAdvancedIndicators.hv20 ?? false,
      hv30: savedAdvancedIndicators.hv30 ?? false,
      hv60: savedAdvancedIndicators.hv60 ?? false,
      hv90: savedAdvancedIndicators.hv90 ?? false,
      hv252: savedAdvancedIndicators.hv252 ?? false,
      stdDev20: savedAdvancedIndicators.stdDev20 ?? false,
      chaikinVol: savedAdvancedIndicators.chaikinVol ?? false,
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
      kst: savedAdvancedIndicators.kst ?? false,
      linearRegression: savedAdvancedIndicators.linearRegression ?? false,
      ulcerIndex: savedAdvancedIndicators.ulcerIndex ?? false,
      obv: savedAdvancedIndicators.obv ?? false,
      adLine: savedAdvancedIndicators.adLine ?? false,
      cmf20: savedAdvancedIndicators.cmf20 ?? false,
      nvi: savedAdvancedIndicators.nvi ?? false,
      pvi: savedAdvancedIndicators.pvi ?? false,
      chaikinOsc: savedAdvancedIndicators.chaikinOsc ?? false,
      volumeOsc: savedAdvancedIndicators.volumeOsc ?? false,
      vroc14: savedAdvancedIndicators.vroc14 ?? false,
      klinger: savedAdvancedIndicators.klinger ?? false,
      elderForceIndex: savedAdvancedIndicators.elderForceIndex ?? false,
      eom14: savedAdvancedIndicators.eom14 ?? false,
      volumeProfile: savedAdvancedIndicators.volumeProfile ?? false,
      pivotPointsStandard: savedAdvancedIndicators.pivotPointsStandard ?? false,
      pivotPointsFibonacci: savedAdvancedIndicators.pivotPointsFibonacci ?? false,
      movingAverageCrosses: savedAdvancedIndicators.movingAverageCrosses ?? false,
      vwap: savedAdvancedIndicators.vwap ?? false,
      fiftyTwoWeekHigh: savedAdvancedIndicators.fiftyTwoWeekHigh ?? false,
      fiftyTwoWeekLow: savedAdvancedIndicators.fiftyTwoWeekLow ?? false,
      ath: savedAdvancedIndicators.ath ?? false,
      atl: savedAdvancedIndicators.atl ?? false,
      breakoutResistance: savedAdvancedIndicators.breakoutResistance ?? false,
      breakdownSupport: savedAdvancedIndicators.breakdownSupport ?? false,
      gapUp: savedAdvancedIndicators.gapUp ?? false,
      gapDown: savedAdvancedIndicators.gapDown ?? false,
      trueGapUp: savedAdvancedIndicators.trueGapUp ?? false,
      trueGapDown: savedAdvancedIndicators.trueGapDown ?? false,
      gapPct: savedAdvancedIndicators.gapPct ?? false,
      consecutiveUpDays: savedAdvancedIndicators.consecutiveUpDays ?? false,
      consecutiveDownDays: savedAdvancedIndicators.consecutiveDownDays ?? false,
      insideBar: savedAdvancedIndicators.insideBar ?? false,
      outsideBar: savedAdvancedIndicators.outsideBar ?? false,
      doji: savedAdvancedIndicators.doji ?? false,
      longLeggedDoji: savedAdvancedIndicators.longLeggedDoji ?? false,
      rickshawMan: savedAdvancedIndicators.rickshawMan ?? false,
      dragonflyDoji: savedAdvancedIndicators.dragonflyDoji ?? false,
      gravestoneDoji: savedAdvancedIndicators.gravestoneDoji ?? false,
      tristar: savedAdvancedIndicators.tristar ?? false,
      hammer: savedAdvancedIndicators.hammer ?? false,
      hangingMan: savedAdvancedIndicators.hangingMan ?? false,
      takuri: savedAdvancedIndicators.takuri ?? false,
      invertedHammer: savedAdvancedIndicators.invertedHammer ?? false,
      shootingStar: savedAdvancedIndicators.shootingStar ?? false,
      engulfingBullish: savedAdvancedIndicators.engulfingBullish ?? false,
      engulfingBearish: savedAdvancedIndicators.engulfingBearish ?? false,
      haramiBullish: savedAdvancedIndicators.haramiBullish ?? false,
      haramiBearish: savedAdvancedIndicators.haramiBearish ?? false,
      tweezerTop: savedAdvancedIndicators.tweezerTop ?? false,
      tweezerBottom: savedAdvancedIndicators.tweezerBottom ?? false,
      piercingLine: savedAdvancedIndicators.piercingLine ?? false,
      darkCloudCover: savedAdvancedIndicators.darkCloudCover ?? false,
      tasukiGap: savedAdvancedIndicators.tasukiGap ?? false,
      separatingLines: savedAdvancedIndicators.separatingLines ?? false,
      thrusting: savedAdvancedIndicators.thrusting ?? false,
      counterattack: savedAdvancedIndicators.counterattack ?? false,
      morningStar: savedAdvancedIndicators.morningStar ?? false,
      eveningStar: savedAdvancedIndicators.eveningStar ?? false,
      threeWhiteSoldiers: savedAdvancedIndicators.threeWhiteSoldiers ?? false,
      threeBlackCrows: savedAdvancedIndicators.threeBlackCrows ?? false,
      threeInsideUp: savedAdvancedIndicators.threeInsideUp ?? false,
      threeInsideDown: savedAdvancedIndicators.threeInsideDown ?? false,
      uniqueThreeRiver: savedAdvancedIndicators.uniqueThreeRiver ?? false,
      upsideGapTwoCrows: savedAdvancedIndicators.upsideGapTwoCrows ?? false,
      kickerBull: savedAdvancedIndicators.kickerBull ?? false,
      kickerBear: savedAdvancedIndicators.kickerBear ?? false,
      abandonedBabyBull: savedAdvancedIndicators.abandonedBabyBull ?? false,
      abandonedBabyBear: savedAdvancedIndicators.abandonedBabyBear ?? false,
      beltHoldBull: savedAdvancedIndicators.beltHoldBull ?? false,
      beltHoldBear: savedAdvancedIndicators.beltHoldBear ?? false,
      breakawayBull: savedAdvancedIndicators.breakawayBull ?? false,
      breakawayBear: savedAdvancedIndicators.breakawayBear ?? false,
      risingThreeMethods: savedAdvancedIndicators.risingThreeMethods ?? false,
      fallingThreeMethods: savedAdvancedIndicators.fallingThreeMethods ?? false,
      matHold: savedAdvancedIndicators.matHold ?? false,
      gapSideBySideWhite: savedAdvancedIndicators.gapSideBySideWhite ?? false,
      hikkake: savedAdvancedIndicators.hikkake ?? false,
      concealingBabySwallow: savedAdvancedIndicators.concealingBabySwallow ?? false,
      ladderBottom: savedAdvancedIndicators.ladderBottom ?? false,
      stickSandwich: savedAdvancedIndicators.stickSandwich ?? false,
      marubozuBull: savedAdvancedIndicators.marubozuBull ?? false,
      marubozuBear: savedAdvancedIndicators.marubozuBear ?? false,
      spinningTop: savedAdvancedIndicators.spinningTop ?? false,
      ichimoku: savedAdvancedIndicators.ichimoku ?? false,
      stochRsi: savedAdvancedIndicators.stochRsi ?? false,
      bbWidth: savedAdvancedIndicators.bbWidth ?? false,
      bbPercentB: savedAdvancedIndicators.bbPercentB ?? false,
    }));

    if (config.indicatorPeriods) {
      dispatch(setIndicatorPeriods(config.indicatorPeriods));
    }
    if (config.bollingerSettings) {
      dispatch(setBollingerSettings(config.bollingerSettings));
    }
    if (config.chartAppearance) {
      dispatch(setChartAppearance(config.chartAppearance));
    }
    if (config.timeRange) {
      dispatch(setTimeRange(config.timeRange));
    }

    dispatch(clearComparisonSymbols());
    for (const comparisonSymbol of config.comparisonSymbols ?? []) {
      dispatch(addComparisonSymbol(comparisonSymbol));
      const savedSettings = config.comparisonSettings?.[comparisonSymbol];
      if (savedSettings) {
        dispatch(setComparisonSeriesSettings({ symbol: comparisonSymbol, settings: savedSettings }));
      }
    }

    if (config.multiChartLayout) {
      dispatch(hydrateMultiChartLayout(config.multiChartLayout));
    }

    if (Array.isArray(config.drawings)) {
      runtime?.replaceDrawings?.(structuredClone(config.drawings));
    }

    setActiveSavedAnalysisId(analysis.id);
    setActiveSavedAnalysisName(analysis.name);
    dispatch(setModalOpen({ modal: "loadAnalysis", isOpen: false }));

    addNotification({
      title: "Analyse chargée",
      message: `${analysis.name} · ${config.symbol} ${config.timeframe} restaurée`,
      type: "success",
      iconType: "faCheck",
    });
  }, [dispatch, addNotification, runtime]);

  return {
    savedAnalysesList,
    activeSavedAnalysisId,
    activeSavedAnalysisName,
    handleTimeframeChange,
    handleSaveAnalysis,
    handleOpenLoadModal,
    handleLoadAnalysis,
    handleDeleteAnalysis,
    handleRenameAnalysis,
    handleDuplicateAnalysis,
  };
};
// --- EOF ---
