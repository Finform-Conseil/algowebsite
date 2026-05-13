'use client';

import { useState, useMemo, useEffect } from 'react';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { ActionQueryParams } from '@/core/domain/types/action.type';
import { useActionRepository } from '@/core/infra/repositories/action.repository.impl';

interface StockSelectorProps {
  selectedStocks: ActionEntity[];
  onAddStock: (stock: ActionEntity) => void;
  onRemoveStock: (stockId: string) => void;
  maxStocks: number;
}

type StockFilterState = {
  search: string;
  bourses: string[];
  sectors: string[];
  capitalization: string;
};

export default function StockSelector({
  selectedStocks,
  onAddStock,
  onRemoveStock,
  maxStocks
}: StockSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState<StockFilterState>({
    search: "",
    bourses: [],
    sectors: [],
    capitalization: "All",
  });

  const getStocksParams = (): ActionQueryParams => {
    const params: ActionQueryParams = { view_type: "screener", page: 1, page_size: 100 };
    
    if (filters.search) params.search = filters.search;
    if (filters.bourses.length > 0) params.bourses = filters.bourses.join(',');
    if (filters.sectors.length > 0) params.sectors = filters.sectors.join(',');
    
    // Capitalisation: filtrer par market_cap
    if (filters.capitalization !== 'All') {
      if (filters.capitalization === 'Small Cap (<1B)') {
        params.market_cap_max = 1000000000; // < 1 milliard
      } else if (filters.capitalization === 'Mid Cap (1-10B)') {
        params.market_cap_min = 1000000000;  // >= 1 milliard
        params.market_cap_max = 10000000000; // < 10 milliards
      } else if (filters.capitalization === 'Large Cap (>10B)') {
        params.market_cap_min = 10000000000; // >= 10 milliards
      }
    }
    
    return params;
  };
  
  const { allActionsData, getAllActions } = useActionRepository();
  
  useEffect(() => {
    getAllActions(getStocksParams());
  }, [filters]);

  // Extract unique sectors from API data
  const sectors = useMemo(() => 
    Array.from(new Set(allActionsData?.data.map((s) => s.society?.industry?.name).filter(Boolean) || [])).sort(),
    [allActionsData]
  );
  
  // Fixed list of African exchanges
  const capSizes = ['All', 'Small Cap (<1B)', 'Mid Cap (1-10B)', 'Large Cap (>10B)'];

  // Les stocks filtrés viennent directement de l'API
  const filteredStocks = useMemo(() => {
    if (!allActionsData?.data) {
      console.log('[filteredStocks] No data, returning empty array');
      return [];
    }
    
    let filtered = allActionsData.data.filter(
      (stock) => !selectedStocks.find((s) => s.id === stock.id)
    );
    
    // Filtrage par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter((stock) => 
        stock.ticker?.toLowerCase().includes(searchLower) ||
        stock.society?.name?.toLowerCase().includes(searchLower) ||
        stock.bourse?.ticker?.toLowerCase().includes(searchLower) ||
        stock.society?.industry?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [allActionsData, selectedStocks, filters.search]);

  // Générer des suggestions intelligentes
  const suggestions = useMemo(() => {
    if (selectedStocks.length === 0 || !allActionsData?.data) return { peers: [], market: [] };
    
    const firstStock = selectedStocks[0];
    
    const sameSector = allActionsData.data.filter(
      (s) => s.society?.industry?.id === firstStock.society?.industry?.id && !selectedStocks.find((sel) => sel.id === s.id)
    );
    
    const sameMarket = allActionsData.data.filter(
      (s) => s.bourse?.ticker === firstStock.bourse?.ticker && !selectedStocks.find((sel) => sel.id === s.id)
    );
    
    return {
      peers: sameSector.slice(0, 3),
      market: sameMarket.slice(0, 3),
    };
  }, [selectedStocks, allActionsData]);

  const handleSelectStock = (stock: ActionEntity) => {
    if (selectedStocks.length < maxStocks) {
      onAddStock(stock);
      setFilters({ ...filters, search: '' });
      setShowDropdown(false);
    }
  };

  return (
    <div className={`stock-selector ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="stock-selector__header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2>Selection of stocks</h2>
        <div className="stock-selector__header-right">
          <span className="stock-selector__count">
            {selectedStocks.length} / {maxStocks}
          </span>
          <button 
            className="collapse-toggle" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setIsCollapsed(!isCollapsed); 
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points={isCollapsed ? '6 9 12 15 18 9' : '18 15 12 9 6 15'} />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="fund-selector-div">
        <select 
          className="fund-comparison-select"
          value={filters.bourses[0] || ''}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            bourses: e.target.value ? [e.target.value] : []
          }))}
        >
          <option value="">All Exchanges</option>
          <option value="BRVM">BRVM</option>
          <option value="CSE">CSE</option>
          <option value="GSE">GSE</option>
          <option value="JSE">JSE</option>
          <option value="NGX">NGX</option>
          <option value="NSE">NSE</option>
        </select>
        <select 
          className="fund-comparison-select"
          value={filters.sectors[0] || ''}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            sectors: e.target.value ? [e.target.value] : []
          }))}
        >
          <option value="">All Sectors</option>
          {sectors.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
        <select 
          className="fund-comparison-select"
          value={filters.capitalization}
          onChange={(e) => setFilters(prev => ({
            ...prev,
            capitalization: e.target.value
          }))}
        >
          {capSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {!isCollapsed && (
        <>
          {/* Barre de recherche avec tags inline */}
          <div className="stock-selector__search">
            <div className="search-input-wrapper">
              {/* Tags dans l'input */}
              <div className="search-input-with-tags">
                {selectedStocks.map((stock) => (
                  <div key={stock.id} className="stock-tag-inline">
                    <span className="stock-tag-inline__ticker">{stock.ticker}</span>
                    <button
                      className="stock-tag-inline__remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(stock.id);
                      }}
                      title="Retirer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder={selectedStocks.length === 0 ? "Search by ticker, name, market..." : "Add..."}
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  disabled={selectedStocks.length >= maxStocks}
                  className="search-input-flex"
                />
              </div>
            </div>

            {/* Dropdown de résultats */}
            {showDropdown && (
              <div className="search-dropdown">
                {filteredStocks.length > 0 ? (
                  filteredStocks.slice(0, 8).map((stock, index) => (
                    <button
                      key={stock.id || `stock-${stock.ticker}-${index}`}
                      className="search-result-item"
                      onClick={() => handleSelectStock(stock)}
                    >
                      <div className="search-result-item__logo">
                        {stock.ticker?.substring(0, 2)}
                      </div>
                      <div className="search-result-item__info">
                        <div className="search-result-item__name">
                          <span className="ticker">{stock.ticker}</span>
                          <span className="name">{stock.society?.name || '--'}</span>
                        </div>
                        <div className="search-result-item__meta">
                          <span className="market">{stock.bourse?.ticker || '--'}</span>
                          <span className="divider">•</span>
                          <span className="sector">{stock.society?.industry?.name || '--'}</span>
                          <span className="divider">•</span>
                          <span className="country">{typeof stock.society?.country === 'string' ? stock.society.country : stock.society?.country?.name || '--'}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="search-result-item" style={{ justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    {allActionsData?.data ? 'No results found' : 'Loading...'}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Suggestions intelligentes */}
          {selectedStocks.length > 0 && selectedStocks.length < maxStocks && (
            <div className="stock-suggestions">
              <button className="suggestions-toggle" onClick={() => setShowSuggestions(!showSuggestions)}>
                <span>Smart suggestions</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ transform: showSuggestions ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showSuggestions && (
                <div className="suggestions-content">
                  {suggestions.peers.length > 0 && (
                    <div className="suggestion-group">
                      <h5>Same sector</h5>
                      <div className="suggestion-chips">
                        {suggestions.peers.map((stock, index) => (
                          <button
                            key={stock.id || `peer-${stock.ticker}-${index}`}
                            className="suggestion-chip"
                            onClick={() => handleSelectStock(stock)}
                          >
                            <span className="chip-ticker">{stock.ticker}</span>
                            <span className="chip-name">{stock.society?.name || '--'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.market.length > 0 && (
                    <div className="suggestion-group">
                      <h5>Same market ({selectedStocks[0].bourse?.ticker})</h5>
                      <div className="suggestion-chips">
                        {suggestions.market.map((stock, index) => (
                          <button
                            key={stock.id || `market-${stock.ticker}-${index}`}
                            className="suggestion-chip"
                            onClick={() => handleSelectStock(stock)}
                          >
                            <span className="chip-ticker">{stock.ticker}</span>
                            <span className="chip-name">{stock.society?.name || '--'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
