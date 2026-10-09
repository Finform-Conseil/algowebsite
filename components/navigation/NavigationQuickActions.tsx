'use client';
import { House, MagnifyingGlass, User } from '@phosphor-icons/react';
export interface NavigationQuickActionsProps {
  searchActive: boolean;
  onHome: () => void;
  onSearch: () => void;
  onProfile: () => void;
}
export default function NavigationQuickActions({ searchActive, onHome, onSearch, onProfile }: NavigationQuickActionsProps) {
  return <li className="shared-nav-mobile-menu-bottom-nav" aria-label="Navigation rapide">
    <button type="button" aria-label="Retour à l’accueil du menu" onClick={onHome}><House size={20} aria-hidden="true" /></button>
    <button type="button" aria-label="Recherche" aria-pressed={searchActive} className={searchActive ? 'shared-nav-mobile-search-active' : undefined} onClick={onSearch}><MagnifyingGlass size={20} aria-hidden="true" /></button>
    <button type="button" aria-label="Fermer la navigation" onClick={onProfile}><User size={20} aria-hidden="true" /></button>
  </li>;
}
