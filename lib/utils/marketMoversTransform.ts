import { ActionEntity } from '@/core/domain/entities/action.entity';
import { Stock } from '@/types/market-movers';

const extractSparklineData = (recent_cours: any[] | undefined): number[] => {
  if (!recent_cours || recent_cours.length === 0) {
    return Array(20).fill(0);
  }
  
  const closes = recent_cours
    .map(cours => cours.close)
    .filter((close): close is number => close !== null && close !== undefined);
  
  if (closes.length === 0) {
    return Array(20).fill(0);
  }
  
  if (closes.length >= 20) {
    return closes.slice(-20);
  }
  
  const fillCount = 20 - closes.length;
  const fillValue = closes[0];
  return [...Array(fillCount).fill(fillValue), ...closes];
};

export const transformActionToStock = (action: ActionEntity): Stock | null => {
  try {
    const priceMetric = action.latest_price_metric;
    const valuationRatio = action.latest_valuation_ratio;
    
    if (!priceMetric || !action.society || !action.bourse) {
      console.warn(`Missing required data for action: ${action.ticker}`);
      return null;
    }
    
    const price = priceMetric.price ?? 0;
    const change1dPct = priceMetric.change_1d_pct ?? 0;
    const prevClose = priceMetric.prev_close ?? price;
    const change1d = price - prevClose;
    
    const sector = action.society.activity?.name || action.society.industry?.name || 'Other';
    
    const stock: Stock = {
      ticker: action.ticker,
      name: action.society.name || action.ticker,
      exchange: action.bourse.ticker as any,
      sector: sector as any,
      price: price,
      currency: (action.bourse.currency?.code || 'XOF') as any,
      change: change1dPct,
      changeValue: change1d,
      volume: priceMetric.volume ?? 0,
      avgVolume: priceMetric.vol_avg_20d ?? priceMetric.volume ?? 0,
      marketCap: valuationRatio?.market_cap ?? 0,
      open: priceMetric.open ?? price,
      high: priceMetric.high_52w ?? price,
      low: priceMetric.low_52w ?? price,
      sparklineData: extractSparklineData(action.recent_cours),
      lastUpdate: priceMetric.timestamp ? new Date(priceMetric.timestamp) : new Date()
    };
    
    return stock;
  } catch (error) {
    console.error(`Error transforming action ${action.ticker}:`, error);
    return null;
  }
};

export const transformActionsToStocks = (actions: ActionEntity[]): Stock[] => {
  return actions
    .map(transformActionToStock)
    .filter((stock): stock is Stock => stock !== null);
};
