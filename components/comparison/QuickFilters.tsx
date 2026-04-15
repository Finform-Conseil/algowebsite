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
  // Extract unique values for each filter
  const sectors = Array.from(new Set(allStocks.map((s) => s.sector))).sort();
  const markets = Array.from(new Set(allStocks.map((s) => s.market))).sort();
  
  const capSizes = ['All', 'Small Cap (<1B)', 'Mid Cap (1-10B)', 'Large Cap (>10B)'];

  return (
    <div className="quick-filters">
      <div className="quick-filters__list">
        {/* Sector */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Sector</label>
          <select
            value={filters.sector}
            onChange={(e) => onFilterChange('sector', e.target.value)}
            className="filter-dropdown__select"
          >
            <option value="">All</option>
            {sectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>

        {/* Market */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Market</label>
          <select
            value={filters.market}
            onChange={(e) => onFilterChange('market', e.target.value)}
            className="filter-dropdown__select"
          >
            <option value="">All</option>
            {markets.map((market) => (
              <option key={market} value={market}>
                {market}
              </option>
            ))}
          </select>
        </div>

        {/* Capitalization */}
        <div className="filter-dropdown">
          <label className="filter-dropdown__label">Capitalization</label>
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

      </div>
    </div>
  );
}
