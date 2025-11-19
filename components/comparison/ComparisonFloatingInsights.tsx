'use client';

import { useState } from 'react';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';
import InsightsPanel from './InsightsPanel';

interface ComparisonFloatingInsightsProps {
  stocks: ComparisonStock[];
  indicators: Indicator[];
}

export default function ComparisonFloatingInsights({ stocks, indicators }: ComparisonFloatingInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <button
        className={`floating-insights-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Insights Automatiques"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        {stocks.length > 0 && (
          <span className="floating-insights-badge">{stocks.length}</span>
        )}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <>
          <div className="floating-insights-overlay" onClick={() => setIsOpen(false)} />
          <div className="floating-insights-panel">
            <div className="floating-insights-header">
              <h3>Insights Automatiques</h3>
              <button className="floating-insights-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>
            <div className="floating-insights-content">
              <InsightsPanel stocks={stocks} indicators={indicators} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
