'use client';

interface FIASectionProps {
  onComplete: () => void;
}

export default function FIASection({ onComplete }: FIASectionProps) {
  return (
    <div className="learn-section fia-section">
      <div className="section-header">
        <h2 className="section-title">II. FIA - Fonds d'Investissement Alternatif</h2>
        <div className="section-badge">Investissements Alternatifs</div>
      </div>

      <div className="content-card definition-card">
        <div className="card-header">
          <div className="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <h3>Qu'est-ce qu'un FIA ?</h3>
            <p className="card-subtitle">Une approche alternative de l'investissement</p>
          </div>
        </div>
        
        <div className="card-body">
          <p>
            Le <strong>Fonds d'Investissement Alternatif (FIA)</strong> est un type de fonds qui, 
            contrairement aux OPCVM (Sicav ou FCP) classiques, utilise des stratégies d'investissement 
            plus larges et moins conventionnelles pour générer des rendements.
          </p>
        </div>
      </div>

      <div className="comparison-section">
        <h3 className="subsection-title">FIA vs OPCVM : Les différences clés</h3>
        <div className="comparison-grid">
          <div className="comparison-card opcvm-side">
            <div className="comparison-header">
              <h4>OPCVM</h4>
              <div className="comparison-badge traditional">Traditionnel</div>
            </div>
            <ul className="comparison-list">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Valeurs mobilières classiques
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Liquidité élevée
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Réglementation stricte
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Performance relative au marché
              </li>
            </ul>
          </div>

          <div className="comparison-divider">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          <div className="comparison-card fia-side">
            <div className="comparison-header">
              <h4>FIA</h4>
              <div className="comparison-badge alternative">Alternatif</div>
            </div>
            <ul className="comparison-list">
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Actifs illiquides et alternatifs
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Liquidité variable
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Réglementation plus souple
              </li>
              <li>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Performance absolue recherchée
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="caracteristiques-section">
        <h3 className="subsection-title">Ce qui distingue un FIA</h3>
        <div className="caracteristiques-grid">
          <div className="caracteristique-card">
            <div className="caracteristique-icon flexibility">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
            </div>
            <h4>Flexibilité</h4>
            <p>Stratégies d'investissement plus larges et moins conventionnelles</p>
          </div>

          <div className="caracteristique-card">
            <div className="caracteristique-icon assets">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h4>Types d'actifs</h4>
            <ul>
              <li>Actifs illiquides</li>
              <li>Private Equity</li>
              <li>Immobilier</li>
              <li>Matières premières</li>
              <li>Produits dérivés complexes</li>
            </ul>
          </div>

          <div className="caracteristique-card">
            <div className="caracteristique-icon objective">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="16 12 12 8 8 12" />
                <line x1="12" y1="16" x2="12" y2="8" />
              </svg>
            </div>
            <h4>Objectif principal</h4>
            <p>Recherche d'une performance absolue (positive) indépendamment de l'évolution du marché</p>
          </div>
        </div>
      </div>

      <div className="types-fia-section">
        <h3 className="subsection-title">Principaux types de FIA</h3>
        <div className="types-fia-grid">
          <div className="type-fia-card immobilier">
            <div className="type-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <h4>Fonds Immobiliers</h4>
            <p>Investissement dans des actifs immobiliers physiques ou des parts de sociétés immobilières</p>
            <div className="type-examples">
              <span className="example-tag">SCPI</span>
              <span className="example-tag">OPCI</span>
              <span className="example-tag">SCI</span>
            </div>
          </div>

          <div className="type-fia-card hedge">
            <div className="type-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <h4>Hedge Funds</h4>
            <p>Stratégies sophistiquées visant à générer des rendements dans toutes les conditions de marché</p>
            <div className="type-examples">
              <span className="example-tag">Long/Short</span>
              <span className="example-tag">Market Neutral</span>
              <span className="example-tag">Arbitrage</span>
            </div>
          </div>

          <div className="type-fia-card private-equity">
            <div className="type-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h4>Private Equity</h4>
            <p>Investissement dans des entreprises non cotées en bourse</p>
            <div className="type-examples">
              <span className="example-tag">Venture Capital</span>
              <span className="example-tag">LBO</span>
              <span className="example-tag">Growth</span>
            </div>
          </div>
        </div>
      </div>

      <div className="info-box">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <div>
          <h4>À noter</h4>
          <p>
            Les FIA sont généralement destinés à des investisseurs avertis ou institutionnels, 
            avec des tickets d'entrée plus élevés et des périodes de blocage plus longues que les OPCVM.
          </p>
        </div>
      </div>

      <div className="action-footer">
        <button className="btn-continue" onClick={onComplete}>
          Tester vos connaissances
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}
