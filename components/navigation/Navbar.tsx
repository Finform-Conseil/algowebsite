'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  MagnifyingGlass, 
  ChartLine, 
  TrendUp, 
  Vault, 
  Globe,
  CaretDown,
  CaretRight,
  Funnel,
  Scales,
  Bank,
  Rocket,
  Wrench,
  ChartLineUp,
  ChartBar,
  Factory,
  CalendarDots,
  Target,
  Star,
  Trophy,
  GraduationCap,
  ChartPieSlice,
  CurrencyCircleDollar,
  Briefcase,
  TrendDown
} from '@phosphor-icons/react';

type SubMenuItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  subItems?: SubMenuItem[];
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  items?: SubMenuItem[];
};

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [activeNestedSubmenu, setActiveNestedSubmenu] = useState<string | null>(null);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const [submenuTimeout, setSubmenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const [nestedSubmenuTimeout, setNestedSubmenuTimeout] = useState<NodeJS.Timeout | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Search:', searchQuery);
  };

  const handleMenuEnter = (label: string) => {
    if (menuTimeout) clearTimeout(menuTimeout);
    if (submenuTimeout) clearTimeout(submenuTimeout);
    setActiveMenu(label);
  };

  const handleMenuLeave = () => {
    const timeout = setTimeout(() => {
      setActiveMenu(null);
      setActiveSubmenu(null);
    }, 300);
    setMenuTimeout(timeout);
  };

  const handleSubmenuEnter = (label: string) => {
    if (submenuTimeout) clearTimeout(submenuTimeout);
    setActiveSubmenu(label);
  };

  const handleSubmenuLeave = () => {
    const timeout = setTimeout(() => {
      setActiveSubmenu(null);
      setActiveNestedSubmenu(null);
    }, 200);
    setSubmenuTimeout(timeout);
  };

  const handleNestedSubmenuEnter = (label: string) => {
    if (nestedSubmenuTimeout) clearTimeout(nestedSubmenuTimeout);
    setActiveNestedSubmenu(label);
  };

  const handleNestedSubmenuLeave = () => {
    const timeout = setTimeout(() => {
      setActiveNestedSubmenu(null);
    }, 200);
    setNestedSubmenuTimeout(timeout);
  };

  const navItems: NavItem[] = [
    {
      href: '/equity',
      label: 'Equity',
      icon: <ChartLine size={18} weight="duotone" />,
      items: [
        { href: '/equity/stock-screener-v2', label: 'Stock Screener', icon: <Funnel size={16} weight="duotone" /> },
        { href: '/equity/stock-comparison', label: 'Stock Comparison', icon: <Scales size={16} weight="duotone" /> },
        { href: '/equity/bourses', label: 'African Exchanges', icon: <Bank size={16} weight="duotone" /> },
        { href: '/equity/market-movers', label: 'Market Movers', icon: <Rocket size={16} weight="duotone" /> },
        { 
          href: '/equity/tools', 
          label: 'Equity Tools', 
          icon: <Wrench size={16} weight="duotone" />,
          subItems: [
            { href: '/equity/technical-analysis', label: 'Technical Analysis', icon: <ChartLineUp size={16} weight="duotone" /> },
            { href: '/equity/financial-analysis', label: 'Financial Analysis', icon: <ChartBar size={16} weight="duotone" /> },
          ]
        },
        { href: '/equity/sectors', label: 'Sectors', icon: <Factory size={16} weight="duotone" /> },
        { 
          href: '/equity/corporate-events', 
          label: 'Corporate Events', 
          icon: <CalendarDots size={16} weight="duotone" />,
          subItems: [
            { href: '/equity/corporate-events/ipo', label: 'IPO & Listings', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/splits', label: 'Splits', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/reverse-split', label: 'Reverse Split', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/merger', label: 'Merger', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/acquisitions', label: 'Acquisitions', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/delisting', label: 'Delisting', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/bankruptcy', label: 'Bankruptcy', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/spin-off', label: 'Spin-off', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/dividend', label: 'Dividend', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/rights-issue', label: 'Rights Issue', icon: <Target size={16} weight="duotone" /> },
            { href: '/equity/corporate-events/share-buyback', label: 'Share Buyback', icon: <Target size={16} weight="duotone" /> },
          ]
        },
        { href: '/equity/watchlist-portfolio', label: 'Watchlist & Portfolio', icon: <Star size={16} weight="duotone" /> },
      ]
    },
    {
      href: '/fixed-income',
      label: 'Fixed Income',
      icon: <Vault size={18} weight="duotone" />,
      items: [
        { 
          href: '/fixed-income/screener', 
          label: 'Fixed Income Screener', 
          icon: <Funnel size={16} weight="duotone" />,
          subItems: [
            {
              href: '/fixed-income/screener/public-securities',
              label: 'Public Securities Market',
              icon: <Bank size={16} weight="duotone" />,
              subItems: [
                { href: '/fixed-income/screener/public-securities/primary', label: 'Primary Screener', icon: <ChartLineUp size={16} weight="duotone" /> },
                { href: '/fixed-income/screener/public-securities/secondary', label: 'Secondary Screener', icon: <ChartBar size={16} weight="duotone" /> },
              ]
            },
            {
              href: '/fixed-income/screener/financial-market',
              label: 'Financial Market',
              icon: <TrendUp size={16} weight="duotone" />,
              subItems: [
                { href: '/fixed-income/screener/financial-market/primary', label: 'Primary Screener', icon: <ChartLineUp size={16} weight="duotone" /> },
                { href: '/fixed-income/screener/financial-market/secondary', label: 'Secondary Screener', icon: <ChartBar size={16} weight="duotone" /> },
              ]
            }
          ]
        },
        { href: '/fixed-income/bond-swap', label: 'Bond Swap', icon: <Scales size={16} weight="duotone" /> },
        { href: '/fixed-income/simulator', label: 'Bond Simulator', icon: <ChartLine size={16} weight="duotone" /> },
      ]
    },
    {
      href: '/opcvm',
      label: 'Funds',
      icon: <ChartPieSlice size={18} weight="duotone" />,
      items: [
        { href: '/opcvm/screener', label: 'Funds Screener', icon: <Funnel size={16} weight="duotone" /> },
        { href: '/opcvm/comparison', label: 'Funds Comparison', icon: <Scales size={16} weight="duotone" /> },
        { href: '/opcvm/titans', label: 'Titans Asset Management', icon: <Trophy size={16} weight="duotone" /> },
        { href: '/opcvm/simulator', label: 'Subscription Simulator', icon: <ChartLine size={16} weight="duotone" /> },
        { href: '/opcvm/learn', label: 'Learn Funds', icon: <GraduationCap size={16} weight="duotone" /> },
      ]
    },
    {
      href: '/macro',
      label: 'Macro',
      icon: <Globe size={18} weight="duotone" />,
      items: [
        { href: '/macro/key-indicators', label: 'Key Indicators', icon: <ChartLineUp size={16} weight="duotone" /> },
        { href: '/macro/currencies-central-banks', label: 'Currencies & Central Banks', icon: <CurrencyCircleDollar size={16} weight="duotone" /> },
        { href: '/macro/public-finances', label: 'Public Finances', icon: <Briefcase size={16} weight="duotone" /> },
        { href: '/macro/external-sector-fx', label: 'External Sector & FX', icon: <TrendUp size={16} weight="duotone" /> },
        { href: '/macro/economic-calendar', label: 'Economic Calendar', icon: <CalendarDots size={16} weight="duotone" /> },
        { href: '/macro/macro-analysis', label: 'Macro Analysis', icon: <ChartBar size={16} weight="duotone" /> },
      ]
    },
  ];

  return (
    <nav className="afrimarket-nav">
      <Link href="/" className="nav-logo">
        <div className="logo-mark">AM</div>
        <span>Afri<span className="accent">Market</span></span>
      </Link>

      {/* Search Bar */}
      <form className="nav-search" onSubmit={handleSearch}>
        <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <input
          type="text"
          placeholder="Search stocks, bonds, funds..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button
            type="button"
            className="search-clear"
            onClick={() => setSearchQuery('')}
          >
            ×
          </button>
        )}
      </form>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li 
            key={item.label}
            className="nav-item"
            onMouseEnter={() => handleMenuEnter(item.label)}
            onMouseLeave={handleMenuLeave}
          >
            <Link href={item.href} className="nav-link dropdown-item">
                {item.icon}
                <span>{item.label}</span>
                {item.items && item.items.length > 0 && <CaretDown size={14} weight="bold" />}
            </Link>

            
            {item.items && item.items.length > 0 && activeMenu === item.label && (
              <div className="dropdown-menu">
                {item.items.map((subItem) => (
                  <div 
                    key={subItem.label}
                    className="dropdown-item-wrapper"
                    onMouseEnter={() => subItem.subItems && handleSubmenuEnter(subItem.label)}
                    onMouseLeave={() => subItem.subItems && handleSubmenuLeave()}
                  >
                    <Link href={subItem.href} className="dropdown-item">
                      {subItem.icon}
                      <span>{subItem.label}</span>
                      {subItem.subItems && <CaretRight size={14} weight="bold" className="submenu-arrow" />}
                    </Link>
                    
                    {subItem.subItems && activeSubmenu === subItem.label && (
                      <div className="nested-dropdown">
                        {subItem.subItems.map((nestedItem) => (
                          <div
                            key={nestedItem.label}
                            className="dropdown-item-wrapper"
                            onMouseEnter={() => nestedItem.subItems && handleNestedSubmenuEnter(nestedItem.label)}
                            onMouseLeave={() => nestedItem.subItems && handleNestedSubmenuLeave()}
                          >
                            <Link href={nestedItem.href} className="dropdown-item">
                              {nestedItem.icon}
                              <span>{nestedItem.label}</span>
                              {nestedItem.subItems && <CaretRight size={14} weight="bold" className="submenu-arrow" />}
                            </Link>
                            
                            {nestedItem.subItems && activeNestedSubmenu === nestedItem.label && (
                              <div className="nested-dropdown nested-dropdown-level-3">
                                {nestedItem.subItems.map((deepNestedItem) => (
                                  <Link key={deepNestedItem.label} href={deepNestedItem.href} className="dropdown-item">
                                    {deepNestedItem.icon}
                                    <span>{deepNestedItem.label}</span>
                                  </Link>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </li>
        ))}
        <li><Link href="#" className="nav-cta">Get Started →</Link></li>
      </ul>
    </nav>
  );
}
