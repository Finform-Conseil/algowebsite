'use client';

import { useState, useMemo } from 'react';
import { UpcomingIPO } from '@/types/ipo';

interface IPOCalendarProps {
  ipos: UpcomingIPO[];
  onIPOSelect?: (ipo: UpcomingIPO) => void;
  selectedIPOId?: string;
}

const IPO_COLORS: Record<string, string> = {
  'Télécom': '#3b82f6',
  'Finance': '#10b981',
  'Énergie': '#f59e0b',
  'Industrie': '#6366f1',
  'Consommation': '#ec4899',
  'Immobilier': '#8b5cf6',
  'Santé': '#14b8a6',
  'Technologie': '#06b6d4',
  'Matériaux': '#f97316',
  'Services': '#84cc16'
};

export default function IPOCalendar({ ipos, onIPOSelect, selectedIPOId }: IPOCalendarProps) {
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

  // Grouper les IPO par date
  const iposByDate = useMemo(() => {
    const grouped: Record<string, UpcomingIPO[]> = {};
    ipos.forEach(ipo => {
      const ipoDate = new Date(ipo.expectedDate);
      if (ipoDate.getMonth() === currentMonth && ipoDate.getFullYear() === currentYear) {
        const dateKey = ipoDate.getDate().toString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(ipo);
      }
    });
    return grouped;
  }, [ipos, currentMonth, currentYear]);

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
    <div className={`ipo-calendar ${isCollapsed ? 'collapsed' : ''}`}>
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
          style={{ transition: 'transform 0.3s ease' }}
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

              const dayIPOs = iposByDate[day.toString()] || [];
              const hasIPOs = dayIPOs.length > 0;

              return (
                <div
                  key={day}
                  className={`calendar-day ${isToday(day) ? 'today' : ''} ${hasIPOs ? 'has-ipos' : ''}`}
                >
                  <div className="day-number">{day}</div>
                  {hasIPOs && (
                    <div className="day-ipos">
                      {dayIPOs.slice(0, 3).map(ipo => (
                        <div
                          key={ipo.id}
                          className={`ipo-dot ${selectedIPOId === ipo.id ? 'selected' : ''}`}
                          style={{ backgroundColor: IPO_COLORS[ipo.sector] || '#3b82f6' }}
                          onClick={() => onIPOSelect?.(ipo)}
                          title={`${ipo.companyName} (${ipo.sector})`}
                        >
                          <span className="ipo-name">{ipo.companyName}</span>
                        </div>
                      ))}
                      {dayIPOs.length > 3 && (
                        <div className="more-ipos">+{dayIPOs.length - 3}</div>
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
                ipos.reduce((acc, ipo) => {
                  const ipoDate = new Date(ipo.expectedDate);
                  if (ipoDate.getMonth() === currentMonth && ipoDate.getFullYear() === currentYear) {
                    acc[ipo.sector] = IPO_COLORS[ipo.sector] || '#3b82f6';
                  }
                  return acc;
                }, {} as Record<string, string>)
              ).map(([sector, color]) => (
                <div key={sector} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: color }} />
                  <span>{sector}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="calendar-stats">
            <div className="stat-item">
              <strong>{Object.keys(iposByDate).length}</strong>
              <span>jours avec IPO</span>
            </div>
            <div className="stat-item">
              <strong>{ipos.filter(ipo => {
                const d = new Date(ipo.expectedDate);
                return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
              }).length}</strong>
              <span>IPO ce mois</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
