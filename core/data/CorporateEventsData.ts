import { CorporateEvent, EventStats } from '@/types/corporate-events';

export const CORPORATE_EVENTS: CorporateEvent[] = [
  // IPOs 2024
  {
    id: 'evt-001',
    date: '2024-09-15',
    type: 'IPO',
    exchange: 'JSE',
    companyId: 'comp-001',
    companyName: 'African Tech Solutions',
    companyTicker: 'ATS',
    title: 'Introduction en bourse d\'African Tech Solutions',
    description: 'Première cotation d\'une fintech africaine spécialisée dans les paiements mobiles',
    importance: 'major',
    priceImpact: {
      priceBefore: 0,
      priceAfter: 125.50,
      percentChange: 25.5,
      volatilityBefore: 0,
      volatilityAfter: 18.5
    },
    details: {
      ipoPrice: 100,
      sharesOffered: 50000000,
      marketCap: 5000000000
    }
  },
  {
    id: 'evt-002',
    date: '2024-08-22',
    type: 'IPO',
    exchange: 'BRVM',
    companyId: 'comp-002',
    companyName: 'Banque Régionale de l\'Ouest',
    companyTicker: 'BROC',
    title: 'IPO de la Banque Régionale de l\'Ouest',
    description: 'Introduction d\'une banque régionale couvrant 8 pays de l\'UEMOA',
    importance: 'major',
    priceImpact: {
      priceBefore: 0,
      priceAfter: 8500,
      percentChange: 13.3,
      volatilityBefore: 0,
      volatilityAfter: 12.8
    },
    details: {
      ipoPrice: 7500,
      sharesOffered: 20000000,
      marketCap: 150000000000
    }
  },
  
  // Splits 2024
  {
    id: 'evt-003',
    date: '2024-07-10',
    type: 'Split',
    exchange: 'JSE',
    companyId: 'comp-003',
    companyName: 'Naspers',
    companyTicker: 'NPN',
    title: 'Split d\'actions Naspers 5:1',
    description: 'Division des actions pour améliorer la liquidité',
    importance: 'major',
    priceImpact: {
      priceBefore: 3250.00,
      priceAfter: 665.00,
      percentChange: 2.3,
      volatilityBefore: 8.5,
      volatilityAfter: 9.2
    },
    details: {
      splitRatio: '5:1'
    }
  },
  {
    id: 'evt-004',
    date: '2024-06-18',
    type: 'Split',
    exchange: 'NGX',
    companyId: 'comp-004',
    companyName: 'Dangote Cement',
    companyTicker: 'DANGCEM',
    title: 'Split d\'actions Dangote Cement 2:1',
    description: 'Fractionnement pour rendre les actions plus accessibles',
    importance: 'major',
    priceImpact: {
      priceBefore: 520.00,
      priceAfter: 265.00,
      percentChange: 1.9,
      volatilityBefore: 6.2,
      volatilityAfter: 7.1
    },
    details: {
      splitRatio: '2:1'
    }
  },
  
  // Fusions & Acquisitions 2024
  {
    id: 'evt-005',
    date: '2024-05-30',
    type: 'Merger',
    exchange: 'BRVM',
    companyId: 'comp-005',
    companyName: 'BICICI',
    companyTicker: 'BICC',
    title: 'Fusion BICICI et Société Générale CI',
    description: 'Création d\'un géant bancaire régional',
    importance: 'major',
    priceImpact: {
      priceBefore: 6500,
      priceAfter: 7850,
      percentChange: 20.8,
      volatilityBefore: 5.5,
      volatilityAfter: 11.2
    },
    details: {
      acquirer: 'BICICI',
      target: 'Société Générale CI',
      dealValue: 250000000000
    }
  },
  {
    id: 'evt-006',
    date: '2024-04-12',
    type: 'Acquisition',
    exchange: 'JSE',
    companyId: 'comp-006',
    companyName: 'MTN Group',
    companyTicker: 'MTN',
    title: 'MTN acquiert un opérateur éthiopien',
    description: 'Expansion stratégique en Afrique de l\'Est',
    importance: 'major',
    priceImpact: {
      priceBefore: 95.50,
      priceAfter: 102.30,
      percentChange: 7.1,
      volatilityBefore: 9.8,
      volatilityAfter: 13.5
    },
    details: {
      acquirer: 'MTN Group',
      target: 'Ethio Telecom (participation)',
      dealValue: 8500000000
    }
  },
  
  // Radiations 2023-2024
  {
    id: 'evt-007',
    date: '2024-03-20',
    type: 'Delisting',
    exchange: 'NSE',
    companyId: 'comp-007',
    companyName: 'Uchumi Supermarkets',
    companyTicker: 'UCSP',
    title: 'Radiation d\'Uchumi Supermarkets',
    description: 'Radiation suite à des difficultés financières prolongées',
    importance: 'major',
    priceImpact: {
      priceBefore: 2.50,
      priceAfter: 0,
      percentChange: -100,
      volatilityBefore: 45.2,
      volatilityAfter: 0
    }
  },
  {
    id: 'evt-008',
    date: '2023-11-08',
    type: 'Delisting',
    exchange: 'JSE',
    companyId: 'comp-008',
    companyName: 'Steinhoff International',
    companyTicker: 'SNH',
    title: 'Radiation de Steinhoff',
    description: 'Retrait de la cote après scandale comptable',
    importance: 'major',
    priceImpact: {
      priceBefore: 1.25,
      priceAfter: 0,
      percentChange: -100,
      volatilityBefore: 85.5,
      volatilityAfter: 0
    }
  },
  
  // Scissions 2023
  {
    id: 'evt-009',
    date: '2023-10-15',
    type: 'Spin-off',
    exchange: 'JSE',
    companyId: 'comp-009',
    companyName: 'Anglo American',
    companyTicker: 'AGL',
    title: 'Scission de la division platine d\'Anglo American',
    description: 'Création d\'une entité indépendante pour les métaux du groupe platine',
    importance: 'major',
    priceImpact: {
      priceBefore: 485.00,
      priceAfter: 425.00,
      percentChange: -12.4,
      volatilityBefore: 12.5,
      volatilityAfter: 15.8
    }
  },
  
  // Dividendes exceptionnels 2024
  {
    id: 'evt-010',
    date: '2024-02-28',
    type: 'Dividend',
    exchange: 'BRVM',
    companyId: 'comp-010',
    companyName: 'SONATEL',
    companyTicker: 'SNTS',
    title: 'Dividende exceptionnel SONATEL',
    description: 'Distribution d\'un dividende record suite à des résultats exceptionnels',
    importance: 'major',
    priceImpact: {
      priceBefore: 18500,
      priceAfter: 16200,
      percentChange: -12.4,
      volatilityBefore: 4.5,
      volatilityAfter: 6.8
    },
    details: {
      dividendAmount: 2500,
      dividendYield: 13.5
    }
  },
  
  // Augmentations de capital 2023-2024
  {
    id: 'evt-011',
    date: '2024-01-22',
    type: 'Rights Issue',
    exchange: 'NGX',
    companyId: 'comp-011',
    companyName: 'Access Bank',
    companyTicker: 'ACCESS',
    title: 'Augmentation de capital Access Bank',
    description: 'Émission de droits pour financer l\'expansion régionale',
    importance: 'major',
    priceImpact: {
      priceBefore: 18.50,
      priceAfter: 16.80,
      percentChange: -9.2,
      volatilityBefore: 11.2,
      volatilityAfter: 14.5
    },
    details: {
      subscriptionPrice: 15.00,
      sharesIssued: 500000000
    }
  },
  {
    id: 'evt-012',
    date: '2023-09-14',
    type: 'Rights Issue',
    exchange: 'CSE',
    companyId: 'comp-012',
    companyName: 'Safaricom Egypt',
    companyTicker: 'SCOM',
    title: 'Émission de droits Safaricom Egypt',
    description: 'Levée de fonds pour le déploiement 5G',
    importance: 'major',
    priceImpact: {
      priceBefore: 42.00,
      priceAfter: 38.50,
      percentChange: -8.3,
      volatilityBefore: 9.5,
      volatilityAfter: 12.1
    },
    details: {
      subscriptionPrice: 35.00,
      sharesIssued: 200000000
    }
  },
  
  // Rachats d'actions 2023
  {
    id: 'evt-013',
    date: '2023-08-05',
    type: 'Share Buyback',
    exchange: 'JSE',
    companyId: 'comp-013',
    companyName: 'Shoprite Holdings',
    companyTicker: 'SHP',
    title: 'Programme de rachat d\'actions Shoprite',
    description: 'Rachat de 5% du capital pour optimiser la structure financière',
    importance: 'minor',
    priceImpact: {
      priceBefore: 185.00,
      priceAfter: 195.50,
      percentChange: 5.7,
      volatilityBefore: 8.2,
      volatilityAfter: 7.5
    }
  },
  
  // Reverse Split 2023
  {
    id: 'evt-014',
    date: '2023-07-18',
    type: 'Reverse Split',
    exchange: 'NGX',
    companyId: 'comp-014',
    companyName: 'Oando PLC',
    companyTicker: 'OANDO',
    title: 'Regroupement d\'actions Oando 1:10',
    description: 'Regroupement pour augmenter le prix unitaire',
    importance: 'minor',
    priceImpact: {
      priceBefore: 4.50,
      priceAfter: 48.00,
      percentChange: 6.7,
      volatilityBefore: 22.5,
      volatilityAfter: 18.2
    },
    details: {
      splitRatio: '1:10'
    }
  },
  
  // Faillites 2023
  {
    id: 'evt-015',
    date: '2023-06-30',
    type: 'Bankruptcy',
    exchange: 'NSE',
    companyId: 'comp-015',
    companyName: 'Mumias Sugar Company',
    companyTicker: 'MSUG',
    title: 'Mise en liquidation de Mumias Sugar',
    description: 'Faillite après des années de difficultés opérationnelles',
    importance: 'major',
    priceImpact: {
      priceBefore: 0.85,
      priceAfter: 0,
      percentChange: -100,
      volatilityBefore: 95.5,
      volatilityAfter: 0
    }
  },
  
  // IPOs 2023
  {
    id: 'evt-016',
    date: '2023-05-20',
    type: 'IPO',
    exchange: 'EGX',
    companyId: 'comp-016',
    companyName: 'E-Finance',
    companyTicker: 'EFIN',
    title: 'Introduction en bourse d\'E-Finance',
    description: 'IPO d\'une plateforme de paiement électronique égyptienne',
    importance: 'major',
    priceImpact: {
      priceBefore: 0,
      priceAfter: 18.50,
      percentChange: 23.3,
      volatilityBefore: 0,
      volatilityAfter: 25.5
    },
    details: {
      ipoPrice: 15.00,
      sharesOffered: 100000000,
      marketCap: 1500000000
    }
  }
];

