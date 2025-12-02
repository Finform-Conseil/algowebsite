// ============================================
// QUANTUM LEDGER - Asset Interface & Data
// ============================================

export type AssetType = 'Equity' | 'Fixed Income' | 'OPCVM';

export interface Asset {
  id: string;
  ticker: string;
  name: string;
  type: AssetType;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
}

// ============================================
// Données Factices - Assets
// ============================================

export const DUMMY_ASSETS: Asset[] = [
  {
    id: 'asset-1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    type: 'Equity',
    currentPrice: 178.45,
    dailyChange: 2.35,
    dailyChangePercent: 1.33,
  },
  {
    id: 'asset-2',
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    type: 'Equity',
    currentPrice: 378.91,
    dailyChange: -3.12,
    dailyChangePercent: -0.82,
  },
  {
    id: 'asset-3',
    ticker: 'GOOGL',
    name: 'Alphabet Inc.',
    type: 'Equity',
    currentPrice: 141.23,
    dailyChange: 4.87,
    dailyChangePercent: 3.57,
  },
  {
    id: 'asset-4',
    ticker: 'AMZN',
    name: 'Amazon.com Inc.',
    type: 'Equity',
    currentPrice: 152.67,
    dailyChange: -1.45,
    dailyChangePercent: -0.94,
  },
  {
    id: 'asset-5',
    ticker: 'TSLA',
    name: 'Tesla Inc.',
    type: 'Equity',
    currentPrice: 242.18,
    dailyChange: 8.92,
    dailyChangePercent: 3.82,
  },
  {
    id: 'asset-6',
    ticker: 'JPM',
    name: 'JPMorgan Chase & Co.',
    type: 'Equity',
    currentPrice: 156.34,
    dailyChange: 1.12,
    dailyChangePercent: 0.72,
  },
  {
    id: 'asset-7',
    ticker: 'V',
    name: 'Visa Inc.',
    type: 'Equity',
    currentPrice: 265.78,
    dailyChange: -2.34,
    dailyChangePercent: -0.87,
  },
  {
    id: 'asset-8',
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    type: 'Equity',
    currentPrice: 478.32,
    dailyChange: 15.67,
    dailyChangePercent: 3.39,
  },
  {
    id: 'asset-9',
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    type: 'Fixed Income',
    currentPrice: 75.23,
    dailyChange: 0.12,
    dailyChangePercent: 0.16,
  },
  {
    id: 'asset-10',
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    type: 'Fixed Income',
    currentPrice: 102.45,
    dailyChange: -0.08,
    dailyChangePercent: -0.08,
  },
  {
    id: 'asset-11',
    ticker: 'CARMIGNAC',
    name: 'Carmignac Patrimoine',
    type: 'OPCVM',
    currentPrice: 612.34,
    dailyChange: 3.45,
    dailyChangePercent: 0.57,
  },
  {
    id: 'asset-12',
    ticker: 'EUROSE',
    name: 'Eurose Fund',
    type: 'OPCVM',
    currentPrice: 234.56,
    dailyChange: -1.23,
    dailyChangePercent: -0.52,
  },
];

// Fonction utilitaire pour récupérer un actif par ID
export const getAssetById = (id: string): Asset | undefined => {
  return DUMMY_ASSETS.find(asset => asset.id === id);
};

// Fonction utilitaire pour récupérer les actifs par type
export const getAssetsByType = (type: AssetType): Asset[] => {
  return DUMMY_ASSETS.filter(asset => asset.type === type);
};
