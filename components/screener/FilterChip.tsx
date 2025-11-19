'use client';

import { ActiveFilter } from '@/core/data/StockScreenerV2';

interface FilterChipProps {
  filter: ActiveFilter;
  onRemove: () => void;
  onEdit: () => void;
}

export default function FilterChip({ filter, onRemove, onEdit }: FilterChipProps) {
  const getOperatorSymbol = (op: string) => {
    switch (op) {
      case '>=': return '≥';
      case '<=': return '≤';
      case '>': return '>';
      case '<': return '<';
      case '=': return '=';
      default: return op;
    }
  };

  const formatValue = (value: number | string) => {
    if (typeof value === 'string') return value;
    if (filter.criterion.type === 'percentage') return `${value}%`;
    if (filter.criterion.unit) return `${value} ${filter.criterion.unit}`;
    return value.toString();
  };

  return (
    <div className="filter-chip">
      <button className="filter-chip__info" title={filter.criterion.description || filter.criterion.name}>
        ℹ️
      </button>
      <span className="filter-chip__name">{filter.criterion.name}</span>
      <span className="filter-chip__operator">{getOperatorSymbol(filter.operator)}</span>
      <input
        type={filter.criterion.type === 'select' ? 'text' : 'number'}
        className="filter-chip__value"
        value={filter.value}
        onChange={(e) => {
          // Pour l'instant read-only, on pourra ajouter l'édition plus tard
        }}
        onClick={onEdit}
        readOnly
      />
      <button className="filter-chip__remove" onClick={onRemove} title="Supprimer ce filtre">
        ✕
      </button>
    </div>
  );
}
