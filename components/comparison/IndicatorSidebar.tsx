'use client';

import { useState, useMemo } from 'react';
import { INDICATOR_CATEGORIES, COMPARISON_TEMPLATES, Indicator, ComparisonTemplate } from '@/core/data/StockComparison';

interface IndicatorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIndicators: string[];
  onToggleIndicator: (indicatorId: string) => void;
  onApplyTemplate: (template: ComparisonTemplate) => void;
}

export default function IndicatorSidebar({
  isOpen,
  onClose,
  selectedIndicators,
  onToggleIndicator,
  onApplyTemplate,
}: IndicatorSidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(INDICATOR_CATEGORIES[0].id);
  const [showTemplates, setShowTemplates] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les indicateurs par recherche
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return INDICATOR_CATEGORIES;
    
    const query = searchQuery.toLowerCase();
    return INDICATOR_CATEGORIES.map(cat => ({
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
      <div className="indicator-sidebar-overlay" onClick={onClose} />

      {/* Sidebar */}
      <div className="indicator-sidebar">
        <div className="indicator-sidebar__header">
          <div className="indicator-sidebar__title">
            <h3>Indicateurs à Comparer</h3>
            <span className="selected-count">{selectedIndicators.length} sélectionnés</span>
          </div>
          <button className="indicator-sidebar__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="indicator-sidebar__body">
          {/* Search Bar */}
          <div className="indicator-search">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un indicateur..."
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

          {/* Templates Dropdown */}
          <div className="indicator-templates">
            <button
              className="template-dropdown-btn"
              onClick={() => setShowTemplates(!showTemplates)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Templates prédéfinis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                <polyline points={showTemplates ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
              </svg>
            </button>

            {showTemplates && (
              <div className="template-dropdown">
                {COMPARISON_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    className="template-item"
                    onClick={() => {
                      onApplyTemplate(template);
                      setShowTemplates(false);
                    }}
                  >
                    <div className="template-item__header">
                      <span className="template-item__name">{template.name}</span>
                      <span className="template-item__count">{template.indicators.length}</span>
                    </div>
                    <p className="template-item__desc">{template.description}</p>
                  </button>
                ))}
              </div>
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

        <div className="indicator-sidebar__footer">
          <button className="btn btn--secondary" onClick={onClose}>
            Fermer
          </button>
          <button
            className="btn btn--primary"
            onClick={() => {
              // Optional: apply and close
              onClose();
            }}
          >
            Appliquer ({selectedIndicators.length})
          </button>
        </div>
      </div>
    </>
  );
}
