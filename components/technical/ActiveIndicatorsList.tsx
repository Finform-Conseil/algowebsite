'use client';

import { ActiveIndicator } from '@/types/indicators';

interface ActiveIndicatorsListProps {
  indicators: ActiveIndicator[];
  onEdit: (indicator: ActiveIndicator) => void;
  onRemove: (instanceId: string) => void;
}

export default function ActiveIndicatorsList({
  indicators,
  onEdit,
  onRemove
}: ActiveIndicatorsListProps) {
  if (indicators.length === 0) return null;

  const formatParameterValue = (key: string, value: any): string => {
    if (key === 'color') return '';
    if (typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(1);
    }
    return value.toString();
  };

  const getMainParameters = (indicator: ActiveIndicator): string => {
    const params = Object.entries(indicator.parameters)
      .filter(([key]) => key !== 'color' && !key.includes('Color'))
      .map(([key, value]) => formatParameterValue(key, value))
      .filter(v => v !== '')
      .join(', ');
    
    return params ? `(${params})` : '';
  };

  return (
    <div className="active-indicators-overlay">
      {indicators.map(indicator => (
        <div key={indicator.instanceId} className="active-indicator-item">
          <div className="indicator-info">
            <div className="indicator-color-dot" style={{ backgroundColor: indicator.color }}></div>
            <span className="indicator-name">
              {indicator.name} {getMainParameters(indicator)}
            </span>
          </div>
          
          <div className="indicator-actions">
            <button
              className="indicator-action-btn edit-btn"
              onClick={() => onEdit(indicator)}
              title="Modifier les paramètres"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            
            <button
              className="indicator-action-btn remove-btn"
              onClick={() => onRemove(indicator.instanceId)}
              title="Supprimer l'indicateur"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
