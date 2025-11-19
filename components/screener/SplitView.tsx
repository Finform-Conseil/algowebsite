'use client';

import { useState } from 'react';
import { StockScreenerItem } from '@/core/data/StockScreener';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import HeatmapChart from '@/components/charts/HeatmapChart';
import GaugeChart from '@/components/charts/GaugeChart';

interface SplitViewProps {
  stocks: StockScreenerItem[];
}

export default function SplitView({ stocks }: SplitViewProps) {
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'dividend' | 'heatmap' | 'quality'>('revenue');

  // Données pour les différents graphiques
  const revenueData = {
    categories: stocks.slice(0, 6).map((s) => s.ticker),
    values: stocks.slice(0, 6).map((s) => s.revenue5YGrowth),
  };

  const dividendData = {
    categories: stocks.slice(0, 6).map((s) => s.ticker),
    values: stocks.slice(0, 6).map((s) => s.dividendYield * 10), // Scale up for visibility
  };

  const heatmapData = {
    stocks: stocks.slice(0, 5).map((s) => s.ticker),
    metrics: ['P/E', 'ROE', 'Crois.', 'Div.'],
    values: stocks.slice(0, 5).map((s) => [s.pe, s.roe, s.revenue5YGrowth, s.dividendYield]),
  };

  const avgQualityScore = stocks.reduce((sum, s) => {
    const score =
      (s.roe / 50) * 25 +
      (s.revenue5YGrowth / 100) * 25 +
      (s.debtTrend === 'decreasing' ? 25 : s.debtTrend === 'stable' ? 15 : 5) +
      (s.dividendYield / 10) * 25;
    return sum + score;
  }, 0) / stocks.length;

  return (
    <div className="split-view-charts">
      <div className="split-view-charts__header">
        <h4>Visualisations</h4>
        <div className="chart-selector">
          <button
            className={`chart-selector-btn ${selectedChart === 'revenue' ? 'active' : ''}`}
            onClick={() => setSelectedChart('revenue')}
          >
            CA 5 ans
          </button>
          <button
            className={`chart-selector-btn ${selectedChart === 'dividend' ? 'active' : ''}`}
            onClick={() => setSelectedChart('dividend')}
          >
            Dividendes
          </button>
          <button
            className={`chart-selector-btn ${selectedChart === 'heatmap' ? 'active' : ''}`}
            onClick={() => setSelectedChart('heatmap')}
          >
            Heatmap
          </button>
          <button
            className={`chart-selector-btn ${selectedChart === 'quality' ? 'active' : ''}`}
            onClick={() => setSelectedChart('quality')}
          >
            Qualité
          </button>
        </div>
      </div>

      <div className="split-view-charts__body">
        {selectedChart === 'revenue' && (
          <BarChart data={revenueData} title="Croissance CA 5 ans" height="100%" color="#FF9F04" />
        )}
        {selectedChart === 'dividend' && (
          <BarChart data={dividendData} title="Rendement Dividende (x10)" height="100%" color="#4ade80" />
        )}
        {selectedChart === 'heatmap' && (
          <HeatmapChart data={heatmapData} title="Heatmap des Ratios" height="100%" />
        )}
        {selectedChart === 'quality' && (
          <GaugeChart value={avgQualityScore} title="Score Qualité Moyen" height="100%" />
        )}
      </div>
    </div>
  );
}
