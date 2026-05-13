import { BourseEntity } from '@/core/domain/entities/bourse.entity';
import { StockExchange, LiquidityLevel, GrowthLevel } from '@/types/exchanges';
import { EXCHANGE_STATIC_INFO } from '@/core/data/ExchangesStaticData';

const convertScoreToLevel = (score: number | null | undefined, type: 'liquidity' | 'growth'): LiquidityLevel | GrowthLevel => {
  if (score === null || score === undefined) return 'medium';
  
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
};

const calculateVolatility = (monthlyReturns: (number | null)[]): number => {
  const validReturns = monthlyReturns.filter((r): r is number => r !== null);
  
  if (validReturns.length < 2) return 0;
  
  const mean = validReturns.reduce((sum, r) => sum + r, 0) / validReturns.length;
  const variance = validReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / validReturns.length;
  const monthlyStdDev = Math.sqrt(variance);
  
  return Math.round(monthlyStdDev * Math.sqrt(12) * 10) / 10;
};

const generateVolumeData = (baseVolume: number, length: number = 12): number[] => {
  return Array.from({ length }, (_, i) => {
    const variation = (Math.random() - 0.5) * 0.3;
    return Math.round((baseVolume * (1 + variation)) * 10) / 10;
  });
};

export const transformExchangeData = (backendData: BourseEntity[]): StockExchange[] => {
  return backendData.map(exchange => {
    const ticker = exchange.ticker.toUpperCase();
    const staticInfo = EXCHANGE_STATIC_INFO[ticker];
    
    if (!staticInfo) {
      console.warn(`No static info found for exchange: ${ticker}`);
    }
    
    const principalIndex = exchange.principal_index;
    const monthlyPerformances = principalIndex?.monthly_performances || Array(12).fill(0);
    const validMonthlyReturns = monthlyPerformances.map(p => p ?? 0);
    
    const totalMarketCap = exchange.total_market_cap || 0;
    const listedCompanies = exchange.total_societies_count || 0;
    const averageMarketCap = listedCompanies > 0 
      ? Math.round((totalMarketCap * 1000) / listedCompanies * 10) / 10
      : 0;
    
    const indexValue = principalIndex?.close || 0;
    const indexChangePercent = principalIndex?.change_1d_pct || 0;
    const indexChange = (indexValue * indexChangePercent) / 100;
    
    const volatility = calculateVolatility(validMonthlyReturns);
    const dailyVolume = exchange.total_volume || 0;
    const volumes = generateVolumeData(dailyVolume, 12);
    
    const dominantSectors = (exchange.top_sectors || [])
      .slice(0, 4)
      .map(sector => sector.name);
    
    const transformedExchange: StockExchange = {
      id: ticker.toLowerCase(),
      name: exchange.name,
      shortName: ticker,
      country: staticInfo?.country || 'Unknown',
      region: staticInfo?.region || 'Africa',
      currency: staticInfo?.currency || 'USD',
      timezone: staticInfo?.timezone || 'UTC',
      logo: staticInfo?.logo || '/exchanges/default-logo.png',
      website: staticInfo?.website || '',
      
      listedCompanies,
      totalMarketCap: Math.round(totalMarketCap * 10) / 10,
      averageMarketCap,
      dailyVolume: Math.round(dailyVolume * 10) / 10,
      
      indexName: principalIndex?.name || `${ticker} Index`,
      indexValue: Math.round(indexValue * 100) / 100,
      indexChange: Math.round(indexChange * 100) / 100,
      indexChangePercent: Math.round(indexChangePercent * 100) / 100,
      ytdReturn: Math.round((principalIndex?.change_ytd_pct || 0) * 10) / 10,
      oneYearReturn: Math.round((principalIndex?.change_1y_pct || 0) * 10) / 10,
      threeYearReturn: Math.round((principalIndex?.change_3y_pct || 0) * 10) / 10,
      volatility,
      
      dominantSectors,
      
      liquidity: convertScoreToLevel(exchange.liquidity_score, 'liquidity'),
      growth: convertScoreToLevel(exchange.growth_score, 'growth'),
      dynamism: Math.round(exchange.dynamism_score || 50),
      
      monthlyReturns: validMonthlyReturns.map(r => Math.round(r * 10) / 10),
      volumes,
      
      description: staticInfo?.description || '',
      foundedYear: staticInfo?.foundedYear || 2000,
      lastUpdated: new Date().toISOString()
    };
    
    return transformedExchange;
  });
};
