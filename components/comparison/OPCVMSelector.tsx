'use client';

import { useState, useMemo, useEffect } from 'react';
import { OpcvmQueryParams } from '@/core/domain/types/opcvm.type';
import { useOpcvmRepository } from '@/core/infra/repositories/opcvm.repository.impl';
import { OPCVMEntity } from '@/core/domain/entities/opcvm.entity';
import { OPCVMNatureEnum, OPCVMTypeEnum } from '@/core/domain/enums/opcvm.enum';


interface OPCVMSelectorProps {
  selectedOPCVMs: OPCVMEntity[];
  onAddStock: (opcvm: OPCVMEntity) => void;
  onRemoveStock: (opcvmId: string) => void;
  maxStocks: number;
}

type OPCVMFilterState = {
  search: string;
  markets: string[];
  natures: string[];
  types: string[];
  riskRatings: number[];
};

export default function OPCVMSelector({
  selectedOPCVMs,
  onAddStock,
  onRemoveStock,
  maxStocks,
}: OPCVMSelectorProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState<OPCVMFilterState>({
    search: "",
    markets: [],
    natures: [],
    types: [],
    riskRatings: [],
  });

  const getOpcvmParams = (): OpcvmQueryParams => {
    const params: OpcvmQueryParams = { view_type: "screener", page: 1, page_size: 100 };
    
    if (filters.search) params.search = filters.search;
    if (filters.natures.length > 0) params.natures = filters.natures.join(',');
    if (filters.types.length > 0) params.types = filters.types.join(',');
    if (filters.markets.length > 0) params.bourse_tickers = filters.markets.join(',');
    
    console.log('[OPCVMSelector] Query params:', { filters, params });
    
    return params;
  };
  
  const { allOpcvmsData, getAllOpcvms } = useOpcvmRepository();
  
  useEffect(() => {
    getAllOpcvms(getOpcvmParams());
  }, [filters]);

  useEffect(() =>
  {
    console.log("All OPCVM Data", allOpcvmsData)
  }, [allOpcvmsData])


  // Générer des suggestions intelligentes
  const suggestions = useMemo(() => {
    if (selectedOPCVMs.length === 0) return { peers: [], market: [] };
    
    const firstStock = selectedOPCVMs[0];
    
    const sameNature = allOpcvmsData?.data.filter(
      (s) => s.nature === firstStock.nature && !selectedOPCVMs.find((sel) => sel.id === s.id)
    );
    
    const sameType = allOpcvmsData?.data.filter(
      (s) => s.type === firstStock.type && !selectedOPCVMs.find((sel) => sel.id === s.id)
    );
    
    return {
      peers: sameNature?.slice(0, 3) || [],
      market: sameType?.slice(0, 3) || [],
    };
  }, [selectedOPCVMs, allOpcvmsData]);

  const handleSelectStock = (opcvm: OPCVMEntity) => {
    if (selectedOPCVMs.length < maxStocks) {
      onAddStock(opcvm);
      setFilters({ ...filters, search: '' });
      setShowDropdown(false);
    }
  };

  return (
    <div className={`stock-selector ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="stock-selector__header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <h2>Selection of OPCVM</h2>
        <div className="stock-selector__header-right">
          <span className="stock-selector__count">
            {selectedOPCVMs.length} / {maxStocks}
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
      <div className="fund-selector-div">
          <select 
            className="fund-comparison-select"
            value={filters.markets[0] || ''}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              markets: e.target.value ? [e.target.value] : []
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
            value={filters.natures[0] || ''}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              natures: e.target.value ? [e.target.value] : []
            }))}
          >
            <option value="">All Natures</option>
            {Object.values(OPCVMNatureEnum).map((nature) => (
              <option key={nature} value={nature}>
                {nature}
              </option>
            ))}
          </select>
          <select 
            className="fund-comparison-select"
            value={filters.types[0] || ''}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              types: e.target.value ? [e.target.value] : []
            }))}
          >
            <option value="">All Types</option>
            {Object.values(OPCVMTypeEnum).map((type) => (
              <option key={type} value={type}>
                {type}
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
                {selectedOPCVMs.map((opcvm) => (
                  <div key={opcvm.id} className="stock-tag-inline">
                    <span className="stock-tag-inline__ticker">{opcvm.intitule}</span>
                    <button
                      className="stock-tag-inline__remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveStock(opcvm.id);
                      }}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder={selectedOPCVMs.length === 0 ? "Search by isin, name..." : "Add..."}
                  value={filters.search}
                  onChange={(e) => {
                    setFilters({ ...filters, search: e.target.value });
                    setShowDropdown(e.target.value.length > 0);
                  }}
                  onFocus={() => filters.search && setShowDropdown(true)}
                  disabled={selectedOPCVMs.length >= maxStocks}
                  className="search-input-flex"
                />
              </div>
            </div>

            {/* Dropdown de résultats */}
            {showDropdown && allOpcvmsData?.data && allOpcvmsData.data.length > 0 && (
              <div className="search-dropdown">
                {allOpcvmsData.data.slice(0, 8).map((opcvm) => (
                  <button
                    key={opcvm.id}
                    className="search-result-item"
                    onClick={() => handleSelectStock(opcvm)}
                  >
                    <div className="search-result-item__logo">
                      {opcvm?.isin?.substring(0, 2)}
                    </div>
                    <div className="search-result-item__info">
                      <div className="search-result-item__name">
                        <span className="ticker">{opcvm.intitule}</span>
                        <span className="name">({opcvm.isin ?? "--"})</span>
                      </div>
                      <div className="search-result-item__meta">
                        <span className="market">{opcvm.bourse}</span>
                        <span className="divider">•</span>
                        <span className="sector">{typeof opcvm.currency === 'string' ? opcvm.currency : ''}</span>
                        <span className="divider">•</span>
                        <span className="country">{typeof opcvm.country === 'string' ? opcvm.country : ''}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Suggestions intelligentes */}
          {selectedOPCVMs.length > 0 && selectedOPCVMs.length < maxStocks && (
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
                      <h5>Same nature</h5>
                      <div className="suggestion-chips">
                        {suggestions.peers.map((opcvm) => (
                          <button
                            key={opcvm.id}
                            className="suggestion-chip"
                            onClick={() => handleSelectStock(opcvm)}
                          >
                            <span className="chip-ticker">{opcvm.intitule}</span>
                            <span className="chip-name">({opcvm.isin})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {suggestions.market.length > 0 && (
                    <div className="suggestion-group">
                      <h5>Same type ({selectedOPCVMs[0].type})</h5>
                      <div className="suggestion-chips">
                        {suggestions.market.map((opcvm) => (
                          <button
                            key={opcvm.id}
                            className="suggestion-chip"
                            onClick={() => handleSelectStock(opcvm)}
                          >
                            <span className="chip-ticker">{opcvm.intitule}</span>
                            <span className="chip-name">({opcvm.isin})</span>
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
