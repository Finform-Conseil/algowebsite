'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MultiSelect from '@/components/corporate-events/MultiSelect';

type ViewType = 'overview' | 'bond-info' | 'coupon' | 'syndication-stats' | 'upcoming-syndication';

type FinancialBond = {
  id: string;
  isin: string;
  country: string;
  bondType: string;
  outstandingAmount: number;
  issuePrice: number;
  nominal: number;
  marketPrice: number;
  spread: number;
  ytm: number;
  grossCoupon: number;
  maturityDate: string;
  residualDuration: number;
  upcomingESV: string;
  issuePeriod: string;
  valueDate: string;
  redemptionType: 'In fine' | 'AC' | 'ACD';
  deferredPeriod: string;
  esvDate: string;
  couponType: string;
  netCoupon: number;
  couponFrequency: string;
  previousCouponDate: string;
  nextCouponDate: string;
  daysToNextCoupon: number;
  accruedCoupon: number;
  netInterestCoupon: number;
  requestedAmount: number;
  retainedSubmissions: number;
  retainedCoverageRatio: number;
  participantCount: number;
  submissionCount: number;
  maturity: string;
  simultaneous: string;
  amount: number;
  interestRate: number;
  price: number;
  infoNote: string;
  market: string;
  compartment: string;
};

type FilterState = {
  search: string;
  countries: string[];
  markets: string[];
  compartments: string[];
  bondTypes: string[];
  ytmRange: [number, number];
  couponRange: [number, number];
  durationRange: [number, number];
};

const getCountryFlag = (country: string): string => {
  const flags: { [key: string]: string } = {
    'Côte d\'Ivoire': '🇨🇮',
    'Senegal': '🇸🇳',
    'Benin': '🇧🇯',
    'Burkina Faso': '🇧🇫',
    'Mali': '🇲🇱',
    'Niger': '🇳🇪',
    'Togo': '🇹🇬',
    'Guinea-Bissau': '🇬🇼',
    'Nigeria': '🇳🇬',
    'Ghana': '🇬🇭',
    'Kenya': '🇰🇪',
    'South Africa': '🇿🇦',
  };
  return flags[country] || '🏳️';
};

