// ============================================
// Column Registry - Univers complet des colonnes disponibles
// Organisé par concept pour faciliter la navigation
// ============================================

import { ActionEntity } from '@/core/domain/entities/action.entity';

export type ColumnType = 'number' | 'percentage' | 'currency' | 'boolean' | 'string';

export interface ColumnDefinition {
  id: string;
  name: string;
  field: string; // Chemin vers le champ dans ActionEntity
  backendField: string; // Champ pour le tri backend (format Django)
  type: ColumnType;
  description: string;
  format?: (value: any) => string;
  accessor: (action: ActionEntity) => any;
}

export interface ColumnCategory {
  id: string;
  name: string;
  icon: string;
  columns: ColumnDefinition[];
}

// Helper pour formater les valeurs
const formatters = {
  percentage: (value: number | null) => value != null ? `${value.toFixed(2)}%` : '--',
  currency: (value: number | null) => value != null ? `$${(value / 1000000).toFixed(2)}M` : '--',
  number: (value: number | null, decimals: number = 2) => value != null ? value.toFixed(decimals) : '--',
  boolean: (value: boolean | null) => value === true ? '✓' : value === false ? '✗' : '--',
};

// ============================================
// TREND - Indicateurs de tendance
// ============================================
const TREND_COLUMNS: ColumnDefinition[] = [
  {
    id: 'sma_50',
    name: 'SMA 50',
    field: 'latest_technical_indicator.sma_50',
    backendField: 'latest_technical_indicator__sma_50',
    type: 'number',
    description: 'Moyenne mobile simple sur 50 périodes',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_technical_indicator?.sma_50,
  },
  {
    id: 'sma_200',
    name: 'SMA 200',
    field: 'latest_technical_indicator.sma_200',
    backendField: 'latest_technical_indicator__sma_200',
    type: 'number',
    description: 'Moyenne mobile simple sur 200 périodes',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_technical_indicator?.sma_200,
  },
  {
    id: 'ema_20',
    name: 'EMA 20',
    field: 'latest_technical_indicator.ema_20',
    backendField: 'latest_technical_indicator__ema_20',
    type: 'number',
    description: 'Moyenne mobile exponentielle sur 20 périodes',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_technical_indicator?.ema_20,
  },
  {
    id: 'price_vs_sma50_pct',
    name: 'Prix vs SMA50',
    field: 'latest_technical_indicator.price_vs_sma50_pct',
    backendField: 'latest_technical_indicator__price_vs_sma50_pct',
    type: 'percentage',
    description: 'Distance du prix par rapport à la SMA 50',
    format: formatters.percentage,
    accessor: (action) => action.latest_technical_indicator?.price_vs_sma50_pct,
  },
  {
    id: 'price_vs_sma200_pct',
    name: 'Prix vs SMA200',
    field: 'latest_technical_indicator.price_vs_sma200_pct',
    backendField: 'latest_technical_indicator__price_vs_sma200_pct',
    type: 'percentage',
    description: 'Distance du prix par rapport à la SMA 200',
    format: formatters.percentage,
    accessor: (action) => action.latest_technical_indicator?.price_vs_sma200_pct,
  },
  {
    id: 'golden_cross',
    name: 'Golden Cross',
    field: 'latest_technical_indicator.golden_cross',
    backendField: 'latest_technical_indicator__golden_cross',
    type: 'boolean',
    description: 'SMA 50 croise au-dessus de la SMA 200 (signal haussier)',
    format: formatters.boolean,
    accessor: (action) => action.latest_technical_indicator?.golden_cross,
  },
  {
    id: 'death_cross',
    name: 'Death Cross',
    field: 'latest_technical_indicator.death_cross',
    backendField: 'latest_technical_indicator__death_cross',
    type: 'boolean',
    description: 'SMA 50 croise en-dessous de la SMA 200 (signal baissier)',
    format: formatters.boolean,
    accessor: (action) => action.latest_technical_indicator?.death_cross,
  },
  {
    id: 'adx',
    name: 'ADX',
    field: 'latest_technical_indicator.adx',
    backendField: 'latest_technical_indicator__adx',
    type: 'number',
    description: 'Average Directional Index - Force de la tendance',
    format: (v) => formatters.number(v, 1),
    accessor: (action) => action.latest_technical_indicator?.adx,
  },
];

