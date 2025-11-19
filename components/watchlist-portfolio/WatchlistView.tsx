'use client';

import { useState } from 'react';
import { WatchlistStock } from '@/types/watchlist-portfolio';
import { formatCurrency, formatPercent } from '@/core/data/WatchlistPortfolioData';

interface WatchlistViewProps {
  stocks: WatchlistStock[];
  onAddStock?: () => void;
  onRemoveStock?: (stockId: string) => void;
}

export default function WatchlistView({ stocks, onAddStock, onRemoveStock }: WatchlistViewProps) {
  const [sortBy, setSortBy] = useState<'name' | 'change' | 'volume'>('change');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedStocks = [...stocks].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.companyName.localeCompare(b.companyName);
        break;
      case 'change':
        comparison = a.changePercent - b.changePercent;
        break;
      case 'volume':
        comparison = a.volume - b.volume;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: 'name' | 'change' | 'volume') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="watchlist-view">
      <div className="watchlist-header">
        <div className="header-left">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Ma Watchlist
          </h2>
          <span className="stock-count">{stocks.length} actions</span>
        </div>
        <button className="btn-add" onClick={onAddStock}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter une action
        </button>
      </div>

      {/* Quick Filters */}
      <div className="watchlist-filters">
        <button
          className={`filter-btn ${sortBy === 'change' ? 'active' : ''}`}
          onClick={() => handleSort('change')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          Par variation
        </button>
        <button
          className={`filter-btn ${sortBy === 'volume' ? 'active' : ''}`}
          onClick={() => handleSort('volume')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Par volume
        </button>
        <button
          className={`filter-btn ${sortBy === 'name' ? 'active' : ''}`}
          onClick={() => handleSort('name')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="21" y1="10" x2="3" y2="10" />
            <line x1="21" y1="6" x2="3" y2="6" />
            <line x1="21" y1="14" x2="3" y2="14" />
            <line x1="21" y1="18" x2="3" y2="18" />
          </svg>
          Par nom
        </button>
      </div>

      {/* Stocks Table */}
      <div className="watchlist-table">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th className="text-right">Prix</th>
              <th className="text-right">Variation</th>
              <th className="text-right">Volume</th>
              <th className="text-right">Cap. boursière</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock) => (
              <tr key={stock.id} className="stock-row">
                <td className="stock-info">
                  <div className="stock-identity">
                    <div className="stock-logo">
                      {stock.ticker.substring(0, 2)}
                    </div>
                    <div className="stock-details">
                      <strong>{stock.companyName}</strong>
                      <div className="stock-meta">
                        <span className="ticker">{stock.ticker}</span>
                        <span className="separator">•</span>
                        <span className="exchange">{stock.exchange}</span>
                        <span className="separator">•</span>
                        <span className="sector">{stock.sector}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="text-right">
                  <div className="price-cell">
                    <strong>{stock.currentPrice.toLocaleString()} XOF</strong>
                    <span className="previous-close">
                      Clôture: {stock.previousClose.toLocaleString()}
                    </span>
                  </div>
                </td>
                <td className="text-right">
                  <div className={`change-cell ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                    <strong>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toLocaleString()} XOF
                    </strong>
                    <span className="change-percent">
                      {formatPercent(stock.changePercent)}
                    </span>
                  </div>
                </td>
                <td className="text-right">
                  <div className="volume-cell">
                    <strong>{stock.volume.toLocaleString()}</strong>
                    <span className={`volume-indicator ${stock.volume > stock.avgVolume ? 'high' : 'normal'}`}>
                      {stock.volume > stock.avgVolume ? '↑ Au-dessus moy.' : '→ Normal'}
                    </span>
                  </div>
                </td>
                <td className="text-right">
                  <div className="marketcap-cell">
                    <strong>{formatCurrency(stock.marketCap)}</strong>
                    {stock.pe && (
                      <span className="pe-ratio">PER: {stock.pe.toFixed(1)}</span>
                    )}
                  </div>
                </td>
                <td className="text-center">
                  <div className="action-buttons">
                    <button className="btn-icon" title="Créer une alerte">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </button>
                    <button className="btn-icon" title="Ajouter au portfolio">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </button>
                    <button
                      className="btn-icon danger"
                      title="Retirer"
                      onClick={() => onRemoveStock?.(stock.id)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="watchlist-summary">
        <div className="summary-card">
          <span className="summary-label">Gainants</span>
          <span className="summary-value positive">
            {stocks.filter(s => s.change > 0).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Perdants</span>
          <span className="summary-value negative">
            {stocks.filter(s => s.change < 0).length}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Variation moyenne</span>
          <span className={`summary-value ${stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(stocks.reduce((sum, s) => sum + s.changePercent, 0) / stocks.length)}
          </span>
        </div>
        <div className="summary-card">
          <span className="summary-label">Volume total</span>
          <span className="summary-value">
            {(stocks.reduce((sum, s) => sum + s.volume, 0) / 1000).toFixed(1)}K
          </span>
        </div>
      </div>
    </div>
  );
}
