import {
  Watchlist,
  WatchlistStock,
  Alert,
  Portfolio,
  Position,
  Transaction,
  PortfolioStats,
  PerformanceHistory,
  QuickStats
} from '@/types/watchlist-portfolio';

// Mock Watchlist Stocks
export const WATCHLIST_STOCKS: WatchlistStock[] = [
  {
    id: 'snts-1',
    ticker: 'SNTS',
    companyName: 'Sonatel',
    exchange: 'BRVM',
    sector: 'Télécommunications',
    currentPrice: 12500,
    previousClose: 12200,
    change: 300,
    changePercent: 2.46,
    volume: 15420,
    avgVolume: 12000,
    marketCap: 1250000000000,
    pe: 4.9,
    dividendYield: 6.8,
    addedDate: '2024-01-15',
    tags: ['blue-chip', 'dividende']
  },
  {
    id: 'sgbc-1',
    ticker: 'SGBC',
    companyName: 'Société Générale Côte d\'Ivoire',
    exchange: 'BRVM',
    sector: 'Finance',
    currentPrice: 8750,
    previousClose: 8900,
    change: -150,
    changePercent: -1.69,
    volume: 8200,
    avgVolume: 7500,
    marketCap: 450000000000,
    pe: 8.2,
    dividendYield: 5.2,
    addedDate: '2024-02-10',
    tags: ['banque']
  },
  {
    id: 'ttlc-1',
    ticker: 'TTLC',
    companyName: 'Total Côte d\'Ivoire',
    exchange: 'BRVM',
    sector: 'Énergie',
    currentPrice: 2150,
    previousClose: 2100,
    change: 50,
    changePercent: 2.38,
    volume: 12500,
    avgVolume: 10000,
    marketCap: 215000000000,
    pe: 12.5,
    dividendYield: 4.5,
    addedDate: '2024-01-20',
    tags: ['énergie']
  },
  {
    id: 'palm-1',
    ticker: 'PALM',
    companyName: 'Palmci',
    exchange: 'BRVM',
    sector: 'Agriculture',
    currentPrice: 6800,
    previousClose: 6750,
    change: 50,
    changePercent: 0.74,
    volume: 5200,
    avgVolume: 4800,
    marketCap: 340000000000,
    pe: 15.3,
    dividendYield: 3.8,
    addedDate: '2024-03-05',
    tags: ['agriculture']
  },
  {
    id: 'smbc-1',
    ticker: 'SMBC',
    companyName: 'SMB Côte d\'Ivoire',
    exchange: 'BRVM',
    sector: 'Industrie',
    currentPrice: 9200,
    previousClose: 8950,
    change: 250,
    changePercent: 2.79,
    volume: 6800,
    avgVolume: 5500,
    marketCap: 460000000000,
    pe: 10.8,
    addedDate: '2024-02-28',
    tags: ['industrie', 'croissance']
  }
];

// Mock Watchlist
export const DEFAULT_WATCHLIST: Watchlist = {
  id: 'wl-1',
  name: 'Ma Watchlist Principale',
  description: 'Actions suivies quotidiennement',
  stocks: WATCHLIST_STOCKS,
  createdAt: '2024-01-15',
  updatedAt: '2024-03-05',
  color: '#3b82f6',
  isDefault: true
};

// Mock Alerts
export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    stockId: 'snts-1',
    ticker: 'SNTS',
    companyName: 'Sonatel',
    type: 'price_up',
    status: 'active',
    condition: 'price > 13000',
    targetValue: 13000,
    message: 'Sonatel a dépassé 13,000 XOF',
    createdAt: '2024-03-01',
    notifyEmail: true,
    notifyPush: true
  },
  {
    id: 'alert-2',
    stockId: 'sgbc-1',
    ticker: 'SGBC',
    companyName: 'Société Générale CI',
    type: 'price_down',
    status: 'triggered',
    condition: 'price < 9000',
    targetValue: 9000,
    message: 'SGBC est passé sous 9,000 XOF',
    createdAt: '2024-02-15',
    triggeredAt: '2024-03-10',
    notifyEmail: true
  },
  {
    id: 'alert-3',
    stockId: 'ttlc-1',
    ticker: 'TTLC',
    companyName: 'Total CI',
    type: 'volume',
    status: 'active',
    condition: 'volume > 15000',
    targetValue: 15000,
    message: 'Volume anormal détecté sur TTLC',
    createdAt: '2024-03-05',
    notifyPush: true
  },
  {
    id: 'alert-4',
    stockId: 'snts-1',
    ticker: 'SNTS',
    companyName: 'Sonatel',
    type: 'dividend',
    status: 'active',
    condition: 'dividend_announcement',
    message: 'Annonce de dividende pour Sonatel',
    createdAt: '2024-01-20',
    notifyEmail: true,
    notifyPush: true
  }
];