// ============================================
// MOMENTUM - Indicateurs de momentum
// ============================================
const MOMENTUM_COLUMNS: ColumnDefinition[] = [
  {
    id: 'rsi_14',
    name: 'RSI 14',
    field: 'latest_technical_indicator.rsi_14',
    backendField: 'latest_technical_indicator__rsi_14',
    type: 'number',
    description: 'Relative Strength Index sur 14 périodes',
    format: (v) => formatters.number(v, 1),
    accessor: (action) => action.latest_technical_indicator?.rsi_14,
  },
  {
    id: 'macd_histogram',
    name: 'MACD Hist',
    field: 'latest_technical_indicator.macd_histogram',
    backendField: 'latest_technical_indicator__macd_histogram',
    type: 'number',
    description: 'MACD Histogramme - Divergence entre MACD et signal',
    format: (v) => formatters.number(v, 3),
    accessor: (action) => action.latest_technical_indicator?.macd_histogram,
  },
  {
    id: 'stoch_k',
    name: 'Stochastic %K',
    field: 'latest_technical_indicator.stoch_k',
    backendField: 'latest_technical_indicator__stoch_k',
    type: 'number',
    description: 'Stochastique %K - Momentum oscillator',
    format: (v) => formatters.number(v, 1),
    accessor: (action) => action.latest_technical_indicator?.stoch_k,
  },
  {
    id: 'mfi_14',
    name: 'MFI 14',
    field: 'latest_technical_indicator.mfi_14',
    backendField: 'latest_technical_indicator__mfi_14',
    type: 'number',
    description: 'Money Flow Index - RSI pondéré par le volume',
    format: (v) => formatters.number(v, 1),
    accessor: (action) => action.latest_technical_indicator?.mfi_14,
  },
  {
    id: 'change_1m_pct',
    name: 'Perf 1M',
    field: 'latest_price_metric.change_1m_pct',
    backendField: 'latest_price_metric__change_1m_pct',
    type: 'percentage',
    description: 'Performance sur 1 mois',
    format: formatters.percentage,
    accessor: (action) => action.latest_price_metric?.change_1m_pct,
  },
  {
    id: 'change_3m_pct',
    name: 'Perf 3M',
    field: 'latest_price_metric.change_3m_pct',
    backendField: 'latest_price_metric__change_3m_pct',
    type: 'percentage',
    description: 'Performance sur 3 mois',
    format: formatters.percentage,
    accessor: (action) => action.latest_price_metric?.change_3m_pct,
  },
  {
    id: 'vol_relative',
    name: 'Vol Relatif',
    field: 'latest_price_metric.vol_relative',
    backendField: 'latest_price_metric__vol_relative',
    type: 'number',
    description: 'Volume relatif par rapport à la moyenne',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_price_metric?.vol_relative,
  },
];

// ============================================
// VOLATILITY - Indicateurs de volatilité
// ============================================
const VOLATILITY_COLUMNS: ColumnDefinition[] = [
  {
    id: 'atr_14',
    name: 'ATR 14',
    field: 'latest_technical_indicator.atr_14',
    backendField: 'latest_technical_indicator__atr_14',
    type: 'number',
    description: 'Average True Range - Mesure de volatilité',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_technical_indicator?.atr_14,
  },
  {
    id: 'bb_width',
    name: 'BB Width',
    field: 'latest_technical_indicator.bb_width',
    backendField: 'latest_technical_indicator__bb_width',
    type: 'number',
    description: 'Largeur des Bandes de Bollinger',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_technical_indicator?.bb_width,
  },
  {
    id: 'bb_pct',
    name: 'BB %',
    field: 'latest_technical_indicator.bb_pct',
    backendField: 'latest_technical_indicator__bb_pct',
    type: 'percentage',
    description: 'Position du prix dans les Bandes de Bollinger',
    format: formatters.percentage,
    accessor: (action) => action.latest_technical_indicator?.bb_pct,
  },
  {
    id: 'hv_20',
    name: 'HV 20',
    field: 'latest_technical_indicator.hv_20',
    backendField: 'latest_technical_indicator__hv_20',
    type: 'percentage',
    description: 'Volatilité historique sur 20 jours',
    format: formatters.percentage,
    accessor: (action) => action.latest_technical_indicator?.hv_20,
  },
  {
    id: 'beta_5y',
    name: 'Beta 5Y',
    field: 'latest_valuation_ratio.beta_5y',
    backendField: 'latest_valuation_ratio__beta_5y',
    type: 'number',
    description: 'Beta sur 5 ans - Volatilité relative au marché',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.beta_5y,
  },
];

