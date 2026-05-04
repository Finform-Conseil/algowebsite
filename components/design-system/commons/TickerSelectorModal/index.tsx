// ================================================================================
// FICHIER : index.tsx
// RÔLE : Barrel export pour le module TickerSelectorModal
// ================================================================================

export { TickerSelectorProvider, useTickerSelector } from './context/TickerSelectorContext';
export { TickerSelectorModal } from './TickerSelectorModal';
export { TickerBreadcrumbTrigger } from './TickerBreadcrumbTrigger';

// Re-export types
export type { BRVMSecurity } from '@/core/data/brvm-securities';
