'use client';

import { ActiveFilter } from '@/core/data/StockScreenerV2';
import FilterChip from './FilterChip';

interface FilterBarProps {
  activeFilters: ActiveFilter[];
  onRemoveFilter: (filterId: string) => void;
  onEditFilter: (filterId: string) => void;
  onAddFilter: () => void;
}

export default function FilterBar({
  activeFilters,
  onRemoveFilter,
  onEditFilter,
  onAddFilter,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <button className="filter-bar__add-btn" onClick={onAddFilter}>
        <span className="icon">+</span>
        Ajouter un filtre
      </button>

      <div className="filter-bar__chips">
        {activeFilters.length === 0 && (
          <span className="filter-bar__empty">
            Aucun filtre actif. Cliquez sur "Ajouter un filtre" pour commencer.
          </span>
        )}
        {activeFilters.map((filter) => (
          <FilterChip
            key={filter.id}
            filter={filter}
            onRemove={() => onRemoveFilter(filter.id)}
            onEdit={() => onEditFilter(filter.id)}
          />
        ))}
      </div>
    </div>
  );
}
