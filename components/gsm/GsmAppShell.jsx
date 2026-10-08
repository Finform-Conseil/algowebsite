'use client';

import { Component, createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import {
  Home,
  Briefcase,
  ListOrdered,
  FileCheck2,
  TrendingUp,
  Star,
  SlidersHorizontal,
  Filter,
  AlertTriangle,
  Scale,
  FileBarChart2,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Landmark,
  Building2,
  Activity,
  Droplets,
  BookOpen,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeftRight,
  UserRound,
} from 'lucide-react';
import { convertCurrency, fmt, fmtCompactMontant, fmtPrice, FX, toRef } from './shared/lib/finance';
import { formatIsoLocalDate, parseIsoLocalDate } from './shared/lib/dateUtils';
import { C, FONTS, F_DISPLAY, F_BODY, F_MONO, PALETTE } from './shared/theme/theme';
import { Badge, Btn, Card, Eyebrow, Pct, Td, Th } from './shared/ui/UiAtoms';
import { Breadcrumb, NavigationContext } from './shared/ui/Navigation';
import { ThemeToggle } from './shared/ui/ThemeToggle';
import { Donut, Legende, MarketTicker } from './features/home/HomeWidgets';
import { Accueil as AccueilScreen } from './features/home/Accueil';
import { Portefeuilles as PortefeuillesScreen } from './features/portfolio/Portefeuilles';
import { PortfolioOpeningPerformanceCard } from './features/portfolio/PortfolioOpeningPerformanceCard';
import { PortfolioReportNoticeCard } from './features/portfolio/PortfolioReportNoticeCard';
import { PortfolioAllocationAnalysis } from './features/portfolio/PortfolioAllocationAnalysis';
import { PortfolioListedAssetsCard } from './features/portfolio/PortfolioListedAssetsCard';
import { PortfolioActivityCards } from './features/portfolio/PortfolioActivityCards';
import { PortfolioDetailHeader } from './features/portfolio/PortfolioDetailHeader';
import { MoneyManagement as MoneyManagementScreen } from './features/money-management/MoneyManagement';
import {
  CessionRetrait as CessionRetraitScreen,
  Cession as CessionInterneScreen,
  CESSION_RETRAIT_ETATS_DEMO,
  CESSION_RETRAIT_REFERENCE_DATE,
  CESSION_RETRAIT_STATUTS,
  cessionRetraitStatusTone,
  cessionAttachNonListedPositions,
} from './features/trading/CessionWorkflow';
import { CarnetOrdres as CarnetOrdresScreen } from './features/trading/CarnetOrdres';
import { AvisOperes as AvisOperesScreen } from './features/trading/AvisOperes';
import { MarchesObligataires as MarchesObligatairesScreen } from './features/markets/MarchesObligataires';
import { WatchlistScreen } from './features/watchlist/Watchlist';
import { RecommandationsActionsScreen } from './features/allocation/RecommandationsActions';
import { RecommandationAllocationScreen } from './features/allocation/RecommandationAllocation';
import { AllocationParCriteresScreen } from './features/allocation/AllocationParCriteres';
import { AlertesScreen } from './features/alerts/Alertes';
import { createReequilibrageScreen } from './features/allocation/Reequilibrage';
import { createAnalysePortefeuilleScreen } from './features/portfolio/AnalysePortefeuille';
import { createComiteWorkflow } from './features/committee/ComiteWorkflow';
import { DocumentationScreen } from './features/documentation/Documentation';
import { createWatchlistModel, parsePctNumber } from './features/watchlist/WatchlistModel';
import { calculerAvis } from './features/trading/AvisOperesModel';
import { createClientOverviewScreens } from './features/clients/ClientOverviewScreens';
import { createClientTradingScreens } from './features/clients/ClientTradingScreens';
import { createClientDecisionScreens } from './features/clients/ClientDecisionScreens';
import { createClientAnalysisScreen } from './features/clients/ClientAnalysis';
import { createClientCashflowsScreen } from './features/clients/ClientCashflows';
import {
  LIQUIDITY_HISTORY_MIN_DATE,
  liquidityHistoricalAmount,
  buildAnatomieExportPayload,
  exportAnatomieExcel,
  exportAnatomiePdf,
  buildMoneyManagementConsolidatedExportPayload,
  exportMoneyManagementExcel,
  exportMoneyManagementPdf,
} from './features/money-management/LiquidityInfrastructure';
import {
  VOLUME_JOUR,
  CLIENTS_ORIGINAUX,
  PROFILS_PORTEFEUILLES_MODELES,
  DEVISE_PAR_MARCHE,
  PORTEFEUILLES_GENERES_SPECS,
  construirePortefeuilleGenere,
  CLIENTS_GENERES,
  DEVISES_INVESTISSEMENT,
  construireExpositionsDevises,
  CLIENTS_BRUTS,
  CLIENTS,
  replaceClients,
  PROFILE_TYPE_LABEL,
  PAYS_MARCHE,
  TITRE_SECTEUR,
  aggregateEncoursBy,
  PROFILE_TYPE_MIX,
  RISK_PROFILE_MIX,
  aggregateCurrencyExposure,
  CURRENCY_MIX,
  CORR_SECTEURS_LABELS,
  CORR_SECTEURS_HIST,
  CORR_SECTEURS_CRISE,
  CORR_PAYS_LABELS,
  CORR_PAYS_HIST,
  CORR_PAYS_CRISE,
  STRESS_SCENARIOS,
  UPCOMING_CASHFLOWS,
  parseFR,
  AUJOURDHUI,
  joursDepuisAujourdhui,
} from './features/portfolio/PortfolioUniverse';
import {
  MARKETS_DATA,
  BOURSES_ACTIVE_CONFIG,
  marketActiveSeed,
  buildBourseActiveSnapshot,
  BOND_MARKET_META,
  resolveMarketInstrument,
  CLIENT_TRADABLE_MARKETS,
} from './features/markets/MarketDomainData';
import { VueBourses, AnalyseInstrument } from './features/markets/MarketAnalysisScreens';
import { PortefeuilleDetail, ProfondeurMarche } from './features/portfolio/PortfolioDetailWorkflow';
import {
  CLIENT_GESTION_LIBRE,
  CLIENT_CASHFLOWS,
  INITIAL_CLIENT_ORDERS,
  CLIENT_NAV,
  clientMarket,
  clientPortfolioValue,
  clientLineValue,
  clientLineCmp,
  clientLinePlusMoinsValue,
  clientPortfolioValueIn,
  clientCashIn,
  CLIENT_OPEN_ORDER_STATUSES,
  clientReservedCash,
  clientAvailableCash,
  clientAvailableCashIn,
  clientReservedCashIn,
  clientAssetClass,
  CLIENT_SECTEUR_INSTRUMENT,
  clientSector,
  CLIENT_HISTORY,
  orderBookDemo,
  executionsDemo,
} from './features/clients/ClientDomainData';
import {
  ASSET_KEYS,
  buildAssetMix,
  ASSET_MIX,
  MARKET_MIX,
  COUNTRY_MIX,
  SECTOR_MIX,
  SECTOR_CONTRIB,
  HISTORY_PERIODS,
  buildCurrencyAumHistory,
  HISTORICAL_EVENT_TYPES,
  historicalEventColor,
  historicalEventDate,
  historicalEventPeriodIndex,
  buildHistoricalPortfolioEvents,
  attachHistoricalEventsToSeries,
  renderHistoricalEventDot,
  HistoricalEventDot,
  HistoricalEventsTooltipBlock,
  HISTORY_GESTION_REFERENCE,
  HISTORY_BRVM_REFERENCE,
  HISTORY_NGX_REFERENCE,
  buildHistoryTwr,
  HISTORIQUE_TRIMESTRIEL_PORTEFEUILLES,
} from './features/portfolio/PortfolioAnalyticsData';
import {
  ORDERS,
  RECOS,
  DEFAULT_STATIC_WATCHLIST_TITLES,
  buildWatchlistJournaliere,
  buildStaticWatchlistRow,
  INSTRUMENTS,
  EXPOSURE,
  exposureOf,
  ACTIONS_LIST,
  OBLIGATIONS_LIST,
  gsmPositionCmp,
  gsmListedAssetMetrics,
  expositionClient,
  ENCAISSEMENTS,
  versementsDemo,
  rentabiliteComment,
  compareOp,
  SEUIL_REEQUILIBRAGE,
  besoinsReequilibrageClient,
  propositionReequilibrage,
  ALERTES,
  IMPACT_COMITE,
  NAV,
} from './features/trading/TradingDomainData';
class ScreenErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[GSM screen boundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Card className="gsm-native-gsmappshell-6c2a90e6d">
        <Eyebrow>Écran indisponible</Eyebrow>
        <div className="gsm-native-gsmappshell-3b6f032c2" style={{ color: C.sub }}>
          Cet écran a rencontré une erreur de rendu. Le shell de navigation reste actif.
        </div>
        <button
          type="button"
          className="gsm-native-gsmappshell-239451cb6"
          style={{ background: C.surfaceElevated, color: C.textPrimary }}
          onClick={() => this.props.onReset?.()}
        >
          Retour à l’accueil
        </button>
      </Card>
    );
  }
}

