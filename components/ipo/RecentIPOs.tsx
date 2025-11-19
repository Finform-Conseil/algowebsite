'use client';

import { useState } from 'react';
import { IPO } from '@/types/ipo';

interface RecentIPOsProps {
  ipos: IPO[];
}

export default function RecentIPOs({ ipos }: RecentIPOsProps) {
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'return'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIPO, setSelectedIPO] = useState<string | null>(null);

  const sortedIPOs = [...ipos].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.ipoDate).getTime() - new Date(b.ipoDate).getTime();
        break;
      case 'size':
        comparison = a.totalRaisedUSD - b.totalRaisedUSD;
        break;
      case 'return':
        comparison = (a.currentReturn || 0) - (b.currentReturn || 0);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (column: 'date' | 'size' | 'return') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    if (currency === 'XOF') {
      return `${(value / 1000000).toFixed(0)}M XOF`;
    }
    return `${value.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getReturnColor = (returnValue?: number) => {
    if (!returnValue) return '';
    return returnValue >= 0 ? 'positive' : 'negative';
  };

  return (
    <div className="recent-ipos">
      <div className="recent-ipos__header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Introductions Récentes
        </h2>
        <div className="header-actions">
          <span className="count-badge">{ipos.length} IPO</span>
          <button className="btn-export">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exporter
          </button>
        </div>
      </div>

      <div className="recent-ipos__table">
        <table>
          <thead>
            <tr>
              <th className="company">Entreprise</th>
              <th className="sector">Secteur</th>
              <th className="exchange">Bourse</th>
              <th 
                className={`date sortable ${sortBy === 'date' ? 'active' : ''}`}
                onClick={() => handleSort('date')}
              >
                Date IPO
                {sortBy === 'date' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {sortOrder === 'asc' ? (
                      <polyline points="18 15 12 9 6 15" />
                    ) : (
                      <polyline points="6 9 12 15 18 9" />
                    )}
                  </svg>
                )}
              </th>
              <th className="price">Prix IPO</th>
              <th className="current-price">Prix actuel</th>
              <th 
                className={`size sortable ${sortBy === 'size' ? 'active' : ''}`}
                onClick={() => handleSort('size')}
              >
                Montant levé
                {sortBy === 'size' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {sortOrder === 'asc' ? (
                      <polyline points="18 15 12 9 6 15" />
                    ) : (
                      <polyline points="6 9 12 15 18 9" />
                    )}
                  </svg>
                )}
              </th>
              <th 
                className={`return sortable ${sortBy === 'return' ? 'active' : ''}`}
                onClick={() => handleSort('return')}
              >
                Performance
                {sortBy === 'return' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {sortOrder === 'asc' ? (
                      <polyline points="18 15 12 9 6 15" />
                    ) : (
                      <polyline points="6 9 12 15 18 9" />
                    )}
                  </svg>
                )}
              </th>
              <th className="actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedIPOs.map((ipo) => (
              <tr 
                key={ipo.id} 
                className={`ipo-row ${selectedIPO === ipo.id ? 'selected' : ''}`}
                onClick={() => setSelectedIPO(selectedIPO === ipo.id ? null : ipo.id)}
              >
                <td className="company">
                  <div className="company-info">
                    <div className="company-logo">
                      {ipo.companyName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="company-details">
                      <strong>{ipo.companyName}</strong>
                      <span className="ticker">{ipo.ticker}</span>
                    </div>
                  </div>
                </td>
                <td className="sector">
                  <span className="sector-badge">{ipo.sector}</span>
                </td>
                <td className="exchange">
                  <span className="exchange-badge">{ipo.exchange}</span>
                </td>
                <td className="date">{formatDate(ipo.ipoDate)}</td>
                <td className="price">{formatCurrency(ipo.ipoPrice, ipo.currency)}</td>
                <td className="current-price">
                  {ipo.currentPrice ? formatCurrency(ipo.currentPrice, ipo.currency) : '-'}
                </td>
                <td className="size">
                  <div className="size-info">
                    <strong>${(ipo.totalRaisedUSD / 1000000).toFixed(1)}M</strong>
                    <span className="shares">{(ipo.sharesOffered / 1000000).toFixed(1)}M actions</span>
                  </div>
                </td>
                <td className={`return ${getReturnColor(ipo.currentReturn)}`}>
                  {ipo.currentReturn !== undefined ? (
                    <div className="return-info">
                      <span className="return-value">
                        {ipo.currentReturn >= 0 ? '+' : ''}{ipo.currentReturn.toFixed(1)}%
                      </span>
                      {ipo.firstDayReturn !== undefined && (
                        <span className="first-day">J1: {ipo.firstDayReturn >= 0 ? '+' : ''}{ipo.firstDayReturn.toFixed(1)}%</span>
                      )}
                    </div>
                  ) : '-'}
                </td>
                <td className="actions">
                  <button className="btn-icon" title="Voir détails">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                  <button className="btn-icon" title="Ajouter à la watchlist">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Details */}
      {selectedIPO && (() => {
        const ipo = ipos.find(i => i.id === selectedIPO);
        if (!ipo) return null;
        
        return (
          <div className="ipo-details">
            <div className="details-header">
              <h3>{ipo.companyName}</h3>
              <button className="btn-close" onClick={(e) => { e.stopPropagation(); setSelectedIPO(null); }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="details-content">
              <div className="details-section">
                <h4>À propos</h4>
                <p>{ipo.description}</p>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="label">Industrie</span>
                    <span className="value">{ipo.industry}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Siège</span>
                    <span className="value">{ipo.headquarters}</span>
                  </div>
                  {ipo.employees && (
                    <div className="info-item">
                      <span className="label">Employés</span>
                      <span className="value">{ipo.employees.toLocaleString()}</span>
                    </div>
                  )}
                  {ipo.founded && (
                    <div className="info-item">
                      <span className="label">Fondée en</span>
                      <span className="value">{ipo.founded}</span>
                    </div>
                  )}
                </div>
              </div>

              {ipo.highlights && ipo.highlights.length > 0 && (
                <div className="details-section">
                  <h4>Points clés</h4>
                  <ul className="highlights-list">
                    {ipo.highlights.map((highlight, index) => (
                      <li key={index}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {ipo.useOfProceeds && ipo.useOfProceeds.length > 0 && (
                <div className="details-section">
                  <h4>Utilisation des fonds</h4>
                  <ul className="proceeds-list">
                    {ipo.useOfProceeds.map((use, index) => (
                      <li key={index}>{use}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
