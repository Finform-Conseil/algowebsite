'use client';

import { useState } from 'react';
import { ComparisonStock } from '@/core/data/StockComparison';

interface ComparisonStockHoverCardProps {
  stock: ComparisonStock;
  children: React.ReactNode;
}

const MARKET_INFO: Record<string, { fullName: string; country: string; description: string }> = {
  BRVM: {
    fullName: 'Bourse Régionale des Valeurs Mobilières',
    country: 'UEMOA',
    description: 'Marché boursier régional de l\'Afrique de l\'Ouest',
  },
  JSE: {
    fullName: 'Johannesburg Stock Exchange',
    country: 'Afrique du Sud',
    description: 'Plus grande bourse d\'Afrique',
  },
  NGX: {
    fullName: 'Nigerian Exchange Group',
    country: 'Nigeria',
    description: 'Bourse de Lagos, leader en Afrique de l\'Ouest',
  },
  NSE: {
    fullName: 'Nairobi Securities Exchange',
    country: 'Kenya',
    description: 'Bourse de Nairobi, hub de l\'Afrique de l\'Est',
  },
  GSE: {
    fullName: 'Ghana Stock Exchange',
    country: 'Ghana',
    description: 'Bourse d\'Accra',
  },
  CSE: {
    fullName: 'Casablanca Stock Exchange',
    country: 'Maroc',
    description: 'Bourse de Casablanca',
  },
};

export default function ComparisonStockHoverCard({ stock, children }: ComparisonStockHoverCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const marketInfo = MARKET_INFO[stock.market] || {
    fullName: stock.market,
    country: stock.country,
    description: '',
  };

  const minPrice = Math.min(...stock.priceHistory);
  const maxPrice = Math.max(...stock.priceHistory);

  return (
    <div className="stock-hover-trigger" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}

      {isVisible && (
        <div
          className="stock-hover-card"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="stock-hover-card__header">
            <div className="stock-hover-card__logo">{stock.ticker.substring(0, 2)}</div>
            <div className="stock-hover-card__title">
              <div className="stock-hover-card__ticker">{stock.ticker}</div>
              <div className="stock-hover-card__name">{stock.name}</div>
            </div>
          </div>

          {/* Market Info */}
          <div className="stock-hover-card__market">
            <div className="market-badge">{stock.market}</div>
            <div className="market-details">
              <div className="market-fullname">{marketInfo.fullName}</div>
              <div className="market-location">{marketInfo.country}</div>
            </div>
          </div>

          <div className="stock-hover-card__price">
            <span className="stock-hover-card__price-value">
              {stock.price.toFixed(2)} {stock.currency}
            </span>
            <span className={`stock-hover-card__change ${stock.change1D >= 0 ? 'positive' : 'negative'}`}>
              {stock.change1D >= 0 ? '▲' : '▼'} {Math.abs(stock.change1D).toFixed(2)}%
            </span>
          </div>

          <div className="stock-hover-card__metrics">
            <div className="metric">
              <span className="metric__label">P/E</span>
              <span className="metric__value">{stock.pe.toFixed(1)}</span>
            </div>
            <div className="metric">
              <span className="metric__label">Cap.</span>
              <span className="metric__value">{stock.marketCap.toFixed(0)}Md</span>
            </div>
            <div className="metric">
              <span className="metric__label">ROE</span>
              <span className="metric__value">{stock.roe.toFixed(1)}%</span>
            </div>
            <div className="metric">
              <span className="metric__label">Secteur</span>
              <span className="metric__value">{stock.sector}</span>
            </div>
          </div>

          {/* Mini sparkline */}
          <div className="stock-hover-card__sparkline">
            <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                points={stock.priceHistory
                  .map((price, i) => {
                    const x = (i / (stock.priceHistory.length - 1)) * 100;
                    const y = 30 - ((price - minPrice) / (maxPrice - minPrice)) * 28;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={stock.change1D >= 0 ? '#4ade80' : '#f87171'}
                strokeWidth="2"
              />
            </svg>
            <div className="sparkline-label">6 mois</div>
          </div>
        </div>
      )}
    </div>
  );
}
