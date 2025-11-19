'use client';

import { useState } from 'react';
import { CorporateEvent } from '@/types/corporate-events';

interface EventsAlertsProps {
  events: CorporateEvent[];
}

export default function EventsAlerts({ events }: EventsAlertsProps) {
  const [alertTypes, setAlertTypes] = useState<string[]>([]);
  const [alertExchanges, setAlertExchanges] = useState<string[]>([]);
  const [minImpact, setMinImpact] = useState<number>(0);
  const [emailNotif, setEmailNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(false);

  const eventTypes = ['IPO', 'Split', 'Merger', 'Acquisition', 'Delisting', 'Bankruptcy', 'Spin-off', 'Dividend'];
  const exchanges = ['BRVM', 'JSE', 'CSE', 'NGX', 'GSE', 'NSE', 'EGX', 'TUNSE'];

  const toggleType = (type: string) => {
    setAlertTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleExchange = (exchange: string) => {
    setAlertExchanges(prev =>
      prev.includes(exchange) ? prev.filter(e => e !== exchange) : [...prev, exchange]
    );
  };

  const handleSaveAlert = () => {
    // Simulation de sauvegarde
    alert('Alerte configurée avec succès !');
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // Simulation d'export
    alert(`Export ${format.toUpperCase()} en cours...`);
  };

  return (
    <div className="events-alerts">
      <div className="alerts-main-content">
        {/* Alert Configuration */}
        <div className="alert-config">
        <h3>Configurer les alertes</h3>
        <p className="section-desc">Recevez des notifications lors de nouveaux événements corporatifs</p>

        {/* Types d'événements */}
        <div className="config-section">
          <label className="section-label">Types d'événements à surveiller</label>
          <div className="checkbox-grid">
            {eventTypes.map(type => (
              <label key={type} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={alertTypes.includes(type)}
                  onChange={() => toggleType(type)}
                />
                <span>{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bourses */}
        <div className="config-section">
          <label className="section-label">Bourses à surveiller</label>
          <div className="checkbox-grid">
            {exchanges.map(exchange => (
              <label key={exchange} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={alertExchanges.includes(exchange)}
                  onChange={() => toggleExchange(exchange)}
                />
                <span>{exchange}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Seuil d'impact */}
        <div className="config-section">
          <label className="section-label">
            Seuil d'impact minimum: {minImpact}%
          </label>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={minImpact}
            onChange={(e) => setMinImpact(Number(e.target.value))}
            className="impact-slider"
          />
          <div className="slider-labels">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
          </div>
        </div>

        {/* Méthodes de notification */}
        <div className="config-section">
          <label className="section-label">Méthodes de notification</label>
          <div className="notification-methods">
            <label className="method-item">
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
              />
              <div className="method-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Email</span>
              </div>
            </label>
            <label className="method-item">
              <input
                type="checkbox"
                checked={pushNotif}
                onChange={(e) => setPushNotif(e.target.checked)}
              />
              <div className="method-content">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span>Notifications Push</span>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button className="btn-save-alert" onClick={handleSaveAlert}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Enregistrer l'alerte
        </button>
      </div>

      {/* Export Section */}
      <div className="export-section">
        <h3>Exporter les données</h3>
        <p className="section-desc">Téléchargez les événements au format PDF ou Excel</p>

        <div className="export-stats">
          <div className="export-stat">
            <div className="stat-value">{events.length}</div>
            <div className="stat-label">Événements à exporter</div>
          </div>
          <div className="export-stat">
            <div className="stat-value">
              {new Set(events.map(e => e.exchange)).size}
            </div>
            <div className="stat-label">Bourses</div>
          </div>
          <div className="export-stat">
            <div className="stat-value">
              {new Set(events.map(e => e.type)).size}
            </div>
            <div className="stat-label">Types</div>
          </div>
        </div>

        <div className="export-buttons">
          <button className="btn-export pdf" onClick={() => handleExport('pdf')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            Exporter en PDF
          </button>
          <button className="btn-export excel" onClick={() => handleExport('excel')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Exporter en Excel
          </button>
        </div>
      </div>
      </div>

      {/* Recent Alerts (Mock) - Sidebar */}
      <div className="alerts-sidebar">
        <div className="recent-alerts">
          <h3>Alertes récentes</h3>
          <div className="alerts-list">
            <div className="alert-item">
              <div className="alert-icon new">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
              </div>
              <div className="alert-content">
                <strong>Nouvelle IPO détectée</strong>
                <span>African Tech Solutions sur JSE</span>
                <span className="alert-time">Il y a 2 heures</span>
              </div>
            </div>
            <div className="alert-item">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
              </div>
              <div className="alert-content">
                <strong>Split d'actions</strong>
                <span>Naspers 5:1 sur JSE</span>
                <span className="alert-time">Il y a 1 jour</span>
              </div>
            </div>
            <div className="alert-item">
              <div className="alert-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                </svg>
              </div>
              <div className="alert-content">
                <strong>Fusion annoncée</strong>
                <span>BICICI et Société Générale CI sur BRVM</span>
                <span className="alert-time">Il y a 3 jours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
