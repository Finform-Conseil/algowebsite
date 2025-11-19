'use client';

import { useState } from 'react';

interface FinancialTooltipProps {
  term: string;
  definition: string;
  formula?: string;
  example?: string;
  children: React.ReactNode;
}

export default function FinancialTooltip({ term, definition, formula, example, children }: FinancialTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  return (
    <span className="financial-tooltip-trigger" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}

      {isVisible && (
        <div
          className="financial-tooltip"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="financial-tooltip__header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <strong>{term}</strong>
          </div>
          
          <div className="financial-tooltip__body">
            <p className="definition">{definition}</p>
            
            {formula && (
              <div className="formula">
                <span className="formula-label">Formule :</span>
                <code>{formula}</code>
              </div>
            )}
            
            {example && (
              <div className="example">
                <span className="example-label">Exemple :</span>
                <p>{example}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </span>
  );
}
