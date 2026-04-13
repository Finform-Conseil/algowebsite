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
        Add Filter
      </button>

      <div className="filter-bar__chips">
        {activeFilters.length === 0 && (
          <span className="filter-bar__empty">
            No active filters. Click "Add Filter" to get started.
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
