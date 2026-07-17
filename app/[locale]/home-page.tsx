'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import TickerBar from '@/components/navigation/TickerBar';

// AI Insights data
type AIInsight = {
  id: number;
  title: string;
  message: string;
  type: string;
  timestamp?: number;
};

const AI_INSIGHTS_KEYS = [
  { id: 1, titleKey: 'insights.marketAlert', messageKey: 'insights.marketAlertMsg', type: 'success' },
  { id: 2, titleKey: 'insights.aiRecommendation', messageKey: 'insights.aiRecommendationMsg', type: 'info' },
  { id: 3, titleKey: 'insights.opportunityDetected', messageKey: 'insights.opportunityMsg', type: 'warning' },
  { id: 4, titleKey: 'insights.portfolioInsight', messageKey: 'insights.portfolioMsg', type: 'info' },
  { id: 5, titleKey: 'insights.macroUpdate', messageKey: 'insights.macroMsg', type: 'success' },
];


// Exchanges data with full metrics
const EXCHANGES = [
  {
    id: 'BRVM', 
    code: 'BRVM',
    name: 'Bourse Régionale des Valeurs Mobilières',
    flag: '🇨🇮',
    index: '218.45',
    change: '+1.24%',
    up: true,
    companies: 45,
    volume: '$125M',
    marketCap: '$8.2B',
    color: '#f0a500'
  },
  { 
    id: 'GSE', 
    code: 'GSE', 
    name: 'Ghana Stock Exchange',
    flag: '🇬🇭',
    index: '3,128.7',
    change: '-0.38%',
    up: false,
    companies: 38,
    volume: '$89M',
    marketCap: '$5.1B',
    color: '#00d4aa'
  },
  { 
    id: 'NGX', 
    code: 'NGX', 
    name: 'Nigerian Exchange',
    flag: '🇳🇬',
    index: '97,324',
    change: '+2.11%',
    up: true,
    companies: 152,
    volume: '$342M',
    marketCap: '$42.8B',
    color: '#f0a500'
  },
  { 
    id: 'NSE', 
    code: 'NSE', 
    name: 'Nairobi Securities Exchange',
    flag: '🇰🇪',
    index: '1,928.4',
    change: '-0.91%',
    up: false,
    companies: 64,
    volume: '$156M',
    marketCap: '$18.4B',
    color: '#ff4f5e'
  },
  { 
    id: 'JSE', 
    code: 'JSE', 
    name: 'Johannesburg Stock Exchange',
    flag: '🇿🇦',
    index: '82,415',
    change: '+0.88%',
    up: true,
    companies: 298,
    volume: '$1.2B',
    marketCap: '$1.1T',
    color: '#00d4aa'
  },
  { 
    id: 'CSE', 
    code: 'CSE', 
    name: 'Casablanca Stock Exchange',
    flag: '🇲🇦',
    index: '12,845',
    change: '+0.45%',
    up: true,
    companies: 76,
    volume: '$198M',
    marketCap: '$52.3B',
    color: '#f0a500'
  },
];

export default function NewHomePage() {
  const t = useTranslations('home');
  const tNav = useTranslations('nav');
  const [notifications, setNotifications] = useState<AIInsight[]>([]);

  // AI Insights notification system
  useEffect(() => {
    const showNotification = () => {
      const randomKey = AI_INSIGHTS_KEYS[Math.floor(Math.random() * AI_INSIGHTS_KEYS.length)];
      const newNotification = {
        ...randomKey,
        title: t(randomKey.titleKey as Parameters<typeof t>[0]),
        message: t(randomKey.messageKey as Parameters<typeof t>[0]),
        timestamp: Date.now(),
      };
      
      setNotifications(prev => [...prev, newNotification]);
      
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.timestamp !== newNotification.timestamp));
      }, 5000);
    };

    const interval = setInterval(showNotification, 8000);
    showNotification();

    return () => clearInterval(interval);
  }, [t]);

  const universes = [
    {
      id: 'equity',
      title: t('universes.equity.title'),
      description: t('universes.equity.description'),
      color: '#f0a500',
      link: '/equity'
    },
    {
      id: 'fixed-income',
      title: t('universes.fixedIncome.title'),
      description: t('universes.fixedIncome.description'),
      color: '#00d4aa',
      link: '/fixed-income'
    },
    {
      id: 'opcvm',
      title: t('universes.opcvm.title'),
      description: t('universes.opcvm.description'),
      color: '#6496ff',
      link: '/opcvm'
    },
    {
      id: 'macro',
      title: t('universes.macro.title'),
      description: t('universes.macro.description'),
      color: '#ff4f5e',
      link: '/macro'
    }
  ];

  return (
    <div className="afrimarket-homepage">
      {/* Animated Background */}
      <div className="hero-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      {/* Ticker Bar - Exchanges data for homepage */}
      <TickerBar type="exchanges" />

      <div className="video-hero">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          className="hero-video"
        >
          <source src="/hero/AlgoFront.mp4" type="video/mp4" />
        </video>
        <div className="video-gradient"></div>
      </div>

      {/* Main Content */}
      <div className="homepage-container">

        {/* 4 Universes in Row */}
        <section className="universes-section">
          <h2 className="section-title">{t('ourUniverses')}</h2>
          
          <div className="universes-row">
            {universes.map((universe, index) => (
              <motion.div
                key={universe.id}
                className="universe-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                style={{ borderColor: universe.color }}
              >
                <Link href={universe.link}>
                  <h3 className="universe-title">{universe.title}</h3>
                  <p className="universe-description">{universe.description}</p>
                  <div className="universe-arrow" style={{ color: universe.color }}>→</div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 6 Exchanges */}
        <section className="exchanges-section">
          {/* <h2 className="section-title">Real-time data from 6 major African exchanges</h2> */}
          
          <div className="exchanges-grid">
            {EXCHANGES.map((exchange, index) => (
              <motion.div
                key={exchange.id}
                className="exchange-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.08, duration: 0.5 }}
              >
                <div className="exchange-header">
                  <div className="exchange-info">
                    <div className="exchange-flag">{exchange.flag}</div>
                    <div className="exchange-code">{exchange.code}</div>
                    <div className="exchange-name">{exchange.name}</div>
                  </div>
                  
                  <div className="exchange-index">
                    <span className="index-value">{exchange.index}</span>
                    <span className={`index-change ${exchange.up ? 'up' : 'down'}`}>
                      {exchange.up ? '▲' : '▼'} {exchange.change}
                    </span>
                  </div>
                </div>
                
                <div className="exchange-metrics">
                  <div className="metric">
                    <span className="metric-label">{t('exchange.companies')}</span>
                    <span className="metric-value">{exchange.companies}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">{t('exchange.volume')}</span>
                    <span className="metric-value">{exchange.volume}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">{t('exchange.marketCap')}</span>
                    <span className="metric-value">{exchange.marketCap}</span>
                  </div>
                </div>
                
                <div className="exchange-pulse" style={{ background: exchange.color }}></div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* AI Insights Notifications */}
      <div className="notif-stack">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={`${notification.id}-${notification.timestamp}`}
              className={`notif notif-${notification.type}`}
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <div className="notif-header">
                <div className="notif-ai">{t('ai.label')}</div>
                <div className="notif-time">{t('ai.justNow')}</div>
              </div>
              <div className="notif-title">{notification.title}</div>
              <div className="notif-body">{notification.message}</div>
              <button 
                className="notif-close"
                onClick={() => setNotifications(prev => prev.filter(n => n.timestamp !== notification.timestamp))}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
