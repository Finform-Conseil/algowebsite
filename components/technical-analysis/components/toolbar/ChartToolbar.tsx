"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import { SettingsToggle } from "../common/SettingsField";
import s from "../../style.module.css";
import {
  toggleChartType,
  setModalOpen,
  toggleZenMode,
  setAnonyme,
  setSelectedPseudo,
  selectChartConfig,
  selectUiState,
  selectDataMode,
  setDataMode,
} from "../../store/technicalAnalysisSlice";
import { useTechnicalAnalysisActions } from "../../hooks/useTechnicalAnalysisActions";

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

interface ChartToolbarProps {
  userInitials: string;
  openTickerSelector: () => void;
  stopReplay: () => void;
}

export const ChartToolbar: React.FC<ChartToolbarProps> = ({
  userInitials,
  openTickerSelector,
  stopReplay,
}) => {
  const dispatch = useDispatch();
  const { toggleDropdown } = useUserActions();
  const chartConfig = useSelector(selectChartConfig);
  const uiState = useSelector(selectUiState);
  const dataMode = useSelector(selectDataMode);
  const { handleTimeframeChange, handleSaveAnalysis, handleOpenLoadModal } = useTechnicalAnalysisActions();

  const [isPseudoDropdownOpen, setIsPseudoDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const pseudoDropdownButtonRef = useRef<HTMLDivElement>(null);

  const displaySymbol = uiState.isAnonyme ? uiState.selectedPseudo : chartConfig.symbol;

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

  return (
    <div
      className={clsx(
        s["gp-horizontal-toolbar"],
        "gp-horizontal-toolbar",
        s["prepare-animation"],
        "gsap-target-toolbar",
        "d-flex align-items-center text-secondary gap-3 animated-element"
      )}
    >
      <div className={s["gp-timeframe-badge-wrapper"]}>
        <span
          className={clsx("badge rounded-circle m-0", s["gp-badge-gold"])}
          style={{
            position: "relative",
            fontSize: "1rem",
            lineHeight: 1,
            cursor: "pointer",
          }}
          onClick={() => toggleDropdown("profile")}
        >
          {userInitials}
        </span>
      </div>

      <button
        className={clsx(
          "text-white btn p-0 border-0 d-flex align-items-center gap-2",
          s["gp-search-tte"],
          s["hover-lift"]
        )}
        onClick={openTickerSelector}
        title="Rechercher un symbole"
      >
        <i className="bi bi-search"></i>
        <span>{displaySymbol}</span>
      </button>

      <div
        id="toolbar-scroll-left"
        className={clsx(
          s["gp-toolbar-scroll-wrapper"],
          s["scroll-container"],
          s["h-scroll-container"]
        )}
        style={{ minWidth: 0 }}
      >
        <span
          className={clsx(
            s["scroll-indicator-h"],
            s["scroll-indicator-h--left"],
            "scroll-indicator-h--left"
          )}
        >
          <i className="bi bi-caret-left-fill"></i>
        </span>
        <span
          className={clsx(
            s["scroll-indicator-h"],
            s["scroll-indicator-h--right"],
            "scroll-indicator-h--right"
          )}
        >
          <i className="bi bi-caret-right-fill"></i>
        </span>

        <div className={s["gp-toolbar-scroll-content"]}>
          <button
            className={clsx(
              s["gp-toolbar-btn"],
              "gp-toolbar-btn",
              s["hover-lift"],
              "hover-lift",
              "text-secondary"
            )}
            title="Plus d'options"
            onClick={() => dispatch(setModalOpen({ modal: "options", isOpen: true }))}
          >
            <i className="bi bi-plus-circle"></i>
          </button>

          <div className={s["gp-toolbar-v-divider"]}></div>

          {["1D"].map((tf) => (
            <button
              key={tf}
              className={clsx(
                s["gp-toolbar-btn"],
                "gp-toolbar-btn",
                s["hover-lift"],
                "hover-lift",
                tf === chartConfig.timeframe && s["active"]
              )}
              title={`Intervalle ${tf}`}
              onClick={() => handleTimeframeChange(tf)}
            >
              <span className={s["gp-toolbar-btn-text"]}>{tf}</span>
            </button>
          ))}

          <div className={s["gp-toolbar-v-divider"]}></div>

          <button
            className={clsx(
              s["gp-toolbar-btn"],
              "gp-toolbar-btn",
              s["hover-lift"],
              "hover-lift",
              chartConfig.chartType === "line" && s["active"]
            )}
            title="Type de graphique"
            onClick={() => dispatch(toggleChartType())}
          >
            {chartConfig.chartType === "candlestick" ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 28 28"
                width="22"
                height="22"
                fill="currentColor"
                style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <path d="M17 11v6h3v-6h-3zm-.5-1h4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5z"></path>
                <path d="M18 7h1v3.5h-1zm0 10.5h1V21h-1z"></path>
                <path d="M9 8v12h3V8H9zm-.5-1h4a.5.5 0 0 1 .5.5v13a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-13a.5.5 0 0 1 .5-.5z"></path>
                <path d="M10 4h1v3.5h-1zm0 16.5h1V24h-1z"></path>
              </svg>
            ) : (
              <i className="bi bi-graph-up"></i>
            )}
          </button>

          <button
            className={clsx(
              s["gp-toolbar-btn"],
              "gp-toolbar-btn",
              s["hover-lift"],
              "hover-lift",
              chartConfig.indicators.sma && s["active"]
            )}
            title="Indicateurs"
            onClick={() => dispatch(setModalOpen({ modal: "indicators", isOpen: true }))}
          >
            <i className="bi bi-activity"></i>
          </button>

          <button
            className={clsx(
              s["gp-toolbar-btn"],
              "gp-toolbar-btn",
              s["hover-lift"],
              "hover-lift"
            )}
            title="Modèles d'indicateurs"
            onClick={() => dispatch(setModalOpen({ modal: "templates", isOpen: true }))}
          >
            <i className="bi bi-window-stack"></i>
          </button>

          <div className={s["gp-toolbar-v-divider"]}></div>

          <button
            className={clsx(
              s["gp-toolbar-btn"],
              "gp-toolbar-btn",
              s["hover-lift"],
              "hover-lift"
            )}
            title="Alerte"
            onClick={() => dispatch(setModalOpen({ modal: "alerts", isOpen: true }))}
          >
            <i className="bi bi-bell-fill"></i>
          </button>

          <button
            className={clsx(
              s["gp-toolbar-btn"],
              "gp-toolbar-btn",
              s["hover-lift"],
              "hover-lift",
              uiState.replay.isActive && s["active"]
            )}
            title={
              uiState.replay.isActive
                ? "Mode Replay actif - Cliquez pour arrêter"
                : "Mode Replay"
            }
            onClick={
              uiState.replay.isActive
                ? stopReplay
                : () => dispatch(setModalOpen({ modal: "replay", isOpen: true }))
            }
          >
            <i
              className={clsx(
                "bi",
                uiState.replay.isActive ? "bi-stop-circle-fill" : "bi-play-circle-fill"
              )}
            ></i>
          </button>
        </div>
      </div>

      <div className="d-flex align-items-center gap-3 flex-shrink-0 flex-nowrap h-100">
        {/* [TENOR 2026] Right-side tools block - Force anchored to the edge */}
        <div
          className={`${s["gp-ios-toggle"]} ${
            dataMode === "real" ? s["is-brvm"] : s["is-demo"]
          } flex-shrink-0`}
          onClick={() => dispatch(setDataMode(dataMode === "real" ? "mock" : "real"))}
          title={dataMode === "real" ? "Passer en mode Démo" : "Passer en mode Temps Réel (BRVM)"}
          role="switch"
          aria-checked={dataMode === "real"}
        >
          <span className={s["gp-ios-toggle-track"]}>
            <span className={s["gp-ios-toggle-label-left"]}>DEMO</span>
            <span className={s["gp-ios-toggle-knob"]} />
            <span className={s["gp-ios-toggle-label-right"]}>BRVM</span>
          </span>
        </div>

        <div className={`${s["gp-toolbar-v-divider"]} flex-shrink-0`}></div>

        <div
          className="d-flex align-items-center gap-2 position-relative flex-shrink-0 h-100"
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
              className={clsx(
                "bi bi-chevron-down",
                uiState.isAnonyme && "text-info",
                isPseudoDropdownOpen && s["rotate-180"]
              )}
              style={{
                fontSize: "0.8rem",
                marginTop: "1px",
                transition: "transform 0.2s ease",
              }}
            ></i>
          </div>
        </div>

        <div className={`${s["gp-toolbar-v-divider"]} flex-shrink-0`}></div>

        <div className={`${s["gp-toolbar-scroll-wrapper-right"]} flex-shrink-0`}>
          <div className={s["gp-toolbar-scroll-content-right"]}>
            <button
              className={clsx(
                s["gp-toolbar-btn"],
                "gp-toolbar-btn",
                s["hover-lift"],
                "hover-lift",
                "text-secondary"
              )}
              title="Sauvegarder l'analyse"
              onClick={handleSaveAnalysis}
            >
              <i className="bi bi-save"></i>
            </button>
            <button
              className={clsx(
                s["gp-toolbar-btn"],
                "gp-toolbar-btn",
                s["hover-lift"],
                "hover-lift",
                "text-secondary"
              )}
              title="Historique des analyses"
              onClick={handleOpenLoadModal}
            >
              <i className="bi bi-folder2-open"></i>
            </button>
            <button
              className={clsx(
                s["gp-toolbar-btn"],
                "gp-toolbar-btn",
                s["hover-lift"],
                "hover-lift",
                "text-secondary"
              )}
              title="Paramètres de l'indicateur"
              onClick={() => dispatch(setModalOpen({ modal: "settings", isOpen: true }))}
            >
              <i className="bi bi-nut"></i>
            </button>
            <button
              className={clsx(
                s["gp-toolbar-btn"],
                "gp-toolbar-btn",
                s["hover-lift"],
                "hover-lift",
                "text-secondary",
                uiState.isZenMode && s["active-zen"]
              )}
              title={
                uiState.isZenMode
                  ? "Quitter le mode Zen"
                  : "Mode Zen (Focus)"
              }
              onClick={() => dispatch(toggleZenMode())}
            >
              <i
                className={clsx(
                  "bi",
                  uiState.isZenMode ? "bi-fullscreen-exit" : "bi-fullscreen"
                )}
              ></i>
            </button>
            <button
              className={clsx(
                s["gp-toolbar-btn"],
                "gp-toolbar-btn",
                s["hover-lift"],
                "hover-lift",
                "text-secondary",
                uiState.isCapturing && "opacity-50"
              )}
              title="Prendre une capture"
              onClick={() => {}} // Hook implementation pending for capture
              disabled={uiState.isCapturing}
            >
              <i
                className={clsx(
                  "bi",
                  uiState.isCapturing ? "bi-hourglass-split" : "bi-camera"
                )}
              ></i>
            </button>
          </div>
        </div>

        <button
          className={clsx(
            "btn btn-sm rounded-pill flex-shrink-0 d-flex align-items-center justify-content-center",
            s["btn-publish"],
            "btn-publish",
            s["hover-lift"],
            "hover-lift",
            uiState.isPublishing && "disabled"
          )}
          style={{ height: "28px", padding: "0 16px" }}
          onClick={() => {}} // Hook implementation pending for publish
          disabled={uiState.isPublishing}
        >
          {uiState.isPublishing ? (
            <>
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>{" "}
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
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 49999,
              cursor: "default",
            }}
            onClick={() => setIsPseudoDropdownOpen(false)}
          />
          <div
            className={s["pseudo-dropdown"]}
            style={{
              position: "fixed",
              top: dropdownPos.top + 5,
              left: dropdownPos.left - 100,
              zIndex: 50000,
              width: "160px",
            }}
          >
            {ANONYMOUS_PSEUDOS.map((pseudo) => (
              <div
                key={pseudo}
                className={clsx(
                  s["pseudo-option"],
                  uiState.selectedPseudo === pseudo && s["active"]
                )}
                onClick={() => {
                  dispatch(setSelectedPseudo(pseudo));
                  setIsPseudoDropdownOpen(false);
                  if (!uiState.isAnonyme) dispatch(setAnonyme(true));
                }}
              >
                {uiState.selectedPseudo === pseudo && (
                  <i className="bi bi-check2"></i>
                )}{" "}
                {pseudo}
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