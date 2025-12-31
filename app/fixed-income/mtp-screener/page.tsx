'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MultiSelect from '@/components/corporate-events/MultiSelect';

type ViewType = 'overview' | 'bond-info' | 'coupon' | 'emission-stats' | 'upcoming-emissions';

type Bond = {
  id: string;
  isin: string;
  country: string;
  bondType: string;
  outstandingAmount: number;
  issuePrice: number;
  marketPrice: number;
  spread: number;
  ytm: number;
  couponRate: number;
  maturityDate: string;
  residualDuration: number;
  upcomingOST: string;
  issueDate: string;
  valueDate: string;
  redemptionType: 'In fine' | 'AC' | 'ACD';
  nominal: number;
  ostDate: string;
  couponType: string;
  couponFrequency: string;
  previousCouponDate: string;
  nextCouponDate: string;
  daysToNextCoupon: number;
  accruedCoupon: number;
  requestedAmount: number;
  totalSubmissions: number;
  submissionCoverageRatio: number;
  retainedSubmissions: number;
  retainedCoverageRatio: number;
  absorptionRate: number;
  weightedAvgPrice: number;
  marginalPrice: number;
  avgYield: number;
  participantCount: number;
  submissionCount: number;
  maturity: string;
  yieldRate: number;
  operationType: string;
  simultaneous: string;
  amount: number;
  interestRate: number;
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

export default function MTPScreenerPage() {
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

  const mockBonds: Bond[] = useMemo(() => [
    {
      id: '1',
      isin: 'CITP0001234',
      country: 'Côte d\'Ivoire',
      bondType: 'Treasury Bond',
      outstandingAmount: 50000000000,
      issuePrice: 98.5,
      marketPrice: 99.2,
      spread: 2.5,
      ytm: 6.8,
      couponRate: 6.5,
      maturityDate: '2028-12-15',
      residualDuration: 4.2,
      upcomingOST: 'Buyback',
      issueDate: '2023-12-15',
      valueDate: '2023-12-20',
      redemptionType: 'In fine',
      nominal: 10000,
      ostDate: '2024-06-15',
      couponType: 'Fixed',
      couponFrequency: 'Semi-annual',
      previousCouponDate: '2024-06-15',
      nextCouponDate: '2024-12-15',
      daysToNextCoupon: 45,
      accruedCoupon: 178.5,
      requestedAmount: 30000000000,
      totalSubmissions: 45000000000,
      submissionCoverageRatio: 1.5,
      retainedSubmissions: 30000000000,
      retainedCoverageRatio: 1.0,
      absorptionRate: 66.7,
      weightedAvgPrice: 98.5,
      marginalPrice: 98.2,
      avgYield: 6.8,
      participantCount: 12,
      submissionCount: 28,
      maturity: '5Y',
      yieldRate: 6.8,
      operationType: 'Auction',
      simultaneous: 'No',
      amount: 50000000000,
      interestRate: 6.5,
      market: 'BRVM',
      compartment: 'Government',
    },
    {
      id: '2',
      isin: 'SNTP0005678',
      country: 'Senegal',
      bondType: 'Treasury Bill',
      outstandingAmount: 25000000000,
      issuePrice: 99.8,
      marketPrice: 100.1,
      spread: 1.2,
      ytm: 4.5,
      couponRate: 4.25,
      maturityDate: '2025-06-30',
      residualDuration: 0.5,
      upcomingOST: 'Tap',
      issueDate: '2024-06-30',
      valueDate: '2024-07-05',
      redemptionType: 'AC',
      nominal: 5000,
      ostDate: '2024-12-30',
      couponType: 'Fixed',
      couponFrequency: 'Quarterly',
      previousCouponDate: '2024-09-30',
      nextCouponDate: '2024-12-30',
      daysToNextCoupon: 90,
      accruedCoupon: 35.2,
      requestedAmount: 15000000000,
      totalSubmissions: 22000000000,
      submissionCoverageRatio: 1.47,
      retainedSubmissions: 15000000000,
      retainedCoverageRatio: 1.0,
      absorptionRate: 68.2,
      weightedAvgPrice: 99.8,
      marginalPrice: 99.5,
      avgYield: 4.5,
      participantCount: 8,
      submissionCount: 18,
      maturity: '1Y',
      yieldRate: 4.5,
      operationType: 'Tap',
      simultaneous: 'Yes',
      amount: 25000000000,
      interestRate: 4.25,
      market: 'BRVM',
      compartment: 'Government',
    },
  ], []);

  const filteredBonds = useMemo(() => {
    return mockBonds.filter(bond => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !bond.isin.toLowerCase().includes(searchLower) &&
          !bond.country.toLowerCase().includes(searchLower) &&
          !bond.bondType.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
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

      if (bond.couponRate < filters.couponRange[0] || bond.couponRate > filters.couponRange[1]) {
        return false;
      }

      if (bond.residualDuration < filters.durationRange[0] || bond.residualDuration > filters.durationRange[1]) {
        return false;
      }

      return true;
    });
  }, [mockBonds, filters]);

  const insights = useMemo(() => {
    const results = [];

    const avgYTM = filteredBonds.reduce((sum, b) => sum + b.ytm, 0) / filteredBonds.length;
    if (avgYTM > 6) {
      results.push({
        type: 'positive',
        text: `Average YTM of ${avgYTM.toFixed(2)}% indicates attractive yields`,
      });
    }

    const highCouponCount = filteredBonds.filter(b => b.couponRate > 6).length;
    if (highCouponCount > 0) {
      results.push({
        type: 'info',
        text: `${highCouponCount} bond${highCouponCount > 1 ? 's offer' : ' offers'} coupon rates above 6%`,
      });
    }

    const shortTermCount = filteredBonds.filter(b => b.residualDuration < 2).length;
    if (shortTermCount > 0) {
      results.push({
        type: 'info',
        text: `${shortTermCount} bond${shortTermCount > 1 ? 's have' : ' has'} residual duration under 2 years`,
      });
    }

    const upcomingOSTCount = filteredBonds.filter(b => b.upcomingOST !== 'None').length;
    if (upcomingOSTCount > 0) {
      results.push({
        type: 'warning',
        text: `${upcomingOSTCount} bond${upcomingOSTCount > 1 ? 's have' : ' has'} upcoming OST operations`,
      });
    }

    if (results.length === 0) {
      results.push({
        type: 'neutral',
        text: 'No particular insights for this selection',
      });
    }

    return results;
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

  return (
    <div className="mtp-screener-page">
      <div className="screener-breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/fixed-income">Fixed Income</Link>
        <span>/</span>
        <span>MTP Primary Screener</span>
      </div>

      <div className="screener-header">
        <div className="header-top">
          <div className="header-title">
            <h1>MTP Primary Market Screener</h1>
            <p>Search, filter and analyze public securities market bonds</p>
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
                placeholder="Search by ISIN, country, or bond type..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          <div className="main-filters">
            <div className='multi-selects'>
              <MultiSelect
                label="Country/Zone"
                options={['Côte d\'Ivoire', 'Senegal', 'Benin', 'Burkina Faso', 'Mali', 'Niger', 'Togo', 'Guinea-Bissau'].map(c => ({ value: c, label: c }))}
                selected={filters.countries}
                onChange={(countries) => setFilters(prev => ({ ...prev, countries }))}
                placeholder="All countries"
              />

              <MultiSelect
                label="Market"
                options={['BRVM', 'NGX', 'NSE', 'GSX', 'JSX', 'CSE', 'CEMAC'].map(m => ({ value: m, label: m }))}
                selected={filters.markets}
                onChange={(markets) => setFilters(prev => ({ ...prev, markets }))}
                placeholder="All markets"
              />

              <MultiSelect
                label="Compartment"
                options={['Government', 'Corporate', 'Municipal', 'Supranational'].map(c => ({ value: c, label: c }))}
                selected={filters.compartments}
                onChange={(compartments) => setFilters(prev => ({ ...prev, compartments }))}
                placeholder="All compartments"
              />

              <MultiSelect
                label="Bond Type"
                options={['Treasury Bond', 'Treasury Bill', 'Corporate Bond', 'Municipal Bond'].map(t => ({ value: t, label: t }))}
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

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <div className="filter-group range-filter">
              <label>YTM Range (%)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.ytmRange[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, ytmRange: [Number(e.target.value), prev.ytmRange[1]] }))}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.ytmRange[1]}
                  onChange={(e) => setFilters(prev => ({ ...prev, ytmRange: [prev.ytmRange[0], Number(e.target.value)] }))}
                />
              </div>
            </div>

            <div className="filter-group range-filter">
              <label>Coupon Rate (%)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.couponRange[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, couponRange: [Number(e.target.value), prev.couponRange[1]] }))}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.couponRange[1]}
                  onChange={(e) => setFilters(prev => ({ ...prev, couponRange: [prev.couponRange[0], Number(e.target.value)] }))}
                />
              </div>
            </div>

            <div className="filter-group range-filter">
              <label>Residual Duration (Years)</label>
              <div className="range-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.durationRange[0]}
                  onChange={(e) => setFilters(prev => ({ ...prev, durationRange: [Number(e.target.value), prev.durationRange[1]] }))}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.durationRange[1]}
                  onChange={(e) => setFilters(prev => ({ ...prev, durationRange: [prev.durationRange[0], Number(e.target.value)] }))}
                />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      <div className="tabs-and-export">
        <div className="view-tabs">
          <button
            className={activeView === 'overview' ? 'active' : ''}
            onClick={() => setActiveView('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Overview
          </button>
          <button
            className={activeView === 'bond-info' ? 'active' : ''}
            onClick={() => setActiveView('bond-info')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
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
            Coupon
          </button>
          <button
            className={activeView === 'emission-stats' ? 'active' : ''}
            onClick={() => setActiveView('emission-stats')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
            Emission Statistics
          </button>
          <button
            className={activeView === 'upcoming-emissions' ? 'active' : ''}
            onClick={() => setActiveView('upcoming-emissions')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Upcoming Emissions
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
                  <th className="number-col">Market Price (%)</th>
                  <th className="number-col">Spread (%)</th>
                  <th className="number-col">YTM (%)</th>
                  <th className="number-col">Coupon (%)</th>
                  <th>Maturity Date</th>
                  <th className="number-col">Residual Duration</th>
                  <th>Upcoming OST</th>
                  <th className="actions-col">Invest</th>
                  <th className="actions-col">Buy Opportunity</th>
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
                      <Link href={`/fixed-income/bond-detail/mtp-primary/${bond.isin}`} className="isin-link">
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
                    <td className="number-col">{bond.marketPrice.toFixed(2)}</td>
                    <td className={`number-col ${bond.spread >= 0 ? 'positive' : 'negative'}`}>
                      {bond.spread.toFixed(2)}
                    </td>
                    <td className="number-col">{bond.ytm.toFixed(2)}</td>
                    <td className="number-col">{bond.couponRate.toFixed(2)}</td>
                    <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                    <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                    <td>
                      <span className="badge badge-ost">{bond.upcomingOST}</span>
                    </td>
                    <td className="actions-col">
                      <button className="btn-action btn-invest">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </td>
                    <td className="actions-col">
                      <button className="btn-action btn-opportunity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
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
                  <th>Issue Date</th>
                  <th>Value Date</th>
                  <th>Maturity Date</th>
                  <th>Redemption</th>
                  <th className="number-col">Nominal</th>
                  <th>Upcoming OST</th>
                  <th>OST Date</th>
                  <th className="actions-col">Buy Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.map(bond => (
                  <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                    <td className="checkbox-col">
                      <input type="checkbox" checked={selectedBonds.includes(bond.id)} onChange={() => handleToggleBondSelection(bond.id)} />
                    </td>
                    <td className="isin-col">
                      <Link href={`/fixed-income/bond-detail/mtp-primary/${bond.isin}`} className="isin-link">
                        {bond.isin}
                      </Link>
                    </td>
                    <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                    <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                    <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                    <td className="number-col">{bond.ytm.toFixed(2)}</td>
                    <td>{new Date(bond.issueDate).toLocaleDateString('en-US')}</td>
                    <td>{new Date(bond.valueDate).toLocaleDateString('en-US')}</td>
                    <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                    <td><span className="badge badge-redemption">{bond.redemptionType}</span></td>
                    <td className="number-col">{bond.nominal.toLocaleString()}</td>
                    <td><span className="badge badge-ost">{bond.upcomingOST}</span></td>
                    <td>{new Date(bond.ostDate).toLocaleDateString('en-US')}</td>
                    <td className="actions-col">
                      <button className="btn-action btn-opportunity">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
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
                  <th>Bond Type</th>
                  <th>Coupon Type</th>
                  <th className="number-col">Coupon (%)</th>
                  <th>Frequency</th>
                  <th>Previous Coupon Date</th>
                  <th>Next Coupon Date</th>
                  <th className="number-col">Days to Next Coupon</th>
                  <th className="number-col">Accrued Coupon</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.map(bond => (
                  <tr key={bond.id} className={selectedBonds.includes(bond.id) ? 'selected' : ''}>
                    <td className="checkbox-col">
                      <input type="checkbox" checked={selectedBonds.includes(bond.id)} onChange={() => handleToggleBondSelection(bond.id)} />
                    </td>
                    <td className="isin-col">
                      <Link href={`/fixed-income/bond-detail/mtp-primary/${bond.isin}`} className="isin-link">
                        {bond.isin}
                      </Link>
                    </td>
                    <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                    <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                    <td><span className="badge badge-coupon-type">{bond.couponType}</span></td>
                    <td className="number-col">{bond.couponRate.toFixed(2)}</td>
                    <td>{bond.couponFrequency}</td>
                    <td>{new Date(bond.previousCouponDate).toLocaleDateString('en-US')}</td>
                    <td>{new Date(bond.nextCouponDate).toLocaleDateString('en-US')}</td>
                    <td className="number-col">{bond.daysToNextCoupon}</td>
                    <td className="number-col">{bond.accruedCoupon.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'emission-stats' && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-col"><input type="checkbox" /></th>
                  <th>ISIN</th>
                  <th>Country</th>
                  <th>Bond Type</th>
                  <th className="number-col">Requested Amount</th>
                  <th className="number-col">Total Submissions</th>
                  <th className="number-col">Coverage Ratio</th>
                  <th className="number-col">Retained Submissions</th>
                  <th className="number-col">Retained Coverage</th>
                  <th className="number-col">Absorption Rate (%)</th>
                  <th className="number-col">Weighted Avg Price (%)</th>
                  <th className="number-col">Marginal Price (%)</th>
                  <th className="number-col">Avg Yield (%)</th>
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
                      <Link href={`/fixed-income/bond-detail/mtp-primary/${bond.isin}`} className="isin-link">
                        {bond.isin}
                      </Link>
                    </td>
                    <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                    <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                    <td className="number-col">{(bond.requestedAmount / 1000000).toFixed(0)}M</td>
                    <td className="number-col">{(bond.totalSubmissions / 1000000).toFixed(0)}M</td>
                    <td className="number-col">{bond.submissionCoverageRatio.toFixed(2)}x</td>
                    <td className="number-col">{(bond.retainedSubmissions / 1000000).toFixed(0)}M</td>
                    <td className="number-col">{bond.retainedCoverageRatio.toFixed(2)}x</td>
                    <td className="number-col">{bond.absorptionRate.toFixed(1)}</td>
                    <td className="number-col">{bond.weightedAvgPrice.toFixed(2)}</td>
                    <td className="number-col">{bond.marginalPrice.toFixed(2)}</td>
                    <td className="number-col">{bond.avgYield.toFixed(2)}</td>
                    <td className="number-col">{bond.participantCount}</td>
                    <td className="number-col">{bond.submissionCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === 'upcoming-emissions' && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-col"><input type="checkbox" /></th>
                  <th>ISIN</th>
                  <th>Country</th>
                  <th>Bond Type</th>
                  <th>Maturity</th>
                  <th className="number-col">Yield (%)</th>
                  <th>Issue Date</th>
                  <th>Value Date</th>
                  <th>Maturity Date</th>
                  <th>Operation Type</th>
                  <th>Simultaneous</th>
                  <th className="number-col">Amount</th>
                  <th className="number-col">Interest Rate (%)</th>
                  <th>Frequency</th>
                  <th>Redemption</th>
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
                      <Link href={`/fixed-income/bond-detail/mtp-primary/${bond.isin}`} className="isin-link">
                        {bond.isin}
                      </Link>
                    </td>
                    <td><span className="country-cell"><span className="country-flag">{getCountryFlag(bond.country)}</span>{bond.country}</span></td>
                    <td><span className="badge badge-bond-type">{bond.bondType}</span></td>
                    <td>{bond.maturity}</td>
                    <td className="number-col">{bond.yieldRate.toFixed(2)}</td>
                    <td>{new Date(bond.issueDate).toLocaleDateString('en-US')}</td>
                    <td>{new Date(bond.valueDate).toLocaleDateString('en-US')}</td>
                    <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                    <td><span className="badge badge-operation">{bond.operationType}</span></td>
                    <td>{bond.simultaneous}</td>
                    <td className="number-col">{(bond.amount / 1000000).toFixed(0)}M</td>
                    <td className="number-col">{bond.interestRate.toFixed(2)}</td>
                    <td>{bond.couponFrequency}</td>
                    <td><span className="badge badge-redemption">{bond.redemptionType}</span></td>
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
