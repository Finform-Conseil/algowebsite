'use client';

import { useState, useMemo } from 'react';
import { ComparisonStock } from '@/core/data/StockComparison';

interface StockSelectorProps {
  allStocks: ComparisonStock[];
  selectedStocks: ComparisonStock[];
  onAddStock: (stock: ComparisonStock) => void;
  onRemoveStock: (stockId: string) => void;
  maxStocks: number;
}

export default function StockSelector({
  allStocks,
  selectedStocks,
  onAddStock,
  onRemoveStock,
  maxStocks,
}: StockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtrer les actions selon la recherche
  const filteredStocks = useMemo(() => {
    if (!searchQuery) return [];
    const query = searchQuery.toLowerCase();
    return allStocks.filter(
      (stock) =>
        !selectedStocks.find((s) => s.id === stock.id) &&
        (stock.ticker.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query) ||
          stock.market.toLowerCase().includes(query) ||
          stock.country.toLowerCase().includes(query) ||
          stock.sector.toLowerCase().includes(query))
    );
  }, [searchQuery, allStocks, selectedStocks]);

  // Générer des suggestions intelligentes
  const suggestions = useMemo(() => {
    if (selectedStocks.length === 0) return { peers: [], market: [] };
    
    const firstStock = selectedStocks[0];
    
    const sameSector = allStocks.filter(
      (s) => s.sector === firstStock.sector && !selectedStocks.find((sel) => sel.id === s.id)
    );
    
    const sameMarket = allStocks.filter(
      (s) => s.market === firstStock.market && !selectedStocks.find((sel) => sel.id === s.id)
    );
    
    return {
      peers: sameSector.slice(0, 3),
      market: sameMarket.slice(0, 3),
    };
  }, [selectedStocks, allStocks]);

  const handleSelectStock = (stock: ComparisonStock) => {
    if (selectedStocks.length < maxStocks) {
      onAddStock(stock);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  return (
    <div className={`stock-selector ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="stock-selector__header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2>Sélection des Actions</h2>
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
                  placeholder={selectedStocks.length === 0 ? "Rechercher par ticker, nom, marché..." : "Ajouter..."}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => searchQuery && setShowDropdown(true)}
                  disabled={selectedStocks.length >= maxStocks}
                  className="search-input-flex"
                />
              </div>
            </div>

            {/* Dropdown de résultats */}
            {showDropdown && filteredStocks.length > 0 && (
              <div className="search-dropdown">
                {filteredStocks.slice(0, 8).map((stock) => (
                  <button
                    key={stock.id}
                    className="search-result-item"
                    onClick={() => handleSelectStock(stock)}
                  >
                    <div className="search-result-item__logo">
                      {stock.ticker.substring(0, 2)}
                    </div>
                    <div className="search-result-item__info">
                      <div className="search-result-item__name">
                        <span className="ticker">{stock.ticker}</span>
                        <span className="name">{stock.name}</span>
                      </div>
                      <div className="search-result-item__meta">
                        <span className="market">{stock.market}</span>
                        <span className="divider">•</span>
                        <span className="sector">{stock.sector}</span>
                        <span className="divider">•</span>
                        <span className="country">{stock.country}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Suggestions intelligentes */}
          {selectedStocks.length > 0 && selectedStocks.length < maxStocks && (
            <div className="stock-suggestions">
              <button className="suggestions-toggle" onClick={() => setShowSuggestions(!showSuggestions)}>
                <span>Suggestions intelligentes</span>
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
                      <h5>Concurrents du secteur</h5>
                      <div className="suggestion-chips">
                        {suggestions.peers.map((stock) => (
                          <button
                            key={stock.id}
                            className="suggestion-chip"
                            onClick={() => handleSelectStock(stock)}
                          >
                            <span className="chip-ticker">{stock.ticker}</span>
                            <span className="chip-name">{stock.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.market.length > 0 && (
                    <div className="suggestion-group">
                      <h5>Même marché ({selectedStocks[0].market})</h5>
                      <div className="suggestion-chips">
                        {suggestions.market.map((stock) => (
                          <button
                            key={stock.id}
                            className="suggestion-chip"
                            onClick={() => handleSelectStock(stock)}
                          >
                            <span className="chip-ticker">{stock.ticker}</span>
                            <span className="chip-name">{stock.name}</span>
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
