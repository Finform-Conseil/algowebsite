import { StockExchange, ExchangeInsight, ListedStock } from '@/types/exchanges';

export const AFRICAN_EXCHANGES: StockExchange[] = [
  {
    id: 'brvm',
    name: 'Bourse Régionale des Valeurs Mobilières',
    shortName: 'BRVM',
    country: "Côte d'Ivoire",
    region: 'West Africa',
    currency: 'XOF',
    timezone: 'UTC',
    logo: '/exchanges/brvm-logo.png',
    website: 'www.brvm.org',
    
    listedCompanies: 140,
    totalMarketCap: 45.2,
    averageMarketCap: 322.8,
    dailyVolume: 12.5,
    
    indexName: 'BRVM 10',
    indexValue: 245.68,
    indexChange: 2.15,
    indexChangePercent: 0.88,
    ytdReturn: 18.5,
    oneYearReturn: 24.3,
    threeYearReturn: 42.8,
    volatility: 18.2,
  
    dominantSectors: ['Banking', 'Telecommunications', 'Industry', 'Utilities'],
    
    liquidity: 'medium',
    growth: 'high',
    dynamism: 78,
    
    monthlyReturns: [2.1, 1.8, 3.2, -0.5, 2.8, 1.5, 4.1, 2.3, 1.9, 3.5, 2.7, 1.8],
    volumes: [8.2, 9.5, 11.3, 10.8, 12.1, 11.5, 13.2, 12.8, 11.9, 12.5, 13.8, 12.5],
    
    description: 'BRVM serves 8 WAEMU countries and represents the main stock exchange in the West African sub-region.',
    foundedYear: 1998,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'jse',
    name: 'Johannesburg Stock Exchange',
    shortName: 'JSE',
    country: 'South Africa',
    region: 'Southern Africa',
    currency: 'ZAR',
    timezone: 'UTC+2',
    logo: '/exchanges/jse-logo.png',
    website: 'www.jse.co.za',
    
    listedCompanies: 420,
    totalMarketCap: 1250.8,
    averageMarketCap: 2987.6,
    dailyVolume: 180.5,
    
    indexName: 'JSE All Share',
    indexValue: 78542.32,
    indexChange: -125.68,
    indexChangePercent: -0.16,
    ytdReturn: 8.3,
    oneYearReturn: 12.7,
    threeYearReturn: 28.9,
    volatility: 22.4,
    
    dominantSectors: ['Mining Resources', 'Finance', 'Consumer Goods', 'Telecommunications'],
    
    liquidity: 'high',
    growth: 'medium',
    dynamism: 65,
    
    monthlyReturns: [1.2, -0.8, 2.5, 1.8, -1.2, 3.1, 2.2, -0.5, 1.9, 2.8, 1.5, 0.8],
    volumes: [165.2, 172.8, 188.5, 195.3, 178.9, 192.1, 185.7, 190.4, 188.2, 192.8, 195.5, 180.5],
    
    description: 'Africa\'s largest stock exchange by capitalization, JSE is a mature and diversified market.',
    foundedYear: 1887,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'ngx',
    name: 'Nigerian Exchange Group',
    shortName: 'NGX',
    country: 'Nigeria',
    region: 'West Africa',
    currency: 'NGN',
    timezone: 'UTC+1',
    logo: '/exchanges/ngx-logo.jpg',
    website: 'www.ngxgroup.com',
    
    listedCompanies: 165,
    totalMarketCap: 58.3,
    averageMarketCap: 353.3,
    dailyVolume: 25.8,
    
    indexName: 'NGX All-Share',
    indexValue: 98547.26,
    indexChange: 325.42,
    indexChangePercent: 0.33,
    ytdReturn: 32.1,
    oneYearReturn: 45.8,
    threeYearReturn: 68.5,
    volatility: 28.7,
    
    dominantSectors: ['Banking', 'Oil and Gas', 'Consumer Goods', 'Telecommunications'],
    
    liquidity: 'medium',
    growth: 'high',
    dynamism: 85,
    
    monthlyReturns: [3.5, 4.2, 2.8, 5.1, 3.9, 4.5, 6.2, 5.8, 4.3, 5.7, 6.1, 5.2],
    volumes: [22.1, 24.5, 26.8, 28.3, 25.9, 27.2, 29.1, 28.5, 26.7, 27.8, 29.5, 25.8],
    
    description: 'NGX is West Africa\'s largest market with strong volume growth.',
    foundedYear: 1960,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'cse',
    name: 'Casablanca Stock Exchange',
    shortName: 'CSE',
    country: 'Morocco',
    region: 'North Africa',
    currency: 'MAD',
    timezone: 'UTC+1',
    logo: '/exchanges/cse-logo.jpeg',
    website: 'www.casablanca-bourse.com',
    
    listedCompanies: 78,
    totalMarketCap: 72.5,
    averageMarketCap: 929.5,
    dailyVolume: 18.3,
    
    indexName: 'MASI',
    indexValue: 13428.56,
    indexChange: 45.23,
    indexChangePercent: 0.34,
    ytdReturn: 15.8,
    oneYearReturn: 22.1,
    threeYearReturn: 38.4,
    volatility: 19.6,
    
    dominantSectors: ['Banking', 'Real Estate', 'Industry', 'Telecommunications'],
    
    liquidity: 'medium',
    growth: 'medium',
    dynamism: 62,
    
    monthlyReturns: [1.8, 2.3, 1.5, 2.9, 2.1, 1.7, 3.2, 2.8, 2.4, 3.1, 2.9, 2.5],
    volumes: [15.2, 16.8, 17.5, 18.9, 17.1, 16.5, 19.2, 18.7, 17.8, 18.3, 19.1, 18.3],
    
    description: 'Casablanca Stock Exchange is North Africa\'s largest with a strong banking presence.',
    foundedYear: 1929,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'nse',
    name: 'Nairobi Securities Exchange',
    shortName: 'NSE',
    country: 'Kenya',
    region: 'East Africa',
    currency: 'KES',
    timezone: 'UTC+3',
    logo: '/exchanges/nse-logo.jpeg',
    website: 'www.nse.co.ke',
    
    listedCompanies: 66,
    totalMarketCap: 28.7,
    averageMarketCap: 434.8,
    dailyVolume: 8.5,
    
    indexName: 'NSE 20 Share Index',
    indexValue: 2148.92,
    indexChange: 12.35,
    indexChangePercent: 0.58,
    ytdReturn: 12.3,
    oneYearReturn: 18.5,
    threeYearReturn: 35.2,
    volatility: 24.1,
    
    dominantSectors: ['Banking', 'Telecommunications', 'Trade', 'Energy'],
    
    liquidity: 'low',
    growth: 'medium',
    dynamism: 58,
    
    monthlyReturns: [2.1, 1.5, 2.8, 1.9, 2.5, 1.8, 3.1, 2.7, 2.2, 2.9, 3.0, 2.6],
    volumes: [7.2, 7.8, 8.5, 8.9, 8.1, 7.9, 9.2, 8.7, 8.3, 8.5, 8.9, 8.5],
    
    description: 'NSE is East Africa\'s main market with strong technological growth.',
    foundedYear: 1954,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'gse',
    name: 'Ghana Stock Exchange',
    shortName: 'GSE',
    country: 'Ghana',
    region: 'West Africa',
    currency: 'GHS',
    timezone: 'UTC',
    logo: '/exchanges/gse-logo.jpg',
    website: 'www.gse.com.gh',
    
    listedCompanies: 42,
    totalMarketCap: 12.8,
    averageMarketCap: 304.8,
    dailyVolume: 3.2,
    
    indexName: 'GSE Composite Index',
    indexValue: 3254.78,
    indexChange: 18.92,
    indexChangePercent: 0.58,
    ytdReturn: 28.5,
    oneYearReturn: 41.2,
    threeYearReturn: 65.8,
    volatility: 26.3,
    
    dominantSectors: ['Banking', 'Natural Resources', 'Telecommunications', 'Consumer Goods'],
    
    liquidity: 'low',
    growth: 'high',
    dynamism: 72,
    
    monthlyReturns: [4.2, 3.8, 5.1, 4.5, 5.8, 4.9, 6.2, 5.7, 5.1, 5.9, 6.3, 5.8],
    volumes: [2.8, 3.1, 3.5, 3.8, 3.2, 3.0, 3.9, 3.7, 3.4, 3.6, 3.8, 3.2],
    
    description: 'GSE is an emerging market with strong index and volume growth.',
    foundedYear: 1990,
    lastUpdated: '2024-01-15T16:30:00Z'
  }
];

