import { IPO, IPOStatistics, IPOFilters, UpcomingIPO, Sector, Exchange } from '@/types/ipo';

// Mock IPO Data - Recent listings (last 5 years)
export const RECENT_IPOS: IPO[] = [
  {
    id: 'ipo-1',
    companyName: 'MTN Côte d\'Ivoire',
    ticker: 'MTNCI',
    sector: 'Telecom',
    exchange: 'BRVM',
    country: 'Côte d\'Ivoire',
    status: 'completed',
    ipoPrice: 5500,
    currentPrice: 6200,
    currency: 'XOF',
    sharesOffered: 15000000,
    totalRaised: 82500000000,
    totalRaisedUSD: 138000000,
    marketCap: 93000000000,
    ipoDate: '2023-11-15',
    listingDate: '2023-11-20',
    firstDayReturn: 8.5,
    currentReturn: 12.7,
    highSinceIPO: 6500,
    lowSinceIPO: 5300,
    description: 'Telecom leader in Ivory Coast with over 12 million subscribers.',
    industry: 'Mobile Telecommunications',
    employees: 850,
    founded: 2005,
    headquarters: 'Abidjan, Ivory Coast',
    ceo: 'Djibril Ouattara',
    revenue: 245000000000,
    netIncome: 45000000000,
    peRatio: 15.2,
    underwriters: ['NSIA Banque', 'Société Générale CI'],
    lockupPeriod: 180,
    useOfProceeds: ['5G network expansion', 'Infrastructure', 'Debt repayment'],
    highlights: ['Market leader', 'Double-digit growth', 'Attractive dividends']
  },
  {
    id: 'ipo-2',
    companyName: 'Capitec Bank',
    ticker: 'CPI',
    sector: 'Finance',
    exchange: 'JSE',
    country: 'South Africa',
    status: 'completed',
    ipoPrice: 1850,
    currentPrice: 2100,
    currency: 'ZAR',
    sharesOffered: 8000000,
    totalRaised: 14800000000,
    totalRaisedUSD: 820000000,
    marketCap: 16800000000,
    ipoDate: '2023-09-10',
    listingDate: '2023-09-15',
    firstDayReturn: 5.2,
    currentReturn: 13.5,
    highSinceIPO: 2200,
    lowSinceIPO: 1800,
    description: 'Innovative retail bank specialized in digital banking services.',
    industry: 'Banking Services',
    employees: 2500,
    founded: 2001,
    headquarters: 'Johannesburg, South Africa',
    revenue: 18500000000,
    netIncome: 3200000000,
    peRatio: 12.8,
    underwriters: ['Standard Bank', 'Rand Merchant Bank'],
    lockupPeriod: 90,
    useOfProceeds: ['Digital expansion', 'Acquisitions', 'Growth capital']
  },
  {
    id: 'ipo-3',
    companyName: 'Dangote Cement Egypt',
    ticker: 'DCEM',
    sector: 'Materials',
    exchange: 'EGX',
    country: 'Egypt',
    status: 'completed',
    ipoPrice: 125,
    currentPrice: 145,
    currency: 'EGP',
    sharesOffered: 50000000,
    totalRaised: 6250000000,
    totalRaisedUSD: 202000000,
    marketCap: 7250000000,
    ipoDate: '2023-06-20',
    listingDate: '2023-06-25',
    firstDayReturn: 12.0,
    currentReturn: 16.0,
    highSinceIPO: 150,
    lowSinceIPO: 120,
    description: 'Leading cement producer in Egypt, subsidiary of Dangote Group.',
    industry: 'Construction Materials',
    employees: 1200,
    founded: 2018,
    headquarters: 'Cairo, Egypt',
    revenue: 8500000000,
    netIncome: 1800000000,
    peRatio: 10.5,
    underwriters: ['EFG Hermes', 'CI Capital'],
    lockupPeriod: 180
  },
  {
    id: 'ipo-4',
    companyName: 'Safaricom Ethiopia',
    ticker: 'SAFE',
    sector: 'Telecom',
    exchange: 'NSE',
    country: 'Kenya',
    status: 'completed',
    ipoPrice: 45,
    currentPrice: 52,
    currency: 'KES',
    sharesOffered: 100000000,
    totalRaised: 4500000000,
    totalRaisedUSD: 35000000,
    marketCap: 5200000000,
    ipoDate: '2024-03-15',
    listingDate: '2024-03-20',
    firstDayReturn: 10.5,
    currentReturn: 15.6,
    highSinceIPO: 55,
    lowSinceIPO: 43,
    description: 'Ethiopian extension of Safaricom, innovative telecom operator.',
    industry: 'Telecommunications',
    employees: 450,
    founded: 2022,
    headquarters: 'Addis Ababa, Ethiopia',
    revenue: 2800000000,
    netIncome: 450000000,
    peRatio: 18.5
  },
  {
    id: 'ipo-5',
    companyName: 'Ecobank Nigeria',
    ticker: 'ECON',
    sector: 'Finance',
    exchange: 'NGX',
    country: 'Nigeria',
    status: 'completed',
    ipoPrice: 850,
    currentPrice: 920,
    currency: 'NGN',
    sharesOffered: 200000000,
    totalRaised: 170000000000,
    totalRaisedUSD: 220000000,
    marketCap: 184000000000,
    ipoDate: '2024-01-25',
    listingDate: '2024-01-30',
    firstDayReturn: 6.8,
    currentReturn: 8.2,
    highSinceIPO: 950,
    lowSinceIPO: 830,
    description: 'Nigerian subsidiary of Ecobank, leading pan-African bank.',
    industry: 'Commercial Banking',
    employees: 3200,
    founded: 1985,
    headquarters: 'Lagos, Nigeria',
    revenue: 285000000000,
    netIncome: 42000000000,
    peRatio: 11.2
  }
];

