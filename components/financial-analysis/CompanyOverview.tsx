'use client';

import { CompanyProfile, FinancialRatios } from '@/types/financial-analysis';
import { formatCurrency } from '@/core/data/FinancialData';

interface CompanyOverviewProps {
  profile: CompanyProfile;
  latestRatios: FinancialRatios;
}

export default function CompanyOverview({ profile, latestRatios }: CompanyOverviewProps) {
  const formatMarketCap = (value: number) => {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}T`;
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B`;
    }
    return `${(value / 1000000).toFixed(2)}M`;
  };

  return (
    <div className="company-overview">
      {/* Header Card */}
      <div className="overview-header">
        <div className="company-identity">
          <div className="company-logo">
            {profile.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="company-info">
            <h1>{profile.name}</h1>
            <div className="company-meta">
              <span className="ticker">{profile.ticker}</span>
              <span className="separator">•</span>
              <span className="exchange">{profile.exchange}</span>
              <span className="separator">•</span>
              <span className="sector">{profile.sector}</span>
            </div>
          </div>
        </div>

        <div className="company-actions">
          <button className="btn-action">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            Suivre
          </button>
          <button className="btn-action">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="key-metrics">
        <div className="metric-card primary">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">Capitalisation</span>
            <span className="metric-value">{formatMarketCap(profile.marketCap)} {profile.currency}</span>
            <span className="metric-sublabel">{profile.sharesOutstanding.toLocaleString()} actions</span>
          </div>
        </div>

        <div className="metric-card success">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">ROE</span>
            <span className="metric-value">{latestRatios.returnOnEquity.toFixed(1)}%</span>
            <span className="metric-sublabel">Rentabilité capitaux propres</span>
          </div>
        </div>

        <div className="metric-card info">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">Marge nette</span>
            <span className="metric-value">{latestRatios.netMargin.toFixed(1)}%</span>
            <span className="metric-sublabel">Profitabilité</span>
          </div>
        </div>

        <div className="metric-card warning">
          <div className="metric-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="metric-content">
            <span className="metric-label">Employés</span>
            <span className="metric-value">{profile.employees.toLocaleString()}</span>
            <span className="metric-sublabel">{(latestRatios.revenuePerEmployee / 1000000).toFixed(1)}M XOF/employé</span>
          </div>
        </div>
      </div>

      {/* Company Details */}
      <div className="company-details">
        <div className="details-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Informations générales
          </h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Industrie</span>
              <span className="detail-value">{profile.industry}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Siège social</span>
              <span className="detail-value">{profile.headquarters}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Fondée en</span>
              <span className="detail-value">{profile.founded}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Site web</span>
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="detail-link">
                {profile.website.replace('https://', '')}
              </a>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Direction
          </h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">CEO</span>
              <span className="detail-value">{profile.ceo}</span>
            </div>
            {profile.cfo && (
              <div className="detail-item">
                <span className="detail-label">CFO</span>
                <span className="detail-value">{profile.cfo}</span>
              </div>
            )}
            {profile.chairman && (
              <div className="detail-item">
                <span className="detail-label">Président</span>
                <span className="detail-value">{profile.chairman}</span>
              </div>
            )}
          </div>
        </div>

        {profile.ipoDate && (
          <div className="details-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              Historique boursier
            </h3>
            <div className="details-grid">
              <div className="detail-item">
                <span className="detail-label">Date d'introduction</span>
                <span className="detail-value">
                  {new Date(profile.ipoDate).toLocaleDateString('fr-FR')}
                </span>
              </div>
              {profile.ipoPrice && (
                <div className="detail-item">
                  <span className="detail-label">Prix d'introduction</span>
                  <span className="detail-value">{profile.ipoPrice.toLocaleString()} {profile.currency}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {(profile.parentCompany || (profile.subsidiaries && profile.subsidiaries.length > 0)) && (
          <div className="details-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 17V9" />
                <path d="M13 17V5" />
                <path d="M8 17v-3" />
              </svg>
              Structure du groupe
            </h3>
            <div className="details-grid">
              {profile.parentCompany && (
                <div className="detail-item">
                  <span className="detail-label">Société mère</span>
                  <span className="detail-value">{profile.parentCompany}</span>
                </div>
              )}
              {profile.subsidiaries && profile.subsidiaries.length > 0 && (
                <div className="detail-item full-width">
                  <span className="detail-label">Filiales</span>
                  <div className="subsidiaries-list">
                    {profile.subsidiaries.map((sub, index) => (
                      <span key={index} className="subsidiary-badge">{sub}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="company-description">
        <h3>À propos de {profile.name}</h3>
        <p>{profile.description}</p>
      </div>
    </div>
  );
}
