'use client';

import { useState } from 'react';
import { Portfolio, Position } from '@/types/watchlist-portfolio';
import { formatCurrency, formatPercent } from '@/core/data/WatchlistPortfolioData';

interface PortfolioViewProps {
  portfolio: Portfolio;
  onBuyStock?: () => void;
  onSellStock?: (positionId: string) => void;
}

export default function PortfolioView({ portfolio, onBuyStock, onSellStock }: PortfolioViewProps) {
  const [viewMode, setViewMode] = useState<'positions' | 'transactions'>('positions');

  const totalValue = portfolio.currentValue + portfolio.currentCash;
  const investedPercent = (portfolio.currentValue / totalValue) * 100;
  const cashPercent = (portfolio.currentCash / totalValue) * 100;

  return (
    <div className="portfolio-view">
      {/* Portfolio Summary */}
      <div className="portfolio-summary">
        <div className="summary-header">
          <div className="portfolio-name">
            <h2>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              </svg>
              {portfolio.name}
            </h2>
            {portfolio.description && (
              <p className="portfolio-description">{portfolio.description}</p>
            )}
          </div>
          <button className="btn-add" onClick={onBuyStock}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Acheter une action
          </button>
        </div>

        <div className="summary-cards">
          <div className="summary-card primary">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="card-content">
              <span className="card-label">Valeur totale</span>
              <span className="card-value">{formatCurrency(totalValue)}</span>
              <span className="card-sublabel">
                Capital initial: {formatCurrency(portfolio.initialCapital)}
              </span>
            </div>
          </div>

          <div className={`summary-card ${portfolio.totalGain >= 0 ? 'success' : 'danger'}`}>
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="card-content">
              <span className="card-label">Gain total</span>
              <span className="card-value">
                {portfolio.totalGain >= 0 ? '+' : ''}{formatCurrency(portfolio.totalGain)}
              </span>
              <span className="card-sublabel">
                {formatPercent(portfolio.totalGainPercent)}
              </span>
            </div>
          </div>

          <div className="summary-card info">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <div className="card-content">
              <span className="card-label">Positions</span>
              <span className="card-value">{portfolio.numberOfStocks}</span>
              <span className="card-sublabel">
                Investi: {formatCurrency(portfolio.currentValue)}
              </span>
            </div>
          </div>

          <div className="summary-card warning">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div className="card-content">
              <span className="card-label">Liquidités</span>
              <span className="card-value">{formatCurrency(portfolio.currentCash)}</span>
              <span className="card-sublabel">
                {cashPercent.toFixed(1)}% du total
              </span>
            </div>
          </div>
        </div>

        {/* Allocation Bar */}
        <div className="allocation-bar">
          <div className="bar-container">
            <div
              className="bar-segment invested"
              style={{ width: `${investedPercent}%` }}
              title={`Investi: ${investedPercent.toFixed(1)}%`}
            />
            <div
              className="bar-segment cash"
              style={{ width: `${cashPercent}%` }}
              title={`Liquidités: ${cashPercent.toFixed(1)}%`}
            />
          </div>
          <div className="bar-legend">
            <span className="legend-item">
              <span className="legend-color invested"></span>
              Investi ({investedPercent.toFixed(1)}%)
            </span>
            <span className="legend-item">
              <span className="legend-color cash"></span>
              Liquidités ({cashPercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="portfolio-tabs">
        <button
          className={`tab-btn ${viewMode === 'positions' ? 'active' : ''}`}
          onClick={() => setViewMode('positions')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          Positions ({portfolio.positions.length})
        </button>
        <button
          className={`tab-btn ${viewMode === 'transactions' ? 'active' : ''}`}
          onClick={() => setViewMode('transactions')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Transactions ({portfolio.transactions.length})
        </button>
      </div>

      {/* Content */}
      {viewMode === 'positions' ? (
        <div className="positions-table">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th className="text-right">Quantité</th>
                <th className="text-right">Prix moyen</th>
                <th className="text-right">Prix actuel</th>
                <th className="text-right">Valeur</th>
                <th className="text-right">Gain/Perte</th>
                <th className="text-right">Poids</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.positions.map((position) => (
                <tr key={position.stockId} className="position-row">
                  <td className="stock-info">
                    <div className="stock-identity">
                      <div className="stock-logo">
                        {position.ticker.substring(0, 2)}
                      </div>
                      <div className="stock-details">
                        <strong>{position.companyName}</strong>
                        <div className="stock-meta">
                          <span className="ticker">{position.ticker}</span>
                          <span className="separator">•</span>
                          <span className="sector">{position.sector}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right">
                    <strong>{position.quantity}</strong>
                  </td>
                  <td className="text-right">
                    {position.avgBuyPrice.toLocaleString()} XOF
                  </td>
                  <td className="text-right">
                    <strong>{position.currentPrice.toLocaleString()} XOF</strong>
                  </td>
                  <td className="text-right">
                    <strong>{formatCurrency(position.currentValue)}</strong>
                  </td>
                  <td className="text-right">
                    <div className={`gain-cell ${position.unrealizedGain >= 0 ? 'positive' : 'negative'}`}>
                      <strong>
                        {position.unrealizedGain >= 0 ? '+' : ''}{formatCurrency(position.unrealizedGain)}
                      </strong>
                      <span className="gain-percent">
                        {formatPercent(position.unrealizedGainPercent)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right">
                    <div className="weight-cell">
                      <div className="weight-bar">
                        <div
                          className="weight-fill"
                          style={{ width: `${position.weight}%` }}
                        />
                      </div>
                      <span className="weight-value">{position.weight.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="action-buttons">
                      <button className="btn-icon" title="Acheter plus">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button
                        className="btn-icon danger"
                        title="Vendre"
                        onClick={() => onSellStock?.(position.stockId)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Action</th>
                <th className="text-right">Quantité</th>
                <th className="text-right">Prix</th>
                <th className="text-right">Montant</th>
                <th className="text-right">Frais</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.transactions.map((tx) => (
                <tr key={tx.id} className="transaction-row">
                  <td>{new Date(tx.date).toLocaleDateString('fr-FR')}</td>
                  <td>
                    <span className={`tx-type ${tx.type}`}>
                      {tx.type === 'buy' ? 'Achat' : 'Vente'}
                    </span>
                  </td>
                  <td>
                    <div className="tx-stock">
                      <strong>{tx.companyName}</strong>
                      <span className="ticker">{tx.ticker}</span>
                    </div>
                  </td>
                  <td className="text-right">{tx.quantity}</td>
                  <td className="text-right">{tx.price.toLocaleString()} XOF</td>
                  <td className="text-right">
                    <strong>{formatCurrency(tx.totalAmount)}</strong>
                  </td>
                  <td className="text-right text-muted">
                    {tx.fees ? formatCurrency(tx.fees) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
