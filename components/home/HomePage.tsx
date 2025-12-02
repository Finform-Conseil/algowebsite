'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AfricaMap from '@/components/Africa';
import TopMovers from '@/components/market-movers/TopMovers';
import RecentIPOs from '@/components/ipo/RecentIPOs';
import RankingDashboard from '@/components/exchanges/RankingDashboard';
import SectorPerformance from '@/components/sectors/SectorPerformance';
import { AFRICAN_EXCHANGES } from '@/core/data/ExchangesData';
import { RECENT_IPOS } from '@/core/data/IPOData';
import { MARKET_STOCKS } from '@/core/data/MarketMoversData';
import { AFRICAN_SECTORS } from '@/core/data/SectorsData';

const HomePage = () => {
  const [activeTab, setActiveTab] = useState<'movers' | 'ipos' | 'ranking' | 'sectors'>('movers');
  const [selectedSectorId, setSelectedSectorId] = useState<string>('');

  const topGainers = MARKET_STOCKS
    .filter(stock => stock.change > 0)
    .sort((a, b) => b.change - a.change)
    .slice(0, 2);

  const topLosers = MARKET_STOCKS
    .filter(stock => stock.change < 0)
    .sort((a, b) => a.change - b.change)
    .slice(0, 2);

  const recentIPOs = RECENT_IPOS
    .filter(ipo => ipo.status === 'completed')
    .sort((a, b) => new Date(b.ipoDate).getTime() - new Date(a.ipoDate).getTime())
    .slice(0, 5);

  const tabs = [
    { id: 'movers' as const, label: 'Market Movers', icon: '📈' },
    { id: 'ipos' as const, label: 'IPOs Récentes', icon: '🚀' },
    { id: 'ranking' as const, label: 'Classement', icon: '🏆' },
    { id: 'sectors' as const, label: 'Secteurs', icon: '📊' }
  ];

  const handleAnalyzeExchange = (exchangeId: string) => {
    console.log('Analyze exchange:', exchangeId);
  };

  const handleSectorSelect = (sectorId: string) => {
    setSelectedSectorId(sectorId);
  };

  return (
    <div style={{
      // height: '100vh',
      background: 'var(--background-color)',
      // overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          padding: '1.5rem 2rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--card-background)'
        }}
      >
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: 'var(--text-color)',
          margin: 0
        }}>
          Marchés Africains
        </h1>
        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-secondary)',
          margin: '0.25rem 0 0 0'
        }}>
          Vue d'ensemble des bourses et opportunités d'investissement
        </p>
      </motion.div>

      <div style={{
        flex: 1,
        display: 'grid',
        gridTemplateColumns: '35fr 65fr',
        gap: 0,
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <AfricaMap />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0,0,0,0.02)'
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: activeTab === tab.id ? 'var(--primary-color)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'var(--text-secondary)',
                  border: activeTab === tab.id ? 'none' : '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div style={{
            flex: 1,
            overflow: 'auto'
          }}>
            <AnimatePresence mode="wait">
              {activeTab === 'movers' && (
                <motion.div
                  key="movers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="movers-section tops-flops-section"
                >
                  <div className="section-grid">
                    <TopMovers stocks={topGainers} type="gainers" />
                    <TopMovers stocks={topLosers} type="losers" />
                  </div>
                </motion.div>
              )}

              {activeTab === 'ipos' && (
                <motion.div
                  key="ipos"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <RecentIPOs ipos={recentIPOs} />
                </motion.div>
              )}

              {activeTab === 'ranking' && (
                <motion.div
                  key="ranking"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="ranking-section"
                >
                  <RankingDashboard 
                    exchanges={AFRICAN_EXCHANGES} 
                    onAnalyzeExchange={handleAnalyzeExchange}
                  />
                </motion.div>
              )}

              {activeTab === 'sectors' && (
                <motion.div
                  key="sectors"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectorPerformance
                    sectors={AFRICAN_SECTORS}
                    period="6M"
                    selectedSectorId={selectedSectorId}
                    onSectorSelect={handleSectorSelect}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;
