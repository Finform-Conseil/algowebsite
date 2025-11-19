// ============================================
// QUANTUM LEDGER - Stock Screener V2
// Architecture TradingView avec 20 familles
// ============================================

export interface FilterCriterion {
  id: string;
  family: string;
  name: string;
  field: string;
  type: 'number' | 'percentage' | 'select';
  unit?: string;
  min?: number;
  max?: number;
  options?: string[];
  description?: string;
}

// ============================================
// 20 Familles de Critères
// ============================================

export const FILTER_FAMILIES = [
  'Croissance',
  'Profitabilité',
  'Valorisation',
  'Dividendes',
  'Dette & Structure financière',
  'Activité & Momentum',
  'R&D & Innovation',
  'ESG',
  'Risques',
  'Capitalisation & Taille',
  'Liquidité',
  'Efficacité Opérationnelle',
  'Qualité des Bénéfices',
  'Flux de Trésorerie',
  'Santé du Bilan',
  'Croissance du Dividende',
  'Payout Ratio',
  'Indicateurs Techniques',
  'Sentiment du Marché',
  'Recommandations Analystes',
] as const;

export type FilterFamily = typeof FILTER_FAMILIES[number];

// ============================================
// Tous les Critères par Famille
// ============================================

export const ALL_CRITERIA: FilterCriterion[] = [
  // Croissance
  { id: 'ca_growth_1y', family: 'Croissance', name: 'Croissance CA 1 an', field: 'revenueGrowth1Y', type: 'percentage', min: -50, max: 200 },
  { id: 'ca_growth_3y', family: 'Croissance', name: 'Croissance CA 3 ans', field: 'revenueGrowth3Y', type: 'percentage', min: -50, max: 200 },
  { id: 'ca_growth_5y', family: 'Croissance', name: 'Croissance CA 5 ans', field: 'revenue5YGrowth', type: 'percentage', min: -50, max: 200 },
  { id: 'ebitda_growth', family: 'Croissance', name: 'Croissance EBITDA', field: 'ebitdaGrowth', type: 'percentage', min: -50, max: 200 },
  { id: 'eps_growth', family: 'Croissance', name: 'Croissance EPS', field: 'epsGrowth', type: 'percentage', min: -50, max: 200 },
  { id: 'cashflow_growth', family: 'Croissance', name: 'Croissance Cash-Flow', field: 'cashFlowGrowth', type: 'percentage', min: -50, max: 200 },
  { id: 'cagr_3y', family: 'Croissance', name: 'CAGR 3 ans', field: 'cagr3Y', type: 'percentage', min: -50, max: 200 },
  { id: 'cagr_5y', family: 'Croissance', name: 'CAGR 5 ans', field: 'cagr5Y', type: 'percentage', min: -50, max: 200 },

  // Profitabilité
  { id: 'roe', family: 'Profitabilité', name: 'ROE', field: 'roe', type: 'percentage', min: -50, max: 200 },
  { id: 'roa', family: 'Profitabilité', name: 'ROA', field: 'roa', type: 'percentage', min: -50, max: 100 },
  { id: 'roic', family: 'Profitabilité', name: 'ROIC', field: 'roic', type: 'percentage', min: -50, max: 100 },
  { id: 'net_margin', family: 'Profitabilité', name: 'Marge Nette', field: 'netMargin', type: 'percentage', min: -50, max: 100 },
  { id: 'operating_margin', family: 'Profitabilité', name: 'Marge Opérationnelle', field: 'operatingMargin', type: 'percentage', min: -50, max: 100 },
  { id: 'gross_margin', family: 'Profitabilité', name: 'Marge Brute', field: 'grossMargin', type: 'percentage', min: 0, max: 100 },

  // Valorisation
  { id: 'pe', family: 'Valorisation', name: 'P/E Ratio', field: 'pe', type: 'number', min: 0, max: 200 },
  { id: 'peg', family: 'Valorisation', name: 'PEG Ratio', field: 'peg', type: 'number', min: 0, max: 10 },
  { id: 'pb', family: 'Valorisation', name: 'Price to Book', field: 'priceToBook', type: 'number', min: 0, max: 50 },
  { id: 'ps', family: 'Valorisation', name: 'Price to Sales', field: 'priceToSales', type: 'number', min: 0, max: 50 },
  { id: 'ev_ebitda', family: 'Valorisation', name: 'EV/EBITDA', field: 'evToEbitda', type: 'number', min: 0, max: 100 },
  { id: 'ev_sales', family: 'Valorisation', name: 'EV/Sales', field: 'evToSales', type: 'number', min: 0, max: 50 },

  // Dividendes
  { id: 'div_yield', family: 'Dividendes', name: 'Rendement Dividende', field: 'dividendYield', type: 'percentage', min: 0, max: 20 },
  { id: 'div_payout', family: 'Dividendes', name: 'Payout Ratio', field: 'payoutRatio', type: 'percentage', min: 0, max: 200 },
  { id: 'div_growth_5y', family: 'Dividendes', name: 'Croissance Div. 5 ans', field: 'dividendGrowth5Y', type: 'percentage', min: -50, max: 100 },

  // Dette & Structure financière
  { id: 'debt_equity', family: 'Dette & Structure financière', name: 'Dette / Capitaux', field: 'debtToEquity', type: 'number', min: 0, max: 10 },
  { id: 'debt_ebitda', family: 'Dette & Structure financière', name: 'Dette / EBITDA', field: 'debtToEbitda', type: 'number', min: 0, max: 20 },
  { id: 'interest_coverage', family: 'Dette & Structure financière', name: 'Couverture Intérêts', field: 'interestCoverage', type: 'number', min: -10, max: 100 },
  { id: 'debt_trend', family: 'Dette & Structure financière', name: 'Tendance Dette', field: 'debtTrend', type: 'select', options: ['increasing', 'stable', 'decreasing'] },

  // Activité & Momentum
  { id: 'volume', family: 'Activité & Momentum', name: 'Volume', field: 'volume', type: 'number', min: 0, max: 1000, unit: 'M' },
  { id: 'price_change_1d', family: 'Activité & Momentum', name: 'Variation 1J', field: 'changePercent', type: 'percentage', min: -20, max: 20 },
  { id: 'price_change_1w', family: 'Activité & Momentum', name: 'Variation 1S', field: 'change1W', type: 'percentage', min: -50, max: 50 },
  { id: 'price_change_1m', family: 'Activité & Momentum', name: 'Variation 1M', field: 'change1M', type: 'percentage', min: -50, max: 50 },
  { id: 'price_change_ytd', family: 'Activité & Momentum', name: 'Variation YTD', field: 'changeYTD', type: 'percentage', min: -80, max: 200 },

  // R&D & Innovation
  { id: 'rd_revenue', family: 'R&D & Innovation', name: 'R&D / CA', field: 'rdToRevenue', type: 'percentage', min: 0, max: 50 },
  { id: 'rd_growth_3y', family: 'R&D & Innovation', name: 'Croissance R&D 3 ans', field: 'rdExpenseGrowth3Y', type: 'percentage', min: -50, max: 200 },
  { id: 'patent_count', family: 'R&D & Innovation', name: 'Nombre Brevets', field: 'patentCount', type: 'number', min: 0, max: 10000 },

  // ESG
  { id: 'esg_score', family: 'ESG', name: 'Score ESG', field: 'esgScore', type: 'number', min: 0, max: 100 },
  { id: 'env_score', family: 'ESG', name: 'Score Environnemental', field: 'envScore', type: 'number', min: 0, max: 100 },
  { id: 'social_score', family: 'ESG', name: 'Score Social', field: 'socialScore', type: 'number', min: 0, max: 100 },
  { id: 'gov_score', family: 'ESG', name: 'Score Gouvernance', field: 'govScore', type: 'number', min: 0, max: 100 },

  // Risques
  { id: 'beta', family: 'Risques', name: 'Bêta', field: 'beta', type: 'number', min: -2, max: 5 },
  { id: 'volatility', family: 'Risques', name: 'Volatilité', field: 'volatility', type: 'percentage', min: 0, max: 200 },
  { id: 'sharpe_ratio', family: 'Risques', name: 'Ratio Sharpe', field: 'sharpeRatio', type: 'number', min: -5, max: 10 },
  { id: 'max_drawdown', family: 'Risques', name: 'Drawdown Max', field: 'maxDrawdown', type: 'percentage', min: -100, max: 0 },

  // Capitalisation & Taille
  { id: 'market_cap', family: 'Capitalisation & Taille', name: 'Capitalisation', field: 'marketCap', type: 'number', min: 0, max: 5000, unit: 'Md €' },
  { id: 'revenue', family: 'Capitalisation & Taille', name: 'Chiffre d\'Affaires', field: 'revenue', type: 'number', min: 0, max: 1000, unit: 'Md €' },
  { id: 'employees', family: 'Capitalisation & Taille', name: 'Employés', field: 'employees', type: 'number', min: 0, max: 500000 },

  // Liquidité
  { id: 'current_ratio', family: 'Liquidité', name: 'Ratio de Liquidité', field: 'currentRatio', type: 'number', min: 0, max: 10 },
  { id: 'quick_ratio', family: 'Liquidité', name: 'Quick Ratio', field: 'quickRatio', type: 'number', min: 0, max: 10 },
  { id: 'cash_ratio', family: 'Liquidité', name: 'Cash Ratio', field: 'cashRatio', type: 'number', min: 0, max: 10 },

  // Efficacité Opérationnelle
  { id: 'asset_turnover', family: 'Efficacité Opérationnelle', name: 'Rotation des Actifs', field: 'assetTurnover', type: 'number', min: 0, max: 10 },
  { id: 'inventory_turnover', family: 'Efficacité Opérationnelle', name: 'Rotation Stocks', field: 'inventoryTurnover', type: 'number', min: 0, max: 50 },
  { id: 'receivables_turnover', family: 'Efficacité Opérationnelle', name: 'Rotation Créances', field: 'receivablesTurnover', type: 'number', min: 0, max: 50 },

  // Qualité des Bénéfices
  { id: 'accrual_ratio', family: 'Qualité des Bénéfices', name: 'Ratio Accruals', field: 'accrualRatio', type: 'percentage', min: -50, max: 50 },
  { id: 'earnings_quality', family: 'Qualité des Bénéfices', name: 'Qualité Bénéfices', field: 'earningsQuality', type: 'number', min: 0, max: 100 },

  // Flux de Trésorerie
  { id: 'fcf', family: 'Flux de Trésorerie', name: 'Free Cash Flow', field: 'cashFlow', type: 'number', min: -50000, max: 200000, unit: 'M €' },
  { id: 'fcf_margin', family: 'Flux de Trésorerie', name: 'Marge FCF', field: 'freeCashFlowMargin', type: 'percentage', min: -50, max: 100 },
  { id: 'ocf_growth', family: 'Flux de Trésorerie', name: 'Croissance OCF', field: 'ocfGrowth', type: 'percentage', min: -100, max: 300 },

  // Santé du Bilan
  { id: 'book_value', family: 'Santé du Bilan', name: 'Valeur Comptable', field: 'bookValue', type: 'number', min: 0, max: 500 },
  { id: 'working_capital', family: 'Santé du Bilan', name: 'Fonds de Roulement', field: 'workingCapital', type: 'number', min: -100000, max: 500000, unit: 'M €' },
  { id: 'tangible_book', family: 'Santé du Bilan', name: 'Actifs Tangibles', field: 'tangibleBook', type: 'number', min: 0, max: 500 },

  // Croissance du Dividende
  { id: 'div_cagr_3y', family: 'Croissance du Dividende', name: 'CAGR Div. 3 ans', field: 'dividendCAGR3Y', type: 'percentage', min: -50, max: 100 },
  { id: 'div_cagr_5y', family: 'Croissance du Dividende', name: 'CAGR Div. 5 ans', field: 'dividendCAGR5Y', type: 'percentage', min: -50, max: 100 },
  { id: 'div_years', family: 'Croissance du Dividende', name: 'Années Div. Consécutives', field: 'consecutiveDividendYears', type: 'number', min: 0, max: 100 },

  // Payout Ratio
  { id: 'payout_fcf', family: 'Payout Ratio', name: 'Payout / FCF', field: 'payoutToFCF', type: 'percentage', min: 0, max: 200 },
  { id: 'payout_earnings', family: 'Payout Ratio', name: 'Payout / Bénéfices', field: 'payoutRatio', type: 'percentage', min: 0, max: 200 },

  // Indicateurs Techniques
  { id: 'rsi', family: 'Indicateurs Techniques', name: 'RSI', field: 'rsi', type: 'number', min: 0, max: 100 },
  { id: 'macd', family: 'Indicateurs Techniques', name: 'MACD', field: 'macd', type: 'number', min: -50, max: 50 },
  { id: 'ma_50', family: 'Indicateurs Techniques', name: 'MA 50J', field: 'ma50', type: 'number', min: 0, max: 10000 },
  { id: 'ma_200', family: 'Indicateurs Techniques', name: 'MA 200J', field: 'ma200', type: 'number', min: 0, max: 10000 },

  // Sentiment du Marché
  { id: 'short_interest', family: 'Sentiment du Marché', name: 'Short Interest', field: 'shortInterest', type: 'percentage', min: 0, max: 50 },
  { id: 'insider_ownership', family: 'Sentiment du Marché', name: 'Détention Insiders', field: 'insiderOwnership', type: 'percentage', min: 0, max: 100 },
  { id: 'institutional_ownership', family: 'Sentiment du Marché', name: 'Détention Institutionnelle', field: 'institutionalOwnership', type: 'percentage', min: 0, max: 100 },

  // Recommandations Analystes
  { id: 'analyst_rating', family: 'Recommandations Analystes', name: 'Rating Moyen', field: 'analystRating', type: 'select', options: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell'] },
  { id: 'analyst_count', family: 'Recommandations Analystes', name: 'Nombre Analystes', field: 'analystCount', type: 'number', min: 0, max: 100 },
  { id: 'target_price', family: 'Recommandations Analystes', name: 'Prix Cible', field: 'targetPrice', type: 'number', min: 0, max: 10000 },
  { id: 'upside', family: 'Recommandations Analystes', name: 'Upside Potentiel', field: 'upside', type: 'percentage', min: -80, max: 300 },
];

// ============================================
// Scénarios Prédéfinis
// ============================================

export interface Scenario {
  id: string;
  name: string;
  description: string;
  icon: string;
  filters: {
    criterionId: string;
    operator: '>=' | '<=' | '=' | '>' | '<';
    value: number | string;
  }[];
}

export const PREDEFINED_SCENARIOS: Scenario[] = [
  {
    id: 'growth_sustainable',
    name: 'Croissance Durable',
    description: 'Entreprises avec CA en hausse sur 5 ans et dividendes réguliers',
    icon: '🌱',
    filters: [
      { criterionId: 'ca_growth_5y', operator: '>=', value: 20 },
      { criterionId: 'div_yield', operator: '>=', value: 1 },
      { criterionId: 'fcf', operator: '>=', value: 0 },
      { criterionId: 'roe', operator: '>=', value: 15 },
    ],
  },
  {
    id: 'innovation_sustained',
    name: 'Innovation Soutenue',
    description: 'Sociétés dont les dépenses R&D progressent depuis 3 ans',
    icon: '💡',
    filters: [
      { criterionId: 'rd_growth_3y', operator: '>=', value: 15 },
      { criterionId: 'operating_margin', operator: '>=', value: 20 },
      { criterionId: 'pe', operator: '<=', value: 50 },
      { criterionId: 'rd_revenue', operator: '>=', value: 5 },
    ],
  },
  {
    id: 'financial_solid',
    name: 'Solidité Financière',
    description: 'Cash-flow positif et dette en baisse continue',
    icon: '💪',
    filters: [
      { criterionId: 'fcf', operator: '>=', value: 5000 },
      { criterionId: 'debt_trend', operator: '=', value: 'decreasing' },
      { criterionId: 'current_ratio', operator: '>=', value: 1.5 },
      { criterionId: 'debt_equity', operator: '<=', value: 0.5 },
    ],
  },
  {
    id: 'contrarian_picks',
    name: 'Contrarian Picks',
    description: 'Actions sous-valorisées avec fondamentaux solides',
    icon: '🎯',
    filters: [
      { criterionId: 'pe', operator: '<=', value: 15 },
      { criterionId: 'pb', operator: '<=', value: 2 },
      { criterionId: 'roe', operator: '>=', value: 12 },
      { criterionId: 'price_change_ytd', operator: '<=', value: -10 },
    ],
  },
  {
    id: 'dividend_quality',
    name: 'High Dividend Quality',
    description: 'Dividendes élevés et soutenables avec croissance',
    icon: '💰',
    filters: [
      { criterionId: 'div_yield', operator: '>=', value: 3 },
      { criterionId: 'payout_earnings', operator: '<=', value: 70 },
      { criterionId: 'div_years', operator: '>=', value: 10 },
      { criterionId: 'div_cagr_5y', operator: '>=', value: 5 },
    ],
  },
];

// ============================================
// Interface pour les filtres actifs
// ============================================

export interface ActiveFilter {
  id: string;
  criterion: FilterCriterion;
  operator: '>=' | '<=' | '=' | '>' | '<';
  value: number | string;
}
