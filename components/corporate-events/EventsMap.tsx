'use client';

import { useMemo } from 'react';
import { CorporateEvent } from '@/types/corporate-events';
import { EVENT_COLORS } from '@/core/data/CorporateEventsData';

interface EventsMapProps {
  events: CorporateEvent[];
}

// Coordonnées approximatives des bourses africaines
const EXCHANGE_LOCATIONS: Record<string, { lat: number; lng: number; country: string }> = {
  'BRVM': { lat: 5.3600, lng: -4.0083, country: 'Côte d\'Ivoire' },
  'JSE': { lat: -26.2041, lng: 28.0473, country: 'Afrique du Sud' },
  'CSE': { lat: 30.0444, lng: 31.2357, country: 'Égypte' },
  'NGX': { lat: 6.5244, lng: 3.3792, country: 'Nigeria' },
  'GSE': { lat: 5.6037, lng: -0.1870, country: 'Ghana' },
  'NSE': { lat: -1.2864, lng: 36.8172, country: 'Kenya' },
  'EGX': { lat: 30.0444, lng: 31.2357, country: 'Égypte' },
  'TUNSE': { lat: 36.8065, lng: 10.1815, country: 'Tunisie' }
};

export default function EventsMap({ events }: EventsMapProps) {
  // Grouper les événements par bourse
  const eventsByExchange = useMemo(() => {
    const grouped: Record<string, CorporateEvent[]> = {};
    events.forEach(event => {
      if (!grouped[event.exchange]) {
        grouped[event.exchange] = [];
      }
      grouped[event.exchange].push(event);
    });
    return grouped;
  }, [events]);

  // Statistiques par bourse
  const exchangeStats = useMemo(() => {
    return Object.entries(eventsByExchange).map(([exchange, exEvents]) => {
      const typeCount: Record<string, number> = {};
      exEvents.forEach(e => {
        typeCount[e.type] = (typeCount[e.type] || 0) + 1;
      });

      const topType = Object.entries(typeCount)
        .sort(([, a], [, b]) => b - a)[0];

      return {
        exchange,
        count: exEvents.length,
        location: EXCHANGE_LOCATIONS[exchange],
        topType: topType ? topType[0] : null,
        topTypeCount: topType ? topType[1] : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [eventsByExchange]);

  return (
    <div className="events-map">
      {/* Map Visualization (Simplified) */}
      <div className="map-container">
        <div className="map-grid">
          {exchangeStats.map((stat) => (
            <div 
              key={stat.exchange}
              className="map-marker"
              style={{
                '--marker-size': `${Math.min(stat.count * 10 + 40, 120)}px`
              } as React.CSSProperties}
            >
              <div className="marker-circle">
                <div className="marker-count">{stat.count}</div>
              </div>
              <div className="marker-label">
                <strong>{stat.exchange}</strong>
                <span>{stat.location?.country}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Exchange Details */}
      <div className="exchange-details">
        <h3>Détails par bourse</h3>
        <div className="details-grid">
          {exchangeStats.map((stat) => (
            <div key={stat.exchange} className="detail-card">
              <div className="detail-header">
                <div className="exchange-name">
                  <strong>{stat.exchange}</strong>
                  <span>{stat.location?.country}</span>
                </div>
                <div className="event-count">{stat.count}</div>
              </div>
              {stat.topType && (
                <div className="top-type">
                  <span>Type principal:</span>
                  <span 
                    className="type-badge"
                    style={{ 
                      backgroundColor: `${EVENT_COLORS[stat.topType]}20`,
                      color: EVENT_COLORS[stat.topType]
                    }}
                  >
                    {stat.topType} ({stat.topTypeCount})
                  </span>
                </div>
              )}
              <div className="event-types">
                {Object.entries(
                  eventsByExchange[stat.exchange].reduce((acc, e) => {
                    acc[e.type] = (acc[e.type] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => (
                  <div 
                    key={type}
                    className="type-dot"
                    style={{ backgroundColor: EVENT_COLORS[type] }}
                    title={`${type}: ${count}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
