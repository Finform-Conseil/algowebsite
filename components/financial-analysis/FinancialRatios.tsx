'use client';

import { useState } from 'react';
import { FinancialRatios as RatiosType, CompanyStatistics } from '@/types/financial-analysis';

interface FinancialRatiosProps {
  ratios: RatiosType[];
  statistics: CompanyStatistics;
}

type RatioCategory = 'profitability' | 'liquidity' | 'leverage' | 'efficiency';

export default function FinancialRatios({ ratios, statistics }: FinancialRatiosProps) {
  const [activeCategory, setActiveCategory] = useState<RatioCategory>('profitability');
  const latestRatios = ratios[0];

  const getRatioTrend = (current: number, previous: number) => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'stable';
  };

  const renderProfitability = () => (
    <div className="ratios-grid">
      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">ROE</span>
          <span className={`ratio-trend ${getRatioTrend(latestRatios.returnOnEquity, ratios[1]?.returnOnEquity || 0)}`}>
            {latestRatios.returnOnEquity > (ratios[1]?.returnOnEquity || 0) ? '↑' : '↓'}
          </span>
        </div>
        <div className="ratio-value">{latestRatios.returnOnEquity.toFixed(1)}%</div>
        <div className="ratio-sublabel">Rentabilité capitaux propres</div>
        <div className="ratio-comparison">
          Moy. 3 ans: {statistics.avgROE.toFixed(1)}%
        </div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">ROA</span>
          <span className={`ratio-trend ${getRatioTrend(latestRatios.returnOnAssets, ratios[1]?.returnOnAssets || 0)}`}>
            {latestRatios.returnOnAssets > (ratios[1]?.returnOnAssets || 0) ? '↑' : '↓'}
          </span>
        </div>
        <div className="ratio-value">{latestRatios.returnOnAssets.toFixed(1)}%</div>
        <div className="ratio-sublabel">Rentabilité des actifs</div>
        <div className="ratio-comparison">
          Moy. 3 ans: {statistics.avgROA.toFixed(1)}%
        </div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">ROIC</span>
        </div>
        <div className="ratio-value">{latestRatios.returnOnInvestedCapital.toFixed(1)}%</div>
        <div className="ratio-sublabel">Rentabilité capital investi</div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Marge brute</span>
        </div>
        <div className="ratio-value">{latestRatios.grossMargin.toFixed(1)}%</div>
        <div className="ratio-sublabel">Profitabilité brute</div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Marge opérationnelle</span>
        </div>
        <div className="ratio-value">{latestRatios.operatingMargin.toFixed(1)}%</div>
        <div className="ratio-sublabel">Efficacité opérationnelle</div>
      </div>

      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">Marge nette</span>
        </div>
        <div className="ratio-value">{latestRatios.netMargin.toFixed(1)}%</div>
        <div className="ratio-sublabel">Profitabilité nette</div>
        <div className="ratio-comparison">
          Moy. 3 ans: {statistics.avgNetMargin.toFixed(1)}%
        </div>
      </div>
    </div>
  );

  const renderLiquidity = () => (
    <div className="ratios-grid">
      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">Ratio de liquidité générale</span>
        </div>
        <div className="ratio-value">{latestRatios.currentRatio.toFixed(2)}</div>
        <div className="ratio-sublabel">Actifs / Passifs courants</div>
        <div className="ratio-status">
          {latestRatios.currentRatio >= 1.5 ? '✓ Bonne liquidité' : '⚠ Liquidité faible'}
        </div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Ratio de liquidité réduite</span>
        </div>
        <div className="ratio-value">{latestRatios.quickRatio.toFixed(2)}</div>
        <div className="ratio-sublabel">Quick ratio (sans stocks)</div>
        <div className="ratio-status">
          {latestRatios.quickRatio >= 1.0 ? '✓ Solvable' : '⚠ Attention'}
        </div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Ratio de liquidité immédiate</span>
        </div>
        <div className="ratio-value">{latestRatios.cashRatio.toFixed(2)}</div>
        <div className="ratio-sublabel">Trésorerie / Passifs courants</div>
      </div>
    </div>
  );

  const renderLeverage = () => (
    <div className="ratios-grid">
      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">Dette / Capitaux propres</span>
        </div>
        <div className="ratio-value">{latestRatios.debtToEquity.toFixed(2)}</div>
        <div className="ratio-sublabel">Levier financier</div>
        <div className="ratio-status">
          {latestRatios.debtToEquity <= 1.0 ? '✓ Endettement maîtrisé' : '⚠ Endettement élevé'}
        </div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Dette / Actifs</span>
        </div>
        <div className="ratio-value">{latestRatios.debtToAssets.toFixed(2)}</div>
        <div className="ratio-sublabel">Part de la dette</div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Multiplicateur de capitaux</span>
        </div>
        <div className="ratio-value">{latestRatios.equityMultiplier.toFixed(2)}</div>
        <div className="ratio-sublabel">Actifs / Capitaux propres</div>
      </div>

      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">Couverture des intérêts</span>
        </div>
        <div className="ratio-value">{latestRatios.interestCoverage.toFixed(1)}x</div>
        <div className="ratio-sublabel">Capacité à payer les intérêts</div>
        <div className="ratio-status">
          {latestRatios.interestCoverage >= 5.0 ? '✓ Excellente couverture' : '⚠ Couverture faible'}
        </div>
      </div>
    </div>
  );

  const renderEfficiency = () => (
    <div className="ratios-grid">
      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Rotation des actifs</span>
        </div>
        <div className="ratio-value">{latestRatios.assetTurnover.toFixed(2)}</div>
        <div className="ratio-sublabel">CA / Actifs totaux</div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Rotation des stocks</span>
        </div>
        <div className="ratio-value">{latestRatios.inventoryTurnover.toFixed(1)}x</div>
        <div className="ratio-sublabel">Fois par an</div>
      </div>

      <div className="ratio-card">
        <div className="ratio-header">
          <span className="ratio-label">Rotation des créances</span>
        </div>
        <div className="ratio-value">{latestRatios.receivablesTurnover.toFixed(1)}x</div>
        <div className="ratio-sublabel">Fois par an</div>
      </div>

      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">CA par employé</span>
        </div>
        <div className="ratio-value">{(latestRatios.revenuePerEmployee / 1000000).toFixed(1)}M</div>
        <div className="ratio-sublabel">Productivité</div>
      </div>

      <div className="ratio-card highlight">
        <div className="ratio-header">
          <span className="ratio-label">Bénéfice par employé</span>
        </div>
        <div className="ratio-value">{(latestRatios.netIncomePerEmployee / 1000000).toFixed(1)}M</div>
        <div className="ratio-sublabel">Rentabilité par employé</div>
      </div>
    </div>
  );

  return (
    <div className="financial-ratios">
      <div className="ratios-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Ratios & Statistiques
        </h2>
      </div>

      {/* Category Tabs */}
      <div className="ratios-tabs">
        <button
          className={`tab-btn ${activeCategory === 'profitability' ? 'active' : ''}`}
          onClick={() => setActiveCategory('profitability')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          Rentabilité
        </button>
        <button
          className={`tab-btn ${activeCategory === 'liquidity' ? 'active' : ''}`}
          onClick={() => setActiveCategory('liquidity')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          Liquidité
        </button>
        <button
          className={`tab-btn ${activeCategory === 'leverage' ? 'active' : ''}`}
          onClick={() => setActiveCategory('leverage')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Levier
        </button>
        <button
          className={`tab-btn ${activeCategory === 'efficiency' ? 'active' : ''}`}
          onClick={() => setActiveCategory('efficiency')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Efficacité
        </button>
      </div>

      {/* Content */}
      <div className="ratios-content">
        {activeCategory === 'profitability' && renderProfitability()}
        {activeCategory === 'liquidity' && renderLiquidity()}
        {activeCategory === 'leverage' && renderLeverage()}
        {activeCategory === 'efficiency' && renderEfficiency()}
      </div>

      {/* Statistics Summary */}
      <div className="statistics-summary">
        <h3>Statistiques clés</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Croissance CA (YoY)</span>
            <span className={`stat-value ${statistics.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
              {statistics.revenueGrowth >= 0 ? '+' : ''}{statistics.revenueGrowth.toFixed(1)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Croissance bénéfice (YoY)</span>
            <span className={`stat-value ${statistics.netIncomeGrowth >= 0 ? 'positive' : 'negative'}`}>
              {statistics.netIncomeGrowth >= 0 ? '+' : ''}{statistics.netIncomeGrowth.toFixed(1)}%
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">CAGR 3 ans (CA)</span>
            <span className="stat-value">{statistics.revenueCAGR3Y.toFixed(1)}%</span>
          </div>
          {statistics.vsIndustryROE && (
            <div className="stat-item">
              <span className="stat-label">vs Industrie (ROE)</span>
              <span className={`stat-value ${statistics.vsIndustryROE >= 0 ? 'positive' : 'negative'}`}>
                {statistics.vsIndustryROE >= 0 ? '+' : ''}{statistics.vsIndustryROE.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
