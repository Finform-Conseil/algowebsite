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
        </div>
      </section>
    </main>
  )
}