// Fonction pour calculer les statistiques
export function calculateEventStats(events: CorporateEvent[]): EventStats {
  const stats: EventStats = {
    totalEvents: events.length,
    ipoCount: 0,
    splitCount: 0,
    mergerCount: 0,
    delistingCount: 0,
    exchangesCovered: 0,
    eventsByType: {} as Record<string, number>,
    eventsByExchange: {} as Record<string, number>,
    eventsByMonth: []
  };
  
  const exchangesSet = new Set<string>();
  const monthsMap = new Map<string, number>();
  
  events.forEach(event => {
    // Count by type
    if (event.type === 'IPO') stats.ipoCount++;
    if (event.type === 'Split' || event.type === 'Reverse Split') stats.splitCount++;
    if (event.type === 'Merger' || event.type === 'Acquisition') stats.mergerCount++;
    if (event.type === 'Delisting') stats.delistingCount++;
    
    // Count by type (detailed)
    stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;
    
    // Count by exchange
    stats.eventsByExchange[event.exchange] = (stats.eventsByExchange[event.exchange] || 0) + 1;
    exchangesSet.add(event.exchange);
    
    // Count by month
    const month = event.date.substring(0, 7); // YYYY-MM
    monthsMap.set(month, (monthsMap.get(month) || 0) + 1);
  });
  
  stats.exchangesCovered = exchangesSet.size;
  
  // Convert months map to array
  stats.eventsByMonth = Array.from(monthsMap.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));
  
  return stats;
}

