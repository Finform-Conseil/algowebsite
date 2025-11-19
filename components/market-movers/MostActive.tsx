'use client';

import { useState } from 'react';
import { Stock } from '@/types/market-movers';

interface MostActiveProps {
  stocks: Stock[];
}

export default function MostActive({ stocks }: MostActiveProps) {
  const [limit, setLimit] = useState<20 | 50 | 100>(20);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  const displayedStocks = stocks.slice(0, limit);

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
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

  const getVolumePercentage = (volume: number, maxVolume: number) => {
    return (volume / maxVolume) * 100;
  };

  const maxVolume = Math.max(...stocks.map(s => s.volume));

  const renderMiniCandlestick = (stock: Stock) => {
    const width = 60;
    const height = 30;
    const padding = 2;
    
    const min = stock.low;
    const max = stock.high;
    const range = max - min;
    
    const openY = height - ((stock.open - min) / range) * (height - 2 * padding) - padding;
    const closeY = height - ((stock.price - min) / range) * (height - 2 * padding) - padding;
    const highY = height - ((stock.high - min) / range) * (height - 2 * padding) - padding;
    const lowY = height - ((stock.low - min) / range) * (height - 2 * padding) - padding;
    
    const bodyTop = Math.min(openY, closeY);
    const bodyHeight = Math.abs(closeY - openY);
    const color = stock.price >= stock.open ? '#10b981' : '#ef4444';
    
    return (
      <svg width={width} height={height} className="mini-candlestick">
        {/* Wick */}
        <line
          x1={width / 2}
          y1={highY}
          x2={width / 2}
          y2={lowY}
          stroke={color}
          strokeWidth="1"
        />
        {/* Body */}
        <rect
          x={width / 2 - 3}
          y={bodyTop}
          width="6"
          height={Math.max(bodyHeight, 1)}
          fill={color}
        />
      </svg>
    );
  };

  return (
    <div className="most-active">
      <div className="most-active__header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Plus Actives
        </h2>
        <div className="header-controls">
          <div className="limit-selector">
            <button
              className={limit === 20 ? 'active' : ''}
              onClick={() => setLimit(20)}
            >
              Top 20
            </button>
            <button
              className={limit === 50 ? 'active' : ''}
              onClick={() => setLimit(50)}
            >
              Top 50
            </button>
            <button
              className={limit === 100 ? 'active' : ''}
              onClick={() => setLimit(100)}
            >
              Top 100
            </button>
          </div>
        </div>
      </div>

      <div className="most-active__table">
        <table>
          <thead>
            <tr>
              <th className="rank">#</th>
              <th className="ticker">Ticker</th>
              <th className="name">Nom</th>
              <th className="volume">Volume</th>
              <th className="volume-bar">Répartition</th>
              <th className="volume-change">vs Moy. 30j</th>
              <th className="change">Variation</th>
              <th className="candlestick">Intraday</th>
              <th className="exchange">Bourse</th>
            </tr>
          </thead>
          <tbody>
            {displayedStocks.map((stock, index) => {
              const volumeChange = ((stock.volume - stock.avgVolume) / stock.avgVolume) * 100;
              const volumePercent = getVolumePercentage(stock.volume, maxVolume);
              
              return (
                <tr 
                  key={stock.ticker}
                  className="stock-row"
                  onClick={() => setSelectedStock(stock)}
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
                  <td className="volume">
                    <div className="volume-content">
                      <span className="volume-value">{formatVolume(stock.volume)}</span>
                      {stock.volume > stock.avgVolume * 2 && (
                        <span className="volume-alert">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="volume-bar">
                    <div className="bar-container">
                      <div 
                        className="bar-fill"
                        style={{ 
                          width: `${volumePercent}%`,
                          backgroundColor: volumePercent > 70 ? '#3b82f6' : '#94a3b8'
                        }}
                      />
                    </div>
                  </td>
                  <td className="volume-change">
                    <span className={volumeChange >= 0 ? 'positive' : 'negative'}>
                      {volumeChange >= 0 ? '+' : ''}{volumeChange.toFixed(0)}%
                    </span>
                  </td>
                  <td className="change">
                    <span className={`change-value ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </span>
                  </td>
                  <td className="candlestick">
                    {renderMiniCandlestick(stock)}
                  </td>
                  <td className="exchange">
                    <span className="exchange-badge">{stock.exchange}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Slide-over Detail Panel */}
      {selectedStock && (
        <div className="slide-over-backdrop" onClick={() => setSelectedStock(null)}>
          <div className="slide-over" onClick={(e) => e.stopPropagation()}>
            <div className="slide-over__header">
              <div>
                <h3>{selectedStock.name}</h3>
                <p>{selectedStock.ticker} • {selectedStock.exchange}</p>
              </div>
              <button className="close-btn" onClick={() => setSelectedStock(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="slide-over__content">
              <div className="price-section">
                <div className="current-price">
                  <span className="label">Prix actuel</span>
                  <span className="value">{formatPrice(selectedStock.price, selectedStock.currency)} {selectedStock.currency}</span>
                </div>
                <div className={`price-change ${selectedStock.change >= 0 ? 'positive' : 'negative'}`}>
                  {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change.toFixed(2)}%
                  <span className="change-value">
                    ({selectedStock.change >= 0 ? '+' : ''}{formatPrice(selectedStock.changeValue, selectedStock.currency)})
                  </span>
                </div>
              </div>

              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Ouverture</span>
                  <span className="stat-value">{formatPrice(selectedStock.open, selectedStock.currency)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Plus haut</span>
                  <span className="stat-value positive">{formatPrice(selectedStock.high, selectedStock.currency)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Plus bas</span>
                  <span className="stat-value negative">{formatPrice(selectedStock.low, selectedStock.currency)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Volume</span>
                  <span className="stat-value">{formatVolume(selectedStock.volume)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Vol. moyen 30j</span>
                  <span className="stat-value">{formatVolume(selectedStock.avgVolume)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cap. boursière</span>
                  <span className="stat-value">{(selectedStock.marketCap / 1000000000).toFixed(2)}B</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Secteur</span>
                  <span className="stat-value">{selectedStock.sector}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Bourse</span>
                  <span className="stat-value">{selectedStock.exchange}</span>
                </div>
              </div>

              <div className="actions-section">
                <button className="btn-primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  Ajouter à la watchlist
                </button>
                <button className="btn-secondary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Créer une alerte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
