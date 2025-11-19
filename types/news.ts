export interface NewsArticle {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  publishedAt: string;
  category: 'breaking' | 'markets' | 'regulation' | 'earnings' | 'currencies' | 'commodities' | 'analysis' | 'interview';
  tags: string[];
  ticker?: string;
  market: 'BRVM' | 'JSE' | 'CSE' | 'NGX' | 'NSE' | 'GSE' | 'Global';
  sector?: string;
  impact: 'low' | 'medium' | 'high';
  sentiment: 'positive' | 'negative' | 'neutral';
  featured?: boolean;
  readTime: number;
  imageUrl?: string;
  relatedTickers?: string[];
}

export interface MarketTicker {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  market: string;
}

export interface NewsFilter {
  markets: string[];
  sectors: string[];
  categories: string[];
  periods: string[];
  impact: string[];
}

export interface ReadingListItem {
  articleId: string;
  savedAt: string;
  tags: string[];
  notes?: string;
}
