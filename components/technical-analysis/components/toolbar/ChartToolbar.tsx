"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import { SettingsToggle } from "../common/SettingsField";
import {
  setModalOpen,
  setChartType,
  toggleZenMode,
  setAnonyme,
  setSelectedPseudo,
  setSearchMode,
  selectChartConfig,
  selectAdvancedIndicators,
  selectUiState,
  selectDataMode,
  setDataMode,
} from "../../store/technicalAnalysisSlice";
import { useTechnicalAnalysisActions } from "../../hooks/useTechnicalAnalysisActions";
import { LayoutSetupControl } from "./LayoutSetupControl";
import { FloatingMenu } from "../common/FloatingMenu";
import {
  CHART_TYPE_MENU_GROUPS,
  CHART_TYPE_REGISTRY,
  normalizeChartType,
  type ChartType,
} from "../../lib/chart-types";

const ANONYMOUS_PSEUDOS = [
  "Trader_700",
  "Bull_Runner",
  "Bear_Hunter",
  "Alpha_Whale",
  "Crypto_Ghost",
  "Shadow_Trader",
  "Market_Ninja",
  "Pivot_Master",
];


const CHART_TYPE_ICON_CLASS: Partial<Record<ChartType, string>> = {
  line: "bi bi-graph-up",
  line_with_markers: "bi bi-activity",
  area: "bi bi-layers",
  hlc_area: "bi bi-bounding-box",
  baseline: "bi bi-distribute-vertical",
  columns: "bi bi-bar-chart",
  high_low: "bi bi-arrows-vertical",
  volume_footprint: "bi bi-grid-3x3-gap",
  time_price_opportunity: "bi bi-fonts",
  session_volume_profile: "bi bi-bar-chart-steps",
  kagi: "bi bi-bezier2",
  point_and_figure: "bi bi-x-octagon",
};

const renderChartTypeIcon = (chartType: ChartType) => {
  if (chartType === "step_line") {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="none" aria-hidden="true">
        <path d="M5 20h5v-5h6v-5h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5 22.5h18" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity=".35" />
      </svg>
    );
  }

  if (["bars", "candles", "hollow_candles", "volume_candles", "heikin_ashi", "renko", "line_break", "range"].includes(chartType)) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="22" height="22" fill="currentColor" aria-hidden="true">
        <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z" />
        <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z" />
        <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z" />
        <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z" />
      </svg>
    );
  }

  return <i className={CHART_TYPE_ICON_CLASS[chartType] ?? "bi bi-graph-up"} aria-hidden="true" />;
};

