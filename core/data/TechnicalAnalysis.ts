// ============================================
// Technical Analysis - Data Structure
// ============================================

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockInfo {
  symbol: string;
  name: string;
  market: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  pb: number;
  roe: number;
  dividend: number;
  beta: number;
  avgVolume: number;
  freeFloat: number;
}

export interface TechnicalIndicator {
  id: string;
  name: string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume' | 'price';
  defaultParams: Record<string, number>;
  overlay: boolean; // true = sur le chart principal, false = panel séparé
}

export interface DrawingTool {
  id: string;
  type: 'trendline' | 'horizontal' | 'rectangle' | 'fibonacci' | 'text' | 'measure';
  name: string;
  icon: string;
}

export interface MarketEvent {
  date: string;
  type: 'earnings' | 'dividend' | 'split' | 'announcement';
  title: string;
  description: string;
  impact?: 'positive' | 'negative' | 'neutral';
}

export interface Alert {
  id: string;
  type: 'price' | 'ma_cross' | 'rsi' | 'macd' | 'breakout' | 'volume';
  condition: string;
  value: number;
  active: boolean;
  notification: ('push' | 'email' | 'sms')[];
}

// Périodes disponibles
export type TimePeriod = '1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'Max';
export type TimeGranularity = '1m' | '5m' | '15m' | '1h' | '4h' | '1D' | '1W' | '1M';

// Indicateurs techniques disponibles
export const TECHNICAL_INDICATORS: TechnicalIndicator[] = [
  // Trend
  { id: 'sma20', name: 'SMA 20', category: 'trend', defaultParams: { period: 20 }, overlay: true },
  { id: 'sma50', name: 'SMA 50', category: 'trend', defaultParams: { period: 50 }, overlay: true },
  { id: 'sma100', name: 'SMA 100', category: 'trend', defaultParams: { period: 100 }, overlay: true },
  { id: 'ema', name: 'EMA', category: 'trend', defaultParams: { period: 20 }, overlay: true },
  { id: 'wma', name: 'WMA', category: 'trend', defaultParams: { period: 20 }, overlay: true },
  
  // Momentum
  { id: 'rsi', name: 'RSI', category: 'momentum', defaultParams: { period: 14 }, overlay: false },
  { id: 'macd', name: 'MACD', category: 'momentum', defaultParams: { fast: 12, slow: 26, signal: 9 }, overlay: false },
  { id: 'stochastic', name: 'Stochastique', category: 'momentum', defaultParams: { k: 14, d: 3 }, overlay: false },
  
  // Volatility
  { id: 'bollinger', name: 'Bandes de Bollinger', category: 'volatility', defaultParams: { period: 20, stdDev: 2 }, overlay: true },
  { id: 'atr', name: 'ATR', category: 'volatility', defaultParams: { period: 14 }, overlay: false },
  
  // Volume
  { id: 'obv', name: 'OBV', category: 'volume', defaultParams: {}, overlay: false },
  { id: 'volumeProfile', name: 'Volume Profile', category: 'volume', defaultParams: {}, overlay: true },
  
  // Price
  { id: 'vwap', name: 'VWAP', category: 'price', defaultParams: {}, overlay: true },
  { id: 'pivot', name: 'Pivot Points', category: 'price', defaultParams: {}, overlay: true },
];

// Outils de dessin
export const DRAWING_TOOLS: DrawingTool[] = [
  { id: 'trendline', type: 'trendline', name: 'Ligne de tendance', icon: '📈' },
  { id: 'horizontal', type: 'horizontal', name: 'Ligne horizontale', icon: '—' },
  { id: 'rectangle', type: 'rectangle', name: 'Rectangle', icon: '▭' },
  { id: 'fibonacci', type: 'fibonacci', name: 'Fibonacci', icon: '🔢' },
  { id: 'text', type: 'text', name: 'Texte', icon: 'T' },
  { id: 'measure', type: 'measure', name: 'Règle', icon: '📏' },
];

// Fonction pour générer des données de chandelier (demo)
export function generateCandleData(days: number = 365): Candle[] {
  const data: Candle[] = [];
  let basePrice = 150;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    const open = basePrice + (Math.random() - 0.5) * 5;
    const close = open + (Math.random() - 0.5) * 10;
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    const volume = Math.floor(Math.random() * 10000000) + 5000000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
    
    basePrice = close + (Math.random() - 0.48) * 2; // Légère tendance haussière
  }
  
  return data;
}

// Données demo
export const DEMO_STOCK: StockInfo = {
  symbol: 'AAPL',
  name: 'Apple Inc.',
  market: 'NASDAQ',
  sector: 'Technology',
  currentPrice: 175.43,
  change: 2.34,
  changePercent: 1.35,
  marketCap: 2750000000000,
  pe: 28.5,
  pb: 45.2,
  roe: 147.3,
  dividend: 0.92,
  beta: 1.24,
  avgVolume: 75000000,
  freeFloat: 87.5,
};

export const DEMO_EVENTS: MarketEvent[] = [
  {
    date: '2024-10-31',
    type: 'earnings',
    title: 'Q4 2024 Résultats',
    description: 'Bénéfices supérieurs aux attentes : 1.64$ par action',
    impact: 'positive',
  },
  {
    date: '2024-11-15',
    type: 'dividend',
    title: 'Dividende trimestriel',
    description: 'Versement de 0.24$ par action',
    impact: 'neutral',
  },
  {
    date: '2024-09-12',
    type: 'announcement',
    title: 'Lancement iPhone 16',
    description: 'Présentation de la nouvelle gamme iPhone',
    impact: 'positive',
  },
];
