'use client';

import { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';

interface ComparisonChartsTabProps {
  stocks: ComparisonStock[];
  indicators: Indicator[];
}

export default function ComparisonChartsTab({ stocks, indicators }: ComparisonChartsTabProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(
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
        <h3>Aucune action sélectionnée</h3>
        <p>Sélectionnez au moins 2 actions pour afficher les graphiques comparatifs</p>
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
        <h3>Aucun indicateur sélectionné</h3>
        <p>Sélectionnez des indicateurs pour afficher les graphiques</p>
      </div>
    );
  }

  const formatValue = (value: number, unit: string): string => {
    if (unit === '%') return `${value.toFixed(2)}%`;
    if (unit === '$') return `$${value.toFixed(2)}`;
    if (unit === 'x') return `${value.toFixed(2)}x`;
    if (unit === 'Md') return `${value.toFixed(1)}Md`;
    return value.toFixed(2);
  };

  return (
    <div className="comparison-charts-tab">
      {/* Indicator Selector */}
      <div className="indicator-selector">
        <label className="selector-label">Critère de comparaison :</label>
        <div className="indicator-buttons">
          {indicators.map((indicator) => (
            <button
              key={indicator.id}
              className={`indicator-btn ${selectedIndicator?.id === indicator.id ? 'active' : ''}`}
              onClick={() => setSelectedIndicator(indicator)}
            >
              <span className="indicator-btn__name">{indicator.name}</span>
              <span className="indicator-btn__unit">{indicator.unit}</span>
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
              <span className="indicator-info__category">{selectedIndicator.category}</span>
            </div>
            <p className="indicator-info__description">{selectedIndicator.description}</p>
          </div>

          {/* Charts Grid */}
          <div className="charts-grid">
            {stocks.map((stock) => {
              const value = stock[selectedIndicator.field] as number;
              
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
  stock: ComparisonStock;
  indicator: Indicator;
  value: number;
  formatValue: (value: number, unit: string) => string;
}

function StockChart({ stock, indicator, value, formatValue }: StockChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current || !stock.priceHistory) return;

    const chart = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-primary)',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        show: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          type: 'line',
          data: stock.priceHistory,
          smooth: true,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          symbol: 'none',
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [stock.priceHistory]);

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="stock-info">
          <div className="stock-logo">
            {stock.ticker.substring(0, 2)}
          </div>
          <div className="stock-details">
            <h4>{stock.ticker}</h4>
            <span className="stock-name">{stock.name}</span>
          </div>
        </div>
        <div className="indicator-value">
          <span className="value-label">{indicator.name}</span>
          <span className="value-number">{formatValue(value, indicator.unit)}</span>
        </div>
      </div>
      
      <div className="chart-card__body">
        <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
      </div>
      
      <div className="chart-card__footer">
        <div className="stat-item">
          <span className="stat-label">Marché</span>
          <span className="stat-value">{stock.market}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Secteur</span>
          <span className="stat-value">{stock.sector}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Cap. Boursière</span>
          <span className="stat-value">{stock.marketCap.toFixed(1)}Md</span>
        </div>
      </div>
    </div>
  );
}
