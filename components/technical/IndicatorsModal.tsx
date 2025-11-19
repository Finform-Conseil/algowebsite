'use client';

import { useState, useMemo } from 'react';
import { INDICATOR_CONFIGS } from '@/types/indicators';

interface Indicator {
  id: string;
  name: string;
  category: 'indicator' | 'strategy' | 'pattern';
  description: string;
  author?: string;
  likes?: number;
}

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIndicator: (indicatorId: string) => void;
  activeIndicators?: string[];
}

const SIDEBAR_SECTIONS = [
  { id: 'builtin', label: 'Built-in', tabs: ['Technical Analysis', 'Financial Analysis'] },
  { id: 'personal', label: 'Personal', tabs: ['Favoris', 'My Scripts', 'Shared with me'] },
  { id: 'community', label: 'Community', tabs: ['Trending', 'Top Rated'] },
];

// Convertir les configurations d'indicateurs en format du modal
const DEMO_INDICATORS: Indicator[] = [
  // Indicateurs techniques configurables
  ...INDICATOR_CONFIGS.map(config => ({
    id: config.id,
    name: config.name,
    category: 'indicator' as const,
    description: config.description
  })),
  // Stratégies et patterns (exemples)
  { id: 'ma_crossover', name: 'MA Crossover Strategy', category: 'strategy', description: 'Stratégie de croisement de moyennes mobiles', author: 'TradingView', likes: 1523 },
  { id: 'rsi_divergence', name: 'RSI Divergence Strategy', category: 'strategy', description: 'Détection de divergences RSI', author: 'Community', likes: 892 },
  { id: 'head_shoulders', name: 'Head and Shoulders', category: 'pattern', description: 'Détection du pattern tête-épaules' },
  { id: 'double_top', name: 'Double Top/Bottom', category: 'pattern', description: 'Détection de double sommet/creux' },
];

export default function IndicatorsModal({ isOpen, onClose, onAddIndicator, activeIndicators = [] }: IndicatorsModalProps) {
  const [selectedSection, setSelectedSection] = useState('builtin');
  const [selectedTab, setSelectedTab] = useState('Technical Analysis');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'indicator' | 'strategy' | 'pattern'>('all');
  const [showScriptEditor, setShowScriptEditor] = useState(false);

  const filteredIndicators = useMemo(() => {
    let indicators = DEMO_INDICATORS;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      indicators = indicators.filter((i) => i.category === categoryFilter);
    }
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      indicators = indicators.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          i.description.toLowerCase().includes(query)
      );
    }
    
    return indicators;
  }, [searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const currentSection = SIDEBAR_SECTIONS.find((s) => s.id === selectedSection);

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="indicators-modal">
        <div className="indicators-modal__header">
          <h3>Indicators, Metrics & Strategies</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="indicators-modal__body">
          {/* Sidebar */}
          <div className="indicators-sidebar">
            {SIDEBAR_SECTIONS.map((section) => (
              <div key={section.id} className="sidebar-section">
                <div
                  className={`sidebar-section__header ${selectedSection === section.id ? 'active' : ''}`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  {section.label}
                </div>
                {selectedSection === section.id && (
                  <div className="sidebar-section__tabs">
                    {section.tabs.map((tab) => (
                      <button
                        key={tab}
                        className={`sidebar-tab ${selectedTab === tab ? 'active' : ''}`}
                        onClick={() => setSelectedTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="indicators-content">
            {/* Script Editor */}
            {selectedTab === 'My Scripts' && showScriptEditor ? (
              <div className="script-editor">
                <div className="script-editor__header">
                  <input
                    type="text"
                    placeholder="Nom du script"
                    className="script-name-input"
                  />
                  <div className="script-editor__actions">
                    <button className="btn btn--secondary" onClick={() => setShowScriptEditor(false)}>
                      Annuler
                    </button>
                    <button className="btn btn--primary">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save
                    </button>
                  </div>
                </div>
                <textarea
                  className="script-editor__textarea"
                  placeholder="// Écrivez votre script ici..."
                  rows={20}
                />
              </div>
            ) : (
              <>
                {/* Search & Filters */}
                <div className="indicators-filters">
                  <div className="search-input-wrapper">
                    <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Rechercher un indicateur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>

                  <div className="category-filters">
                    <button
                      className={`category-filter ${categoryFilter === 'all' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('all')}
                    >
                      Tous
                    </button>
                    <button
                      className={`category-filter ${categoryFilter === 'indicator' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('indicator')}
                    >
                      Indicateurs
                    </button>
                    <button
                      className={`category-filter ${categoryFilter === 'strategy' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('strategy')}
                    >
                      Stratégies
                    </button>
                    <button
                      className={`category-filter ${categoryFilter === 'pattern' ? 'active' : ''}`}
                      onClick={() => setCategoryFilter('pattern')}
                    >
                      Patterns
                    </button>
                  </div>

                  {selectedTab === 'My Scripts' && (
                    <button className="btn btn--primary" onClick={() => setShowScriptEditor(true)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Créer un Script
                    </button>
                  )}
                </div>

                {/* Indicators List */}
                <div className="indicators-list">
                  {filteredIndicators.map((indicator) => {
                    const isActive = activeIndicators.includes(indicator.id);
                    return (
                    <div key={indicator.id} className="indicator-card">
                      <div className="indicator-card__header">
                        <div className="indicator-card__title">{indicator.name}</div>
                        <button
                          className={`btn btn--small ${isActive ? 'btn--secondary' : 'btn--primary'}`}
                          onClick={() => {
                            onAddIndicator(indicator.id);
                            if (!isActive) {
                              onClose();
                            }
                          }}
                          disabled={isActive}
                        >
                          {isActive ? 'Ajouté' : 'Ajouter'}
                        </button>
                      </div>
                      <div className="indicator-card__description">{indicator.description}</div>
                      {(indicator.author || indicator.likes) && (
                        <div className="indicator-card__meta">
                          {indicator.author && <span className="author">Par {indicator.author}</span>}
                          {indicator.likes && (
                            <span className="likes">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              {indicator.likes}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
