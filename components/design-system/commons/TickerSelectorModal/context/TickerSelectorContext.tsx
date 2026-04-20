// ================================================================================
// FICHIER : TickerSelectorContext.tsx
// RÔLE : Contexte global pour la gestion de la sélection de titres BRVM
// ARCHITECTURE : React Context + Custom Hook Pattern
// ================================================================================

"use client";

import { BRVMSecurity,  BRVM_SECURITIES, getBRVMSecurityByTicker } from '@/core/data/brvm-securities';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

  // [PERSISTENCE] Charger la sélection depuis le localStorage au montage (Client-side only)
  React.useEffect(() => {
    try {
      const savedTickerSymbol = localStorage.getItem('algoway_selected_ticker');
      if (savedTickerSymbol) {
        const savedSecurity = getBRVMSecurityByTicker(savedTickerSymbol);
        if (savedSecurity) {
          // Si un ticker initial est forcé par prop, on ne l'écrase pas sauf si c'est pour l'initialisation par défaut
          if (!initialTicker || initialTicker === 'BOAB') {
             setSelectedTicker(savedSecurity);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load ticker from localStorage', error);
    } finally {
      // Marquer comme initialisé pour autoriser les sauvegardes futures
      setIsInitialized(true);
    }
  }, [initialTicker]);

  // [PERSISTENCE] Sauvegarder la sélection dans le localStorage
  // UNIQUEMENT après l'initialisation pour éviter d'écraser la sauvegarde avec la valeur par défaut
  React.useEffect(() => {
    if (isInitialized && selectedTicker) {
      localStorage.setItem('algoway_selected_ticker', selectedTicker.ticker);
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
