'use client';

import { useState } from 'react';
import { 
  FILTER_FAMILIES, 
  FilterCriterion, 
  FilterFamily,
  FilterSubFamily 
} from '@/core/data/StockScreenerFilters';

interface FilterSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCriterion: (criterion: FilterCriterion, operator: string, value: number | string) => void;
}

export default function FilterSidePanel({ isOpen, onClose, onSelectCriterion }: FilterSidePanelProps) {
  const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
  const [expandedSubFamilyId, setExpandedSubFamilyId] = useState<string | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<FilterCriterion | null>(null);
  const [operator, setOperator] = useState<string>('>=');
  const [value, setValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  // Filtrer les familles en fonction de la recherche
  const filteredFamilies = FILTER_FAMILIES.map((family) => {
    const filteredSubFamilies = family.subFamilies.map((subFamily) => {
      const filteredCriteria = subFamily.criteria.filter((criterion) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          criterion.name.toLowerCase().includes(query) ||
          criterion.description.toLowerCase().includes(query) ||
          criterion.id.toLowerCase().includes(query)
        );
      });

      return {
        ...subFamily,
        criteria: filteredCriteria,
      };
    }).filter((subFamily) => subFamily.criteria.length > 0);

    return {
      ...family,
      subFamilies: filteredSubFamilies,
    };
  }).filter((family) => family.subFamilies.length > 0);

  const handleToggleFamily = (familyId: string) => {
    if (expandedFamilyId === familyId) {
      setExpandedFamilyId(null);
      setExpandedSubFamilyId(null);
    } else {
      setExpandedFamilyId(familyId);
    }
  };

  const handleToggleSubFamily = (subFamilyId: string) => {
    setExpandedSubFamilyId(expandedSubFamilyId === subFamilyId ? null : subFamilyId);
  };

  const handleSelectCriterion = (criterion: FilterCriterion) => {
    setSelectedCriterion(criterion);
    setOperator('>=');
    setValue('');
  };

  const handleApply = () => {
    if (!selectedCriterion || !value) return;
    
    const finalValue = parseFloat(value);

    onSelectCriterion(selectedCriterion, operator, finalValue);
    setSelectedCriterion(null);
    setValue('');
  };

  // Fonction pour mettre en évidence le texte recherché
  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} style={{ background: 'rgba(0, 191, 255, 0.2)', padding: '0 2px', borderRadius: '2px' }}>{part}</mark>
        : part
    );
  };

  return (
    <>
      <div className="filter-modal-overlay" onClick={onClose} />
      <div className="filter-modal filter-modal--two-column">
        {/* Header */}
        <div className="filter-modal__header">
          <div className="filter-modal__header-content">
            <h3>Add Filter Criterion</h3>
            <p className="filter-modal__subtitle">Select a metric to filter your stocks</p>
          </div>
          <button className="filter-modal__close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="filter-modal__search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search for a criterion..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="filter-modal__body">
          {/* Left Column - Navigation Menu */}
          <div className="filter-modal__navigation">
            {filteredFamilies.length === 0 ? (
              <div className="config-empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <h4>No results found</h4>
                <p>Try adjusting your search query</p>
              </div>
            ) : (
              <div className="families-nav">
                {filteredFamilies.map((family) => {
                // Auto-expand si recherche active
                const isExpanded = searchQuery ? true : expandedFamilyId === family.id;

                return (
                  <div key={family.id} className="family-nav-item">
                    <button
                      className={`family-nav-item__header ${isExpanded ? 'active' : ''}`}
                      onClick={() => handleToggleFamily(family.id)}
                    >
                      <span className="family-icon">{family.icon}</span>
                      <span className="family-name">{family.name}</span>
                      <svg 
                        className={`chevron ${isExpanded ? 'expanded' : ''}`}
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>

                    {isExpanded && (
                      <div className="subfamilies-list">
                        {family.subFamilies.map((subFamily) => {
                          // Auto-expand si recherche active
                          const isSubExpanded = searchQuery ? true : expandedSubFamilyId === subFamily.id;

                          return (
                            <div key={subFamily.id} className="subfamily-item">
                              <button
                                className={`subfamily-item__header ${isSubExpanded ? 'active' : ''}`}
                                onClick={() => handleToggleSubFamily(subFamily.id)}
                              >
                                <span className="subfamily-name">{subFamily.name}</span>
                                <span className="subfamily-count">({subFamily.criteria.length})</span>
                                <svg 
                                  className={`chevron-small ${isSubExpanded ? 'expanded' : ''}`}
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  strokeWidth="2"
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </button>

                              {isSubExpanded && (
                                <div className="criteria-nav-list">
                                  {subFamily.criteria.map((criterion) => (
                                    <button
                                      key={criterion.id}
                                      className={`criterion-nav-item ${selectedCriterion?.id === criterion.id ? 'active' : ''}`}
                                      onClick={() => handleSelectCriterion(criterion)}
                                    >
                                      <span className="criterion-nav-name">{highlightText(criterion.name, searchQuery)}</span>
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="9 18 15 12 9 6" />
                                      </svg>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
            )}
          </div>

          {/* Right Column - Configuration Panel */}
          <div className="filter-modal__config">
            {selectedCriterion ? (
              <>
                <div className="config-header">
                  <h4 className="config-title">{selectedCriterion.name}</h4>
                  <span className="config-badge">
                    {selectedCriterion.type === 'percentage' ? 'Percentage' : 'Number'}
                  </span>
                </div>

                <div className="config-description">
                  <div className="description-label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4" />
                      <path d="M12 8h.01" />
                    </svg>
                    <span>Description</span>
                  </div>
                  <p className="description-text">{selectedCriterion.description}</p>
                </div>

                <div className="config-form">
                  <div className="form-section">
                    <label className="form-label">Operator</label>
                    <select
                      className="config-form__operator"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                    >
                      <option value=">=">≥ Greater than or equal</option>
                      <option value="<=">≤ Less than or equal</option>
                      <option value=">">{'>'} Greater than</option>
                      <option value="<">{'<'} Less than</option>
                      <option value="=">=  Equal</option>
                    </select>
                  </div>

                  <div className="form-section">
                    <label className="form-label">Value</label>
                    
                    <div className="config-form__value-group">
                      <input
                        type="number"
                        className="config-form__input"
                        placeholder={selectedCriterion.min !== undefined && selectedCriterion.max !== undefined 
                          ? `Range: ${selectedCriterion.min} - ${selectedCriterion.max}` 
                          : 'Enter value'}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        min={selectedCriterion.min}
                        max={selectedCriterion.max}
                        step={selectedCriterion.step || (selectedCriterion.type === 'percentage' ? 0.1 : 1)}
                      />
                      {selectedCriterion.type === 'percentage' && <span className="unit-suffix">%</span>}
                      {selectedCriterion.unit && <span className="unit-suffix">{selectedCriterion.unit}</span>}
                    </div>

                    {selectedCriterion.min !== undefined && selectedCriterion.max !== undefined && (
                      <div className="slider-container">
                        <input
                          type="range"
                          className="config-form__slider"
                          min={selectedCriterion.min}
                          max={selectedCriterion.max}
                          step={selectedCriterion.step || (selectedCriterion.type === 'percentage' ? 0.5 : 1)}
                          value={value || selectedCriterion.min}
                          onChange={(e) => setValue(e.target.value)}
                        />
                        <div className="slider-labels">
                          <span>{selectedCriterion.min}</span>
                          <span>{selectedCriterion.max}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-secondary" 
                      onClick={() => {
                        setSelectedCriterion(null);
                        setValue('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-primary config-form__apply" 
                      onClick={handleApply} 
                      disabled={!value}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Apply Filter
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="config-empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                  <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
                </svg>
                <h4>Select a Filter</h4>
                <p>Choose a criterion from the left menu to configure your filter</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
