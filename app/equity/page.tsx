'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import TreemapChart, { TreemapNode } from '@/components/charts/TreemapChart';

const backgroundImages = [
  '/images/screener-header-3.jpg',
  '/images/exchanges-header-2.jpg',
  '/images/exchanges-header-1.jpg',
];

const exchanges = ['All', 'BRVM', 'NSE', 'JSE', 'EGX', 'NGSE', 'DSE'];

const equityTools = [
  {
    title: 'Stock Screener',
    description: 'Advanced filtering and screening tools',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    link: '/equity/screener',
    color: '#00BFFF',
  },
  {
    title: 'Market Movers',
    description: 'Top gainers and losers across markets',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
    link: '/equity/market-movers',
    color: '#10b981',
  },
  {
    title: 'Sectors Analysis',
    description: 'Sector performance and trends',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/>
        <rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/>
        <rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
    link: '/equity/sectors',
    color: '#8b5cf6',
  },
  {
    title: 'IPO Calendar',
    description: 'Upcoming and recent IPOs',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    link: '/equity/ipo',
    color: '#f59e0b',
  },
  {
    title: 'Corporate Events',
    description: 'Earnings, dividends, and more',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    link: '/equity/corporate-events',
    color: '#ec4899',
  },
  {
    title: 'Technical Analysis',
    description: 'Charts and technical indicators',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="20" x2="12" y2="10"/>
        <line x1="18" y1="20" x2="18" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="16"/>
      </svg>
    ),
    link: '/equity/technical-analysis',
    color: '#06b6d4',
  },
];

interface NewsArticle {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  date: string;
  readTime: string;
}

const newsArticles: NewsArticle[] = [
  {
    id: 1,
    title: 'BRVM Composite Index Reaches Historic High',
    excerpt: 'The regional stock exchange continues its upward trajectory as major banks report strong Q4 earnings, driving investor confidence across West African markets...',
    image: '/images/news-1.jpg',
    category: 'Market Update',
    date: '2 hours ago',
    readTime: '3 min read',
  },
  {
    id: 2,
    title: 'Safaricom Announces Major 5G Expansion',
    excerpt: 'Kenya\'s leading telecom operator plans to invest $500M in expanding 5G coverage across East Africa, positioning itself as a regional technology leader...',
    image: '/images/news-2.jpg',
    category: 'Corporate News',
    date: '5 hours ago',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'JSE Mining Sector Rallies on Commodity Prices',
    excerpt: 'South African mining stocks surge as gold and platinum prices strengthen, with major producers reporting increased production and profitability...',
    image: '/images/news-3.jpg',
    category: 'Sector Analysis',
    date: '1 day ago',
    readTime: '5 min read',
  },
  {
    id: 4,
    title: 'Nigerian Banks Lead Regional Growth',
    excerpt: 'Major Nigerian banks report record profits driven by digital banking adoption and increased lending activity across key sectors...',
    image: '/images/news-4.jpg',
    category: 'Banking',
    date: '1 day ago',
    readTime: '4 min read',
  },
];

