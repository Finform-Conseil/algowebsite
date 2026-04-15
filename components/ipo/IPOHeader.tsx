'use client';

import { useState, useEffect } from 'react';
import { IPOStatistics } from '@/types/ipo';

interface IPOHeaderProps {
  statistics: IPOStatistics;
}

export default function IPOHeader({ statistics }: IPOHeaderProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [currentSubtitle, setCurrentSubtitle] = useState(0);
  const [backgroundImages] = useState([
    '/images/screener-header-3.jpg',
    '/images/exchanges-header-2.jpg',
    '/images/exchanges-header-1.jpg',
  ]);

  const subtitles = [
    "Discover new investment opportunities on African markets",
    "Track upcoming and recent IPOs across the continent",
    "Analyze performance and trends of new listings"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubtitle((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [subtitles.length]);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div 
      className="ipo-header"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentSubtitle]})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 1s ease-in-out'
      }}
    >
      <div className="ipo-header__content">
        {/* Title Section */}
        <div className="ipo-header__title">
          <div className="title-content">
            <h1>IPO - Initial Public Offerings</h1>
            <p>{subtitles[currentSubtitle]}</p>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="ipo-stats">
          <div className="stat-card primary">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total IPOs (5Y)</span>
              <span className="stat-value">{statistics.totalIPOs}</span>
              <span className="stat-sublabel">Successful listings</span>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Capital Raised</span>
              <span className="stat-value">{formatCurrency(statistics.totalRaised)}</span>
              <span className="stat-sublabel">Total USD amount</span>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Average Size</span>
              <span className="stat-value">{formatCurrency(statistics.averageSize)}</span>
              <span className="stat-sublabel">Per listing</span>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Average Return</span>
              <span className={`stat-value ${statistics.averageReturn >= 0 ? 'positive' : 'negative'}`}>
                {statistics.averageReturn >= 0 ? '+' : ''}{statistics.averageReturn.toFixed(1)}%
              </span>
              <span className="stat-sublabel">Since listing</span>
            </div>
          </div>

          <div className="stat-card accent">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Success Rate</span>
              <span className="stat-value">{statistics.successRate.toFixed(0)}%</span>
              <span className="stat-sublabel">Positive IPOs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
