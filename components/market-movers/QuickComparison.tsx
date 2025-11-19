'use client';

import { useState } from 'react';
import { Stock } from '@/types/market-movers';
import { SECTOR_COLORS } from '@/core/data/MarketMoversData';

interface QuickComparisonProps {
  availableStocks: Stock[];
}

export default function QuickComparison({ availableStocks }: QuickComparisonProps) {
  const [selectedStocks, setSelectedStocks] = useState<Stock[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = availableStocks.filter(stock =>
    stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleStock = (stock: Stock) => {
    if (selectedStocks.find(s => s.ticker === stock.ticker)) {
      setSelectedStocks(selectedStocks.filter(s => s.ticker !== stock.ticker));
    } else if (selectedStocks.length < 5) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    if (currency === 'XOF' || currency === 'NGN') {
      return price.toLocaleString('fr-FR');
    }
    return price.toFixed(2);
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

  const renderPriceChart = () => {
    if (selectedStocks.length === 0) return null;

    const maxPrice = Math.max(...selectedStocks.flatMap(s => s.sparklineData));
    const minPrice = Math.min(...selectedStocks.flatMap(s => s.sparklineData));
    const range = maxPrice - minPrice;
    const width = 400;
    const height = 200;
    const padding = 20;

    return (
      <svg width={width} height={height} className="comparison-chart">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={padding}
            y1={padding + (height - 2 * padding) * ratio}
            x2={width - padding}
            y2={padding + (height - 2 * padding) * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
            strokeDasharray="4"
          />
        ))}

        {/* Lines for each stock */}
        {selectedStocks.map((stock, stockIndex) => {
          const points = stock.sparklineData.map((value, index) => {
            const x = padding + (index / (stock.sparklineData.length - 1)) * (width - 2 * padding);
            const y = height - padding - ((value - minPrice) / range) * (height - 2 * padding);
            return `${x},${y}`;
          }).join(' ');

          const color = Object.values(SECTOR_COLORS)[stockIndex % Object.values(SECTOR_COLORS).length];

          return (
            <polyline
              key={stock.ticker}
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    );
  };

  const renderRadarChart = () => {
    if (selectedStocks.length === 0) return null;

    const metrics = ['change', 'volume', 'marketCap'];
    const size = 200;
    const center = size / 2;
    const radius = size / 2 - 30;
    const angleStep = (2 * Math.PI) / metrics.length;

    // Normaliser les données
    const normalize = (value: number, min: number, max: number) => {
      return ((value - min) / (max - min)) * radius;
    };

    const maxChange = Math.max(...selectedStocks.map(s => Math.abs(s.change)));
    const maxVolume = Math.max(...selectedStocks.map(s => s.volume));
    const maxMarketCap = Math.max(...selectedStocks.map(s => s.marketCap));

    return (
      <svg width={size} height={size} className="radar-chart">
        {/* Background circles */}
        {[0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <circle
            key={i}
            cx={center}
            cy={center}
            r={radius * ratio}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {metrics.map((_, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = center + radius * Math.cos(angle);
          const y = center + radius * Math.sin(angle);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Data polygons */}
        {selectedStocks.map((stock, stockIndex) => {
          const values = [
            normalize(Math.abs(stock.change), 0, maxChange),
            normalize(stock.volume, 0, maxVolume),
            normalize(stock.marketCap, 0, maxMarketCap)
          ];

          const points = values.map((value, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = center + value * Math.cos(angle);
            const y = center + value * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ');

          const color = Object.values(SECTOR_COLORS)[stockIndex % Object.values(SECTOR_COLORS).length];

          return (
            <polygon
              key={stock.ticker}
              points={points}
              fill={color}
              fillOpacity="0.2"
              stroke={color}
              strokeWidth="2"
            />
          );
        })}

        {/* Labels */}
        {['Variation', 'Volume', 'Cap.'].map((label, index) => {
          const angle = index * angleStep - Math.PI / 2;
          const x = center + (radius + 20) * Math.cos(angle);
          const y = center + (radius + 20) * Math.sin(angle);
          return (
            <text
              key={index}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="10"
              fill="var(--text-secondary)"
            >
              {label}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div className={`quick-comparison ${isOpen ? 'open' : ''}`}>
      {/* Toggle Button */}
      <button
        className="comparison-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="20" x2="10" y2="12" />
          <line x1="18" y1="4" x2="10" y2="12" />
          <line x1="6" y1="20" x2="14" y2="12" />
          <line x1="6" y1="4" x2="14" y2="12" />
        </svg>
        Comparaison rapide
        {selectedStocks.length > 0 && (
          <span className="comparison-count">{selectedStocks.length}</span>
        )}
      </button>

      {/* Slider Panel */}
      {isOpen && (
        <div className="comparison-panel">
          <div className="panel-header">
            <h3>Comparaison rapide</h3>
            <button className="close-btn" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="panel-content">
            {/* Stock Selector */}
            <div className="stock-selector">
              <input
                type="text"
                placeholder="Rechercher un titre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="stock-list">
                {filteredStocks.slice(0, 10).map(stock => (
                  <div
                    key={stock.ticker}
                    className={`stock-item ${selectedStocks.find(s => s.ticker === stock.ticker) ? 'selected' : ''}`}
                    onClick={() => toggleStock(stock)}
                  >
                    <div className="stock-info">
                      <strong>{stock.ticker}</strong>
                      <span>{stock.name}</span>
                    </div>
                    <span className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                      {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
              <div className="selector-hint">
                {selectedStocks.length}/5 titres sélectionnés
              </div>
            </div>

            {/* Selected Stocks */}
            {selectedStocks.length > 0 && (
              <>
                <div className="selected-stocks">
                  {selectedStocks.map((stock, index) => (
                    <div
                      key={stock.ticker}
                      className="selected-stock-chip"
                      style={{ borderColor: Object.values(SECTOR_COLORS)[index % Object.values(SECTOR_COLORS).length] }}
                    >
                      <span>{stock.ticker}</span>
                      <button onClick={() => toggleStock(stock)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Comparison Table */}
                <div className="comparison-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Métrique</th>
                        {selectedStocks.map((stock, index) => (
                          <th key={stock.ticker} style={{ color: Object.values(SECTOR_COLORS)[index % Object.values(SECTOR_COLORS).length] }}>
                            {stock.ticker}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Variation</td>
                        {selectedStocks.map(stock => (
                          <td key={stock.ticker} className={stock.change >= 0 ? 'positive' : 'negative'}>
                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>Prix</td>
                        {selectedStocks.map(stock => (
                          <td key={stock.ticker}>
                            {formatPrice(stock.price, stock.currency)} {stock.currency}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td>Volume</td>
                        {selectedStocks.map(stock => (
                          <td key={stock.ticker}>{formatVolume(stock.volume)}</td>
                        ))}
                      </tr>
                      <tr>
                        <td>Cap. boursière</td>
                        {selectedStocks.map(stock => (
                          <td key={stock.ticker}>{(stock.marketCap / 1000000000).toFixed(2)}B</td>
                        ))}
                      </tr>
                      <tr>
                        <td>Secteur</td>
                        {selectedStocks.map(stock => (
                          <td key={stock.ticker}>{stock.sector}</td>
                        ))}
                      </tr>
                      <tr>
                        <td>Bourse</td>
                        {selectedStocks.map(stock => (
                          <td key={stock.ticker}>{stock.exchange}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Charts */}
                <div className="comparison-charts">
                  <div className="chart-container">
                    <h4>Évolution des prix</h4>
                    {renderPriceChart()}
                    <div className="chart-legend">
                      {selectedStocks.map((stock, index) => (
                        <div key={stock.ticker} className="legend-item">
                          <div
                            className="legend-color"
                            style={{ backgroundColor: Object.values(SECTOR_COLORS)[index % Object.values(SECTOR_COLORS).length] }}
                          />
                          <span>{stock.ticker}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-container">
                    <h4>Performance radar</h4>
                    {renderRadarChart()}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