/* ---------------------------------- DATA ---------------------------------- */





const { ClientCashflows } = createClientCashflowsScreen({
  CLIENT_CASHFLOWS,
  CLIENT_GESTION_LIBRE,
  CLIENT_OPEN_ORDER_STATUSES,
  LIQUIDITY_HISTORY_MIN_DATE,
  buildAnatomieExportPayload,
  clientAssetClass,
  clientAvailableCash,
  clientLineValue,
  clientMarket,
  clientPortfolioValue,
  clientReservedCash,
  exportAnatomieExcel,
  exportAnatomiePdf,
  liquidityHistoricalAmount,
  parseFR,
});

const { ClientAnalysis } = createClientAnalysisScreen({
  CLIENT_GESTION_LIBRE,
  CLIENT_HISTORY,
  clientCashIn,
  clientLineValue,
  clientPortfolioValueIn,
  clientSector,
});

const { ClientWatchlist, ClientAvis, ClientOrders } = createClientDecisionScreens({
  CLIENT_GESTION_LIBRE,
  buildStaticWatchlistRow,
  buildWatchlistJournaliere,
  clientMarket,
  parseFR,
});

const { ClientOrderTicket, ClientMarkets } = createClientTradingScreens({
  BOND_MARKET_META,
  CLIENT_GESTION_LIBRE,
  CLIENT_TRADABLE_MARKETS,
  MARKETS_DATA,
  clientAvailableCash,
  clientMarket,
  clientReservedCash,
});

const { ClientDashboard, ClientPortfolios } = createClientOverviewScreens({
  CLIENT_CASHFLOWS,
  CLIENT_GESTION_LIBRE,
  CLIENT_OPEN_ORDER_STATUSES,
  MARKETS_DATA,
  clientAssetClass,
  clientAvailableCash,
  clientAvailableCashIn,
  clientCashIn,
  clientLineCmp,
  clientLinePlusMoinsValue,
  clientLineValue,
  clientMarket,
  clientPortfolioValue,
  clientPortfolioValueIn,
  clientReservedCash,
  clientReservedCashIn,
});

const { ReequilibrageScreen } = createReequilibrageScreen({
  CLIENTS,
  MARKETS_DATA,
  PROFILE_TYPE_LABEL,
  RECOS,
  SEUIL_REEQUILIBRAGE,
  besoinsReequilibrageClient,
  propositionReequilibrage,
  exposureOf,
});

/* ------------------------- CESSION / RETRAIT GSM ------------------------- */
/*
 * Moteur de simulation de cession destiné aux demandes de retrait des clients
 * en gestion sous mandat.
 *
 * Objectifs de la maquette :
 * - sélectionner plusieurs clients et associer un montant/date de retrait ;
 * - conserver, après retrait, la poche de liquidité cible du profil ;
 * - céder prioritairement les classes d'actifs surpondérées ;
 * - contrôler la liquidité de marché via le volume quotidien simulé ;
 * - produire un plan d'ordres transférable au Carnet d'ordres.
 *
 * En production, les positions et quantités devront provenir des positions ORM
 * réelles. Ici, elles sont reconstruites depuis les allocations/expositions de
 * démonstration déjà présentes dans la maquette.
 */


