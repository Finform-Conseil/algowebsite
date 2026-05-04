"use client";

import React, { useCallback } from "react";
import dynamic from "next/dynamic";
import { useDispatch, useSelector } from "react-redux";
import {
  setModalOpen,
  setChartConfig,
  addComparisonSymbol,
  setSearchMode,
  applyTemplate,
  setReplaySpeed,
  selectModals,
  selectUiState,
} from "../../store/technicalAnalysisSlice";
import { Drawing } from "../../config/TechnicalAnalysisTypes";
import { ChartDataPoint } from "../../lib/Indicators/TechnicalIndicators";
import { useModalOrchestrator } from "../../hooks/useModalOrchestrator";
import { generateInitialData as GENERATE_INITIAL_DATA } from "../../lib/Indicators/TechnicalIndicators";
import s from "../../style.module.scss";

// ============================================================================
// DYNAMIC IMPORTS (Code Splitting)
// ============================================================================
const SearchSymbolModal = dynamic(
  () => import("./SearchSymbolModal").then((module) => module.SearchSymbolModal),
  { ssr: false, loading: () => null }
);
const IndicatorsModal = dynamic(
  () => import("./IndicatorsModal").then((module) => module.IndicatorsModal),
  { ssr: false, loading: () => null }
);
const ReplayModal = dynamic(
  () => import("./ReplayModal").then((module) => module.ReplayModal),
  { ssr: false, loading: () => null }
);
const IndicatorTemplatesModal = dynamic(
  () => import("./IndicatorTemplatesModal").then((module) => module.IndicatorTemplatesModal),
  { ssr: false, loading: () => null }
);
const LoadAnalysisModal = dynamic(
  () => import("./LoadAnalysisModal").then((module) => module.LoadAnalysisModal),
  { ssr: false, loading: () => null }
);
const GlobalSettingsModal = dynamic(
  () => import("./GlobalSettingsModal").then((module) => module.GlobalSettingsModal),
  { ssr: false, loading: () => null }
);
const DrawingSettingsModal = dynamic(
  () => import("./DrawingSettingsModal").then((module) => module.DrawingSettingsModal),
  { ssr: false, loading: () => null }
);
const MoreOptionsModal = dynamic(
  () => import("./MoreOptionsModal").then((module) => module.MoreOptionsModal),
  { ssr: false, loading: () => null }
);
const DatePickerModal = dynamic(
  () => import("./DatePickerModal").then((module) => module.DatePickerModal),
  { ssr: false, loading: () => null }
);
const AlertsModal = dynamic(
  () => import("./AlertsModal").then((module) => module.AlertsModal),
  { ssr: false, loading: () => null }
);

// ============================================================================
// TYPES
// ============================================================================
interface ModalOrchestratorProps {
  // Canvas / Drawing State (High-Frequency, kept out of Redux)
  dr: Drawing | undefined;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;
  
  // Data & Simulation State
  startReplay: () => void;
  setChartData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>;
  
  // [TENOR 2026 FIX] Soft Deprecation: Made optional to avoid breaking TechnicalAnalysis.tsx
  // The orchestrator now imports its own styles directly to eliminate prop-drilling.
  s?: { [key: string]: string };
}

// ============================================================================
// COMPONENT
// ============================================================================
export const ModalOrchestrator: React.FC<ModalOrchestratorProps> = ({
  dr,
  updateDrawing,
  startReplay,
  setChartData,
}) => {
  const dispatch = useDispatch();
  const { savedAnalysesList, handleLoadAnalysis, handleDeleteAnalysis } = useModalOrchestrator(setChartData);

  // --- Global State ---
  const modals = useSelector(selectModals);
  const replaySpeed = useSelector(selectUiState).replay.speed;
  const searchMode = useSelector(selectUiState).searchMode;

  // --- Handlers ---
  // [TENOR 2026 FIX] Centralized modal closing to DRY up the JSX
  const closeModal = useCallback((modalName: keyof typeof modals) => {
    dispatch(setModalOpen({ modal: modalName, isOpen: false }));
  }, [dispatch]);

  return (
    <>
      <SearchSymbolModal
        isOpen={modals.search}
        onClose={() => closeModal("search")}
        onSearch={(symbol) => {
          if (searchMode === "compare") {
            dispatch(addComparisonSymbol(symbol));
          } else {
            dispatch(setChartConfig({ symbol }));
            // [TENOR 2026] Mock data generation for search. In production, this triggers useMarketData.
            setChartData(GENERATE_INITIAL_DATA(200));
          }
          dispatch(setSearchMode("replace"));
        }}
      />

      <IndicatorsModal
        isOpen={modals.indicators}
        onClose={() => closeModal("indicators")}
        // [TENOR 2026 FIX] SCAR-SRP-01: Removed prop-drilling. 
        // IndicatorsModal is now a Smart Component reading directly from Redux.
      />

      <ReplayModal
        isOpen={modals.replay}
        onClose={() => closeModal("replay")}
        replaySpeed={replaySpeed}
        setReplaySpeed={(speed) => dispatch(setReplaySpeed(speed))}
        onStart={startReplay}
      />

      <IndicatorTemplatesModal
        isOpen={modals.templates}
        onClose={() => closeModal("templates")}
        onApplyTemplate={(type) => dispatch(applyTemplate(type))}
      />

      <LoadAnalysisModal
        isOpen={modals.loadAnalysis}
        onClose={() => closeModal("loadAnalysis")}
        savedAnalysesList={savedAnalysesList}
        onLoad={handleLoadAnalysis}
        onDelete={handleDeleteAnalysis}
      />

      <GlobalSettingsModal
        isOpen={modals.settings}
        onClose={() => closeModal("settings")}
      />

      {modals.drawingSettings && dr && (
        <DrawingSettingsModal
          isOpen={modals.drawingSettings}
          onClose={() => closeModal("drawingSettings")}
          dr={dr}
          updateDrawing={updateDrawing}
        />
      )}

      <MoreOptionsModal
        isOpen={modals.options}
        onClose={() => closeModal("options")}
      />

      <DatePickerModal
        isOpen={modals.datePicker}
        onClose={() => closeModal("datePicker")}
        onApply={(range) => {
          if (range.start && range.end) {
            setChartData(GENERATE_INITIAL_DATA(Math.floor(Math.random() * 300) + 100));
            closeModal("datePicker");
          }
        }}
      />

      <AlertsModal
        isOpen={modals.alerts}
        onClose={() => closeModal("alerts")}
        btnStyle={s["btn-california"]}
      />
    </>
  );
};

// --- EOF ---
