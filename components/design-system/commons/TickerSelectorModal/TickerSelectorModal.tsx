// ================================================================================
// FICHIER : TickerSelectorModal.tsx
// RÔLE : Modal de sélection de titres BRVM - Award-Winning Level Design
// FEATURES : Search, Keyboard Navigation, Sector Grouping, Animations
// ================================================================================
"use client";

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import { useTickerSelector } from './context/TickerSelectorContext';
import s from './style.module.css';
import { BRVMSecurity, BRVM_SECTORS, SECTOR_COLORS, searchBRVMSecurities } from '@/core/data/brvm-securities';

// --- ICONS (avec dimensions fixes pour éviter l'expansion) ---
const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const ChartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const EmptyIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 15h8" />
    <path d="M9 9h.01" />
    <path d="M15 9h.01" />
  </svg>
);

// --- HELPER: Highlight text match ---
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i} className={s.highlight}>{part}</mark> : part
  );
};

// --- TICKER ITEM COMPONENT ---
interface TickerItemProps {
  security: BRVMSecurity;
  isSelected: boolean;
  isFocused: boolean;
  searchQuery: string;
  onClick: () => void;
  onMouseEnter: () => void;
}

const TickerItem = React.memo<TickerItemProps>(({
  security,
  isSelected,
  isFocused,
  searchQuery,
  onClick,
  onMouseEnter
}) => {
  const itemRef = useRef<HTMLLIElement>(null);

  // Auto-scroll focused item into view
  useEffect(() => {
    if (isFocused && itemRef.current) {
      itemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [isFocused]);

  const priceChangeClass = security.priceChangeD1 >= 0 ? s.positive : s.negative;
  const priceChangeFormatted = `${security.priceChangeD1 >= 0 ? '+' : ''}${security.priceChangeD1.toFixed(2)}%`;
  const marketCapFormatted = security.marketCap >= 1000
    ? `${(security.marketCap / 1000).toFixed(1)}B FCFA`
    : `${security.marketCap.toFixed(0)}M FCFA`;

  return (
    <li
      ref={itemRef}
      className={clsx(
        s['ticker-item'],
        isSelected && s.selected,
        isFocused && s.focused
      )}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      role="option"
      aria-selected={isSelected}
    >
      <div className={s['ticker-logo']}>
        {security.logoUrl ? (
          <>
            {/* Background Blur Layer */}
            <Image
              src={security.logoUrl}
              alt=""
              width={40}
              height={40}
              className={s['ticker-logo-bg']}
            />
            {/* Foreground Sharp Layer */}
            <Image
              src={security.logoUrl}
              alt={security.ticker}
              width={40}
              height={40}
              className={s['ticker-logo-fg']}
            />
          </>
        ) : (
          <span className={s['ticker-logo-fallback']}>
            {security.ticker.slice(0, 2)}
          </span>
        )}
      </div>

      <div className={s['ticker-info']}>
        <div className={s['ticker-symbol']}>
          {highlightMatch(security.ticker, searchQuery)}
        </div>
        <div className={s['ticker-name']}>
          {highlightMatch(security.name, searchQuery)}
        </div>
      </div>

      <div className={s['ticker-metrics']}>
        <span className={clsx(s['ticker-price-change'], priceChangeClass)}>
          {priceChangeFormatted}
        </span>
        <span className={s['ticker-market-cap']}>
          {marketCapFormatted}
        </span>
      </div>
    </li>
  );
});
TickerItem.displayName = 'TickerItem';

// --- SECTOR GROUP COMPONENT ---
interface SectorGroupProps {
  sector: BRVMSecurity['sector'];
  securities: BRVMSecurity[];
  selectedTicker: string | null;
  focusedIndex: number;
  globalIndexOffset: number;
  searchQuery: string;
  onSelect: (security: BRVMSecurity) => void;
  onFocus: (index: number) => void;
}

const SectorGroup = React.memo<SectorGroupProps>(({
  sector,
  securities,
  selectedTicker,
  focusedIndex,
  globalIndexOffset,
  searchQuery,
  onSelect,
  onFocus
}) => {
  const sectorColor = SECTOR_COLORS[sector];

  return (
    <div className={s['sector-group']}>
      <div className={s['sector-header']}>
        <span className={s['sector-badge']}>
          <span className={s['sector-badge-dot']} style={{ backgroundColor: sectorColor }} />
          {sector}
          <span className={s['sector-badge-count']}>({securities.length})</span>
        </span>
      </div>
      <ul className={s['ticker-list']} role="listbox">
        {securities.map((security, localIndex) => {
          const globalIndex = globalIndexOffset + localIndex;
          return (
            <TickerItem
              key={security.ticker}
              security={security}
              isSelected={selectedTicker === security.ticker}
              isFocused={focusedIndex === globalIndex}
              searchQuery={searchQuery}
              onClick={() => onSelect(security)}
              onMouseEnter={() => onFocus(globalIndex)}
            />
          );
        })}
      </ul>
    </div>
  );
});
SectorGroup.displayName = 'SectorGroup';

// --- MAIN MODAL COMPONENT ---
export const TickerSelectorModal: React.FC = () => {
  const { isModalOpen, closeModal, selectedTicker, setSelectedTicker } = useTickerSelector();
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [liveDataMap, setLiveDataMap] = useState<Record<string, any>>({});
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Client-side only mounting
  const [isMounted] = useState(true);

  // --- DATA SYNC (TENOR 2026 HDR) ---
  const fetchAllLiveData = useCallback(async () => {
    setIsLoadingLive(true);
    try {
      const [liveRes, capRes, indicesRes] = await Promise.all([
        fetch('/api/market-data/brvm-live?ticker=ALL').then(r => r.json()),
        fetch('/api/market-data/brvm-live-capitalisation?ticker=ALL').then(r => r.json()),
        fetch('/api/market-data/indices').then(r => r.json())
      ]);

      const merged: Record<string, any> = {};

      // Process Equities
      if (Array.isArray(liveRes)) {
        liveRes.forEach((item: any) => {
          // [TENOR 2026 FIX] SCAR-103: Ne JAMAIS supprimer le suffixe 'C' ici.
          // Cela détruisait la clé primaire pour ECOC, SGBC, SMBC, etc.
          const ticker = item.symbol;
          if (ticker) {
            merged[ticker] = { price: item.price, variation: item.variation, volume: item.volume };
          }
        });
      }

      // Process Capitalizations
      if (capRes && typeof capRes === 'object') {
        Object.entries(capRes).forEach(([ticker, data]: [string, any]) => {
          if (!merged[ticker]) merged[ticker] = {};
          merged[ticker].marketCap = data.globalMarketCap;
        });
      }

      // Process Indices
      if (indicesRes && typeof indicesRes === 'object') {
        Object.entries(indicesRes).forEach(([ticker, data]: [string, any]) => {
          merged[ticker] = { price: data.price, variation: data.variation, marketCap: 0 };
        });
      }

      setLiveDataMap(merged);
    } catch (error) {
      console.error("[TickerSelector] Failed to fetch live data:", error);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      fetchAllLiveData();
      const interval = setInterval(fetchAllLiveData, 300000); // 5 min polling
      return () => clearInterval(interval);
    }
  }, [isModalOpen, fetchAllLiveData]);

  // Filter and group securities
  const { groupedSecurities, flatList } = useMemo(() => {
    const rawFiltered = searchBRVMSecurities(searchQuery);

    // HYDRATE STATIC DATA WITH LIVE DATA (TENOR 2026)
    const filtered = rawFiltered.map(security => {
      // [TENOR 2026 FIX] SCAR-103: Smart Matching pour contrer les inconsistances du backend.
      // On cherche d'abord le match exact (ex: "ECOC").
      let live = liveDataMap[security.ticker];

      // Fallback 1: Si le backend a tronqué le 'C' (ex: brvm-live-capitalisation renvoie "ECO"),
      // on tente de récupérer les données avec la clé tronquée.
      if (!live && security.ticker.endsWith('C')) {
        const strippedTicker = security.ticker.slice(0, -1);
        live = liveDataMap[strippedTicker];
      }

      // Fallback 2: Si on a trouvé des données (ex: prix) mais qu'il manque la capitalisation,
      // on va la chercher dans la clé tronquée (car l'API capitalisation est actuellement buggée).
      if (live && !live.marketCap && security.ticker.endsWith('C')) {
        const strippedTicker = security.ticker.slice(0, -1);
        const strippedLive = liveDataMap[strippedTicker];
        if (strippedLive && strippedLive.marketCap) {
          live.marketCap = strippedLive.marketCap;
        }
      }

      if (!live) return security;

      return {
        ...security,
        priceChangeD1: live.variation ? parseFloat(live.variation.replace(',', '.')) : security.priceChangeD1,
        marketCap: live.marketCap || security.marketCap
      };
    });

    // Group by sector
    const grouped: Record<string, BRVMSecurity[]> = {};
    const flat: BRVMSecurity[] = [];

    BRVM_SECTORS.forEach(sector => {
      const sectorSecurities = filtered.filter(s => s.sector === sector);
      if (sectorSecurities.length > 0) {
        grouped[sector] = sectorSecurities;
        flat.push(...sectorSecurities);
      }
    });

    return { filteredSecurities: filtered, groupedSecurities: grouped, flatList: flat };
  }, [searchQuery, liveDataMap]);

  // GSAP Animation
  useGSAP(() => {
    if (!modalRef.current || !backdropRef.current) return;

    if (isModalOpen) {
      // Focus input on open
      setTimeout(() => searchInputRef.current?.focus(), 100);

      gsap.to(backdropRef.current, {
        opacity: 1,
        visibility: 'visible',
        duration: 0.25,
        ease: 'power2.out'
      });

      gsap.to(modalRef.current, {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.35,
        ease: 'power3.out'
      });
    } else {
      gsap.to(modalRef.current, {
        opacity: 0,
        scale: 0.95,
        y: 20,
        duration: 0.2,
        ease: 'power2.in'
      });

      gsap.to(backdropRef.current, {
        opacity: 0,
        visibility: 'hidden',
        duration: 0.2,
      });
    }
  }, [isModalOpen]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFocusedIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  // Handle selection
  const handleSelect = useCallback((security: BRVMSecurity) => {
    setSelectedTicker(security);
    setSearchQuery('');
    setFocusedIndex(-1);
    closeModal();
  }, [setSelectedTicker, closeModal]);

  // Handle search change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFocusedIndex(-1);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        closeModal();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < flatList.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev > 0 ? prev - 1 : flatList.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < flatList.length) {
          handleSelect(flatList[focusedIndex]);
        }
        break;
    }
  }, [closeModal, flatList, focusedIndex, handleSelect]);

  // Don't render on server or if not mounted
  if (!isMounted) return null;

  // Build sector index offsets for keyboard navigation
  let currentOffset = 0;
  const sectorOffsets: Record<string, number> = {};

  Object.entries(groupedSecurities).forEach(([sector, securities]) => {
    sectorOffsets[sector] = currentOffset;
    currentOffset += securities.length;
  });

  const modalContent = (
    <div className={s['ticker-modal-root']}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className={clsx(s.backdrop, isModalOpen && s.visible)}
        onClick={closeModal}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className={clsx(s['modal-container'], isModalOpen && s.visible)}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticker-modal-title"
        onKeyDown={handleKeyDown}
      >
        <div
          ref={modalRef}
          className={clsx(s.modal, isModalOpen && s.visible)}
        >
          {/* Header */}
          <div className={s['modal-header']}>
            <h2 id="ticker-modal-title" className={s['modal-title']}>
              <span className={s['modal-title-icon']}>
                <ChartIcon />
              </span>
              Sélectionner un Titre BRVM
            </h2>
            <button
              className={s['close-button']}
              onClick={closeModal}
              aria-label="Fermer"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Search */}
          <div className={s['search-section']}>
            <div className={s['search-input-wrapper']}>
              <span className={s['search-icon']}>
                <SearchIcon />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                className={s['search-input']}
                placeholder="Rechercher par nom, ticker ou secteur..."
                value={searchQuery}
                onChange={handleSearchChange}
                aria-label="Rechercher un titre"
              />
              <button
                className={clsx(s['clear-button'], searchQuery && s.visible)}
                onClick={clearSearch}
                aria-label="Effacer la recherche"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Results */}
          <div className={s['results-section']}>
            {flatList.length > 0 ? (
              Object.entries(groupedSecurities).map(([sector, securities]) => (
                <SectorGroup
                  key={sector}
                  sector={sector as BRVMSecurity['sector']}
                  securities={securities}
                  selectedTicker={selectedTicker?.ticker || null}
                  focusedIndex={focusedIndex}
                  globalIndexOffset={sectorOffsets[sector]}
                  searchQuery={searchQuery}
                  onSelect={handleSelect}
                  onFocus={setFocusedIndex}
                />
              ))
            ) : (
              <div className={s['empty-state']}>
                <div className={s['empty-icon']}>
                  <EmptyIcon />
                </div>
                <div className={s['empty-title']}>Aucun résultat</div>
                <div className={s['empty-description']}>
                  Essayez un autre terme de recherche
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className={s['modal-footer']}>
            <div className={s['footer-hint']}>
              <kbd className={s.kbd}>↑</kbd>
              <kbd className={s.kbd}>↓</kbd>
              <span>naviguer</span>
              <kbd className={s.kbd}>↵</kbd>
              <span>sélectionner</span>
              <kbd className={s.kbd}>esc</kbd>
              <span>fermer</span>
            </div>
            <div className={s['results-count']}>
              <strong>{flatList.length}</strong> titre{flatList.length > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Portal to body
  return createPortal(modalContent, document.body);
};

export default TickerSelectorModal;
// --- EOF ---