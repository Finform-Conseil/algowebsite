"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import MultiSelect from "@/components/corporate-events/MultiSelect";
import BarChart from "@/components/charts/BarChart";
import PieChart from "@/components/charts/PieChart";

type ViewType = "overview" | "bond-info" | "transactions" | "summary";

type SecondaryFinancialBond = {
  id: string;
  isin: string;
  country: string;
  bondType: string;
  bondCategory: string;
  yield: number;
  previousYield: number;
  variation: number;
  price: number;
  previousPrice: number;
  tradedVolume: number;
  tradedValue: number;
  exchangeRatio: number;
  transactionCount: number;
  maxPrice: number;
  minPrice: number;
  spread: number;
  maxYield: number;
  minYield: number;
  issuedAmount: number;
  mobilizedAmount: number;
  outstanding: number;
  initialDuration: number;
  residualDuration: number;
  coupon: number;
  periodicity: string;
  accruedCoupon: number;
  issueDate: string;
  valueDate: string;
  maturityDate: string;
  redemptionType: "In fine" | "AC" | "ACD";
  nominal: number;
  esv: string;
  esvDate: string;
  transactionDate: string;
  market: string;
  compartment: string;
};

type FilterState = {
  search: string;
  countries: string[];
  markets: string[];
  compartments: string[];
  bondTypes: string[];
  yieldRange: [number, number];
  priceRange: [number, number];
  durationRange: [number, number];
};

const getCountryFlag = (country: string): string => {
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
    "South Africa": "🇿🇦",
  };
  return flags[country] || "🏳️";
};