// Mock Upcoming IPOs
export const UPCOMING_IPOS: UpcomingIPO[] = [
  {
    id: 'ipo-up-1',
    companyName: 'Orange Sénégal',
    ticker: 'ORSN',
    sector: 'Telecom',
    exchange: 'BRVM',
    country: 'Senegal',
    status: 'upcoming',
    ipoPrice: 4500,
    priceRange: { min: 4200, max: 4800 },
    currency: 'XOF',
    sharesOffered: 20000000,
    totalRaised: 90000000000,
    totalRaisedUSD: 150000000,
    ipoDate: '2025-01-15',
    expectedDate: '2025-01-15',
    bookBuildingStart: '2024-12-01',
    bookBuildingEnd: '2024-12-20',
    allotmentDate: '2025-01-10',
    listingDate: '2025-01-15',
    daysUntilIPO: 58,
    subscriptionStatus: 'not_started',
    description: 'Major telecom operator in Senegal, Orange subsidiary.',
    industry: 'Telecommunications',
    employees: 650,
    founded: 2007,
    headquarters: 'Dakar, Senegal',
    revenue: 180000000000,
    netIncome: 32000000000,
    underwriters: ['BOA Sénégal', 'Banque Atlantique'],
    useOfProceeds: ['Fiber optic', 'Data centers', 'Digital innovation']
  },
  {
    id: 'ipo-up-2',
    companyName: 'Fidelity Bank Ghana',
    ticker: 'FIDG',
    sector: 'Finance',
    exchange: 'GSE',
    country: 'Ghana',
    status: 'upcoming',
    ipoPrice: 12,
    priceRange: { min: 11, max: 13 },
    currency: 'GHS',
    sharesOffered: 50000000,
    totalRaised: 600000000,
    totalRaisedUSD: 50000000,
    ipoDate: '2024-12-10',
    expectedDate: '2024-12-10',
    bookBuildingStart: '2024-11-20',
    bookBuildingEnd: '2024-12-05',
    daysUntilIPO: 22,
    subscriptionStatus: 'open',
    subscriptionMultiple: 2.3,
    description: 'Fast-growing commercial bank in Ghana.',
    industry: 'Banking Services',
    employees: 1100,
    headquarters: 'Accra, Ghana',
    revenue: 850000000,
    netIncome: 125000000
  },
  {
    id: 'ipo-up-3',
    companyName: 'Tunisie Telecom',
    ticker: 'TUNT',
    sector: 'Telecom',
    exchange: 'TUNSE',
    country: 'Tunisia',
    status: 'upcoming',
    ipoPrice: 18,
    priceRange: { min: 16, max: 20 },
    currency: 'TND',
    sharesOffered: 30000000,
    totalRaised: 540000000,
    totalRaisedUSD: 175000000,
    ipoDate: '2025-02-20',
    expectedDate: '2025-02-20',
    daysUntilIPO: 94,
    subscriptionStatus: 'not_started',
    description: 'Historic telecommunications operator in Tunisia.',
    industry: 'Telecommunications',
    employees: 4500,
    headquarters: 'Tunis, Tunisia'
  }
];

// Utility Functions
export function filterIPOs(ipos: IPO[], filters: IPOFilters): IPO[] {
  return ipos.filter(ipo => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(ipo.status)) {
      return false;
    }
    if (filters.sectors && filters.sectors.length > 0 && !filters.sectors.includes(ipo.sector)) {
      return false;
    }
    if (filters.exchanges && filters.exchanges.length > 0 && !filters.exchanges.includes(ipo.exchange)) {
      return false;
    }
    if (filters.countries && filters.countries.length > 0 && !filters.countries.includes(ipo.country)) {
      return false;
    }
    if (filters.dateRange) {
      const ipoDate = new Date(ipo.ipoDate);
      const start = new Date(filters.dateRange.start);
      const end = new Date(filters.dateRange.end);
      if (ipoDate < start || ipoDate > end) {
        return false;
      }
    }
    if (filters.priceRange) {
      if (ipo.ipoPrice < filters.priceRange.min || ipo.ipoPrice > filters.priceRange.max) {
        return false;
      }
    }
    if (filters.sizeRange) {
      if (ipo.totalRaisedUSD < filters.sizeRange.min || ipo.totalRaisedUSD > filters.sizeRange.max) {
        return false;
      }
    }
    if (filters.returnRange && ipo.currentReturn !== undefined) {
      if (ipo.currentReturn < filters.returnRange.min || ipo.currentReturn > filters.returnRange.max) {
        return false;
      }
    }
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        ipo.companyName.toLowerCase().includes(query) ||
        ipo.ticker.toLowerCase().includes(query) ||
        ipo.sector.toLowerCase().includes(query)
      );
    }
    return true;
  });
}