// Fonction pour filtrer les événements
export function filterEvents(
  events: CorporateEvent[],
  filters: {
    years?: number[];
    exchanges?: string[];
    types?: string[];
    companies?: string[];
    importance?: string[];
  }
): CorporateEvent[] {
  return events.filter(event => {
    if (filters.years && filters.years.length > 0) {
      const eventYear = new Date(event.date).getFullYear();
      if (!filters.years.includes(eventYear)) return false;
    }
    
    if (filters.exchanges && filters.exchanges.length > 0) {
      if (!filters.exchanges.includes(event.exchange)) return false;
    }
    
    if (filters.types && filters.types.length > 0) {
      if (!filters.types.includes(event.type)) return false;
    }
    
    if (filters.companies && filters.companies.length > 0) {
      if (!filters.companies.includes(event.companyName)) return false;
    }
    
    if (filters.importance && filters.importance.length > 0) {
      if (!filters.importance.includes(event.importance)) return false;
    }
    
    return true;
  });
}

// Configuration des couleurs par type d'événement
export const EVENT_COLORS: Record<string, string> = {
  'IPO': '#10b981',
  'Split': '#3b82f6',
  'Reverse Split': '#6366f1',
  'Merger': '#8b5cf6',
  'Acquisition': '#a855f7',
  'Delisting': '#ef4444',
  'Bankruptcy': '#dc2626',
  'Spin-off': '#f59e0b',
  'Dividend': '#14b8a6',
  'Rights Issue': '#06b6d4',
  'Share Buyback': '#0ea5e9'
};

// Configuration des icônes par type d'événement
export const EVENT_ICONS: Record<string, string> = {
  'IPO': 'trending-up',
  'Split': 'git-branch',
  'Reverse Split': 'git-merge',
  'Merger': 'git-pull-request',
  'Acquisition': 'shopping-cart',
  'Delisting': 'x-circle',
  'Bankruptcy': 'alert-triangle',
  'Spin-off': 'scissors',
  'Dividend': 'dollar-sign',
  'Rights Issue': 'plus-circle',
  'Share Buyback': 'arrow-down-circle'
};
