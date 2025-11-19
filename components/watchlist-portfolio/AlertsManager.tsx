'use client';

import { useState } from 'react';
import { Alert } from '@/types/watchlist-portfolio';
import { getAlertIcon, getAlertColor } from '@/core/data/WatchlistPortfolioData';
import AlertsCalendar from './AlertsCalendar';

interface AlertsManagerProps {
  alerts: Alert[];
  onCreateAlert?: () => void;
  onDeleteAlert?: (alertId: string) => void;
  onToggleAlert?: (alertId: string) => void;
}

export default function AlertsManager({
  alerts,
  onCreateAlert,
  onDeleteAlert,
  onToggleAlert
}: AlertsManagerProps) {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'triggered'>('all');
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);

  const handleAlertSelect = (alert: Alert) => {
    setSelectedAlert(alert.id);
    // Scroll to alert card
    const alertElement = document.getElementById(`alert-${alert.id}`);
    if (alertElement) {
      alertElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (filterStatus === 'all') return true;
    return alert.status === filterStatus;
  });

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const triggeredCount = alerts.filter(a => a.status === 'triggered').length;

  const getAlertTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      price_up: 'Hausse de prix',
      price_down: 'Baisse de prix',
      volume: 'Volume anormal',
      earnings: 'Publication résultats',
      dividend: 'Dividende',
      news: 'Actualité'
    };
    return labels[type] || type;
  };

  return (
    <div className="alerts-manager">
      <div className="alerts-header">
        <div className="header-left">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alertes Intelligentes
          </h2>
          <div className="alert-badges">
            <span className="badge active">{activeCount} actives</span>
            <span className="badge triggered">{triggeredCount} déclenchées</span>
          </div>
        </div>
        <button className="btn-add" onClick={onCreateAlert}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Créer une alerte
        </button>
      </div>

      {/* Filters */}
      <div className="alerts-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          Toutes ({alerts.length})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
          onClick={() => setFilterStatus('active')}
        >
          Actives ({activeCount})
        </button>
        <button
          className={`filter-btn ${filterStatus === 'triggered' ? 'active' : ''}`}
          onClick={() => setFilterStatus('triggered')}
        >
          Déclenchées ({triggeredCount})
        </button>
      </div>

      {/* Alerts Content with Calendar */}
      <div className="alerts-content">
        {/* Alerts List */}
        <div className="alerts-list">
          {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <h3>Aucune alerte</h3>
            <p>Créez votre première alerte pour être notifié des mouvements importants</p>
            <button className="btn-primary" onClick={onCreateAlert}>
              Créer une alerte
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              id={`alert-${alert.id}`}
              className={`alert-card ${alert.status} ${selectedAlert === alert.id ? 'selected' : ''}`}
              style={{ borderLeftColor: getAlertColor(alert.type) }}
            >
              <div className="alert-icon" style={{ backgroundColor: `${getAlertColor(alert.type)}20`, color: getAlertColor(alert.type) }}>
                <span className="icon-emoji">{getAlertIcon(alert.type)}</span>
              </div>

              <div className="alert-content">
                <div className="alert-header-row">
                  <div className="alert-stock">
                    <strong>{alert.companyName}</strong>
                    <span className="ticker">{alert.ticker}</span>
                  </div>
                  <div className="alert-status-badge">
                    {alert.status === 'active' && (
                      <span className="status-active">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10" />
                        </svg>
                        Active
                      </span>
                    )}
                    {alert.status === 'triggered' && (
                      <span className="status-triggered">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Déclenchée
                      </span>
                    )}
                  </div>
                </div>

                <div className="alert-type">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4" />
                    <path d="M12 8h.01" />
                  </svg>
                  {getAlertTypeLabel(alert.type)}
                </div>

                <div className="alert-condition">
                  <code>{alert.condition}</code>
                  {alert.targetValue && (
                    <span className="target-value">
                      → {alert.targetValue.toLocaleString()} XOF
                    </span>
                  )}
                </div>

                <div className="alert-message">{alert.message}</div>

                <div className="alert-footer">
                  <div className="alert-notifications">
                    {alert.notifyEmail && (
                      <span className="notif-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Email
                      </span>
                    )}
                    {alert.notifyPush && (
                      <span className="notif-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        </svg>
                        Push
                      </span>
                    )}
                  </div>
                  <div className="alert-dates">
                    <span className="created-date">
                      Créée le {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                    {alert.triggeredAt && (
                      <span className="triggered-date">
                        Déclenchée le {new Date(alert.triggeredAt).toLocaleDateString('fr-FR')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="alert-actions">
                <button
                  className="btn-icon"
                  title={alert.status === 'active' ? 'Désactiver' : 'Activer'}
                  onClick={() => onToggleAlert?.(alert.id)}
                >
                  {alert.status === 'active' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </button>
                <button
                  className="btn-icon danger"
                  title="Supprimer"
                  onClick={() => onDeleteAlert?.(alert.id)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
        </div>

        {/* Alerts Calendar */}
        <AlertsCalendar
          alerts={alerts}
          onAlertSelect={handleAlertSelect}
          selectedAlertId={selectedAlert || undefined}
        />
      </div>

      {/* Alert Types Info */}
      {filteredAlerts.length > 0 && (
        <div className="alert-types-info">
          <h4>Types d'alertes disponibles</h4>
          <div className="types-grid">
            <div className="type-item">
              <span className="type-icon" style={{ backgroundColor: '#10b98120', color: '#10b981' }}>📈</span>
              <span className="type-label">Hausse de prix</span>
            </div>
            <div className="type-item">
              <span className="type-icon" style={{ backgroundColor: '#ef444420', color: '#ef4444' }}>📉</span>
              <span className="type-label">Baisse de prix</span>
            </div>
            <div className="type-item">
              <span className="type-icon" style={{ backgroundColor: '#3b82f620', color: '#3b82f6' }}>📊</span>
              <span className="type-label">Volume anormal</span>
            </div>
            <div className="type-item">
              <span className="type-icon" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>💰</span>
              <span className="type-label">Résultats</span>
            </div>
            <div className="type-item">
              <span className="type-icon" style={{ backgroundColor: '#8b5cf620', color: '#8b5cf6' }}>💵</span>
              <span className="type-label">Dividende</span>
            </div>
            <div className="type-item">
              <span className="type-icon" style={{ backgroundColor: '#6366f120', color: '#6366f1' }}>📰</span>
              <span className="type-label">Actualité</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
