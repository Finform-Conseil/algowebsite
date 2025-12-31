'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import IPOHeader from '@/components/ipo/IPOHeader';
import RecentIPOs from '@/components/ipo/RecentIPOs';
import IPOStatistics from '@/components/ipo/IPOStatistics';
import UpcomingIPOs from '@/components/ipo/UpcomingIPOs';
import IPOScreener from '@/components/ipo/IPOScreener';
import {
  RECENT_IPOS,
  UPCOMING_IPOS,
  calculateIPOStatistics,
  filterIPOs
} from '@/core/data/IPOData';
import { IPOFilters } from '@/types/ipo';

type TabType = 'recent' | 'statistics' | 'upcoming' | 'screener';

export default function IPOPage() {
  const [activeTab, setActiveTab] = useState<TabType>('recent');
  const [filters, setFilters] = useState<IPOFilters>({});

  // Calculate statistics
  const statistics = useMemo(() => calculateIPOStatistics(RECENT_IPOS), []);

  // Filter IPOs based on screener filters
  const filteredIPOs = useMemo(() => {
    return filterIPOs(RECENT_IPOS, filters);
  }, [filters]);

  return (
    <div className="ipo-page">
      {/* Breadcrumb */}
      <div className="ipo-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>IPO - Introductions en Bourse</span>
      </div>

      {/* Header with key statistics */}
      <IPOHeader statistics={statistics} />

      {/* Tabs Navigation */}
      <div className="ipo-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Introductions Récentes
          </button>
          <button
            className={`tab-btn ${activeTab === 'statistics' ? 'active' : ''}`}
            onClick={() => setActiveTab('statistics')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="20" x2="18" y2="10" />
              <line x1="12" y1="20" x2="12" y2="4" />
              <line x1="6" y1="20" x2="6" y2="14" />
            </svg>
            Statistiques
          </button>
          <button
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Prochaines IPO
          </button>
          <button
            className={`tab-btn ${activeTab === 'screener' ? 'active' : ''}`}
            onClick={() => setActiveTab('screener')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            IPO Screener
          </button>
        </div>

        <div className="tabs-info">
          <div className="info-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            <span>Données mises à jour quotidiennement</span>
          </div>
        </div>
      </div>

      {/* Content with tabs */}
      <div className="ipo-content">
        {activeTab === 'recent' && (
          <div className="ipo-section recent-section">
            <RecentIPOs ipos={RECENT_IPOS} />
          </div>
        )}

        {activeTab === 'statistics' && (
          <div className="ipo-section statistics-section">
            <IPOStatistics statistics={statistics} />
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="ipo-section upcoming-section">
            <UpcomingIPOs ipos={UPCOMING_IPOS} />
          </div>
        )}

        {activeTab === 'screener' && (
          <div className="ipo-section screener-section">
            <IPOScreener ipos={filteredIPOs} onFilterChange={setFilters} />
            <div className="screener-results">
              <RecentIPOs ipos={filteredIPOs} />
            </div>
          </div>
        )}
      </div>

      {/* Floating Quick Stats */}
      <div className="floating-quick-stats">
        <div className="quick-stat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <div className="stat-info">
            <span className="stat-value">{statistics.totalIPOs}</span>
            <span className="stat-label">IPO (5 ans)</span>
          </div>
        </div>
        <div className="quick-stat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <div className="stat-info">
            <span className="stat-value">{UPCOMING_IPOS.length}</span>
            <span className="stat-label">À venir</span>
          </div>
        </div>
        <div className="quick-stat">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          <div className="stat-info">
            <span className={`stat-value ${statistics.averageReturn >= 0 ? 'positive' : 'negative'}`}>
              {statistics.averageReturn >= 0 ? '+' : ''}{statistics.averageReturn.toFixed(1)}%
            </span>
            <span className="stat-label">Performance moy.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
