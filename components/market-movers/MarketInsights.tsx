'use client';

import { MarketInsight } from '@/types/market-movers';

interface MarketInsightsProps {
  insights: MarketInsight[];
}

export default function MarketInsights({ insights }: MarketInsightsProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'danger': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  const renderIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      'trending-up': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      'trending-down': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
          <polyline points="17 18 23 18 23 12" />
        </svg>
      ),
      'bar-chart': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10" />
          <line x1="18" y1="20" x2="18" y2="4" />
          <line x1="6" y1="20" x2="6" y2="16" />
        </svg>
      ),
      'activity': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      'alert-triangle': (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      )
    };
    return icons[iconName] || icons['activity'];
  };

  return (
    <div className="market-insights">
      <div className="market-insights__header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
          Insights & Alertes
        </h2>
      </div>

      <div className="market-insights__content">
        {/* Insights Cards */}
        <div className="insights-grid">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className={`insight-card ${insight.severity}`}
              style={{ borderLeftColor: getSeverityColor(insight.severity) }}
            >
              <div className="insight-icon" style={{ color: getSeverityColor(insight.severity) }}>
                {renderIcon(insight.icon)}
              </div>
              <div className="insight-content">
                <h4>{insight.title}</h4>
                <p>{insight.description}</p>
              </div>
              <div className="insight-badge" style={{ backgroundColor: getSeverityColor(insight.severity) }}>
                {insight.type}
              </div>
            </div>
          ))}
        </div>

        {/* Summary Badges */}
        <div className="summary-badges">
          {insights.map((insight) => {
            if (insight.id === 'leader' && insight.data) {
              return (
                <div key="leader-badge" className="badge-card leader">
                  <div className="badge-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  </div>
                  <div className="badge-content">
                    <span className="badge-label">Leader du jour</span>
                    <span className="badge-value">{insight.data.ticker}</span>
                    <span className="badge-change positive">+{insight.data.change.toFixed(2)}%</span>
                  </div>
                </div>
              );
            }
            
            if (insight.id === 'flop' && insight.data) {
              return (
                <div key="flop-badge" className="badge-card flop">
                  <div className="badge-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                      <polyline points="17 18 23 18 23 12" />
                    </svg>
                  </div>
                  <div className="badge-content">
                    <span className="badge-label">Flop du jour</span>
                    <span className="badge-value">{insight.data.ticker}</span>
                    <span className="badge-change negative">{insight.data.change.toFixed(2)}%</span>
                  </div>
                </div>
              );
            }
            
            if (insight.id === 'sector' && insight.data) {
              return (
                <div key="sector-badge" className="badge-card sector">
                  <div className="badge-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="20" x2="12" y2="10" />
                      <line x1="18" y1="20" x2="18" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="16" />
                    </svg>
                  </div>
                  <div className="badge-content">
                    <span className="badge-label">Secteur performant</span>
                    <span className="badge-value">{insight.data.sector}</span>
                    <span className="badge-change positive">+{insight.data.avg.toFixed(2)}%</span>
                  </div>
                </div>
              );
            }
            
            return null;
          })}
        </div>

        {/* Custom Alerts Configuration */}
        <div className="alerts-config">
          <h3>Configurer vos alertes</h3>
          <div className="alerts-form">
            <div className="form-row">
              <div className="form-group">
                <label>Hausse supérieure à</label>
                <div className="input-with-unit">
                  <input type="number" placeholder="5" defaultValue="5" />
                  <span className="unit">%</span>
                </div>
              </div>
              <div className="form-group">
                <label>Baisse supérieure à</label>
                <div className="input-with-unit">
                  <input type="number" placeholder="5" defaultValue="5" />
                  <span className="unit">%</span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Volume supérieur à</label>
                <div className="input-with-unit">
                  <input type="number" placeholder="2" defaultValue="2" />
                  <span className="unit">x moyenne</span>
                </div>
              </div>
              <div className="form-group">
                <label>Notification par</label>
                <select>
                  <option>Email</option>
                  <option>SMS</option>
                  <option>Push</option>
                  <option>Tous</option>
                </select>
              </div>
            </div>

            <button className="btn-save-alerts">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Enregistrer les alertes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
