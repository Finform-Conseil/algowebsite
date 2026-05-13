"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import MultiSelect from "@/components/corporate-events/MultiSelect";
import { useQueryParams } from "@/core/presenter/hooks/useQueryParams";
import { useOpcvmRepository } from "@/core/infra/repositories/opcvm.repository.impl";
import { OpcvmQueryParams } from "@/core/domain/types/opcvm.type";
import { OPCVMNatureEnum, OPCVMTypeEnum } from "@/core/domain/enums/opcvm.enum";
import { 
  Period, 
  MetricFamily, 
  familiesConfig, 
  getMetricsByPeriod 
} from "@/core/data/OPCVMScreenerConfig";

// Types
type FilterState = {
  search: string;
  markets: string[];
  natures: string[];
  types: string[];
  riskRatings: number[];
};

export default function OPCVMScreenerPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Y");
  const [showQuickCompare, setShowQuickCompare] = useState(false);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [detailFundId, setDetailFundId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [selectedFamily, setSelectedFamily] = useState<MetricFamily>("general");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    markets: [],
    natures: [],
    types: [],
    riskRatings: [],
  });

  const getOpcvmParams = (): OpcvmQueryParams => {
    const params: OpcvmQueryParams = { view_type: "screener", page: currentPage, page_size: 20 };
    
    if (filters.search) params.search = filters.search;
    if (filters.natures.length > 0) params.natures = filters.natures.join(',');
    if (filters.types.length > 0) params.types = filters.types.join(',');
    if (filters.markets.length > 0) params.bourse_tickers = filters.markets.join(',');
    if (filters.riskRatings.length > 0) params.niveaux_risque = filters.riskRatings.join(',');
    if (sortBy) params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;
    
    return params;
  };
  
  const { allOpcvmsData, getAllOpcvms } = useOpcvmRepository();
  
  useEffect(() => {
    getAllOpcvms(getOpcvmParams());
  }, [filters, sortBy, sortOrder, currentPage]);

  useEffect(() =>
  {
    console.log("All OPCVM Data", allOpcvmsData)
  }, [allOpcvmsData])


  const currentFamily = useMemo(() => 
    familiesConfig.find(f => f.id === selectedFamily) || familiesConfig[0],
    [selectedFamily]
  );

  // Les données sont déjà filtrées côté backend via les query params
  const filteredFunds = allOpcvmsData?.data || [];

  const handleToggleFundSelection = (fundId: string) => {
    setSelectedFunds((prev) =>
      prev.includes(fundId)
        ? prev.filter((id) => id !== fundId)
        : [...prev, fundId],
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
      markets: [],
      natures: [],
      types: [],
      riskRatings: [],
    });
    setCurrentPage(1);
  };

  const handleApplyPreset = (preset: string) => {
    switch (preset) {
      case "low-risk":
        setFilters((prev) => ({
          ...prev,
          riskRatings: [1, 2],
          natures: ["FCP"],
        }));
        break;
      case "income":
        setFilters((prev) => ({
          ...prev,
          types: ["Bonds"],
          feeRange: [0, 2],
        }));
        break;
      case "equity-growth":
        setFilters((prev) => ({
          ...prev,
          types: ["Equity"],
          perfRange: [10, 100],
        }));
        break;
      case "short-term":
        setFilters((prev) => ({
          ...prev,
          types: ["Money Market"],
          riskRatings: [1],
        }));
        break;
    }
  };

  return (
    <div className="opcvm-screener-page">
      {/* Header / Search Bar */}
      <div className="opcvm-screener-header">
        <div
          className="header-hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
          }}
        >
          <div className="header-top">
            <div className="header-title">
              <h1>Funds Screener</h1>
              <p>Search, filter and compare investment funds</p>
            </div>

            <div className="header-actions">
              <div className="search-bar">
                <div className="search-input-wrapper">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, ISIN, ticker or manager..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                  />
                  {filters.search && (
                    <button
                      className="clear-search"
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, search: "" }))
                      }
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <button className="btn-secondary" onClick={handleResetFilters}>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Reset
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
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save
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
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share
              </button>
            </div>
          </div>
        </div>

        <div className="header-filters-section">
          {/* Main filters */}
          <div className="main-filters">
            <div className="filter-group">
              <label>Period</label>
              <select
                className="period-select"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as Period)}
              >
                <option value="1M">1 Month</option>
                <option value="3M">3 Months</option>
                <option value="6M">6 Months</option>
                <option value="9M">9 Months</option>
                <option value="1Y">1 Year</option>
                <option value="3Y">3 Years</option>
                <option value="5Y">5 Years</option>
              </select>
            </div>

            <MultiSelect
              label="Exchanges"
              options={["BRVM", "JSE", "NGX", "NSE", "CSE", "GSE"].map((m) => ({
                value: m,
                label: m,
              }))}
              selected={filters.markets}
              onChange={(markets) =>
                setFilters((prev) => ({ ...prev, markets }))
              }
              placeholder="All exchanges"
            />

            <MultiSelect
              label="Nature"
              options={Object.values(OPCVMNatureEnum).map((nature) => ({
                value: nature,
                label: nature.toUpperCase(),
              }))}
              selected={filters.natures}
              onChange={(natures) =>
                setFilters((prev) => ({ ...prev, natures }))
              }
              placeholder="All natures"
            />

            <MultiSelect
              label="Type"
              options={Object.values(OPCVMTypeEnum).map((type) => ({
                value: type,
                label: type,
              }))}
              selected={filters.types}
              onChange={(types) => setFilters((prev) => ({ ...prev, types }))}
              placeholder="All types"
            />

            <div className="filter-group">
              <label>Risk</label>
              <div className="risk-selector">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <button
                    key={rating}
                    className={`risk-btn ${filters.riskRatings.includes(rating) ? "active" : ""}`}
                    onClick={() => {
                      if (filters.riskRatings.includes(rating)) {
                        setFilters((prev) => ({
                          ...prev,
                          riskRatings: prev.riskRatings.filter(
                            (r) => r !== rating,
                          ),
                        }));
                      } else {
                        setFilters((prev) => ({
                          ...prev,
                          riskRatings: [...prev.riskRatings, rating],
                        }));
                      }
                    }}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn-advanced-filters"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Advanced filters
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: showAdvancedFilters
                    ? "rotate(180deg)"
                    : "rotate(0)",
                  transition: "transform 0.2s",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          {/* Advanced filters (collapsible) */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="screener-content">
        {/* Center - Data Table */}
        <div className="data-table-container">
          {/* Metric Family Tabs */}
          <div className="metric-family-tabs">
            <div className="tabs-wrapper">
              {familiesConfig.map((family) => (
                <button
                  key={family.id}
                  className={`family-tab ${selectedFamily === family.id ? 'active' : ''}`}
                  onClick={() => setSelectedFamily(family.id)}
                >
                  {family.icon}
                  <span>{family.label}</span>
                </button>
              ))}
            </div>
            <div className="table-actions">
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
              {selectedFunds.length >= 2 && (
                <button
                  className="btn-primary"
                  onClick={() => setShowCompareModal(true)}
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
                  Compare ({selectedFunds.length})
                </button>
              )}
            </div>
          </div>

          <div className="table-and-detail-wrapper">
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th className="checkbox-col">
                      <input type="checkbox" />
                    </th>
                    <th>Fund Name ({allOpcvmsData?.count})</th>
                    <th>ISIN</th>
                    {currentFamily.columns.map((col) => (
                      <th 
                        key={col.key} 
                        className={`${col.className || ''} ${col.sortable ? 'sortable' : ''}`}
                        onClick={() => col.sortable && col.sortKey && handleSort(col.sortKey)}
                        style={{ cursor: col.sortable ? 'pointer' : 'default' }}
                      >
                        <div className="th-content">
                          <span>{col.label}</span>
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
                    <th className="actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allOpcvmsData?.data.map((fund) => (
                    <tr
                      key={fund.id}
                      className={selectedFunds.includes(fund.id) ? "selected" : ""}
                    >
                      <td className="checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedFunds.includes(fund.id)}
                          onChange={() => handleToggleFundSelection(fund.id)}
                        />
                      </td>
                      <td className="fund-name-col">
                        <Link href={`/opcvm/${fund.id}`} className="fund-name-btn">
                          {fund.intitule}
                        </Link>
                        <span className="fund-market">{fund.bourse}</span>
                      </td>
                      <td className="isin-col">{fund.isin}</td>
                      {currentFamily.columns.map((col) => {
                        const value = col.accessor(fund);
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
                      <td className="actions-col">
                        <button
                          className="btn-icon"
                          title="View details"
                          onClick={() => setDetailFundId(fund.id)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Sidebar - Detail Panel */}
            {detailFundId && (
              <div className="detail-panel">
            <div className="detail-header">
              <h3>Fund Details</h3>
              <button
                className="btn-icon"
                onClick={() => setDetailFundId(null)}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="detail-content">
              {(() => {
                const fund = filteredFunds.find((f) => f.id === detailFundId);
                if (!fund) return null;
                return (
                  <>
                    <div className="detail-fund-header">
                      <h4>{fund.intitule}</h4>
                      <span
                        className={`badge badge-${fund.nature?.toLowerCase()}`}
                      >
                        {fund.nature}
                      </span>
                    </div>
                    <div className="detail-metrics">
                      <div className="metric-item">
                        <span className="metric-label">AUM</span>
                        <span className="metric-value">
                          {(fund.aum / 1000000).toFixed(0)}M {typeof fund.currency==='string'? fund.currency : fund.currency?.name}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Performance ({selectedPeriod})</span>
                        <span
                          className={`metric-value ${getMetricsByPeriod(fund, selectedPeriod).perf !== null && getMetricsByPeriod(fund, selectedPeriod).perf !== undefined && getMetricsByPeriod(fund, selectedPeriod).perf! >= 0 ? "positive" : "negative"}`}
                        >
                          {getMetricsByPeriod(fund, selectedPeriod).perf !== null && getMetricsByPeriod(fund, selectedPeriod).perf !== undefined ? `${getMetricsByPeriod(fund, selectedPeriod).perf! >= 0 ? "+" : ""}${getMetricsByPeriod(fund, selectedPeriod).perf!.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Volatility ({selectedPeriod})</span>
                        <span className="metric-value">
                          {getMetricsByPeriod(fund, selectedPeriod).vol !== null && getMetricsByPeriod(fund, selectedPeriod).vol !== undefined ? `${getMetricsByPeriod(fund, selectedPeriod).vol!.toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Sharpe Ratio ({selectedPeriod})</span>
                        <span className="metric-value">
                          {getMetricsByPeriod(fund, selectedPeriod).sharpe !== null && getMetricsByPeriod(fund, selectedPeriod).sharpe !== undefined ? getMetricsByPeriod(fund, selectedPeriod).sharpe!.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="detail-actions">
                      <button className="btn-primary btn-block">
                        Add to comparison
                      </button>
                      <button className="btn-secondary btn-block">
                        View full profile
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {allOpcvmsData && allOpcvmsData.total_pages > 1 && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {((currentPage - 1) * 100) + 1} - {Math.min(currentPage * 100, allOpcvmsData.count)} of {allOpcvmsData.count} funds
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
                    const totalPages = allOpcvmsData.total_pages;
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
                  disabled={currentPage === allOpcvmsData.total_pages}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
                <button
                  className="pagination-btn"
                  onClick={() => handlePageChange(allOpcvmsData.total_pages)}
                  disabled={currentPage === allOpcvmsData.total_pages}
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

      {/* Quick Compare Tray */}
      {selectedFunds.length > 0 && (
        <div className="quick-compare-tray">
          <div className="tray-header">
            <span className="tray-title">
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
              Quick comparison ({selectedFunds.length})
            </span>
            <button className="btn-icon" onClick={() => setSelectedFunds([])}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="tray-funds">
            {selectedFunds.map((fundId) => {
              const fund = filteredFunds.find((f) => f.id === fundId);
              if (!fund) return null;
              return (
                <div key={fundId} className="tray-fund-item">
                  <span className="fund-name">{fund.intitule}</span>
                  <button
                    className="btn-remove"
                    onClick={() => handleToggleFundSelection(fundId)}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          {selectedFunds.length >= 2 && (
            <button
              className="btn-primary btn-block"
              onClick={() => setShowCompareModal(true)}
            >
              Compare selected funds
            </button>
          )}
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCompareModal(false)}
        >
          <div
            className="modal-content compare-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Fund Comparison</h2>
              <button
                className="btn-icon"
                onClick={() => setShowCompareModal(false)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <div className="compare-table">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return <th key={fundId}>{fund?.intitule}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Performance ({selectedPeriod})</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        const metrics = fund ? getMetricsByPeriod(fund, selectedPeriod) : null;
                        return (
                          <td
                            key={fundId}
                            className={
                              metrics && metrics.perf !== null && metrics.perf !== undefined && metrics.perf >= 0
                                ? "positive"
                                : "negative"
                            }
                          >
                            {metrics && metrics.perf !== null && metrics.perf !== undefined
                              ? `${metrics.perf >= 0 ? "+" : ""}${metrics.perf.toFixed(2)}%`
                              : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td>Volatility ({selectedPeriod})</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        const metrics = fund ? getMetricsByPeriod(fund, selectedPeriod) : null;
                        return (
                          <td key={fundId}>
                            {metrics && metrics.vol ? `${metrics.vol.toFixed(2)}%` : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td>Sharpe Ratio ({selectedPeriod})</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        const metrics = fund ? getMetricsByPeriod(fund, selectedPeriod) : null;
                        return (
                          <td key={fundId}>{metrics && metrics.sharpe ? metrics.sharpe.toFixed(2) : 'N/A'}</td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td>Risk Level</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return (
                          <td key={fundId}>
                            {fund && fund.niveau_risque ? fund.niveau_risque : 'N/A'}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary">Export PDF</button>
              <button className="btn-secondary">Export Excel</button>
              <button
                className="btn-primary"
                onClick={() => setShowCompareModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
