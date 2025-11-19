'use client';

import { useState, useMemo } from 'react';
import { CorporateEvent } from '@/types/corporate-events';
import { EVENT_COLORS } from '@/core/data/CorporateEventsData';

interface EventsCalendarProps {
  events: CorporateEvent[];
  onEventSelect?: (event: CorporateEvent) => void;
  selectedEventId?: string;
}

export default function EventsCalendar({ events, onEventSelect, selectedEventId }: EventsCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Obtenir le mois et l'année actuels
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Obtenir le premier et dernier jour du mois
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  // Grouper les événements par date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, CorporateEvent[]> = {};
    events.forEach(event => {
      const eventDate = new Date(event.date);
      if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
        const dateKey = eventDate.getDate().toString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(event);
      }
    });
    return grouped;
  }, [events, currentMonth, currentYear]);

  // Navigation mois
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Générer les jours du calendrier
  const calendarDays = [];
  
  // Jours vides avant le premier jour du mois
  for (let i = 0; i < firstDayWeekday; i++) {
    calendarDays.push(null);
  }
  
  // Jours du mois
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };

  return (
    <div className={`events-calendar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Toggle Button */}
      <button 
        className="calendar-toggle"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Ouvrir le calendrier' : 'Fermer le calendrier'}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      {!isCollapsed && (
        <div className="calendar-content">
          {/* Header */}
          <div className="calendar-header">
            <button onClick={goToPreviousMonth} className="nav-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            
            <div className="calendar-title">
              <h3>{monthNames[currentMonth]} {currentYear}</h3>
              <button onClick={goToToday} className="today-btn">
                Aujourd'hui
              </button>
            </div>
            
            <button onClick={goToNextMonth} className="nav-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Day names */}
          <div className="calendar-days-header">
            {dayNames.map(day => (
              <div key={day} className="day-name">{day}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="calendar-grid">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="calendar-day empty" />;
              }

              const dayEvents = eventsByDate[day.toString()] || [];
              const hasEvents = dayEvents.length > 0;

              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday(day) ? 'today' : ''} ${hasEvents ? 'has-events' : ''}`}
                >
                  <div className="day-number">{day}</div>
                  {hasEvents && (
                    <div className="day-events">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`event-dot ${selectedEventId === event.id ? 'selected' : ''}`}
                          style={{ backgroundColor: EVENT_COLORS[event.type] }}
                          onClick={() => onEventSelect?.(event)}
                          title={`${event.title} (${event.type})`}
                        >
                          <span className="event-name">{event.title}</span>
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="more-events">+{dayEvents.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-title">Légende :</div>
            <div className="legend-items">
              {Object.entries(
                events.reduce((acc, event) => {
                  const eventDate = new Date(event.date);
                  if (eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear) {
                    acc[event.type] = EVENT_COLORS[event.type];
                  }
                  return acc;
                }, {} as Record<string, string>)
              ).map(([type, color]) => (
                <div key={type} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: color }} />
                  <span>{type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="calendar-stats">
            <div className="stat-item">
              <strong>{Object.keys(eventsByDate).length}</strong>
              <span>jours avec événements</span>
            </div>
            <div className="stat-item">
              <strong>{events.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              }).length}</strong>
              <span>événements ce mois</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
