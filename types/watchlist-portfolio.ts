// Watchlist & Portfolio Types

export type AlertType = 'price_up' | 'price_down' | 'volume' | 'earnings' | 'dividend' | 'news';
export type AlertStatus = 'active' | 'triggered' | 'expired';
export type TransactionType = 'buy' | 'sell';
export type PortfolioViewType = 'sector' | 'exchange' | 'performance';

// Stock in Watchlist
export interface WatchlistStock {
  id: string;
  ticker: string;
  companyName: string;
  exchange: string;
  sector: string;
  
  // Current Price Data
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  
  // Volume
  volume: number;
  avgVolume: number;
  
  // Additional Info
  marketCap: number;
  pe?: number;
  dividendYield?: number;
  
  // Watchlist specific
  addedDate: string;
  notes?: string;
  tags?: string[];
}

// Watchlist
export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  stocks: WatchlistStock[];
  createdAt: string;
  updatedAt: string;
  color?: string;
  isDefault?: boolean;
}

// Alert
export interface Alert {
  id: string;
  stockId: string;
  ticker: string;
  companyName: string;
  
  type: AlertType;
  status: AlertStatus;
  
  // Conditions
  condition: string; // e.g., "price > 15000", "change% > 5"
  targetValue?: number;
  
  // Notification
  message: string;
  triggeredAt?: string;
  createdAt: string;
  expiresAt?: string;
  
  // Settings
  notifyEmail?: boolean;
  notifyPush?: boolean;
  repeatDaily?: boolean;
}

// Portfolio Transaction
export interface Transaction {
  id: string;
  portfolioId: string;
  stockId: string;
  ticker: string;
  companyName: string;
  
  type: TransactionType;
  quantity: number;
  price: number;
  totalAmount: number;
  
  fees?: number;
  notes?: string;
  
  date: string;
  createdAt: string;
}

// Portfolio Position
export interface Position {
  stockId: string;
  ticker: string;
  companyName: string;
  exchange: string;
  sector: string;
  
  // Position Data
  quantity: number;
  avgBuyPrice: number;
  totalInvested: number;
  
  // Current Value
  currentPrice: number;
  currentValue: number;
  
  // Performance
  unrealizedGain: number;
  unrealizedGainPercent: number;
  
  // Additional
  weight: number; // % of portfolio
  dividendsReceived?: number;
  
  // History
  firstBuyDate: string;
  lastTransactionDate: string;
}

// Portfolio
export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  
  // Capital
  initialCapital: number;
  currentCash: number;
  totalInvested: number;
  currentValue: number;
  
  // Performance
  totalGain: number;
  totalGainPercent: number;
  
  // Positions
  positions: Position[];
  transactions: Transaction[];
  
  // Stats
  numberOfStocks: number;
  bestPerformer?: Position;
  worstPerformer?: Position;
  
  // Dates
  createdAt: string;
  updatedAt: string;
}

// Portfolio Statistics
export interface PortfolioStats {
  // Returns
  dailyReturn: number;
  weeklyReturn: number;
  monthlyReturn: number;
  yearlyReturn: number;
  totalReturn: number;
  
  // Risk
  volatility: number; // Standard deviation
  sharpeRatio?: number;
  maxDrawdown: number;
  
  // Diversification
  sectorAllocation: { sector: string; value: number; percent: number }[];
  exchangeAllocation: { exchange: string; value: number; percent: number }[];
  
  // Activity
  totalTransactions: number;
  totalBuys: number;
  totalSells: number;
  avgHoldingPeriod: number; // days
  
  // Dividends
  totalDividends: number;
  dividendYield: number;
}

// Portfolio Performance History
export interface PerformanceHistory {
  date: string;
  portfolioValue: number;
  cashValue: number;
  investedValue: number;
  totalReturn: number;
  dailyReturn: number;
}

// Export Options
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeTransactions: boolean;
  includePerformance: boolean;
  includeCharts: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

// Filters
export interface WatchlistFilters {
  exchanges?: string[];
  sectors?: string[];
  minPrice?: number;
  maxPrice?: number;
  minChange?: number;
  maxChange?: number;
  tags?: string[];
}

export interface PortfolioFilters {
  sectors?: string[];
  exchanges?: string[];
  minGain?: number;
  maxGain?: number;
  minWeight?: number;
}

// Quick Stats
export interface QuickStats {
  totalWatchlistStocks: number;
  activeAlerts: number;
  portfolioValue: number;
  todayGain: number;
  todayGainPercent: number;
}
