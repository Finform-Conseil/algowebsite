'use client';

import { useMemo } from 'react';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';
import ComparisonStockHoverCard from './ComparisonStockHoverCard';
import IndicatorChartPopup from './IndicatorChartPopup';

interface ComparisonTableProps {
  stocks: ComparisonStock[];
  indicators: Indicator[];
  showAverage: boolean;
  highlightBest: boolean;
}

export default function ComparisonTable({
  stocks,
  indicators,
  showAverage,
  highlightBest,
}: ComparisonTableProps) {
  // Calculer les moyennes par indicateur
  const averages = useMemo(() => {
    const avg: Record<string, number> = {};
    indicators.forEach((indicator) => {
      const sum = stocks.reduce((acc, stock) => acc + (stock[indicator.field] as number), 0);
      avg[indicator.id] = sum / stocks.length;
    });
    return avg;
  }, [stocks, indicators]);

  // Trouver la meilleure et la pire valeur par indicateur
  const extremeValues = useMemo(() => {
    const best: Record<string, { value: number; stockId: string }> = {};
    const worst: Record<string, { value: number; stockId: string }> = {};
    
    indicators.forEach((indicator) => {
      const values = stocks.map((stock) => ({
        value: stock[indicator.field] as number,
        stockId: stock.id,
      }));

      const maxValue = Math.max(...values.map((v) => v.value));
      const minValue = Math.min(...values.map((v) => v.value));

      if (indicator.higherIsBetter) {
        best[indicator.id] = values.find((v) => v.value === maxValue)!;
        worst[indicator.id] = values.find((v) => v.value === minValue)!;
      } else {
        best[indicator.id] = values.find((v) => v.value === minValue)!;
        worst[indicator.id] = values.find((v) => v.value === maxValue)!;
      }
    });

    return { best, worst };
  }, [stocks, indicators]);

  // Générer mini sparkline SVG
  const generateSparkline = (data: number[]): string => {
    if (data.length < 2) return '';

    const width = 60;
    const height = 20;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');

    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <polyline points="${points}" fill="none" stroke="var(--primary-color)" stroke-width="1.5" />
    </svg>`;
  };

  const formatValue = (value: number, indicator: Indicator): string => {
    if (indicator.unit === '%') return `${value.toFixed(2)}%`;
    if (indicator.unit === '$') return `$${value.toFixed(2)}`;
    if (indicator.unit === 'x') return `${value.toFixed(2)}x`;
    if (indicator.unit === 'Md') return `${value.toFixed(1)}Md`;
    return value.toFixed(2);
  };

  const isBestValue = (stockId: string, indicatorId: string): boolean => {
    return highlightBest && extremeValues.best[indicatorId]?.stockId === stockId;
  };

  const isWorstValue = (stockId: string, indicatorId: string): boolean => {
    return highlightBest && extremeValues.worst[indicatorId]?.stockId === stockId;
  };

  if (stocks.length === 0 || indicators.length === 0) {
    return (
      <div className="comparison-table comparison-table--empty">
        <p>Sélectionnez des actions et indicateurs pour afficher le tableau comparatif</p>
      </div>
    );
  }

  return (
    <div className="comparison-table-container">
      <div className="comparison-table-header">
        <h3>Tableau Comparatif Détaillé</h3>
        <div className="comparison-table-actions">
          <span className="table-info">
            {stocks.length} actions • {indicators.length} indicateurs
          </span>
        </div>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table comparison-table--horizontal">
          <thead>
            <tr>
              <th className="sticky-col">Action</th>
              {indicators.map((indicator) => (
                <th key={indicator.id}>
                  <IndicatorChartPopup indicator={indicator} stocks={stocks}>
                    <div className="indicator-header">
                      <div className="indicator-header__name">{indicator.name}</div>
                      <div className="indicator-header__unit">{indicator.unit}</div>
                    </div>
                  </IndicatorChartPopup>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr key={stock.id}>
                <td className="sticky-col stock-col">
                  <ComparisonStockHoverCard stock={stock}>
                    <div className="stock-cell">
                      <div className="stock-cell__logo">
                        {stock.ticker.substring(0, 2)}
                      </div>
                      <div className="stock-cell__info">
                        <div className="stock-cell__ticker">{stock.ticker}</div>
                        <div className="stock-cell__market">{stock.market}</div>
                      </div>
                    </div>
                  </ComparisonStockHoverCard>
                </td>
                {indicators.map((indicator) => {
                  const value = stock[indicator.field] as number;
                  const isBest = isBestValue(stock.id, indicator.id);
                  const isWorst = isWorstValue(stock.id, indicator.id);

                  return (
                    <td
                      key={indicator.id}
                      className={`value-cell ${isBest ? 'best-value' : ''} ${isWorst ? 'worst-value' : ''}`}
                    >
                      <div className="value-content">
                        <span className="value-number">{formatValue(value, indicator)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {showAverage && (
              <tr className="avg-row">
                <td className="sticky-col">
                  <strong>Moyenne</strong>
                </td>
                {indicators.map((indicator) => (
                  <td key={indicator.id} className="avg-col">
                    <span className="avg-value">{formatValue(averages[indicator.id], indicator)}</span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
