// IPO Types

export type IPOStatus = 'completed' | 'upcoming' | 'postponed' | 'cancelled';
export type Exchange = 'BRVM' | 'JSE' | 'CSE' | 'NGX' | 'GSE' | 'NSE' | 'EGX' | 'TUNSE';
export type Sector = 'Finance' | 'Énergie' | 'Télécom' | 'Industrie' | 'Consommation' | 'Immobilier' | 'Santé' | 'Technologie' | 'Matériaux' | 'Services';
export type Currency = 'XOF' | 'ZAR' | 'EGP' | 'NGN' | 'GHS' | 'KES' | 'TND';

export interface IPO {
  id: string;
  companyName: string;
  ticker: string;
  sector: Sector;
  exchange: Exchange;
  country: string;
  status: IPOStatus;
  
  // Pricing
  ipoPrice: number;
  currentPrice?: number;
  priceRange?: { min: number; max: number };
  currency: Currency;
  
  // Volume
  sharesOffered: number;
  totalRaised: number; // En devise locale
  totalRaisedUSD: number; // Converti en USD
  marketCap?: number;
  
  // Dates
  ipoDate: string; // ISO format
  filingDate?: string;
  pricingDate?: string;
  listingDate?: string;
  
  // Performance (pour IPO complétées)
  firstDayReturn?: number; // %
  currentReturn?: number; // %
  highSinceIPO?: number;
  lowSinceIPO?: number;
  
  // Company Info
  description: string;
  industry: string;
  employees?: number;
  founded?: number;
  headquarters: string;
  ceo?: string;
  website?: string;
  
  // Financial Data
  revenue?: number;
  netIncome?: number;
  peRatio?: number;
  
  // Documents
  prospectusUrl?: string;
  pressReleaseUrl?: string;
  
  // Additional
  underwriters?: string[];
  lockupPeriod?: number; // En jours
  useOfProceeds?: string[];
  highlights?: string[];
}

export interface IPOStatistics {
  totalIPOs: number;
  totalRaised: number; // USD
  averageSize: number; // USD
  averageReturn: number; // %
  successRate: number; // %
  bySector: { sector: Sector; count: number; totalRaised: number }[];
  byExchange: { exchange: Exchange; count: number; totalRaised: number }[];
  byYear: { year: number; count: number; totalRaised: number }[];
  byMonth: { month: string; count: number; totalRaised: number }[];
  topPerformers: IPO[];
  worstPerformers: IPO[];
}

export interface IPOFilters {
  status?: IPOStatus[];
  sectors?: Sector[];
  exchanges?: Exchange[];
  countries?: string[];
  dateRange?: { start: string; end: string };
  priceRange?: { min: number; max: number };
  sizeRange?: { min: number; max: number }; // Total raised in USD
  returnRange?: { min: number; max: number }; // %
  searchQuery?: string;
}

export interface UpcomingIPO extends IPO {
  expectedDate: string;
  bookBuildingStart?: string;
  bookBuildingEnd?: string;
  allotmentDate?: string;
  refundDate?: string;
  daysUntilIPO: number;
  subscriptionStatus?: 'not_started' | 'open' | 'closed' | 'oversubscribed';
  subscriptionMultiple?: number; // Times oversubscribed
}

export interface IPOTimeline {
  date: string;
  event: string;
  description: string;
  status: 'completed' | 'upcoming' | 'current';
}

export interface IPOComparison {
  ipo: IPO;
  metrics: {
    label: string;
    value: number | string;
    comparison?: 'above' | 'below' | 'average';
  }[];
}
