'use client';

import { useState } from 'react';
import { StockExchange } from '@/types/exchanges';

interface ExchangesFloatingInsightsProps {
  exchanges: StockExchange[];
  allExchanges: StockExchange[];
}

export default function ExchangesFloatingInsights({ exchanges, allExchanges }: ExchangesFloatingInsightsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Générer les insights pour les bourses
  const insights = [];
  
  const highCapExchanges = exchanges.filter((e) => e.totalMarketCap > 50000).length;
  if (highCapExchanges > 0) {
    insights.push({
      type: 'positive',
      text: `${highCapExchanges} bourse${highCapExchanges > 1 ? 's' : ''} de grande capitalisation (> $50B)`,
    });
  }

  const highGrowthExchanges = exchanges.filter((e) => e.ytdReturn > 15).length;
  if (highGrowthExchanges > 0) {
    insights.push({
      type: 'positive',
      text: `${highGrowthExchanges} bourse${highGrowthExchanges > 1 ? 's' : ''} affichent une performance YTD > 15%`,
    });
  }

  const highVolumeExchanges = exchanges.filter((e) => e.dailyVolume > 100).length;
  if (highVolumeExchanges > 0) {
    insights.push({
      type: 'info',
      text: `${highVolumeExchanges} bourse${highVolumeExchanges > 1 ? 's' : ''} avec volume quotidien élevé (> $100M)`,
    });
  }

  const avgListedCompanies = exchanges.reduce((sum, e) => sum + e.listedCompanies, 0) / exchanges.length;
  const allAvgListedCompanies = allExchanges.reduce((sum, e) => sum + e.listedCompanies, 0) / allExchanges.length;
  if (avgListedCompanies > allAvgListedCompanies) {
    insights.push({
      type: 'info',
      text: `Les bourses sélectionnées ont en moyenne plus de sociétés cotées`,
    });
  }

  const emergingExchanges = exchanges.filter((e) => e.marketMaturity.level === 'developing').length;
  if (emergingExchanges > 0) {
    insights.push({
      type: 'neutral',
      text: `${emergingExchanges} marché${emergingExchanges > 1 ? 's en développement' : ' en développement'} avec fort potentiel`,
    });
  }

  const matureExchanges = exchanges.filter((e) => e.marketMaturity.level === 'mature').length;
  if (matureExchanges > 0) {
    insights.push({
      type: 'positive',
      text: `${matureExchanges} marché${matureExchanges > 1 ? 's matures' : ' mature'} et stabilisés`,
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
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
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
            <button onClick={() => setIsOpen(false)} className="close-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="floating-insights-panel__body">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`floating-insight floating-insight--${insight.type}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="floating-insight__icon">
                  {insight.type === 'positive' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                  {insight.type === 'info' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                  )}
                  {insight.type === 'neutral' && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                    </svg>
                  )}
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
