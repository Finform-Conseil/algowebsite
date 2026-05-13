'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StockSelector from '@/components/comparison/StockSelector';
import IndicatorSidebar from '@/components/comparison/IndicatorSidebar';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonChartsTab from '@/components/comparison/ComparisonChartsTab';
import ComparisonHistogramsTab from '@/components/comparison/ComparisonHistogramsTab';
import ExportMenu from '@/components/comparison/ExportMenu';
import ComparisonFloatingInsights from '@/components/comparison/ComparisonFloatingInsights';
import { ActionEntity } from '@/core/domain/entities/action.entity';

import {
  INDICATOR_CATEGORIES,
} from '@/core/data/StockComparison';
import { getColumnById } from '@/core/data/ColumnRegistry';
import FinancialTooltip from '@/components/common/FinancialTooltip';

type TabType = 'charts' | 'histograms' | 'table';

export default function StockComparisonPage() {
  const [selectedStocks, setSelectedStocks] = useState<ActionEntity[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['pe_ttm', 'roe', 'rsi', 'sma_50']);
  const [quickFilters, setQuickFilters] = useState({
    sector: '',
    country: '',
    market: '',
    currency: '',
    capitalization: 'All',
  });
  const [showAverage, setShowAverage] = useState(true);
  const [highlightBest, setHighlightBest] = useState(true);
  const [showIndicatorSidebar, setShowIndicatorSidebar] = useState(false);
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('charts');

  // Le filtrage est maintenant géré dans StockSelector via l'API

  // Get selected columns
  const indicators = useMemo(() => {
    return selectedIndicators
      .map((id) => getColumnById(id))
      .filter((ind) => ind !== undefined);
  }, [selectedIndicators]);

  const handleAddStock = (stock: ActionEntity) => {
    if (!selectedStocks.find((s) => s.id === stock.id)) {
      setSelectedStocks([...selectedStocks, stock]);
    }
  };

  const handleRemoveStock = (stockId: string) => {
    setSelectedStocks(selectedStocks.filter((s) => s.id !== stockId));
  };

  const handleToggleIndicator = (indicatorId: string) => {
    if (selectedIndicators.includes(indicatorId)) {
      setSelectedIndicators(selectedIndicators.filter((id) => id !== indicatorId));
    } else {
      setSelectedIndicators([...selectedIndicators, indicatorId]);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setQuickFilters({
      ...quickFilters,
      [filterType]: value,
    });
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv' | 'image') => {
    console.log(`Exporter en ${format}`);
    alert(`Export ${format} - Fonctionnalité à venir`);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/stock-comparison?stocks=${selectedStocks.map((s) => s.id).join(',')}&indicators=${selectedIndicators.join(',')}`;
    navigator.clipboard.writeText(shareUrl);
    alert('Lien copié dans le presse-papiers !');
  };

  const renderTabIcon = (tab: TabType) => {
    const icons = {
      charts: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      ),
      histograms: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      ),
      table: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="3" y1="15" x2="21" y2="15" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      ),
    };
    return icons[tab];
  };

  return (
    <div className="comparison-page">
      {/* Header */}
      <div className="comparison-header">
        <div className="comparison-header__hero">
          <div className="comparison-header__content">
            <h1 className="comparison-header__title">Stock Comparison</h1>
            <p className="comparison-header__subtitle">
              Multi-market comparative analysis • 2 to 10 stocks
            </p>
          </div>
          <div className="comparison-header__controls">
            <button 
              className="btn btn--outline"
              onClick={() => setShowStockSelector(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Stock
            </button>
            <button 
              className="btn btn--outline"
              onClick={() => setShowIndicatorSidebar(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Indicators ({selectedIndicators.length})
            </button>
            <ExportMenu onExport={handleExport} onShare={handleShare} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="comparison-tabs">
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          {renderTabIcon('charts')}
          <span>Technical Charts</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'histograms' ? 'active' : ''}`}
          onClick={() => setActiveTab('histograms')}
        >
          {renderTabIcon('histograms')}
          <span>Multi-Year Histograms</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          {renderTabIcon('table')}
          <span>Comparison Table</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="comparison-tab-content">
        {activeTab === 'charts' && (
          <ComparisonChartsTab
            stocks={selectedStocks}
            indicators={indicators}
          />
        )}

        {activeTab === 'histograms' && (
          <ComparisonHistogramsTab
            stocks={selectedStocks}
            indicators={indicators}
          />
        )}

        {activeTab === 'table' && (
          <>
            {/* Options Bar */}
            <div className="comparison-options">
              <label className="comparison-option">
                <input
                  type="checkbox"
                  checked={showAverage}
                  onChange={() => setShowAverage(!showAverage)}
                />
                <span>Display average</span>
              </label>
              <label className="comparison-option">
                <input
                  type="checkbox"
                  checked={highlightBest}
                  onChange={() => setHighlightBest(!highlightBest)}
                />
                <FinancialTooltip
                  term='Surligner les valeurs extrêmes'
                  definition="Technique permettant d'attirer l'attention sur les points de données exceptionnellement élevés ou bas dans un graphique ou un tableau."
                  formula="Extrême si valeur > moyenne + 2 × écart-type OU valeur < moyenne – 2 × écart-type"
                  example="Par exemple, si la moyenne des rendements est de 3% avec un écart-type de 1%, toute valeur supérieure à 5% ou inférieure à 1% sera considérée comme extrême."
                >
                  <span className='tooltip-trigger'>Highlight Extreme values</span>
                </FinancialTooltip>
              </label>
            </div>

            <ComparisonTable
              stocks={selectedStocks}
              indicators={indicators as any}
              showAverage={showAverage}
              highlightBest={highlightBest}
            />
          </>
        )}
      </div>

      {/* Floating Insights */}
      {/* <ComparisonFloatingInsights stocks={selectedStocks} indicators={indicators as any} /> */}
      
      {/* Indicator Sidebar */}
      <IndicatorSidebar
        isOpen={showIndicatorSidebar}
        onClose={() => setShowIndicatorSidebar(false)}
        selectedIndicators={selectedIndicators}
        onToggleIndicator={handleToggleIndicator}
      />

      {/* Stock Selector Modal */}
      {showStockSelector && (
        <>
          <div className="stock-selector-modal-overlay" onClick={() => setShowStockSelector(false)} />
          <div className="stock-selector-modal">
            <div className="stock-selector-modal__header">
              <h3>Add Stocks to Compare</h3>
              <button className="stock-selector-modal__close" onClick={() => setShowStockSelector(false)}>
                ✕
              </button>
            </div>
            <div className="stock-selector-modal__body">
              <StockSelector
                selectedStocks={selectedStocks}
                onAddStock={handleAddStock}
                onRemoveStock={handleRemoveStock}
                maxStocks={10}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
