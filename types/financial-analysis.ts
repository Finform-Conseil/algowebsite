// Financial Analysis Types

export type ReportPeriod = 'annual' | 'quarterly';
export type Currency = 'XOF' | 'ZAR' | 'EGP' | 'NGN' | 'USD' | 'EUR';

// Company Profile
export interface CompanyProfile {
  id: string;
  name: string;
  ticker: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  
  // Leadership
  ceo: string;
  cfo?: string;
  chairman?: string;
  
  // Company Info
  founded: number;
  employees: number;
  headquarters: string;
  website: string;
  
  // Market Data
  marketCap: number;
  sharesOutstanding: number;
  currency: Currency;
  
  // Historical
  ipoDate?: string;
  ipoPrice?: number;
  
  // Structure
  parentCompany?: string;
  subsidiaries?: string[];
  
  // Documents
  annualReportUrl?: string;
  investorRelationsUrl?: string;
  latestPresentationUrl?: string;
}

// Financial Statements
export interface IncomeStatement {
  period: string; // YYYY or YYYY-Q1
  periodType: ReportPeriod;
  
  // Revenue
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  
  // Operating
  operatingExpenses: number;
  researchDevelopment?: number;
  sellingGeneralAdmin: number;
  operatingIncome: number;
  
  // Non-Operating
  interestExpense: number;
  otherIncomeExpense: number;
  
  // Profit
  incomeBeforeTax: number;
  incomeTax: number;
  netIncome: number;
  
  // Per Share
  eps: number;
  epsBasic: number;
  epsDiluted: number;
  
  // Shares
  weightedAverageShares: number;
  weightedAverageSharesDiluted: number;
}

export interface BalanceSheet {
  period: string;
  periodType: ReportPeriod;
  
  // Assets
  cashAndEquivalents: number;
  shortTermInvestments: number;
  accountsReceivable: number;
  inventory: number;
  currentAssets: number;
  
  propertyPlantEquipment: number;
  goodwill: number;
  intangibleAssets: number;
  longTermInvestments: number;
  totalAssets: number;
  
  // Liabilities
  accountsPayable: number;
  shortTermDebt: number;
  currentLiabilities: number;
  
  longTermDebt: number;
  totalLiabilities: number;
  
  // Equity
  commonStock: number;
  retainedEarnings: number;
  totalEquity: number;
  
  totalLiabilitiesAndEquity: number;
}

export interface CashFlowStatement {
  period: string;
  periodType: ReportPeriod;
  
  // Operating Activities
  netIncome: number;
  depreciationAmortization: number;
  changeInWorkingCapital: number;
  operatingCashFlow: number;
  
  // Investing Activities
  capitalExpenditures: number;
  acquisitions?: number;
  investmentPurchases: number;
  investingCashFlow: number;
  
  // Financing Activities
  debtIssuance: number;
  debtRepayment: number;
  dividendsPaid: number;
  stockIssuance: number;
  stockRepurchase: number;
  financingCashFlow: number;
  
  // Net Change
  netChangeInCash: number;
  cashAtBeginning: number;
  cashAtEnd: number;
  
  // Free Cash Flow
  freeCashFlow: number;
}

// Financial Ratios
export interface FinancialRatios {
  period: string;
  
  // Profitability
  grossMargin: number; // %
  operatingMargin: number; // %
  netMargin: number; // %
  returnOnAssets: number; // ROA %
  returnOnEquity: number; // ROE %
  returnOnInvestedCapital: number; // ROIC %
  
  // Liquidity
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  
  // Leverage
  debtToEquity: number;
  debtToAssets: number;
  equityMultiplier: number;
  interestCoverage: number;
  
  // Efficiency
  assetTurnover: number;
  inventoryTurnover: number;
  receivablesTurnover: number;
  
  // Productivity
  revenuePerEmployee: number;
  netIncomePerEmployee: number;
  
  // Valuation (if public)
  priceToEarnings?: number;
  priceToBook?: number;
  priceToSales?: number;
  evToEbitda?: number;
}

// Company Statistics
export interface CompanyStatistics {
  // Growth Rates (YoY %)
  revenueGrowth: number;
  netIncomeGrowth: number;
  epsGrowth: number;
  
  // Averages (3-year)
  avgROE: number;
  avgROA: number;
  avgNetMargin: number;
  
  // Trends
  revenueCAGR3Y: number; // 3-year CAGR
  revenueCAGR5Y?: number; // 5-year CAGR
  
  // Stability
  earningsVolatility: number; // Standard deviation
  revenueVolatility: number;
  
  // Comparison to Sector
  vsIndustryROE?: number; // % difference
  vsIndustryMargin?: number;
}

// Complete Financial Data
export interface FinancialData {
  profile: CompanyProfile;
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
  cashFlowStatements: CashFlowStatement[];
  ratios: FinancialRatios[];
  statistics: CompanyStatistics;
}

// Comparison Data
export interface CompanyComparison {
  companies: CompanyProfile[];
  metrics: {
    metric: string;
    values: { [companyId: string]: number };
    unit: string;
  }[];
}

// Filters
export interface FinancialFilters {
  periodType?: ReportPeriod;
  periods?: string[]; // Specific periods to show
  compareCompanies?: string[]; // Company IDs to compare
}
