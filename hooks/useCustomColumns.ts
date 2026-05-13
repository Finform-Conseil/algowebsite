import { useState, useEffect } from 'react';
import { ColumnDefinition, getColumnById } from '@/core/data/ColumnRegistry';

const STORAGE_KEY = 'screener_custom_columns';
const MAX_CUSTOM_COLUMNS = 10;

// Colonnes custom par défaut (3 colonnes suggérées)
const DEFAULT_CUSTOM_COLUMNS = [
  'rsi_14',        // RSI 14 - Momentum
  'pe_ttm',        // P/E Ratio - Valuation
  'roe',           // ROE - Profitability
];

export const useCustomColumns = () => {
  const [customColumnIds, setCustomColumnIds] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les colonnes depuis localStorage au montage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomColumnIds(Array.isArray(parsed) ? parsed : DEFAULT_CUSTOM_COLUMNS);
      } catch (error) {
        console.error('Error loading custom columns:', error);
        setCustomColumnIds(DEFAULT_CUSTOM_COLUMNS);
      }
    } else {
      setCustomColumnIds(DEFAULT_CUSTOM_COLUMNS);
    }
    setIsLoaded(true);
  }, []);

  // Sauvegarder dans localStorage à chaque changement
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customColumnIds));
    }
  }, [customColumnIds, isLoaded]);

  // Récupérer les définitions complètes des colonnes
  const customColumns: ColumnDefinition[] = customColumnIds
    .map((id) => getColumnById(id))
    .filter((col): col is ColumnDefinition => col !== undefined);

  // Ajouter une colonne
  const addColumn = (columnId: string): boolean => {
    if (customColumnIds.includes(columnId)) {
      return false; // Déjà présente
    }
    if (customColumnIds.length >= MAX_CUSTOM_COLUMNS) {
      return false; // Limite atteinte
    }
    setCustomColumnIds([...customColumnIds, columnId]);
    return true;
  };

  // Supprimer une colonne
  const removeColumn = (columnId: string) => {
    setCustomColumnIds(customColumnIds.filter((id) => id !== columnId));
  };

  // Vérifier si une colonne est déjà ajoutée
  const hasColumn = (columnId: string): boolean => {
    return customColumnIds.includes(columnId);
  };

  // Réinitialiser aux colonnes par défaut
  const resetToDefault = () => {
    setCustomColumnIds(DEFAULT_CUSTOM_COLUMNS);
  };

  // Vérifier si la limite est atteinte
  const isLimitReached = (): boolean => {
    return customColumnIds.length >= MAX_CUSTOM_COLUMNS;
  };

  return {
    customColumns,
    customColumnIds,
    addColumn,
    removeColumn,
    hasColumn,
    resetToDefault,
    isLimitReached,
    maxColumns: MAX_CUSTOM_COLUMNS,
    isLoaded,
  };
};
