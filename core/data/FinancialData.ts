import {
  CompanyProfile,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  FinancialRatios,
  CompanyStatistics,
  FinancialData
} from '@/types/financial-analysis';

// Sample Company: Sonatel (Sénégal Telecom)
export const SONATEL_PROFILE: CompanyProfile = {
  id: 'sonatel',
  name: 'Sonatel',
  ticker: 'SNTS',
  exchange: 'BRVM',
  sector: 'Télécommunications',
  industry: 'Services de télécommunications',
  description: 'Sonatel est le principal opérateur de télécommunications au Sénégal et dans plusieurs pays d\'Afrique de l\'Ouest. La société offre des services de téléphonie mobile, fixe, internet et data.',
  
  ceo: 'Sékou Dramé',
  cfo: 'Abdou Karim Mbengue',
  chairman: 'Mamadou Mbengue',
  
  founded: 1985,
  employees: 3200,
  headquarters: 'Dakar, Sénégal',
  website: 'https://www.sonatel.sn',
  
  marketCap: 1250000000000, // XOF
  sharesOutstanding: 100000000,
  currency: 'XOF',
  
  ipoDate: '1999-03-15',
  ipoPrice: 8500,
  
  parentCompany: 'Orange Group',
  subsidiaries: ['Orange Money Sénégal', 'Sonatel Mali', 'Sonatel Guinée'],
  
  annualReportUrl: '#',
  investorRelationsUrl: '#',
  latestPresentationUrl: '#'
};

// Income Statements (3 years)
export const SONATEL_INCOME: IncomeStatement[] = [
  {
    period: '2024',
    periodType: 'annual',
    revenue: 850000000000,
    costOfRevenue: 320000000000,
    grossProfit: 530000000000,
    operatingExpenses: 180000000000,
    sellingGeneralAdmin: 180000000000,
    operatingIncome: 350000000000,
    interestExpense: 15000000000,
    otherIncomeExpense: 5000000000,
    incomeBeforeTax: 340000000000,
    incomeTax: 85000000000,
    netIncome: 255000000000,
    eps: 2550,
    epsBasic: 2550,
    epsDiluted: 2550,
    weightedAverageShares: 100000000,
    weightedAverageSharesDiluted: 100000000
  },
  {
    period: '2023',
    periodType: 'annual',
    revenue: 780000000000,
    costOfRevenue: 295000000000,
    grossProfit: 485000000000,
    operatingExpenses: 165000000000,
    sellingGeneralAdmin: 165000000000,
    operatingIncome: 320000000000,
    interestExpense: 12000000000,
    otherIncomeExpense: 3000000000,
    incomeBeforeTax: 311000000000,
    incomeTax: 77750000000,
    netIncome: 233250000000,
    eps: 2333,
    epsBasic: 2333,
    epsDiluted: 2333,
    weightedAverageShares: 100000000,
    weightedAverageSharesDiluted: 100000000
  },
  {
    period: '2022',
    periodType: 'annual',
    revenue: 720000000000,
    costOfRevenue: 275000000000,
    grossProfit: 445000000000,
    operatingExpenses: 155000000000,
    sellingGeneralAdmin: 155000000000,
    operatingIncome: 290000000000,
    interestExpense: 10000000000,
    otherIncomeExpense: 2000000000,
    incomeBeforeTax: 282000000000,
    incomeTax: 70500000000,
    netIncome: 211500000000,
    eps: 2115,
    epsBasic: 2115,
    epsDiluted: 2115,
    weightedAverageShares: 100000000,
    weightedAverageSharesDiluted: 100000000
  }
];

