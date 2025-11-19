'use client';

import { CompanyProfile as ProfileType } from '@/types/financial-analysis';

interface CompanyProfileProps {
  profile: ProfileType;
}

export default function CompanyProfile({ profile }: CompanyProfileProps) {
  return (
    <div className="company-profile">
      <div className="profile-header">
        <h2>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Profil Complet
        </h2>
      </div>

      {/* Description détaillée */}
      <div className="profile-section">
        <h3>Description de l'entreprise</h3>
        <p className="description-text">{profile.description}</p>
      </div>

      {/* Organigramme / Structure */}
      {(profile.parentCompany || (profile.subsidiaries && profile.subsidiaries.length > 0)) && (
        <div className="profile-section">
          <h3>Structure du groupe</h3>
          <div className="org-chart">
            {profile.parentCompany && (
              <div className="org-level parent">
                <div className="org-node">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  <span>{profile.parentCompany}</span>
                </div>
                <div className="org-connector"></div>
              </div>
            )}
            
            <div className="org-level current">
              <div className="org-node highlight">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                </svg>
                <span>{profile.name}</span>
              </div>
            </div>

            {profile.subsidiaries && profile.subsidiaries.length > 0 && (
              <>
                <div className="org-connector"></div>
                <div className="org-level subsidiaries">
                  {profile.subsidiaries.map((sub, index) => (
                    <div key={index} className="org-node">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      </svg>
                      <span>{sub}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Documents et rapports */}
      <div className="profile-section">
        <h3>Documents financiers</h3>
        <div className="documents-grid">
          {profile.annualReportUrl && (
            <a href={profile.annualReportUrl} className="document-card" target="_blank" rel="noopener noreferrer">
              <div className="document-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>
              <div className="document-info">
                <strong>Rapport annuel</strong>
                <span>Document officiel</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          {profile.investorRelationsUrl && (
            <a href={profile.investorRelationsUrl} className="document-card" target="_blank" rel="noopener noreferrer">
              <div className="document-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="document-info">
                <strong>Relations investisseurs</strong>
                <span>Espace dédié</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          {profile.latestPresentationUrl && (
            <a href={profile.latestPresentationUrl} className="document-card" target="_blank" rel="noopener noreferrer">
              <div className="document-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="document-info">
                <strong>Présentation investisseurs</strong>
                <span>Dernière version</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          )}

          <a href={profile.website} className="document-card" target="_blank" rel="noopener noreferrer">
            <div className="document-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div className="document-info">
              <strong>Site web officiel</strong>
              <span>{profile.website.replace('https://', '')}</span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {/* Informations complémentaires */}
      <div className="profile-section">
        <h3>Informations complémentaires</h3>
        <div className="info-cards">
          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Année de fondation</span>
              <span className="info-value">{profile.founded}</span>
              <span className="info-sublabel">{new Date().getFullYear() - profile.founded} ans d'existence</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Localisation</span>
              <span className="info-value">{profile.headquarters}</span>
              <span className="info-sublabel">Siège social</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Effectifs</span>
              <span className="info-value">{profile.employees.toLocaleString()}</span>
              <span className="info-sublabel">Employés</span>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="info-content">
              <span className="info-label">Bourse</span>
              <span className="info-value">{profile.exchange}</span>
              <span className="info-sublabel">Place de cotation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
