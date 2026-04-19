'use client';

import { useState, useEffect, useMemo } from 'react';
import YieldRatesTable from './YieldRatesTable';
import YieldCurveDisplay from './YieldCurveDisplay';

interface YieldDataPoint {
  maturity: number;
  yield: number;
}

interface CountryYieldCurve {
  country: string;
  countryCode: string;
  color: string;
  data: YieldDataPoint[];
}

interface YieldCurveSnapshot {
  date: string;
  curves: CountryYieldCurve[];
}

interface YieldCurveSectionProps {
  selectedCountries: string[];
}

export default function YieldCurveSection({ selectedCountries }: YieldCurveSectionProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');
  const [isHistorical, setIsHistorical] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const allCountries = useMemo(() => [
    { country: 'Benin', countryCode: 'BJ', color: '#4A90E2' },
    { country: 'Senegal', countryCode: 'SN', color: '#7EC8FF' },
    { country: 'Côte d\'Ivoire', countryCode: 'CI', color: '#F59E0B' },
    { country: 'Togo', countryCode: 'TG', color: '#10B981' },
    { country: 'Nigeria', countryCode: 'NG', color: '#8B5CF6' },
    { country: 'Ghana', countryCode: 'GH', color: '#EC4899' },
  ], []);

  const maturities = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20];

  // Generate historical data
  const historicalData: YieldCurveSnapshot[] = useMemo(() => {
    const dates: string[] = [];
    const startDate = new Date('2022-01-01');
    const endDate = new Date('2024-12-01');
    
    for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates.map((date, dateIndex) => {
      const curves = allCountries.map((country, countryIndex) => {
        const baseRate = 5 + countryIndex * 1.5;
        const timeVariation = Math.sin((dateIndex / dates.length) * Math.PI * 2) * 2;
        const countryVariation = Math.cos((countryIndex / allCountries.length) * Math.PI * 2) * 1.5;
        
        const data = maturities.map((maturity) => {
          const termPremium = Math.log(1 + maturity) * 2;
          const randomNoise = (Math.sin(maturity * dateIndex * countryIndex) * 0.5);
          const yield_ = baseRate + termPremium + timeVariation + countryVariation + randomNoise;
          
          return {
            maturity,
            yield: Math.max(0.5, parseFloat(yield_.toFixed(2)))
          };
        });

        return {
          country: country.country,
          countryCode: country.countryCode,
          color: country.color,
          data
        };
      });

      return { date, curves };
    });
  }, [allCountries]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !isHistorical) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= historicalData.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, isHistorical, historicalData.length]);

  const displayIndex = isHistorical ? currentIndex : historicalData.length - 1;
  const currentSnapshot = historicalData[displayIndex];
  const previousSnapshot = displayIndex > 0 ? historicalData[displayIndex - 1] : undefined;

  return (
    <div className="yield-curve-section">
      {/* Global Controls Header */}
      <div className="yield-controls-header">
        <div className="view-toggle">
          <button
            onClick={() => setViewMode('chart')}
            className={`view-btn ${viewMode === 'chart' ? 'active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10"/>
              <line x1="18" y1="20" x2="18" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="16"/>
            </svg>
            Chart
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 21V9"/>
            </svg>
            Table
          </button>
        </div>

        <div className="yield-title-info">
          <h3>Zero-Coupon Rates</h3>
          <p>
            {new Date(currentSnapshot.date).toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric',
              year: 'numeric' 
            })}
          </p>
        </div>

        <button
          onClick={() => {
            setIsHistorical(!isHistorical);
            if (!isHistorical) {
              setCurrentIndex(0);
              setIsPlaying(false);
            }
          }}
          className={`historical-btn ${isHistorical ? 'active' : ''}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          Historical
        </button>
      </div>

      {/* Content Area */}
      <div className="yield-content-area">
        {viewMode === 'table' ? (
          <YieldRatesTable
            selectedCountries={selectedCountries}
            currentDate={currentSnapshot.date}
            yieldData={currentSnapshot.curves}
            previousYieldData={previousSnapshot?.curves}
          />
        ) : (
          <YieldCurveDisplay
            selectedCountries={selectedCountries}
            currentSnapshot={currentSnapshot}
            height="100%"
          />
        )}
      </div>

      {/* Historical Timeline Controls */}
      {isHistorical && (
        <div className="historical-controls">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="play-btn"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            )}
          </button>

          <input
            type="range"
            min="0"
            max={historicalData.length - 1}
            value={currentIndex}
            onChange={(e) => setCurrentIndex(parseInt(e.target.value))}
            className="timeline-slider"
          />

          <span className="timeline-date">
            {new Date(currentSnapshot.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      )}
    </div>
  );
}
