'use client';

import { useMemo } from 'react';
import RadarChart from '@/components/charts/RadarChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import { ActionEntity } from '@/core/domain/entities/action.entity';
import { useCurrency } from '@/hooks/useCurrency';

interface ComparisonPanelProps {
  stocks: ActionEntity[];
  onClose: () => void;
}

export default function ComparisonPanel({ stocks, onClose }: ComparisonPanelProps) {
  const { format, formatLarge } = useCurrency();
  const radarData = useMemo(() => {
    const colors = ['#00BFFF', '#FF9F04', '#4ade80', '#f87171', '#a78bfa'];
    
    return stocks.map((stock, index) => {
      const revenueGrowth = stock.latest_valuation_ratio?.revenue_growth_3y || 0;
      const roe = stock.latest_valuation_ratio?.roe || 0;
      const pe = stock.latest_valuation_ratio?.pe_ttm || 0;
      const divYield = stock.latest_valuation_ratio?.dividend_yield || 0;
      const debtEquity = stock.latest_valuation_ratio?.debt_equity || 0;
      
      return {
        name: stock.ticker,
        values: [
          Math.min((revenueGrowth / 100) * 100, 100),
          Math.min((roe / 50) * 100, 100),
          Math.min(((50 - pe) / 50) * 100, 100), // Inverse P/E (lower is better)
          divYield * 10, // Scale up
          Math.max(100 - (debtEquity * 10), 0), // Lower debt is better
        ],
        color: colors[index % colors.length],
      };
    });
  }, [stocks]);

  const heatmapData = useMemo(() => {
    return {
      stocks: stocks.map((s) => s.ticker),
      metrics: ['P/E', 'ROE', 'Crois. 3Y', 'Div.', 'RSI'],
      values: stocks.map((s) => [
        s.latest_valuation_ratio?.pe_ttm || 0,
        s.latest_valuation_ratio?.roe || 0,
        s.latest_valuation_ratio?.revenue_growth_3y || 0,
        s.latest_valuation_ratio?.dividend_yield || 0,
        s.latest_technical_indicator?.rsi_14 || 50,
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
                indicators={['Croissance 3Y', 'ROE', 'Valorisation (P/E)', 'Dividende', 'Solidité Fin.']}
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
                      <td key={s.id}>
                        {format(s.latest_price_metric?.price, s.bourse.currency?.code || 'XOF')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">Capitalisation</td>
                    {stocks.map((s) => (
                      <td key={s.id}>
                        {formatLarge(s.latest_valuation_ratio?.market_cap, s.bourse.currency?.code || 'XOF')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">P/E (TTM)</td>
                    {stocks.map((s) => (
                      <td key={s.id}>
                        {s.latest_valuation_ratio?.pe_ttm?.toFixed(1) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">P/B</td>
                    {stocks.map((s) => (
                      <td key={s.id}>
                        {s.latest_valuation_ratio?.pb_ratio?.toFixed(2) || 'N/A'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="metric-label">ROE</td>
                    {stocks.map((s) => {
                      const roe = s.latest_valuation_ratio?.roe;
                      return (
                        <td key={s.id} className={roe && roe > 15 ? 'positive' : ''}>
                          {roe ? `${roe.toFixed(1)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">ROA</td>
                    {stocks.map((s) => {
                      const roa = s.latest_valuation_ratio?.roa;
                      return (
                        <td key={s.id} className={roa && roa > 10 ? 'positive' : ''}>
                          {roa ? `${roa.toFixed(1)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Croissance CA 3Y</td>
                    {stocks.map((s) => {
                      const growth = s.latest_valuation_ratio?.revenue_growth_3y;
                      return (
                        <td key={s.id} className={growth && growth > 20 ? 'positive' : growth && growth < 0 ? 'negative' : ''}>
                          {growth ? `${growth.toFixed(1)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Marge Nette</td>
                    {stocks.map((s) => {
                      const margin = s.latest_valuation_ratio?.net_margin;
                      return (
                        <td key={s.id} className={margin && margin > 15 ? 'positive' : margin && margin < 0 ? 'negative' : ''}>
                          {margin ? `${margin.toFixed(1)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Dette/Equity</td>
                    {stocks.map((s) => {
                      const debtEquity = s.latest_valuation_ratio?.debt_equity;
                      return (
                        <td key={s.id} className={debtEquity && debtEquity < 0.5 ? 'positive' : debtEquity && debtEquity > 2 ? 'negative' : ''}>
                          {debtEquity ? debtEquity.toFixed(2) : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Dividende Yield</td>
                    {stocks.map((s) => {
                      const divYield = s.latest_valuation_ratio?.dividend_yield;
                      return (
                        <td key={s.id} className={divYield && divYield > 3 ? 'positive' : ''}>
                          {divYield ? `${divYield.toFixed(2)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">RSI 14</td>
                    {stocks.map((s) => {
                      const rsi = s.latest_technical_indicator?.rsi_14;
                      return (
                        <td key={s.id} className={rsi && rsi < 30 ? 'positive' : rsi && rsi > 70 ? 'negative' : ''}>
                          {rsi ? rsi.toFixed(1) : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Perf 1M</td>
                    {stocks.map((s) => {
                      const perf = s.latest_price_metric?.change_1m_pct;
                      return (
                        <td key={s.id} className={perf && perf > 0 ? 'positive' : perf && perf < 0 ? 'negative' : ''}>
                          {perf ? `${perf >= 0 ? '+' : ''}${perf.toFixed(2)}%` : 'N/A'}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="metric-label">Beta 5Y</td>
                    {stocks.map((s) => {
                      const beta = s.latest_valuation_ratio?.beta_5y;
                      return (
                        <td key={s.id}>
                          {beta ? beta.toFixed(2) : 'N/A'}
                        </td>
                      );
                    })}
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
