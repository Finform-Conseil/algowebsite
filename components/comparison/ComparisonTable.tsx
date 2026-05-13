'use client';

import { useMemo } from 'react';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { ColumnDefinition } from '@/core/data/ColumnRegistry';
import ComparisonStockHoverCard from './ComparisonStockHoverCard';
import IndicatorChartPopup from './IndicatorChartPopup';

interface ComparisonTableProps {
  stocks: ActionEntity[];
  indicators: ColumnDefinition[];
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
      const values = stocks.map(stock => {
        const value = indicator.accessor(stock);
        return value !== null && value !== undefined ? Number(value) : 0;
      });
      const sum = values.reduce((acc, val) => acc + val, 0);
      avg[indicator.id] = sum / stocks.length;
    });
    return avg;
  }, [stocks, indicators]);

  // Trouver la meilleure et la pire valeur par indicateur
  const extremeValues = useMemo(() => {
    const best: Record<string, { value: number; stockId: string }> = {};
    const worst: Record<string, { value: number; stockId: string }> = {};
    
    indicators.forEach((indicator) => {
      const values = stocks.map((stock) => {
        const value = indicator.accessor(stock);
        return {
          value: value !== null && value !== undefined ? Number(value) : 0,
          stockId: stock.id,
        };
      });

      const maxValue = Math.max(...values.map((v) => v.value));
      const minValue = Math.min(...values.map((v) => v.value));

      // Pour l'instant, on considère que les valeurs plus élevées sont meilleures
      // TODO: Ajouter une propriété higherIsBetter dans ColumnDefinition si nécessaire
      best[indicator.id] = values.find((v) => v.value === maxValue)!;
      worst[indicator.id] = values.find((v) => v.value === minValue)!;
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

  const formatValue = (value: number | null | undefined, indicator: ColumnDefinition): string => {
    if (value === null || value === undefined) return 'N/A';
    
    // Utiliser le formateur de la colonne si disponible
    if (indicator.format) {
      return indicator.format(value);
    }
    
    // Sinon, formater selon le type
    if (indicator.type === 'percentage') return `${value.toFixed(2)}%`;
    if (indicator.type === 'currency') return `$${(value / 1000000).toFixed(2)}M`;
    if (indicator.type === 'number') return value.toFixed(2);
    return String(value);
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
        <p>Select some stocks and criterions to display a comparative board</p>
      </div>
    );
  }

  return (
    <div className="comparison-table-container">
      <div className="comparison-table-header">
        <h3>Detailed Comparative Board</h3>
        <div className="comparison-table-actions">
          <span className="table-info">
            {stocks.length} stocks • {indicators.length} criterions
          </span>
        </div>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table comparison-table--horizontal">
          <thead>
            <tr>
              <th className="sticky-col">Stock</th>
              {indicators.map((indicator) => (
                <th key={indicator.id}>
                  <IndicatorChartPopup indicator={indicator} stocks={stocks}>
                    <div className="indicator-header">
                      <div className="indicator-header__name">{indicator.name}</div>
                      <div className="indicator-header__unit">{indicator.type}</div>
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
                        <div className="stock-cell__market">{stock.bourse?.ticker || '--'}</div>
                      </div>
                    </div>
                  </ComparisonStockHoverCard>
                </td>
                {indicators.map((indicator) => {
                  const value = indicator.accessor(stock);
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
              <tr key="average-row" className="avg-row">
                <td className="sticky-col">
                  <strong>Average</strong>
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