// Mock Transactions
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    portfolioId: 'pf-1',
    stockId: 'snts-1',
    ticker: 'SNTS',
    companyName: 'Sonatel',
    type: 'buy',
    quantity: 50,
    price: 11800,
    totalAmount: 590000,
    fees: 2950,
    date: '2024-01-20',
    createdAt: '2024-01-20'
  },
  {
    id: 'tx-2',
    portfolioId: 'pf-1',
    stockId: 'sgbc-1',
    ticker: 'SGBC',
    companyName: 'Société Générale CI',
    type: 'buy',
    quantity: 100,
    price: 8500,
    totalAmount: 850000,
    fees: 4250,
    date: '2024-02-15',
    createdAt: '2024-02-15'
  },
  {
    id: 'tx-3',
    portfolioId: 'pf-1',
    stockId: 'ttlc-1',
    ticker: 'TTLC',
    companyName: 'Total CI',
    type: 'buy',
    quantity: 200,
    price: 2050,
    totalAmount: 410000,
    fees: 2050,
    date: '2024-02-20',
    createdAt: '2024-02-20'
  },
  {
    id: 'tx-4',
    portfolioId: 'pf-1',
    stockId: 'palm-1',
    ticker: 'PALM',
    companyName: 'Palmci',
    type: 'buy',
    quantity: 80,
    price: 6500,
    totalAmount: 520000,
    fees: 2600,
    date: '2024-03-05',
    createdAt: '2024-03-05'
  },
  {
    id: 'tx-5',
    portfolioId: 'pf-1',
    stockId: 'snts-1',
    ticker: 'SNTS',
    companyName: 'Sonatel',
    type: 'buy',
    quantity: 30,
    price: 12000,
    totalAmount: 360000,
    fees: 1800,
    date: '2024-03-10',
    createdAt: '2024-03-10'
  }
];

// Mock Portfolio Positions
export const MOCK_POSITIONS: Position[] = [
  {
    stockId: 'snts-1',
    ticker: 'SNTS',
    companyName: 'Sonatel',
    exchange: 'BRVM',
    sector: 'Télécommunications',
    quantity: 80,
    avgBuyPrice: 11875,
    totalInvested: 950000,
    currentPrice: 12500,
    currentValue: 1000000,
    unrealizedGain: 50000,
    unrealizedGainPercent: 5.26,
    weight: 35.7,
    dividendsReceived: 27200,
    firstBuyDate: '2024-01-20',
    lastTransactionDate: '2024-03-10'
  },
  {
    stockId: 'sgbc-1',
    ticker: 'SGBC',
    companyName: 'Société Générale CI',
    exchange: 'BRVM',
    sector: 'Finance',
    quantity: 100,
    avgBuyPrice: 8500,
    totalInvested: 850000,
    currentPrice: 8750,
    currentValue: 875000,
    unrealizedGain: 25000,
    unrealizedGainPercent: 2.94,
    weight: 31.3,
    dividendsReceived: 18200,
    firstBuyDate: '2024-02-15',
    lastTransactionDate: '2024-02-15'
  },
  {
    stockId: 'ttlc-1',
    ticker: 'TTLC',
    companyName: 'Total CI',
    exchange: 'BRVM',
    sector: 'Énergie',
    quantity: 200,
    avgBuyPrice: 2050,
    totalInvested: 410000,
    currentPrice: 2150,
    currentValue: 430000,
    unrealizedGain: 20000,
    unrealizedGainPercent: 4.88,
    weight: 15.4,
    dividendsReceived: 7740,
    firstBuyDate: '2024-02-20',
    lastTransactionDate: '2024-02-20'
  },
  {
    stockId: 'palm-1',
    ticker: 'PALM',
    companyName: 'Palmci',
    exchange: 'BRVM',
    sector: 'Agriculture',
    quantity: 80,
    avgBuyPrice: 6500,
    totalInvested: 520000,
    currentPrice: 6800,
    currentValue: 544000,
    unrealizedGain: 24000,
    unrealizedGainPercent: 4.62,
    weight: 19.5,
    dividendsReceived: 10336,
    firstBuyDate: '2024-03-05',
    lastTransactionDate: '2024-03-05'
  }
];

