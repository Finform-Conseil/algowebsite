'use client';

import EventsTimeline from '@/components/corporate-events/EventsTimeline';
import { CORPORATE_EVENTS, filterEvents } from '@/core/data/CorporateEventsData';
import { useState, useEffect, useMemo } from 'react';

export default function EconomicCalendarPage() {
  const [filters, setFilters] = useState<any>({
    years: [],
    exchanges: [],
    types: [],
    importance: []
  });
      const filteredEvents = useMemo(() => {
        return filterEvents(CORPORATE_EVENTS, filters);
      }, [filters]);
    
    return (
        <div className="macro-home-page">
            <div className="macro-header-wrapper">
                <div 
                    className="macro-header"
                    style={{
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7))`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center center',
                        transition: 'background-image 1s ease-in-out',
                    }}
                >
                    <div className="header-content">
                        <h1>Economic Calendar</h1>
                        <p>Events and key publications</p>
                    </div>
                </div>
            </div>
            
                <div className="timeline-container">
                    <EventsTimeline events={filteredEvents} />
                </div>
        </div>
    )
}