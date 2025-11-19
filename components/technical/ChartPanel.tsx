'use client';

import { useState } from 'react';
import TechnicalChart from './TechnicalChart';
import { Candle, MarketEvent } from '@/core/data/TechnicalAnalysis';

interface ChartPanelProps {
  data: Candle[];
  events: MarketEvent[];
  chartType: 'candles' | 'line' | 'area' | 'bars';
  panelId: number;
}

export default function ChartPanel({ data, events, chartType, panelId }: ChartPanelProps) {
  const [activeIndicators, setActiveIndicators] = useState<string[]>([]);

  const toggleIndicator = (indicatorId: string) => {
    setActiveIndicators((prev) =>
      prev.includes(indicatorId) ? prev.filter((id) => id !== indicatorId) : [...prev, indicatorId]
    );
  };

  return (
    <div className="chart-panel">
      {/* Mini Indicator Bar */}
      <div className="chart-panel__header">
        <div className="chart-panel__indicators">
          <button
            className={`mini-indicator-btn ${activeIndicators.includes('sma20') ? 'active' : ''}`}
            onClick={() => toggleIndicator('sma20')}
            title="SMA 20"
          >
            SMA20
          </button>
          <button
            className={`mini-indicator-btn ${activeIndicators.includes('sma50') ? 'active' : ''}`}
            onClick={() => toggleIndicator('sma50')}
            title="SMA 50"
          >
            SMA50
          </button>
          <button
            className={`mini-indicator-btn ${activeIndicators.includes('rsi') ? 'active' : ''}`}
            onClick={() => toggleIndicator('rsi')}
            title="RSI"
          >
            RSI
          </button>
          <button
            className={`mini-indicator-btn ${activeIndicators.includes('macd') ? 'active' : ''}`}
            onClick={() => toggleIndicator('macd')}
            title="MACD"
          >
            MACD
          </button>
        </div>
        <span className="chart-panel__label">Chart {panelId}</span>
      </div>

      {/* Chart */}
      <TechnicalChart
        data={data}
        events={events}
        indicators={activeIndicators}
        chartType={chartType}
      />
    </div>
  );
}
