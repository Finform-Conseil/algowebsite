export interface StockExchange {
  id: string;
  name: string;
  shortName: string;
  country: string;
  region: string;
  currency: string;
  timezone: string;
  logo: string;
  website: string;
  
  // Market Size
  listedCompanies: number;
  totalMarketCap: number; // in billions USD
  averageMarketCap: number; // in millions USD
  dailyVolume: number; // in millions USD
  
  // Performance
  indexName: string;
  indexValue: number;
  indexChange: number;
  indexChangePercent: number;
  ytdReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  volatility: number; // annualized
  
  // Structure
  regulation: RegulationLevel;
  foreignAccess: ForeignAccessLevel;
  marketMaturity: MaturityLevel;
  dominantSectors: string[];
  tradingHours: TradingHours;
  settlementMethod: SettlementMethod;
  
  // Metrics
  liquidity: LiquidityLevel;
  growth: GrowthLevel;
  dynamism: number; // 0-100
  
  // Historical data
  monthlyReturns: number[];
  volumes: number[];
  
  // Additional info
  description: string;
  foundedYear: number;
  lastUpdated: string;
}

export interface RegulationLevel {
  level: 'high' | 'medium' | 'low';
  description: string;
  restrictions: string[];
}

export interface ForeignAccessLevel {
  level: 'open' | 'restricted' | 'limited';
  description: string;
  requirements: string[];
}

export interface MaturityLevel {
  level: 'mature' | 'developing' | 'emerging';
  description: string;
}

export interface TradingHours {
  open: string;
  close: string;
  lunchBreak?: string;
  days: string[];
}

export interface SettlementMethod {
  type: 'T+0' | 'T+1' | 'T+2' | 'T+3';
  description: string;
}

export type LiquidityLevel = 'high' | 'medium' | 'low';
export type GrowthLevel = 'high' | 'medium' | 'low';

export interface ExchangeComparison {
  exchanges: StockExchange[];
  period: '1M' | '3M' | '6M' | '1Y' | '3Y';
  metrics: ComparisonMetric[];
}

export interface ComparisonMetric {
  key: keyof StockExchange;
  label: string;
  type: 'performance' | 'size' | 'liquidity' | 'growth';
  format: 'currency' | 'percentage' | 'number' | 'text';
}

export interface ExchangeInsight {
  id: string;
  type: 'performance' | 'liquidity' | 'growth' | 'risk';
  title: string;
  description: string;
  exchangeId?: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  timestamp: string;
}

export interface ListedStock {
  id: string;
  symbol: string;
  name: string;
  exchangeId: string;
  sector: string;
  marketCap: number; // in millions USD
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  peRatio?: number;
  dividendYield?: number;
}
