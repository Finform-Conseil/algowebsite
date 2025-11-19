'use client';

import { useState, useMemo } from 'react';
import CompactHeader from './CompactHeader';
import TechnicalChart from './TechnicalChart';
import DrawingTools from './DrawingTools';
import SentimentGauge from './SentimentGauge';
import SymbolSearchModal from './SymbolSearchModal';
import IndicatorsModal from './IndicatorsModal';
import AlertsModal from './AlertsModal';
import ReplayModal from './ReplayModal';
import ActiveIndicatorsList from './ActiveIndicatorsList';
import IndicatorConfigModal from './IndicatorConfigModal';
import { Candle, MarketEvent, generateCandleData, DEMO_STOCK, DEMO_EVENTS } from '@/core/data/TechnicalAnalysis';
import { ActiveIndicator, IndicatorConfig, INDICATOR_CONFIGS } from '@/types/indicators';

interface IndependentChartViewProps {
  chartId: number;
}

export default function IndependentChartView({ chartId }: IndependentChartViewProps) {
  const [selectedInterval, setSelectedInterval] = useState('1M');
  const [selectedChartType, setSelectedChartType] = useState<'candles' | 'line' | 'area' | 'bars'>('candles');
  const [currentSymbol, setCurrentSymbol] = useState('AAPL');
  const [addedSymbols, setAddedSymbols] = useState<string[]>([]);
  const [activeIndicators, setActiveIndicators] = useState<ActiveIndicator[]>([]);
  const [showSidePanel, setShowSidePanel] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('cursor');
  
  // États des modals (propres à ce chart)
  const [showSymbolSearch, setShowSymbolSearch] = useState(false);
  const [showIndicators, setShowIndicators] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [showIndicatorConfig, setShowIndicatorConfig] = useState(false);
  const [selectedIndicatorConfig, setSelectedIndicatorConfig] = useState<IndicatorConfig | null>(null);
  const [editingIndicator, setEditingIndicator] = useState<ActiveIndicator | null>(null);

  const candleData = useMemo(() => {
    const intervalMap: Record<string, number> = {
      '1D': 1, '5D': 5, '1W': 7, '1M': 30, '3M': 90, '1Y': 365, 'custom': 30
    };
    return generateCandleData(intervalMap[selectedInterval] || 30);
  }, [selectedInterval]);

  const handleSelectSymbol = (symbol: string) => {
    setCurrentSymbol(symbol);
    if (!addedSymbols.includes(symbol)) {
      setAddedSymbols((prev) => [...prev, symbol]);
    }
    setShowSymbolSearch(false);
  };

  const handleRemoveSymbol = (symbol: string) => {
    setAddedSymbols((prev) => prev.filter((s) => s !== symbol));
  };

  const handleAddIndicator = (indicatorId: string) => {
    const config = INDICATOR_CONFIGS.find(c => c.id === indicatorId);
    if (config) {
      setSelectedIndicatorConfig(config);
      setEditingIndicator(null);
      setShowIndicatorConfig(true);
    }
  };

  const handleSaveIndicator = (indicator: ActiveIndicator) => {
    if (editingIndicator) {
      // Modifier un indicateur existant
      setActiveIndicators(prev => 
        prev.map(ind => ind.instanceId === indicator.instanceId ? indicator : ind)
      );
    } else {
      // Ajouter un nouvel indicateur
      setActiveIndicators(prev => [...prev, indicator]);
    }
    setShowIndicatorConfig(false);
    setEditingIndicator(null);
  };

  const handleEditIndicator = (indicator: ActiveIndicator) => {
    const config = INDICATOR_CONFIGS.find(c => c.id === indicator.id);
    if (config) {
      setSelectedIndicatorConfig(config);
      setEditingIndicator(indicator);
      setShowIndicatorConfig(true);
    }
  };

  const handleRemoveIndicator = (instanceId: string) => {
    setActiveIndicators(prev => prev.filter(ind => ind.instanceId !== instanceId));
  };

  const handleCreateAlert = (alert: any) => {
    console.log('Alert créée:', alert);
    setShowAlerts(false);
  };

  return (
    <div className="independent-chart-view">
      {/* Compact Header */}
      <CompactHeader
        currentSymbol={currentSymbol}
        currentPrice={DEMO_STOCK.currentPrice}
        change={DEMO_STOCK.change}
        changePercent={DEMO_STOCK.changePercent}
        selectedInterval={selectedInterval}
        onIntervalChange={setSelectedInterval}
        selectedChartType={selectedChartType}
        onChartTypeChange={setSelectedChartType}
        onSymbolSearch={() => setShowSymbolSearch(true)}
        onAddSymbol={() => setShowSymbolSearch(true)}
        onOpenIndicators={() => setShowIndicators(true)}
        onOpenAlerts={() => setShowAlerts(true)}
        onOpenReplay={() => setShowReplay(true)}
                addedSymbols={addedSymbols}
        onRemoveSymbol={handleRemoveSymbol}
      />

      {/* Content Area */}
      <div className={`technical-analysis-content ${showSidePanel ? 'with-sidebar' : ''}`}>
        {/* Left Sidebar - Drawing Tools */}
        <DrawingTools onSelectTool={setSelectedTool} selectedTool={selectedTool} />

        {/* Center - Chart */}
        <TechnicalChart
          data={candleData}
          events={[]}
          indicators={activeIndicators.map(ind => ind.id)}
          chartType={selectedChartType}
        />

        {/* Active Indicators Overlay */}
        <ActiveIndicatorsList
          indicators={activeIndicators}
          onEdit={handleEditIndicator}
          onRemove={handleRemoveIndicator}
        />

        {/* Right Sidebar - Info */}
        {showSidePanel && (
          <div className="technical-analysis-sidebar">
            <button className="side-panel-close" onClick={() => setShowSidePanel(false)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <h3>Informations</h3>
            <div className="stock-info-card">
              <div className="info-row">
                <span className="info-label">Symbole:</span>
                <span className="info-value">{currentSymbol}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Chart ID:</span>
                <span className="info-value">#{chartId}</span>
              </div>
            </div>

            <h3 style={{ marginTop: '1.5rem' }}>Sentiment du Marché</h3>
            <SentimentGauge buyPercent={65} holdPercent={20} sellPercent={15} />

            <h3 style={{ marginTop: '1.5rem' }}>Indicateurs Actifs</h3>
            <div className="active-indicators-list">
              {activeIndicators.length === 0 ? (
                <p className="no-indicators">Aucun indicateur actif</p>
              ) : (
                activeIndicators.map((indicator) => (
                  <div key={indicator.instanceId} className="indicator-tag">
                    {indicator.name}
                    <button
                      className="remove-indicator"
                      onClick={() => handleRemoveIndicator(indicator.instanceId)}
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toggle Sidebar Button */}
      {!showSidePanel && (
        <button className="side-panel-toggle" onClick={() => setShowSidePanel(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Modals propres à ce chart */}
      <SymbolSearchModal
        isOpen={showSymbolSearch}
        onClose={() => setShowSymbolSearch(false)}
        onSelectSymbol={handleSelectSymbol}
        currentSymbol={currentSymbol}
        addedSymbols={addedSymbols}
      />

      <IndicatorsModal
        isOpen={showIndicators}
        onClose={() => setShowIndicators(false)}
        onAddIndicator={handleAddIndicator}
        activeIndicators={activeIndicators.map(ind => ind.id)}
      />

      <IndicatorConfigModal
        isOpen={showIndicatorConfig}
        onClose={() => setShowIndicatorConfig(false)}
        indicatorConfig={selectedIndicatorConfig}
        existingIndicator={editingIndicator}
        onSave={handleSaveIndicator}
      />

      <AlertsModal
        isOpen={showAlerts}
        onClose={() => setShowAlerts(false)}
        currentSymbol={currentSymbol}
        onCreateAlert={handleCreateAlert}
      />

      <ReplayModal
        isOpen={showReplay}
        onClose={() => setShowReplay(false)}
      />
    </div>
  );
}
