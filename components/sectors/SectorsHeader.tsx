'use client';

import { useState, useEffect } from 'react';
import { Period, ComparisonMode } from '@/types/sectors';

interface SectorsHeaderProps {
  selectedExchanges: string[];
  onExchangeToggle: (exchangeId: string) => void;
  period: Period;
  onPeriodChange: (period: Period) => void;
  comparisonMode: ComparisonMode;
  onComparisonModeChange: (mode: ComparisonMode) => void;
  totalSectors: number;
  totalStocks: number;
  totalMarketCap: number;
}

const EXCHANGES = [
  { id: 'brvm', name: 'BRVM', color: '#f59e0b' },
  { id: 'jse', name: 'JSE', color: '#10b981' },
  { id: 'ngx', name: 'NGX', color: '#3b82f6' },
  { id: 'cse', name: 'CSE', color: '#8b5cf6' },
  { id: 'gse', name: 'GSE', color: '#ef4444' },
  { id: 'nse', name: 'NSE', color: '#06b6d4' }
];

const PERIODS: Period[] = ['1M', '3M', '6M', '1Y', '3Y', '5Y'];

const COMPARISON_MODES: { id: ComparisonMode; label: string }[] = [
  { id: 'inter-bourses', label: 'Inter-bourses' },
  { id: 'intra-bourse', label: 'Intra-bourse' },
  { id: 'regional', label: 'Régional' }
];

export default function SectorsHeader({
  selectedExchanges,
  onExchangeToggle,
  period,
  onPeriodChange,
  comparisonMode,
  onComparisonModeChange,
  totalSectors,
  totalStocks,
  totalMarketCap
}: SectorsHeaderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const subtitles = [
    "Vue agrégée et comparative des dynamiques sectorielles africaines",
    "Analyse des secteurs moteurs et des tendances émergentes",
    "Comparaison inter-bourses et performance sectorielle",
    "Identification des opportunités d'investissement par secteur"
  ];

  const backgroundImages = [
    '/images/sectors-header-1.jpg',
    '/images/sectors-header-2.jpg',
    '/images/sectors-header-3.jpg',
    '/images/sectors-header-4.jpg'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % subtitles.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  
  const formatMarketCap = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}T`;
    }
    return `$${value.toFixed(1)}B`;
  };

  return (
    <div className="sectors-header">
      {/* Hero Section with Slider */}
      <div 
        className="sectors-header__hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentSlide]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transition: 'background-image 1s ease-in-out'
        }}
      >
        <div className="sectors-header__content">
            <h1 className="sectors-header__title">Secteurs & Industries</h1>
            <p className="sectors-header__subtitle">
              {subtitles[currentSlide]}
            </p>
          
        </div>
        {/* KPIs */}
        <div className="sectors-header__kpis">
            <div className="kpi-card">
              <div className="kpi-value">{totalSectors}</div>
              <div className="kpi-label">Secteurs</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{totalStocks}</div>
              <div className="kpi-label">Actions</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value">{formatMarketCap(totalMarketCap)}</div>
              <div className="kpi-label">Capitalisation</div>
            </div>
          </div>
      </div>

      {/* Compact Filters */}
      <div className="sectors-header__filters">
        <div className="filter-row">
          {/* Exchange Pills */}
          <div className="exchange-pills">
            {EXCHANGES.map((exchange) => (
              <button
                key={exchange.id}
                className={`pill ${selectedExchanges.includes(exchange.id) ? 'selected' : ''}`}
                onClick={() => onExchangeToggle(exchange.id)}
                style={{
                  '--exchange-color': exchange.color
                } as React.CSSProperties}
              >
                {exchange.name}
              </button>
            ))}
          </div>

          {/* Period Pills */}
          <div className="period-pills">
            {PERIODS.map((p) => (
              <button
                key={p}
                className={`pill ${period === p ? 'selected' : ''}`}
                onClick={() => onPeriodChange(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Comparison Pills */}
          <div className="comparison-pills">
            {COMPARISON_MODES.map((mode) => (
              <button
                key={mode.id}
                className={`pill ${comparisonMode === mode.id ? 'selected' : ''}`}
                onClick={() => onComparisonModeChange(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
