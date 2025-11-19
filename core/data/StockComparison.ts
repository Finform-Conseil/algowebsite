// ============================================
// Stock Comparison Data & Types
// ============================================

export interface ComparisonStock {
  id: string;
  ticker: string;
  name: string;
  logo?: string;
  market: 'BRVM' | 'JSE' | 'CSE' | 'NGX' | 'GSE' | 'NSE';
  country: string;
  sector: string;
  currency: 'XOF' | 'USD' | 'ZAR' | 'KES' | 'GHS' | 'NGN';
  
  // Prix & Performance
  price: number;
  change1D: number;
  change1M: number;
  change3M: number;
  change1Y: number;
  change5Y: number;
  
  // Croissance
  revenueGrowth1Y: number;
  revenueGrowth3Y: number;
  epsGrowth: number;
  bpaGrowth: number;
  
  // Rentabilité
  netMargin: number;
  operatingMargin: number;
  grossMargin: number;
  roe: number;
  roa: number;
  roic: number;
  
  // Valorisation
  pe: number;
  pb: number;
  ps: number;
  evToEbitda: number;
  peg: number;
  
  // Cash-flows
  operatingCashFlow: number;
  freeCashFlow: number;
  cashFlowGrowth: number;
  
  // Dividendes
  dividendYield: number;
  payoutRatio: number;
  dividendGrowth5Y: number;
  
  // Endettement
  debtToEquity: number;
  debtToAssets: number;
  currentRatio: number;
  quickRatio: number;
  
  // Activité
  marketCap: number;
  volume: number;
  avgVolume: number;
  
  // Efficacité
  assetTurnover: number;
  inventoryTurnover: number;
  
  // Données historiques pour sparklines
  priceHistory: number[];
  epsHistory: number[];
}

// ============================================
// Catégories d'indicateurs
// ============================================

export interface IndicatorCategory {
  id: string;
  name: string;
  indicators: Indicator[];
}

export interface Indicator {
  id: string;
  name: string;
  field: keyof ComparisonStock;
  category: string;
  unit: '%' | '$' | 'x' | 'Md' | '';
  description: string;
  higherIsBetter: boolean;
}

