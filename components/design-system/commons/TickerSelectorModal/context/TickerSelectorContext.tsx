// ================================================================================
// FICHIER : TickerSelectorContext.tsx
// RÔLE : Contexte global pour la gestion de la sélection de titres BRVM
// ARCHITECTURE : React Context + Custom Hook Pattern
// ================================================================================

"use client";

import { BRVMSecurity,  BRVM_SECURITIES, getBRVMSecurityByTicker } from '@/core/data/brvm-securities';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { readPersistedTickerSymbol, writePersistedTickerSymbol } from "./tickerSelectorPersistence";

// --- TYPES ---

interface TickerSelectorContextValue {
  /** Titre actuellement sélectionné */
  selectedTicker: BRVMSecurity | null;
  /** Sélectionner un titre */
  setSelectedTicker: (ticker: BRVMSecurity | null) => void;
  /** Sélectionner par symbole ticker */
  selectByTicker: (tickerSymbol: string) => boolean;
  /** État du modal */
  isModalOpen: boolean;
  /** Ouvrir le modal */
  openModal: () => void;
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
  /** Ticker initial (optionnel, ex: 'BOAB') */
  initialTicker?: string;
}

export const TickerSelectorProvider: React.FC<TickerSelectorProviderProps> = ({ 
  children, 
  initialTicker 
}) => {
  // Initialiser avec le ticker par défaut si fourni
  // Initialiser avec le ticker par défaut (SSR safe)
  const [selectedTicker, setSelectedTicker] = useState<BRVMSecurity | null>(() => {
    if (initialTicker) {
      return getBRVMSecurityByTicker(initialTicker) || null;
    }
    // Par défaut : premier titre bancaire (BOAB)
    return BRVM_SECURITIES.find(s => s.ticker === 'BOAB') || BRVM_SECURITIES[0] || null;
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  React.useEffect(() => {
    let isActive = true;

    const hydrateSelectedTicker = async () => {
      try {
        const savedTickerSymbol = await readPersistedTickerSymbol();
        if (!isActive || !savedTickerSymbol) return;

        const savedSecurity = getBRVMSecurityByTicker(savedTickerSymbol);
        if (savedSecurity) {
          if (!initialTicker || initialTicker === 'BOAB') {
             setSelectedTicker(savedSecurity);
          }
        }
      } finally {
        if (isActive) setIsInitialized(true);
      }
    };

    void hydrateSelectedTicker();
    return () => {
      isActive = false;
    };
  }, [initialTicker]);

  React.useEffect(() => {
    if (isInitialized && selectedTicker) {
      void writePersistedTickerSymbol(selectedTicker.ticker);
    }
  }, [selectedTicker, isInitialized]);



  const selectByTicker = useCallback((tickerSymbol: string): boolean => {
    const security = getBRVMSecurityByTicker(tickerSymbol);
    if (security) {
      setSelectedTicker(security);
      return true;
    }
    return false;
  }, []);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);
  const toggleModal = useCallback(() => setIsModalOpen(prev => !prev), []);

  const value: TickerSelectorContextValue = {
    selectedTicker,
    setSelectedTicker,
    selectByTicker,
    isModalOpen,
    openModal,
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
