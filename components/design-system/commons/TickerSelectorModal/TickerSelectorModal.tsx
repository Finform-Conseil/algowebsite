"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue } from "react";
import { createPortal } from "react-dom";
import { BRVM_SECURITIES, BRVMSecurity, SECTOR_COLORS } from "@/core/data/brvm-securities";
import { useTickerSelector } from "./context/TickerSelectorContext";

// ============================================================================
// [TENOR 2026 SRE] ZERO-LAG TICKER SELECTOR MODAL
// Architecture:
// 1. useDeferredValue: Decouples typing (120Hz) from list filtering/rendering.
// 2. React.memo (O(1) Updates): Only the newly active and previously active rows re-render during keyboard navigation.
// 3. CSS content-visibility: Offloads off-screen rendering to the GPU.
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
const formatMarketCap = (value: number) => {
  if (!value) return "0M FCFA";
  if (value >= 1000) return `${(value / 1000).toFixed(1)}B FCFA`;
  return `${value.toFixed(1)}M FCFA`;
};

// --- TYPES ---
type FlattenedItem = 
  | { type: "header"; label: string; count: number; color: string }
  | { type: "item"; data: BRVMSecurity; globalIndex: number };

// ============================================================================
// [TENOR 2026] O(1) MEMOIZED ROW COMPONENT
// ============================================================================
interface TickerRowProps {
  item: BRVMSecurity;
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

  const isPositive = item.priceChangeD1 >= 0;
  const priceColor = isPositive ? "#00da3c" : "#f23645";
  const sign = isPositive ? "+" : "";

  return (
    <div
      ref={rowRef}
      className={`tsm-row ${isActive ? "active" : ""}`}
      onClick={() => onSelect(item.ticker)}
      onMouseEnter={() => onHover(item.ticker)}
    >
      {isActive && <div className="tsm-row-indicator" />}
      
      <div className="tsm-logo-container">
        {item.logoUrl ? (
          <img 
            src={item.logoUrl} 
            alt={item.ticker} 
            className="tsm-logo-img"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.classList.add('fallback');
              e.currentTarget.parentElement!.innerText = item.ticker.substring(0, 2);
            }}
          />
        ) : (
          <div className="tsm-logo-fallback">{item.ticker.substring(0, 2)}</div>
        )}
      </div>

      <div className="tsm-info">
        <div className="tsm-ticker"><HighlightMatch text={item.ticker} query={query} /></div>
        <div className="tsm-name"><HighlightMatch text={item.name} query={query} /></div>
      </div>

      <div className="tsm-metrics">
        <div className="tsm-price-change" style={{ color: priceColor }}>
          {sign}{item.priceChangeD1.toFixed(2)}%
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);
  
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

  // --- FILTERING & GROUPING (Background Thread via useDeferredValue) ---
  const { flattenedList, selectableTickers, totalCount } = useMemo(() => {
    const query = deferredQuery.toLowerCase().trim();
    
    // 1. Filter
    const filtered = BRVM_SECURITIES.filter(s => 
      s.ticker.toLowerCase().includes(query) || 
      s.name.toLowerCase().includes(query) || 
      s.sector.toLowerCase().includes(query)
    );

    // 2. Group
    const grouped = filtered.reduce((acc, security) => {
      if (!acc[security.sector]) acc[security.sector] = [];
      acc[security.sector].push(security);
      return acc;
    }, {} as Record<string, BRVMSecurity[]>);

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
  }, [deferredQuery]);

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
          background: rgba(5, 18, 31, 0.58); backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: center;
          padding-top: 8vh; animation: tsmFadeIn 0.2s ease-out;
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
          content-visibility: auto; contain-intrinsic-size: 52px;
        }
        .tsm-row.active { background: rgba(28, 58, 87, 0.86); }
        .tsm-row-indicator {
          position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
          background: var(--gp-accent-gold, #ff9f04); border-radius: 0 4px 4px 0;
        }
        .tsm-logo-container {
          width: 36px; height: 36px; border-radius: 50%; background: #ffffff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden; border: 2px solid rgba(255,255,255,0.1);
        }
        .tsm-logo-container.fallback { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; font-weight: bold; font-size: 14px; }
        .tsm-logo-img { width: 24px; height: 24px; object-fit: contain; }
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
          {flattenedList.length === 0 ? (
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
