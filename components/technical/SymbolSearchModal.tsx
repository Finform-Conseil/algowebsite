'use client';

import { useState, useMemo } from 'react';

interface Symbol {
  symbol: string;
  name: string;
  type: 'stocks' | 'fund' | 'forex' | 'futures' | 'crypto';
  logo?: string;
  exchange?: string;
}

interface SymbolSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSymbol: (symbol: string) => void;
  currentSymbol?: string;
  addedSymbols?: string[];
}

const SYMBOL_TYPES = [
  { id: 'stocks', label: 'Stocks' },
  { id: 'fund', label: 'Fund' },
  { id: 'forex', label: 'Forex' },
  { id: 'futures', label: 'Futures' },
  { id: 'crypto', label: 'Crypto' },
];

// Demo data
const DEMO_SYMBOLS: Symbol[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stocks', exchange: 'NASDAQ' },
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'fund', exchange: 'NYSE' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', type: 'fund', exchange: 'NASDAQ' },
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', type: 'forex' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', type: 'forex' },
  { symbol: 'ES', name: 'E-mini S&P 500', type: 'futures' },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', type: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', type: 'crypto' },
];

export default function SymbolSearchModal({
  isOpen,
  onClose,
  onSelectSymbol,
  currentSymbol,
  addedSymbols = [],
}: SymbolSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('stocks');
  const [expressionMode, setExpressionMode] = useState(false);
  const [expression, setExpression] = useState('');

  const filteredSymbols = useMemo(() => {
    let symbols = DEMO_SYMBOLS.filter((s) => s.type === selectedType);
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      symbols = symbols.filter(
        (s) =>
          s.symbol.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query)
      );
    }
    
    return symbols;
  }, [searchQuery, selectedType]);

  if (!isOpen) return null;

  const handleSelectSymbol = (symbol: string) => {
    if (expressionMode) {
      setExpression((prev) => prev + symbol);
    } else {
      onSelectSymbol(symbol);
      onClose();
    }
  };

  const handleApplyExpression = () => {
    if (expression.trim()) {
      onSelectSymbol(expression.trim());
      onClose();
      setExpression('');
      setExpressionMode(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="symbol-search-modal">
        <div className="symbol-search-modal__header">
          <h3>Recherche de Symbole</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="symbol-search-modal__body">
          {/* Search Input */}
          <div className="symbol-search-input-wrapper">
            <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="symbol-search-input"
              placeholder="Rechercher un symbole ou nom..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type Tags */}
          <div className="symbol-types">
            {SYMBOL_TYPES.map((type) => (
              <button
                key={type.id}
                className={`symbol-type-tag ${selectedType === type.id ? 'active' : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Expression Mode Toggle */}
          <div className="expression-mode-toggle">
            <button
              className={`toggle-btn ${!expressionMode ? 'active' : ''}`}
              onClick={() => setExpressionMode(false)}
            >
              Symboles
            </button>
            <button
              className={`toggle-btn ${expressionMode ? 'active' : ''}`}
              onClick={() => setExpressionMode(true)}
            >
              Expression
            </button>
          </div>

          {/* Expression Builder */}
          {expressionMode && (
            <div className="expression-builder">
              <input
                type="text"
                className="expression-input"
                placeholder="Ex: AAPL+TSLA ou 1/(AAPL+MSFT)"
                value={expression}
                onChange={(e) => setExpression(e.target.value)}
              />
              <div className="expression-operators">
                <button onClick={() => setExpression((p) => p + '+')}>+</button>
                <button onClick={() => setExpression((p) => p + '-')}>-</button>
                <button onClick={() => setExpression((p) => p + '*')}>×</button>
                <button onClick={() => setExpression((p) => p + '/')}>÷</button>
                <button onClick={() => setExpression((p) => p + '(')}>{'('}</button>
                <button onClick={() => setExpression((p) => p + ')')}>{')'}</button>
                <button onClick={() => setExpression('')}>Clear</button>
              </div>
              <button className="btn btn--primary" onClick={handleApplyExpression}>
                Appliquer Expression
              </button>
            </div>
          )}

          {/* Symbols List */}
          {!expressionMode && (
            <div className="symbols-list">
              {filteredSymbols.length === 0 ? (
                <div className="no-results">Aucun symbole trouvé</div>
              ) : (
                filteredSymbols.map((symbol) => {
                  const isAdded = addedSymbols.includes(symbol.symbol);
                  const isCurrent = currentSymbol === symbol.symbol;
                  return (
                  <button
                    key={symbol.symbol}
                    className={`symbol-item ${isCurrent ? 'current' : ''} ${isAdded ? 'added' : ''}`}
                    onClick={() => handleSelectSymbol(symbol.symbol)}
                    disabled={isAdded && !isCurrent}
                  >
                    <div className="symbol-item__logo">
                      {symbol.symbol.charAt(0)}
                    </div>
                    <div className="symbol-item__info">
                      <div className="symbol-item__symbol">{symbol.symbol}</div>
                      <div className="symbol-item__name">{symbol.name}</div>
                    </div>
                    {symbol.exchange && (
                      <div className="symbol-item__exchange">{symbol.exchange}</div>
                    )}
                  </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