export default function FinancialPrimaryScreenerPage() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedBonds, setSelectedBonds] = useState<string[]>([]);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    countries: [],
    markets: [],
    compartments: [],
    bondTypes: [],
    ytmRange: [0, 20],
    couponRange: [0, 15],
    durationRange: [0, 30],
  });

  const mockBonds: FinancialBond[] = [
    {
      id: '1',
      isin: 'CIBRVM001',
      country: 'Côte d\'Ivoire',
      bondType: 'Corporate Bond',
      outstandingAmount: 50000000000,
      issuePrice: 98.5,
      nominal: 10000,
      marketPrice: 99.2,
      spread: 2.5,
      ytm: 7.8,
      grossCoupon: 6.5,
      maturityDate: '2028-12-31',
      residualDuration: 4.2,
      upcomingESV: 'ESV 2025-Q2',
      issuePeriod: '2024-01-15',
      valueDate: '2024-01-20',
      redemptionType: 'In fine',
      deferredPeriod: '0',
      esvDate: '2025-06-15',
      couponType: 'Fixed',
      netCoupon: 5.85,
      couponFrequency: 'Semi-annual',
      previousCouponDate: '2024-06-15',
      nextCouponDate: '2024-12-15',
      daysToNextCoupon: 45,
      accruedCoupon: 2.1,
      netInterestCoupon: 292.5,
      requestedAmount: 40000000000,
      retainedSubmissions: 50000000000,
      retainedCoverageRatio: 1.25,
      participantCount: 15,
      submissionCount: 28,
      maturity: '5 years',
      simultaneous: 'No',
      amount: 50000000000,
      interestRate: 6.5,
      price: 98.5,
      infoNote: 'Available',
      market: 'BRVM',
      compartment: 'Corporate',
    },
    {
      id: '2',
      isin: 'SNBRVM002',
      country: 'Senegal',
      bondType: 'Treasury Bond',
      outstandingAmount: 75000000000,
      issuePrice: 99.0,
      nominal: 10000,
      marketPrice: 100.5,
      spread: 1.8,
      ytm: 6.2,
      grossCoupon: 5.5,
      maturityDate: '2030-06-30',
      residualDuration: 5.5,
      upcomingESV: 'ESV 2025-Q1',
      issuePeriod: '2024-02-10',
      valueDate: '2024-02-15',
      redemptionType: 'AC',
      deferredPeriod: '1 year',
      esvDate: '2025-03-20',
      couponType: 'Fixed',
      netCoupon: 4.95,
      couponFrequency: 'Annual',
      previousCouponDate: '2024-02-15',
      nextCouponDate: '2025-02-15',
      daysToNextCoupon: 120,
      accruedCoupon: 3.5,
      netInterestCoupon: 495.0,
      requestedAmount: 60000000000,
      retainedSubmissions: 75000000000,
      retainedCoverageRatio: 1.25,
      participantCount: 22,
      submissionCount: 45,
      maturity: '7 years',
      simultaneous: 'Yes',
      amount: 75000000000,
      interestRate: 5.5,
      price: 99.0,
      infoNote: 'Available',
      market: 'BRVM',
      compartment: 'Government',
    },
    {
      id: '3',
      isin: 'BJBRVM003',
      country: 'Benin',
      bondType: 'Municipal Bond',
      outstandingAmount: 30000000000,
      issuePrice: 97.8,
      nominal: 10000,
      marketPrice: 98.5,
      spread: 3.2,
      ytm: 8.5,
      grossCoupon: 7.0,
      maturityDate: '2027-09-30',
      residualDuration: 3.0,
      upcomingESV: 'ESV 2025-Q3',
      issuePeriod: '2024-03-01',
      valueDate: '2024-03-05',
      redemptionType: 'ACD',
      deferredPeriod: '0',
      esvDate: '2025-09-10',
      couponType: 'Variable',
      netCoupon: 6.3,
      couponFrequency: 'Quarterly',
      previousCouponDate: '2024-09-01',
      nextCouponDate: '2024-12-01',
      daysToNextCoupon: 30,
      accruedCoupon: 1.75,
      netInterestCoupon: 157.5,
      requestedAmount: 25000000000,
      retainedSubmissions: 30000000000,
      retainedCoverageRatio: 1.2,
      participantCount: 12,
      submissionCount: 20,
      maturity: '3 years',
      simultaneous: 'No',
      amount: 30000000000,
      interestRate: 7.0,
      price: 97.8,
      infoNote: 'Available',
      market: 'BRVM',
      compartment: 'Municipal',
    },
  ];

  const filteredBonds = useMemo(() => {
    return mockBonds.filter(bond => {
      if (filters.search && !bond.isin.toLowerCase().includes(filters.search.toLowerCase()) &&
          !bond.country.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.countries.length > 0 && !filters.countries.includes(bond.country)) {
        return false;
      }
      if (filters.markets.length > 0 && !filters.markets.includes(bond.market)) {
        return false;
      }
      if (filters.compartments.length > 0 && !filters.compartments.includes(bond.compartment)) {
        return false;
      }
      if (filters.bondTypes.length > 0 && !filters.bondTypes.includes(bond.bondType)) {
        return false;
      }
      if (bond.ytm < filters.ytmRange[0] || bond.ytm > filters.ytmRange[1]) {
        return false;
      }
      if (bond.grossCoupon < filters.couponRange[0] || bond.grossCoupon > filters.couponRange[1]) {
        return false;
      }
      if (bond.residualDuration < filters.durationRange[0] || bond.residualDuration > filters.durationRange[1]) {
        return false;
      }
      return true;
    });
  }, [mockBonds, filters]);

  const insights = useMemo(() => {
    if (filteredBonds.length === 0) return [];
    
    const avgYTM = filteredBonds.reduce((sum, b) => sum + b.ytm, 0) / filteredBonds.length;
    const avgSpread = filteredBonds.reduce((sum, b) => sum + b.spread, 0) / filteredBonds.length;
    const totalOutstanding = filteredBonds.reduce((sum, b) => sum + b.outstandingAmount, 0);
    
    return [
      {
        type: 'info',
        text: `${filteredBonds.length} financial bonds available on primary market`
      },
      {
        type: avgYTM > 7.0 ? 'positive' : 'neutral',
        text: `Average YTM: ${avgYTM.toFixed(2)}%`
      },
      {
        type: 'info',
        text: `Average spread: ${avgSpread.toFixed(2)}%`
      },
      {
        type: 'positive',
        text: `Total outstanding: ${(totalOutstanding / 1000000000).toFixed(1)}B XOF`
      },
    ];
  }, [filteredBonds]);

  const handleToggleBondSelection = (bondId: string) => {
    setSelectedBonds(prev => 
      prev.includes(bondId) 
        ? prev.filter(id => id !== bondId)
        : [...prev, bondId]
    );
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      countries: [],
      markets: [],
      compartments: [],
      bondTypes: [],
      ytmRange: [0, 20],
      couponRange: [0, 15],
      durationRange: [0, 30],
    });
  };

  const countryOptions = Array.from(new Set(mockBonds.map(b => b.country)));
  const marketOptions = Array.from(new Set(mockBonds.map(b => b.market)));
  const compartmentOptions = Array.from(new Set(mockBonds.map(b => b.compartment)));
  const bondTypeOptions = Array.from(new Set(mockBonds.map(b => b.bondType)));

  return (
    <div className="mtp-screener-page">
      <div className="screener-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/fixed-income">Fixed Income</Link>
        <span>/</span>
        <span>Financial Primary Market Screener</span>
      </div>

      <div className="screener-header">
        <div className="header-top">
          <div className="header-title">
            <h1>Financial Primary Market Screener</h1>
            <p>Explore and analyze financial bonds on the primary market</p>
          </div>
          
          <div className="header-actions">
            <button className="btn-secondary" onClick={handleResetFilters}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M3 21v-5h5" />
              </svg>
              Reset
            </button>
            <button className="btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Save
            </button>
            <button className="btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="screener-main">
        <div className="screener-controls">
          <div className="search-section">
            <div className="search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by ISIN or Country..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div className="main-filters">
            <div className='multi-selects'>
              <MultiSelect
                label="Country/Zone"
                options={countryOptions.map(c => ({ value: c, label: c }))}
                selected={filters.countries}
                onChange={(countries) => setFilters(prev => ({ ...prev, countries }))}
                placeholder="All countries"
              />

              <MultiSelect
                label="Market"
                options={marketOptions.map(m => ({ value: m, label: m }))}
                selected={filters.markets}
                onChange={(markets) => setFilters(prev => ({ ...prev, markets }))}
                placeholder="All markets"
              />

              <MultiSelect
                label="Compartment"
                options={compartmentOptions.map(c => ({ value: c, label: c }))}
                selected={filters.compartments}
                onChange={(compartments) => setFilters(prev => ({ ...prev, compartments }))}
                placeholder="All compartments"
              />

              <MultiSelect
                label="Bond Type"
                options={bondTypeOptions.map(t => ({ value: t, label: t }))}
                selected={filters.bondTypes}
                onChange={(bondTypes) => setFilters(prev => ({ ...prev, bondTypes }))}
                placeholder="All types"
              />
            </div>
          

            <button 
              className="btn-advanced-filters"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Advanced Filters
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
          
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-group">
              <label>YTM Range (%)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  value={filters.ytmRange[0]}
                  onChange={(e) => setFilters({ ...filters, ytmRange: [Number(e.target.value), filters.ytmRange[1]] })}
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  value={filters.ytmRange[1]}
                  onChange={(e) => setFilters({ ...filters, ytmRange: [filters.ytmRange[0], Number(e.target.value)] })}
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Coupon Range (%)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  value={filters.couponRange[0]}
                  onChange={(e) => setFilters({ ...filters, couponRange: [Number(e.target.value), filters.couponRange[1]] })}
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  value={filters.couponRange[1]}
                  onChange={(e) => setFilters({ ...filters, couponRange: [filters.couponRange[0], Number(e.target.value)] })}
                  placeholder="Max"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Duration Range (Years)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  value={filters.durationRange[0]}
                  onChange={(e) => setFilters({ ...filters, durationRange: [Number(e.target.value), filters.durationRange[1]] })}
                  placeholder="Min"
                />
                <span>to</span>
                <input
                  type="number"
                  value={filters.durationRange[1]}
                  onChange={(e) => setFilters({ ...filters, durationRange: [filters.durationRange[0], Number(e.target.value)] })}
                  placeholder="Max"
                />
              </div>
            </div>
          </div>
        )}

        <div className="tabs-and-export">
          <div className="view-tabs">
            <button
              className={activeView === 'overview' ? 'active' : ''}
              onClick={() => setActiveView('overview')}
            >
              Overview
            </button>
            <button
              className={activeView === 'bond-info' ? 'active' : ''}
              onClick={() => setActiveView('bond-info')}
            >
              Bond Info
            </button>
            <button
              className={activeView === 'coupon' ? 'active' : ''}
              onClick={() => setActiveView('coupon')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              Coupons
            </button>
            <button
              className={activeView === 'syndication-stats' ? 'active' : ''}
              onClick={() => setActiveView('syndication-stats')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
              Syndication Statistics
            </button>
            <button
              className={activeView === 'upcoming-syndication' ? 'active' : ''}
              onClick={() => setActiveView('upcoming-syndication')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Upcoming Syndication
            </button>
          </div>
          <div className="table-info-bar">
            <span className="results-count">{filteredBonds.length} bonds found</span>
            {selectedBonds.length > 0 && (
              <span className="selected-count">{selectedBonds.length} selected</span>
            )}
            <button className="btn-secondary btn-export">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export
            </button>
          </div>
        </div>


        <div className="data-section">
          {activeView === 'overview' && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input type="checkbox" />
                    </th>
                    <th>ISIN</th>
                    <th>Country</th>
                    <th>Bond Type</th>
                    <th className="number-col">Outstanding Amount</th>
                    <th className="number-col">Issue Price (%)</th>
                    <th className="number-col">Nominal</th>
                    <th className="number-col">Market Price (%)</th>
                    <th className="number-col">Spread (%)</th>
                    <th className="number-col">YTM (%)</th>
                    <th className="number-col">Gross Coupon (%)</th>
                    <th>Maturity Date</th>
                    <th className="number-col">Residual Duration</th>
                    <th>Upcoming ESV</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map(bond => (
                    <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedBonds.includes(bond.id)}
                          onChange={() => handleToggleBondSelection(bond.id)}
                        />
                      </td>
                      <td className="isin-col">
                        <Link href={`/fixed-income/bond-detail/financial-primary/${bond.isin}`} className="isin-link">
                          {bond.isin}
                        </Link>
                      </td>
                      <td>
                        <span className="country-cell">
                          <span className="country-flag">{getCountryFlag(bond.country)}</span>
                          {bond.country}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-bond-type">{bond.bondType}</span>
                      </td>
                      <td className="number-col">{(bond.outstandingAmount / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{bond.issuePrice.toFixed(2)}</td>
                      <td className="number-col">{bond.nominal.toLocaleString()}</td>
                      <td className="number-col">{bond.marketPrice.toFixed(2)}</td>
                      <td className={`number-col ${bond.spread >= 0 ? 'positive' : 'negative'}`}>
                        {bond.spread.toFixed(2)}
                      </td>
                      <td className="number-col">{bond.ytm.toFixed(2)}</td>
                      <td className="number-col">{bond.grossCoupon.toFixed(2)}</td>
                      <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                      <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                      <td>
                        <span className="badge badge-ost">{bond.upcomingESV}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'bond-info' && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-col"><input type="checkbox" /></th>
                    <th>ISIN</th>
                    <th>Country</th>
                    <th>Bond Type</th>
                    <th className="number-col">Residual Duration</th>
                    <th className="number-col">YTM (%)</th>
                    <th className="number-col">Nominal</th>
                    <th>Issue Period</th>
                    <th>Value Date</th>
                    <th>Maturity Date</th>
                    <th>Redemption</th>
                    <th>Deferred</th>
                    <th>Upcoming ESV</th>
                    <th>ESV Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map(bond => (
                    <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                      <td className="checkbox-col">
                        <input type="checkbox" checked={selectedBonds.includes(bond.id)} onChange={() => handleToggleBondSelection(bond.id)} />
                      </td>
                      <td className="isin-col">
                        <Link href={`/fixed-income/bond-detail/financial-primary/${bond.isin}`} className="isin-link">
                          {bond.isin}
                        </Link>
                      </td>
                      <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                      <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                      <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                      <td className="number-col">{bond.ytm.toFixed(2)}</td>
                      <td className="number-col">{bond.nominal.toLocaleString()}</td>
                      <td>{new Date(bond.issuePeriod).toLocaleDateString('en-US')}</td>
                      <td>{new Date(bond.valueDate).toLocaleDateString('en-US')}</td>
                      <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                      <td><span className="badge badge-redemption">{bond.redemptionType}</span></td>
                      <td>{bond.deferredPeriod}</td>
                      <td><span className="badge badge-ost">{bond.upcomingESV}</span></td>
                      <td>{new Date(bond.esvDate).toLocaleDateString('en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'coupon' && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-col"><input type="checkbox" /></th>
                    <th>ISIN</th>
                    <th>Country</th>
                    <th>Coupon Type</th>
                    <th className="number-col">Gross Coupon (%)</th>
                    <th className="number-col">Net Coupon (%)</th>
                    <th>Frequency</th>
                    <th>Previous Coupon Date</th>
                    <th>Next Coupon Date</th>
                    <th className="number-col">Days to Next Coupon</th>
                    <th className="number-col">Accrued Coupon</th>
                    <th className="number-col">Net Interest Coupon</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map(bond => (
                    <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                      <td className="checkbox-col">
                        <input type="checkbox" checked={selectedBonds.includes(bond.id)} onChange={() => handleToggleBondSelection(bond.id)} />
                      </td>
                      <td className="isin-col">
                        <Link href={`/fixed-income/bond-detail/financial-primary/${bond.isin}`} className="isin-link">
                          {bond.isin}
                        </Link>
                      </td>
                      <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                      <td><span className="badge badge-coupon-type">{bond.couponType}</span></td>
                      <td className="number-col">{bond.grossCoupon.toFixed(2)}</td>
                      <td className="number-col">{bond.netCoupon.toFixed(2)}</td>
                      <td>{bond.couponFrequency}</td>
                      <td>{new Date(bond.previousCouponDate).toLocaleDateString('en-US')}</td>
                      <td>{new Date(bond.nextCouponDate).toLocaleDateString('en-US')}</td>
                      <td className="number-col">{bond.daysToNextCoupon}</td>
                      <td className="number-col">{bond.accruedCoupon.toFixed(2)}</td>
                      <td className="number-col">{bond.netInterestCoupon.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'syndication-stats' && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-col"><input type="checkbox" /></th>
                    <th>ISIN</th>
                    <th>Country</th>
                    <th>Bond Type</th>
                    <th className="number-col">Requested Amount</th>
                    <th className="number-col">Retained Submissions</th>
                    <th className="number-col">Coverage Ratio</th>
                    <th className="number-col">Issue Price (%)</th>
                    <th className="number-col">Participants</th>
                    <th className="number-col">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map(bond => (
                    <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                      <td className="checkbox-col">
                        <input type="checkbox" checked={selectedBonds.includes(bond.id)} onChange={() => handleToggleBondSelection(bond.id)} />
                      </td>
                      <td className="isin-col">
                        <Link href={`/fixed-income/bond-detail/financial-primary/${bond.isin}`} className="isin-link">
                          {bond.isin}
                        </Link>
                      </td>
                      <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                      <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                      <td className="number-col">{(bond.requestedAmount / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{(bond.retainedSubmissions / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{bond.retainedCoverageRatio.toFixed(2)}x</td>
                      <td className="number-col">{bond.issuePrice.toFixed(2)}</td>
                      <td className="number-col">{bond.participantCount}</td>
                      <td className="number-col">{bond.submissionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'upcoming-syndication' && (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="checkbox-col"><input type="checkbox" /></th>
                    <th>ISIN</th>
                    <th>Country</th>
                    <th>Bond Type</th>
                    <th>Maturity</th>
                    <th>Issue Period</th>
                    <th>Value Date</th>
                    <th>Maturity Date</th>
                    <th>Simultaneous</th>
                    <th className="number-col">Amount</th>
                    <th className="number-col">Interest Rate (%)</th>
                    <th>Frequency</th>
                    <th>Redemption</th>
                    <th>Deferred</th>
                    <th className="number-col">Price (%)</th>
                    <th>Info Note</th>
                    <th className="actions-col">Invest</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBonds.map(bond => (
                    <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                      <td className="checkbox-col">
                        <input type="checkbox" checked={selectedBonds.includes(bond.id)} onChange={() => handleToggleBondSelection(bond.id)} />
                      </td>
                      <td className="isin-col">
                        <Link href={`/fixed-income/bond-detail/financial-primary/${bond.isin}`} className="isin-link">
                          {bond.isin}
                        </Link>
                      </td>
                      <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                      <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                      <td>{bond.maturity}</td>
                      <td>{new Date(bond.issuePeriod).toLocaleDateString('en-US')}</td>
                      <td>{new Date(bond.valueDate).toLocaleDateString('en-US')}</td>
                      <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                      <td>{bond.simultaneous}</td>
                      <td className="number-col">{(bond.amount / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{bond.interestRate.toFixed(2)}</td>
                      <td>{bond.couponFrequency}</td>
                      <td><span className="badge badge-redemption">{bond.redemptionType}</span></td>
                      <td>{bond.deferredPeriod}</td>
                      <td className="number-col">{bond.price.toFixed(2)}</td>
                      <td><span className="badge badge-info">{bond.infoNote}</span></td>
                      <td className="actions-col">
                        <button className="btn-action btn-invest">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <button
        className={`floating-insights-btn ${showInsights ? 'open' : ''}`}
        onClick={() => setShowInsights(!showInsights)}
        title="Automatic insights"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {insights.length > 0 && <span className="insights-badge">{insights.length}</span>}
      </button>

      {showInsights && (
        <div className="floating-insights-panel">
          <div className="floating-insights-panel__header">
            <h4>Automatic Insights</h4>
            <button onClick={() => setShowInsights(false)} className="close-btn">✕</button>
          </div>
          <div className="floating-insights-panel__body">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`floating-insight floating-insight--${insight.type}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="floating-insight__icon">
                  {insight.type === 'positive' && '✓'}
                  {insight.type === 'info' && 'i'}
                  {insight.type === 'warning' && '⚠'}
                  {insight.type === 'neutral' && '•'}
                </div>
                <div className="floating-insight__text">{insight.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
