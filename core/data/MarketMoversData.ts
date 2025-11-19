import { Stock, Exchange, Sector, Currency, MarketIndicators, HeatmapItem, MarketInsight, Alert } from '@/types/market-movers';

// Générateur de données sparkline
const generateSparkline = (basePrice: number, volatility: number = 0.02): number[] => {
  const points = 20;
  const data: number[] = [basePrice];
  
  for (let i = 1; i < points; i++) {
    const change = (Math.random() - 0.5) * volatility * basePrice;
    data.push(data[i - 1] + change);
  }
  
  return data;
};

// Mock data - Stocks
export const MARKET_STOCKS: Stock[] = [
  // BRVM - Top performers
  { ticker: 'SGCI', name: 'Société Générale Côte d\'Ivoire', exchange: 'BRVM', sector: 'Finance', price: 12500, currency: 'XOF', change: 8.5, changeValue: 980, volume: 45000, avgVolume: 32000, marketCap: 125000000000, open: 11520, high: 12650, low: 11480, sparklineData: generateSparkline(12500, 0.03), lastUpdate: new Date() },
  { ticker: 'SONATEL', name: 'Sonatel', exchange: 'BRVM', sector: 'Télécom', price: 18500, currency: 'XOF', change: 7.2, changeValue: 1240, volume: 38000, avgVolume: 28000, marketCap: 185000000000, open: 17260, high: 18700, low: 17200, sparklineData: generateSparkline(18500, 0.025), lastUpdate: new Date() },
  { ticker: 'BICC', name: 'BICICI', exchange: 'BRVM', sector: 'Finance', price: 8200, currency: 'XOF', change: 6.8, changeValue: 522, volume: 52000, avgVolume: 35000, marketCap: 82000000000, open: 7678, high: 8350, low: 7650, sparklineData: generateSparkline(8200, 0.028), lastUpdate: new Date() },
  { ticker: 'ETIT', name: 'Ecobank Transnational', exchange: 'BRVM', sector: 'Finance', price: 15800, currency: 'XOF', change: 5.9, changeValue: 880, volume: 41000, avgVolume: 30000, marketCap: 158000000000, open: 14920, high: 16000, low: 14850, sparklineData: generateSparkline(15800, 0.024), lastUpdate: new Date() },
  { ticker: 'TTLS', name: 'Total Sénégal', exchange: 'BRVM', sector: 'Énergie', price: 2450, currency: 'XOF', change: 4.5, changeValue: 105, volume: 68000, avgVolume: 48000, marketCap: 24500000000, open: 2345, high: 2480, low: 2330, sparklineData: generateSparkline(2450, 0.022), lastUpdate: new Date() },
  
  // JSE - Top performers
  { ticker: 'NPN', name: 'Naspers', exchange: 'JSE', sector: 'Technologie', price: 3250, currency: 'ZAR', change: 9.2, changeValue: 274, volume: 1250000, avgVolume: 980000, marketCap: 1400000000000, open: 2976, high: 3280, low: 2950, sparklineData: generateSparkline(3250, 0.035), lastUpdate: new Date() },
  { ticker: 'AGL', name: 'Anglo American Platinum', exchange: 'JSE', sector: 'Matériaux', price: 1580, currency: 'ZAR', change: 7.8, changeValue: 114, volume: 890000, avgVolume: 720000, marketCap: 420000000000, open: 1466, high: 1595, low: 1455, sparklineData: generateSparkline(1580, 0.032), lastUpdate: new Date() },
  { ticker: 'SBK', name: 'Standard Bank', exchange: 'JSE', sector: 'Finance', price: 185, currency: 'ZAR', change: 6.5, changeValue: 11.3, volume: 2100000, avgVolume: 1800000, marketCap: 295000000000, open: 173.7, high: 187, low: 172.5, sparklineData: generateSparkline(185, 0.028), lastUpdate: new Date() },
  { ticker: 'MTN', name: 'MTN Group', exchange: 'JSE', sector: 'Télécom', price: 92, currency: 'ZAR', change: 5.2, changeValue: 4.55, volume: 3200000, avgVolume: 2500000, marketCap: 168000000000, open: 87.45, high: 93.5, low: 87, sparklineData: generateSparkline(92, 0.025), lastUpdate: new Date() },
  { ticker: 'VOD', name: 'Vodacom', exchange: 'JSE', sector: 'Télécom', price: 128, currency: 'ZAR', change: 4.8, changeValue: 5.86, volume: 1850000, avgVolume: 1500000, marketCap: 192000000000, open: 122.14, high: 129.5, low: 121.8, sparklineData: generateSparkline(128, 0.023), lastUpdate: new Date() },
  
  // NGX - Top performers
  { ticker: 'DANGCEM', name: 'Dangote Cement', exchange: 'NGX', sector: 'Matériaux', price: 285, currency: 'NGN', change: 8.9, changeValue: 23.3, volume: 4500000, avgVolume: 3200000, marketCap: 4850000000000, open: 261.7, high: 288, low: 260, sparklineData: generateSparkline(285, 0.034), lastUpdate: new Date() },
  { ticker: 'MTNN', name: 'MTN Nigeria', exchange: 'NGX', sector: 'Télécom', price: 245, currency: 'NGN', change: 7.5, changeValue: 17.1, volume: 5200000, avgVolume: 4100000, marketCap: 5010000000000, open: 227.9, high: 248, low: 226, sparklineData: generateSparkline(245, 0.031), lastUpdate: new Date() },
  { ticker: 'BUACEMENT', name: 'BUA Cement', exchange: 'NGX', sector: 'Matériaux', price: 98, currency: 'NGN', change: 6.2, changeValue: 5.72, volume: 3800000, avgVolume: 2900000, marketCap: 2940000000000, open: 92.28, high: 99.5, low: 91.8, sparklineData: generateSparkline(98, 0.027), lastUpdate: new Date() },
  
  // Flops - BRVM
  { ticker: 'PALM', name: 'Palmci', exchange: 'BRVM', sector: 'Industrie', price: 5800, currency: 'XOF', change: -6.5, changeValue: -403, volume: 28000, avgVolume: 22000, marketCap: 58000000000, open: 6203, high: 6250, low: 5750, sparklineData: generateSparkline(5800, 0.03), lastUpdate: new Date() },
  { ticker: 'NESTLE', name: 'Nestlé CI', exchange: 'BRVM', sector: 'Consommation', price: 6200, currency: 'XOF', change: -5.8, changeValue: -382, volume: 32000, avgVolume: 25000, marketCap: 62000000000, open: 6582, high: 6600, low: 6150, sparklineData: generateSparkline(6200, 0.028), lastUpdate: new Date() },
  { ticker: 'CFAO', name: 'CFAO Motors CI', exchange: 'BRVM', sector: 'Industrie', price: 720, currency: 'XOF', change: -4.9, changeValue: -37, volume: 45000, avgVolume: 38000, marketCap: 7200000000, open: 757, high: 765, low: 715, sparklineData: generateSparkline(720, 0.025), lastUpdate: new Date() },
  
  // Flops - JSE
  { ticker: 'ANG', name: 'AngloGold Ashanti', exchange: 'JSE', sector: 'Matériaux', price: 285, currency: 'ZAR', change: -7.2, changeValue: -22.1, volume: 1450000, avgVolume: 1200000, marketCap: 119000000000, open: 307.1, high: 310, low: 282, sparklineData: generateSparkline(285, 0.032), lastUpdate: new Date() },
  { ticker: 'IMP', name: 'Impala Platinum', exchange: 'JSE', sector: 'Matériaux', price: 142, currency: 'ZAR', change: -6.8, changeValue: -10.3, volume: 980000, avgVolume: 850000, marketCap: 118000000000, open: 152.3, high: 154, low: 140, sparklineData: generateSparkline(142, 0.03), lastUpdate: new Date() },
  { ticker: 'SSW', name: 'Sibanye Stillwater', exchange: 'JSE', sector: 'Matériaux', price: 38, currency: 'ZAR', change: -5.5, changeValue: -2.21, volume: 2200000, avgVolume: 1900000, marketCap: 110000000000, open: 40.21, high: 40.5, low: 37.5, sparklineData: generateSparkline(38, 0.028), lastUpdate: new Date() },
  
  // Flops - NGX
  { ticker: 'ZENITH', name: 'Zenith Bank', exchange: 'NGX', sector: 'Finance', price: 32, currency: 'NGN', change: -5.9, changeValue: -2.01, volume: 6500000, avgVolume: 5200000, marketCap: 1006000000000, open: 34.01, high: 34.5, low: 31.8, sparklineData: generateSparkline(32, 0.027), lastUpdate: new Date() },
  { ticker: 'GTCO', name: 'Guaranty Trust Holding', exchange: 'NGX', sector: 'Finance', price: 38, currency: 'NGN', change: -4.8, changeValue: -1.92, volume: 5800000, avgVolume: 4800000, marketCap: 1140000000000, open: 39.92, high: 40.2, low: 37.5, sparklineData: generateSparkline(38, 0.025), lastUpdate: new Date() },
  
  // Most Active - High volume
  { ticker: 'AIRTEL', name: 'Airtel Africa', exchange: 'NGX', sector: 'Télécom', price: 1850, currency: 'NGN', change: 2.1, changeValue: 38, volume: 8500000, avgVolume: 6200000, marketCap: 6920000000000, open: 1812, high: 1865, low: 1805, sparklineData: generateSparkline(1850, 0.018), lastUpdate: new Date() },
  { ticker: 'FBNH', name: 'FBN Holdings', exchange: 'NGX', sector: 'Finance', price: 18, currency: 'NGN', change: 1.8, changeValue: 0.32, volume: 7800000, avgVolume: 5900000, marketCap: 322000000000, open: 17.68, high: 18.2, low: 17.6, sparklineData: generateSparkline(18, 0.016), lastUpdate: new Date() },
  { ticker: 'UBA', name: 'United Bank for Africa', exchange: 'NGX', sector: 'Finance', price: 22, currency: 'NGN', change: 2.5, changeValue: 0.54, volume: 7200000, avgVolume: 5500000, marketCap: 748000000000, open: 21.46, high: 22.3, low: 21.4, sparklineData: generateSparkline(22, 0.019), lastUpdate: new Date() },
  { ticker: 'ACCESS', name: 'Access Holdings', exchange: 'NGX', sector: 'Finance', price: 16, currency: 'NGN', change: 1.5, changeValue: 0.24, volume: 6900000, avgVolume: 5300000, marketCap: 570000000000, open: 15.76, high: 16.2, low: 15.7, sparklineData: generateSparkline(16, 0.017), lastUpdate: new Date() },
];

