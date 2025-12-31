'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import NewsHeader from '@/components/news/NewsHeader';
import LiveNewsTimeline from '@/components/news/LiveNewsTimeline';
import AnalysisGrid from '@/components/news/AnalysisGrid';
import WatchlistIntelligence from '@/components/news/WatchlistIntelligence';
import { NewsArticle } from '@/types/news';
import { DEMO_NEWS_ARTICLES, MARKET_TICKERS } from '@/core/data/NewsData';

export default function NewsArticlesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    market: 'all',
    period: 'today'
  });
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [activeSection, setActiveSection] = useState<'live' | 'analysis'>('live');
  const [showWatchlist, setShowWatchlist] = useState(true);

  // Données de démonstration pour la watchlist et les événements
  const watchlistTickers = ['NSIA', 'ECOBANK', 'FLW', 'AGL'];
  const portfolioEvents = [
    {
      id: '1',
      type: 'earnings',
      ticker: 'NSIA',
      title: 'Publication des résultats Q4 2024',
      description: 'NSIA Banque publiera ses résultats trimestriels attendus avec forte croissance',
      date: '2024-01-16T09:00:00Z',
      impact: 'high'
    },
    {
      id: '2',
      type: 'dividend',
      ticker: 'FLW',
      title: 'Dividende exceptionnel annoncé',
      description: 'Flutterwave envisage un dividende exceptionnel suite aux résultats exceptionnels',
      date: '2024-01-18T14:30:00Z',
      impact: 'medium'
    },
    {
      id: '3',
      type: 'earnings',
      ticker: 'AGL',
      title: 'Résultats miniers trimestriels',
      description: 'Anglo American publiera ses résultats affectés par les prix des matières premières',
      date: '2024-01-17T11:00:00Z',
      impact: 'high'
    }
  ];

  // Filtrer les articles selon les critères
  const filteredArticles = useMemo(() => {
    let filtered = DEMO_NEWS_ARTICLES;

    // Filtrer par recherche
    if (searchQuery) {
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (article.ticker && article.ticker.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filtrer par catégorie
    if (filters.category !== 'all') {
      filtered = filtered.filter(article => article.category === filters.category);
    }

    // Filtrer par marché
    if (filters.market !== 'all') {
      filtered = filtered.filter(article => article.market === filters.market);
    }

    return filtered;
  }, [searchQuery, filters]);

  // Séparer les articles par type
  const newsArticles = filteredArticles.filter(article => 
    ['breaking', 'markets', 'regulation', 'earnings', 'currencies', 'commodities'].includes(article.category)
  );

  const analysisArticles = filteredArticles.filter(article => 
    ['analysis', 'interview'].includes(article.category)
  );

  const watchlistNews = filteredArticles.filter(article => 
    article.ticker && watchlistTickers.includes(article.ticker)
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    // Ici on pourrait ouvrir un modal ou naviguer vers la page de l'article
    console.log('Article clicked:', article);
  };

  const handleTickerClick = (ticker: string) => {
    // Navigation vers la fiche société ou le chart technique
    console.log('Ticker clicked:', ticker);
    // Exemple: router.push(`/company/${ticker}`);
  };

  return (
    <div className="news-articles-page">
      {/* Breadcrumb */}
      <div className="news-breadcrumb">
        <Link href="/">Accueil</Link>
        <span>/</span>
        <span>News & Articles</span>
      </div>

      {/* Header */}
      <NewsHeader 
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
      />

      {/* Navigation Tabs */}
      <div className="news-navigation">
        <div className="nav-tabs">
          <button 
            className={`nav-tab ${activeSection === 'live' ? 'active' : ''}`}
            onClick={() => setActiveSection('live')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            Actualités Temps Réel
            <span className="tab-count">{newsArticles.length}</span>
          </button>
          
          <button 
            className={`nav-tab ${activeSection === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveSection('analysis')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Analyses Expertes
            <span className="tab-count">{analysisArticles.length}</span>
          </button>
        </div>

        <div className="quick-stats">
          <div className="stat-item">
            <span className="stat-label">Marchés en direct</span>
            <span className="stat-value">{MARKET_TICKERS.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Articles aujourd'hui</span>
            <span className="stat-value">{filteredArticles.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Alertes actives</span>
            <span className="stat-value alert">{portfolioEvents.filter(e => e.impact === 'high').length}</span>
          </div>
        </div>
      </div>

      {/* Main Layout with Aside */}
      <div className="news-layout">
        {/* Main Content */}
        <div className="news-content">
          {activeSection === 'live' && (
            <LiveNewsTimeline 
              articles={newsArticles}
              onArticleClick={handleArticleClick}
              onTickerClick={handleTickerClick}
            />
          )}

          {activeSection === 'analysis' && (
            <AnalysisGrid 
              articles={analysisArticles}
              onArticleClick={handleArticleClick}
              onTickerClick={handleTickerClick}
            />
          )}
        </div>

        {/* Watchlist Intelligence Aside */}
        {showWatchlist && (
          <div className="news-aside">
            <WatchlistIntelligence 
              watchlistNews={watchlistNews}
              portfolioEvents={portfolioEvents}
              onArticleClick={handleArticleClick}
              onTickerClick={handleTickerClick}
              onClose={() => setShowWatchlist(false)}
            />
          </div>
        )}

        {/* Toggle Button for Watchlist */}
        {!showWatchlist && (
          <button 
            className="watchlist-toggle-btn"
            onClick={() => setShowWatchlist(true)}
            title="Afficher la veille personnalisée"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>Veille</span>
            {watchlistNews.length + portfolioEvents.length > 0 && (
              <span className="toggle-badge">{watchlistNews.length + portfolioEvents.length}</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
