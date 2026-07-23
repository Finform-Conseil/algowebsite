'use client';

import { useState, useEffect, useMemo } from 'react';
import YieldRatesTable from './YieldRatesTable';
import YieldCurveDisplay from './YieldCurveDisplay';
import { PaginatedResponse } from '@/core/domain/types/pagination.type';
import { RateEntity } from '@/core/domain/entities/rate.entity';

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

interface MaturityField {
  years: number;
  field: keyof RateEntity;
}

const MATURITY_FIELDS: MaturityField[] = [
  { years: 0.25, field: 'three_months' },
  { years: 0.5, field: 'six_months' },
  { years: 1, field: 'one_year' },
  { years: 2, field: 'two_years' },
  { years: 3, field: 'three_years' },
  { years: 5, field: 'five_years' },
  { years: 7, field: 'seven_years' },
  // { years: 10, field: 'ten_years' },
  // { years: 15, field: 'fifteen_years' },
  // { years: 20, field: 'twenty_years' },
];

const COUNTRY_META: Record<string, { name: string; code: string; color: string }> = {
  BJ: { name: 'Benin', code: 'BJ', color: '#4A90E2' },
  SN: { name: 'Senegal', code: 'SN', color: '#7EC8FF' },
  CI: { name: 'Côte d\'Ivoire', code: 'CI', color: '#F59E0B' },
  TG: { name: 'Togo', code: 'TG', color: '#10B981' },
  GH: { name: 'Ghana', code: 'GH', color: '#EC4899' },
  ML: { name: 'Mali', code: 'ML', color: '#F97316' },
  BF: { name: 'Burkina Faso', code: 'BF', color: '#06B6D4' },
  NE: { name: 'Niger', code: 'NE', color: '#8B5CF6' },
  NG: { name: 'Nigeria', code: 'NG', color: '#D946EF' },
  CM: { name: 'Cameroon', code: 'CM', color: '#14B8A6' },
  GA: { name: 'Gabon', code: 'GA', color: '#6366F1' },
};

const SYMBOL_TO_CODE: Record<string, string> = {
  BJ: 'BJ',
  SN: 'SN',
  CI: 'CI',
  TG: 'TG',
  GH: 'GH',
  ML: 'ML',
  BF: 'BF',
  NJ: 'NE',
  NE: 'NE',
  NG: 'NG',
  CM: 'CM',
  GA: 'GA',
};

const parseRateValue = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const str = typeof value === 'string' ? value : String(value);
  const parsed = parseFloat(str);
  if (Number.isNaN(parsed)) return null;
  return parsed * 100;
};

interface YieldCurveSectionProps {
  selectedCountries: string[];
  ratesData?: PaginatedResponse<RateEntity>;
  isLoading?: boolean;
}

export default function YieldCurveSection({ selectedCountries, ratesData, isLoading }: YieldCurveSectionProps) {
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [isHistorical, setIsHistorical] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const historicalData: YieldCurveSnapshot[] = useMemo(() => {
    const rates = ratesData?.data || [];
    if (rates.length === 0) return [];

    const byDate = new Map<string, RateEntity[]>();
    rates.forEach((rate) => {
      const date = rate.timestamp ? rate.timestamp.split('T')[0] : 'unknown';
      if (!byDate.has(date)) byDate.set(date, []);
      byDate.get(date)!.push(rate);
    });

    const sortedDates = Array.from(byDate.keys()).sort();

    return sortedDates.map((date) => {
      const dateRates = byDate.get(date) || [];
      const curves: CountryYieldCurve[] = [];

      dateRates.forEach((rate) => {
        const symbol = rate.country?.symbol;
        if (!symbol) return;
        const code = SYMBOL_TO_CODE[symbol];
        if (!code) return;
        const meta = COUNTRY_META[code];
        if (!meta) return;

        const data = MATURITY_FIELDS.map(({ years, field }) => {
          const value = (rate as any)[field];
          const yieldValue = parseRateValue(value);
          return {
            maturity: years,
            yield: yieldValue ?? 0,
          };
        });

        curves.push({
          country: meta.name,
          countryCode: meta.code,
          color: meta.color,
          data,
        });
      });

      return { date, curves };
    }).filter((snapshot) => snapshot.curves.length > 0);
  }, [ratesData]);

  useEffect(() => {
    if (historicalData.length > 0) {
      setCurrentIndex(0);
    }
  }, [historicalData.length]);

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

  const displayIndex = isHistorical ? currentIndex : Math.max(0, historicalData.length - 1);
  const currentSnapshot = historicalData[displayIndex] || { date: new Date().toISOString().split('T')[0], curves: [] };
  const previousSnapshot = displayIndex > 0 ? historicalData[displayIndex - 1] : undefined;

  const hasData = historicalData.length > 0;

  useEffect(()=>{
    console.log("Historical Data Received", historicalData)
    console.log("Selected Countries", selectedCountries)
  }, [selectedCountries, historicalData])

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
          disabled={!hasData}
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
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            Loading yield curves...
          </div>
        ) : !hasData ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
            No yield curve data available for the selected period.
          </div>
        ) : viewMode === 'table' ? (
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
      {isHistorical && hasData && (
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
            value={displayIndex}
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