export const INDICATOR_CATEGORIES: IndicatorCategory[] = [
  {
    id: 'price-performance',
    name: 'Prix & Performance',
    indicators: [
      { id: 'price', name: 'Prix Actuel', field: 'price', category: 'price-performance', unit: '$', description: 'Prix actuel de l\'action', higherIsBetter: true },
      { id: 'change1D', name: 'Var. 1J', field: 'change1D', category: 'price-performance', unit: '%', description: 'Variation sur 1 jour', higherIsBetter: true },
      { id: 'change1M', name: 'Var. 1M', field: 'change1M', category: 'price-performance', unit: '%', description: 'Variation sur 1 mois', higherIsBetter: true },
      { id: 'change3M', name: 'Var. 3M', field: 'change3M', category: 'price-performance', unit: '%', description: 'Variation sur 3 mois', higherIsBetter: true },
      { id: 'change1Y', name: 'Var. 1A', field: 'change1Y', category: 'price-performance', unit: '%', description: 'Variation sur 1 an', higherIsBetter: true },
      { id: 'change5Y', name: 'Var. 5A', field: 'change5Y', category: 'price-performance', unit: '%', description: 'Variation sur 5 ans', higherIsBetter: true },
    ],
  },
  {
    id: 'growth',
    name: 'Croissance',
    indicators: [
      { id: 'revenueGrowth1Y', name: 'Croissance CA 1A', field: 'revenueGrowth1Y', category: 'growth', unit: '%', description: 'Croissance du chiffre d\'affaires sur 1 an', higherIsBetter: true },
      { id: 'revenueGrowth3Y', name: 'Croissance CA 3A', field: 'revenueGrowth3Y', category: 'growth', unit: '%', description: 'Croissance du chiffre d\'affaires sur 3 ans', higherIsBetter: true },
      { id: 'epsGrowth', name: 'Croissance EPS', field: 'epsGrowth', category: 'growth', unit: '%', description: 'Croissance du bénéfice par action', higherIsBetter: true },
      { id: 'bpaGrowth', name: 'Croissance BPA', field: 'bpaGrowth', category: 'growth', unit: '%', description: 'Croissance du bénéfice par action', higherIsBetter: true },
    ],
  },
  {
    id: 'profitability',
    name: 'Rentabilité',
    indicators: [
      { id: 'netMargin', name: 'Marge Nette', field: 'netMargin', category: 'profitability', unit: '%', description: 'Marge bénéficiaire nette', higherIsBetter: true },
      { id: 'operatingMargin', name: 'Marge Opérationnelle', field: 'operatingMargin', category: 'profitability', unit: '%', description: 'Marge opérationnelle', higherIsBetter: true },
      { id: 'grossMargin', name: 'Marge Brute', field: 'grossMargin', category: 'profitability', unit: '%', description: 'Marge brute', higherIsBetter: true },
    ],
  },
  {
    id: 'valuation',
    name: 'Valorisation',
    indicators: [
      { id: 'pe', name: 'P/E Ratio', field: 'pe', category: 'valuation', unit: 'x', description: 'Ratio cours/bénéfice', higherIsBetter: false },
      { id: 'pb', name: 'Price to Book', field: 'pb', category: 'valuation', unit: 'x', description: 'Ratio cours/valeur comptable', higherIsBetter: false },
      { id: 'ps', name: 'Price to Sales', field: 'ps', category: 'valuation', unit: 'x', description: 'Ratio cours/ventes', higherIsBetter: false },
      { id: 'evToEbitda', name: 'EV/EBITDA', field: 'evToEbitda', category: 'valuation', unit: 'x', description: 'Valeur d\'entreprise/EBITDA', higherIsBetter: false },
      { id: 'peg', name: 'PEG Ratio', field: 'peg', category: 'valuation', unit: 'x', description: 'Ratio PER/Croissance', higherIsBetter: false },
    ],
  },
  {
    id: 'cashflow',
    name: 'Cash-flows',
    indicators: [
      { id: 'operatingCashFlow', name: 'Cash-Flow Opérationnel', field: 'operatingCashFlow', category: 'cashflow', unit: 'Md', description: 'Flux de trésorerie opérationnel', higherIsBetter: true },
      { id: 'freeCashFlow', name: 'Free Cash-Flow', field: 'freeCashFlow', category: 'cashflow', unit: 'Md', description: 'Flux de trésorerie disponible', higherIsBetter: true },
      { id: 'cashFlowGrowth', name: 'Croissance CF', field: 'cashFlowGrowth', category: 'cashflow', unit: '%', description: 'Croissance du cash-flow', higherIsBetter: true },
    ],
  },
  {
    id: 'dividends',
    name: 'Dividendes',
    indicators: [
      { id: 'dividendYield', name: 'Rendement Dividende', field: 'dividendYield', category: 'dividends', unit: '%', description: 'Rendement du dividende', higherIsBetter: true },
      { id: 'payoutRatio', name: 'Payout Ratio', field: 'payoutRatio', category: 'dividends', unit: '%', description: 'Taux de distribution', higherIsBetter: false },
      { id: 'dividendGrowth5Y', name: 'Croissance Div. 5A', field: 'dividendGrowth5Y', category: 'dividends', unit: '%', description: 'Croissance du dividende sur 5 ans', higherIsBetter: true },
    ],
  },
  {
    id: 'debt',
    name: 'Endettement',
    indicators: [
      { id: 'debtToEquity', name: 'Dette/Capitaux', field: 'debtToEquity', category: 'debt', unit: '%', description: 'Ratio d\'endettement', higherIsBetter: false },
      { id: 'debtToAssets', name: 'Dette/Actifs', field: 'debtToAssets', category: 'debt', unit: '%', description: 'Dette sur actifs totaux', higherIsBetter: false },
      { id: 'currentRatio', name: 'Ratio de Liquidité', field: 'currentRatio', category: 'debt', unit: 'x', description: 'Ratio de liquidité générale', higherIsBetter: true },
      { id: 'quickRatio', name: 'Ratio Rapide', field: 'quickRatio', category: 'debt', unit: 'x', description: 'Ratio de liquidité immédiate', higherIsBetter: true },
    ],
  },
  {
    id: 'efficiency',
    name: 'Efficacité',
    indicators: [
      { id: 'roe', name: 'ROE', field: 'roe', category: 'efficiency', unit: '%', description: 'Rendement des capitaux propres', higherIsBetter: true },
      { id: 'roa', name: 'ROA', field: 'roa', category: 'efficiency', unit: '%', description: 'Rendement des actifs', higherIsBetter: true },
      { id: 'roic', name: 'ROIC', field: 'roic', category: 'efficiency', unit: '%', description: 'Rendement du capital investi', higherIsBetter: true },
      { id: 'assetTurnover', name: 'Rotation Actifs', field: 'assetTurnover', category: 'efficiency', unit: 'x', description: 'Rotation des actifs', higherIsBetter: true },
    ],
  },
  {
    id: 'activity',
    name: 'Activité',
    indicators: [
      { id: 'marketCap', name: 'Capitalisation', field: 'marketCap', category: 'activity', unit: 'Md', description: 'Capitalisation boursière', higherIsBetter: true },
      { id: 'volume', name: 'Volume', field: 'volume', category: 'activity', unit: '', description: 'Volume échangé', higherIsBetter: true },
      { id: 'avgVolume', name: 'Volume Moyen', field: 'avgVolume', category: 'activity', unit: '', description: 'Volume moyen', higherIsBetter: true },
    ],
  },
];

