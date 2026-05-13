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
  calculateMarketIndicators,
  generateHeatmapData,
  generateInsights
} from '@/core/data/MarketMoversData';
import { ActionQueryParams } from '@/core/domain/types/action.type';
import { useActionRepository } from '@/core/infra/repositories/action.repository.impl';
import { useSectorRepository } from '@/core/infra/repositories/sector.repository.impl';
import { transformActionsToStocks } from '@/lib/utils/marketMoversTransform';

type TabType = 'movers' | 'active' | 'heatmap' | 'insights';

export default function MarketMoversPage() {

  const [filters, setFilters] = useState<any>({
    exchanges: [],
    sectors: [],
    minVolume: undefined
  });

  const getTopGainersParams = (): ActionQueryParams => {
    const params: ActionQueryParams = { 
      view_type: "market_movers",
      page_size: 10,
      ordering: '-latest_price_metric__change_1d_pct'
    };
    
    if (filters.exchanges?.length > 0) {
      params.bourse_tickers = filters.exchanges.join(',');
    }
    
    if (filters.sectors?.length > 0) {
      params.activity_names = filters.sectors.join(',');
    }
    
    if (filters.minVolume) {
      params.min_volume = filters.minVolume;
    }
    
    return params;
  };

  const getTopLosersParams = (): ActionQueryParams => {
    const params: ActionQueryParams = { 
      view_type: "market_movers",
      page_size: 10,
      ordering: 'latest_price_metric__change_1d_pct'
    };
    
    if (filters.exchanges?.length > 0) {
      params.bourse_tickers = filters.exchanges.join(',');
    }
    
    if (filters.sectors?.length > 0) {
      params.activity_names = filters.sectors.join(',');
    }
    
    if (filters.minVolume) {
      params.min_volume = filters.minVolume;
    }
    
    return params;
  };

  const getMostActiveParams = (): ActionQueryParams => {
    const params: ActionQueryParams = { 
      view_type: "market_movers",
      page_size: 100,
      ordering: '-latest_price_metric__volume'
    };
    
    if (filters.exchanges?.length > 0) {
      params.bourse_tickers = filters.exchanges.join(',');
    }
    
    if (filters.sectors?.length > 0) {
      params.activity_names = filters.sectors.join(',');
    }
    
    if (filters.minVolume) {
      params.min_volume = filters.minVolume;
    }
    
    return params;
  };
  
  const topGainersRepo = useActionRepository();
  const topLosersRepo = useActionRepository();
  const mostActiveRepo = useActionRepository();
  const { allSectorsData, getAllSectors } = useSectorRepository();
  
  useEffect(() => {
    getAllSectors({ page_size: 100 });
  }, []);
  
  useEffect(() => {
    topGainersRepo.getAllActions(getTopGainersParams());
    topLosersRepo.getAllActions(getTopLosersParams());
    mostActiveRepo.getAllActions(getMostActiveParams());
  }, [filters]);



  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('movers');

  const availableSectors = useMemo(() => {
    if (!allSectorsData?.data) return [];
    return allSectorsData.data.map(sector => sector.name);
  }, [allSectorsData]);

  const topGainers = useMemo(() => {
    if (!topGainersRepo.allActionsData?.data) return [];
    return transformActionsToStocks(topGainersRepo.allActionsData.data);
  }, [topGainersRepo.allActionsData]);

  const topLosers = useMemo(() => {
    if (!topLosersRepo.allActionsData?.data) return [];
    return transformActionsToStocks(topLosersRepo.allActionsData.data);
  }, [topLosersRepo.allActionsData]);

  const mostActive = useMemo(() => {
    if (!mostActiveRepo.allActionsData?.data) return [];
    return transformActionsToStocks(mostActiveRepo.allActionsData.data);
  }, [mostActiveRepo.allActionsData]);

  // Simulate real-time refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      topGainersRepo.getAllActions(getTopGainersParams());
      topLosersRepo.getAllActions(getTopLosersParams());
      mostActiveRepo.getAllActions(getMostActiveParams());
      setLastRefresh(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const marketIndicators = useMemo(() => {
    const allStocks = [...topGainers, ...topLosers, ...mostActive];
    if (allStocks.length === 0) {
      return {
        selectedMarket: 'All Markets',
        avgChange: 0,
        totalVolume: 0,
        sentiment: 'neutral' as const,
        activeStocks: 0,
        gainers: 0,
        losers: 0
      };
    }
    return calculateMarketIndicators(allStocks);
  }, [topGainers, topLosers, mostActive]);

  const heatmapData = useMemo(() => generateHeatmapData(mostActive), [mostActive]);
  const insights = useMemo(() => generateInsights(mostActive), [mostActive]);

  const isLoading = topGainersRepo.isLoadingAllActions || topLosersRepo.isLoadingAllActions || mostActiveRepo.isLoadingAllActions;

  return (
    <div className="market-movers-page">
      {/* Header with filters and indicators */}
      <MarketHeader
        indicators={marketIndicators}
        onFilterChange={setFilters}
        availableSectors={availableSectors}
      />

      {isLoading && (
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '40vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div className="spinner" style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(59, 130, 246, 0.1)',
            borderTopColor: '#3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading market data...</p>
        </div>
      )}

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
            Top Movers
          </button>
          <button
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Most Active
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
            Insights & Alerts
          </button>
        </div>

        <div className="tabs-controls">
          <div className={`refresh-indicator ${autoRefresh ? 'active' : ''}`}>
            <span className="pulse-dot"></span>
            <span>{autoRefresh ? 'Live' : 'Paused'}</span>
          </div>
          <span className="last-update">
            {lastRefresh.toLocaleTimeString('en-US')}
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

      {/* Main content with tabs */}
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

      {/* Quick Comparison (Slider) */}
      <QuickComparison availableStocks={mostActive} />

      {/* Floating Stats */}
      <div className="floating-stats">
        <div className="stat-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
          <span className="stat-value positive">{marketIndicators.gainers}</span>
          <span className="stat-label">Gainers</span>
        </div>
        <div className="stat-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="stat-value negative">{marketIndicators.losers}</span>
          <span className="stat-label">Declines</span>
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
