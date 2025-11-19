'use client';

import { useState, useEffect } from 'react';
import { Period, Exchange, Sector, MarketIndicators } from '@/types/market-movers';
import MultiSelect from '@/components/corporate-events/MultiSelect';

interface MarketHeaderProps {
  indicators: MarketIndicators;
  onFilterChange: (filters: any) => void;
}

export default function MarketHeader({ indicators, onFilterChange }: MarketHeaderProps) {
  const [period, setPeriod] = useState<Period>('day');
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [minVolume, setMinVolume] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const exchanges: Exchange[] = ['BRVM', 'JSE', 'CSE', 'NGX', 'GSE', 'NSE', 'EGX', 'TUNSE'];
  const sectors: Sector[] = ['Finance', 'Énergie', 'Télécom', 'Industrie', 'Consommation', 'Immobilier', 'Santé', 'Technologie', 'Matériaux', 'Services'];

  // Simuler le rafraîchissement temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Mettre à jour les filtres
  useEffect(() => {
    onFilterChange({
      period,
      exchanges: selectedExchanges,
      sectors: selectedSectors,
      minVolume: minVolume ? parseInt(minVolume) : undefined
    });
  }, [period, selectedExchanges, selectedSectors, minVolume, onFilterChange]);

  const getSentimentColor = () => {
    switch (indicators.sentiment) {
      case 'bullish': return '#10b981';
      case 'bearish': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSentimentIcon = () => {
    switch (indicators.sentiment) {
      case 'bullish':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        );
      case 'bearish':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="17 18 23 18 23 12" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        );
    }
  };

  return (
    <div className="market-header">
      <div className="market-header__content">
        {/* Titre et sous-titre */}
        <div className="market-header__title">
          <div className="title-content">
            <h1>Market Movers</h1>
            <p>Vue temps réel des principales variations du marché</p>
          </div>
          <div className="last-update">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span>Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</span>
          </div>
        </div>

        {/* Indicateurs clés */}
        <div className="market-indicators">
          <div className="indicator">
            <div className="indicator-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Marché</span>
              <span className="indicator-value">{indicators.selectedMarket}</span>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon" style={{ color: indicators.avgChange >= 0 ? '#10b981' : '#ef4444' }}>
              {indicators.avgChange >= 0 ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              )}
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Variation moyenne</span>
              <span 
                className="indicator-value"
                style={{ color: indicators.avgChange >= 0 ? '#10b981' : '#ef4444' }}
              >
                {indicators.avgChange >= 0 ? '+' : ''}{indicators.avgChange.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Volume total</span>
              <span className="indicator-value">
                {(indicators.totalVolume / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon" style={{ color: getSentimentColor() }}>
              {getSentimentIcon()}
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Sentiment</span>
              <span className="indicator-value" style={{ color: getSentimentColor() }}>
                {indicators.sentiment === 'bullish' ? 'Haussier' : 
                 indicators.sentiment === 'bearish' ? 'Baissier' : 'Neutre'}
              </span>
            </div>
          </div>

          <div className="indicator">
            <div className="indicator-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Titres actifs</span>
              <span className="indicator-value">{indicators.activeStocks}</span>
            </div>
          </div>

          <div className="indicator gainers">
            <div className="indicator-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Hausses</span>
              <span className="indicator-value">{indicators.gainers}</span>
            </div>
          </div>

          <div className="indicator losers">
            <div className="indicator-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
            <div className="indicator-content">
              <span className="indicator-label">Baisses</span>
              <span className="indicator-value">{indicators.losers}</span>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="market-filters">
          {/* Période */}
          <div className="filter-group period-filter">
            <label>Période</label>
            <div className="period-buttons">
              <button
                className={period === 'day' ? 'active' : ''}
                onClick={() => setPeriod('day')}
              >
                Journée
              </button>
              <button
                className={period === 'week' ? 'active' : ''}
                onClick={() => setPeriod('week')}
              >
                Semaine
              </button>
              <button
                className={period === 'month' ? 'active' : ''}
                onClick={() => setPeriod('month')}
              >
                Mois
              </button>
            </div>
          </div>

          {/* Bourses */}
          <MultiSelect
            label="Bourses"
            options={exchanges.map(ex => ({ value: ex, label: ex }))}
            selected={selectedExchanges}
            onChange={setSelectedExchanges}
            placeholder="Toutes les bourses"
          />

          {/* Secteurs */}
          <MultiSelect
            label="Secteurs"
            options={sectors.map(sec => ({ value: sec, label: sec }))}
            selected={selectedSectors}
            onChange={setSelectedSectors}
            placeholder="Tous les secteurs"
          />

          {/* Volume minimum */}
          <div className="filter-group">
            <label>Volume minimum</label>
            <input
              type="number"
              placeholder="Ex: 100000"
              value={minVolume}
              onChange={(e) => setMinVolume(e.target.value)}
              className="volume-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
