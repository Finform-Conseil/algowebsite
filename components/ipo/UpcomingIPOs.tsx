'use client';

import { useState } from 'react';
import { UpcomingIPO } from '@/types/ipo';
import IPOCalendar from './IPOCalendar';

interface UpcomingIPOsProps {
  ipos: UpcomingIPO[];
}

export default function UpcomingIPOs({ ipos }: UpcomingIPOsProps) {
  const [selectedIPO, setSelectedIPO] = useState<string | null>(null);

  const handleIPOSelect = (ipo: UpcomingIPO) => {
    setSelectedIPO(ipo.id);
    // Scroll to the IPO in the timeline
    const element = document.getElementById(`ipo-${ipo.id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(2)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    return `$${value.toFixed(0)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (status?: 'not_started' | 'open' | 'closed' | 'oversubscribed') => {
    switch (status) {
      case 'open':
        return <span className="status-badge open">Souscription ouverte</span>;
      case 'oversubscribed':
        return <span className="status-badge oversubscribed">Sursouscrite</span>;
      case 'closed':
        return <span className="status-badge closed">Souscription fermée</span>;
      default:
        return <span className="status-badge upcoming">À venir</span>;
    }
  };

  const getDaysUntilColor = (days: number) => {
    if (days <= 7) return 'urgent';
    if (days <= 30) return 'soon';
    return 'later';
  };

  return (
    <div className="upcoming-ipos">
      <div className="upcoming-ipos__header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          Prochaines Introductions
        </h2>
        <span className="count-badge">{ipos.length} IPO à venir</span>
      </div>

      <div className="upcoming-ipos__content">
        {/* Timeline */}
        <div className="upcoming-ipos__timeline">
        {ipos.map((ipo) => (
          <div 
            key={ipo.id}
            id={`ipo-${ipo.id}`}
            className={`timeline-item ${selectedIPO === ipo.id ? 'expanded' : ''}`}
            onClick={() => setSelectedIPO(selectedIPO === ipo.id ? null : ipo.id)}
          >
            <div className="timeline-marker">
              <div className={`marker-dot ${getDaysUntilColor(ipo.daysUntilIPO)}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="marker-line"></div>
            </div>

            <div className="timeline-content">
              <div className="timeline-card">
                <div className="card-header">
                  <div className="company-info">
                    <div className="company-logo">
                      {ipo.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="company-details">
                      <h3>{ipo.companyName}</h3>
                      <div className="company-meta">
                        <span className="ticker">{ipo.ticker}</span>
                        <span className="separator">•</span>
                        <span className="sector">{ipo.sector}</span>
                        <span className="separator">•</span>
                        <span className="exchange">{ipo.exchange}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-actions">
                    {getStatusBadge(ipo.subscriptionStatus)}
                    <div className={`days-until ${getDaysUntilColor(ipo.daysUntilIPO)}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      {ipo.daysUntilIPO} jours
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="ipo-metrics">
                    <div className="metric">
                      <span className="metric-label">Date IPO</span>
                      <span className="metric-value">{formatDate(ipo.expectedDate)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Fourchette de prix</span>
                      <span className="metric-value">
                        {ipo.priceRange 
                          ? `${ipo.priceRange.min} - ${ipo.priceRange.max} ${ipo.currency}`
                          : `${ipo.ipoPrice} ${ipo.currency}`
                        }
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Montant levé</span>
                      <span className="metric-value highlighted">{formatCurrency(ipo.totalRaisedUSD)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Actions offertes</span>
                      <span className="metric-value">{(ipo.sharesOffered / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>

                  {ipo.subscriptionStatus === 'oversubscribed' && ipo.subscriptionMultiple && (
                    <div className="subscription-alert">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <span>Sursouscrite {ipo.subscriptionMultiple}x</span>
                    </div>
                  )}

                  {selectedIPO === ipo.id && (
                    <div className="expanded-details">
                      <div className="details-section">
                        <h4>Description</h4>
                        <p>{ipo.description}</p>
                      </div>

                      {ipo.bookBuildingStart && ipo.bookBuildingEnd && (
                        <div className="details-section">
                          <h4>Calendrier de souscription</h4>
                          <div className="timeline-dates">
                            <div className="date-item">
                              <span className="date-label">Début book-building</span>
                              <span className="date-value">{formatDate(ipo.bookBuildingStart)}</span>
                            </div>
                            <div className="date-item">
                              <span className="date-label">Fin book-building</span>
                              <span className="date-value">{formatDate(ipo.bookBuildingEnd)}</span>
                            </div>
                            {ipo.allotmentDate && (
                              <div className="date-item">
                                <span className="date-label">Attribution</span>
                                <span className="date-value">{formatDate(ipo.allotmentDate)}</span>
                              </div>
                            )}
                            <div className="date-item">
                              <span className="date-label">Cotation</span>
                              <span className="date-value">{formatDate(ipo.listingDate || ipo.expectedDate)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {ipo.underwriters && ipo.underwriters.length > 0 && (
                        <div className="details-section">
                          <h4>Souscripteurs</h4>
                          <div className="underwriters-list">
                            {ipo.underwriters.map((underwriter, index) => (
                              <span key={index} className="underwriter-badge">{underwriter}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {ipo.useOfProceeds && ipo.useOfProceeds.length > 0 && (
                        <div className="details-section">
                          <h4>Utilisation des fonds</h4>
                          <ul className="proceeds-list">
                            {ipo.useOfProceeds.map((use, index) => (
                              <li key={index}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="9 11 12 14 22 4" />
                                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                                </svg>
                                {use}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="details-actions">
                        {ipo.prospectusUrl && (
                          <a href={ipo.prospectusUrl} className="btn-link" target="_blank" rel="noopener noreferrer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Prospectus
                          </a>
                        )}
                        {ipo.pressReleaseUrl && (
                          <a href={ipo.pressReleaseUrl} className="btn-link" target="_blank" rel="noopener noreferrer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            Communiqué
                          </a>
                        )}
                        <button className="btn-primary">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                          </svg>
                          Suivre cette IPO
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>

        {/* Calendar */}
        <IPOCalendar 
          ipos={ipos} 
          onIPOSelect={handleIPOSelect}
          selectedIPOId={selectedIPO || undefined}
        />
      </div>
    </div>
  );
}
