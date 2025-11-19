// ============================================
// QUANTUM LEDGER - Stock Screener Data
// ============================================

export interface StockScreenerItem {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  marketCap: number; // en milliards
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  pe: number; // Price to Earnings
  dividendYield: number;
  revenue5YGrowth: number; // Croissance CA sur 5 ans (%)
  rdExpenseGrowth3Y: number; // Croissance R&D sur 3 ans (%)
  cashFlow: number; // en millions
  debtTrend: 'increasing' | 'decreasing' | 'stable';
  roe: number; // Return on Equity (%)
  currentRatio: number;
  quickRatio: number;
  debtToEquity: number;
  operatingMargin: number;
  netMargin: number;
  freeCashFlowMargin: number;
  bookValue: number;
  priceToBook: number;
  beta: number;
  analystRating: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';
  targetPrice: number;
}

export type FilterCategory =
  | 'Valorisation'
  | 'Croissance'
  | 'Rentabilité'
  | 'Solidité Financière'
  | 'Dividendes'
  | 'Technique'
  | 'Sentiment';

export interface FilterCriterion {
  id: string;
  category: FilterCategory;
  name: string;
  field: keyof StockScreenerItem;
  type: 'range' | 'select' | 'boolean';
  unit?: string;
  options?: string[];
}

// ============================================
// Critères de Filtrage (Aperçu des 100+ filtres)
// ============================================

