'use client';

import { useState } from 'react';
import Link from 'next/link';

type TabType = 'introduction' | 'opc' | 'opcvm' | 'fia' | 'quiz';

export default function OPCVMLearnPage() {
  const [activeTab, setActiveTab] = useState<TabType>('introduction');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedOpcvmTab, setSelectedOpcvmTab] = useState<string>('types');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const handleQuizAnswer = (questionId: number, answerId: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const calculateQuizScore = () => {
    const correctAnswers = [0, 1, 0, 2, 1, 0]; // Indices des bonnes réponses
    let score = 0;
    correctAnswers.forEach((correct, index) => {
      if (quizAnswers[index] === correct) score++;
    });
    setQuizScore(score);
    setShowQuizResults(true);
  };

  const resetQuiz = () => {
    setQuizAnswers({});
    setQuizScore(null);
    setShowQuizResults(false);
  };

  return (
    <div className="opcvm-learn-page">
      {/* Breadcrumb */}
      <div className="opcvm-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <Link href="/opcvm">OPCVM</Link>
        <span>/</span>
        <span>S'instruire - Guide Complet</span>
      </div>

      {/* Header */}
      <div className="opcvm-header">
        <div className="opcvm-header__content">
          <div className="opcvm-header__title">
            <div className="title-content">
              <h1>Comprendre les Fonds d'Investissement</h1>
              <p>Guide essentiel pour maîtriser les OPCVM et FIA</p>
            </div>
            <div className="learning-badge">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>15-20 min</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="opcvm-stats">
            <div className="stat-card primary">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Types de Fonds</div>
                <div className="stat-value">2</div>
                <div className="stat-sublabel">OPCVM & FIA</div>
              </div>
            </div>

            <div className="stat-card success">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Types d'OPCVM</div>
                <div className="stat-value">5</div>
                <div className="stat-sublabel">Monétaires, Actions...</div>
              </div>
            </div>

            <div className="stat-card info">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Quiz</div>
                <div className="stat-value">{quizScore !== null ? `${quizScore}/6` : '6'}</div>
                <div className="stat-sublabel">Questions</div>
              </div>
            </div>

            <div className="stat-card warning">
              <div className="stat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="stat-content">
                <div className="stat-label">Risques</div>
                <div className="stat-value">9</div>
                <div className="stat-sublabel">À connaître</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="opcvm-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'introduction' ? 'active' : ''}`}
            onClick={() => setActiveTab('introduction')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
            Introduction
          </button>
          <button
            className={`tab-btn ${activeTab === 'opc' ? 'active' : ''}`}
            onClick={() => setActiveTab('opc')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            OPC
          </button>
          <button
            className={`tab-btn ${activeTab === 'opcvm' ? 'active' : ''}`}
            onClick={() => setActiveTab('opcvm')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            OPCVM
          </button>
          <button
            className={`tab-btn ${activeTab === 'fia' ? 'active' : ''}`}
            onClick={() => setActiveTab('fia')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            FIA
          </button>
          <button
            className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
            onClick={() => setActiveTab('quiz')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Quiz
          </button>
        </div>

        <div className="tabs-info">
          <div className="info-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>Contenu pédagogique complet</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="opcvm-content">
        {activeTab === 'introduction' && (
          <div className="opcvm-section introduction-section">
            <div className="section-intro">
              <h2>Qu'est-ce qu'un Fonds d'Investissement ?</h2>
              <p className="lead-text">
                Un <strong>fonds d'investissement</strong> est un véhicule financier qui collecte l'épargne de plusieurs investisseurs 
                pour la placer collectivement dans divers actifs financiers (actions, obligations, immobilier, etc.). 
                Cette mutualisation permet d'accéder à des opportunités d'investissement diversifiées, même avec un capital modeste.
              </p>
            </div>

            <div className="content-grid">
              <div className="info-card">
                <div className="card-icon primary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                </div>
                <h3>Marché Coté</h3>
                <p>
                  Les fonds cotés en bourse (comme les ETF) peuvent être achetés et vendus en temps réel pendant les heures 
                  de marché. Leur prix fluctue en continu selon l'offre et la demande.
                </p>
                <div className="card-badge">Liquidité élevée</div>
              </div>

              <div className="info-card">
                <div className="card-icon accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3>Marché Non Coté</h3>
                <p>
                  Les fonds non cotés (OPCVM classiques) sont valorisés une fois par jour. Les souscriptions et rachats 
                  s'effectuent à la valeur liquidative calculée en fin de journée.
                </p>
                <div className="card-badge">Valorisation quotidienne</div>
              </div>
            </div>

            <div className="benefits-section">
              <h3>Pourquoi Investir dans un Fonds ?</h3>
              <div className="benefits-grid">
                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div>
                    <h4>Diversification</h4>
                    <p>Répartition automatique du risque sur plusieurs actifs et secteurs</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <h4>Gestion Professionnelle</h4>
                    <p>Expertise de gérants qualifiés qui analysent et sélectionnent les investissements</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <div>
                    <h4>Accessibilité</h4>
                    <p>Investissement possible avec des montants modestes (parfois dès 100€)</p>
                  </div>
                </div>

                <div className="benefit-item">
                  <div className="benefit-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  </div>
                  <div>
                    <h4>Liquidité</h4>
                    <p>Possibilité de récupérer son capital rapidement (selon le type de fonds)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opc' && (
          <div className="opcvm-section opc-section">
            <div className="section-intro">
              <h2>Organisme de Placement Collectif (OPC)</h2>
              <p className="lead-text">
                Un <strong>OPC (Organisme de Placement Collectif)</strong> est une structure juridique qui permet de regrouper 
                l'épargne de plusieurs investisseurs pour la gérer collectivement. En France, l'AMF (Autorité des Marchés Financiers) 
                classe les OPC en deux grandes catégories : les OPCVM et les FIA.
              </p>
            </div>

            <div className="workflow-section">
              <h3>Comment fonctionne un OPC ?</h3>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Collecte de l'épargne</h4>
                    <p>Les investisseurs souscrivent des parts ou actions du fonds</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Gestion collective</h4>
                    <p>Un gérant professionnel investit dans divers actifs financiers</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Redistribution</h4>
                    <p>Les gains/pertes sont répartis entre les porteurs de parts</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="classification-section">
              <h3>Classification AMF des OPC</h3>
              <div className="classification-grid">
                <div className="classification-card opcvm">
                  <div className="card-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h4>OPCVM</h4>
                  </div>
                  <p className="card-subtitle">Organismes de Placement Collectif en Valeurs Mobilières</p>
                  <ul className="feature-list">
                    <li>Réglementation stricte (directive UCITS)</li>
                    <li>Liquidité quotidienne</li>
                    <li>Diversification obligatoire</li>
                    <li>Transparence élevée</li>
                    <li>Accessible au grand public</li>
                  </ul>
                  <div className="card-badge primary">Régulé</div>
                </div>

                <div className="classification-card fia">
                  <div className="card-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <h4>FIA</h4>
                  </div>
                  <p className="card-subtitle">Fonds d'Investissement Alternatifs</p>
                  <ul className="feature-list">
                    <li>Réglementation plus souple</li>
                    <li>Stratégies plus complexes</li>
                    <li>Moins de contraintes de liquidité</li>
                    <li>Investisseurs qualifiés</li>
                    <li>Risque potentiellement plus élevé</li>
                  </ul>
                  <div className="card-badge accent">Alternatif</div>
                </div>
              </div>
            </div>

            <div className="key-point">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>
                <strong>Point clé :</strong> Tous les OPCVM sont des OPC, mais tous les OPC ne sont pas des OPCVM. 
                Les FIA représentent une catégorie plus large et plus flexible d'OPC.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'opcvm' && (
          <div className="opcvm-section opcvm-detail-section">
            <div className="section-intro">
              <h2>OPCVM en Détail</h2>
              <p className="lead-text">
                Les <strong>OPCVM (Organismes de Placement Collectif en Valeurs Mobilières)</strong> sont des fonds d'investissement 
                réglementés qui offrent une grande diversité de stratégies et de profils de risque pour répondre aux besoins de tous les investisseurs.
              </p>
            </div>

            {/* Sub-tabs for OPCVM */}
            <div className="sub-tabs">
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'types' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('types')}
              >
                Types d'OPCVM
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'gestion' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('gestion')}
              >
                Styles de Gestion
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'strategies' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('strategies')}
              >
                Stratégies
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'risques' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('risques')}
              >
                Risques
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'choisir' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('choisir')}
              >
                Comment Choisir
              </button>
            </div>

            {/* Types d'OPCVM */}
            {selectedOpcvmTab === 'types' && (
              <div className="sub-content">
                <h3>Les 5 Principaux Types d'OPCVM</h3>
                <div className="types-grid">
                  <div className="type-card">
                    <div className="type-icon monetary">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <h4>Fonds Monétaires</h4>
                    <p className="type-desc">Investissent dans des titres de créance à court terme (moins d'un an)</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risque:</strong> Très faible
                      </div>
                      <div className="detail-item">
                        <strong>Rendement:</strong> Faible mais stable
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Court terme
                      </div>
                    </div>
                  </div>

                  <div className="type-card">
                    <div className="type-icon bonds">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        <line x1="8" y1="21" x2="16" y2="21" />
                        <line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                    </div>
                    <h4>Fonds Obligataires</h4>
                    <p className="type-desc">Investissent principalement dans des obligations d'États ou d'entreprises</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risque:</strong> Faible à modéré
                      </div>
                      <div className="detail-item">
                        <strong>Rendement:</strong> Modéré
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Moyen terme
                      </div>
                    </div>
                  </div>

                  <div className="type-card">
                    <div className="type-icon equity">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                    </div>
                    <h4>Fonds Actions</h4>
                    <p className="type-desc">Investissent majoritairement dans des actions de sociétés cotées</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risque:</strong> Élevé
                      </div>
                      <div className="detail-item">
                        <strong>Rendement:</strong> Potentiellement élevé
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Long terme
                      </div>
                    </div>
                  </div>

                  <div className="type-card">
                    <div className="type-icon mixed">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="20" x2="12" y2="10" />
                        <line x1="18" y1="20" x2="18" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="16" />
                      </svg>
                    </div>
                    <h4>Fonds Mixtes</h4>
                    <p className="type-desc">Combinent actions et obligations pour équilibrer risque et rendement</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risque:</strong> Modéré
                      </div>
                      <div className="detail-item">
                        <strong>Rendement:</strong> Équilibré
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Moyen/Long terme
                      </div>
                    </div>
                  </div>

                  <div className="type-card">
                    <div className="type-icon real-estate">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <h4>Fonds Immobiliers (SCPI)</h4>
                    <p className="type-desc">Investissent dans l'immobilier professionnel ou résidentiel</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risque:</strong> Modéré
                      </div>
                      <div className="detail-item">
                        <strong>Rendement:</strong> Revenus réguliers
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Long terme
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Styles de Gestion */}
            {selectedOpcvmTab === 'gestion' && (
              <div className="sub-content">
                <h3>Styles de Gestion</h3>
                <div className="management-comparison">
                  <div className="management-card passive">
                    <h4>Gestion Passive (Indicielle)</h4>
                    <p className="card-desc">Réplique la performance d'un indice de référence (CAC 40, S&P 500...)</p>
                    <div className="pros-cons">
                      <div className="pros">
                        <h5>✓ Avantages</h5>
                        <ul>
                          <li>Frais de gestion très faibles</li>
                          <li>Performance prévisible (suit l'indice)</li>
                          <li>Transparence totale</li>
                          <li>Diversification automatique</li>
                        </ul>
                      </div>
                      <div className="cons">
                        <h5>✗ Inconvénients</h5>
                        <ul>
                          <li>Pas de surperformance possible</li>
                          <li>Subit les baisses du marché</li>
                          <li>Pas d'adaptation tactique</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="management-card active">
                    <h4>Gestion Active</h4>
                    <p className="card-desc">Le gérant sélectionne activement les titres pour battre l'indice de référence</p>
                    <div className="pros-cons">
                      <div className="pros">
                        <h5>✓ Avantages</h5>
                        <ul>
                          <li>Potentiel de surperformance</li>
                          <li>Adaptation aux conditions de marché</li>
                          <li>Expertise du gérant</li>
                          <li>Gestion des risques active</li>
                        </ul>
                      </div>
                      <div className="cons">
                        <h5>✗ Inconvénients</h5>
                        <ul>
                          <li>Frais de gestion plus élevés</li>
                          <li>Risque de sous-performance</li>
                          <li>Dépendance au gérant</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Stratégies */}
            {selectedOpcvmTab === 'strategies' && (
              <div className="sub-content">
                <h3>Principales Stratégies d'Investissement</h3>
                <div className="strategies-list">
                  <div className="strategy-item">
                    <div className="strategy-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="6" />
                        <circle cx="12" cy="12" r="2" />
                      </svg>
                    </div>
                    <div className="strategy-content">
                      <h4>Allocation d'Actifs Stratégique</h4>
                      <p>Répartition fixe entre différentes classes d'actifs (ex: 60% actions, 40% obligations) maintenue sur le long terme.</p>
                    </div>
                  </div>

                  <div className="strategy-item">
                    <div className="strategy-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                    </div>
                    <div className="strategy-content">
                      <h4>Dollar Cost Averaging (DCA)</h4>
                      <p>Investissements réguliers de montants fixes pour lisser le prix d'achat moyen et réduire l'impact de la volatilité.</p>
                    </div>
                  </div>

                  <div className="strategy-item">
                    <div className="strategy-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className="strategy-content">
                      <h4>Investissement Thématique</h4>
                      <p>Focus sur des secteurs ou tendances spécifiques (technologie, santé, énergies renouvelables, etc.).</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Risques */}
            {selectedOpcvmTab === 'risques' && (
              <div className="sub-content">
                <h3>Les 9 Principaux Risques à Connaître</h3>
                <div className="risks-grid">
                  <div className="risk-card">
                    <div className="risk-level high">Élevé</div>
                    <h4>Risque de Marché</h4>
                    <p>Fluctuations de la valeur des actifs en fonction des conditions économiques</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Modéré</div>
                    <h4>Risque de Liquidité</h4>
                    <p>Difficulté à vendre rapidement un actif sans impact sur son prix</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Modéré</div>
                    <h4>Risque de Crédit</h4>
                    <p>Défaut de paiement d'un émetteur d'obligations</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Modéré</div>
                    <h4>Risque de Taux</h4>
                    <p>Impact des variations de taux d'intérêt sur la valeur des obligations</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level low">Faible</div>
                    <h4>Risque de Change</h4>
                    <p>Fluctuations des devises pour les investissements internationaux</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level high">Élevé</div>
                    <h4>Risque de Concentration</h4>
                    <p>Exposition excessive à un secteur, pays ou titre spécifique</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level low">Faible</div>
                    <h4>Risque Opérationnel</h4>
                    <p>Erreurs humaines, défaillances techniques ou fraudes</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Modéré</div>
                    <h4>Risque Réglementaire</h4>
                    <p>Changements de législation affectant les investissements</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level low">Faible</div>
                    <h4>Risque de Contrepartie</h4>
                    <p>Défaillance d'une partie dans une transaction financière</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comment Choisir */}
            {selectedOpcvmTab === 'choisir' && (
              <div className="sub-content">
                <h3>Comment Choisir son OPCVM ?</h3>
                <div className="selection-guide">
                  <div className="guide-step">
                    <div className="step-num">1</div>
                    <div className="step-content">
                      <h4>Définir vos Objectifs</h4>
                      <ul>
                        <li>Horizon d'investissement (court, moyen, long terme)</li>
                        <li>Objectif de rendement souhaité</li>
                        <li>Besoin de revenus réguliers ou de croissance</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">2</div>
                    <div className="step-content">
                      <h4>Évaluer votre Profil de Risque</h4>
                      <ul>
                        <li>Tolérance aux fluctuations de valeur</li>
                        <li>Capacité financière à supporter des pertes</li>
                        <li>Expérience en investissement</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">3</div>
                    <div className="step-content">
                      <h4>Analyser les Performances Passées</h4>
                      <ul>
                        <li>Comparer sur plusieurs périodes (1, 3, 5 ans)</li>
                        <li>Vérifier la régularité des performances</li>
                        <li>Comparer avec l'indice de référence</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">4</div>
                    <div className="step-content">
                      <h4>Examiner les Frais</h4>
                      <ul>
                        <li>Frais de gestion annuels</li>
                        <li>Frais d'entrée/sortie</li>
                        <li>Frais de performance</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">5</div>
                    <div className="step-content">
                      <h4>Vérifier la Composition</h4>
                      <ul>
                        <li>Répartition géographique et sectorielle</li>
                        <li>Principales positions du fonds</li>
                        <li>Niveau de diversification</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="key-point">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <p>
                    <strong>Important :</strong> Les performances passées ne préjugent pas des performances futures. 
                    Diversifiez toujours vos investissements et consultez un conseiller si nécessaire.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fia' && (
          <div className="opcvm-section fia-section">
            <div className="section-intro">
              <h2>Fonds d'Investissement Alternatifs (FIA)</h2>
              <p className="lead-text">
                Les <strong>FIA (Fonds d'Investissement Alternatifs)</strong> regroupent tous les fonds qui ne sont pas des OPCVM. 
                Ils offrent des stratégies d'investissement plus diversifiées et souvent plus complexes.
              </p>
            </div>

            <div className="comparison-table">
              <h3>OPCVM vs FIA : Principales Différences</h3>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Critère</th>
                      <th>OPCVM</th>
                      <th>FIA</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Réglementation</strong></td>
                      <td>Directive UCITS (très stricte)</td>
                      <td>Directive AIFM (plus souple)</td>
                    </tr>
                    <tr>
                      <td><strong>Liquidité</strong></td>
                      <td>Quotidienne obligatoire</td>
                      <td>Variable selon le fonds</td>
                    </tr>
                    <tr>
                      <td><strong>Diversification</strong></td>
                      <td>Règles strictes (max 10% par titre)</td>
                      <td>Plus de flexibilité</td>
                    </tr>
                    <tr>
                      <td><strong>Effet de levier</strong></td>
                      <td>Limité</td>
                      <td>Autorisé</td>
                    </tr>
                    <tr>
                      <td><strong>Public cible</strong></td>
                      <td>Grand public</td>
                      <td>Souvent investisseurs qualifiés</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="characteristics-section">
              <h3>Caractéristiques Distinctives des FIA</h3>
              <div className="characteristics-grid">
                <div className="characteristic-card">
                  <div className="char-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  </div>
                  <h4>Flexibilité Stratégique</h4>
                  <p>Possibilité d'utiliser des stratégies complexes : vente à découvert, arbitrage, produits dérivés...</p>
                </div>

                <div className="characteristic-card">
                  <div className="char-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h4>Liquidité Variable</h4>
                  <p>Périodes de souscription/rachat adaptées à la stratégie (mensuelle, trimestrielle, voire annuelle)</p>
                </div>

                <div className="characteristic-card">
                  <div className="char-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <h4>Investisseurs Avertis</h4>
                  <p>Souvent réservés aux investisseurs professionnels ou disposant d'une expertise financière</p>
                </div>
              </div>
            </div>

            <div className="fia-types">
              <h3>Principaux Types de FIA</h3>
              <div className="fia-types-grid">
                <div className="fia-type-card">
                  <div className="fia-type-header">
                    <div className="fia-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <h4>FIA Immobiliers</h4>
                  </div>
                  <p>Investissent dans l'immobilier professionnel, résidentiel ou commercial</p>
                  <ul>
                    <li>SCPI (Sociétés Civiles de Placement Immobilier)</li>
                    <li>OPCI (Organismes de Placement Collectif Immobilier)</li>
                    <li>SCI (Sociétés Civiles Immobilières)</li>
                  </ul>
                </div>

                <div className="fia-type-card">
                  <div className="fia-type-header">
                    <div className="fia-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                        <line x1="1" y1="6" x2="23" y2="6" />
                      </svg>
                    </div>
                    <h4>Hedge Funds</h4>
                  </div>
                  <p>Fonds spéculatifs utilisant des stratégies sophistiquées</p>
                  <ul>
                    <li>Long/Short equity</li>
                    <li>Market neutral</li>
                    <li>Event-driven</li>
                  </ul>
                </div>

                <div className="fia-type-card">
                  <div className="fia-type-header">
                    <div className="fia-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                    </div>
                    <h4>Private Equity</h4>
                  </div>
                  <p>Investissent dans des entreprises non cotées</p>
                  <ul>
                    <li>Capital-risque (start-ups)</li>
                    <li>Capital-développement</li>
                    <li>LBO (rachat d'entreprises)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="key-point">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p>
                <strong>Attention :</strong> Les FIA présentent généralement un niveau de risque et de complexité plus élevé que les OPCVM. 
                Ils nécessitent une bonne compréhension des marchés financiers et sont souvent soumis à des conditions d'accès spécifiques.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="opcvm-section quiz-section">
            <div className="section-intro">
              <h2>Testez vos Connaissances</h2>
              <p className="lead-text">
                Évaluez votre compréhension des fonds d'investissement avec ce quiz de 6 questions.
              </p>
            </div>

            {!showQuizResults ? (
              <div className="quiz-container">
                {/* Question 1 */}
                <div className="quiz-question">
                  <h4>1. Qu'est-ce qu'un fonds d'investissement ?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[0] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(0, 0)}
                    >
                      Un véhicule financier qui collecte l'épargne de plusieurs investisseurs
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[0] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(0, 1)}
                    >
                      Un compte bancaire rémunéré
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[0] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(0, 2)}
                    >
                      Une action cotée en bourse
                    </button>
                  </div>
                </div>

                {/* Question 2 */}
                <div className="quiz-question">
                  <h4>2. Quelle est la principale différence entre marché coté et non coté ?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[1] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(1, 0)}
                    >
                      Le niveau de risque
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[1] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(1, 1)}
                    >
                      La fréquence de valorisation et de négociation
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[1] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(1, 2)}
                    >
                      Le montant minimum d'investissement
                    </button>
                  </div>
                </div>

                {/* Question 3 */}
                <div className="quiz-question">
                  <h4>3. Que signifie OPCVM ?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[2] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(2, 0)}
                    >
                      Organisme de Placement Collectif en Valeurs Mobilières
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[2] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(2, 1)}
                    >
                      Organisation Publique de Contrôle des Valeurs Monétaires
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[2] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(2, 2)}
                    >
                      Office de Protection des Capitaux et Valeurs Mobilières
                    </button>
                  </div>
                </div>

                {/* Question 4 */}
                <div className="quiz-question">
                  <h4>4. Quel type de fonds présente généralement le risque le plus élevé ?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[3] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(3, 0)}
                    >
                      Fonds monétaires
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[3] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(3, 1)}
                    >
                      Fonds obligataires
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[3] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(3, 2)}
                    >
                      Fonds actions
                    </button>
                  </div>
                </div>

                {/* Question 5 */}
                <div className="quiz-question">
                  <h4>5. Qu'est-ce que la gestion passive ?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[4] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(4, 0)}
                    >
                      Le gérant sélectionne activement les titres
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[4] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(4, 1)}
                    >
                      Le fonds réplique un indice de référence
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[4] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(4, 2)}
                    >
                      Le fonds n'est pas géré activement
                    </button>
                  </div>
                </div>

                {/* Question 6 */}
                <div className="quiz-question">
                  <h4>6. Quelle est la principale différence entre OPCVM et FIA ?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[5] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(5, 0)}
                    >
                      Le niveau de réglementation et de flexibilité
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[5] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(5, 1)}
                    >
                      Le type d'actifs dans lesquels ils investissent
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[5] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(5, 2)}
                    >
                      Les frais de gestion
                    </button>
                  </div>
                </div>

                <div className="quiz-actions">
                  <button 
                    className="btn-submit-quiz"
                    onClick={calculateQuizScore}
                    disabled={Object.keys(quizAnswers).length < 6}
                  >
                    Soumettre mes réponses
                  </button>
                </div>
              </div>
            ) : (
              <div className="quiz-results">
                <div className="results-header">
                  <div className="score-circle">
                    <div className="score-value">{quizScore}/6</div>
                    <div className="score-label">Score</div>
                  </div>
                  <h3>
                    {quizScore === 6 && 'Parfait ! 🎉'}
                    {quizScore === 5 && 'Excellent ! 👏'}
                    {quizScore === 4 && 'Très bien ! 👍'}
                    {quizScore === 3 && 'Bien ! 📚'}
                    {quizScore !== null && quizScore < 3 && 'À revoir 📖'}
                  </h3>
                  <p>
                    {quizScore !== null && quizScore >= 5 && 'Vous maîtrisez parfaitement les concepts des fonds d\'investissement !'}
                    {quizScore === 4 && 'Vous avez une bonne compréhension des fonds d\'investissement.'}
                    {quizScore === 3 && 'Vous avez des bases solides, mais quelques révisions seraient bénéfiques.'}
                    {quizScore !== null && quizScore < 3 && 'Nous vous recommandons de relire les sections précédentes pour mieux comprendre.'}
                  </p>
                </div>

                <div className="results-actions">
                  <button className="btn-retry" onClick={resetQuiz}>
                    Recommencer le quiz
                  </button>
                  <button className="btn-review" onClick={() => setActiveTab('introduction')}>
                    Revoir les leçons
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