// Balance Sheets
export const SONATEL_BALANCE: BalanceSheet[] = [
  {
    period: '2024',
    periodType: 'annual',
    cashAndEquivalents: 180000000000,
    shortTermInvestments: 50000000000,
    accountsReceivable: 120000000000,
    inventory: 25000000000,
    currentAssets: 375000000000,
    propertyPlantEquipment: 650000000000,
    goodwill: 80000000000,
    intangibleAssets: 120000000000,
    longTermInvestments: 45000000000,
    totalAssets: 1270000000000,
    accountsPayable: 95000000000,
    shortTermDebt: 60000000000,
    currentLiabilities: 220000000000,
    longTermDebt: 280000000000,
    totalLiabilities: 550000000000,
    commonStock: 100000000000,
    retainedEarnings: 620000000000,
    totalEquity: 720000000000,
    totalLiabilitiesAndEquity: 1270000000000
  },
  {
    period: '2023',
    periodType: 'annual',
    cashAndEquivalents: 165000000000,
    shortTermInvestments: 45000000000,
    accountsReceivable: 110000000000,
    inventory: 22000000000,
    currentAssets: 342000000000,
    propertyPlantEquipment: 620000000000,
    goodwill: 80000000000,
    intangibleAssets: 115000000000,
    longTermInvestments: 40000000000,
    totalAssets: 1197000000000,
    accountsPayable: 88000000000,
    shortTermDebt: 55000000000,
    currentLiabilities: 205000000000,
    longTermDebt: 295000000000,
    totalLiabilities: 545000000000,
    commonStock: 100000000000,
    retainedEarnings: 552000000000,
    totalEquity: 652000000000,
    totalLiabilitiesAndEquity: 1197000000000
  },
  {
    period: '2022',
    periodType: 'annual',
    cashAndEquivalents: 150000000000,
    shortTermInvestments: 40000000000,
    accountsReceivable: 105000000000,
    inventory: 20000000000,
    currentAssets: 315000000000,
    propertyPlantEquipment: 590000000000,
    goodwill: 80000000000,
    intangibleAssets: 110000000000,
    longTermInvestments: 35000000000,
    totalAssets: 1130000000000,
    accountsPayable: 82000000000,
    shortTermDebt: 50000000000,
    currentLiabilities: 190000000000,
    longTermDebt: 310000000000,
    totalLiabilities: 540000000000,
    commonStock: 100000000000,
    retainedEarnings: 490000000000,
    totalEquity: 590000000000,
    totalLiabilitiesAndEquity: 1130000000000
  }
];

// Cash Flow Statements
export const SONATEL_CASHFLOW: CashFlowStatement[] = [
  {
    period: '2024',
    periodType: 'annual',
    netIncome: 255000000000,
    depreciationAmortization: 95000000000,
    changeInWorkingCapital: -15000000000,
    operatingCashFlow: 335000000000,
    capitalExpenditures: -125000000000,
    acquisitions: 0,
    investmentPurchases: -10000000000,
    investingCashFlow: -135000000000,
    debtIssuance: 50000000000,
    debtRepayment: -65000000000,
    dividendsPaid: -170000000000,
    stockIssuance: 0,
    stockRepurchase: 0,
    financingCashFlow: -185000000000,
    netChangeInCash: 15000000000,
    cashAtBeginning: 165000000000,
    cashAtEnd: 180000000000,
    freeCashFlow: 210000000000
  },
  {
    period: '2023',
    periodType: 'annual',
    netIncome: 233250000000,
    depreciationAmortization: 88000000000,
    changeInWorkingCapital: -12000000000,
    operatingCashFlow: 309250000000,
    capitalExpenditures: -115000000000,
    acquisitions: 0,
    investmentPurchases: -8000000000,
    investingCashFlow: -123000000000,
    debtIssuance: 45000000000,
    debtRepayment: -60000000000,
    dividendsPaid: -156000000000,
    stockIssuance: 0,
    stockRepurchase: 0,
    financingCashFlow: -171000000000,
    netChangeInCash: 15250000000,
    cashAtBeginning: 150000000000,
    cashAtEnd: 165000000000,
    freeCashFlow: 194250000000
  },
  {
    period: '2022',
    periodType: 'annual',
    netIncome: 211500000000,
    depreciationAmortization: 82000000000,
    changeInWorkingCapital: -10000000000,
    operatingCashFlow: 283500000000,
    capitalExpenditures: -105000000000,
    acquisitions: 0,
    investmentPurchases: -7000000000,
    investingCashFlow: -112000000000,
    debtIssuance: 40000000000,
    debtRepayment: -55000000000,
    dividendsPaid: -142000000000,
    stockIssuance: 0,
    stockRepurchase: 0,
    financingCashFlow: -157000000000,
    netChangeInCash: 14500000000,
    cashAtBeginning: 135500000000,
    cashAtEnd: 150000000000,
    freeCashFlow: 178500000000
  }
];