// ============================================
// VALUATION - Ratios de valorisation
// ============================================
const VALUATION_COLUMNS: ColumnDefinition[] = [
  {
    id: 'pe_ttm',
    name: 'P/E TTM',
    field: 'latest_valuation_ratio.pe_ttm',
    backendField: 'latest_valuation_ratio__pe_ttm',
    type: 'number',
    description: 'Price to Earnings Ratio (12 derniers mois)',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.pe_ttm,
  },
  {
    id: 'pb_ratio',
    name: 'P/B',
    field: 'latest_valuation_ratio.pb_ratio',
    backendField: 'latest_valuation_ratio__pb_ratio',
    type: 'number',
    description: 'Price to Book Ratio',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.pb_ratio,
  },
  {
    id: 'ps_ratio',
    name: 'P/S',
    field: 'latest_valuation_ratio.ps_ratio',
    backendField: 'latest_valuation_ratio__ps_ratio',
    type: 'number',
    description: 'Price to Sales Ratio',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.ps_ratio,
  },
  {
    id: 'peg_ratio',
    name: 'PEG',
    field: 'latest_valuation_ratio.peg_ratio',
    backendField: 'latest_valuation_ratio__peg_ratio',
    type: 'number',
    description: 'Price/Earnings to Growth Ratio',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.peg_ratio,
  },
  {
    id: 'ev_ebitda',
    name: 'EV/EBITDA',
    field: 'latest_valuation_ratio.ev_ebitda',
    backendField: 'latest_valuation_ratio__ev_ebitda',
    type: 'number',
    description: 'Enterprise Value to EBITDA',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.ev_ebitda,
  },
  {
    id: 'market_cap',
    name: 'Market Cap',
    field: 'latest_valuation_ratio.market_cap',
    backendField: 'latest_valuation_ratio__market_cap',
    type: 'currency',
    description: 'Capitalisation boursière',
    format: formatters.currency,
    accessor: (action) => action.latest_valuation_ratio?.market_cap,
  },
];

// ============================================
// PROFITABILITY - Rentabilité
// ============================================
const PROFITABILITY_COLUMNS: ColumnDefinition[] = [
  {
    id: 'roe',
    name: 'ROE',
    field: 'latest_valuation_ratio.roe',
    backendField: 'latest_valuation_ratio__roe',
    type: 'percentage',
    description: 'Return on Equity',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.roe,
  },
  {
    id: 'roa',
    name: 'ROA',
    field: 'latest_valuation_ratio.roa',
    backendField: 'latest_valuation_ratio__roa',
    type: 'percentage',
    description: 'Return on Assets',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.roa,
  },
  {
    id: 'roic',
    name: 'ROIC',
    field: 'latest_valuation_ratio.roic',
    backendField: 'latest_valuation_ratio__roic',
    type: 'percentage',
    description: 'Return on Invested Capital',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.roic,
  },
  {
    id: 'gross_margin',
    name: 'Marge Brute',
    field: 'latest_valuation_ratio.gross_margin',
    backendField: 'latest_valuation_ratio__gross_margin',
    type: 'percentage',
    description: 'Marge brute',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.gross_margin,
  },
  {
    id: 'operating_margin',
    name: 'Marge Op.',
    field: 'latest_valuation_ratio.operating_margin',
    backendField: 'latest_valuation_ratio__operating_margin',
    type: 'percentage',
    description: 'Marge opérationnelle',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.operating_margin,
  },
  {
    id: 'net_margin',
    name: 'Marge Nette',
    field: 'latest_valuation_ratio.net_margin',
    backendField: 'latest_valuation_ratio__net_margin',
    type: 'percentage',
    description: 'Marge nette',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.net_margin,
  },
];

