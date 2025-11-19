'use client';

import { useState, useEffect } from 'react';
import { MARKET_TICKERS } from '@/core/data/NewsData';
import { CATEGORIES, MARKETS, TIME_PERIODS } from '@/core/data/NewsData';

interface NewsHeaderProps {
  onSearch: (query: string) => void;
  onFilterChange: (filters: any) => void;
}

export default function NewsHeader({ onSearch, onFilterChange }: NewsHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [liveMode, setLiveMode] = useState(true);
  const [currentSubtitle, setCurrentSubtitle] = useState(0);

  const subtitles = [
    "L'actualité financière africaine et mondiale, en temps réel",
    "Suivez les marchés BRVM, JSE, NGX et les indices mondiaux",
    "Analyses expertes et insights stratégiques",
    "Veille intelligente et notifications personnalisées"
  ];

  const backgroundImages = [
    '/images/news-header-1.jpg', // Marchés financiers
    '/images/news-header-2.jpg', // Indices boursiers
    '/images/news-header-3.jpg', // Analyses expertes
    '/images/news-header-4.jpg', // Veille intelligente
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = () => {
    onFilterChange({
      category: selectedCategory,
      market: selectedMarket,
      period: selectedPeriod
    });
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedCategory, selectedMarket, selectedPeriod]);

  return (
    <div className="news-header">
      {/* Ticker Indices */}
      <div className="news-ticker">
        <div className="ticker-content">
          {MARKET_TICKERS.map((ticker, index) => (
            <div key={ticker.symbol} className="ticker-item">
              <span className="ticker-symbol">{ticker.symbol}</span>
              <span className="ticker-value">{ticker.value.toFixed(2)}</span>
              <span className={`ticker-change ${ticker.change >= 0 ? 'positive' : 'negative'}`}>
                {ticker.change >= 0 ? '+' : ''}{ticker.change.toFixed(2)} ({ticker.changePercent >= 0 ? '+' : ''}{ticker.changePercent.toFixed(2)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Header */}
      <div 
        className="news-header__main"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImages[currentSubtitle]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 1s ease-in-out'
        }}
      >
        <div className="news-header__content">
          <div className="news-header__title-section">
            <h1 className="news-header__title">News & Articles</h1>
            <div className="news-header__subtitle-container">
              <p className="news-header__subtitle">{subtitles[currentSubtitle]}</p>
            </div>
          </div>

          <div className="news-header__controls">
            {/* Search Bar */}
            <div className="search-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher des articles, entreprises, marchés..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Filters */}
            <div className="filters-container">
              {/* Category Filter */}
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">Toutes catégories</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>

              {/* Market Filter */}
              <select 
                value={selectedMarket} 
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tous marchés</option>
                {MARKETS.map(market => (
                  <option key={market.id} value={market.id}>{market.name}</option>
                ))}
              </select>

              {/* Period Filter */}
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="filter-select"
              >
                {TIME_PERIODS.map(period => (
                  <option key={period.id} value={period.id}>{period.name}</option>
                ))}
              </select>
            </div>

            {/* Live Mode Toggle */}
            <div className="live-toggle">
              <button 
                className={`live-toggle-btn ${liveMode ? 'active' : ''}`}
                onClick={() => setLiveMode(!liveMode)}
              >
                <div className="live-indicator"></div>
                <span>Live</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
