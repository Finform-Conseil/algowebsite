'use client';

import { useState, useMemo } from 'react';
import { OPCVM_INDICATOR_CATEGORIES, ComparisonTemplate } from '@/core/data/StockComparison';

interface IndicatorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndicators: string[];
  onToggleIndicator: (indicatorId: string) => void;
  onApplyTemplate: (template: ComparisonTemplate) => void;
}

export default function OPCVMIndicatorSidebar({
  isOpen,
  onClose,
  selectedIndicators,
  onToggleIndicator,
  onApplyTemplate,
}: IndicatorSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(OPCVM_INDICATOR_CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les indicateurs par recherche
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return OPCVM_INDICATOR_CATEGORIES;
    
    const query = searchQuery.toLowerCase();
    return OPCVM_INDICATOR_CATEGORIES.map(cat => ({
      ...cat,
      indicators: cat.indicators.filter(
        ind => ind.name.toLowerCase().includes(query) || 
               ind.unit.toLowerCase().includes(query) ||
               (ind.description && ind.description.toLowerCase().includes(query))
      )
    })).filter(cat => cat.indicators.length > 0);
  }, [searchQuery]);

  const toggleCategory = (categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="indicator-modal-overlay" onClick={onClose} />

      {/* Modal */}
      <div className="indicator-modal">
        <div className="indicator-modal__header">
          <div className="indicator-modal__title">
            <h3>Select Indicators to Compare</h3>
            <span className="selected-count">{selectedIndicators.length} selected</span>
          </div>
          <button className="indicator-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="indicator-modal__body">
          {/* Search Bar */}
          <div className="indicator-search">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search for an indicator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="indicator-search__input"
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          {/* Categories Accordion */}
          <div className="indicator-categories-accordion">
            {filteredCategories.map((category) => (
              <div key={category.id} className="category-accordion-item">
                <button
                  className={`category-accordion-header ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="category-name">{category.name}</span>
                  <div className="category-right">
                    <span className="category-badge">{category.indicators.length}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points={activeCategory === category.id ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
                    </svg>
                  </div>
                </button>

                {/* Indicators List */}
                {activeCategory === category.id && (
                  <div className="category-accordion-content">
                    <div className="indicator-items">
                      {category.indicators.map((indicator) => (
                        <label key={indicator.id} className="indicator-checkbox-item">
                          <input
                            type="checkbox"
                            checked={selectedIndicators.includes(indicator.id)}
                            onChange={() => onToggleIndicator(indicator.id)}
                          />
                          <div className="indicator-checkbox-label">
                            <span className="indicator-checkbox-name">{indicator.name}</span>
                            <span className="indicator-checkbox-unit">{indicator.unit}</span>
                          </div>
                          {indicator.description && (
                            <div className="indicator-tooltip-icon" title={indicator.description}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 16v-4" />
                                <path d="M12 8h.01" />
                              </svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="indicator-modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              // Optional: apply and close
              onClose();
            }}
          >
            Apply ({selectedIndicators.length})
          </button>
        </div>
      </div>
    </>
  );
}
