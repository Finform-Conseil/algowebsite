'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import AfricaFIMap from '@/components/fixed-income/AfricaFIMap';

type NewsCategory = 'news' | 'circulars' | 'press-releases' | 'consultations';
type ViewMode = 'cards' | 'list';

interface MarketOpportunity {
  id: string;
  title: string;
  type: 'auction' | 'issuance' | 'tender';
  country: string;
  amount: string;
  yield: number;
  maturity: string;
  deadline: string;
}

interface CountryStats {
  country: string;
  flag: string;
  yieldChange: number;
  avgYield: number;
  volume: string;
  activeIssues: number;
}

interface BondNews {
  id: string;
  title: string;
  category: NewsCategory;
  country: string;
  date: string;
  excerpt: string;
  featured: boolean;
}

export default function FixedIncomePage() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '' as NewsCategory | '',
    country: '',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  
  // Mapping between country names and ISO codes
  const countryIsoMap: Record<string, string> = {
    'Benin': 'BJ',
    'Senegal': 'SN',
    'Cote d\'Ivoire': 'CI',
    'Togo': 'TG',
    'Mali': 'ML',
    'Burkina Faso': 'BF',
    'Niger': 'NE',
    'Nigeria': 'NG',
    'Ghana': 'GH',
    'Cameroun': 'CM',
    'Gabon': 'GA',
  };

  const isoCountryMap: Record<string, string> = {
    'BJ': 'Benin',
    'SN': 'Senegal',
    'CI': 'Cote d\'Ivoire',
    'TG': 'Togo',
    'ML': 'Mali',
    'BF': 'Burkina Faso',
    'NE': 'Niger',
    'NG': 'Nigeria',
    'GH': 'Ghana',
    'CM': 'Cameroun',
    'GA': 'Gabon',
  };
  
  // Base data for countries
  const baseCountryData = {
    BJ: { count: 12, basePerformance: 5.4 }, // Bénin
    CI: { count: 45, basePerformance: 12.1 }, // Côte d'Ivoire
    NG: { count: 88, basePerformance: -2.3 }, // Nigeria
    SN: { count: 15, basePerformance: 3.2 }, // Sénégal
    TG: { count: 20, basePerformance: 4.5 }, // Togo
    GH: { count: 25, basePerformance: 2.8 }, // Ghana
    ML: { count: 30, basePerformance: -1.9 }, // Mali
    BF: { count: 35, basePerformance: 2.1 }, // Burkina Faso
    CM: { count: 40, basePerformance: 3.5 }, // Cameroun
    GA: { count: 45, basePerformance: 2.2 }, // Gabon
  };

  // State for dynamic country data
  const [countryData, setCountryData] = useState(() => {
    const initialData: Record<string, { count: number; bestPerformance: number }> = {};
    Object.entries(baseCountryData).forEach(([code, data]) => {
      initialData[code] = {
        count: data.count,
        bestPerformance: data.basePerformance,
      };
    });
    return initialData;
  });

  // Simulate continuous variation of bestPerformance values
  useEffect(() => {
    const interval = setInterval(() => {
      setCountryData((prevData) => {
        const newData: Record<string, { count: number; bestPerformance: number }> = {};
        
        Object.entries(prevData).forEach(([code, data]) => {
          const baseValue = baseCountryData[code as keyof typeof baseCountryData].basePerformance;
          const time = Date.now() / 1000;
          const frequency = 0.9 + (code.charCodeAt(0) % 5) * 0.5;
          const variation = Math.sin(time * frequency) * Math.abs(baseValue) * 0.5;
          const newPerformance = baseValue + variation;
          
          newData[code] = {
            count: data.count,
            bestPerformance: parseFloat(newPerformance.toFixed(2)),
          };
        });
        
        return newData;
      });
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Mock data for market opportunities
  const marketOpportunities: MarketOpportunity[] = [
    {
      id: 'OPP-001',
      title: 'Benin Treasury Bond Auction',
      type: 'auction',
      country: 'Benin',
      amount: '50B XOF',
      yield: 6.8,
      maturity: '5 years',
      deadline: '2025-01-15',
    },
    {
      id: 'OPP-002',
      title: 'Senegal Sovereign Bond Issuance',
      type: 'issuance',
      country: 'Senegal',
      amount: '100B XOF',
      yield: 7.2,
      maturity: '10 years',
      deadline: '2025-01-20',
    },
    {
      id: 'OPP-003',
      title: 'Côte d\'Ivoire Corporate Bond',
      type: 'tender',
      country: 'Cote d\'Ivoire',
      amount: '30B XOF',
      yield: 7.5,
      maturity: '7 years',
      deadline: '2025-01-18',
    },
    {
      id: 'OPP-004',
      title: 'Togo Treasury Bill Auction',
      type: 'auction',
      country: 'Togo',
      amount: '25B XOF',
      yield: 6.5,
      maturity: '3 years',
      deadline: '2025-01-12',
    },
  ];

  // Base static data for country statistics
  const baseCountryStats = [
    { country: 'Benin', flag: '🇧🇯', avgYield: 6.8, volume: '450B', activeIssues: 12 },
    { country: 'Senegal', flag: '🇸🇳', avgYield: 7.2, volume: '820B', activeIssues: 18 },
    { country: 'Cote d\'Ivoire', flag: '🇨🇮', avgYield: 7.5, volume: '1.2T', activeIssues: 24 },
    { country: 'Togo', flag: '🇹🇬', avgYield: 6.5, volume: '320B', activeIssues: 9 },
    { country: 'Mali', flag: '🇲🇱', avgYield: 8.2, volume: '280B', activeIssues: 7 },
    { country: 'Burkina Faso', flag: '🇧🇫', avgYield: 7.0, volume: '210B', activeIssues: 6 },
    { country: 'Niger', flag: '🇳🇪', avgYield: 7.8, volume: '180B', activeIssues: 5 },
  ];

  // Dynamic country statistics synced with map data
  const countryStats: CountryStats[] = baseCountryStats.map((stat) => {
    const isoCode = countryIsoMap[stat.country];
    const dynamicData = countryData[isoCode];
    return {
      ...stat,
      yieldChange: dynamicData ? dynamicData.bestPerformance : 0,
    };
  });

  // Mock data for bond news
  const allBondNews: BondNews[] = [
    {
      id: 'NEWS-001',
      title: 'BCEAO Announces New Monetary Policy Framework',
      category: 'news',
      country: 'WAEMU',
      date: '2024-12-28',
      excerpt: 'The Central Bank of West African States introduces new guidelines for bond market operations...',
      featured: true,
    },
    {
      id: 'NEWS-002',
      title: 'Senegal Successfully Raises $1.5B in Eurobond',
      category: 'news',
      country: 'Senegal',
      date: '2024-12-27',
      excerpt: 'Strong investor demand drives successful sovereign bond issuance with favorable terms...',
      featured: true,
    },
    {
      id: 'NEWS-003',
      title: 'New Circular on Bond Settlement Procedures',
      category: 'circulars',
      country: 'WAEMU',
      date: '2024-12-26',
      excerpt: 'Updated settlement and clearing procedures for regional bond market participants...',
      featured: false,
    },
    {
      id: 'NEWS-004',
      title: 'Côte d\'Ivoire Credit Rating Upgraded',
      category: 'press-releases',
      country: 'Cote d\'Ivoire',
      date: '2024-12-25',
      excerpt: 'International rating agency upgrades sovereign credit rating citing strong economic fundamentals...',
      featured: true,
    },
    {
      id: 'NEWS-005',
      title: 'Public Consultation: Green Bond Framework',
      category: 'consultations',
      country: 'WAEMU',
      date: '2024-12-24',
      excerpt: 'Regional authorities seek stakeholder input on proposed green bond issuance framework...',
      featured: false,
    },
    {
      id: 'NEWS-006',
      title: 'Benin Treasury Announces Q1 2025 Auction Calendar',
      category: 'press-releases',
      country: 'Benin',
      date: '2024-12-23',
      excerpt: 'Ministry of Finance releases schedule for upcoming treasury bond auctions...',
      featured: false,
    },
  ];

  const filteredNews = allBondNews.filter(news => {
    if (filters.startDate && news.date < filters.startDate) return false;
    if (filters.endDate && news.date > filters.endDate) return false;
    if (filters.category && news.category !== filters.category) return false;
    if (filters.country && news.country !== filters.country) return false;
    return true;
  });

  const featuredNews = allBondNews.filter(news => news.featured);

  const getCategoryLabel = (category: NewsCategory) => {
    const labels = {
      'news': 'News',
      'circulars': 'Circulars',
      'press-releases': 'Press Releases',
      'consultations': 'Consultations',
    };
    return labels[category];
  };

  const getOpportunityTypeColor = (type: string) => {
    const colors = {
      'auction': 'type-auction',
      'issuance': 'type-issuance',
      'tender': 'type-tender',
    };
    return colors[type as keyof typeof colors] || 'type-auction';
  };

  return (
    <div className="fixed-income-page">
      <div className="header-opportunities-wrapper">
        <div className="fi-header">
          <h1>African Fixed Income Market</h1>
          <p>Comprehensive overview of bond markets across West Africa</p>
        </div>

        {/* Market Opportunities Carousel */}
        <div className="market-opportunities-section">
          <div className="opportunities-carousel" ref={scrollRef}>
          {[...marketOpportunities, ...marketOpportunities].map((opp, index) => (
            <div key={`${opp.id}-${index}`} className="opportunity-card">
              <div className="opp-header">
                <span className={`opp-type ${getOpportunityTypeColor(opp.type)}`}>
                  {opp.type}
                </span>
                <span className="opp-country">{opp.country}</span>
              </div>
              <h3>{opp.title}</h3>
              <div className="opp-details">
                <div className="opp-detail">
                  <span className="label">Amount</span>
                  <strong>{opp.amount}</strong>
                </div>
                <div className="opp-detail">
                  <span className="label">Yield</span>
                  <strong>{opp.yield}%</strong>
                </div>
                <div className="opp-detail">
                  <span className="label">Maturity</span>
                  <strong>{opp.maturity}</strong>
                </div>
              </div>
              <div className="opp-deadline">
                Deadline: {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Market Overview Section */}
      <div className="market-overview-section">
        <div className="country-stats-container">
          <div className="stats-table-wrapper">
            <table className="country-stats-table">
              <thead>
                <tr>
                  <th>Country</th>
                  <th className="number-col">Yield Change</th>
                  <th className="number-col">Avg Yield</th>
                  <th className="number-col">Volume</th>
                  <th className="number-col">Active Issues</th>
                </tr>
              </thead>
              <tbody>
                {countryStats.map((stat) => (
                  <tr key={stat.country}>
                    <td className="country-cell">
                      <span className="country-flag">{stat.flag}</span>
                      {stat.country}
                    </td>
                    <td className={`number-col ${stat.yieldChange >= 0 ? 'positive' : 'negative'}`}>
                      {stat.yieldChange >= 0 ? '+' : ''}{stat.yieldChange.toFixed(2)}%
                    </td>
                    <td className="number-col">{stat.avgYield.toFixed(2)}%</td>
                    <td className="number-col">{stat.volume} XOF</td>
                    <td className="number-col">{stat.activeIssues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="africa-map-container">
          <div className="map-placeholder">
            <AfricaFIMap 
              data={countryData} 
              mode="performance" 
              onCountryClick={(id, info) => {
                const countryName = isoCountryMap[id];
                if (countryName) {
                  setSelectedCountry(countryName);
                  setFilters({ ...filters, country: countryName });
                }
              }} 
            />
          </div>
        </div>
      </div>

      {/* Bond Market News Section */}
      <div className="bond-news-section">
        <div className="news-main-content">
          <div className="news-header">
            <div className="news-filters">
              <div className="filter-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>
              <div className="filter-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value as NewsCategory | '' })}
                >
                  <option value="">All Categories</option>
                  <option value="news">News</option>
                  <option value="circulars">Circulars</option>
                  <option value="press-releases">Press Releases</option>
                  <option value="consultations">Consultations</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Country/Zone</label>
                <select
                  value={filters.country}
                  onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                >
                  <option value="">All Countries</option>
                  <option value="WAEMU">WAEMU</option>
                  <option value="Benin">Benin</option>
                  <option value="Senegal">Senegal</option>
                  <option value="Cote d'Ivoire">Côte d'Ivoire</option>
                  <option value="Togo">Togo</option>
                  <option value="Mali">Mali</option>
                  <option value="Burkina Faso">Burkina Faso</option>
                  <option value="Niger">Niger</option>
                </select>
              </div>
              
            </div>
            <div className="view-mode-toggle">
                <button
                  className={viewMode === 'cards' ? 'active' : ''}
                  onClick={() => setViewMode('cards')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
          </div>

          <div className={`news-content ${viewMode}`}>
            {filteredNews.length === 0 ? (
              <div className="empty-state">
                <p>No news found matching your filters</p>
              </div>
            ) : (
              filteredNews.map((news) => (
                <div key={news.id} className="news-item">
                  <div className="news-meta">
                    <span className={`news-category category-${news.category}`}>
                      {getCategoryLabel(news.category)}
                    </span>
                    <span className="news-country">{news.country}</span>
                    <span className="news-date">
                      {new Date(news.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <h3>{news.title}</h3>
                  <p>{news.excerpt}</p>
                  <Link href={`/news-articles`} className="read-more">
                    Read more →
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="featured-news-sidebar">
          <h3>Featured News</h3>
          <div className="featured-news-list">
            {featuredNews.map((news) => (
              <div key={news.id} className="featured-news-item">
                <span className={`news-category category-${news.category}`}>
                  {getCategoryLabel(news.category)}
                </span>
                <h4>{news.title}</h4>
                <p>{news.excerpt}</p>
                <div className="featured-meta">
                  <span className="news-country">{news.country}</span>
                  <span className="news-date">
                    {new Date(news.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
