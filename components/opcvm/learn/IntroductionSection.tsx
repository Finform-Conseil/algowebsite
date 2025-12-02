'use client';

import { useState } from 'react';

interface IntroductionSectionProps {
  onComplete: () => void;
}

export default function IntroductionSection({ onComplete }: IntroductionSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="learn-section introduction-section">
      <div className="section-header">
        <h2 className="section-title">Qu'est-ce qu'un Fonds d'Investissement ?</h2>
        <div className="section-badge">Introduction</div>
      </div>

      <div className="content-card main-definition">
        <div className="card-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div className="card-content">
          <h3>Définition</h3>
          <p>
            Un <strong>Fonds d'investissement</strong> est un véhicule financier conçu pour collecter 
            l'argent de plusieurs investisseurs (particuliers, entreprises, ou institutions) et l'investir 
            de manière collective et professionnelle dans un portefeuille diversifié d'actifs.
          </p>
        </div>
      </div>

      <div className="content-grid">
        <div className="info-card">
          <div className="info-icon market-cote">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h4>Marché Coté</h4>
          <p>Organisme de Placement Collectif (OPC)</p>
          <div className="card-badge">Actions & Obligations</div>
        </div>

        <div className="info-card">
          <div className="info-icon market-non-cote">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="15" />
              <line x1="15" y1="9" x2="9" y2="15" />
            </svg>
          </div>
          <h4>Marché Non Coté</h4>
          <p>Private Equity</p>
          <div className="card-badge">Entreprises privées</div>
        </div>
      </div>

      <div className="visual-separator">
        <div className="separator-line"></div>
        <div className="separator-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="separator-line"></div>
      </div>

      <div className="key-benefits">
        <h3 className="benefits-title">Pourquoi investir dans un Fonds ?</h3>
        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-number">01</div>
            <div className="benefit-content">
              <h4>Diversification</h4>
              <p>Accès à un portefeuille diversifié avec un capital limité</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-number">02</div>
            <div className="benefit-content">
              <h4>Gestion Professionnelle</h4>
              <p>Experts financiers gérant votre investissement</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-number">03</div>
            <div className="benefit-content">
              <h4>Accessibilité</h4>
              <p>Investissement possible même avec un faible capital</p>
            </div>
          </div>
          <div className="benefit-item">
            <div className="benefit-number">04</div>
            <div className="benefit-content">
              <h4>Liquidité</h4>
              <p>Facilité d'achat et de vente de parts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="action-footer">
        <button className="btn-continue" onClick={onComplete}>
          Continuer vers les OPC
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
