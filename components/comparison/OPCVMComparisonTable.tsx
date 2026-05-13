'use client';

import { useMemo } from 'react';
import { ComparisonStock, Indicator, OPCVMIndicator } from '@/core/data/StockComparison';
import ComparisonStockHoverCard from './ComparisonStockHoverCard';
import IndicatorChartPopup from './IndicatorChartPopup';
import { OPCVMEntity } from '@/core/domain/entities/opcvm.entity';
import OPCVMComparisonStockHoverCard from './OPCVMComparisonStockHoverCard';
import OPCVMIndicatorChartPopup from './OPCVMIndicatorChartPopup';

interface OPCVMComparisonTableProps {
  opcvms: OPCVMEntity[];
  indicators: OPCVMIndicator[];
  showAverage: boolean;
  highlightBest: boolean;
}

export default function OPCVMComparisonTable({
  opcvms,
  indicators,
  showAverage,
  highlightBest,
}: OPCVMComparisonTableProps) {
  // Calculer les moyennes par indicateur
  const averages = useMemo(() => {
    const avg: Record<string, number> = {};
    indicators.forEach((indicator) => {
      const values = opcvms.map(opcvm => {
        const value = opcvm.latest_metrics?.[indicator.field as keyof typeof opcvm.latest_metrics];
        return value !== null && value !== undefined ? Number(value) : 0;
      });
      const sum = values.reduce((acc, val) => acc + val, 0);
      avg[indicator.id] = sum / opcvms.length;
    });
    return avg;
  }, [opcvms, indicators]);

  // Trouver la meilleure et la pire valeur par indicateur
  const extremeValues = useMemo(() => {
    const best: Record<string, { value: number; opcvmId: string }> = {};
    const worst: Record<string, { value: number; opcvmId: string }> = {};
    
    indicators.forEach((indicator) => {
      const values = opcvms.map((opcvm) => {
        const value = opcvm.latest_metrics?.[indicator.field as keyof typeof opcvm.latest_metrics];
        return {
          value: value !== null && value !== undefined ? Number(value) : 0,
          opcvmId: opcvm.id,
        };
      });

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
  }, [opcvms, indicators]);

  const formatValue = (value: number | null | undefined, indicator: OPCVMIndicator): string => {
    if (value === null || value === undefined) return 'N/A';
    if (indicator.unit === '%') return `${value.toFixed(2)}%`;
    if (indicator.unit === '$') return `$${value.toFixed(2)}`;
    if (indicator.unit === 'x') return `${value.toFixed(2)}x`;
    if (indicator.unit === 'Md') return `${value.toFixed(1)}Md`;
    return value.toFixed(2);
  };

  const isBestValue = (opcvmId: string, indicatorId: string): boolean => {
    return highlightBest && extremeValues.best[indicatorId]?.opcvmId === opcvmId;
  };

  const isWorstValue = (opcvmId: string, indicatorId: string): boolean => {
    return highlightBest && extremeValues.worst[indicatorId]?.opcvmId === opcvmId;
  };

  if (opcvms.length === 0 || indicators.length === 0) {
    return (
      <div className="comparison-table comparison-table--empty">
        <p>Select funds and indicator to display the comparison table</p>
      </div>
    );
  }

  return (
    <div className="comparison-table-container">
      <div className="comparison-table-header">
        <h3>Comparison Table</h3>
        <div className="comparison-table-actions">
          <span className="table-info">
            {opcvms.length} funds • {indicators.length} indicators
          </span>
        </div>
      </div>

      <div className="comparison-table-wrapper">
        <table className="comparison-table comparison-table--horizontal">
          <thead>
            <tr>
              <th className="sticky-col">Funds</th>
              {indicators.map((indicator) => (
                <th key={indicator.id}>
                  <OPCVMIndicatorChartPopup indicator={indicator} opcvms={opcvms}>
                    <div className="indicator-header">
                      <div className="indicator-header__name">{indicator.name}</div>
                      <div className="indicator-header__unit">{indicator.unit}</div>
                    </div>
                  </OPCVMIndicatorChartPopup>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {opcvms.map((opcvm) => (
              <tr key={opcvm.id}>
                <td className="sticky-col stock-col">
                  <OPCVMComparisonStockHoverCard opcvm={opcvm}>
                    <div className="stock-cell">
                      <div className="stock-cell__logo">
                        {opcvm.intitule.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="stock-cell__info">
                        <div className="stock-cell__ticker">{opcvm.intitule}</div>
                        <div className="stock-cell__market">{opcvm.isin}</div>
                      </div>
                    </div>
                  </OPCVMComparisonStockHoverCard>
                </td>
                {indicators.map((indicator) => {
                  const value = opcvm.latest_metrics?.[indicator.field as keyof typeof opcvm.latest_metrics];
                  const numValue = value !== null && value !== undefined ? Number(value) : null;
                  const isBest = isBestValue(opcvm.id, indicator.id);
                  const isWorst = isWorstValue(opcvm.id, indicator.id);

                  return (
                    <td
                      key={indicator.id}
                      className={`value-cell ${isBest ? 'best-value' : ''} ${isWorst ? 'worst-value' : ''}`}
                    >
                      <div className="value-content">
                        <span className="value-number">{formatValue(numValue, indicator)}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {showAverage && (
              <tr className="avg-row">
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
