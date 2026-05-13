'use client';

import { useState } from 'react';
import { ActionEntity } from '@/core/domain/entities/action.entity';

interface ComparisonStockHoverCardProps {
  stock: ActionEntity;
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

  const marketInfo = MARKET_INFO[stock.bourse?.ticker || ''] || {
    fullName: stock.bourse?.name || stock.bourse?.ticker || 'N/A',
    country: typeof stock.society?.country === 'string' ? stock.society.country : stock.society?.country?.name || 'N/A',
    description: '',
  };

  // Pour le sparkline, on utilise des données simulées basées sur le prix actuel
  // TODO: Récupérer l'historique réel des prix via API
  const currentPrice = stock.latest_price_metric?.price || 0;
  const change1M = stock.latest_price_metric?.change_1m_pct || 0;
  const priceHistory = Array.from({ length: 10 }, (_, i) => {
    const variation = (change1M / 100) * (i / 9);
    return currentPrice * (1 - variation);
  });
  const minPrice = Math.min(...priceHistory);
  const maxPrice = Math.max(...priceHistory);

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
            <div className="stock-hover-card__logo">{stock.ticker?.substring(0, 2).toUpperCase()}</div>
            <div className="stock-hover-card__title">
              <div className="stock-hover-card__ticker">{stock.ticker}</div>
              <div className="stock-hover-card__name">{stock.society?.name || 'N/A'}</div>
            </div>
          </div>

          {/* Market Info */}
          <div className="stock-hover-card__market">
            <div className="market-badge">{stock.bourse?.ticker || 'N/A'}</div>
            <div className="market-details">
              <div className="market-fullname">{marketInfo.fullName}</div>
              <div className="market-location">{marketInfo.country}</div>
            </div>
          </div>

          <div className="stock-hover-card__price">
            <span className="stock-hover-card__price-value">
              {stock.latest_price_metric?.price?.toFixed(2) || 'N/A'} {typeof stock.bourse?.currency === 'string' ? stock.bourse.currency : stock.bourse?.currency?.code || 'XOF'}
            </span>
            <span className={`stock-hover-card__change ${(stock.latest_price_metric?.change_1d_pct ?? 0) >= 0 ? 'positive' : 'negative'}`}>
              {(stock.latest_price_metric?.change_1d_pct ?? 0) >= 0 ? '▲' : '▼'} {Math.abs(stock.latest_price_metric?.change_1d_pct ?? 0).toFixed(2)}%
            </span>
          </div>

          <div className="stock-hover-card__metrics">
            <div className="metric">
              <span className="metric__label">P/E</span>
              <span className="metric__value">{stock.latest_valuation_ratio?.pe_ttm?.toFixed(1) ?? 'N/A'}</span>
            </div>
            <div className="metric">
              <span className="metric__label">Cap.</span>
              <span className="metric__value">{stock.latest_valuation_ratio?.market_cap ? (stock.latest_valuation_ratio.market_cap / 1000000000).toFixed(1) + 'Md' : 'N/A'}</span>
            </div>
            <div className="metric">
              <span className="metric__label">ROE</span>
              <span className="metric__value">{stock.latest_valuation_ratio?.roe?.toFixed(1) ?? 'N/A'}%</span>
            </div>
            <div className="metric">
              <span className="metric__label">Sector</span>
              <span className="metric__value">{stock.society?.industry?.name || 'N/A'}</span>
            </div>
          </div>

          {/* Mini sparkline */}
          <div className="stock-hover-card__sparkline">
            <svg width="100%" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
              <polyline
                points={priceHistory
                  .map((price, i) => {
                    const x = (i / (priceHistory.length - 1)) * 100;
                    const y = 30 - ((price - minPrice) / (maxPrice - minPrice || 1)) * 28;
                    return `${x},${y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke={(stock.latest_price_metric?.change_1m_pct ?? 0) >= 0 ? '#4ade80' : '#f87171'}
                strokeWidth="2"
              />
            </svg>
            <div className="sparkline-label">1 month trend</div>
          </div>
        </div>
      )}
    </div>
  );
}