// ============================================
// GROWTH - Croissance
// ============================================
const GROWTH_COLUMNS: ColumnDefinition[] = [
  {
    id: 'revenue_growth_yoy',
    name: 'CA Growth YoY',
    field: 'latest_valuation_ratio.revenue_growth_yoy',
    backendField: 'latest_valuation_ratio__revenue_growth_yoy',
    type: 'percentage',
    description: 'Croissance du chiffre d\'affaires (année sur année)',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.revenue_growth_yoy,
  },
  {
    id: 'revenue_growth_3y',
    name: 'CA Growth 3Y',
    field: 'latest_valuation_ratio.revenue_growth_3y',
    backendField: 'latest_valuation_ratio__revenue_growth_3y',
    type: 'percentage',
    description: 'Croissance du CA sur 3 ans (CAGR)',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.revenue_growth_3y,
  },
  {
    id: 'eps_growth_yoy',
    name: 'EPS Growth YoY',
    field: 'latest_valuation_ratio.eps_growth_yoy',
    backendField: 'latest_valuation_ratio__eps_growth_yoy',
    type: 'percentage',
    description: 'Croissance du bénéfice par action (année sur année)',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.eps_growth_yoy,
  },
  {
    id: 'eps_growth_3y',
    name: 'EPS Growth 3Y',
    field: 'latest_valuation_ratio.eps_growth_3y',
    backendField: 'latest_valuation_ratio__eps_growth_3y',
    type: 'percentage',
    description: 'Croissance de l\'EPS sur 3 ans (CAGR)',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.eps_growth_3y,
  },
  {
    id: 'net_income_growth_yoy',
    name: 'NI Growth YoY',
    field: 'latest_valuation_ratio.net_income_growth_yoy',
    backendField: 'latest_valuation_ratio__net_income_growth_yoy',
    type: 'percentage',
    description: 'Croissance du résultat net (année sur année)',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.net_income_growth_yoy,
  },
];

// ============================================
// DIVIDENDS - Dividendes
// ============================================
const DIVIDENDS_COLUMNS: ColumnDefinition[] = [
  {
    id: 'dividend_yield',
    name: 'Div. Yield',
    field: 'latest_valuation_ratio.dividend_yield',
    backendField: 'latest_valuation_ratio__dividend_yield',
    type: 'percentage',
    description: 'Rendement du dividende',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.dividend_yield,
  },
  {
    id: 'payout_ratio',
    name: 'Payout Ratio',
    field: 'latest_valuation_ratio.payout_ratio',
    backendField: 'latest_valuation_ratio__payout_ratio',
    type: 'percentage',
    description: 'Taux de distribution des bénéfices',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.payout_ratio,
  },
  {
    id: 'dividend_growth_3y',
    name: 'Div. Growth 3Y',
    field: 'latest_valuation_ratio.dividend_growth_3y',
    backendField: 'latest_valuation_ratio__dividend_growth_3y',
    type: 'percentage',
    description: 'Croissance du dividende sur 3 ans',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.dividend_growth_3y,
  },
  {
    id: 'shareholder_yield',
    name: 'Shareholder Yield',
    field: 'latest_valuation_ratio.shareholder_yield',
    backendField: 'latest_valuation_ratio__shareholder_yield',
    type: 'percentage',
    description: 'Rendement total pour actionnaires (dividendes + rachats)',
    format: formatters.percentage,
    accessor: (action) => action.latest_valuation_ratio?.shareholder_yield,
  },
];

// ============================================
// QUALITY - Qualité financière
// ============================================
const QUALITY_COLUMNS: ColumnDefinition[] = [
  {
    id: 'piotroski_score',
    name: 'Piotroski Score',
    field: 'latest_valuation_ratio.piotroski_score',
    backendField: 'latest_valuation_ratio__piotroski_score',
    type: 'number',
    description: 'Score de qualité financière (0-9)',
    format: (v) => formatters.number(v, 0),
    accessor: (action) => action.latest_valuation_ratio?.piotroski_score,
  },
  {
    id: 'altman_z_score',
    name: 'Altman Z-Score',
    field: 'latest_valuation_ratio.altman_z_score',
    backendField: 'latest_valuation_ratio__altman_z_score',
    type: 'number',
    description: 'Score de risque de faillite',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.altman_z_score,
  },
  {
    id: 'current_ratio',
    name: 'Current Ratio',
    field: 'latest_valuation_ratio.current_ratio',
    backendField: 'latest_valuation_ratio__current_ratio',
    type: 'number',
    description: 'Ratio de liquidité courante',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.current_ratio,
  },
  {
    id: 'debt_equity',
    name: 'Debt/Equity',
    field: 'latest_valuation_ratio.debt_equity',
    backendField: 'latest_valuation_ratio__debt_equity',
    type: 'number',
    description: 'Ratio d\'endettement',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.debt_equity,
  },
  {
    id: 'interest_coverage',
    name: 'Interest Coverage',
    field: 'latest_valuation_ratio.interest_coverage',
    backendField: 'latest_valuation_ratio__interest_coverage',
    type: 'number',
    description: 'Couverture des intérêts',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.interest_coverage,
  },
];

