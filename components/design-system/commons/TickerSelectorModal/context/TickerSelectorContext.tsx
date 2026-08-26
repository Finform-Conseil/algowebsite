// ================================================================================
// FICHIER : TickerSelectorContext.tsx
// RÔLE : Contexte global pour la gestion de la sélection de titres BRVM
// ARCHITECTURE : React Context + Custom Hook Pattern
// ================================================================================

"use client";

import type { BRVMSecurity } from '@/core/data/brvm-securities';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  DEFAULT_PRIMARY_TICKER,
  readPersistedTickerSymbol,
  writePersistedTickerSymbol,
} from "./tickerSelectorPersistence";

export interface PendingMarketSelection {
  ticker: string;
  name: string;
  currency: string;
}

// --- TYPES ---

interface TickerSelectorContextValue {
  /** Titre actuellement sélectionné */
  selectedTicker: BRVMSecurity | null;
  /** Sélectionner un titre */
  setSelectedTicker: (ticker: BRVMSecurity | null) => void;
  /** Symbole préféré restauré; il n'est valide qu'après résolution dans le catalogue API. */
  preferredTicker: string | null;
  /** État du modal */
  isModalOpen: boolean;
  /** Marché choisi dans le répertoire, en attente d'un titre explicite. */
  pendingMarket: PendingMarketSelection | null;
  /** Cellule multi-layout ciblée par la sélection en cours, sans l'activer visuellement. */
  pendingLayoutChartId: string | null;
  /** Ouvrir le modal pour une sélection directe de titre. */
  openModal: () => void;
  /** Ouvrir le modal avec un marché en attente de titre explicite. */
  openMarketModal: (market: PendingMarketSelection) => void;
  /** Ouvrir le sélecteur pour une cellule multi-layout précise et un marché précis. */
  openLayoutMarketModal: (chartId: string, market: PendingMarketSelection) => void;
  /** Prepare a multi-layout cell before opening the canonical market directory. */
  openLayoutMarketDirectory: (chartId: string) => void;
  /** Cancel a pending multi-layout market target without opening the ticker selector. */
  cancelLayoutMarketDirectory: () => void;
  /** Fermer le modal */
  closeModal: () => void;
  /** Toggle le modal */
  toggleModal: () => void;
  /** État de chargement (initialisation) */
  isLoading: boolean;
}

// --- CONTEXT ---

const TickerSelectorContext = createContext<TickerSelectorContextValue | undefined>(undefined);

// --- PROVIDER ---

interface TickerSelectorProviderProps {
  children: ReactNode;
  /** Symbole préféré optionnel; jamais résolu depuis un catalogue local. */
  initialTicker?: string;
}

export const TickerSelectorProvider: React.FC<TickerSelectorProviderProps> = ({ 
  children, 
  initialTicker 
}) => {
  const normalizedInitialTicker = initialTicker?.trim().toUpperCase() || null;
  const [selectedTicker, setSelectedTicker] = useState<BRVMSecurity | null>(null);
  const [preferredTicker, setPreferredTicker] = useState<string | null>(normalizedInitialTicker);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingMarket, setPendingMarket] = useState<PendingMarketSelection | null>(null);
  const [pendingLayoutChartId, setPendingLayoutChartId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  React.useEffect(() => {
    let isActive = true;

    const hydrateSelectedTicker = async () => {
      try {
        const savedTickerSymbol = await readPersistedTickerSymbol();
        if (!isActive || normalizedInitialTicker) return;
        setPreferredTicker(savedTickerSymbol ?? DEFAULT_PRIMARY_TICKER);
      } finally {
        if (isActive) setIsInitialized(true);
      }
    };

    void hydrateSelectedTicker();
    return () => {
      isActive = false;
    };
  }, [normalizedInitialTicker]);

  React.useEffect(() => {
    if (isInitialized && selectedTicker) {
      void writePersistedTickerSymbol(selectedTicker.ticker);
    }
  }, [selectedTicker, isInitialized]);


  const openModal = useCallback(() => {
    setPendingMarket(null);
    setPendingLayoutChartId(null);
    setIsModalOpen(true);
  }, []);
  const openMarketModal = useCallback((market: PendingMarketSelection) => {
    setPendingMarket(market);
    setPendingLayoutChartId(null);
    setIsModalOpen(true);
  }, []);
  const openLayoutMarketModal = useCallback((chartId: string, market: PendingMarketSelection) => {
    const normalizedChartId = chartId.trim();
    if (!normalizedChartId) return;
    setPendingMarket(market);
    setPendingLayoutChartId(normalizedChartId);
    setIsModalOpen(true);
  }, []);
  const openLayoutMarketDirectory = useCallback((chartId: string) => {
    const normalizedChartId = chartId.trim();
    if (!normalizedChartId) return;
    setPendingMarket(null);
    setPendingLayoutChartId(normalizedChartId);
    setIsModalOpen(false);
  }, []);
  const cancelLayoutMarketDirectory = useCallback(() => {
    setPendingMarket(null);
    setPendingLayoutChartId(null);
  }, []);
  const closeModal = useCallback(() => {
    setPendingMarket(null);
    setPendingLayoutChartId(null);
    setIsModalOpen(false);
  }, []);
  const toggleModal = useCallback(() => {
    setPendingMarket(null);
    setPendingLayoutChartId(null);
    setIsModalOpen(prev => !prev);
  }, []);

  const value: TickerSelectorContextValue = {
    selectedTicker,
    setSelectedTicker,
    preferredTicker,
    pendingMarket,
    pendingLayoutChartId,
    isModalOpen,
    openModal,
    openMarketModal,
    openLayoutMarketModal,
    openLayoutMarketDirectory,
    cancelLayoutMarketDirectory,
    closeModal,
    toggleModal,
    isLoading: !isInitialized
  };

  return (
    <TickerSelectorContext.Provider value={value}>
      {children}
    </TickerSelectorContext.Provider>
  );
};

// --- HOOK ---

/**
 * Hook pour accéder au contexte de sélection de ticker
 * @throws Error si utilisé en dehors du TickerSelectorProvider
 */
export const useTickerSelector = (): TickerSelectorContextValue => {
  const context = useContext(TickerSelectorContext);
  if (context === undefined) {
    throw new Error('useTickerSelector doit être utilisé à l\'intérieur d\'un TickerSelectorProvider');
  }
  return context;
};

export default TickerSelectorContext;
