// Types pour les événements corporatifs

export type EventType = 
  | 'IPO' 
  | 'Split' 
  | 'Reverse Split'
  | 'Merger' 
  | 'Acquisition' 
  | 'Delisting' 
  | 'Bankruptcy'
  | 'Spin-off'
  | 'Dividend'
  | 'Rights Issue'
  | 'Share Buyback';

export type EventImportance = 'major' | 'minor';

export type Exchange = 'BRVM' | 'JSE' | 'CSE' | 'NGX' | 'GSE' | 'NSE' | 'EGX' | 'TUNSE';

export interface CorporateEvent {
  id: string;
  date: string; // ISO format
  type: EventType;
  exchange: Exchange;
  companyId: string;
  companyName: string;
  companyTicker: string;
  title: string;
  description: string;
  importance: EventImportance;
  
  // Impact sur le cours
  priceImpact?: {
    priceBefore: number; // Prix 30 jours avant
    priceAfter: number;  // Prix 30 jours après
    percentChange: number;
    volatilityBefore: number;
    volatilityAfter: number;
  };
  
  // Détails spécifiques selon le type
  details?: {
    // Pour IPO
    ipoPrice?: number;
    sharesOffered?: number;
    marketCap?: number;
    
    // Pour Split/Reverse Split
    splitRatio?: string; // "2:1", "1:5", etc.
    
    // Pour Merger/Acquisition
    acquirer?: string;
    target?: string;
    dealValue?: number;
    
    // Pour Dividend
    dividendAmount?: number;
    dividendYield?: number;
    
    // Pour Rights Issue
    subscriptionPrice?: number;
    sharesIssued?: number;
  };
  
  // Liens
  newsArticles?: string[];
  analysisReports?: string[];
  relatedEvents?: string[];
}

export interface EventFilter {
  years?: number[];
  exchanges?: Exchange[];
  types?: EventType[];
  companies?: string[];
  importance?: EventImportance[];
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface EventStats {
  totalEvents: number;
  ipoCount: number;
  splitCount: number;
  mergerCount: number;
  delistingCount: number;
  exchangesCovered: number;
  eventsByType: Record<EventType, number>;
  eventsByExchange: Record<Exchange, number>;
  eventsByMonth: Array<{ month: string; count: number }>;
}

export interface EventAlert {
  id: string;
  userId: string;
  eventTypes: EventType[];
  companies: string[];
  exchanges: Exchange[];
  minImpactThreshold?: number;
  enabled: boolean;
  createdAt: string;
}
