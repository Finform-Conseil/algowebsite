"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useDispatch,
  useSelector } from "react-redux";
import { animate } from "framer-motion";
import clsx from "clsx";
import { BaseModal } from "../../common/primitives/BaseModal";
import { addComparisonSymbol,
  removeComparisonSymbol,
} from "../../../store/technicalAnalysisSlice";
import {
  selectUiState,
  selectChartConfig,
} from "../../../store/selectors";
import { useGlobalNotification } from "@/components/design-system/layouts/HeaderHome/context/GlobalNotificationContext";
import { BRVM_SECURITIES, type BRVMSecurity } from "@/core/data/brvm-securities";
import { BRVM_NAME_TO_TICKER } from "@/shared/utils/brvm-mapping";
import { BrvmLogoMark } from "@/components/design-system/commons/BrvmLogoMark/BrvmLogoMark";

// ============================================================================
// [TENOR 2026 HDR] TV-PARITY COMPARE MODAL
// SCAR-UX-01 FIX: Eradicated the broken "Replace" mode. This modal is now
// strictly dedicated to "Compare Symbols" exactly like TradingView (Image 2).
// It acts as a Smart Component, reading and dispatching directly to Redux.
// ============================================================================

type SymbolSearchMode = "replace" | "compare";

interface SearchSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Legacy props kept optional to prevent breaking ModalOrchestrator during migration
  onSearch?: (symbol: string, mode: SymbolSearchMode) => void;
  initialMode?: SymbolSearchMode;
  currentSymbol?: string;
  comparisonSymbols?: string[];
}

const RECENT_TICKERS = ["BRVMC", "SNTS", "BOAC", "SGBC", "ETIT", "SPHC"];

const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const resolveSecurityTicker = (value: string): string => {
  const normalized = normalizeSearch(value);
  return BRVM_NAME_TO_TICKER[normalized] ?? normalized;
};

const findSecurityBySymbol = (value: string): BRVMSecurity | undefined => {
  const ticker = resolveSecurityTicker(value);
  return BRVM_SECURITIES.find((security) => normalizeSearch(security.ticker) === ticker);
};

const getSecurityKind = (security: BRVMSecurity): string =>
  security.sector === "Market Indices" ? "index" : "stock";

const scoreSecurity = (security: BRVMSecurity, query: string): number => {
  if (!query) return 0;
  const symbol = normalizeSearch(security.ticker);
  const name = normalizeSearch(security.name);
  const isin = normalizeSearch(security.isin ?? "");
  const sector = normalizeSearch(security.sector);
  const country = normalizeSearch(security.country);

  if (symbol === query) return 120;
  if (resolveSecurityTicker(query) === symbol) return 118;
  if (symbol.startsWith(query)) return 105;
  if (name.startsWith(query)) return 92;
  if (name.includes(query)) return 80;
  if (sector.includes(query)) return 58;
  if (country.includes(query)) return 54;
  if (isin.includes(query)) return 50;
  return 0;
};

