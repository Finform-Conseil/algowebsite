"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useQueryParams } from "@/core/presenter/hooks/useQueryParams";
import { QueryParams } from "@/core/domain/types/pagination.type";
import { usePrimaryRepository } from "@/core/infra/repositories/primary.repository.impl";
import { PrimaryEntity } from "@/core/domain/entities/primary.entity";
import {
  primaryFamiliesConfig,
  PrimaryMetricFamily,
  parseNumeric,
  formatAmount,
  formatDate,
  formatDecimal,
  formatPercent,
  getIssuerName,
} from "@/core/data/PrimaryScreenerConfig";
import {
  PrimaryActiveFilter,
  PrimaryFilterCriterion,
  operatorToSuffix,
} from "@/core/data/PrimaryScreenerFilters";
import PrimaryFilterBar from "./components/PrimaryFilterBar";
import PrimaryFilterPanel from "./components/PrimaryFilterPanel";

type FilterState = {
  search: string;
};

const getCountryFlag = (country?: string | null): string => {
  if (!country) return "🏳️";
  const flags: { [key: string]: string } = {
    "Côte d'Ivoire": "🇨🇮",
    Senegal: "🇸🇳",
    Benin: "🇧🇯",
    "Burkina Faso": "🇧🇫",
    Mali: "🇲🇱",
    Niger: "🇳🇪",
    Togo: "🇹🇬",
    "Guinea-Bissau": "🇬🇼",
    Nigeria: "🇳🇬",
    Ghana: "🇬🇭",
    Kenya: "🇰🇪",
    "Afrique du Sud": "🇿🇦",
    Morocco: "🇲🇦",
    Egypt: "🇪🇬",
    Tunisia: "🇹🇳",
    Algeria: "🇩🇿",
  };
  return flags[country] || "🏳️";
};

const getIssuerCountry = (primary: PrimaryEntity): string | null => {
  if (!primary.issuer || typeof primary.issuer === "string") return null;
  return primary.issuer.name || null;
};

const getCellValue = (primary: PrimaryEntity, col: (typeof primaryFamiliesConfig)[0]["columns"][0]) => {
  const raw = col.accessor(primary);
  if (col.format) return col.format(raw, primary);
  if (raw == null) return "N/A";
  return String(raw);
};

const issueLotColumns = [
  { key: "issue_type", label: "Type", format: (v: string) => v || "N/A" },
  { key: "reference", label: "Ref." },
  { key: "auction_date", label: "Auction Date", format: formatDate },
  { key: "settlement_date", label: "Settlement", format: formatDate },
  { key: "maturity_date", label: "Maturity", format: formatDate },
  { key: "amount_allocated", label: "Allocated", format: (v: string | number) => formatAmount(v, { unit: "M", decimals: 0 }), className: "number-col" },
  { key: "amount_bids_received", label: "Bids Received", format: (v: string | number) => formatAmount(v, { unit: "M", decimals: 0 }), className: "number-col" },
  { key: "coverage_rate", label: "Coverage", format: (v: string | number) => formatDecimal(v, 2), className: "number-col" },
  { key: "absorption_rate", label: "Absorption", format: (v: string | number) => formatDecimal(v, 2), className: "number-col" },
  { key: "clearing_yield", label: "Clearing Yield", format: (v: string | number) => formatPercent(v, 3), className: "number-col" },
  { key: "bid_to_cover_ratio", label: "Bid-to-Cover", format: (v: string | number) => formatDecimal(v, 2), className: "number-col" },
  { key: "number_bids_received", label: "N. Bids", className: "number-col" },
];

