'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ExchangesHeader from '@/components/exchanges/ExchangesHeader';
import ExchangeCard from '@/components/exchanges/ExchangeCard';
import PerformanceCharts from '@/components/exchanges/PerformanceCharts';
import StructureAnalysis from '@/components/exchanges/StructureAnalysis';
import RankingDashboard from '@/components/exchanges/RankingDashboard';
import StockDirectory from '@/components/exchanges/StockDirectory';
import ExchangesFloatingInsights from '@/components/exchanges/ExchangesFloatingInsights';
import { StockExchange, ListedStock } from '@/types/exchanges';
import { AFRICAN_EXCHANGES, EXCHANGE_INSIGHTS, SAMPLE_STOCKS } from '@/core/data/ExchangesData';

export default function BoursesPage() {
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(['brvm', 'jse', 'ngx', 'cse']);
  const [viewMode, setViewMode] = useState<'overview' | 'performance' | 'structure' | 'ranking'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | '3Y'>('1Y');
  const [selectedExchange, setSelectedExchange] = useState<string>('brvm');
  const [selectedStock, setSelectedStock] = useState<ListedStock | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);

  const performanceRef = useRef<HTMLDivElement>(null);
  const structureRef = useRef<HTMLDivElement>(null);
  const rankingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with all exchanges selected
    setSelectedExchanges(AFRICAN_EXCHANGES.map(e => e.id));
  }, []);

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
    setViewMode('structure');
    structureRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleViewStocks = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    setViewMode('ranking');
    rankingRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStockSelect = (stock: ListedStock) => {
    setSelectedStock(stock);
    setShowStockModal(true);
  };

  const handleAnalyzeInScreener = (stock: ListedStock) => {
    // Navigate to screener with stock pre-selected
    console.log('Analyzing stock in screener:', stock);
  };

  const handleAnalyzeExchange = (exchangeId: string) => {
    setSelectedExchange(exchangeId);
    setViewMode('structure');
    structureRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredExchanges = AFRICAN_EXCHANGES.filter(exchange => 
    selectedExchanges.includes(exchange.id)
  );

  return (
    <div className="bourses-page">
      {/* Header */}
      <ExchangesHeader 
        selectedExchanges={selectedExchanges}
        onExchangeToggle={handleExchangeToggle}
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

      {/* Structure Section */}
      {viewMode === 'structure' && (
        <section ref={structureRef} className="structure-section">
          <div className="section-header">
            <h2>Structural Specifics</h2>
            <p>Discover regulations, sectors, and trading conditions</p>
          </div>
          
          <StructureAnalysis 
            exchanges={filteredExchanges}
            selectedExchange={selectedExchange}
            onExchangeSelect={setSelectedExchange}
          />
        </section>
      )}

      {/* Ranking Section */}
      {viewMode === 'ranking' && (
        <section ref={rankingRef} className="ranking-section">
          <div className="section-header">
            <h2>Comparative Ranking</h2>
            <p>Rank exchanges by different performance criteria</p>
          </div>
          
          <RankingDashboard 
            exchanges={filteredExchanges}
            onAnalyzeExchange={handleAnalyzeExchange}
          />
        </section>
      )}

      {/* Stock Directory Section */}
      {(viewMode === 'ranking' || viewMode === 'overview') && (
        <section className="stock-directory-section">
          <div className="section-header">
            <h2>Listed Companies Directory</h2>
            <p>Browse all available stocks on African markets</p>
          </div>
          
          <StockDirectory 
            selectedExchange={selectedExchange}
            onStockSelect={handleStockSelect}
            onAnalyzeInScreener={handleAnalyzeInScreener}
            onExchangeChange={setSelectedExchange}
          />
        </section>
      )}

      {/* Regional Focus Map */}
      <section className="regional-focus-section">
        <div className="section-header">
          <h2>Regional Focus</h2>
          <p>Geographic visualization of African markets</p>
        </div>
        
        <div className="africa-map-container">
          <div className="map-placeholder">
            <div className="map-content">
              <h3>Interactive Map of African Stock Exchanges</h3>
              <p>Click on a region to filter corresponding exchanges</p>
              
              <div className="region-highlights">
                <div className="region-card west" onClick={() => setSelectedExchanges(['brvm', 'ngx', 'gse'])}>
                  <h4>West Africa</h4>
                  <div className="region-exchanges">BRVM • NGX • GSE</div>
                  <div className="region-stats">
                    <span>3 exchanges</span>
                    <span>$116.3B total cap</span>
                  </div>
                </div>
                
                <div className="region-card east" onClick={() => setSelectedExchanges(['nse'])}>
                  <h4>East Africa</h4>
                  <div className="region-exchanges">NSE</div>
                  <div className="region-stats">
                    <span>1 exchange</span>
                    <span>$28.7B total cap</span>
                  </div>
                </div>
                
                <div className="region-card north" onClick={() => setSelectedExchanges(['cse'])}>
                  <h4>North Africa</h4>
                  <div className="region-exchanges">CSE</div>
                  <div className="region-stats">
                    <span>1 exchange</span>
                    <span>$72.5B total cap</span>
                  </div>
                </div>
                
                <div className="region-card south" onClick={() => setSelectedExchanges(['jse'])}>
                  <h4>Southern Africa</h4>
                  <div className="region-exchanges">JSE</div>
                  <div className="region-stats">
                    <span>1 exchange</span>
                    <span>$1,250.8B total cap</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
      <ExchangesFloatingInsights 
        exchanges={filteredExchanges}
        allExchanges={AFRICAN_EXCHANGES}
      />
    </div>
  );
}