// Financial Ratios
export const SONATEL_RATIOS: FinancialRatios[] = [
  {
    period: '2024',
    grossMargin: 62.4,
    operatingMargin: 41.2,
    netMargin: 30.0,
    returnOnAssets: 20.1,
    returnOnEquity: 35.4,
    returnOnInvestedCapital: 28.5,
    currentRatio: 1.70,
    quickRatio: 1.59,
    cashRatio: 1.05,
    debtToEquity: 0.47,
    debtToAssets: 0.27,
    equityMultiplier: 1.76,
    interestCoverage: 23.3,
    assetTurnover: 0.67,
    inventoryTurnover: 12.8,
    receivablesTurnover: 7.1,
    revenuePerEmployee: 265625000,
    netIncomePerEmployee: 79687500,
    priceToEarnings: 4.9,
    priceToBook: 1.74,
    priceToSales: 1.47,
    evToEbitda: 3.2
  },
  {
    period: '2023',
    grossMargin: 62.2,
    operatingMargin: 41.0,
    netMargin: 29.9,
    returnOnAssets: 19.5,
    returnOnEquity: 35.8,
    returnOnInvestedCapital: 28.2,
    currentRatio: 1.67,
    quickRatio: 1.56,
    cashRatio: 1.02,
    debtToEquity: 0.54,
    debtToAssets: 0.29,
    equityMultiplier: 1.84,
    interestCoverage: 26.7,
    assetTurnover: 0.65,
    inventoryTurnover: 13.4,
    receivablesTurnover: 7.1,
    revenuePerEmployee: 243750000,
    netIncomePerEmployee: 72890625
  },
  {
    period: '2022',
    grossMargin: 61.8,
    operatingMargin: 40.3,
    netMargin: 29.4,
    returnOnAssets: 18.7,
    returnOnEquity: 35.8,
    returnOnInvestedCapital: 27.5,
    currentRatio: 1.66,
    quickRatio: 1.55,
    cashRatio: 1.00,
    debtToEquity: 0.61,
    debtToAssets: 0.32,
    equityMultiplier: 1.92,
    interestCoverage: 29.0,
    assetTurnover: 0.64,
    inventoryTurnover: 13.8,
    receivablesTurnover: 6.9,
    revenuePerEmployee: 225000000,
    netIncomePerEmployee: 66093750
  }
];

// Company Statistics
export const SONATEL_STATS: CompanyStatistics = {
  revenueGrowth: 9.0,
  netIncomeGrowth: 9.3,
  epsGrowth: 9.3,
  avgROE: 35.7,
  avgROA: 19.4,
  avgNetMargin: 29.8,
  revenueCAGR3Y: 8.7,
  revenueCAGR5Y: 8.2,
  earningsVolatility: 4.2,
  revenueVolatility: 3.8,
  vsIndustryROE: 12.5,
  vsIndustryMargin: 8.3
};

// Complete Financial Data
export const SONATEL_DATA: FinancialData = {
  profile: SONATEL_PROFILE,
  incomeStatements: SONATEL_INCOME,
  balanceSheets: SONATEL_BALANCE,
  cashFlowStatements: SONATEL_CASHFLOW,
  ratios: SONATEL_RATIOS,
  statistics: SONATEL_STATS
};

// Utility Functions
export function formatCurrency(value: number, currency: string = 'XOF'): string {
  if (currency === 'XOF') {
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(2)}T XOF`;
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(2)}B XOF`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(2)}M XOF`;
    }
    return `${value.toLocaleString()} XOF`;
  }
  return `${value.toLocaleString()} ${currency}`;
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatRatio(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function calculateCAGR(endValue: number, startValue: number, years: number): number {
  if (startValue === 0 || years === 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}
