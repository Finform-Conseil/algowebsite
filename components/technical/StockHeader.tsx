'use client';

import { useState } from 'react';
import { StockInfo, TimePeriod, TimeGranularity } from '@/core/data/TechnicalAnalysis';

interface StockHeaderProps {
  stock: StockInfo;
  selectedPeriod: TimePeriod;
  selectedGranularity: TimeGranularity;
  onPeriodChange: (period: TimePeriod) => void;
  onGranularityChange: (granularity: TimeGranularity) => void;
  onAddToWatchlist?: () => void;
  onCompare?: () => void;
  onShare?: () => void;
  onAlert?: () => void;
}

const PERIODS: TimePeriod[] = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y', 'Max'];
const GRANULARITIES: TimeGranularity[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W', '1M'];

export default function StockHeader({
  stock,
  selectedPeriod,
  selectedGranularity,
  onPeriodChange,
  onGranularityChange,
  onAddToWatchlist,
  onCompare,
  onShare,
  onAlert,
}: StockHeaderProps) {
  const isPositive = stock.changePercent >= 0;

  return (
    <div className="stock-header">
      {/* Stock Info */}
      <div className="stock-header__info">
        <div className="stock-header__main">
          <h1 className="stock-header__name">{stock.symbol}</h1>
          <span className="stock-header__fullname">{stock.name}</span>
          <span className="stock-header__market">{stock.market}</span>
        </div>
        <div className="stock-header__price">
          <span className="stock-header__current">${stock.currentPrice.toFixed(2)}</span>
          <span className={`stock-header__change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? '+' : ''}${stock.change.toFixed(2)} ({isPositive ? '+' : ''}
            {stock.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="stock-header__actions">
        <button className="stock-header__btn" onClick={onAddToWatchlist} title="Ajouter à la watchlist">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          Watchlist
        </button>
        <button className="stock-header__btn" onClick={onCompare} title="Comparer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Comparer
        </button>
        <button className="stock-header__btn" onClick={onShare} title="Partager">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Partager
        </button>
        <button className="stock-header__btn stock-header__btn--primary" onClick={onAlert} title="Créer une alerte">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Alerte
        </button>
      </div>

      {/* Period Selector */}
      <div className="stock-header__selectors">
        <div className="period-selector">
          {PERIODS.map((period) => (
            <button
              key={period}
              className={`period-selector__btn ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => onPeriodChange(period)}
            >
              {period}
            </button>
          ))}
        </div>

        <div className="granularity-selector">
          {GRANULARITIES.map((granularity) => (
            <button
              key={granularity}
              className={`granularity-selector__btn ${selectedGranularity === granularity ? 'active' : ''}`}
              onClick={() => onGranularityChange(granularity)}
            >
              {granularity}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
