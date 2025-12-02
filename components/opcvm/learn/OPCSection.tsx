'use client';

import { useState } from 'react';

interface OPCSectionProps {
  onComplete: () => void;
}

export default function OPCSection({ onComplete }: OPCSectionProps) {
  const [activeTab, setActiveTab] = useState<'definition' | 'classification'>('definition');

  return (
    <div className="learn-section opc-section">
      <div className="section-header">
        <h2 className="section-title">A. Organisme de Placement Collectif (OPC)</h2>
        <div className="section-badge">Marché Coté</div>
      </div>

      <div className="content-card definition-card">
        <div className="card-header">
          <div className="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <div>
            <h3>Qu'est-ce qu'un OPC ?</h3>
            <p className="card-subtitle">Dispositif de mutualisation de l'épargne</p>
          </div>
        </div>
        
        <div className="card-body">
          <p>
            Un <strong>OPC</strong> est un dispositif financier qui a pour but de regrouper les capitaux 
            d'un grand nombre d'épargnants (particuliers ou professionnels) afin de les investir et de 
            les gérer collectivement dans un portefeuille diversifié de valeurs mobilières (actions, 
            obligations, titres monétaires, etc.) ou d'autres actifs (comme l'immobilier).
          </p>
        </div>
      </div>

      <div className="how-it-works">
        <h3 className="subsection-title">Comment ça fonctionne ?</h3>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Achat de parts</h4>
              <p>L'épargnant achète une part ou une action d'OPC</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Accès au portefeuille</h4>
              <p>Accès indirect au portefeuille géré professionnellement</p>
            </div>
          </div>
          <div className="workflow-arrow">→</div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Bénéfices</h4>
              <p>Diversification et gestion pro, même avec faible capital</p>
            </div>
          </div>
        </div>
      </div>

      <div className="classification-section">
        <h3 className="subsection-title">Classification AMF</h3>
        <p className="subsection-description">
          L'Autorité des Marchés Financiers (AMF) distingue les OPC selon la nature des actifs détenus, 
          ce qui donne une indication de leur profil de risque et de leur objectif de gestion.
        </p>

        <div className="classification-grid">
          <div className="classification-card opcvm-card">
            <div className="classification-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h4>OPCVM</h4>
            <p className="classification-subtitle">Organisme de Placement Commun en Valeurs Mobilières</p>
            <ul className="classification-features">
              <li>Actions et Obligations</li>
              <li>Titres monétaires</li>
              <li>Gestion réglementée</li>
              <li>Liquidité élevée</li>
            </ul>
            <div className="classification-badge">Valeurs Mobilières</div>
          </div>

          <div className="classification-card fia-card">
            <div className="classification-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h4>FIA</h4>
            <p className="classification-subtitle">Fonds d'Investissement Alternatifs</p>
            <ul className="classification-features">
              <li>Stratégies alternatives</li>
              <li>Actifs illiquides</li>
              <li>Private Equity</li>
              <li>Immobilier</li>
            </ul>
            <div className="classification-badge">Alternatifs</div>
          </div>
        </div>
      </div>

      <div className="key-points">
        <div className="point-card">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p><strong>Point clé :</strong> Les OPC permettent une diversification efficace même avec un capital limité</p>
        </div>
      </div>

      <div className="action-footer">
        <button className="btn-continue" onClick={onComplete}>
          Découvrir les OPCVM en détail
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
