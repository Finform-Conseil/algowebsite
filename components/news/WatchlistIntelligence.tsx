'use client';

import { useState } from 'react';
import { NewsArticle } from '@/types/news';

interface WatchlistIntelligenceProps {
  watchlistNews: NewsArticle[];
  portfolioEvents: any[];
  onArticleClick: (article: NewsArticle) => void;
  onTickerClick: (ticker: string) => void;
  onClose?: () => void;
}

export default function WatchlistIntelligence({ 
  watchlistNews, 
  portfolioEvents, 
  onArticleClick, 
  onTickerClick,
  onClose 
}: WatchlistIntelligenceProps) {
  const [activeTab, setActiveTab] = useState<'news' | 'events' | 'alerts'>('news');

  const highImpactEvents = portfolioEvents.filter(event => event.impact === 'high');
  const recentNews = watchlistNews.filter(article => 
    new Date(article.publishedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Événement passé';
    if (diffInHours < 24) return `Dans ${diffInHours}h`;
    if (diffInHours < 48) return 'Demain';
    return `Dans ${Math.floor(diffInHours / 24)} jours`;
  };

  return (
    <div className="watchlist-intelligence">
      {/* Header */}
      <div className="intelligence-header">
        <div className="intelligence-title">
          <h2>Veille Automatisée</h2>
          <div className="intelligence-summary">
            <div 
              className="summary-badge"
              title={`${recentNews.length} actualités récentes`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
                <path d="M18 14h-8" />
                <path d="M15 18h-5" />
                <path d="M10 6h8v4h-8Z" />
              </svg>
              <span className="badge-count">{recentNews.length}</span>
            </div>
            <div 
              className="summary-badge alert"
              title={`${highImpactEvents.length} événements majeurs`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span className="badge-count">{highImpactEvents.length}</span>
            </div>
            {onClose && (
              <button 
                className="aside-close-btn"
                onClick={onClose}
                title="Masquer la veille"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="intelligence-alert">
          <div className="alert-content">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Votre portefeuille est concerné par {highImpactEvents.length} événements majeurs cette semaine</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="intelligence-tabs">
        <button 
          className={`tab-btn ${activeTab === 'news' ? 'active' : ''}`}
          onClick={() => setActiveTab('news')}
        >
          Actualités Watchlist
          {recentNews.length > 0 && (
            <span className="tab-badge">{recentNews.length}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Événements Entreprises
          {portfolioEvents.length > 0 && (
            <span className="tab-badge">{portfolioEvents.length}</span>
          )}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alertes Personnalisées
          {highImpactEvents.length > 0 && (
            <span className="tab-badge alert">{highImpactEvents.length}</span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="intelligence-content">
        {activeTab === 'news' && (
          <div className="news-section">
            {recentNews.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
                <p>Aucune actualité récente pour votre watchlist</p>
              </div>
            ) : (
              <div className="news-list">
                {recentNews.map(article => (
                  <div 
                    key={article.id} 
                    className="news-item"
                    onClick={() => onArticleClick(article)}
                  >
                    <div className="news-content">
                      <div className="news-header">
                        <h4>{article.title}</h4>
                        {article.impact !== 'low' && (
                          <span 
                            className="impact-badge"
                            style={{ backgroundColor: getImpactColor(article.impact) }}
                          >
                            {article.impact.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="news-excerpt">{article.excerpt}</p>
                      <div className="news-meta">
                        <span className="news-time">
                          {new Date(article.publishedAt).toLocaleString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {article.ticker && (
                          <button 
                            className="ticker-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTickerClick(article.ticker!);
                            }}
                          >
                            {article.ticker}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="events-section">
            {portfolioEvents.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <p>Aucun événement à venir pour votre portefeuille</p>
              </div>
            ) : (
              <div className="events-list">
                {portfolioEvents.map(event => (
                  <div key={event.id} className="event-item">
                    <div className="event-icon">
                      {event.type === 'earnings' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5.5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      )}
                      {event.type === 'dividend' && (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="12" y1="2" x2="12" y2="22" />
                          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5.5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      )}
                    </div>

                    <div className="event-content">
                      <div className="event-header">
                        <h4>{event.title}</h4>
                        <span 
                          className="impact-badge"
                          style={{ backgroundColor: getImpactColor(event.impact) }}
                        >
                          {event.impact.toUpperCase()}
                        </span>
                      </div>
                      <p className="event-description">{event.description}</p>
                      <div className="event-meta">
                        <span className="event-date">{formatEventDate(event.date)}</span>
                        <button 
                          className="event-ticker"
                          onClick={() => onTickerClick(event.ticker)}
                        >
                          {event.ticker}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            {highImpactEvents.length === 0 ? (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0" />
                </svg>
                <p>Aucune alerte haute priorité</p>
              </div>
            ) : (
              <div className="alerts-list">
                {highImpactEvents.map(event => (
                  <div key={`alert-${event.id}`} className="alert-item high-priority">
                    <div className="alert-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    </div>

                    <div className="alert-content">
                      <h4>Alerte Haute Priorité</h4>
                      <p>{event.title}</p>
                      <div className="alert-actions">
                        <button 
                          className="alert-action-btn"
                          onClick={() => onTickerClick(event.ticker)}
                        >
                          Analyser {event.ticker}
                        </button>
                        <button className="alert-action-btn secondary">
                          Voir les détails
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
