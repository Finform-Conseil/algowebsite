'use client';

import Link from 'next/link';

export default function Dashboard() {

  return (
    <main className="container-custom">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-header__title">L'Observatoire</h1>
        <p className="page-header__subtitle">
          Vue d'ensemble de vos investissements
        </p>
      </div>

      {/* Outils d'Analyse */}
      <section className="section">
        <h2 className="section__title">Outils d'Analyse</h2>
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/stock-screener-v2" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(255, 159, 4, 0.1) 100%)',
                border: '1px solid var(--accent-gold)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(255, 159, 4, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🔍</div>
                  <h3 style={{ color: 'var(--accent-gold)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Stock Screener</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Filtrage avancé avec +80 critères
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/stock-comparison" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(0, 191, 255, 0.1) 100%)',
                border: '1px solid var(--primary-color)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 191, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚖️</div>
                  <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Comparateur</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Comparaison multi-actions avancée
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/technical-analysis" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(139, 92, 246, 0.1) 100%)',
                border: '1px solid #8b5cf6',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(139, 92, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📊</div>
                  <h3 style={{ color: '#8b5cf6', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Analyse Technique</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Charts professionnels avancés
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/financial-analysis" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid #10b981',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>�</div>
                  <h3 style={{ color: '#10b981', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Analyse Financière</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Ratios et métriques détaillés
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Marchés & Actualités */}
      <section className="section">
        <h2 className="section__title">Marchés & Actualités</h2>
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/bourses" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(16, 185, 129, 0.1) 100%)',
                border: '1px solid #10b981',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(16, 185, 129, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏛️</div>
                  <h3 style={{ color: '#10b981', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Bourses Africaines</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Places boursières et performances
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/market-movers" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(245, 158, 11, 0.1) 100%)',
                border: '1px solid #f59e0b',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(245, 158, 11, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🚀</div>
                  <h3 style={{ color: '#f59e0b', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Market Movers</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Top gainers & losers du jour
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/sectors" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(236, 72, 153, 0.1) 100%)',
                border: '1px solid #ec4899',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(236, 72, 153, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏭</div>
                  <h3 style={{ color: '#ec4899', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Secteurs</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Performance par secteur
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/news-articles" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '1px solid #ef4444',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(239, 68, 68, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📰</div>
                  <h3 style={{ color: '#ef4444', marginBottom: '0.5rem', fontSize: '1.125rem' }}>News & Articles</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Actualités et analyses expertes
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Événements & Opportunités */}
      <section className="section">
        <h2 className="section__title">Événements & Opportunités</h2>
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/ipo" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(59, 130, 246, 0.1) 100%)',
                border: '1px solid #3b82f6',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🎯</div>
                  <h3 style={{ color: '#3b82f6', marginBottom: '0.5rem', fontSize: '1.125rem' }}>IPO & Introductions</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Calendrier des introductions
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/corporate-events" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(168, 85, 247, 0.1) 100%)',
                border: '1px solid #a855f7',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(168, 85, 247, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📅</div>
                  <h3 style={{ color: '#a855f7', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Événements Corporate</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Dividendes, AG, résultats
                  </p>
                </div>
              </div>
            </Link>
          </div>
          
          <div className="col-12 col-md-4 col-lg-3">
            <Link href="/watchlist-portfolio" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--card-background) 0%, rgba(6, 182, 212, 0.1) 100%)',
                border: '1px solid #06b6d4',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(6, 182, 212, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div className="card__body" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⭐</div>
                  <h3 style={{ color: '#06b6d4', marginBottom: '0.5rem', fontSize: '1.125rem' }}>Watchlist & Portfolio</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.4' }}>
                    Suivi et alertes intelligentes
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
