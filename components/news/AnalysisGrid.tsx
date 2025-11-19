'use client';

import { useState } from 'react';
import { NewsArticle } from '@/types/news';
import { CATEGORIES } from '@/core/data/NewsData';

interface AnalysisGridProps {
  articles: NewsArticle[];
  onArticleClick: (article: NewsArticle) => void;
  onTickerClick: (ticker: string) => void;
}

export default function AnalysisGrid({ articles, onArticleClick, onTickerClick }: AnalysisGridProps) {
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());

  const featuredArticle = articles.find(article => article.featured);
  const regularArticles = articles.filter(article => !article.featured);

  const toggleSaveArticle = (articleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedArticles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(articleId)) {
        newSet.delete(articleId);
      } else {
        newSet.add(articleId);
      }
      return newSet;
    });
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(cat => cat.id === categoryId) || { name: 'Analysis', color: '#6366f1' };
  };

  const formatReadTime = (minutes: number) => {
    return `${minutes} min de lecture`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  return (
    <div className="analysis-grid">
      {/* Section Header */}
      <div className="analysis-header">
        <h2>Analyses Expertes</h2>
        <p>Insights stratégiques et analyses approfondies par nos experts</p>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <div 
          className="featured-article"
          onClick={() => onArticleClick(featuredArticle)}
        >
          <div className="featured-content">
            <div className="featured-meta">
              <span className="featured-badge">ANALYSE PRINCIPALE</span>
              <div className="featured-stats">
                <span className="read-time">{formatReadTime(featuredArticle.readTime)}</span>
                <span className="impact-indicator high">HIGH IMPACT</span>
              </div>
            </div>
            
            <h1 className="featured-title">{featuredArticle.title}</h1>
            <p className="featured-excerpt">{featuredArticle.excerpt}</p>
            
            <div className="featured-author">
              <div className="author-avatar">
                <img src={featuredArticle.author.avatar || '/avatars/default.jpg'} alt={featuredArticle.author.name} />
              </div>
              <div className="author-info">
                <span className="author-name">{featuredArticle.author.name}</span>
                <span className="author-role">{featuredArticle.author.role}</span>
              </div>
              <span className="article-date">{formatDate(featuredArticle.publishedAt)}</span>
            </div>

            <div className="featured-actions">
              <button className="btn-primary">
                Lire l'analyse complète
              </button>
              <button 
                className="btn-secondary"
                onClick={(e) => toggleSaveArticle(featuredArticle.id, e)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                {savedArticles.has(featuredArticle.id) ? 'Sauvegardé' : 'Sauvegarder'}
              </button>
            </div>
          </div>

          {featuredArticle.imageUrl && (
            <div className="featured-image">
              <img src={featuredArticle.imageUrl} alt={featuredArticle.title} />
            </div>
          )}
        </div>
      )}

      {/* Regular Articles Grid */}
      <div className="articles-grid">
        {regularArticles.map(article => {
          const categoryInfo = getCategoryInfo(article.category);
          const isSaved = savedArticles.has(article.id);
          
          return (
            <div 
              key={article.id} 
              className="article-card"
              onClick={() => onArticleClick(article)}
            >
              {/* Article Image */}
              {article.imageUrl && (
                <div className="article-image">
                  <img src={article.imageUrl} alt={article.title} />
                  <div className="article-overlay">
                    <span 
                      className="category-tag"
                      style={{ backgroundColor: categoryInfo.color }}
                    >
                      {categoryInfo.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Article Content */}
              <div className="article-body">
                <div className="article-meta">
                  <span className="read-time">{formatReadTime(article.readTime)}</span>
                  {article.impact !== 'low' && (
                    <span className={`impact-badge ${article.impact}`}>
                      {article.impact.toUpperCase()}
                    </span>
                  )}
                </div>

                <h3 className="article-title">{article.title}</h3>
                <p className="article-excerpt">{article.excerpt}</p>

                <div className="article-footer">
                  <div className="author-section">
                    <div className="author-avatar">
                      <img src={article.author.avatar || '/avatars/default.jpg'} alt={article.author.name} />
                    </div>
                    <div className="author-details">
                      <span className="author-name">{article.author.name}</span>
                      <span className="article-date">{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>

                  <div className="article-actions">
                    <button 
                      className="action-btn save-btn"
                      onClick={(e) => toggleSaveArticle(article.id, e)}
                      title={isSaved ? 'Retirer de la liste de lecture' : 'Ajouter à la liste de lecture'}
                    >
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill={isSaved ? 'currentColor' : 'none'} 
                        stroke="currentColor" 
                        strokeWidth="2"
                      >
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>

                    {article.ticker && (
                      <button 
                        className="action-btn ticker-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onTickerClick(article.ticker!);
                        }}
                      >
                        {article.ticker}
                      </button>
                    )}

                    <button className="action-btn share-btn" title="Partager">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      <div className="grid-footer">
        <button className="load-more-btn">
          Voir plus d'analyses
        </button>
      </div>
    </div>
  );
}
