'use client';

import { useState } from 'react';

interface KeyTakeawaysProps {
  activeSection: string;
}

export default function KeyTakeaways({ activeSection }: KeyTakeawaysProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const takeaways: Record<string, string[]> = {
    introduction: [
      "Un Fonds d'investissement collecte l'argent de plusieurs investisseurs",
      "Deux grandes familles : marché coté (OPC) et marché non coté (Private Equity)",
      "Permet la diversification même avec un faible capital"
    ],
    opc: [
      "OPC = regroupement de capitaux pour investissement collectif",
      "Gestion professionnelle du portefeuille",
      "Classification AMF : OPCVM et FIA"
    ],
    opcvm: [
      "OPCVM = investissement dans des valeurs mobilières",
      "5 types principaux : Monétaires, Obligataires, Actions, Mixtes, Immobiliers",
      "Gestion passive (indicielle) vs Gestion active",
      "Plusieurs risques à considérer avant d'investir"
    ],
    fia: [
      "FIA = stratégies alternatives et moins conventionnelles",
      "Actifs illiquides : Private Equity, Immobilier, Hedge Funds",
      "Objectif : performance absolue indépendante du marché",
      "Généralement pour investisseurs avertis"
    ],
    quiz: [
      "Testez vos connaissances acquises",
      "Validez votre compréhension des concepts clés",
      "Identifiez les points à approfondir"
    ]
  };

  const currentTakeaways = takeaways[activeSection] || [];

  if (currentTakeaways.length === 0) return null;

  return (
    <div className={`key-takeaways-floating ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="takeaways-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span>Points clés</span>
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          className={`chevron ${isExpanded ? 'rotated' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isExpanded && (
        <div className="takeaways-content">
          <h4>À retenir</h4>
          <ul className="takeaways-list">
            {currentTakeaways.map((takeaway, index) => (
              <li key={index}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {takeaway}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
