'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useBourseRepository } from '@/core/infra/repositories/bourse.repository.impl';
import { useQueryParams } from '@/core/presenter/hooks/useQueryParams';
import { BourseQueryParams } from '@/core/domain/types/bourse.type';
import { OpcvmQueryParams } from '@/core/domain/types/opcvm.type';
import { useOpcvmRepository } from '@/core/infra/repositories/opcvm.repository.impl';
const AfricaOPCVMMap = dynamic(
  () => import('@/components/opcvm/AfricaOPCVMMap'),
  { ssr: false }
);

export default function OPCVMHomePage() {
  const [mapMode, setMapMode] = useState<'performance' | 'count'>('performance');
  const [viewMode, setViewMode] = useState<'map' | 'methodology'>('map');
  const [filterExchange, setFilterExchange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'performance' | 'risk'>('performance');

  const { params: queryParams } = useQueryParams<BourseQueryParams>({ view_type: "opcvm", page: 1, page_size: 10 });
  
  const opcvmParams = useMemo((): OpcvmQueryParams => {
    const params: OpcvmQueryParams = { view_type: "bourse", page: 1, page_size: 20 };
    
    if (sortBy === 'rating') params.ordering = 'rating';
    else if (sortBy === 'performance') params.ordering = 'performance_1m';
    else if (sortBy === 'risk') params.ordering = 'volatility_1m';
    
    if (filterExchange !== 'all') params.bourse_tickers = filterExchange;
    
    return params;
  }, [sortBy, filterExchange]);
  
  const { allBoursesData, getAllBourses, } = useBourseRepository();
  const { allOpcvmsData, getAllOpcvms, } = useOpcvmRepository();

  useEffect(() => { getAllBourses(queryParams); }, [queryParams]);
  useEffect(() => { getAllOpcvms(opcvmParams); }, [opcvmParams]);

  useEffect(() =>
  {
    console.log("All Bourses Data", allBoursesData)
    console.log("All OPCVM Data", allOpcvmsData)
  }, [allBoursesData, allOpcvmsData])
  

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
      {/* Header */}
      <div className="opcvm-header">
        <div 
          className="opcvm-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
          }}
        >
          <div className="header-top">
            <div className="header-title">
              <h1>African Funds Universe</h1>
              <p>Explore the African investment funds ecosystem</p>
            </div>
            
            <div className="opcvm-controls">
              <div className="control-group">
                <label>Exchange</label>
                <select 
                  value={filterExchange} 
                  onChange={(e) => setFilterExchange(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All exchanges</option>
                  {allBoursesData?.data?.filter(e => e.name !== 'all').map(ex => (
                    <option key={ex.id} value={ex.ticker}>{ex.ticker}</option>
                  ))}
                </select>
              </div>
              
              <div className="control-group">
                <label>Sort By</label>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value as 'rating' | 'performance' | 'risk')}
                  className="filter-select"
                >
                  <option value="rating">By rating</option>
                  <option value="performance">By performance</option>
                  <option value="risk">By risk</option>
                </select>
              </div>
              
              <div className="control-group">
                <label>View</label>
                <div className="mode-toggle">
                  <button
                    className={mapMode === 'performance' ? 'active' : ''}
                    onClick={() => setMapMode('performance')}
                    title="NAV Performance"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    </svg>
                    Performance
                  </button>
                  <button
                    className={mapMode === 'count' ? 'active' : ''}
                    onClick={() => setMapMode('count')}
                    title="Number of Funds"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    Count
                  </button>
                </div>
              </div>
            </div>
            <div className="opcvm-stats">
              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Tracked Funds</div>
                  <div className="stat-value">{allOpcvmsData?.count}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">Exchanges</div>
                  <div className="stat-value">{allBoursesData?.data.length}</div>
                </div>
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
              mode={mapMode}
              selectedExchange={filterExchange}
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
              Top Funds
            </button>
            <button
              className={viewMode === 'methodology' ? 'active' : ''}
              onClick={() => setViewMode('methodology')}
            >
              Methodology
            </button>
          </div>

          {viewMode === 'map' ? (
            <div className="top-funds-section">
              <div className="funds-header">
                <h3>Top Rated Funds</h3>
              </div>
              
              <div className="funds-list">
                {allOpcvmsData?.data.map((fund) => (
                  <Link key={fund.id} href={`/opcvm/${fund.id}`} className="fund-card">
                    <div className="fund-header">
                      <div className="fund-name">{fund.intitule}</div>
                      <div className="fund-exchange">{fund.bourse}</div>
                    </div>
                    
                    <div className="fund-rating">
                      {renderStars(fund?.latest_metrics?.rating || 0)}
                    </div>
                    
                    <div className="fund-metrics">
                      <div className="metric">
                        <span className="metric-label">Performance</span>
                        <span className={`metric-value ${fund.latest_metrics?.performance_1y && fund.latest_metrics.performance_1y >= 0 ? 'positive' : 'negative'}`}>
                          {fund?.latest_metrics?.performance_1y && fund.latest_metrics.performance_1y >= 0 ? '+' : ''}{Number(fund?.latest_metrics?.performance_1y)?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Score</span>
                        <span className="metric-value">{fund?.latest_metrics?.performance_1y && fund.latest_metrics.volatility_1y ? (fund.latest_metrics.performance_1y / fund.latest_metrics.volatility_1y).toFixed(2) : 'N/A'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="rating-section">
              <h3>Rating Methodology</h3>
              <p className="rating-description">
                5★ rating based on risk-adjusted performance.
              </p>
              
              <div className="rating-methodology">
                <div className="method-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Ratio</h4>
                    <p>Performance / Volatility</p>
                  </div>
                </div>
                <div className="method-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Ranking</h4>
                    <p>Descending sort</p>
                  </div>
                </div>
                <div className="method-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Groups</h4>
                    <p>5 balanced groups</p>
                  </div>
                </div>
                <div className="method-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>Assignment</h4>
                    <p>5★ to 1★</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Access Section */}
      <div className="quick-access-section">
        <h3>Funds Tools & Resources</h3>
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
              <h4>Funds Screener</h4>
              <p>Filter and compare funds according to your investment criteria</p>
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
              <h4>Comparison</h4>
              <p>Analyze side-by-side performance of multiple funds</p>
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
              <h4>Funds Titans</h4>
              <p>Discover leading managers and companies in the market</p>
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
              <h4>Simulator</h4>
              <p>Simulate your investments and return projections</p>
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
              <h4>Learn</h4>
              <p>Guides and resources to master Funds investment</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
