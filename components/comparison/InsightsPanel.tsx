'use client';

import { useMemo } from 'react';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';

interface InsightsPanelProps {
  stocks: ComparisonStock[];
  indicators: Indicator[];
}

interface Insight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  message: string;
  stock?: ComparisonStock;
}

export default function InsightsPanel({ stocks, indicators }: InsightsPanelProps) {
  const insights = useMemo(() => {
    const results: Insight[] = [];

    if (stocks.length === 0 || indicators.length === 0) return results;

    // Analyse des marges nettes
    const netMarginIndicator = indicators.find((ind) => ind.id === 'netMargin');
    if (netMarginIndicator) {
      const stocksWithMargins = stocks
        .map((s) => ({ stock: s, margin: s.netMargin }))
        .sort((a, b) => b.margin - a.margin);

      const best = stocksWithMargins[0];
      const avgMargin = stocks.reduce((sum, s) => sum + s.netMargin, 0) / stocks.length;

      if (best && best.margin > avgMargin + 5) {
        results.push({
          type: 'positive',
          message: `${best.stock.ticker} surperforme avec une marge nette de ${best.margin.toFixed(1)}% (${((best.margin - avgMargin)).toFixed(1)}% au-dessus de la moyenne)`,
          stock: best.stock,
        });
      }
    }

    // Analyse des dividendes
    const dividendIndicator = indicators.find((ind) => ind.id === 'dividendYield');
    if (dividendIndicator) {
      const stocksWithDividends = stocks
        .map((s) => ({ stock: s, yield: s.dividendYield }))
        .sort((a, b) => b.yield - a.yield);

      const best = stocksWithDividends[0];
      if (best && best.yield > 5) {
        results.push({
          type: 'positive',
          message: `${best.stock.ticker} offre le meilleur rendement dividende à ${best.yield.toFixed(1)}%`,
          stock: best.stock,
        });
      }
    }

    // Analyse de valorisation (P/E)
    const peIndicator = indicators.find((ind) => ind.id === 'pe');
    if (peIndicator) {
      const stocksWithPE = stocks
        .map((s) => ({ stock: s, pe: s.pe }))
        .sort((a, b) => a.pe - b.pe);

      const avgPE = stocks.reduce((sum, s) => sum + s.pe, 0) / stocks.length;
      const lowest = stocksWithPE[0];
      const highest = stocksWithPE[stocksWithPE.length - 1];

      if (lowest && lowest.pe < avgPE * 0.7) {
        results.push({
          type: 'neutral',
          message: `${lowest.stock.ticker} présente un P/E de ${lowest.pe.toFixed(1)}x, bien inférieur à la moyenne du panel (${avgPE.toFixed(1)}x)`,
          stock: lowest.stock,
        });
      }

      if (highest && highest.pe > avgPE * 1.5) {
        results.push({
          type: 'warning',
          message: `${highest.stock.ticker} apparaît survalorisé avec un P/E de ${highest.pe.toFixed(1)}x vs médiane ${avgPE.toFixed(1)}x`,
          stock: highest.stock,
        });
      }
    }

    // Analyse de la croissance
    const growthIndicator = indicators.find((ind) => ind.id === 'revenueGrowth1Y');
    if (growthIndicator) {
      const stocksWithGrowth = stocks
        .map((s) => ({ stock: s, growth: s.revenueGrowth1Y }))
        .sort((a, b) => b.growth - a.growth);

      const best = stocksWithGrowth[0];
      if (best && best.growth > 15) {
        results.push({
          type: 'positive',
          message: `${best.stock.ticker} affiche une forte croissance de ${best.growth.toFixed(1)}% du CA sur 1 an`,
          stock: best.stock,
        });
      }
    }

    // Analyse de l'endettement
    const debtIndicator = indicators.find((ind) => ind.id === 'debtToEquity');
    if (debtIndicator) {
      const stocksWithDebt = stocks
        .map((s) => ({ stock: s, debt: s.debtToEquity }))
        .sort((a, b) => b.debt - a.debt);

      const highest = stocksWithDebt[0];
      if (highest && highest.debt > 70) {
        results.push({
          type: 'warning',
          message: `${highest.stock.ticker} présente un ratio d'endettement élevé (${highest.debt.toFixed(1)}%)`,
          stock: highest.stock,
        });
      }
    }

    // Analyse ROE
    const roeIndicator = indicators.find((ind) => ind.id === 'roe');
    if (roeIndicator) {
      const stocksWithROE = stocks
        .map((s) => ({ stock: s, roe: s.roe }))
        .sort((a, b) => b.roe - a.roe);

      const best = stocksWithROE[0];
      if (best && best.roe > 20) {
        results.push({
          type: 'positive',
          message: `${best.stock.ticker} démontre une excellente rentabilité avec un ROE de ${best.roe.toFixed(1)}%`,
          stock: best.stock,
        });
      }
    }

    // Performance
    const bestPerformers = stocks
      .filter((s) => s.change1Y > 20)
      .sort((a, b) => b.change1Y - a.change1Y);

    if (bestPerformers.length > 0) {
      const best = bestPerformers[0];
      results.push({
        type: 'positive',
        message: `${best.ticker} enregistre une performance exceptionnelle de +${best.change1Y.toFixed(1)}% sur 1 an`,
        stock: best,
      });
    }

    return results;
  }, [stocks, indicators]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
      case 'negative':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  if (stocks.length === 0) {
    return (
      <div className="insights-panel insights-panel--empty">
        <div className="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <p>Sélectionnez des actions pour voir les insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="insights-panel">
      <div className="insights-panel__header">
        <h3>Insights Automatiques</h3>
        <span className="insights-count">{insights.length}</span>
      </div>

      <div className="insights-panel__body">
        {insights.length === 0 ? (
          <div className="no-insights">
            <p>Aucun insight disponible pour cette sélection</p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <div key={index} className={`insight-item insight-item--${insight.type}`}>
              <div className="insight-item__icon">{getInsightIcon(insight.type)}</div>
              <div className="insight-item__content">
                <p className="insight-item__message">{insight.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
