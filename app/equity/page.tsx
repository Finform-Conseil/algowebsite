'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export default function EquityHomePage() {
  const [marketIndices, setMarketIndices] = useState<any[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('All');

  // Simulate dynamic market indices data
  useEffect(() => {
    const initialData = [
      { exchange: 'BRVM', name: 'BRVM Composite', value: 215.43, change: 0, volume: 1250000 },
      { exchange: 'NSE', name: 'NSE All-Share', value: 42850.25, change: 0, volume: 8500000 },
      { exchange: 'JSE', name: 'JSE All-Share', value: 78234.50, change: 0, volume: 15200000 },
      { exchange: 'EGX', name: 'EGX 30', value: 18456.75, change: 0, volume: 3400000 },
      { exchange: 'BRVM', name: 'BRVM 10', value: 182.15, change: 0, volume: 850000 },
    ];

    setMarketIndices(initialData);

    const interval = setInterval(() => {
      setMarketIndices(prev => prev.map(index => ({
        ...index,
        change: parseFloat((Math.sin(Date.now() / 3000 + Math.random() * 2) * 2.5).toFixed(2)),
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const filteredIndices = useMemo(() => {
    if (selectedExchange === 'All') return marketIndices;
    return marketIndices.filter(idx => idx.exchange === selectedExchange);
  }, [marketIndices, selectedExchange]);

  const topGainers = [
    { ticker: 'SONATEL', name: 'Sonatel Sénégal', price: 18500, change: 5.8, volume: 12500, exchange: 'BRVM' },
    { ticker: 'ECOBANK', name: 'Ecobank Transnational', price: 2850, change: 4.2, volume: 45000, exchange: 'BRVM' },
    { ticker: 'SAFARICOM', name: 'Safaricom PLC', price: 32.50, change: 3.9, volume: 2500000, exchange: 'NSE' },
    { ticker: 'NASPERS', name: 'Naspers Limited', price: 3245, change: 3.5, volume: 180000, exchange: 'JSE' },
    { ticker: 'CIB', name: 'Commercial Intl Bank', price: 42.80, change: 3.2, volume: 950000, exchange: 'EGX' },
  ];

  const topLosers = [
    { ticker: 'PALM', name: 'PALMCI', price: 6200, change: -2.8, volume: 8500, exchange: 'BRVM' },
    { ticker: 'EQUITY', name: 'Equity Group Holdings', price: 48.25, change: -2.1, volume: 850000, exchange: 'NSE' },
    { ticker: 'ABSA', name: 'Absa Group Limited', price: 182.50, change: -1.8, volume: 320000, exchange: 'JSE' },
    { ticker: 'ORASCOM', name: 'Orascom Construction', price: 215.30, change: -1.5, volume: 125000, exchange: 'EGX' },
    { ticker: 'TOTAL', name: 'Total Senegal', price: 2150, change: -1.2, volume: 3200, exchange: 'BRVM' },
  ];

  const sectorPerformance = [
    { sector: 'Banking & Finance', performance: 2.4, stocks: 45, marketCap: '125B XOF', trend: 'up' },
    { sector: 'Telecommunications', performance: 1.8, stocks: 12, marketCap: '89B XOF', trend: 'up' },
    { sector: 'Energy & Utilities', performance: -0.5, stocks: 18, marketCap: '67B XOF', trend: 'down' },
    { sector: 'Consumer Goods', performance: 1.2, stocks: 28, marketCap: '54B XOF', trend: 'up' },
    { sector: 'Agriculture', performance: -1.1, stocks: 15, marketCap: '42B XOF', trend: 'down' },
    { sector: 'Real Estate', performance: 0.8, stocks: 22, marketCap: '38B XOF', trend: 'up' },
  ];

  const marketNews = [
    {
      id: 1,
      title: 'BRVM Composite Index Reaches New High Amid Strong Banking Sector Performance',
      excerpt: 'The regional stock exchange continues its upward trajectory as major banks report strong Q4 earnings...',
      category: 'Market Update',
      date: '2 hours ago',
      source: 'BRVM News',
    },
    {
      id: 2,
      title: 'Safaricom Announces Major 5G Infrastructure Investment',
      excerpt: 'Kenya\'s leading telecom operator plans to invest $500M in expanding 5G coverage across East Africa...',
      category: 'Corporate News',
      date: '5 hours ago',
      source: 'NSE Updates',
    },
    // {
    //   id: 3,
    //   title: 'JSE All-Share Index Gains on Mining Sector Rally',
    //   excerpt: 'South African stocks surge as commodity prices strengthen, with gold and platinum miners leading gains...',
    //   category: 'Market Analysis',
    //   date: '1 day ago',
    //   source: 'JSE Insights',
    // },
    // {
    //   id: 4,
    //   title: 'EGX 30 Rebounds After Central Bank Policy Decision',
    //   excerpt: 'Egyptian stocks recover following the central bank\'s decision to maintain interest rates...',
    //   category: 'Economic Policy',
    //   date: '1 day ago',
    //   source: 'EGX Reports',
    // },
  ];

  const upcomingEvents = [
    { company: 'Ecobank', event: 'Q4 Earnings Release', date: 'Jan 15, 2025', type: 'earnings' },
    { company: 'MTN Group', event: 'Annual General Meeting', date: 'Jan 22, 2025', type: 'agm' },
    { company: 'Sonatel', event: 'Dividend Payment', date: 'Jan 28, 2025', type: 'dividend' },
    { company: 'Standard Bank', event: 'Investor Presentation', date: 'Feb 5, 2025', type: 'presentation' },
  ];

  const recentIPOs = [
    { company: 'TechCorp Africa', ticker: 'TCAF', exchange: 'NSE', listingDate: 'Dec 15, 2024', price: 125.50, change: 15.2, sector: 'Technology' },
    { company: 'Green Energy Ltd', ticker: 'GREN', exchange: 'JSE', listingDate: 'Dec 10, 2024', price: 42.80, change: 8.5, sector: 'Energy' },
    { company: 'AgroFresh SA', ticker: 'AGRF', exchange: 'BRVM', listingDate: 'Dec 5, 2024', price: 3200, change: 12.3, sector: 'Agriculture' },
    { company: 'FinServe Group', ticker: 'FNSV', exchange: 'EGX', listingDate: 'Nov 28, 2024', price: 88.90, change: 6.7, sector: 'Finance' },
    { company: 'LogiTrans Corp', ticker: 'LGTC', exchange: 'NSE', listingDate: 'Nov 20, 2024', price: 56.40, change: 9.1, sector: 'Logistics' },
  ];

  return (
    <div className="equity-home-page">
      <div className="header-indices-wrapper">
        <div className="eq-header">
          <h1>African Equity Markets</h1>
          <p>Real-time market data and comprehensive equity analysis</p>
        </div>

        <div className="market-indices-section">
          <div className="indices-carousel">
            {[...marketIndices, ...marketIndices].map((index, i) => (
              <div key={i} className="index-card">
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
                <div className="index-volume">Vol: {(index.volume / 1000000).toFixed(2)}M</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="movers-news-section">
        <div className="movers-news-container">
          <div className="movers-column">
            <div className="section-header">
              <h3>Market Movers</h3>
              <Link href="/equity/market-movers" className="view-all-link">View All →</Link>
            </div>
            <div className="movers-table">
              <div className="movers-group">
                <div className="movers-subheader gainers">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                  <span>Top Gainers</span>
                </div>
                {topGainers.slice(0, 3).map((stock, i) => (
                  <Link key={i} href={`/equity/${stock.ticker.toLowerCase()}`} className="mover-item">
                    <div className="mover-info">
                      <div className="mover-ticker">{stock.ticker}</div>
                      <div className="mover-name">{stock.name}</div>
                    </div>
                    <div className="mover-data">
                      <div className="mover-price">{stock.price.toLocaleString()}</div>
                      <div className="mover-change positive">+{stock.change}%</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="movers-group">
                <div className="movers-subheader losers">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span>Top Losers</span>
                </div>
                {topLosers.slice(0, 3).map((stock, i) => (
                  <Link key={i} href={`/equity/${stock.ticker.toLowerCase()}`} className="mover-item">
                    <div className="mover-info">
                      <div className="mover-ticker">{stock.ticker}</div>
                      <div className="mover-name">{stock.name}</div>
                    </div>
                    <div className="mover-data">
                      <div className="mover-price">{stock.price.toLocaleString()}</div>
                      <div className="mover-change negative">{stock.change}%</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="news-column">
            <div className="section-header">
              <h3>Market News</h3>
              <Link href="/equity/news-articles" className="view-all-link">View All →</Link>
            </div>
            <div className="news-list">
              {marketNews.slice(0, 3).map((news) => (
                <Link key={news.id} href="/equity/news-articles" className="news-card">
                  <div className="news-header">
                    <span className="news-category">{news.category}</span>
                    <span className="news-date">{news.date}</span>
                  </div>
                  <h4>{news.title}</h4>
                  <p>{news.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sectors-events-section">
        <div className="sectors-events-container">
          <div className="sectors-column">
            <div className="section-header">
              <h3>Sector Performance</h3>
              <Link href="/equity/sectors" className="view-all-link">View All →</Link>
            </div>
            <div className="sectors-compact">
              {sectorPerformance.map((sector, i) => (
                <div key={i} className="sector-item">
                  <div className="sector-info">
                    <span className="sector-name">{sector.sector}</span>
                    <span className="sector-stocks">{sector.stocks} stocks</span>
                  </div>
                  <div className="sector-data">
                    <div className={`sector-performance ${sector.performance >= 0 ? 'positive' : 'negative'}`}>
                      {sector.performance >= 0 ? '+' : ''}{sector.performance}%
                    </div>
                    <div className={`sector-trend ${sector.trend}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        {sector.trend === 'up' ? (
                          <polyline points="18 15 12 9 6 15" />
                        ) : (
                          <polyline points="6 9 12 15 18 9" />
                        )}
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="events-column">
            <div className="section-header">
              <h3>Upcoming Events</h3>
              <Link href="/equity/corporate-events" className="view-all-link">View All →</Link>
            </div>
            <div className="events-list">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="event-card">
                  <div className={`event-type-badge ${event.type}`}>
                    {event.type === 'earnings' && '📊'}
                    {event.type === 'agm' && '📅'}
                    {event.type === 'dividend' && '💰'}
                    {event.type === 'presentation' && '🎯'}
                  </div>
                  <div className="event-details">
                    <div className="event-company">{event.company}</div>
                    <div className="event-name">{event.event}</div>
                    <div className="event-date">{event.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="recent-ipos-section">
            <div className="section-header">
              <h3>Recent IPOs</h3>
              <Link href="/equity/ipo" className="view-all-link">View All →</Link>
            </div>
            <div className="ipos-list">
              {recentIPOs.map((ipo, i) => (
                <Link key={i} href={`/equity/${ipo.ticker.toLowerCase()}`} className="ipo-card">
                  <div className="ipo-header">
                    <div className="ipo-company">
                      <div className="ipo-ticker">{ipo.ticker}</div>
                      <div className="ipo-name">{ipo.company}</div>
                    </div>
                    <div className="ipo-exchange">{ipo.exchange}</div>
                  </div>
                  <div className="ipo-details">
                    <div className="ipo-info">
                      <span className="ipo-label">Listed</span>
                      <span className="ipo-value">{ipo.listingDate}</span>
                    </div>
                    <div className="ipo-info">
                      <span className="ipo-label">Sector</span>
                      <span className="ipo-value">{ipo.sector}</span>
                    </div>
                    <div className="ipo-info">
                      <span className="ipo-label">Price</span>
                      <span className="ipo-value">{ipo.price.toLocaleString()}</span>
                    </div>
                    <div className="ipo-info">
                      <span className="ipo-label">Performance</span>
                      <span className={`ipo-value ${ipo.change >= 0 ? 'positive' : 'negative'}`}>
                        {ipo.change >= 0 ? '+' : ''}{ipo.change}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
