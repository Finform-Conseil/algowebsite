'use client';

import { useState } from 'react';
import { StockScreenerItem } from '@/core/data/StockScreener';

interface FloatingInsightsProps {
  stocks: StockScreenerItem[];
  allStocks: StockScreenerItem[];
}

export default function FloatingInsights({ stocks, allStocks }: FloatingInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Générer les insights
  const insights = [];
  
  const highGrowthCount = stocks.filter((s) => s.revenue5YGrowth > 8).length;
  if (highGrowthCount > 0) {
    insights.push({
      type: 'positive',
      text: `${highGrowthCount} action${highGrowthCount > 1 ? 's présentent' : ' présente'} une croissance CA > 8%`,
    });
  }

  const solidFinancesCount = stocks.filter((s) => s.cashFlow > 0 && s.debtTrend !== 'increasing').length;
  if (solidFinancesCount > 0) {
    insights.push({
      type: 'positive',
      text: `${solidFinancesCount} action${solidFinancesCount > 1 ? 's respectent' : ' respecte'} les critères de solidité financière`,
    });
  }

  const highROECount = stocks.filter((s) => s.roe > 20).length;
  if (highROECount > 0) {
    insights.push({
      type: 'positive',
      text: `${highROECount} entreprise${highROECount > 1 ? 's affichent' : ' affiche'} un ROE > 20%`,
    });
  }

  const highDivCount = stocks.filter((s) => s.dividendYield > 2).length;
  if (highDivCount > 0) {
    insights.push({
      type: 'info',
      text: `${highDivCount} action${highDivCount > 1 ? 's offrent' : ' offre'} un rendement dividende > 2%`,
    });
  }

  const avgPE = stocks.reduce((sum, s) => sum + s.pe, 0) / stocks.length;
  const allAvgPE = allStocks.reduce((sum, s) => sum + s.pe, 0) / allStocks.length;
  if (avgPE < allAvgPE) {
    const belowAvgCount = stocks.filter((s) => s.pe < allAvgPE).length;
    insights.push({
      type: 'info',
      text: `${belowAvgCount} action${belowAvgCount > 1 ? 's ont' : ' a'} un P/E inférieur à la moyenne`,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: 'neutral',
      text: 'Aucun insight particulier pour cette sélection',
    });
  }

  return (
    <>
      {/* Floating Button */}
      <button
        className={`floating-insights-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Insights automatiques"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7L12 12L22 7L12 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 17L12 22L22 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M2 12L12 17L22 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {insights.length > 0 && <span className="insights-badge">{insights.length}</span>}
      </button>

      {/* Floating Panel */}
      {isOpen && (
        <div className="floating-insights-panel">
          <div className="floating-insights-panel__header">
            <h4>Insights Automatiques</h4>
            <button onClick={() => setIsOpen(false)} className="close-btn">✕</button>
          </div>
          <div className="floating-insights-panel__body">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`floating-insight floating-insight--${insight.type}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="floating-insight__icon">
                  {insight.type === 'positive' && '✓'}
                  {insight.type === 'info' && 'i'}
                  {insight.type === 'neutral' && '•'}
                </div>
                <div className="floating-insight__text">{insight.text}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
