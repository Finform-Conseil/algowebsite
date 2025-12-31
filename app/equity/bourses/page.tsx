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
      {/* Breadcrumb */}
      <div className="bourses-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>Bourses Africaines</span>
      </div>

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
            <h2>Profils des Bourses Africaines</h2>
            <p>Explorez les caractéristiques principales de chaque place boursière</p>
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
            <h2>Performances Comparatives</h2>
            <p>Analysez les performances des indices et volumes par période</p>
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
            <h2>Spécificités Structurelles</h2>
            <p>Découvrez la réglementation, secteurs et conditions de trading</p>
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
            <h2>Classement Comparatif</h2>
            <p>Classez les bourses selon différents critères de performance</p>
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
            <h2>Annuaire des Actions Cotées</h2>
            <p>Parcourez toutes les actions disponibles sur les marchés africains</p>
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
          <h2>Focus Régional</h2>
          <p>Visualisation géographique des marchés africains</p>
        </div>
        
        <div className="africa-map-container">
          <div className="map-placeholder">
            <div className="map-content">
              <h3>Carte Interactive des Bourses Africaines</h3>
              <p>Cliquez sur une région pour filtrer les bourses correspondantes</p>
              
              <div className="region-highlights">
                <div className="region-card west" onClick={() => setSelectedExchanges(['brvm', 'ngx', 'gse'])}>
                  <h4>Afrique de l'Ouest</h4>
                  <div className="region-exchanges">BRVM • NGX • GSE</div>
                  <div className="region-stats">
                    <span>3 bourses</span>
                    <span>$116.3B cap totale</span>
                  </div>
                </div>
                
                <div className="region-card east" onClick={() => setSelectedExchanges(['nse'])}>
                  <h4>Afrique de l'Est</h4>
                  <div className="region-exchanges">NSE</div>
                  <div className="region-stats">
                    <span>1 bourse</span>
                    <span>$28.7B cap totale</span>
                  </div>
                </div>
                
                <div className="region-card north" onClick={() => setSelectedExchanges(['cse'])}>
                  <h4>Afrique du Nord</h4>
                  <div className="region-exchanges">CSE</div>
                  <div className="region-stats">
                    <span>1 bourse</span>
                    <span>$72.5B cap totale</span>
                  </div>
                </div>
                
                <div className="region-card south" onClick={() => setSelectedExchanges(['jse'])}>
                  <h4>Afrique Australe</h4>
                  <div className="region-exchanges">JSE</div>
                  <div className="region-stats">
                    <span>1 bourse</span>
                    <span>$1,250.8B cap totale</span>
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
                    <label>Bourse</label>
                    <span>{selectedStock.exchangeId.toUpperCase()}</span>
                  </div>
                  <div className="detail-item">
                    <label>Secteur</label>
                    <span>{selectedStock.sector}</span>
                  </div>
                  <div className="detail-item">
                    <label>Capitalisation</label>
                    <span>${selectedStock.marketCap.toFixed(0)}M</span>
                  </div>
                  <div className="detail-item">
                    <label>Volume</label>
                    <span>{new Intl.NumberFormat('fr-FR').format(selectedStock.volume)}</span>
                  </div>
                </div>
              </div>
              
              <div className="modal-actions">
                <button className="action-btn primary">
                  Voir la fiche complète
                </button>
                <button 
                  className="action-btn secondary"
                  onClick={() => handleAnalyzeInScreener(selectedStock)}
                >
                  Analyser dans Screener
                </button>
                <button className="action-btn secondary">
                  Ajouter à la watchlist
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