export default function EquityHomePage() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [selectedExchange, setSelectedExchange] = useState('All');
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  // Background image carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // News auto-rotation with countdown
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
      setCurrentNewsIndex((prev) => (prev + 1) % newsArticles.length);
      setCountdown(15);
    }, 15000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(newsInterval);
    };
  }, []);

  const handleNewsNavigation = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentNewsIndex((prev) => (prev - 1 + newsArticles.length) % newsArticles.length);
    } else {
      setCurrentNewsIndex((prev) => (prev + 1) % newsArticles.length);
    }
    setCountdown(15);
  };

  // Market cap data grouped by exchange
  const marketCapData: TreemapNode[] = [
    {
      name: 'BRVM',
      value: [125000000000, 0, 4.2],
      children: [
        { name: 'Sonatel', value: [18500000000, 0, 5.8] },
        { name: 'Ecobank CI', value: [12300000000, 0, 4.2] },
        { name: 'SGBCI', value: [8900000000, 0, 3.1] },
        { name: 'BOA Senegal', value: [7200000000, 0, -1.5] },
        { name: 'Total Senegal', value: [6800000000, 0, 2.3] },
        { name: 'CFAO Motors', value: [5400000000, 0, 1.8] },
        { name: 'PALMCI', value: [4900000000, 0, -2.1] },
      ],
    },
    {
      name: 'NSE',
      value: [245000000000, 0, 6.7],
      children: [
        { name: 'Safaricom', value: [89000000000, 0, 8.2] },
        { name: 'Equity Bank', value: [45000000000, 0, 5.4] },
        { name: 'KCB Group', value: [38000000000, 0, 4.9] },
        { name: 'East African Breweries', value: [28000000000, 0, 3.2] },
        { name: 'BAT Kenya', value: [22000000000, 0, 2.1] },
        { name: 'Bamburi Cement', value: [15000000000, 0, -1.8] },
        { name: 'Kenya Airways', value: [8000000000, 0, -4.5] },
      ],
    },
    {
      name: 'JSE',
      value: [890000000000, 0, 3.8],
      children: [
        { name: 'Naspers', value: [185000000000, 0, 5.2] },
        { name: 'Anglo American', value: [125000000000, 0, 4.8] },
        { name: 'Standard Bank', value: [98000000000, 0, 3.9] },
        { name: 'MTN Group', value: [87000000000, 0, 6.1] },
        { name: 'FirstRand', value: [76000000000, 0, 2.7] },
        { name: 'Sasol', value: [54000000000, 0, -2.3] },
        { name: 'Shoprite', value: [48000000000, 0, 1.9] },
      ],
    },
    {
      name: 'EGX',
      value: [156000000000, 0, 2.4],
      children: [
        { name: 'CIB', value: [42000000000, 0, 3.8] },
        { name: 'Commercial Bank', value: [28000000000, 0, 2.9] },
        { name: 'Orascom Construction', value: [24000000000, 0, 4.2] },
        { name: 'Eastern Tobacco', value: [18000000000, 0, 1.5] },
        { name: 'Talaat Moustafa', value: [16000000000, 0, 5.1] },
        { name: 'EFG Hermes', value: [14000000000, 0, 3.3] },
        { name: 'Juhayna Food', value: [14000000000, 0, -1.2] },
      ],
    },
    {
      name: 'NGSE',
      value: [198000000000, 0, 5.3],
      children: [
        { name: 'Dangote Cement', value: [52000000000, 0, 7.2] },
        { name: 'Airtel Africa', value: [38000000000, 0, 6.8] },
        { name: 'Zenith Bank', value: [28000000000, 0, 4.9] },
        { name: 'GTBank', value: [24000000000, 0, 5.1] },
        { name: 'Nigerian Breweries', value: [18000000000, 0, 2.3] },
        { name: 'Nestle Nigeria', value: [16000000000, 0, 3.7] },
        { name: 'BUA Cement', value: [22000000000, 0, 8.5] },
      ],
    },
    {
      name: 'DSE',
      value: [42000000000, 0, 4.1],
      children: [
        { name: 'CRDB Bank', value: [12000000000, 0, 5.2] },
        { name: 'NMB Bank', value: [9500000000, 0, 4.8] },
        { name: 'Tanzania Breweries', value: [7800000000, 0, 3.1] },
        { name: 'Swissport', value: [5200000000, 0, 2.9] },
        { name: 'TCC', value: [4500000000, 0, 1.8] },
        { name: 'TPCC', value: [3000000000, 0, -0.5] },
      ],
    },
  ];

  const filteredData = useMemo(() => {
    if (selectedExchange === 'All') return marketCapData;
    return marketCapData.filter(item => item.name === selectedExchange);
  }, [selectedExchange]);

  const currentNews = newsArticles[currentNewsIndex];
  const recommendedNews = newsArticles.filter((_, idx) => idx !== currentNewsIndex).slice(0, 2);

  return (
    <div className="equity-home-page">
      {/* Header with Exchange Filters */}
      <div className="eq-header-wrapper">
        <div 
          className="eq-header"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            transition: 'background-image 1s ease-in-out',
          }}
        >
          <div className="header-main">
            <div className="header-content">
              <h1>African Equity Markets</h1>
              <p>Real-time market data and comprehensive equity analysis</p>
            </div>
            
            {/* Exchange Filters */}
            <div className="exchange-filters">
              {exchanges.map((exchange) => (
                <button
                  key={exchange}
                  className={`exchange-filter-btn ${selectedExchange === exchange ? 'active' : ''}`}
                  onClick={() => setSelectedExchange(exchange)}
                >
                  {exchange}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: 60-40 Layout */}
      <div className="equity-main-content">
        {/* Left Column: 60% - Treemap & Tools */}
        <div className="left-column">
          {/* Market Cap Treemap */}
          <div className="treemap-container">
            <TreemapChart
              data={filteredData}
              height="100%"
            />
          </div>

          {/* Equity Tools Grid */}
          <div className="equity-tools-section">
            <h2 className="section-title">Equity Analysis Tools</h2>
            <div className="tools-grid">
              {equityTools.map((tool, idx) => (
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

        {/* Right Column: 40% - News */}
        <div className="right-column">
          {/* Featured News */}
          <div className="featured-news">
            <div className="news-navigation">
              <button onClick={() => handleNewsNavigation('prev')} className="nav-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
              </button>
              <button onClick={() => handleNewsNavigation('next')} className="nav-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
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

            <div className="news-image-container">
              <div 
                className="news-image"
                style={{
                  backgroundImage: `linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.9)), url(${currentNews.image})`,
                }}
              >
                <div className="news-category-badge">{currentNews.category}</div>
              </div>
            </div>

            <div className="news-content">
              <div className="news-meta">
                <span className="news-date">{currentNews.date}</span>
                <span className="news-separator">•</span>
                <span className="news-read-time">{currentNews.readTime}</span>
              </div>
              <h3 className="news-title">{currentNews.title}</h3>
              <p className="news-excerpt">{currentNews.excerpt}</p>
              <Link href="/equity/news-articles" className="read-more-btn">
                Read More
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>

          {/* Recommended Articles */}
          <div className="recommended-news">
            <h3 className="recommended-title">Recommended</h3>
            <div className="recommended-grid">
              {recommendedNews.map((article) => (
                <Link key={article.id} href="/equity/news-articles" className="recommended-card">
                  <div 
                    className="recommended-image"
                    style={{
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${article.image})`,
                    }}
                  >
                    <span className="recommended-category">{article.category}</span>
                  </div>
                  <div className="recommended-content">
                    <h4>{article.title}</h4>
                    <div className="recommended-meta">
                      <span>{article.date}</span>
                    </div>
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
