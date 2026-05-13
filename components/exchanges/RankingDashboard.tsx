'use client';

import { useState, useMemo } from 'react';
import { StockExchange } from '@/types/exchanges';

interface RankingDashboardProps {
  exchanges: StockExchange[];
  onAnalyzeExchange: (exchangeId: string) => void;
}

type SortField = 'totalMarketCap' | 'dailyVolume' | 'ytdReturn' | 'volatility' | 'listedCompanies' | 'dynamism';
type ViewMode = 'table' | 'radar';

interface SortConfig {
  field: SortField;
  direction: 'asc' | 'desc';
}

export default function RankingDashboard({ 
  exchanges, 
  onAnalyzeExchange 
}: RankingDashboardProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'totalMarketCap', direction: 'desc' });
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedMetric, setSelectedMetric] = useState<SortField>('totalMarketCap');

  const sortFields: { field: SortField; label: string; type: 'size' | 'performance' | 'liquidity' | 'growth' }[] = [
    { field: 'totalMarketCap', label: 'Capitalisation', type: 'size' },
    { field: 'dailyVolume', label: 'Volume Quotidien', type: 'liquidity' },
    { field: 'ytdReturn', label: 'Performance YTD', type: 'performance' },
    { field: 'volatility', label: 'Volatilité', type: 'performance' },
    { field: 'listedCompanies', label: 'Sociétés Cotées', type: 'size' },
    { field: 'dynamism', label: 'Dynamisme', type: 'growth' }
  ];

  const viewModes = [
    { id: 'table', label: 'Tableau', icon: '📊' },
    { id: 'radar', label: 'Radar', icon: '🕸️' }
  ];

  const sortedExchanges = useMemo(() => {
    const sorted = [...exchanges].sort((a, b) => {
      const aValue = a[sortConfig.field];
      const bValue = b[sortConfig.field];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sorted;
  }, [exchanges, sortConfig]);

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const getRankingColor = (rank: number, total: number) => {
    if (rank === 1) return '#10b981';
    if (rank === 2) return '#3b82f6';
    if (rank === 3) return '#f59e0b';
    if (rank <= total / 2) return '#22c55e';
    return '#ef4444';
  };

  const formatValue = (value: number, field: SortField) => {
    switch (field) {
      case 'totalMarketCap':
        return value >= 1000 ? `$${(value / 1000).toFixed(1)}T` : `$${value.toFixed(1)}B`;
      case 'dailyVolume':
        return `$${value.toFixed(1)}M`;
      case 'ytdReturn':
      case 'volatility':
        return `${value.toFixed(1)}%`;
      case 'listedCompanies':
        return new Intl.NumberFormat('fr-FR').format(value);
      case 'dynamism':
        return `${value}/100`;
      default:
        return value.toString();
    }
  };

  const getValueColor = (value: number, field: SortField) => {
    if (field === 'ytdReturn') {
      return value >= 20 ? '#10b981' : value >= 10 ? '#22c55e' : value >= 0 ? '#eab308' : '#ef4444';
    }
    if (field === 'volatility') {
      return value <= 15 ? '#10b981' : value <= 25 ? '#f59e0b' : '#ef4444';
    }
    if (field === 'dynamism') {
      return value >= 75 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
    }
    return '#6b7280';
  };

  const renderTableView = () => {
    return (
      <div className="ranking-table">
        <div className="table-header">
          <div className="rank-column">#</div>
          <div className="exchange-column">Bourse</div>
          {sortFields.map(field => (
            <div 
              key={field.field}
              className={`metric-column ${field.type}`}
              onClick={() => handleSort(field.field)}
            >
              <span>{field.label}</span>
              {sortConfig.field === field.field && (
                <span className="sort-indicator">
                  {sortConfig.direction === 'desc' ? '↓' : '↑'}
                </span>
              )}
            </div>
          ))}
          <div className="actions-column">Actions</div>
        </div>

        <div className="table-body">
          {sortedExchanges.map((exchange, index) => {
            const rank = index + 1;
            return (
              <div 
                key={exchange.id}
                className="table-row"
                style={{ 
                  borderLeftColor: getRankingColor(rank, sortedExchanges.length),
                  borderLeftWidth: '4px'
                }}
              >
                <div className="rank-column">
                  <span 
                    className="rank-badge"
                    style={{ backgroundColor: getRankingColor(rank, sortedExchanges.length) }}
                  >
                    {rank}
                  </span>
                </div>
                
                <div className="exchange-column">
                  <div className="exchange-info">
                    <img src={exchange.logo} alt={exchange.shortName} className="exchange-logo" />
                    <div className="exchange-details">
                      <span className="exchange-name">{exchange.shortName}</span>
                      <span className="exchange-country">{exchange.country}</span>
                    </div>
                  </div>
                </div>

                {sortFields.map(field => {
                  const value = exchange[field.field] as number;
                  return (
                    <div 
                      key={field.field}
                      className={`metric-column ${field.type}`}
                      style={{ color: getValueColor(value, field.field) }}
                    >
                      <span className="metric-value">{formatValue(value, field.field)}</span>
                      {field.field === sortConfig.field && (
                        <div className="metric-bar">
                          <div 
                            className="metric-fill"
                            style={{ 
                              width: `${(value / Math.max(...exchanges.map(e => e[field.field] as number))) * 100}%`,
                              backgroundColor: getValueColor(value, field.field)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="actions-column">
                  <button 
                    className="action-btn primary"
                    onClick={() => onAnalyzeExchange(exchange.id)}
                  >
                    Analyser
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRadarView = () => {
    return (
      <div className="radar-view">
        <div className="radar-container">
          <svg className="radar-chart" viewBox="0 0 500 500">
            {/* Grid circles */}
            {[20, 40, 60, 80, 100].map((radius, index) => (
              <circle
                key={index}
                cx="250"
                cy="250"
                r={radius * 2}
                fill="none"
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            {/* Axes */}
            {sortFields.slice(0, 6).map((field, index) => {
              const angle = (index * 60) - 90;
              const x = 250 + 200 * Math.cos((angle * Math.PI) / 180);
              const y = 250 + 200 * Math.sin((angle * Math.PI) / 180);
              
              return (
                <line
                  key={field.field}
                  x1="250"
                  y1="250"
                  x2={x}
                  y2={y}
                  stroke="#374151"
                  strokeWidth="1"
                  opacity="0.5"
                />
              );
            })}

            {/* Data polygons */}
            {exchanges.map((exchange, exchangeIndex) => {
              const points = sortFields.slice(0, 6).map((field, index) => {
                const angle = (index * 60) - 90;
                const value = exchange[field.field] as number;
                const maxValue = Math.max(...exchanges.map(e => e[field.field] as number));
                const normalizedValue = (value / maxValue) * 100;
                const distance = normalizedValue * 2;
                const x = 250 + distance * Math.cos((angle * Math.PI) / 180);
                const y = 250 + distance * Math.sin((angle * Math.PI) / 180);
                return `${x},${y}`;
              }).join(' ');

              const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
              
              return (
                <polygon
                  key={exchange.id}
                  points={points}
                  fill={colors[exchangeIndex % colors.length]}
                  fillOpacity="0.2"
                  stroke={colors[exchangeIndex % colors.length]}
                  strokeWidth="2"
                />
              );
            })}

            {/* Labels */}
            {sortFields.slice(0, 6).map((field, index) => {
              const angle = (index * 60) - 90;
              const x = 250 + 230 * Math.cos((angle * Math.PI) / 180);
              const y = 250 + 230 * Math.sin((angle * Math.PI) / 180);
              
              return (
                <text
                  key={field.field}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#9ca3af"
                  fontSize="12"
                >
                  {field.label}
                </text>
              );
            })}
          </svg>
        </div>

        <div className="radar-legend">
          {exchanges.map((exchange, index) => {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
            return (
              <div key={exchange.id} className="legend-item">
                <div 
                  className="legend-color"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="legend-label">{exchange.shortName}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderView = () => {
    switch (viewMode) {
      case 'table':
        return renderTableView();
      case 'radar':
        return renderRadarView();
      default:
        return renderTableView();
    }
  };

  return (
    <div className="ranking-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h3>Classement Comparatif des Bourses</h3>
        
        <div className="dashboard-controls">
          <div className="view-mode-selector">
            {viewModes.map(mode => (
              <button
                key={mode.id}
                className={`view-mode-btn ${viewMode === mode.id ? 'active' : ''}`}
                onClick={() => setViewMode(mode.id as ViewMode)}
              >
                <span className="mode-icon">{mode.icon}</span>
                <span className="mode-label">{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="dashboard-content">
        {renderView()}
      </div>
    </div>
  );
}
