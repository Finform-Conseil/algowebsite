"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  useDispatch,
  useSelector } from "react-redux";
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
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { SEARCH_SYMBOL_ACTION_QUERY } from "@/core/infra/store/api/action.api";

// ============================================================================
// [TENOR 2026 HDR] TV-PARITY COMPARE MODAL
// SCAR-UX-01 FIX: Eradicated the broken "Replace" mode. This modal is now
// strictly dedicated to "Compare Symbols" exactly like TradingView (Image 2).
// It acts as a Smart Component, reading and dispatching directly to Redux.
// ============================================================================

type SymbolSearchMode = "replace" | "compare";
const MAX_SYMBOLS_STALE_AGE_MS = 5 * 60 * 1000;

interface SearchSymbolModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Legacy props kept optional to prevent breaking ModalOrchestrator during migration
  onSearch?: (symbol: string, mode: SymbolSearchMode) => void;
  initialMode?: SymbolSearchMode;
  currentSymbol?: string;
  comparisonSymbols?: string[];
}

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

type SearchSecurity = BRVMSecurity & { searchAliases?: string[] };
type SymbolSourceState = "loading" | "api" | "api_empty" | "api_unavailable" | "api_stale";

const findSecurityBySymbol = (value: string, securities: SearchSecurity[]): SearchSecurity | undefined => {
  const ticker = resolveSecurityTicker(value);
  return securities.find((security) => (
    normalizeSearch(security.ticker) === ticker
    || security.searchAliases?.some((alias) => normalizeSearch(alias) === ticker)
  ));
};

const toSearchSector = (action: ActionEntity): SearchSecurity["sector"] => {
  const value = normalizeSearch(action.society?.industry?.name ?? action.society?.activity?.name ?? "");
  if (value.includes("BANK") || value.includes("FINANC")) return "Banking";
  if (value.includes("TELECOM")) return "Telecom";
  if (value.includes("ENERG") || value.includes("PETROL")) return "Energy";
  if (value.includes("DISTRIB") || value.includes("RETAIL")) return "Distribution";
  if (value.includes("INDUSTR")) return "Industry";
  return "Other";
};

const toSearchSecurity = (action: ActionEntity): SearchSecurity => {
  const name = action.society?.name || action.ticker;
  const searchAliases = BRVM_SECURITIES
    .filter((security) => normalizeSearch(security.name) === normalizeSearch(name))
    .flatMap((security) => [security.ticker, security.name]);

  return {
  name,
  ticker: action.ticker,
  sector: toSearchSector(action),
  marketCap: Number.isFinite(action.latest_valuation_ratio?.market_cap) ? (action.latest_valuation_ratio?.market_cap as number) / 1_000_000 : 0,
  priceChangeD1: Number.isFinite(action.latest_price_metric?.change_1d_pct) ? (action.latest_price_metric?.change_1d_pct as number) : 0,
  peRatio: Number.isFinite(action.latest_valuation_ratio?.pe_ttm) ? (action.latest_valuation_ratio?.pe_ttm as number) : 0,
  returnYTD: Number.isFinite(action.latest_price_metric?.change_ytd_pct) ? (action.latest_price_metric?.change_ytd_pct as number) : 0,
  revenueT12M: 0,
  epsT12M: 0,
  country: action.society?.country?.name || "UEMOA",
  isin: action.isin,
  exchange: action.bourse?.ticker || "BRVM",
  currency: action.bourse?.currency?.symbol === "XAF" ? "XAF" : "XOF",
  status: "active",
  searchAliases,
  };
};

const isBrvmAction = (action: ActionEntity): boolean => {
  const exchange = normalizeSearch(`${action.bourse?.ticker ?? ""} ${action.bourse?.name ?? ""}`);
  return exchange.includes("BRVM");
};

