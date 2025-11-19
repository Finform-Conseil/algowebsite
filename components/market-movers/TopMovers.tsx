'use client';

import { useState } from 'react';
import { Stock } from '@/types/market-movers';

interface TopMoversProps {
  stocks: Stock[];
  type: 'gainers' | 'losers';
}

export default function TopMovers({ stocks, type }: TopMoversProps) {
  const [sortBy, setSortBy] = useState<'change' | 'volume'>('change');
  const [hoveredStock, setHoveredStock] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedStocks = [...stocks].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'change') {
      return (b.change - a.change) * multiplier;
    }
    return (b.volume - a.volume) * multiplier;
  });

  const handleSort = (column: 'change' | 'volume') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return null;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const width = 80;
    const height = 30;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    const color = type === 'gainers' ? '#10b981' : '#ef4444';
    
    return (
      <svg width={width} height={height} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`;
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`;
    }
    return volume.toString();
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'XOF' || currency === 'NGN') {
      return price.toLocaleString('fr-FR');
    }
    return price.toFixed(2);
  };

  return (
    <div className={`top-movers ${type}`}>
      <div className="top-movers__header">
        <h2>
          {type === 'gainers' ? (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
              Meilleures Hausses
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
              Plus Fortes Baisses
            </>
          )}
        </h2>
        <div className="header-stats">
          <span>{stocks.length} titres</span>
        </div>
      </div>

      <div className="top-movers__table">
        <table>
          <thead>
            <tr>
              <th className="rank">#</th>
              <th className="ticker">Ticker</th>
              <th className="name">Nom</th>
              <th 
                className="change sortable"
                onClick={() => handleSort('change')}
              >
                Variation
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {sortBy === 'change' && sortOrder === 'asc' ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
              </th>
              <th className="price">Prix</th>
              <th 
                className="volume sortable"
                onClick={() => handleSort('volume')}
              >
                Volume
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {sortBy === 'volume' && sortOrder === 'asc' ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
              </th>
              <th className="sparkline">Tendance</th>
              <th className="exchange">Bourse</th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedStocks.map((stock, index) => (
              <tr
                key={stock.ticker}
                className={`stock-row ${type === 'gainers' ? 'gainer' : 'loser'} ${hoveredStock === stock.ticker ? 'hovered' : ''}`}
                onMouseEnter={(e) => {
                  setHoveredStock(stock.ticker);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMousePosition({ x: rect.right + 10, y: rect.top });
                }}
                onMouseLeave={() => setHoveredStock(null)}
                onMouseMove={(e) => {
                  if (hoveredStock === stock.ticker) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMousePosition({ x: rect.right + 10, y: rect.top });
                  }
                }}
              >
                <td className="rank">
                  <span className="rank-badge">{index + 1}</span>
                </td>
                <td className="ticker">
                  <strong>{stock.ticker}</strong>
                </td>
                <td className="name">
                  <div className="name-content">
                    <span className="company-name">{stock.name}</span>
                    <span className="sector">{stock.sector}</span>
                  </div>
                </td>
                <td className="change">
                  <div className="change-content">
                    <span className={`change-percent ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </span>
                    <span className="change-value">
                      {stock.change >= 0 ? '+' : ''}{formatPrice(stock.changeValue, stock.currency)}
                    </span>
                  </div>
                </td>
                <td className="price">
                  <div className="price-content">
                    <span className="current-price">{formatPrice(stock.price, stock.currency)}</span>
                    <span className="currency">{stock.currency}</span>
                  </div>
                </td>
                <td className="volume">
                  <div className="volume-content">
                    <span className="volume-value">{formatVolume(stock.volume)}</span>
                    {stock.volume > stock.avgVolume * 1.5 && (
                      <span className="volume-badge high">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                        </svg>
                      </span>
                    )}
                  </div>
                </td>
                <td className="sparkline">
                  {renderSparkline(stock.sparklineData)}
                </td>
                <td className="exchange">
                  <span className="exchange-badge">{stock.exchange}</span>
                </td>
                <td className="actions">
                  <button className="btn-icon" title="Ajouter à la watchlist">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button className="btn-icon" title="Voir détails">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Hover Details Popup */}
        {hoveredStock && (
          <div 
            className="hover-details"
            style={{
              position: 'fixed',
              left: `${mousePosition.x}px`,
              top: `${mousePosition.y}px`,
              transform: 'translateX(-100%) translateY(-100%)',
              transition: 'all 0.1s ease-out',
              zIndex: 1000
            }}
          >
            {(() => {
              const stock = stocks.find(s => s.ticker === hoveredStock);
              if (!stock) return null;
              
              return (
                <div className="details-card">
                  <h4>{stock.name} ({stock.ticker})</h4>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Ouverture</span>
                      <span className="value">{formatPrice(stock.open, stock.currency)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Plus haut</span>
                      <span className="value positive">{formatPrice(stock.high, stock.currency)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Plus bas</span>
                      <span className="value negative">{formatPrice(stock.low, stock.currency)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Cap. boursière</span>
                      <span className="value">{(stock.marketCap / 1000000000).toFixed(2)}B</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
