'use client';

import { useState, useMemo } from 'react';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import RadarChart from '@/components/charts/RadarChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import ScatterChart from '@/components/charts/ScatterChart';

interface ComparisonChartsProps {
  stocks: ComparisonStock[];
  indicators: Indicator[];
  syncScales: boolean;
  onToggleSyncScales: () => void;
}

type ChartMode = 'bar' | 'line' | 'radar' | 'heatmap' | 'scatter';

export default function ComparisonCharts({
  stocks,
  indicators,
  syncScales,
  onToggleSyncScales,
}: ComparisonChartsProps) {
  const [chartMode, setChartMode] = useState<ChartMode>('bar');
  const [fullscreen, setFullscreen] = useState(false);

  // Préparer les données pour les graphiques
  const chartData = useMemo(() => {
    if (chartMode === 'bar') {
      // Données pour graphique en barres
      return indicators.map((indicator) => ({
        label: indicator.name,
        data: stocks.map((stock) => ({
          name: stock.ticker,
          value: stock[indicator.field] as number,
        })),
      }));
    } else if (chartMode === 'line') {
      // Données pour graphique en lignes (évolution dans le temps)
      return stocks.map((stock) => ({
        name: stock.ticker,
        data: stock.priceHistory.map((price, index) => ({
          x: `M${index + 1}`,
          y: price,
        })),
      }));
    } else if (chartMode === 'radar') {
      // Données pour radar chart
      return {
        indicators: indicators.map((ind) => ind.name),
        data: stocks.map((stock) => ({
          name: stock.ticker,
          values: indicators.map((ind) => {
            const value = stock[ind.field] as number;
            // Normaliser les valeurs entre 0 et 100 pour le radar
            const max = Math.max(...stocks.map((s) => s[ind.field] as number));
            return (value / max) * 100;
          }),
        })),
      };
    } else if (chartMode === 'heatmap') {
      // Données pour heatmap
      const xAxis = stocks.map((s) => s.ticker);
      const yAxis = indicators.map((ind) => ind.name);
      const data: [number, number, number][] = [];

      stocks.forEach((stock, stockIndex) => {
        indicators.forEach((indicator, indIndex) => {
          const value = stock[indicator.field] as number;
          data.push([stockIndex, indIndex, value]);
        });
      });

      return { xAxis, yAxis, data };
    } else if (chartMode === 'scatter') {
      // Données pour scatter plot (ex: PE vs croissance)
      const xIndicator = indicators[0];
      const yIndicator = indicators[1] || indicators[0];

      return stocks.map((stock) => ({
        name: stock.ticker,
        x: stock[xIndicator?.field] as number,
        y: stock[yIndicator?.field] as number,
      }));
    }

    return null;
  }, [chartMode, stocks, indicators]);

  const chartModes = [
    { id: 'bar', name: 'Barres', icon: '📊' },
    { id: 'line', name: 'Lignes', icon: '📈' },
    { id: 'radar', name: 'Radar', icon: '🕸' },
    { id: 'heatmap', name: 'Heatmap', icon: '🔥' },
    { id: 'scatter', name: 'Dispersion', icon: '🟣' },
  ];

  if (stocks.length === 0 || indicators.length === 0) {
    return (
      <div className="comparison-charts comparison-charts--empty">
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18 17V9" />
            <path d="M13 17V5" />
            <path d="M8 17v-3" />
          </svg>
          <h3>Aucune Donnée à Afficher</h3>
          <p>Sélectionnez au moins 2 actions et 1 indicateur pour commencer la comparaison</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`comparison-charts ${fullscreen ? 'comparison-charts--fullscreen' : ''}`}>
      {/* En-tête */}
      <div className="comparison-charts__header">
        <h3>Console d'Analyse Visuelle</h3>
        <div className="comparison-charts__actions">
          {/* Mode selector */}
          <div className="chart-mode-selector">
            {chartModes.map((mode) => (
              <button
                key={mode.id}
                className={`chart-mode-btn ${chartMode === mode.id ? 'active' : ''}`}
                onClick={() => setChartMode(mode.id as ChartMode)}
                title={mode.name}
              >
                {mode.name}
              </button>
            ))}
          </div>

          {/* Sync scales toggle */}
          <button
            className={`sync-scales-btn ${syncScales ? 'active' : ''}`}
            onClick={onToggleSyncScales}
            title="Synchroniser les échelles"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          {/* Fullscreen toggle */}
          <button
            className="fullscreen-btn"
            onClick={() => setFullscreen(!fullscreen)}
            title={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
          >
            {fullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Zone graphique */}
      <div className="comparison-charts__canvas">
        {chartMode === 'bar' && chartData && Array.isArray(chartData) && (
          <div className="chart-grid">
            {chartData.slice(0, 4).map((indicatorData, index) => {
              const barData = 'data' in indicatorData ? indicatorData.data : [];
              return (
                <div key={index} className="chart-box">
                  <BarChart
                    data={{
                      categories: barData.map((d: any) => d.name || ''),
                      values: barData.map((d: any) => d.value || 0)
                    }}
                    title={'label' in indicatorData ? indicatorData.label : ''}
                    height="280px"
                    color="#00BFFF"
                  />
                </div>
              );
            })}
          </div>
        )}

        {chartMode === 'line' && chartData && Array.isArray(chartData) && (
          <div className="chart-full">
            <LineChart
              data={{
                categories: (chartData[0] && 'data' in chartData[0] && Array.isArray(chartData[0].data)) 
                  ? chartData[0].data.map((d: any) => d.x) 
                  : [],
                series: chartData.map((stock: any) => ({
                  name: stock.name || '',
                  values: (stock && 'data' in stock && Array.isArray(stock.data))
                    ? stock.data.map((d: any) => d.y)
                    : [],
                  color: stock.color
                }))
              }}
              title="Évolution des Prix"
              height="400px"
            />
          </div>
        )}

        {chartMode === 'radar' && chartData && !Array.isArray(chartData) && 'indicators' in chartData && (
          <div className="chart-centered">
            <RadarChart
              indicators={chartData.indicators || []}
              data={(chartData.data as any) || []}
              title="Analyse 360°"
              height="450px"
            />
          </div>
        )}

        {chartMode === 'heatmap' && chartData && !Array.isArray(chartData) && 'xAxis' in chartData && (
          <div className="chart-full">
            <HeatmapChart
              data={(chartData.data as any)}
              title="Intelligence Comparative"
              height="400px"
            />
          </div>
        )}

        {chartMode === 'scatter' && chartData && Array.isArray(chartData) && indicators.length >= 2 && (
          <div className="chart-centered">
            <ScatterChart
              data={(chartData as any)}
              xLabel={indicators[0]?.name || 'X'}
              yLabel={indicators[1]?.name || 'Y'}
              title="Analyse de Dispersion"
              height="450px"
            />
          </div>
        )}
      </div>
    </div>
  );
}
