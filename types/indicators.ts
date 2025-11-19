export interface IndicatorParameter {
  key: string;
  label: string;
  type: 'number' | 'color' | 'select';
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

export interface IndicatorConfig {
  id: string;
  name: string;
  category: 'trend' | 'momentum' | 'volatility' | 'volume';
  description: string;
  parameters: IndicatorParameter[];
}

export interface ActiveIndicator {
  id: string;
  instanceId: string; // Pour permettre plusieurs instances du même indicateur
  name: string;
  parameters: Record<string, any>;
  color: string;
}

// Configuration des indicateurs disponibles
export const INDICATOR_CONFIGS: IndicatorConfig[] = [
  {
    id: 'sma',
    name: 'Simple Moving Average',
    category: 'trend',
    description: 'Moyenne mobile simple sur N périodes',
    parameters: [
      {
        key: 'period',
        label: 'Période',
        type: 'number',
        defaultValue: 20,
        min: 1,
        max: 200,
        step: 1
      },
      {
        key: 'color',
        label: 'Couleur',
        type: 'color',
        defaultValue: '#00BFFF'
      }
    ]
  },
  {
    id: 'ema',
    name: 'Exponential Moving Average',
    category: 'trend',
    description: 'Moyenne mobile exponentielle',
    parameters: [
      {
        key: 'period',
        label: 'Période',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 200,
        step: 1
      },
      {
        key: 'color',
        label: 'Couleur',
        type: 'color',
        defaultValue: '#FF6B35'
      }
    ]
  },
  {
    id: 'rsi',
    name: 'Relative Strength Index',
    category: 'momentum',
    description: 'Indice de force relative (0-100)',
    parameters: [
      {
        key: 'period',
        label: 'Période',
        type: 'number',
        defaultValue: 14,
        min: 2,
        max: 50,
        step: 1
      },
      {
        key: 'overbought',
        label: 'Niveau de surachat',
        type: 'number',
        defaultValue: 70,
        min: 50,
        max: 90,
        step: 1
      },
      {
        key: 'oversold',
        label: 'Niveau de survente',
        type: 'number',
        defaultValue: 30,
        min: 10,
        max: 50,
        step: 1
      },
      {
        key: 'color',
        label: 'Couleur',
        type: 'color',
        defaultValue: '#9C27B0'
      }
    ]
  },
  {
    id: 'macd',
    name: 'MACD',
    category: 'momentum',
    description: 'Moving Average Convergence Divergence',
    parameters: [
      {
        key: 'fastPeriod',
        label: 'EMA Rapide',
        type: 'number',
        defaultValue: 12,
        min: 1,
        max: 50,
        step: 1
      },
      {
        key: 'slowPeriod',
        label: 'EMA Lente',
        type: 'number',
        defaultValue: 26,
        min: 1,
        max: 100,
        step: 1
      },
      {
        key: 'signalPeriod',
        label: 'Signal',
        type: 'number',
        defaultValue: 9,
        min: 1,
        max: 50,
        step: 1
      },
      {
        key: 'macdColor',
        label: 'Couleur MACD',
        type: 'color',
        defaultValue: '#2196F3'
      },
      {
        key: 'signalColor',
        label: 'Couleur Signal',
        type: 'color',
        defaultValue: '#FF9800'
      }
    ]
  },
  {
    id: 'bb',
    name: 'Bollinger Bands',
    category: 'volatility',
    description: 'Bandes de Bollinger',
    parameters: [
      {
        key: 'period',
        label: 'Période',
        type: 'number',
        defaultValue: 20,
        min: 2,
        max: 100,
        step: 1
      },
      {
        key: 'stdDev',
        label: 'Écart-type',
        type: 'number',
        defaultValue: 2,
        min: 0.5,
        max: 4,
        step: 0.1
      },
      {
        key: 'upperColor',
        label: 'Couleur Supérieure',
        type: 'color',
        defaultValue: '#E91E63'
      },
      {
        key: 'lowerColor',
        label: 'Couleur Inférieure',
        type: 'color',
        defaultValue: '#4CAF50'
      },
      {
        key: 'middleColor',
        label: 'Couleur Moyenne',
        type: 'color',
        defaultValue: '#FFC107'
      }
    ]
  }
];

// Fonction utilitaire pour créer une nouvelle instance d'indicateur
export function createIndicatorInstance(indicatorId: string, customParams?: Record<string, any>): ActiveIndicator {
  const config = INDICATOR_CONFIGS.find(c => c.id === indicatorId);
  if (!config) throw new Error(`Indicator ${indicatorId} not found`);

  const parameters: Record<string, any> = {};
  config.parameters.forEach(param => {
    parameters[param.key] = customParams?.[param.key] ?? param.defaultValue;
  });

  return {
    id: indicatorId,
    instanceId: `${indicatorId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: config.name,
    parameters,
    color: parameters.color || '#00BFFF'
  };
}
