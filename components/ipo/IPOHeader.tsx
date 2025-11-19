'use client';

import { useState, useEffect } from 'react';
import { IPOStatistics } from '@/types/ipo';

interface IPOHeaderProps {
  statistics: IPOStatistics;
}

export default function IPOHeader({ statistics }: IPOHeaderProps) {
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(2)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="ipo-header">
      <div className="ipo-header__content">
        {/* Title Section */}
        <div className="ipo-header__title">
          <div className="title-content">
            <h1>IPO - Introductions en Bourse</h1>
            <p>Découvrez les nouvelles opportunités d'investissement sur les marchés africains</p>
          </div>
          {/* Quick Insights */}
          <div className="ipo-insights">
            <div className="insight-badge hot">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span>Secteur le plus actif : <strong>{statistics.bySector[0]?.sector || 'N/A'}</strong></span>
            </div>
            <div className="insight-badge trending">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Meilleure bourse : <strong>{statistics.byExchange[0]?.exchange || 'N/A'}</strong></span>
            </div>
            <div className="insight-badge upcoming">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>3 IPO à venir ce mois</span>
            </div>
            <div className="last-update">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Mis à jour : {lastUpdate.toLocaleTimeString('fr-FR')}</span>
            </div>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="ipo-stats">
          <div className="stat-card primary">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Total IPO (5 ans)</span>
              <span className="stat-value">{statistics.totalIPOs}</span>
              <span className="stat-sublabel">Introductions réussies</span>
            </div>
          </div>

          <div className="stat-card success">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Capital levé</span>
              <span className="stat-value">{formatCurrency(statistics.totalRaised)}</span>
              <span className="stat-sublabel">Montant total USD</span>
            </div>
          </div>

          <div className="stat-card info">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Taille moyenne</span>
              <span className="stat-value">{formatCurrency(statistics.averageSize)}</span>
              <span className="stat-sublabel">Par introduction</span>
            </div>
          </div>

          <div className="stat-card warning">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Performance moyenne</span>
              <span className={`stat-value ${statistics.averageReturn >= 0 ? 'positive' : 'negative'}`}>
                {statistics.averageReturn >= 0 ? '+' : ''}{statistics.averageReturn.toFixed(1)}%
              </span>
              <span className="stat-sublabel">Depuis introduction</span>
            </div>
          </div>

          <div className="stat-card accent">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="stat-content">
              <span className="stat-label">Taux de succès</span>
              <span className="stat-value">{statistics.successRate.toFixed(0)}%</span>
              <span className="stat-sublabel">IPO positives</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
