'use client';

import { useState, useEffect } from 'react';
import { StockExchange } from '@/types/exchanges';
import { AFRICAN_EXCHANGES, REGIONS } from '@/core/data/ExchangesData';
import MultiSelect from '@/components/corporate-events/MultiSelect';

interface ExchangesHeaderProps {
  selectedExchanges: string[];
  onExchangeToggle: (exchangeId: string) => void;
  onExchangesChange?: (exchanges: string[]) => void;
  onCompareClick: () => void;
  viewMode: 'overview' | 'performance' | 'ranking';
  onViewModeChange: (mode: 'overview' | 'performance' | 'ranking') => void;
}

export default function ExchangesHeader({ 
  selectedExchanges, 
  onExchangeToggle, 
  onExchangesChange,
  onCompareClick,
  viewMode,
  onViewModeChange
}: ExchangesHeaderProps) {

  const viewModes = [
    { id: 'overview', label: 'Overview', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
    { id: 'performance', label: 'Performance', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg> },
    { id: 'ranking', label: 'Ranking', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> }
  ];

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
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
        }}
      >
        <div className="exchanges-header__content">
          <div className="exchanges-header__title-section">
            <h1 className="exchanges-header__title">African Stock Exchanges</h1>
            <div className="exchanges-header__subtitle-container">
              <p className="exchanges-header__subtitle">Overview of the continent's stock markets — sizes, dynamics and performances</p>
            </div>
          </div>

          {/* Exchange MultiSelect + Action Buttons */}
          <div className="exchanges-header__actions-row">
            <div className="exchanges-header__multiselect">
              <MultiSelect
                options={AFRICAN_EXCHANGES.map(ex => ({ value: ex.id, label: ex.shortName }))}
                selected={selectedExchanges}
                onChange={(selected) => {
                  if (selected.length === 0) return; // Don't allow empty selection
                  if (onExchangesChange) {
                    onExchangesChange(selected);
                  }
                }}
                placeholder="Select exchanges"
              />
            </div>

            {/* Action Buttons */}
            <div className="header-actions">
              <button 
                className="compare-btn"
                onClick={onCompareClick}
                disabled={selectedExchanges.length < 2}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" />
                  <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                </svg>
                <span>Compare Exchanges</span>
                {selectedExchanges.length > 0 && (
                  <span className="btn-badge">{selectedExchanges.length}</span>
                )}
              </button>
              <button className="export-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7,10 12,15 17,10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="exchanges-header__controls">
        <div className="view-filters-row">
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
        </div>
      </div>
    </div>
  );
}
