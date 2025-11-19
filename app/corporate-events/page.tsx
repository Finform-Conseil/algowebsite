'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import EventsHeader from '@/components/corporate-events/EventsHeader';
import EventsStats from '@/components/corporate-events/EventsStats';
import EventsTimeline from '@/components/corporate-events/EventsTimeline';
import EventsTable from '@/components/corporate-events/EventsTable';
import EventsImpact from '@/components/corporate-events/EventsImpact';
import EventsMap from '@/components/corporate-events/EventsMap';
import EventsAlerts from '@/components/corporate-events/EventsAlerts';
import { CORPORATE_EVENTS, calculateEventStats, filterEvents } from '@/core/data/CorporateEventsData';

type TabType = 'overview' | 'timeline' | 'table' | 'impact' | 'map' | 'alerts';

export default function CorporateEventsPage() {
  const [filters, setFilters] = useState<any>({
    years: [],
    exchanges: [],
    types: [],
    importance: []
  });
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filtrer les événements
  const filteredEvents = useMemo(() => {
    return filterEvents(CORPORATE_EVENTS, filters);
  }, [filters]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    return calculateEventStats(filteredEvents);
  }, [filteredEvents]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Vue d\'ensemble', icon: 'pie-chart' },
    { id: 'timeline' as TabType, label: 'Timeline', icon: 'clock' },
    { id: 'table' as TabType, label: 'Classement', icon: 'list' },
    { id: 'impact' as TabType, label: 'Impact', icon: 'trending-up' },
    { id: 'map' as TabType, label: 'Carte', icon: 'map' },
    { id: 'alerts' as TabType, label: 'Alertes', icon: 'bell' }
  ];

  const renderIcon = (iconName: string) => {
    const icons: Record<string, JSX.Element> = {
      'pie-chart': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
          <path d="M22 12A10 10 0 0 0 12 2v10z" />
        </svg>
      ),
      'clock': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      'list': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="8" y1="6" x2="21" y2="6" />
          <line x1="8" y1="12" x2="21" y2="12" />
          <line x1="8" y1="18" x2="21" y2="18" />
          <line x1="3" y1="6" x2="3.01" y2="6" />
          <line x1="3" y1="12" x2="3.01" y2="12" />
          <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
      ),
      'trending-up': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      ),
      'map': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
      'bell': (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      )
    };
    return icons[iconName] || null;
  };

  return (
    <div className="corporate-events-page">
      {/* Breadcrumb */}
      <div className="events-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>Opérations & Événements</span>
      </div>

      {/* Header avec filtres */}
      <EventsHeader onFilterChange={setFilters} />

      {/* Tabs Navigation */}
      <div className="events-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{renderIcon(tab.icon)}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="events-content">
        <div className="tab-content">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div className="overview-container">
              <EventsStats stats={stats} />
            </div>
          )}

          {/* Timeline */}
          {activeTab === 'timeline' && (
            <div className="timeline-container">
              <EventsTimeline events={filteredEvents} />
            </div>
          )}

          {/* Tableau */}
          {activeTab === 'table' && (
            <div className="table-container">
              <EventsTable events={filteredEvents} />
            </div>
          )}

          {/* Impact */}
          {activeTab === 'impact' && (
            <div className="impact-container">
              <EventsImpact events={filteredEvents} />
            </div>
          )}

          {/* Carte */}
          {activeTab === 'map' && (
            <div className="map-container">
              <EventsMap events={filteredEvents} />
            </div>
          )}

          {/* Alertes */}
          {activeTab === 'alerts' && (
            <div className="alerts-container">
              <EventsAlerts events={filteredEvents} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
