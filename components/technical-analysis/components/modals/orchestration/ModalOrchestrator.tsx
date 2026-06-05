"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  useDispatch,
  useSelector } from "react-redux";
import {
  setModalOpen,
  setChartConfig,
  addComparisonSymbol,
  setSearchMode,
  setAnonyme,
  setSelectedPseudo,
  applyTemplate,
  setReplaySpeed,
} from "../../../store/technicalAnalysisSlice";
import {
  selectModals,
  selectUiState,
  selectChartConfig,
} from "../../../store/selectors";
import type { Drawing } from "../../../config/drawing/drawingModelTypes";
import type { IndicatorObjectId } from "../../../config/object-tree/indicatorObjectVisibility";
import type { ChartDataPoint } from "../../../lib/Indicators/TechnicalIndicators";
import { ANONYMOUS_PSEUDOS } from "../../../config/ui/anonymousPseudos";
import { useModalOrchestrator } from "../../../hooks/useModalOrchestrator";
import { BaseModal } from "../../common/primitives/BaseModal";
import { loadIndicatorsModalComponent } from "./indicatorsModalLoader";
import { normalizeScrollTop, readStoredIndicatorsModalScrollTop, storeIndicatorsModalScrollTop } from "./scrollMemory";

const indicatorSkeletonGroups = [
  { id: "moving-averages", rows: [6, 5] },
  { id: "signals", rows: [3, 3] },
  { id: "catalog", rows: [4, 4, 3] },
] as const;

