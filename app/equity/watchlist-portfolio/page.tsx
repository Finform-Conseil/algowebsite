'use client';

import { useState } from 'react';
import Link from 'next/link';
import WatchlistView from '@/components/watchlist-portfolio/WatchlistView';
import AlertsManager from '@/components/watchlist-portfolio/AlertsManager';
import PortfolioView from '@/components/watchlist-portfolio/PortfolioView';
import {
  DEFAULT_WATCHLIST,
  MOCK_ALERTS,
  MOCK_PORTFOLIO,
  MOCK_QUICK_STATS
} from '@/core/data/WatchlistPortfolioData';

type TabType = 'watchlist' | 'alerts' | 'portfolio';

export default function WatchlistPortfolioPage() {
  const [activeTab, setActiveTab] = useState<TabType>('watchlist');
  const quickStats = MOCK_QUICK_STATS;

  return (
    <div className="watchlist-portfolio-page">
      {/* Breadcrumb */}
      <div className="portfolio-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>Watchlist & Portfolio</span>
      </div>

      {/* Quick Stats Bar */}
      <div className="quick-stats-bar">
        <div className="stat-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
          <div className="stat-content">
            <span className="stat-label">Watchlist</span>
            <span className="stat-value">{quickStats.totalWatchlistStocks} actions</span>
          </div>
        </div>

        <div className="stat-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div className="stat-content">
            <span className="stat-label">Alertes actives</span>
            <span className="stat-value">{quickStats.activeAlerts}</span>
          </div>
        </div>

        <div className="stat-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <div className="stat-content">
            <span className="stat-label">Valeur portfolio</span>
            <span className="stat-value">
              {(quickStats.portfolioValue / 1000000).toFixed(2)}M XOF
            </span>
          </div>
        </div>

        <div className="stat-item">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <div className="stat-content">
            <span className="stat-label">Gain aujourd'hui</span>
            <span className={`stat-value ${quickStats.todayGain >= 0 ? 'positive' : 'negative'}`}>
              {quickStats.todayGain >= 0 ? '+' : ''}{(quickStats.todayGain / 1000).toFixed(1)}K XOF
              ({quickStats.todayGainPercent >= 0 ? '+' : ''}{quickStats.todayGainPercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        <button className="btn-export">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Exporter
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="portfolio-tabs">
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === 'watchlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('watchlist')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Watchlist
          </button>
          <button
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alertes
            {quickStats.activeAlerts > 0 && (
              <span className="tab-badge">{quickStats.activeAlerts}</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'portfolio' ? 'active' : ''}`}
            onClick={() => setActiveTab('portfolio')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Portfolio
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="portfolio-content">
        {activeTab === 'watchlist' && (
          <div className="portfolio-section watchlist-section">
            <WatchlistView
              stocks={DEFAULT_WATCHLIST.stocks}
              onAddStock={() => console.log('Add stock')}
              onRemoveStock={(id) => console.log('Remove stock', id)}
            />
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="portfolio-section alerts-section">
            <AlertsManager
              alerts={MOCK_ALERTS}
              onCreateAlert={() => console.log('Create alert')}
              onDeleteAlert={(id) => console.log('Delete alert', id)}
              onToggleAlert={(id) => console.log('Toggle alert', id)}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="portfolio-section portfolio-main-section">
            <PortfolioView
              portfolio={MOCK_PORTFOLIO}
              onBuyStock={() => console.log('Buy stock')}
              onSellStock={(id) => console.log('Sell stock', id)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
