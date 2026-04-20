// ================================================================================
// FICHIER : TickerBreadcrumbTrigger.tsx
// RÔLE : Élément breadcrumb cliquable qui ouvre le TickerSelectorModal
// DESIGN : Intégration seamless dans CommonPageHeader
// ================================================================================

"use client";

import React, { memo } from 'react';
import clsx from 'clsx';
import { useTickerSelector } from './context/TickerSelectorContext';
import styles from './TickerBreadcrumbTrigger.module.css';

// --- ICONS ---

const SearchIcon = () => (
  <svg 
    width="14" 
    height="14" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// --- COMPONENT ---

interface TickerBreadcrumbTriggerProps {
  /** Classes CSS additionnelles */
  className?: string;
  /** Classe GSAP pour l'animation */
  gsapClass?: string;
}

/**
 * 🎯 TickerBreadcrumbTrigger
 * 
 * Bouton stylisé comme un breadcrumb qui affiche le ticker sélectionné
 * et ouvre le TickerSelectorModal au clic.
 * 
 * Utilisé dans CommonPageHeader comme alternative au breadcrumb standard.
 */
const TickerBreadcrumbTriggerComponent: React.FC<TickerBreadcrumbTriggerProps> = ({
  className,
  gsapClass = 'js-animated-breadcrumb'
}) => {
  const { selectedTicker, openModal, isModalOpen, isLoading } = useTickerSelector();

  // Afficher un skeleton pendant l'initialisation pour éviter le flash de contenu par défaut
  if (isLoading) {
    return (
      <li className={clsx("breadcrumb-item", styles['ticker-trigger-wrapper'], className)}>
        <span className={styles['skeleton']} />
      </li>
    );
  }

  return (
    <li 
      className={clsx(
        "breadcrumb-item",
        "active",
        styles['ticker-trigger-wrapper'],
        gsapClass,
        className
      )}
      aria-current="page"
    >
      <button
        type="button"
        className={clsx(
          styles['ticker-trigger'],
          isModalOpen && styles['is-open']
        )}
        onClick={openModal}
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        aria-label={`Titre sélectionné: ${selectedTicker?.ticker || 'Aucun'}. Cliquer pour changer.`}
      >
        <span className={styles['search-icon']}>
          <SearchIcon />
        </span>
        <span className={styles['ticker-label']}>
          {selectedTicker?.ticker || 'Sélectionner'}
        </span>
        <span className={clsx(styles['chevron'], isModalOpen && styles.rotated)}>
          <ChevronDownIcon />
        </span>
      </button>
    </li>
  );
};

export const TickerBreadcrumbTrigger = memo(TickerBreadcrumbTriggerComponent);
TickerBreadcrumbTrigger.displayName = 'TickerBreadcrumbTrigger';

export default TickerBreadcrumbTrigger;