interface ChartToolbarProps {
  userInitials: string;
  displaySymbol: string;
  openTickerSelector: () => void;
  stopReplay: () => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  userInitials,
  displaySymbol,
  openTickerSelector,
  stopReplay,
}) => {
  const dispatch = useDispatch();
  const { toggleDropdown } = useUserActions();
  const chartConfig = useSelector(selectChartConfig);
  const advancedIndicators = useSelector(selectAdvancedIndicators);
  const uiState = useSelector(selectUiState);
  const dataMode = useSelector(selectDataMode);
  const { handleTimeframeChange, handleSaveAnalysis, handleOpenLoadModal } = useTechnicalAnalysisActions();

  const [isPseudoDropdownOpen, setIsPseudoDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const pseudoDropdownButtonRef = useRef<HTMLDivElement>(null);
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

  const handleTogglePseudoDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPseudoDropdownOpen) {
      setIsPseudoDropdownOpen(false);
    } else {
      if (pseudoDropdownButtonRef.current) {
        const rect = pseudoDropdownButtonRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
      setIsPseudoDropdownOpen(true);
    }
  };

  useEffect(() => {
    if (!isPseudoDropdownOpen) return;
    const handleClickOutside = () => setIsPseudoDropdownOpen(false);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [isPseudoDropdownOpen]);

  const safeDisplaySymbol = displaySymbol.trim() || "BOAN";
  const hasActiveOverlayIndicator =
    (chartConfig.indicators.sma && chartConfig.indicators.activeSma.length > 0) ||
    (chartConfig.indicators.ema && chartConfig.indicators.activeEma.length > 0) ||
    Object.values(advancedIndicators).some(Boolean);

  return (
    <div
      className={clsx(
        "gp-horizontal-toolbar",
        "gp-horizontal-toolbar",
        "prepare-animation",
        "gsap-target-toolbar",
        "animated-element"
      )}
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
            onClick={() => toggleDropdown("profile")}
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
        <span className={clsx("scroll-indicator-h", "scroll-indicator-h--left", "scroll-indicator-h--left")}>
          <i className="bi bi-caret-left-fill"></i>
        </span>
        <span className={clsx("scroll-indicator-h", "scroll-indicator-h--right", "scroll-indicator-h--right")}>
          <i className="bi bi-caret-right-fill"></i>
        </span>

        <div className={"gp-toolbar-scroll-content"}>
          <button
            className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", "text-secondary")}
            title="Plus d'options"
            onClick={() => dispatch(setModalOpen({ modal: "options", isOpen: true }))}
          >
            <i className="bi bi-grid-3x2-gap"></i>
          </button>

          <div className={"gp-toolbar-v-divider"}></div>

          {["1D"].map((tf) => (
            <button
              key={tf}
              className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", tf === chartConfig.timeframe && "active")}
              title={`Intervalle ${tf}`}
              onClick={() => handleTimeframeChange(tf)}
            >
              <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1 }}>{tf}</span>
            </button>
          ))}

          <div className={"gp-toolbar-v-divider"}></div>

          <button
            ref={chartTypeButtonRef}
            className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", activeChartType !== "candles" && "active")}
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
                      {entry.synthetic && <span className="gp-chart-type-menu-badge">Synthetic</span>}
                      {entry.approximateWithoutTicks && <span className="gp-chart-type-menu-badge">Intraday</span>}
                    </button>
                  ))}
              </div>
            ))}
          </FloatingMenu>

          <button
            className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", hasActiveOverlayIndicator && "active")}
            title="Indicateurs"
            onClick={() => dispatch(setModalOpen({ modal: "indicators", isOpen: true }))}
          >
            <i className="bi bi-activity"></i>
          </button>

          <button
            className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift")}
            title="Modèles d'indicateurs"
            onClick={() => dispatch(setModalOpen({ modal: "templates", isOpen: true }))}
          >
            <i className="bi bi-window-stack"></i>
          </button>

          <div className={"gp-toolbar-v-divider"}></div>

          <button
            className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift")}
            title="Alerte"
            onClick={() => dispatch(setModalOpen({ modal: "alerts", isOpen: true }))}
          >
            <i className="bi bi-bell-fill"></i>
          </button>

          <button
            className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", uiState.replay.isActive && "active")}
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
        {/* Toggle DEMO/BRVM (Always visible) */}
        <div
          className={`${"gp-ios-toggle"} ${dataMode === "real" ? "is-brvm" : "is-demo"} flex-shrink-0`}
          onClick={() => dispatch(setDataMode(dataMode === "real" ? "mock" : "real"))}
          title={dataMode === "real" ? "Passer en mode Démo" : "Passer en mode Temps Réel (BRVM)"}
          role="switch"
          aria-checked={dataMode === "real"}
        >
          <span className={"gp-ios-toggle-track"}>
            <span className={"gp-ios-toggle-label-left"}>DEMO</span>
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
          <div
            className="p-1 d-flex align-items-center"
            ref={pseudoDropdownButtonRef}
            onClick={handleTogglePseudoDropdown}
          >
            <i
              className={clsx("bi bi-chevron-down", uiState.isAnonyme && "text-info", isPseudoDropdownOpen && "rotate-180")}
              style={{ fontSize: "0.8rem", marginTop: "1px", transition: "transform 0.2s ease" }}
            ></i>
          </div>
        </div>

        <div className={clsx("gp-toolbar-v-divider", "flex-shrink-0")}></div>

        {/* Right Scrollable Actions (Save, Load, Settings, Zen) */}
        <div className={clsx("gp-toolbar-scroll-wrapper-right", "flex-shrink-0")}>
          <div className={"gp-toolbar-scroll-content-right"}>
            <button
              className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", "text-secondary")}
              title="Sauvegarder l'analyse"
              onClick={handleSaveAnalysis}
            >
              <i className="bi bi-save"></i>
            </button>
            <LayoutSetupControl />
            <button
              className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", "text-secondary")}
              title="Historique des analyses"
              onClick={handleOpenLoadModal}
            >
              <i className="bi bi-folder2-open"></i>
            </button>
            <button
              className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", "text-secondary")}
              title="Paramètres de l'indicateur"
              onClick={() => dispatch(setModalOpen({ modal: "settings", isOpen: true }))}
            >
              <i className="bi bi-nut"></i>
            </button>
            <button
              className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", "text-secondary", uiState.isZenMode && "active-zen")}
              title={uiState.isZenMode ? "Quitter le mode Zen" : "Mode Zen (Focus)"}
              onClick={() => dispatch(toggleZenMode())}
            >
              <i className={clsx("bi", uiState.isZenMode ? "bi-fullscreen-exit" : "bi-fullscreen")}></i>
            </button>
            <button
              className={clsx("gp-toolbar-btn", "gp-toolbar-btn", "hover-lift", "hover-lift", "text-secondary", uiState.isCapturing && "opacity-50", "gp-hide-on-small")}
              title="Prendre une capture"
              onClick={() => {}}
              disabled={uiState.isCapturing}
            >
              <i className={clsx("bi", uiState.isCapturing ? "bi-hourglass-split" : "bi-camera")}></i>
            </button>
          </div>
        </div>

        {/* Publish Button (Hidden on small screens) */}
        <button
          className={clsx("btn btn-sm rounded-pill flex-shrink-0 d-flex align-items-center justify-content-center", "btn-publish", "btn-publish", "hover-lift", "hover-lift", uiState.isPublishing && "disabled", "gp-hide-on-small")}
          style={{ height: "28px", padding: "0 16px" }}
          onClick={() => {}}
          disabled={uiState.isPublishing}
        >
          {uiState.isPublishing ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>{" "}
              ...
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

function useUserActions() {
  return {
    toggleDropdown: (id: string) => {
      console.log(`[TENOR 2026] Toggle dropdown: ${id} (Mock)`);
    },
  };
}

// --- EOF ---