const { AnalysePortefeuilleScreen } = createAnalysePortefeuilleScreen({
  CLIENTS,
  PROFILE_TYPE_LABEL,
  CORR_PAYS_CRISE,
  CORR_PAYS_HIST,
  CORR_PAYS_LABELS,
  CORR_SECTEURS_CRISE,
  CORR_SECTEURS_HIST,
  CORR_SECTEURS_LABELS,
  STRESS_SCENARIOS,
  VOLUME_JOUR,
  aggregateEncoursBy,
  buildAssetMix,
});
const {
  Comite: ComiteScreen,
  PriseDecisions: PriseDecisionsScreen,
} = createComiteWorkflow({
  ACTIONS_LIST,
  ASSET_MIX,
  COUNTRY_MIX,
  IMPACT_COMITE,
  MARKET_MIX,
  CLIENTS,
  MARKETS_DATA,
  PROFILE_TYPE_LABEL,
  RECOS,
  SECTOR_CONTRIB,
  SECTOR_MIX,
  UPCOMING_CASHFLOWS,
  compareOp,
  exposureOf,
  joursDepuisAujourdhui,
});


export function GsmAppShell({ documentation, onOpenDocumentation, onDownloadDocumentation }) {
  const [workspace, setWorkspace] = useState('gestionnaire');
  const [screen, setScreen] = useState('accueil');
  const [clientScreen, setClientScreen] = useState('client-dashboard');
  const [clientCtx, setClientCtx] = useState({});
  const [ctx, setCtx] = useState({});
  const [reportOpen, setReportOpen] = useState({});
  const [siteDevise, setSiteDevise] = useState('XOF');
  const [dark, setDark] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [compactSidebarViewport, setCompactSidebarViewport] = useState(false);
  const sidebarIsCollapsed = sidebarCollapsed || compactSidebarViewport;
  const [sidebarReady, setSidebarReady] = useState(false);
  const [sidebarPeek, setSidebarPeek] = useState(false);
  const sidebarPeekTimerRef = useRef(null);
  const sidebarAutoCloseTimerRef = useRef(null);
  const sidebarHoveredRef = useRef(false);
  const sidebarNavRef = useRef(null);
  const sidebarScrollTopRef = useRef(0);
  const sidebarActiveRouteRef = useRef(null);
  const [sidebarScrollIndicator, setSidebarScrollIndicator] = useState({
    top: 0,
    height: 0,
  });
  const [sidebarScrollActive, setSidebarScrollActive] = useState(false);
  const sidebarScrollHideTimerRef = useRef(null);
  const [clientOrders, setClientOrders] = useState(INITIAL_CLIENT_ORDERS);
  const [cessionRetraitEtats, setCessionRetraitEtats] = useState(
    CESSION_RETRAIT_ETATS_DEMO
  );
  const [clientWatchlistTitles, setClientWatchlistTitles] = useState(() => {
    const fallback = ['SONATEL', 'MTN NIGERIA', 'GCB BANK'];
    if (typeof window === 'undefined') return fallback;
    try {
      const saved = window.localStorage.getItem(
        'afrimarket-client-watchlist-v1'
      );
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  });
  const [watchlistTitles, setWatchlistTitles] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_STATIC_WATCHLIST_TITLES;
    try {
      const saved = window.localStorage.getItem(
        'afrimarket-static-watchlist-v1'
      );
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : DEFAULT_STATIC_WATCHLIST_TITLES;
    } catch {
      return DEFAULT_STATIC_WATCHLIST_TITLES;
    }
  });

  useEffect(() => {
    const resolveParentTheme = () => {
      const domTheme = document.documentElement.getAttribute('data-theme');
      const storedTheme = window.localStorage.getItem('theme');
      window.localStorage.removeItem('gsm-theme');
      const theme =
        storedTheme === 'light' || storedTheme === 'dark'
          ? storedTheme
          : domTheme === 'light' || domTheme === 'dark'
            ? domTheme
            : 'dark';

      if (document.documentElement.getAttribute('data-theme') !== theme) {
        document.documentElement.setAttribute('data-theme', theme);
      }

      setDark(theme === 'dark');
    };

    resolveParentTheme();

    const observer = new MutationObserver((mutations) => {
      if (
        mutations.some(
          (mutation) =>
            mutation.type === 'attributes' &&
            mutation.attributeName === 'data-theme'
        )
      ) {
        resolveParentTheme();
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const handleStorage = (event) => {
      if (event.key === 'theme') resolveParentTheme();
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const toggleParentTheme = () => {
    const nextTheme = dark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    window.localStorage.setItem('theme', nextTheme);
    setDark(nextTheme === 'dark');
  };

  useEffect(() => {
    const storedSidebarState = window.localStorage.getItem(
      'gsm-sidebar-collapsed'
    );
    setSidebarCollapsed(storedSidebarState === 'true');
    setSidebarReady(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1024px)');
    const syncCompactViewport = () => setCompactSidebarViewport(media.matches);

    syncCompactViewport();
    media.addEventListener('change', syncCompactViewport);

    return () => media.removeEventListener('change', syncCompactViewport);
  }, []);

  useEffect(() => {
    if (!sidebarReady) return;
    window.localStorage.setItem(
      'gsm-sidebar-collapsed',
      String(sidebarCollapsed)
    );
  }, [sidebarCollapsed, sidebarReady]);

  const clearSidebarPeekTimer = () => {
    if (sidebarPeekTimerRef.current) {
      window.clearTimeout(sidebarPeekTimerRef.current);
      sidebarPeekTimerRef.current = null;
    }
  };

  const clearSidebarAutoCloseTimer = () => {
    if (sidebarAutoCloseTimerRef.current) {
      window.clearTimeout(sidebarAutoCloseTimerRef.current);
      sidebarAutoCloseTimerRef.current = null;
    }
  };

  const scheduleSidebarAutoClose = () => {
    clearSidebarAutoCloseTimer();
    if (!sidebarReady || sidebarIsCollapsed) return;
    sidebarAutoCloseTimerRef.current = window.setTimeout(() => {
      setSidebarCollapsed(true);
      sidebarAutoCloseTimerRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    if (sidebarReady && !sidebarIsCollapsed && !sidebarHoveredRef.current) {
      scheduleSidebarAutoClose();
    } else {
      clearSidebarAutoCloseTimer();
    }
    return clearSidebarAutoCloseTimer;
  }, [sidebarReady, sidebarIsCollapsed]);

  const closeSidebarPeek = () => {
    clearSidebarPeekTimer();
    setSidebarPeek(false);
  };

  const scheduleSidebarPeekClose = () => {
    if (!sidebarIsCollapsed) return;
    clearSidebarPeekTimer();
    sidebarPeekTimerRef.current = window.setTimeout(() => {
      setSidebarPeek(false);
      sidebarPeekTimerRef.current = null;
    }, 5000);
  };

  const openSidebarPeek = () => {
    if (!sidebarIsCollapsed) return;
    setSidebarPeek(true);

    if (sidebarHoveredRef.current) {
      clearSidebarPeekTimer();
      return;
    }

    scheduleSidebarPeekClose();
  };

  useEffect(() => {
    if (!sidebarIsCollapsed) {
      closeSidebarPeek();
    }
  }, [sidebarIsCollapsed]);

  useEffect(() => {
    const activeRouteKey = `${workspace}:${screen}:${clientScreen}`;
    const routeChanged = sidebarActiveRouteRef.current !== activeRouteKey;
    sidebarActiveRouteRef.current = activeRouteKey;

    if (
      !sidebarIsCollapsed ||
      !routeChanged ||
      !sidebarNavRef.current
    ) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      const activeItem = sidebarNavRef.current?.querySelector(
        '.gsm-sidebar__item[data-active="true"]'
      );

      activeItem?.scrollIntoView({
        block: 'center',
        inline: 'nearest',
        behavior: 'auto',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [sidebarIsCollapsed, workspace, screen, clientScreen]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const nav = sidebarNavRef.current;
      if (!nav) return;

      const maxScrollTop = Math.max(0, nav.scrollHeight - nav.clientHeight);
      nav.scrollTop = Math.min(sidebarScrollTopRef.current, maxScrollTop);
      syncSidebarScrollIndicator(nav);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [sidebarIsCollapsed]);

  const syncSidebarScrollIndicator = (nav) => {
    const aside = nav?.closest('.gsm-sidebar');
    if (!nav || !aside) return false;

    const navRect = nav.getBoundingClientRect();
    const asideRect = aside.getBoundingClientRect();
    const scrollRange = nav.scrollHeight - nav.clientHeight;
    const trackInset = sidebarIsCollapsed && !sidebarPeek ? 20 : 12;
    const trackHeight = Math.max(0, nav.clientHeight - trackInset * 2);
    const available = scrollRange > 1;

    if (!available || trackHeight <= 0) {
      setSidebarScrollActive(false);
      setSidebarScrollIndicator((current) =>
        current.height ? { top: 0, height: 0 } : current
      );
      return false;
    }

    const proportionalHeight =
      (nav.clientHeight / nav.scrollHeight) * trackHeight;
    const minIndicatorHeight =
      sidebarIsCollapsed && !sidebarPeek ? 26 : 44;
    const maxIndicatorHeight =
      sidebarIsCollapsed && !sidebarPeek ? 32 : 72;
    const height = Math.min(
      maxIndicatorHeight,
      Math.max(minIndicatorHeight, proportionalHeight)
    );
    const travel = Math.max(0, trackHeight - height);
    const progress = scrollRange > 0 ? nav.scrollTop / scrollRange : 0;
    const top =
      navRect.top -
      asideRect.top +
      trackInset +
      Math.max(0, Math.min(1, progress)) * travel;

    setSidebarScrollIndicator({ top, height });
    return true;
  };

  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav) return undefined;

    const getCurrentNav = () => sidebarNavRef.current;

    const getIndicator = () => {
      const currentNav = getCurrentNav();
      if (!currentNav) return null;

      const sibling = currentNav.nextElementSibling;
      return sibling?.classList?.contains('gsm-sidebar__scroll-indicator')
        ? sibling
        : currentNav.parentElement?.querySelector(
            '.gsm-sidebar__scroll-indicator'
          );
    };

    const handleScroll = (event) => {
      const currentNav = getCurrentNav();
      if (!currentNav || event.target !== currentNav) return;
      sidebarScrollTopRef.current = currentNav.scrollTop;
      if (!syncSidebarScrollIndicator(currentNav)) return;

      getIndicator()?.setAttribute('data-scrolling', 'true');
      setSidebarScrollActive(true);

      if (sidebarScrollHideTimerRef.current) {
        window.clearTimeout(sidebarScrollHideTimerRef.current);
      }

      sidebarScrollHideTimerRef.current = window.setTimeout(() => {
        getIndicator()?.removeAttribute('data-scrolling');
        setSidebarScrollActive(false);
        sidebarScrollHideTimerRef.current = null;
      }, 900);
    };

    getIndicator()?.removeAttribute('data-scrolling');
    setSidebarScrollActive(false);
    syncSidebarScrollIndicator(nav);
    document.addEventListener('scroll', handleScroll, true);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => syncSidebarScrollIndicator(nav))
        : null;
    resizeObserver?.observe(nav);

    const frame = window.requestAnimationFrame(() =>
      syncSidebarScrollIndicator(nav)
    );

    return () => {
      window.cancelAnimationFrame(frame);
      if (sidebarScrollHideTimerRef.current) {
        window.clearTimeout(sidebarScrollHideTimerRef.current);
        sidebarScrollHideTimerRef.current = null;
      }
      getIndicator()?.removeAttribute('data-scrolling');
      document.removeEventListener('scroll', handleScroll, true);
      resizeObserver?.disconnect();
    };
  }, [sidebarIsCollapsed, sidebarPeek, workspace, screen, clientScreen]);

  useEffect(() => {
    return () => clearSidebarPeekTimer();
  }, []);

  const persistWatchlist = (next) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'afrimarket-static-watchlist-v1',
          JSON.stringify(next)
        );
      } catch {
        // La watchlist reste utilisable pendant la session si le stockage est bloqué.
      }
    }
    return next;
  };
  const addToWatchlist = (titre) =>
    setWatchlistTitles((current) =>
      persistWatchlist(current.includes(titre) ? current : [...current, titre])
    );
  const removeFromWatchlist = (titre) =>
    setWatchlistTitles((current) =>
      persistWatchlist(current.filter((item) => item !== titre))
    );

  const persistClientWatchlist = (next) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          'afrimarket-client-watchlist-v1',
          JSON.stringify(next)
        );
      } catch {
        // La watchlist Client reste disponible pendant la session.
      }
    }
    return next;
  };
  const addToClientWatchlist = (titre) =>
    setClientWatchlistTitles((current) =>
      persistClientWatchlist(
        current.includes(titre) ? current : [...current, titre]
      )
    );
  const removeFromClientWatchlist = (titre) =>
    setClientWatchlistTitles((current) =>
      persistClientWatchlist(current.filter((item) => item !== titre))
    );

  const remonterEnHaut = () => {
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      });
    }
  };

  const go = (id, params = {}) => {
    const currentCtx = ctx ?? {};
    const nextCtx = params ?? {};
    const sameContext =
      Object.keys(currentCtx).length === Object.keys(nextCtx).length &&
      Object.entries(nextCtx).every(([key, value]) =>
        Object.is(currentCtx[key], value)
      );

    if (id === screen && sameContext) return;

    setScreen(id);
    setCtx(nextCtx);
    remonterEnHaut();
  };

  const updateCessionRetraitStatus = async (clientId, patch = {}) => {
    const client = CLIENTS.find((item) => item.id === clientId);
    const existing = cessionRetraitEtats.find(
      (item) => item.clientId === clientId
    );

    const nextItem = {
      id: patch.id || existing?.id || null,
      clientId,
      client: patch.client || existing?.client || client?.nom || 'Client',
      montant: Number(patch.montant ?? existing?.montant ?? 0),
      devise: patch.devise || existing?.devise || client?.devise || 'XOF',
      statut: patch.statut || existing?.statut || 'Demande reçue',
      dateDemande:
        patch.dateDemande ||
        existing?.dateDemande ||
        CESSION_RETRAIT_REFERENCE_DATE,
      dateSouhaitee:
        patch.dateSouhaitee ||
        existing?.dateSouhaitee ||
        CESSION_RETRAIT_REFERENCE_DATE,
      chargeeClientele:
        patch.chargeeClientele ||
        existing?.chargeeClientele ||
        'Non renseignée',
      observationChargeeClientele:
        patch.observationChargeeClientele ||
        existing?.observationChargeeClientele ||
        'Aucune observation renseignée.',
      modePaiement: patch.modePaiement || existing?.modePaiement || 'Chèque',
    };

    // Mise à jour optimiste de l'interface.
    setCessionRetraitEtats((current) => {
      const exists = current.some((item) => item.clientId === clientId);
      return exists
        ? current.map((item) =>
            item.clientId === clientId ? nextItem : item
          )
        : [nextItem, ...current];
    });

    return nextItem;
  };
  const openClient = (
    id,
    showReport = false,
    period = 'Trimestre en cours'
  ) => {
    setScreen('client');
    setCtx({ clientId: id });
    setReportOpen({ notice: showReport, period });
    remonterEnHaut();
  };
  const report = (_clientId, period = 'Trimestre en cours') =>
    setReportOpen({
      notice: true,
      period,
    });

  const goClient = (id, params = {}) => {
    setClientScreen(id);
    setClientCtx(params);
    remonterEnHaut();
  };

  const createClientOrder = (ordre) => {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR');
    setClientOrders((current) => [
      {
        ...ordre,
        id: `CL-ORD-${String(current.length + 1).padStart(3, '0')}`,
        date,
      },
      ...current,
    ]);
  };

  const switchWorkspace = () => {
    setWorkspace((current) =>
      current === 'gestionnaire' ? 'client' : 'gestionnaire'
    );
    remonterEnHaut();
  };

  const activeClient = ctx.clientId
    ? CLIENTS.find((c) => c.id === ctx.clientId)
    : null;

  const sidebarGroups =
    workspace === 'gestionnaire'
      ? [
          {
            label: 'Pilotage',
            ids: ['accueil', 'portefeuilles', 'money-management', 'cession-retrait'],
          },
          {
            label: 'Opérations',
            ids: ['carnet', 'avis'],
          },
          {
            label: 'Marchés',
            ids: ['vue-boursiere', 'marches', 'watchlist'],
          },
          {
            label: 'Conseil & allocation',
            ids: ['recos-actions', 'reco-alloc', 'alloc-criteres', 'alertes', 'reequilibrage'],
          },
          {
            label: 'Analyse & gouvernance',
            ids: ['analyse', 'comite', 'documentation'],
          },
        ]
      : [
          {
            label: 'Patrimoine',
            ids: ['client-dashboard', 'client-portfolios'],
          },
          {
            label: 'Marchés',
            ids: ['client-exchanges', 'client-markets', 'client-watchlist'],
          },
          {
            label: 'Opérations',
            ids: ['client-orders', 'client-avis', 'client-cashflows'],
          },
          {
            label: 'Analyse',
            ids: ['client-analysis', 'client-documentation'],
          },
        ];

  const sidebarNavigation = workspace === 'gestionnaire' ? NAV : CLIENT_NAV;

  return (
    <NavigationContext.Provider value={{ go }}>
      <div
        className="gsm-app-root"
        data-theme={dark ? 'dark' : 'light'}
        style={{
          background: C.bg,
          minHeight: '100vh',
          overflowX: 'clip',
          ...F_BODY,
        }}
      >
        <style>{FONTS}</style>
        <div className="gsm-layout gsm-native-gsmappshell-7d24db31d">
          <aside
            className="gsm-sidebar gsm-native-gsmappshell-17e3fe0c4"
            data-collapsed={sidebarIsCollapsed || undefined}
            data-peek={sidebarPeek || undefined}
            onMouseEnter={() => {
              sidebarHoveredRef.current = true;
              clearSidebarPeekTimer();
              clearSidebarAutoCloseTimer();
            }}
            onMouseLeave={() => {
              sidebarHoveredRef.current = false;
              if (sidebarPeek) scheduleSidebarPeekClose();
              else scheduleSidebarAutoClose();
            }}
            onFocusCapture={() => {
              clearSidebarPeekTimer();
              clearSidebarAutoCloseTimer();
            }}
            onBlurCapture={(event) => {
              if (
                sidebarPeek &&
                !event.currentTarget.contains(event.relatedTarget) &&
                !sidebarHoveredRef.current
              ) {
                scheduleSidebarPeekClose();
              } else if (!event.currentTarget.contains(event.relatedTarget) && !sidebarHoveredRef.current) {
                scheduleSidebarAutoClose();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && sidebarPeek) {
                event.stopPropagation();
                closeSidebarPeek();
              }
            }}
            style={{
              background: C.sidebarBackground,
              alignSelf: 'flex-start',
            }}
          >
            <div className="gsm-sidebar__top">
              <div className="gsm-sidebar__brand gsm-native-gsmappshell-125d819ae">
                <div
                  className="gsm-sidebar__brand-main"
                  role={sidebarIsCollapsed ? 'button' : undefined}
                  tabIndex={sidebarIsCollapsed ? 0 : -1}
                  aria-label={
                    sidebarIsCollapsed ? 'Ouvrir la barre latérale' : undefined
                  }
                  title={
                    sidebarIsCollapsed ? 'Ouvrir la barre latérale' : undefined
                  }
                  onClick={() => {
                    if (compactSidebarViewport) {
                      openSidebarPeek();
                      return;
                    }
                    if (sidebarCollapsed) {
                      sidebarScrollTopRef.current =
                        sidebarNavRef.current?.scrollTop ?? sidebarScrollTopRef.current;
                      closeSidebarPeek();
                      setSidebarCollapsed(false);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (
                      sidebarIsCollapsed &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      if (compactSidebarViewport) {
                        openSidebarPeek();
                        return;
                      }
                      sidebarScrollTopRef.current =
                        sidebarNavRef.current?.scrollTop ?? sidebarScrollTopRef.current;
                      setSidebarCollapsed(false);
                    }
                  }}
                >
                  <div
                    className="gsm-native-gsmappshell-330647c33"
                    style={{ background: C.gold }}
                  >
                    <Landmark size={18} color={C.sidebarBackground} />
                  </div>
                  <div className="gsm-sidebar__brand-copy">
                    <div
                      className="gsm-native-gsmappshell-afe48f676"
                      style={F_DISPLAY}
                    >
                      AfriMarket
                    </div>
                    <div
                      className="gsm-native-gsmappshell-a0f2f6aec"
                      style={{ color: C.sidebarMuted }}
                    >
                      {workspace === 'gestionnaire'
                        ? 'Management'
                        : 'Gestion libre'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="gsm-sidebar__collapse"
                  onClick={() => {
                    if (sidebarIsCollapsed && sidebarPeek) {
                      closeSidebarPeek();
                      return;
                    }

                    sidebarScrollTopRef.current =
                      sidebarNavRef.current?.scrollTop ?? sidebarScrollTopRef.current;
                    closeSidebarPeek();
                    setSidebarCollapsed((value) => !value);
                  }}
                  aria-label={
                    !sidebarIsCollapsed || sidebarPeek
                      ? 'Réduire la barre latérale'
                      : 'Ouvrir la barre latérale'
                  }
                  aria-expanded={!sidebarIsCollapsed || sidebarPeek}
                  title={
                    !sidebarIsCollapsed || sidebarPeek
                      ? 'Réduire la barre latérale'
                      : 'Ouvrir la barre latérale'
                  }
                >
                  {!sidebarIsCollapsed || sidebarPeek ? (
                    <PanelLeftClose size={16} strokeWidth={1.8} />
                  ) : (
                    <PanelLeftOpen size={16} strokeWidth={1.8} />
                  )}
                </button>
              </div>

            <button
              type="button"
              onClick={(event) => {
                switchWorkspace();
                if (sidebarIsCollapsed) openSidebarPeek();
                if (event.detail > 0) event.currentTarget.blur();
              }}
              className="gsm-sidebar__workspace"
              aria-label={
                workspace === 'gestionnaire'
                  ? "Passer à l'espace Client"
                  : "Revenir à l'espace Gestionnaire"
              }
              title={
                workspace === 'gestionnaire'
                  ? "Passer à l'espace Client"
                  : "Revenir à l'espace Gestionnaire"
              }
              style={{
                background:
                  workspace === 'gestionnaire'
                    ? C.sidebarManagerBackground
                    : C.sidebarClientBackground,
                border: `1px solid ${
                  workspace === 'gestionnaire'
                    ? C.sidebarManagerBorder
                    : C.sidebarClientBorder
                }`,
              }}
            >
              <span className="gsm-sidebar__workspace-icon" aria-hidden="true">
                <ArrowLeftRight size={17} strokeWidth={1.8} />
              </span>
              <div className="gsm-sidebar__workspace-content">
                <div
                  className="gsm-native-gsmappshell-f6aa538ee"
                  style={{ color: C.sidebarMuted }}
                >
                  Espace actuel
                </div>

                <div className="gsm-sidebar__workspace-row">
                  <span
                    className="gsm-sidebar__workspace-name gsm-native-gsmappshell-5fda74660"
                    style={{
                      color:
                        workspace === 'gestionnaire' ? C.gold : C.sidebarPositive,
                      ...F_DISPLAY,
                    }}
                  >
                    {workspace === 'gestionnaire'
                      ? 'Gestionnaire'
                      : 'Client · Gestion libre'}
                  </span>

                  <span
                    className="gsm-sidebar__workspace-action gsm-native-gsmappshell-c6a3f1a0c"
                    style={{ color: C.sidebarTextSoft }}
                  >
                    Basculer ↔
                  </span>
                </div>

                <div
                  className="gsm-sidebar__workspace-hint gsm-native-gsmappshell-ab85ab87c"
                  style={{ color: C.sidebarMuted }}
                >
                  {workspace === 'gestionnaire'
                    ? "Passer à l'espace Client"
                    : "Revenir à l'espace Gestionnaire"}
                </div>
              </div>
            </button>
            </div>

            <nav
              ref={sidebarNavRef}
              className="gsm-sidebar__nav"
              aria-label={
                workspace === 'gestionnaire'
                  ? 'Navigation Gestionnaire'
                  : 'Navigation Client'
              }
            >
              {sidebarGroups.map((group) => (
                <div className="gsm-sidebar__group" key={group.label}>
                  <div className="gsm-sidebar__group-label">{group.label}</div>
                  <div className="gsm-sidebar__group-items">
                    {group.ids
                      .map((id) => sidebarNavigation.find((item) => item.id === id))
                      .filter(Boolean)
                      .map((n) => {
                        const active =
                          workspace === 'gestionnaire'
                            ? screen === n.id ||
                              (n.id === 'cession-retrait' &&
                                screen === 'cession-interne') ||
                              (n.id === 'portefeuilles' && screen === 'client') ||
                              (n.id === 'vue-boursiere' &&
                                ['profondeur', 'instrument-analysis'].includes(
                                  screen
                                ) &&
                                ctx.source === 'vue-boursiere') ||
                              (n.id === 'marches' &&
                                screen === 'profondeur' &&
                                ctx.source !== 'vue-boursiere') ||
                              (n.id === 'comite' &&
                                screen === 'decisions-comite')
                            : clientScreen === n.id ||
                              (n.id === 'client-exchanges' &&
                                [
                                  'client-market-depth',
                                  'client-ticket',
                                  'client-instrument-analysis',
                                ].includes(clientScreen) &&
                                clientCtx.source === 'vue-boursiere') ||
                              (n.id === 'client-markets' &&
                                ['client-market-depth', 'client-ticket'].includes(
                                  clientScreen
                                ) &&
                                clientCtx.source !== 'vue-boursiere');

                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={(event) => {
                              if (workspace === 'gestionnaire') {
                                go(n.id);
                              } else {
                                goClient(n.id);
                              }

                              if (sidebarIsCollapsed) openSidebarPeek();
                              if (event.detail > 0) event.currentTarget.blur();
                            }}
                            className="gsm-sidebar__item"
                            data-active={active || undefined}
                            aria-current={active ? 'page' : undefined}
                            title={n.label}
                          >
                            <span className="gsm-sidebar__item-icon">
                              <n.icon size={17} strokeWidth={1.8} />
                            </span>
                            <span className="gsm-sidebar__item-label">
                              {n.label}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </nav>

            <span
              className="gsm-sidebar__scroll-indicator"
              data-visible={sidebarScrollActive || undefined}
              data-scrollable={sidebarScrollIndicator.height > 0 || undefined}
              aria-hidden="true"
              style={{
                height: `${sidebarScrollIndicator.height}px`,
                transform: `translateY(${sidebarScrollIndicator.top}px)`,
              }}
            />

            <span
              className="gsm-sidebar__profile-separator"
              aria-hidden="true"
            />

            <div className="gsm-sidebar__profile">
              <button
                type="button"
                className="gsm-sidebar__profile-button"
                aria-label="Profil utilisateur"
                title="Profil utilisateur"
              >
                <span className="gsm-sidebar__profile-avatar" aria-hidden="true">
                  <UserRound size={17} strokeWidth={1.8} />
                </span>
                <span className="gsm-sidebar__profile-copy">
                  <strong>Profil</strong>
                  <small>
                    {workspace === 'gestionnaire' ? 'Gestionnaire' : 'Client'}
                  </small>
                </span>
              </button>
            </div>

            <div
              className="gsm-sidebar__meta"
              style={{
                borderTop: `1px solid ${C.sidebarCardBorder}`,
                color: C.sidebarMeta,
              }}
            >
              {workspace === 'gestionnaire' ? (
                <>
                  Marchés couverts : BRVM · NGX · GSE
                  <br />
                  Devise de référence : {siteDevise}
                </>
              ) : (
                <>
                  {
                    new Set(
                      CLIENT_GESTION_LIBRE.portefeuilles.map((pf) => pf.sgi)
                    ).size
                  }{' '}
                  SGI connectées ·{' '}
                  {
                    new Set(
                      CLIENT_GESTION_LIBRE.portefeuilles.map((pf) => pf.pays)
                    ).size
                  }{' '}
                  pays
                  <br />
                  Patrimoine consolidé en {siteDevise}
                </>
              )}
            </div>
          </aside>

          <main
            className="gsm-main gsm-native-gsmappshell-2216d19f3"
            onPointerDown={() => {
              if (sidebarIsCollapsed && sidebarPeek) {
                closeSidebarPeek();
              } else if (!sidebarIsCollapsed) {
                clearSidebarAutoCloseTimer();
                setSidebarCollapsed(true);
              }
            }}
          >
            <div
              className="gsm-theme-toggle-anchor gsm-native-gsmappshell-8de2d423e"
              style={{ top: workspace === 'client' ? '23.7px' : '32px' }}
            >
              <ThemeToggle dark={dark} onToggle={toggleParentTheme} />
            </div>

            <ScreenErrorBoundary
              key={`${workspace}:${workspace === 'gestionnaire' ? screen : clientScreen}`}
              onReset={() =>
                workspace === 'gestionnaire'
                  ? go('accueil')
                  : goClient('client-dashboard')
              }
            >
            {workspace === 'gestionnaire' && (
              <>
                {screen === 'accueil' && (
                  <AccueilScreen
                    go={go}
                    openClient={openClient}
                    devise={siteDevise}
                    onDeviseChange={setSiteDevise}
                    cessionRetraitEtats={cessionRetraitEtats}
                    dependencies={{
                      clients: CLIENTS,
                      profileTypeLabel: PROFILE_TYPE_LABEL,
                      sectorMix: SECTOR_MIX,
                      quarterlyPortfolioHistory:
                        HISTORIQUE_TRIMESTRIEL_PORTEFEUILLES,
                      aggregateEncoursBy,
                      buildAssetMix,
                      buildHistoryTwr,
                      historyPeriods: HISTORY_PERIODS,
                      buildCurrencyAumHistory,
                      attachHistoricalEventsToSeries,
                      alerts: ALERTES,
                      withdrawalStatuses: CESSION_RETRAIT_STATUTS,
                      withdrawalStatusTone: cessionRetraitStatusTone,
                      markets: MARKETS_DATA,
                      historicalEventTypes: HISTORICAL_EVENT_TYPES,
                      historicalEventColor,
                      historicalEventDot: renderHistoricalEventDot,
                      formatCompact: fmtCompactMontant,
                      renderHistoricalEvents: (events, currency) => (
                        <HistoricalEventsTooltipBlock
                          evenements={events}
                          devise={currency}
                        />
                      ),
                      resolveExposure: expositionClient,
                      volumeData: VOLUME_JOUR,
                    }}
                  />
                )}
                {screen === 'portefeuilles' && (
                  <PortefeuillesScreen
                    clients={CLIENTS}
                    openClient={openClient}
                    initialFilter={ctx.filtre}
                    go={go}
                  />
                )}
                {screen === 'client' && activeClient && (
                  <PortefeuilleDetail
                    client={activeClient}
                    go={go}
                    reportOpen={reportOpen}
                    onGenerateReport={report}
                  />
                )}
                {screen === 'carnet' && (
                  <CarnetOrdresScreen orders={ORDERS} initial={ctx} />
                )}
                {screen === 'profondeur' && (
                  <ProfondeurMarche ctx={ctx} go={go} />
                )}
                {screen === 'avis' && <AvisOperesScreen />}
                {screen === 'vue-boursiere' && (
                  <VueBourses
                    mode="gestionnaire"
                    go={go}
                    watchlistTitles={watchlistTitles}
                    onAddWatch={addToWatchlist}
                  />
                )}
                {screen === 'instrument-analysis' && (
                  <AnalyseInstrument ctx={ctx} go={go} />
                )}
                {screen === 'marches' && (
                  <MarchesObligatairesScreen
                    markets={MARKETS_DATA}
                    bondMeta={BOND_MARKET_META}
                    watchlistTitles={watchlistTitles}
                    onAddWatch={addToWatchlist}
                    onOpenDepth={(context) => go('profondeur', context)}
                  />
                )}
                {screen === 'watchlist' && (
                  <WatchlistScreen
                    watchlistTitles={watchlistTitles}
                    onRemoveWatch={removeFromWatchlist}
                    onOpenDepth={(context) => go('profondeur', context)}
                    buildDailyRows={buildWatchlistJournaliere}
                    buildStaticRow={buildStaticWatchlistRow}
                  />
                )}
                {screen === 'recos-actions' && (
                  <RecommandationsActionsScreen
                    recommendations={RECOS}
                    onOpenGroupedAllocation={(context) => go('alloc-criteres', context)}
                  />                )}
                {screen === 'reco-alloc' && (
                  <RecommandationAllocationScreen
                    clients={CLIENTS}
                    onApplyRebalancing={(context) => go('reequilibrage', context)}
                  />
                )}
                {screen === 'alloc-criteres' && (
                  <AllocationParCriteresScreen
                    initialSens={ctx.sens}
                    initialInstrument={ctx.instrument}
                    clients={CLIENTS}
                    instruments={INSTRUMENTS}
                    profileTypeLabel={PROFILE_TYPE_LABEL}
                    compare={compareOp}
                    exposureOf={exposureOf}
                  />
                )}
                {screen === 'alertes' && (
                  <AlertesScreen
                    alerts={ALERTES}
                    onRebalance={(context) => go('reequilibrage', context)}
                  />
                )}
                {screen === 'money-management' && (
                  <MoneyManagementScreen
                    go={go}
                    devise={siteDevise}
                    dependencies={{
                      clients: CLIENTS,
                      orders: ORDERS,
                      upcomingCashflows: UPCOMING_CASHFLOWS,
                      profileTypeLabel: PROFILE_TYPE_LABEL,
                      liquidityHistoryMinDate: LIQUIDITY_HISTORY_MIN_DATE,
                      rebalanceThreshold: SEUIL_REEQUILIBRAGE,
                      parseIsoLocalDate,
                      parseFR,
                      liquidityHistoricalAmount,
                      buildMoneyManagementConsolidatedExportPayload,
                      exportMoneyManagementPdf,
                      exportMoneyManagementExcel,
                    }}
                  />
                )}
                {screen === 'cession-retrait' && (
                  <CessionRetraitScreen
                    go={go}
                    devise={siteDevise}
                    onCessionStatusChange={updateCessionRetraitStatus}
                  />
                )}
                {screen === 'cession-interne' && (
                  <CessionInterneScreen
                    ctx={ctx}
                    go={go}
                    devise={siteDevise}
                    onCessionStatusChange={updateCessionRetraitStatus}
                    cessionRetraitEtats={cessionRetraitEtats}
                  />
                )}
                {screen === 'reequilibrage' && (
                  <ReequilibrageScreen initial={ctx} devise={siteDevise} />
                )}
                {screen === 'analyse' && (
                  <AnalysePortefeuilleScreen devise={siteDevise} />
                )}
                {screen === 'comite' && <ComiteScreen devise={siteDevise} go={go} />}
                {screen === 'decisions-comite' && <PriseDecisionsScreen go={go} />}
                {screen === 'documentation' && <DocumentationScreen
                    mode="gestionnaire"
                    documents={documentation}
                    onOpenDocument={onOpenDocumentation}
                    onDownloadDocument={onDownloadDocumentation}
                  />}
              </>
            )}

            {workspace === 'client' && (
              <>
                {clientScreen === 'client-dashboard' && (
                  <ClientDashboard
                    goClient={goClient}
                    devise={siteDevise}
                    onDeviseChange={setSiteDevise}
                    orders={clientOrders}
                  />
                )}
                {clientScreen === 'client-portfolios' && (
                  <ClientPortfolios devise={siteDevise} orders={clientOrders} />
                )}
                {clientScreen === 'client-exchanges' && (
                  <VueBourses
                    mode="client"
                    goClient={goClient}
                    watchlistTitles={clientWatchlistTitles}
                    onAddWatch={addToClientWatchlist}
                  />
                )}
                {clientScreen === 'client-instrument-analysis' && (
                  <AnalyseInstrument
                    ctx={clientCtx}
                    mode="client"
                    goClient={goClient}
                  />
                )}
                {clientScreen === 'client-markets' && (
                  <ClientMarkets
                    goClient={goClient}
                    watchlistTitles={clientWatchlistTitles}
                    onAddWatch={addToClientWatchlist}
                    onRemoveWatch={removeFromClientWatchlist}
                  />
                )}
                {clientScreen === 'client-watchlist' && (
                  <ClientWatchlist
                    goClient={goClient}
                    watchlistTitles={clientWatchlistTitles}
                    onAddWatch={addToClientWatchlist}
                    onRemoveWatch={removeFromClientWatchlist}
                  />
                )}
                {clientScreen === 'client-ticket' && (
                  <ClientOrderTicket
                    goClient={goClient}
                    onCreateOrder={createClientOrder}
                    orders={clientOrders}
                    initialInstrument={clientCtx.instrument}
                    initialMarket={clientCtx.marche}
                    source={clientCtx.source}
                  />
                )}
                {clientScreen === 'client-market-depth' && (
                  <ProfondeurMarche
                    ctx={clientCtx}
                    mode="client"
                    goClient={goClient}
                  />
                )}
                {clientScreen === 'client-orders' && (
                  <ClientOrders orders={clientOrders} />
                )}
                {clientScreen === 'client-avis' && (
                  <ClientAvis orders={clientOrders} devise={siteDevise} />
                )}
                {clientScreen === 'client-cashflows' && (
                  <ClientCashflows devise={siteDevise} orders={clientOrders} />
                )}
                {clientScreen === 'client-analysis' && (
                  <ClientAnalysis devise={siteDevise} />
                )}
                {clientScreen === 'client-documentation' && (
                  <DocumentationScreen
                    mode="client"
                    documents={documentation}
                    onOpenDocument={onOpenDocumentation}
                    onDownloadDocument={onDownloadDocumentation}
                  />
                )}
              </>
            )}
            </ScreenErrorBoundary>
          </main>        </div>
      </div>
    </NavigationContext.Provider>
  );
}
