// ============================================
// Stock Screener Filters Configuration
// Based on ActionEntity with TechnicalIndicatorEntity, PriceIndicatorEntity, ValuationRatioEntity
// ============================================

export type FilterValueType = 'number' | 'percentage' | 'boolean';

export interface FilterCriterion {
  id: string;
  name: string;
  field: string; // Chemin vers le champ dans l'entité (ex: latest_price_metric.price)
  backendField: string; // Champ pour le tri/filtrage backend (ex: latest_price_metric__price)
  type: FilterValueType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  description: string;
}

export interface ActiveFilter {
  id: string;
  criterion: FilterCriterion;
  operator: '>=' | '<=' | '>' | '<' | '=';
  value: number | string;
}

export interface FilterSubFamily {
  id: string;
  name: string;
  criteria: FilterCriterion[];
}

export interface FilterFamily {
  id: string;
  name: string;
  icon?: string;
  subFamilies: FilterSubFamily[];
}

// ============================================
// Descriptions détaillées des indicateurs
// ============================================

const DESCRIPTIONS = {
  // Price Metrics
  price: "Le prix actuel de l'action sur le marché.",
  volume: "Le nombre d'actions échangées sur une période donnée. Un volume élevé indique une forte activité.",
  vol_relative: "Le volume actuel comparé au volume moyen. Un ratio > 1 indique un volume supérieur à la normale.",
  change_1d_pct: "La variation du prix sur 1 jour en pourcentage.",
  change_1w_pct: "La variation du prix sur 1 semaine en pourcentage.",
  change_1m_pct: "La variation du prix sur 1 mois en pourcentage.",
  change_3m_pct: "La variation du prix sur 3 mois en pourcentage.",
  change_6m_pct: "La variation du prix sur 6 mois en pourcentage.",
  change_ytd_pct: "La variation du prix depuis le début de l'année en pourcentage.",
  change_1y_pct: "La variation du prix sur 1 an en pourcentage.",
  change_3y_pct: "La variation du prix sur 3 ans en pourcentage.",
  change_5y_pct: "La variation du prix sur 5 ans en pourcentage.",
  change_52w_high_pct: "La distance en pourcentage entre le prix actuel et le plus haut sur 52 semaines.",
  change_52w_low_pct: "La distance en pourcentage entre le prix actuel et le plus bas sur 52 semaines.",
  
  // Valuation Ratios
  market_cap: "La capitalisation boursière, calculée comme : Prix de l'action × Nombre d'actions en circulation.",
  pe_ttm: "Le ratio Prix/Bénéfice (Trailing Twelve Months). Formule : Prix de l'action / Bénéfice par action (12 derniers mois). Plus le ratio est bas, plus l'action est potentiellement sous-évaluée.",
  pe_forward: "Le ratio Prix/Bénéfice prévisionnel basé sur les estimations futures des bénéfices.",
  pb_ratio: "Le ratio Prix/Valeur comptable. Formule : Prix de l'action / Valeur comptable par action. Un ratio < 1 peut indiquer une sous-évaluation.",
  ps_ratio: "Le ratio Prix/Ventes. Formule : Capitalisation boursière / Chiffre d'affaires total.",
  peg_ratio: "Le ratio PEG (Price/Earnings to Growth). Formule : P/E / Taux de croissance des bénéfices. Un PEG < 1 peut indiquer une action sous-évaluée par rapport à sa croissance.",
  ev_ebitda: "Le ratio Valeur d'entreprise/EBITDA. Mesure la valorisation d'une entreprise par rapport à sa rentabilité opérationnelle.",
  dividend_yield: "Le rendement du dividende. Formule : (Dividende annuel par action / Prix de l'action) × 100.",
  payout_ratio: "Le ratio de distribution. Formule : (Dividendes versés / Bénéfice net) × 100. Indique la part des bénéfices redistribuée aux actionnaires.",
  
  // Profitability
  gross_margin: "La marge brute. Formule : ((Chiffre d'affaires - Coût des ventes) / Chiffre d'affaires) × 100.",
  operating_margin: "La marge opérationnelle. Formule : (Résultat opérationnel / Chiffre d'affaires) × 100.",
  net_margin: "La marge nette. Formule : (Bénéfice net / Chiffre d'affaires) × 100.",
  roe: "Le Return on Equity (ROE). Formule : (Bénéfice net / Capitaux propres) × 100. Mesure la rentabilité des capitaux propres.",
  roa: "Le Return on Assets (ROA). Formule : (Bénéfice net / Total des actifs) × 100. Mesure l'efficacité de l'utilisation des actifs.",
  roic: "Le Return on Invested Capital (ROIC). Formule : (NOPAT / Capital investi) × 100. Mesure la rentabilité du capital investi.",
  
  // Growth
  revenue_growth_yoy: "La croissance du chiffre d'affaires sur un an (Year-over-Year).",
  revenue_growth_3y: "La croissance annuelle moyenne du chiffre d'affaires sur 3 ans.",
  eps_growth_yoy: "La croissance du bénéfice par action sur un an.",
  eps_growth_3y: "La croissance annuelle moyenne du bénéfice par action sur 3 ans.",
  net_income_growth_yoy: "La croissance du bénéfice net sur un an.",
  
  // Technical Indicators - Moving Averages
  sma: "La Simple Moving Average (SMA) est la moyenne arithmétique des prix sur une période donnée. Elle lisse les fluctuations de prix pour identifier les tendances.",
  ema: "L'Exponential Moving Average (EMA) donne plus de poids aux prix récents. Elle réagit plus rapidement aux changements de prix que la SMA.",
  price_vs_sma50_pct: "La distance en pourcentage entre le prix actuel et la SMA 50. Un prix au-dessus de la SMA 50 indique une tendance haussière.",
  price_vs_sma200_pct: "La distance en pourcentage entre le prix actuel et la SMA 200. La SMA 200 est un indicateur clé de tendance long terme.",
  
  // Technical Indicators - Momentum
  rsi: "Le Relative Strength Index (RSI) mesure la vitesse et l'amplitude des mouvements de prix. Formule : RSI = 100 - (100 / (1 + RS)), où RS = Moyenne des hausses / Moyenne des baisses. RSI > 70 indique une surachat, RSI < 30 une survente.",
  macd_histogram: "L'histogramme MACD représente la différence entre la ligne MACD et la ligne de signal. Un histogramme positif et croissant indique un momentum haussier.",
  adx: "L'Average Directional Index (ADX) mesure la force d'une tendance, sans indiquer sa direction. ADX > 25 indique une tendance forte, ADX < 20 une tendance faible.",
  
  // Technical Indicators - Volatility
  bb_pct: "Le pourcentage de position dans les Bandes de Bollinger. 0% = bande inférieure, 100% = bande supérieure, 50% = moyenne mobile. Indique si le prix est proche des extrêmes.",
  atr: "L'Average True Range (ATR) mesure la volatilité moyenne du marché. Un ATR élevé indique une forte volatilité.",
  
  // Risk & Performance
  beta_5y: "Le Beta mesure la volatilité d'une action par rapport au marché. Beta = 1 : volatilité identique au marché, Beta > 1 : plus volatile, Beta < 1 : moins volatile.",
  sharpe_ratio: "Le ratio de Sharpe mesure la performance d'un investissement ajustée du risque. Formule : (Rendement du Portefeuille - Taux Sans Risque) / Écart-type du Portefeuille. Plus le ratio est élevé, meilleure est la performance relative au risque pris.",
  sortino_ratio: "Le ratio de Sortino est similaire au ratio de Sharpe mais ne considère que la volatilité négative (downside risk).",
  
  // Relative Strength
  rs_rating: "Le Relative Strength Rating compare la performance d'une action à celle du marché global. Un score de 90 signifie que l'action a surperformé 90% des autres actions.",
};

