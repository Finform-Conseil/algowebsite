'use client';

import { useState } from 'react';

interface CompactHeaderProps {
  currentSymbol: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  selectedInterval: string;
  selectedChartType: 'candles' | 'line' | 'area' | 'bars';
  onSymbolSearch: () => void;
  onAddSymbol: () => void;
  onIntervalChange: (interval: string) => void;
  onChartTypeChange: (type: 'candles' | 'line' | 'area' | 'bars') => void;
  onOpenIndicators: () => void;
  onOpenAlerts: () => void;
  onOpenReplay: () => void;
  addedSymbols?: string[];
  onRemoveSymbol?: (symbol: string) => void;
}

const INTERVALS = [
  { value: '1D', label: 'Day' },
  { value: '5D', label: '5D' },
  { value: '1W', label: 'Week' },
  { value: '1M', label: 'Month' },
  { value: '3M', label: '3M' },
  { value: '1Y', label: 'Year' },
  { value: 'custom', label: 'Custom' },
];

export default function CompactHeader({
  currentSymbol,
  currentPrice,
  change,
  changePercent,
  selectedInterval,
  selectedChartType,
  onSymbolSearch,
  onAddSymbol,
  onIntervalChange,
  onChartTypeChange,
  onOpenIndicators,
  onOpenAlerts,
  onOpenReplay,
  addedSymbols,
  onRemoveSymbol,
}: CompactHeaderProps) {
  const isPositive = changePercent >= 0;

  return (
    <div className="compact-header">
      {/* Symbol Search & Price */}
      <div className="compact-header__left">
        <button className="symbol-search-btn" onClick={onSymbolSearch}>
          <span className="symbol-search-btn__symbol">{currentSymbol}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div className="price-display">
          <span className="price-display__value">${currentPrice.toFixed(2)}</span>
          <span className={`price-display__change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}${change.toFixed(2)} ({isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </span>
        </div>

        {/* Added Symbols Tags */}
        {(addedSymbols || []).length > 0 && (
          <div className="added-symbols">
            {(addedSymbols || []).map((symbol) => (
              <span key={symbol} className="added-symbol-tag">
                {symbol}
                <button className="remove-symbol-btn" onClick={() => onRemoveSymbol?.(symbol)}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}

        <button className="icon-btn icon-btn--add" onClick={onAddSymbol} title="Ajouter un symbole">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {/* Controls */}
      <div className="compact-header__controls">
        {/* Interval Selector */}
        <div className="interval-selector">
          {INTERVALS.map((interval) => (
            <button
              key={interval.value}
              className={`interval-btn ${selectedInterval === interval.value ? 'active' : ''}`}
              onClick={() => onIntervalChange(interval.value)}
            >
              {interval.label}
            </button>
          ))}
        </div>

        <div className="compact-header__divider" />

        {/* Chart Type */}
        <div className="chart-type-selector">
          <button
            className={`icon-btn ${selectedChartType === 'candles' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('candles')}
            title="Chandeliers"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="9" y1="4" x2="9" y2="20" />
              <rect x="7" y="8" width="4" height="8" />
              <line x1="15" y1="2" x2="15" y2="22" />
              <rect x="13" y="6" width="4" height="10" />
            </svg>
          </button>
          <button
            className={`icon-btn ${selectedChartType === 'line' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('line')}
            title="Ligne"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="4 18 8 14 12 16 16 10 20 14" />
            </svg>
          </button>
          <button
            className={`icon-btn ${selectedChartType === 'area' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('area')}
            title="Aire"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
              <path d="M3 18h18" strokeWidth="1" />
            </svg>
          </button>
          <button
            className={`icon-btn ${selectedChartType === 'bars' ? 'active' : ''}`}
            onClick={() => onChartTypeChange('bars')}
            title="Barres"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </button>
        </div>

        <div className="compact-header__divider" />

        {/* Indicators */}
        <button className="icon-btn" onClick={onOpenIndicators} title="Indicateurs">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="7.5 4.21 12 6.81 16.5 4.21" />
            <polyline points="7.5 19.79 7.5 14.6 3 12" />
            <polyline points="21 12 16.5 14.6 16.5 19.79" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          <span>Indicators</span>
        </button>

        
        {/* Alerts */}
        <button className="icon-btn" onClick={onOpenAlerts} title="Alertes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* Replay */}
        <button className="icon-btn" onClick={onOpenReplay} title="Replay">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
