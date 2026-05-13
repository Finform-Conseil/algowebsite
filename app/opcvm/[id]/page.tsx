'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TechnicalAnalysisChart from '@/components/charts/TechnicalAnalysisChart';
import '@/styles/pages/_opcvm-detail.scss';
import { useOpcvmMetricRepository, useOpcvmRepository } from '@/core/infra/repositories/opcvm.repository.impl';
import { OpcvmMetricQueryParams } from '@/core/domain/types/opcvm.type';
import { OPCVMMetricEntity, OPCVMEntity } from '@/core/domain/entities/opcvm.entity';

// Dynamically import Leaflet Map component to avoid SSR issues
const LeafletMap = dynamic(
  () => import('@/components/maps/LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ 
        height: '100%', 
        width: '100%', 
        borderRadius: '12px',
        background: 'var(--card-background)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-secondary)'
      }}>
        Chargement de la carte...
      </div>
    )
  }
);

export default function OPCVMDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [lastMetric, setLastMetric] = useState<OPCVMMetricEntity>();
  const [sortedData, setSortedData] = useState<OPCVMMetricEntity[]>([]);
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'strategy'>('fees');
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<OPCVMEntity[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const getOpcvmMetricParams = (): OpcvmMetricQueryParams => {
    const params: OpcvmMetricQueryParams = { view_type: "screener", page: -1 };
    if (id) params.opcvm = id;
    return params;
  };
    
  const { currentOpcvmData, getOpcvmById, allOpcvmsData, getAllOpcvms } = useOpcvmRepository();
  const { allOpcvmMetricsData, getAllOpcvmMetrics } = useOpcvmMetricRepository();

  useEffect(() => { getOpcvmById(id); }, [id]);
  useEffect(() => { getAllOpcvmMetrics(getOpcvmMetricParams()); }, []);
  useEffect(() => { getAllOpcvms({ page: 1, page_size: 10, search: searchQuery}); }, [searchQuery]); // Load all OPCVMs for search

  useEffect(() =>
  {
    console.log("Current OPCVM Data", currentOpcvmData);
    console.log("Current OPCVM metrics", allOpcvmMetricsData);
    const sortedData = allOpcvmMetricsData?.data ? [...allOpcvmMetricsData.data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    ) : [];
    console.log("Last performance", sortedData[sortedData.length - 1]);
    setLastMetric(sortedData[sortedData.length - 1]);
    setSortedData(sortedData);
  }, [currentOpcvmData, allOpcvmMetricsData])

  // Search functionality
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allOpcvmsData?.data?.filter((opcvm) => 
      opcvm.intitule?.toLowerCase().includes(query) ||
      opcvm.isin?.toLowerCase().includes(query)
    ).slice(0, 8) || [];
    
    setSearchResults(filtered);
  }, [searchQuery, allOpcvmsData]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search query when current OPCVM changes
  useEffect(() => {
    if (currentOpcvmData?.intitule) {
      setSearchQuery(currentOpcvmData.intitule);
    }
  }, [currentOpcvmData]);

  const getPeriodicite = (periodicite: string): string => {
    switch(periodicite){
      case 'J':
        return 'Daily';
      case 'H':
        return 'Weekly';
      case 'M':
        return 'Monthly';
      case 'T':
        return 'Quarterly';
      case 'S':
        return 'Semi-Annual';
      case 'A':
        return 'Annual';
      default:
        return 'Not defined';
    }
  }

  const handleSelectOpcvm = (opcvmId: string) => {
    setIsSearchFocused(false);
    router.push(`/opcvm/${opcvmId}`);
  };

  const formatCurrency = (amount?: number) => {
    if (amount) {
      return new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount);
    }
    return "--";
  };

  const formatLargeCurrency = (amount?: number) => {
    if (amount) { 
      if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(2)} Mds`;
      } else if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(2)} M`;
      }
      return formatCurrency(amount);
    }
    return "--";
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="20"
            height="20"
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
    <div className="opcvm-detail-page">
      {/* Compact Header - 20vh */}
      <div className="opcvm-detail-header">
        <div 
          className="opcvm-detail-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8))`,
          }}
        >
          <div className="header-content">
            {/* Left: Fund Identity */}
            <div className="header-left">
              <div className="fund-title-section">
                <div className="fund-badges">
                  <span className="badge exchange">{typeof currentOpcvmData?.country === 'string' ? currentOpcvmData?.country : typeof currentOpcvmData?.country?.bourse == 'string' ? currentOpcvmData?.country?.bourse : currentOpcvmData?.country?.bourse?.ticker}</span>
                  <span className="badge category">{currentOpcvmData?.type}</span>
                  <span className="badge legal-form">{currentOpcvmData?.nature}</span>
                </div>
                
                {/* Fund Search Input */}
                <div className="fund-search-container" ref={searchRef}>
                  <div className="fund-search-input-wrapper">
                    <svg 
                      className="search-icon" 
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <circle cx="11" cy="11" r="8"/>
                      <path d="m21 21-4.35-4.35"/>
                    </svg>
                    <input
                      type="text"
                      className="fund-search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="Search for a fund..."
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {isSearchFocused && searchResults.length > 0 && (
                    <div className="fund-search-dropdown">
                      {searchResults.map((opcvm) => (
                        <div
                          key={opcvm.id}
                          className="search-result-item"
                          onClick={() => handleSelectOpcvm(opcvm.id)}
                        >
                          <div className="search-result-main">
                            <span className="search-result-name">{opcvm.intitule}</span>
                            <span className="search-result-type">{opcvm.type}</span>
                          </div>
                          <div className="search-result-meta">
                            <span className="search-result-isin">{opcvm.isin}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="fund-meta">
                  <span className="isin">ISIN: {currentOpcvmData?.isin}</span>
                  <span className="separator">•</span>
                  <span className="management">{typeof currentOpcvmData?.sgo === 'string' ? currentOpcvmData?.sgo : currentOpcvmData?.sgo?.name}</span>
                </div>
              </div>
            </div>

            {/* Center: NAV Display */}
            <div className="header-center">
              <div className="nav-display">
                <div className="nav-label">Net Asset Value</div>
                <div className="nav-value">
                  {lastMetric?.liquidative_value ? formatCurrency(parseFloat(lastMetric.liquidative_value)) : '--'}
                  <span className="currency">{typeof currentOpcvmData?.currency === 'string' ? currentOpcvmData.currency : currentOpcvmData?.currency?.code}</span>
                </div>
                {lastMetric && sortedData.length > 1 && (
                  <div className={`nav-change ${(sortedData[sortedData.length-1]?.rendement ?? 0) >= 0 ? 'positive' : 'negative'}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      {(sortedData[sortedData.length-1]?.rendement ?? 0) >= 0 ? (
                        <path d="M7 14l5-5 5 5z" />
                      ) : (
                        <path d="M7 10l5 5 5-5z" />
                      )}
                    </svg>
                    {(sortedData[sortedData.length-1]?.rendement ?? 0) >= 0 ? '+' : ''}
                    {((sortedData[sortedData.length-1]?.rendement ?? 0) * 100).toFixed(2)}%
                    <span className="change-amount">
                      ({sortedData.length > 1 && sortedData[sortedData.length-1]?.liquidative_value && sortedData[sortedData.length-2]?.liquidative_value
                        ? `${(parseFloat(sortedData[sortedData.length-1].liquidative_value!) - parseFloat(sortedData[sortedData.length-2].liquidative_value!)) >= 0 ? '+' : ''}${formatCurrency(parseFloat(sortedData[sortedData.length-1].liquidative_value!) - parseFloat(sortedData[sortedData.length-2].liquidative_value!))}`
                        : '--'})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Quick Stats + Website */}
            <div className="header-right">
              <div className="quick-stats">
                <div className="stat-item">
                  <div className="stat-label">Net Assets</div>
                  <div className="stat-value">{formatLargeCurrency(currentOpcvmData?.actif_net)}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">1Y Perf</div>
                  <div className={`stat-value ${(lastMetric?.performance_1y || 0 * 100) >= 0 ? 'positive' : 'negative'}`}>
                    {lastMetric?.performance_1y 
                      ? `${lastMetric.performance_1y * 100 >= 0 ? '+' : ''}${(lastMetric.performance_1y * 100).toFixed(2)}%`
                      : 'N/A'}
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Rating</div>
                  <div className="stat-value rating">
                    {renderStars(currentOpcvmData?.latest_metrics?.rating ?? 0)}
                  </div>
                </div>
                <a 
                  href={currentOpcvmData?.website || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="website-btn"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                  Visit Website
                </a>
              </div>
              
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid - 80vh */}
      <div className="opcvm-detail-content">
        {/* Left: Chart + Details */}
        <div className="content-chart">
          {/* Top: Technical Chart - 60% */}
          <div className="chart-section">
            {sortedData.length > 0 ? (
              <TechnicalAnalysisChart
                data={sortedData}
                defaultMetrics={['liquidative_value']}
                defaultTimeFrame="1Y"
                showToolbox={true}
              />
            ) : (
              <div style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem'
              }}>
                {allOpcvmMetricsData ? 'No historical data available' : 'Loading chart data...'}
              </div>
            )}
          </div>

          {/* Bottom: Complete Details - 40% */}
          <div className="details-section">
            <div className="details-tabs">
              <button 
                className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
                onClick={() => setActiveTab('fees')}
              >
                Fees & Commissions
              </button>
              <button 
                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                onClick={() => setActiveTab('general')}
              >
                General Information
              </button>
              <button 
                className={`tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
                onClick={() => setActiveTab('strategy')}
              >
                Strategy
              </button>
            </div>
            
            <div className="details-content">
              {activeTab === 'general' && (
              <div className="details-grid full-width">
                {/* Column 1: General Info */}
                <div className="detail-column">
                  {/* <h5>Informations Générales</h5> */}
                  <div className="detail-item">
                    <span className="label">Manager</span>
                    <span className="value">{typeof currentOpcvmData?.sgo === 'string' ? currentOpcvmData?.sgo : currentOpcvmData?.sgo?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Promoters</span>
                    <span className="value">{currentOpcvmData?.promoteurs}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Custodian</span>
                    <span className="value">{currentOpcvmData?.depositaire}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Auditors</span>
                    <span className="value">{currentOpcvmData?.commissaires_comptes}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">CEO</span>
                    <span className="value">{currentOpcvmData?.directeur_general}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">NAV Frequency</span>
                    <span className="value">{getPeriodicite(currentOpcvmData?.periodicite || '')}</span>
                  </div>
                </div>
              </div>
              )}

              {activeTab === 'fees' && (
              <div className="details-grid two-columns">
                {/* Column 1: Fees & Commissions */}
                <div className="detail-column">
                  {/* <h5>Frais & Commissions</h5> */}
                  <div className="detail-item">
                    <span className="label">Subscription Fee</span>
                    <span className="value">{currentOpcvmData?.max_souscription ?? "--"}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Redemption Fee</span>
                    <span className="value">{currentOpcvmData?.max_rachat ?? "--"}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Management Fee</span>
                    <span className="value">{currentOpcvmData?.max_gestion ?? "--"}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Account Commission</span>
                    <span className="value">{currentOpcvmData?.commission_au_compte}{currentOpcvmData?.commission_au_compte_type === 'amount' ? (typeof currentOpcvmData?.currency === 'string' ? currentOpcvmData?.currency : currentOpcvmData?.currency?.symbol) : '%'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Market Authority Fee</span>
                    <span className="value">{currentOpcvmData?.redevance_autorite_marche}{currentOpcvmData?.redevance_autorite_marche_type === 'amount' ? (typeof currentOpcvmData?.currency === 'string' ? currentOpcvmData?.currency : currentOpcvmData?.currency?.symbol) : '%'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Commission Retrocession</span>
                    <span className="value">{currentOpcvmData?.retrocession_commission ?? "--"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Income Allocation</span>
                    <span className="value">{currentOpcvmData?.affectation_resultat ? currentOpcvmData?.affectation_resultat.toUpperCase() : "--"}</span>
                  </div>
                </div>

                {/* Column 2: Investment Details */}
                <div className="detail-column">
                  {/* <h5>Détails d'Investissement</h5> */}
                  <div className="detail-item">
                    <span className="label">Minimum Subscription</span>
                    <span className="value">{formatLargeCurrency(currentOpcvmData?.souscription_min)} </span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Initial Value</span>
                    <span className="value">{formatCurrency(currentOpcvmData?.valeur_demarrage)} {typeof currentOpcvmData?.currency === 'string' ? currentOpcvmData?.currency : currentOpcvmData?.currency?.symbol}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Initial Capital</span>
                    <span className="value">{formatLargeCurrency(currentOpcvmData?.capital_initial)} {typeof currentOpcvmData?.currency === 'string' ? currentOpcvmData?.currency : currentOpcvmData?.currency?.symbol}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Recommended Holding Period</span>
                    <span className="value">{currentOpcvmData?.duree_placement_recommandee ?? "--"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Settlement Period</span>
                    <span className="value">{currentOpcvmData?.delai_reglement_depositaire ?? "--"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Creation Date</span>
                    <span className="value">{currentOpcvmData?.date_creation ? new Date(currentOpcvmData?.date_creation).toLocaleDateString('en-EN') : 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Approval Date</span>
                    <span className="value">{currentOpcvmData?.date_agrement ? new Date(currentOpcvmData?.date_agrement).toLocaleDateString('en-EN') : 'N/A'}</span>
                  </div>
                </div>
              </div>
              )}

              {activeTab === 'strategy' && (
              <div className="details-grid full-width">
                {/* Strategy */}
                <div className="detail-column">
                  {/* <h5>Stratégie d'Investissement</h5> */}
                  <div className="detail-item vertical">
                    <span className="label">Investment Objective</span>
                    <p className="value-text">
                      {currentOpcvmData?.objectif_investissement ?? "--"}
                    </p>
                  </div>
                  <div className="detail-item vertical">
                    <span className="label">Strategic Orientation</span>
                    <p className="value-text">
                      {currentOpcvmData?.orientation_strategique ?? "--"}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="label">Benchmark Index</span>
                    <span className="value">{currentOpcvmData?.indice_description ?? "--"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">SRI (Socially Responsible Investment)</span>
                    <span className={`value ${currentOpcvmData?.isr ? "badge-yes" : "badge-no"}`}>{currentOpcvmData?.isr ? "Yes" : "No"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">SDG Contribution</span>
                    <span className="value">ODD {currentOpcvmData?.contribution_odd ?? "--"}</span>
                  </div>
                </div>
              </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Two Sections Stacked */}
        <div className="content-sidebar">
          {/* Top: Key Metrics Cards */}
          <div className="metrics-section">
            <div className="metrics-grid">
              {/* Performance Card */}
              <div className="metric-card performance-card">
                <div className="card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  <h4>Performance</h4>
                </div>
                <div className="perf-grid">
                  <div className="perf-item">
                    <span className="perf-period">1M</span>
                    <span className={`perf-value ${(lastMetric?.performance_1m || 0 * 100) >= 0 ? 'positive' : 'negative'}`}>
                      {lastMetric?.performance_1m 
                        ? `${lastMetric.performance_1m * 100 >= 0 ? '+' : ''}${(lastMetric.performance_1m * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-period">3M</span>
                    <span className={`perf-value ${(lastMetric?.performance_3m || 0 * 100) >= 0 ? 'positive' : 'negative'}`}>
                      {lastMetric?.performance_3m 
                        ? `${lastMetric.performance_3m * 100 >= 0 ? '+' : ''}${(lastMetric.performance_3m * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-period">6M</span>
                    <span className={`perf-value ${(lastMetric?.performance_6m || 0 * 100) >= 0 ? 'positive' : 'negative'}`}>
                      {lastMetric?.performance_6m 
                        ? `${lastMetric.performance_6m * 100 >= 0 ? '+' : ''}${(lastMetric.performance_6m * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-period">1Y</span>
                    <span className={`perf-value ${(lastMetric?.performance_1y || 0 * 100) >= 0 ? 'positive' : 'negative'}`}>
                      {lastMetric?.performance_1y 
                        ? `${lastMetric.performance_1y * 100 >= 0 ? '+' : ''}${(lastMetric.performance_1y * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="perf-item">
                    <span className="perf-period">YTD</span>
                    <span className={`perf-value ${(lastMetric?.performance_ytd || 0 * 100) >= 0 ? 'positive' : 'negative'}`}>
                      {lastMetric?.performance_ytd 
                        ? `${lastMetric.performance_ytd * 100 >= 0 ? '+' : ''}${(lastMetric.performance_ytd * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="perf-item highlight">
                    <span className="perf-period">Inception</span>
                    <span className={`perf-value ${(lastMetric?.performance_inception || 0) * 100 >= 0 ? 'positive' : 'negative'}`}>
                      {lastMetric?.performance_inception 
                        ? `${lastMetric.performance_inception * 100 >= 0 ? '+' : ''}${(lastMetric.performance_inception * 100).toFixed(2)}%`
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Metrics Card */}
              <div className="metric-card risk-card">
                <div className="card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                  <h4>Risk</h4>
                </div>
                <div className="risk-metrics">
                  <div className="risk-metric-item">
                    <div className="risk-metric-label">Volatility 1Y</div>
                    <div className="risk-metric-value">{lastMetric?.volatility_1y ? `${(lastMetric.volatility_1y * 100).toFixed(2)}%` : 'N/A'}</div>
                    <div className="risk-bar">
                      <div className="risk-fill" style={{ width: `${Math.min((lastMetric?.volatility_1y ?? 0) *100, 100)}%` }}></div>
                    </div>
                  </div>
                  <div className="risk-metric-item">
                    <div className="risk-metric-label">Sharpe Ratio 1Y</div>
                    <div className="risk-metric-value">
                      {lastMetric?.sharpe_ratio_1y !== null && lastMetric?.sharpe_ratio_1y !== undefined 
                        ? parseFloat(lastMetric.sharpe_ratio_1y.toString()).toFixed(2) 
                        : '--'}
                    </div>
                    <div className="risk-metric-desc">Risk-adjusted return</div>
                  </div>
                </div>
              </div>

              {/* Fund Info Card - Enriched */}
              <div className="metric-card info-card">
                <div className="card-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                  <h4>Key Information</h4>
                </div>
                <div className="info-list">
                  <div className="info-row">
                    <span className="info-label">Legal Form</span>
                    <span className="info-value">{currentOpcvmData?.nature && currentOpcvmData?.nature.toUpperCase()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Category</span>
                    <span className="info-value">{currentOpcvmData?.type && currentOpcvmData?.type?.toUpperCase()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Net Assets</span>
                    <span className="info-value">{formatLargeCurrency(currentOpcvmData?.actif_net)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Income Allocation</span>
                    <span className="info-value">{currentOpcvmData?.affectation_resultat && currentOpcvmData?.affectation_resultat?.toUpperCase()}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Risk Level</span>
                    <span className="info-value">
                      <span className="risk-badge-inline risk-10">Level {currentOpcvmData?.niveau_risque ?? '--'}/10</span>
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Inception Date</span>
                    <span className="info-value">
                      {currentOpcvmData?.date_agrement && !isNaN(new Date(currentOpcvmData.date_agrement).getTime())
                        ? new Date(currentOpcvmData.date_agrement).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short' })
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Country</span>
                    <span className="info-value">{typeof currentOpcvmData?.country === 'string' ? currentOpcvmData?.country : currentOpcvmData?.country?.name ?? '--'}</span>
                  </div>
                  <div className="info-row highlight">
                    <span className="info-label">ISR</span>
                    <span className="info-value">
                      <span className={`${currentOpcvmData?.isr ? 'badge-isr' : ''} `}> {currentOpcvmData?.isr ? "✓ Certified" : "Non Certified" }</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom: Map + Location */}
          <div className="location-section">
            <div className="section-header">
              <div className="location-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <div>
                  <h4>{typeof currentOpcvmData?.sgo === 'string' ? currentOpcvmData?.sgo : currentOpcvmData?.sgo?.name}</h4>
                  <p>{typeof currentOpcvmData?.sgo === 'string' ? '' : currentOpcvmData?.sgo?.geographic_address}</p>
                </div>
              </div>
            </div>
            <div className="map-container">
              {currentOpcvmData?.sgo && typeof currentOpcvmData.sgo !== 'string' && currentOpcvmData.sgo.latitude && currentOpcvmData.sgo.longitude ? (
                <LeafletMap
                  center={[currentOpcvmData.sgo.latitude, currentOpcvmData.sgo.longitude]}
                  zoom={13}
                  markerTitle={currentOpcvmData.sgo.name || 'Management Company'}
                  markerSubtitle={currentOpcvmData.sgo.geographic_address || ''}
                  height="100%"
                />
              ) : (
                <div style={{
                  height: '100%',
                  width: '100%',
                  borderRadius: '12px',
                  background: 'var(--card-background)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  No location data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
