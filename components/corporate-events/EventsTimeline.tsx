'use client';

import { useState } from 'react';
import { CorporateEvent } from '@/types/corporate-events';
import { EVENT_COLORS, EVENT_ICONS } from '@/core/data/CorporateEventsData';
import EventsCalendar from './EventsCalendar';

interface EventsTimelineProps {
  events: CorporateEvent[];
}

export default function EventsTimeline({ events }: EventsTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<CorporateEvent | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const handleEventSelect = (event: CorporateEvent) => {
    setSelectedEvent(event);
    // Scroll vers l'événement si possible
    const eventElement = document.getElementById(`event-${event.id}`);
    if (eventElement) {
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Trier les événements par date (plus récent en premier)
  const sortedEvents = [...events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Grouper par année
  const eventsByYear = sortedEvents.reduce((acc, event) => {
    const year = new Date(event.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(event);
    return acc;
  }, {} as Record<number, CorporateEvent[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const renderIcon = (type: string) => {
    const iconName = EVENT_ICONS[type] || 'circle';
    const icons: Record<string, JSX.Element> = {
      'trending-up': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      'git-branch': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="6" y1="3" x2="6" y2="15" />
          <circle cx="18" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <path d="M18 9a9 9 0 0 1-9 9" />
        </svg>
      ),
      'git-merge': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M6 21V9a9 9 0 0 0 9 9" />
        </svg>
      ),
      'git-pull-request': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="18" r="3" />
          <circle cx="6" cy="6" r="3" />
          <path d="M13 6h3a2 2 0 0 1 2 2v7" />
          <line x1="6" y1="9" x2="6" y2="21" />
        </svg>
      ),
      'shopping-cart': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
      ),
      'x-circle': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
      'alert-triangle': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
      'scissors': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <line x1="20" y1="4" x2="8.12" y2="15.88" />
          <line x1="14.47" y1="14.48" x2="20" y2="20" />
          <line x1="8.12" y1="8.12" x2="12" y2="12" />
        </svg>
      ),
      'dollar-sign': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
      'plus-circle': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      ),
      'arrow-down-circle': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="8 12 12 16 16 12" />
          <line x1="12" y1="8" x2="12" y2="16" />
        </svg>
      ),
      'circle': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
        </svg>
      )
    };
    return icons[iconName] || icons['circle'];
  };

  return (
    <div className="events-timeline-wrapper">
      {/* Timeline Content */}
      <div className="events-timeline">
        {/* View Mode Toggle */}
        <div className="timeline-controls">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Timeline
          </button>
          <button
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Liste
          </button>
        </div>
        <div className="timeline-info">
          <span>{events.length} événement{events.length > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div className="timeline-view">
          {Object.entries(eventsByYear).map(([year, yearEvents]) => (
            <div key={year} className="timeline-year">
              <div className="year-header">
                <h3>{year}</h3>
                <span className="year-count">{yearEvents.length} événement{yearEvents.length > 1 ? 's' : ''}</span>
              </div>
              <div className="timeline-events">
                {yearEvents.map((event) => (
                  <div
                    key={event.id}
                    id={`event-${event.id}`}
                    className={`timeline-event ${selectedEvent?.id === event.id ? 'selected' : ''} ${event.importance}`}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="event-line" />
                    <div 
                      className="event-marker"
                      style={{ backgroundColor: EVENT_COLORS[event.type] }}
                    >
                      {renderIcon(event.type)}
                    </div>
                    <div className="event-content">
                      <div className="event-header">
                        <span className="event-date">{formatDate(event.date)}</span>
                        <span 
                          className="event-type"
                          style={{ color: EVENT_COLORS[event.type] }}
                        >
                          {event.type}
                        </span>
                      </div>
                      <h4 className="event-title">{event.title}</h4>
                      <p className="event-description">{event.description}</p>
                      <div className="event-meta">
                        <span className="event-company">{event.companyName}</span>
                        <span className="event-exchange">{event.exchange}</span>
                        {event.priceImpact && (
                          <span 
                            className={`event-impact ${event.priceImpact.percentChange >= 0 ? 'positive' : 'negative'}`}
                          >
                            {event.priceImpact.percentChange >= 0 ? '+' : ''}
                            {event.priceImpact.percentChange.toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="list-view">
          {sortedEvents.map((event) => (
            <div
              key={event.id}
              id={`event-${event.id}`}
              className={`list-event ${selectedEvent?.id === event.id ? 'selected' : ''}`}
              onClick={() => setSelectedEvent(event)}
            >
              <div 
                className="list-event-icon"
                style={{ backgroundColor: EVENT_COLORS[event.type] }}
              >
                {renderIcon(event.type)}
              </div>
              <div className="list-event-content">
                <div className="list-event-header">
                  <h4>{event.title}</h4>
                  <span className="list-event-date">{formatDate(event.date)}</span>
                </div>
                <p className="list-event-description">{event.description}</p>
                <div className="list-event-meta">
                  <span className="meta-item">
                    <strong>{event.companyName}</strong> ({event.companyTicker})
                  </span>
                  <span className="meta-item">{event.exchange}</span>
                  <span 
                    className="meta-item type"
                    style={{ color: EVENT_COLORS[event.type] }}
                  >
                    {event.type}
                  </span>
                  {event.priceImpact && (
                    <span 
                      className={`meta-item impact ${event.priceImpact.percentChange >= 0 ? 'positive' : 'negative'}`}
                    >
                      Impact: {event.priceImpact.percentChange >= 0 ? '+' : ''}
                      {event.priceImpact.percentChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

        {/* No events message */}
        {events.length === 0 && (
          <div className="no-events">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>Aucun événement trouvé</p>
            <span>Essayez de modifier vos filtres</span>
          </div>
        )}
      </div>

      {/* Calendar Sidebar */}
      <EventsCalendar 
        events={events} 
        onEventSelect={handleEventSelect}
        selectedEventId={selectedEvent?.id}
      />
    </div>
  );
}
