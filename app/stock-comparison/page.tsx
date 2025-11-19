'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import StockSelector from '@/components/comparison/StockSelector';
import QuickFilters from '@/components/comparison/QuickFilters';
import IndicatorSidebar from '@/components/comparison/IndicatorSidebar';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonChartsTab from '@/components/comparison/ComparisonChartsTab';
import ComparisonHistogramsTab from '@/components/comparison/ComparisonHistogramsTab';
import ExportMenu from '@/components/comparison/ExportMenu';
import ComparisonFloatingInsights from '@/components/comparison/ComparisonFloatingInsights';

import {
  COMPARISON_STOCKS,
  INDICATOR_CATEGORIES,
  ComparisonStock,
  ComparisonTemplate,
  getIndicatorById,
} from '@/core/data/StockComparison';
import FinancialTooltip from '@/components/common/FinancialTooltip';

type TabType = 'charts' | 'histograms' | 'table';

export default function StockComparisonPage() {
  const [selectedStocks, setSelectedStocks] = useState<ComparisonStock[]>([]);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['pe', 'roe', 'netMargin', 'dividendYield']);
  const [quickFilters, setQuickFilters] = useState({
    sector: '',
    country: '',
    market: '',
    currency: '',
    capitalization: 'Tous',
  });
  const [showAverage, setShowAverage] = useState(true);
  const [highlightBest, setHighlightBest] = useState(true);
  const [showIndicatorSidebar, setShowIndicatorSidebar] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('charts');

  // Filtrer les stocks disponibles selon les filtres rapides
  const filteredStocks = useMemo(() => {
    let stocks = [...COMPARISON_STOCKS];

    if (quickFilters.sector) {
      stocks = stocks.filter((s) => s.sector === quickFilters.sector);
    }

    if (quickFilters.country) {
      stocks = stocks.filter((s) => s.country === quickFilters.country);
    }

    if (quickFilters.market) {
      stocks = stocks.filter((s) => s.market === quickFilters.market);
    }

    if (quickFilters.currency) {
      stocks = stocks.filter((s) => s.currency === quickFilters.currency);
    }

    if (quickFilters.capitalization && quickFilters.capitalization !== 'Tous') {
      if (quickFilters.capitalization.includes('Small')) {
        stocks = stocks.filter((s) => s.marketCap < 1000);
      } else if (quickFilters.capitalization.includes('Mid')) {
        stocks = stocks.filter((s) => s.marketCap >= 1000 && s.marketCap <= 10000);
      } else if (quickFilters.capitalization.includes('Large')) {
        stocks = stocks.filter((s) => s.marketCap > 10000);
      }
    }

    return stocks;
  }, [quickFilters]);

  // Obtenir les indicateurs sélectionnés
  const indicators = useMemo(() => {
    return selectedIndicators
      .map((id) => getIndicatorById(id))
      .filter((ind) => ind !== undefined);
  }, [selectedIndicators]);

  const handleAddStock = (stock: ComparisonStock) => {
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

  const handleApplyTemplate = (template: ComparisonTemplate) => {
    setSelectedIndicators(template.indicators);
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
        <div className="comparison-header__title">
          <h1>Comparateur d'Actions</h1>
          <p className="comparison-header__subtitle">
            Analyse comparative multi-marchés • 2 à 10 titres
          </p>
        </div>
        <div className="comparison-header__actions">
          {/* Indicator Selector in Header */}
          <button 
            className="btn btn--outline"
            onClick={() => setShowIndicatorSidebar(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Indicateurs ({selectedIndicators.length})
          </button>
          <ExportMenu onExport={handleExport} onShare={handleShare} />
          <Link href="/">
            <button className="btn btn--secondary btn--sm">Dashboard</button>
          </Link>
        </div>
      </div>

      {/* Stock Selector + Quick Filters */}
      <div className="comparison-selector-row">
        <div className="selector-col">
          <StockSelector
            allStocks={filteredStocks}
            selectedStocks={selectedStocks}
            onAddStock={handleAddStock}
            onRemoveStock={handleRemoveStock}
            maxStocks={10}
          />
        </div>
        <div className="filters-col">
          <QuickFilters
            allStocks={COMPARISON_STOCKS}
            filters={quickFilters}
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="comparison-tabs">
        <button
          className={`tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
          onClick={() => setActiveTab('charts')}
        >
          {renderTabIcon('charts')}
          <span>Graphiques Techniques</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'histograms' ? 'active' : ''}`}
          onClick={() => setActiveTab('histograms')}
        >
          {renderTabIcon('histograms')}
          <span>Histogrammes Multi-Années</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
          onClick={() => setActiveTab('table')}
        >
          {renderTabIcon('table')}
          <span>Tableau Comparatif</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="comparison-tab-content">
        {activeTab === 'charts' && (
          <ComparisonChartsTab
            stocks={selectedStocks}
            indicators={indicators as any}
          />
        )}

        {activeTab === 'histograms' && (
          <ComparisonHistogramsTab
            stocks={selectedStocks}
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
                <span>Afficher moyenne</span>
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
                  <span className='tooltip-trigger'>Surligner valeurs extrêmes</span>
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
      <ComparisonFloatingInsights stocks={selectedStocks} indicators={indicators as any} />
      
      {/* Indicator Sidebar */}
      <IndicatorSidebar
        isOpen={showIndicatorSidebar}
        onClose={() => setShowIndicatorSidebar(false)}
        selectedIndicators={selectedIndicators}
        onToggleIndicator={handleToggleIndicator}
        onApplyTemplate={handleApplyTemplate}
      />
    </div>
  );
}
