'use client';

import { EventStats } from '@/types/corporate-events';
import { EVENT_COLORS } from '@/core/data/CorporateEventsData';
import PieChart from '@/components/charts/PieChart';
import BarChart from '@/components/charts/BarChart';

interface EventsStatsProps {
  stats: EventStats;
}

export default function EventsStats({ stats }: EventsStatsProps) {
  // Préparer les données pour le pie chart (top 5 types)
  const topEventTypes = Object.entries(stats.eventsByType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({
      name: type,
      value: count,
      color: EVENT_COLORS[type] || '#64748b'
    }));

  // Préparer les données pour le bar chart (top 6 bourses)
  const topExchanges = Object.entries(stats.eventsByExchange)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);
  
  const barChartData = {
    categories: topExchanges.map(([exchange]) => exchange),
    values: topExchanges.map(([, count]) => count)
  };

  return (
    <div className="events-stats">
      {/* KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEvents}</div>
            <div className="stat-label">Événements totaux</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.ipoCount}</div>
            <div className="stat-label">Introductions (IPO)</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.splitCount}</div>
            <div className="stat-label">Splits / Regroupements</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.mergerCount}</div>
            <div className="stat-label">Fusions & Acquisitions</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.delistingCount}</div>
            <div className="stat-label">Radiations</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.exchangesCovered}</div>
            <div className="stat-label">Bourses couvertes</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Pie Chart - Top 5 types d'événements */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top 5 Types d'événements</h3>
          </div>
          <PieChart
            data={topEventTypes}
            title=""
            height="220px"
          />
        </div>

        {/* Bar Chart - Top 6 bourses */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Top 6 Bourses</h3>
          </div>
          <BarChart
            data={barChartData}
            title=""
            height="220px"
            color="#3b82f6"
          />
        </div>

        {/* Timeline sparklines - Par mois */}
        <div className="chart-card full-width">
          <div className="chart-header">
            <h3>Évolution mensuelle</h3>
          </div>
          <div className="sparkline-chart">
            {stats.eventsByMonth && stats.eventsByMonth.length > 0 ? (
              stats.eventsByMonth.map((item, index) => {
                const maxCount = Math.max(...stats.eventsByMonth.map(m => m.count));
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                
                return (
                  <div key={index} className="sparkline-bar">
                    <div className="sparkline-value">{item.count}</div>
                    <div 
                      className="sparkline-fill"
                      style={{ 
                        height: `${Math.max(heightPercent, 5)}%`,
                        backgroundColor: '#10b981'
                      }}
                    />
                    <div className="sparkline-label">{item.month.substring(5)}</div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">Aucune donnée disponible</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