// ============================================
// Templates de comparaison prédéfinis
// ============================================

export interface ComparisonTemplate {
  id: string;
  name: string;
  description: string;
  indicators: string[];
}

export const COMPARISON_TEMPLATES: ComparisonTemplate[] = [
  {
    id: 'bank-vs-bank',
    name: 'Banque vs Banque',
    description: 'Comparaison bancaire complète',
    indicators: ['roe', 'roa', 'pe', 'pb', 'debtToEquity', 'dividendYield', 'netMargin', 'marketCap'],
  },
  {
    id: 'telco-vs-telco',
    name: 'Telco vs Telco',
    description: 'Comparaison télécoms',
    indicators: ['revenueGrowth1Y', 'operatingMargin', 'ebitdaMargin', 'capex', 'subscribers', 'arpu'],
  },
  {
    id: 'growth-vs-value',
    name: 'Croissance vs Valeur',
    description: 'Growth stocks vs Value stocks',
    indicators: ['revenueGrowth3Y', 'epsGrowth', 'pe', 'peg', 'roe', 'freeCashFlow'],
  },
  {
    id: 'fundamental-analysis',
    name: 'Analyse Fondamentale',
    description: 'Vue d\'ensemble fondamentale',
    indicators: ['pe', 'pb', 'roe', 'roa', 'netMargin', 'debtToEquity', 'dividendYield', 'freeCashFlow'],
  },
  {
    id: 'dividend-focus',
    name: 'Focus Dividendes',
    description: 'Analyse orientée dividendes',
    indicators: ['dividendYield', 'payoutRatio', 'dividendGrowth5Y', 'freeCashFlow', 'debtToEquity', 'roe'],
  },
];

// ============================================
// Données mockup d'actions
// ============================================

