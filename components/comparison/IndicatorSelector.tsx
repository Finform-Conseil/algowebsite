'use client';

import { useState } from 'react';
import { INDICATOR_CATEGORIES, COMPARISON_TEMPLATES, Indicator, ComparisonTemplate } from '@/core/data/StockComparison';

interface IndicatorSelectorProps {
  selectedIndicators: string[];
  onToggleIndicator: (indicatorId: string) => void;
  onApplyTemplate: (template: ComparisonTemplate) => void;
}

export default function IndicatorSelector({
  selectedIndicators,
  onToggleIndicator,
  onApplyTemplate,
}: IndicatorSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>(INDICATOR_CATEGORIES[0].id);
  const [showTemplates, setShowTemplates] = useState(false);

  const activeIndicators = INDICATOR_CATEGORIES.find((cat) => cat.id === activeCategory)?.indicators || [];

  return (
    <div className="indicator-selector">
      <div className="indicator-selector__header">
        <h3>Indicateurs à Comparer</h3>
        <div className="indicator-selector__actions">
          <span className="selected-count">{selectedIndicators.length} sélectionnés</span>
          <button
            className="template-btn"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            Templates
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Templates dropdown */}
      {showTemplates && (
        <div className="template-dropdown">
          <h4>Templates Prédéfinis</h4>
          <div className="template-list">
            {COMPARISON_TEMPLATES.map((template) => (
              <button
                key={template.id}
                className="template-item"
                onClick={() => {
                  onApplyTemplate(template);
                  setShowTemplates(false);
                }}
              >
                <div className="template-item__name">{template.name}</div>
                <div className="template-item__desc">{template.description}</div>
                <div className="template-item__count">{template.indicators.length} indicateurs</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Catégories horizontales */}
      <div className="indicator-categories">
        {INDICATOR_CATEGORIES.map((category) => {
          const categorySelectedCount = category.indicators.filter((ind) =>
            selectedIndicators.includes(ind.id)
          ).length;

          return (
            <button
              key={category.id}
              className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              <span className="category-tab__name">{category.name}</span>
              {categorySelectedCount > 0 && (
                <span className="category-tab__badge">{categorySelectedCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Liste des indicateurs */}
      <div className="indicator-list">
        {activeIndicators.map((indicator) => (
          <label key={indicator.id} className="indicator-item">
            <input
              type="checkbox"
              checked={selectedIndicators.includes(indicator.id)}
              onChange={() => onToggleIndicator(indicator.id)}
              className="indicator-item__checkbox"
            />
            <div className="indicator-item__content">
              <div className="indicator-item__name">
                {indicator.name}
                {indicator.unit && <span className="indicator-item__unit">({indicator.unit})</span>}
              </div>
              <div className="indicator-item__desc">{indicator.description}</div>
            </div>
            <div className="indicator-item__tooltip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
