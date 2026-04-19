"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import MultiSelect from "@/components/corporate-events/MultiSelect";

// Types
type Fund = {
  id: string;
  name: string;
  isin: string;
  ticker: string;
  manager: string;
  nature: "SICAV" | "FCP" | "SCPI" | "FIA" | "ETF";
  type: string;
  currency: string;
  domicile: string;
  aum: number;
  nav: number;
  navDate: string;
  managementFee: number;
  entryFee: number;
  exitFee: number;
  ter: number;
  perf1M: number;
  perf3M: number;
  perf6M: number;
  perf1Y: number;
  perf3Y: number;
  perf5Y: number;
  perfYTD: number;
  volatility: number;
  sharpe: number;
  maxDrawdown: number;
  riskRating: number;
  inceptionDate: string;
  market: string;
};

type FilterState = {
  search: string;
  markets: string[];
  natures: string[];
  types: string[];
  currencies: string[];
  aumRange: [number, number];
  perfRange: [number, number];
  feeRange: [number, number];
  riskRatings: number[];
};

type Period = "1M" | "3M" | "6M" | "1Y" | "3Y" | "5Y" | "ALL";

export default function OPCVMScreenerPage() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1Y");
  const [showQuickCompare, setShowQuickCompare] = useState(false);
  const [selectedFunds, setSelectedFunds] = useState<string[]>([]);
  const [detailFundId, setDetailFundId] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    "/images/screener-header-3.jpg",
    "/images/exchanges-header-2.jpg",
    "/images/exchanges-header-1.jpg",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    markets: [],
    natures: [],
    types: [],
    currencies: [],
    aumRange: [0, 10000],
    perfRange: [-100, 100],
    feeRange: [0, 5],
    riskRatings: [],
  });

  // Mock data - To be replaced with real API data
  const mockFunds: Fund[] = useMemo(
    () => [
      {
        id: "1",
        name: "NSIA Ivory Coast Equity",
        isin: "CI0001234567",
        ticker: "NSIA-CI",
        manager: "NSIA Banque",
        nature: "SICAV",
        type: "Equity",
        currency: "XOF",
        domicile: "Ivory Coast",
        aum: 15000000000,
        nav: 12500,
        navDate: "2024-11-30",
        managementFee: 1.5,
        entryFee: 2.0,
        exitFee: 1.0,
        ter: 1.8,
        perf1M: 2.5,
        perf3M: 7.2,
        perf6M: 12.5,
        perf1Y: 18.3,
        perf3Y: 45.2,
        perf5Y: 78.5,
        perfYTD: 15.8,
        volatility: 12.5,
        sharpe: 1.2,
        maxDrawdown: -15.3,
        riskRating: 5,
        inceptionDate: "2015-03-15",
        market: "BRVM",
      },
      {
        id: "2",
        name: "BOA WAEMU Bonds",
        isin: "SN0009876543",
        ticker: "BOA-OBL",
        manager: "BOA Capital",
        nature: "FCP",
        type: "Bonds",
        currency: "XOF",
        domicile: "Senegal",
        aum: 8500000000,
        nav: 10850,
        navDate: "2024-11-30",
        managementFee: 0.8,
        entryFee: 1.0,
        exitFee: 0.5,
        ter: 1.0,
        perf1M: 0.8,
        perf3M: 2.5,
        perf6M: 5.2,
        perf1Y: 8.5,
        perf3Y: 22.8,
        perf5Y: 38.5,
        perfYTD: 7.2,
        volatility: 4.2,
        sharpe: 1.8,
        maxDrawdown: -5.2,
        riskRating: 2,
        inceptionDate: "2018-06-20",
        market: "BRVM",
      },
      // Add more mock funds...
    ],
    [],
  );

  // Fund filtering
  const filteredFunds = useMemo(() => {
    return mockFunds.filter((fund) => {
      // Text search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !fund.name.toLowerCase().includes(searchLower) &&
          !fund.isin.toLowerCase().includes(searchLower) &&
          !fund.ticker.toLowerCase().includes(searchLower) &&
          !fund.manager.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Market filters
      if (
        filters.markets.length > 0 &&
        !filters.markets.includes(fund.market)
      ) {
        return false;
      }

      // Nature filters
      if (
        filters.natures.length > 0 &&
        !filters.natures.includes(fund.nature)
      ) {
        return false;
      }

      // AUM filters
      if (
        fund.aum < filters.aumRange[0] * 1000000 ||
        fund.aum > filters.aumRange[1] * 1000000
      ) {
        return false;
      }

      // Performance filters
      const perf = fund.perf1Y;
      if (perf < filters.perfRange[0] || perf > filters.perfRange[1]) {
        return false;
      }

      // Fee filters
      if (
        fund.managementFee < filters.feeRange[0] ||
        fund.managementFee > filters.feeRange[1]
      ) {
        return false;
      }

      // Risk rating filters
      if (
        filters.riskRatings.length > 0 &&
        !filters.riskRatings.includes(fund.riskRating)
      ) {
        return false;
      }

      return true;
    });
  }, [mockFunds, filters]);

  const handleToggleFundSelection = (fundId: string) => {
    setSelectedFunds((prev) =>
      prev.includes(fundId)
        ? prev.filter((id) => id !== fundId)
        : [...prev, fundId],
    );
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      markets: [],
      natures: [],
      types: [],
      currencies: [],
      aumRange: [0, 10000],
      perfRange: [-100, 100],
      feeRange: [0, 5],
      riskRatings: [],
    });
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
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
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
                <option value="1Y">1 Year</option>
                <option value="3Y">3 Years</option>
                <option value="5Y">5 Years</option>
                <option value="ALL">Since inception</option>
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
              options={["SICAV", "FCP", "SCPI", "FIA", "ETF"].map((n) => ({
                value: n,
                label: n,
              }))}
              selected={filters.natures}
              onChange={(natures) =>
                setFilters((prev) => ({ ...prev, natures }))
              }
              placeholder="All natures"
            />

            <MultiSelect
              label="Type"
              options={[
                "Equity",
                "Bonds",
                "Money Market",
                "Mixed",
                "Real Estate",
              ].map((t) => ({ value: t, label: t }))}
              selected={filters.types}
              onChange={(types) => setFilters((prev) => ({ ...prev, types }))}
              placeholder="All types"
            />

            <div className="filter-group">
              <label>Risk</label>
              <div className="risk-selector">
                {[1, 2, 3, 4, 5, 6, 7].map((rating) => (
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
          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="filter-group range-filter">
                <label>AUM Size (in millions)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.aumRange[0]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        aumRange: [Number(e.target.value), prev.aumRange[1]],
                      }))
                    }
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.aumRange[1]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        aumRange: [prev.aumRange[0], Number(e.target.value)],
                      }))
                    }
                  />
                </div>
              </div>

              <div className="filter-group range-filter">
                <label>1Y Performance (%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.perfRange[0]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        perfRange: [Number(e.target.value), prev.perfRange[1]],
                      }))
                    }
                  />
                  <span>-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.perfRange[1]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        perfRange: [prev.perfRange[0], Number(e.target.value)],
                      }))
                    }
                  />
                </div>
              </div>

              <div className="filter-group range-filter">
                <label>Management Fees (%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Min"
                    value={filters.feeRange[0]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        feeRange: [Number(e.target.value), prev.feeRange[1]],
                      }))
                    }
                  />
                  <span>-</span>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Max"
                    value={filters.feeRange[1]}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        feeRange: [prev.feeRange[0], Number(e.target.value)],
                      }))
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="screener-content">
        {/* Center - Data Table */}
        <div className="data-table-container">
          <div className="table-header">
            <div className="table-info">
              <span className="results-count">
                {filteredFunds.length} funds found
              </span>
              {selectedFunds.length > 0 && (
                <span className="selected-count">
                  {selectedFunds.length} selected
                </span>
              )}
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

          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input type="checkbox" />
                  </th>
                  <th>Fund Name</th>
                  <th>ISIN</th>
                  <th>Manager</th>
                  <th>Nature</th>
                  <th>Type</th>
                  <th>Currency</th>
                  <th className="number-col">AUM (M)</th>
                  <th className="number-col">NAV</th>
                  <th className="number-col">1M Perf</th>
                  <th className="number-col">1Y Perf</th>
                  <th className="number-col">Volatility</th>
                  <th className="number-col">Sharpe</th>
                  <th className="number-col">Fees</th>
                  <th className="number-col">Risk</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFunds.map((fund) => (
                  <tr
                    key={fund.id}
                    className={
                      selectedFunds.includes(fund.id) ? "selected" : ""
                    }
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedFunds.includes(fund.id)}
                        onChange={() => handleToggleFundSelection(fund.id)}
                      />
                    </td>
                    <td className="fund-name-col">
                      <button
                        className="fund-name-btn"
                        onClick={() => setDetailFundId(fund.id)}
                      >
                        {fund.name}
                      </button>
                      <span className="fund-market">{fund.market}</span>
                    </td>
                    <td className="isin-col">{fund.isin}</td>
                    <td>{fund.manager}</td>
                    <td>
                      <span
                        className={`badge badge-${fund.nature.toLowerCase()}`}
                      >
                        {fund.nature}
                      </span>
                    </td>
                    <td>{fund.type}</td>
                    <td>{fund.currency}</td>
                    <td className="number-col">
                      {(fund.aum / 1000000).toFixed(0)}M
                    </td>
                    <td className="number-col">{fund.nav.toLocaleString()}</td>
                    <td
                      className={`number-col ${fund.perf1M >= 0 ? "positive" : "negative"}`}
                    >
                      {fund.perf1M >= 0 ? "+" : ""}
                      {fund.perf1M.toFixed(2)}%
                    </td>
                    <td
                      className={`number-col ${fund.perf1Y >= 0 ? "positive" : "negative"}`}
                    >
                      {fund.perf1Y >= 0 ? "+" : ""}
                      {fund.perf1Y.toFixed(2)}%
                    </td>
                    <td className="number-col">
                      {fund.volatility.toFixed(2)}%
                    </td>
                    <td className="number-col">{fund.sharpe.toFixed(2)}</td>
                    <td className="number-col">
                      {fund.managementFee.toFixed(2)}%
                    </td>
                    <td className="number-col">
                      <span className={`risk-badge risk-${fund.riskRating}`}>
                        {fund.riskRating}
                      </span>
                    </td>
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
                      <h4>{fund.name}</h4>
                      <span
                        className={`badge badge-${fund.nature.toLowerCase()}`}
                      >
                        {fund.nature}
                      </span>
                    </div>
                    <div className="detail-metrics">
                      <div className="metric-item">
                        <span className="metric-label">Current NAV</span>
                        <span className="metric-value">
                          {fund.nav.toLocaleString()} {fund.currency}
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">1Y Performance</span>
                        <span
                          className={`metric-value ${fund.perf1Y >= 0 ? "positive" : "negative"}`}
                        >
                          {fund.perf1Y >= 0 ? "+" : ""}
                          {fund.perf1Y.toFixed(2)}%
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Volatility</span>
                        <span className="metric-value">
                          {fund.volatility.toFixed(2)}%
                        </span>
                      </div>
                      <div className="metric-item">
                        <span className="metric-label">Sharpe Ratio</span>
                        <span className="metric-value">
                          {fund.sharpe.toFixed(2)}
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
                  <span className="fund-name">{fund.name}</span>
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
              <p>Detailed comparison feature coming soon...</p>
              <div className="compare-table">
                <table>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return <th key={fundId}>{fund?.name}</th>;
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1Y Performance</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return (
                          <td
                            key={fundId}
                            className={
                              fund && fund.perf1Y >= 0 ? "positive" : "negative"
                            }
                          >
                            {fund &&
                              `${fund.perf1Y >= 0 ? "+" : ""}${fund.perf1Y.toFixed(2)}%`}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td>Volatility</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return (
                          <td key={fundId}>
                            {fund && `${fund.volatility.toFixed(2)}%`}
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td>Sharpe Ratio</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return (
                          <td key={fundId}>{fund && fund.sharpe.toFixed(2)}</td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td>Management Fees</td>
                      {selectedFunds.map((fundId) => {
                        const fund = filteredFunds.find((f) => f.id === fundId);
                        return (
                          <td key={fundId}>
                            {fund && `${fund.managementFee.toFixed(2)}%`}
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
