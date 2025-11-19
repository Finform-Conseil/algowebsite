'use client';

import { useMemo } from 'react';
import { StockScreenerItem } from '@/core/data/StockScreener';

interface AutoInsightsProps {
  stocks: StockScreenerItem[];
  allStocks: StockScreenerItem[];
}

export default function AutoInsights({ stocks, allStocks }: AutoInsightsProps) {
  const insights = useMemo(() => {
    const results = [];

    // Croissance CA > 8% sur 5 ans
    const highGrowth = stocks.filter((s) => s.revenue5YGrowth > 8);
    if (highGrowth.length > 0) {
      results.push({
        icon: '📈',
        text: `${highGrowth.length} ${highGrowth.length > 1 ? 'actions présentent' : 'action présente'} une croissance du CA > 8% sur 5 ans`,
        type: 'positive',
      });
    }

    // Solidité financière (cash-flow positif + dette stable/décroissante)
    const solidStocks = stocks.filter(
      (s) => s.cashFlow > 0 && (s.debtTrend === 'stable' || s.debtTrend === 'decreasing')
    );
    if (solidStocks.length > 0) {
      results.push({
        icon: '💪',
        text: `${solidStocks.length} ${solidStocks.length > 1 ? 'actions respectent' : 'action respecte'} les critères de solidité financière`,
        type: 'positive',
      });
    }

    // ROE élevé (> 20%)
    const highROE = stocks.filter((s) => s.roe > 20);
    if (highROE.length > 0) {
      results.push({
        icon: '⚡',
        text: `${highROE.length} ${highROE.length > 1 ? 'entreprises affichent' : 'entreprise affiche'} un ROE > 20%`,
        type: 'positive',
      });
    }

    // Dividendes attractifs (> 2%)
    const highDividend = stocks.filter((s) => s.dividendYield > 2);
    if (highDividend.length > 0) {
      results.push({
        icon: '💰',
        text: `${highDividend.length} ${highDividend.length > 1 ? 'actions offrent' : 'action offre'} un rendement dividende > 2%`,
        type: 'info',
      });
    }

    // P/E inférieur à la moyenne
    const avgPE = allStocks.reduce((sum, s) => sum + s.pe, 0) / allStocks.length;
    const lowPE = stocks.filter((s) => s.pe < avgPE);
    if (lowPE.length > 0 && stocks.length > 0) {
      results.push({
        icon: '🎯',
        text: `${lowPE.length} ${lowPE.length > 1 ? 'actions ont' : 'action a'} un P/E inférieur à la moyenne (${avgPE.toFixed(1)})`,
        type: 'info',
      });
    }

    // Si aucun résultat
    if (results.length === 0 && stocks.length > 0) {
      results.push({
        icon: '🔍',
        text: `${stocks.length} ${stocks.length > 1 ? 'actions correspondent' : 'action correspond'} à vos critères`,
        type: 'neutral',
      });
    }

    return results;
  }, [stocks, allStocks]);

  if (insights.length === 0) return null;

  return (
    <div className="auto-insights">
      <div className="auto-insights__header">
        <h4>💡 Insights Automatiques</h4>
      </div>
      <div className="auto-insights__list">
        {insights.map((insight, index) => (
          <div key={index} className={`auto-insight auto-insight--${insight.type}`}>
            <span className="auto-insight__icon">{insight.icon}</span>
            <span className="auto-insight__text">{insight.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
