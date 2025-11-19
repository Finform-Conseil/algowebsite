// ============================================
// QUANTUM LEDGER - Portfolio Transaction Interface & Data
// ============================================

export type TransactionType = 'BUY' | 'SELL';

export interface PortfolioTransaction {
  id: string;
  assetId: string;
  type: TransactionType;
  date: string; // ISO date string
  quantity: number;
  price: number;
}

// ============================================
// Données Factices - Transactions
// ============================================

export const DUMMY_TRANSACTIONS: PortfolioTransaction[] = [
  // Portefeuille PEA
  {
    id: 'tx-1',
    assetId: 'asset-1', // AAPL
    type: 'BUY',
    date: '2024-01-15',
    quantity: 50,
    price: 165.32,
  },
  {
    id: 'tx-2',
    assetId: 'asset-3', // GOOGL
    type: 'BUY',
    date: '2024-02-10',
    quantity: 75,
    price: 128.45,
  },
  {
    id: 'tx-3',
    assetId: 'asset-5', // TSLA
    type: 'BUY',
    date: '2024-03-05',
    quantity: 40,
    price: 198.76,
  },
  {
    id: 'tx-4',
    assetId: 'asset-8', // NVDA
    type: 'BUY',
    date: '2024-04-12',
    quantity: 30,
    price: 412.34,
  },
  {
    id: 'tx-5',
    assetId: 'asset-6', // JPM
    type: 'BUY',
    date: '2024-05-20',
    quantity: 60,
    price: 148.23,
  },
  {
    id: 'tx-6',
    assetId: 'asset-11', // CARMIGNAC
    type: 'BUY',
    date: '2024-06-08',
    quantity: 20,
    price: 598.45,
  },
  {
    id: 'tx-7',
    assetId: 'asset-9', // BND
    type: 'BUY',
    date: '2024-07-15',
    quantity: 100,
    price: 74.56,
  },
  
  // Portefeuille Compte Titres
  {
    id: 'tx-8',
    assetId: 'asset-2', // MSFT
    type: 'BUY',
    date: '2024-01-20',
    quantity: 45,
    price: 362.78,
  },
  {
    id: 'tx-9',
    assetId: 'asset-4', // AMZN
    type: 'BUY',
    date: '2024-02-15',
    quantity: 55,
    price: 148.92,
  },
  {
    id: 'tx-10',
    assetId: 'asset-7', // V
    type: 'BUY',
    date: '2024-03-10',
    quantity: 40,
    price: 258.34,
  },
  {
    id: 'tx-11',
    assetId: 'asset-10', // AGG
    type: 'BUY',
    date: '2024-04-22',
    quantity: 80,
    price: 101.23,
  },
  {
    id: 'tx-12',
    assetId: 'asset-12', // EUROSE
    type: 'BUY',
    date: '2024-05-18',
    quantity: 35,
    price: 228.90,
  },
  {
    id: 'tx-13',
    assetId: 'asset-1', // AAPL
    type: 'BUY',
    date: '2024-06-25',
    quantity: 30,
    price: 172.45,
  },
  {
    id: 'tx-14',
    assetId: 'asset-8', // NVDA
    type: 'BUY',
    date: '2024-07-30',
    quantity: 25,
    price: 445.67,
  },
  {
    id: 'tx-15',
    assetId: 'asset-4', // AMZN (vente partielle)
    type: 'SELL',
    date: '2024-08-10',
    quantity: 20,
    price: 155.23,
  },
];

// Fonction utilitaire pour récupérer les transactions d'un portefeuille
export const getTransactionsByIds = (ids: string[]): PortfolioTransaction[] => {
  return DUMMY_TRANSACTIONS.filter(tx => ids.includes(tx.id));
};
