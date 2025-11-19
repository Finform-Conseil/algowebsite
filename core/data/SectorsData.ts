import { Sector, Industry } from '@/types/sectors';

export const AFRICAN_SECTORS: Sector[] = [
  {
    id: 'banking',
    name: 'Banques & Services Financiers',
    nameEn: 'Banking & Financial Services',
    icon: 'building',
    color: '#3b82f6',
    description: 'Institutions bancaires, assurances et services financiers',
    
    industries: [
      {
        id: 'commercial-banks',
        name: 'Banques Commerciales',
        nameEn: 'Commercial Banks',
        sectorId: 'banking',
        stockCount: 28,
        totalMarketCap: 45200,
        ytdReturn: 12.5,
        volatility: 18.3,
        topStocks: ['SGCI', 'BOAB', 'ETIT']
      },
      {
        id: 'insurance',
        name: 'Assurances',
        nameEn: 'Insurance',
        sectorId: 'banking',
        stockCount: 15,
        totalMarketCap: 8900,
        ytdReturn: 8.2,
        volatility: 15.7,
        topStocks: ['NSCI', 'SIVC']
      }
    ],
    stockCount: 43,
    
    totalMarketCap: 54100,
    averageMarketCap: 1258,
    weightInTotal: 28.5,
    
    ytdReturn: 11.2,
    quarterReturn: 3.8,
    yearReturn: 15.4,
    threeYearReturn: 42.1,
    fiveYearReturn: 68.3,
    
    volatility: 17.2,
    beta: 1.05,
    sharpeRatio: 0.82,
    
    dailyVolume: 145.5,
    averageTurnover: 2.8,
    
    averagePE: 12.4,
    averageROE: 18.5,
    averageDividendYield: 5.2,
    averageDebtToEquity: 8.5,
    
    monthlyReturns: [1.2, 0.8, 2.1, -0.5, 1.8, 2.3, 1.5, 0.9, 1.7, 2.1, 1.3, 0.8],
    quarterlyReturns: [4.1, 3.6, 4.1, 3.6],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 12, marketCap: 15200, weightInExchange: 33.6, ytdReturn: 10.5, volatility: 16.8 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 18, marketCap: 28500, weightInExchange: 25.2, ytdReturn: 12.1, volatility: 17.5 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 8, marketCap: 7200, weightInExchange: 31.5, ytdReturn: 9.8, volatility: 18.2 },
      { exchangeId: 'cse', exchangeName: 'CSE', stockCount: 5, marketCap: 3200, weightInExchange: 28.1, ytdReturn: 11.5, volatility: 16.5 }
    ]
  },
  {
    id: 'telecom',
    name: 'Télécommunications',
    nameEn: 'Telecommunications',
    icon: 'signal',
    color: '#6366f1',
    description: 'Opérateurs télécoms, fournisseurs internet et services numériques',
    
    industries: [
      {
        id: 'mobile-operators',
        name: 'Opérateurs Mobiles',
        nameEn: 'Mobile Operators',
        sectorId: 'telecom',
        stockCount: 8,
        totalMarketCap: 32100,
        ytdReturn: 18.5,
        volatility: 22.1,
        topStocks: ['ORAC', 'SNTS', 'MTNN']
      }
    ],
    stockCount: 12,
    
    totalMarketCap: 38500,
    averageMarketCap: 3208,
    weightInTotal: 20.3,
    
    ytdReturn: 18.5,
    quarterReturn: 5.2,
    yearReturn: 24.3,
    threeYearReturn: 58.7,
    fiveYearReturn: 92.4,
    
    volatility: 22.1,
    beta: 1.15,
    sharpeRatio: 0.95,
    
    dailyVolume: 98.3,
    averageTurnover: 3.2,
    
    averagePE: 15.8,
    averageROE: 22.3,
    averageDividendYield: 4.1,
    averageDebtToEquity: 1.8,
    
    monthlyReturns: [2.1, 1.5, 2.8, 0.8, 2.3, 1.9, 2.5, 1.2, 1.8, 2.4, 1.6, 1.1],
    quarterlyReturns: [6.4, 4.9, 5.5, 5.1],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 3, marketCap: 8500, weightInExchange: 18.8, ytdReturn: 16.2, volatility: 21.5 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 5, marketCap: 22100, weightInExchange: 19.5, ytdReturn: 19.8, volatility: 22.8 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 3, marketCap: 6200, weightInExchange: 27.1, ytdReturn: 17.5, volatility: 21.8 },
      { exchangeId: 'nse', exchangeName: 'NSE', stockCount: 1, marketCap: 1700, weightInExchange: 15.2, ytdReturn: 18.9, volatility: 22.5 }
    ]
  },
  {
    id: 'industry',
    name: 'Industrie & Manufacturing',
    nameEn: 'Industry & Manufacturing',
    icon: 'factory',
    color: '#64748b',
    description: 'Industries manufacturières, construction et matériaux',
    
    industries: [
      {
        id: 'construction',
        name: 'Construction & BTP',
        nameEn: 'Construction',
        sectorId: 'industry',
        stockCount: 18,
        totalMarketCap: 12500,
        ytdReturn: 9.8,
        volatility: 19.5,
        topStocks: ['CFAC', 'SICC']
      },
      {
        id: 'manufacturing',
        name: 'Manufacturing',
        nameEn: 'Manufacturing',
        sectorId: 'industry',
        stockCount: 22,
        totalMarketCap: 15800,
        ytdReturn: 11.2,
        volatility: 20.3,
        topStocks: ['SMBC', 'NEIC']
      }
    ],
    stockCount: 40,
    
    totalMarketCap: 28300,
    averageMarketCap: 708,
    weightInTotal: 14.9,
    
    ytdReturn: 10.5,
    quarterReturn: 2.8,
    yearReturn: 13.7,
    threeYearReturn: 35.2,
    fiveYearReturn: 54.8,
    
    volatility: 19.9,
    beta: 1.08,
    sharpeRatio: 0.68,
    
    dailyVolume: 62.5,
    averageTurnover: 2.3,
    
    averagePE: 11.2,
    averageROE: 14.8,
    averageDividendYield: 3.8,
    averageDebtToEquity: 2.1,
    
    monthlyReturns: [0.9, 0.7, 1.5, -0.3, 1.2, 1.8, 1.1, 0.8, 1.3, 1.6, 0.9, 0.6],
    quarterlyReturns: [3.1, 2.7, 3.2, 2.8],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 15, marketCap: 9800, weightInExchange: 21.7, ytdReturn: 9.5, volatility: 19.2 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 12, marketCap: 12500, weightInExchange: 11.0, ytdReturn: 11.2, volatility: 20.5 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 8, marketCap: 4200, weightInExchange: 18.4, ytdReturn: 10.8, volatility: 19.8 },
      { exchangeId: 'cse', exchangeName: 'CSE', stockCount: 5, marketCap: 1800, weightInExchange: 15.8, ytdReturn: 10.2, volatility: 20.1 }
    ]
  },
  {
    id: 'energy',
    name: 'Énergie & Utilities',
    nameEn: 'Energy & Utilities',
    icon: 'zap',
    color: '#0ea5e9',
    description: 'Production et distribution d\'énergie, eau et services publics',
    
    industries: [
      {
        id: 'electricity',
        name: 'Électricité',
        nameEn: 'Electricity',
        sectorId: 'energy',
        stockCount: 12,
        totalMarketCap: 18500,
        ytdReturn: 14.2,
        volatility: 16.8,
        topStocks: ['CIEC', 'ONTC']
      },
      {
        id: 'oil-gas',
        name: 'Pétrole & Gaz',
        nameEn: 'Oil & Gas',
        sectorId: 'energy',
        stockCount: 8,
        totalMarketCap: 9200,
        ytdReturn: 7.5,
        volatility: 28.5,
        topStocks: ['TOTA', 'SAPC']
      }
    ],
    stockCount: 20,
    
    totalMarketCap: 27700,
    averageMarketCap: 1385,
    weightInTotal: 14.6,
    
    ytdReturn: 11.5,
    quarterReturn: 3.2,
    yearReturn: 16.8,
    threeYearReturn: 38.5,
    fiveYearReturn: 61.2,
    
    volatility: 21.2,
    beta: 0.95,
    sharpeRatio: 0.72,
    
    dailyVolume: 78.2,
    averageTurnover: 2.9,
    
    averagePE: 13.5,
    averageROE: 16.2,
    averageDividendYield: 4.8,
    averageDebtToEquity: 1.5,
    
    monthlyReturns: [1.1, 0.9, 1.8, 0.2, 1.5, 2.1, 1.3, 0.7, 1.4, 1.9, 1.2, 0.8],
    quarterlyReturns: [3.8, 3.8, 3.4, 3.9],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 7, marketCap: 8200, weightInExchange: 18.1, ytdReturn: 12.5, volatility: 20.5 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 8, marketCap: 14500, weightInExchange: 12.8, ytdReturn: 10.8, volatility: 21.8 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 4, marketCap: 4200, weightInExchange: 18.4, ytdReturn: 11.2, volatility: 21.5 },
      { exchangeId: 'nse', exchangeName: 'NSE', stockCount: 1, marketCap: 800, weightInExchange: 7.1, ytdReturn: 12.8, volatility: 20.8 }
    ]
  },
  {
    id: 'consumer',
    name: 'Biens de Consommation',
    nameEn: 'Consumer Goods',
    icon: 'shopping-cart',
    color: '#8b5cf6',
    description: 'Distribution, agroalimentaire et biens de consommation',
    
    industries: [
      {
        id: 'retail',
        name: 'Distribution',
        nameEn: 'Retail',
        sectorId: 'consumer',
        stockCount: 15,
        totalMarketCap: 8500,
        ytdReturn: 8.5,
        volatility: 17.2,
        topStocks: ['PRSC', 'SHPC']
      },
      {
        id: 'food-beverage',
        name: 'Agroalimentaire',
        nameEn: 'Food & Beverage',
        sectorId: 'consumer',
        stockCount: 18,
        totalMarketCap: 12200,
        ytdReturn: 10.8,
        volatility: 16.5,
        topStocks: ['NEIC', 'SIVC', 'SLBC']
      }
    ],
    stockCount: 33,
    
    totalMarketCap: 20700,
    averageMarketCap: 627,
    weightInTotal: 10.9,
    
    ytdReturn: 9.8,
    quarterReturn: 2.5,
    yearReturn: 12.3,
    threeYearReturn: 31.5,
    fiveYearReturn: 48.2,
    
    volatility: 16.8,
    beta: 0.88,
    sharpeRatio: 0.75,
    
    dailyVolume: 45.8,
    averageTurnover: 2.2,
    
    averagePE: 14.2,
    averageROE: 15.5,
    averageDividendYield: 3.5,
    averageDebtToEquity: 1.2,
    
    monthlyReturns: [0.8, 0.7, 1.2, 0.3, 1.1, 1.5, 0.9, 0.6, 1.0, 1.4, 0.8, 0.5],
    quarterlyReturns: [2.7, 2.9, 2.5, 2.7],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 14, marketCap: 7800, weightInExchange: 17.3, ytdReturn: 9.2, volatility: 16.5 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 10, marketCap: 8500, weightInExchange: 7.5, ytdReturn: 10.5, volatility: 17.2 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 6, marketCap: 3200, weightInExchange: 14.0, ytdReturn: 9.5, volatility: 16.8 },
      { exchangeId: 'cse', exchangeName: 'CSE', stockCount: 3, marketCap: 1200, weightInExchange: 10.5, ytdReturn: 9.8, volatility: 16.9 }
    ]
  },
  {
    id: 'real-estate',
    name: 'Immobilier',
    nameEn: 'Real Estate',
    icon: 'home',
    color: '#14b8a6',
    description: 'Développement immobilier et gestion de patrimoine',
    
    industries: [
      {
        id: 'property-development',
        name: 'Promotion Immobilière',
        nameEn: 'Property Development',
        sectorId: 'real-estate',
        stockCount: 8,
        totalMarketCap: 5200,
        ytdReturn: 6.5,
        volatility: 14.8,
        topStocks: ['SICC', 'PALC']
      }
    ],
    stockCount: 12,
    
    totalMarketCap: 7800,
    averageMarketCap: 650,
    weightInTotal: 4.1,
    
    ytdReturn: 6.5,
    quarterReturn: 1.8,
    yearReturn: 8.9,
    threeYearReturn: 22.5,
    fiveYearReturn: 35.8,
    
    volatility: 14.8,
    beta: 0.75,
    sharpeRatio: 0.58,
    
    dailyVolume: 18.5,
    averageTurnover: 1.8,
    
    averagePE: 16.5,
    averageROE: 11.2,
    averageDividendYield: 4.2,
    averageDebtToEquity: 2.8,
    
    monthlyReturns: [0.5, 0.4, 0.8, 0.2, 0.7, 1.0, 0.6, 0.4, 0.7, 0.9, 0.5, 0.3],
    quarterlyReturns: [1.7, 2.5, 1.7, 2.0],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 4, marketCap: 2500, weightInExchange: 5.5, ytdReturn: 6.2, volatility: 14.5 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 5, marketCap: 3800, weightInExchange: 3.4, ytdReturn: 6.8, volatility: 15.1 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 2, marketCap: 1200, weightInExchange: 5.2, ytdReturn: 6.5, volatility: 14.8 },
      { exchangeId: 'cse', exchangeName: 'CSE', stockCount: 1, marketCap: 300, weightInExchange: 2.6, ytdReturn: 6.0, volatility: 14.2 }
    ]
  },
  {
    id: 'transport',
    name: 'Transport & Logistique',
    nameEn: 'Transport & Logistics',
    icon: 'truck',
    color: '#a855f7',
    description: 'Transport maritime, aérien, terrestre et logistique',
    
    industries: [
      {
        id: 'shipping',
        name: 'Transport Maritime',
        nameEn: 'Shipping',
        sectorId: 'transport',
        stockCount: 5,
        totalMarketCap: 3200,
        ytdReturn: 5.8,
        volatility: 21.5,
        topStocks: ['SDCC', 'SVOC']
      }
    ],
    stockCount: 10,
    
    totalMarketCap: 5800,
    averageMarketCap: 580,
    weightInTotal: 3.1,
    
    ytdReturn: 5.8,
    quarterReturn: 1.5,
    yearReturn: 7.2,
    threeYearReturn: 18.5,
    fiveYearReturn: 28.3,
    
    volatility: 21.5,
    beta: 0.92,
    sharpeRatio: 0.42,
    
    dailyVolume: 12.3,
    averageTurnover: 1.5,
    
    averagePE: 10.8,
    averageROE: 9.5,
    averageDividendYield: 2.8,
    averageDebtToEquity: 3.2,
    
    monthlyReturns: [0.4, 0.3, 0.7, -0.1, 0.6, 0.9, 0.5, 0.3, 0.6, 0.8, 0.4, 0.2],
    quarterlyReturns: [1.4, 2.0, 1.4, 1.4],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 4, marketCap: 2200, weightInExchange: 4.9, ytdReturn: 5.5, volatility: 21.2 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 3, marketCap: 2500, weightInExchange: 2.2, ytdReturn: 6.2, volatility: 21.8 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 2, marketCap: 900, weightInExchange: 3.9, ytdReturn: 5.8, volatility: 21.5 },
      { exchangeId: 'nse', exchangeName: 'NSE', stockCount: 1, marketCap: 200, weightInExchange: 1.8, ytdReturn: 5.2, volatility: 21.0 }
    ]
  },
  {
    id: 'agriculture',
    name: 'Agriculture',
    nameEn: 'Agriculture',
    icon: 'leaf',
    color: '#10b981',
    description: 'Production agricole, plantations et agro-industrie',
    
    industries: [
      {
        id: 'plantations',
        name: 'Plantations',
        nameEn: 'Plantations',
        sectorId: 'agriculture',
        stockCount: 8,
        totalMarketCap: 4500,
        ytdReturn: 7.2,
        volatility: 18.5,
        topStocks: ['PALC', 'SIPC', 'SAFC']
      }
    ],
    stockCount: 12,
    
    totalMarketCap: 6200,
    averageMarketCap: 517,
    weightInTotal: 3.3,
    
    ytdReturn: 7.2,
    quarterReturn: 1.9,
    yearReturn: 9.5,
    threeYearReturn: 24.8,
    fiveYearReturn: 38.5,
    
    volatility: 18.5,
    beta: 0.82,
    sharpeRatio: 0.52,
    
    dailyVolume: 15.8,
    averageTurnover: 1.9,
    
    averagePE: 12.8,
    averageROE: 12.5,
    averageDividendYield: 3.2,
    averageDebtToEquity: 1.8,
    
    monthlyReturns: [0.6, 0.5, 0.9, 0.1, 0.8, 1.1, 0.7, 0.4, 0.8, 1.0, 0.6, 0.3],
    quarterlyReturns: [2.0, 2.0, 1.9, 1.9],
    
    exchangeBreakdown: [
      { exchangeId: 'brvm', exchangeName: 'BRVM', stockCount: 6, marketCap: 3200, weightInExchange: 7.1, ytdReturn: 7.5, volatility: 18.2 },
      { exchangeId: 'jse', exchangeName: 'JSE', stockCount: 3, marketCap: 2100, weightInExchange: 1.9, ytdReturn: 6.8, volatility: 18.8 },
      { exchangeId: 'ngx', exchangeName: 'NGX', stockCount: 2, marketCap: 700, weightInExchange: 3.1, ytdReturn: 7.2, volatility: 18.5 },
      { exchangeId: 'nse', exchangeName: 'NSE', stockCount: 1, marketCap: 200, weightInExchange: 1.8, ytdReturn: 7.0, volatility: 18.3 }
    ]
  }
];

export const getTotalMarketCap = (): number => {
  return AFRICAN_SECTORS.reduce((sum, sector) => sum + sector.totalMarketCap, 0);
};

export const getTotalStockCount = (): number => {
  return AFRICAN_SECTORS.reduce((sum, sector) => sum + sector.stockCount, 0);
};

export const getSectorsByCriteria = (
  criteria: 'growth' | 'profitability' | 'volume',
  period: '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' = '1Y',
  limit: number = 10
) => {
  const sorted = [...AFRICAN_SECTORS].sort((a, b) => {
    switch (criteria) {
      case 'growth':
        return b.ytdReturn - a.ytdReturn;
      case 'profitability':
        return b.averageROE - a.averageROE;
      case 'volume':
        return b.dailyVolume - a.dailyVolume;
      default:
        return 0;
    }
  });
  
  return sorted.slice(0, limit);
};

export const getSectorById = (id: string): Sector | undefined => {
  return AFRICAN_SECTORS.find(sector => sector.id === id);
};

export const getSectorsByExchange = (exchangeId: string): Sector[] => {
  return AFRICAN_SECTORS.filter(sector => 
    sector.exchangeBreakdown.some(ex => ex.exchangeId === exchangeId)
  );
};
