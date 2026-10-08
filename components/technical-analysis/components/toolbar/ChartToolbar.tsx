"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import clsx from "clsx";
import { useSelector } from "react-redux";
import { useAppDispatch } from "@/core/infra/store/hooks";
import { useLocaleNavigation } from "@/components/navigation/useLocaleNavigation";
import { SettingsToggle } from "../common/inputs/SettingsField";
import {
  setModalOpen,
  setChartType,
  setChartConfig,
  toggleZenMode,
  setAnonyme,
  setSelectedPseudo,
  setSearchMode,
} from "../../store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectUiState,
  selectActiveMarket,
} from "../../store/selectors";
import { LayoutSetupControl } from "./LayoutSetupControl";
import { FloatingMenu } from "../common/primitives/FloatingMenu";
import {
  CHART_TYPE_REGISTRY,
  normalizeChartType,
  type ChartType,
} from "../../lib/chart-types";
import { preloadIndicatorsModal } from "../modals/orchestration/indicatorsModalLoader";
import { actionApi } from "@/core/infra/store/api/action.api";
import { ANONYMOUS_PSEUDOS } from "../../config/ui/anonymousPseudos";
import { useTickerSelector } from "@/components/design-system/commons/TickerSelectorModal";
import { buildTickerCatalogQuery } from "@/components/design-system/commons/TickerSelectorModal/context/tickerCatalogPolicy";
import { ChartTypeMenuContent } from "./chart/ChartTypeMenuContent";
import { renderChartTypeIcon } from "./chart/chartTypeIcons";
import {
  horizontalToolbarClassNames,
  publishButtonClassNames,
  toolbarButtonClassNames,
  toolbarSecondaryButtonClassNames,
} from "./chart/toolbarClassNames";