// ============================================
// Configuration des familles de filtres
// ============================================

export const FILTER_FAMILIES: FilterFamily[] = [
  {
    id: 'price_performance',
    name: 'Prix & Performance',
    // icon: '📈',
    subFamilies: [
      {
        id: 'price_basics',
        name: 'Prix & Volume',
        criteria: [
          {
            id: 'price',
            name: 'Prix',
            field: 'latest_price_metric.price',
            backendField: 'latest_price_metric__price',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.price,
          },
          {
            id: 'volume',
            name: 'Volume',
            field: 'latest_price_metric.volume',
            backendField: 'latest_price_metric__volume',
            type: 'number',
            min: 0,
            max: 100000000,
            step: 1000,
            description: DESCRIPTIONS.volume,
          },
          {
            id: 'vol_relative',
            name: 'Volume Relatif',
            field: 'latest_price_metric.vol_relative',
            backendField: 'latest_price_metric__vol_relative',
            type: 'number',
            min: 0,
            max: 10,
            step: 0.1,
            description: DESCRIPTIONS.vol_relative,
          },
        ],
      },
      {
        id: 'short_term_performance',
        name: 'Performance Court Terme',
        criteria: [
          {
            id: 'change_1d_pct',
            name: 'Variation 1 Jour',
            field: 'latest_price_metric.change_1d_pct',
            backendField: 'latest_price_metric__change_1d_pct',
            type: 'percentage',
            min: -50,
            max: 50,
            step: 0.1,
            description: DESCRIPTIONS.change_1d_pct,
          },
          {
            id: 'change_1w_pct',
            name: 'Variation 1 Semaine',
            field: 'latest_price_metric.change_1w_pct',
            backendField: 'latest_price_metric__change_1w_pct',
            type: 'percentage',
            min: -50,
            max: 50,
            step: 0.1,
            description: DESCRIPTIONS.change_1w_pct,
          },
          {
            id: 'change_1m_pct',
            name: 'Variation 1 Mois',
            field: 'latest_price_metric.change_1m_pct',
            backendField: 'latest_price_metric__change_1m_pct',
            type: 'percentage',
            min: -50,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.change_1m_pct,
          },
          {
            id: 'change_3m_pct',
            name: 'Variation 3 Mois',
            field: 'latest_price_metric.change_3m_pct',
            backendField: 'latest_price_metric__change_3m_pct',
            type: 'percentage',
            min: -50,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.change_3m_pct,
          },
        ],
      },
      {
        id: 'long_term_performance',
        name: 'Performance Long Terme',
        criteria: [
          {
            id: 'change_6m_pct',
            name: 'Variation 6 Mois',
            field: 'latest_price_metric.change_6m_pct',
            backendField: 'latest_price_metric__change_6m_pct',
            type: 'percentage',
            min: -80,
            max: 200,
            step: 0.1,
            description: DESCRIPTIONS.change_6m_pct,
          },
          {
            id: 'change_ytd_pct',
            name: 'Variation YTD',
            field: 'latest_price_metric.change_ytd_pct',
            backendField: 'latest_price_metric__change_ytd_pct',
            type: 'percentage',
            min: -80,
            max: 200,
            step: 0.1,
            description: DESCRIPTIONS.change_ytd_pct,
          },
          {
            id: 'change_1y_pct',
            name: 'Variation 1 An',
            field: 'latest_price_metric.change_1y_pct',
            backendField: 'latest_price_metric__change_1y_pct',
            type: 'percentage',
            min: -80,
            max: 300,
            step: 0.1,
            description: DESCRIPTIONS.change_1y_pct,
          },
          {
            id: 'change_3y_pct',
            name: 'Variation 3 Ans',
            field: 'latest_price_metric.change_3y_pct',
            backendField: 'latest_price_metric__change_3y_pct',
            type: 'percentage',
            min: -90,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.change_3y_pct,
          },
          {
            id: 'change_5y_pct',
            name: 'Variation 5 Ans',
            field: 'latest_price_metric.change_5y_pct',
            backendField: 'latest_price_metric__change_5y_pct',
            type: 'percentage',
            min: -95,
            max: 1000,
            step: 0.1,
            description: DESCRIPTIONS.change_5y_pct,
          },
        ],
      },
      {
        id: '52w_metrics',
        name: 'Métriques 52 Semaines',
        criteria: [
          {
            id: 'change_52w_high_pct',
            name: 'Distance du Plus Haut 52S',
            field: 'latest_price_metric.change_52w_high_pct',
            backendField: 'latest_price_metric__change_52w_high_pct',
            type: 'percentage',
            min: -100,
            max: 0,
            step: 0.1,
            description: DESCRIPTIONS.change_52w_high_pct,
          },
          {
            id: 'change_52w_low_pct',
            name: 'Distance du Plus Bas 52S',
            field: 'latest_price_metric.change_52w_low_pct',
            backendField: 'latest_price_metric__change_52w_low_pct',
            type: 'percentage',
            min: 0,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.change_52w_low_pct,
          },
        ],
      },
    ],
  },
  {
    id: 'valuation',
    name: 'Valorisation',
    // icon: '💰',
    subFamilies: [
      {
        id: 'market_cap',
        name: 'Capitalisation',
        criteria: [
          {
            id: 'market_cap',
            name: 'Capitalisation Boursière',
            field: 'latest_valuation_ratio.market_cap',
            backendField: 'latest_valuation_ratio__market_cap',
            type: 'number',
            min: 0,
            max: 10000000000000,
            step: 1000000,
            unit: 'M',
            description: DESCRIPTIONS.market_cap,
          },
        ],
      },
      {
        id: 'price_ratios',
        name: 'Ratios de Prix',
        criteria: [
          {
            id: 'pe_ttm',
            name: 'P/E (TTM)',
            field: 'latest_valuation_ratio.pe_ttm',
            backendField: 'latest_valuation_ratio__pe_ttm',
            type: 'number',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.pe_ttm,
          },
          {
            id: 'pe_forward',
            name: 'P/E (Forward)',
            field: 'latest_valuation_ratio.pe_forward',
            backendField: 'latest_valuation_ratio__pe_forward',
            type: 'number',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.pe_forward,
          },
          {
            id: 'pb_ratio',
            name: 'P/B Ratio',
            field: 'latest_valuation_ratio.pb_ratio',
            backendField: 'latest_valuation_ratio__pb_ratio',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.pb_ratio,
          },
          {
            id: 'ps_ratio',
            name: 'P/S Ratio',
            field: 'latest_valuation_ratio.ps_ratio',
            backendField: 'latest_valuation_ratio__ps_ratio',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.ps_ratio,
          },
          {
            id: 'peg_ratio',
            name: 'PEG Ratio',
            field: 'latest_valuation_ratio.peg_ratio',
            backendField: 'latest_valuation_ratio__peg_ratio',
            type: 'number',
            min: 0,
            max: 10,
            step: 0.1,
            description: DESCRIPTIONS.peg_ratio,
          },
        ],
      },
      {
        id: 'enterprise_value',
        name: 'Valeur d\'Entreprise',
        criteria: [
          {
            id: 'ev_ebitda',
            name: 'EV/EBITDA',
            field: 'latest_valuation_ratio.ev_ebitda',
            backendField: 'latest_valuation_ratio__ev_ebitda',
            type: 'number',
            min: -50,
            max: 200,
            step: 0.1,
            description: DESCRIPTIONS.ev_ebitda,
          },
        ],
      },
    ],
  },
  {
    id: 'profitability',
    name: 'Rentabilité',
    // icon: '📊',
    subFamilies: [
      {
        id: 'margins',
        name: 'Marges',
        criteria: [
          {
            id: 'gross_margin',
            name: 'Marge Brute',
            field: 'latest_valuation_ratio.gross_margin',
            backendField: 'latest_valuation_ratio__gross_margin',
            type: 'percentage',
            min: -100,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.gross_margin,
          },
          {
            id: 'operating_margin',
            name: 'Marge Opérationnelle',
            field: 'latest_valuation_ratio.operating_margin',
            backendField: 'latest_valuation_ratio__operating_margin',
            type: 'percentage',
            min: -100,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.operating_margin,
          },
          {
            id: 'net_margin',
            name: 'Marge Nette',
            field: 'latest_valuation_ratio.net_margin',
            backendField: 'latest_valuation_ratio__net_margin',
            type: 'percentage',
            min: -100,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.net_margin,
          },
        ],
      },
      {
        id: 'returns',
        name: 'Rendements',
        criteria: [
          {
            id: 'roe',
            name: 'ROE (Return on Equity)',
            field: 'latest_valuation_ratio.roe',
            backendField: 'latest_valuation_ratio__roe',
            type: 'percentage',
            min: -100,
            max: 200,
            step: 0.1,
            description: DESCRIPTIONS.roe,
          },
          {
            id: 'roa',
            name: 'ROA (Return on Assets)',
            field: 'latest_valuation_ratio.roa',
            backendField: 'latest_valuation_ratio__roa',
            type: 'percentage',
            min: -100,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.roa,
          },
          {
            id: 'roic',
            name: 'ROIC (Return on Invested Capital)',
            field: 'latest_valuation_ratio.roic',
            backendField: 'latest_valuation_ratio__roic',
            type: 'percentage',
            min: -100,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.roic,
          },
        ],
      },
    ],
  },
  {
    id: 'growth',
    name: 'Croissance',
    // icon: '🚀',
    subFamilies: [
      {
        id: 'revenue_growth',
        name: 'Croissance du CA',
        criteria: [
          {
            id: 'revenue_growth_yoy',
            name: 'Croissance CA (YoY)',
            field: 'latest_valuation_ratio.revenue_growth_yoy',
            backendField: 'latest_valuation_ratio__revenue_growth_yoy',
            type: 'percentage',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.revenue_growth_yoy,
          },
          {
            id: 'revenue_growth_3y',
            name: 'Croissance CA (3 Ans)',
            field: 'latest_valuation_ratio.revenue_growth_3y',
            backendField: 'latest_valuation_ratio__revenue_growth_3y',
            type: 'percentage',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.revenue_growth_3y,
          },
        ],
      },
      {
        id: 'earnings_growth',
        name: 'Croissance des Bénéfices',
        criteria: [
          {
            id: 'eps_growth_yoy',
            name: 'Croissance EPS (YoY)',
            field: 'latest_valuation_ratio.eps_growth_yoy',
            backendField: 'latest_valuation_ratio__eps_growth_yoy',
            type: 'percentage',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.eps_growth_yoy,
          },
          {
            id: 'eps_growth_3y',
            name: 'Croissance EPS (3 Ans)',
            field: 'latest_valuation_ratio.eps_growth_3y',
            backendField: 'latest_valuation_ratio__eps_growth_3y',
            type: 'percentage',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.eps_growth_3y,
          },
          {
            id: 'net_income_growth_yoy',
            name: 'Croissance Bénéfice Net (YoY)',
            field: 'latest_valuation_ratio.net_income_growth_yoy',
            backendField: 'latest_valuation_ratio__net_income_growth_yoy',
            type: 'percentage',
            min: -100,
            max: 500,
            step: 0.1,
            description: DESCRIPTIONS.net_income_growth_yoy,
          },
        ],
      },
    ],
  },
  {
    id: 'dividends',
    name: 'Dividendes',
    // icon: '💵',
    subFamilies: [
      {
        id: 'dividend_metrics',
        name: 'Métriques de Dividende',
        criteria: [
          {
            id: 'dividend_yield',
            name: 'Rendement du Dividende',
            field: 'latest_valuation_ratio.dividend_yield',
            backendField: 'latest_valuation_ratio__dividend_yield',
            type: 'percentage',
            min: 0,
            max: 20,
            step: 0.1,
            description: DESCRIPTIONS.dividend_yield,
          },
          {
            id: 'payout_ratio',
            name: 'Payout Ratio',
            field: 'latest_valuation_ratio.payout_ratio',
            backendField: 'latest_valuation_ratio__payout_ratio',
            type: 'percentage',
            min: 0,
            max: 200,
            step: 0.1,
            description: DESCRIPTIONS.payout_ratio,
          },
        ],
      },
    ],
  },
  {
    id: 'technical',
    name: 'Indicateurs Techniques',
    // icon: '📉',
    subFamilies: [
      {
        id: 'moving_averages_sma',
        name: 'Moyennes Mobiles Simples (SMA)',
        criteria: [
          {
            id: 'sma_5',
            name: 'SMA 5',
            field: 'latest_technical_indicator.sma_5',
            backendField: 'latest_technical_indicator__sma_5',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'sma_10',
            name: 'SMA 10',
            field: 'latest_technical_indicator.sma_10',
            backendField: 'latest_technical_indicator__sma_10',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'sma_20',
            name: 'SMA 20',
            field: 'latest_technical_indicator.sma_20',
            backendField: 'latest_technical_indicator__sma_20',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'sma_50',
            name: 'SMA 50',
            field: 'latest_technical_indicator.sma_50',
            backendField: 'latest_technical_indicator__sma_50',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'sma_100',
            name: 'SMA 100',
            field: 'latest_technical_indicator.sma_100',
            backendField: 'latest_technical_indicator__sma_100',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'sma_150',
            name: 'SMA 150',
            field: 'latest_technical_indicator.sma_150',
            backendField: 'latest_technical_indicator__sma_150',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'sma_200',
            name: 'SMA 200',
            field: 'latest_technical_indicator.sma_200',
            backendField: 'latest_technical_indicator__sma_200',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.sma,
          },
          {
            id: 'price_vs_sma50_pct',
            name: 'Prix vs SMA 50 (%)',
            field: 'latest_technical_indicator.price_vs_sma50_pct',
            backendField: 'latest_technical_indicator__price_vs_sma50_pct',
            type: 'percentage',
            min: -50,
            max: 50,
            step: 0.1,
            description: DESCRIPTIONS.price_vs_sma50_pct,
          },
          {
            id: 'price_vs_sma200_pct',
            name: 'Prix vs SMA 200 (%)',
            field: 'latest_technical_indicator.price_vs_sma200_pct',
            backendField: 'latest_technical_indicator__price_vs_sma200_pct',
            type: 'percentage',
            min: -50,
            max: 50,
            step: 0.1,
            description: DESCRIPTIONS.price_vs_sma200_pct,
          },
        ],
      },
      {
        id: 'moving_averages_ema',
        name: 'Moyennes Mobiles Exponentielles (EMA)',
        criteria: [
          {
            id: 'ema_5',
            name: 'EMA 5',
            field: 'latest_technical_indicator.ema_5',
            backendField: 'latest_technical_indicator__ema_5',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_9',
            name: 'EMA 9',
            field: 'latest_technical_indicator.ema_9',
            backendField: 'latest_technical_indicator__ema_9',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_12',
            name: 'EMA 12',
            field: 'latest_technical_indicator.ema_12',
            backendField: 'latest_technical_indicator__ema_12',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_20',
            name: 'EMA 20',
            field: 'latest_technical_indicator.ema_20',
            backendField: 'latest_technical_indicator__ema_20',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_26',
            name: 'EMA 26',
            field: 'latest_technical_indicator.ema_26',
            backendField: 'latest_technical_indicator__ema_26',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_50',
            name: 'EMA 50',
            field: 'latest_technical_indicator.ema_50',
            backendField: 'latest_technical_indicator__ema_50',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_100',
            name: 'EMA 100',
            field: 'latest_technical_indicator.ema_100',
            backendField: 'latest_technical_indicator__ema_100',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
          {
            id: 'ema_200',
            name: 'EMA 200',
            field: 'latest_technical_indicator.ema_200',
            backendField: 'latest_technical_indicator__ema_200',
            type: 'number',
            min: 0,
            max: 1000000,
            step: 0.01,
            description: DESCRIPTIONS.ema,
          },
        ],
      },
      {
        id: 'momentum_indicators',
        name: 'Indicateurs de Momentum',
        criteria: [
          {
            id: 'rsi_9',
            name: 'RSI 9',
            field: 'latest_technical_indicator.rsi_9',
            backendField: 'latest_technical_indicator__rsi_9',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.rsi,
          },
          {
            id: 'rsi_14',
            name: 'RSI 14',
            field: 'latest_technical_indicator.rsi_14',
            backendField: 'latest_technical_indicator__rsi_14',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.rsi,
          },
          {
            id: 'rsi_25',
            name: 'RSI 25',
            field: 'latest_technical_indicator.rsi_25',
            backendField: 'latest_technical_indicator__rsi_25',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.rsi,
          },
          {
            id: 'macd_histogram',
            name: 'MACD Histogramme',
            field: 'latest_technical_indicator.macd_histogram',
            backendField: 'latest_technical_indicator__macd_histogram',
            type: 'number',
            min: -10,
            max: 10,
            step: 0.01,
            description: DESCRIPTIONS.macd_histogram,
          },
        ],
      },
      {
        id: 'trend_indicators',
        name: 'Indicateurs de Tendance',
        criteria: [
          {
            id: 'adx',
            name: 'ADX (Average Directional Index)',
            field: 'latest_technical_indicator.adx',
            backendField: 'latest_technical_indicator__adx',
            type: 'number',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.adx,
          },
        ],
      },
      {
        id: 'volatility_indicators',
        name: 'Indicateurs de Volatilité',
        criteria: [
          {
            id: 'bb_pct',
            name: 'Bollinger Bands %',
            field: 'latest_technical_indicator.bb_pct',
            backendField: 'latest_technical_indicator__bb_pct',
            type: 'percentage',
            min: 0,
            max: 100,
            step: 0.1,
            description: DESCRIPTIONS.bb_pct,
          },
          {
            id: 'atr_14',
            name: 'ATR (14)',
            field: 'latest_technical_indicator.atr_14',
            backendField: 'latest_technical_indicator__atr_14',
            type: 'number',
            min: 0,
            max: 1000,
            step: 0.01,
            description: DESCRIPTIONS.atr,
          },
        ],
      },
    ],
  },
  {
    id: 'risk_performance',
    name: 'Risque & Performance',
    // icon: '⚠️',
    subFamilies: [
      {
        id: 'risk_metrics',
        name: 'Métriques de Risque',
        criteria: [
          {
            id: 'beta_5y',
            name: 'Beta (5 Ans)',
            field: 'latest_valuation_ratio.beta_5y',
            backendField: 'latest_valuation_ratio__beta_5y',
            type: 'number',
            min: -5,
            max: 5,
            step: 0.1,
            description: DESCRIPTIONS.beta_5y,
          },
          {
            id: 'sharpe_ratio',
            name: 'Ratio de Sharpe',
            field: 'latest_valuation_ratio.sharpe_ratio',
            backendField: 'latest_valuation_ratio__sharpe_ratio',
            type: 'number',
            min: -5,
            max: 10,
            step: 0.1,
            description: DESCRIPTIONS.sharpe_ratio,
          },
          {
            id: 'sortino_ratio',
            name: 'Ratio de Sortino',
            field: 'latest_valuation_ratio.sortino_ratio',
            backendField: 'latest_valuation_ratio__sortino_ratio',
            type: 'number',
            min: -5,
            max: 10,
            step: 0.1,
            description: DESCRIPTIONS.sortino_ratio,
          },
        ],
      },
      {
        id: 'relative_strength',
        name: 'Force Relative',
        criteria: [
          {
            id: 'rs_rating',
            name: 'RS Rating',
            field: 'latest_valuation_ratio.rs_rating',
            backendField: 'latest_valuation_ratio__rs_rating',
            type: 'number',
            min: 0,
            max: 100,
            step: 1,
            description: DESCRIPTIONS.rs_rating,
          },
        ],
      },
    ],
  },
];

// ============================================
// Helper Functions
// ============================================

export function getAllCriteria(): FilterCriterion[] {
  const allCriteria: FilterCriterion[] = [];
  FILTER_FAMILIES.forEach(family => {
    family.subFamilies.forEach(subFamily => {
      allCriteria.push(...subFamily.criteria);
    });
  });
  return allCriteria;
}

export function getCriterionById(id: string): FilterCriterion | undefined {
  return getAllCriteria().find(criterion => criterion.id === id);
}

export function getCriteriaByFamily(familyId: string): FilterCriterion[] {
  const family = FILTER_FAMILIES.find(f => f.id === familyId);
  if (!family) return [];
  
  const criteria: FilterCriterion[] = [];
  family.subFamilies.forEach(subFamily => {
    criteria.push(...subFamily.criteria);
  });
  return criteria;
}

export function getCriteriaBySubFamily(familyId: string, subFamilyId: string): FilterCriterion[] {
  const family = FILTER_FAMILIES.find(f => f.id === familyId);
  if (!family) return [];
  
  const subFamily = family.subFamilies.find(sf => sf.id === subFamilyId);
  return subFamily ? subFamily.criteria : [];
}
