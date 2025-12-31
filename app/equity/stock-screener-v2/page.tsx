'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import FilterBar from '@/components/screener/FilterBar';
import FilterSidePanel from '@/components/screener/FilterSidePanel';
import ScenarioButtons from '@/components/screener/ScenarioButtons';
import FilterSummary from '@/components/screener/FilterSummary';
import FloatingInsights from '@/components/screener/FloatingInsights';
import AdvancedTable from '@/components/screener/AdvancedTable';
import ComparisonPanel from '@/components/screener/ComparisonPanel';
import SavedScreensPanel from '@/components/screener/SavedScreensPanel';
import SplitView from '@/components/screener/SplitView';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import {
  DUMMY_STOCKS,
  getScreenerStats,
  getSectorDistribution,
  StockScreenerItem,
} from '@/core/data/StockScreener';
import {
  ActiveFilter,
  FilterCriterion,
  ALL_CRITERIA,
  PREDEFINED_SCENARIOS,
} from '@/core/data/StockScreenerV2';

export default function StockScreenerV2Page() {
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [selectedStocks, setSelectedStocks] = useState<StockScreenerItem[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showSavedScreens, setShowSavedScreens] = useState(false);
  const [splitViewEnabled, setSplitViewEnabled] = useState(false);
  const [sortField, setSortField] = useState<keyof StockScreenerItem>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Appliquer les filtres
  const filteredStocks = useMemo(() => {
    let result = [...DUMMY_STOCKS];

    activeFilters.forEach((filter) => {
      result = result.filter((stock) => {
        const value = stock[filter.criterion.field as keyof StockScreenerItem];

        if (typeof value === 'undefined' || value === null) return false;

        if (filter.criterion.type === 'select') {
          return filter.operator === '=' ? value === filter.value : value !== filter.value;
        }

        const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
        const filterValue = typeof filter.value === 'number' ? filter.value : parseFloat(filter.value.toString());

        switch (filter.operator) {
          case '>=':
            return numValue >= filterValue;
          case '<=':
            return numValue <= filterValue;
          case '>':
            return numValue > filterValue;
          case '<':
            return numValue < filterValue;
          case '=':
            return numValue === filterValue;
          default:
            return true;
        }
      });
    });

    // Tri
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [activeFilters, sortField, sortDirection]);

  const stats = getScreenerStats(filteredStocks);
  const sectorDist = getSectorDistribution(filteredStocks);

  // Données pour les graphiques
  const revenueGrowthData = {
    categories: filteredStocks.slice(0, 6).map((s) => s.ticker),
    values: filteredStocks.slice(0, 6).map((s) => s.revenue5YGrowth),
  };

  const performanceData = {
    categories: ['T1', 'T2', 'T3', 'T4'],
    series: [
      {
        name: 'Marché',
        values: [12.5, 14.2, 15.8, 18.3],
        color: '#00BFFF',
      },
      {
        name: 'Sélection',
        values: [15.2, 18.1, 21.5, 24.7],
        color: '#FF9F04',
      },
    ],
  };

  // Gestion des filtres
  const handleAddFilter = () => {
    setIsSidePanelOpen(true);
  };

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter((f) => f.id !== filterId));
  };

  const handleEditFilter = (filterId: string) => {
    // Pour l'instant, juste ouvrir le panel (l'édition peut être implémentée plus tard)
    setIsSidePanelOpen(true);
  };

  const handleSelectCriterion = (criterion: FilterCriterion, operator: string, value: number | string) => {
    const newFilter: ActiveFilter = {
      id: `filter_${Date.now()}`,
      criterion,
      operator: operator as any,
      value,
    };
    setActiveFilters([...activeFilters, newFilter]);
    setIsSidePanelOpen(false);
  };

  const handleSelectScenario = (scenarioId: string) => {
    const scenario = PREDEFINED_SCENARIOS.find((s) => s.id === scenarioId);
    if (!scenario) return;

    // Convertir les filtres du scénario en ActiveFilters
    const newFilters: ActiveFilter[] = scenario.filters.map((f) => {
      const criterion = ALL_CRITERIA.find((c) => c.id === f.criterionId);
      if (!criterion) return null;

      return {
        id: `filter_${Date.now()}_${Math.random()}`,
        criterion,
        operator: f.operator,
        value: f.value,
      };
    }).filter((f): f is ActiveFilter => f !== null);

    setActiveFilters(newFilters);
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };

  const handleSaveTemplate = () => {
    setShowSavedScreens(true);
  };

  const handleShare = () => {
    const filterIds = activeFilters.map((f) => f.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}?filters=${filterIds}`;
    navigator.clipboard.writeText(url);
    alert('Lien copié dans le presse-papiers !');
  };

  const handleCompare = () => {
    if (selectedStocks.length >= 2) {
      setShowComparison(true);
    } else {
      alert('Sélectionnez au moins 2 actions pour comparer');
    }
  };

  return (
    <div className="screener-container">
      {/* Header */}
      <div className="screener-header">
        <h1>
          Stock Screener V2
        </h1>
        <Link href="/">
          <button className="btn btn--secondary btn--sm">← Dashboard</button>
        </Link>
      </div>

      {/* Barre de filtres horizontale */}
      <FilterBar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onEditFilter={handleEditFilter}
        onAddFilter={handleAddFilter}
      />

      {/* Boutons de scénarios prédéfinis */}
      <ScenarioButtons onSelectScenario={handleSelectScenario} />

      {/* Résumé des filtres */}
      <FilterSummary
        activeFilters={activeFilters}
        resultsCount={filteredStocks.length}
        totalCount={DUMMY_STOCKS.length}
        onClearAll={handleClearAllFilters}
        onSaveTemplate={handleSaveTemplate}
        onShare={handleShare}
      />

      {/* Zone centrale */}
      <div className="screener-body">
        {/* Stats rapides */}
        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-box__label">Actions Filtrées</div>
            <div className="stat-box__value stat-box__value--gold">{filteredStocks.length}</div>
            <div className="stat-box__change">/ {DUMMY_STOCKS.length} total</div>
          </div>
          <div className="stat-box">
            <div className="stat-box__label">P/E Moyen</div>
            <div className="stat-box__value">{stats.avgPE.toFixed(1)}x</div>
          </div>
          <div className="stat-box">
            <div className="stat-box__label">ROE Moyen</div>
            <div className="stat-box__value stat-box__value--positive">{stats.avgROE.toFixed(1)}%</div>
          </div>
          <div className="stat-box">
            <div className="stat-box__label">Cap. Totale</div>
            <div className="stat-box__value">{(stats.totalMarketCap / 1000).toFixed(1)}T€</div>
          </div>
        </div>

        {/* Tableau avec split view */}
        {splitViewEnabled ? (
          <div className="split-view-container">
            <div className="split-view-table">
              <AdvancedTable
                data={filteredStocks}
                onSelectRows={setSelectedStocks}
                selectedRows={selectedStocks}
                splitViewEnabled={splitViewEnabled}
                onToggleSplitView={setSplitViewEnabled}
                onCompare={handleCompare}
              />
            </div>
            <SplitView stocks={filteredStocks} />
          </div>
        ) : (
          <AdvancedTable
            data={filteredStocks}
            onSelectRows={setSelectedStocks}
            selectedRows={selectedStocks}
            splitViewEnabled={splitViewEnabled}
            onToggleSplitView={setSplitViewEnabled}
            onCompare={handleCompare}
          />
        )}
      </div>

      {/* Side-Panel pour ajouter des filtres */}
      <FilterSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        onSelectCriterion={handleSelectCriterion}
      />

      {/* Panneau de comparaison */}
      {showComparison && (
        <ComparisonPanel stocks={selectedStocks} onClose={() => setShowComparison(false)} />
      )}

      {/* Panneau de sauvegarde des screens */}
      <SavedScreensPanel
        isOpen={showSavedScreens}
        onClose={() => setShowSavedScreens(false)}
        onLoadScreen={(filters) => {
          setActiveFilters(filters);
          setShowSavedScreens(false);
        }}
        currentFilters={activeFilters}
      />

      {/* Floating Insights Bubble */}
      <FloatingInsights stocks={filteredStocks} allStocks={DUMMY_STOCKS} />
    </div>
  );
}
