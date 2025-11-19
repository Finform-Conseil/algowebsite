import { NewsArticle, MarketTicker } from '@/types/news';

export const MARKET_TICKERS: MarketTicker[] = [
  { symbol: 'BRVM', name: 'BRVM Composite', value: 245.67, change: +2.34, changePercent: +0.96, market: 'Abidjan' },
  { symbol: 'JSE', name: 'JSE All Share', value: 78923.45, change: +156.78, changePercent: +0.20, market: 'Johannesburg' },
  { symbol: 'NGX', name: 'NGX 30', value: 1234.56, change: -8.90, changePercent: -0.72, market: 'Lagos' },
  { symbol: 'NSE', name: 'NSE 20', value: 2345.78, change: +12.34, changePercent: +0.53, market: 'Nairobi' },
  { symbol: 'CSE', name: 'CSE All Share', value: 9876.54, change: +45.67, changePercent: +0.47, market: 'Casablanca' },
  { symbol: 'SPX', name: 'S&P 500', value: 4567.89, change: +23.45, changePercent: +0.52, market: 'New York' },
];

export const DEMO_NEWS_ARTICLES: NewsArticle[] = [
  {
    id: '1',
    title: 'BRVM: Les banques ouest-africaines surperforment avec une hausse moyenne de 15% au T3',
    excerpt: 'Le secteur bancaire de la zone UEMOA affiche une résilience remarquable malgré le contexte mondial incertain. Ecobank, NSIA Banque et UBA mènent la danse avec des résultats trimestriels exceptionnels.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    author: {
      name: 'Marie Kouamé',
      role: 'Analyste Financier Senior',
      avatar: '/avatars/analyst1.jpg'
    },
    publishedAt: '2024-01-15T09:30:00Z',
    category: 'earnings',
    tags: ['Banques', 'BRVM', 'Résultats', 'UEMOA'],
    ticker: 'NSIA',
    market: 'BRVM',
    sector: 'Finance',
    impact: 'high',
    sentiment: 'positive',
    featured: true,
    readTime: 5,
    imageUrl: '/images/banking-brvm.jpg',
    relatedTickers: ['NSIA', 'ECOBANK', 'UBA', 'BOA']
  },
  {
    id: '2',
    title: 'Johannesburg Stock Exchange: Le secteur minier rebondit après les annonces chinoises',
    excerpt: 'Les valeurs minières sud-africaines connaissent une forte reprise suite aux nouvelles mesures de relance économique en Chine. Anglo American et BHP Billiton en tête.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    author: {
      name: 'Jean-Pierre Moko',
      role: 'Expert Marchés Émergents',
      avatar: '/avatars/analyst2.jpg'
    },
    publishedAt: '2024-01-15T10:15:00Z',
    category: 'markets',
    tags: ['Mining', 'JSE', 'Chine', 'Matières premières'],
    ticker: 'AGL',
    market: 'JSE',
    sector: 'Mining',
    impact: 'high',
    sentiment: 'positive',
    readTime: 4,
    imageUrl: '/images/mining-jse.jpg',
    relatedTickers: ['AGL', 'BHP', 'SOL', 'IMP']
  },
  {
    id: '3',
    title: 'Nigeria: La CBN maintient son taux directeur à 24.75% face à l\'inflation',
    excerpt: 'La Banque Centrale du Nigeria décide de conserver sa politique monétaire restrictive lors de sa dernière réunion, visant à contenir une inflation persistante.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    author: {
      name: 'Amina Bello',
      role: 'Économiste Monétaire',
      avatar: '/avatars/analyst3.jpg'
    },
    publishedAt: '2024-01-15T11:00:00Z',
    category: 'regulation',
    tags: ['Monnaie', 'CBN', 'Inflation', 'Nigeria'],
    market: 'NGX',
    impact: 'high',
    sentiment: 'neutral',
    readTime: 3,
    relatedTickers: ['CBN', 'NGN', 'INFLATION']
  },
  {
    id: '4',
    title: 'Tech africaine: Flutterwave lève 250M$ pour son expansion en Europe',
    excerpt: 'La fintech nigériane confirme sa position de leader avec une nouvelle levée de fonds record. Les investisseurs européens misent sur la révolution digitale africaine.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    author: {
      name: 'Thomas Sagna',
      role: 'Journaliste Tech & Finance',
      avatar: '/avatars/analyst4.jpg'
    },
    publishedAt: '2024-01-15T14:30:00Z',
    category: 'analysis',
    tags: ['Fintech', 'Levée de fonds', 'Flutterwave', 'Europe'],
    ticker: 'FLW',
    market: 'NGX',
    sector: 'Technology',
    impact: 'medium',
    sentiment: 'positive',
    featured: true,
    readTime: 6,
    imageUrl: '/images/flutterwave-funding.jpg',
    relatedTickers: ['FLW', 'PAYSTACK', 'INTERSWITCH']
  },
  {
    id: '5',
    title: 'Énergie: Le pétrole brent passe sous la barre des 78$ amid les craintes de demande',
    excerpt: 'Les cours du pétrole continuent leur baisse face aux inquiétudes sur la demande mondiale et aux signaux de ralentissement économique en Chine.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    author: {
      name: 'Carlos Mendes',
      role: 'Analyste Matières Premières',
      avatar: '/avatars/analyst5.jpg'
    },
    publishedAt: '2024-01-15T15:45:00Z',
    category: 'commodities',
    tags: ['Pétrole', 'Brent', 'OPEP', 'Demande'],
    market: 'Global',
    impact: 'medium',
    sentiment: 'negative',
    readTime: 4,
    relatedTickers: ['BRENT', 'WTI', 'OPEC']
  },
  {
    id: '6',
    title: 'BRVM Régulation: Nouvelles règles de gouvernance pour les sociétés cotées',
    excerpt: 'L\'AMF ouest-africaine renforce les exigences de transparence et de gouvernance pour les entreprises de la BRVM, alignées sur les standards internationaux.',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    author: {
      name: 'Fatou Ndiaye',
      role: 'Juriste Financier',
      avatar: '/avatars/analyst6.jpg'
    },
    publishedAt: '2024-01-15T16:20:00Z',
    category: 'regulation',
    tags: ['Régulation', 'AMF', 'Gouvernance', 'BRVM'],
    market: 'BRVM',
    impact: 'medium',
    sentiment: 'neutral',
    readTime: 5,
    relatedTickers: ['AMF', 'BRVM', 'UEMOA']
  }
];

