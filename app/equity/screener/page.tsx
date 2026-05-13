'use client';

import { useState, useMemo, useEffect } from 'react';
import ScreenerHeader from '@/components/screener/ScreenerHeader';
import FilterBar from '@/components/screener/FilterBar';
import FilterSidePanel from '@/components/screener/FilterSidePanel';
import FloatingInsights from '@/components/screener/FloatingInsights';
import ComparisonPanel from '@/components/screener/ComparisonPanel';
import SavedScreensPanel from '@/components/screener/SavedScreensPanel';
import AddColumnModal from '@/components/screener/AddColumnModal';
import {
  StockScreenerItem,
} from '@/core/data/StockScreener';
import {
  PREDEFINED_SCENARIOS,
} from '@/core/data/StockScreenerV2';
import { FilterCriterion, ActiveFilter, getCriterionById } from '@/core/data/StockScreenerFilters';
import { familiesConfig, MetricFamily, createCustomFamily } from '@/core/data/StockScreenerConfig';
import { useCustomColumns } from '@/hooks/useCustomColumns';
import { ActionQueryParams } from '@/core/domain/types/action.type';
import { useActionRepository } from '@/core/infra/repositories/action.repository.impl';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import Link from 'next/link';

type FilterState = {
  search: string;
  bourses: string[];
};

