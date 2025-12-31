'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function FixedIncomeLayout({
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
    { href: '/fixed-income', label: 'Fixed Income Home', icon: '🏠' },
    { href: '/fixed-income/mtp-screener', label: 'MTP Primary Screener', icon: '📊' },
    { href: '/fixed-income/mtp-secondary-screener', label: 'MTP Secondary Screener', icon: '📈' },
    { href: '/fixed-income/financial-primary-screener', label: 'Financial Primary Screener', icon: '💼' },
    { href: '/fixed-income/financial-secondary-screener', label: 'Financial Secondary Screener', icon: '💰' },
    { href: '/fixed-income/bond-swap', label: 'Bond Swap', icon: '🔄' },
    { href: '/fixed-income/simulator', label: 'Bond Simulator', icon: '🧮' },
  ];

  return (
    <div className="fixed-income-layout">
      <div className={`fi-sidebar ${sidebarVisible ? 'visible' : ''}`}>
        <div className="sidebar-header">
          <h2>Fixed Income</h2>
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
      <div className="fi-content">
        {children}
      </div>
    </div>
  );
}
