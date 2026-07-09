"use client";

import { PrimaryActiveFilter } from "@/core/data/PrimaryScreenerFilters";

interface PrimaryFilterBarProps {
  activeFilters: PrimaryActiveFilter[];
  onAddFilter: () => void;
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

export default function PrimaryFilterBar({
  activeFilters,
  onAddFilter,
  onRemoveFilter,
  onClearAll,
}: PrimaryFilterBarProps) {
  return (
    <div className="primary-filter-bar">

      <div className="primary-filter-bar__chips">
        {activeFilters.length === 0 ? (
          <span className="primary-filter-bar__empty">No active filters</span>
        ) : (
          activeFilters.map((filter) => {
            const valueLabel =
              filter.criterion.type === "percentage" && typeof filter.value === "number"
                ? `${filter.value}%`
                : String(filter.value);
            return (
              <div key={filter.id} className="primary-filter-chip">
                <span className="primary-filter-chip__text">
                  {filter.criterion.name} {filter.operator} {valueLabel}
                </span>
                <button
                  className="primary-filter-chip__remove"
                  onClick={() => onRemoveFilter(filter.id)}
                  aria-label="Remove filter"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>
      <div className="primary-filter-bar__actions">
        <button className="primary-filter-bar__add-btn" onClick={onAddFilter}>
          <span className="icon">+</span>
          Add Filter
        </button>
        {activeFilters.length > 0 && (
          <button className="btn-secondary btn-clear-all" onClick={onClearAll}>
            Clear all
          </button>
        )}
      </div>

    </div>
  );
}
