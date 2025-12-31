'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import MarketHeader from '@/components/market-movers/MarketHeader';
import TopMovers from '@/components/market-movers/TopMovers';
import MostActive from '@/components/market-movers/MostActive';
import MarketHeatmap from '@/components/market-movers/MarketHeatmap';
import MarketInsights from '@/components/market-movers/MarketInsights';
import QuickComparison from '@/components/market-movers/QuickComparison';
import {
  MARKET_STOCKS,
  filterStocks,
  getTopGainers,
  getTopLosers,
  getMostActive,
  calculateMarketIndicators,
  generateHeatmapData,
  generateInsights
} from '@/core/data/MarketMoversData';

type TabType = 'movers' | 'active' | 'heatmap' | 'insights';

export default function MarketMoversPage() {
  const [filters, setFilters] = useState<any>({
    period: 'day',
    exchanges: [],
    sectors: [],
    minVolume: undefined
  });

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('movers');

  // Simuler le rafraîchissement temps réel
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastRefresh(new Date());
      // Ici, dans un vrai cas, on ferait un fetch des nouvelles données
    }, 10000); // Rafraîchir toutes les 10 secondes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filtrer les stocks
  const filteredStocks = useMemo(() => {
    return filterStocks(MARKET_STOCKS, filters);
  }, [filters]);

  // Calculer les données pour chaque section
  const topGainers = useMemo(() => getTopGainers(filteredStocks, 10), [filteredStocks]);
  const topLosers = useMemo(() => getTopLosers(filteredStocks, 10), [filteredStocks]);
  const mostActive = useMemo(() => getMostActive(filteredStocks, 100), [filteredStocks]);
  const marketIndicators = useMemo(() => calculateMarketIndicators(filteredStocks), [filteredStocks]);
  const heatmapData = useMemo(() => generateHeatmapData(filteredStocks), [filteredStocks]);
  const insights = useMemo(() => generateInsights(filteredStocks), [filteredStocks]);

  return (
    <div className="market-movers-page">
      {/* Breadcrumb */}
      <div className="movers-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>Market Movers</span>
      </div>

      {/* Header avec filtres et indicateurs */}
      <MarketHeader
        indicators={marketIndicators}
        onFilterChange={setFilters}
      />

      {/* Tabs Navigation */}
      <div className="movers-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'movers' ? 'active' : ''}`}
            onClick={() => setActiveTab('movers')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            Tops & Flops
          </button>
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Plus Actives
          </button>
          <button
            className={`tab-btn ${activeTab === 'heatmap' ? 'active' : ''}`}
            onClick={() => setActiveTab('heatmap')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
            Heatmap
          </button>
          <button
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            Insights & Alertes
          </button>
        </div>

        <div className="tabs-controls">
          <div className={`refresh-indicator ${autoRefresh ? 'active' : ''}`}>
            <span className="pulse-dot"></span>
            <span>{autoRefresh ? 'Temps réel' : 'Pause'}</span>
          </div>
          <span className="last-update">
            {lastRefresh.toLocaleTimeString('fr-FR')}
          </span>
          <button
            className={`btn-refresh ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Contenu principal avec tabs */}
      <div className="movers-content">
        {activeTab === 'movers' && (
          <div className="movers-section tops-flops-section">
            <div className="section-grid">
              <TopMovers stocks={topGainers} type="gainers" />
              <TopMovers stocks={topLosers} type="losers" />
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="movers-section most-active-section">
            <MostActive stocks={mostActive} />
          </div>
        )}

        {activeTab === 'heatmap' && (
          <div className="movers-section heatmap-section">
            <MarketHeatmap data={heatmapData} />
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="movers-section insights-section">
            <MarketInsights insights={insights} />
          </div>
        )}
      </div>

      {/* Comparaison rapide (Slider) */}
      <QuickComparison availableStocks={filteredStocks} />

      {/* Floating Stats */}
      <div className="floating-stats">
        <div className="stat-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span className="stat-value positive">{marketIndicators.gainers}</span>
          <span className="stat-label">Hausses</span>
        </div>
        <div className="stat-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="stat-value negative">{marketIndicators.losers}</span>
          <span className="stat-label">Baisses</span>
        </div>
        <div className="stat-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span className="stat-value">{(marketIndicators.totalVolume / 1000000).toFixed(1)}M</span>
          <span className="stat-label">Volume</span>
        </div>
      </div>
    </div>
  );
}