export default function StockScreenerPage() {

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedFamily, setSelectedFamily] = useState<MetricFamily>("overview");
  const [selectedStocks, setSelectedStocks] = useState<ActionEntity[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [detailStockId, setDetailStockId] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    bourses: [],
  });
  
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  
  // Hook pour gérer les colonnes custom
  const {
    customColumns,
    addColumn,
    removeColumn,
    hasColumn,
    isLimitReached,
    maxColumns,
    isLoaded: customColumnsLoaded,
  } = useCustomColumns();
  
  const getStocksParams = (): ActionQueryParams => {
    const params: ActionQueryParams = { view_type: "screener", page: currentPage, page_size: 20 };
    
    if (filters.search) params.search = filters.search;
    if (filters.bourses.length > 0) params.bourse_tickers = filters.bourses.join(',');
    if (sortBy) params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
    
    // Ajouter les filtres actifs (métriques)
    activeFilters.forEach((filter) => {
      const fieldName = filter.criterion.backendField;
      const value = filter.value;
      
      // Mapper les opérateurs vers les suffixes Django
      let paramKey = fieldName;
      switch (filter.operator) {
        case '>=':
          paramKey = `${fieldName}__gte`; // greater than or equal
          break;
        case '<=':
          paramKey = `${fieldName}__lte`; // less than or equal
          break;
        case '>':
          paramKey = `${fieldName}__gt`; // greater than
          break;
        case '<':
          paramKey = `${fieldName}__lt`; // less than
          break;
        case '=':
          // Pour l'égalité, pas de suffixe
          paramKey = fieldName;
          break;
      }
      
      // Ajouter le paramètre (Django accepte les paramètres dynamiques)
      (params as any)[paramKey] = value;
    });
    
    return params;
  };
  
  const { allActionsData, getAllActions } = useActionRepository();
  
  useEffect(() => {
    getAllActions(getStocksParams());
  }, [filters, sortBy, sortOrder, currentPage, activeFilters]);

  useEffect(() =>
  {
    console.log("All Action Data", allActionsData)
  }, [allActionsData])

  // Inclure la famille custom dynamiquement
  const allFamilies = useMemo(() => {
    if (!customColumnsLoaded) return familiesConfig;
    
    const customFamily = createCustomFamily(customColumns);
    // Ajouter la famille custom seulement si elle a des colonnes
    if (customFamily.columns.length > 0) {
      return [...familiesConfig, customFamily];
    }
    return familiesConfig;
  }, [customColumns, customColumnsLoaded]);

  const currentFamily = useMemo(() => 
    allFamilies.find(f => f.id === selectedFamily) || allFamilies[0],
    [selectedFamily, allFamilies]
  );
  
  const handleToggleStockSelection = (action: ActionEntity) => {
    setSelectedStocks((prev) =>
      prev.includes(action)
        ? prev.filter((id) => id !== action)
        : [...prev, action],
    );
  };

  const handleSort = (columnSortKey: string) => {
    if (sortBy === columnSortKey) {
      // Toggle entre asc et desc
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Nouvelle colonne, commencer par desc
      setSortBy(columnSortKey);
      setSortOrder('desc');
    }
    // Retour à la page 1 lors d'un nouveau tri
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll vers le haut du tableau
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      bourses: [],
    });
    setCurrentPage(1);
  };



  



  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [showSavedScreens, setShowSavedScreens] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Synchroniser searchValue avec filters.search
  // Note: Debounce désactivé pour le moment pour évaluation
  // Pour réactiver le debounce, décommenter le setTimeout et ajuster le délai (ex: 300ms)
  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: searchValue }));
    setCurrentPage(1); 
  }, [searchValue]);

  // Filter management
  const handleAddFilter = () => {
    setIsSidePanelOpen(true);
  };

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters(activeFilters.filter((f) => f.id !== filterId));
  };

  const handleEditFilter = (filterId: string) => {
    // For now, just open the panel (editing can be implemented later)
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

    // Convertir les filtres du scénario en ActiveFilter
    const newFilters: ActiveFilter[] = scenario.filters
      .map((filter) => {
        const criterion = getCriterionById(filter.criterionId);
        if (!criterion) {
          console.warn(`Criterion not found: ${filter.criterionId}`);
          return null;
        }

        return {
          id: `filter_${Date.now()}_${Math.random()}`,
          criterion,
          operator: filter.operator,
          value: filter.value,
        };
      })
      .filter((f): f is ActiveFilter => f !== null);

    // Remplacer tous les filtres actuels par ceux du scénario
    setActiveFilters(newFilters);
    
    // Retour à la page 1
    setCurrentPage(1);
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setSearchValue('');
    setFilters({
      search: "",
      bourses: [],
    });
    setCurrentPage(1);
  };

  const handleSaveTemplate = () => {
    setShowSavedScreens(true);
  };

  const handleShare = () => {
    const filterIds = activeFilters.map((f) => f.id).join(',');
    const url = `${window.location.origin}${window.location.pathname}?filters=${filterIds}`;
    navigator.clipboard.writeText(url);
    alert('Link copied to clipboard!');
  };

  const handleCompare = () => {
    if (selectedStocks.length >= 2) {
      setShowComparison(true);
    } else {
      alert('Select at least 2 stocks to compare');
    }
  };

  return (
    // <div className="screener-container">
    <div className="opcvm-screener-page">

      {/* Header */}
      <ScreenerHeader
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onResetFilters={handleClearAllFilters}
        onSave={handleSaveTemplate}
        onShare={handleShare}
      />

      {/* Barre de filtres horizontale */}
      <FilterBar
        activeFilters={activeFilters}
        onRemoveFilter={handleRemoveFilter}
        onEditFilter={handleEditFilter}
        onAddFilter={handleAddFilter}
        bourses={filters.bourses}
        onBoursesChange={(bourses) => setFilters((prev) => ({ ...prev, bourses }))}
        onSelectScenario={handleSelectScenario}
      />

      {/* Main Content Area */}
      <div className="screener-content">
        {/* Center - Data Table */}
        <div className="data-table-container">
          {/* Metric Family Tabs */}
          <div className="metric-family-tabs">
            <div className="tabs-wrapper">
              {allFamilies.map((family) => (
                <button
                  key={family.id}
                  className={`family-tab ${selectedFamily === family.id ? 'active' : ''}`}
                  onClick={() => setSelectedFamily(family.id)}
                >
                  {family.icon}
                  <span>{family.label}</span>
                  {family.id === 'custom' && family.columns.length > 0 && (
                    <span className="custom-count">({family.columns.length})</span>
                  )}
                </button>
              ))}
            </div>
            <div className="table-actions">
              <button 
                className="btn-secondary"
                onClick={() => setIsAddColumnModalOpen(true)}
                title="Add custom column"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add
              </button>
              <button className="btn-secondary">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export
              </button>
              {selectedStocks.length >= 2 && (
                <button
                  className="btn-primary"
                  onClick={() => setShowComparison(true)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                  Compare ({selectedStocks.length})
                </button>
              )}
            </div>
          </div>

          <div className="table-and-detail-wrapper">
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th className="checkbox-col"></th>
                    <th>Equity ({allActionsData?.count})</th>
                    <th>ISIN</th>
                    <th>Exchange</th>
                    {currentFamily.columns.map((col) => (
                      <th 
                        key={col.key} 
                        className={`${col.className || ''} ${col.sortable ? 'sortable' : ''} ${selectedFamily === 'custom' ? 'custom-column' : ''}`}
                        onClick={() => col.sortable && col.sortKey && handleSort(col.sortKey)}
                        style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                      >
                        <div className="th-content">
                          <span>{col.label}</span>
                          {selectedFamily === 'custom' && (
                            <button
                              className="remove-column-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeColumn(col.key);
                              }}
                              title="Remove column"
                            >
                              ×
                            </button>
                          )}
                          {col.sortable && col.sortKey && (
                            <span className="sort-icons">
                              {sortBy === col.sortKey ? (
                                sortOrder === 'asc' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 14l5-5 5 5z"/>
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 10l5 5 5-5z"/>
                                  </svg>
                                )
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
                                  <path d="M7 10l5 5 5-5z"/>
                                </svg>
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allActionsData?.data.map((action) => (
                    <tr
                      key={action.id}
                      className={selectedStocks.includes(action) ? "selected" : ""}
                    >
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedStocks.includes(action)}
                          onChange={() => handleToggleStockSelection(action)}
                        />
                      </td>
                      <td className="fund-name-col">
                        <Link href={`/equity/financial-analysis/${action.id}`} className="fund-name-btn">
                          {action.society.name}
                        </Link>
                        <span className="fund-market">{action.ticker}</span>
                      </td>
                      <td className="isin-col">{action.isin}</td>
                      <td>
                        <span className={`badge badge-${action.bourse.ticker?.toLowerCase()}`}>
                          {action.bourse.ticker?.toUpperCase()}
                        </span>
                      </td>
                      {currentFamily.columns.map((col) => {
                        const value = col.accessor(action);
                        const formattedValue = col.format ? col.format(value) : value;
                        
                        if (col.key === 'nature') {
                          return (
                            <td key={col.key}>
                              <span className={`badge badge-${value?.toLowerCase()}`}>
                                {value?.toUpperCase()}
                              </span>
                            </td>
                          );
                        }
                        
                        if (col.key === 'risk') {
                          return (
                            <td key={col.key} className={col.className}>
                              <span className={`risk-badge risk-${value}`}>
                                {value}
                              </span>
                            </td>
                          );
                        }
                        
                        const isPerformance = col.key.startsWith('perf_');
                        const className = isPerformance && value != null && value >= 0 
                          ? `${col.className} positive` 
                          : isPerformance && value != null && value < 0
                          ? `${col.className} negative`
                          : col.className;
                        
                        return (
                          <td key={col.key} className={className}>
                            {formattedValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {allActionsData && allActionsData.total_pages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((currentPage - 1) * 100) + 1} - {Math.min(currentPage * 100, allActionsData.count)} of {allActionsData.count} funds
              </div>
              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="11 17 6 12 11 7" />
                    <polyline points="18 17 13 12 18 7" />
                  </svg>
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                
                {/* Page numbers */}
                <div className="page-numbers">
                  {(() => {
                    const pages = [];
                    const totalPages = allActionsData.total_pages;
                    const maxVisible = 5;
                    
                    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
                    
                    if (endPage - startPage < maxVisible - 1) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }
                    
                    if (startPage > 1) {
                      pages.push(
                        <button key={1} className="page-number" onClick={() => handlePageChange(1)}>
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(<span key="ellipsis-start" className="ellipsis">...</span>);
                      }
                    }
                    
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(
                        <button
                          key={i}
                          className={`page-number ${i === currentPage ? 'active' : ''}`}
                          onClick={() => handlePageChange(i)}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push(<span key="ellipsis-end" className="ellipsis">...</span>);
                      }
                      pages.push(
                        <button key={totalPages} className="page-number" onClick={() => handlePageChange(totalPages)}>
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === allActionsData.total_pages}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(allActionsData.total_pages)}
                  disabled={currentPage === allActionsData.total_pages}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="13 17 18 12 13 7" />
                    <polyline points="6 17 11 12 6 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
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

      {/* Modal pour ajouter des colonnes custom */}
      <AddColumnModal
        isOpen={isAddColumnModalOpen}
        onClose={() => setIsAddColumnModalOpen(false)}
        onAddColumn={addColumn}
        hasColumn={hasColumn}
        isLimitReached={isLimitReached()}
        maxColumns={maxColumns}
      />

      {/* Floating Insights Bubble */}
      {/* <FloatingInsights stocks={filteredStocks} allStocks={DUMMY_STOCKS} /> */}
    </div>
  );
}
