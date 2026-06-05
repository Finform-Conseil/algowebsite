"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import {
  useDispatch,
  useSelector } from "react-redux";
import { SettingsToggle } from "../common/inputs/SettingsField";
import {
  setModalOpen,
  setChartType,
  toggleZenMode,
  setAnonyme,
  setSelectedPseudo,
  setSearchMode,
  setDataMode,
} from "../../store/technicalAnalysisSlice";
import {
  selectChartConfig,
  selectAdvancedIndicators,
  selectUiState,
  selectDataMode,
} from "../../store/selectors";
import { LayoutSetupControl } from "./LayoutSetupControl";
import { FloatingMenu } from "../common/primitives/FloatingMenu";
import {
  CHART_TYPE_MENU_GROUPS,
  CHART_TYPE_REGISTRY,
  normalizeChartType,
  type ChartType,
} from "../../lib/chart-types";
import { preloadIndicatorsModal } from "../modals/orchestration/indicatorsModalLoader";
import { ANONYMOUS_PSEUDOS } from "../../config/ui/anonymousPseudos";
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
  stopReplay: () => void;
  onTimeframeChange: (timeframe: string) => void;
  onSaveAnalysis: () => void | Promise<void>;
  onOpenLoadModal: () => void | Promise<void>;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  userInitials,
  displaySymbol,
  openTickerSelector,
  stopReplay,
  onTimeframeChange,
  onSaveAnalysis,
  onOpenLoadModal,
}) => {
  const dispatch = useDispatch();
  const chartConfig = useSelector(selectChartConfig);
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const uiState = useSelector(selectUiState);
  const dataMode = useSelector(selectDataMode);

  const [isPseudoDropdownOpen, setIsPseudoDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const pseudoDropdownButtonRef = useRef<HTMLButtonElement>(null);
  const [isChartTypeMenuOpen, setIsChartTypeMenuOpen] = useState(false);
  const [chartTypeAnchorRect, setChartTypeAnchorRect] = useState<DOMRect | null>(null);
  const chartTypeButtonRef = useRef<HTMLButtonElement>(null);
  const activeChartType = normalizeChartType(chartConfig.chartType);
  const activeChartTypeEntry = CHART_TYPE_REGISTRY[activeChartType];

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
    togglePseudoDropdownFromElement(e.currentTarget);
  };

  const handleProfileToggle = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    togglePseudoDropdownFromElement(e.currentTarget);
  };

  const handleDataModeKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    dispatch(setDataMode(dataMode === "real" ? "mock" : "real"));
  };

  useEffect(() => {
    if (!isPseudoDropdownOpen) return;
    const handleClickOutside = () => setIsPseudoDropdownOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isPseudoDropdownOpen]);

  const safeDisplaySymbol = displaySymbol.trim() || "BOAB";
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
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={isPseudoDropdownOpen}
            onClick={handleProfileToggle}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                togglePseudoDropdownFromElement(event.currentTarget);
              }
            }}
          >
            {userInitials === "DA" ? <i className="bi bi-person-circle" style={{ fontSize: "1.2rem" }}></i> : userInitials}
          </span>
        </div>

        <div
          className={clsx("gp-toolbar-symbol-selector", "hover-lift")}
          style={{ marginLeft: "12px" }}
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
          onClick={() => {
            dispatch(setSearchMode("compare"));
            dispatch(setModalOpen({ modal: "search", isOpen: true }));
          }}
        >
          <i className="bi bi-plus-lg"></i>
        </button>
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

          {["1D"].map((tf) => (
            <button
              key={tf}
              className={clsx(toolbarButtonClassNames, tf === chartConfig.timeframe && "active")}
              title={`Intervalle ${tf}`}
              onClick={() => onTimeframeChange(tf)}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1 }}>{tf}</span>
            </button>
          ))}

          <div className={"gp-toolbar-v-divider"}></div>

          <button
            ref={chartTypeButtonRef}
            className={clsx(toolbarButtonClassNames, activeChartType !== "candles" && "active")}
            title={`Type de graphique: ${activeChartTypeEntry.label}`}
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
            {CHART_TYPE_MENU_GROUPS.map((group) => (
              <div key={group} className="gp-chart-type-menu-group" role="group" aria-label={group}>
                <div className="gp-chart-type-menu-title">{group}</div>
                {Object.values(CHART_TYPE_REGISTRY)
                  .filter((entry) => entry.group === group)
                  .map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      role="menuitemradio"
                      aria-checked={activeChartType === entry.id}
                      className={clsx("gp-chart-type-menu-item", activeChartType === entry.id && "active")}
                      onClick={() => handleChartTypeSelect(entry.id)}
                    >
                      <span className="gp-chart-type-menu-icon">{renderChartTypeIcon(entry.id)}</span>
                      <span className="gp-chart-type-menu-label">{entry.label}</span>
                      {entry.synthetic && (
                        <span className="gp-chart-type-menu-badge" title="Prix construits, non executables au marche">
                          Synthétique
                        </span>
                      )}
                      {entry.approximateWithoutTicks && (
                        <span className="gp-chart-type-menu-badge" title="Approximation sans donnees tick/intrabar completes">
                          Approx.
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            ))}
          </FloatingMenu>

          <button
            type="button"
            className={clsx(toolbarButtonClassNames, hasActiveOverlayIndicator && "active")}
            title="Indicateurs"
            aria-label="Indicateurs"
            onFocus={() => { void preloadIndicatorsModal(); }}
            onPointerEnter={() => { void preloadIndicatorsModal(); }}
            onClick={() => dispatch(setModalOpen({ modal: "indicators", isOpen: true }))}
          >
            <i className="bi bi-activity"></i>
          </button>

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

          <button
            className={clsx(toolbarButtonClassNames, uiState.replay.isActive && "active")}
            title={uiState.replay.isActive ? "Mode Replay actif - Cliquez pour arrêter" : "Mode Replay"}
            onClick={uiState.replay.isActive ? stopReplay : () => dispatch(setModalOpen({ modal: "replay", isOpen: true }))}
          >
            <i className={clsx("bi", uiState.replay.isActive ? "bi-stop-circle-fill" : "bi-play-circle-fill")}></i>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. RIGHT SECTION (Flexible & Collapsible) */}
      {/* ===================================================================== */}
      <div 
        className="d-flex align-items-center gap-2 flex-shrink-0 flex-nowrap h-100 justify-content-end" 
        style={{ minWidth: "max-content" }}
      >
        {/* Toggle SIMU/BRVM (Always visible) */}
        <div
          className={`${"gp-ios-toggle"} ${dataMode === "real" ? "is-brvm" : "is-demo"} flex-shrink-0`}
          onClick={() => dispatch(setDataMode(dataMode === "real" ? "mock" : "real"))}
          title={
            dataMode === "real"
              ? "Source actuelle: donnees BRVM verifiees. Cliquer pour passer en simulation locale."
              : "Source actuelle: simulation locale. Cliquer pour passer aux donnees BRVM verifiees."
          }
          role="switch"
          tabIndex={0}
          aria-checked={dataMode === "real"}
          aria-label={dataMode === "real" ? "Source de donnees BRVM verifiees" : "Source de donnees simulees"}
          onKeyDown={handleDataModeKeyDown}
        >
          <span className={"gp-ios-toggle-track"}>
            <span className={"gp-ios-toggle-label-left"}>SIMU</span>
            <span className={"gp-ios-toggle-knob"} />
            <span className={"gp-ios-toggle-label-right"}>BRVM</span>
          </span>
        </div>

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
            className="p-1 d-flex align-items-center bg-transparent border-0 text-current"
            ref={pseudoDropdownButtonRef}
            onClick={handleTogglePseudoDropdown}
            aria-haspopup="menu"
            aria-expanded={isPseudoDropdownOpen}
            aria-label="Choisir un pseudonyme"
          >
            <i
              className={clsx("bi bi-chevron-down", uiState.isAnonyme && "text-info", isPseudoDropdownOpen && "rotate-180")}
              style={{ fontSize: "0.8rem", marginTop: "1px", transition: "transform 0.2s ease" }}
            ></i>
          </button>
        </div>

        <div className={clsx("gp-toolbar-v-divider", "flex-shrink-0")}></div>

        {/* Right Scrollable Actions (Save, Load, Settings, Zen) */}
        <div className={clsx("gp-toolbar-scroll-wrapper-right", "flex-shrink-0")}>
          <div className={"gp-toolbar-scroll-content-right"}>
            <button
              className={clsx(toolbarSecondaryButtonClassNames)}
              title="Sauvegarder l'analyse"
              onClick={() => { void onSaveAnalysis(); }}
            >
              <i className="bi bi-save"></i>
            </button>
            <LayoutSetupControl />
            <button
              className={clsx(toolbarSecondaryButtonClassNames)}
              title="Historique des analyses"
              onClick={() => { void onOpenLoadModal(); }}
            >
              <i className="bi bi-folder2-open"></i>
            </button>
            <button
              className={clsx(toolbarSecondaryButtonClassNames)}
              title="Paramètres de l'indicateur"
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
              className={clsx(toolbarSecondaryButtonClassNames, "opacity-50", "gp-hide-on-small")}
              title="Capture indisponible pour cette version"
              aria-label="Capture indisponible pour cette version"
              disabled
            >
              <i className={clsx("bi", uiState.isCapturing ? "bi-hourglass-split" : "bi-camera")}></i>
            </button>
          </div>
        </div>

        {/* Publish Button (Hidden on small screens) */}
        <button
          className={clsx(publishButtonClassNames, uiState.isPublishing && "disabled")}
          style={{ height: "28px", padding: "0 16px" }}
          onClick={() => dispatch(setModalOpen({ modal: "publish", isOpen: true }))}
          disabled={uiState.isPublishing}
        >
          {uiState.isPublishing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>{" "}
              Publication
            </>
          ) : (
            "Publier"
          )}
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
            style={{ position: "fixed", top: dropdownPos.top + 5, left: dropdownPos.left - 100, zIndex: 50000, width: "160px" }}
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
