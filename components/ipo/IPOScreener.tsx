'use client';

import { useState } from 'react';
import { IPO, IPOFilters, Sector, Exchange } from '@/types/ipo';
import { ALL_SECTORS, ALL_EXCHANGES, ALL_COUNTRIES } from '@/core/data/IPOData';
import MultiSelect from '@/components/corporate-events/MultiSelect';

interface IPOScreenerProps {
  ipos: IPO[];
  onFilterChange: (filters: IPOFilters) => void;
}

export default function IPOScreener({ ipos, onFilterChange }: IPOScreenerProps) {
  const [filters, setFilters] = useState<IPOFilters>({});
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFilterChange = (key: keyof IPOFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const activeFiltersCount = Object.values(filters).filter(v => 
    v !== undefined && v !== '' && (!Array.isArray(v) || v.length > 0)
  ).length;

  return (
    <div className={`ipo-screener ${isExpanded ? 'expanded' : ''}`}>
      <div className="ipo-screener__header">
        <div className="header-left">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            IPO Screener
          </h2>
          {activeFiltersCount > 0 && (
            <span className="filters-count">{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="header-actions">
          <div className="ipo-screener__results">
            <span className="results-count">
              <strong>{ipos.length}</strong> résultat{ipos.length > 1 ? 's' : ''} trouvé{ipos.length > 1 ? 's' : ''}
            </span>
          </div>
          {activeFiltersCount > 0 && (
            <button className="btn-clear" onClick={clearFilters}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Effacer
            </button>
          )}
          <button 
            className={`btn-toggle ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Réduire' : 'Filtres avancés'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isExpanded ? (
                <polyline points="18 15 12 9 6 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div className="ipo-screener__filters">
        {/* Basic Filters - Always Visible */}
        <div className="filters-row basic">
          <div className="filter-group">
            <label>Recherche</label>
            <div className="search-input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Nom, ticker, secteur..."
                value={filters.searchQuery || ''}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
              />
            </div>
          </div>

          <div className="filter-group">
            <MultiSelect
              label="Secteurs"
              options={ALL_SECTORS}
              selected={filters.sectors || []}
              onChange={(selected) => handleFilterChange('sectors', selected)}
              placeholder="Tous les secteurs"
            />
          </div>

          <div className="filter-group">
            <MultiSelect
              label="Bourses"
              options={ALL_EXCHANGES}
              selected={filters.exchanges || []}
              onChange={(selected) => handleFilterChange('exchanges', selected)}
              placeholder="Toutes les bourses"
            />
          </div>

          <div className="filter-group">
            <MultiSelect
              label="Pays"
              options={ALL_COUNTRIES}
              selected={filters.countries || []}
              onChange={(selected) => handleFilterChange('countries', selected)}
              placeholder="Tous les pays"
            />
          </div>
        </div>

        {/* Advanced Filters - Collapsible */}
        {isExpanded && (
          <div className="filters-row advanced">
            <div className="filter-group">
              <label>Statut</label>
              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes('completed') || false}
                    onChange={(e) => {
                      const current = filters.status || [];
                      const newStatus = e.target.checked
                        ? [...current, 'completed']
                        : current.filter(s => s !== 'completed');
                      handleFilterChange('status', newStatus);
                    }}
                  />
                  <span>Complétées</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes('upcoming') || false}
                    onChange={(e) => {
                      const current = filters.status || [];
                      const newStatus = e.target.checked
                        ? [...current, 'upcoming']
                        : current.filter(s => s !== 'upcoming');
                      handleFilterChange('status', newStatus);
                    }}
                  />
                  <span>À venir</span>
                </label>
              </div>
            </div>

            <div className="filter-group">
              <label>Fourchette de prix (USD)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.priceRange?.min || ''}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.priceRange?.max || ''}
                  onChange={(e) => handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Montant levé (USD millions)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.sizeRange?.min ? filters.sizeRange.min / 1000000 : ''}
                  onChange={(e) => handleFilterChange('sizeRange', {
                    ...filters.sizeRange,
                    min: e.target.value ? parseFloat(e.target.value) * 1000000 : undefined
                  })}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.sizeRange?.max ? filters.sizeRange.max / 1000000 : ''}
                  onChange={(e) => handleFilterChange('sizeRange', {
                    ...filters.sizeRange,
                    max: e.target.value ? parseFloat(e.target.value) * 1000000 : undefined
                  })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Performance (%)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.returnRange?.min || ''}
                  onChange={(e) => handleFilterChange('returnRange', {
                    ...filters.returnRange,
                    min: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.returnRange?.max || ''}
                  onChange={(e) => handleFilterChange('returnRange', {
                    ...filters.returnRange,
                    max: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                />
              </div>
            </div>

            <div className="filter-group">
              <label>Période</label>
              <div className="date-inputs">
                <input
                  type="date"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                />
                <span>à</span>
                <input
                  type="date"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