const mergeApiSecurities = (
  current: SearchSecurity[],
  actions: ActionEntity[],
): SearchSecurity[] => {
  const securitiesByTicker = new Map(
    current.map((security) => [normalizeSearch(security.ticker), security]),
  );

  actions.filter(isBrvmAction).forEach((action) => {
    const ticker = normalizeSearch(action.ticker);
    if (ticker && !securitiesByTicker.has(ticker)) {
      securitiesByTicker.set(ticker, toSearchSecurity(action));
    }
  });

  return Array.from(securitiesByTicker.values());
};

const getSecurityKind = (security: BRVMSecurity): string =>
  security.sector === "Market Indices" ? "index" : "stock";

const scoreSecurity = (security: SearchSecurity, query: string): number => {
  if (!query) return 0;
  const symbol = normalizeSearch(security.ticker);
  const name = normalizeSearch(security.name);
  const isin = normalizeSearch(security.isin ?? "");
  const sector = normalizeSearch(security.sector);
  const country = normalizeSearch(security.country);
  const aliases = (security.searchAliases ?? []).map((alias: string) => normalizeSearch(alias));

  if (symbol === query) return 120;
  if (aliases.includes(query)) return 118;
  if (resolveSecurityTicker(query) === symbol) return 116;
  if (symbol.startsWith(query)) return 105;
  if (aliases.some((alias) => alias.startsWith(query))) return 103;
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
  const { getAllActions } = useActionRepository();
  
  // Smart Component: Read directly from Redux
  const uiState = useSelector(selectUiState);
  const chartConfig = useSelector(selectChartConfig);
  
  const comparisonSymbols = uiState.comparisonSymbols;
  const currentSymbol = chartConfig.symbol;

  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchModalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [searchInput, setSearchInput] = useState("");
  const [apiSecurities, setApiSecurities] = useState<SearchSecurity[] | null>(null);
  const apiSecuritiesRef = useRef<SearchSecurity[] | null>(null);
  const lastSuccessfulRefreshRef = useRef<number | null>(null);
  const [isLoadingSymbols, setIsLoadingSymbols] = useState(false);
  const [symbolSource, setSymbolSource] = useState<SymbolSourceState>("loading");
  const normalizedInput = normalizeSearch(searchInput);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    const cachedSecurities = apiSecuritiesRef.current;
    const hasUsableLocalCache = cachedSecurities !== null && cachedSecurities.length > 0;

    setIsLoadingSymbols(!hasUsableLocalCache);
    setSymbolSource(hasUsableLocalCache ? "api" : "loading");

    const applySecurities = (securities: SearchSecurity[]) => {
      if (cancelled) return;
      apiSecuritiesRef.current = securities;
      setApiSecurities(securities);
    };

    const revalidateCatalog = async (
      totalPages: number,
      initialSecurities: SearchSecurity[],
    ) => {
      const refreshRequests = Array.from(
        { length: totalPages },
        (_, index) => getAllActions(
          { ...SEARCH_SYMBOL_ACTION_QUERY, page: index + 1 },
          { forceRefetch: true },
        ),
      );
      const refreshResults = await Promise.allSettled(refreshRequests);

      if (cancelled) return;

      const successfulActions: ActionEntity[] = [];
      let hasRefreshFailure = false;
      refreshResults.forEach((result) => {
        if (result.status === "fulfilled") {
          successfulActions.push(...(result.value.data || []));
        } else {
          hasRefreshFailure = true;
        }
      });

      const refreshedSecurities = successfulActions.length > 0
        ? mergeApiSecurities([], successfulActions)
        : hasRefreshFailure
          ? initialSecurities
          : [];

      applySecurities(refreshedSecurities);
      if (!hasRefreshFailure) {
        lastSuccessfulRefreshRef.current = Date.now();
      }
      setSymbolSource(
        hasRefreshFailure
          ? "api_stale"
          : refreshedSecurities.length > 0
            ? "api"
            : "api_empty",
      );
      setIsLoadingSymbols(false);
    };

    const loadApiSecurities = async () => {
      try {
        const firstPage = await getAllActions(SEARCH_SYMBOL_ACTION_QUERY);
        const firstSecurities = mergeApiSecurities([], firstPage.data || []);

        if (cancelled) return;
        applySecurities(firstSecurities);
        lastSuccessfulRefreshRef.current = Date.now();
        setSymbolSource(firstSecurities.length > 0 ? "api" : "api_empty");
        setIsLoadingSymbols(false);

        const totalPages = Math.max(1, firstPage.total_pages || 1);
        void revalidateCatalog(totalPages, firstSecurities);
      } catch {
        if (cancelled) return;
        const staleAge = lastSuccessfulRefreshRef.current === null
          ? Number.POSITIVE_INFINITY
          : Date.now() - lastSuccessfulRefreshRef.current;

        if (hasUsableLocalCache && staleAge <= MAX_SYMBOLS_STALE_AGE_MS) {
          applySecurities(cachedSecurities);
          setSymbolSource("api_stale");
          setIsLoadingSymbols(false);
          return;
        }

        applySecurities([]);
        setSymbolSource("api_unavailable");
        setIsLoadingSymbols(false);
      }
    };

    void loadApiSecurities();
    return () => {
      cancelled = true;
    };
  }, [getAllActions, isOpen]);

  // --- DATA DERIVATION ---
  const searchCatalog = useMemo(() => apiSecurities ?? [], [apiSecurities]);
  const results = useMemo(() => {
    if (!normalizedInput || isLoadingSymbols) return [];
    return searchCatalog
      .filter((security) => security.status !== "delisted")
      .map((security) => ({ security, score: scoreSecurity(security, normalizedInput) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.security.ticker.localeCompare(b.security.ticker))
      .slice(0, 10)
      .map((item) => item.security);
  }, [isLoadingSymbols, normalizedInput, searchCatalog]);

  const sourceStatusMessage = symbolSource === "api_unavailable"
    ? "Impossible de charger les symboles depuis l’API."
    : symbolSource === "api_stale"
      ? "Données précédentes conservées — revalidation API indisponible."
      : symbolSource === "api_empty"
        ? "L’API n’a fourni aucun titre BRVM."
        : null;

  const normalizedCurrentSymbol = resolveSecurityTicker(currentSymbol);
  const normalizedComparisonSymbols = useMemo(
    () => new Set(comparisonSymbols.map((symbol) => resolveSecurityTicker(symbol))),
    [comparisonSymbols]
  );

  const addedInstruments = useMemo(
    () => comparisonSymbols
      .map((symbol) => findSecurityBySymbol(symbol, searchCatalog))
      .filter((security): security is BRVMSecurity => Boolean(security)),
    [comparisonSymbols, searchCatalog]
  );

  const recentInstruments = useMemo(() => searchCatalog
    .filter((security) => security.status !== "delisted")
    .filter((security) => !normalizedComparisonSymbols.has(resolveSecurityTicker(security.ticker)))
    .filter((security) => resolveSecurityTicker(security.ticker) !== normalizedCurrentSymbol)
    .slice(0, 6), [normalizedComparisonSymbols, normalizedCurrentSymbol, searchCatalog]);

  const visibleInstruments = normalizedInput ? results : recentInstruments;

  // --- HANDLERS ---
  const handleClose = useCallback(() => {
    onClose();
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

  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => window.clearTimeout(focusTimer);
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
          {sourceStatusMessage && (
            <div role="status" style={{ padding: "10px 16px", color: "#d1d4dc", background: "rgba(255, 152, 0, 0.12)", fontSize: "12px" }}>
              {sourceStatusMessage}
            </div>
          )}

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
              {isLoadingSymbols ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "#787b86", fontSize: "13px" }}>
                  <style>{"@keyframes symbol-search-spin { to { transform: rotate(360deg); } }"}</style>
                  <span
                    aria-hidden="true"
                    style={{
                      display: "block",
                      width: "22px",
                      height: "22px",
                      margin: "0 auto 10px",
                      border: "3px solid rgba(41, 98, 255, 0.24)",
                      borderTopColor: "#2962ff",
                      borderRadius: "50%",
                      animation: "symbol-search-spin 0.8s linear infinite"
                    }}
                  />
                  Loading symbols...
                </div>
              ) : visibleInstruments.length > 0 ? (
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
