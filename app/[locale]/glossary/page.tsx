'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Sparkles,
  TrendingUp,
  Building2,
  BookmarkCheck,
  LayoutGrid,
  List,
  Bookmark,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  DollarSign,
  Target,
  Coins,
  Shield,
  ShieldCheck,
  Lightbulb,
  AlertTriangle,
  Gift,
  PiggyBank,
  Tag,
  BarChart3,
} from 'lucide-react';
import { GLOSSARY_TERMS } from '@/core/data/glossary-data/GlossaryData';

const FEATURED_SLUGS = [
  'quality-score',
  'pe-ratio',
  'roe',
  'free-cash-flow',
  'moat',
  'margin-of-safety',
];

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<'financial' | 'sector' | 'saved'>('financial');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const featuredRef = useRef<HTMLDivElement>(null);

  const switchGroup = useCallback((group: 'financial' | 'sector' | 'saved') => {
    if (group === activeGroup) return;
    setTransitioning(true);
    setActiveGroup(group);
    setSelectedCategory(null);
    setSearchQuery('');
    setTimeout(() => setTransitioning(false), 300);
  }, [activeGroup]);

  const scrollFeatured = (direction: 'left' | 'right') => {
    if (featuredRef.current) {
      const scrollAmount = 220;
      featuredRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('glossary_bookmarks');
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch (e) {
        console.error('Error parsing bookmarks', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleBookmark = (slug: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (bookmarks.includes(slug)) {
      updated = bookmarks.filter(s => s !== slug);
    } else {
      updated = [...bookmarks, slug];
    }
    setBookmarks(updated);
    localStorage.setItem('glossary_bookmarks', JSON.stringify(updated));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Concepts d'Investissement":     return "primary";
      case "Rentabilité":                   return "emerald";
      case "Valorisation":                  return "blue";
      case "Flux de Trésorerie":            return "cyan";
      case "Endettement et Solvabilité":    return "orange";
      case "Croissance":                    return "violet";
      case "Dividendes":                    return "amber";
      case "Besoin en Fonds de Roulement":  return "rose";
      case "Catégories de Peter Lynch":     return "teal";
      case "Entreprise et Secteur":         return "pink";
      default:                              return "gray";
    }
  };

  const groupTerms = GLOSSARY_TERMS.filter(term => {
    if (activeGroup === 'saved') {
      return bookmarks.includes(term.slug);
    }
    return term.group === activeGroup;
  });

  const groupCategories = Array.from(new Set(groupTerms.map(t => t.category))).sort();

  useEffect(() => {
    if (selectedCategory && !groupCategories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [activeGroup, groupCategories, selectedCategory]);

  const filteredTerms = groupTerms.filter(term => {
    const matchesCategory = selectedCategory ? term.category === selectedCategory : true;
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matchesSearch = normalizedQuery === '' ||
      term.term.toLowerCase().includes(normalizedQuery) ||
      (term.subtitle && term.subtitle.toLowerCase().includes(normalizedQuery)) ||
      term.definition.toLowerCase().includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  const financialCount = GLOSSARY_TERMS.filter(t => t.group === 'financial').length;
  const sectorCount = GLOSSARY_TERMS.filter(t => t.group === 'sector').length;
  const savedCount = bookmarks.length;
  const totalCount = activeGroup === 'financial' ? financialCount : activeGroup === 'sector' ? sectorCount : savedCount;

  const featuredTerms = GLOSSARY_TERMS.filter(t => FEATURED_SLUGS.includes(t.slug));

  const termIcon: Record<string, React.ReactNode> = {
    'quality-score': <Star size={18} />,
    'pe-ratio': <DollarSign size={18} />,
    'roe': <Target size={18} />,
    'free-cash-flow': <Coins size={18} />,
    'moat': <Shield size={18} />,
    'margin-of-safety': <ShieldCheck size={18} />,
  };

  const categoryIcon: Record<string, React.ReactNode> = {
    "Concepts d'Investissement": <Lightbulb size={14} />,
    "Rentabilité": <BarChart3 size={14} />,
    "Valorisation": <DollarSign size={14} />,
    "Flux de Trésorerie": <Coins size={14} />,
    "Endettement et Solvabilité": <AlertTriangle size={14} />,
    "Croissance": <TrendingUp size={14} />,
    "Dividendes": <Gift size={14} />,
    "Besoin en Fonds de Roulement": <PiggyBank size={14} />,
    "Catégories de Peter Lynch": <Tag size={14} />,
    "Entreprise et Secteur": <Building2 size={14} />,
  };

  return (
    <main className="glossary-page">
      {/* Header */}
      <header className="glossary-header">
        <div className="header-row">
          <div className="header-icon">
            <BookOpen size={20} />
          </div>
          <h1>Glossaire</h1>
        </div>
        <p className="header-subtitle">
          {GLOSSARY_TERMS.length}&nbsp;termes de l&apos;investissement value expliqués avec une perspective de praticien.
        </p>
      </header>

      {/* Search + Ctrl+K */}
      <div className="search-wrapper">
        <Search size={18} className="search-icon" />
        <input
          ref={searchRef}
          type="text"
          placeholder={
            activeGroup === 'sector'
              ? "Rechercher un secteur, une entreprise..."
              : "Rechercher un terme, un indicateur, une définition..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button type="button" className="search-clear" onClick={() => setSearchQuery('')}>
            <X size={16} />
          </button>
        )}
      </div>

      {/* Progress tracker */}
      <div className="progress-tracker">
        <span>Vous avez exploré <strong>{isLoaded ? bookmarks.length : 0}</strong> sur <strong>{GLOSSARY_TERMS.length}</strong> termes</span>
        <span className="progress-pct">
          {isLoaded ? Math.round((bookmarks.length / GLOSSARY_TERMS.length) * 100) : 0}%
        </span>
      </div>

      {/* Featured section */}
      <section className="featured-section">
        <div className="featured-header">
          <Sparkles size={16} className="featured-icon" />
          <h2>Commencer ici</h2>
        </div>
        <p className="featured-subtitle">
          Nouveau dans l&apos;investissement ? Commencez par ces fondamentaux
        </p>
        <div className="featured-carousel">
          <button
            type="button"
            className="carousel-arrow carousel-arrow-left"
            onClick={() => scrollFeatured('left')}
            aria-label="Précédent"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="featured-grid" ref={featuredRef}>
            {featuredTerms.map(term => (
              <Link
                key={term.slug}
                href={`/glossary/${term.slug}`}
                className="featured-card"
              >
                <div className="featured-card-icon">
                  {termIcon[term.slug] || <Lightbulb size={18} />}
                </div>
                <span className="featured-name">{term.term}</span>
                <span className="featured-desc">{term.definition}</span>
              </Link>
            ))}
          </div>
          <button
            type="button"
            className="carousel-arrow carousel-arrow-right"
            onClick={() => scrollFeatured('right')}
            aria-label="Suivant"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </section>

      {/* Type tabs */}
      <div className="type-tabs">
        <button
          type="button"
          onClick={() => switchGroup('financial')}
          className={`type-tab ${activeGroup === 'financial' ? 'active' : ''}`}
        >
          <TrendingUp size={16} />
          <span>Termes financiers</span>
          <span className="tab-count">{financialCount}</span>
        </button>
        <button
          type="button"
          onClick={() => switchGroup('sector')}
          className={`type-tab ${activeGroup === 'sector' ? 'active' : ''}`}
        >
          <Building2 size={16} />
          <span>Secteur &amp; société</span>
          <span className="tab-count">{sectorCount}</span>
        </button>
        <button
          type="button"
          onClick={() => switchGroup('saved')}
          className={`type-tab type-tab-saved ${activeGroup === 'saved' ? 'active' : ''}`}
        >
          <BookmarkCheck size={12} />
          <span>Enregistrés</span>
          <span className="tab-count">{savedCount}</span>
        </button>
      </div>

      {/* Category filter pills */}
      <div className="category-filters">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`cat-pill ${selectedCategory === null ? 'active' : ''}`}
        >
          Tous ({groupTerms.length})
        </button>
        {groupCategories.map(category => {
          const count = groupTerms.filter(t => t.category === category).length;
          if (count === 0) return null;
          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`cat-pill ${selectedCategory === category ? 'active' : ''}`}
            >
              {category} ({count})
            </button>
          );
        })}
      </div>

      {/* Controls row: count + view toggle */}
      <div className="controls-row">
        <span className="count-label">{totalCount} terme{totalCount !== 1 ? 's' : ''}</span>
        <div className="view-toggle">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grille"
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="Liste"
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* Term cards */}
      <section className={`term-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}>
        {filteredTerms.length > 0 ? (
          filteredTerms.map((term, index) => {
            const isBookmarked = bookmarks.includes(term.slug);
            const colorName = getCategoryColor(term.category);
            return (
              <div
                key={term.slug}
                className={`term-card-wrapper category-${colorName}`}
                style={{ animationDelay: `${(index % 12) * 40}ms` }}
              >
                <button
                  type="button"
                  className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
                  onClick={(e) => toggleBookmark(term.slug, e)}
                  title={isBookmarked ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} />
                </button>
                <Link href={`/glossary/${term.slug}`} className="term-card">
                  <div className="card-body">
                    <span className="card-badge">{term.category}</span>
                    <div className="card-title-row">
                      <span className="card-term-icon">
                        {categoryIcon[term.category] || <Lightbulb size={14} />}
                      </span>
                      <h3 className="card-title">{term.term}</h3>
                    </div>
                    {term.subtitle && (
                      <p className="card-subtitle">{term.subtitle}</p>
                    )}
                    <p className="card-desc">{term.definition}</p>
                  </div>
                  <div className="card-arrow">
                    <ArrowRight size={14} />
                  </div>
                </Link>
              </div>
            );
          })
        ) : transitioning ? (
          <div className="no-results loading-state">
            <div className="loading-spinner" />
            <p>Chargement...</p>
          </div>
        ) : (
          <div className="no-results">
            <X size={40} />
            <h3>Aucun terme trouvé</h3>
            <p>Essayez de reformuler votre recherche ou de sélectionner une autre catégorie.</p>
          </div>
        )}
      </section>
    </main>
  );
}
