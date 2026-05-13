'use client';

import { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { ColumnDefinition } from '@/core/data/ColumnRegistry';

interface ComparisonChartsTabProps {
  stocks: ActionEntity[];
  indicators: ColumnDefinition[];
}

export default function ComparisonChartsTab({ stocks, indicators }: ComparisonChartsTabProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<ColumnDefinition | null>(
    indicators.length > 0 ? indicators[0] : null
  );

  if (stocks.length === 0) {
    return (
      <div className="comparison-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <h3>No stock selected</h3>
        <p>Select at least 2 stocks to display comparison graphs</p>
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="comparison-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>No criterion selector</h3>
        <p>Select some criterions to display graphs</p>
      </div>
    );
  }

  const formatValue = (value: number | null | undefined, indicator: ColumnDefinition): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (indicator.format) {
      return indicator.format(value);
    }
    
    if (indicator.type === 'percentage') return `${value.toFixed(2)}%`;
    if (indicator.type === 'currency') return `$${(value / 1000000).toFixed(2)}M`;
    if (indicator.type === 'number') return value.toFixed(2);
    return String(value);
  };

  return (
    <div className="comparison-charts-tab">
      {/* Indicator Selector */}
      <div className="indicator-selector">
        <label className="selector-label">Comparison criterion :</label>
        <div className="indicator-buttons">
          {indicators.map((indicator) => (
            <button
              key={indicator.id}
              className={`indicator-btn ${selectedIndicator?.id === indicator.id ? 'active' : ''}`}
              onClick={() => setSelectedIndicator(indicator)}
            >
              <span className="indicator-btn__name">{indicator.name}</span>
              <span className="indicator-btn__unit">{indicator.type}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedIndicator && (
        <>
          {/* Indicator Info */}
          <div className="indicator-info">
            <div className="indicator-info__header">
              <h3>{selectedIndicator.name}</h3>
              <span className="indicator-info__category">{selectedIndicator.type}</span>
            </div>
            <p className="indicator-info__description">{selectedIndicator.description}</p>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {stocks.map((stock) => {
              const value = selectedIndicator.accessor(stock);
              
              return (
                <StockChart
                  key={stock.id}
                  stock={stock}
                  indicator={selectedIndicator}
                  value={value}
                  formatValue={formatValue}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

interface StockChartProps {
  stock: ActionEntity;
  indicator: ColumnDefinition;
  value: number | null | undefined;
  formatValue: (value: number | null | undefined, indicator: ColumnDefinition) => string;
}

function StockChart({ stock, indicator, value, formatValue }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);


  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="stock-info">
          <div className="stock-logo">
            {stock.ticker?.substring(0, 2).toUpperCase()}
          </div>
          <div className="stock-details">
            <h4>{stock.ticker}</h4>
            <span className="stock-name">{stock.society?.name || 'N/A'}</span>
          </div>
        </div>
        <div className="indicator-value">
          <span className="value-label">{indicator.name}</span>
          <span className="value-number">{formatValue(value, indicator)}</span>
        </div>
      </div>
      
      <div className="chart-card__body">
        <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
      </div>
      
      <div className="chart-card__footer">
        <div key="exchange" className="stat-item">
          <span className="stat-label">Exchange</span>
          <span className="stat-value">{stock.bourse?.ticker || 'N/A'}</span>
        </div>
        <div key="sector" className="stat-item">
          <span className="stat-label">Sector</span>
          <span className="stat-value">{stock.society?.industry?.name || 'N/A'}</span>
        </div>
        <div key="market-cap" className="stat-item">
          <span className="stat-label">Market Cap.</span>
          <span className="stat-value">{stock.latest_valuation_ratio?.market_cap ? (stock.latest_valuation_ratio.market_cap / 1000000000).toFixed(1) + 'Md' : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}
