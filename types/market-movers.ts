// Market Movers Types

export type Period = 'day' | 'week' | 'month';
export type Exchange = 'BRVM' | 'JSE' | 'CSE' | 'NGX' | 'GSE' | 'NSE' | 'EGX' | 'TUNSE';
export type Sector = 'Finance' | 'Energy' | 'Telecom' | 'Industry' | 'Consumer' | 'Real Estate' | 'Healthcare' | 'Technology' | 'Materials' | 'Services';
export type Currency = 'XOF' | 'ZAR' | 'EGP' | 'NGN' | 'GHS' | 'KES' | 'TND' | 'USD';
export type MarketSentiment = 'bullish' | 'bearish' | 'neutral';

export interface Stock {
  ticker: string;
  name: string;
  exchange: Exchange;
  sector: Sector;
  price: number;
  currency: Currency;
  change: number; // Change in %
  changeValue: number; // Change in value
  volume: number;
  avgVolume: number; // 30-day average volume
  marketCap: number;
  open: number;
  high: number;
  low: number;
  sparklineData: number[]; // Data for mini-chart
  lastUpdate: Date;
}

export interface MarketFilters {
  period: Period;
  exchanges: Exchange[];
  sectors: Sector[];
  currency?: Currency;
  minVolume?: number;
}

export interface MarketIndicators {
  selectedMarket: string;
  avgChange: number;
  totalVolume: number;
  sentiment: MarketSentiment;
  activeStocks: number;
  gainers: number;
  losers: number;
}

export interface HeatmapItem {
  ticker: string;
  name: string;
  sector: Sector;
  exchange: Exchange;
  change: number;
  value: number; // For size (marketCap or volume)
  price: number;
  volume: number;
  marketCap: number;
  sparklineData: number[];
}

export interface MarketInsight {
  id: string;
  type: 'trend' | 'volatility' | 'volume' | 'sector';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
  icon: string;
  data?: any;
}

export interface Alert {
  id: string;
  type: 'gain' | 'loss' | 'volume';
  ticker: string;
  name: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface ComparisonStock {
  ticker: string;
  name: string;
  change: number;
  price: number;
  volume: number;
  sparklineData: number[];
  exchange: Exchange;
  sector: Sector;
}
