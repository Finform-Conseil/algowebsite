'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MultiSelect from '@/components/corporate-events/MultiSelect';

type ViewType = 'overview' | 'bond-info' | 'transactions' | 'market-opportunities';

type SecondaryBond = {
  id: string;
  isin: string;
  country: string;
  bondType: string;
  outstandingAmount: number;
  price: number;
  spread: number;
  quantity: number;
  exchangeRatio: number;
  ytm: number;
  couponRate: number;
  maturityDate: string;
  residualDuration: number;
  minPrice: number;
  maxPrice: number;
  redemptionType: 'In fine' | 'AC' | 'ACD';
  nominal: number;
  maxSpread: number;
  transactionDuration: number;
  avgPrice: number;
  avgYield: number;
  transactionCount: number;
  accruedCoupon: number;
  nominalVolumeTraded: number;
  accruedInterest: number;
  totalVolumeTraded: number;
  lastTransactionPrice: number;
  proposedPrice: number;
  offerDelay: number;
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

export default function MTPSecondaryScreenerPage() {
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

  const mockBonds: SecondaryBond[] = [
    {
      id: '1',
      isin: 'CI0001234567',
      country: 'Côte d\'Ivoire',
      bondType: 'OAT',
      outstandingAmount: 50000000000,
      price: 98.5,
      spread: 2.3,
      quantity: 1000,
      exchangeRatio: 0.85,
      ytm: 6.5,
      couponRate: 6.0,
      maturityDate: '2028-12-15',
      residualDuration: 4.2,
      minPrice: 97.8,
      maxPrice: 99.2,
      redemptionType: 'In fine',
      nominal: 10000,
      maxSpread: 2.8,
      transactionDuration: 180,
      avgPrice: 98.3,
      avgYield: 6.6,
      transactionCount: 45,
      accruedCoupon: 178.5,
      nominalVolumeTraded: 25000000000,
      accruedInterest: 892500000,
      totalVolumeTraded: 25892500000,
      lastTransactionPrice: 98.7,
      proposedPrice: 98.9,
      offerDelay: 5,
      market: 'BRVM',
      compartment: 'Government',
    },
    {
      id: '2',
      isin: 'SN0009876543',
      country: 'Senegal',
      bondType: 'BAT',
      outstandingAmount: 30000000000,
      price: 99.2,
      spread: 1.8,
      quantity: 500,
      exchangeRatio: 0.92,
      ytm: 5.8,
      couponRate: 5.5,
      maturityDate: '2026-06-30',
      residualDuration: 1.5,
      minPrice: 98.5,
      maxPrice: 99.8,
      redemptionType: 'In fine',
      nominal: 10000,
      maxSpread: 2.2,
      transactionDuration: 90,
      avgPrice: 99.0,
      avgYield: 5.9,
      transactionCount: 32,
      accruedCoupon: 137.5,
      nominalVolumeTraded: 15000000000,
      accruedInterest: 412500000,
      totalVolumeTraded: 15412500000,
      lastTransactionPrice: 99.3,
      proposedPrice: 99.5,
      offerDelay: 3,
      market: 'BRVM',
      compartment: 'Government',
    },
    {
      id: '3',
      isin: 'BJ0005555555',
      country: 'Benin',
      bondType: 'OAT',
      outstandingAmount: 20000000000,
      price: 97.8,
      spread: 2.8,
      quantity: 750,
      exchangeRatio: 0.78,
      ytm: 7.2,
      couponRate: 6.8,
      maturityDate: '2030-03-20',
      residualDuration: 5.3,
      minPrice: 96.5,
      maxPrice: 98.5,
      redemptionType: 'AC',
      nominal: 10000,
      maxSpread: 3.5,
      transactionDuration: 270,
      avgPrice: 97.5,
      avgYield: 7.3,
      transactionCount: 28,
      accruedCoupon: 204.0,
      nominalVolumeTraded: 12000000000,
      accruedInterest: 612000000,
      totalVolumeTraded: 12612000000,
      lastTransactionPrice: 97.9,
      proposedPrice: 98.1,
      offerDelay: 7,
      market: 'BRVM',
      compartment: 'Government',
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
    if (filteredBonds.length === 0) return [];
    
    const avgYTM = filteredBonds.reduce((sum, b) => sum + b.ytm, 0) / filteredBonds.length;
    const avgSpread = filteredBonds.reduce((sum, b) => sum + b.spread, 0) / filteredBonds.length;
    const totalVolume = filteredBonds.reduce((sum, b) => sum + b.totalVolumeTraded, 0);
    const avgExchangeRatio = filteredBonds.reduce((sum, b) => sum + b.exchangeRatio, 0) / filteredBonds.length;
    
    const insightsList = [
      {
        type: 'info',
        message: `${filteredBonds.length} bonds available on the secondary market`
      },
      {
        type: avgYTM > 6.5 ? 'positive' : 'neutral',
        message: `Average YTM: ${avgYTM.toFixed(2)}%`
      },
      {
        type: 'info',
        message: `Average spread: ${avgSpread.toFixed(2)}%`
      },
      {
        type: 'positive',
        message: `Total traded volume: ${(totalVolume / 1000000000).toFixed(1)}B XOF`
      },
      {
        type: avgExchangeRatio > 0.8 ? 'positive' : 'neutral',
        message: `Average exchange ratio: ${(avgExchangeRatio * 100).toFixed(1)}%`
      }
    ];
    
    return insightsList;
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
        <span>MTP Secondary Screener</span>
      </div>

      <div className="screener-header">
        <div className="header-top">
          <div className="header-title">
            <h1>MTP Secondary Market Screener</h1>
            <p>Explore and analyze bonds on the secondary market</p>
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
                options={countryOptions}
                selected={filters.countries}
                onChange={(selected) => setFilters({ ...filters, countries: selected })}
                placeholder="All countries"
              />
              <MultiSelect
                label="Market"
                options={marketOptions}
                selected={filters.markets}
                onChange={(selected) => setFilters({ ...filters, markets: selected })}
                placeholder="All markets"
              />
              <MultiSelect
                label="Compartment"
                options={compartmentOptions}
                selected={filters.compartments}
                onChange={(selected) => setFilters({ ...filters, compartments: selected })}
                placeholder="All compartments"
              />
              <MultiSelect
                label="Bond Type"
                options={bondTypeOptions}
                selected={filters.bondTypes}
                onChange={(selected) => setFilters({ ...filters, bondTypes: selected })}
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
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                style={{ transform: showAdvancedFilters ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
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
              className={activeView === 'transactions' ? 'active' : ''}
              onClick={() => setActiveView('transactions')}
            >
              Transactions
            </button>
            <button
              className={activeView === 'market-opportunities' ? 'active' : ''}
              onClick={() => setActiveView('market-opportunities')}
            >
              Market Opportunities
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
                    <th>Outstanding</th>
                    <th>Price</th>
                    <th>Spread</th>
                    <th>Quantity</th>
                    <th>Exchange Ratio</th>
                    <th>YTM (%)</th>
                    <th>Coupon (%)</th>
                    <th>Maturity Date</th>
                    <th>Residual Duration</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                    <th>Action</th>
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
                        <Link href={`/fixed-income/bond-detail/mtp-secondary/${bond.isin}`} className="isin-link">
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
                      <td className="number-col">{bond.price.toFixed(2)}</td>
                      <td className="number-col">{bond.spread.toFixed(2)}</td>
                      <td className="number-col">{bond.quantity}</td>
                      <td className="number-col">{(bond.exchangeRatio * 100).toFixed(1)}%</td>
                      <td className="number-col">{bond.ytm.toFixed(2)}</td>
                      <td className="number-col">{bond.couponRate.toFixed(2)}</td>
                      <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                      <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                      <td className="number-col">{bond.minPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.maxPrice.toFixed(2)}</td>
                      <td>
                        <button className="btn-action btn-invest">Invest</button>
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
                    <th className="checkbox-col">
                      <input type="checkbox" />
                    </th>
                    <th>ISIN</th>
                    <th>Country</th>
                    <th>Bond Type</th>
                    <th>Residual Duration</th>
                    <th>Coupon (%)</th>
                    <th>YTM (%)</th>
                    <th>Maturity Date</th>
                    <th>Redemption</th>
                    <th>Outstanding</th>
                    <th>Nominal</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                    <th>Max Spread</th>
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
                        <Link href={`/fixed-income/bond-detail/mtp-secondary/${bond.isin}`} className="isin-link">
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
                      <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                      <td className="number-col">{bond.couponRate.toFixed(2)}</td>
                      <td className="number-col">{bond.ytm.toFixed(2)}</td>
                      <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                      <td>
                        <span className="badge badge-redemption">{bond.redemptionType}</span>
                      </td>
                      <td className="number-col">{(bond.outstandingAmount / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{bond.nominal.toLocaleString()}</td>
                      <td className="number-col">{bond.minPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.maxPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.maxSpread.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'transactions' && (
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
                    <th>Transaction Duration</th>
                    <th>Quantity</th>
                    <th>Avg Price</th>
                    <th>Spread</th>
                    <th>Avg Yield</th>
                    <th>Transaction Count</th>
                    <th>Accrued Coupon</th>
                    <th>Nominal Volume Traded</th>
                    <th>Accrued Interest</th>
                    <th>Total Volume Traded</th>
                    <th>Exchange Ratio</th>
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
                        <Link href={`/fixed-income/bond-detail/mtp-secondary/${bond.isin}`} className="isin-link">
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
                      <td className="number-col">{bond.transactionDuration} days</td>
                      <td className="number-col">{bond.quantity}</td>
                      <td className="number-col">{bond.avgPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.spread.toFixed(2)}</td>
                      <td className="number-col">{bond.avgYield.toFixed(2)}</td>
                      <td className="number-col">{bond.transactionCount}</td>
                      <td className="number-col">{bond.accruedCoupon.toFixed(2)}</td>
                      <td className="number-col">{(bond.nominalVolumeTraded / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{(bond.accruedInterest / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{(bond.totalVolumeTraded / 1000000).toFixed(0)}M</td>
                      <td className="number-col">{(bond.exchangeRatio * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'market-opportunities' && (
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
                    <th>Residual Duration</th>
                    <th>YTM (%)</th>
                    <th>Maturity Date</th>
                    <th>Min Price</th>
                    <th>Max Price</th>
                    <th>Last Transaction Price</th>
                    <th>Proposed Price</th>
                    <th>Quantity</th>
                    <th>Accrued Coupon</th>
                    <th>Offer Delay</th>
                    <th>Action</th>
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
                        <Link href={`/fixed-income/bond-detail/mtp-secondary/${bond.isin}`} className="isin-link">
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
                      <td className="number-col">{bond.residualDuration.toFixed(1)}Y</td>
                      <td className="number-col">{bond.ytm.toFixed(2)}</td>
                      <td>{new Date(bond.maturityDate).toLocaleDateString('en-US')}</td>
                      <td className="number-col">{bond.minPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.maxPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.lastTransactionPrice.toFixed(2)}</td>
                      <td className="number-col highlight">{bond.proposedPrice.toFixed(2)}</td>
                      <td className="number-col">{bond.quantity}</td>
                      <td className="number-col">{bond.accruedCoupon.toFixed(2)}</td>
                      <td className="number-col">{bond.offerDelay} days</td>
                      <td>
                        <button className="btn-action btn-invest">Invest</button>
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
        className="floating-insights-btn"
        onClick={() => setShowInsights(!showInsights)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        {insights.length > 0 && <span className="insights-badge">{insights.length}</span>}
      </button>

      {showInsights && (
        <div className="floating-insights-panel">
          <div className="insights-header">
            <h3>Automatic Insights</h3>
            <button onClick={() => setShowInsights(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="insights-content">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-item ${insight.type}`}>
                <div className="insight-icon">
                  {insight.type === 'positive' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {insight.type === 'info' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  )}
                  {insight.type === 'neutral' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  )}
                </div>
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