export const FILTER_CRITERIA: FilterCriterion[] = [
  // Valorisation
  { id: 'f1', category: 'Valorisation', name: 'Capitalisation Boursière', field: 'marketCap', type: 'range', unit: 'Md €' },
  { id: 'f2', category: 'Valorisation', name: 'P/E Ratio', field: 'pe', type: 'range' },
  { id: 'f3', category: 'Valorisation', name: 'Price to Book', field: 'priceToBook', type: 'range' },
  { id: 'f4', category: 'Valorisation', name: 'Bêta', field: 'beta', type: 'range' },
  
  // Croissance
  { id: 'f5', category: 'Croissance', name: 'Croissance CA 5 ans', field: 'revenue5YGrowth', type: 'range', unit: '%' },
  { id: 'f6', category: 'Croissance', name: 'Croissance R&D 3 ans', field: 'rdExpenseGrowth3Y', type: 'range', unit: '%' },
  
  // Rentabilité
  { id: 'f7', category: 'Rentabilité', name: 'ROE', field: 'roe', type: 'range', unit: '%' },
  { id: 'f8', category: 'Rentabilité', name: 'Marge Opérationnelle', field: 'operatingMargin', type: 'range', unit: '%' },
  { id: 'f9', category: 'Rentabilité', name: 'Marge Nette', field: 'netMargin', type: 'range', unit: '%' },
  
  // Solidité Financière
  { id: 'f10', category: 'Solidité Financière', name: 'Cash-Flow', field: 'cashFlow', type: 'range', unit: 'M €' },
  { id: 'f11', category: 'Solidité Financière', name: 'Tendance Dette', field: 'debtTrend', type: 'select', options: ['increasing', 'decreasing', 'stable'] },
  { id: 'f12', category: 'Solidité Financière', name: 'Ratio de Liquidité', field: 'currentRatio', type: 'range' },
  { id: 'f13', category: 'Solidité Financière', name: 'Dette / Capitaux Propres', field: 'debtToEquity', type: 'range' },
  
  // Dividendes
  { id: 'f14', category: 'Dividendes', name: 'Rendement Dividende', field: 'dividendYield', type: 'range', unit: '%' },
  
  // Technique
  { id: 'f15', category: 'Technique', name: 'Prix', field: 'price', type: 'range', unit: '€' },
  { id: 'f16', category: 'Technique', name: 'Volume', field: 'volume', type: 'range', unit: 'M' },
  { id: 'f17', category: 'Technique', name: 'Variation %', field: 'changePercent', type: 'range', unit: '%' },
  
  // Sentiment
  { id: 'f18', category: 'Sentiment', name: 'Recommandation Analystes', field: 'analystRating', type: 'select', options: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'] },
];

// ============================================
// Données Factices - Actions
// ============================================

export const DUMMY_STOCKS: StockScreenerItem[] = [
  {
    id: 'stock-1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Technology',
    marketCap: 2800,
    price: 178.45,
    change: 2.35,
    changePercent: 1.33,
    volume: 58.5,
    pe: 28.5,
    dividendYield: 0.52,
    revenue5YGrowth: 34.5,
    rdExpenseGrowth3Y: 18.2,
    cashFlow: 104500,
    debtTrend: 'stable',
    roe: 147.3,
    currentRatio: 1.0,
    quickRatio: 0.85,
    debtToEquity: 1.96,
    operatingMargin: 30.5,
    netMargin: 25.3,
    freeCashFlowMargin: 23.8,
    bookValue: 3.95,
    priceToBook: 45.2,
    beta: 1.25,
    analystRating: 'Buy',
    targetPrice: 195.0,
  },
  {
    id: 'stock-2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Technology',
    marketCap: 2650,
    price: 378.91,
    change: -3.12,
    changePercent: -0.82,
    volume: 24.3,
    pe: 34.2,
    dividendYield: 0.78,
    revenue5YGrowth: 42.1,
    rdExpenseGrowth3Y: 22.5,
    cashFlow: 87300,
    debtTrend: 'decreasing',
    roe: 42.5,
    currentRatio: 1.8,
    quickRatio: 1.65,
    debtToEquity: 0.35,
    operatingMargin: 42.0,
    netMargin: 36.7,
    freeCashFlowMargin: 31.2,
    bookValue: 25.8,
    priceToBook: 14.7,
    beta: 0.92,
    analystRating: 'Strong Buy',
    targetPrice: 420.0,
  },
  {
    id: 'stock-3',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    sector: 'Technology',
    marketCap: 1750,
    price: 141.23,
    change: 4.87,
    changePercent: 3.57,
    volume: 31.2,
    pe: 26.8,
    dividendYield: 0.0,
    revenue5YGrowth: 38.9,
    rdExpenseGrowth3Y: 25.7,
    cashFlow: 69400,
    debtTrend: 'stable',
    roe: 28.9,
    currentRatio: 2.6,
    quickRatio: 2.5,
    debtToEquity: 0.11,
    operatingMargin: 28.5,
    netMargin: 23.9,
    freeCashFlowMargin: 25.1,
    bookValue: 78.5,
    priceToBook: 1.8,
    beta: 1.06,
    analystRating: 'Buy',
    targetPrice: 155.0,
  },
  {
    id: 'stock-4',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    sector: 'Consumer Cyclical',
    marketCap: 1580,
    price: 152.67,
    change: -1.45,
    changePercent: -0.94,
    volume: 48.7,
    pe: 68.3,
    dividendYield: 0.0,
    revenue5YGrowth: 51.2,
    rdExpenseGrowth3Y: 31.4,
    cashFlow: 54100,
    debtTrend: 'increasing',
    roe: 12.8,
    currentRatio: 1.1,
    quickRatio: 0.87,
    debtToEquity: 0.58,
    operatingMargin: 5.3,
    netMargin: 3.8,
    freeCashFlowMargin: 8.9,
    bookValue: 22.1,
    priceToBook: 6.9,
    beta: 1.15,
    analystRating: 'Buy',
    targetPrice: 175.0,
  },
  {
    id: 'stock-5',
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    sector: 'Automotive',
    marketCap: 765,
    price: 242.18,
    change: 8.92,
    changePercent: 3.82,
    volume: 125.3,
    pe: 73.4,
    dividendYield: 0.0,
    revenue5YGrowth: 126.5,
    rdExpenseGrowth3Y: 45.8,
    cashFlow: 13650,
    debtTrend: 'decreasing',
    roe: 28.1,
    currentRatio: 1.7,
    quickRatio: 1.3,
    debtToEquity: 0.17,
    operatingMargin: 16.8,
    netMargin: 14.7,
    freeCashFlowMargin: 10.2,
    bookValue: 19.3,
    priceToBook: 12.5,
    beta: 2.01,
    analystRating: 'Hold',
    targetPrice: 250.0,
  },
  {
    id: 'stock-6',
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    sector: 'Financial Services',
    marketCap: 455,
    price: 156.34,
    change: 1.12,
    changePercent: 0.72,
    volume: 9.8,
    pe: 10.2,
    dividendYield: 2.45,
    revenue5YGrowth: 18.3,
    rdExpenseGrowth3Y: 8.5,
    cashFlow: 48200,
    debtTrend: 'stable',
    roe: 15.2,
    currentRatio: 1.2,
    quickRatio: 1.0,
    debtToEquity: 1.42,
    operatingMargin: 38.5,
    netMargin: 31.2,
    freeCashFlowMargin: 22.5,
    bookValue: 89.7,
    priceToBook: 1.74,
    beta: 1.12,
    analystRating: 'Buy',
    targetPrice: 170.0,
  },
  {
    id: 'stock-7',
    ticker: 'JNJ',
    name: 'Johnson & Johnson',
    sector: 'Healthcare',
    marketCap: 385,
    price: 159.87,
    change: 0.45,
    changePercent: 0.28,
    volume: 6.2,
    pe: 24.1,
    dividendYield: 3.12,
    revenue5YGrowth: 12.5,
    rdExpenseGrowth3Y: 15.3,
    cashFlow: 23100,
    debtTrend: 'decreasing',
    roe: 22.4,
    currentRatio: 1.3,
    quickRatio: 0.95,
    debtToEquity: 0.48,
    operatingMargin: 25.8,
    netMargin: 19.3,
    freeCashFlowMargin: 20.1,
    bookValue: 28.5,
    priceToBook: 5.6,
    beta: 0.65,
    analystRating: 'Buy',
    targetPrice: 175.0,
  },
  {
    id: 'stock-8',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Technology',
    marketCap: 1180,
    price: 478.32,
    change: 15.67,
    changePercent: 3.39,
    volume: 52.1,
    pe: 115.8,
    dividendYield: 0.03,
    revenue5YGrowth: 89.7,
    rdExpenseGrowth3Y: 38.9,
    cashFlow: 10850,
    debtTrend: 'stable',
    roe: 98.5,
    currentRatio: 4.5,
    quickRatio: 3.8,
    debtToEquity: 0.42,
    operatingMargin: 32.8,
    netMargin: 29.2,
    freeCashFlowMargin: 27.5,
    bookValue: 8.92,
    priceToBook: 53.6,
    beta: 1.68,
    analystRating: 'Strong Buy',
    targetPrice: 550.0,
  },
];

// Fonction pour calculer les statistiques du screener
export const getScreenerStats = (stocks: StockScreenerItem[]) => {
  return {
    totalStocks: stocks.length,
    avgPE: stocks.reduce((sum, s) => sum + s.pe, 0) / stocks.length,
    avgROE: stocks.reduce((sum, s) => sum + s.roe, 0) / stocks.length,
    avgRevGrowth: stocks.reduce((sum, s) => sum + s.revenue5YGrowth, 0) / stocks.length,
    totalMarketCap: stocks.reduce((sum, s) => sum + s.marketCap, 0),
    positiveCashFlow: stocks.filter(s => s.cashFlow > 0).length,
    debtDecreasing: stocks.filter(s => s.debtTrend === 'decreasing').length,
  };
};

// Fonction pour obtenir la distribution sectorielle
export const getSectorDistribution = (stocks: StockScreenerItem[]) => {
  const distribution: { [key: string]: number } = {};
  stocks.forEach(stock => {
    distribution[stock.sector] = (distribution[stock.sector] || 0) + 1;
  });
  return Object.entries(distribution).map(([name, value]) => ({ name, value }));
};

// Fonction pour obtenir la distribution des recommandations
export const getRatingDistribution = (stocks: StockScreenerItem[]) => {
  const distribution: { [key: string]: number } = {};
  stocks.forEach(stock => {
    distribution[stock.analystRating] = (distribution[stock.analystRating] || 0) + 1;
  });
  return Object.entries(distribution).map(([name, value]) => ({ name, value }));
};
