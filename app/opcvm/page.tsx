'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import AfricaOPCVMMap from '@/components/opcvm/AfricaOPCVMMap';

// Types
type OPCVMData = {
  id: string;
  name: string;
  isin: string;
  exchange: string;
  nav: number;
  navChange: number;
  performance: number;
  volatility: number;
  rating: number; // 1-5 étoiles
};

export default function OPCVMHomePage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [mapMode, setMapMode] = useState<'performance' | 'count'>('performance');
  const [viewMode, setViewMode] = useState<'map' | 'methodology'>('map');
  const [filterExchange, setFilterExchange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'performance' | 'score'>('rating');

  // Mock OPCVM data
  const mockOPCVMData: OPCVMData[] = [
    { id: '1', name: 'NSIA Actions CI', isin: 'CI0001', exchange: 'BRVM', nav: 12500, navChange: 18.3, performance: 18.3, volatility: 12.5, rating: 5 },
    { id: '2', name: 'Coris Obligations', isin: 'BF0002', exchange: 'BRVM', nav: 10850, navChange: 5.8, performance: 5.8, volatility: 3.2, rating: 4 },
    { id: '3', name: 'BOA Monétaire', isin: 'SN0003', exchange: 'BRVM', nav: 10125, navChange: 2.5, performance: 2.5, volatility: 1.1, rating: 3 },
    { id: '4', name: 'Ecobank Mixte', isin: 'TG0004', exchange: 'BRVM', nav: 11750, navChange: 10.5, performance: 10.5, volatility: 7.8, rating: 4 },
    { id: '5', name: 'SG Actions Growth', isin: 'CI0005', exchange: 'BRVM', nav: 13200, navChange: 22.1, performance: 22.1, volatility: 15.3, rating: 5 },
    { id: '6', name: 'Stanbic Equity Fund', isin: 'NG0006', exchange: 'NGX', nav: 8500, navChange: 15.7, performance: 15.7, volatility: 11.2, rating: 5 },
    { id: '7', name: 'FirstBank Bond Fund', isin: 'NG0007', exchange: 'NGX', nav: 9200, navChange: 6.3, performance: 6.3, volatility: 4.1, rating: 4 },
    { id: '8', name: 'CIC Money Market', isin: 'KE0008', exchange: 'NSE', nav: 11100, navChange: 4.2, performance: 4.2, volatility: 2.5, rating: 3 },
    { id: '9', name: 'Britam Equity Fund', isin: 'KE0009', exchange: 'NSE', nav: 14300, navChange: 19.8, performance: 19.8, volatility: 13.7, rating: 5 },
    { id: '10', name: 'Allan Gray Balanced', isin: 'ZA0010', exchange: 'JSE', nav: 25600, navChange: 12.4, performance: 12.4, volatility: 8.9, rating: 4 },
    { id: '11', name: 'Coronation Equity', isin: 'ZA0011', exchange: 'JSE', nav: 32100, navChange: 16.9, performance: 16.9, volatility: 12.1, rating: 5 },
    { id: '12', name: 'Databank Epack', isin: 'GH0012', exchange: 'GSE', nav: 7800, navChange: 8.7, performance: 8.7, volatility: 6.3, rating: 4 },
    { id: '13', name: 'CDG Obligations', isin: 'MA0013', exchange: 'CSE', nav: 9500, navChange: 3.9, performance: 3.9, volatility: 2.8, rating: 3 },
  ];

  // Calculate rating based on risk-adjusted performance
  const calculateRatings = (funds: OPCVMData[]) => {
    // Calculate Sharpe-like ratio (performance / volatility)
    const fundsWithScore = funds.map(fund => ({
      ...fund,
      score: fund.performance / fund.volatility
    }));

    // Sort by score descending
    const sorted = [...fundsWithScore].sort((a, b) => b.score - a.score);

    // Divide into 5 groups
    const groupSize = Math.ceil(sorted.length / 5);
    
    return sorted.map((fund, index) => {
      const group = Math.floor(index / groupSize);
      const rating = 5 - group; // 5 stars for best group, 1 for worst
      return { ...fund, rating: Math.max(1, Math.min(5, rating)) };
    });
  };

  const ratedFunds = useMemo(() => calculateRatings(mockOPCVMData), []);

  // Group by exchange for map data
  const exchangeData = useMemo(() => {
    const grouped = ratedFunds.reduce((acc, fund) => {
      if (!acc[fund.exchange]) {
        acc[fund.exchange] = {
          count: 0,
          bestPerformance: -Infinity,
          bestFund: null as OPCVMData | null,
          avgRating: 0,
          totalRating: 0
        };
      }
      acc[fund.exchange].count++;
      acc[fund.exchange].totalRating += fund.rating;
      if (fund.navChange > acc[fund.exchange].bestPerformance) {
        acc[fund.exchange].bestPerformance = fund.navChange;
        acc[fund.exchange].bestFund = fund;
      }
      return acc;
    }, {} as Record<string, { count: number; bestPerformance: number; bestFund: OPCVMData | null; avgRating: number; totalRating: number }>);

    // Calculate average rating
    Object.keys(grouped).forEach(key => {
      grouped[key].avgRating = grouped[key].totalRating / grouped[key].count;
    });

    return grouped;
  }, [ratedFunds]);

  // Top rated funds with filters
  const topRatedFunds = useMemo(() => {
    let filtered = [...ratedFunds];
    
    // Filter by exchange
    if (filterExchange !== 'all') {
      filtered = filtered.filter(f => f.exchange === filterExchange);
    }
    
    // Sort by selected criteria
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating || b.performance - a.performance;
      } else if (sortBy === 'performance') {
        return b.performance - a.performance;
      } else { // score
        const scoreA = a.performance / a.volatility;
        const scoreB = b.performance / b.volatility;
        return scoreB - scoreA;
      }
    });
    
    return filtered.slice(0, 6);
  }, [ratedFunds, filterExchange, sortBy]);
  
  // Get unique exchanges for filter
  const exchanges = useMemo(() => {
    return ['all', ...Array.from(new Set(ratedFunds.map(f => f.exchange)))];
  }, [ratedFunds]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={star <= rating ? '#F59E0B' : 'none'}
            stroke={star <= rating ? '#F59E0B' : '#D1D5DB'}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="opcvm-home-page">
      {/* Breadcrumb */}
      <div className="opcvm-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>OPCVM</span>
      </div>

      {/* Header */}
      <div className="opcvm-header">
        <div className="opcvm-header__content">
          <div className="opcvm-header__title">
            <div className="title-content">
              <h1>Univers OPCVM Afrique</h1>
              <p>Explorez l'écosystème des fonds d'investissement africains</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="opcvm-indicators">
            <div className="indicator">
              <div className="indicator-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div className="indicator-content">
                <span className="indicator-label">OPCVM Suivis</span>
                <span className="indicator-value">{ratedFunds.length}</span>
              </div>
            </div>

            <div className="indicator">
              <div className="indicator-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <div className="indicator-content">
                <span className="indicator-label">Bourses</span>
                <span className="indicator-value">{Object.keys(exchangeData).length}</span>
              </div>
            </div>
            
            <div className="indicator">
              <div className="indicator-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  <polyline points="17 6 23 6 23 12" />
                </svg>
              </div>
              <div className="indicator-content">
                <span className="indicator-label">Perf. Moyenne</span>
                <span className="indicator-value positive">
                  +{(ratedFunds.reduce((sum, f) => sum + f.performance, 0) / ratedFunds.length).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="opcvm-controls">
            <div className="control-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="date-input"
              />
            </div>
            
            <div className="control-group">
              <label>Vue</label>
              <div className="mode-toggle">
                <button
                  className={mapMode === 'performance' ? 'active' : ''}
                  onClick={() => setMapMode('performance')}
                  title="Performance VL"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                  </svg>
                  Performance
                </button>
                <button
                  className={mapMode === 'count' ? 'active' : ''}
                  onClick={() => setMapMode('count')}
                  title="Nombre d'OPCVM"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                  Nombre
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Left: Map Section */}
        <div className="map-section">
          <div className="map-container">
            <AfricaOPCVMMap 
              exchangeData={exchangeData}
              mode={mapMode}
            />
            
            {/* Vertical Legend */}
            <div className="map-legend-vertical">
              {mapMode === 'performance' ? (
                <>
                  <div className="legend-gradient-vertical performance"></div>
                  <div className="legend-labels">
                    <span>+20%</span>
                    <span>+10%</span>
                    <span>0%</span>
                    <span>-10%</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="legend-gradient-vertical count"></div>
                  <div className="legend-labels">
                    <span>10+</span>
                    <span>6-10</span>
                    <span>3-5</span>
                    <span>1-2</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Rating & Top Funds */}
        <div className="right-panel">
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={viewMode === 'map' ? 'active' : ''}
              onClick={() => setViewMode('map')}
            >
              Top Fonds
            </button>
            <button
              className={viewMode === 'methodology' ? 'active' : ''}
              onClick={() => setViewMode('methodology')}
            >
              Méthodologie
            </button>
          </div>

          {viewMode === 'map' ? (
            <div className="top-funds-section">
              <div className="funds-header">
                <h3>Fonds les Mieux Notés</h3>
                
                <div className="funds-filters">
                  <select 
                    value={filterExchange} 
                    onChange={(e) => setFilterExchange(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Toutes les bourses</option>
                    {exchanges.filter(e => e !== 'all').map(ex => (
                      <option key={ex} value={ex}>{ex}</option>
                    ))}
                  </select>
                  
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value as 'rating' | 'performance' | 'score')}
                    className="filter-select"
                  >
                    <option value="rating">Par notation</option>
                    <option value="performance">Par performance</option>
                    <option value="score">Par score</option>
                  </select>
                </div>
              </div>
              
              <div className="funds-list">
                {topRatedFunds.slice(0, 6).map((fund) => (
                  <div key={fund.id} className="fund-card">
                    <div className="fund-header">
                      <div className="fund-name">{fund.name}</div>
                      <div className="fund-exchange">{fund.exchange}</div>
                    </div>
                    
                    <div className="fund-rating">
                      {renderStars(fund.rating)}
                    </div>
                    
                    <div className="fund-metrics">
                      <div className="metric">
                        <span className="metric-label">Performance</span>
                        <span className={`metric-value ${fund.performance >= 0 ? 'positive' : 'negative'}`}>
                          {fund.performance >= 0 ? '+' : ''}{fund.performance}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Score</span>
                        <span className="metric-value">{(fund.performance / fund.volatility).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rating-section">
              <h3>Méthodologie de Notation</h3>
              <p className="rating-description">
                Notation 5★ basée sur la performance ajustée au risque.
              </p>
              
              <div className="rating-methodology">
                <div className="method-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Ratio</h4>
                    <p>Performance / Volatilité</p>
                  </div>
                </div>
                <div className="method-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Classement</h4>
                    <p>Tri décroissant</p>
                  </div>
                </div>
                <div className="method-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Groupes</h4>
                    <p>5 groupes équilibrés</p>
                  </div>
                </div>
                <div className="method-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Attribution</h4>
                    <p>5★ à 1★</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="quick-access-section">
        <h3>Outils & Ressources OPCVM</h3>
        <div className="tools-grid">
          <Link href="/opcvm/screener" className="tool-card">
            <div className="tool-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="21" y1="18" x2="3" y2="18" />
              </svg>
            </div>
            <div className="tool-content">
              <h4>Screener OPCVM</h4>
              <p>Filtrez et comparez les fonds selon vos critères d'investissement</p>
            </div>
          </Link>

          <Link href="/opcvm/comparison-report" className="tool-card">
            <div className="tool-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="tool-content">
              <h4>Comparaison</h4>
              <p>Analysez côte à côte les performances de plusieurs fonds</p>
            </div>
          </Link>

          <Link href="/opcvm/titans" className="tool-card">
            <div className="tool-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="tool-content">
              <h4>Titans OPCVM</h4>
              <p>Découvrez les gérants et sociétés leaders du marché</p>
            </div>
          </Link>

          <Link href="/opcvm/simulator" className="tool-card">
            <div className="tool-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <div className="tool-content">
              <h4>Simulateur</h4>
              <p>Simulez vos investissements et projections de rendement</p>
            </div>
          </Link>

          <Link href="/opcvm/learn" className="tool-card">
            <div className="tool-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="tool-content">
              <h4>Apprendre</h4>
              <p>Guides et ressources pour maîtriser l'investissement OPCVM</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