// Fonction pour filtrer les stocks
export const filterStocks = (stocks: Stock[], filters: any): Stock[] => {
  return stocks.filter(stock => {
    if (filters.exchanges?.length > 0 && !filters.exchanges.includes(stock.exchange)) {
      return false;
    }
    if (filters.sectors?.length > 0 && !filters.sectors.includes(stock.sector)) {
      return false;
    }
    if (filters.minVolume && stock.volume < filters.minVolume) {
      return false;
    }
    return true;
  });
};

// Fonction pour obtenir les tops
export const getTopGainers = (stocks: Stock[], limit: number = 10): Stock[] => {
  return [...stocks]
    .sort((a, b) => b.change - a.change)
    .slice(0, limit);
};

// Fonction pour obtenir les flops
export const getTopLosers = (stocks: Stock[], limit: number = 10): Stock[] => {
  return [...stocks]
    .sort((a, b) => a.change - b.change)
    .slice(0, limit);
};

// Fonction pour obtenir les plus actives
export const getMostActive = (stocks: Stock[], limit: number = 10): Stock[] => {
  return [...stocks]
    .sort((a, b) => b.volume - a.volume)
    .slice(0, limit);
};

// Fonction pour calculer les indicateurs du marché
export const calculateMarketIndicators = (stocks: Stock[]): MarketIndicators => {
  const totalChange = stocks.reduce((sum, stock) => sum + stock.change, 0);
  const avgChange = stocks.length > 0 ? totalChange / stocks.length : 0;
  const totalVolume = stocks.reduce((sum, stock) => sum + stock.volume, 0);
  const gainers = stocks.filter(s => s.change > 0).length;
  const losers = stocks.filter(s => s.change < 0).length;
  
  let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (avgChange > 2) sentiment = 'bullish';
  else if (avgChange < -2) sentiment = 'bearish';
  
  return {
    selectedMarket: 'Tous les marchés',
    avgChange,
    totalVolume,
    sentiment,
    activeStocks: stocks.length,
    gainers,
    losers
  };
};

