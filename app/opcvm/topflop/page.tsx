'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MultiLineChart from '@/components/opcvm/MultiLineChart';
import { Candle } from '@/core/data/TechnicalAnalysis';

// Types
type OPCVM = {
  id: string;
  name: string;
  manager: string;
  approvalYear: number;
  strategy: string;
  performance: number;
  benchmark: string;
  benchmarkPerformance: number;
  volatility: number;
  riskLevel: 'Low' | 'Moderate' | 'High';
  managementFees: number;
  feesLevel: 'Low' | 'Medium' | 'High';
  successFactors?: string[];
  underperformanceFactors?: string[];
  historicalData?: Candle[];
};

type Exchange = 'BRVM' | 'JSE' | 'NGX' | 'NSE' | 'CSE' | 'GSE';
type ViewMode = 'detailed' | 'table' | 'charts';

export default function OPCVMComparisonReportPage() {
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('BRVM');
  const [startDate, setStartDate] = useState('2024-01-01');
  const [endDate, setEndDate] = useState('2024-11-30');
  const [viewMode, setViewMode] = useState<ViewMode>('charts');
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    '/images/screener-header-3.jpg',
    '/images/exchanges-header-2.jpg',
    '/images/exchanges-header-1.jpg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  // Generate mock historical data for charts
  const generateHistoricalData = (basePrice: number, trend: 'up' | 'down'): Candle[] => {
    const data: Candle[] = [];
    const days = 90;
    let price = basePrice;
    const startDateObj = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const date = new Date(startDateObj);
      date.setDate(date.getDate() + i);
      
      const volatility = 0.02;
      const trendFactor = trend === 'up' ? 0.001 : -0.001;
      
      const open = price;
      const change = price * (Math.random() * volatility - volatility / 2 + trendFactor);
      const close = price + change;
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 1000000) + 500000;

      data.push({
        date: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume,
      });

      price = close;
    }

    return data;
  };

  // Mock data - To be replaced with real API data
  const mockTopOPCVM: OPCVM[] = [
    {
      id: '1',
      name: 'NSIA Ivory Coast Equity',
      manager: 'NSIA Banque',
      approvalYear: 2015,
      strategy: 'Equity fund investing primarily in large-cap stocks on the BRVM, with an active management approach aimed at outperforming the BRVM Composite index. The fund favors the banking, telecommunications, and distribution sectors.',
      performance: 18.3,
      benchmark: 'BRVM Composite',
      benchmarkPerformance: 12.5,
      volatility: 12.5,
      riskLevel: 'High',
      managementFees: 1.5,
      feesLevel: 'Medium',
      historicalData: generateHistoricalData(1000, 'up'),
      successFactors: [
        'Excellent stock selection in the banking sector which experienced strong growth',
        'Opportune overweighting of the telecommunications sector',
        'Effective active management with well-timed arbitrage',
        'Good geographic diversification within the WAEMU zone'
      ]
    },
    {
      id: '2',
      name: 'Coris Dynamic Equity',
      manager: 'Coris Asset Management',
      approvalYear: 2018,
      strategy: 'Dynamic equity fund investing in growth stocks on the BRVM. Momentum approach with active sector rotation.',
      performance: 16.8,
      benchmark: 'BRVM Composite',
      benchmarkPerformance: 12.5,
      volatility: 14.2,
      riskLevel: 'High',
      managementFees: 1.8,
      feesLevel: 'High',
      historicalData: generateHistoricalData(950, 'up'),
      successFactors: [
        'Momentum strategy well-suited to the bullish market context',
        'Effective sector rotation towards performing sectors',
        'Significant exposure to growth stocks',
        'Optimized entry and exit timing'
      ]
    },
    {
      id: '3',
      name: 'BOA Growth Plus',
      manager: 'BOA Capital',
      approvalYear: 2016,
      strategy: 'Flexible mixed fund with dynamic allocation between equities (60-80%) and bonds (20-40%). Value management with focus on undervalued securities.',
      performance: 14.5,
      benchmark: 'BRVM Composite 70% + BRVM Bonds 30%',
      benchmarkPerformance: 10.8,
      volatility: 9.8,
      riskLevel: 'Moderate',
      managementFees: 1.2,
      feesLevel: 'Low',
      historicalData: generateHistoricalData(900, 'up'),
      successFactors: [
        'Optimal asset allocation with equity overweighting at the right time',
        'Selection of value stocks that experienced revaluation',
        'Competitive management fees maximizing net performance',
        'Good risk management with effective diversification'
      ]
    }
  ];

  const mockFlopOPCVM: OPCVM[] = [
    {
      id: '4',
      name: 'Atlantique Emerging Equity',
      manager: 'Atlantique Asset Management',
      approvalYear: 2017,
      strategy: 'Equity fund investing in small and mid-cap stocks on the BRVM, with a long-term growth approach.',
      performance: -3.2,
      benchmark: 'BRVM Composite',
      benchmarkPerformance: 12.5,
      volatility: 18.5,
      riskLevel: 'High',
      managementFees: 2.0,
      feesLevel: 'High',
      historicalData: generateHistoricalData(1000, 'down'),
      underperformanceFactors: [
        'Overexposure to small caps that underperformed',
        'Excessive concentration on struggling sectors',
        'High management fees impacting net performance',
        'Lack of liquidity on certain positions'
      ]
    },
    {
      id: '5',
      name: 'Sahel Short-Term Bonds',
      manager: 'Sahel Finance',
      approvalYear: 2019,
      strategy: 'Bond fund investing in short-term debt securities (maturity < 3 years) issued by States and companies in the WAEMU zone.',
      performance: 2.1,
      benchmark: 'BRVM Bonds',
      benchmarkPerformance: 5.8,
      volatility: 3.2,
      riskLevel: 'Low',
      managementFees: 0.8,
      feesLevel: 'Low',
      historicalData: generateHistoricalData(980, 'down'),
      underperformanceFactors: [
        'Underweighting of government bonds that performed well',
        'Exposure to corporate issuers that experienced difficulties',
        'Duration too short in a declining rate environment',
        'Lack of reactivity in portfolio adjustment'
      ]
    },
    {
      id: '6',
      name: 'Ecobank Balanced',
      manager: 'Ecobank Asset Management',
      approvalYear: 2014,
      strategy: 'Balanced mixed fund with fixed 50% equity / 50% bonds allocation. Passive management replicating benchmark indices.',
      performance: 4.8,
      benchmark: 'BRVM Composite 50% + BRVM Bonds 50%',
      benchmarkPerformance: 9.2,
      volatility: 7.5,
      riskLevel: 'Moderate',
      managementFees: 1.0,
      feesLevel: 'Medium',
      historicalData: generateHistoricalData(950, 'down'),
      underperformanceFactors: [
        'Passive management unsuited to a market requiring arbitrage',
        'Fixed allocation preventing from taking advantage of opportunities',
        'Imperfect replication of benchmark indices',
        'High transaction costs impacting tracking error'
      ]
    }
  ];

  return (
    <div className="comparison-report-page">
      {/* Header */}
      <div className="report-header">
        <div 
          className="report-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
          }}
        >
          <div className="header-content">
            <div className="header-title">
              <h1>Funds Comparison Report</h1>
              <p>Comparative analysis of Top-3 and Flop-3 UCITS by exchange</p>
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
                This report aims to provide investors with a periodic comparative analysis of six Undertakings for Collective Investment in Transferable Securities (UCITS) listed on the <strong>{selectedExchange}</strong>. We have selected the three UCITS with the best performance ("Top-3") and the three with the lowest performance ("Flop-3") over the period from <strong>{new Date(startDate).toLocaleDateString('en-US')}</strong> to <strong>{new Date(endDate).toLocaleDateString('en-US')}</strong>.
              </p>
              <p>
                The analysis will focus on their performance, management fees, and main investment strategies, to help investors better understand the factors of success and underperformance, and to inform their investment decisions.
              </p>
            </section>

        {/* Méthodologie */}
        <section className="report-section methodology">
          <h2>Methodology</h2>
          <p>
            The selection of UCITS was based on the <strong>total net return</strong> over the analyzed period. Information regarding management fees and investment strategies was extracted from Key Investor Information Documents (KIID), prospectuses, and publicly available periodic reports.
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
            <h2>Detailed Analysis of Top-3 UCITS</h2>
          </div>

          <div className="opcvm-cards">
            {mockTopOPCVM.map((opcvm, index) => (
              <div key={opcvm.id} className="opcvm-card top-card">
                <div className="card-header">
                  <div className="rank-badge top-rank">#{index + 1}</div>
                  <h3>{opcvm.name}</h3>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">Management Company:</span>
                    <span className="info-value">{opcvm.manager}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Approval Year:</span>
                    <span className="info-value">{opcvm.approvalYear}</span>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Main Investment Strategy</h4>
                  <p>{opcvm.strategy}</p>
                </div>

                <div className="card-section">
                  <h4>Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Return</span>
                      <span className="metric-value positive">+{opcvm.performance}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Benchmark</span>
                      <span className="metric-value">{opcvm.benchmark}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Benchmark Performance</span>
                      <span className="metric-value">+{opcvm.benchmarkPerformance}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{opcvm.volatility}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Risk Level</span>
                      <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                    </div>
                  </div>
                  <p className="performance-text">
                    With a return of <strong>+{opcvm.performance}%</strong> over the period, this fund significantly outperformed its benchmark (<strong>{opcvm.benchmark}</strong> at <strong>+{opcvm.benchmarkPerformance}%</strong>). Its volatility of <strong>{opcvm.volatility}%</strong> suggests a <strong>{opcvm.riskLevel.toLowerCase()}</strong> risk level compared to its category.
                  </p>
                </div>

                <div className="card-section">
                  <h4>Management Fees</h4>
                  <p>
                    Annual management fees amount to <strong>{opcvm.managementFees}%</strong>, which is in a <strong>{opcvm.feesLevel.toLowerCase()}</strong> range compared to its category.
                  </p>
                </div>

                {opcvm.successFactors && (
                  <div className="card-section">
                    <h4>Potential Success Factors</h4>
                    <ul className="factors-list">
                      {opcvm.successFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
            <h2>Detailed Analysis of Flop-3 UCITS</h2>
          </div>

          <div className="opcvm-cards">
            {mockFlopOPCVM.map((opcvm, index) => (
              <div key={opcvm.id} className="opcvm-card flop-card">
                <div className="card-header">
                  <div className="rank-badge flop-rank">#{index + 1}</div>
                  <h3>{opcvm.name}</h3>
                </div>

                <div className="card-info">
                  <div className="info-row">
                    <span className="info-label">Management Company:</span>
                    <span className="info-value">{opcvm.manager}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Approval Year:</span>
                    <span className="info-value">{opcvm.approvalYear}</span>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Main Investment Strategy</h4>
                  <p>{opcvm.strategy}</p>
                </div>

                <div className="card-section">
                  <h4>Performance</h4>
                  <div className="performance-metrics">
                    <div className="metric-item">
                      <span className="metric-label">Return</span>
                      <span className={`metric-value ${opcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                        {opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Benchmark</span>
                      <span className="metric-value">{opcvm.benchmark}</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Benchmark Performance</span>
                      <span className="metric-value">+{opcvm.benchmarkPerformance}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Volatility</span>
                      <span className="metric-value">{opcvm.volatility}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Risk Level</span>
                      <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                    </div>
                  </div>
                  <p className="performance-text">
                    With a return of <strong>{opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%</strong> over the period, this fund significantly underperformed its benchmark (<strong>{opcvm.benchmark}</strong> at <strong>+{opcvm.benchmarkPerformance}%</strong>). Its volatility of <strong>{opcvm.volatility}%</strong> suggests a <strong>{opcvm.riskLevel.toLowerCase()}</strong> risk level.
                  </p>
                </div>

                <div className="card-section">
                  <h4>Management Fees</h4>
                  <p>
                    Annual management fees amount to <strong>{opcvm.managementFees}%</strong>, which is in a <strong>{opcvm.feesLevel.toLowerCase()}</strong> range compared to its category.
                  </p>
                </div>

                {opcvm.underperformanceFactors && (
                  <div className="card-section">
                    <h4>Potential Underperformance Factors</h4>
                    <ul className="factors-list">
                      {opcvm.underperformanceFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
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
              <p>
                <strong>Past performance does not guarantee future results.</strong> This report is based on historical data and does not constitute investment advice. Investors should conduct their own thorough analysis and consult a financial advisor before making any investment decision.
              </p>
              <p>
                Management fees are an important factor to consider, as they directly impact the investor's net performance.
              </p>
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
                        Top-3 OPCVM
                      </div>
                    </th>
                    <th className="flop-header" colSpan={3}>
                      <div className="header-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                          <polyline points="17 18 23 18 23 12" />
                        </svg>
                        Flop-3 OPCVM
                      </div>
                    </th>
                  </tr>
                  <tr className="sub-header">
                    <th></th>
                    {mockTopOPCVM.map((opcvm, idx) => (
                      <th key={opcvm.id} className="top-col">#{idx + 1}</th>
                    ))}
                    {mockFlopOPCVM.map((opcvm, idx) => (
                      <th key={opcvm.id} className="flop-col">#{idx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric-label">Fund Name</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell font-weight-600">{opcvm.name}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell font-weight-600">{opcvm.name}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Management Company</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.manager}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.manager}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Approval Year</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.approvalYear}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.approvalYear}</td>
                    ))}
                  </tr>
                  <tr className="highlight-row">
                    <td className="metric-label">Performance</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">
                        <span className="performance-value positive">+{opcvm.performance}%</span>
                      </td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">
                        <span className={`performance-value ${opcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                          {opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Benchmark</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell small-text">{opcvm.benchmark}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell small-text">{opcvm.benchmark}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Benchmark Performance</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">+{opcvm.benchmarkPerformance}%</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">+{opcvm.benchmarkPerformance}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Volatility</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.volatility}%</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.volatility}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Risk Level</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">
                        <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                      </td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">
                        <span className={`risk-badge risk-${opcvm.riskLevel.toLowerCase()}`}>{opcvm.riskLevel}</span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Management Fees</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.managementFees}%</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.managementFees}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Fees Level</td>
                    {mockTopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="top-cell">{opcvm.feesLevel}</td>
                    ))}
                    {mockFlopOPCVM.map(opcvm => (
                      <td key={opcvm.id} className="flop-cell">{opcvm.feesLevel}</td>
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
                    <h3>Top-3 UCITS Performance</h3>
                  </div>
                  <div className="chart-legend">
                    {mockTopOPCVM.map((opcvm, idx) => (
                      <div key={opcvm.id} className="legend-item">
                        <span className={`legend-color top-${idx + 1}`}></span>
                        <span className="legend-label">{opcvm.name}</span>
                        <span className="legend-value positive">+{opcvm.performance}%</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-wrapper">
                  <MultiLineChart
                    series={mockTopOPCVM.map((opcvm, idx) => ({
                      name: opcvm.name,
                      data: opcvm.historicalData || [],
                      color: idx === 0 ? '#10b981' : idx === 1 ? '#34d399' : '#6ee7b7'
                    }))}
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
                    <h3>Flop-3 UCITS Performance</h3>
                  </div>
                  <div className="chart-legend">
                    {mockFlopOPCVM.map((opcvm, idx) => (
                      <div key={opcvm.id} className="legend-item">
                        <span className={`legend-color flop-${idx + 1}`}></span>
                        <span className="legend-label">{opcvm.name}</span>
                        <span className={`legend-value ${opcvm.performance >= 0 ? 'positive' : 'negative'}`}>
                          {opcvm.performance >= 0 ? '+' : ''}{opcvm.performance}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chart-wrapper">
                  <MultiLineChart
                    series={mockFlopOPCVM.map((opcvm, idx) => ({
                      name: opcvm.name,
                      data: opcvm.historicalData || [],
                      color: idx === 0 ? '#ef4444' : idx === 1 ? '#f87171' : '#fca5a5'
                    }))}
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
