'use client';

import { useState } from 'react';
import { FILTER_FAMILIES, ALL_CRITERIA, FilterCriterion, FilterFamily } from '@/core/data/StockScreenerV2';

interface FilterSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCriterion: (criterion: FilterCriterion, operator: string, value: number | string) => void;
}

export default function FilterSidePanel({ isOpen, onClose, onSelectCriterion }: FilterSidePanelProps) {
  const [expandedFamily, setExpandedFamily] = useState<FilterFamily | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<FilterCriterion | null>(null);
  const [operator, setOperator] = useState<string>('>=');
  const [value, setValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const handleToggleFamily = (family: FilterFamily) => {
    setExpandedFamily(expandedFamily === family ? null : family);
    setSelectedCriterion(null);
  };

  // Filtrer les familles selon la recherche
  const filteredFamilies = FILTER_FAMILIES.filter((family) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    // Recherche dans le nom de famille
    if (family.toLowerCase().includes(query)) return true;
    // Recherche dans les critères de la famille
    const familyCriteria = ALL_CRITERIA.filter((c) => c.family === family);
    return familyCriteria.some((c) => c.name.toLowerCase().includes(query) || (c.description && c.description.toLowerCase().includes(query)));
  });

  const handleSelectCriterion = (criterion: FilterCriterion) => {
    setSelectedCriterion(criterion);
    setOperator('>=');
    setValue('');
  };

  const handleApply = () => {
    if (!selectedCriterion || !value) return;

    const parsedValue = selectedCriterion.type === 'select' ? value : parseFloat(value);
    onSelectCriterion(selectedCriterion, operator, parsedValue);
    setSelectedCriterion(null);
    setValue('');
  };

  return (
    <>
      <div className="filter-sidepanel-overlay" onClick={onClose} />
      <div className="filter-sidepanel">
        <div className="filter-sidepanel__header">
          <h3>Sélectionner un Critère</h3>
          <button className="filter-sidepanel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="filter-sidepanel__search">
          <input
            type="text"
            placeholder="Rechercher un critère..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-sidepanel__body">
          {/* Liste des familles */}
          <div className="families-list">
            {filteredFamilies.map((family) => {
              const criteria = ALL_CRITERIA.filter((c) => c.family === family);
              const isExpanded = expandedFamily === family;

              return (
                <div key={family} className="family-accordion">
                  <button
                    className={`family-accordion__header ${isExpanded ? 'active' : ''}`}
                    onClick={() => handleToggleFamily(family)}
                  >
                    <span>{family}</span>
                    <span className="family-accordion__count">({criteria.length})</span>
                    <span className="family-accordion__icon">{isExpanded ? '▼' : '▶'}</span>
                  </button>

                  {isExpanded && (
                    <div className="criteria-list">
                      {ALL_CRITERIA.filter((c) => c.family === family)
                        .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase())))
                        .map((criterion) => (
                          <button
                            key={criterion.id}
                            className={`criterion-item ${selectedCriterion?.id === criterion.id ? 'active' : ''}`}
                            onClick={() => handleSelectCriterion(criterion)}
                          >
                            <div className="criterion-item__name">{criterion.name}</div>
                            <div className="criterion-item__desc">{criterion.description}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Configuration du filtre sélectionné */}
          {selectedCriterion && (
            <div className="filter-sidepanel__config">
              <h4 className="config-title">{selectedCriterion.name}</h4>
              {selectedCriterion.description && (
                <p className="config-description">{selectedCriterion.description}</p>
              )}

              <div className="config-form">
                {selectedCriterion.type === 'select' ? (
                  <select
                    className="config-form__input"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  >
                    <option value="">Sélectionner...</option>
                    {selectedCriterion.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <>
                    <select
                      className="config-form__operator"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                    >
                      <option value=">=">≥ Supérieur ou égal</option>
                      <option value="<=">≤ Inférieur ou égal</option>
                      <option value=">">{'>'} Supérieur</option>
                      <option value="<">{'<'} Inférieur</option>
                      <option value="=">=  Égal</option>
                    </select>

                    <div className="config-form__value-group">
                      <input
                        type="number"
                        className="config-form__input"
                        placeholder={`Min: ${selectedCriterion.min}, Max: ${selectedCriterion.max}`}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        min={selectedCriterion.min}
                        max={selectedCriterion.max}
                        step={selectedCriterion.type === 'percentage' ? 0.1 : 1}
                      />
                      {selectedCriterion.type === 'percentage' && <span className="unit-suffix">%</span>}
                      {selectedCriterion.unit && <span className="unit-suffix">{selectedCriterion.unit}</span>}
                    </div>

                    {/* Slider interactif */}
                    {selectedCriterion.min !== undefined && selectedCriterion.max !== undefined && (
                      <input
                        type="range"
                        className="config-form__slider"
                        min={selectedCriterion.min}
                        max={selectedCriterion.max}
                        step={selectedCriterion.type === 'percentage' ? 0.5 : 1}
                        value={value || selectedCriterion.min}
                        onChange={(e) => setValue(e.target.value)}
                      />
                    )}
                  </>
                )}

                <button className="config-form__apply" onClick={handleApply} disabled={!value}>
                  Appliquer le filtre
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