export function calculateIPOStatistics(ipos: IPO[]): IPOStatistics {
  const completedIPOs = ipos.filter(ipo => ipo.status === 'completed' && ipo.currentReturn !== undefined);
  
  const totalRaised = ipos.reduce((sum, ipo) => sum + ipo.totalRaisedUSD, 0);
  const averageReturn = completedIPOs.length > 0
    ? completedIPOs.reduce((sum, ipo) => sum + (ipo.currentReturn || 0), 0) / completedIPOs.length
    : 0;
  
  const successRate = completedIPOs.length > 0
    ? (completedIPOs.filter(ipo => (ipo.currentReturn || 0) > 0).length / completedIPOs.length) * 100
    : 0;

  // By Sector
  const sectorMap = new Map<Sector, { count: number; totalRaised: number }>();
  ipos.forEach(ipo => {
    const existing = sectorMap.get(ipo.sector) || { count: 0, totalRaised: 0 };
    sectorMap.set(ipo.sector, {
      count: existing.count + 1,
      totalRaised: existing.totalRaised + ipo.totalRaisedUSD
    });
  });
  const bySector = Array.from(sectorMap.entries()).map(([sector, data]) => ({
    sector,
    count: data.count,
    totalRaised: data.totalRaised
  }));

  // By Exchange
  const exchangeMap = new Map<Exchange, { count: number; totalRaised: number }>();
  ipos.forEach(ipo => {
    const existing = exchangeMap.get(ipo.exchange) || { count: 0, totalRaised: 0 };
    exchangeMap.set(ipo.exchange, {
      count: existing.count + 1,
      totalRaised: existing.totalRaised + ipo.totalRaisedUSD
    });
  });
  const byExchange = Array.from(exchangeMap.entries()).map(([exchange, data]) => ({
    exchange,
    count: data.count,
    totalRaised: data.totalRaised
  }));

  // By Year
  const yearMap = new Map<number, { count: number; totalRaised: number }>();
  ipos.forEach(ipo => {
    const year = new Date(ipo.ipoDate).getFullYear();
    const existing = yearMap.get(year) || { count: 0, totalRaised: 0 };
    yearMap.set(year, {
      count: existing.count + 1,
      totalRaised: existing.totalRaised + ipo.totalRaisedUSD
    });
  });
  const byYear = Array.from(yearMap.entries())
    .map(([year, data]) => ({ year, count: data.count, totalRaised: data.totalRaised }))
    .sort((a, b) => a.year - b.year);

  // By Month (last 12 months)
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  const byMonth = monthNames.map((month, index) => {
    const monthIPOs = ipos.filter(ipo => new Date(ipo.ipoDate).getMonth() === index);
    return {
      month,
      count: monthIPOs.length,
      totalRaised: monthIPOs.reduce((sum, ipo) => sum + ipo.totalRaisedUSD, 0)
    };
  });

  // Top/Worst Performers
  const sortedByReturn = [...completedIPOs].sort((a, b) => (b.currentReturn || 0) - (a.currentReturn || 0));
  const topPerformers = sortedByReturn.slice(0, 5);
  const worstPerformers = sortedByReturn.slice(-5).reverse();

  return {
    totalIPOs: ipos.length,
    totalRaised,
    averageSize: ipos.length > 0 ? totalRaised / ipos.length : 0,
    averageReturn,
    successRate,
    bySector,
    byExchange,
    byYear,
    byMonth,
    topPerformers,
    worstPerformers
  };
}

export function sortIPOs(ipos: IPO[], sortBy: 'date' | 'size' | 'return' | 'name', order: 'asc' | 'desc' = 'desc'): IPO[] {
  const sorted = [...ipos].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.ipoDate).getTime() - new Date(b.ipoDate).getTime();
        break;
      case 'size':
        comparison = a.totalRaisedUSD - b.totalRaisedUSD;
        break;
      case 'return':
        comparison = (a.currentReturn || 0) - (b.currentReturn || 0);
        break;
      case 'name':
        comparison = a.companyName.localeCompare(b.companyName);
        break;
    }
    return order === 'asc' ? comparison : -comparison;
  });
  return sorted;
}

export const ALL_IPOS = [...RECENT_IPOS];
export const ALL_SECTORS: Sector[] = ['Finance', 'Energy', 'Telecom', 'Industry', 'Consumer', 'Real Estate', 'Healthcare', 'Technology', 'Materials', 'Services'];
export const ALL_EXCHANGES: Exchange[] = ['BRVM', 'JSE', 'CSE', 'NGX', 'GSE', 'NSE', 'EGX', 'TUNSE'];
export const ALL_COUNTRIES = ['Ivory Coast', 'South Africa', 'Egypt', 'Nigeria', 'Kenya', 'Ghana', 'Senegal', 'Tunisia'];
