'use client';

import { useState, useRef, useEffect } from 'react';
import { NewsArticle } from '@/types/news';
import { CATEGORIES } from '@/core/data/NewsData';

interface LiveNewsTimelineProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
  onTickerClick: (ticker: string) => void;
}

export default function LiveNewsTimeline({ articles, onArticleClick, onTickerClick }: LiveNewsTimelineProps) {
  const [viewMode, setViewMode] = useState<'condensed' | 'detailed'>('detailed');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Images par défaut pour les articles selon leur catégorie
  const getDefaultImage = (category: string) => {
    switch (category) {
      case 'breaking':
        return '/images/news-breaking.jpg';
      case 'markets':
        return '/images/news-markets.jpg';
      case 'regulation':
        return '/images/news-regulation.jpg';
      case 'earnings':
        return '/images/news-earnings.jpg';
      case 'currencies':
        return '/images/news-currencies.jpg';
      case 'commodities':
        return '/images/news-commodities.jpg';
      case 'analysis':
        return '/images/news-analysis.jpg';
      case 'interview':
        return '/images/news-interview.jpg';
      default:
        return '/images/news-default.jpg';
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || { name: 'News', color: '#6b7280' };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5.5a3.5 3.5 0 0 1 0 7H6" /></svg>;
      case 'negative':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 7H9.5a3.5 3.5 0 0 0 0 7h5.5a3.5 3.5 0 0 1 0 7H6" /></svg>;
      default:
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5.5a3.5 3.5 0 0 1 0 7H6" /></svg>;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="live-news-timeline">
      {/* Timeline Header */}
      <div className="timeline-header">
        <div className="timeline-title">
          <h2>Actualités Temps Réel</h2>
          {isLive && (
            <div className="live-badge">
              <div className="live-dot"></div>
              <span>EN DIRECT</span>
            </div>
          )}
        </div>

        <div className="timeline-controls">
          <div className="view-mode-toggle">
            <button 
              className={`view-btn ${viewMode === 'detailed' ? 'active' : ''}`}
              onClick={() => setViewMode('detailed')}
            >
              Détaillé
            </button>
            <button 
              className={`view-btn ${viewMode === 'condensed' ? 'active' : ''}`}
              onClick={() => setViewMode('condensed')}
            >
              Condensé
            </button>
          </div>

          <button 
            className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Auto-refresh
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="timeline-content" ref={timelineRef}>
        {articles.map((article, index) => {
          const categoryInfo = getCategoryInfo(article.category);
          
          return (
            <div className={`timeline-item ${viewMode === 'condensed' ? 'condensed' : 'detailed'}`}>
              {/* Timeline Line */}
              <div className="timeline-line">
                <div 
                  className="timeline-dot" 
                  style={{ backgroundColor: categoryInfo.color }}
                ></div>
                {index < articles.length - 1 && <div className="timeline-connector"></div>}
              </div>

              {/* Article Content with Image */}
              <div className="article-content">
                {viewMode === 'detailed' && (
                  <div className="article-image">
                    <img 
                      src={article.imageUrl || getDefaultImage(article.category)} 
                      alt={article.title}
                    />
                  </div>
                )}

                <div className="article-text-content">
                  <div className="article-header">
                    <div className="article-meta">
                      <span 
                        className="category-badge"
                        style={{ backgroundColor: categoryInfo.color }}
                      >
                        {categoryInfo.name}
                      </span>
                      <span className="article-time">{formatTime(article.publishedAt)}</span>
                      <div className="sentiment-indicator" style={{ color: getSentimentColor(article.sentiment) }}>
                        {getSentimentIcon(article.sentiment)}
                      </div>
                    </div>

                    {article.impact !== 'low' && (
                      <div 
                        className="impact-indicator"
                        style={{ backgroundColor: getImpactColor(article.impact) }}
                      >
                        {article.impact.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <h3 className="article-title">{article.title}</h3>

                  {viewMode === 'detailed' && (
                    <p className="article-excerpt">{article.excerpt}</p>
                  )}

                  <div className="article-footer">
                    <div className="article-tags">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>

                    {article.ticker && (
                      <button 
                        className="ticker-btn"
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
            </div>
          );
        })}
      </div>

      {/* Load More */}
      <div className="timeline-footer">
        <button className="load-more-btn">
          Charger plus d'actualités
        </button>
      </div>
    </div>
  );
}
