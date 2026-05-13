'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ExchangesHeader from '@/components/exchanges/ExchangesHeader';
import ExchangeCard from '@/components/exchanges/ExchangeCard';
import PerformanceCharts from '@/components/exchanges/PerformanceCharts';
import RankingDashboard from '@/components/exchanges/RankingDashboard';
import ExchangesFloatingInsights from '@/components/exchanges/ExchangesFloatingInsights';
import { StockExchange, ListedStock } from '@/types/exchanges';
import { EXCHANGE_INSIGHTS } from '@/core/data/ExchangesData';
import { useBourseRepository } from '@/core/infra/repositories/bourse.repository.impl';
import { transformExchangeData } from '@/lib/utils/exchangeTransform';

export default function BoursesPage() {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(['brvm', 'jse', 'ngx', 'cse']);
  const [viewMode, setViewMode] = useState<'overview' | 'performance' | 'ranking'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('1Y');
  const [selectedExchange, setSelectedExchange] = useState<string>('brvm');
  const [selectedStock, setSelectedStock] = useState<ListedStock | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);

  const performanceRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const rankingRef = useRef<HTMLDivElement>(null);

  const { allBoursesData, getAllBourses, isLoadingAllBourses } = useBourseRepository();
  
  useEffect(() => {
    getAllBourses({view_type: 'comparison'});
  }, []);

  const AFRICAN_EXCHANGES = useMemo(() => {
    if (!allBoursesData || !allBoursesData.data || allBoursesData.data.length === 0) {
      return [];
    }
    return transformExchangeData(allBoursesData.data);
  }, [allBoursesData]);

  useEffect(() => {
    if (AFRICAN_EXCHANGES.length > 0 && selectedExchanges.length === 0) {
      const defaultSelection = AFRICAN_EXCHANGES
        .slice(0, 4)
        .map(e => e.id);
      setSelectedExchanges(defaultSelection);
    }
  }, [AFRICAN_EXCHANGES]);

  const handleExchangeToggle = (exchangeId: string) => {
    setSelectedExchanges(prev => 
      prev.includes(exchangeId) 
        ? prev.filter(id => id !== exchangeId)
        : [...prev, exchangeId]
    );
  };

  const handleCompareClick = () => {
    setViewMode('performance');
    performanceRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectExchange = (exchange: StockExchange) => {
    setSelectedExchange(exchange.id);
    structureRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewStocks = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    setViewMode('ranking');
    rankingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyzeInScreener = (stock: ListedStock) => {
    // Navigate to screener with stock pre-selected
    console.log('Analyzing stock in screener:', stock);
  };

  const handleAnalyzeExchange = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    structureRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredExchanges = AFRICAN_EXCHANGES.filter(exchange => 
    selectedExchanges.includes(exchange.id)
  );

  if (isLoadingAllBourses) {
    return (
      <div className="bourses-page">
        <div className="loading-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
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
          <p style={{ color: 'var(--text-secondary)' }}>Loading exchanges data...</p>
        </div>
      </div>
    );
  }

  if (!allBoursesData || AFRICAN_EXCHANGES.length === 0) {
    return (
      <div className="bourses-page">
        <div className="empty-state" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <p style={{ color: 'var(--text-secondary)' }}>No exchange data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bourses-page">
      {/* Header */}
      <ExchangesHeader 
        selectedExchanges={selectedExchanges}
        onExchangeToggle={handleExchangeToggle}
        onExchangesChange={setSelectedExchanges}
        onCompareClick={handleCompareClick}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Overview Section */}
      {viewMode === 'overview' && (
        <section className="overview-section">
          <div className="section-header">
            <h2>African Stock Exchange Profiles</h2>
            <p>Explore the key characteristics of each stock exchange</p>
          </div>
          
          <div className="exchanges-grid">
            {filteredExchanges.map(exchange => (
              <ExchangeCard
                key={exchange.id}
                exchange={exchange}
                onSelect={handleSelectExchange}
                onViewStocks={handleViewStocks}
                isSelected={selectedExchange === exchange.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* Performance Section */}
      {viewMode === 'performance' && (
        <section ref={performanceRef} className="performance-section">
          <div className="section-header">
            <h2>Comparative Performance</h2>
            <p>Analyze index performance and trading volumes by period</p>
          </div>
          
          <PerformanceCharts 
            exchanges={filteredExchanges}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
        </section>
      )}

      {/* Ranking Section */}
      {viewMode === 'ranking' && (
        <section ref={rankingRef} className="ranking-section">
          <RankingDashboard 
            exchanges={filteredExchanges}
            onAnalyzeExchange={handleAnalyzeExchange}
          />
        </section>
      )}

      {/* Stock Detail Modal */}
      {showStockModal && selectedStock && (
        <div className="stock-modal-overlay" onClick={() => setShowStockModal(false)}>
          <div className="stock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedStock.symbol} - {selectedStock.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStockModal(false)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="modal-content">
              <div className="stock-overview">
                <div className="stock-price">
                  <span className="price">{selectedStock.price.toFixed(2)}</span>
                  <span className={`change ${selectedStock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                    {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                  </span>
                </div>
                
                <div className="stock-details">
                  <div className="detail-item">
                    <label>Exchange</label>
                    <span>{selectedStock.exchangeId.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Sector</label>
                    <span>{selectedStock.sector}</span>
                  </div>
                  <div className="detail-item">
                    <label>Market Cap</label>
                    <span>${selectedStock.marketCap.toFixed(0)}M</span>
                  </div>
                  <div className="detail-item">
                    <label>Volume</label>
                    <span>{new Intl.NumberFormat('en-US').format(selectedStock.volume)}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="action-btn primary">
                  View Full Profile
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => handleAnalyzeInScreener(selectedStock)}
                >
                  Analyze in Screener
                </button>
                <button className="action-btn secondary">
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Insights */}
      {/* <ExchangesFloatingInsights 
        exchanges={filteredExchanges}
        allExchanges={AFRICAN_EXCHANGES}
      /> */}
    </div>
  );
}