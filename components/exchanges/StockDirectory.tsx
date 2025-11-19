'use client';

import { useState, useMemo } from 'react';
import { ListedStock } from '@/types/exchanges';
import { SAMPLE_STOCKS } from '@/core/data/ExchangesData';

interface StockDirectoryProps {
  selectedExchange: string;
  onStockSelect: (stock: ListedStock) => void;
  onAnalyzeInScreener: (stock: ListedStock) => void;
  onExchangeChange?: (exchangeId: string) => void;
}

export default function StockDirectory({ 
  selectedExchange, 
  onStockSelect, 
  onAnalyzeInScreener,
  onExchangeChange
}: StockDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('all');
  const [sortBy, setSortBy] = useState<'symbol' | 'name' | 'marketCap' | 'price' | 'change' | 'volume'>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const filteredStocks = useMemo(() => {
    let stocks = SAMPLE_STOCKS.filter(stock => 
      selectedExchange === 'all' || stock.exchangeId === selectedExchange
    );

    // Apply search filter
    if (searchQuery) {
      stocks = stocks.filter(stock => 
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sector filter
    if (selectedSector !== 'all') {
      stocks = stocks.filter(stock => stock.sector === selectedSector);
    }

    // Apply sorting
    stocks.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortBy) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'marketCap':
          aValue = a.marketCap;
          bValue = b.marketCap;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'change':
          aValue = a.changePercent;
          bValue = b.changePercent;
          break;
        case 'volume':
          aValue = a.volume;
          bValue = b.volume;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return stocks;
  }, [SAMPLE_STOCKS, selectedExchange, searchQuery, selectedSector, sortBy, sortDirection]);

  const paginatedStocks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredStocks.slice(startIndex, endIndex);
  }, [filteredStocks, currentPage]);

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

  const sectors = useMemo(() => {
    const uniqueSectors = Array.from(new Set(SAMPLE_STOCKS.map(stock => stock.sector)));
    return uniqueSectors.sort();
  }, []);

  const exchangeNames = {
    brvm: 'BRVM',
    jse: 'JSE',
    ngx: 'NGX',
    cse: 'CSE',
    nse: 'NSE',
    gse: 'GSE'
  };

  const sortOptions = [
    { value: 'symbol', label: 'Symbole' },
    { value: 'name', label: 'Nom' },
    { value: 'marketCap', label: 'Capitalisation' },
    { value: 'price', label: 'Prix' },
    { value: 'change', label: 'Variation %' },
    { value: 'volume', label: 'Volume' }
  ];

  const formatMarketCap = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}B`;
    }
    return `$${value.toFixed(0)}M`;
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  return (
    <div className="stock-directory">
      {/* Directory Header */}
      <div className="directory-header">
        <h3>
          Actions Cotées {selectedExchange !== 'all' && `- ${exchangeNames[selectedExchange as keyof typeof exchangeNames]}`}
        </h3>
        <div className="stock-count">
          {filteredStocks.length} actions trouvées
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="directory-controls">
        <div className="search-section">
          <div className="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher par symbole ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-group">
            <label>Bourse:</label>
            <select 
              value={selectedExchange}
              onChange={(e) => {
                onExchangeChange?.(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Toutes les bourses</option>
              <option value="brvm">BRVM</option>
              <option value="jse">JSE</option>
              <option value="ngx">NGX</option>
              <option value="cse">CSE</option>
              <option value="nse">NSE</option>
              <option value="gse">GSE</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Secteur:</label>
            <select 
              value={selectedSector}
              onChange={(e) => {
                setSelectedSector(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">Tous les secteurs</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Trier par:</label>
            <select 
              value={sortBy}
              onChange={(e) => handleSort(e.target.value as typeof sortBy)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button 
            className="sort-direction-btn"
            onClick={() => setSortDirection(current => current === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="stocks-table">
        <div className="table-header">
          <div className="col-symbol">Symbole</div>
          <div className="col-name">Nom</div>
          <div className="col-exchange">Bourse</div>
          <div className="col-sector">Secteur</div>
          <div className="col-marketcap">Capitalisation</div>
          <div className="col-price">Prix</div>
          <div className="col-change">Variation</div>
          <div className="col-volume">Volume</div>
          <div className="col-metrics">Métriques</div>
          <div className="col-actions">Actions</div>
        </div>

        <div className="table-body">
          {paginatedStocks.map((stock) => (
            <div key={stock.id} className="table-row">
              <div className="col-symbol">
                <span className="symbol">{stock.symbol}</span>
              </div>
              
              <div className="col-name">
                <span className="name">{stock.name}</span>
              </div>
              
              <div className="col-exchange">
                <span className="exchange-badge">{stock.exchangeId.toUpperCase()}</span>
              </div>
              
              <div className="col-sector">
                <span className="sector-tag">{stock.sector}</span>
              </div>
              
              <div className="col-marketcap">
                <span className="marketcap">{formatMarketCap(stock.marketCap)}</span>
              </div>
              
              <div className="col-price">
                <span className="price">{stock.price.toFixed(2)}</span>
              </div>
              
              <div className="col-change">
                <div className={`change-indicator ${stock.changePercent >= 0 ? 'positive' : 'negative'}`}>
                  <span className="change-value">
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                  <div className="change-bar">
                    <div 
                      className="change-fill"
                      style={{ 
                        width: `${Math.min(Math.abs(stock.changePercent) * 5, 100)}%`,
                        backgroundColor: stock.changePercent >= 0 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="col-volume">
                <span className="volume">{formatNumber(stock.volume)}</span>
              </div>
              
              <div className="col-metrics">
                <div className="metrics-row">
                  {stock.peRatio && (
                    <span className="metric-badge" title="P/E Ratio">
                      P/E: {stock.peRatio.toFixed(1)}
                    </span>
                  )}
                  {stock.dividendYield && (
                    <span className="metric-badge" title="Rendement du dividende">
                      Div: {stock.dividendYield.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="col-actions">
                <div className="action-buttons">
                  <button 
                    className="action-btn primary"
                    onClick={() => onStockSelect(stock)}
                    title="Voir fiche société"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  
                  <button 
                    className="action-btn secondary"
                    onClick={() => onAnalyzeInScreener(stock)}
                    title="Analyser dans Screener"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 21l-6-6m6 6v-4.5m0 4.5h-4.5" />
                      <path d="M3 12l6-6m-6 6h4.5m-4.5 0L3 7.5" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            ← Précédent
          </button>
          
          <div className="pagination-info">
            Page {currentPage} sur {totalPages}
          </div>
          
          <button 
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredStocks.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>
          <h3>Aucune action trouvée</h3>
          <p>Essayez de modifier vos filtres ou votre recherche</p>
        </div>
      )}
    </div>
  );
}
