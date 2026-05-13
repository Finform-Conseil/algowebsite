'use client';

import { useState, useMemo } from 'react';
import ExportMenu from '@/components/comparison/ExportMenu';

import {
  ComparisonTemplate,
  getOpcvmIndicatorById,
} from '@/core/data/StockComparison';
import FinancialTooltip from '@/components/common/FinancialTooltip';
import OPCVMIndicatorSidebar from '@/components/comparison/OPCVMIndicatorSidebar';
import OPCVMSelector from '@/components/comparison/OPCVMSelector';
import { OPCVMEntity } from '@/core/domain/entities/opcvm.entity';
import OPCVMComparisonHistogramsTab from '@/components/comparison/OPCVMComparisonHistogramsTab';
import OPCVMComparisonTable from '@/components/comparison/OPCVMComparisonTable';
import OPCVMComparisonChartsTab from '@/components/comparison/OPCVMComparisonChartsTab';

type TabType = 'charts' | 'histograms' | 'table';

export default function FundComparisonPage() {
  const [selectedOPCVMs, setSelectedOPCVMs] = useState<OPCVMEntity[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['performance_1y', 'rendement_1y', 'volatility_1y', 'ratio_sharpe_1y']);

  const [showAverage, setShowAverage] = useState(true);
  const [highlightBest, setHighlightBest] = useState(true);
  const [showIndicatorSidebar, setShowIndicatorSidebar] = useState(false);
  const [showStockSelector, setShowStockSelector] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('charts');

  // Get selected indicators
  const indicators = useMemo(() => {
    return selectedIndicators
      .map((id) => getOpcvmIndicatorById(id))
      .filter((ind) => ind !== undefined);
  }, [selectedIndicators]);

  const handleAddStock = (stock: OPCVMEntity) => {
    if (!selectedOPCVMs.find((s) => s.id === stock.id)) {
      setSelectedOPCVMs([...selectedOPCVMs, stock]);
    }
  };

  const handleRemoveStock = (stockId: string) => {
    setSelectedOPCVMs(selectedOPCVMs.filter((s) => s.id !== stockId));
  };

  const handleToggleIndicator = (indicatorId: string) => {
    if (selectedIndicators.includes(indicatorId)) {
      setSelectedIndicators(selectedIndicators.filter((id) => id !== indicatorId));
    } else {
      setSelectedIndicators([...selectedIndicators, indicatorId]);
    }
  };

  const handleApplyTemplate = (template: ComparisonTemplate) => {
    setSelectedIndicators(template.indicators);
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv' | 'image') => {
    console.log(`Exporter en ${format}`);
    alert(`Export ${format} - Fonctionnalité à venir`);
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/opcvm/comparison?stocks=${selectedOPCVMs.map((s) => s.id).join(',')}&indicators=${selectedIndicators.join(',')}`;
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
            <h1 className="comparison-header__title">Funds Comparison</h1>
            <p className="comparison-header__subtitle">
              Compare up to 3 funds side-by-side to make informed investment decision
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
              Add Fund
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
          <OPCVMComparisonChartsTab
            opcvms={selectedOPCVMs}
            indicators={indicators as any}
          />
        )}

        {activeTab === 'histograms' && (
          <OPCVMComparisonHistogramsTab
            opcvms={selectedOPCVMs}
            indicators={indicators as any}
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

            <OPCVMComparisonTable
              opcvms={selectedOPCVMs}
              indicators={indicators as any}
              showAverage={showAverage}
              highlightBest={highlightBest}
            />
          </>
        )}
      </div>

      {/* Floating Insights */}
      {/* <ComparisonFloatingInsights stocks={selectedOPCVMs} indicators={indicators as any} /> */}
      
      {/* Indicator Sidebar */}
        <OPCVMIndicatorSidebar
            isOpen={showIndicatorSidebar}
            onClose={() => setShowIndicatorSidebar(false)}
            selectedIndicators={selectedIndicators}
            onToggleIndicator={handleToggleIndicator}
            onApplyTemplate={handleApplyTemplate}
        />

      {/* Stock Selector Modal */}
      {showStockSelector && (
        <>
          <div className="stock-selector-modal-overlay" onClick={() => setShowStockSelector(false)} />
          <div className="stock-selector-modal">
            <div className="stock-selector-modal__header">
              <h3>Add Funds to Compare</h3>
              <button className="stock-selector-modal__close" onClick={() => setShowStockSelector(false)}>
                ✕
              </button>
            </div>
            <div className="stock-selector-modal__body">
              <OPCVMSelector
                selectedOPCVMs={selectedOPCVMs}
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
