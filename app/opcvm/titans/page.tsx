'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Types
type ManagementCompany = {
  id: string;
  rank: number;
  name: string;
  logo?: string;
  headquarters: string;
  foundedYear: number;
  mission: string;
  philosophy: string;
  aum: number; // Assets Under Management in millions
  avgPerformance: number; // Average weighted performance
  specialization: string;
  website: string;
  markets: string[];
};

type ClassificationMode = 'market' | 'asset-nature' | 'opcvm-category' | 'continental';
type ViewMode = 'overview' | 'table' | 'cards';

export default function OPCVMTitansPage() {
  const [selectedMarket, setSelectedMarket] = useState<string>('BRVM');
  const [classificationMode, setClassificationMode] = useState<ClassificationMode>('market');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
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

  // Mock data - Top 5 Management Companies
  const mockCompanies: ManagementCompany[] = [
    {
      id: 'mc1',
      rank: 1,
      name: 'NSIA Gestion',
      headquarters: 'Abidjan, Ivory Coast',
      foundedYear: 2010,
      mission: 'Provide innovative and high-performing investment solutions',
      philosophy: 'Value approach with focus on fundamentals',
      aum: 45000,
      avgPerformance: 12.5,
      specialization: 'Banking and telecom sector expertise, active management',
      website: 'https://nsia-gestion.com',
      markets: ['BRVM', 'NSE']
    },
    {
      id: 'mc2',
      rank: 2,
      name: 'Coris Asset Management',
      headquarters: 'Ouagadougou, Burkina Faso',
      foundedYear: 2012,
      mission: 'Maximize value for our clients through rigorous management',
      philosophy: 'Diversified management with quantitative approach',
      aum: 38500,
      avgPerformance: 11.8,
      specialization: 'ESG thematic strategies, bond management',
      website: 'https://coris-am.com',
      markets: ['BRVM', 'GSE']
    },
    {
      id: 'mc3',
      rank: 3,
      name: 'BOA Capital',
      headquarters: 'Dakar, Senegal',
      foundedYear: 2008,
      mission: 'Support African economic growth',
      philosophy: 'Growth investment with long-term vision',
      aum: 32000,
      avgPerformance: 10.2,
      specialization: 'Infrastructure and energy focus, mixed management',
      website: 'https://boa-capital.com',
      markets: ['BRVM', 'CSE']
    },
    {
      id: 'mc4',
      rank: 4,
      name: 'Ecobank Asset Management',
      headquarters: 'Lomé, Togo',
      foundedYear: 2015,
      mission: 'Create sustainable value for our investors',
      philosophy: 'Balanced risk-return approach',
      aum: 28000,
      avgPerformance: 9.7,
      specialization: 'Money market and bond management, regional expertise',
      website: 'https://ecobank-am.com',
      markets: ['BRVM', 'NGX', 'GSE']
    },
    {
      id: 'mc5',
      rank: 5,
      name: 'Société Générale Asset Management Africa',
      headquarters: 'Abidjan, Ivory Coast',
      foundedYear: 2006,
      mission: 'Excellence in asset management with international standards',
      philosophy: 'SRI management and responsible investment',
      aum: 25500,
      avgPerformance: 9.3,
      specialization: 'SRI and sustainable finance, equity management',
      website: 'https://sgam-africa.com',
      markets: ['BRVM', 'JSE', 'NSE']
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 1000000);
  };

  const getClassificationTitle = () => {
    switch (classificationMode) {
      case 'market':
        return `Market Dominance (${selectedMarket})`;
      case 'asset-nature':
        return 'Mastery by Asset Nature';
      case 'opcvm-category':
        return 'Leadership by UCITS Category';
      case 'continental':
        return 'Continental Influence';
      default:
        return 'Classification';
    }
  };

  return (
    <div className="opcvm-titans-page">
      {/* Header */}
      <div className="titans-header">
        <div 
          className="header-hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
          }}
        >
          <div className="header-content">
            <div className="header-title">
              <h1>The Funds Titans</h1>
              <p>An Overview of Asset Management Leaders</p>
            </div>
            <div className="header-filters-section">
            <div className="header-filters">
              <div className="filter-group">
                <label>Classification</label>
                <select
                  className="classification-select"
                  value={classificationMode}
                  onChange={(e) => setClassificationMode(e.target.value as ClassificationMode)}
                >
                  <option value="market">By Stock Market</option>
                  <option value="asset-nature">By Asset Nature</option>
                  <option value="opcvm-category">By UCITS Category</option>
                  <option value="continental">Continental Influence</option>
                </select>
              </div>

              {classificationMode === 'market' && (
                <div className="filter-group">
                  <label>Market</label>
                  <select
                    className="market-select"
                    value={selectedMarket}
                    onChange={(e) => setSelectedMarket(e.target.value)}
                  >
                    <option value="BRVM">BRVM</option>
                    <option value="JSE">JSE</option>
                    <option value="NGX">NGX</option>
                    <option value="NSE">NSE</option>
                    <option value="CSE">CSE</option>
                    <option value="GSE">GSE</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          </div>
          
        </div>

        
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          className={`tab-btn ${viewMode === 'table' ? 'active' : ''}`}
          onClick={() => setViewMode('table')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          Table View
        </button>
        <button
          className={`tab-btn ${viewMode === 'overview' ? 'active' : ''}`}
          onClick={() => setViewMode('overview')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Overview
        </button>
        
        <button
          className={`tab-btn ${viewMode === 'cards' ? 'active' : ''}`}
          onClick={() => setViewMode('cards')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Cards View
        </button>
      </div>

      {/* Content */}
      <div className="titans-content">
        {/* Vue d'Ensemble */}
        {viewMode === 'overview' && (
          <div className="overview-view">
            {/* Introduction */}
            <section className="titans-section intro-section">
              <h2>Navigating the Funds Universe</h2>
              <p>
                In the dynamic and complex universe of Undertakings for Collective Investment in Transferable Securities (UCITS), 
                selecting a competent management company aligned with your investment objectives is a crucial step. 
                This exclusive guide provides insights into the sector's major players, presenting and classifying the top five 
                management companies according to a variety of essential criteria.
              </p>
              <div className="key-criteria">
                <div className="criterion-item">
                  <div className="criterion-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <div className="criterion-text">
                    <h4>Assets Under Management</h4>
                    <p>AUM volume and growth</p>
                  </div>
                </div>
                <div className="criterion-item">
                  <div className="criterion-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </div>
                  <div className="criterion-text">
                    <h4>Performance</h4>
                    <p>Historical fund returns</p>
                  </div>
                </div>
                <div className="criterion-item">
                  <div className="criterion-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div className="criterion-text">
                    <h4>Compliance</h4>
                    <p>Regulatory compliance</p>
                  </div>
                </div>
                <div className="criterion-item">
                  <div className="criterion-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                  <div className="criterion-text">
                    <h4>Expertise</h4>
                    <p>Specializations and know-how</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Classification Modes */}
            <section className="titans-section classification-section">
              <h2>Identifying Leaders from Different Perspectives</h2>
              <div className="classification-grid">
                <div className={`classification-card ${classificationMode === 'market' ? 'active' : ''}`}>
                  <div className="card-icon market">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <h3>Stock Market Dominance</h3>
                  <p>Influential players in specific markets, measured by assets under management volume and fund performance.</p>
                </div>

                <div className={`classification-card ${classificationMode === 'asset-nature' ? 'active' : ''}`}>
                  <div className="card-icon asset">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <h3>Mastery by Asset Nature</h3>
                  <p>Expertise in specific asset classes: equities, bonds, money market, mixed, alternatives, real estate.</p>
                </div>

                <div className={`classification-card ${classificationMode === 'opcvm-category' ? 'active' : ''}`}>
                  <div className="card-icon category">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </div>
                  <h3>Leadership by UCITS Category</h3>
                  <p>Dominance in specific UCITS categories in terms of managed assets and performance within their segment.</p>
                </div>

                <div className={`classification-card ${classificationMode === 'continental' ? 'active' : ''}`}>
                  <div className="card-icon continental">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <h3>Continental Influence</h3>
                  <p>Geographic perspective identifying leaders on each exchange based on their global assets under management.</p>
                </div>
              </div>
            </section>

            {/* Current Classification Preview */}
            <section className="titans-section preview-section">
              <div className="section-header">
                <h2>{getClassificationTitle()}</h2>
                <p>Top 5 leading management companies</p>
              </div>
              <div className="preview-stats">
                <div className="stat-card">
                  <div className="stat-value">{mockCompanies.length}</div>
                  <div className="stat-label">Leading Companies</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatCurrency(mockCompanies.reduce((sum, c) => sum + c.aum, 0))}</div>
                  <div className="stat-label">Total Assets Managed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{(mockCompanies.reduce((sum, c) => sum + c.avgPerformance, 0) / mockCompanies.length).toFixed(1)}%</div>
                  <div className="stat-label">Average Performance</div>
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <section className="titans-section disclaimer">
              <div className="disclaimer-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2>Important Disclaimer</h2>
              <p>
                <strong>Past performance does not guarantee future results.</strong> This overview provides a valuable starting point 
                for your analysis, but each investor must conduct their own thorough research, taking into account 
                their specific objectives, risk profile, and the suitability of the proposed strategies.
              </p>
            </section>
          </div>
        )}

        {/* Vue Tableau */}
        {viewMode === 'table' && (
          <div className="table-view">
            {/* <div className="table-header">
              <h2>{getClassificationTitle()}</h2>
              <p>Ranking of the top 5 management companies</p>
            </div> */}

            <div className="titans-table-container">
              <table className="titans-table">
                <thead>
                  <tr>
                    <th className="rank-col">Rank</th>
                    <th className="company-col">Management Company</th>
                    <th className="aum-col">Assets Under Management</th>
                    <th className="performance-col">Average Performance</th>
                    <th className="specialization-col">Management Specialization</th>
                    <th className="website-col">Website</th>
                  </tr>
                </thead>
                <tbody>
                  {mockCompanies.map((company) => (
                    <tr key={company.id} className="company-row">
                      <td className="rank-cell">
                        <div className={`rank-badge rank-${company.rank}`}>
                          {company.rank === 1 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          )}
                          #{company.rank}
                        </div>
                      </td>
                      <td className="company-cell">
                        <div className="company-info">
                          <div className="company-name">{company.name}</div>
                          <div className="company-location">{company.headquarters}</div>
                        </div>
                      </td>
                      <td className="aum-cell">
                        <div className="aum-value">{formatCurrency(company.aum)}</div>
                        <div className="aum-label">Millions FCFA</div>
                      </td>
                      <td className="performance-cell">
                        <div className={`performance-value ${company.avgPerformance >= 10 ? 'high' : 'medium'}`}>
                          +{company.avgPerformance}%
                        </div>
                        <div className="performance-label">Over 12 months</div>
                      </td>
                      <td className="specialization-cell">
                        <div className="specialization-text">{company.specialization}</div>
                      </td>
                      <td className="website-cell">
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="website-link">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                          Visit
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                The data presented is based on available information and may change.
              </p>
            </div>
          </div>
        )}

        {/* Vue Cartes */}
        {viewMode === 'cards' && (
          <div className="cards-view">
            {/* <div className="cards-header">
              <h2>{getClassificationTitle()}</h2>
              <p>Detailed profiles of leading management companies</p>
            </div> */}

            <div className="companies-grid">
              {mockCompanies.map((company) => (
                <div key={company.id} className={`company-card rank-${company.rank}`}>
                  <div className="card-header">
                    <div>
                      <div className="card-rank">
                      {company.rank === 1 && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                      <span>#{company.rank}</span>
                    </div>
                    <div className="info-section">
                      <div className="info-label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Founded in {company.foundedYear}
                      </div>
                    </div>

                    </div>
                    <div>
                      <h3>{company.name}</h3>
                      <p className="headquarters">{company.headquarters}</p>
                    </div>
                    
                  </div>

                  <div className="card-body">
                    

                    <div className="info-section">
                      <h4>Mission</h4>
                      <p>{company.mission}</p>
                    </div>

                    <div className="info-section">
                      <h4>Investment Philosophy</h4>
                      <p>{company.philosophy}</p>
                    </div>

                    <div className="metrics-grid">
                      <div className="metric-item">
                        <div className="metric-label">Assets Under Management</div>
                        <div className="metric-value">{formatCurrency(company.aum)}</div>
                      </div>
                      <div className="metric-item">
                        <div className="metric-label">Average Performance</div>
                        <div className={`metric-value ${company.avgPerformance >= 10 ? 'positive' : 'neutral'}`}>
                          +{company.avgPerformance}%
                        </div>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>Management Specialization</h4>
                      <p className="specialization">{company.specialization}</p>
                    </div>

                    <div className="info-section">
                      <h4>Markets of Operation</h4>
                      <div className="opcvm-markets-tags">
                        {company.markets.map((market) => (
                          <span key={market} className="opcvm-market-tag">{market}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="card-footer">
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="visit-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                      Visit website
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
