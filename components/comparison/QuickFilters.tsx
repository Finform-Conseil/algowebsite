'use client';

import { useMemo, useState } from 'react';
import { ComparisonStock } from '@/core/data/StockComparison';

export interface QuickFilterState {
  sector: string;
  country: string;
  market: string;
  currency: string;
  capitalization: string;
}

interface QuickFiltersProps {
  allStocks: ComparisonStock[];
  filters: QuickFilterState;
  onFilterChange: (filterType: keyof QuickFilterState, value: string) => void;
}

export default function QuickFilters({ allStocks, filters, onFilterChange }: QuickFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Extraire les valeurs uniques pour chaque filtre
  const sectors = Array.from(new Set(allStocks.map((s) => s.sector))).sort();
  const countries = Array.from(new Set(allStocks.map((s) => s.country))).sort();
  const markets = Array.from(new Set(allStocks.map((s) => s.market))).sort();
  const currencies = Array.from(new Set(allStocks.map((s) => s.currency))).sort();
  
  const capSizes = ['Tous', 'Small Cap (<1Md)', 'Mid Cap (1-10Md)', 'Large Cap (>10Md)'];

  return (
    <div className={`quick-filters ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="quick-filters__header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h3>Filtres Rapides</h3>
        <button 
          className="collapse-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsCollapsed(!isCollapsed);
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points={isCollapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15'} />
          </svg>
        </button>
      </div>
      
      {!isCollapsed && (
      <div className="quick-filters__list">
        {/* Secteur */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Secteur</label>
          <select
            value={filters.sector}
            onChange={(e) => onFilterChange('sector', e.target.value)}
            className="filter-dropdown__select"
          >
            <option value="">Tous</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        {/* Pays */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Pays</label>
          <select
            value={filters.country}
            onChange={(e) => onFilterChange('country', e.target.value)}
            className="filter-dropdown__select"
          >
            <option value="">Tous</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </div>

        {/* Marché */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Marché</label>
          <select
            value={filters.market}
            onChange={(e) => onFilterChange('market', e.target.value)}
            className="filter-dropdown__select"
          >
            <option value="">Tous</option>
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </div>

        {/* Devise */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Devise</label>
          <select
            value={filters.currency}
            onChange={(e) => onFilterChange('currency', e.target.value)}
            className="filter-dropdown__select"
          >
            <option value="">Toutes</option>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        {/* Capitalisation */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Capitalisation</label>
          <select
            value={filters.capitalization}
            onChange={(e) => onFilterChange('capitalization', e.target.value)}
            className="filter-dropdown__select"
          >
            {capSizes.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton reset */}
        {(filters.sector || filters.country || filters.market || filters.currency || (filters.capitalization && filters.capitalization !== 'Tous')) && (
          <button
            className="filter-reset-btn"
            onClick={() => {
              onFilterChange('sector', '');
              onFilterChange('country', '');
              onFilterChange('market', '');
              onFilterChange('currency', '');
              onFilterChange('capitalization', 'Tous');
            }}
          >
            Réinitialiser
          </button>
        )}
      </div>
      )}
    </div>
  );
}
