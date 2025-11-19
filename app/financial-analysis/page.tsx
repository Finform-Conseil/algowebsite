'use client';

import { useState } from 'react';
import Link from 'next/link';
import CompanyOverview from '@/components/financial-analysis/CompanyOverview';
import FinancialStatements from '@/components/financial-analysis/FinancialStatements';
import FinancialRatios from '@/components/financial-analysis/FinancialRatios';
import CompanyProfile from '@/components/financial-analysis/CompanyProfile';
import { SONATEL_DATA } from '@/core/data/FinancialData';

type TabType = 'overview' | 'statements' | 'ratios' | 'profile';

export default function FinancialAnalysisPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { profile, incomeStatements, balanceSheets, cashFlowStatements, ratios, statistics } = SONATEL_DATA;

  return (
    <div className="financial-analysis-page">
      {/* Breadcrumb */}
      <div className="financial-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>Analyse Financière</span>
        <span>/</span>
        <span>{profile.name}</span>
      </div>

      {/* Tabs Navigation */}
      <div className="financial-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
              <path d="M22 12A10 10 0 0 0 12 2v10z" />
            </svg>
            Vue d'ensemble
          </button>
          <button
            className={`tab-btn ${activeTab === 'statements' ? 'active' : ''}`}
            onClick={() => setActiveTab('statements')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            États Financiers
          </button>
          <button
            className={`tab-btn ${activeTab === 'ratios' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratios')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            Ratios & Statistiques
          </button>
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Profil Complet
          </button>
        </div>

        <div className="tabs-info">
          <div className="info-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>Données financières certifiées</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="financial-content">
        {activeTab === 'overview' && (
          <div className="financial-section overview-section">
            <CompanyOverview profile={profile} latestRatios={ratios[0]} />
          </div>
        )}

        {activeTab === 'statements' && (
          <div className="financial-section statements-section">
            <FinancialStatements
              incomeStatements={incomeStatements}
              balanceSheets={balanceSheets}
              cashFlowStatements={cashFlowStatements}
              currency={profile.currency}
            />
          </div>
        )}

        {activeTab === 'ratios' && (
          <div className="financial-section ratios-section">
            <FinancialRatios ratios={ratios} statistics={statistics} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="financial-section profile-section">
            <CompanyProfile profile={profile} />
          </div>
        )}
      </div>
    </div>
  );
}
