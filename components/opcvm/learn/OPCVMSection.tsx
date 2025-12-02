'use client';

import { useState } from 'react';

interface OPCVMSectionProps {
  onComplete: () => void;
}

export default function OPCVMSection({ onComplete }: OPCVMSectionProps) {
  const [activeTab, setActiveTab] = useState<'types' | 'gestion' | 'strategies' | 'risques' | 'choix'>('types');

  const fondsTypes = [
    {
      id: 'fm',
      name: 'Fonds Monétaires',
      acronym: 'FM',
      color: 'blue',
      objective: 'Préservation du capital et liquidité',
      instruments: 'Titres de créance à court terme (bons du Trésor, prêts interbancaires)',
      risk: 'Généralement faible',
      adapted: 'Placements de trésorerie à court terme',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      )
    },
    {
      id: 'fo',
      name: 'Fonds Obligataires',
      acronym: 'FO',
      color: 'green',
      objective: 'Revenu régulier et appréciation du capital',
      instruments: 'Obligations d\'État, obligations d\'entreprises, obligations indexées',
      risk: 'Variable, légèrement supérieur aux FM',
      adapted: 'Investisseurs recherchant un revenu et diversification',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
          <line x1="1" y1="10" x2="23" y2="10" />
        </svg>
      )
    },
    {
      id: 'fa',
      name: 'Fonds Actions',
      acronym: 'FA',
      color: 'purple',
      objective: 'Appréciation du capital à long terme',
      instruments: 'Actions de sociétés cotées de différentes capitalisations',
      risk: 'Plus élevé',
      adapted: 'Investisseurs avec horizon long terme et tolérance au risque',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      )
    },
    {
      id: 'fmx',
      name: 'Fonds Mixtes',
      acronym: 'FMx',
      color: 'orange',
      objective: 'Équilibre entre revenu et appréciation du capital',
      instruments: 'Allocation flexible entre actions, obligations et autres actifs',
      risk: 'Modéré à élevé selon allocation',
      adapted: 'Investisseurs recherchant une solution polyvalente',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
        </svg>
      )
    },
    {
      id: 'fi',
      name: 'Fonds Immobiliers',
      acronym: 'FI',
      color: 'teal',
      objective: 'Revenu et appréciation via l\'investissement immobilier',
      instruments: 'Parts de SCPI ou OPCI, immeubles de bureaux, commerciaux',
      risk: 'Variable selon le marché immobilier',
      adapted: 'Investisseurs intéressés par l\'immobilier sans gestion directe',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      )
    }
  ];

  const risques = [
    { name: 'Risque de marché', description: 'Fluctuations générales des marchés financiers', icon: '📊' },
    { name: 'Risque de crédit', description: 'Risque de défaut de l\'émetteur (fonds obligataires)', icon: '💳' },
    { name: 'Risque de taux d\'intérêt', description: 'Impact des variations des taux sur les obligations', icon: '📈' },
    { name: 'Risque de change', description: 'Fluctuations des taux de change (devises étrangères)', icon: '💱' },
    { name: 'Risque de liquidité', description: 'Difficultés à vendre rapidement des actifs', icon: '💧' },
    { name: 'Risque de perte en capital', description: 'La valeur des parts peut diminuer', icon: '⚠️' },
    { name: 'Risque lié au style de gestion', description: 'Mauvaise sélection de titres par le gérant', icon: '👔' },
    { name: 'Risque de concentration', description: 'Fonds trop concentré sur peu de titres', icon: '🎯' },
    { name: 'Risque politique et réglementaire', description: 'Événements politiques ou changements réglementaires', icon: '🏛️' }
  ];

  return (
    <div className="learn-section opcvm-section">
      <div className="section-header">
        <h2 className="section-title">I. OPCVM - Organisme de Placement Commun en Valeurs Mobilières</h2>
        <div className="section-badge">Détails complets</div>
      </div>

      <div className="content-card definition-card">
        <div className="card-body">
          <p>
            Un <strong>OPCVM</strong> est un produit financier qui favorise la mutualisation de l'épargne 
            des agents économiques en émettant des actions ou des parts pour investir dans divers instruments 
            financiers tels que les Actions et les Obligations. L'épargne ainsi collectée est utilisée pour 
            constituer un portefeuille de valeurs mobilières.
          </p>
        </div>
      </div>

      {/* Tabs de navigation */}
      <div className="opcvm-tabs">
        <button
          className={`opcvm-tab ${activeTab === 'types' ? 'active' : ''}`}
          onClick={() => setActiveTab('types')}
        >
          Types d'OPCVM
        </button>
        <button
          className={`opcvm-tab ${activeTab === 'gestion' ? 'active' : ''}`}
          onClick={() => setActiveTab('gestion')}
        >
          Styles de Gestion
        </button>
        <button
          className={`opcvm-tab ${activeTab === 'strategies' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategies')}
        >
          Stratégies
        </button>
        <button
          className={`opcvm-tab ${activeTab === 'risques' ? 'active' : ''}`}
          onClick={() => setActiveTab('risques')}
        >
          Risques
        </button>
        <button
          className={`opcvm-tab ${activeTab === 'choix' ? 'active' : ''}`}
          onClick={() => setActiveTab('choix')}
        >
          Comment Choisir
        </button>
      </div>

      {/* Contenu des tabs */}
      <div className="opcvm-tab-content">
        {activeTab === 'types' && (
          <div className="types-content">
            <h3 className="content-subtitle">Classification selon la nature des actifs investis</h3>
            <div className="fonds-grid">
              {fondsTypes.map((fonds) => (
                <div key={fonds.id} className={`fonds-card fonds-${fonds.color}`}>
                  <div className="fonds-header">
                    <div className="fonds-icon">{fonds.icon}</div>
                    <div>
                      <h4>{fonds.name}</h4>
                      <span className="fonds-acronym">{fonds.acronym}</span>
                    </div>
                  </div>
                  <div className="fonds-details">
                    <div className="detail-item">
                      <strong>Objectif :</strong>
                      <p>{fonds.objective}</p>
                    </div>
                    <div className="detail-item">
                      <strong>Instruments :</strong>
                      <p>{fonds.instruments}</p>
                    </div>
                    <div className="detail-item">
                      <strong>Niveau de risque :</strong>
                      <p>{fonds.risk}</p>
                    </div>
                    <div className="detail-item">
                      <strong>Adapté pour :</strong>
                      <p>{fonds.adapted}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'gestion' && (
          <div className="gestion-content">
            <h3 className="content-subtitle">Deux approches de gestion</h3>
            <div className="gestion-grid">
              <div className="gestion-card passive">
                <div className="gestion-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h4>Gestion Passive (Indicielle)</h4>
                <div className="gestion-details">
                  <div className="detail-row">
                    <span className="detail-label">Objectif</span>
                    <span className="detail-value">Répliquer la performance d'un indice de référence</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Frais</span>
                    <span className="detail-value">Généralement plus faibles</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Adapté pour</span>
                    <span className="detail-value">Performance alignée sur le marché</span>
                  </div>
                </div>
                <div className="gestion-badge">ETF, Fonds indiciels</div>
              </div>

              <div className="gestion-card active">
                <div className="gestion-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <h4>Gestion Active</h4>
                <div className="gestion-details">
                  <div className="detail-row">
                    <span className="detail-label">Objectif</span>
                    <span className="detail-value">Surperformer un indice de référence</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Frais</span>
                    <span className="detail-value">Généralement plus élevés</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Styles</span>
                    <span className="detail-value">Value, Growth, Momentum...</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Adapté pour</span>
                    <span className="detail-value">Investisseurs croyant en la capacité des gérants</span>
                  </div>
                </div>
                <div className="gestion-badge">Sélection active</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="strategies-content">
            <h3 className="content-subtitle">Stratégies d'investissement</h3>
            <div className="strategies-list">
              <div className="strategy-card">
                <div className="strategy-number">01</div>
                <div className="strategy-content">
                  <h4>Allocation d'actifs</h4>
                  <ul>
                    <li>Définir le profil d'investisseur (équilibre, sérénité, dynamique...)</li>
                    <li>Répartition optimale du capital sur différents types d'actifs</li>
                    <li>Diversification géographique, sectorielle et par capitalisation</li>
                  </ul>
                </div>
              </div>

              <div className="strategy-card">
                <div className="strategy-number">02</div>
                <div className="strategy-content">
                  <h4>Investissement progressif (Dollar-Cost Averaging)</h4>
                  <ul>
                    <li>Investir régulièrement des montants fixes</li>
                    <li>Lisser le prix d'achat des parts</li>
                    <li>Réduire l'impact de la volatilité</li>
                  </ul>
                </div>
              </div>

              <div className="strategy-card">
                <div className="strategy-number">03</div>
                <div className="strategy-content">
                  <h4>Stratégies sectorielles et thématiques</h4>
                  <ul>
                    <li>Investissement dans des tendances spécifiques</li>
                    <li>Exemples : Technologie, transition énergétique, santé...</li>
                    <li>Concentration sur des secteurs à fort potentiel</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'risques' && (
          <div className="risques-content">
            <h3 className="content-subtitle">Risques associés aux OPCVM</h3>
            <div className="risques-grid">
              {risques.map((risque, index) => (
                <div key={index} className="risque-card">
                  <div className="risque-icon">{risque.icon}</div>
                  <h4>{risque.name}</h4>
                  <p>{risque.description}</p>
                </div>
              ))}
            </div>
            <div className="warning-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p>
                <strong>Important :</strong> Tout investissement comporte des risques. 
                Il est essentiel de bien comprendre ces risques avant d'investir.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'choix' && (
          <div className="choix-content">
            <h3 className="content-subtitle">Comment choisir le bon OPCVM et suivre son investissement ?</h3>
            
            <div className="choix-steps">
              <div className="choix-step">
                <div className="step-icon">▲</div>
                <h4>Définir ses objectifs et son profil de risque</h4>
                <p>Identifiez vos objectifs d'investissement et votre tolérance au risque</p>
              </div>

              <div className="choix-step">
                <div className="step-icon">▲</div>
                <h4>Analyser la documentation clé</h4>
                <div className="documents-list">
                  <div className="document-item">
                    <span className="doc-icon">♂</span>
                    <div>
                      <strong>DICI</strong>
                      <p>Document Clé pour l'Investisseur - Risques, performances passées et frais</p>
                    </div>
                  </div>
                  <div className="document-item">
                    <span className="doc-icon">♂</span>
                    <div>
                      <strong>Prospectus</strong>
                      <p>Informations détaillées sur la stratégie, les actifs et les frais</p>
                    </div>
                  </div>
                  <div className="document-item">
                    <span className="doc-icon">♂</span>
                    <div>
                      <strong>Rapports périodiques</strong>
                      <p>Performances, allocation d'actifs et commentaires de gestion</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="choix-step">
                <div className="step-icon">▲</div>
                <h4>Comparer les performances passées avec prudence</h4>
                <ul>
                  <li>Tenir compte de la volatilité et des indices de référence</li>
                  <li>Les performances passées ne préjugent pas des performances futures</li>
                </ul>
              </div>

              <div className="choix-step">
                <div className="step-icon">▲</div>
                <h4>Analyser les frais</h4>
                <div className="frais-list">
                  <span className="frais-tag">Frais de gestion</span>
                  <span className="frais-tag">Frais d'entrée</span>
                  <span className="frais-tag">Frais de sortie</span>
                  <span className="frais-tag">Frais de transaction</span>
                </div>
                <p>Projeter l'impact de ces frais sur la performance du fonds</p>
              </div>

              <div className="choix-step">
                <div className="step-icon">▲</div>
                <h4>Suivre régulièrement l'évolution</h4>
                <p>Suivre régulièrement l'évolution de son portefeuille et les informations de ses sous-jacents</p>
              </div>
            </div>

            <div className="avantages-box">
              <h4>Les avantages des OPCVM pour les investisseurs</h4>
              <p>
                Les OPCVM constituent un moyen efficace pour les investisseurs de diversifier leur capital 
                et de profiter d'une gestion professionnelle. En investissant dans une part, ils s'exposent 
                à un portefeuille largement réparti, ce qui atténue les risques spécifiques à chaque instrument 
                financier. Réaliser une telle diversification de manière autonome sur les marchés serait 
                beaucoup plus complexe et coûteux.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="action-footer">
        <button className="btn-continue" onClick={onComplete}>
          Découvrir les FIA
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