export const EXCHANGE_INSIGHTS: ExchangeInsight[] = [
  {
    id: '1',
    type: 'performance',
    title: 'Best YTD Performance',
    description: 'NGX shows the best year-to-date performance with +32.1%',
    exchangeId: 'ngx',
    value: '+32.1%',
    trend: 'up',
    timestamp: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    type: 'liquidity',
    title: 'Most Liquid Exchange',
    description: 'JSE remains Africa\'s most liquid exchange with $180.5M daily volume',
    exchangeId: 'jse',
    value: '$180.5M',
    trend: 'up',
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    type: 'growth',
    title: 'Volume Growth',
    description: 'BRVM shows the strongest 6-month volume growth (+45%)',
    exchangeId: 'brvm',
    value: '+45%',
    trend: 'up',
    timestamp: '2024-01-15T09:30:00Z'
  },
  {
    id: '4',
    type: 'risk',
    title: 'High Volatility',
    description: 'NGX shows volatility above the regional average (28.7%)',
    exchangeId: 'ngx',
    value: '28.7%',
    trend: 'neutral',
    timestamp: '2024-01-15T09:45:00Z'
  }
];

export const REGIONS = [
  { id: 'west', name: 'West Africa', exchanges: ['brvm', 'ngx', 'gse'] },
  { id: 'east', name: 'East Africa', exchanges: ['nse'] },
  { id: 'north', name: 'North Africa', exchanges: ['cse'] },
  { id: 'south', name: 'Southern Africa', exchanges: ['jse'] }
];

export const COMPARISON_METRICS = [
  { key: 'totalMarketCap', label: 'Market Cap', type: 'size', format: 'currency' },
  { key: 'dailyVolume', label: 'Daily Volume', type: 'liquidity', format: 'currency' },
  { key: 'ytdReturn', label: 'YTD Performance', type: 'performance', format: 'percentage' },
  { key: 'oneYearReturn', label: '1Y Performance', type: 'performance', format: 'percentage' },
  { key: 'volatility', label: 'Volatility', type: 'risk', format: 'percentage' },
  { key: 'listedCompanies', label: 'Listed Companies', type: 'size', format: 'number' },
  { key: 'dynamism', label: 'Dynamism', type: 'growth', format: 'number' }
] as const;
