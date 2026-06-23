'use client';

import { useState, useEffect } from 'react';
import MultiLineChart from '@/components/opcvm/MultiLineChart';
import { useOpcvmRepository } from '@/core/infra/repositories/opcvm.repository.impl';

type Exchange = 'BRVM' | 'JSE' | 'NGX' | 'NSE' | 'CSE' | 'GSE';
type ViewMode = 'detailed' | 'table' | 'charts';

export default function OPCVMComparisonReportPage() {
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('BRVM');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2026-02-03');
  const [viewMode, setViewMode] = useState<ViewMode>('charts');

  const { topFlopOpcvmsData, getTopFlopOpcvms } = useOpcvmRepository();
  
  useEffect(() => {
    getTopFlopOpcvms({date_from: startDate, date_to: endDate, bourse_ticker: selectedExchange});
  }, [startDate, endDate, selectedExchange]);

  useEffect(() =>
  {
    console.log("All OPCVM Data", topFlopOpcvmsData)
  }, [topFlopOpcvmsData])

  const formatMetric = (value?: number | string | null, digits = 4, suffix = '') => {
    const numericValue = Number(value);
    return value === null || value === undefined || Number.isNaN(numericValue) ? '-' : `${numericValue.toFixed(digits)}${suffix}`;
  };

  const formatSgo = (sgo?: string | { name?: string }) => (
    typeof sgo === 'string' ? sgo : sgo?.name || '-'
  );
  

  return (
    <div className="comparison-report-page">
      {/* Header */}
      <div className="report-header">
        <div 
          className="report-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
          }}
        >
          <div className="header-content">
            <div className="header-title">
              <h1>Funds Comparison Report</h1>
              <p>Comparative analysis of Top-3 and Flop-3 Funds by exchange</p>
            </div>

            <div className="header-filters">
              <div className="filter-group">
                <label>Exchange</label>
                <select
                  value={selectedExchange}
                  onChange={(e) => setSelectedExchange(e.target.value as Exchange)}
                  className="exchange-select"
                >
                  <option value="BRVM">BRVM</option>
                  <option value="JSE">JSE</option>
                  <option value="NGX">NGX</option>
                  <option value="NSE">NSE</option>
                  <option value="CSE">CSE</option>
                  <option value="GSE">GSE</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Period</label>
                <div className="date-range">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn-generate">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Generate report
              </button>
            </div>
        </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          className={`tab-btn ${viewMode === 'charts' ? 'active' : ''}`}
          onClick={() => setViewMode('charts')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Charts View
        </button>
        <button
          className={`tab-btn ${viewMode === 'detailed' ? 'active' : ''}`}
          onClick={() => setViewMode('detailed')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Detailed View
        </button>
        <button
          className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          Table View
        </button>
        
      </div>

      {/* Report Content */}
      <div className="report-content">
        {/* Vue Détaillée */}
        {viewMode === 'detailed' && (
          <div className="detailed-view">
            {/* Introduction */}
            <section className="report-section introduction">
              <h2>Introduction</h2>
              <p>
                This report aims to provide investors with a periodic comparative analysis of six Undertakings for Collective Investment in Transferable Securities (Funds) listed on the <strong>{selectedExchange}</strong>. We have selected the three Funds with the best performance ("Top-3") and the three with the lowest performance ("Flop-3") over the period from <strong>{new Date(startDate).toLocaleDateString('en-US')}</strong> to <strong>{new Date(endDate).toLocaleDateString('en-US')}</strong>.
              </p>
              <p>
                The analysis will focus on their performance, management fees, and main investment strategies, to help investors better understand the factors of success and underperformance, and to inform their investment decisions.
              </p>
            </section>

        {/* Méthodologie */}
        <section className="report-section methodology">
          <h2>Methodology</h2>
          <p>
            The selection of Funds was based on the <strong>total net return</strong> over the analyzed period. Information regarding management fees and investment strategies was extracted from Key Investor Information Documents (KIID), prospectuses, and publicly available periodic reports.
          </p>
        </section>

        {/* Top-3 OPCVM */}
        <section className="report-section top-opcvm">
          <div className="section-header">
            <div className="section-icon top">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h2>Detailed Analysis of Top-3 Funds</h2>
          </div>

          <div className="opcvm-cards">
            {topFlopOpcvmsData?.top_performers.map((topOpcvm, index) => (
              <div key={index} className="opcvm-card top-card">
                <div className="card-header">
                  <div className="rank-badge top-rank">#{index + 1}</div>
                  <h3>{topOpcvm.opcvm.intitule}</h3>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">Management Company:</span>
                    <span className="info-value">{typeof topOpcvm.opcvm.sgo == "string" ? topOpcvm.opcvm.sgo : '--'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Approval Year:</span>
                    <span className="info-value">{topOpcvm.opcvm.date_agrement?.toString()}</span>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Main Investment Strategy</h4>
                  <p>{topOpcvm.opcvm.orientation_strategique}</p>
                </div>

                <div className="card-section">
                  <h4>Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Return</span>
                      <span className="metric-value positive">+{topOpcvm.performance.toFixed(4)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Benchmark</span>
                      <span className="metric-value">{topOpcvm.opcvm.indice_description}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{topOpcvm.volatility}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Risk Level</span>
                      <span className={`risk-badge risk-${topOpcvm.opcvm.niveau_risque}`}>{topOpcvm.opcvm.niveau_risque}</span>
                    </div>
                  </div>
                  <p className="performance-text">
                    With a return of <strong>+{topOpcvm.performance.toFixed(4)}%</strong> over the period, this fund significantly outperformed its benchmark. Its volatility of <strong>{topOpcvm.volatility}%</strong> suggests a <strong>{topOpcvm.opcvm.niveau_risque}</strong> risk level compared to its category.
                  </p>
                </div>

                <div className="card-section">
                  <h4>Management Fees</h4>
                  <p>
                    Annual management fees amount to <strong>{topOpcvm.opcvm.max_gestion}%</strong>, which is in a <strong>{topOpcvm.opcvm.max_souscription}</strong> range compared to its category.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Flop-3 OPCVM */}
        <section className="report-section flop-opcvm">
          <div className="section-header">
            <div className="section-icon flop">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
            </div>
            <h2>Detailed Analysis of Flop-3 Funds</h2>
          </div>

          <div className="opcvm-cards">
            {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, index) => (
              <div key={index} className="opcvm-card flop-card">
                <div className="card-header">
                  <div className="rank-badge flop-rank">#{index + 1}</div>
                  <h3>{worstOpcvm.opcvm.intitule}</h3>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">Management Company:</span>
                    <span className="info-value">{typeof worstOpcvm.opcvm.sgo =='string'? worstOpcvm.opcvm.sgo : '--'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Approval Year:</span>
                    <span className="info-value">{worstOpcvm.opcvm.date_agrement?.toString() || '--'}</span>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Main Investment Strategy</h4>
                  <p>{worstOpcvm.opcvm.orientation_strategique}</p>
                </div>

                <div className="card-section">
                  <h4>Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Return</span>
                      <span className={`metric-value ${worstOpcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                        {worstOpcvm.performance >= 0 ? '+' : ''}{worstOpcvm.performance.toFixed(4)}%
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Benchmark</span>
                      <span className="metric-value">{worstOpcvm.opcvm.indice_description}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{worstOpcvm.volatility}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Risk Level</span>
                      <span className={`risk-badge risk-${worstOpcvm.opcvm.niveau_risque}`}>{worstOpcvm.opcvm.niveau_risque}</span>
                    </div>
                  </div>
                  <p className="performance-text">
                    With a return of <strong>{worstOpcvm.performance >= 0 ? '+' : ''}{worstOpcvm.performance.toFixed(4)}%</strong> over the period, this fund significantly underperformed its benchmark. Its volatility of <strong>{worstOpcvm.volatility}%</strong> suggests a <strong>{worstOpcvm.opcvm.niveau_risque}</strong> risk level.
                  </p>
                </div>

                <div className="card-section">
                  <h4>Management Fees</h4>
                  <p>
                    Annual management fees amount to <strong>{worstOpcvm.opcvm.max_gestion}%</strong>, which is in a <strong>{worstOpcvm.opcvm.max_souscription}</strong> range compared to its category.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

          {/* Avertissement */}
        <section className="report-section disclaimer">
          <div className="disclaimer-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2>Important Disclaimer</h2>
          <p><strong>Past performance does not guarantee future results.</strong> This report is based on historical data and does not constitute investment advice. Investors should conduct their own thorough analysis and consult a financial advisor before making any investment decision.</p>
          <p>Management fees are an important factor to consider, as they directly impact the investor's net performance.</p>
        </section>
        </div>
        )}

        {/* Vue Tableau */}
        {viewMode === 'table' && (
          <div className="table-view">
            <div className="comparison-table-container">
              <table className="topflop-comparison-table">
                <thead>
                  <tr>
                    <th className="metric-header">Criteria</th>
                    <th className="top-header" colSpan={3}>
                      <div className="header-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                          <polyline points="17 6 23 6 23 12" />
                        </svg>
                        Top-3 Funds
                      </div>
                    </th>
                    <th className="flop-header" colSpan={3}>
                      <div className="header-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                          <polyline points="17 18 23 18 23 12" />
                        </svg>
                        Flop-3 Funds
                      </div>
                    </th>
                  </tr>
                  <tr className="sub-header">
                    <th></th>
                    {topFlopOpcvmsData?.top_performers.map((opcvm, idx) => (
                      <th key={idx} className="top-col">#{idx + 1}</th>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((opcvm, idx) => (
                      <th key={idx} className="flop-col">#{idx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric-label">Fund Name</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell font-weight-600">{topOpcvm.opcvm.intitule}</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell font-weight-600">{worstOpcvm.opcvm.intitule}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Management Company</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">{typeof topOpcvm.opcvm.sgo == 'string' ? topOpcvm.opcvm.sgo : "--" }</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">{typeof worstOpcvm.opcvm.sgo == 'string' ? worstOpcvm.opcvm.sgo : "--"}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Approval Year</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">{topOpcvm.opcvm.date_agrement?.toString()}</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">{worstOpcvm.opcvm.date_agrement?.toString()}</td>
                    ))}
                  </tr>
                  <tr className="highlight-row">
                    <td className="metric-label">Performance</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">
                        <span className="performance-value positive">+{topOpcvm.performance.toFixed(4)}%</span>
                      </td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">
                        <span className={`performance-value ${worstOpcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                          {worstOpcvm.performance >= 0 ? '+' : ''}{worstOpcvm.performance.toFixed(4)}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Benchmark</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell small-text">{topOpcvm.opcvm.indice_description}</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell small-text">{worstOpcvm.opcvm.indice_description}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Volatility</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">{topOpcvm.volatility}%</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">{worstOpcvm.volatility}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Risk Level</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">
                        <span className={`risk-badge risk-${topOpcvm.opcvm.niveau_risque}`}>{topOpcvm.opcvm.niveau_risque ?? "--"}</span>
                      </td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">
                        <span className={`risk-badge risk-${worstOpcvm.opcvm.niveau_risque}`}>{worstOpcvm.opcvm.niveau_risque ?? "--"}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Management Fees</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">{topOpcvm.opcvm.max_gestion}%</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">{worstOpcvm.opcvm.max_gestion}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Subscription Fees</td>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <td key={idx} className="top-cell">{topOpcvm.opcvm.max_souscription}</td>
                    ))}
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <td key={idx} className="flop-cell">{worstOpcvm.opcvm.max_souscription}</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Disclaimer compact pour table view */}
            <div className="table-disclaimer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Disclaimer:</strong> Past performance does not guarantee future results. This report does not constitute investment advice.
              </p>
            </div>
          </div>
        )}

        {/* Vue Graphiques */}
        {viewMode === 'charts' && (
          <div className="charts-view">
            <div className="charts-grid">
              {/* Top-3 Chart */}
              <div className="chart-section top-section">
                <div className="chart-header">
                  <div className="chart-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h3>Top-3 Funds Performance</h3>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item legend-header">
                      <span></span>
                      <span>Fund</span>
                      <span>SGO</span>
                      <span>Sharpe 1Y</span>
                      <span>Volatility</span>
                      <span>Performance</span>
                    </div>
                    {topFlopOpcvmsData?.top_performers.map((topOpcvm, idx) => (
                      <div key={idx} className="legend-item">
                        <span className={`legend-color top-${idx + 1}`}></span>
                        <span className="legend-label">{topOpcvm.opcvm.intitule}</span>
                        <span className="legend-meta">{formatSgo(topOpcvm.opcvm.sgo)}</span>
                        <span className="legend-meta">{formatMetric(topOpcvm.opcvm.latest_metrics?.sharpe_ratio_1y)}</span>
                        <span className="legend-meta">{formatMetric(topOpcvm.volatility, 4, '%')}</span>
                        <span className="legend-value positive">+{topOpcvm.performance.toFixed(4)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-wrapper">
                  <MultiLineChart
                    series={topFlopOpcvmsData?.top_performers.map((worstOpcvm, idx) => ({
                      name: worstOpcvm.opcvm.intitule,
                      data: worstOpcvm.metrics || [],
                      color: idx === 0 ? '#10b981' : idx === 1 ? '#34d399' : '#6ee7b7'
                    })) || []}
                    type="top"
                  />
                </div>
              </div>

              {/* Flop-3 Chart */}
              <div className="chart-section flop-section">
                <div className="chart-header">
                  <div className="chart-title">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      <polyline points="17 18 23 18 23 12" />
                    </svg>
                    <h3>Flop-3 Funds Performance</h3>
                  </div>
                  <div className="chart-legend">
                    <div className="legend-item legend-header">
                      <span></span>
                      <span>Fund</span>
                      <span>SGO</span>
                      <span>Sharpe 1Y</span>
                      <span>Volatility</span>
                      <span>Performance</span>
                    </div>
                    {topFlopOpcvmsData?.worst_performers.map((worstOpcvm, idx) => (
                      <div key={idx} className="legend-item">
                        <span className={`legend-color flop-${idx + 1}`}></span>
                        <span className="legend-label">{worstOpcvm.opcvm.intitule}</span>
                        <span className="legend-meta">{formatSgo(worstOpcvm.opcvm.sgo)}</span>
                        <span className="legend-meta">{formatMetric(worstOpcvm.opcvm.latest_metrics?.sharpe_ratio_1y)}</span>
                        <span className="legend-meta">{formatMetric(worstOpcvm.volatility, 4, '%')}</span>
                        <span className={`legend-value ${worstOpcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                          {worstOpcvm.performance >= 0 ? '+' : ''}{worstOpcvm.performance.toFixed(4)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-wrapper">
                  <MultiLineChart
                    series={topFlopOpcvmsData?.worst_performers.map((topOpcvm, idx) => ({
                      name: topOpcvm.opcvm.intitule,
                      data: topOpcvm.metrics || [],
                      color: idx === 0 ? '#ef4444' : idx === 1 ? '#f87171' : '#fca5a5'
                    })) || []}
                    type="flop"
                  />
                </div>
              </div>
            </div>

            {/* Disclaimer compact pour charts view */}
            <div className="charts-disclaimer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>
                <strong>Disclaimer:</strong> Past performance does not guarantee future results. This report does not constitute investment advice.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