const IndicatorsModalLoading = () => (
  <BaseModal
    isOpen
    onClose={() => undefined}
    title="Indicateurs Techniques"
    icon={<i className="bi bi-activity me-2" aria-hidden="true"></i>}
    maxWidth="750px"
    className="gp-indicators-modal"
    overlayClassName="gp-indicators-modal-overlay"
    draggable
    showCloseButton={false}
    footer={
      <div className="gp-indicators-loading__footer" aria-hidden="true">
        <span className="gp-indicators-loading__action is-loading-skeleton" />
        <span className="gp-indicators-loading__action gp-indicators-loading__action--primary is-loading-skeleton" />
      </div>
    }
  >
    <div
      className="gp-indicators-loading"
      aria-busy="true"
      aria-label="Chargement du catalogue d'indicateurs techniques"
      role="status"
    >
      <div className="gp-indicator-search-panel gp-indicators-loading__search">
        <div className="gp-indicators-loading__search-box" aria-hidden="true">
          <span className="gp-indicators-loading__icon is-loading-skeleton" />
          <span className="gp-indicators-loading__line gp-indicators-loading__line--search is-loading-skeleton" />
        </div>
        <div className="gp-indicators-loading__meta" aria-hidden="true">
          <span className="gp-indicators-loading__line gp-indicators-loading__line--count is-loading-skeleton" />
          <span className="gp-indicators-loading__line gp-indicators-loading__line--filter is-loading-skeleton" />
        </div>
      </div>

      <div className="gp-indicators-loading__catalog" aria-hidden="true">
        {indicatorSkeletonGroups.map((group) => (
          <section className="gp-indicators-loading__family" key={group.id}>
            <div className="gp-indicators-loading__family-header">
              <span className="gp-indicators-loading__accent is-loading-skeleton" />
              <span className="gp-indicators-loading__line gp-indicators-loading__line--title is-loading-skeleton" />
              <span className="gp-indicators-loading__line gp-indicators-loading__line--code is-loading-skeleton" />
            </div>
            <div className="gp-indicators-loading__chip-groups">
              {group.rows.map((chipCount, rowIndex) => (
                <div className="gp-indicators-loading__chip-row" key={group.id + "-row-" + rowIndex}>
                  {Array.from({ length: chipCount }, (_, chipIndex) => (
                    <span
                      className="gp-indicators-loading__chip is-loading-skeleton"
                      key={group.id + "-chip-" + rowIndex + "-" + chipIndex}
                    />
                  ))}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  </BaseModal>
);

// ============================================================================
// DYNAMIC IMPORTS (Code Splitting)
// ============================================================================
const SearchSymbolModal = dynamic(
  () => import("../search-symbol/SearchSymbolModal").then((module) => module.SearchSymbolModal),
  { ssr: false, loading: () => null }
);
const IndicatorsModal = dynamic(
  loadIndicatorsModalComponent,
  { ssr: false, loading: IndicatorsModalLoading }
);
const ReplayModal = dynamic(
  () => import("../replay/ReplayModal").then((module) => module.ReplayModal),
  { ssr: false, loading: () => null }
);
const IndicatorTemplatesModal = dynamic(
  () => import("../indicators/templates/IndicatorTemplatesModal").then((module) => module.IndicatorTemplatesModal),
  { ssr: false, loading: () => null }
);
const LoadAnalysisModal = dynamic(
  () => import("../analysis/LoadAnalysisModal").then((module) => module.LoadAnalysisModal),
  { ssr: false, loading: () => null }
);
const GlobalSettingsModal = dynamic(
  () => import("../settings/GlobalSettingsModal").then((module) => module.GlobalSettingsModal),
  { ssr: false, loading: () => null }
);
const DrawingSettingsModal = dynamic(
  () => import("../drawings/DrawingSettingsModal").then((module) => module.DrawingSettingsModal),
  { ssr: false, loading: () => null }
);
const MoreOptionsModal = dynamic(
  () => import("../more-options/MoreOptionsModal").then((module) => module.MoreOptionsModal),
  { ssr: false, loading: () => null }
);
const DatePickerModal = dynamic(
  () => import("../date-picker/DatePickerModal").then((module) => module.DatePickerModal),
  { ssr: false, loading: () => null }
);
const AlertsModal = dynamic(
  () => import("../alerts/AlertsModal").then((module) => module.AlertsModal),
  { ssr: false, loading: () => null }
);
const PublishOptionsModal = dynamic(
  () => import("../publish/PublishOptionsModal").then((module) => module.PublishOptionsModal),
  { ssr: false, loading: () => null }
);

// ============================================================================
// TYPES
// ============================================================================
export interface ModalOrchestratorProps {
  // Canvas / Drawing State (High-Frequency, kept out of Redux)
  dr: Drawing | undefined;
  updateDrawing: (id: string, updates: Partial<Drawing>) => void;

  // Data & Simulation State
  startReplay: () => void;
  setChartData: React.Dispatch<React.SetStateAction<ChartDataPoint[]>>;
  onRevealObjectIds?: (objectIds: readonly IndicatorObjectId[]) => void;

}

// ============================================================================
// COMPONENT
// ============================================================================
export const ModalOrchestrator: React.FC<ModalOrchestratorProps> = ({
  dr,
  updateDrawing,
  startReplay,
  setChartData,
  onRevealObjectIds,
}) => {
  const dispatch = useDispatch();
  const { savedAnalysesList, handleLoadAnalysis, handleDeleteAnalysis, openLoadModal } = useModalOrchestrator(setChartData);

  // --- Global State ---
  const modals = useSelector(selectModals);
  const chartConfig = useSelector(selectChartConfig);
  const uiState = useSelector(selectUiState);
  const replaySpeed = uiState.replay.speed;
  const searchMode = uiState.searchMode;
  const [isPublishPseudoDropdownOpen, setIsPublishPseudoDropdownOpen] = useState(false);
  const indicatorsModalScrollTopRef = useRef(0);

  // --- Handlers ---
  // [TENOR 2026 FIX] Centralized modal closing to DRY up the JSX
  const closeModal = useCallback((modalName: keyof typeof modals) => {
    dispatch(setModalOpen({ modal: modalName, isOpen: false }));
  }, [dispatch]);

  const rememberIndicatorsModalScrollTop = useCallback((scrollTop: number) => {
    const normalizedScrollTop = normalizeScrollTop(scrollTop);
    indicatorsModalScrollTopRef.current = normalizedScrollTop;
    storeIndicatorsModalScrollTop(normalizedScrollTop);
  }, []);

  useEffect(() => {
    indicatorsModalScrollTopRef.current = readStoredIndicatorsModalScrollTop();
  }, []);

  const didHydrateLoadAnalysisRef = useRef(false);

  useEffect(() => {
    if (!modals.loadAnalysis) {
      didHydrateLoadAnalysisRef.current = false;
      return;
    }

    if (didHydrateLoadAnalysisRef.current) return;
    didHydrateLoadAnalysisRef.current = true;
    void openLoadModal();
  }, [modals.loadAnalysis, openLoadModal]);

  const replaceChartSymbol = useCallback((symbol: string) => {
    dispatch(setChartConfig({ symbol }));
    dispatch(setSearchMode("replace"));
    void import("../../../lib/Indicators/TechnicalIndicators").then(({ generateInitialData }) => {
      setChartData(generateInitialData(200));
    });
  }, [dispatch, setChartData]);

  const applyDateRangeData = useCallback(() => {
    const sampleSize = Math.floor(Math.random() * 300) + 100;
    void import("../../../lib/Indicators/TechnicalIndicators").then(({ generateInitialData }) => {
      setChartData(generateInitialData(sampleSize));
    });
  }, [setChartData]);

  return (
    <>
      {modals.search && (
        <SearchSymbolModal
          isOpen={modals.search}
          onClose={() => closeModal("search")}
          initialMode={searchMode}
          currentSymbol={chartConfig.symbol}
          comparisonSymbols={uiState.comparisonSymbols}
          onSearch={(symbol, mode) => {
            if (mode === "compare") {
              dispatch(addComparisonSymbol(symbol));
            } else {
              replaceChartSymbol(symbol);
            }
          }}
        />
      )}

      {modals.indicators && (
        <IndicatorsModal
          isOpen={modals.indicators}
          onClose={() => closeModal("indicators")}
          initialScrollTop={indicatorsModalScrollTopRef.current || readStoredIndicatorsModalScrollTop()}
          onScrollPositionChange={rememberIndicatorsModalScrollTop}
          onRevealObjectIds={onRevealObjectIds}
        />
      )}

      {modals.replay && (
        <ReplayModal
          isOpen={modals.replay}
          onClose={() => closeModal("replay")}
          replaySpeed={replaySpeed}
          setReplaySpeed={(speed) => dispatch(setReplaySpeed(speed))}
          onStart={startReplay}
        />
      )}

      {modals.templates && (
        <IndicatorTemplatesModal
          isOpen={modals.templates}
          onClose={() => closeModal("templates")}
          onApplyTemplate={(type) => dispatch(applyTemplate(type))}
        />
      )}

      {modals.loadAnalysis && (
        <LoadAnalysisModal
          isOpen={modals.loadAnalysis}
          onClose={() => closeModal("loadAnalysis")}
          savedAnalysesList={savedAnalysesList}
          onLoad={handleLoadAnalysis}
          onDelete={handleDeleteAnalysis}
        />
      )}

      {modals.settings && (
        <GlobalSettingsModal
          isOpen={modals.settings}
          onClose={() => closeModal("settings")}
        />
      )}

      {modals.drawingSettings && dr && (
        <DrawingSettingsModal
          isOpen={modals.drawingSettings}
          onClose={() => closeModal("drawingSettings")}
          dr={dr}
          updateDrawing={updateDrawing}
        />
      )}

      {modals.options && (
        <MoreOptionsModal
          isOpen={modals.options}
          onClose={() => closeModal("options")}
        />
      )}

      {modals.datePicker && (
        <DatePickerModal
          isOpen={modals.datePicker}
          onClose={() => closeModal("datePicker")}
          onApply={(range) => {
            if (range.start && range.end) {
              applyDateRangeData();
              closeModal("datePicker");
            }
          }}
        />
      )}

      {modals.alerts && (
        <AlertsModal
          isOpen={modals.alerts}
          onClose={() => closeModal("alerts")}
          btnStyle={"btn-california"}
        />
      )}

      {modals.publish && (
        <PublishOptionsModal
          isOpen={modals.publish}
          onClose={() => closeModal("publish")}
          isAnonyme={uiState.isAnonyme}
          setIsAnonyme={(value) => dispatch(setAnonyme(value))}
          selectedPseudo={uiState.selectedPseudo}
          isPseudoDropdownOpen={isPublishPseudoDropdownOpen}
          setIsPseudoDropdownOpen={setIsPublishPseudoDropdownOpen}
          setSelectedPseudo={(value) => dispatch(setSelectedPseudo(value))}
          ANONYMOUS_PSEUDOS={[...ANONYMOUS_PSEUDOS]}
        />
      )}
    </>
  );
};

// --- EOF ---
