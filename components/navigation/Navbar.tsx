'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import LocaleSwitcher from './LocaleSwitcher';
import CurrencySwitcher from './CurrencySwitcher';
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
  TrendDown,
  Presentation
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
  icon?: React.ReactNode;
  items?: SubMenuItem[];
};

export default function Navbar() {
  const t = useTranslations('nav');
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
      href: '#',
      label: t('equity'),
      // icon: <ChartLine size={18} weight="duotone" />,
      items: [
        { href: '/equity', label: t('equity_items.overview'), icon: <Presentation size={16} weight="duotone" /> },
        { href: '/equity/screener', label: t('equity_items.stockScreener'), icon: <Funnel size={16} weight="duotone" /> },
        { href: '/equity/comparison', label: t('equity_items.stockComparison'), icon: <Scales size={16} weight="duotone" /> },
        { href: '/equity/bourses', label: t('equity_items.africanExchanges'), icon: <Bank size={16} weight="duotone" /> },
        { href: '/equity/market-movers', label: t('equity_items.marketMovers'), icon: <Rocket size={16} weight="duotone" /> },
        { 
          href: '/equity/tools', 
          label: t('equity_items.equityTools'), 
          icon: <Wrench size={16} weight="duotone" />,
          subItems: [
            // { href: '/equity/technical-analysis', label: t('equity_items.technicalAnalysis'), icon: <ChartLineUp size={16} weight="duotone" /> },
            { href: '/equity/financial-analysis', label: t('equity_items.financialAnalysis'), icon: <ChartBar size={16} weight="duotone" /> },
          ]
        },
        { href: '/equity/sectors', label: t('equity_items.sectors'), icon: <Factory size={16} weight="duotone" /> },
        // { 
        //   href: '/equity/corporate-events', 
        //   label: t('equity_items.corporateEvents'), 
        //   icon: <CalendarDots size={16} weight="duotone" />,
        //   subItems: [
        //     { href: '/equity/corporate-events/ipo', label: t('equity_items.ipo'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/splits', label: t('equity_items.splits'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/reverse-split', label: t('equity_items.reverseSplit'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/merger', label: t('equity_items.merger'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/acquisitions', label: t('equity_items.acquisitions'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/delisting', label: t('equity_items.delisting'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/bankruptcy', label: t('equity_items.bankruptcy'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/spin-off', label: t('equity_items.spinOff'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/dividend', label: t('equity_items.dividend'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/rights-issue', label: t('equity_items.rightsIssue'), icon: <Target size={16} weight="duotone" /> },
        //     { href: '/equity/corporate-events/share-buyback', label: t('equity_items.shareBuyback'), icon: <Target size={16} weight="duotone" /> },
        //   ]
        // },
        // { href: '/equity/watchlist-portfolio', label: t('equity_items.watchlistPortfolio'), icon: <Star size={16} weight="duotone" /> },
      ]
    },
    {
      href: '#',
      label: t('fixedIncome'),
      // icon: <Vault size={18} weight="duotone" />,
      items: [
        { href: '/fixed-income', label: t('fixedIncome_items.overview'), icon: <Presentation size={16} weight="duotone" /> },
        { 
          href: '/fixed-income/screener/public-securities/primary', 
          label: t('fixedIncome_items.screener'), 
          icon: <Funnel size={16} weight="duotone" />,

          // subItems: [
          //   {
          //     href: '/fixed-income/screener/public-securities',
          //     label: t('fixedIncome_items.publicSecurities'),
          //     icon: <Bank size={16} weight="duotone" />,
          //     subItems: [
          //       { href: '/fixed-income/screener/public-securities/primary', label: t('fixedIncome_items.primaryScreener'), icon: <ChartLineUp size={16} weight="duotone" /> },
          //       { href: '/fixed-income/screener/public-securities/secondary', label: t('fixedIncome_items.secondaryScreener'), icon: <ChartBar size={16} weight="duotone" /> },
          //     ]
          //   },
          //   {
          //     href: '/fixed-income/screener/financial-market',
          //     label: t('fixedIncome_items.financialMarket'),
          //     icon: <TrendUp size={16} weight="duotone" />,
          //     subItems: [
          //       { href: '/fixed-income/screener/financial-market/primary', label: t('fixedIncome_items.primaryScreener'), icon: <ChartLineUp size={16} weight="duotone" /> },
          //       { href: '/fixed-income/screener/financial-market/secondary', label: t('fixedIncome_items.secondaryScreener'), icon: <ChartBar size={16} weight="duotone" /> },
          //     ]
          //   }
          // ]
        },
        // { href: '/fixed-income/amortization', label: t('fixedIncome_items.amortization'), icon: <ChartLine size={16} weight="duotone" /> },
        // { href: '/fixed-income/bond-swap', label: t('fixedIncome_items.bondSwap'), icon: <Scales size={16} weight="duotone" /> },
        { href: '/fixed-income/simulator', label: t('fixedIncome_items.simulator'), icon: <ChartLine size={16} weight="duotone" /> },
        // { 
        //   href: '/fixed-income/data', 
        //   label: t('fixedIncome_items.bondData'), 
        //   icon: <Funnel size={16} weight="duotone" />,
        //   subItems: [
        //     {
        //       href: '/fixed-income/data/',
        //       label: t('fixedIncome_items.investmentSummary'),
        //       icon: <Bank size={16} weight="duotone" />
        //     },
        //     {
        //       href: '/fixed-income/data',
        //       label: t('fixedIncome_items.debtSecurities'),
        //       icon: <TrendUp size={16} weight="duotone" />
        //     }
        //   ]
        // },
      ]
    },
    {
      href: '#',
      label: t('funds'),
      // icon: <ChartPieSlice size={18} weight="duotone" />,
      items: [
        { href: '/opcvm', label: t('funds_items.overview'), icon: <Presentation size={16} weight="duotone" /> },
        { href: '/opcvm/screener', label: t('funds_items.screener'), icon: <Funnel size={16} weight="duotone" /> },
        { href: '/opcvm/comparison', label: t('funds_items.comparison'), icon: <Scales size={16} weight="duotone" /> },
        { href: '/opcvm/titans', label: t('funds_items.titans'), icon: <Trophy size={16} weight="duotone" /> },
        { href: '/opcvm/topflop', label: t('funds_items.topflop'), icon: <Trophy size={16} weight="duotone" /> },
        { href: '/opcvm/simulator', label: t('funds_items.simulator'), icon: <ChartLine size={16} weight="duotone" /> },
        { href: '/opcvm/learn', label: t('funds_items.learn'), icon: <GraduationCap size={16} weight="duotone" /> },
      ]
    },
    {
      href: '#',
      label: t('macro'),
      // icon: <Globe size={18} weight="duotone" />,
      items: [
        { href: '/macro', label: t('macro_items.overview'), icon: <Presentation size={16} weight="duotone" /> },
        { href: '/macro/key-indicators', label: t('macro_items.keyIndicators'), icon: <ChartLineUp size={16} weight="duotone" /> },
        { href: '/macro/currencies-central-banks', label: t('macro_items.currencies'), icon: <CurrencyCircleDollar size={16} weight="duotone" /> },
        { href: '/macro/public-finances', label: t('macro_items.publicFinances'), icon: <Briefcase size={16} weight="duotone" /> },
        { href: '/macro/external-sector-fx', label: t('macro_items.externalSector'), icon: <TrendUp size={16} weight="duotone" /> },
        // { href: '/macro/economic-calendar', label: t('macro_items.economicCalendar'), icon: <CalendarDots size={16} weight="duotone" /> },
        // { href: '/macro/macro-analysis', label: t('macro_items.macroAnalysis'), icon: <ChartBar size={16} weight="duotone" /> },
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
          placeholder={t('search')}
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
        <li><CurrencySwitcher /></li>
        <li><LocaleSwitcher /></li>
        <li><Link href="#" className="nav-cta">{t('getStarted')}</Link></li>
      </ul>
    </nav>
  );
}
