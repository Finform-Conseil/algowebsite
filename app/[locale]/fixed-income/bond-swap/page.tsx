'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

type SwapType = 'duration' | 'credit' | 'currency' | 'yield';
type ProductType = 'treasury' | 'corporate' | 'municipal' | 'sovereign';
type Rating = 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';

interface SwapInputs {
  investor: string;
  swapType: SwapType;
}

interface OfferDetails {
  isin: string;
  yield: number;
  quantity: number;
}

interface DemandCriteria {
  productType: ProductType;
  duration: number;
  rating: Rating;
  interestRate: number;
  yield: number;
  quantity: number;
  country: string;
  isin: string;
}

interface SwapOperation {
  id: string;
  swapType: SwapType;
  offerIsin: string;
  offerYield: number;
  offerQuantity: number;
  demandProductType: ProductType;
  demandDuration: number;
  demandRating: Rating;
  demandInterestRate: number;
  demandYield: number;
  demandQuantity: number;
  demandCountry: string;
  demandIsin: string;
  investor: string;
  status: 'pending' | 'matched' | 'completed';
  createdDate: string;
  matchScore?: number;
}

export default function BondSwapPage() {
  const [searchQuery, setSearchQuery] = useState('');
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

  const [swapInputs, setSwapInputs] = useState<SwapInputs>({
    investor: '',
    swapType: 'duration',
  });

  const [offerDetails, setOfferDetails] = useState<OfferDetails>({
    isin: '',
    yield: 0,
    quantity: 0,
  });

  const [demandCriteria, setDemandCriteria] = useState<DemandCriteria>({
    productType: 'treasury',
    duration: 5,
    rating: 'A',
    interestRate: 6.5,
    yield: 7.0,
    quantity: 1000,
    country: 'Benin',
    isin: '',
  });

  const [showFiltered, setShowFiltered] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<{ [key: string]: boolean }>({
    general: false,
    offer: false,
    demand: false,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Mock swap operations data
  const allSwapOperations: SwapOperation[] = [
    {
      id: 'SWP-001',
      swapType: 'duration',
      offerIsin: 'BJ0000000001',
      offerYield: 6.8,
      offerQuantity: 1500,
      demandProductType: 'treasury',
      demandDuration: 5,
      demandRating: 'A',
      demandInterestRate: 6.5,
      demandYield: 7.0,
      demandQuantity: 1000,
      demandCountry: 'Benin',
      demandIsin: 'BJ0000000002',
      investor: 'BCEAO Investment Fund',
      status: 'pending',
      createdDate: '2024-12-15',
    },
    {
      id: 'SWP-002',
      swapType: 'credit',
      offerIsin: 'TG0000000003',
      offerYield: 7.2,
      offerQuantity: 2000,
      demandProductType: 'sovereign',
      demandDuration: 7,
      demandRating: 'BBB',
      demandInterestRate: 7.0,
      demandYield: 7.5,
      demandQuantity: 1500,
      demandCountry: 'Togo',
      demandIsin: 'TG0000000004',
      investor: 'West African Capital',
      status: 'matched',
      createdDate: '2024-12-10',
    },
    {
      id: 'SWP-003',
      swapType: 'yield',
      offerIsin: 'SN0000000005',
      offerYield: 6.5,
      offerQuantity: 3000,
      demandProductType: 'treasury',
      demandDuration: 3,
      demandRating: 'AA',
      demandInterestRate: 6.0,
      demandYield: 6.8,
      demandQuantity: 2500,
      demandCountry: 'Senegal',
      demandIsin: 'SN0000000006',
      investor: 'Sahel Investment Group',
      status: 'pending',
      createdDate: '2024-12-20',
    },
    {
      id: 'SWP-004',
      swapType: 'duration',
      offerIsin: 'CI0000000007',
      offerYield: 7.8,
      offerQuantity: 1200,
      demandProductType: 'corporate',
      demandDuration: 10,
      demandRating: 'A',
      demandInterestRate: 7.5,
      demandYield: 8.0,
      demandQuantity: 1000,
      demandCountry: 'Cote d\'Ivoire',
      demandIsin: 'CI0000000008',
      investor: 'UEMOA Securities',
      status: 'completed',
      createdDate: '2024-11-28',
    },
    {
      id: 'SWP-005',
      swapType: 'credit',
      offerIsin: 'ML0000000009',
      offerYield: 8.2,
      offerQuantity: 800,
      demandProductType: 'sovereign',
      demandDuration: 5,
      demandRating: 'B',
      demandInterestRate: 8.0,
      demandYield: 8.5,
      demandQuantity: 750,
      demandCountry: 'Mali',
      demandIsin: 'ML0000000010',
      investor: 'African Bond Fund',
      status: 'pending',
      createdDate: '2024-12-18',
    },
    {
      id: 'SWP-006',
      swapType: 'yield',
      offerIsin: 'BF0000000011',
      offerYield: 7.0,
      offerQuantity: 1800,
      demandProductType: 'treasury',
      demandDuration: 4,
      demandRating: 'BBB',
      demandInterestRate: 6.8,
      demandYield: 7.2,
      demandQuantity: 1500,
      demandCountry: 'Burkina Faso',
      demandIsin: 'BF0000000012',
      investor: 'Regional Investment Corp',
      status: 'matched',
      createdDate: '2024-12-12',
    },
  ];

  // Calculate match score for filtering
  const calculateMatchScore = (swap: SwapOperation): number => {
    let score = 0;
    
    // Swap type match
    if (swap.swapType === swapInputs.swapType) score += 20;
    
    // Offer criteria
    if (offerDetails.isin && swap.offerIsin.includes(offerDetails.isin)) score += 15;
    if (offerDetails.yield > 0 && Math.abs(swap.offerYield - offerDetails.yield) <= 0.5) score += 10;
    if (offerDetails.quantity > 0 && swap.offerQuantity >= offerDetails.quantity) score += 10;
    
    // Demand criteria
    if (swap.demandProductType === demandCriteria.productType) score += 15;
    if (Math.abs(swap.demandDuration - demandCriteria.duration) <= 2) score += 10;
    if (swap.demandRating === demandCriteria.rating) score += 10;
    if (Math.abs(swap.demandInterestRate - demandCriteria.interestRate) <= 0.5) score += 5;
    if (Math.abs(swap.demandYield - demandCriteria.yield) <= 0.5) score += 5;
    if (swap.demandQuantity >= demandCriteria.quantity * 0.8) score += 5;
    if (swap.demandCountry === demandCriteria.country) score += 5;
    if (demandCriteria.isin && swap.demandIsin.includes(demandCriteria.isin)) score += 10;
    
    return score;
  };

  // Filter and sort swap operations
  const filteredSwaps = useMemo(() => {
    if (!showFiltered) return allSwapOperations;
    
    const swapsWithScores = allSwapOperations.map(swap => ({
      ...swap,
      matchScore: calculateMatchScore(swap),
    }));
    
    return swapsWithScores
      .filter(swap => swap.matchScore && swap.matchScore >= 30)
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [showFiltered, swapInputs, offerDetails, demandCriteria]);

  const handleSearch = () => {
    setShowFiltered(true);
  };

  const handleReset = () => {
    setShowFiltered(false);
    setSwapInputs({ investor: '', swapType: 'duration' });
    setOfferDetails({ isin: '', yield: 0, quantity: 0 });
    setDemandCriteria({
      productType: 'treasury',
      duration: 5,
      rating: 'A',
      interestRate: 6.5,
      yield: 7.0,
      quantity: 1000,
      country: 'Benin',
      isin: '',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pending', class: 'status-pending' },
      matched: { label: 'Matched', class: 'status-matched' },
      completed: { label: 'Completed', class: 'status-completed' },
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getCountryFlag = (country: string): string => {
    const flags: { [key: string]: string } = {
      'Benin': '🇧🇯',
      'Togo': '🇹🇬',
      'Senegal': '🇸🇳',
      'Cote d\'Ivoire': '🇨🇮',
      'Mali': '🇲🇱',
      'Burkina Faso': '🇧🇫',
      'Niger': '🇳🇪',
    };
    return flags[country] || '🏳️';
  };

  return (
    <div className="bond-swap-page">
      <div className="swap-header">
        <div 
          className="swap-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
          }}
        >
          <div className="header-content">
          <h1>Bond Swap Operations</h1>
          <p>Search and manage your bond swap operations</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-label">Total Operations</span>
            <strong className="stat-value">{allSwapOperations.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Swaps</span>
            <strong className="stat-value">{allSwapOperations.filter(op => op.status === 'pending').length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Matched</span>
            <strong className="stat-value">{allSwapOperations.filter(op => op.status === 'matched').length}</strong>
          </div>
        </div>
        </div>
      </div>

      <div className="swap-content">
        <div className="swap-filters">
          <div className="filter-section">
            <h3 onClick={() => toggleSection('general')} className={collapsedSections.general ? 'collapsed' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              General Information
            </h3>
            {!collapsedSections.general && (
            <div className="input-grid">
              <div className="input-group">
                <label>Investor</label>
                <input
                  type="text"
                  value={swapInputs.investor}
                  onChange={(e) => setSwapInputs({ ...swapInputs, investor: e.target.value })}
                  placeholder="Investor name"
                />
              </div>
              <div className="input-group">
                <label>Swap Type</label>
                <select
                  value={swapInputs.swapType}
                  onChange={(e) => setSwapInputs({ ...swapInputs, swapType: e.target.value as SwapType })}
                >
                  <option value="duration">Duration Swap</option>
                  <option value="credit">Credit Swap</option>
                  <option value="currency">Currency Swap</option>
                  <option value="yield">Yield Swap</option>
                </select>
              </div>
            </div>
            )}
          </div>

          <div className="filter-section">
            <h3 onClick={() => toggleSection('offer')} className={collapsedSections.offer ? 'collapsed' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Offer
            </h3>
            {!collapsedSections.offer && (
            <div className="input-grid">
              <div className="input-group">
                <label>ISIN</label>
                <input
                  type="text"
                  value={offerDetails.isin}
                  onChange={(e) => setOfferDetails({ ...offerDetails, isin: e.target.value })}
                  placeholder="Code ISIN"
                />
              </div>
              <div className="input-group">
                <label>Yield (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={offerDetails.yield || ''}
                  onChange={(e) => setOfferDetails({ ...offerDetails, yield: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="input-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={offerDetails.quantity || ''}
                  onChange={(e) => setOfferDetails({ ...offerDetails, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            )}
          </div>

          <div className="filter-section">
            <h3 onClick={() => toggleSection('demand')} className={collapsedSections.demand ? 'collapsed' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9" />
              </svg>
              Demand
            </h3>
            {!collapsedSections.demand && (
            <div className="input-grid">
              <div className="input-group">
                <label>Product Type</label>
                <select
                  value={demandCriteria.productType}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, productType: e.target.value as ProductType })}
                >
                  <option value="treasury">Treasury</option>
                  <option value="corporate">Corporate</option>
                  <option value="municipal">Municipal</option>
                  <option value="sovereign">Sovereign</option>
                </select>
              </div>
              <div className="input-group">
                <label>Duration (years)</label>
                <input
                  type="number"
                  value={demandCriteria.duration}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="input-group">
                <label>Rating</label>
                <select
                  value={demandCriteria.rating}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, rating: e.target.value as Rating })}
                >
                  <option value="AAA">AAA</option>
                  <option value="AA">AA</option>
                  <option value="A">A</option>
                  <option value="BBB">BBB</option>
                  <option value="BB">BB</option>
                  <option value="B">B</option>
                  <option value="CCC">CCC</option>
                </select>
              </div>
              <div className="input-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={demandCriteria.interestRate}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, interestRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="input-group">
                <label>Yield (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={demandCriteria.yield}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, yield: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="input-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={demandCriteria.quantity}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="input-group">
                <label>Country</label>
                <select
                  value={demandCriteria.country}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, country: e.target.value })}
                >
                  <option value="Benin">🇧🇯 Bénin</option>
                  <option value="Togo">🇹🇬 Togo</option>
                  <option value="Senegal">🇸🇳 Sénégal</option>
                  <option value="Cote d'Ivoire">🇨🇮 Côte d'Ivoire</option>
                  <option value="Mali">🇲🇱 Mali</option>
                  <option value="Burkina Faso">🇧🇫 Burkina Faso</option>
                  <option value="Niger">🇳🇪 Niger</option>
                </select>
              </div>
              <div className="input-group">
                <label>ISIN</label>
                <input
                  type="text"
                  value={demandCriteria.isin}
                  onChange={(e) => setDemandCriteria({ ...demandCriteria, isin: e.target.value })}
                  placeholder="ISIN Code (optional)"
                />
              </div>
            </div>
            )}
          </div>

          <div className="action-buttons">
            <button className="btn-search" onClick={handleSearch}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Search
            </button>
            <button className="btn-reset" onClick={handleReset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Reset
            </button>
          </div>
        </div>

        <div className="swap-results">
          <div className="results-header">
            <h3>Swap Operations {showFiltered && `(${filteredSwaps.length} results)`}</h3>
            {showFiltered && filteredSwaps.length > 0 && (
              <span className="filter-badge">Filtered</span>
            )}
          </div>

          <div className="swap-table-wrapper">
            {filteredSwaps.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p>No swap operations found</p>
                <span>Adjust your search criteria</span>
              </div>
            ) : (
              <table className="swap-table">
                <thead>
                  <tr>
                    <th>Swap ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Investor</th>
                    <th>Date</th>
                    <th className="section-header" colSpan={3}>Offer</th>
                    <th className="section-header" colSpan={8}>Demand</th>
                    {showFiltered && <th>Match</th>}
                  </tr>
                  <tr className="sub-header">
                    <th colSpan={5}></th>
                    <th className="number-col">ISIN</th>
                    <th className="number-col">Yield</th>
                    <th className="number-col">Quantity</th>
                    <th>Type</th>
                    <th className="number-col">Duration</th>
                    <th>Rating</th>
                    <th className="number-col">Rate</th>
                    <th className="number-col">Yield</th>
                    <th className="number-col">Quantity</th>
                    <th>Country</th>
                    <th>ISIN</th>
                    {showFiltered && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSwaps.map((swap) => (
                    <tr key={swap.id}>
                      <td className="swap-id">{swap.id}</td>
                      <td>
                        <span className="swap-type-badge">{swap.swapType}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadge(swap.status).class}`}>
                          {getStatusBadge(swap.status).label}
                        </span>
                      </td>
                      <td className="investor-cell">{swap.investor}</td>
                      <td className="date-cell">{new Date(swap.createdDate).toLocaleDateString('fr-FR')}</td>
                      <td className="isin-cell">{swap.offerIsin}</td>
                      <td className="number-col">{swap.offerYield}%</td>
                      <td className="number-col">{swap.offerQuantity.toLocaleString()}</td>
                      <td className="type-cell">{swap.demandProductType}</td>
                      <td className="number-col">{swap.demandDuration} yrs</td>
                      <td className="rating-cell">{swap.demandRating}</td>
                      <td className="number-col">{swap.demandInterestRate}%</td>
                      <td className="number-col">{swap.demandYield}%</td>
                      <td className="number-col">{swap.demandQuantity.toLocaleString()}</td>
                      <td className="country-cell">{getCountryFlag(swap.demandCountry)} {swap.demandCountry}</td>
                      <td className="isin-cell">{swap.demandIsin}</td>
                      {showFiltered && (
                        <td className="match-cell">
                          {swap.matchScore && swap.matchScore >= 30 && (
                            <span className="match-score">{swap.matchScore}%</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