export default function MTPScreenerPage() {
  const {
    params: queryParams,
    setPage,
    setSearch,
    updateParams,
    resetParams,
  } = useQueryParams<QueryParams>({
    page: 1,
    page_size: 10,
  });

  const {
    allPrimariesData,
    getAllPrimaries,
    isLoadingAllPrimaries,
    allPrimariesError,
  } = usePrimaryRepository();

  const [activeView, setActiveView] = useState<PrimaryMetricFamily>("overview");
  const [showInsights, setShowInsights] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeFilters, setActiveFilters] = useState<PrimaryActiveFilter[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
  });

  const buildParams = useMemo<QueryParams>(() => {
    const params: QueryParams = {
      page: queryParams.page || 1,
      page_size: queryParams.page_size || 10,
    };

    if (filters.search) params.search = filters.search;

    if (sortBy) params.ordering = sortOrder === "desc" ? `-${sortBy}` : sortBy;

    activeFilters.forEach((filter) => {
      const suffix = operatorToSuffix(filter.operator);
      const value =
        filter.criterion.type === "percentage" && typeof filter.value === "number"
          ? filter.value / 100
          : filter.value;
      (params as any)[`${filter.criterion.backendField}${suffix}`] = value;
    });

    return params;
  }, [queryParams, filters, sortBy, sortOrder, activeFilters]);

  useEffect(() => {
    getAllPrimaries(buildParams);
  }, [buildParams, getAllPrimaries]);

  const primaries = useMemo(() => allPrimariesData?.data || [], [allPrimariesData]);

  const filteredPrimaries = useMemo(() => {
    return primaries.filter((primary) => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const issuer = getIssuerName(primary).toLowerCase();
        const matches =
          primary.isin?.toLowerCase().includes(searchLower) ||
          issuer.includes(searchLower) ||
          primary.reference?.toLowerCase().includes(searchLower) ||
          primary.type_name?.toLowerCase().includes(searchLower) ||
          primary.type?.toLowerCase().includes(searchLower);
        if (!matches) return false;
      }

      return true;
    });
  }, [primaries, filters]);

  const activeFamily = useMemo(
    () => primaryFamiliesConfig.find((f) => f.id === activeView) || primaryFamiliesConfig[0],
    [activeView]
  );

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSort = (columnSortKey?: string) => {
    if (!columnSortKey) return;
    if (sortBy === columnSortKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(columnSortKey);
      setSortOrder("desc");
    }
  };

  const handleAddFilter = (criterion: PrimaryFilterCriterion, operator: string, value: string | number) => {
    const newFilter: PrimaryActiveFilter = {
      id: `filter_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      criterion,
      operator: operator as PrimaryActiveFilter["operator"],
      value,
    };
    setActiveFilters((prev) => [...prev, newFilter]);
    setIsFilterPanelOpen(false);
  };

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
    setFilters({
      search: "",
    });
    setSortBy(null);
    setSortOrder("desc");
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
    });
  };

  const insights = useMemo(() => {
    const results: { type: "positive" | "info" | "warning" | "neutral"; text: string }[] = [];
    const count = filteredPrimaries.length;
    if (count > 0) {
      results.push({ type: "info", text: `${count} primary security${count > 1 ? "ies" : "y"} match your filters` });
    }

    const avgCoupon =
      filteredPrimaries.reduce((sum, p) => sum + (parseNumeric(p.coupon_rate) || 0), 0) /
      (filteredPrimaries.length || 1);
    if (avgCoupon > 0.05) {
      results.push({ type: "positive", text: `Average coupon of ${(avgCoupon * 100).toFixed(2)}%` });
    }

    const activeCount = filteredPrimaries.filter((p) => p.status === "ACTIVE").length;
    if (activeCount > 0) {
      results.push({ type: "info", text: `${activeCount} active security${activeCount > 1 ? "ies" : "y"}` });
    }

    if (results.length === 0) {
      results.push({ type: "neutral", text: "No particular insights for this selection" });
    }
    return results;
  }, [filteredPrimaries]);

  return (
    <div className="mtp-screener-page">
      <div className="fixed-income-screener-header">
        <div
          className="fixed-income-screener-header__hero"
          style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))` }}
        >
          <div className="header-top">
            <div className="header-title">
              <h1>MTP Primary Market Screener</h1>
              <p>Search, filter and analyze public securities market bonds</p>
            </div>
            <div className="header-actions">
              <button className="btn-secondary" onClick={handleResetFilters}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
                Reset
              </button>
              <button className="btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                Save
              </button>
              <button className="btn-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
      </div>

      <div className="screener-main">
        <div className="screener-controls">
          <div className="search-section">
            <div className="search-bar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search by ISIN, issuer, reference or type..."
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div className="main-filters">
              <PrimaryFilterBar
                activeFilters={activeFilters}
                onAddFilter={() => setIsFilterPanelOpen(true)}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
              />
              <PrimaryFilterPanel
                isOpen={isFilterPanelOpen}
                onClose={() => setIsFilterPanelOpen(false)}
                onApply={handleAddFilter}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="tabs-and-export">
        <div className="view-tabs">
          {primaryFamiliesConfig.map((family) => (
            <button
              key={family.id}
              className={activeView === family.id ? "active" : ""}
              onClick={() => setActiveView(family.id)}
            >
              {family.icon}
              {family.label}
            </button>
          ))}
        </div>
        <div className="table-info-bar">
          <span className="results-count">{filteredPrimaries.length} bonds found</span>
          <button className="btn-secondary btn-export">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
        </div>
      </div>

      <div className="data-section">
        <div className="data-table-wrapper">
          {isLoadingAllPrimaries ? (
            <div className="summary-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <h3>Loading primary securities...</h3>
            </div>
          ) : allPrimariesError ? (
            <div className="summary-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <h3>Failed to load data</h3>
              <p>Please try again later.</p>
            </div>
          ) : (
            <table className="data-table primary-screener-table">
              <thead>
                <tr>
                  <th className="expand-col"></th>
                  {activeFamily.columns.map((col) => (
                    <th
                      key={col.key}
                      className={`${col.className || ""} ${col.sortKey ? "sortable-header" : ""} ${sortBy === col.sortKey ? "sorted" : ""}`}
                      onClick={() => handleSort(col.sortKey)}
                    >
                      <span className="header-content">
                        {col.label}
                        {sortBy === col.sortKey && (
                          <span className="sort-arrow">{sortOrder === "asc" ? "▲" : "▼"}</span>
                        )}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPrimaries.map((primary) => {
                  const isExpanded = expandedRows.has(primary.id || "");
                  const country = getIssuerCountry(primary);
                  return (
                    <>
                      <tr key={primary.id}>
                        <td className="expand-col">
                          <button className="btn-expand" onClick={() => toggleRow(primary.id || "")}>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
                            >
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </td>
                        {activeFamily.columns.map((col) => {
                          const value = getCellValue(primary, col);
                          const isBadge = col.className?.includes("badge-cell");
                          return (
                            <td key={col.key} className={col.className}>
                              {col.key === "isin" ? (
                                <Link
                                  href={`/fixed-income/bond-detail/${primary.id}`}
                                  className="isin-link"
                                >
                                  {value}
                                </Link>
                              ) : col.key === "issuer" ? (
                                <span className="country-cell">
                                  <span className="country-flag">{getCountryFlag(country)}</span>
                                  {value}
                                </span>
                              ) : isBadge ? (
                                <span className={`badge badge-${col.key}`}>{value}</span>
                              ) : (
                                value
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {isExpanded && (
                        <tr key={`${primary.id}-expanded`} className="expanded-row">
                          <td colSpan={activeFamily.columns.length + 2} className="expanded-cell">
                            <div className="expanded-content">
                              <div className="expanded-section">
                                {primary.issue_lots && primary.issue_lots.length > 0 ? (
                                  <div className="expanded-table-wrapper">
                                    <table className="expanded-table">
                                      <thead>
                                        <tr>
                                          {issueLotColumns.map((c) => (
                                            <th key={c.key} className={c.className}>
                                              {c.key === "issue_type"
                                                ? `Type (${primary.issue_lots?.length || 0})`
                                                : c.label}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {primary.issue_lots.map((lot) => (
                                          <tr key={lot.id}>
                                            {issueLotColumns.map((c) => {
                                              const raw = (lot as any)[c.key];
                                              const display = c.format ? c.format(raw) : raw == null ? "N/A" : String(raw);
                                              return (
                                                <td key={c.key} className={c.className}>
                                                  {display}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="expanded-empty">No issue lots available.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <button className={`floating-insights-btn ${showInsights ? "open" : ""}`} onClick={() => setShowInsights(!showInsights)} title="Automatic insights">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {insights.length > 0 && <span className="insights-badge">{insights.length}</span>}
      </button>

      {showInsights && (
        <div className="floating-insights-panel">
          <div className="floating-insights-panel__header">
            <h4>Automatic Insights</h4>
            <button onClick={() => setShowInsights(false)} className="close-btn">
              ✕
            </button>
          </div>
          <div className="floating-insights-panel__body">
            {insights.map((insight, index) => (
              <div key={index} className={`floating-insight floating-insight--${insight.type}`} style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="floating-insight__icon">
                  {insight.type === "positive" && "✓"}
                  {insight.type === "info" && "i"}
                  {insight.type === "warning" && "⚠"}
                  {insight.type === "neutral" && "•"}
                </div>
                <div className="floating-insight__text">{insight.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
