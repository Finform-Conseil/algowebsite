// Home Page Data - Constants for the homepage carousel

export interface MarketIndex {
  exchange: string;
  name: string;
  value: number;
  change: number;
  chartData: number[];
}

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  image: string;
  market: string;
  date: string;
}

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  sparkline: number[];
}

export interface CountryData {
  code: string;
  name: string;
  flag: string;
}

// Initial Market Indices Data
export const INITIAL_MARKET_INDICES: MarketIndex[] = [
  { exchange: 'BRVM', name: 'BRVM Composite', value: 215.43, change: 0, chartData: [] },
  { exchange: 'NSE', name: 'NSE All-Share', value: 42850.25, change: 0, chartData: [] },
  { exchange: 'JSE', name: 'JSE All-Share', value: 78234.50, change: 0, chartData: [] },
  { exchange: 'EGX', name: 'EGX 30', value: 18456.75, change: 0, chartData: [] },
  { exchange: 'GSE', name: 'GSE Composite', value: 3245.80, change: 0, chartData: [] },
  { exchange: 'CSE', name: 'MASI', value: 12850.30, change: 0, chartData: [] },
];

// Countries Data
export const COUNTRIES_DATA: CountryData[] = [
  { code: 'BRVM', name: 'BRVM', flag: '🇨🇮' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦' },
];

// Top Performing Stocks by Country
export const TOP_STOCKS: Record<string, StockData[]> = {
  BRVM: [
    { ticker: 'SONATEL', name: 'Sonatel Sénégal', price: 18500, change: 5.8, sparkline: [18000, 18100, 18300, 18500] },
    { ticker: 'ECOBANK', name: 'Ecobank Transnational', price: 2850, change: 4.2, sparkline: [2700, 2750, 2800, 2850] },
  ],
  GH: [
    { ticker: 'GCB', name: 'GCB Bank', price: 5.20, change: 3.5, sparkline: [5.0, 5.1, 5.15, 5.20] },
    { ticker: 'MTN', name: 'MTN Ghana', price: 1.45, change: 2.8, sparkline: [1.40, 1.42, 1.44, 1.45] },
  ],
  NG: [
    { ticker: 'DANGCEM', name: 'Dangote Cement', price: 285.50, change: 4.5, sparkline: [270, 275, 280, 285.5] },
    { ticker: 'ZENITH', name: 'Zenith Bank', price: 32.80, change: 3.2, sparkline: [31, 31.5, 32, 32.8] },
  ],
  KE: [
    { ticker: 'SAFCOM', name: 'Safaricom PLC', price: 32.50, change: 3.9, sparkline: [31, 31.5, 32, 32.5] },
    { ticker: 'EQTY', name: 'Equity Group', price: 48.25, change: 2.5, sparkline: [47, 47.5, 48, 48.25] },
  ],
  ZA: [
    { ticker: 'NPN', name: 'Naspers Limited', price: 3245, change: 3.5, sparkline: [3100, 3150, 3200, 3245] },
    { ticker: 'AGL', name: 'Anglo American', price: 425, change: 2.8, sparkline: [410, 415, 420, 425] },
  ],
  MA: [
    { ticker: 'ATW', name: 'Attijariwafa Bank', price: 485, change: 2.2, sparkline: [470, 475, 480, 485] },
    { ticker: 'IAM', name: 'Maroc Telecom', price: 125, change: 1.8, sparkline: [122, 123, 124, 125] },
  ],
};

// Worst Performing Stocks by Country
export const FLOP_STOCKS: Record<string, StockData[]> = {
  BRVM: [
    { ticker: 'PALM', name: 'PALMCI', price: 6200, change: -2.8, sparkline: [6500, 6400, 6300, 6200] },
    { ticker: 'TOTAL', name: 'Total Senegal', price: 2150, change: -1.2, sparkline: [2200, 2180, 2160, 2150] },
  ],
  GH: [
    { ticker: 'CAL', name: 'CAL Bank', price: 0.85, change: -1.5, sparkline: [0.90, 0.88, 0.87, 0.85] },
  ],
  NG: [
    { ticker: 'FBNH', name: 'FBN Holdings', price: 12.50, change: -2.1, sparkline: [13, 12.8, 12.6, 12.5] },
  ],
  KE: [
    { ticker: 'KCB', name: 'KCB Group', price: 38.50, change: -1.8, sparkline: [40, 39.5, 39, 38.5] },
  ],
  ZA: [
    { ticker: 'ANG', name: 'AngloGold Ashanti', price: 285, change: -2.5, sparkline: [295, 290, 287, 285] },
  ],
  MA: [
    { ticker: 'BCP', name: 'BCP', price: 265, change: -1.2, sparkline: [270, 268, 266, 265] },
  ],
};

// News Items
export const NEWS_ITEMS: NewsItem[] = [
  {
    id: '1',
    title: 'BRVM Composite Index Reaches New High',
    description: 'The regional stock exchange continues its upward trajectory as major banks report strong Q4 earnings',
    image: '/images/news1.jpg',
    market: 'BRVM',
    date: '2 hours ago',
  },
  {
    id: '2',
    title: 'Safaricom Announces Major 5G Investment',
    description: 'Kenya\'s leading telecom operator plans to invest $500M in expanding 5G coverage',
    image: '/images/news2.jpg',
    market: 'Kenya',
    date: '5 hours ago',
  },
  {
    id: '3',
    title: 'JSE Mining Sector Rally Continues',
    description: 'South African stocks surge as commodity prices strengthen',
    image: '/images/news3.jpg',
    market: 'South Africa',
    date: '1 day ago',
  },
];
