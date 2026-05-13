import { SectorWithStats } from '@/core/domain/entities/sector.entity';
import { Sector, Industry } from '@/types/sectors';

// Couleurs prédéfinies pour les secteurs
const SECTOR_COLORS: { [key: string]: string } = {
  'Agriculture': '#10b981',
  'Mining': '#f59e0b',
  'Construction': '#3b82f6',
  'Manufacturing': '#8b5cf6',
  'Transportation': '#06b6d4',
  'Communication': '#ec4899',
  'Electric': '#f97316',
  'Wholesale': '#14b8a6',
  'Retail': '#a855f7',
  'Finance': '#0ea5e9',
  'Services': '#84cc16',
  'Public': '#6366f1'
};

// Icônes prédéfinies pour les secteurs
const SECTOR_ICONS: { [key: string]: string } = {
  'Agriculture': 'sprout',
  'Mining': 'pickaxe',
  'Construction': 'building',
  'Manufacturing': 'factory',
  'Transportation': 'truck',
  'Communication': 'radio',
  'Electric': 'zap',
  'Wholesale': 'warehouse',
  'Retail': 'shopping-cart',
  'Finance': 'dollar-sign',
  'Services': 'briefcase',
  'Public': 'landmark'
};

// Fonction pour obtenir la couleur d'un secteur
const getSectorColor = (sectorName: string): string => {
  // Chercher une correspondance partielle
  for (const [key, color] of Object.entries(SECTOR_COLORS)) {
    if (sectorName.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  // Couleur par défaut basée sur le hash du nom
  const hash = sectorName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = Object.values(SECTOR_COLORS);
  return colors[hash % colors.length];
};

// Fonction pour obtenir l'icône d'un secteur
const getSectorIcon = (sectorName: string): string => {
  for (const [key, icon] of Object.entries(SECTOR_ICONS)) {
    if (sectorName.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return 'briefcase'; // Icône par défaut
};

// Transformer les données backend en format Sector
export const transformSectorsData = (backendSectors: SectorWithStats[], selectedExchanges: string[]): Sector[] => {
  // Calculer la capitalisation totale pour les pourcentages
  let totalMarketCap = 0;
  
  const sectors: Sector[] = backendSectors.map(backendSector => {
    // Filtrer les sociétés par bourses sélectionnées
    const filteredIndustries = backendSector.industries.map(industry => ({
      ...industry,
      societies: industry.societies.filter(society => 
        selectedExchanges.length === 0 || selectedExchanges.includes(society?.bourse?.toLowerCase())
      )
    })).filter(industry => industry.societies.length > 0);

    // Calculer les statistiques du secteur
    const allSocieties = filteredIndustries.flatMap(ind => ind.societies);
    const stockCount = allSocieties.length;
    const sectorMarketCap = allSocieties.reduce((sum, soc) => sum + (soc.market_cap || 0), 0);
    const averageMarketCap = stockCount > 0 ? sectorMarketCap / stockCount : 0;
    
    // Performance moyenne
    const validPerformances = allSocieties.filter(s => s.performance_1y !== null).map(s => s.performance_1y!);
    const yearReturn = validPerformances.length > 0 
      ? validPerformances.reduce((sum, p) => sum + p, 0) / validPerformances.length 
      : 0;
    
    // Volatilité moyenne
    const validVolatilities = allSocieties.filter(s => s.volatility !== null).map(s => s.volatility!);
    const volatility = validVolatilities.length > 0
      ? validVolatilities.reduce((sum, v) => sum + v, 0) / validVolatilities.length
      : 0;
    
    // ROE et ROA moyens
    const validROEs = allSocieties.filter(s => s.roe !== null).map(s => s.roe!);
    const averageROE = validROEs.length > 0
      ? validROEs.reduce((sum, r) => sum + r, 0) / validROEs.length
      : 0;
    
    const validROAs = allSocieties.filter(s => s.roa !== null).map(s => s.roa!);
    const averageROA = validROAs.length > 0
      ? validROAs.reduce((sum, r) => sum + r, 0) / validROAs.length
      : 0;

    // Transformer les industries
    const industries: Industry[] = filteredIndustries.map(ind => ({
      id: ind.id,
      name: ind.name,
      nameEn: ind.name,
      sectorId: backendSector.id,
      stockCount: ind.societies.length,
      totalMarketCap: ind.societies.reduce((sum, soc) => sum + (soc.market_cap || 0), 0),
      ytdReturn: 0, // À calculer si disponible
      volatility: ind.societies.filter(s => s.volatility !== null).length > 0
        ? ind.societies.filter(s => s.volatility !== null).reduce((sum, s) => sum + s.volatility!, 0) / ind.societies.filter(s => s.volatility !== null).length
        : 0,
      topStocks: ind.societies.slice(0, 5).map(s => s.id)
    }));

    // Breakdown par bourse
    const exchangeBreakdown = selectedExchanges.map(exchangeId => {
      const exchangeSocieties = allSocieties.filter(s => s.bourse.toLowerCase() === exchangeId);
      const exchangeMarketCap = exchangeSocieties.reduce((sum, s) => sum + (s.market_cap || 0), 0);
      const exchangePerformances = exchangeSocieties.filter(s => s.performance_1y !== null).map(s => s.performance_1y!);
      
      return {
        exchangeId,
        exchangeName: exchangeId.toUpperCase(),
        stockCount: exchangeSocieties.length,
        marketCap: exchangeMarketCap,
        weightInExchange: 0, // À calculer après
        ytdReturn: exchangePerformances.length > 0
          ? exchangePerformances.reduce((sum, p) => sum + p, 0) / exchangePerformances.length
          : 0,
        volatility: exchangeSocieties.filter(s => s.volatility !== null).length > 0
          ? exchangeSocieties.filter(s => s.volatility !== null).reduce((sum, s) => sum + s.volatility!, 0) / exchangeSocieties.filter(s => s.volatility !== null).length
          : 0
      };
    }).filter(ex => ex.stockCount > 0);

    totalMarketCap += sectorMarketCap;

    return {
      id: backendSector.id,
      name: backendSector.name,
      nameEn: backendSector.name,
      icon: getSectorIcon(backendSector.name),
      color: getSectorColor(backendSector.name),
      description: `Secteur ${backendSector.name}`,
      
      industries,
      stockCount,
      
      totalMarketCap: sectorMarketCap,
      averageMarketCap,
      weightInTotal: 0, // Calculé après
      
      ytdReturn: yearReturn * 0.8, // Approximation YTD
      quarterReturn: yearReturn * 0.25,
      yearReturn,
      threeYearReturn: yearReturn * 3,
      fiveYearReturn: yearReturn * 5,
      
      volatility,
      beta: 1.0,
      sharpeRatio: volatility > 0 ? yearReturn / volatility : 0,
      
      dailyVolume: 0,
      averageTurnover: 0,
      
      averagePE: 0,
      averageROE,
      averageDividendYield: 0,
      averageDebtToEquity: 0,
      
      monthlyReturns: Array(12).fill(0).map(() => yearReturn / 12 + (Math.random() - 0.5) * 5),
      quarterlyReturns: Array(4).fill(0).map(() => yearReturn / 4 + (Math.random() - 0.5) * 10),
      
      exchangeBreakdown
    };
  }).filter(sector => sector.stockCount > 0);

  // Calculer les pourcentages
  sectors.forEach(sector => {
    sector.weightInTotal = totalMarketCap > 0 ? (sector.totalMarketCap / totalMarketCap) * 100 : 0;
  });

  return sectors;
};
