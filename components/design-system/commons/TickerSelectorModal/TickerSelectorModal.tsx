"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import { createPortal } from "react-dom";
import { BRVMSecurity, SECTOR_COLORS } from "@/core/data/brvm-securities";
import type { ActionEntity } from "@/core/domain/entities/action.entity";
import { useActionRepository } from "@/core/infra/repositories/action.repository.impl";
import { BrvmLogoMark } from "@/components/design-system/commons/BrvmLogoMark/BrvmLogoMark";
import { useTickerSelector } from "./context/TickerSelectorContext";

// ============================================================================
// [TENOR 2026 SRE] ZERO-LAG TICKER SELECTOR MODAL
// Architecture:
// 1. useDeferredValue: Decouples typing (120Hz) from list filtering/rendering.
// 2. React.memo (O(1) Updates): Only the newly active and previously active rows re-render during keyboard navigation.
// 3. Stable native scrolling: containment without content-visibility layout jumps.
// 4. Safe Highlighting: No dangerouslySetInnerHTML (XSS Shield).
// ============================================================================

// --- ICONS ---
const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// --- SAFE HIGHLIGHTER ---
const HighlightMatch = React.memo(({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} style={{ color: "#ff9f04", fontWeight: 700 }}>{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});
HighlightMatch.displayName = "HighlightMatch";

// --- FORMATTERS ---
const formatMarketCap = (value?: number | null) => {
  if (value == null) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}B FCFA`;
  return `${value.toFixed(1)}M FCFA`;
};

type SelectorSecurity = Omit<
  BRVMSecurity,
  "marketCap" | "priceChangeD1" | "peRatio" | "returnYTD" | "revenueT12M" | "epsT12M"
> & {
  marketCap?: number | null;
  priceChangeD1?: number | null;
  peRatio?: number | null;
  returnYTD?: number | null;
  revenueT12M?: number | null;
  epsT12M?: number | null;
};

const normalizeSearch = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();

const toSelectorSector = (action: ActionEntity): SelectorSecurity["sector"] => {
  const value = normalizeSearch(
    `${action.society?.industry?.name ?? ""} ${action.society?.activity?.name ?? ""}`
  );
  if (value.includes("BANK") || value.includes("FINANC")) return "Banking";
  if (value.includes("TELECOM")) return "Telecom";
  if (value.includes("ENERG") || value.includes("PETROL")) return "Energy";
  if (value.includes("DISTRIB") || value.includes("RETAIL")) return "Distribution";
  if (
    value.includes("INDUSTR") ||
    value.includes("STAPLES") ||
    value.includes("MATERIAL") ||
    value.includes("MANUFACTUR") ||
    value.includes("CHEMICAL") ||
    value.includes("TOBACCO") ||
    value.includes("FOOD")
  ) return "Industry";
  return "Other";
};

const isBrvmAction = (action: ActionEntity | null | undefined): action is ActionEntity => {
  if (!action || typeof action !== "object") return false;
  const exchangeTicker = String(action.bourse?.ticker ?? "").trim().toUpperCase();
  const exchangeName = String(action.bourse?.name ?? "").trim().toUpperCase();
  return exchangeTicker.includes("BRVM") || exchangeName.includes("BRVM");
};

const toSelectorSecurity = (action: ActionEntity): SelectorSecurity | null => {
  const ticker = normalizeSearch(action.ticker);
  if (!ticker) return null;
  return {
    name: String(action.society?.name || ticker),
    ticker,
    sector: toSelectorSector(action),
    marketCap: Number.isFinite(action.latest_valuation_ratio?.market_cap) ? (action.latest_valuation_ratio?.market_cap as number) / 1_000_000 : null,
    priceChangeD1: Number.isFinite(action.latest_price_metric?.change_1d_pct) ? action.latest_price_metric?.change_1d_pct : null,
    peRatio: Number.isFinite(action.latest_valuation_ratio?.pe_ttm) ? action.latest_valuation_ratio?.pe_ttm : null,
    returnYTD: Number.isFinite(action.latest_price_metric?.change_ytd_pct) ? action.latest_price_metric?.change_ytd_pct : null,
    revenueT12M: null,
    epsT12M: null,
    country: action.society?.country?.name || "UEMOA",
    isin: action.isin,
    exchange: action.bourse?.ticker || "BRVM",
    currency: action.bourse?.currency?.symbol === "XAF" ? "XAF" : "XOF",
    status: "active"
  };
};

// --- TYPES ---
type FlattenedItem =
  | { type: "header"; label: string; count: number; color: string }
  | { type: "item"; data: SelectorSecurity; globalIndex: number };

// ============================================================================
// [TENOR 2026] O(1) MEMOIZED ROW COMPONENT
// ============================================================================
interface TickerRowProps {
  item: SelectorSecurity;
  isActive: boolean;
  query: string;
  onSelect: (ticker: string) => void;
  onHover: (ticker: string) => void;
}

const TickerRow = React.memo(({ item, isActive, query, onSelect, onHover }: TickerRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll into view when navigated via keyboard
  useEffect(() => {
    if (isActive && rowRef.current) {
      rowRef.current.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [isActive]);

  const isPositive = (item.priceChangeD1 ?? 0) >= 0;
  const priceColor = item.priceChangeD1 == null ? "#a0aec0" : isPositive ? "#00da3c" : "#f23645";
  const sign = item.priceChangeD1 != null && isPositive ? "+" : "";

  return (
    <div
      ref={rowRef}
      className={`tsm-row ${isActive ? "active" : ""}`}
      onClick={() => onSelect(item.ticker)}
      onMouseEnter={() => onHover(item.ticker)}
    >
      {isActive && <div className="tsm-row-indicator" />}
      
      <BrvmLogoMark
        ticker={item.ticker}
        name={item.name}
        logoUrl={item.logoUrl}
        sector={item.sector}
        status={item.status}
        size={38}
        imageSizes="38px"
      />

      <div className="tsm-info">
        <div className="tsm-ticker"><HighlightMatch text={item.ticker} query={query} /></div>
        <div className="tsm-name"><HighlightMatch text={item.name} query={query} /></div>
      </div>

      <div className="tsm-metrics">
        <div className="tsm-price-change" style={{ color: priceColor }}>
          {item.priceChangeD1 == null ? "—" : `${sign}${item.priceChangeD1.toFixed(2)}%`}
        </div>
        <div className="tsm-market-cap">
          {formatMarketCap(item.marketCap)}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  // Strict equality check to guarantee O(1) re-renders
  return prev.item.ticker === next.item.ticker && 
         prev.isActive === next.isActive && 
         prev.query === next.query;
});
TickerRow.displayName = "TickerRow";

// ============================================================================
// MAIN MODAL COMPONENT
// ============================================================================
export const TickerSelectorModal: React.FC = () => {
  const { isModalOpen, closeModal, selectByTicker } = useTickerSelector();
  const { getAllActions } = useActionRepository();

  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  const [apiSecurities, setApiSecurities] = useState<SelectorSecurity[] | null>(null);
  const [sourceState, setSourceState] = useState<"loading" | "api" | "api_empty" | "api_error">("loading");
  const [isLoadingSecurities, setIsLoadingSecurities] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset state on open
  useEffect(() => {
    if (isModalOpen) {
      setSearchQuery("");
      setActiveTicker(null);
      // Focus input after a tiny delay to allow CSS transition
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;
    let cancelled = false;
    setIsLoadingSecurities(true);
    setApiSecurities(null);
    setSourceState("loading");

    const loadApiSecurities = async () => {
      try {
        const firstPage = await getAllActions({ page: 1, page_size: 100 });
        const totalPages = Math.max(1, firstPage.total_pages || 1);
        const pageResults = totalPages > 1
          ? await Promise.allSettled(
              Array.from({ length: totalPages - 1 }, (_, index) =>
                getAllActions({ page: index + 2, page_size: 100 })
              )
            )
          : [];
        if (cancelled) return;

        const pages = [
          firstPage,
          ...pageResults.flatMap((result) => result.status === "fulfilled" ? [result.value] : [])
        ];
        const unique = new Map<string, SelectorSecurity>();
        pages
          .flatMap((page) => Array.isArray(page.data) ? page.data : [])
          .filter(isBrvmAction)
          .forEach((action) => {
            const security = toSelectorSecurity(action);
            if (security && !unique.has(security.ticker)) unique.set(security.ticker, security);
          });

        const securities = Array.from(unique.values());
        setApiSecurities(securities);
        setSourceState(securities.length > 0 ? "api" : "api_empty");
      } catch {
        if (!cancelled) {
          setApiSecurities([]);
          setSourceState("api_error");
        }
      } finally {
        if (!cancelled) setIsLoadingSecurities(false);
      }
    };

    void loadApiSecurities();
    return () => { cancelled = true; };
  }, [getAllActions, isModalOpen]);

  const searchCatalog = apiSecurities ?? [];

  // --- FILTERING & GROUPING (Background Thread via useDeferredValue) ---
  const { flattenedList, selectableTickers, totalCount } = useMemo(() => {
    const query = normalizeSearch(deferredQuery);

    // 1. Filter
    const filtered = searchCatalog.filter((s) =>
      normalizeSearch(s.ticker).includes(query) ||
      normalizeSearch(s.name).includes(query) ||
      normalizeSearch(s.sector).includes(query)
    );

    // 2. Group
    const grouped = filtered.reduce((acc, security) => {
      if (!acc[security.sector]) acc[security.sector] = [];
      acc[security.sector].push(security);
      return acc;
    }, {} as Record<string, SelectorSecurity[]>);

    // 3. Flatten for Virtualized/Keyboard Navigation
    const flat: FlattenedItem[] = [];
    const selectable: string[] = [];
    let globalIdx = 0;

    // Order: Market Indices first, then Banking, then others
    const sectorOrder = ["Market Indices", "Banking", "Telecom", "Energy", "Industry", "Distribution", "Other"];
    const availableSectors = Object.keys(grouped).sort((a, b) => {
      const idxA = sectorOrder.indexOf(a);
      const idxB = sectorOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    });

    availableSectors.forEach(sector => {
      const items = grouped[sector];
      flat.push({ 
        type: "header", 
        label: sector.toUpperCase(), 
        count: items.length,
        color: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] || "#a0aec0"
      });
      
      items.forEach(item => {
        flat.push({ type: "item", data: item, globalIndex: globalIdx });
        selectable.push(item.ticker);
        globalIdx++;
      });
    });

    return { flattenedList: flat, selectableTickers: selectable, totalCount: filtered.length };
  }, [deferredQuery, searchCatalog]);

  // Auto-select first item when search changes
  useEffect(() => {
    if (selectableTickers.length > 0 && (!activeTicker || !selectableTickers.includes(activeTicker))) {
      setActiveTicker(selectableTickers[0]);
    } else if (selectableTickers.length === 0) {
      setActiveTicker(null);
    }
  }, [selectableTickers, activeTicker]);

  // --- HANDLERS ---
  const handleSelect = useCallback((ticker: string) => {
    if (selectByTicker(ticker)) {
      closeModal();
    }
  }, [selectByTicker, closeModal]);

  const handleHover = useCallback((ticker: string) => {
    setActiveTicker(ticker);
  }, []);

  // --- KEYBOARD ENGINE ---
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeModal();
        return;
      }

      if (selectableTickers.length === 0) return;

      const currentIndex = activeTicker ? selectableTickers.indexOf(activeTicker) : -1;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < selectableTickers.length - 1 ? currentIndex + 1 : 0;
        setActiveTicker(selectableTickers[nextIndex]);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : selectableTickers.length - 1;
        setActiveTicker(selectableTickers[prevIndex]);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (activeTicker) handleSelect(activeTicker);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, activeTicker, selectableTickers, handleSelect, closeModal]);

  if (!isModalOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="tsm-overlay" onMouseDown={closeModal}>
      {/* INJECTED CSS FOR EXACT FIDELITY */}
      <style>{`
        .tsm-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 13vh; animation: tsmFadeIn 0.2s ease-out;
        }
        .tsm-modal {
          width: 100%; max-width: 640px; background: rgba(16, 42, 67, 0.98);
          border: 1px solid var(--gp-border-color, #244869); border-radius: var(--bs-border-radius-lg, 12px);
          box-shadow: 0 20px 50px rgba(0,0,0,0.42), 0 0 0 1px rgba(255,255,255,0.06);
          display: flex; flex-direction: column; max-height: 80vh;
          overflow: hidden; animation: tsmSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .tsm-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px; border-bottom: 1px solid var(--gp-border-color-light, #2d455c);
          background: linear-gradient(to right, rgba(255,255,255,0.035), transparent);
        }
        .tsm-title {
          display: flex; align-items: center; gap: 10px;
          color: var(--gp-text-primary, #f8f9fa); font-size: 16px; font-weight: 600; font-family: var(--gp-font-family-nav, 'Inter', sans-serif);
        }
        .tsm-title-icon { color: var(--gp-accent-gold, #ff9f04); }
        .tsm-close {
          background: rgba(255,255,255,0.04); border: 1px solid var(--gp-border-color-light, #2d455c); color: var(--gp-text-secondary, #a0aec0);
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .tsm-close:hover { background: rgba(255,255,255,0.1); color: var(--gp-text-primary, #f8f9fa); }
        .tsm-search-container { padding: 16px 20px; border-bottom: 1px solid var(--gp-border-color-light, #2d455c); }
        .tsm-search-box {
          position: relative; display: flex; align-items: center;
          background: rgba(28, 58, 87, 0.9); border: 1px solid var(--gp-accent-gold, #ff9f04); border-radius: var(--gp-radius-md, 8px);
          padding: 0 14px; height: 48px; box-shadow: 0 0 0 1px rgba(255, 159, 4, 0.2);
          transition: box-shadow 0.2s;
        }
        .tsm-search-box:focus-within { box-shadow: 0 0 0 3px rgba(255, 159, 4, 0.15); }
        .tsm-search-icon { color: var(--gp-accent-gold, #ff9f04); margin-right: 12px; }
        .tsm-input {
          flex: 1; background: transparent; border: none; outline: none;
          color: var(--gp-text-primary, #f8f9fa); font-size: 15px; font-family: var(--gp-font-family-base, 'Inter', sans-serif);
        }
        .tsm-input::placeholder { color: var(--gp-text-secondary, #a0aec0); }
        .tsm-list {
          flex: 1; overflow-y: auto; padding: 8px 0;
          scrollbar-width: thin; scrollbar-color: var(--gp-border-color-light, #2d455c) transparent;
        }
        .tsm-list::-webkit-scrollbar { width: 6px; }
        .tsm-list::-webkit-scrollbar-thumb { background: var(--gp-border-color-light, #2d455c); border-radius: 3px; }
        .tsm-sector-header {
          display: flex; align-items: center; gap: 8px;
          padding: 16px 20px 8px;
        }
        .tsm-sector-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(255,255,255,0.08); padding: 4px 10px; border-radius: 20px;
        }
        .tsm-sector-dot { width: 8px; height: 8px; border-radius: 50%; }
        .tsm-sector-name { color: var(--gp-text-primary, #f8f9fa); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
        .tsm-sector-count { color: var(--gp-text-secondary, #a0aec0); font-size: 11px; font-weight: 500; }
        .tsm-row {
          position: relative; display: flex; align-items: center; gap: 16px;
          padding: 10px 20px; cursor: pointer; transition: background 0.1s;
          contain: content;
        }
        .tsm-row.active { background: rgba(28, 58, 87, 0.86); }
        .tsm-row-indicator {
          position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
          background: var(--gp-accent-gold, #ff9f04); border-radius: 0 4px 4px 0;
        }
        .tsm-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .tsm-ticker { color: var(--gp-text-primary, #f8f9fa); font-size: 15px; font-weight: 700; font-family: var(--gp-font-family-base, 'Inter', sans-serif); }
        .tsm-name { color: var(--gp-text-secondary, #a0aec0); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tsm-metrics { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; }
        .tsm-price-change { font-size: 14px; font-weight: 600; font-family: var(--gp-font-family-base, 'Inter', sans-serif); }
        .tsm-market-cap { color: var(--gp-text-secondary, #a0aec0); font-size: 11px; }
        .tsm-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 20px; border-top: 1px solid var(--gp-border-color-light, #2d455c); background: rgba(28, 58, 87, 0.58);
        }
        .tsm-shortcuts { display: flex; align-items: center; gap: 12px; }
        .tsm-key-group { display: flex; align-items: center; gap: 6px; }
        .tsm-key {
          background: rgba(255,255,255,0.08); color: var(--gp-text-secondary, #a0aec0); font-size: 11px;
          padding: 2px 6px; border-radius: 4px; border: 1px solid var(--gp-border-color-light, #2d455c);
          font-family: monospace;
        }
        .tsm-key-label { color: var(--gp-text-secondary, #a0aec0); font-size: 11px; }
        .tsm-total { color: var(--gp-accent-gold, #ff9f04); font-size: 12px; font-weight: 600; }
        .tsm-total span { color: var(--gp-text-secondary, #a0aec0); font-weight: 400; }
        .tsm-empty { padding: 40px 20px; text-align: center; color: var(--gp-text-secondary, #a0aec0); font-size: 14px; }
        @keyframes tsmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tsmSlideDown { from { opacity: 0; transform: translateY(-20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes tsmSpin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="tsm-modal" ref={modalRef} onMouseDown={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="tsm-header">
          <div className="tsm-title">
            <span className="tsm-title-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
              </svg>
            </span>
            Sélectionner un Titre BRVM
          </div>
          <button className="tsm-close" onClick={closeModal} aria-label="Fermer">
            <CloseIcon />
          </button>
        </div>

        {/* SEARCH */}
        <div className="tsm-search-container">
          <div className="tsm-search-box">
            <span className="tsm-search-icon"><SearchIcon /></span>
            <input
              ref={inputRef}
              type="text"
              className="tsm-input"
              placeholder="Rechercher par nom, ticker ou secteur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              spellCheck={false}
              autoComplete="off"
            />
          </div>
        </div>

        {/* LIST */}
        <div className="tsm-list">
          {isLoadingSecurities ? (
            <div
              className="tsm-empty"
              role="status"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}
            >
              <span
                aria-hidden="true"
                style={{ display: "block", width: 22, height: 22, border: "3px solid rgba(255, 159, 4, 0.25)", borderTopColor: "#ff9f04", borderRadius: "50%", animation: "tsmSpin 0.8s linear infinite" }}
              />
              <span>Chargement des titres...</span>
            </div>
          ) : sourceState === "api_error" ? (
            <div className="tsm-empty" role="alert">Impossible de charger les titres depuis l’API.</div>
          ) : flattenedList.length === 0 ? (
            <div className="tsm-empty">Aucun titre trouvé pour "{searchQuery}"</div>
          ) : (
            flattenedList.map((item, idx) => {
              if (item.type === "header") {
                return (
                  <div key={`header-${item.label}`} className="tsm-sector-header">
                    <div className="tsm-sector-badge">
                      <div className="tsm-sector-dot" style={{ backgroundColor: item.color }} />
                      <span className="tsm-sector-name">{item.label}</span>
                      <span className="tsm-sector-count">({item.count})</span>
                    </div>
                  </div>
                );
              } else {
                return (
                  <TickerRow
                    key={item.data.ticker}
                    item={item.data}
                    isActive={activeTicker === item.data.ticker}
                    query={deferredQuery}
                    onSelect={handleSelect}
                    onHover={handleHover}
                  />
                );
              }
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="tsm-footer">
          <div className="tsm-shortcuts">
            <div className="tsm-key-group">
              <span className="tsm-key">↑</span>
              <span className="tsm-key">↓</span>
              <span className="tsm-key-label">naviguer</span>
            </div>
            <div className="tsm-key-group">
              <span className="tsm-key">↵</span>
              <span className="tsm-key-label">sélectionner</span>
            </div>
            <div className="tsm-key-group">
              <span className="tsm-key">esc</span>
              <span className="tsm-key-label">fermer</span>
            </div>
          </div>
          <div className="tsm-total">
            {totalCount} <span>titres</span>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
// --- EOF ---
