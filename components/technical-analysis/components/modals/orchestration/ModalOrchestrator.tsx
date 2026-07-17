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
import {
  getPreloadedIndicatorsModalComponent,
  loadIndicatorsModalComponent,
  preloadIndicatorsModal,
  resetIndicatorsModalPreload,
  type IndicatorsModalComponent,
} from "./indicatorsModalLoader";
import { normalizeScrollTop, readStoredIndicatorsModalScrollTop, storeIndicatorsModalScrollTop } from "./scrollMemory";

const indicatorSkeletonGroups = [
  { id: "moving-averages", rows: [6, 5] },
  { id: "signals", rows: [3, 3] },
  { id: "catalog", rows: [4, 4, 3] },
] as const;

const INDICATORS_MODAL_IDLE_PRELOAD_TIMEOUT_MS = 1_500;
const INDICATORS_MODAL_STALL_TIMEOUT_MS = 3_500;

type IndicatorsModalLoadState = "loading" | "stalled" | "failed";

type IndicatorsModalLoadingProps = {
  state?: IndicatorsModalLoadState;
  errorMessage?: string | null;
  onClose?: () => void;
  onRetry?: () => void;
};

const IndicatorsModalLoading = ({
  state = "loading",
  errorMessage,
  onClose,
  onRetry,
}: IndicatorsModalLoadingProps = {}) => {
  const isActionable = state === "stalled" || state === "failed";
  const statusTitle = state === "failed"
    ? "Chargement impossible"
    : state === "stalled"
      ? "Chargement anormalement long"
      : null;
  const statusMessage = state === "failed"
    ? errorMessage || "Le catalogue d'indicateurs n'a pas pu être chargé."
    : state === "stalled"
      ? "Le catalogue prend trop de temps à charger. Vous pouvez relancer le chargement ou fermer ce modal."
      : null;

  return (
    <BaseModal
      isOpen
      onClose={onClose ?? (() => undefined)}
      title="Indicateurs Techniques"
      icon={<i className="bi bi-activity me-2" aria-hidden="true"></i>}
      maxWidth="750px"
      className="gp-indicators-modal"
      overlayClassName="gp-indicators-modal-overlay"
      draggable
      showCloseButton={isActionable}
      footer={
        isActionable ? (
          <div className="gp-indicators-loading__footer gp-indicators-loading__footer--actions">
            <button className="btn btn-sm btn-outline-light" onClick={onClose} type="button">
              Fermer
            </button>
            <button className="btn btn-sm btn-warning" onClick={onRetry} type="button">
              Réessayer
            </button>
          </div>
        ) : (
          <div className="gp-indicators-loading__footer" aria-hidden="true">
            <span className="gp-indicators-loading__action is-loading-skeleton" />
            <span className="gp-indicators-loading__action gp-indicators-loading__action--primary is-loading-skeleton" />
          </div>
        )
      }
    >
      <div
        className={`gp-indicators-loading gp-indicators-loading--${state}`}
        aria-busy={state === "loading"}
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

        {statusTitle && statusMessage && (
          <div className={`gp-indicators-loading__notice gp-indicators-loading__notice--${state}`} role="alert">
            <strong>{statusTitle}</strong>
            <span>{statusMessage}</span>
          </div>
        )}

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
};

// ============================================================================
// DYNAMIC IMPORTS (Code Splitting)
// ============================================================================
const SearchSymbolModal = dynamic(
  () => import("../search-symbol/SearchSymbolModal").then((module) => module.SearchSymbolModal),
  { ssr: false, loading: () => null }
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
const ImageNoteModal = dynamic(
  () => import("../drawings/ImageNoteModal").then((module) => module.ImageNoteModal),
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
  replaceImageNoteAsset?: (
    id: string,
    validated: import("../../../lib/imageNote/imageNoteValidation").ValidatedImage,
    transparency: number,
  ) => Promise<void>;
  createImageNoteDrawing: (
    validated: import("../../../lib/imageNote/imageNoteValidation").ValidatedImage,
    transparency: number,
  ) => Promise<string | null>;

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
  replaceImageNoteAsset,
  createImageNoteDrawing,
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
  const indicatorsModalLoadRequestRef = useRef(0);
  const [LoadedIndicatorsModal, setLoadedIndicatorsModal] = useState<IndicatorsModalComponent | null>(() => getPreloadedIndicatorsModalComponent());
  const [indicatorsModalLoadState, setIndicatorsModalLoadState] = useState<IndicatorsModalLoadState>("loading");
  const [indicatorsModalLoadError, setIndicatorsModalLoadError] = useState<string | null>(null);

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

  const ensureIndicatorsModalLoaded = useCallback((options: { forceRetry?: boolean } = {}) => {
    if (options.forceRetry) {
      resetIndicatorsModalPreload();
      setLoadedIndicatorsModal(null);
    }

    const preloadedComponent = getPreloadedIndicatorsModalComponent();
    if (preloadedComponent) {
      setLoadedIndicatorsModal(() => preloadedComponent);
      setIndicatorsModalLoadState("loading");
      setIndicatorsModalLoadError(null);
      return;
    }

    const requestId = indicatorsModalLoadRequestRef.current + 1;
    indicatorsModalLoadRequestRef.current = requestId;
    setIndicatorsModalLoadState("loading");
    setIndicatorsModalLoadError(null);

    let stallTimerId: number | null = null;
    if (typeof window !== "undefined") {
      stallTimerId = window.setTimeout(() => {
        if (indicatorsModalLoadRequestRef.current !== requestId) return;
        setIndicatorsModalLoadState((current) => current === "loading" ? "stalled" : current);
      }, INDICATORS_MODAL_STALL_TIMEOUT_MS);
    }

    void loadIndicatorsModalComponent()
      .then((Component) => {
        if (indicatorsModalLoadRequestRef.current !== requestId) return;
        setLoadedIndicatorsModal(() => Component);
        setIndicatorsModalLoadState("loading");
        setIndicatorsModalLoadError(null);
      })
      .catch((error: unknown) => {
        if (indicatorsModalLoadRequestRef.current !== requestId) return;
        resetIndicatorsModalPreload();
        setLoadedIndicatorsModal(null);
        setIndicatorsModalLoadState("failed");
        setIndicatorsModalLoadError(error instanceof Error ? error.message : "Erreur inconnue pendant le chargement du catalogue.");
      })
      .finally(() => {
        if (stallTimerId !== null && typeof window !== "undefined") {
          window.clearTimeout(stallTimerId);
        }
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    let idleId: number | null = null;
    let timeoutId: number | null = null;
    const preloadWhenIdle = () => {
      void preloadIndicatorsModal()
        .then((loadedModule) => {
          if (cancelled) return;
          setLoadedIndicatorsModal(() => loadedModule.IndicatorsModal as IndicatorsModalComponent);
        })
        .catch(() => undefined);
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout?: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(preloadWhenIdle, { timeout: INDICATORS_MODAL_IDLE_PRELOAD_TIMEOUT_MS });
    } else {
      timeoutId = window.setTimeout(preloadWhenIdle, INDICATORS_MODAL_IDLE_PRELOAD_TIMEOUT_MS);
    }

    return () => {
      cancelled = true;
      if (idleId !== null) idleWindow.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (modals.indicators) ensureIndicatorsModalLoaded();
  }, [ensureIndicatorsModalLoaded, modals.indicators]);

  const retryIndicatorsModalLoad = useCallback(() => {
    ensureIndicatorsModalLoaded({ forceRetry: true });
  }, [ensureIndicatorsModalLoaded]);

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
        LoadedIndicatorsModal ? (
          <LoadedIndicatorsModal
            isOpen={modals.indicators}
            onClose={() => closeModal("indicators")}
            initialScrollTop={indicatorsModalScrollTopRef.current || readStoredIndicatorsModalScrollTop()}
            onScrollPositionChange={rememberIndicatorsModalScrollTop}
            onRevealObjectIds={onRevealObjectIds}
          />
        ) : (
          <IndicatorsModalLoading
            state={indicatorsModalLoadState}
            errorMessage={indicatorsModalLoadError}
            onClose={() => closeModal("indicators")}
            onRetry={retryIndicatorsModalLoad}
          />
        )
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
          replaceImageNoteAsset={replaceImageNoteAsset}
        />
      )}

      {modals.imageNote && (
        <ImageNoteModal
          isOpen={modals.imageNote}
          onClose={() => closeModal("imageNote")}
          createImageNoteDrawing={createImageNoteDrawing}
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
