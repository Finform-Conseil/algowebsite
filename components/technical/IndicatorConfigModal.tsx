'use client';

import { useState, useEffect } from 'react';
import { IndicatorConfig, IndicatorParameter, ActiveIndicator, createIndicatorInstance } from '@/types/indicators';

interface IndicatorConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicatorConfig: IndicatorConfig | null;
  existingIndicator?: ActiveIndicator | null;
  onSave: (indicator: ActiveIndicator) => void;
}

export default function IndicatorConfigModal({
  isOpen,
  onClose,
  indicatorConfig,
  existingIndicator,
  onSave
}: IndicatorConfigModalProps) {
  const [parameters, setParameters] = useState<Record<string, any>>({});

  useEffect(() => {
    if (indicatorConfig) {
      const initialParams: Record<string, any> = {};
      indicatorConfig.parameters.forEach(param => {
        initialParams[param.key] = existingIndicator?.parameters[param.key] ?? param.defaultValue;
      });
      setParameters(initialParams);
    }
  }, [indicatorConfig, existingIndicator]);

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!indicatorConfig) return;

    const indicator: ActiveIndicator = existingIndicator ? {
      ...existingIndicator,
      parameters
    } : createIndicatorInstance(indicatorConfig.id, parameters);

    onSave(indicator);
    onClose();
  };

  const renderParameter = (param: IndicatorParameter) => {
    const value = parameters[param.key];

    switch (param.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value || param.defaultValue}
            min={param.min}
            max={param.max}
            step={param.step}
            onChange={(e) => handleParameterChange(param.key, parseFloat(e.target.value))}
            className="parameter-input"
          />
        );

      case 'color':
        return (
          <div className="color-input-wrapper">
            <input
              type="color"
              value={value || param.defaultValue}
              onChange={(e) => handleParameterChange(param.key, e.target.value)}
              className="color-input"
            />
            <span className="color-preview" style={{ backgroundColor: value || param.defaultValue }}></span>
          </div>
        );

      case 'select':
        return (
          <select
            value={value || param.defaultValue}
            onChange={(e) => handleParameterChange(param.key, e.target.value)}
            className="parameter-select"
          >
            {param.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  if (!isOpen || !indicatorConfig) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="indicator-config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{existingIndicator ? 'Modifier' : 'Configurer'} {indicatorConfig.name}</h3>
          <button className="modal-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <p className="indicator-description">{indicatorConfig.description}</p>

          <div className="parameters-grid">
            {indicatorConfig.parameters.map(param => (
              <div key={param.key} className="parameter-row">
                <label className="parameter-label">{param.label}</label>
                {renderParameter(param)}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Annuler
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {existingIndicator ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
