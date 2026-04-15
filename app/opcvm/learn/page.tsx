'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type TabType = 'introduction' | 'opc' | 'opcvm' | 'fia' | 'quiz';

export default function OPCVMLearnPage() {
  const [activeTab, setActiveTab] = useState<TabType>('introduction');
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [selectedOpcvmTab, setSelectedOpcvmTab] = useState<string>('types');
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const backgroundImages = [
    '/images/screener-header-3.jpg',
    '/images/exchanges-header-2.jpg',
    '/images/exchanges-header-1.jpg',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [backgroundImages.length]);

  const handleQuizAnswer = (questionId: number, answerId: number) => {
    setQuizAnswers(prev => ({ ...prev, [questionId]: answerId }));
  };

  const calculateQuizScore = () => {
    const correctAnswers = [0, 1, 0, 2, 1, 0]; // Correct answer indices
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
      <div className="opcvm-header">
        <div 
          className="opcvm-header__hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${backgroundImages[currentBgIndex]})`,
          }}
        >
          <div className="opcvm-header__content">
            <div className="opcvm-header__title">
              <div className="title-content">
                <h1>Understanding Investment Funds</h1>
                <p>Essential guide to mastering UCITS and AIFs</p>
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
                  <div className="stat-label">Fund Types</div>
                  <div className="stat-value">2</div>
                  <div className="stat-sublabel">UCITS & AIFs</div>
                </div>
              </div>

              <div className="stat-card success">
                <div className="stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div className="stat-content">
                  <div className="stat-label">UCITS Types</div>
                  <div className="stat-value">5</div>
                  <div className="stat-sublabel">Money Market, Equity...</div>
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
                  <div className="stat-label">Risks</div>
                  <div className="stat-value">9</div>
                  <div className="stat-sublabel">To Know</div>
                </div>
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
            <span>Complete educational content</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="opcvm-content">
        {activeTab === 'introduction' && (
          <div className="opcvm-section introduction-section">
            <div className="section-intro">
              <h2>What is an Investment Fund?</h2>
              <p className="lead-text">
                An <strong>investment fund</strong> is a financial vehicle that pools savings from multiple investors 
                to collectively invest in various financial assets (stocks, bonds, real estate, etc.). 
                This pooling allows access to diversified investment opportunities, even with modest capital.
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
                <h3>Listed Market</h3>
                <p>
                  Exchange-traded funds (such as ETFs) can be bought and sold in real-time during market hours. 
                  Their price fluctuates continuously based on supply and demand.
                </p>
                <div className="card-badge">High liquidity</div>
              </div>

              <div className="info-card">
                <div className="card-icon accent">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                  </svg>
                </div>
                <h3>Unlisted Market</h3>
                <p>
                  Unlisted funds (traditional UCITS) are valued once per day. Subscriptions and redemptions 
                  are executed at the net asset value calculated at the end of the day.
                </p>
                <div className="card-badge">Daily valuation</div>
              </div>
            </div>

            <div className="benefits-section">
              <h3>Why Invest in a Fund?</h3>
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
                    <p>Automatic risk distribution across multiple assets and sectors</p>
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
                    <h4>Professional Management</h4>
                    <p>Expertise of qualified managers who analyze and select investments</p>
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
                    <h4>Accessibility</h4>
                    <p>Investment possible with modest amounts (sometimes from €100)</p>
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
                    <h4>Liquidity</h4>
                    <p>Ability to recover capital quickly (depending on fund type)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'opc' && (
          <div className="opcvm-section opc-section">
            <div className="section-intro">
              <h2>Collective Investment Undertaking (CIU)</h2>
              <p className="lead-text">
                A <strong>CIU (Collective Investment Undertaking)</strong> is a legal structure that allows pooling 
                the savings of multiple investors to manage them collectively. In France, the AMF (Financial Markets Authority) 
                classifies CIUs into two main categories: UCITS and AIFs.
              </p>
            </div>

            <div className="workflow-section">
              <h3>How Does a CIU Work?</h3>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>Savings Collection</h4>
                    <p>Investors subscribe to shares or units of the fund</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>Collective Management</h4>
                    <p>A professional manager invests in various financial assets</p>
                  </div>
                </div>
                <div className="workflow-arrow">→</div>
                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>Redistribution</h4>
                    <p>Gains/losses are distributed among unit holders</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="classification-section">
              <h3>AMF Classification of CIUs</h3>
              <div className="classification-grid">
                <div className="classification-card opcvm">
                  <div className="card-header">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    <h4>OPCVM</h4>
                  </div>
                  <p className="card-subtitle">Undertakings for Collective Investment in Transferable Securities</p>
                  <ul className="feature-list">
                    <li>Strict regulation (UCITS directive)</li>
                    <li>Daily liquidity</li>
                    <li>Mandatory diversification</li>
                    <li>High transparency</li>
                    <li>Accessible to the general public</li>
                  </ul>
                  <div className="card-badge primary">Regulated</div>
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
                  <p className="card-subtitle">Alternative Investment Funds</p>
                  <ul className="feature-list">
                    <li>More flexible regulation</li>
                    <li>More complex strategies</li>
                    <li>Fewer liquidity constraints</li>
                    <li>Qualified investors</li>
                    <li>Potentially higher risk</li>
                  </ul>
                  <div className="card-badge accent">Alternative</div>
                </div>
              </div>
            </div>

            <div className="key-point">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p>
                <strong>Key point:</strong> All UCITS are CIUs, but not all CIUs are UCITS. 
                AIFs represent a broader and more flexible category of CIUs.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'opcvm' && (
          <div className="opcvm-section opcvm-detail-section">
            <div className="section-intro">
              <h2>UCITS in Detail</h2>
              <p className="lead-text">
                <strong>UCITS (Undertakings for Collective Investment in Transferable Securities)</strong> are regulated investment funds 
                that offer a wide variety of strategies and risk profiles to meet the needs of all investors.
              </p>
            </div>

            {/* Sub-tabs for UCITS */}
            <div className="sub-tabs">
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'types' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('types')}
              >
                UCITS Types
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'gestion' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('gestion')}
              >
                Management Styles
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'strategies' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('strategies')}
              >
                Strategies
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'risques' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('risques')}
              >
                Risks
              </button>
              <button 
                className={`sub-tab-btn ${selectedOpcvmTab === 'choisir' ? 'active' : ''}`}
                onClick={() => setSelectedOpcvmTab('choisir')}
              >
                How to Choose
              </button>
            </div>

            {/* UCITS Types */}
            {selectedOpcvmTab === 'types' && (
              <div className="sub-content">
                <h3>The 5 Main Types of UCITS</h3>
                <div className="types-grid">
                  <div className="type-card">
                    <div className="type-icon monetary">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <h4>Money Market Funds</h4>
                    <p className="type-desc">Invest in short-term debt securities (less than one year)</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risk:</strong> Very low
                      </div>
                      <div className="detail-item">
                        <strong>Return:</strong> Low but stable
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Short term
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
                    <h4>Bond Funds</h4>
                    <p className="type-desc">Invest primarily in government or corporate bonds</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risk:</strong> Low to moderate
                      </div>
                      <div className="detail-item">
                        <strong>Return:</strong> Moderate
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Medium term
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
                    <h4>Equity Funds</h4>
                    <p className="type-desc">Invest primarily in shares of listed companies</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risk:</strong> High
                      </div>
                      <div className="detail-item">
                        <strong>Return:</strong> Potentially high
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Long term
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
                    <h4>Mixed Funds</h4>
                    <p className="type-desc">Combine stocks and bonds to balance risk and return</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risk:</strong> Moderate
                      </div>
                      <div className="detail-item">
                        <strong>Return:</strong> Balanced
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Medium/Long term
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
                    <h4>Real Estate Funds (REITs)</h4>
                    <p className="type-desc">Invest in commercial or residential real estate</p>
                    <div className="type-details">
                      <div className="detail-item">
                        <strong>Risk:</strong> Moderate
                      </div>
                      <div className="detail-item">
                        <strong>Return:</strong> Regular income
                      </div>
                      <div className="detail-item">
                        <strong>Horizon:</strong> Long term
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Management Styles */}
            {selectedOpcvmTab === 'gestion' && (
              <div className="sub-content">
                <h3>Management Styles</h3>
                <div className="management-comparison">
                  <div className="management-card passive">
                    <h4>Passive Management (Index)</h4>
                    <p className="card-desc">Replicates the performance of a benchmark index (CAC 40, S&P 500...)</p>
                    <div className="pros-cons">
                      <div className="pros">
                        <h5>✓ Advantages</h5>
                        <ul>
                          <li>Very low management fees</li>
                          <li>Predictable performance (tracks the index)</li>
                          <li>Total transparency</li>
                          <li>Automatic diversification</li>
                        </ul>
                      </div>
                      <div className="cons">
                        <h5>✗ Disadvantages</h5>
                        <ul>
                          <li>No outperformance possible</li>
                          <li>Suffers market downturns</li>
                          <li>No tactical adaptation</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="management-card active">
                    <h4>Active Management</h4>
                    <p className="card-desc">The manager actively selects securities to beat the benchmark index</p>
                    <div className="pros-cons">
                      <div className="pros">
                        <h5>✓ Advantages</h5>
                        <ul>
                          <li>Outperformance potential</li>
                          <li>Adaptation to market conditions</li>
                          <li>Manager expertise</li>
                          <li>Active risk management</li>
                        </ul>
                      </div>
                      <div className="cons">
                        <h5>✗ Disadvantages</h5>
                        <ul>
                          <li>Higher management fees</li>
                          <li>Risk of underperformance</li>
                          <li>Manager dependency</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Strategies */}
            {selectedOpcvmTab === 'strategies' && (
              <div className="sub-content">
                <h3>Main Investment Strategies</h3>
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
                      <h4>Strategic Asset Allocation</h4>
                      <p>Fixed distribution between different asset classes (e.g., 60% stocks, 40% bonds) maintained over the long term.</p>
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
                      <p>Regular investments of fixed amounts to smooth the average purchase price and reduce the impact of volatility.</p>
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
                      <h4>Thematic Investment</h4>
                      <p>Focus on specific sectors or trends (technology, healthcare, renewable energy, etc.).</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Risks */}
            {selectedOpcvmTab === 'risques' && (
              <div className="sub-content">
                <h3>The 9 Main Risks to Know</h3>
                <div className="risks-grid">
                  <div className="risk-card">
                    <div className="risk-level high">High</div>
                    <h4>Market Risk</h4>
                    <p>Fluctuations in asset value based on economic conditions</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Moderate</div>
                    <h4>Liquidity Risk</h4>
                    <p>Difficulty selling an asset quickly without impacting its price</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Moderate</div>
                    <h4>Credit Risk</h4>
                    <p>Default by a bond issuer</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Moderate</div>
                    <h4>Interest Rate Risk</h4>
                    <p>Impact of interest rate changes on bond values</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level low">Low</div>
                    <h4>Currency Risk</h4>
                    <p>Currency fluctuations for international investments</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level high">High</div>
                    <h4>Concentration Risk</h4>
                    <p>Excessive exposure to a specific sector, country, or security</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level low">Low</div>
                    <h4>Operational Risk</h4>
                    <p>Human errors, technical failures, or fraud</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level medium">Moderate</div>
                    <h4>Regulatory Risk</h4>
                    <p>Legislative changes affecting investments</p>
                  </div>

                  <div className="risk-card">
                    <div className="risk-level low">Low</div>
                    <h4>Counterparty Risk</h4>
                    <p>Failure of a party in a financial transaction</p>
                  </div>
                </div>
              </div>
            )}

            {/* How to Choose */}
            {selectedOpcvmTab === 'choisir' && (
              <div className="sub-content">
                <h3>How to Choose Your UCITS?</h3>
                <div className="selection-guide">
                  <div className="guide-step">
                    <div className="step-num">1</div>
                    <div className="step-content">
                      <h4>Define Your Objectives</h4>
                      <ul>
                        <li>Investment horizon (short, medium, long term)</li>
                        <li>Desired return objective</li>
                        <li>Need for regular income or growth</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">2</div>
                    <div className="step-content">
                      <h4>Assess Your Risk Profile</h4>
                      <ul>
                        <li>Tolerance for value fluctuations</li>
                        <li>Financial capacity to withstand losses</li>
                        <li>Investment experience</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">3</div>
                    <div className="step-content">
                      <h4>Analyze Past Performance</h4>
                      <ul>
                        <li>Compare over multiple periods (1, 3, 5 years)</li>
                        <li>Check performance consistency</li>
                        <li>Compare with the benchmark index</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">4</div>
                    <div className="step-content">
                      <h4>Examine Fees</h4>
                      <ul>
                        <li>Annual management fees</li>
                        <li>Entry/exit fees</li>
                        <li>Performance fees</li>
                      </ul>
                    </div>
                  </div>

                  <div className="guide-step">
                    <div className="step-num">5</div>
                    <div className="step-content">
                      <h4>Check Composition</h4>
                      <ul>
                        <li>Geographic and sector allocation</li>
                        <li>Fund's main positions</li>
                        <li>Level of diversification</li>
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
                    <strong>Important:</strong> Past performance does not guarantee future results. 
                    Always diversify your investments and consult an advisor if necessary.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fia' && (
          <div className="opcvm-section fia-section">
            <div className="section-intro">
              <h2>Alternative Investment Funds (AIFs)</h2>
              <p className="lead-text">
                <strong>AIFs (Alternative Investment Funds)</strong> include all funds that are not UCITS. 
                They offer more diversified and often more complex investment strategies.
              </p>
            </div>

            <div className="comparison-table">
              <h3>UCITS vs AIFs: Main Differences</h3>
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Criteria</th>
                      <th>UCITS</th>
                      <th>AIFs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Regulation</strong></td>
                      <td>UCITS Directive (very strict)</td>
                      <td>AIFM Directive (more flexible)</td>
                    </tr>
                    <tr>
                      <td><strong>Liquidity</strong></td>
                      <td>Daily mandatory</td>
                      <td>Variable by fund</td>
                    </tr>
                    <tr>
                      <td><strong>Diversification</strong></td>
                      <td>Strict rules (max 10% per security)</td>
                      <td>More flexibility</td>
                    </tr>
                    <tr>
                      <td><strong>Leverage</strong></td>
                      <td>Limited</td>
                      <td>Allowed</td>
                    </tr>
                    <tr>
                      <td><strong>Target audience</strong></td>
                      <td>General public</td>
                      <td>Often qualified investors</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="characteristics-section">
              <h3>Distinctive Characteristics of AIFs</h3>
              <div className="characteristics-grid">
                <div className="characteristic-card">
                  <div className="char-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                    </svg>
                  </div>
                  <h4>Strategic Flexibility</h4>
                  <p>Ability to use complex strategies: short selling, arbitrage, derivatives...</p>
                </div>

                <div className="characteristic-card">
                  <div className="char-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                  <h4>Variable Liquidity</h4>
                  <p>Subscription/redemption periods adapted to the strategy (monthly, quarterly, or even annual)</p>
                </div>

                <div className="characteristic-card">
                  <div className="char-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                  </div>
                  <h4>Sophisticated Investors</h4>
                  <p>Often reserved for professional investors or those with financial expertise</p>
                </div>
              </div>
            </div>

            <div className="fia-types">
              <h3>Main Types of AIFs</h3>
              <div className="fia-types-grid">
                <div className="fia-type-card">
                  <div className="fia-type-header">
                    <div className="fia-icon">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <h4>Real Estate AIFs</h4>
                  </div>
                  <p>Invest in commercial, residential, or professional real estate</p>
                  <ul>
                    <li>REITs (Real Estate Investment Trusts)</li>
                    <li>Real Estate Collective Investment Schemes</li>
                    <li>Real Estate Companies</li>
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
                  <p>Speculative funds using sophisticated strategies</p>
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
                  <p>Invest in unlisted companies</p>
                  <ul>
                    <li>Venture capital (start-ups)</li>
                    <li>Growth capital</li>
                    <li>LBO (leveraged buyouts)</li>
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
                <strong>Warning:</strong> AIFs generally present a higher level of risk and complexity than UCITS. 
                They require a good understanding of financial markets and are often subject to specific access conditions.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="opcvm-section quiz-section">
            <div className="section-intro">
              <h2>Test Your Knowledge</h2>
              <p className="lead-text">
                Assess your understanding of investment funds with this 6-question quiz.
              </p>
            </div>

            {!showQuizResults ? (
              <div className="quiz-container">
                {/* Question 1 */}
                <div className="quiz-question">
                  <h4>1. What is an investment fund?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[0] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(0, 0)}
                    >
                      A financial vehicle that pools savings from multiple investors
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[0] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(0, 1)}
                    >
                      An interest-bearing bank account
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[0] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(0, 2)}
                    >
                      A stock listed on the exchange
                    </button>
                  </div>
                </div>

                {/* Question 2 */}
                <div className="quiz-question">
                  <h4>2. What is the main difference between listed and unlisted markets?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[1] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(1, 0)}
                    >
                      The level of risk
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[1] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(1, 1)}
                    >
                      The frequency of valuation and trading
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[1] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(1, 2)}
                    >
                      The minimum investment amount
                    </button>
                  </div>
                </div>

                {/* Question 3 */}
                <div className="quiz-question">
                  <h4>3. What does UCITS stand for?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[2] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(2, 0)}
                    >
                      Undertakings for Collective Investment in Transferable Securities
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[2] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(2, 1)}
                    >
                      United Committee for Investment and Trading Standards
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[2] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(2, 2)}
                    >
                      Universal Capital Investment and Trading System
                    </button>
                  </div>
                </div>

                {/* Question 4 */}
                <div className="quiz-question">
                  <h4>4. Which type of fund generally presents the highest risk?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[3] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(3, 0)}
                    >
                      Money market funds
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[3] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(3, 1)}
                    >
                      Bond funds
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[3] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(3, 2)}
                    >
                      Equity funds
                    </button>
                  </div>
                </div>

                {/* Question 5 */}
                <div className="quiz-question">
                  <h4>5. What is passive management?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[4] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(4, 0)}
                    >
                      The manager actively selects securities
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[4] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(4, 1)}
                    >
                      The fund replicates a benchmark index
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[4] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(4, 2)}
                    >
                      The fund is not actively managed
                    </button>
                  </div>
                </div>

                {/* Question 6 */}
                <div className="quiz-question">
                  <h4>6. What is the main difference between UCITS and AIFs?</h4>
                  <div className="quiz-options">
                    <button 
                      className={`quiz-option ${quizAnswers[5] === 0 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(5, 0)}
                    >
                      The level of regulation and flexibility
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[5] === 1 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(5, 1)}
                    >
                      The type of assets they invest in
                    </button>
                    <button 
                      className={`quiz-option ${quizAnswers[5] === 2 ? 'selected' : ''}`}
                      onClick={() => handleQuizAnswer(5, 2)}
                    >
                      The management fees
                    </button>
                  </div>
                </div>

                <div className="quiz-actions">
                  <button 
                    className="btn-submit-quiz"
                    onClick={calculateQuizScore}
                    disabled={Object.keys(quizAnswers).length < 6}
                  >
                    Submit my answers
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
                    {quizScore === 6 && 'Perfect! 🎉'}
                    {quizScore === 5 && 'Excellent! 👏'}
                    {quizScore === 4 && 'Very good! 👍'}
                    {quizScore === 3 && 'Good! 📚'}
                    {quizScore !== null && quizScore < 3 && 'Needs review 📖'}
                  </h3>
                  <p>
                    {quizScore !== null && quizScore >= 5 && 'You have a perfect mastery of investment fund concepts!'}
                    {quizScore === 4 && 'You have a good understanding of investment funds.'}
                    {quizScore === 3 && 'You have solid foundations, but some review would be beneficial.'}
                    {quizScore !== null && quizScore < 3 && 'We recommend re-reading the previous sections for better understanding.'}
                  </p>
                </div>

                <div className="results-actions">
                  <button className="btn-retry" onClick={resetQuiz}>
                    Restart quiz
                  </button>
                  <button className="btn-review" onClick={() => setActiveTab('introduction')}>
                    Review lessons
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