// ============================================
// RISK - Risque et Performance
// ============================================
const RISK_COLUMNS: ColumnDefinition[] = [
  {
    id: 'sharpe_ratio',
    name: 'Sharpe Ratio',
    field: 'latest_valuation_ratio.sharpe_ratio',
    backendField: 'latest_valuation_ratio__sharpe_ratio',
    type: 'number',
    description: 'Ratio de Sharpe - Rendement ajusté du risque',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.sharpe_ratio,
  },
  {
    id: 'sortino_ratio',
    name: 'Sortino Ratio',
    field: 'latest_valuation_ratio.sortino_ratio',
    backendField: 'latest_valuation_ratio__sortino_ratio',
    type: 'number',
    description: 'Ratio de Sortino - Rendement ajusté du risque baissier',
    format: (v) => formatters.number(v, 2),
    accessor: (action) => action.latest_valuation_ratio?.sortino_ratio,
  },
  {
    id: 'change_52w_high_pct',
    name: 'vs 52W High',
    field: 'latest_price_metric.change_52w_high_pct',
    backendField: 'latest_price_metric__change_52w_high_pct',
    type: 'percentage',
    description: 'Distance par rapport au plus haut sur 52 semaines',
    format: formatters.percentage,
    accessor: (action) => action.latest_price_metric?.change_52w_high_pct,
  },
  {
    id: 'change_52w_low_pct',
    name: 'vs 52W Low',
    field: 'latest_price_metric.change_52w_low_pct',
    backendField: 'latest_price_metric__change_52w_low_pct',
    type: 'percentage',
    description: 'Distance par rapport au plus bas sur 52 semaines',
    format: formatters.percentage,
    accessor: (action) => action.latest_price_metric?.change_52w_low_pct,
  },
];

// ============================================
// Export des catégories
// ============================================
export const COLUMN_CATEGORIES: ColumnCategory[] = [
  {
    id: 'trend',
    name: 'Tendance',
    icon: '📈',
    columns: TREND_COLUMNS,
  },
  {
    id: 'momentum',
    name: 'Momentum',
    icon: '🚀',
    columns: MOMENTUM_COLUMNS,
  },
  {
    id: 'volatility',
    name: 'Volatilité',
    icon: '📊',
    columns: VOLATILITY_COLUMNS,
  },
  {
    id: 'valuation',
    name: 'Valorisation',
    icon: '💎',
    columns: VALUATION_COLUMNS,
  },
  {
    id: 'profitability',
    name: 'Rentabilité',
    icon: '💰',
    columns: PROFITABILITY_COLUMNS,
  },
  {
    id: 'growth',
    name: 'Croissance',
    icon: '🌱',
    columns: GROWTH_COLUMNS,
  },
  {
    id: 'dividends',
    name: 'Dividendes',
    icon: '💵',
    columns: DIVIDENDS_COLUMNS,
  },
  {
    id: 'quality',
    name: 'Qualité',
    icon: '⭐',
    columns: QUALITY_COLUMNS,
  },
  {
    id: 'risk',
    name: 'Risque',
    icon: '🛡️',
    columns: RISK_COLUMNS,
  },
];

// Helper pour récupérer une colonne par ID
export const getColumnById = (columnId: string): ColumnDefinition | undefined => {
  for (const category of COLUMN_CATEGORIES) {
    const column = category.columns.find((col) => col.id === columnId);
    if (column) return column;
  }
  return undefined;
};

// Helper pour récupérer toutes les colonnes
export const getAllColumns = (): ColumnDefinition[] => {
  return COLUMN_CATEGORIES.flatMap((category) => category.columns);
};
