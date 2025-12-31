'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import MultiSelect from '@/components/corporate-events/MultiSelect';

type BondType = 'financial-primary' | 'financial-secondary' | 'mtp-secondary' | 'mtp-primary';
type AnalysisType = 'price' | 'spread' | 'yield';
type Timeframe = '1M' | '3M' | '6M' | '1Y';

type AmortizationRow = {
  maturity: string;
  nominalValue: number;
  periodStart: string;
  grossInterest: number;
  irvm: number;
  netInterest: number;
  capitalRepaid: number;
  totalAnnuity: number;
  periodEnd: string;
};

export default function BondDetailPage() {
  const params = useParams();
  const bondType = params.type as BondType;
  const isin = params.isin as string;

  const [analysisType, setAnalysisType] = useState<AnalysisType>('price');
  const [timeframe, setTimeframe] = useState<Timeframe>('6M');
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['Yield', 'Spread']);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [showAmortizationModal, setShowAmortizationModal] = useState(false);
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);

  // Mock bond data based on type
  const bondData = useMemo(() => {
    if (bondType === 'financial-primary') {
      return {
        isin: isin || 'CIBRVM001',
        name: 'Côte d\'Ivoire 6.5% 2028',
        issuer: 'Republic of Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Corporate Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 6.5,
        couponFrequency: 'Semi-annual',
        issueDate: '2024-01-15',
        valueDate: '2024-01-20',
        maturityDate: '2028-12-31',
        issuePrice: 98.5,
        currentPrice: 99.2,
        ytm: 7.8,
        spread: 2.5,
        duration: 4.2,
        convexity: 18.5,
        redemptionType: 'In fine',
        dayCount: '30/360',
        settlement: 'T+2',
        outstanding: 50000000000,
        minSubscription: 10000,
      };
    } else if (bondType === 'financial-secondary') {
      return {
        isin: isin || 'CIBRVM101',
        name: 'Côte d\'Ivoire 6.5% 2028',
        issuer: 'Republic of Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Corporate Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 6.5,
        currentPrice: 99.5,
        previousPrice: 98.8,
        yield: 7.8,
        previousYield: 7.5,
        spread: 1.7,
        tradedVolume: 15000000,
        tradedValue: 14925000000,
        exchangeRatio: 0.85,
        transactionCount: 12,
        maturityDate: '2028-01-15',
      };
    } else if (bondType === 'mtp-secondary') {
      return {
        isin: isin || 'TPCI0001',
        name: 'Trésor Public CI 5.5% 2027',
        issuer: 'Trésor Public de Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Treasury Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 5.5,
        currentPrice: 100.2,
        yield: 5.3,
        spread: 1.2,
        tradedVolume: 25000000,
        exchangeRatio: 0.92,
        transactionCount: 18,
        maturityDate: '2027-06-30',
      };
    } else {
      return {
        isin: isin || 'TPCI0002',
        name: 'Trésor Public CI 6.0% 2026',
        issuer: 'Trésor Public de Côte d\'Ivoire',
        country: 'Côte d\'Ivoire',
        bondType: 'Treasury Bond',
        currency: 'XOF',
        nominal: 10000,
        coupon: 6.0,
        issuePrice: 99.0,
        avgYield: 6.2,
        marginalPrice: 98.8,
        absorptionRate: 85.5,
        participantCount: 22,
        submissionCount: 45,
        coverageRatio: 1.25,
        maturityDate: '2026-12-15',
      };
    }
  }, [bondType, isin]);

  // Mock time series data with more variation
  const generateTimeSeriesData = (type: AnalysisType, tf: Timeframe) => {
    const points = tf === '1M' ? 30 : tf === '3M' ? 90 : tf === '6M' ? 180 : 365;
    const baseValue = type === 'price' ? 99 : type === 'spread' ? 2.0 : 7.5;
    const volatility = type === 'price' ? 2.5 : type === 'spread' ? 0.8 : 1.2;
    
    let currentValue = baseValue;
    const trend = (Math.random() - 0.5) * 0.02;
    
    return Array.from({ length: points }, (_, i) => {
      const noise = (Math.random() - 0.5) * volatility;
      const cyclical = Math.sin(i / (points / 8)) * volatility * 0.3;
      currentValue = currentValue * (1 + trend) + noise + cyclical;
      currentValue = Math.max(baseValue * 0.85, Math.min(baseValue * 1.15, currentValue));
      
      return {
        date: new Date(Date.now() - (points - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        value: currentValue,
      };
    });
  };

  const timeSeriesData = useMemo(() => 
    generateTimeSeriesData(analysisType, timeframe),
    [analysisType, timeframe]
  );

  // Mock amortization schedule for financial primary
  const amortizationSchedule: AmortizationRow[] = [
    {
      maturity: '2025-06-30',
      nominalValue: 10000,
      periodStart: '2024-12-31',
      grossInterest: 325,
      irvm: 6,
      netInterest: 305.5,
      capitalRepaid: 0,
      totalAnnuity: 325,
      periodEnd: '2025-06-30',
    },
    {
      maturity: '2025-12-31',
      nominalValue: 10000,
      periodStart: '2025-06-30',
      grossInterest: 325,
      irvm: 6,
      netInterest: 305.5,
      capitalRepaid: 0,
      totalAnnuity: 325,
      periodEnd: '2025-12-31',
    },
    {
      maturity: '2026-06-30',
      nominalValue: 10000,
      periodStart: '2025-12-31',
      grossInterest: 325,
      irvm: 6,
      netInterest: 305.5,
      capitalRepaid: 0,
      totalAnnuity: 325,
      periodEnd: '2026-06-30',
    },
    {
      maturity: '2028-12-31',
      nominalValue: 10000,
      periodStart: '2028-06-30',
      grossInterest: 325,
      irvm: 6,
      netInterest: 305.5,
      capitalRepaid: 10000,
      totalAnnuity: 10325,
      periodEnd: '2028-12-31',
    },
  ];

  const getCountryFlag = (country: string): string => {
    const flags: { [key: string]: string } = {
      'Côte d\'Ivoire': '🇨🇮',
      'Senegal': '🇸🇳',
      'Benin': '🇧🇯',
    };
    return flags[country] || '🏳️';
  };

  const chartColors = ['#4A90E2', '#5BA3F5', '#6BB6FF', '#7EC8FF', '#91D5FF', '#A4E2FF', '#B7EFFF', '#CAF0FF'];

  return (
    <div className="bond-detail-page">
      <div className="bond-detail-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/fixed-income">Fixed Income</Link>
        <span>/</span>
        <Link href={`/fixed-income/${bondType === 'financial-primary' ? 'financial-primary-screener' : bondType === 'financial-secondary' ? 'financial-secondary-screener' : bondType === 'mtp-secondary' ? 'mtp-secondary-screener' : 'mtp-screener'}`}>
          {bondType === 'financial-primary' ? 'Financial Primary' : bondType === 'financial-secondary' ? 'Financial Secondary' : bondType === 'mtp-secondary' ? 'MTP Secondary' : 'MTP Primary'}
        </Link>
        <span>/</span>
        <span>{bondData.isin}</span>
      </div>

      <div className="bond-detail-header">
        <div className="bond-title-section">
          <div className="title-row">
            <h1>
              <span className="country-flag">{getCountryFlag(bondData.country)}</span>
              {bondData.name}
            </h1>
            <div className="bond-meta">
              <span className="badge badge-isin">{bondData.isin}</span>
              <span className="badge badge-type">{bondData.bondType}</span>
            </div>
          </div>
          <div className="key-metrics">
            {bondData.currentPrice && <div className="metric"><span>Price:</span> <strong>{bondData.currentPrice.toFixed(2)}%</strong></div>}
            {bondData.ytm && <div className="metric"><span>YTM:</span> <strong>{bondData.ytm.toFixed(2)}%</strong></div>}
            {bondData.yield && <div className="metric"><span>Yield:</span> <strong>{bondData.yield.toFixed(2)}%</strong></div>}
            {bondData.spread && <div className="metric"><span>Spread:</span> <strong>{bondData.spread.toFixed(2)}%</strong></div>}
            <div className="metric"><span>Maturity:</span> <strong>{new Date(bondData.maturityDate).toLocaleDateString('en-US')}</strong></div>
          </div>
        </div>
      </div>

      <div className="bond-detail-content">
        <div className="detail-tabs">
          <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </button>
          <button className={activeTab === 'charts' ? 'active' : ''} onClick={() => setActiveTab('charts')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            Charts
          </button>
          {(bondType === 'financial-secondary' || bondType === 'mtp-secondary') && (
            <button className={activeTab === 'analysis' ? 'active' : ''} onClick={() => setActiveTab('analysis')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Analysis
            </button>
          )}
          {bondType === 'financial-primary' && (
            <button className={activeTab === 'amortization' ? 'active' : ''} onClick={() => setActiveTab('amortization')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
              Amortization
            </button>
          )}
          {bondType === 'mtp-primary' && (
            <button className={activeTab === 'historical' ? 'active' : ''} onClick={() => setActiveTab('historical')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Historical
            </button>
          )}
        </div>

        <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
          <div className="info-card">
            <h3>Bond Information</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">ISIN</span>
                <span className="info-value">{bondData.isin}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Currency</span>
                <span className="info-value">{bondData.currency}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Nominal</span>
                <span className="info-value">{bondData.nominal?.toLocaleString()} {bondData.currency}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Coupon</span>
                <span className="info-value">{bondData.coupon}%</span>
              </div>
              {bondData.couponFrequency && (
                <div className="info-item">
                  <span className="info-label">Frequency</span>
                  <span className="info-value">{bondData.couponFrequency}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Maturity</span>
                <span className="info-value">{new Date(bondData.maturityDate).toLocaleDateString('en-US')}</span>
              </div>
              {bondData.issueDate && (
                <div className="info-item">
                  <span className="info-label">Issue Date</span>
                  <span className="info-value">{new Date(bondData.issueDate).toLocaleDateString('en-US')}</span>
                </div>
              )}
              {bondData.currentPrice && (
                <div className="info-item">
                  <span className="info-label">Current Price</span>
                  <span className="info-value">{bondData.currentPrice.toFixed(2)}%</span>
                </div>
              )}
              {bondData.ytm && (
                <div className="info-item">
                  <span className="info-label">YTM</span>
                  <span className="info-value">{bondData.ytm.toFixed(2)}%</span>
                </div>
              )}
              {bondData.spread && (
                <div className="info-item">
                  <span className="info-label">Spread</span>
                  <span className="info-value">{bondData.spread.toFixed(2)}%</span>
                </div>
              )}
            </div>
          </div>

          {(bondType === 'financial-primary' || bondType === 'mtp-primary') && bondData.duration && (
            <div className="info-card">
              <h3>Risk Metrics</h3>
              <div className="info-items">
                <div className="info-item">
                  <span className="info-label">Duration</span>
                  <span className="info-value">{bondData.duration.toFixed(2)} years</span>
                </div>
                {bondData.convexity && (
                  <div className="info-item">
                    <span className="info-label">Convexity</span>
                    <span className="info-value">{bondData.convexity.toFixed(2)}</span>
                  </div>
                )}
                {bondData.redemptionType && (
                  <div className="info-item">
                    <span className="info-label">Redemption</span>
                    <span className="info-value">{bondData.redemptionType}</span>
                  </div>
                )}
                {bondData.dayCount && (
                  <div className="info-item">
                    <span className="info-label">Day Count</span>
                    <span className="info-value">{bondData.dayCount}</span>
                  </div>
                )}
                {bondData.settlement && (
                  <div className="info-item">
                    <span className="info-label">Settlement</span>
                    <span className="info-value">{bondData.settlement}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {(bondType === 'financial-secondary' || bondType === 'mtp-secondary') && (
            <div className="info-card">
              <h3>Trading Information</h3>
              <div className="info-items">
                {bondData.tradedVolume && (
                  <div className="info-item">
                    <span className="info-label">Traded Volume</span>
                    <span className="info-value">{(bondData.tradedVolume / 1000000).toFixed(1)}M</span>
                  </div>
                )}
                {bondData.tradedValue && (
                  <div className="info-item">
                    <span className="info-label">Traded Value</span>
                    <span className="info-value">{(bondData.tradedValue / 1000000000).toFixed(2)}B XOF</span>
                  </div>
                )}
                {bondData.exchangeRatio && (
                  <div className="info-item">
                    <span className="info-label">Exchange Ratio</span>
                    <span className="info-value">{(bondData.exchangeRatio * 100).toFixed(1)}%</span>
                  </div>
                )}
                {bondData.transactionCount && (
                  <div className="info-item">
                    <span className="info-label">Transactions</span>
                    <span className="info-value">{bondData.transactionCount}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {bondType === 'mtp-primary' && (
            <div className="info-card">
              <h3>Auction Statistics</h3>
              <div className="info-items">
                {bondData.absorptionRate && (
                  <div className="info-item">
                    <span className="info-label">Absorption Rate</span>
                    <span className="info-value">{bondData.absorptionRate.toFixed(2)}%</span>
                  </div>
                )}
                {bondData.avgYield && (
                  <div className="info-item">
                    <span className="info-label">Avg Yield</span>
                    <span className="info-value">{bondData.avgYield.toFixed(2)}%</span>
                  </div>
                )}
                {bondData.marginalPrice && (
                  <div className="info-item">
                    <span className="info-label">Marginal Price</span>
                    <span className="info-value">{bondData.marginalPrice.toFixed(2)}%</span>
                  </div>
                )}
                {bondData.participantCount && (
                  <div className="info-item">
                    <span className="info-label">Participants</span>
                    <span className="info-value">{bondData.participantCount}</span>
                  </div>
                )}
                {bondData.submissionCount && (
                  <div className="info-item">
                    <span className="info-label">Submissions</span>
                    <span className="info-value">{bondData.submissionCount}</span>
                  </div>
                )}
                {bondData.coverageRatio && (
                  <div className="info-item">
                    <span className="info-label">Coverage Ratio</span>
                    <span className="info-value">{bondData.coverageRatio.toFixed(2)}x</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="info-card">
            <h3>Market Information</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Listing Place</span>
                <span className="info-value">BRVM</span>
              </div>
              <div className="info-item">
                <span className="info-label">Market Type</span>
                <span className="info-value">{bondType.includes('primary') ? 'Primary Market' : 'Secondary Market'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Settlement Calendar</span>
                <span className="info-value">T+2</span>
              </div>
              <div className="info-item">
                <span className="info-label">Trading Status</span>
                <span className="info-value">Active</span>
              </div>
              <div className="info-item">
                <span className="info-label">Quotation Type</span>
                <span className="info-value">Clean Price</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Issuer Details</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Issuer</span>
                <span className="info-value">{bondData.issuer}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Country</span>
                <span className="info-value">{getCountryFlag(bondData.country)} {bondData.country}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Issuer Type</span>
                <span className="info-value">Sovereign</span>
              </div>
              <div className="info-item">
                <span className="info-label">Credit Rating</span>
                <span className="info-value">B+ (S&P)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Sector</span>
                <span className="info-value">Government</span>
              </div>
            </div>
          </div>

          <div className="info-card">
            <h3>Financial Characteristics</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Issue Price</span>
                <span className="info-value">100.00%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Accrued Interest</span>
                <span className="info-value">{(bondData.coupon / 365 * 30).toFixed(2)} {bondData.currency}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Dirty Price</span>
                <span className="info-value">{bondData.currentPrice ? (bondData.currentPrice + (bondData.coupon / 365 * 30)).toFixed(2) : 'N/A'}%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Min. Denomination</span>
                <span className="info-value">10,000 {bondData.currency}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Outstanding Amount</span>
                <span className="info-value">{bondData.nominal ? (bondData.nominal / 1000000000).toFixed(2) : '50.00'}B {bondData.currency}</span>
              </div>
            </div>
          </div>

          {(bondType === 'financial-secondary' || bondType === 'mtp-secondary') && (
            <div className="info-card">
              <h3>Performance Metrics</h3>
              <div className="info-items">
                <div className="info-item">
                  <span className="info-label">52-Week High</span>
                  <span className="info-value">{bondData.currentPrice ? (bondData.currentPrice * 1.05).toFixed(2) : '104.25'}%</span>
                </div>
                <div className="info-item">
                  <span className="info-label">52-Week Low</span>
                  <span className="info-value">{bondData.currentPrice ? (bondData.currentPrice * 0.95).toFixed(2) : '94.50'}%</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Avg Daily Volume</span>
                  <span className="info-value">{bondData.tradedVolume ? (bondData.tradedVolume / 30 / 1000000).toFixed(1) : '2.5'}M</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Trade Date</span>
                  <span className="info-value">{new Date().toLocaleDateString('en-US')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Bid-Ask Spread</span>
                  <span className="info-value">0.15%</span>
                </div>
              </div>
            </div>
          )}

          <div className="info-card">
            <h3>Legal & Regulatory</h3>
            <div className="info-items">
              <div className="info-item">
                <span className="info-label">Governing Law</span>
                <span className="info-value">OHADA</span>
              </div>
              <div className="info-item">
                <span className="info-label">Paying Agent</span>
                <span className="info-value">BCEAO</span>
              </div>
              <div className="info-item">
                <span className="info-label">Taxation</span>
                <span className="info-value">Withholding Tax 6%</span>
              </div>
              <div className="info-item">
                <span className="info-label">Callable</span>
                <span className="info-value">No</span>
              </div>
              <div className="info-item">
                <span className="info-label">Puttable</span>
                <span className="info-value">No</span>
              </div>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'charts' && (
          <div className="charts-container">
            <div className="chart-section">
          <div className="chart-controls">
            <div className="control-group">
              <label>Analysis Type</label>
              <div className="button-group">
                <button 
                  className={analysisType === 'price' ? 'active' : ''}
                  onClick={() => setAnalysisType('price')}
                >
                  Price
                </button>
                <button 
                  className={analysisType === 'spread' ? 'active' : ''}
                  onClick={() => setAnalysisType('spread')}
                >
                  Spread
                </button>
                <button 
                  className={analysisType === 'yield' ? 'active' : ''}
                  onClick={() => setAnalysisType('yield')}
                >
                  Yield
                </button>
              </div>
            </div>
            <div className="control-group">
              <label>Timeframe</label>
              <div className="button-group">
                <button 
                  className={timeframe === '1M' ? 'active' : ''}
                  onClick={() => setTimeframe('1M')}
                >
                  1M
                </button>
                <button 
                  className={timeframe === '3M' ? 'active' : ''}
                  onClick={() => setTimeframe('3M')}
                >
                  3M
                </button>
                <button 
                  className={timeframe === '6M' ? 'active' : ''}
                  onClick={() => setTimeframe('6M')}
                >
                  6M
                </button>
                <button 
                  className={timeframe === '1Y' ? 'active' : ''}
                  onClick={() => setTimeframe('1Y')}
                >
                  1Y
                </button>
              </div>
            </div>
          </div>
          <div className="chart-wrapper">
            <LineChart
              data={{
                categories: timeSeriesData.map(d => d.date),
                series: [{
                  name: analysisType === 'price' ? 'Price (%)' : analysisType === 'spread' ? 'Spread (%)' : 'Yield (%)',
                  values: timeSeriesData.map(d => d.value),
                  color: chartColors[0]
                }]
              }}
              height="100%"
            />
          </div>
        </div>

        {bondType === 'financial-primary' && (
          <div className="chart-section">
            <h3>Reference Price & Average Yield Evolution</h3>
            <LineChart
              data={{
                categories: timeSeriesData.slice(0, 180).map(d => d.date),
                series: [
                  {
                    name: 'Reference Price (%)',
                    values: timeSeriesData.slice(0, 180).map(d => 98 + Math.random() * 2),
                    color: chartColors[0]
                  },
                  {
                    name: 'Average Yield (%)',
                    values: timeSeriesData.slice(0, 180).map(d => 7 + Math.random() * 1),
                    color: chartColors[1]
                  }
                ]
              }}
              height="100%"
            />
          </div>
        )}

          </div>
        )}

        {activeTab === 'amortization' && bondType === 'financial-primary' && (
          <div className="tab-section">
            <div className="amortization-section">
              <h3>Amortization Schedule</h3>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Maturity</th>
                      <th className="number-col">Nominal Value</th>
                      <th>Period Start</th>
                      <th className="number-col">Gross Interest</th>
                      <th className="number-col">IRVM (%)</th>
                      <th className="number-col">Net Interest</th>
                      <th className="number-col">Capital Repaid</th>
                      <th className="number-col">Total Annuity</th>
                      <th>Period End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {amortizationSchedule.map((row, index) => (
                      <tr key={index}>
                        <td>{new Date(row.maturity).toLocaleDateString('en-US')}</td>
                        <td className="number-col">{row.nominalValue.toLocaleString()}</td>
                        <td>{new Date(row.periodStart).toLocaleDateString('en-US')}</td>
                        <td className="number-col">{row.grossInterest.toFixed(2)}</td>
                        <td className="number-col">{row.irvm}</td>
                        <td className="number-col">{row.netInterest.toFixed(2)}</td>
                        <td className="number-col">{row.capitalRepaid.toLocaleString()}</td>
                        <td className="number-col">{row.totalAnnuity.toLocaleString()}</td>
                        <td>{new Date(row.periodEnd).toLocaleDateString('en-US')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'charts' && (bondType === 'financial-secondary' || bondType === 'mtp-secondary' || bondType === 'mtp-primary') && (
          <>
            <div className="chart-section">
              <h3>Statistics Over Time</h3>
              <BarChart
                data={{
                  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                  values: bondType === 'mtp-primary' 
                    ? [85.2, 87.5, 82.3, 88.1, 86.7, 85.5]
                    : [15, 18, 22, 19, 25, 21]
                }}
                title={bondType === 'mtp-primary' ? 'Absorption Rate (%)' : 'Transaction Volume (M)'}
                height="100%"
                color={chartColors[2]}
              />
            </div>

            <div className="chart-section">
              <h3>Reference Price & Average Yield</h3>
              <LineChart
                data={{
                  categories: timeSeriesData.slice(0, 180).map(d => d.date),
                  series: [
                    {
                      name: 'Reference Price (%)',
                      values: timeSeriesData.slice(0, 180).map(d => 98 + Math.random() * 2),
                      color: chartColors[0]
                    },
                    {
                      name: 'Average Yield (%)',
                      values: timeSeriesData.slice(0, 180).map(d => 7 + Math.random() * 1),
                      color: chartColors[1]
                    }
                  ]
                }}
                height="100%"
              />
            </div>
          </>
        )}

        {activeTab === 'analysis' && (bondType === 'financial-secondary' || bondType === 'mtp-secondary') && (
          <div className="tab-section">
            <div className="analysis-section">
            <div className="analysis-header">
              <h3>Multi-Attribute Analysis</h3>
              <MultiSelect
                label=""
                options={bondType === 'financial-secondary' 
                  ? ['Yield', 'Spread', 'Volume', 'Low Yield', 'Low Price', 'High Yield', 'High Price', 'Closing Price', 'Closing Yield', 'Opening Yield', 'Opening Price', 'Number Traded', 'Weighted Average Closing Prices']
                  : ['Price', 'Spread', 'Quantity', 'Yield', 'Exchange Ratio', 'Transaction Count', 'Global Volume', 'Nominal Volume']
                }
                selected={selectedAttributes}
                onChange={setSelectedAttributes}
                placeholder="Select attributes"
              />
            </div>
            <LineChart
              data={{
                categories: timeSeriesData.slice(0, 90).map(d => d.date),
                series: selectedAttributes.map((attr, index) => ({
                  name: attr,
                  values: timeSeriesData.slice(0, 90).map(() => 50 + Math.random() * 50 + index * 10),
                  color: chartColors[index % chartColors.length]
                }))
              }}
              height="100%"
            />
            </div>
          </div>
        )}

        {activeTab === 'historical' && bondType === 'mtp-primary' && (
          <div className="tab-section">
            <div className="historical-section">
            <h3>Auction Details & Historical Operations</h3>
            <div className="historical-grid">
              <div className="historical-card">
                <h4>Identification & Issue Details</h4>
                <div className="info-items">
                  <div className="info-item">
                    <span className="info-label">Nature du Titre</span>
                    <span className="info-value">Obligation du Trésor</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type d'émission</span>
                    <span className="info-value">Adjudication</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Montant global mis en adjudication</span>
                    <span className="info-value">{bondData.nominal ? (bondData.nominal / 1000000000).toFixed(2) : '50.00'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date d'adjudication</span>
                    <span className="info-value">{bondData.issueDate ? new Date(bondData.issueDate).toLocaleDateString('fr-FR') : '15/06/2024'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date de valeur</span>
                    <span className="info-value">{bondData.issueDate ? new Date(new Date(bondData.issueDate).getTime() + 2*24*60*60*1000).toLocaleDateString('fr-FR') : '17/06/2024'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Code ISIN</span>
                    <span className="info-value">{bondData.isin}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Dénomination de l'émission</span>
                    <span className="info-value">{bondData.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Adjudication No</span>
                    <span className="info-value">ADJ-2024-{Math.floor(Math.random() * 100)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Durée</span>
                    <span className="info-value">{Math.floor((new Date(bondData.maturityDate).getTime() - new Date(bondData.issueDate || Date.now()).getTime()) / (365*24*60*60*1000))} ans</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date d'échéance</span>
                    <span className="info-value">{new Date(bondData.maturityDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Valeur nominale unitaire</span>
                    <span className="info-value">10,000 {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux d'intérêt fixe annoncé</span>
                    <span className="info-value">{bondData.coupon}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux coupon couru</span>
                    <span className="info-value">{(bondData.coupon / 365 * 30).toFixed(4)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Devise</span>
                    <span className="info-value">{bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Émetteur</span>
                    <span className="info-value">{bondData.issuer}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Place de cotation</span>
                    <span className="info-value">BRVM</span>
                  </div>
                </div>
              </div>

              <div className="historical-card">
                <h4>Submission Statistics</h4>
                <div className="info-items">
                  <div className="info-item">
                    <span className="info-label">Montant global des soumissions</span>
                    <span className="info-value">{bondData.nominal ? ((bondData.nominal * (bondData.coverageRatio || 1.25)) / 1000000000).toFixed(2) : '62.50'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Soumissions retenues</span>
                    <span className="info-value">{bondData.nominal ? (bondData.nominal / 1000000000).toFixed(2) : '50.00'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Soumissions rejetées</span>
                    <span className="info-value">{bondData.nominal ? (((bondData.nominal * (bondData.coverageRatio || 1.25)) - bondData.nominal) / 1000000000).toFixed(2) : '12.50'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux de couverture (soumissions)</span>
                    <span className="info-value">{((bondData.coverageRatio || 1.25) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux de couverture (retenues)</span>
                    <span className="info-value">100.00%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux d'absorption</span>
                    <span className="info-value">{bondData.absorptionRate?.toFixed(2) || '85.50'}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Nombre de participants</span>
                    <span className="info-value">{bondData.participantCount || 22}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Nombre de soumissions</span>
                    <span className="info-value">{bondData.submissionCount || 45}</span>
                  </div>
                </div>
              </div>

              <div className="historical-card">
                <h4>Auction Results</h4>
                <div className="info-items">
                  <div className="info-item">
                    <span className="info-label">Nombre de participants</span>
                    <span className="info-value">{bondData.participantCount || 22}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Nombre de soumissions</span>
                    <span className="info-value">{bondData.submissionCount || 45}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Montant global des soumissions</span>
                    <span className="info-value">{bondData.nominal ? ((bondData.nominal * (bondData.coverageRatio || 1.25)) / 1000000000).toFixed(2) : '62.50'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Soumissions retenues</span>
                    <span className="info-value">{bondData.nominal ? (bondData.nominal / 1000000000).toFixed(2) : '50.00'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Soumissions rejetées</span>
                    <span className="info-value">{bondData.nominal ? (((bondData.nominal * (bondData.coverageRatio || 1.25)) - bondData.nominal) / 1000000000).toFixed(2) : '12.50'}B {bondData.currency}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux d'absorption</span>
                    <span className="info-value">{bondData.absorptionRate?.toFixed(2) || '85.50'}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux/Prix marginal</span>
                    <span className="info-value">{bondData.marginalPrice?.toFixed(2) || '98.80'}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Taux/Prix moyen pondéré</span>
                    <span className="info-value">{bondData.currentPrice?.toFixed(2) || '99.15'}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Rendement moyen pondéré</span>
                    <span className="info-value">{bondData.avgYield?.toFixed(2) || '7.35'}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Day Count</span>
                    <span className="info-value">30/360</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Issue Date</span>
                    <span className="info-value">{new Date(bondData.issueDate || '').toLocaleDateString('en-US')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Maturity Date</span>
                    <span className="info-value">{new Date(bondData.maturityDate).toLocaleDateString('en-US')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Issue Price</span>
                    <span className="info-value">{bondData.issuePrice}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Redemption</span>
                    <span className="info-value">In fine</span>
                  </div>
                </div>
              </div>

              <div className="historical-card">
                <h4>C. Settlement & Market Conventions</h4>
                <div className="info-items">
                  <div className="info-item">
                    <span className="info-label">Clean Price</span>
                    <span className="info-value">{bondData.issuePrice}%</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Accrued Interest</span>
                    <span className="info-value">Calculated daily</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Coverage Ratio</span>
                    <span className="info-value">{bondData.coverageRatio?.toFixed(2) || '1.25'}x</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="submissions-table-section">
                <h4>Country-wise Submission Breakdown</h4>
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Lieu de soumission</th>
                        <th className="number-col">Montant proposé</th>
                        <th className="number-col">Montant retenu</th>
                        <th className="number-col">Taux de rétention</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>🇧🇯 Bénin</td>
                        <td className="number-col">12.5B {bondData.currency}</td>
                        <td className="number-col">10.0B {bondData.currency}</td>
                        <td className="number-col">80.0%</td>
                      </tr>
                      <tr>
                        <td>🇹🇬 Togo</td>
                        <td className="number-col">8.3B {bondData.currency}</td>
                        <td className="number-col">7.5B {bondData.currency}</td>
                        <td className="number-col">90.4%</td>
                      </tr>
                      <tr>
                        <td>🇨🇮 Côte d'Ivoire</td>
                        <td className="number-col">18.7B {bondData.currency}</td>
                        <td className="number-col">15.0B {bondData.currency}</td>
                        <td className="number-col">80.2%</td>
                      </tr>
                      <tr>
                        <td>🇲🇱 Mali</td>
                        <td className="number-col">6.2B {bondData.currency}</td>
                        <td className="number-col">5.0B {bondData.currency}</td>
                        <td className="number-col">80.6%</td>
                      </tr>
                      <tr>
                        <td>🇸🇳 Sénégal</td>
                        <td className="number-col">10.5B {bondData.currency}</td>
                        <td className="number-col">8.5B {bondData.currency}</td>
                        <td className="number-col">81.0%</td>
                      </tr>
                      <tr>
                        <td>🇧🇫 Burkina Faso</td>
                        <td className="number-col">4.3B {bondData.currency}</td>
                        <td className="number-col">3.0B {bondData.currency}</td>
                        <td className="number-col">69.8%</td>
                      </tr>
                      <tr>
                        <td>🇳🇪 Niger</td>
                        <td className="number-col">2.0B {bondData.currency}</td>
                        <td className="number-col">1.0B {bondData.currency}</td>
                        <td className="number-col">50.0%</td>
                      </tr>
                      <tr className="total-row">
                        <td><strong>Total</strong></td>
                        <td className="number-col"><strong>62.5B {bondData.currency}</strong></td>
                        <td className="number-col"><strong>50.0B {bondData.currency}</strong></td>
                        <td className="number-col"><strong>80.0%</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="operations-timeline">
                <h4>Operations Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">2024-06-15</div>
                      <div className="timeline-title">Auction Completed</div>
                      <div className="timeline-details">Amount Issued: 50B XOF | Participants: 22 | Absorption Rate: 85.5%</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">2024-06-10</div>
                      <div className="timeline-title">Subscription Period Closed</div>
                      <div className="timeline-details">Total Submissions: 45 | Total Amount: 62.5B XOF | Coverage: 125%</div>
                    </div>
                  </div>
                  <div className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <div className="timeline-date">2024-06-01</div>
                      <div className="timeline-title">Subscription Period Opened</div>
                      <div className="timeline-details">Target Amount: 50B XOF | Duration: 10 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