// Fonction pour générer les données heatmap
export const generateHeatmapData = (stocks: Stock[]): HeatmapItem[] => {
  return stocks.map(stock => ({
    ticker: stock.ticker,
    name: stock.name,
    sector: stock.sector,
    exchange: stock.exchange,
    change: stock.change,
    value: stock.marketCap,
    price: stock.price,
    volume: stock.volume,
    marketCap: stock.marketCap,
    sparklineData: stock.sparklineData
  }));
};

// Fonction pour générer les insights
export const generateInsights = (stocks: Stock[]): MarketInsight[] => {
  const insights: MarketInsight[] = [];
  
  // Leader du jour
  const topGainer = getTopGainers(stocks, 1)[0];
  if (topGainer) {
    insights.push({
      id: 'leader',
      type: 'trend',
      title: 'Leader du jour',
      description: `${topGainer.name} (${topGainer.ticker}) +${topGainer.change.toFixed(2)}%`,
      severity: 'success',
      icon: 'trending-up',
      data: topGainer
    });
  }
  
  // Flop du jour
  const topLoser = getTopLosers(stocks, 1)[0];
  if (topLoser) {
    insights.push({
      id: 'flop',
      type: 'trend',
      title: 'Flop du jour',
      description: `${topLoser.name} (${topLoser.ticker}) ${topLoser.change.toFixed(2)}%`,
      severity: 'danger',
      icon: 'trending-down',
      data: topLoser
    });
  }
  
  // Secteur le plus performant
  const sectorPerformance: Record<string, { total: number; count: number }> = {};
  stocks.forEach(stock => {
    if (!sectorPerformance[stock.sector]) {
      sectorPerformance[stock.sector] = { total: 0, count: 0 };
    }
    sectorPerformance[stock.sector].total += stock.change;
    sectorPerformance[stock.sector].count += 1;
  });
  
  const bestSector = Object.entries(sectorPerformance)
    .map(([sector, data]) => ({ sector, avg: data.total / data.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  
  if (bestSector) {
    insights.push({
      id: 'sector',
      type: 'sector',
      title: 'Secteur le plus performant',
      description: `${bestSector.sector} : +${bestSector.avg.toFixed(2)}% en moyenne`,
      severity: 'success',
      icon: 'bar-chart',
      data: bestSector
    });
  }
  
  // Volume anormal
  const highVolumeStocks = stocks.filter(s => s.volume > s.avgVolume * 2);
  if (highVolumeStocks.length > 0) {
    insights.push({
      id: 'volume',
      type: 'volume',
      title: 'Volumes anormaux détectés',
      description: `${highVolumeStocks.length} titre(s) avec volume > 2x la moyenne`,
      severity: 'warning',
      icon: 'activity',
      data: highVolumeStocks
    });
  }
  
  return insights;
};

// Couleurs pour les secteurs
export const SECTOR_COLORS: Record<Sector, string> = {
  'Finance': '#3b82f6',
  'Énergie': '#f59e0b',
  'Télécom': '#8b5cf6',
  'Industrie': '#6366f1',
  'Consommation': '#ec4899',
  'Immobilier': '#14b8a6',
  'Santé': '#10b981',
  'Technologie': '#06b6d4',
  'Matériaux': '#f97316',
  'Services': '#84cc16'
};

// Couleurs pour les bourses
export const EXCHANGE_COLORS: Record<Exchange, string> = {
  'BRVM': '#FF9F04',
  'JSE': '#00BFFF',
  'CSE': '#20C997',
  'NGX': '#10b981',
  'GSE': '#f59e0b',
  'NSE': '#8b5cf6',
  'EGX': '#ec4899',
  'TUNSE': '#06b6d4'
};
