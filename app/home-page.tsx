'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { AFRICAN_SECTORS } from '@/core/data/SectorsData';
import BrvmRegion from '@/components/map/BrvmRegion';
import NGXRegion from '@/components/map/NGXRegion';
import NSERegion from '@/components/map/NSERegion';
import JSERegion from '@/components/map/JSERegion';
import GSERegion from '@/components/map/GSERegion';
import CSERegion from '@/components/map/CSERegion'; 
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import AfricaOPCVMMap from '@/components/opcvm/AfricaOPCVMMap';
import RankingDashboard from '@/components/exchanges/RankingDashboard';
import { 
  INITIAL_MARKET_INDICES, 
  COUNTRIES_DATA, 
  TOP_STOCKS, 
  FLOP_STOCKS, 
  NEWS_ITEMS,
  type MarketIndex,
  type NewsItem,
  type StockData
} from '@/core/data/HomePageData';
import { 
  MOCK_OPCVM_DATA, 
  MOCK_TITANS_COMPANIES,
  calculateOPCVMExchangeData,
  getTopOPCVMFunds
} from '@/core/data/OPCVMHomeData';
import { MOCK_EXCHANGES } from '@/core/data/ExchangesHomeData';

export default function NewHomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const carouselRef = useRef<HTMLDivElement>(null);

  // Initialize market indices with live data
  useEffect(() => {
    const initialData: MarketIndex[] = INITIAL_MARKET_INDICES.map(index => ({
      ...index,
      chartData: Array.from({ length: 20 }, () => 
        index.value * (1 + (Math.random() - 0.5) * 0.02)
      )
    }));

    setMarketIndices(initialData);

    // Update indices every second
    const interval = setInterval(() => {
      setMarketIndices(prev => prev.map(index => {
        const newChange = parseFloat((Math.sin(Date.now() / 3000 + Math.random() * 2) * 2.5).toFixed(2));
        const newValue = index.value * (1 + newChange / 100);
        const newChartData = [...index.chartData.slice(1), newValue];
        
        return {
          ...index,
          change: newChange,
          chartData: newChartData,
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Auto-slide carousel - DISABLED
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     setCurrentSlide(prev => (prev + 1) % 4);
  //   }, 25000);

  //   return () => clearInterval(interval);
  // }, []);

  // Data from imports
  const countries = COUNTRIES_DATA;
  const topStocks = TOP_STOCKS;
  const flopStocks = FLOP_STOCKS;
  const newsItems = NEWS_ITEMS;

  const [activeTab, setActiveTab] = useState<'movers' | 'tops-flops'>('movers');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const regionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasAnimated = useRef(false);
  const hasAnimatedToOpcvm = useRef(false);

  // OPCVM Data from imports
  const mockOPCVMData = MOCK_OPCVM_DATA;
  const opcvmExchangeData = calculateOPCVMExchangeData(mockOPCVMData);
  const topOPCVMFunds = getTopOPCVMFunds(mockOPCVMData, 6);
  const mockTitansCompanies = MOCK_TITANS_COMPANIES;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount * 1000000);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={star <= rating ? '#F59E0B' : 'none'}
            stroke={star <= rating ? '#F59E0B' : '#D1D5DB'}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    );
  };

  // Exchanges data from imports
  const mockExchanges = MOCK_EXCHANGES;

  // Animation des régions entre Card 1 et Card 2
  useEffect(() => {
    const regions = ['BRVM', 'CSE', 'NGX', 'NSE', 'JSE', 'GSE'];
    
    if (currentSlide === 1 && !hasAnimated.current) {
      hasAnimated.current = true;
      setIsTransitioning(true);
      
      // Attendre que le carousel finisse sa transition (1s d'après le CSS)
      setTimeout(() => {
        regions.forEach((regionId, index) => {
          setTimeout(() => {
            const sourceEl = regionRefs.current[`source-${regionId}`];
            const targetEl = regionRefs.current[`target-${regionId}`];
            
            if (sourceEl && targetEl) {
              const sourceRect = sourceEl.getBoundingClientRect();
              const targetRect = targetEl.getBoundingClientRect();
              
              // Créer un clone pour l'animation
              const clone = sourceEl.cloneNode(true) as HTMLDivElement;
              clone.style.position = 'fixed';
              clone.style.left = `${sourceRect.left}px`;
              clone.style.top = `${sourceRect.top}px`;
              clone.style.width = `${sourceRect.width}px`;
              clone.style.height = `${sourceRect.height}px`;
              clone.style.zIndex = '10000';
              clone.style.pointerEvents = 'none';
              clone.style.margin = '0';
              clone.style.border = 'none';
              clone.style.boxShadow = 'none';
              
              document.body.appendChild(clone);
              
              // Cacher les originaux
              sourceEl.style.visibility = 'hidden';
              targetEl.style.visibility = 'hidden';
              
              // Calculer la transformation
              const deltaX = targetRect.left - sourceRect.left;
              const deltaY = targetRect.top - sourceRect.top;
              const scaleX = targetRect.width / sourceRect.width;
              const scaleY = targetRect.height / sourceRect.height;

              // Animer avec translate() simple et construction progressive du border et box-shadow
              const animation = clone.animate([
                { 
                  transform: 'translate(0, 0) scale(1)', 
                  opacity: 1,
                  borderWidth: '0px',
                  borderColor: 'transparent',
                  boxShadow: '0 0 0 rgba(0, 0, 0, 0)'
                },
                { 
                  transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5}px) scale(${1 + (scaleX - 1) * 0.5}, ${1 + (scaleY - 1) * 0.5})`, 
                  opacity: 1,
                  borderWidth: '0.5px',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.075)'
                },
                { 
                  transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`, 
                  opacity: 1,
                  borderWidth: '1px',
                  borderColor: 'var(--border-color)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }
              ], {
                duration: 1200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
              }); 
              animation.onfinish = () => {
                document.body.removeChild(clone);
                targetEl.style.visibility = 'visible';
              };
            }
          }, index * 100); // Décalage pour effet cascade
        });
      }, 1000); // Attendre la fin de la transition du carousel
      
      setTimeout(() => setIsTransitioning(false), 3500);
    } else if (currentSlide === 0) {
      // Réinitialiser pour permettre une nouvelle animation
      hasAnimated.current = false;
      // Réafficher les sources et cacher les targets
      regions.forEach((regionId) => {
        const sourceEl = regionRefs.current[`source-${regionId}`];
        const targetEl = regionRefs.current[`target-${regionId}`];
        if (sourceEl) sourceEl.style.visibility = 'visible';
        if (targetEl) targetEl.style.visibility = 'hidden';
      });
    } else if (currentSlide !== 1) {
      // Pour les autres slides, cacher les targets
      regions.forEach((regionId) => {
        const targetEl = regionRefs.current[`target-${regionId}`];
        if (targetEl) targetEl.style.visibility = 'hidden';
      });
    }
  }, [currentSlide]);

  // Animation des régions entre Card 2 (Fixed Income) et Card 3 (OPCVM)
  useEffect(() => {
    const regions = ['BRVM', 'CSE', 'NGX', 'NSE', 'JSE', 'GSE'];
    
    // Animation Card 2 -> Card 3 (régions vont vers la map OPCVM)
    if (currentSlide === 2 && !hasAnimatedToOpcvm.current) {
      hasAnimatedToOpcvm.current = true;
      setIsTransitioning(true);
      
      // D'abord, rendre les sources visibles
      regions.forEach((regionId) => {
        const sourceEl = regionRefs.current[`target-${regionId}`];
        if (sourceEl) sourceEl.style.visibility = 'visible';
      });
      
      // Attendre que le carousel finisse sa transition
      setTimeout(() => {
        regions.forEach((regionId, index) => {
          setTimeout(() => {
            const sourceEl = regionRefs.current[`target-${regionId}`]; // Les régions dans Card 2
            const targetEl = regionRefs.current[`opcvm-map-${regionId}`]; // Les régions dans la map OPCVM
            
            if (sourceEl && targetEl) {
              const sourceRect = sourceEl.getBoundingClientRect();
              const targetRect = targetEl.getBoundingClientRect();
              
              // Créer un clone pour l'animation
              const clone = sourceEl.cloneNode(true) as HTMLDivElement;
              clone.style.position = 'fixed';
              clone.style.left = `${sourceRect.left}px`;
              clone.style.top = `${sourceRect.top}px`;
              clone.style.width = `${sourceRect.width}px`;
              clone.style.height = `${sourceRect.height}px`;
              clone.style.zIndex = '10000';
              clone.style.pointerEvents = 'none';
              clone.style.margin = '0';
              clone.style.visibility = 'visible'; // Forcer la visibilité
              
              document.body.appendChild(clone);
              
              // Cacher les originaux
              sourceEl.style.visibility = 'hidden';
              targetEl.style.visibility = 'hidden';
              
              // Calculer la transformation vers le centre de la map
              const deltaX = targetRect.left - sourceRect.left;
              const deltaY = targetRect.top - sourceRect.top;
              const scaleX = targetRect.width / sourceRect.width;
              const scaleY = targetRect.height / sourceRect.height;
              
              // Animer avec translate() simple et fade out à la fin
              const animation = clone.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX})`, opacity: 0.3, offset: 0.8 },
                { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX * 0.5})`, opacity: 0 }
              ], {
                duration: 1200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
              });
              
              animation.onfinish = () => {
                document.body.removeChild(clone);
                targetEl.style.visibility = 'visible';
              };
            }
          }, index * 100);
        });
      }, 1000);
      
      setTimeout(() => setIsTransitioning(false), 3500);
    }
    // Animation Card 3 -> Card 2 (régions reviennent de la map OPCVM)
    else if (currentSlide === 1 && hasAnimatedToOpcvm.current) {
      hasAnimatedToOpcvm.current = false;
      setIsTransitioning(true);
      
      setTimeout(() => {
        regions.forEach((regionId, index) => {
          setTimeout(() => {
            const sourceEl = regionRefs.current[`opcvm-map-${regionId}`]; // Les régions dans la map OPCVM
            const targetEl = regionRefs.current[`target-${regionId}`]; // Les régions dans Card 2
            
            if (sourceEl && targetEl) {
              const sourceRect = sourceEl.getBoundingClientRect();
              const targetRect = targetEl.getBoundingClientRect();
              
              // Créer un clone pour l'animation de retour
              const clone = sourceEl.cloneNode(true) as HTMLDivElement;
              clone.style.position = 'fixed';
              clone.style.left = `${sourceRect.left}px`;
              clone.style.top = `${sourceRect.top}px`;
              clone.style.width = `${sourceRect.width}px`;
              clone.style.height = `${sourceRect.height}px`;
              clone.style.zIndex = '10000';
              clone.style.pointerEvents = 'none';
              clone.style.margin = '0';
              clone.style.opacity = '0';
              
              document.body.appendChild(clone);
              
              // Cacher les originaux
              sourceEl.style.visibility = 'hidden';
              targetEl.style.visibility = 'hidden';
              
              // Calculer la transformation de retour
              const deltaX = targetRect.left - sourceRect.left;
              const deltaY = targetRect.top - sourceRect.top;
              const scaleX = targetRect.width / sourceRect.width;
              const scaleY = targetRect.height / sourceRect.height;
              
              // Animer avec fade in au début
              const animation = clone.animate([
                { transform: 'translate(0, 0) scale(0.5)', opacity: 0 },
                { transform: `translate(${deltaX * 0.2}px, ${deltaY * 0.2}px) scale(0.7)`, opacity: 0.3, offset: 0.2 },
                { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`, opacity: 1 }
              ], {
                duration: 1200,
                easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                fill: 'forwards'
              });
              
              animation.onfinish = () => {
                document.body.removeChild(clone);
                targetEl.style.visibility = 'visible';
              };
            }
          }, index * 100);
        });
      }, 1000);
      
      setTimeout(() => setIsTransitioning(false), 3500);
    }
    // Gérer la visibilité pour les autres slides
    else if (currentSlide === 0) {
      // Sur Card 1, cacher les régions de la map OPCVM
      regions.forEach((regionId) => {
        const opcvmEl = regionRefs.current[`opcvm-map-${regionId}`];
        if (opcvmEl) opcvmEl.style.visibility = 'hidden';
      });
    }
  }, [currentSlide]);

  const renderMiniChart = (data: number[]) => {
    if (!data || data.length === 0) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="100%" height="60" viewBox="0 0 100 100" preserveAspectRatio="none" className="mini-chart">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  };

  const renderSparkline = (data: number[]) => {
    if (!data || data.length === 0) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 40;
      const y = 20 - ((value - min) / range) * 20;
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <svg width="40" height="20" viewBox="0 0 40 20" className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  return (
    <div className="new-home-page">
      {/* Market Pulse - Live Indices */}
      <div className="market-pulse">
        <div className="indices-scroll">
          {[...marketIndices, ...marketIndices].map((index, i) => (
            <div
              key={i}
              className="index-card"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="index-header">
                <span className="exchange-badge">{index.exchange}</span>
                <span className="index-name">{index.name}</span>
              </div>
              <div className="index-value">{index.value.toLocaleString()}</div>
              <div className={`index-change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                {index.change >= 0 ? '+' : ''}{index.change}%
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  {index.change >= 0 ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
              </div>
              
              {hoveredIndex === i && (
                <div className="index-chart-overlay">
                  {renderMiniChart(index.chartData)}
                  <div className="chart-current-value">{index.value.toFixed(2)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Navbar */}
      <nav className="main-navbar">
        <div className="navbar-content">
          <Link href="/" className="navbar-logo">
            <span className="logo-icon">📊</span>
            <span className="logo-text">Quantum Ledger</span>
          </Link>

          <div className="navbar-search">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un actif, une société..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="navbar-menu">
            <div className="nav-item-dropdown">
              <Link href="/equity" className="nav-link">Equity</Link>
              <div className="dropdown-menu">
                <Link href="/equity/market-movers" className="dropdown-item">Market Movers</Link>
                <Link href="/equity/sectors" className="dropdown-item">Secteurs</Link>
                <Link href="/stock-screener-v2" className="dropdown-item">Stock Screener</Link>
                <Link href="/stock-comparison" className="dropdown-item">Comparateur</Link>
              </div>
            </div>
            <div className="nav-item-dropdown">
              <Link href="/fixed-income" className="nav-link">Fixed Income</Link>
              <div className="dropdown-menu">
                <Link href="/fixed-income/opportunities" className="dropdown-item">Opportunités</Link>
                <Link href="/fixed-income/calendar" className="dropdown-item">Calendrier</Link>
              </div>
            </div>
            <div className="nav-item-dropdown">
              <Link href="/opcvm" className="nav-link">OPCVM</Link>
              <div className="dropdown-menu">
                <Link href="/opcvm/titans" className="dropdown-item">OPCVM Titans</Link>
                <Link href="/opcvm/comparison" className="dropdown-item">Comparateur</Link>
                <Link href="/opcvm/simulator" className="dropdown-item">Simulateur</Link>
              </div>
            </div>
            <Link href="/news-articles" className="nav-link">News</Link>
          </div>

          <div className="navbar-actions">
            <button className="theme-toggle-btn" onClick={() => {
              const html = document.documentElement;
              const currentTheme = html.getAttribute('data-theme');
              html.setAttribute('data-theme', currentTheme === 'dark' ? 'light' : 'dark');
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Carousel Section */}
      <div className="carousel-wrapper">
        <div className="carousel-section">
          {/* Vertical Progress Gauge */}
          <div className="carousel-gauge">
            {[0, 1, 2].map((index) => (
              <button
                key={index}
                className={`gauge-dot ${currentSlide === index ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>

        {/* Carousel Content */}
        <div className="carousel-content" ref={carouselRef}>
          <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
            {/* Card 1: Equity */}
            <div className="carousel-card equity-card">
              <div className="card-main-content">
                {/* Left Block - Country Tabs & Stats */}
                <div className="card-left-block">
                  <div className="tabs-header">
                    <button 
                      className={`tab-btn ${activeTab === 'movers' ? 'active' : ''}`}
                      onClick={() => setActiveTab('movers')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      </svg>
                      Market Movers
                    </button>
                    <button 
                      className={`tab-btn ${activeTab === 'tops-flops' ? 'active' : ''}`}
                      onClick={() => setActiveTab('tops-flops')}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                        <polyline points="17 6 23 6 23 12" />
                      </svg>
                      Tops/Flops
                    </button>
                  </div>

                  <div className="countries-stats">
                    <div className="countries-flags">
                      {[
                        { Component: BrvmRegion, id: 'BRVM' },
                        { Component: CSERegion, id: 'CSE' },
                        { Component: NGXRegion, id: 'NGX' },
                        { Component: NSERegion, id: 'NSE' },
                        { Component: JSERegion, id: 'JSE' },
                        { Component: GSERegion, id: 'GSE' },
                      ].map((region) => (
                        <div 
                          key={region.id} 
                          className="country-flag-item"
                          ref={(el) => { regionRefs.current[`source-${region.id}`] = el; }}
                        >
                          {region.Component({ color: '#00bfff' })}
                        </div>
                      ))}
                    </div>
                    <div className="stats-content">
                      {activeTab === 'movers' && (
                        <div className="market-movers-list">
                          {[
                            { ticker: 'SONATEL', name: 'Sonatel Sénégal', price: 12450, change: 2.45, changeValue: 298, volume: 1250000, exchange: 'BRVM', sector: 'Telecom', sparkline: [10, 12, 11, 14, 13, 15, 14, 16] },
                            { ticker: 'SGCI', name: 'Société Générale CI', price: 8750, change: 3.12, changeValue: 265, volume: 850000, exchange: 'BRVM', sector: 'Banking', sparkline: [8, 9, 8.5, 10, 11, 10.5, 12, 11] },
                            { ticker: 'MTN', name: 'MTN Ghana', price: 0.95, change: 1.85, changeValue: 0.02, volume: 3200000, exchange: 'GSE', sector: 'Telecom', sparkline: [0.9, 0.92, 0.91, 0.93, 0.94, 0.95, 0.96, 0.95] },
                            { ticker: 'DANGCEM', name: 'Dangote Cement', price: 285.50, change: 2.10, changeValue: 5.88, volume: 5400000, exchange: 'NGX', sector: 'Materials', sparkline: [280, 282, 281, 283, 284, 286, 285, 285.5] },
                            { ticker: 'EQTY', name: 'Equity Group Holdings', price: 52.75, change: 1.45, changeValue: 0.75, volume: 2100000, exchange: 'NSE', sector: 'Banking', sparkline: [51, 51.5, 52, 52.2, 52.5, 52.8, 52.6, 52.75] },
                            { ticker: 'SBK', name: 'Standard Bank Group', price: 142.30, change: 0.95, changeValue: 1.34, volume: 4800000, exchange: 'JSE', sector: 'Banking', sparkline: [141, 141.5, 142, 141.8, 142.2, 142.5, 142.3, 142.3] }
                          ].map((stock, idx) => (
                            <div key={stock.ticker} className="mover-row" data-country-index={idx}>
                              <div className="mover-rank">
                                <span className="rank-badge">{idx + 1}</span>
                              </div>
                              <div className="mover-ticker">
                                <strong>{stock.ticker}</strong>
                              </div>
                              <div className="mover-name">
                                <span className="company-name">{stock.name}</span>
                                <span className="sector">{stock.sector}</span>
                              </div>
                              <div className="mover-change">
                                <span className={`change-percent ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                                  {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                                </span>
                                <span className="change-value">
                                  {stock.change >= 0 ? '+' : ''}{stock.changeValue.toFixed(2)}
                                </span>
                              </div>
                              <div className="mover-price">
                                <span className="current-price">{stock.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="mover-volume">
                                <span className="volume-value">{(stock.volume / 1000000).toFixed(1)}M</span>
                              </div>
                              <div className="mover-sparkline">
                                <svg width="60" height="24" className="sparkline">
                                  <polyline 
                                    points={stock.sparkline.map((val, i) => `${i * 8.57},${24 - (val / Math.max(...stock.sparkline)) * 20}`).join(' ')}
                                    fill="none" 
                                    stroke={stock.change >= 0 ? '#10b981' : '#ef4444'} 
                                    strokeWidth="2"
                                  />
                                </svg>
                              </div>
                              <div className="mover-exchange">
                                <span className="exchange-badge">{stock.exchange}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {activeTab === 'tops-flops' && (
                        <div className="tops-flops-list">
                          {[
                            { country: 'BRVM', top: { ticker: 'SONATEL', price: 12450, change: 5.20, volume: 1250000 }, flop: { ticker: 'BICC', price: 1850, change: -3.10, volume: 450000 } },
                            { country: 'GSE', top: { ticker: 'MTN', price: 0.95, change: 4.85, volume: 3200000 }, flop: { ticker: 'CAL', price: 0.42, change: -2.30, volume: 180000 } },
                            { country: 'NGX', top: { ticker: 'DANGCEM', price: 285.50, change: 6.10, volume: 5400000 }, flop: { ticker: 'FBNH', price: 18.25, change: -4.50, volume: 2100000 } },
                            { country: 'NSE', top: { ticker: 'EQTY', price: 52.75, change: 3.45, volume: 2100000 }, flop: { ticker: 'KCB', price: 45.20, change: -1.85, volume: 950000 } },
                            { country: 'JSE', top: { ticker: 'SBK', price: 142.30, change: 2.95, volume: 4800000 }, flop: { ticker: 'AGL', price: 98.50, change: -2.15, volume: 1200000 } },
                            { country: 'CSE', top: { ticker: 'ATW', price: 145.80, change: 1.75, volume: 850000 }, flop: { ticker: 'BCP', price: 285.20, change: -0.95, volume: 620000 } }
                          ].map((item, idx) => (
                            <div key={item.country} className="tops-flops-row" data-country-index={idx}>
                              <div className="top-stock">
                                <span className="ticker">{item.top.ticker}</span>
                                <span className="price">{item.top.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                                <span className="change positive">+{item.top.change.toFixed(2)}%</span>
                                <span className="volume">{(item.top.volume / 1000).toFixed(0)}K</span>
                              </div>
                              <div className="flop-stock">
                                <span className="ticker">{item.flop.ticker}</span>
                                <span className="price">{item.flop.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                                <span className="change negative">{item.flop.change.toFixed(2)}%</span>
                                <span className="volume">{(item.flop.volume / 1000).toFixed(0)}K</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Block - News */}
                <div className="card-right-block">
                  <h3 className="block-title">À la Une</h3>
                  
                  {/* Featured News */}
                  <div className="featured-news">
                    <div className="featured-image">
                      <div className="image-placeholder" />
                      <div className="featured-overlay">
                        <h4>{newsItems[0].title}</h4>
                        <p>{newsItems[0].description}</p>
                      </div>
                    </div>
                  </div>

                  {/* News List */}
                  <div className="news-list">
                    {newsItems.slice(1).map((news) => (
                      <div key={news.id} className="news-item">
                        <div className="news-image-small" />
                        <div className="news-content">
                          <h5>{news.title}</h5>
                          <p>{news.description}</p>
                          <span className="news-meta">{news.market} • {news.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom 35% - Exchanges Ranking Tables */}
              <div className="card-ranking-strip">
                <div className="ranking-tables-container">
                  {/* Table 1: Ranks 1-3 */}
                  <div className="ranking-table">
                    <div className="table-header">
                      <div className="rank-column">#</div>
                      <div className="exchange-column">Bourse</div>
                      <div className="metric-column">Capitalisation</div>
                      <div className="metric-column">Volume Quotidien</div>
                      <div className="metric-column">Performance YTD</div>
                      <div className="metric-column">Sociétés Cotées</div>
                    </div>

                    <div className="table-body">
                      {mockExchanges.slice(0, 3).map((exchange, index) => {
                        const rank = index + 1;
                        const getRankingColor = (rank: number) => {
                          if (rank === 1) return '#10b981';
                          if (rank === 2) return '#3b82f6';
                          if (rank === 3) return '#f59e0b';
                          return '#22c55e';
                        };
                        
                        return (
                          <div 
                            key={exchange.id}
                            className="table-row"
                            style={{ 
                              borderLeftColor: getRankingColor(rank),
                              borderLeftWidth: '4px'
                            }}
                          >
                            <div className="rank-column">
                              <span 
                                className="rank-badge"
                                style={{ backgroundColor: getRankingColor(rank) }}
                              >
                                {rank}
                              </span>
                            </div>
                            
                            <div className="exchange-column">
                              <div className="exchange-info">
                                <div className="exchange-details">
                                  <span className="exchange-name">{exchange.shortName}</span>
                                  <span className="exchange-country">{exchange.country}</span>
                                </div>
                              </div>
                            </div>

                            <div className="metric-column">
                              <span className="metric-value">
                                {exchange.totalMarketCap >= 1000 
                                  ? `$${(exchange.totalMarketCap / 1000).toFixed(1)}T` 
                                  : `$${exchange.totalMarketCap.toFixed(1)}B`}
                              </span>
                            </div>

                            <div className="metric-column">
                              <span className="metric-value">${exchange.dailyVolume.toFixed(1)}M</span>
                            </div>

                            <div className="metric-column" style={{ 
                              color: exchange.ytdReturn >= 10 ? '#10b981' : exchange.ytdReturn >= 5 ? '#22c55e' : '#f59e0b' 
                            }}>
                              <span className="metric-value">{exchange.ytdReturn.toFixed(1)}%</span>
                            </div>

                            <div className="metric-column">
                              <span className="metric-value">{exchange.listedCompanies}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Table 2: Ranks 4-6 */}
                  <div className="ranking-table">
                    <div className="table-header">
                      <div className="rank-column">#</div>
                      <div className="exchange-column">Bourse</div>
                      <div className="metric-column">Capitalisation</div>
                      <div className="metric-column">Volume Quotidien</div>
                      <div className="metric-column">Performance YTD</div>
                      <div className="metric-column">Sociétés Cotées</div>
                    </div>

                    <div className="table-body">
                      {mockExchanges.slice(3, 6).map((exchange, index) => {
                        const rank = index + 4;
                        const getRankingColor = (rank: number) => {
                          if (rank === 4) return '#8b5cf6';
                          if (rank === 5) return '#ec4899';
                          if (rank === 6) return '#ef4444';
                          return '#ef4444';
                        };
                        
                        return (
                          <div 
                            key={exchange.id}
                            className="table-row"
                            style={{ 
                              borderLeftColor: getRankingColor(rank),
                              borderLeftWidth: '4px'
                            }}
                          >
                            <div className="rank-column">
                              <span 
                                className="rank-badge"
                                style={{ backgroundColor: getRankingColor(rank) }}
                              >
                                {rank}
                              </span>
                            </div>
                            
                            <div className="exchange-column">
                              <div className="exchange-info">
                                <div className="exchange-details">
                                  <span className="exchange-name">{exchange.shortName}</span>
                                  <span className="exchange-country">{exchange.country}</span>
                                </div>
                              </div>
                            </div>

                            <div className="metric-column">
                              <span className="metric-value">
                                {exchange.totalMarketCap >= 1000 
                                  ? `$${(exchange.totalMarketCap / 1000).toFixed(1)}T` 
                                  : `$${exchange.totalMarketCap.toFixed(1)}B`}
                              </span>
                            </div>

                            <div className="metric-column">
                              <span className="metric-value">${exchange.dailyVolume.toFixed(1)}M</span>
                            </div>

                            <div className="metric-column" style={{ 
                              color: exchange.ytdReturn >= 10 ? '#10b981' : exchange.ytdReturn >= 5 ? '#22c55e' : '#f59e0b' 
                            }}>
                              <span className="metric-value">{exchange.ytdReturn.toFixed(1)}%</span>
                            </div>

                            <div className="metric-column">
                              <span className="metric-value">{exchange.listedCompanies}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Fixed Income */}
            <div className="carousel-card fixed-income-card">
              {/* Top Section - 70% height */}
              <div className="fi-top-section">
                {/* Left Block - Screeners */}
                <div className="fi-screeners-block">
                  {/* MTP Primary Screener */}
                  <div className="screener-mini-card">
                    <div className="screener-header">
                      <h4>MTP Primary</h4>
                      <Link href="/fixed-income/mtp-screener" className="view-all">Voir tout →</Link>
                    </div>
                    <div className="screener-table-wrapper">
                      <table className="mini-screener-table">
                        <thead>
                          <tr>
                            <th>ISIN</th>
                            <th>Country</th>
                            <th>YTM</th>
                            <th>Coupon</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="isin-mini">BJTPM001</td>
                            <td>🇧🇯 Benin</td>
                            <td className="positive">6.8%</td>
                            <td>6.5%</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">CITPM002</td>
                            <td>🇨🇮 CI</td>
                            <td className="positive">7.2%</td>
                            <td>7.0%</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">SNTPM003</td>
                            <td>🇸🇳 Senegal</td>
                            <td className="positive">6.5%</td>
                            <td>6.3%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* MTP Secondary Screener */}
                  <div className="screener-mini-card">
                    <div className="screener-header">
                      <h4>MTP Secondary</h4>
                      <Link href="/fixed-income/mtp-secondary-screener" className="view-all">Voir tout →</Link>
                    </div>
                    <div className="screener-table-wrapper">
                      <table className="mini-screener-table">
                        <thead>
                          <tr>
                            <th>ISIN</th>
                            <th>Price</th>
                            <th>Spread</th>
                            <th>Duration</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="isin-mini">BJTPS001</td>
                            <td>98.5</td>
                            <td className="positive">125</td>
                            <td>3.2Y</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">CITPS002</td>
                            <td>102.3</td>
                            <td className="negative">-45</td>
                            <td>5.8Y</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">SNTPS003</td>
                            <td>99.8</td>
                            <td className="positive">85</td>
                            <td>2.5Y</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Primary Screener */}
                  <div className="screener-mini-card">
                    <div className="screener-header">
                      <h4>Financial Primary</h4>
                      <Link href="/fixed-income/financial-primary-screener" className="view-all">Voir tout →</Link>
                    </div>
                    <div className="screener-table-wrapper">
                      <table className="mini-screener-table">
                        <thead>
                          <tr>
                            <th>ISIN</th>
                            <th>Country</th>
                            <th>Coupon</th>
                            <th>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="isin-mini">BJFIN001</td>
                            <td>🇧🇯 Benin</td>
                            <td className="positive">7.2%</td>
                            <td>50M</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">CIFIN002</td>
                            <td>🇨🇮 CI</td>
                            <td className="positive">7.5%</td>
                            <td>120M</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">SNFIN003</td>
                            <td>🇸🇳 Senegal</td>
                            <td className="positive">6.9%</td>
                            <td>85M</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Financial Secondary Screener */}
                  <div className="screener-mini-card">
                    <div className="screener-header">
                      <h4>Financial Secondary</h4>
                      <Link href="/fixed-income/financial-secondary-screener" className="view-all">Voir tout →</Link>
                    </div>
                    <div className="screener-table-wrapper">
                      <table className="mini-screener-table">
                        <thead>
                          <tr>
                            <th>ISIN</th>
                            <th>Price</th>
                            <th>YTM</th>
                            <th>Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="isin-mini">BJFIS001</td>
                            <td>98.5</td>
                            <td className="positive">6.8%</td>
                            <td>12M</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">CIFIS002</td>
                            <td>101.2</td>
                            <td className="positive">7.1%</td>
                            <td>28M</td>
                          </tr>
                          <tr>
                            <td className="isin-mini">SNFIS003</td>
                            <td>99.3</td>
                            <td className="positive">6.5%</td>
                            <td>15M</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Block - Featured News */}
                <div className="fi-news-block">
                  <h3>Featured News</h3>
                  <div className="fi-featured-news-list">
                    {[
                      { id: 1, title: 'BCEAO Announces New Monetary Policy Framework', category: 'News', country: 'BRVM', date: 'Dec 28', excerpt: 'The Central Bank introduces new guidelines for bond market operations...' },
                      { id: 2, title: 'Senegal Successfully Raises $1.5B in Eurobond', category: 'News', country: 'Senegal', date: 'Dec 27', excerpt: 'Strong investor demand drives successful sovereign bond issuance...' },
                      { id: 3, title: 'Côte d\'Ivoire Credit Rating Upgraded', category: 'Press Release', country: 'CI', date: 'Dec 25', excerpt: 'International rating agency upgrades sovereign credit rating...' },
                    ].map((news) => (
                      <div key={news.id} className="fi-featured-news-item">
                        <span className="fi-news-category">{news.category}</span>
                        <h4>{news.title}</h4>
                        <p>{news.excerpt}</p>
                        <div className="fi-news-meta">
                          <span className="fi-news-country">{news.country}</span>
                          <span className="fi-news-date">{news.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Section - 30% height - Market Cards */}
              <div className="fi-markets-strip">
                {[
                  { market: 'BRVM', region: BrvmRegion, cap: '12.5T', bonds: 156, change: 2.3 },
                  { market: 'CSE', region: CSERegion, cap: '8.2T', bonds: 45, change: 1.8 },
                  { market: 'NGX', region: NGXRegion, cap: '15.8T', bonds: 88, change: -0.5 },
                  { market: 'NSE', region: NSERegion, cap: '6.4T', bonds: 52, change: 3.1 },
                  { market: 'JSE', region: JSERegion, cap: '42.1T', bonds: 234, change: 1.2 },
                  { market: 'GSE', region: GSERegion, cap: '3.9T', bonds: 28, change: 0.9 },
                ].map((market) => (
                  <div key={market.market} className="fi-market-card">
                    <div className="fi-market-info">
                      <h4>{market.market}</h4>
                      <div className="fi-market-stats">
                        <div className="fi-stat">
                          <span className="fi-stat-label">Cap.</span>
                          <span className="fi-stat-value">{market.cap}</span>
                        </div>
                        <div className="fi-stat">
                          <span className="fi-stat-label">Bonds</span>
                          <span className="fi-stat-value">{market.bonds}</span>
                        </div>
                        <div className="fi-stat">
                          <span className="fi-stat-label">Change</span>
                          <span className={`fi-stat-value ${market.change >= 0 ? 'positive' : 'negative'}`}>
                            {market.change >= 0 ? '+' : ''}{market.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="fi-market-map"
                      ref={(el) => { regionRefs.current[`target-${market.market}`] = el; }}
                    >
                      {market.region({ color: '#00bfff' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Card 3: OPCVM */}
            <div className="carousel-card opcvm-card">
              {/* Top Section - 70% height */}
              <div className="opcvm-top-section">
                {/* Left Block - Titans Table */}
                <div className="opcvm-titans-block">
                  <h3>Les Titans de l'OPCVM</h3>
                  <div className="titans-table-container">
                    <table className="titans-table">
                      <thead>
                        <tr>
                          <th className="rank-col">Rang</th>
                          <th className="company-col">Société de Gestion</th>
                          <th className="aum-col">Actifs Sous Gestion</th>
                          <th className="performance-col">Performance Moyenne</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTitansCompanies.map((company) => (
                          <tr key={company.id} className="company-row">
                            <td className="rank-cell">
                              <div className={`rank-badge rank-${company.rank}`}>
                                {company.rank === 1 && (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                  </svg>
                                )}
                                #{company.rank}
                              </div>
                            </td>
                            <td className="company-cell">
                              <div className="company-info">
                                <div className="company-name">{company.name}</div>
                                <div className="company-location">{company.headquarters}</div>
                              </div>
                            </td>
                            <td className="aum-cell">
                              <div className="aum-value">{formatCurrency(company.aum)}</div>
                              <div className="aum-label">Millions FCFA</div>
                            </td>
                            <td className="performance-cell">
                              <div className={`performance-value ${company.avgPerformance >= 10 ? 'high' : 'medium'}`}>
                                +{company.avgPerformance}%
                              </div>
                              <div className="performance-label">Sur 12 mois</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Block - OPCVM Map */}
                <div className="opcvm-map-block">
                  <h3>Cartographie OPCVM Afrique</h3>
                  <div className="opcvm-map-container">
                    <AfricaOPCVMMap 
                      exchangeData={opcvmExchangeData}
                      mode="performance"
                      regionRefs={regionRefs}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Section - 30% height - Top Funds */}
              <div className="opcvm-top-funds-strip">
                <h3>Fonds les Mieux Notés</h3>
                <div className="funds-list">
                  {topOPCVMFunds.map((fund) => (
                    <div key={fund.id} className="fund-card">
                      <div className="fund-header">
                        <div className="fund-name">{fund.name}</div>
                        <div className="fund-exchange">{fund.exchange}</div>
                      </div>
                      
                      <div className="fund-rating">
                        {renderStars(fund.rating)}
                      </div>
                      
                      <div className="fund-metrics">
                        <div className="metric">
                          <span className="metric-label">Performance</span>
                          <span className={`metric-value ${fund.performance >= 0 ? 'positive' : 'negative'}`}>
                            {fund.performance >= 0 ? '+' : ''}{fund.performance}%
                          </span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Score</span>
                          <span className="metric-value">{(fund.performance / fund.volatility).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="carousel-nav">
          <button
            className="nav-arrow prev"
            onClick={() => setCurrentSlide((prev) => (prev - 1 + 3) % 3)}
          >
            ←
          </button>
          <button
            className="nav-arrow next"
            onClick={() => setCurrentSlide((prev) => (prev + 1) % 3)}
          >
            →
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
