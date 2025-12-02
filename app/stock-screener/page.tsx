'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import BarChart from '@/components/charts/BarChart';
import LineChart from '@/components/charts/LineChart';
import PieChart from '@/components/charts/PieChart';
import GaugeChart from '@/components/charts/GaugeChart';
import {
  DUMMY_STOCKS,
  FILTER_CRITERIA,
  getScreenerStats,
  getSectorDistribution,
  getRatingDistribution,
  StockScreenerItem,
  FilterCategory,
} from '@/core/data/StockScreener';

export default function StockScreenerPage() {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory | 'all'>('all');
  const [filters, setFilters] = useState<{ [key: string]: any }>({});
  const [sortField, setSortField] = useState<keyof StockScreenerItem>('marketCap');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filtrage des actions
  const filteredStocks = useMemo(() => {
    let result = [...DUMMY_STOCKS];

    // Appliquer les filtres (logique simplifiée pour la démo)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        // Logique de filtrage simplifiée
      }
    });

    // Tri
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [filters, sortField, sortDirection]);

  const stats = getScreenerStats(filteredStocks);
  const sectorDist = getSectorDistribution(filteredStocks);
  const ratingDist = getRatingDistribution(filteredStocks);

  // Données pour le graphique de croissance
  const revenueGrowthData = {
    categories: filteredStocks.slice(0, 8).map(s => s.ticker),
    values: filteredStocks.slice(0, 8).map(s => s.revenue5YGrowth),
  };

  // Données pour le graphique d'évolution
  const performanceData = {
    categories: ['T1', 'T2', 'T3', 'T4'],
    series: [
      {
        name: 'Moyenne Marché',
        values: [12.5, 14.2, 15.8, 18.3],
        color: '#00BFFF',
      },
      {
        name: 'Sélection',
        values: [15.2, 18.1, 21.5, 24.7],
        color: '#FF9F04',
      },
    ],
  };

  const handleSort = (field: keyof StockScreenerItem) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const categories: FilterCategory[] = ['Valorisation', 'Croissance', 'Rentabilité', 'Solidité Financière', 'Dividendes', 'Technique', 'Sentiment'];

  return (
    <div className="screener-container">
      {/* Header */}
      <div className="screener-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>
              <span className="icon">🔍</span>
              Stock Screener
            </h1>
            <p>Filtrage avancé et analyse de {DUMMY_STOCKS.length} actions avec plus de 18 critères</p>
          </div>
          <Link href="/">
            <button className="btn btn--secondary btn--sm">← Dashboard</button>
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="screener-body">
        {/* Panneau de filtres (gauche) */}
        <div className="filters-panel">
          {/* Filtres rapides */}
          <div className="filter-card">
            <div className="filter-card__title">⚡ Filtres Rapides</div>
            <div className="filter-card__item">
              <label>Préréglages</label>
              <select>
                <option value="">Tous les critères</option>
                <option value="growth">Croissance Durable</option>
                <option value="innovation">Innovation Soutenue</option>
                <option value="financial">Solidité Financière</option>
              </select>
            </div>
            <span className="filter-card__badge">{filteredStocks.length} résultats</span>
          </div>

          {/* Catégories de filtres */}
          <div className="filter-card">
            <div className="filter-card__title">📊 Catégories</div>
            {categories.map(cat => {
              const count = FILTER_CRITERIA.filter(f => f.category === cat).length;
              return (
                <div
                  key={cat}
                  style={{
                    padding: '0.375rem 0.5rem',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    marginBottom: '0.25rem',
                    backgroundColor: selectedCategory === cat ? 'rgba(255, 159, 4, 0.15)' : 'transparent',
                    color: selectedCategory === cat ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  }}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? 'all' : cat)}
                >
                  {cat} ({count})
                </div>
              );
            })}
          </div>

          {/* Filtres de valorisation */}
          <div className="filter-card">
            <div className="filter-card__title">💰 Valorisation</div>
            <div className="filter-card__item">
              <label>P/E Ratio</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <input type="number" placeholder="Min" style={{ width: '50%' }} />
                <input type="number" placeholder="Max" style={{ width: '50%' }} />
              </div>
            </div>
            <div className="filter-card__item">
              <label>Cap. Boursière (Md €)</label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <input type="number" placeholder="Min" style={{ width: '50%' }} />
                <input type="number" placeholder="Max" style={{ width: '50%' }} />
              </div>
            </div>
          </div>

          {/* Filtres de croissance */}
          <div className="filter-card">
            <div className="filter-card__title">📈 Croissance</div>
            <div className="filter-card__item">
              <label>Croissance CA 5 ans (%)</label>
              <input type="number" placeholder="Min" />
            </div>
            <div className="filter-card__item">
              <label>Croissance R&D 3 ans (%)</label>
              <input type="number" placeholder="Min" />
            </div>
          </div>

          {/* Filtres de solidité */}
          <div className="filter-card">
            <div className="filter-card__title">💪 Solidité</div>
            <div className="filter-card__item">
              <label>Tendance Dette</label>
              <select>
                <option value="">Toutes</option>
                <option value="decreasing">En baisse</option>
                <option value="stable">Stable</option>
                <option value="increasing">En hausse</option>
              </select>
            </div>
            <div className="filter-card__item">
              <label>Cash-Flow (M €)</label>
              <input type="number" placeholder="Min" />
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="main-content">
          {/* Stats rapides */}
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-box__label">Actions Filtrées</div>
              <div className="stat-box__value stat-box__value--gold">{filteredStocks.length}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box__label">P/E Moyen</div>
              <div className="stat-box__value">{stats.avgPE.toFixed(1)}</div>
            </div>
            <div className="stat-box">
              <div className="stat-box__label">ROE Moyen</div>
              <div className="stat-box__value stat-box__value--positive">{stats.avgROE.toFixed(1)}%</div>
            </div>
            <div className="stat-box">
              <div className="stat-box__label">Cap. Totale</div>
              <div className="stat-box__value">{(stats.totalMarketCap / 1000).toFixed(1)}T€</div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="charts-grid">
            <div className="chart-box">
              <BarChart
                data={revenueGrowthData}
                title="Croissance CA 5 ans"
                height="190px"
                color="#FF9F04"
              />
            </div>
            <div className="chart-box">
              <PieChart
                data={sectorDist}
                title="Distribution Sectorielle"
                height="190px"
              />
            </div>
            <div className="chart-box">
              <LineChart
                data={performanceData}
                title="Performance Trimestrielle"
                height="190px"
              />
            </div>
          </div>

          {/* Tableau des résultats */}
          <div className="results-table-container">
            <div className="results-table-container__header">
              <h3>Résultats du Screening</h3>
              <span className="count">{filteredStocks.length} actions</span>
            </div>
            <div className="results-table-container__body">
              <table className="screener-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('ticker')}>Ticker</th>
                    <th onClick={() => handleSort('name')}>Nom</th>
                    <th onClick={() => handleSort('sector')}>Secteur</th>
                    <th onClick={() => handleSort('price')}>Prix</th>
                    <th onClick={() => handleSort('changePercent')}>Var %</th>
                    <th onClick={() => handleSort('marketCap')}>Cap. (Md)</th>
                    <th onClick={() => handleSort('pe')}>P/E</th>
                    <th onClick={() => handleSort('roe')}>ROE</th>
                    <th onClick={() => handleSort('revenue5YGrowth')}>Crois. 5A</th>
                    <th onClick={() => handleSort('cashFlow')}>CF (M)</th>
                    <th onClick={() => handleSort('debtTrend')}>Dette</th>
                    <th onClick={() => handleSort('dividendYield')}>Div %</th>
                    <th onClick={() => handleSort('analystRating')}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStocks.map(stock => (
                    <tr key={stock.id}>
                      <td className="ticker">{stock.ticker}</td>
                      <td>{stock.name}</td>
                      <td style={{ fontSize: '0.7rem' }}>{stock.sector}</td>
                      <td>{stock.price.toFixed(2)} €</td>
                      <td className={stock.changePercent >= 0 ? 'positive' : 'negative'}>
                        {stock.changePercent >= 0 ? '▲' : '▼'} {Math.abs(stock.changePercent).toFixed(2)}%
                      </td>
                      <td className="gold">{stock.marketCap}</td>
                      <td>{stock.pe.toFixed(1)}</td>
                      <td className={stock.roe > 20 ? 'positive' : ''}>{stock.roe.toFixed(1)}%</td>
                      <td className={stock.revenue5YGrowth > 30 ? 'positive' : ''}>
                        {stock.revenue5YGrowth.toFixed(1)}%
                      </td>
                      <td className={stock.cashFlow > 0 ? 'positive' : 'negative'}>
                        {(stock.cashFlow / 1000).toFixed(1)}
                      </td>
                      <td>
                        <span className={`trend-badge trend-badge--${stock.debtTrend}`}>
                          {stock.debtTrend === 'decreasing' ? '↓' : stock.debtTrend === 'increasing' ? '↑' : '→'}
                        </span>
                      </td>
                      <td>{stock.dividendYield.toFixed(2)}%</td>
                      <td>
                        <span
                          className={`rating-badge rating-badge--${stock.analystRating
                            .toLowerCase()
                            .replace(' ', '-')}`}
                        >
                          {stock.analystRating}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
