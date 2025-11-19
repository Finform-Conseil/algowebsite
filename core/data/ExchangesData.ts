import { StockExchange, ExchangeInsight, ListedStock } from '@/types/exchanges';

export const AFRICAN_EXCHANGES: StockExchange[] = [
  {
    id: 'brvm',
    name: 'Bourse Régionale des Valeurs Mobilières',
    shortName: 'BRVM',
    country: "Côte d'Ivoire",
    region: 'Afrique de l\'Ouest',
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
    
    regulation: {
      level: 'medium',
      description: 'Réglementation AMF ouest-africaine',
      restrictions: ['Limites de participation étrangère', 'Approbation prérequise pour certains investissements']
    },
    foreignAccess: {
      level: 'restricted',
      description: 'Accès ouvert avec certaines conditions',
      requirements: ['Compte en devises', 'Autorisation AMF', 'Minimum d\'investissement']
    },
    marketMaturity: {
      level: 'developing',
      description: 'Marché en développement avec potentiel de croissance'
    },
    dominantSectors: ['Banques', 'Télécommunications', 'Industrie', 'Services publics'],
    tradingHours: {
      open: '09:00',
      close: '16:00',
      lunchBreak: '12:00-13:00',
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    settlementMethod: {
      type: 'T+3',
      description: 'Règlement 3 jours après transaction'
    },
    
    liquidity: 'medium',
    growth: 'high',
    dynamism: 78,
    
    monthlyReturns: [2.1, 1.8, 3.2, -0.5, 2.8, 1.5, 4.1, 2.3, 1.9, 3.5, 2.7, 1.8],
    volumes: [8.2, 9.5, 11.3, 10.8, 12.1, 11.5, 13.2, 12.8, 11.9, 12.5, 13.8, 12.5],
    
    description: 'La BRVM dessert 8 pays de l\'UEMOA et représente la principale bourse de la sous-région ouest-africaine.',
    foundedYear: 1998,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'jse',
    name: 'Johannesburg Stock Exchange',
    shortName: 'JSE',
    country: 'Afrique du Sud',
    region: 'Afrique Australe',
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
    
    regulation: {
      level: 'high',
      description: 'Réglementation FSB robuste',
      restrictions: ['Règles de divulgation strictes', 'Protection des investisseurs']
    },
    foreignAccess: {
      level: 'open',
      description: 'Accès complètement ouvert aux investisseurs étrangers',
      requirements: ['Compte de trading', 'Connaissance KYC']
    },
    marketMaturity: {
      level: 'mature',
      description: 'Marché mature et liquide'
    },
    dominantSectors: ['Ressources minières', 'Finance', 'Biens de consommation', 'Télécommunications'],
    tradingHours: {
      open: '09:00',
      close: '17:00',
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    settlementMethod: {
      type: 'T+3',
      description: 'Règlement 3 jours après transaction'
    },
    
    liquidity: 'high',
    growth: 'medium',
    dynamism: 65,
    
    monthlyReturns: [1.2, -0.8, 2.5, 1.8, -1.2, 3.1, 2.2, -0.5, 1.9, 2.8, 1.5, 0.8],
    volumes: [165.2, 172.8, 188.5, 195.3, 178.9, 192.1, 185.7, 190.4, 188.2, 192.8, 195.5, 180.5],
    
    description: 'Plus grande bourse d\'Afrique par capitalisation, le JSE est un marché mature et diversifié.',
    foundedYear: 1887,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'ngx',
    name: 'Nigerian Exchange Group',
    shortName: 'NGX',
    country: 'Nigeria',
    region: 'Afrique de l\'Ouest',
    currency: 'NGN',
    timezone: 'UTC+1',
    logo: '/exchanges/ngx-logo.png',
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
    
    regulation: {
      level: 'medium',
      description: 'Réglementation SEC en cours de modernisation',
      restrictions: ['Limites de participation étrangère sectorielles']
    },
    foreignAccess: {
      level: 'restricted',
      description: 'Accès ouvert avec restrictions sectorielles',
      requirements: ['Enregistrement SEC', 'Approbation sectorielle']
    },
    marketMaturity: {
      level: 'developing',
      description: 'Marché en développement avec forte croissance'
    },
    dominantSectors: ['Banques', 'Pétrole et Gaz', 'Biens de consommation', 'Télécommunications'],
    tradingHours: {
      open: '09:30',
      close: '15:30',
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    settlementMethod: {
      type: 'T+3',
      description: 'Règlement 3 jours après transaction'
    },
    
    liquidity: 'medium',
    growth: 'high',
    dynamism: 85,
    
    monthlyReturns: [3.5, 4.2, 2.8, 5.1, 3.9, 4.5, 6.2, 5.8, 4.3, 5.7, 6.1, 5.2],
    volumes: [22.1, 24.5, 26.8, 28.3, 25.9, 27.2, 29.1, 28.5, 26.7, 27.8, 29.5, 25.8],
    
    description: 'Le NGX est le plus grand marché d\'Afrique de l\'Ouest avec une forte croissance des volumes.',
    foundedYear: 1960,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'cse',
    name: 'Casablanca Stock Exchange',
    shortName: 'CSE',
    country: 'Maroc',
    region: 'Afrique du Nord',
    currency: 'MAD',
    timezone: 'UTC+1',
    logo: '/exchanges/cse-logo.png',
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
    
    regulation: {
      level: 'high',
      description: 'Réglementation AMMC moderne',
      restrictions: ['Normes européennes adaptées']
    },
    foreignAccess: {
      level: 'open',
      description: 'Accès ouvert et attractif pour les investisseurs étrangers',
      requirements: ['Compte titres', 'Identification fiscale']
    },
    marketMaturity: {
      level: 'mature',
      description: 'Marché mature et bien régulé'
    },
    dominantSectors: ['Banques', 'Immobilier', 'Industrie', 'Télécommunications'],
    tradingHours: {
      open: '09:00',
      close: '15:30',
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    settlementMethod: {
      type: 'T+3',
      description: 'Règlement 3 jours après transaction'
    },
    
    liquidity: 'medium',
    growth: 'medium',
    dynamism: 62,
    
    monthlyReturns: [1.8, 2.3, 1.5, 2.9, 2.1, 1.7, 3.2, 2.8, 2.4, 3.1, 2.9, 2.5],
    volumes: [15.2, 16.8, 17.5, 18.9, 17.1, 16.5, 19.2, 18.7, 17.8, 18.3, 19.1, 18.3],
    
    description: 'La Bourse de Casablanca est la plus grande d\'Afrique du Nord avec une forte présence bancaire.',
    foundedYear: 1929,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'nse',
    name: 'Nairobi Securities Exchange',
    shortName: 'NSE',
    country: 'Kenya',
    region: 'Afrique de l\'Est',
    currency: 'KES',
    timezone: 'UTC+3',
    logo: '/exchanges/nse-logo.png',
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
    
    regulation: {
      level: 'medium',
      description: 'Réglementation CMA en développement',
      restrictions: ['Limites sectorielles pour étrangers']
    },
    foreignAccess: {
      level: 'restricted',
      description: 'Accès ouvert avec certaines restrictions',
      requirements: ['CDS account', 'Investor eligibility']
    },
    marketMaturity: {
      level: 'developing',
      description: 'Marché en développement avec potentiel technologique'
    },
    dominantSectors: ['Banques', 'Télécommunications', 'Commerce', 'Énergie'],
    tradingHours: {
      open: '09:00',
      close: '15:00',
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    settlementMethod: {
      type: 'T+3',
      description: 'Règlement 3 jours après transaction'
    },
    
    liquidity: 'low',
    growth: 'medium',
    dynamism: 58,
    
    monthlyReturns: [2.1, 1.5, 2.8, 1.9, 2.5, 1.8, 3.1, 2.7, 2.2, 2.9, 3.0, 2.6],
    volumes: [7.2, 7.8, 8.5, 8.9, 8.1, 7.9, 9.2, 8.7, 8.3, 8.5, 8.9, 8.5],
    
    description: 'Le NSE est le principal marché d\'Afrique de l\'Est avec une forte croissance technologique.',
    foundedYear: 1954,
    lastUpdated: '2024-01-15T16:30:00Z'
  },
  
  {
    id: 'gse',
    name: 'Ghana Stock Exchange',
    shortName: 'GSE',
    country: 'Ghana',
    region: 'Afrique de l\'Ouest',
    currency: 'GHS',
    timezone: 'UTC',
    logo: '/exchanges/gse-logo.png',
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
    
    regulation: {
      level: 'medium',
      description: 'Réglementation SEC en modernisation',
      restrictions: ['Participation étrangère limitée']
    },
    foreignAccess: {
      level: 'limited',
      description: 'Accès limité pour les investisseurs étrangers',
      requirements: ['Approbation spéciale', 'Minimum d\'investissement élevé']
    },
    marketMaturity: {
      level: 'developing',
      description: 'Marché émergent avec fort potentiel'
    },
    dominantSectors: ['Banques', 'Ressources naturelles', 'Télécommunications', 'Biens de consommation'],
    tradingHours: {
      open: '09:30',
      close: '15:00',
      days: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
    },
    settlementMethod: {
      type: 'T+3',
      description: 'Règlement 3 jours après transaction'
    },
    
    liquidity: 'low',
    growth: 'high',
    dynamism: 72,
    
    monthlyReturns: [4.2, 3.8, 5.1, 4.5, 5.8, 4.9, 6.2, 5.7, 5.1, 5.9, 6.3, 5.8],
    volumes: [2.8, 3.1, 3.5, 3.8, 3.2, 3.0, 3.9, 3.7, 3.4, 3.6, 3.8, 3.2],
    
    description: 'Le GSE est un marché émergent avec une forte croissance des indices et des volumes.',
    foundedYear: 1990,
    lastUpdated: '2024-01-15T16:30:00Z'
  }
];

export const EXCHANGE_INSIGHTS: ExchangeInsight[] = [
  {
    id: '1',
    type: 'performance',
    title: 'Meilleure performance YTD',
    description: 'Le NGX affiche la meilleure performance depuis le début de l\'année avec +32.1%',
    exchangeId: 'ngx',
    value: '+32.1%',
    trend: 'up',
    timestamp: '2024-01-15T09:00:00Z'
  },
  {
    id: '2',
    type: 'liquidity',
    title: 'Bourse la plus liquide',
    description: 'Le JSE reste la bourse la plus liquide d\'Afrique avec $180.5M de volume quotidien',
    exchangeId: 'jse',
    value: '$180.5M',
    trend: 'up',
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: '3',
    type: 'growth',
    title: 'Croissance des volumes',
    description: 'La BRVM affiche la plus forte croissance des volumes sur 6 mois (+45%)',
    exchangeId: 'brvm',
    value: '+45%',
    trend: 'up',
    timestamp: '2024-01-15T09:30:00Z'
  },
  {
    id: '4',
    type: 'risk',
    title: 'Volatilité élevée',
    description: 'Le NGX présente une volatilité supérieure à la moyenne régionale (28.7%)',
    exchangeId: 'ngx',
    value: '28.7%',
    trend: 'neutral',
    timestamp: '2024-01-15T09:45:00Z'
  }
];

// Sample listed stocks for each exchange
export const SAMPLE_STOCKS: ListedStock[] = [
  // BRVM stocks
  { id: 'nsia', symbol: 'NSIA', name: 'NSIA Banque', exchangeId: 'brvm', sector: 'Banques', marketCap: 2850, price: 12500, change: 150, changePercent: 1.21, volume: 125000, peRatio: 12.5, dividendYield: 3.2 },
  { id: 'sivm', symbol: 'SIVM', name: 'SIVM', exchangeId: 'brvm', sector: 'Industrie', marketCap: 1850, price: 8500, change: -50, changePercent: -0.58, volume: 85000, peRatio: 15.2, dividendYield: 2.8 },
  { id: 'cie', symbol: 'CIE', name: 'CIE Ivoire', exchangeId: 'brvm', sector: 'Services publics', marketCap: 3200, price: 18500, change: 200, changePercent: 1.09, volume: 95000, peRatio: 18.7, dividendYield: 4.1 },
  
  // JSE stocks
  { id: 'naspers', symbol: 'NPN', name: 'Naspers', exchangeId: 'jse', sector: 'Média', marketCap: 45000, price: 2850, change: -25, changePercent: -0.87, volume: 850000, peRatio: 22.1, dividendYield: 1.5 },
  { id: 'standardbank', symbol: 'SBK', name: 'Standard Bank', exchangeId: 'jse', sector: 'Banques', marketCap: 28000, price: 185, change: 2.5, changePercent: 1.37, volume: 650000, peRatio: 11.8, dividendYield: 4.2 },
  { id: 'anglo', symbol: 'AGL', name: 'Anglo American', exchangeId: 'jse', sector: 'Ressources minières', marketCap: 52000, price: 950, change: 15, changePercent: 1.60, volume: 1200000, peRatio: 14.3, dividendYield: 3.8 },
  
  // NGX stocks
  { id: 'dangote', symbol: 'DANGCEM', name: 'Dangote Cement', exchangeId: 'ngx', sector: 'Construction', marketCap: 8500, price: 285, change: 5.2, changePercent: 1.86, volume: 450000, peRatio: 16.8, dividendYield: 2.9 },
  { id: 'gtbank', symbol: 'GUARANTY', name: 'Guaranty Trust Bank', exchangeId: 'ngx', sector: 'Banques', marketCap: 4200, price: 38.5, change: 0.8, changePercent: 2.12, volume: 380000, peRatio: 8.5, dividendYield: 5.1 },
  { id: 'nestle', symbol: 'NESTLE', name: 'Nestle Nigeria', exchangeId: 'ngx', sector: 'Biens de consommation', marketCap: 3200, price: 1280, change: 15, changePercent: 1.19, volume: 125000, peRatio: 25.6, dividendYield: 3.5 },
  
  // CSE stocks
  { id: 'attijari', symbol: 'ATW', name: 'Attijariwafa Bank', exchangeId: 'cse', sector: 'Banques', marketCap: 6500, price: 485, change: 8.5, changePercent: 1.78, volume: 185000, peRatio: 12.1, dividendYield: 3.8 },
  { id: 'maroctelecom', symbol: 'IAM', name: 'Maroc Telecom', exchangeId: 'cse', sector: 'Télécommunications', marketCap: 7200, price: 125, change: 1.2, changePercent: 0.97, volume: 155000, peRatio: 18.5, dividendYield: 4.2 },
  
  // NSE stocks
  { id: 'safaricom', symbol: 'SCOM', name: 'Safaricom', exchangeId: 'nse', sector: 'Télécommunications', marketCap: 12000, price: 28.5, change: 0.3, changePercent: 1.06, volume: 8500000, peRatio: 15.2, dividendYield: 5.8 },
  { id: 'equity', symbol: 'EQTY', name: 'Equity Group', exchangeId: 'nse', sector: 'Banques', marketCap: 3500, price: 48.2, change: 0.8, changePercent: 1.69, volume: 1200000, peRatio: 9.8, dividendYield: 4.5 },
  
  // GSE stocks
  { id: 'gcb', symbol: 'GCB', name: 'GCB Bank', exchangeId: 'gse', sector: 'Banques', marketCap: 450, price: 5.2, change: 0.05, changePercent: 0.97, volume: 85000, peRatio: 7.2, dividendYield: 6.1 },
  { id: 'mtng', symbol: 'MTNGH', name: 'MTN Ghana', exchangeId: 'gse', sector: 'Télécommunications', marketCap: 850, price: 1.85, change: 0.02, changePercent: 1.09, volume: 125000, peRatio: 12.8, dividendYield: 4.8 }
];

export const REGIONS = [
  { id: 'west', name: 'Afrique de l\'Ouest', exchanges: ['brvm', 'ngx', 'gse'] },
  { id: 'east', name: 'Afrique de l\'Est', exchanges: ['nse'] },
  { id: 'north', name: 'Afrique du Nord', exchanges: ['cse'] },
  { id: 'south', name: 'Afrique Australe', exchanges: ['jse'] }
];

export const COMPARISON_METRICS = [
  { key: 'totalMarketCap', label: 'Capitalisation', type: 'size', format: 'currency' },
  { key: 'dailyVolume', label: 'Volume Quotidien', type: 'liquidity', format: 'currency' },
  { key: 'ytdReturn', label: 'Performance YTD', type: 'performance', format: 'percentage' },
  { key: 'oneYearReturn', label: 'Performance 1A', type: 'performance', format: 'percentage' },
  { key: 'volatility', label: 'Volatilité', type: 'risk', format: 'percentage' },
  { key: 'listedCompanies', label: 'Sociétés Cotées', type: 'size', format: 'number' },
  { key: 'dynamism', label: 'Dynamisme', type: 'growth', format: 'number' }
] as const;
