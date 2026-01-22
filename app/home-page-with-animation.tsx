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
import { motion, useAnimate } from 'framer-motion';

// Types et interfaces (copier depuis home-page.tsx)
interface MarketIndex {
  exchange: string;
  name: string;
  value: number;
  change: number;
  chartData: number[];
}

interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  sparkline: number[];
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  market: string;
  date: string;
}

const REGIONS = [
  { Component: BrvmRegion, id: 'BRVM' },
  { Component: NGXRegion, id: 'NGX' },
  { Component: NSERegion, id: 'NSE' },
  { Component: JSERegion, id: 'JSE' },
  { Component: GSERegion, id: 'GSE' },
  { Component: CSERegion, id: 'CSE' },
];

export default function NewHomePageWithAnimation() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animatingRegions, setAnimatingRegions] = useState<string[]>([]);
  const sourceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const targetRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [scope, animate] = useAnimate();

  // Fonction pour animer les régions quand on change de slide
  useEffect(() => {
    if (currentSlide === 1) {
      // Animer de Card 1 vers Card 2
      REGIONS.forEach((region) => {
        const sourceEl = sourceRefs.current[region.id];
        const targetEl = targetRefs.current[region.id];
        
        if (sourceEl && targetEl) {
          const sourceRect = sourceEl.getBoundingClientRect();
          const targetRect = targetEl.getBoundingClientRect();
          
          // Créer un élément animé
          const animatedEl = document.createElement('div');
          animatedEl.style.position = 'fixed';
          animatedEl.style.left = `${sourceRect.left}px`;
          animatedEl.style.top = `${sourceRect.top}px`;
          animatedEl.style.width = `${sourceRect.width}px`;
          animatedEl.style.height = `${sourceRect.height}px`;
          animatedEl.style.zIndex = '10000';
          animatedEl.style.pointerEvents = 'none';
          animatedEl.innerHTML = sourceEl.innerHTML;
          
          document.body.appendChild(animatedEl);
          
          // Cacher les éléments source et destination
          sourceEl.style.opacity = '0';
          targetEl.style.opacity = '0';
          
          // Animer vers la destination
          const deltaX = targetRect.left - sourceRect.left;
          const deltaY = targetRect.top - sourceRect.top;
          const scaleX = targetRect.width / sourceRect.width;
          const scaleY = targetRect.height / sourceRect.height;
          
          animatedEl.animate([
            { transform: 'translate(0, 0) scale(1)' },
            { transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})` }
          ], {
            duration: 2000,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'forwards'
          }).onfinish = () => {
            document.body.removeChild(animatedEl);
            targetEl.style.opacity = '1';
          };
        }
      });
    } else if (currentSlide === 0) {
      // Réafficher les éléments source
      REGIONS.forEach((region) => {
        const sourceEl = sourceRefs.current[region.id];
        if (sourceEl) {
          sourceEl.style.opacity = '1';
        }
      });
    }
  }, [currentSlide]);

  return (
    <div className="new-home-page" ref={scope}>
      {/* Contenu identique à home-page.tsx mais avec refs */}
      <div className="carousel-wrapper">
        <div className="carousel-section">
          <div className="carousel-content">
            <div className="carousel-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
              {/* Card 1: Equity */}
              <div className="carousel-card equity-card">
                <div className="countries-flags">
                  {REGIONS.map((region) => (
                    <div
                      key={region.id}
                      className="country-flag-item"
                      ref={(el) => { sourceRefs.current[region.id] = el; }}
                    >
                      {region.Component({ color: '#00bfff' })}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Card 2: Fixed Income */}
              <div className="carousel-card fixed-income-card">
                {REGIONS.map((region) => (
                  <div
                    key={region.id}
                    className="fi-market-map"
                    ref={(el) => { targetRefs.current[region.id] = el; }}
                  >
                    {region.Component({ color: '#00bfff' })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <button onClick={() => setCurrentSlide(0)}>Card 1</button>
          <button onClick={() => setCurrentSlide(1)}>Card 2</button>
        </div>
      </div>
    </div>
  );
}
