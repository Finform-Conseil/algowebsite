'use client';

import { useState, useMemo } from 'react';
import { CorporateEvent } from '@/types/corporate-events';
import { EVENT_COLORS } from '@/core/data/CorporateEventsData';

interface EventsTableProps {
  events: CorporateEvent[];
}

type SortField = 'date' | 'type' | 'company' | 'exchange' | 'impact';
type SortDirection = 'asc' | 'desc';

export default function EventsTable({ events }: EventsTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer et trier les événements
  const processedEvents = useMemo(() => {
    let filtered = events;

    // Recherche
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Tri
    return [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'company':
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case 'exchange':
          comparison = a.exchange.localeCompare(b.exchange);
          break;
        case 'impact':
          const impactA = a.priceImpact?.percentChange || 0;
          const impactB = b.priceImpact?.percentChange || 0;
          comparison = impactA - impactB;
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [events, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" opacity="0.3">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      );
    }

    return sortDirection === 'asc' ? (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M19 12l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="events-table">
      {/* Search Bar */}
      <div className="table-controls">
        <div className="search-bar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un événement, une entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
        <div className="table-info">
          <span>{processedEvents.length} événement{processedEvents.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                <div className="th-content">
                  Date
                  {renderSortIcon('date')}
                </div>
              </th>
              <th onClick={() => handleSort('type')} className="sortable">
                <div className="th-content">
                  Type
                  {renderSortIcon('type')}
                </div>
              </th>
              <th>Événement</th>
              <th onClick={() => handleSort('company')} className="sortable">
                <div className="th-content">
                  Entreprise
                  {renderSortIcon('company')}
                </div>
              </th>
              <th onClick={() => handleSort('exchange')} className="sortable">
                <div className="th-content">
                  Bourse
                  {renderSortIcon('exchange')}
                </div>
              </th>
              <th onClick={() => handleSort('impact')} className="sortable">
                <div className="th-content">
                  Impact
                  {renderSortIcon('impact')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {processedEvents.map((event) => (
              <tr key={event.id}>
                <td className="date-cell">{formatDate(event.date)}</td>
                <td>
                  <span 
                    className="type-badge"
                    style={{ 
                      backgroundColor: `${EVENT_COLORS[event.type]}20`,
                      color: EVENT_COLORS[event.type]
                    }}
                  >
                    {event.type}
                  </span>
                </td>
                <td className="event-cell">
                  <div className="event-info">
                    <strong>{event.title}</strong>
                    <span className="event-desc">{event.description}</span>
                  </div>
                </td>
                <td>
                  <div className="company-info">
                    <strong>{event.companyName}</strong>
                    <span className="ticker">{event.companyTicker}</span>
                  </div>
                </td>
                <td>
                  <span className="exchange-badge">{event.exchange}</span>
                </td>
                <td>
                  {event.priceImpact ? (
                    <span 
                      className={`impact-value ${event.priceImpact.percentChange >= 0 ? 'positive' : 'negative'}`}
                    >
                      {event.priceImpact.percentChange >= 0 ? '+' : ''}
                      {event.priceImpact.percentChange.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="no-data">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {processedEvents.length === 0 && (
          <div className="no-results">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <p>Aucun résultat trouvé</p>
            <span>Essayez une autre recherche</span>
          </div>
        )}
      </div>
    </div>
  );
}