export default function FinancialSecondaryScreenerPage() {
  const [activeView, setActiveView] = useState<ViewType>("overview");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [selectedBonds, setSelectedBonds] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
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
    countries: [],
    markets: [],
    compartments: [],
    bondTypes: [],
    yieldRange: [0, 20],
    priceRange: [0, 150],
    durationRange: [0, 30],
  });

  const mockBonds: SecondaryFinancialBond[] = [
    {
      id: "1",
      isin: "CIBRVM101",
      country: "Côte d'Ivoire",
      bondType: "Corporate Bond",
      bondCategory: "Emprunt obligataire de la Côte d'Ivoire",
      yield: 7.8,
      previousYield: 7.5,
      variation: 0.3,
      price: 99.5,
      previousPrice: 98.8,
      tradedVolume: 15000000,
      tradedValue: 14925000000,
      exchangeRatio: 0.85,
      transactionCount: 12,
      maxPrice: 100.2,
      minPrice: 98.5,
      spread: 1.7,
      maxYield: 8.1,
      minYield: 7.6,
      issuedAmount: 50000000000,
      mobilizedAmount: 48000000000,
      outstanding: 45000000000,
      initialDuration: 7,
      residualDuration: 4.2,
      coupon: 6.5,
      periodicity: "Semi-annual",
      accruedCoupon: 2.1,
      issueDate: "2021-01-15",
      valueDate: "2021-01-20",
      maturityDate: "2028-01-15",
      redemptionType: "In fine",
      nominal: 10000,
      esv: "ESV 2025-Q2",
      esvDate: "2025-06-15",
      transactionDate: "2024-12-15",
      market: "BRVM",
      compartment: "Corporate",
    },
    {
      id: "2",
      isin: "SNBRVM102",
      country: "Senegal",
      bondType: "Treasury Bond",
      bondCategory: "Emprunt obligataire du Sénégal",
      yield: 6.2,
      previousYield: 6.4,
      variation: -0.2,
      price: 101.2,
      previousPrice: 100.8,
      tradedVolume: 25000000,
      tradedValue: 25300000000,
      exchangeRatio: 0.92,
      transactionCount: 18,
      maxPrice: 102.0,
      minPrice: 100.5,
      spread: 1.5,
      maxYield: 6.5,
      minYield: 6.0,
      issuedAmount: 75000000000,
      mobilizedAmount: 72000000000,
      outstanding: 70000000000,
      initialDuration: 10,
      residualDuration: 5.5,
      coupon: 5.5,
      periodicity: "Annual",
      accruedCoupon: 3.5,
      issueDate: "2019-06-10",
      valueDate: "2019-06-15",
      maturityDate: "2029-06-10",
      redemptionType: "AC",
      nominal: 10000,
      esv: "ESV 2025-Q1",
      esvDate: "2025-03-20",
      transactionDate: "2024-12-10",
      market: "BRVM",
      compartment: "Government",
    },
    {
      id: "3",
      isin: "BJBRVM103",
      country: "Benin",
      bondType: "Municipal Bond",
      bondCategory: "Emprunt obligataire du Bénin",
      yield: 8.5,
      previousYield: 8.3,
      variation: 0.2,
      price: 97.8,
      previousPrice: 97.5,
      tradedVolume: 8000000,
      tradedValue: 7824000000,
      exchangeRatio: 0.78,
      transactionCount: 8,
      maxPrice: 98.5,
      minPrice: 97.0,
      spread: 1.5,
      maxYield: 8.8,
      minYield: 8.2,
      issuedAmount: 30000000000,
      mobilizedAmount: 28000000000,
      outstanding: 27000000000,
      initialDuration: 5,
      residualDuration: 3.0,
      coupon: 7.0,
      periodicity: "Quarterly",
      accruedCoupon: 1.75,
      issueDate: "2022-03-01",
      valueDate: "2022-03-05",
      maturityDate: "2027-03-01",
      redemptionType: "ACD",
      nominal: 10000,
      esv: "ESV 2025-Q3",
      esvDate: "2025-09-10",
      transactionDate: "2024-12-12",
      market: "BRVM",
      compartment: "Municipal",
    },
  ];

  const filteredBonds = useMemo(() => {
    return mockBonds.filter((bond) => {
      if (
        filters.search &&
        !bond.isin.toLowerCase().includes(filters.search.toLowerCase()) &&
        !bond.country.toLowerCase().includes(filters.search.toLowerCase())
      ) {
        return false;
      }
      if (
        filters.countries.length > 0 &&
        !filters.countries.includes(bond.country)
      ) {
        return false;
      }
      if (
        filters.markets.length > 0 &&
        !filters.markets.includes(bond.market)
      ) {
        return false;
      }
      if (
        filters.compartments.length > 0 &&
        !filters.compartments.includes(bond.compartment)
      ) {
        return false;
      }
      if (
        filters.bondTypes.length > 0 &&
        !filters.bondTypes.includes(bond.bondType)
      ) {
        return false;
      }
      if (
        bond.yield < filters.yieldRange[0] ||
        bond.yield > filters.yieldRange[1]
      ) {
        return false;
      }
      if (
        bond.price < filters.priceRange[0] ||
        bond.price > filters.priceRange[1]
      ) {
        return false;
      }
      if (
        bond.residualDuration < filters.durationRange[0] ||
        bond.residualDuration > filters.durationRange[1]
      ) {
        return false;
      }
      return true;
    });
  }, [mockBonds, filters]);

  const insights = useMemo(() => {
    if (filteredBonds.length === 0) return [];

    const avgYield =
      filteredBonds.reduce((sum, b) => sum + b.yield, 0) / filteredBonds.length;
    const avgExchangeRatio =
      filteredBonds.reduce((sum, b) => sum + b.exchangeRatio, 0) /
      filteredBonds.length;
    const totalTradedValue = filteredBonds.reduce(
      (sum, b) => sum + b.tradedValue,
      0,
    );

    return [
      {
        type: "info",
        message: `${filteredBonds.length} financial bonds available on secondary market`,
      },
      {
        type: avgYield > 7.0 ? "positive" : "neutral",
        message: `Average yield: ${avgYield.toFixed(2)}%`,
      },
      {
        type: "positive",
        message: `Total traded value: ${(totalTradedValue / 1000000000).toFixed(1)}B XOF`,
      },
      {
        type: avgExchangeRatio > 0.8 ? "positive" : "neutral",
        message: `Average exchange ratio: ${(avgExchangeRatio * 100).toFixed(1)}%`,
      },
    ];
  }, [filteredBonds]);

  const handleToggleBondSelection = (bondId: string) => {
    setSelectedBonds((prev) =>
      prev.includes(bondId)
        ? prev.filter((id) => id !== bondId)
        : [...prev, bondId],
    );
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      countries: [],
      markets: [],
      compartments: [],
      bondTypes: [],
      yieldRange: [0, 20],
      priceRange: [0, 150],
      durationRange: [0, 30],
    });
  };

  const countryOptions = Array.from(new Set(mockBonds.map((b) => b.country)));
  const marketOptions = Array.from(new Set(mockBonds.map((b) => b.market)));
  const compartmentOptions = Array.from(
    new Set(mockBonds.map((b) => b.compartment)),
  );
  const bondTypeOptions = Array.from(new Set(mockBonds.map((b) => b.bondType)));

  const shortLabelMap: Record<string, string> = {
    "New GOG Notes and Bonds of Ghana": "New GOG",
    "Old GOG Notes and Bonds of Ghana": "Old GOG",
    "Emprunt obligataire de la Côte d'Ivoire": "EO Côte",
    "Emprunt obligataire du Togo": "EO Togo",
    "Emprunt obligataire du Mali": "EO Mali",
    "Emprunt obligataire du Niger": "EO Niger",
    "Emprunt obligataire du Bénin": "EO Bénin",
    "Emprunt obligataire du Sénégal": "EO Sénégal",
    "Emprunt obligataire du Burkina": "EO Burkina",
    "Treasury Bills of Ghana": "TB Ghana",
    "South Africa fixed-rate Government bond": "SAFGB",
    "Sell buy back trades-GOG Bonds of Ghana": "SBT-GOG",
    "Government of Kenya Fixed rate treasury Bonds": "GOK-FRTB",
    "FGN Bond": "FGN Bond",
  };

  const toShortLabel = (category: string) => {
    const mapped = shortLabelMap[category];
    if (mapped) return mapped; // <= déjà max 2 mots

    // fallback générique si pas mappé : prend 2 mots max
    return category
      .replace(/['’]/g, "") // enlève apostrophes
      .split(/\s+/)
      .slice(0, 2)
      .join(" ");
  };

  const categoriesRaw = (
    selectedCategories.length === 0 || selectedCategories.includes("All")
      ? Array.from(new Set(filteredBonds.map((b) => b.bondCategory)))
      : selectedCategories.filter((cat) => cat !== "All")
  ).slice(0, 10);

  return (
    <div className="mtp-screener-page">
      <div className="fixed-income-screener-header">
        <div
          className="fixed-income-screener-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
          }}
        >
          <div className="header-top">
            <div className="header-title">
              <h1>Financial Secondary Market Screener</h1>
              <p>Explore and analyze financial bonds on the secondary market</p>
            </div>

            <div className="header-actions">
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
      </div>

      <div className="screener-main">
        <div className="screener-controls">
          <div className="search-section">
            <div className="search-bar">
              <svg
                width="18"
                height="18"
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
                placeholder="Search by ISIN or Country..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
            <div className="main-filters">
              <div className="multi-selects">
                <MultiSelect
                  label="Country/Zone"
                  options={countryOptions}
                  selected={filters.countries}
                  onChange={(selected) =>
                    setFilters({ ...filters, countries: selected })
                  }
                  placeholder="All countries"
                />
                <MultiSelect
                  label="Market"
                  options={marketOptions}
                  selected={filters.markets}
                  onChange={(selected) =>
                    setFilters({ ...filters, markets: selected })
                  }
                  placeholder="All markets"
                />
                <MultiSelect
                  label="Compartment"
                  options={compartmentOptions}
                  selected={filters.compartments}
                  onChange={(selected) =>
                    setFilters({ ...filters, compartments: selected })
                  }
                  placeholder="All compartments"
                />
                <MultiSelect
                  label="Bond Type"
                  options={bondTypeOptions}
                  selected={filters.bondTypes}
                  onChange={(selected) =>
                    setFilters({ ...filters, bondTypes: selected })
                  }
                  placeholder="All types"
                />
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
                Advanced Filters
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{
                    transform: showAdvancedFilters
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
          </div>

          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="filter-group">
                <label>Yield Range (%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    value={filters.yieldRange[0]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yieldRange: [
                          Number(e.target.value),
                          filters.yieldRange[1],
                        ],
                      })
                    }
                    placeholder="Min"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={filters.yieldRange[1]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        yieldRange: [
                          filters.yieldRange[0],
                          Number(e.target.value),
                        ],
                      })
                    }
                    placeholder="Max"
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>Price Range (%)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceRange: [
                          Number(e.target.value),
                          filters.priceRange[1],
                        ],
                      })
                    }
                    placeholder="Min"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        priceRange: [
                          filters.priceRange[0],
                          Number(e.target.value),
                        ],
                      })
                    }
                    placeholder="Max"
                  />
                </div>
              </div>
              <div className="filter-group">
                <label>Duration Range (Years)</label>
                <div className="range-inputs">
                  <input
                    type="number"
                    value={filters.durationRange[0]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        durationRange: [
                          Number(e.target.value),
                          filters.durationRange[1],
                        ],
                      })
                    }
                    placeholder="Min"
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={filters.durationRange[1]}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        durationRange: [
                          filters.durationRange[0],
                          Number(e.target.value),
                        ],
                      })
                    }
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tabs-and-export">
        <div className="view-tabs">
          <button
            className={activeView === "overview" ? "active" : ""}
            onClick={() => setActiveView("overview")}
          >
            Overview
          </button>
          <button
            className={activeView === "bond-info" ? "active" : ""}
            onClick={() => setActiveView("bond-info")}
          >
            Bond Info
          </button>
          <button
            className={activeView === "transactions" ? "active" : ""}
            onClick={() => setActiveView("transactions")}
          >
            Transactions
          </button>
          <button
            className={activeView === "summary" ? "active" : ""}
            onClick={() => setActiveView("summary")}
          >
            Summary
          </button>
        </div>
        <div className="table-info-bar">
          <span className="results-count">
            {filteredBonds.length} bonds found
          </span>
          {selectedBonds.length > 0 && (
            <span className="selected-count">
              {selectedBonds.length} selected
            </span>
          )}
          <button className="btn-secondary btn-export">
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
        </div>
      </div>

      <div className="data-section">
        {activeView === "overview" && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input type="checkbox" />
                  </th>
                  <th>ISIN</th>
                  <th>Country</th>
                  <th>Bond Type</th>
                  <th className="number-col">Yield (%)</th>
                  <th className="number-col">Previous Yield (%)</th>
                  <th className="number-col">Variation</th>
                  <th className="number-col">Price (%)</th>
                  <th className="number-col">Previous Price (%)</th>
                  <th className="number-col">Traded Volume</th>
                  <th className="number-col">Traded Value</th>
                  <th className="number-col">Exchange Ratio</th>
                  <th className="number-col">Transactions</th>
                  <th className="number-col">Max Price</th>
                  <th className="number-col">Min Price</th>
                  <th className="number-col">Spread</th>
                  <th className="number-col">Max Yield</th>
                  <th className="number-col">Min Yield</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.map((bond) => (
                  <tr
                    key={bond.id}
                    className={
                      selectedBonds.includes(bond.id) ? "selected" : ""
                    }
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedBonds.includes(bond.id)}
                        onChange={() => handleToggleBondSelection(bond.id)}
                      />
                    </td>
                    <td className="isin-col">
                      <Link
                        href={`/fixed-income/bond-detail/financial-secondary/${bond.isin}`}
                        className="isin-link"
                      >
                        {bond.isin}
                      </Link>
                    </td>
                    <td>
                      <span className="country-cell">
                        <span className="country-flag">
                          {getCountryFlag(bond.country)}
                        </span>
                        {bond.country}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-bond-type">
                        {bond.bondType}
                      </span>
                    </td>
                    <td className="number-col">{bond.yield.toFixed(2)}</td>
                    <td className="number-col">
                      {bond.previousYield.toFixed(2)}
                    </td>
                    <td
                      className={`number-col ${bond.variation >= 0 ? "positive" : "negative"}`}
                    >
                      {bond.variation >= 0 ? "+" : ""}
                      {bond.variation.toFixed(2)}
                    </td>
                    <td className="number-col">{bond.price.toFixed(2)}</td>
                    <td className="number-col">
                      {bond.previousPrice.toFixed(2)}
                    </td>
                    <td className="number-col">
                      {(bond.tradedVolume / 1000000).toFixed(1)}M
                    </td>
                    <td className="number-col">
                      {(bond.tradedValue / 1000000000).toFixed(2)}B
                    </td>
                    <td className="number-col">
                      {(bond.exchangeRatio * 100).toFixed(1)}%
                    </td>
                    <td className="number-col">{bond.transactionCount}</td>
                    <td className="number-col">{bond.maxPrice.toFixed(2)}</td>
                    <td className="number-col">{bond.minPrice.toFixed(2)}</td>
                    <td className="number-col">{bond.spread.toFixed(2)}</td>
                    <td className="number-col">{bond.maxYield.toFixed(2)}</td>
                    <td className="number-col">{bond.minYield.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === "bond-info" && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input type="checkbox" />
                  </th>
                  <th>ISIN</th>
                  <th>Country</th>
                  <th>Bond Type</th>
                  <th className="number-col">Issued Amount</th>
                  <th className="number-col">Mobilized Amount</th>
                  <th className="number-col">Outstanding</th>
                  <th className="number-col">Initial Duration</th>
                  <th className="number-col">Residual Duration</th>
                  <th className="number-col">Coupon (%)</th>
                  <th>Periodicity</th>
                  <th className="number-col">Accrued Coupon</th>
                  <th>Issue Date</th>
                  <th>Value Date</th>
                  <th>Maturity Date</th>
                  <th>Redemption</th>
                  <th className="number-col">Nominal</th>
                  <th>ESV</th>
                  <th>ESV Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.map((bond) => (
                  <tr
                    key={bond.id}
                    className={
                      selectedBonds.includes(bond.id) ? "selected" : ""
                    }
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedBonds.includes(bond.id)}
                        onChange={() => handleToggleBondSelection(bond.id)}
                      />
                    </td>
                    <td className="isin-col">
                      <Link
                        href={`/fixed-income/bond-detail/financial-secondary/${bond.isin}`}
                        className="isin-link"
                      >
                        {bond.isin}
                      </Link>
                    </td>
                    <td>
                      <span className="country-cell">
                        <span className="country-flag">
                          {getCountryFlag(bond.country)}
                        </span>
                        {bond.country}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-bond-type">
                        {bond.bondType}
                      </span>
                    </td>
                    <td className="number-col">
                      {(bond.issuedAmount / 1000000).toFixed(0)}M
                    </td>
                    <td className="number-col">
                      {(bond.mobilizedAmount / 1000000).toFixed(0)}M
                    </td>
                    <td className="number-col">
                      {(bond.outstanding / 1000000).toFixed(0)}M
                    </td>
                    <td className="number-col">
                      {bond.initialDuration.toFixed(1)}Y
                    </td>
                    <td className="number-col">
                      {bond.residualDuration.toFixed(1)}Y
                    </td>
                    <td className="number-col">{bond.coupon.toFixed(2)}</td>
                    <td>{bond.periodicity}</td>
                    <td className="number-col">
                      {bond.accruedCoupon.toFixed(2)}
                    </td>
                    <td>
                      {new Date(bond.issueDate).toLocaleDateString("en-US")}
                    </td>
                    <td>
                      {new Date(bond.valueDate).toLocaleDateString("en-US")}
                    </td>
                    <td>
                      {new Date(bond.maturityDate).toLocaleDateString("en-US")}
                    </td>
                    <td>
                      <span className="badge badge-redemption">
                        {bond.redemptionType}
                      </span>
                    </td>
                    <td className="number-col">
                      {bond.nominal.toLocaleString()}
                    </td>
                    <td>
                      <span className="badge badge-ost">{bond.esv}</span>
                    </td>
                    <td>
                      {new Date(bond.esvDate).toLocaleDateString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === "transactions" && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input type="checkbox" />
                  </th>
                  <th>ISIN</th>
                  <th>Country</th>
                  <th>Bond Type</th>
                  <th>Date</th>
                  <th className="number-col">Yield (%)</th>
                  <th className="number-col">Previous Yield (%)</th>
                  <th className="number-col">Traded Volume</th>
                  <th className="number-col">Traded Value</th>
                  <th className="number-col">Transactions</th>
                  <th className="number-col">Max Price</th>
                  <th className="number-col">Min Price</th>
                  <th className="number-col">Max Yield</th>
                  <th className="number-col">Min Yield</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonds.map((bond) => (
                  <tr
                    key={bond.id}
                    className={
                      selectedBonds.includes(bond.id) ? "selected" : ""
                    }
                  >
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedBonds.includes(bond.id)}
                        onChange={() => handleToggleBondSelection(bond.id)}
                      />
                    </td>
                    <td className="isin-col">
                      <Link
                        href={`/fixed-income/bond-detail/financial-secondary/${bond.isin}`}
                        className="isin-link"
                      >
                        {bond.isin}
                      </Link>
                    </td>
                    <td>
                      <span className="country-cell">
                        <span className="country-flag">
                          {getCountryFlag(bond.country)}
                        </span>
                        {bond.country}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-bond-type">
                        {bond.bondType}
                      </span>
                    </td>
                    <td>
                      {new Date(bond.transactionDate).toLocaleDateString(
                        "en-US",
                      )}
                    </td>
                    <td className="number-col">{bond.yield.toFixed(2)}</td>
                    <td className="number-col">
                      {bond.previousYield.toFixed(2)}
                    </td>
                    <td className="number-col">
                      {(bond.tradedVolume / 1000000).toFixed(1)}M
                    </td>
                    <td className="number-col">
                      {(bond.tradedValue / 1000000000).toFixed(2)}B
                    </td>
                    <td className="number-col">{bond.transactionCount}</td>
                    <td className="number-col">{bond.maxPrice.toFixed(2)}</td>
                    <td className="number-col">{bond.minPrice.toFixed(2)}</td>
                    <td className="number-col">{bond.maxYield.toFixed(2)}</td>
                    <td className="number-col">{bond.minYield.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeView === "summary" && (
          <div className="summary-view">
            <div className="summary-stats-grid">
              <div className="stat-card">
                <div className="stat-header">
                  <h3>Traded Volume</h3>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                </div>
                <div className="stat-value">
                  {(
                    filteredBonds.reduce((sum, b) => sum + b.tradedVolume, 0) /
                    1000000
                  ).toFixed(1)}
                  M
                </div>
                <div className="stat-label">Total Volume</div>
                <div className="stat-change positive">
                  +12.5% vs previous period
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Traded Bonds</h3>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <div className="stat-value">{filteredBonds.length}</div>
                <div className="stat-label">Number of Bonds</div>
                <div className="stat-change neutral">No change</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Bonds Up</h3>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <div className="stat-value positive">
                  {filteredBonds.filter((b) => b.variation > 0).length}
                </div>
                <div className="stat-label">Positive Variation</div>
                <div className="stat-change positive">
                  +
                  {(
                    (filteredBonds.filter((b) => b.variation > 0).length /
                      filteredBonds.length) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Bonds Down</h3>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                    <polyline points="17 18 23 18 23 12" />
                  </svg>
                </div>
                <div className="stat-value negative">
                  {filteredBonds.filter((b) => b.variation < 0).length}
                </div>
                <div className="stat-label">Negative Variation</div>
                <div className="stat-change negative">
                  -
                  {(
                    (filteredBonds.filter((b) => b.variation < 0).length /
                      filteredBonds.length) *
                    100
                  ).toFixed(1)}
                  %
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Bonds Unchanged</h3>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                <div className="stat-value">
                  {filteredBonds.filter((b) => b.variation === 0).length}
                </div>
                <div className="stat-label">No Variation</div>
                <div className="stat-change neutral">Stable</div>
              </div>

              <div className="stat-card">
                <div className="stat-header">
                  <h3>Avg Yield</h3>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="20" x2="12" y2="10" />
                    <line x1="18" y1="20" x2="18" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="16" />
                  </svg>
                </div>
                <div className="stat-value">
                  {(
                    filteredBonds.reduce((sum, b) => sum + b.yield, 0) /
                    filteredBonds.length
                  ).toFixed(2)}
                  %
                </div>
                <div className="stat-label">Average Yield</div>
                <div className="stat-change positive">+0.3% vs previous</div>
              </div>
            </div>

            <div className="summary-charts-grid">
              <div className="chart-card">
                <div className="chart-header">
                  <h3>Transaction Volume by Bond Category</h3>
                  <div className="chart-controls">
                    <MultiSelect
                      label=""
                      options={[
                        "All",
                        "FGN Bond",
                        "Treasury Bills of Ghana",
                        "Emprunt obligataire du Togo",
                        "Emprunt obligataire du Mali",
                        "Emprunt obligataire du Niger",
                        "Emprunt obligataire du Bénin",
                        "Emprunt obligataire du Sénégal",
                        "Emprunt obligataire du Burkina",
                        "Old GOG Notes and Bonds of Ghana",
                        "New GOG Notes and Bonds of Ghana",
                        "Emprunt obligataire de la Côte d'Ivoire",
                        "South Africa fixed-rate Government bond",
                        "Sell buy back trades-GOG Bonds of Ghana",
                        "Government of Kenya Fixed rate treasury Bonds",
                      ]}
                      selected={selectedCategories}
                      onChange={setSelectedCategories}
                      placeholder="Select categories"
                    />
                  </div>
                </div>

                <BarChart
                  data={{
                    categories: categoriesRaw.map(toShortLabel),
                    values: categoriesRaw.map((category) => {
                      const bondsInCategory = filteredBonds.filter(
                        (b) => b.bondCategory === category,
                      );
                      return (
                        bondsInCategory.reduce(
                          (sum, b) => sum + b.tradedVolume,
                          0,
                        ) / 1000000
                      );
                    }),
                  }}
                  height="350px"
                  color="#00BFFF"
                />
              </div>

              <div className="chart-card">
                <div className="chart-header">
                  <h3>Bond Category Distribution</h3>
                </div>
                <PieChart
                  data={categoriesRaw.map((category) => ({
                    name: category,
                    value:
                      filteredBonds
                        .filter((b) => b.bondCategory === category)
                        .reduce((sum, b) => sum + b.tradedVolume, 0) / 1000000,
                  }))}
                  height="350px"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        className="floating-insights-btn"
        onClick={() => setShowInsights(!showInsights)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      </button>

      {showInsights && (
        <div className="floating-insights-panel">
          <div className="insights-header">
            <h3>Automatic Insights</h3>
            <button onClick={() => setShowInsights(false)}>
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
          <div className="insights-content">
            {insights.map((insight, index) => (
              <div key={index} className={`insight-item ${insight.type}`}>
                <div className="insight-icon">
                  {insight.type === "positive" && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {insight.type === "info" && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  )}
                  {insight.type === "neutral" && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  )}
                </div>
                <p>{insight.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
