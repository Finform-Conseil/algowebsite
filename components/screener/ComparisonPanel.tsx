'use client';

import { useMemo } from 'react';
import { StockScreenerItem } from '@/core/data/StockScreener';
import RadarChart from '@/components/charts/RadarChart';
import HeatmapChart from '@/components/charts/HeatmapChart';

interface ComparisonPanelProps {
  stocks: StockScreenerItem[];
  onClose: () => void;
}

export default function ComparisonPanel({ stocks, onClose }: ComparisonPanelProps) {
  const radarData = useMemo(() => {
    const colors = ['#00BFFF', '#FF9F04', '#4ade80', '#f87171', '#a78bfa'];
    
    return stocks.map((stock, index) => ({
      name: stock.ticker,
      values: [
        Math.min((stock.revenue5YGrowth / 100) * 100, 100),
        Math.min((stock.roe / 50) * 100, 100),
        Math.min(((50 - stock.pe) / 50) * 100, 100), // Inverse P/E (lower is better)
        stock.dividendYield * 10, // Scale up
        stock.debtTrend === 'decreasing' ? 100 : stock.debtTrend === 'stable' ? 50 : 20,
      ],
      color: colors[index % colors.length],
    }));
  }, [stocks]);

  const heatmapData = useMemo(() => {
    return {
      stocks: stocks.map((s) => s.ticker),
      metrics: ['P/E', 'ROE', 'Crois.', 'Div.', 'Cap.'],
      values: stocks.map((s) => [
        s.pe,
        s.roe,
        s.revenue5YGrowth,
        s.dividendYield,
        s.marketCap,
      ]),
    };
  }, [stocks]);

  if (stocks.length === 0) return null;

  return (
    <div className="comparison-panel-overlay" onClick={onClose}>
      <div className="comparison-panel" onClick={(e) => e.stopPropagation()}>
        <div className="comparison-panel__header">
          <h3>Comparaison de {stocks.length} actions</h3>
          <button className="comparison-panel__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="comparison-panel__body">
          {/* Graphiques Radar + Heatmap côte à côte */}
          <div className="comparison-charts-row">
            <div className="comparison-chart-col">
              <RadarChart
                indicators={['Croissance', 'ROE', 'Valorisation', 'Dividende', 'Dette']}
                data={radarData}
                title="Scoring Fondamental"
                height="300px"
              />
            </div>
            <div className="comparison-chart-col">
              <HeatmapChart data={heatmapData} title="Heatmap Comparative" height="300px" />
            </div>
          </div>

          {/* Tableau côte à côte */}
          <div className="comparison-section">
            <h4 className="comparison-section__title">Comparaison Détaillée</h4>
            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Métrique</th>
                    {stocks.map((stock) => (
                      <th key={stock.id}>{stock.ticker}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="metric-label">Prix</td>
                    {stocks.map((s) => (
                      <td key={s.id}>{s.price.toFixed(2)} €</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Capitalisation</td>
                    {stocks.map((s) => (
                      <td key={s.id}>{s.marketCap} Md€</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">P/E</td>
                    {stocks.map((s) => (
                      <td key={s.id}>{s.pe.toFixed(1)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">ROE</td>
                    {stocks.map((s) => (
                      <td key={s.id} className={s.roe > 20 ? 'positive' : ''}>
                        {s.roe.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Croissance CA 5A</td>
                    {stocks.map((s) => (
                      <td key={s.id} className={s.revenue5YGrowth > 30 ? 'positive' : ''}>
                        {s.revenue5YGrowth.toFixed(1)}%
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Cash-Flow</td>
                    {stocks.map((s) => (
                      <td key={s.id} className={s.cashFlow > 0 ? 'positive' : 'negative'}>
                        {(s.cashFlow / 1000).toFixed(1)} Md€
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Dette</td>
                    {stocks.map((s) => (
                      <td key={s.id}>
                        <span className={`trend-badge trend-badge--${s.debtTrend}`}>
                          {s.debtTrend === 'decreasing' ? '↓' : s.debtTrend === 'increasing' ? '↑' : '→'}
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Dividende</td>
                    {stocks.map((s) => (
                      <td key={s.id}>{s.dividendYield.toFixed(2)}%</td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Rating</td>
                    {stocks.map((s) => (
                      <td key={s.id}>
                        <span className={`rating-badge rating-badge--${s.analystRating.toLowerCase().replace(' ', '-')}`}>
                          {s.analystRating}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
