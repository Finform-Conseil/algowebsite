'use client';

import { useState } from 'react';
import { IPOStatistics as IPOStatsType } from '@/types/ipo';
import PieChart from '@/components/charts/PieChart';

interface IPOStatisticsProps {
  statistics: IPOStatsType;
}

export default function IPOStatistics({ statistics }: IPOStatisticsProps) {
  const [activeView, setActiveView] = useState<'sector' | 'exchange' | 'year' | 'month'>('sector');
  const [performanceTab, setPerformanceTab] = useState<'top' | 'worst'>('top');

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  // Prepare data for charts
  const sectorChartData = statistics.bySector.map(item => ({
    name: item.sector,
    value: item.count
  }));

  const exchangeChartData = statistics.byExchange.map(item => ({
    name: item.exchange,
    value: item.count
  }));

  const yearChartData = statistics.byYear.map(item => ({
    name: String(item.year),
    value: item.count
  }));

  return (
    <div className="ipo-statistics">
      <div className="ipo-statistics__header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Statistiques & Analyses
        </h2>
        <div className="view-selector">
          <button
            className={activeView === 'sector' ? 'active' : ''}
            onClick={() => setActiveView('sector')}
          >
            Par secteur
          </button>
          <button
            className={activeView === 'exchange' ? 'active' : ''}
            onClick={() => setActiveView('exchange')}
          >
            Par bourse
          </button>
          <button
            className={activeView === 'year' ? 'active' : ''}
            onClick={() => setActiveView('year')}
          >
            Par année
          </button>
          <button
            className={activeView === 'month' ? 'active' : ''}
            onClick={() => setActiveView('month')}
          >
            Par mois
          </button>
        </div>
      </div>

      <div className="ipo-statistics__content">
        {/* Charts Section */}
        <div className="charts-section">
          {activeView === 'sector' && (
            <div className="chart-container">
              <div className="chart-header">
                <h3>Répartition par secteur</h3>
                <span className="chart-subtitle">Nombre d'IPO par secteur d'activité</span>
              </div>
              <div className="chart-wrapper">
                <PieChart
                  data={sectorChartData}
                  height="300px"
                />
              </div>
              <div className="chart-legend">
                {statistics.bySector.slice(0, 5).map((item, index) => (
                  <div key={item.sector} className="legend-item">
                    <span className="legend-rank">#{index + 1}</span>
                    <span className="legend-name">{item.sector}</span>
                    <span className="legend-count">{item.count} IPO</span>
                    <span className="legend-amount">{formatCurrency(item.totalRaised)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'exchange' && (
            <div className="chart-container">
              <div className="chart-header">
                <h3>Répartition par bourse</h3>
                <span className="chart-subtitle">Nombre d'IPO par place boursière</span>
              </div>
              <div className="chart-wrapper">
                <PieChart
                  data={exchangeChartData}
                  height="300px"
                />
              </div>
              <div className="chart-legend">
                {statistics.byExchange.slice(0, 5).map((item, index) => (
                  <div key={item.exchange} className="legend-item">
                    <span className="legend-rank">#{index + 1}</span>
                    <span className="legend-name">{item.exchange}</span>
                    <span className="legend-count">{item.count} IPO</span>
                    <span className="legend-amount">{formatCurrency(item.totalRaised)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'year' && (
            <div className="chart-container">
              <div className="chart-header">
                <h3>Évolution annuelle</h3>
                <span className="chart-subtitle">Nombre d'IPO par année</span>
              </div>
              <div className="bar-chart">
                {statistics.byYear.map((item) => {
                  const maxCount = Math.max(...statistics.byYear.map(y => y.count));
                  const heightPercent = (item.count / maxCount) * 100;
                  
                  return (
                    <div key={item.year} className="bar-item">
                      <div className="bar-wrapper">
                        <div 
                          className="bar-fill" 
                          style={{ height: `${heightPercent}%` }}
                          title={`${item.count} IPO - ${formatCurrency(item.totalRaised)}`}
                        >
                          <span className="bar-value">{item.count}</span>
                        </div>
                      </div>
                      <span className="bar-label">{item.year}</span>
                      <span className="bar-amount">{formatCurrency(item.totalRaised)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === 'month' && (
            <div className="chart-container">
              <div className="chart-header">
                <h3>Répartition mensuelle</h3>
                <span className="chart-subtitle">Nombre d'IPO par mois (12 derniers mois)</span>
              </div>
              <div className="bar-chart monthly">
                {statistics.byMonth.map((item) => {
                  const maxCount = Math.max(...statistics.byMonth.map(m => m.count));
                  const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={item.month} className="bar-item">
                      <div className="bar-wrapper">
                        <div 
                          className="bar-fill" 
                          style={{ height: `${heightPercent}%` }}
                          title={`${item.count} IPO - ${formatCurrency(item.totalRaised)}`}
                        >
                          {item.count > 0 && <span className="bar-value">{item.count}</span>}
                        </div>
                      </div>
                      <span className="bar-label">{item.month}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Performance Section with Tabs */}
        <div className="performance-section">
          <div className="performance-card">
            <div className="performance-header">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
                Performances IPO
              </h3>
              <div className="performance-tabs">
                <button
                  className={`tab-btn ${performanceTab === 'top' ? 'active' : ''}`}
                  onClick={() => setPerformanceTab('top')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                  Top 5
                </button>
                <button
                  className={`tab-btn ${performanceTab === 'worst' ? 'active' : ''}`}
                  onClick={() => setPerformanceTab('worst')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                  </svg>
                  Worst 5
                </button>
              </div>
            </div>
            
            <div className="performance-list">
              {performanceTab === 'top' ? (
                statistics.topPerformers.slice(0, 5).map((ipo, index) => (
                  <div key={ipo.id} className="performance-item">
                    <span className="rank">#{index + 1}</span>
                    <div className="company-info">
                      <strong>{ipo.companyName}</strong>
                      <span className="ticker">{ipo.ticker}</span>
                    </div>
                    <span className="return positive">
                      +{ipo.currentReturn?.toFixed(1)}%
                    </span>
                  </div>
                ))
              ) : (
                statistics.worstPerformers.slice(0, 5).map((ipo, index) => (
                  <div key={ipo.id} className="performance-item">
                    <span className="rank">#{index + 1}</span>
                    <div className="company-info">
                      <strong>{ipo.companyName}</strong>
                      <span className="ticker">{ipo.ticker}</span>
                    </div>
                    <span className={`return ${(ipo.currentReturn || 0) >= 0 ? 'positive' : 'negative'}`}>
                      {(ipo.currentReturn || 0) >= 0 ? '+' : ''}{ipo.currentReturn?.toFixed(1)}%
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
