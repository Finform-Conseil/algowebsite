'use client';

import { ActiveFilter } from '@/core/data/StockScreenerV2';

interface FilterSummaryProps {
  activeFilters: ActiveFilter[];
  resultsCount: number;
  totalCount: number;
  onClearAll: () => void;
  onSaveTemplate: () => void;
  onShare: () => void;
}

export default function FilterSummary({
  activeFilters,
  resultsCount,
  totalCount,
  onClearAll,
  onSaveTemplate,
  onShare,
}: FilterSummaryProps) {
  if (activeFilters.length === 0) return null;

  return (
    <div className="filter-summary">
      <div className="filter-summary__info">
        <span className="filter-summary__count">
          <strong>{activeFilters.length}</strong> {activeFilters.length > 1 ? 'filtres appliqués' : 'filtre appliqué'}
        </span>
        <span className="filter-summary__divider">—</span>
        <span className="filter-summary__results">
          <strong className="filter-summary__results-count">{resultsCount}</strong> actions trouvées
          <span className="filter-summary__total"> / {totalCount}</span>
        </span>
      </div>

      <div className="filter-summary__actions">
        <button className="filter-summary__btn filter-summary__btn--clear" onClick={onClearAll}>
          Effacer tout
        </button>
        <button className="filter-summary__btn filter-summary__btn--save" onClick={onSaveTemplate}>
          Enregistrer
        </button>
        <button className="filter-summary__btn filter-summary__btn--share" onClick={onShare}>
          Partager
        </button>
      </div>
    </div>
  );
}
