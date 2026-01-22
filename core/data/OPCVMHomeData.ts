// OPCVM Data for Homepage

export interface OPCVMFund {
  id: string;
  name: string;
  isin: string;
  exchange: string;
  nav: number;
  navChange: number;
  performance: number;
  volatility: number;
  rating: number;
}

export interface TitansCompany {
  id: string;
  rank: number;
  name: string;
  headquarters: string;
  aum: number;
  avgPerformance: number;
}

// Mock OPCVM Funds Data
export const MOCK_OPCVM_DATA: OPCVMFund[] = [
  { id: '1', name: 'NSIA Actions CI', isin: 'CI0001', exchange: 'BRVM', nav: 12500, navChange: 18.3, performance: 18.3, volatility: 12.5, rating: 5 },
  { id: '2', name: 'Coris Obligations', isin: 'BF0002', exchange: 'BRVM', nav: 10850, navChange: 5.8, performance: 5.8, volatility: 3.2, rating: 4 },
  { id: '3', name: 'BOA Monétaire', isin: 'SN0003', exchange: 'BRVM', nav: 10125, navChange: 2.5, performance: 2.5, volatility: 1.1, rating: 3 },
  { id: '4', name: 'Ecobank Mixte', isin: 'TG0004', exchange: 'BRVM', nav: 11750, navChange: 10.5, performance: 10.5, volatility: 7.8, rating: 4 },
  { id: '5', name: 'SG Actions Growth', isin: 'CI0005', exchange: 'BRVM', nav: 13200, navChange: 22.1, performance: 22.1, volatility: 15.3, rating: 5 },
  { id: '6', name: 'Stanbic Equity Fund', isin: 'NG0006', exchange: 'NGX', nav: 8500, navChange: 15.7, performance: 15.7, volatility: 11.2, rating: 5 },
  { id: '7', name: 'FirstBank Bond Fund', isin: 'NG0007', exchange: 'NGX', nav: 9200, navChange: 6.3, performance: 6.3, volatility: 4.1, rating: 4 },
  { id: '8', name: 'CIC Money Market', isin: 'KE0008', exchange: 'NSE', nav: 11100, navChange: 4.2, performance: 4.2, volatility: 2.5, rating: 3 },
  { id: '9', name: 'Britam Equity Fund', isin: 'KE0009', exchange: 'NSE', nav: 14300, navChange: 19.8, performance: 19.8, volatility: 13.7, rating: 5 },
  { id: '10', name: 'Allan Gray Balanced', isin: 'ZA0010', exchange: 'JSE', nav: 25600, navChange: 12.4, performance: 12.4, volatility: 8.9, rating: 4 },
  { id: '11', name: 'Coronation Equity', isin: 'ZA0011', exchange: 'JSE', nav: 32100, navChange: 16.9, performance: 16.9, volatility: 12.1, rating: 5 },
  { id: '12', name: 'Databank Epack', isin: 'GH0012', exchange: 'GSE', nav: 7800, navChange: 8.7, performance: 8.7, volatility: 6.3, rating: 4 },
  { id: '13', name: 'CDG Obligations', isin: 'MA0013', exchange: 'CSE', nav: 9500, navChange: 3.9, performance: 3.9, volatility: 2.8, rating: 3 },
];

// Titans Companies Data
export const MOCK_TITANS_COMPANIES: TitansCompany[] = [
  {
    id: 'mc1',
    rank: 1,
    name: 'NSIA Gestion',
    headquarters: 'Abidjan, Côte d\'Ivoire',
    aum: 45000,
    avgPerformance: 12.5,
  },
  {
    id: 'mc2',
    rank: 2,
    name: 'Coris Asset Management',
    headquarters: 'Ouagadougou, Burkina Faso',
    aum: 38500,
    avgPerformance: 11.8,
  },
  {
    id: 'mc3',
    rank: 3,
    name: 'BOA Capital',
    headquarters: 'Dakar, Sénégal',
    aum: 32000,
    avgPerformance: 10.2,
  },
  {
    id: 'mc4',
    rank: 4,
    name: 'Ecobank Asset Management',
    headquarters: 'Lomé, Togo',
    aum: 28000,
    avgPerformance: 9.7,
  },
  {
    id: 'mc5',
    rank: 5,
    name: 'Société Générale Asset Management Africa',
    headquarters: 'Abidjan, Côte d\'Ivoire',
    aum: 25500,
    avgPerformance: 9.3,
  }
];

// Helper function to calculate exchange data for OPCVM map
export const calculateOPCVMExchangeData = (funds: OPCVMFund[]) => {
  const exchangeData = funds.reduce((acc, fund) => {
    if (!acc[fund.exchange]) {
      acc[fund.exchange] = {
        count: 0,
        bestPerformance: -Infinity,
        bestFund: null,
        avgRating: 0,
        totalRating: 0
      };
    }
    acc[fund.exchange].count++;
    acc[fund.exchange].totalRating += fund.rating;
    if (fund.navChange > acc[fund.exchange].bestPerformance) {
      acc[fund.exchange].bestPerformance = fund.navChange;
      acc[fund.exchange].bestFund = fund;
    }
    return acc;
  }, {} as Record<string, { count: number; bestPerformance: number; bestFund: OPCVMFund | null; avgRating: number; totalRating: number }>);

  // Calculate average rating
  Object.keys(exchangeData).forEach(key => {
    exchangeData[key].avgRating = exchangeData[key].totalRating / exchangeData[key].count;
  });

  return exchangeData;
};

// Helper function to get top rated OPCVM funds
export const getTopOPCVMFunds = (funds: OPCVMFund[], limit: number = 6) => {
  return [...funds]
    .sort((a, b) => b.rating - a.rating || b.performance - a.performance)
    .slice(0, limit);
};
