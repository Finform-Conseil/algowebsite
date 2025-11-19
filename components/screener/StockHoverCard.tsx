'use client';

import { useState } from 'react';
import { StockScreenerItem } from '@/core/data/StockScreener';

interface StockHoverCardProps {
  stock: StockScreenerItem;
  children: React.ReactNode;
}

export default function StockHoverCard({ stock, children }: StockHoverCardProps) {
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

  // Données mini sparkline (simulées pour 3 mois)
  const sparklineData = [
    stock.price * 0.92,
    stock.price * 0.95,
    stock.price * 0.98,
    stock.price * 0.96,
    stock.price * 1.02,
    stock.price * 1.01,
    stock.price,
  ];

  const minPrice = Math.min(...sparklineData);
  const maxPrice = Math.max(...sparklineData);

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
            <div className="stock-hover-card__logo">{stock.ticker.charAt(0)}</div>
            <div className="stock-hover-card__title">
              <div className="stock-hover-card__ticker">{stock.ticker}</div>
              <div className="stock-hover-card__name">{stock.name}</div>
            </div>
          </div>

          <div className="stock-hover-card__price">
            <span className="stock-hover-card__price-value">{stock.price.toFixed(2)} €</span>
            <span className={`stock-hover-card__change ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
              {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
            </span>
          </div>

          <div className="stock-hover-card__metrics">
            <div className="metric">
              <span className="metric__label">P/E</span>
              <span className="metric__value">{stock.pe.toFixed(1)}</span>
            </div>
            <div className="metric">
              <span className="metric__label">Cap.</span>
              <span className="metric__value">{stock.marketCap}Md</span>
            </div>
            <div className="metric">
              <span className="metric__label">ROE</span>
              <span className="metric__value">{stock.roe.toFixed(1)}%</span>
            </div>
          </div>

          {/* Mini sparkline */}
          <div className="stock-hover-card__sparkline">
            <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                points={sparklineData
                  .map((price, i) => {
                    const x = (i / (sparklineData.length - 1)) * 100;
                    const y = 30 - ((price - minPrice) / (maxPrice - minPrice)) * 28;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={stock.changePercent >= 0 ? '#4ade80' : '#f87171'}
                strokeWidth="2"
              />
            </svg>
            <div className="sparkline-label">3 mois</div>
          </div>
        </div>
      )}
    </div>
  );
}