interface ChartToolbarProps {
  userInitials: string;
  displaySymbol: string;
  openTickerSelector: () => void;
  isReplaySelectingStart: boolean;
  onReplayRequest: () => void;
  onTimeframeChange: (timeframe: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  activeSavedAnalysisId: string | null;
  activeSavedAnalysisName: string | null;
  onSaveAnalysis: (options?: { name?: string; mode?: "update" | "copy" }) => unknown | Promise<unknown>;
  onOpenLoadModal: () => void | Promise<void>;
  onOpenKeyboardShortcuts: () => void;
  onSnapshotDownload: () => void | Promise<void>;
  onSnapshotCopy: () => void | Promise<void>;
  onSnapshotOpen: () => void | Promise<void>;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  userInitials,
  displaySymbol,
  openTickerSelector,
  isReplaySelectingStart,
  onReplayRequest,
  onTimeframeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  activeSavedAnalysisId,
  activeSavedAnalysisName,
  onSaveAnalysis,
  onOpenLoadModal,
  onOpenKeyboardShortcuts,
  onSnapshotDownload,
  onSnapshotCopy,
  onSnapshotOpen,
}) => {
  const dispatch = useAppDispatch();
  const { openLayoutMarketDirectory } = useTickerSelector();
  const chartConfig = useSelector(selectChartConfig);
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const uiState = useSelector(selectUiState);
  const activeMarket = useSelector(selectActiveMarket);
  const { locale, switchLocale } = useLocaleNavigation();
  const chartTypeT = useTranslations("technicalAnalysis.chartTypes");
  const marketLabel = locale === "fr" ? "Bourse" : "Exchange";
  const isMultiChartMode = uiState.multiChartLayout.isEnabled
    && uiState.multiChartLayout.charts.length > 1;
  const activeLayoutCell = uiState.multiChartLayout.charts.find(
    (chart) => chart.chartId === uiState.multiChartLayout.activeChartId,
  );
  const displayedMarketTicker = isMultiChartMode
    ? activeLayoutCell?.exchange?.trim().toUpperCase() || activeMarket.ticker
    : activeMarket.ticker;
  const marketTitle = isMultiChartMode
    ? (locale === "fr"
      ? `Bourse du graphique actif : ${displayedMarketTicker}. Cliquer pour changer uniquement ce panneau.`
      : `Active chart exchange: ${displayedMarketTicker}. Click to change only this panel.`)
    : (locale === "fr"
      ? `Marché actif : ${activeMarket.name} (${activeMarket.currency}). Cliquer pour changer.`
      : `Active market: ${activeMarket.name} (${activeMarket.currency}). Click to change.`);

  const prefetchCompareSymbols = useCallback(() => {
    const marketTicker = displayedMarketTicker.trim().toUpperCase();
    if (!marketTicker) return;
    dispatch(actionApi.util.prefetch("getAllActions", buildTickerCatalogQuery(marketTicker, 1), { ifOlderThan: 30 }));
  }, [dispatch, displayedMarketTicker]);

  const [isPseudoDropdownOpen, setIsPseudoDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const pseudoDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [profileAnchorRect, setProfileAnchorRect] = useState<DOMRect | null>(null);
  const profileButtonRef = useRef<HTMLSpanElement>(null);
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = useState(false);
  const [chartTypeAnchorRect, setChartTypeAnchorRect] = useState<DOMRect | null>(null);
  const chartTypeButtonRef = useRef<HTMLButtonElement>(null);
  const [isSnapshotMenuOpen, setIsSnapshotMenuOpen] = useState(false);
  const [snapshotAnchorRect, setSnapshotAnchorRect] = useState<DOMRect | null>(null);
  const snapshotButtonRef = useRef<HTMLButtonElement>(null);
  const [isSaveMenuOpen, setIsSaveMenuOpen] = useState(false);
  const [saveAnchorRect, setSaveAnchorRect] = useState<DOMRect | null>(null);
  const [saveDraftName, setSaveDraftName] = useState("");
  const [isSavingAnalysis, setIsSavingAnalysis] = useState(false);
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const openSaveMenu = useCallback(() => {
    const rect = saveButtonRef.current?.getBoundingClientRect() ?? null;
    setSaveAnchorRect(rect);
    setSaveDraftName(activeSavedAnalysisName?.trim() || `${displaySymbol} · ${chartConfig.timeframe}`);
    setIsSaveMenuOpen(true);
  }, [activeSavedAnalysisName, chartConfig.timeframe, displaySymbol]);

  const submitSave = useCallback(async (mode: "update" | "copy") => {
    const name = saveDraftName.trim();
    if (!name || isSavingAnalysis) return;
    setIsSavingAnalysis(true);
    try {
      const result = await onSaveAnalysis({ name, mode });
      if (result !== null) setIsSaveMenuOpen(false);
    } finally {
      setIsSavingAnalysis(false);
    }
  }, [isSavingAnalysis, onSaveAnalysis, saveDraftName]);

  const activeChartType = normalizeChartType(chartConfig.chartType);
  const activeChartTypeEntry = CHART_TYPE_REGISTRY[activeChartType];
  const isActiveIndex = activeLayoutCell
    && "sourceKind" in activeLayoutCell
    && activeLayoutCell.sourceKind === "index";
  const isVolumeAttached = chartConfig.indicators.volume === true;
  const volumeToggleLabel = isActiveIndex
    ? (locale === "fr" ? "Volume indisponible pour un indice close-only" : "Volume unavailable for a close-only index")
    : locale === "fr"
      ? (isVolumeAttached ? "Masquer le volume" : "Afficher le volume")
      : (isVolumeAttached ? "Hide volume" : "Show volume");

  const handleVolumeToggle = useCallback(() => {
    if (isActiveIndex) return;
    dispatch(setChartConfig({
      indicators: {
        ...chartConfig.indicators,
        volume: !isVolumeAttached,
        // Re-attaching from the toolbar must always produce a visible study.
        // Study-level hide/show remains available from the Volume legend.
        volumeVisible: !isVolumeAttached ? true : chartConfig.indicators.volumeVisible,
      },
    }));
  }, [chartConfig.indicators, dispatch, isActiveIndex, isVolumeAttached]);

  const handleChartTypeMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = chartTypeButtonRef.current?.getBoundingClientRect() ?? null;
    setChartTypeAnchorRect(rect);
    setIsChartTypeMenuOpen((current) => !current);
  };

  const handleChartTypeSelect = (type: ChartType) => {
    dispatch(setChartType(type));
    setIsChartTypeMenuOpen(false);
  };

  const toggleSnapshotMenu = () => {
    const rect = snapshotButtonRef.current?.getBoundingClientRect() ?? null;
    setSnapshotAnchorRect(rect);
    setIsSnapshotMenuOpen((current) => !current);
  };

  const runSnapshotAction = (action: () => void | Promise<void>) => {
    setIsSnapshotMenuOpen(false);
    void action();
  };

  const openPseudoDropdownFromElement = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
    setIsPseudoDropdownOpen(true);
  };

  const togglePseudoDropdownFromElement = (element: HTMLElement) => {
    if (isPseudoDropdownOpen) {
      setIsPseudoDropdownOpen(false);
      return;
    }
    openPseudoDropdownFromElement(element);
  };

  const handleTogglePseudoDropdown = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsProfileMenuOpen(false);
    togglePseudoDropdownFromElement(e.currentTarget);
  };

  const handleProfileToggle = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setIsPseudoDropdownOpen(false);
    setProfileAnchorRect(e.currentTarget.getBoundingClientRect());
    setIsProfileMenuOpen((current) => !current);
  };

  const openMarketSelector = () => {
    if (isMultiChartMode && activeLayoutCell?.chartId) {
      openLayoutMarketDirectory(activeLayoutCell.chartId);
    }
    dispatch(setModalOpen({ modal: "marketSelector", isOpen: true }));
  };

  const handleMarketSelectorKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openMarketSelector();
  };

  useEffect(() => {
    if (!isPseudoDropdownOpen) return;
    const handleClickOutside = () => setIsPseudoDropdownOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isPseudoDropdownOpen]);

  const safeDisplaySymbol = displaySymbol.trim() || "—";
  const hasActiveOverlayIndicator =
    (chartConfig.indicators.sma && chartConfig.indicators.activeSma.length > 0) ||
    (chartConfig.indicators.ema && chartConfig.indicators.activeEma.length > 0) ||
    Object.values(advancedIndicators).some(Boolean);

  return (
    <div
      className={clsx(horizontalToolbarClassNames)}
      // [TENOR 2026 SRE] Inline safety styles to prevent Flexbox Overflow
      style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}
    >
      {/* ===================================================================== */}
      {/* 1. LEFT SECTION (Fixed Width) */}
      {/* ===================================================================== */}
      <div className={"gp-toolbar-left-cluster"}>
        <div className={clsx("gp-timeframe-badge-wrapper", "")}>
          <span
            className={clsx("badge rounded-circle ", "gp-badge-gold")}
            style={{
              position: "relative",
              fontSize: "0.9rem",
              lineHeight: "1 !important",
              cursor: "pointer",
              display: "flex !important",
              alignItems: "center !important",
              justifyContent: "center !important",
              marginLeft: "4px",
            }}
            ref={profileButtonRef}
            role="button"
            tabIndex={0}
            aria-label="Menu du profil"
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            onClick={handleProfileToggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setIsPseudoDropdownOpen(false);
                setProfileAnchorRect(event.currentTarget.getBoundingClientRect());
                setIsProfileMenuOpen((current) => !current);
              }
            }}
          >
            {userInitials === "DA" ? <i className="bi bi-person-circle" style={{ fontSize: "1.2rem" }}></i> : userInitials}
          </span>
        </div>

        <FloatingMenu
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          anchorRect={profileAnchorRect}
          anchorRef={profileButtonRef}
          width={260}
          className="gp-profile-menu"
          zIndex={7000}
        >
          <div className="gp-profile-menu__account" role="menuitem">
            <span className="gp-profile-menu__avatar" aria-hidden="true">
              {userInitials === "DA" ? "A" : userInitials.slice(0, 1).toUpperCase()}
            </span>
            <span className="gp-profile-menu__account-name">AfriMarket</span>
            <i className="bi bi-chevron-right" aria-hidden="true" />
          </div>

          <div className="gp-profile-menu__section">
            <button type="button" className="gp-profile-menu__item" onClick={() => window.location.assign(`/${locale}`)}>
              <i className="bi bi-house" aria-hidden="true" />
              <span>Home</span>
            </button>
          </div>

          <div className="gp-profile-menu__separator" />

          <div className="gp-profile-menu__section">
            <div className="gp-profile-menu__item" role="menuitem">
              <i className="bi bi-layout-sidebar" aria-hidden="true" />
              <span>Drawings panel</span>
              <span className="gp-profile-menu__switch is-on" aria-hidden="true"><span /></span>
            </div>
            <div className="gp-profile-menu__item gp-profile-menu__item--locale" role="group" aria-label={locale === "fr" ? "Choisir la langue" : "Choose language"}>
              <i className="bi bi-globe2" aria-hidden="true" />
              <span>{locale === "fr" ? "Langue" : "Language"}</span>
              <span className="gp-profile-menu__locale-picker">
                <button
                  type="button"
                  className={clsx("gp-profile-menu__locale-option", locale === "en" && "is-active")}
                  aria-pressed={locale === "en"}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    switchLocale("en");
                  }}
                >
                  English
                </button>
                <button
                  type="button"
                  className={clsx("gp-profile-menu__locale-option", locale === "fr" && "is-active")}
                  aria-pressed={locale === "fr"}
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    switchLocale("fr");
                  }}
                >
                  Français
                </button>
              </span>
            </div>
            <button
              type="button"
              className="gp-profile-menu__item"
              onClick={() => {
                setIsProfileMenuOpen(false);
                onOpenKeyboardShortcuts();
              }}
              aria-label={locale === "fr" ? "Ouvrir les raccourcis clavier" : "Open keyboard shortcuts"}
            >
              <i className="bi bi-keyboard" aria-hidden="true" />
              <span>{locale === "fr" ? "Raccourcis clavier" : "Keyboard shortcuts"}</span>
              <span className="gp-profile-menu__meta">Ctrl + /</span>
            </button>
            <div className="gp-profile-menu__item" role="menuitem">
              <i className="bi bi-display" aria-hidden="true" />
              <span>Get desktop app</span>
              <i className="bi bi-box-arrow-up-right gp-profile-menu__meta" aria-hidden="true" />
            </div>
          </div>

          <div className="gp-profile-menu__separator" />

          <div className="gp-profile-menu__section">
            <div className="gp-profile-menu__item gp-profile-menu__item--danger" role="menuitem">
              <i className="bi bi-box-arrow-right" aria-hidden="true" />
              <span>Sign out</span>
            </div>
          </div>
        </FloatingMenu>

        {!isMultiChartMode && (
          <>
            <div
              className={clsx("gp-toolbar-symbol-selector", "hover-lift")}
              onClick={openTickerSelector}
              title="Rechercher un symbole"
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openTickerSelector();
                }
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="15"
                height="15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
                <path d="M16 16L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span className={"gp-toolbar-symbol-selector-label"}>{safeDisplaySymbol}</span>
            </div>

            <div className={"gp-toolbar-v-divider"}></div>

            <button
              className={clsx("gp-toolbar-btn", "hover-lift")}
              title="Comparer ou ajouter un symbole"
              onPointerEnter={prefetchCompareSymbols}
              onFocus={prefetchCompareSymbols}
              onClick={() => {
                dispatch(setSearchMode("compare"));
                dispatch(setModalOpen({ modal: "search", isOpen: true }));
              }}
            >
              <i className="bi bi-plus-lg"></i>
            </button>
          </>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 2. MIDDLE SECTION (Scrollable & Flexible) */}
      {/* ===================================================================== */}
      <div
        id="toolbar-scroll-left"
        className={clsx(
          "gp-toolbar-scroll-wrapper",
          "scroll-container",
          "h-scroll-container"
        )}
        // [TENOR 2026 SRE] flex: 1 1 auto allows it to shrink and grow naturally
        style={{ flex: "1 1 auto", minWidth: "0" }}
      >
        <span className={clsx("scroll-indicator-h", "scroll-indicator-h--left")}>
          <i className="bi bi-caret-left-fill"></i>
        </span>
        <span className={clsx("scroll-indicator-h", "scroll-indicator-h--right")}>
          <i className="bi bi-caret-right-fill"></i>
        </span>

        <div className={"gp-toolbar-scroll-content"}>
          <button
            className={clsx(toolbarSecondaryButtonClassNames)}
            title="Plus d'options"
            onClick={() => dispatch(setModalOpen({ modal: "options", isOpen: true }))}
          >
            <i className="bi bi-grid-3x2-gap"></i>
          </button>

          <div className={"gp-toolbar-v-divider"}></div>

          {!isMultiChartMode && ["1D"].map((tf) => (
            <button
              key={tf}
              className={clsx(toolbarButtonClassNames, tf === chartConfig.timeframe && "active")}
              title={`Intervalle ${tf}`}
              onClick={() => onTimeframeChange(tf)}
            >
              <span className="gp-toolbar-text-label">{tf}</span>
            </button>
          ))}

          <div className={"gp-toolbar-v-divider"}></div>

          <button
            ref={chartTypeButtonRef}
            className={clsx(toolbarButtonClassNames, activeChartType !== "candles" && "active")}
            title={chartTypeT("typeTitle", { label: activeChartTypeEntry.label })}
            aria-label={chartTypeT("typeAria", { label: activeChartTypeEntry.label })}
            aria-haspopup="menu"
            aria-expanded={isChartTypeMenuOpen}
            onClick={handleChartTypeMenuToggle}
          >
            {renderChartTypeIcon(activeChartType)}
          </button>

          <FloatingMenu
            isOpen={isChartTypeMenuOpen}
            onClose={() => setIsChartTypeMenuOpen(false)}
            anchorRect={chartTypeAnchorRect}
            width={292}
            className="gp-chart-type-menu"
            zIndex={6000}
          >
            <ChartTypeMenuContent activeChartType={activeChartType} onSelect={handleChartTypeSelect} />
          </FloatingMenu>

          <button
            type="button"
            className={clsx(toolbarButtonClassNames, hasActiveOverlayIndicator && "active")}
            title="Indicateurs"
            aria-label="Indicateurs"
            aria-pressed={uiState.modals.indicators}
            data-indicators-modal-trigger="true"
            onFocus={() => { void preloadIndicatorsModal(); }}
            onPointerEnter={() => { void preloadIndicatorsModal(); }}
            onClick={() => dispatch(setModalOpen({ modal: "indicators", isOpen: !uiState.modals.indicators }))}
          >
            <i className="bi bi-activity"></i>
          </button>

          {!isMultiChartMode && (
            <button
              type="button"
              className={clsx(toolbarButtonClassNames, "gp-toolbar-volume-toggle", !isActiveIndex && isVolumeAttached && "active")}
              disabled={Boolean(isActiveIndex)}
              title={volumeToggleLabel}
              aria-label={volumeToggleLabel}
              aria-pressed={!isActiveIndex && isVolumeAttached}
              onClick={handleVolumeToggle}
            >
              <span className="gp-toolbar-volume-toggle__label gp-toolbar-text-label">Vol</span>
            </button>
          )}

          <button
            className={clsx(toolbarButtonClassNames)}
            title="Modèles d'indicateurs"
            onClick={() => dispatch(setModalOpen({ modal: "templates", isOpen: true }))}
          >
            <i className="bi bi-window-stack"></i>
          </button>

          <div className={"gp-toolbar-v-divider"}></div>

          <button
            className={clsx(toolbarButtonClassNames)}
            title="Alerte"
            onClick={() => dispatch(setModalOpen({ modal: "alerts", isOpen: true }))}
          >
            <i className="bi bi-bell-fill"></i>
          </button>

          {!isMultiChartMode && (
            <button
              className={clsx(
                toolbarButtonClassNames,
                (uiState.replay.isActive || isReplaySelectingStart) && "active",
              )}
              title={
                uiState.replay.isActive
                  ? "Quitter le Bar Replay"
                  : isReplaySelectingStart
                    ? "Sélectionnez une bougie sur le graphique · Échap pour annuler"
                    : "Bar Replay"
              }
              aria-pressed={uiState.replay.isActive || isReplaySelectingStart}
              onClick={onReplayRequest}
            >
              <i className={clsx(
                "bi",
                uiState.replay.isActive ? "bi-stop-circle-fill" : "bi-play-circle-fill",
              )}></i>
            </button>
          )}

          <div className={"gp-toolbar-v-divider"}></div>

          <div className="gp-history-controls" role="group" aria-label="Historique du graphique">
            <button
              type="button"
              className={clsx(toolbarSecondaryButtonClassNames, "gp-history-btn")}
              title="Undo (Ctrl+Z)"
              aria-label="Undo"
              data-name="undo"
              disabled={!canUndo}
              onClick={onUndo}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path d="M9 7H5V3" />
                <path d="M5.4 7C7.1 4.8 9.7 3.5 12.6 3.8C16.8 4.2 20 7.7 20 12C20 16.4 16.4 20 12 20C9.4 20 7.1 18.8 5.6 16.9" />
              </svg>
            </button>
            <button
              type="button"
              className={clsx(toolbarSecondaryButtonClassNames, "gp-history-btn")}
              title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
              aria-label="Redo"
              data-name="redo"
              disabled={!canRedo}
              onClick={onRedo}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
                <path d="M15 7H19V3" />
                <path d="M18.6 7C16.9 4.8 14.3 3.5 11.4 3.8C7.2 4.2 4 7.7 4 12C4 16.4 7.6 20 12 20C14.6 20 16.9 18.8 18.4 16.9" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. RIGHT SECTION (Flexible & Collapsible) */}
      {/* ===================================================================== */}
      <div 
        className="d-flex align-items-center gap-2 flex-shrink-0 flex-nowrap h-100 justify-content-end" 
        style={{ minWidth: "max-content" }}
      >
        <button
          type="button"
          className="gp-market-selector-button flex-shrink-0"
          onClick={openMarketSelector}
          onKeyDown={handleMarketSelectorKeyDown}
          aria-haspopup="dialog"
          aria-expanded={uiState.modals.marketSelector}
          aria-label={`${marketLabel} : ${displayedMarketTicker}`}
          title={marketTitle}
        >
          <span className="gp-market-selector-label">{marketLabel}</span>
          <span className="gp-market-selector-icon" aria-hidden="true">
            <i className="bi bi-arrow-left-right"></i>
          </span>
          <strong>{displayedMarketTicker}</strong>
        </button>

        <div className={clsx("gp-toolbar-v-divider", "gp-hide-on-small", "flex-shrink-0")}></div>

        {/* Anonyme Toggle (Hidden on small screens to save space) */}
        <div
          className={clsx("d-flex align-items-center gap-2 position-relative flex-shrink-0 h-100", "gp-hide-on-small")}
          style={{ cursor: "pointer" }}
        >
          <SettingsToggle
            label={uiState.isAnonyme ? uiState.selectedPseudo : "Anonyme "}
            checked={uiState.isAnonyme}
            onChange={(val) => dispatch(setAnonyme(val))}
          />
          <button
            type="button"
            className="gp-toolbar-compact-trigger"
            ref={pseudoDropdownButtonRef}
            onClick={handleTogglePseudoDropdown}
            aria-haspopup="menu"
            aria-expanded={isPseudoDropdownOpen}
            aria-label="Choisir un pseudonyme"
          >
            <i
              className={clsx("bi bi-chevron-down gp-toolbar-compact-trigger__icon", uiState.isAnonyme && "text-info", isPseudoDropdownOpen && "rotate-180")}
            ></i>
          </button>
        </div>

        <div className={clsx("gp-toolbar-v-divider", "flex-shrink-0")}></div>

        {/* Right Scrollable Actions (Save, Load, Settings, Zen) */}
        <div className={clsx("gp-toolbar-scroll-wrapper-right", "flex-shrink-0")}>
          <div className={"gp-toolbar-scroll-content-right"}>
            <button
              ref={saveButtonRef}
              type="button"
              className={clsx(toolbarSecondaryButtonClassNames, isSaveMenuOpen && "active")}
              title={activeSavedAnalysisId ? "Enregistrer les modifications de l'analyse" : "Sauvegarder l'analyse"}
              aria-label={activeSavedAnalysisId ? "Enregistrer les modifications de l'analyse" : "Sauvegarder l'analyse"}
              aria-haspopup="dialog"
              aria-expanded={isSaveMenuOpen}
              onClick={openSaveMenu}
            >
              <i className={clsx("bi", isSavingAnalysis ? "bi-hourglass-split" : "bi-save")}></i>
            </button>
            <FloatingMenu
              isOpen={isSaveMenuOpen}
              onClose={() => setIsSaveMenuOpen(false)}
              anchorRect={saveAnchorRect}
              width={340}
              className="gp-save-analysis-menu"
              zIndex={6500}
            >
              <div className="gp-save-analysis-menu__header">
                <div className="gp-save-analysis-menu__title">
                  <i className="bi bi-save2" aria-hidden="true" />
                  <span>{activeSavedAnalysisId ? "Enregistrer les modifications" : "Nouvelle analyse"}</span>
                </div>
                <small>
                  {activeSavedAnalysisId
                    ? "Choisissez de remplacer la sauvegarde active ou d’en créer une nouvelle."
                    : "Donnez un nom clair à cette analyse avant de l’enregistrer."}
                </small>
              </div>
              <label className="gp-save-analysis-menu__field">
                <span>Nom de l’analyse</span>
                <input
                  autoFocus
                  type="text"
                  value={saveDraftName}
                  maxLength={120}
                  onChange={(event) => setSaveDraftName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsSaveMenuOpen(false);
                    if (event.key === "Enter" && saveDraftName.trim()) {
                      void submitSave(activeSavedAnalysisId ? "update" : "copy");
                    }
                  }}
                  placeholder="Ex. ORANGE_CI · Breakout journalier"
                  aria-label="Nom de l’analyse à sauvegarder"
                />
              </label>
              {activeSavedAnalysisId ? (
                <div className="gp-save-analysis-menu__actions">
                  <button type="button" className="gp-save-analysis-menu__primary" disabled={!saveDraftName.trim() || isSavingAnalysis} onClick={() => { void submitSave("update"); }}>
                    <i className="bi bi-arrow-repeat" aria-hidden="true" />
                    <span>{isSavingAnalysis ? "Enregistrement…" : "Mettre à jour"}</span>
                  </button>
                  <button type="button" className="gp-save-analysis-menu__secondary" disabled={!saveDraftName.trim() || isSavingAnalysis} onClick={() => { void submitSave("copy"); }}>
                    <i className="bi bi-plus-square" aria-hidden="true" />
                    <span>Enregistrer comme nouvelle</span>
                  </button>
                </div>
              ) : (
                <button type="button" className="gp-save-analysis-menu__primary gp-save-analysis-menu__primary--full" disabled={!saveDraftName.trim() || isSavingAnalysis} onClick={() => { void submitSave("copy"); }}>
                  <i className="bi bi-check2" aria-hidden="true" />
                  <span>{isSavingAnalysis ? "Enregistrement…" : "Enregistrer l’analyse"}</span>
                </button>
              )}
            </FloatingMenu>
            <LayoutSetupControl />
            <button
              type="button"
              className={clsx(toolbarSecondaryButtonClassNames)}
              title="Historique des analyses"
              aria-label="Historique des analyses"
              onClick={() => { void onOpenLoadModal(); }}
            >
              <i className="bi bi-folder2-open"></i>
            </button>
            <button
              type="button"
              className={clsx(toolbarSecondaryButtonClassNames)}
              title="Paramètres du graphique"
              aria-label="Paramètres du graphique"
              onClick={() => dispatch(setModalOpen({ modal: "settings", isOpen: true }))}
            >
              <i className="bi bi-nut"></i>
            </button>
            <button
              className={clsx(toolbarButtonClassNames, "text-secondary", uiState.isZenMode && "active-zen")}
              title={uiState.isZenMode ? "Quitter le mode Zen" : "Mode Zen (Focus)"}
              onClick={() => dispatch(toggleZenMode())}
            >
              <i className={clsx("bi", uiState.isZenMode ? "bi-fullscreen-exit" : "bi-fullscreen")}></i>
            </button>
            <button
              ref={snapshotButtonRef}
              type="button"
              className={clsx(toolbarSecondaryButtonClassNames, "gp-hide-on-small", isSnapshotMenuOpen && "active")}
              title="Prendre une capture du graphique"
              aria-label="Prendre une capture du graphique"
              aria-haspopup="menu"
              aria-expanded={isSnapshotMenuOpen}
              disabled={uiState.isCapturing}
              onClick={toggleSnapshotMenu}
            >
              <i className={clsx("bi", uiState.isCapturing ? "bi-hourglass-split" : "bi-camera")}></i>
            </button>
            <FloatingMenu
              isOpen={isSnapshotMenuOpen}
              onClose={() => setIsSnapshotMenuOpen(false)}
              anchorRect={snapshotAnchorRect}
              width={250}
              className="gp-snapshot-menu"
              zIndex={6500}
            >
              <div className="gp-snapshot-menu__header">CAPTURE DU GRAPHIQUE</div>
              <button type="button" className="gp-snapshot-menu__item" onClick={() => runSnapshotAction(onSnapshotDownload)}>
                <i className="bi bi-download" aria-hidden="true" />
                <span>Télécharger l'image</span>
                <kbd>Ctrl+Alt+S</kbd>
              </button>
              <button type="button" className="gp-snapshot-menu__item" onClick={() => runSnapshotAction(onSnapshotCopy)}>
                <i className="bi bi-clipboard" aria-hidden="true" />
                <span>Copier l'image</span>
                <kbd>Ctrl+Shift+S</kbd>
              </button>
              <button type="button" className="gp-snapshot-menu__item" onClick={() => runSnapshotAction(onSnapshotOpen)}>
                <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
                <span>Ouvrir dans un nouvel onglet</span>
              </button>
            </FloatingMenu>
          </div>
        </div>

        {/* Share Button (Hidden on small screens) */}
        <button
          className={clsx(publishButtonClassNames)}
          title="Partager l’analyse actuelle"
          aria-label="Partager l’analyse actuelle"
          onClick={() => dispatch(setModalOpen({ modal: "publish", isOpen: true }))}
          type="button"
        >
          <span className="gp-share-button__icon-wrap" aria-hidden="true">
            <i className="bi bi-share-fill gp-share-button__icon" />
          </span>
          <span className="gp-share-button__label">Partager</span>
        </button>
      </div>

      {/* PSEUDO DROPDOWN PORTAL/ABSOLUTE */}
      {isPseudoDropdownOpen && (
        <>
          <div
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 49999, cursor: "default" }}
            onClick={() => setIsPseudoDropdownOpen(false)}
          />
          <div
            className={"pseudo-dropdown"}
            style={{
              position: "fixed",
              top: dropdownPos.top + 5,
              left: dropdownPos.left - 100,
              zIndex: 50000,
              width: "160px",
              height: "auto",
              minHeight: "0",
              maxHeight: "min(332px, calc(100vh - 170px))",
              overflowY: "auto",
              alignSelf: "flex-start",
            }}
          >
            {ANONYMOUS_PSEUDOS.map((pseudo) => (
              <div
                key={pseudo}
                className={clsx("pseudo-option", uiState.selectedPseudo === pseudo && "active")}
                onClick={() => {
                  dispatch(setSelectedPseudo(pseudo));
                  setIsPseudoDropdownOpen(false);
                  if (!uiState.isAnonyme) dispatch(setAnonyme(true));
                }}
              >
                {uiState.selectedPseudo === pseudo && <i className="bi bi-check2"></i>} {pseudo}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// --- EOF ---