export const CATEGORIES = [
  { id: 'breaking', name: 'Breaking', color: '#ef4444' },
  { id: 'markets', name: 'Markets', color: '#3b82f6' },
  { id: 'regulation', name: 'Regulation', color: '#8b5cf6' },
  { id: 'earnings', name: 'Earnings', color: '#10b981' },
  { id: 'currencies', name: 'Currencies', color: '#f59e0b' },
  { id: 'commodities', name: 'Commodities', color: '#06b6d4' },
  { id: 'analysis', name: 'Analysis', color: '#6366f1' },
  { id: 'interview', name: 'Interview', color: '#ec4899' },
];

export const MARKETS = [
  { id: 'BRVM', name: 'BRVM', location: 'Abidjan' },
  { id: 'JSE', name: 'JSE', location: 'Johannesburg' },
  { id: 'NGX', name: 'NGX', location: 'Lagos' },
  { id: 'NSE', name: 'NSE', location: 'Nairobi' },
  { id: 'CSE', name: 'CSE', location: 'Casablanca' },
  { id: 'GSE', name: 'GSE', location: 'Accra' },
  { id: 'Global', name: 'Global', location: 'Worldwide' },
];

export const SECTORS = [
  'Finance', 'Technology', 'Mining', 'Energy', 'Telecoms', 'Manufacturing', 'Agriculture', 'Healthcare',
];

export const TIME_PERIODS = [
  { id: 'today', name: "Aujourd'hui" },
  { id: 'week', name: 'Cette semaine' },
  { id: 'month', name: 'Ce mois' },
  { id: 'quarter', name: 'Ce trimestre' },
];
