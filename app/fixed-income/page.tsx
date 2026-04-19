'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import YieldCurveSection from '@/components/fixed-income/YieldCurveSection';

const backgroundImages = [
  '/images/screener-header-3.jpg',
  '/images/exchanges-header-2.jpg',
  '/images/exchanges-header-1.jpg',
];

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
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['BJ', 'SN', 'CI']);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    category: '' as NewsCategory | '',
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Background image carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  
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
      country: 'BRVM',
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
      country: 'BRVM',
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
      country: 'BRVM',
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

  // Map country names to ISO codes for filtering
  const countryNameMap: Record<string, string> = {
    'BJ': 'Benin',
    'SN': 'Senegal',
    'CI': 'Cote d\'Ivoire',
    'TG': 'Togo',
    'ML': 'Mali',
    'BF': 'Burkina Faso',
    'NG': 'Nigeria',
    'GH': 'Ghana',
    'NE': 'Niger',
  };

  const filteredNews = allBondNews.filter(news => {
    if (filters.startDate && news.date < filters.startDate) return false;
    if (filters.endDate && news.date > filters.endDate) return false;
    if (filters.category && news.category !== filters.category) return false;
    if (selectedCountries.length > 0) {
      const selectedCountryNames = selectedCountries.map(code => countryNameMap[code]);
      if (!selectedCountryNames.includes(news.country)) return false;
    }
    return true;
  });

  const featuredNews = filteredNews.filter(news => news.featured);

  // Fixed Income Tools
  const fixedIncomeTools = [
    {
      title: 'Bond Screener',
      description: 'Advanced filtering for bonds and treasury bills',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      ),
      link: '/fixed-income/screener',
      color: '#4A90E2',
    },
    {
      title: 'Yield Calculator',
      description: 'Calculate yields and returns on fixed income securities',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M3 9h18M9 21V9"/>
        </svg>
      ),
      link: '/fixed-income/yield-calculator',
      color: '#10B981',
    },
    {
      title: 'Auction Calendar',
      description: 'Upcoming treasury auctions and issuances',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      link: '/fixed-income/auction-calendar',
      color: '#F59E0B',
    },
    {
      title: 'Credit Ratings',
      description: 'Sovereign and corporate credit ratings',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ),
      link: '/fixed-income/credit-ratings',
      color: '#8B5CF6',
    },
    {
      title: 'Market Data',
      description: 'Real-time bond prices and market indicators',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      ),
      link: '/fixed-income/market-data',
      color: '#EC4899',
    },
    {
      title: 'Portfolio Analytics',
      description: 'Analyze and optimize your bond portfolio',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
          <path d="M22 12A10 10 0 0 0 12 2v10z"/>
        </svg>
      ),
      link: '/fixed-income/portfolio-analytics',
      color: '#06B6D4',
    },
  ];

  // News rotation for featured article with countdown
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    // Countdown timer (updates every second)
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    // News rotation (every 15 seconds)
    const newsInterval = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
      setCountdown(15);
    }, 15000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(newsInterval);
    };
  }, [featuredNews.length]);

  const handleNewsNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentNewsIndex((prev) => (prev - 1 + featuredNews.length) % featuredNews.length);
    } else {
      setCurrentNewsIndex((prev) => (prev + 1) % featuredNews.length);
    }
    setCountdown(15);
  };

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
        <div 
          className="fi-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            transition: 'background-image 1s ease-in-out',
          }}
        >
          <div className="header-main">
            <div className="header-content">
              <h1>African Fixed Income Market</h1>
              <p>Comprehensive overview of bond markets across West Africa</p>
            </div>

            {/* News Filters */}
            <div className="news-filters-header">
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
              <div className="filter-group country-multiselect">
                <label>Countries</label>
                <div className="multiselect-display">
                  {selectedCountries.length === 0 ? 'All Countries' : `${selectedCountries.length} selected`}
                </div>
                <div className="multiselect-dropdown">
                  {[
                    { code: 'BJ', name: 'Benin' },
                    { code: 'SN', name: 'Senegal' },
                    { code: 'CI', name: 'Côte d\'Ivoire' },
                    { code: 'TG', name: 'Togo' },
                    { code: 'ML', name: 'Mali' },
                    { code: 'BF', name: 'Burkina Faso' },
                    { code: 'NG', name: 'Nigeria' },
                    { code: 'GH', name: 'Ghana' },
                    { code: 'NE', name: 'Niger' },
                  ].map((country) => (
                    <label key={country.code} className="multiselect-option">
                      <input
                        type="checkbox"
                        checked={selectedCountries.includes(country.code)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCountries([...selectedCountries, country.code]);
                          } else {
                            setSelectedCountries(selectedCountries.filter(c => c !== country.code));
                          }
                        }}
                      />
                      <span>{country.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 60-40 Layout */}
      <div className="fi-main-content">
        {/* Left Column: 65% - Yield Curve & Tools */}
        <div className="left-column">
          {/* Yield Curve Section */}
          <YieldCurveSection selectedCountries={selectedCountries} />

          {/* Fixed Income Tools Grid */}
          <div className="fi-tools-section">
            <h2 className="section-title">Fixed Income Analysis Tools</h2>
            <div className="tools-grid">
              {fixedIncomeTools.map((tool, idx) => (
                <Link key={idx} href={tool.link} className="tool-card">
                  <div className="tool-icon" style={{ backgroundColor: `${tool.color}15`, color: tool.color }}>
                    {tool.icon}
                  </div>
                  <div className="tool-content">
                    <h3 style={{ color: tool.color }}>{tool.title}</h3>
                    <p>{tool.description}</p>
                  </div>
                  <div className="tool-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: 40% - Featured News */}
        <div className="right-column">
          {/* Featured News Carousel */}
          <div className="featured-news-section">
            <div className="featured-news-nav">
              <button
                onClick={() => handleNewsNavigation('prev')}
                className="nav-arrow"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
              <button
                onClick={() => handleNewsNavigation('next')}
                className="nav-arrow"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>

            {/* Circular Countdown Timer */}
            <div className="countdown-timer">
              <svg width="40" height="40" viewBox="0 0 40 40">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.2)"
                  strokeWidth="3"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray={`${2 * Math.PI * 16}`}
                  strokeDashoffset={`${2 * Math.PI * 16 * (1 - countdown / 15)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span className="countdown-number">{countdown}</span>
            </div>

            {featuredNews.length > 0 && (
              <div className="featured-news-card">
                <div className="featured-news-image">
                  <div className="image-placeholder" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />
                  <span className={`featured-category category-${featuredNews[currentNewsIndex].category}`}>
                    {getCategoryLabel(featuredNews[currentNewsIndex].category)}
                  </span>
                </div>
                <div className="featured-news-content">
                  <h3>{featuredNews[currentNewsIndex].title}</h3>
                  <p>{featuredNews[currentNewsIndex].excerpt}</p>
                  <div className="featured-news-meta">
                    <span className="meta-country">{featuredNews[currentNewsIndex].country}</span>
                    <span className="meta-date">
                      {new Date(featuredNews[currentNewsIndex].date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric' 
                      })}
                    </span>
                    <span className="meta-read">5 min read</span>
                  </div>
                  <Link href="/news-articles" className="read-more-btn">
                    Read Full Article →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Recommended Articles */}
          <div className="recommended-news-section">
            <h3 className="recommended-title">Recommended Articles</h3>
            <div className="recommended-news-grid">
              {filteredNews.slice(0, 2).map((news) => (
                <Link key={news.id} href="/news-articles" className="recommended-news-card">
                  <span className={`news-category category-${news.category}`}>
                    {getCategoryLabel(news.category)}
                  </span>
                  <h4>{news.title}</h4>
                  <p>{news.excerpt}</p>
                  <div className="recommended-meta">
                    <span>{news.country}</span>
                    <span>{new Date(news.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
