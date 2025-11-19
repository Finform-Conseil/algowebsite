'use client';

import { useState, useRef, useEffect } from 'react';
import { StockExchange } from '@/types/exchanges';

interface PerformanceChartsProps {
  exchanges: StockExchange[];
  selectedPeriod: '1M' | '3M' | '6M' | '1Y' | '3Y';
  onPeriodChange: (period: '1M' | '3M' | '6M' | '1Y' | '3Y') => void;
}

export default function PerformanceCharts({ 
  exchanges, 
  selectedPeriod, 
  onPeriodChange 
}: PerformanceChartsProps) {
  const [activeChart, setActiveChart] = useState<'indices' | 'volume' | 'returns' | 'volatility'>('indices');
  const [hoveredExchange, setHoveredExchange] = useState<string | null>(null);

  const periods = [
    { id: '1M', label: '1 Mois' },
    { id: '3M', label: '3 Mois' },
    { id: '6M', label: '6 Mois' },
    { id: '1Y', label: '1 An' },
    { id: '3Y', label: '3 Ans' }
  ];

  const chartTypes = [
    { id: 'indices', label: 'Indices Comparatifs', icon: '📈' },
    { id: 'volume', label: 'Volumes Échangés', icon: '📊' },
    { id: 'returns', label: 'Rendements', icon: '💰' },
    { id: 'volatility', label: 'Volatilité', icon: '⚡' }
  ];

  const getExchangeColor = (exchangeId: string) => {
    const colors = {
      brvm: '#3b82f6',
      jse: '#10b981', 
      ngx: '#f59e0b',
      cse: '#8b5cf6',
      nse: '#ef4444',
      gse: '#06b6d4'
    };
    return colors[exchangeId as keyof typeof colors] || '#6b7280';
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}B`;
    }
    return `$${value.toFixed(1)}M`;
  };

  // Mock data for charts based on period
  const generateChartData = (exchange: StockExchange, chartType: string, period: string) => {
    const dataPoints = period === '1M' ? 30 : period === '3M' ? 90 : period === '6M' ? 180 : period === '1Y' ? 365 : 1095;
    const data = [];
    
    for (let i = 0; i < Math.min(dataPoints, 12); i++) {
      let value;
      switch (chartType) {
        case 'indices':
          value = exchange.indexValue * (1 + (Math.random() - 0.5) * 0.1);
          break;
        case 'volume':
          value = exchange.dailyVolume * (0.8 + Math.random() * 0.4);
          break;
        case 'returns':
          value = exchange.ytdReturn * (0.9 + Math.random() * 0.2);
          break;
        case 'volatility':
          value = exchange.volatility * (0.9 + Math.random() * 0.2);
          break;
        default:
          value = 0;
      }
      data.push(value);
    }
    return data;
  };

  const maxValue = Math.max(...exchanges.map(exchange => {
    const data = generateChartData(exchange, activeChart, selectedPeriod);
    return Math.max(...data);
  }));

  const renderChart = () => {
    switch (activeChart) {
      case 'indices':
        return renderIndicesChart();
      case 'volume':
        return renderVolumeChart();
      case 'returns':
        return renderReturnsChart();
      case 'volatility':
        return renderVolatilityChart();
      default:
        return null;
    }
  };

  const renderIndicesChart = () => {
    return (
      <div className="indices-chart">
        <div className="chart-legend">
          {exchanges.map(exchange => (
            <div 
              key={exchange.id}
              className="legend-item"
              onMouseEnter={() => setHoveredExchange(exchange.id)}
              onMouseLeave={() => setHoveredExchange(null)}
            >
              <div 
                className="legend-color"
                style={{ backgroundColor: getExchangeColor(exchange.id) }}
              />
              <span className="legend-label">{exchange.shortName}</span>
              <span className="legend-value">{exchange.indexValue.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="chart-container">
          <svg className="chart-svg" viewBox="0 0 800 400">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((percent, index) => (
              <line
                key={index}
                x1="50"
                y1={350 - (percent * 3)}
                x2="750"
                y2={350 - (percent * 3)}
                stroke="#374151"
                strokeWidth="1"
                opacity="0.3"
              />
            ))}

            {/* Chart lines */}
            {exchanges.map((exchange, exchangeIndex) => {
              const data = generateChartData(exchange, 'indices', selectedPeriod);
              const points = data.map((value, index) => {
                const x = 50 + (index * (700 / (data.length - 1)));
                const normalizedValue = (value / exchange.indexValue) * 100;
                const y = 350 - (normalizedValue * 3);
                return `${x},${y}`;
              }).join(' ');

              return (
                <g key={exchange.id}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={getExchangeColor(exchange.id)}
                    strokeWidth={hoveredExchange === exchange.id ? "3" : "2"}
                    opacity={hoveredExchange && hoveredExchange !== exchange.id ? "0.3" : "1"}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {data.map((value, index) => {
                    const x = 50 + (index * (700 / (data.length - 1)));
                    const normalizedValue = (value / exchange.indexValue) * 100;
                    const y = 350 - (normalizedValue * 3);
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r={hoveredExchange === exchange.id ? "4" : "2"}
                        fill={getExchangeColor(exchange.id)}
                        opacity={hoveredExchange && hoveredExchange !== exchange.id ? "0.3" : "1"}
                        style={{ transition: 'all 0.3s ease' }}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    );
  };

  const renderVolumeChart = () => {
    return (
      <div className="volume-chart">
        <div className="chart-container">
          <div className="bar-chart">
            {exchanges.map((exchange, index) => {
              const data = generateChartData(exchange, 'volume', selectedPeriod);
              const latestValue = data[data.length - 1];
              const barHeight = (latestValue / maxValue) * 300;
              
              return (
                <div 
                  key={exchange.id}
                  className="bar-group"
                  onMouseEnter={() => setHoveredExchange(exchange.id)}
                  onMouseLeave={() => setHoveredExchange(null)}
                >
                  <div className="bar-container">
                    <div 
                      className="bar"
                      style={{
                        height: `${barHeight}px`,
                        backgroundColor: getExchangeColor(exchange.id),
                        opacity: hoveredExchange && hoveredExchange !== exchange.id ? "0.3" : "1"
                      }}
                    />
                    <span className="bar-value">{formatCurrency(latestValue)}</span>
                  </div>
                  <span className="bar-label">{exchange.shortName}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderReturnsChart = () => {
    return (
      <div className="returns-chart">
        <div className="chart-container">
          <div className="returns-grid">
            {exchanges.map(exchange => (
              <div 
                key={exchange.id}
                className="return-card"
                onMouseEnter={() => setHoveredExchange(exchange.id)}
                onMouseLeave={() => setHoveredExchange(null)}
                style={{
                  borderColor: getExchangeColor(exchange.id),
                  backgroundColor: hoveredExchange === exchange.id ? 
                    `${getExchangeColor(exchange.id)}10` : 'transparent'
                }}
              >
                <div className="return-header">
                  <img src={exchange.logo} alt={exchange.shortName} className="return-logo" />
                  <span className="return-name">{exchange.shortName}</span>
                </div>
                
                <div className="return-metrics">
                  <div className="metric">
                    <label>YTD</label>
                    <span className={`value ${exchange.ytdReturn >= 0 ? 'positive' : 'negative'}`}>
                      {exchange.ytdReturn >= 0 ? '+' : ''}{exchange.ytdReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric">
                    <label>1A</label>
                    <span className={`value ${exchange.oneYearReturn >= 0 ? 'positive' : 'negative'}`}>
                      {exchange.oneYearReturn >= 0 ? '+' : ''}{exchange.oneYearReturn.toFixed(1)}%
                    </span>
                  </div>
                  <div className="metric">
                    <label>3A</label>
                    <span className={`value ${exchange.threeYearReturn >= 0 ? 'positive' : 'negative'}`}>
                      {exchange.threeYearReturn >= 0 ? '+' : ''}{exchange.threeYearReturn.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="return-sparkline">
                  {exchange.monthlyReturns.map((return_, index) => (
                    <div
                      key={index}
                      className="sparkline-bar"
                      style={{
                        height: `${Math.abs(return_) * 3}px`,
                        backgroundColor: return_ >= 0 ? '#10b981' : '#ef4444',
                        opacity: hoveredExchange === exchange.id ? 1 : 0.7
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderVolatilityChart = () => {
    return (
      <div className="volatility-chart">
        <div className="chart-container">
          <div className="scatter-plot">
            {exchanges.map(exchange => {
              const x = (exchange.volatility / 40) * 600 + 100; // Scale to chart width
              const y = 350 - ((exchange.ytdReturn + 20) / 60) * 300; // Scale to chart height
              
              return (
                <div
                  key={exchange.id}
                  className="scatter-point"
                  style={{
                    left: `${x}px`,
                    top: `${y}px`,
                    backgroundColor: getExchangeColor(exchange.id),
                    width: hoveredExchange === exchange.id ? '20px' : '12px',
                    height: hoveredExchange === exchange.id ? '20px' : '12px',
                    opacity: hoveredExchange && hoveredExchange !== exchange.id ? 0.3 : 1
                  }}
                  onMouseEnter={() => setHoveredExchange(exchange.id)}
                  onMouseLeave={() => setHoveredExchange(null)}
                  title={`${exchange.shortName}: Volatilité ${exchange.volatility.toFixed(1)}%, Rendement YTD ${exchange.ytdReturn.toFixed(1)}%`}
                >
                  {hoveredExchange === exchange.id && (
                    <div className="scatter-tooltip">
                      <div className="tooltip-title">{exchange.shortName}</div>
                      <div className="tooltip-metric">
                        <span>Volatilité:</span>
                        <span>{exchange.volatility.toFixed(1)}%</span>
                      </div>
                      <div className="tooltip-metric">
                        <span>Rendement YTD:</span>
                        <span className={exchange.ytdReturn >= 0 ? 'positive' : 'negative'}>
                          {exchange.ytdReturn >= 0 ? '+' : ''}{exchange.ytdReturn.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="chart-axes">
            <div className="x-axis">
              <span>Volatilité (%)</span>
            </div>
            <div className="y-axis">
              <span>Rendement YTD (%)</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="performance-charts">
      {/* Chart Controls */}
      <div className="chart-controls">
        <div className="chart-types">
          {chartTypes.map(type => (
            <button
              key={type.id}
              className={`chart-type-btn ${activeChart === type.id ? 'active' : ''}`}
              onClick={() => setActiveChart(type.id as any)}
            >
              <span className="chart-icon">{type.icon}</span>
              <span className="chart-label">{type.label}</span>
            </button>
          ))}
        </div>

        <div className="period-selector">
          <label>Période:</label>
          <div className="period-pills">
            {periods.map(period => (
              <button
                key={period.id}
                className={`period-pill ${selectedPeriod === period.id ? 'active' : ''}`}
                onClick={() => onPeriodChange(period.id as any)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-actions">
          <button className="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter
          </button>
          <button className="action-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
            Plein écran
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="chart-content">
        <div className="chart-header">
          <h3>{chartTypes.find(t => t.id === activeChart)?.label}</h3>
          <div className="chart-info">
            <span className="exchange-count">{exchanges.length} bourses</span>
            <span className="period-info">{periods.find(p => p.id === selectedPeriod)?.label}</span>
          </div>
        </div>

        <div className="chart-wrapper">
          {renderChart()}
        </div>
      </div>
    </div>
  );
}
