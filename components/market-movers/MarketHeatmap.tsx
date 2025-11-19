'use client';

import { useState, useMemo } from 'react';
import { HeatmapItem, Sector, Exchange } from '@/types/market-movers';
import { SECTOR_COLORS, EXCHANGE_COLORS } from '@/core/data/MarketMoversData';

interface MarketHeatmapProps {
  data: HeatmapItem[];
}

type ViewMode = 'sectors' | 'exchanges' | 'performance' | 'marketcap';
type FilterMode = 'all' | 'gainers' | 'losers' | 'highvolume';

export default function MarketHeatmap({ data }: MarketHeatmapProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('sectors');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [hoveredItem, setHoveredItem] = useState<HeatmapItem | null>(null);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);

  // Filtrer les données
  const filteredData = useMemo(() => {
    let filtered = [...data];
    
    switch (filterMode) {
      case 'gainers':
        filtered = filtered.filter(item => item.change > 0);
        break;
      case 'losers':
        filtered = filtered.filter(item => item.change < 0);
        break;
      case 'highvolume':
        const avgVolume = data.reduce((sum, item) => sum + item.volume, 0) / data.length;
        filtered = filtered.filter(item => item.volume > avgVolume * 1.5);
        break;
    }
    
    if (selectedSector) {
      filtered = filtered.filter(item => item.sector === selectedSector);
    }
    
    return filtered;
  }, [data, filterMode, selectedSector]);

  // Grouper les données selon le mode de vue
  const groupedData = useMemo(() => {
    const groups: Record<string, HeatmapItem[]> = {};
    
    filteredData.forEach(item => {
      const key = viewMode === 'sectors' ? item.sector : 
                  viewMode === 'exchanges' ? item.exchange : 
                  'all';
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  }, [filteredData, viewMode]);

  // Calculer la taille relative
  const getSize = (item: HeatmapItem) => {
    const maxValue = Math.max(...filteredData.map(d => 
      viewMode === 'marketcap' ? d.marketCap : d.volume
    ));
    const value = viewMode === 'marketcap' ? item.marketCap : item.volume;
    return Math.max((value / maxValue) * 100, 10); // Min 10%
  };

  // Obtenir la couleur selon la variation
  const getColor = (change: number) => {
    if (change > 5) return '#10b981';
    if (change > 2) return '#34d399';
    if (change > 0) return '#6ee7b7';
    if (change > -2) return '#fca5a5';
    if (change > -5) return '#f87171';
    return '#ef4444';
  };

  // Obtenir l'intensité de la couleur
  const getColorIntensity = (change: number) => {
    const absChange = Math.abs(change);
    if (absChange > 8) return 1;
    if (absChange > 5) return 0.8;
    if (absChange > 3) return 0.6;
    if (absChange > 1) return 0.4;
    return 0.2;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) {
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

  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return null;
    
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min;
    const width = 60;
    const height = 20;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width={width} height={height} className="mini-sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="market-heatmap">
      <div className="market-heatmap__header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Market Heatmap
        </h2>
        
        <div className="header-controls">
          {/* View Mode */}
          <div className="view-mode-selector">
            <button
              className={viewMode === 'sectors' ? 'active' : ''}
              onClick={() => setViewMode('sectors')}
            >
              Secteurs
            </button>
            <button
              className={viewMode === 'exchanges' ? 'active' : ''}
              onClick={() => setViewMode('exchanges')}
            >
              Bourses
            </button>
            <button
              className={viewMode === 'performance' ? 'active' : ''}
              onClick={() => setViewMode('performance')}
            >
              Performance
            </button>
            <button
              className={viewMode === 'marketcap' ? 'active' : ''}
              onClick={() => setViewMode('marketcap')}
            >
              Cap. Pondérée
            </button>
          </div>

          {/* Filter Mode */}
          <div className="filter-mode-selector">
            <button
              className={filterMode === 'all' ? 'active' : ''}
              onClick={() => setFilterMode('all')}
            >
              Tous
            </button>
            <button
              className={filterMode === 'gainers' ? 'active' : ''}
              onClick={() => setFilterMode('gainers')}
            >
              Hausses
            </button>
            <button
              className={filterMode === 'losers' ? 'active' : ''}
              onClick={() => setFilterMode('losers')}
            >
              Baisses
            </button>
            <button
              className={filterMode === 'highvolume' ? 'active' : ''}
              onClick={() => setFilterMode('highvolume')}
            >
              Forts volumes
            </button>
          </div>
        </div>
      </div>

      <div className="market-heatmap__content">
        {Object.entries(groupedData).map(([groupKey, items]) => (
          <div key={groupKey} className="heatmap-group">
            {viewMode !== 'performance' && (
              <div className="group-header">
                <h3>{groupKey}</h3>
                <span className="group-count">{items.length} titres</span>
              </div>
            )}
            
            <div className="heatmap-grid">
              {items.map((item) => {
                const size = getSize(item);
                const color = getColor(item.change);
                const intensity = getColorIntensity(item.change);
                
                return (
                  <div
                    key={item.ticker}
                    className="heatmap-cell"
                    style={{
                      flex: `0 0 ${size}%`,
                      backgroundColor: color,
                      opacity: 0.3 + (intensity * 0.7),
                      minWidth: '120px',
                      minHeight: '80px'
                    }}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <div className="cell-content">
                      <div className="cell-ticker">{item.ticker}</div>
                      <div className="cell-change">
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(1)}%
                      </div>
                      <div className="cell-price">{formatPrice(item.price)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Hover Tooltip */}
      {hoveredItem && (
        <div className="market-heatmap__tooltip">
          <div className="tooltip-header">
            <h4>{hoveredItem.name}</h4>
            <span className="tooltip-ticker">{hoveredItem.ticker}</span>
          </div>
          
          <div className="tooltip-stats">
            <div className="stat-row">
              <span className="label">Variation</span>
              <span className={`value ${hoveredItem.change >= 0 ? 'positive' : 'negative'}`}>
                {hoveredItem.change >= 0 ? '+' : ''}{hoveredItem.change.toFixed(2)}%
              </span>
            </div>
            <div className="stat-row">
              <span className="label">Prix</span>
              <span className="value">{formatPrice(hoveredItem.price)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Volume</span>
              <span className="value">{formatVolume(hoveredItem.volume)}</span>
            </div>
            <div className="stat-row">
              <span className="label">Cap. boursière</span>
              <span className="value">{(hoveredItem.marketCap / 1000000000).toFixed(2)}B</span>
            </div>
            <div className="stat-row">
              <span className="label">Secteur</span>
              <span className="value">{hoveredItem.sector}</span>
            </div>
            <div className="stat-row">
              <span className="label">Bourse</span>
              <span className="value">{hoveredItem.exchange}</span>
            </div>
          </div>

          <div className="tooltip-sparkline">
            <span className="sparkline-label">Tendance</span>
            {renderSparkline(hoveredItem.sparklineData)}
          </div>
        </div>
      )}

      {/* Color Legend */}
      <div className="market-heatmap__legend">
        <div className="legend-title">Légende des variations</div>
        <div className="legend-gradient">
          <div className="gradient-bar">
            <div className="gradient-stop" style={{ backgroundColor: '#ef4444' }}></div>
            <div className="gradient-stop" style={{ backgroundColor: '#f87171' }}></div>
            <div className="gradient-stop" style={{ backgroundColor: '#fca5a5' }}></div>
            <div className="gradient-stop" style={{ backgroundColor: '#e5e7eb' }}></div>
            <div className="gradient-stop" style={{ backgroundColor: '#6ee7b7' }}></div>
            <div className="gradient-stop" style={{ backgroundColor: '#34d399' }}></div>
            <div className="gradient-stop" style={{ backgroundColor: '#10b981' }}></div>
          </div>
          <div className="gradient-labels">
            <span>-5%+</span>
            <span>-2%</span>
            <span>0%</span>
            <span>+2%</span>
            <span>+5%+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