// Mock Portfolio
export const MOCK_PORTFOLIO: Portfolio = {
  id: 'pf-1',
  name: 'Mon Portfolio Principal',
  description: 'Stratégie diversifiée BRVM',
  initialCapital: 5000000,
  currentCash: 2206850,
  totalInvested: 2730000,
  currentValue: 2849000,
  totalGain: 119000,
  totalGainPercent: 4.36,
  positions: MOCK_POSITIONS,
  transactions: MOCK_TRANSACTIONS,
  numberOfStocks: 4,
  bestPerformer: MOCK_POSITIONS[0],
  worstPerformer: MOCK_POSITIONS[1],
  createdAt: '2024-01-15',
  updatedAt: '2024-03-15'
};

// Mock Portfolio Stats
export const MOCK_PORTFOLIO_STATS: PortfolioStats = {
  dailyReturn: 0.85,
  weeklyReturn: 2.1,
  monthlyReturn: 4.36,
  yearlyReturn: 4.36,
  totalReturn: 4.36,
  volatility: 8.5,
  sharpeRatio: 0.51,
  maxDrawdown: -3.2,
  sectorAllocation: [
    { sector: 'Télécommunications', value: 1000000, percent: 35.1 },
    { sector: 'Finance', value: 875000, percent: 30.7 },
    { sector: 'Agriculture', value: 544000, percent: 19.1 },
    { sector: 'Énergie', value: 430000, percent: 15.1 }
  ],
  exchangeAllocation: [
    { exchange: 'BRVM', value: 2849000, percent: 100 }
  ],
  totalTransactions: 5,
  totalBuys: 5,
  totalSells: 0,
  avgHoldingPeriod: 45,
  totalDividends: 63476,
  dividendYield: 2.32
};

// Mock Performance History (last 30 days)
export const MOCK_PERFORMANCE_HISTORY: PerformanceHistory[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  const baseValue = 2730000;
  const randomReturn = (Math.random() - 0.5) * 0.02; // -1% to +1%
  const cumulativeReturn = (i / 30) * 0.0436; // 4.36% over 30 days
  const portfolioValue = baseValue * (1 + cumulativeReturn + randomReturn);
  
  return {
    date: date.toISOString().split('T')[0],
    portfolioValue: Math.round(portfolioValue),
    cashValue: 2206850,
    investedValue: Math.round(portfolioValue) - 2206850,
    totalReturn: ((portfolioValue - baseValue) / baseValue) * 100,
    dailyReturn: i === 0 ? 0 : randomReturn * 100
  };
});

// Mock Quick Stats
export const MOCK_QUICK_STATS: QuickStats = {
  totalWatchlistStocks: 5,
  activeAlerts: 3,
  portfolioValue: 5055850,
  todayGain: 42850,
  todayGainPercent: 0.85
};

// Utility Functions
export function formatCurrency(value: number, currency: string = 'XOF'): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)}B ${currency}`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M ${currency}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K ${currency}`;
  }
  return `${value.toLocaleString()} ${currency}`;
}

export function formatPercent(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function calculatePortfolioValue(portfolio: Portfolio): number {
  const positionsValue = portfolio.positions.reduce((sum, pos) => sum + pos.currentValue, 0);
  return positionsValue + portfolio.currentCash;
}

export function calculateTotalGain(portfolio: Portfolio): { gain: number; percent: number } {
  const totalValue = calculatePortfolioValue(portfolio);
  const gain = totalValue - portfolio.initialCapital;
  const percent = (gain / portfolio.initialCapital) * 100;
  return { gain, percent };
}

export function getAlertIcon(type: string): string {
  const icons: Record<string, string> = {
    price_up: '📈',
    price_down: '📉',
    volume: '📊',
    earnings: '💰',
    dividend: '💵',
    news: '📰'
  };
  return icons[type] || '🔔';
}

export function getAlertColor(type: string): string {
  const colors: Record<string, string> = {
    price_up: '#10b981',
    price_down: '#ef4444',
    volume: '#3b82f6',
    earnings: '#f59e0b',
    dividend: '#8b5cf6',
    news: '#6366f1'
  };
  return colors[type] || '#64748b';
}
