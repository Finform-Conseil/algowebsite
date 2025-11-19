'use client';

import { PortfolioStats, PerformanceHistory } from '@/types/watchlist-portfolio';
import { formatCurrency, formatPercent } from '@/core/data/WatchlistPortfolioData';

interface PortfolioChartsProps {
  stats: PortfolioStats;
  performanceHistory: PerformanceHistory[];
}

export default function PortfolioCharts({ stats, performanceHistory }: PortfolioChartsProps) {
  const maxValue = Math.max(...performanceHistory.map(item => item.portfolioValue));
  const minValue = Math.min(...performanceHistory.map(item => item.portfolioValue));

  return (
    <div className="portfolio-charts">
      <div className="charts-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Visualisations & Statistiques
        </h2>
      </div>

      {/* Performance Metrics */}
      <div className="performance-metrics">
        <div className="metric-card">
          <span className="metric-label">Rendement journalier</span>
          <span className={`metric-value ${stats.dailyReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(stats.dailyReturn)}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Rendement hebdomadaire</span>
          <span className={`metric-value ${stats.weeklyReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(stats.weeklyReturn)}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Rendement mensuel</span>
          <span className={`metric-value ${stats.monthlyReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(stats.monthlyReturn)}
          </span>
        </div>
        <div className="metric-card">
          <span className="metric-label">Rendement annuel</span>
          <span className={`metric-value ${stats.yearlyReturn >= 0 ? 'positive' : 'negative'}`}>
            {formatPercent(stats.yearlyReturn)}
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Performance Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Évolution du portfolio (30 jours)</h3>
          </div>
          <div className="performance-chart">
            {performanceHistory.map((item, index) => {
              const height = ((item.portfolioValue - minValue) / (maxValue - minValue)) * 100;
              return (
                <div key={index} className="chart-bar" title={`${new Date(item.date).toLocaleDateString('fr-FR')}: ${formatCurrency(item.portfolioValue)}`}>
                  <div className="bar-fill" style={{ height: `${height}%` }} />
                </div>
              );
            })}
          </div>
          <div className="chart-values">
            <span>{formatCurrency(minValue)}</span>
            <span>{formatCurrency(maxValue)}</span>
          </div>
        </div>

        {/* Sector Allocation */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Répartition par secteur</h3>
          </div>
          <div className="allocation-list">
            {stats.sectorAllocation.map((item, index) => (
              <div key={index} className="allocation-item">
                <div className="allocation-info">
                  <span className="allocation-name">{item.sector}</span>
                  <span className="allocation-percent">{item.percent.toFixed(1)}%</span>
                </div>
                <div className="allocation-bar">
                  <div
                    className="allocation-fill"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
                <span className="allocation-value">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk Metrics */}
      <div className="risk-metrics">
        <h3>Indicateurs de risque</h3>
        <div className="risk-grid">
          <div className="risk-card">
            <div className="risk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div className="risk-content">
              <span className="risk-label">Volatilité</span>
              <span className="risk-value">{stats.volatility.toFixed(2)}%</span>
              <span className="risk-sublabel">Écart-type annualisé</span>
            </div>
          </div>

          {stats.sharpeRatio && (
            <div className="risk-card">
              <div className="risk-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="risk-content">
                <span className="risk-label">Ratio de Sharpe</span>
                <span className="risk-value">{stats.sharpeRatio.toFixed(2)}</span>
                <span className="risk-sublabel">Rendement ajusté au risque</span>
              </div>
            </div>
          )}

          <div className="risk-card">
            <div className="risk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
            <div className="risk-content">
              <span className="risk-label">Drawdown max</span>
              <span className="risk-value negative">{stats.maxDrawdown.toFixed(2)}%</span>
              <span className="risk-sublabel">Perte maximale</span>
            </div>
          </div>

          <div className="risk-card">
            <div className="risk-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="risk-content">
              <span className="risk-label">Période de détention moy.</span>
              <span className="risk-value">{stats.avgHoldingPeriod} jours</span>
              <span className="risk-sublabel">Durée moyenne</span>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="activity-stats">
        <h3>Activité du portfolio</h3>
        <div className="activity-grid">
          <div className="activity-item">
            <span className="activity-label">Total transactions</span>
            <span className="activity-value">{stats.totalTransactions}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Achats</span>
            <span className="activity-value success">{stats.totalBuys}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Ventes</span>
            <span className="activity-value danger">{stats.totalSells}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Dividendes reçus</span>
            <span className="activity-value">{formatCurrency(stats.totalDividends)}</span>
          </div>
          <div className="activity-item">
            <span className="activity-label">Rendement dividendes</span>
            <span className="activity-value">{stats.dividendYield.toFixed(2)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
