'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function EquityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show sidebar when mouse is within 50px of left edge
      if (e.clientX <= 50) {
        setSidebarVisible(true);
      }
      // Hide sidebar when mouse moves away from left edge (beyond 300px)
      else if (e.clientX > 300) {
        setSidebarVisible(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const navItems = [
    { href: '/equity', label: 'Equity Home', icon: '🏠' },
    { href: '/equity/stock-screener-v2', label: 'Stock Screener', icon: '🔍' },
    { href: '/equity/stock-comparison', label: 'Stock Comparison', icon: '⚖️' },
    { href: '/equity/technical-analysis', label: 'Technical Analysis', icon: '📊' },
    { href: '/equity/financial-analysis', label: 'Financial Analysis', icon: '💹' },
    { href: '/equity/bourses', label: 'African Exchanges', icon: '🏛️' },
    { href: '/equity/market-movers', label: 'Market Movers', icon: '🚀' },
    { href: '/equity/sectors', label: 'Sectors', icon: '🏭' },
    { href: '/equity/news-articles', label: 'News & Articles', icon: '📰' },
    { href: '/equity/ipo', label: 'IPO & Listings', icon: '🎯' },
    { href: '/equity/corporate-events', label: 'Corporate Events', icon: '📅' },
    { href: '/equity/watchlist-portfolio', label: 'Watchlist & Portfolio', icon: '⭐' },
  ];

  return (
    <div className="equity-layout">
      <div className={`eq-sidebar ${sidebarVisible ? 'visible' : ''}`}>
        <div className="sidebar-header">
          <h2>Equity Markets</h2>
          <p>Navigation</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="eq-content">
        {children}
      </div>
    </div>
  );
}
