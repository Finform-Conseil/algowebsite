'use client';

import { useState } from 'react';
import { StockExchange } from '@/types/exchanges';

interface ExchangeCardProps {
  exchange: StockExchange;
  onSelect: (exchange: StockExchange) => void;
  onViewStocks: (exchangeId: string) => void;
  isSelected?: boolean;
}

export default function ExchangeCard({ 
  exchange, 
  onSelect, 
  onViewStocks,
  isSelected = false 
}: ExchangeCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatCurrency = (value: number, decimals = 1) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(decimals)}T`;
    }
    return `$${value.toFixed(decimals)}B`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const getLiquidityColor = (liquidity: string) => {
    switch (liquidity) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getGrowthColor = (growth: string) => {
    switch (growth) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPerformanceColor = (value: number) => {
    if (value >= 20) return '#10b981';
    if (value >= 10) return '#22c55e';
    if (value >= 0) return '#eab308';
    return '#ef4444';
  };

  return (
    <div 
      className={`exchange-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(exchange)}
    >
      {/* Card Header */}
      <div className="card-header">
        <div className="exchange-info">
          <img 
            src={exchange.logo} 
            alt={exchange.shortName}
            className="exchange-logo"
          />
          <div className="exchange-details">
            <h3 className="exchange-name">{exchange.shortName}</h3>
            <p className="exchange-full-name">{exchange.name}</p>
            <div className="exchange-meta">
              <span className="country">{exchange.country}</span>
              <span className="currency">{exchange.currency}</span>
              <span className="region">{exchange.region}</span>
            </div>
          </div>
        </div>

        <div className="exchange-badges">
          <div 
            className="badge liquidity-badge"
            style={{ backgroundColor: getLiquidityColor(exchange.liquidity) }}
          >
            {/* {exchange.liquidity === 'high' ? '🔥' : exchange.liquidity === 'medium' ? '⚡' : '💧'}  */}
            Liquidité {exchange.liquidity === 'high' ? 'Élevée' : exchange.liquidity === 'medium' ? 'Moyenne' : 'Faible'}
          </div>
          <div 
            className="badge growth-badge"
            style={{ backgroundColor: getGrowthColor(exchange.growth) }}
          >
            {/* {exchange.growth === 'high' ? '🚀' : exchange.growth === 'medium' ? '📈' : '📊'}  */}
            Croissance {exchange.growth === 'high' ? 'Élevée' : exchange.growth === 'medium' ? 'Moyenne' : 'Faible'}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="card-metrics">
        <div className="metric-row">
          <div className="metric">
            <label>Capitalisation</label>
            <span className="value">{formatCurrency(exchange.totalMarketCap)}</span>
          </div>
          <div className="metric">
            <label>Volume Quotidien</label>
            <span className="value">${exchange.dailyVolume.toFixed(1)}M</span>
          </div>
        </div>

        <div className="metric-row">
          <div className="metric">
            <label>Sociétés Cotées</label>
            <span className="value">{formatNumber(exchange.listedCompanies)}</span>
          </div>
          <div className="metric">
            <label>Cap. Moyenne</label>
            <span className="value">${exchange.averageMarketCap.toFixed(0)}M</span>
          </div>
        </div>
      </div>

      {/* Performance Section */}
      <div className="card-performance">
        <div className="performance-header">
          <span className="index-name">{exchange.indexName}</span>
          <span className="index-value">{exchange.indexValue.toFixed(2)}</span>
        </div>
        
        <div className="performance-change">
          <span className={`change ${exchange.indexChange >= 0 ? 'positive' : 'negative'}`}>
            {exchange.indexChange >= 0 ? '+' : ''}{exchange.indexChange.toFixed(2)} 
            ({exchange.indexChangePercent >= 0 ? '+' : ''}{exchange.indexChangePercent.toFixed(2)}%)
          </span>
        </div>

        <div className="performance-periods">
          <div className="period">
            <label>YTD</label>
            <span 
              className="return"
              style={{ color: getPerformanceColor(exchange.ytdReturn) }}
            >
              {exchange.ytdReturn >= 0 ? '+' : ''}{exchange.ytdReturn.toFixed(1)}%
            </span>
          </div>
          <div className="period">
            <label>1A</label>
            <span 
              className="return"
              style={{ color: getPerformanceColor(exchange.oneYearReturn) }}
            >
              {exchange.oneYearReturn >= 0 ? '+' : ''}{exchange.oneYearReturn.toFixed(1)}%
            </span>
          </div>
          <div className="period">
            <label>3A</label>
            <span 
              className="return"
              style={{ color: getPerformanceColor(exchange.threeYearReturn) }}
            >
              {exchange.threeYearReturn >= 0 ? '+' : ''}{exchange.threeYearReturn.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Sparkline Chart */}
      {isHovered && (
        <div className="card-sparkline">
          <div className="sparkline-title">Performance 12 mois</div>
          <div className="sparkline-chart">
            {exchange.monthlyReturns.map((return_, index) => {
              const height = Math.abs(return_) * 10;
              const color = return_ >= 0 ? '#10b981' : '#ef4444';
              return (
                <div
                  key={index}
                  className="sparkline-bar"
                  style={{
                    height: `${Math.min(height, 40)}px`,
                    backgroundColor: color,
                    opacity: 0.8
                  }}
                  title={`Mois ${index + 1}: ${return_ >= 0 ? '+' : ''}${return_.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamism Meter */}
      <div className="card-dynamism">
        <div className="dynamism-header">
          <label>Dynamisme du marché</label>
          <span className="dynamism-value">{exchange.dynamism}/100</span>
        </div>
        <div className="dynamism-bar">
          <div 
            className="dynamism-fill"
            style={{ 
              width: `${exchange.dynamism}%`,
              backgroundColor: exchange.dynamism >= 75 ? '#10b981' : 
                              exchange.dynamism >= 50 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
      </div>

      {/* Card Footer */}
      <div className="card-footer">
        <div className="exchange-sectors">
          <label>Secteurs dominants:</label>
          <div className="sector-tags">
            {exchange.dominantSectors.slice(0, 3).map((sector, index) => (
              <span key={index} className="sector-tag">{sector}</span>
            ))}
            {exchange.dominantSectors.length > 3 && (
              <span className="sector-tag more">+{exchange.dominantSectors.length - 3}</span>
            )}
          </div>
        </div>

        <div className="card-actions">
          <button 
            className="action-btn secondary"
            onClick={(e) => {
              e.stopPropagation();
              // Navigate to exchange details
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Détails
          </button>
          
          <button 
            className="action-btn primary"
            onClick={(e) => {
              e.stopPropagation();
              onViewStocks(exchange.id);
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Voir les actions
          </button>
        </div>
      </div>
    </div>
  );
}