export const COMPARISON_STOCKS: ComparisonStock[] = [
  {
    id: 'ecobank',
    ticker: 'ETIT',
    name: 'Ecobank Transnational',
    market: 'BRVM',
    country: 'Togo',
    sector: 'Banques',
    currency: 'XOF',
    price: 24.50,
    change1D: 1.2,
    change1M: 3.5,
    change3M: 8.2,
    change1Y: 15.3,
    change5Y: 42.1,
    revenueGrowth1Y: 12.5,
    revenueGrowth3Y: 9.8,
    epsGrowth: 14.2,
    bpaGrowth: 14.2,
    netMargin: 18.5,
    operatingMargin: 24.3,
    grossMargin: 42.1,
    roe: 16.8,
    roa: 2.1,
    roic: 8.5,
    pe: 12.3,
    pb: 1.8,
    ps: 2.1,
    evToEbitda: 8.5,
    peg: 0.87,
    operatingCashFlow: 850,
    freeCashFlow: 620,
    cashFlowGrowth: 10.2,
    dividendYield: 5.2,
    payoutRatio: 35.0,
    dividendGrowth5Y: 8.5,
    debtToEquity: 45.2,
    debtToAssets: 12.3,
    currentRatio: 1.45,
    quickRatio: 1.12,
    marketCap: 4200,
    volume: 125000,
    avgVolume: 98000,
    assetTurnover: 0.85,
    inventoryTurnover: 0,
    priceHistory: [22.1, 22.8, 23.5, 23.2, 24.1, 24.5],
    epsHistory: [1.8, 1.9, 2.0, 2.1, 2.2, 2.3],
  },
  {
    id: 'uba',
    ticker: 'UBA',
    name: 'United Bank for Africa',
    market: 'NGX',
    country: 'Nigeria',
    sector: 'Banques',
    currency: 'NGN',
    price: 18.75,
    change1D: -0.5,
    change1M: 2.1,
    change3M: 12.5,
    change1Y: 28.3,
    change5Y: 65.2,
    revenueGrowth1Y: 18.2,
    revenueGrowth3Y: 15.6,
    epsGrowth: 22.5,
    bpaGrowth: 22.5,
    netMargin: 22.1,
    operatingMargin: 28.5,
    grossMargin: 48.2,
    roe: 18.5,
    roa: 2.8,
    roic: 10.2,
    pe: 10.5,
    pb: 1.5,
    ps: 1.8,
    evToEbitda: 7.2,
    peg: 0.47,
    operatingCashFlow: 1200,
    freeCashFlow: 850,
    cashFlowGrowth: 15.8,
    dividendYield: 10.2,
    payoutRatio: 40.0,
    dividendGrowth5Y: 12.3,
    debtToEquity: 38.5,
    debtToAssets: 10.2,
    currentRatio: 1.52,
    quickRatio: 1.25,
    marketCap: 6800,
    volume: 2500000,
    avgVolume: 1800000,
    assetTurnover: 0.92,
    inventoryTurnover: 0,
    priceHistory: [14.5, 15.2, 16.8, 17.5, 18.2, 18.75],
    epsHistory: [1.5, 1.6, 1.7, 1.8, 1.9, 2.0],
  },
  {
    id: 'standard-bank',
    ticker: 'SBK',
    name: 'Standard Bank Group',
    market: 'JSE',
    country: 'South Africa',
    sector: 'Banques',
    currency: 'ZAR',
    price: 142.50,
    change1D: 0.8,
    change1M: 1.5,
    change3M: 5.2,
    change1Y: 18.5,
    change5Y: 52.3,
    revenueGrowth1Y: 8.5,
    revenueGrowth3Y: 7.2,
    epsGrowth: 12.8,
    bpaGrowth: 12.8,
    netMargin: 20.5,
    operatingMargin: 26.8,
    grossMargin: 45.2,
    roe: 17.2,
    roa: 1.8,
    roic: 9.2,
    pe: 11.8,
    pb: 1.6,
    ps: 1.9,
    evToEbitda: 8.1,
    peg: 0.92,
    operatingCashFlow: 15000,
    freeCashFlow: 11200,
    cashFlowGrowth: 9.5,
    dividendYield: 6.8,
    payoutRatio: 45.0,
    dividendGrowth5Y: 9.2,
    debtToEquity: 42.1,
    debtToAssets: 11.5,
    currentRatio: 1.38,
    quickRatio: 1.08,
    marketCap: 85000,
    volume: 1500000,
    avgVolume: 1200000,
    assetTurnover: 0.78,
    inventoryTurnover: 0,
    priceHistory: [120.5, 125.2, 132.8, 135.5, 140.2, 142.5],
    epsHistory: [10.5, 11.2, 11.8, 12.2, 12.5, 13.0],
  },
  {
    id: 'dangote',
    ticker: 'DANGCEM',
    name: 'Dangote Cement',
    market: 'NGX',
    country: 'Nigeria',
    sector: 'Matériaux',
    currency: 'NGN',
    price: 285.50,
    change1D: 2.1,
    change1M: 5.8,
    change3M: 15.2,
    change1Y: 32.5,
    change5Y: 88.2,
    revenueGrowth1Y: 22.5,
    revenueGrowth3Y: 18.8,
    epsGrowth: 28.5,
    bpaGrowth: 28.5,
    netMargin: 28.5,
    operatingMargin: 35.2,
    grossMargin: 52.8,
    roe: 25.8,
    roa: 12.5,
    roic: 18.2,
    pe: 14.2,
    pb: 2.8,
    ps: 3.2,
    evToEbitda: 9.5,
    peg: 0.50,
    operatingCashFlow: 2800,
    freeCashFlow: 1950,
    cashFlowGrowth: 20.5,
    dividendYield: 4.2,
    payoutRatio: 30.0,
    dividendGrowth5Y: 15.8,
    debtToEquity: 28.5,
    debtToAssets: 15.2,
    currentRatio: 2.15,
    quickRatio: 1.85,
    marketCap: 48500,
    volume: 850000,
    avgVolume: 650000,
    assetTurnover: 1.25,
    inventoryTurnover: 8.5,
    priceHistory: [215.5, 230.2, 245.8, 260.5, 275.2, 285.5],
    epsHistory: [16.5, 18.2, 19.8, 21.2, 22.5, 24.0],
  },
  {
    id: 'mtn',
    ticker: 'MTN',
    name: 'MTN Group',
    market: 'JSE',
    country: 'South Africa',
    sector: 'Télécoms',
    currency: 'ZAR',
    price: 98.25,
    change1D: -1.2,
    change1M: 0.5,
    change3M: 8.5,
    change1Y: 22.8,
    change5Y: 58.5,
    revenueGrowth1Y: 15.2,
    revenueGrowth3Y: 12.8,
    epsGrowth: 18.5,
    bpaGrowth: 18.5,
    netMargin: 14.2,
    operatingMargin: 22.5,
    grossMargin: 48.5,
    roe: 28.5,
    roa: 8.5,
    roic: 15.2,
    pe: 9.8,
    pb: 2.5,
    ps: 1.2,
    evToEbitda: 6.5,
    peg: 0.53,
    operatingCashFlow: 8500,
    freeCashFlow: 5200,
    cashFlowGrowth: 12.5,
    dividendYield: 8.5,
    payoutRatio: 55.0,
    dividendGrowth5Y: 10.2,
    debtToEquity: 52.5,
    debtToAssets: 22.5,
    currentRatio: 1.25,
    quickRatio: 0.95,
    marketCap: 165000,
    volume: 2800000,
    avgVolume: 2200000,
    assetTurnover: 0.68,
    inventoryTurnover: 0,
    priceHistory: [76.5, 82.2, 88.8, 92.5, 95.2, 98.25],
    epsHistory: [8.5, 9.2, 9.8, 10.2, 10.5, 11.0],
  },
  {
    id: 'safaricom',
    ticker: 'SCOM',
    name: 'Safaricom',
    market: 'NSE',
    country: 'Kenya',
    sector: 'Télécoms',
    currency: 'KES',
    price: 32.50,
    change1D: 0.5,
    change1M: 2.8,
    change3M: 10.2,
    change1Y: 25.5,
    change5Y: 72.8,
    revenueGrowth1Y: 18.5,
    revenueGrowth3Y: 16.2,
    epsGrowth: 22.8,
    bpaGrowth: 22.8,
    netMargin: 18.5,
    operatingMargin: 28.5,
    grossMargin: 55.2,
    roe: 32.5,
    roa: 12.8,
    roic: 22.5,
    pe: 15.2,
    pb: 3.8,
    ps: 2.5,
    evToEbitda: 8.5,
    peg: 0.67,
    operatingCashFlow: 1850,
    freeCashFlow: 1200,
    cashFlowGrowth: 16.5,
    dividendYield: 6.2,
    payoutRatio: 48.0,
    dividendGrowth5Y: 14.5,
    debtToEquity: 32.5,
    debtToAssets: 18.5,
    currentRatio: 1.85,
    quickRatio: 1.52,
    marketCap: 28500,
    volume: 15000000,
    avgVolume: 12000000,
    assetTurnover: 0.92,
    inventoryTurnover: 0,
    priceHistory: [23.5, 26.2, 28.8, 30.5, 31.2, 32.5],
    epsHistory: [1.8, 2.0, 2.2, 2.4, 2.6, 2.8],
  },
];

// ============================================
// Fonctions utilitaires
// ============================================

export function getStocksByMarket(market: string): ComparisonStock[] {
  return COMPARISON_STOCKS.filter((s) => s.market === market);
}

export function getStocksBySector(sector: string): ComparisonStock[] {
  return COMPARISON_STOCKS.filter((s) => s.sector === sector);
}

export function getStocksByCountry(country: string): ComparisonStock[] {
  return COMPARISON_STOCKS.filter((s) => s.country === country);
}

export function getAllIndicators(): Indicator[] {
  return INDICATOR_CATEGORIES.flatMap((cat) => cat.indicators);
}

export function getIndicatorById(id: string): Indicator | undefined {
  return getAllIndicators().find((ind) => ind.id === id);
}

export function getTemplateById(id: string): ComparisonTemplate | undefined {
  return COMPARISON_TEMPLATES.find((t) => t.id === id);
}
