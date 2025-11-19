export interface Sector {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  color: string;
  description: string;
  
  // Structure
  industries: Industry[];
  stockCount: number;
  
  // Capitalisation
  totalMarketCap: number; // en millions USD
  averageMarketCap: number;
  weightInTotal: number; // % dans la capitalisation totale
  
  // Performance
  ytdReturn: number;
  quarterReturn: number;
  yearReturn: number;
  threeYearReturn: number;
  fiveYearReturn: number;
  
  // Risque
  volatility: number; // annualisée
  beta: number;
  sharpeRatio: number;
  
  // Liquidité
  dailyVolume: number; // en millions USD
  averageTurnover: number;
  
  // Fondamentaux moyens
  averagePE: number;
  averageROE: number;
  averageDividendYield: number;
  averageDebtToEquity: number;
  
  // Données historiques
  monthlyReturns: number[];
  quarterlyReturns: number[];
  
  // Par bourse
  exchangeBreakdown: ExchangeSectorData[];
}

export interface Industry {
  id: string;
  name: string;
  nameEn: string;
  sectorId: string;
  stockCount: number;
  totalMarketCap: number;
  ytdReturn: number;
  volatility: number;
  topStocks: string[]; // IDs des actions principales
}

export interface ExchangeSectorData {
  exchangeId: string;
  exchangeName: string;
  stockCount: number;
  marketCap: number;
  weightInExchange: number; // % dans cette bourse
  ytdReturn: number;
  volatility: number;
}

export interface SectorComparison {
  sectorId: string;
  sectorName: string;
  exchanges: {
    exchangeId: string;
    marketCap: number;
    stockCount: number;
    performance: number;
    weight: number;
  }[];
}

export interface SectorRanking {
  rank: number;
  sectorId: string;
  sectorName: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  sparklineData: number[];
}

export interface SectorHeatmapCell {
  sectorId: string;
  sectorName: string;
  performance: number;
  volatility: number;
  volume: number;
  weight: number;
  color: string;
}

export type Period = '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y';
export type ComparisonMode = 'inter-bourses' | 'intra-bourse' | 'regional';
export type RankingType = 'growth' | 'profitability' | 'volume';
