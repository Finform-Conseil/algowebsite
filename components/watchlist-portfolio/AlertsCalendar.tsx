'use client';

import { useState, useMemo } from 'react';
import { Alert } from '@/types/watchlist-portfolio';
import { getAlertColor } from '@/core/data/WatchlistPortfolioData';

interface AlertsCalendarProps {
  alerts: Alert[];
  onAlertSelect?: (alert: Alert) => void;
  selectedAlertId?: string;
}

export default function AlertsCalendar({ alerts, onAlertSelect, selectedAlertId }: AlertsCalendarProps) {
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

  // Grouper les alertes par date (date de création ou de déclenchement)
  const alertsByDate = useMemo(() => {
    const grouped: Record<string, Alert[]> = {};
    alerts.forEach(alert => {
      // Utiliser la date de déclenchement si disponible, sinon la date de création
      const alertDate = alert.triggeredAt 
        ? new Date(alert.triggeredAt) 
        : new Date(alert.createdAt);
      
      if (alertDate.getMonth() === currentMonth && alertDate.getFullYear() === currentYear) {
        const dateKey = alertDate.getDate().toString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(alert);
      }
    });
    return grouped;
  }, [alerts, currentMonth, currentYear]);

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

  // Compter les alertes actives et déclenchées du mois
  const monthAlerts = alerts.filter(alert => {
    const alertDate = alert.triggeredAt 
      ? new Date(alert.triggeredAt) 
      : new Date(alert.createdAt);
    return alertDate.getMonth() === currentMonth && alertDate.getFullYear() === currentYear;
  });

  const activeCount = monthAlerts.filter(a => a.status === 'active').length;
  const triggeredCount = monthAlerts.filter(a => a.status === 'triggered').length;

  return (
    <div className={`alerts-calendar ${isCollapsed ? 'collapsed' : ''}`}>
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
        >
          <polyline points="9 18 15 12 9 6" />
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

              const dayAlerts = alertsByDate[day.toString()] || [];
              const hasAlerts = dayAlerts.length > 0;

              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday(day) ? 'today' : ''} ${hasAlerts ? 'has-alerts' : ''}`}
                >
                  <div className="day-number">{day}</div>
                  {hasAlerts && (
                    <div className="day-alerts">
                      {dayAlerts.slice(0, 3).map(alert => (
                        <div
                          key={alert.id}
                          className={`alert-dot ${selectedAlertId === alert.id ? 'selected' : ''} ${alert.status}`}
                          style={{ backgroundColor: getAlertColor(alert.type) }}
                          onClick={() => onAlertSelect?.(alert)}
                          title={`${alert.companyName} - ${alert.message}`}
                        >
                          <span className="alert-name">{alert.ticker}</span>
                        </div>
                      ))}
                      {dayAlerts.length > 3 && (
                        <div className="more-alerts">+{dayAlerts.length - 3}</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="calendar-legend">
            <div className="legend-title">Statuts :</div>
            <div className="legend-items">
              <div className="legend-item">
                <div className="legend-color active" />
                <span>Active</span>
              </div>
              <div className="legend-item">
                <div className="legend-color triggered" />
                <span>Déclenchée</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="calendar-stats">
            <div className="stat-item">
              <strong>{activeCount}</strong>
              <span>actives</span>
            </div>
            <div className="stat-item">
              <strong>{triggeredCount}</strong>
              <span>déclenchées</span>
            </div>
            <div className="stat-item">
              <strong>{Object.keys(alertsByDate).length}</strong>
              <span>jours</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