export const SearchSymbolModal: React.FC<SearchSymbolModalProps> = ({
  isOpen,
  onClose,
}) => {
  const dispatch = useDispatch();
  const { addNotification } = useGlobalNotification();
  
  // Smart Component: Read directly from Redux
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  
  const comparisonSymbols = uiState.comparisonSymbols;
  const currentSymbol = chartConfig.symbol;

  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const normalizedInput = normalizeSearch(searchInput);

  // --- DATA DERIVATION ---
  const results = useMemo(() => {
    if (!normalizedInput) return [];
    return BRVM_SECURITIES
      .filter((security) => security.status !== "delisted")
      .map((security) => ({ security, score: scoreSecurity(security, normalizedInput) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.security.ticker.localeCompare(b.security.ticker))
      .slice(0, 10)
      .map((item) => item.security);
  }, [normalizedInput]);

  const normalizedCurrentSymbol = resolveSecurityTicker(currentSymbol);
  const normalizedComparisonSymbols = useMemo(
    () => new Set(comparisonSymbols.map((symbol) => resolveSecurityTicker(symbol))),
    [comparisonSymbols]
  );

  const addedInstruments = useMemo(
    () => comparisonSymbols
      .map((symbol) => findSecurityBySymbol(symbol))
      .filter((security): security is BRVMSecurity => Boolean(security)),
    [comparisonSymbols]
  );

  const recentInstruments = useMemo(
    () => RECENT_TICKERS
      .map((symbol) => findSecurityBySymbol(symbol))
      .filter((security): security is BRVMSecurity => Boolean(security))
      .filter((security) => !normalizedComparisonSymbols.has(security.ticker) && security.ticker !== normalizedCurrentSymbol),
    [normalizedComparisonSymbols, normalizedCurrentSymbol]
  );

  const visibleInstruments = normalizedInput ? results : recentInstruments;

  // --- HANDLERS ---
  const handleClose = useCallback(() => {
    if (!searchOverlayRef.current || !searchModalRef.current) {
      onClose();
      return;
    }
    animate(searchModalRef.current, { scale: 0.95, opacity: 0 }, { duration: 0.2, ease: "easeIn" });
    animate(searchOverlayRef.current, { opacity: 0 }, {
      duration: 0.2,
      onComplete: () => {
        if (searchOverlayRef.current) searchOverlayRef.current.style.visibility = "hidden";
        onClose();
      }
    });
  }, [onClose]);

  const handleToggleSymbol = useCallback((security: BRVMSecurity) => {
    const normalizedSymbol = resolveSecurityTicker(security.ticker);

    if (normalizedSymbol === normalizedCurrentSymbol) {
      addNotification({ title: "Action impossible", message: `${security.ticker} est déjà le graphique principal.`, type: "warning", iconType: "faExclamationTriangle" });
      return;
    }

    if (normalizedComparisonSymbols.has(normalizedSymbol)) {
      const storedSymbol = comparisonSymbols.find((symbol) => resolveSecurityTicker(symbol) === normalizedSymbol) ?? security.ticker;
      dispatch(removeComparisonSymbol(storedSymbol));
    } else {
      if (comparisonSymbols.length >= 5) {
        addNotification({ title: "Limite atteinte", message: "Maximum 5 symboles en comparaison.", type: "warning", iconType: "faExclamationTriangle" });
        return;
      }
      dispatch(addComparisonSymbol(security.ticker));
      setSearchInput(""); // Clear search after adding
    }
  }, [normalizedCurrentSymbol, normalizedComparisonSymbols, comparisonSymbols, dispatch, addNotification]);

  // Reset input when opening
  useEffect(() => {
    if (isOpen) {
      setSearchInput("");
    }
  }, [isOpen]);

  // GSAP-like Animation for Modal
  useEffect(() => {
    if (isOpen && searchOverlayRef.current && searchModalRef.current) {
      searchOverlayRef.current.style.opacity = "0";
      searchOverlayRef.current.style.visibility = "visible";
      searchModalRef.current.style.opacity = "0";
      searchModalRef.current.style.transform = "scale(0.95)";
      
      animate(searchOverlayRef.current, { opacity: 1 }, { duration: 0.2, ease: "easeOut" });
      animate(searchModalRef.current, { scale: 1, opacity: 1 }, { duration: 0.3, type: "spring", bounce: 0.3 });
      
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) handleClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  // --- RENDER HELPERS ---
  const renderInstrumentRow = (security: BRVMSecurity, isAddedSection: boolean) => {
    const normalizedSymbol = resolveSecurityTicker(security.ticker);
    const isCurrent = normalizedSymbol === normalizedCurrentSymbol;
    const isAdded = normalizedComparisonSymbols.has(normalizedSymbol);

    return (
      <div
        key={`${isAddedSection ? 'added' : 'result'}-${security.ticker}`}
        className={clsx("tv-compare-row", (isAdded || isCurrent) && "is-selected")}
        onClick={() => !isCurrent && handleToggleSymbol(security)}
        style={{
          display: "flex",
          alignItems: "center",
          padding: "10px 14px",
          cursor: isCurrent ? "default" : "pointer",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          transition: "background 0.15s ease",
          opacity: isCurrent ? 0.5 : 1
        }}
        onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <BrvmLogoMark
          ticker={security.ticker}
          name={security.name}
          logoUrl={security.logoUrl}
          sector={security.sector}
          status={security.status}
          size={34}
          shape="rounded"
          imageSizes="34px"
          style={{ marginRight: 14 }}
        />

        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ color: "#d1d4dc", fontSize: "14px", fontWeight: 700 }}>{security.ticker}</span>
            <span style={{ color: "#787b86", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {security.name}
            </span>
          </div>
          <span style={{ color: "#5d6b7e", fontSize: "11px", marginTop: 2 }}>
            {security.country} · {security.sector}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            <span style={{ color: "#d1d4dc", fontSize: "12px", fontWeight: 600 }}>{security.exchange ?? "BRVM"}</span>
            <span style={{ color: "#787b86", fontSize: "11px" }}>{getSecurityKind(security)}</span>
          </div>
          <div style={{ width: "20px", display: "flex", justifyContent: "flex-end" }}>
            {isAdded && <i className="bi bi-check-lg" style={{ color: "#2962ff", fontSize: "16px", strokeWidth: 1 }}></i>}
            {isCurrent && <i className="bi bi-bar-chart-fill" style={{ color: "#787b86", fontSize: "14px" }} title="Graphique principal"></i>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Compare symbols"
      icon={null} // TV doesn't use an icon here
      overlayRef={searchOverlayRef}
      contentRef={searchModalRef}
      maxWidth="700px"
      hideFooter={true}
      className="tv-compare-modal-override"
    >
      {/* Inline styles to override BaseModal padding for flush edges */}
      <style>{`
        .tv-compare-modal-override .gp-modal-body {
          padding: 0 !important;
          display: flex;
          flex-direction: column;
          height: 60vh;
          min-height: 400px;
        }
        .tv-compare-modal-override .gp-modal-header {
          border-bottom: none !important;
          padding-bottom: 0 !important;
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        
        {/* Search Input Area */}
        <div style={{ padding: "0 16px 12px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <i className="bi bi-search" style={{ position: "absolute", left: "12px", color: "#787b86", fontSize: "16px" }}></i>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Symbol, ISIN, or company name"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                padding: "10px 12px 10px 38px",
                color: "#d1d4dc",
                fontSize: "15px",
                outline: "none",
                transition: "border-color 0.2s, background 0.2s"
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2962ff";
                e.target.style.background = "rgba(255,255,255,0.06)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
                e.target.style.background = "rgba(255,255,255,0.04)";
              }}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            {searchInput && (
              <i 
                className="bi bi-x-lg" 
                style={{ position: "absolute", right: "12px", color: "#787b86", fontSize: "14px", cursor: "pointer" }}
                onClick={() => setSearchInput("")}
              ></i>
            )}
          </div>
        </div>

        {/* Scrollable Lists Area */}
        <div className="gp-custom-scrollbar" style={{ flex: 1, overflowY: "auto" }}>
          
          {/* ADDED SYMBOLS SECTION */}
          {!normalizedInput && addedInstruments.length > 0 && (
            <div style={{ marginBottom: "8px" }}>
              <div style={{ 
                padding: "16px 16px 8px 16px", 
                fontSize: "11px", 
                fontWeight: 600, 
                color: "#787b86", 
                letterSpacing: "0.04em",
                textTransform: "uppercase" 
              }}>
                Added Symbols
              </div>
              <div>
                {addedInstruments.map((instrument) => renderInstrumentRow(instrument, true))}
              </div>
            </div>
          )}

          {/* RECENT / SEARCH RESULTS SECTION */}
          <div>
            <div style={{ 
              padding: "16px 16px 8px 16px", 
              fontSize: "11px", 
              fontWeight: 600, 
              color: "#787b86", 
              letterSpacing: "0.04em",
              textTransform: "uppercase" 
            }}>
              {normalizedInput ? "Search Results" : "Recent Symbols"}
            </div>
            <div>
              {visibleInstruments.length > 0 ? (
                visibleInstruments.map((instrument) => renderInstrumentRow(instrument, false))
              ) : (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#787b86", fontSize: "13px" }}>
                  No symbols match your criteria
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </BaseModal>
  );
};

// --- EOF ---
