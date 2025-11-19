// ============================================
// QUANTUM LEDGER - Portfolio Interface & Data
// ============================================

import { PortfolioTransaction } from './PortfolioTransaction';

export interface Portfolio {
  id: string;
  name: string;
  totalValue: number;
  transactions: PortfolioTransaction[];
  performance: number; // Performance en pourcentage
}

export interface PortfolioHolding {
  assetId: string;
  ticker: string;
  name: string;
  type: string;
  quantity: number;
  averagePrice: number; // Prix de Revient Unitaire (PRU)
  currentValue: number;
  gainLoss: number; // Plus/Moins-value en €
  gainLossPercent: number; // Plus/Moins-value en %
}

// ============================================
// Données Factices - Portfolios
// ============================================

import { DUMMY_TRANSACTIONS } from './PortfolioTransaction';

export const DUMMY_PORTFOLIOS: Portfolio[] = [
  {
    id: 'portfolio-1',
    name: 'Portefeuille PEA',
    totalValue: 68456.78,
    transactions: DUMMY_TRANSACTIONS.slice(0, 7), // Premières 7 transactions
    performance: 12.34,
  },
  {
    id: 'portfolio-2',
    name: 'Compte Titres',
    totalValue: 87234.92,
    transactions: DUMMY_TRANSACTIONS.slice(7), // Transactions restantes
    performance: 8.76,
  },
];

// ============================================
// Fonctions Utilitaires
// ============================================

// Calcule les holdings (positions) d'un portefeuille
export const calculatePortfolioHoldings = (
  portfolio: Portfolio,
  getCurrentPrice: (assetId: string) => number,
  getAssetInfo: (assetId: string) => { ticker: string; name: string; type: string } | undefined
): PortfolioHolding[] => {
  const holdingsMap = new Map<string, { quantity: number; totalCost: number }>();

  // Agrège les transactions par actif
  portfolio.transactions.forEach(tx => {
    const current = holdingsMap.get(tx.assetId) || { quantity: 0, totalCost: 0 };
    
    if (tx.type === 'BUY') {
      holdingsMap.set(tx.assetId, {
        quantity: current.quantity + tx.quantity,
        totalCost: current.totalCost + (tx.quantity * tx.price),
      });
    } else if (tx.type === 'SELL') {
      const avgPrice = current.quantity > 0 ? current.totalCost / current.quantity : 0;
      holdingsMap.set(tx.assetId, {
        quantity: current.quantity - tx.quantity,
        totalCost: current.totalCost - (tx.quantity * avgPrice),
      });
    }
  });

  // Convertit en array de holdings
  const holdings: PortfolioHolding[] = [];
  
  holdingsMap.forEach((data, assetId) => {
    if (data.quantity > 0) {
      const assetInfo = getAssetInfo(assetId);
      if (!assetInfo) return;

      const averagePrice = data.totalCost / data.quantity;
      const currentPrice = getCurrentPrice(assetId);
      const currentValue = data.quantity * currentPrice;
      const gainLoss = currentValue - data.totalCost;
      const gainLossPercent = (gainLoss / data.totalCost) * 100;

      holdings.push({
        assetId,
        ticker: assetInfo.ticker,
        name: assetInfo.name,
        type: assetInfo.type,
        quantity: data.quantity,
        averagePrice,
        currentValue,
        gainLoss,
        gainLossPercent,
      });
    }
  });

  return holdings;
};

// Récupère un portefeuille par ID
export const getPortfolioById = (id: string): Portfolio | undefined => {
  return DUMMY_PORTFOLIOS.find(p => p.id === id);
};

// Calcule la valeur totale de tous les portefeuilles
export const getTotalPortfolioValue = (): number => {
  return DUMMY_PORTFOLIOS.reduce((sum, p) => sum + p.totalValue, 0);
};
