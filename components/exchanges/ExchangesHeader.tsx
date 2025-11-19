'use client';

import { useState, useEffect } from 'react';
import { StockExchange } from '@/types/exchanges';
import { AFRICAN_EXCHANGES, REGIONS } from '@/core/data/ExchangesData';

interface ExchangesHeaderProps {
  selectedExchanges: string[];
  onExchangeToggle: (exchangeId: string) => void;
  onCompareClick: () => void;
  viewMode: 'overview' | 'performance' | 'structure' | 'ranking';
  onViewModeChange: (mode: 'overview' | 'performance' | 'structure' | 'ranking') => void;
}

export default function ExchangesHeader({ 
  selectedExchanges, 
  onExchangeToggle, 
  onCompareClick,
  viewMode,
  onViewModeChange
}: ExchangesHeaderProps) {
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [backgroundImages, setBackgroundImages] = useState([
    '/images/exchanges-header-1.jpg', // Vue panoramique des marchés
    '/images/exchanges-header-2.jpg', // Graphiques financiers
    '/images/exchanges-header-3.jpg', // Architecture moderne
    '/images/exchanges-header-4.jpg', // Carte d'Afrique économique
  ]);

  const subtitles = [
    "Panorama des marchés actions du continent — tailles, dynamiques et performances",
    "Comparez les principales bourses africaines et analysez leurs performances",
    "Découvrez les opportunités d'investissement sur les marchés émergents africains",
    "Analysez la structure et la réglementation de chaque place boursière"
  ];

  const viewModes = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { id: 'performance', label: 'Performances', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg> },
    { id: 'structure', label: 'Structure', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM12 8v8m-4-4h8"/></svg> },
    { id: 'ranking', label: 'Classement', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getSelectedExchangesData = () => {
    return AFRICAN_EXCHANGES.filter(exchange => selectedExchanges.includes(exchange.id));
  };

  const getTotalMarketCap = () => {
    return getSelectedExchangesData().reduce((sum, exchange) => sum + exchange.totalMarketCap, 0);
  };

  const getTotalVolume = () => {
    return getSelectedExchangesData().reduce((sum, exchange) => sum + exchange.dailyVolume, 0);
  };

  const getAverageYTDReturn = () => {
    const selected = getSelectedExchangesData();
    if (selected.length === 0) return 0;
    return selected.reduce((sum, exchange) => sum + exchange.ytdReturn, 0) / selected.length;
  };

  return (
    <div className="exchanges-header">
      {/* Dynamic Background Header */}
      <div 
        className="exchanges-header__main"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentSubtitle]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 1s ease-in-out'
        }}
      >
        <div className="exchanges-header__content">
          <div className="exchanges-header__title-section">
            <h1 className="exchanges-header__title">Bourses Africaines</h1>
            <div className="exchanges-header__subtitle-container">
              <p className="exchanges-header__subtitle">{subtitles[currentSubtitle]}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="exchanges-header__stats">
            <div className="stat-item">
              <span className="stat-label">Marchés Sélectionnés</span>
              <span className="stat-value">{selectedExchanges.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Capitalisation Totale</span>
              <span className="stat-value">${getTotalMarketCap().toFixed(1)}B</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Volume Quotidien</span>
              <span className="stat-value">${getTotalVolume().toFixed(1)}M</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Performance Moyenne YTD</span>
              <span className={`stat-value ${getAverageYTDReturn() >= 0 ? 'positive' : 'negative'}`}>
                {getAverageYTDReturn() >= 0 ? '+' : ''}{getAverageYTDReturn().toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="exchanges-header__controls">
        {/* Row 1: Exchange Selector + Header Actions */}
        <div className="exchange-actions-row">
          {/* Exchange Selector */}
          <div className="exchange-selector">
            <div className="exchange-pills">
              {AFRICAN_EXCHANGES.map((exchange) => (
                <button
                  key={exchange.id}
                  className={`exchange-pill ${selectedExchanges.includes(exchange.id) ? 'selected' : ''}`}
                  onClick={() => onExchangeToggle(exchange.id)}
                >
                  <img 
                    src={`/images/exchanges/${exchange.id}.png`} 
                    alt={exchange.name}
                    className="exchange-logo"
                  />
                  <span>{exchange.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="header-actions">
            <button 
              className="compare-btn"
              onClick={onCompareClick}
              disabled={selectedExchanges.length < 2}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
              <span>Comparer les bourses</span>
              {selectedExchanges.length > 0 && (
                <span className="btn-badge">{selectedExchanges.length}</span>
              )}
            </button>
            <button className="export-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7,10 12,15 17,10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Exporter</span>
            </button>
          </div>
        </div>

        {/* Row 2: View Mode Selector + Filters */}
        <div className="view-filters-row">
          {/* View Mode Selector */}
          <div className="view-mode-selector">
            <div className="view-mode-pills">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  className={`view-mode-pill ${viewMode === mode.id ? 'selected' : ''}`}
                  onClick={() => onViewModeChange(mode.id as any)}
                >
                  <span className="mode-icon">{mode.icon}</span>
                  <span>{mode.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="header-filters">
            <div className="filter-group">
              <label>Région:</label>
              <select className="filter-select">
                <option value="">Toutes les régions</option>
                <option value="west">Afrique de l'Ouest</option>
                <option value="east">Afrique de l'Est</option>
                <option value="north">Afrique du Nord</option>
                <option value="south">Afrique Australe</option>
                <option value="central">Afrique Centrale</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Taille:</label>
              <select className="filter-select">
                <option value="">Toutes tailles</option>
                <option value="large">Grande (&gt; $50B)</option>
                <option value="medium">Moyenne ($10-50B)</option>
                <option value="small">Petite (&lt; $10B)</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Liquidité:</label>
              <select className="filter-select">
                <option value="">Toutes liquidités</option>
                <option value="high">Élevée</option>
                <option value="medium">Moyenne</option>
                <option value="low">Faible</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Croissance:</label>
              <select className="filter-select">
                <option value="">Toutes croissances</option>
                <option value="high">Élevée (&gt;20%)</option>
                <option value="medium">Moyenne (10-20%)</option>
                <option value="low">Faible (&lt;10%)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
