'use client';

import { useState, useEffect } from 'react';

interface ScreenerHeaderProps {
  filteredCount: number;
  totalCount: number;
  avgPE: number;
  avgROE: number;
  totalMarketCap: number;
  availableFilters?: number;
}

export default function ScreenerHeader({
  filteredCount,
  totalCount,
  avgPE,
  avgROE,
  totalMarketCap,
  availableFilters = 200
}: ScreenerHeaderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const subtitles = [
    "Filter and analyze African stocks with advanced criteria",
    "Identify the best investment opportunities",
    "Compare performance and fundamentals",
    "Create your own custom screening scenarios"
  ];

  const backgroundImages = [
    '/images/screener-header-1.jpg',
    '/images/screener-header-2.jpg',
    '/images/screener-header-3.jpg',
    '/images/screener-header-4.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  const formatMarketCap = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}T€`;
    }
    return `${value.toFixed(1)}B€`;
  };

  return (
    <div className="screener-header-component">
      {/* Hero Section with Slider */}
      <div 
        className="screener-header-component__hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentSlide]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 1s ease-in-out'
        }}
      >
        <div className="screener-header-component__content">
          <h1 className="screener-header-component__title">Stock Screener</h1>
          <p className="screener-header-component__subtitle">
            {subtitles[currentSlide]}
          </p>
        </div>

        {/* KPIs */}
        <div className="screener-header-component__kpis">
          <div className="kpi-card">
            <div className="kpi-value">{availableFilters}</div>
            <div className="kpi-label">Available Filters</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{filteredCount}</div>
            <div className="kpi-label">Filtered Stocks</div>
            <div className="kpi-sublabel">/ {totalCount} total</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{avgPE.toFixed(1)}x</div>
            <div className="kpi-label">Avg P/E</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value kpi-value--positive">{avgROE.toFixed(1)}%</div>
            <div className="kpi-label">Avg ROE</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-value">{formatMarketCap(totalMarketCap)}</div>
            <div className="kpi-label">Total Cap.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
