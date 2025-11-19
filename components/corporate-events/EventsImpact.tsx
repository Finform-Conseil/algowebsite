'use client';

import { useMemo } from 'react';
import { CorporateEvent } from '@/types/corporate-events';
import { EVENT_COLORS } from '@/core/data/CorporateEventsData';
import BarChart from '@/components/charts/BarChart';
import ScatterChart from '@/components/charts/ScatterChart';

interface EventsImpactProps {
  events: CorporateEvent[];
}

export default function EventsImpact({ events }: EventsImpactProps) {
  // Filtrer les événements avec impact
  const eventsWithImpact = useMemo(() => 
    events.filter(e => e.priceImpact),
    [events]
  );

  // Impact moyen par type d'événement
  const impactByType = useMemo(() => {
    const typeImpacts: Record<string, number[]> = {};
    
    eventsWithImpact.forEach(event => {
      if (!typeImpacts[event.type]) {
        typeImpacts[event.type] = [];
      }
      typeImpacts[event.type].push(event.priceImpact!.percentChange);
    });

    const averages = Object.entries(typeImpacts)
      .map(([type, impacts]) => ({
        type,
        avgImpact: impacts.reduce((a, b) => a + b, 0) / impacts.length,
        count: impacts.length
      }))
      .sort((a, b) => Math.abs(b.avgImpact) - Math.abs(a.avgImpact))
      .slice(0, 8);

    return {
      categories: averages.map(a => a.type),
      values: averages.map(a => a.avgImpact)
    };
  }, [eventsWithImpact]);

  // Données pour scatter plot (Impact vs Volatilité)
  const scatterData = useMemo(() => 
    eventsWithImpact
      .filter(e => e.priceImpact?.volatilityAfter)
      .map(event => ({
        name: event.companyTicker,
        x: event.priceImpact!.percentChange,
        y: event.priceImpact!.volatilityAfter,
        color: EVENT_COLORS[event.type]
      })),
    [eventsWithImpact]
  );

  // Statistiques globales
  const stats = useMemo(() => {
    if (eventsWithImpact.length === 0) return null;

    const impacts = eventsWithImpact.map(e => e.priceImpact!.percentChange);
    const positiveImpacts = impacts.filter(i => i > 0);
    const negativeImpacts = impacts.filter(i => i < 0);

    return {
      avgImpact: impacts.reduce((a, b) => a + b, 0) / impacts.length,
      maxImpact: Math.max(...impacts),
      minImpact: Math.min(...impacts),
      positiveCount: positiveImpacts.length,
      negativeCount: negativeImpacts.length,
      positiveRate: (positiveImpacts.length / impacts.length) * 100
    };
  }, [eventsWithImpact]);

  // Top événements par impact
  const topImpactEvents = useMemo(() => 
    [...eventsWithImpact]
      .sort((a, b) => Math.abs(b.priceImpact!.percentChange) - Math.abs(a.priceImpact!.percentChange))
      .slice(0, 5),
    [eventsWithImpact]
  );

  if (eventsWithImpact.length === 0) {
    return (
      <div className="events-impact">
        <div className="no-data-message">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23" />
            <polyline points="17 5 12 1 7 5" />
            <polyline points="7 19 12 23 17 19" />
          </svg>
          <p>Aucune donnée d'impact disponible</p>
          <span>Les événements sélectionnés n'ont pas de données d'impact sur les cours</span>
        </div>
      </div>
    );
  }

  return (
    <div className="events-impact">
      {/* Stats Cards */}
      {stats && (
        <div className="impact-stats">
          <div className="stat-card">
            <div className="stat-label">Impact moyen</div>
            <div className={`stat-value ${stats.avgImpact >= 0 ? 'positive' : 'negative'}`}>
              {stats.avgImpact >= 0 ? '+' : ''}{stats.avgImpact.toFixed(2)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Impact max</div>
            <div className="stat-value positive">
              +{stats.maxImpact.toFixed(2)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Impact min</div>
            <div className="stat-value negative">
              {stats.minImpact.toFixed(2)}%
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Taux positif</div>
            <div className="stat-value">
              {stats.positiveRate.toFixed(0)}%
            </div>
            <div className="stat-detail">
              {stats.positiveCount} positifs / {stats.negativeCount} négatifs
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="impact-charts">
        {/* Impact moyen par type */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Impact moyen par type d'événement</h3>
            <span className="chart-subtitle">Variation moyenne du cours (30 jours)</span>
          </div>
          <BarChart
            data={impactByType}
            title=""
            height="280px"
            color="#3b82f6"
          />
        </div>

        {/* Scatter plot Impact vs Volatilité */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Impact vs Volatilité</h3>
            <span className="chart-subtitle">Relation entre l'impact et la volatilité post-événement</span>
          </div>
          <ScatterChart
            data={scatterData}
            xLabel="Impact (%)"
            yLabel="Volatilité"
            title=""
            height="280px"
          />
        </div>
      </div>

      {/* Top événements */}
      <div className="top-events">
        <h3>Top 5 événements par impact</h3>
        <div className="events-list">
          {topImpactEvents.map((event, index) => (
            <div key={event.id} className="impact-event">
              <div className="event-rank">#{index + 1}</div>
              <div className="event-info">
                <div className="event-header">
                  <strong>{event.companyName}</strong>
                  <span 
                    className="event-type"
                    style={{ color: EVENT_COLORS[event.type] }}
                  >
                    {event.type}
                  </span>
                </div>
                <div className="event-title">{event.title}</div>
                <div className="event-meta">
                  <span>{new Date(event.date).toLocaleDateString('fr-FR')}</span>
                  <span>{event.exchange}</span>
                </div>
              </div>
              <div className={`event-impact ${event.priceImpact!.percentChange >= 0 ? 'positive' : 'negative'}`}>
                <div className="impact-value">
                  {event.priceImpact!.percentChange >= 0 ? '+' : ''}
                  {event.priceImpact!.percentChange.toFixed(1)}%
                </div>
                <div className="impact-label">Impact</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
