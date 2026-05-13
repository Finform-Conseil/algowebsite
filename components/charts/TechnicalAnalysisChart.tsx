'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import '@/styles/components/_technical-analysis-chart.scss';

export type MetricType = 'liquidative_value' | 
  'performance_1m' | 'performance_3m' | 'performance_6m' | 'performance_1y' | 'performance_5y' |
  'rendement_1m' | 'rendement_3m' | 'rendement_6m' | 'rendement_1y' | 'rendement_5y' |
  'volatility_1m' | 'volatility_3m' | 'volatility_6m' | 'volatility_1y' | 'volatility_5y' |
  'sharpe_ratio_1m' | 'sharpe_ratio_3m' | 'sharpe_ratio_6m' | 'sharpe_ratio_1y' | 'sharpe_ratio_5y' |
  'sortino_ratio_1m' | 'sortino_ratio_3m' | 'sortino_ratio_6m' | 'sortino_ratio_1y' | 'sortino_ratio_5y' |
  'calmar_ratio_1m' | 'calmar_ratio_3m' | 'calmar_ratio_6m' | 'calmar_ratio_1y' | 'calmar_ratio_5y' |
  'alpha_1m' | 'alpha_3m' | 'alpha_6m' | 'alpha_1y' | 'alpha_5y' |
  'beta_1m' | 'beta_3m' | 'beta_6m' | 'beta_1y' | 'beta_5y';
export type TimeFrame = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

interface DataPoint {
  date: string;
  timestamp?: string;
  [key: string]: number | string | undefined;
}

// Type pour les données brutes OPCVM
interface OPCVMMetricData {
  timestamp: string;
  liquidative_value: string;
  performance_1m?: number | null;
  performance_3m?: number | null;
  performance_6m?: number | null;
  performance_1y?: number | null;
  performance_5y?: number | null;
  rendement_1m?: number | null;
  rendement_3m?: number | null;
  rendement_6m?: number | null;
  rendement_1y?: number | null;
  rendement_5y?: number | null;
  volatility_1m?: number | null;
  volatility_3m?: number | null;
  volatility_6m?: number | null;
  volatility_1y?: number | null;
  volatility_5y?: number | null;
  sharpe_ratio_1m?: number | null;
  sharpe_ratio_3m?: number | null;
  sharpe_ratio_6m?: number | null;
  sharpe_ratio_1y?: number | null;
  sharpe_ratio_5y?: number | null;
  sortino_ratio_1m?: number | null;
  sortino_ratio_3m?: number | null;
  sortino_ratio_6m?: number | null;
  sortino_ratio_1y?: number | null;
  sortino_ratio_5y?: number | null;
  calmar_ratio_1m?: number | null;
  calmar_ratio_3m?: number | null;
  calmar_ratio_6m?: number | null;
  calmar_ratio_1y?: number | null;
  calmar_ratio_5y?: number | null;
  alpha_1m?: number | null;
  alpha_3m?: number | null;
  alpha_6m?: number | null;
  alpha_1y?: number | null;
  alpha_5y?: number | null;
  beta_1m?: number | null;
  beta_3m?: number | null;
  beta_6m?: number | null;
  beta_1y?: number | null;
  beta_5y?: number | null;
  [key: string]: any;
}

interface SeriesData {
  name: string;
  data: DataPoint[] | OPCVMMetricData[];
  color?: string;
}

interface TechnicalAnalysisChartProps {
  data?: DataPoint[] | OPCVMMetricData[]; // Accepte DataPoint[] ou OPCVMMetricData[]
  seriesData?: SeriesData[]; // Pour multi-OPCVM
  title?: string;
  defaultMetrics?: MetricType[];
  defaultTimeFrame?: TimeFrame;
  height?: string;
  showToolbox?: boolean;
}

// Configuration des couleurs par famille d'indicateurs
const CATEGORY_COLORS: Record<string, string[]> = {
  'fund-performance': ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'], // Bleus
  'fund-rendement': ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'], // Verts
  'fund-volatility': ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F'], // Oranges
  'fund-ratio-sharpe': ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'], // Violets
  'fund-ratio-sortino': ['#EC4899', '#DB2777', '#BE185D', '#9D174D', '#831843'], // Roses
  'fund-ratio-calmar': ['#06B6D4', '#0891B2', '#0E7490', '#155E75', '#164E63'], // Cyans
  'fund-alpha': ['#84CC16', '#65A30D', '#4D7C0F', '#3F6212', '#365314'], // Limes
  'fund-beta': ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'], // Rouges
};

// Configuration dynamique des métriques OPCVM
const METRIC_CONFIG: Record<string, {
  name: string;
  color: string;
  unit: string;
  gridIndex: number;
  isMainChart: boolean;
  category: string;
}> = {
  liquidative_value: {
    name: 'Valeur Liquidative',
    color: '#3B82F6',
    unit: 'XOF',
    gridIndex: 0,
    isMainChart: true,
    category: 'main',
  },
  
  // Performance (Bleus)
  performance_1m: { name: 'Performance 1M', color: CATEGORY_COLORS['fund-performance'][0], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-performance' },
  performance_3m: { name: 'Performance 3M', color: CATEGORY_COLORS['fund-performance'][1], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-performance' },
  performance_6m: { name: 'Performance 6M', color: CATEGORY_COLORS['fund-performance'][2], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-performance' },
  performance_1y: { name: 'Performance 1A', color: CATEGORY_COLORS['fund-performance'][3], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-performance' },
  performance_5y: { name: 'Performance 5A', color: CATEGORY_COLORS['fund-performance'][4], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-performance' },
  
  // Rendement (Verts)
  rendement_1m: { name: 'Rendement 1M', color: CATEGORY_COLORS['fund-rendement'][0], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-rendement' },
  rendement_3m: { name: 'Rendement 3M', color: CATEGORY_COLORS['fund-rendement'][1], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-rendement' },
  rendement_6m: { name: 'Rendement 6M', color: CATEGORY_COLORS['fund-rendement'][2], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-rendement' },
  rendement_1y: { name: 'Rendement 1A', color: CATEGORY_COLORS['fund-rendement'][3], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-rendement' },
  rendement_5y: { name: 'Rendement 5A', color: CATEGORY_COLORS['fund-rendement'][4], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-rendement' },
  
  // Volatilité (Oranges)
  volatility_1m: { name: 'Volatilité 1M', color: CATEGORY_COLORS['fund-volatility'][0], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-volatility' },
  volatility_3m: { name: 'Volatilité 3M', color: CATEGORY_COLORS['fund-volatility'][1], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-volatility' },
  volatility_6m: { name: 'Volatilité 6M', color: CATEGORY_COLORS['fund-volatility'][2], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-volatility' },
  volatility_1y: { name: 'Volatilité 1A', color: CATEGORY_COLORS['fund-volatility'][3], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-volatility' },
  volatility_5y: { name: 'Volatilité 5A', color: CATEGORY_COLORS['fund-volatility'][4], unit: '%', gridIndex: 1, isMainChart: false, category: 'fund-volatility' },
  
  // Sharpe Ratio (Violets)
  sharpe_ratio_1m: { name: 'Sharpe 1M', color: CATEGORY_COLORS['fund-ratio-sharpe'][0], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sharpe' },
  sharpe_ratio_3m: { name: 'Sharpe 3M', color: CATEGORY_COLORS['fund-ratio-sharpe'][1], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sharpe' },
  sharpe_ratio_6m: { name: 'Sharpe 6M', color: CATEGORY_COLORS['fund-ratio-sharpe'][2], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sharpe' },
  sharpe_ratio_1y: { name: 'Sharpe 1A', color: CATEGORY_COLORS['fund-ratio-sharpe'][3], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sharpe' },
  sharpe_ratio_5y: { name: 'Sharpe 5A', color: CATEGORY_COLORS['fund-ratio-sharpe'][4], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sharpe' },
  
  // Sortino Ratio (Roses)
  sortino_ratio_1m: { name: 'Sortino 1M', color: CATEGORY_COLORS['fund-ratio-sortino'][0], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sortino' },
  sortino_ratio_3m: { name: 'Sortino 3M', color: CATEGORY_COLORS['fund-ratio-sortino'][1], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sortino' },
  sortino_ratio_6m: { name: 'Sortino 6M', color: CATEGORY_COLORS['fund-ratio-sortino'][2], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sortino' },
  sortino_ratio_1y: { name: 'Sortino 1A', color: CATEGORY_COLORS['fund-ratio-sortino'][3], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sortino' },
  sortino_ratio_5y: { name: 'Sortino 5A', color: CATEGORY_COLORS['fund-ratio-sortino'][4], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-sortino' },
  
  // Calmar Ratio (Cyans)
  calmar_ratio_1m: { name: 'Calmar 1M', color: CATEGORY_COLORS['fund-ratio-calmar'][0], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-calmar' },
  calmar_ratio_3m: { name: 'Calmar 3M', color: CATEGORY_COLORS['fund-ratio-calmar'][1], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-calmar' },
  calmar_ratio_6m: { name: 'Calmar 6M', color: CATEGORY_COLORS['fund-ratio-calmar'][2], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-calmar' },
  calmar_ratio_1y: { name: 'Calmar 1A', color: CATEGORY_COLORS['fund-ratio-calmar'][3], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-calmar' },
  calmar_ratio_5y: { name: 'Calmar 5A', color: CATEGORY_COLORS['fund-ratio-calmar'][4], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-ratio-calmar' },
  
  // Alpha (Limes)
  alpha_1m: { name: 'Alpha 1M', color: CATEGORY_COLORS['fund-alpha'][0], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-alpha' },
  alpha_3m: { name: 'Alpha 3M', color: CATEGORY_COLORS['fund-alpha'][1], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-alpha' },
  alpha_6m: { name: 'Alpha 6M', color: CATEGORY_COLORS['fund-alpha'][2], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-alpha' },
  alpha_1y: { name: 'Alpha 1A', color: CATEGORY_COLORS['fund-alpha'][3], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-alpha' },
  alpha_5y: { name: 'Alpha 5A', color: CATEGORY_COLORS['fund-alpha'][4], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-alpha' },
  
  // Beta (Rouges)
  beta_1m: { name: 'Beta 1M', color: CATEGORY_COLORS['fund-beta'][0], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-beta' },
  beta_3m: { name: 'Beta 3M', color: CATEGORY_COLORS['fund-beta'][1], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-beta' },
  beta_6m: { name: 'Beta 6M', color: CATEGORY_COLORS['fund-beta'][2], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-beta' },
  beta_1y: { name: 'Beta 1A', color: CATEGORY_COLORS['fund-beta'][3], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-beta' },
  beta_5y: { name: 'Beta 5A', color: CATEGORY_COLORS['fund-beta'][4], unit: '', gridIndex: 1, isMainChart: false, category: 'fund-beta' },
};

const TIMEFRAME_CONFIG = {
  '1M': { days: 30, label: '1 Mois' },
  '3M': { days: 90, label: '3 Mois' },
  '6M': { days: 180, label: '6 Mois' },
  '1Y': { days: 365, label: '1 An' },
  'YTD': { days: -1, label: 'YTD' },
  'ALL': { days: -2, label: 'Tout' },
};

export default function TechnicalAnalysisChart({
  data,
  seriesData,
  title = 'Analyse Technique',
  defaultMetrics = ['liquidative_value'],
  defaultTimeFrame = '1Y',
  height = '100%',
  showToolbox = true,
}: TechnicalAnalysisChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(defaultMetrics);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>(defaultTimeFrame);
  const [selectedCategory, setSelectedCategory] = useState<string>('fund-performance');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fermer le dropdown en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Fonction pour transformer OPCVMMetricData[] en DataPoint[]
  const transformOPCVMData = (rawData: OPCVMMetricData[]): DataPoint[] => {
    return rawData.map(metric => {
      const parseValue = (value: string | number | null | undefined): number | undefined => {
        if (value === null || value === undefined) return undefined;
        const parsed = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(parsed) ? undefined : parsed;
      };

      const dataPoint: DataPoint = {
        date: metric.timestamp.split('T')[0],
        timestamp: metric.timestamp,
        liquidative_value: parseValue(metric.liquidative_value),
      };

      // Ajouter tous les indicateurs disponibles
      const indicators: (keyof OPCVMMetricData)[] = [
        'performance_1m', 'performance_3m', 'performance_6m', 'performance_1y', 'performance_5y',
        'rendement_1m', 'rendement_3m', 'rendement_6m', 'rendement_1y', 'rendement_5y',
        'volatility_1m', 'volatility_3m', 'volatility_6m', 'volatility_1y', 'volatility_5y',
        'sharpe_ratio_1m', 'sharpe_ratio_3m', 'sharpe_ratio_6m', 'sharpe_ratio_1y', 'sharpe_ratio_5y',
        'sortino_ratio_1m', 'sortino_ratio_3m', 'sortino_ratio_6m', 'sortino_ratio_1y', 'sortino_ratio_5y',
        'calmar_ratio_1m', 'calmar_ratio_3m', 'calmar_ratio_6m', 'calmar_ratio_1y', 'calmar_ratio_5y',
        'alpha_1m', 'alpha_3m', 'alpha_6m', 'alpha_1y', 'alpha_5y',
        'beta_1m', 'beta_3m', 'beta_6m', 'beta_1y', 'beta_5y',
      ];

      indicators.forEach(indicator => {
        const value = metric[indicator];
        if (value !== null && value !== undefined) {
          dataPoint[indicator] = parseValue(value);
        }
      });

      return dataPoint;
    });
  };

  // Détecter si data contient des OPCVMMetricData et les transformer
  const isOPCVMMetricData = (data: any[]): data is OPCVMMetricData[] => {
    return data.length > 0 && 'timestamp' in data[0] && 'liquidative_value' in data[0] && typeof data[0].liquidative_value === 'string';
  };

  // Convertir data en seriesData si nécessaire (compatibilité)
  const actualSeriesData: SeriesData[] = seriesData || (data ? [{ 
    name: 'OPCVM', 
    data: isOPCVMMetricData(data) ? transformOPCVMData(data) : data as DataPoint[], 
    color: '#3B82F6' 
  }] : []);

  useEffect(()=>{
    console.log("Technical Chart Data", { 
      rawData: data, 
      seriesData, 
      actualSeriesData,
      isOPCVM: data && isOPCVMMetricData(data as any[])
    });
  }, [data, seriesData, actualSeriesData]);
  
  // Filter data based on timeframe
  const getFilteredSeriesData = (): SeriesData[] => {
    if (!actualSeriesData || actualSeriesData.length === 0) {
      console.log('[TechnicalAnalysisChart] getFilteredSeriesData: No actualSeriesData');
      return [];
    }
    
    const config = TIMEFRAME_CONFIG[timeFrame];
    
    return actualSeriesData.map(series => {
      console.log(`[TechnicalAnalysisChart] Processing series "${series.name}":`, {
        dataLength: series.data.length,
        firstItem: series.data[0],
        isOPCVM: isOPCVMMetricData(series.data as any[])
      });
      
      // Transformer d'abord si nécessaire
      const transformedData = isOPCVMMetricData(series.data as any[]) 
        ? transformOPCVMData(series.data as OPCVMMetricData[])
        : series.data as DataPoint[];
      
      console.log(`[TechnicalAnalysisChart] After transformation "${series.name}":`, {
        transformedLength: transformedData.length,
        firstTransformed: transformedData[0],
        lastTransformed: transformedData[transformedData.length - 1],
        dateRange: transformedData.length > 0 ? {
          first: transformedData[0]?.date,
          last: transformedData[transformedData.length - 1]?.date,
          daysAgo: transformedData[transformedData.length - 1]?.date 
            ? Math.floor((new Date().getTime() - new Date(transformedData[transformedData.length - 1].date).getTime()) / (1000 * 60 * 60 * 24))
            : 'N/A'
        } : null
      });
      
      let filteredData: DataPoint[] = transformedData;
      
      if (config.days === -2) {
        // ALL - no filter
      } else if (config.days === -1) {
        // YTD - relatif à la dernière date disponible
        if (transformedData.length > 0) {
          const lastDate = new Date(transformedData[transformedData.length - 1].date);
          const startOfYear = new Date(lastDate.getFullYear(), 0, 1);
          filteredData = transformedData.filter(d => new Date(d.date) >= startOfYear);
        }
      } else {
        // Specific days - relatif à la dernière date disponible
        if (transformedData.length > 0) {
          const lastDate = new Date(transformedData[transformedData.length - 1].date);
          const cutoffDate = new Date(lastDate.getTime() - config.days * 24 * 60 * 60 * 1000);
          filteredData = transformedData.filter(d => new Date(d.date) >= cutoffDate);
        }
      }
      
      console.log(`[TechnicalAnalysisChart] After filtering "${series.name}" (${timeFrame}):`, {
        filteredLength: filteredData.length,
        configDays: config.days
      });
      
      return { ...series, data: filteredData };
    });
  };

  const addMetric = (metric: MetricType) => {
    if (!selectedMetrics.includes(metric)) {
      setSelectedMetrics(prev => [...prev, metric]);
    }
    setIsDropdownOpen(false);
  };

  const removeMetric = (metric: MetricType) => {
    setSelectedMetrics(prev => prev.filter(m => m !== metric));
  };

  // Grouper les métriques par catégorie
  const metricsByCategory = Object.entries(METRIC_CONFIG).reduce((acc, [key, config]) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push({ key: key as MetricType, config });
    return acc;
  }, {} as Record<string, Array<{ key: MetricType; config: typeof METRIC_CONFIG[string] }>>);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'main': 'Valeur Liquidative',
      'fund-performance': 'Performance',
      'fund-rendement': 'Rendement',
      'fund-volatility': 'Volatilité',
      'fund-ratio-sharpe': 'Sharpe Ratio',
      'fund-ratio-sortino': 'Sortino Ratio',
      'fund-ratio-calmar': 'Calmar Ratio',
      'fund-alpha': 'Alpha',
      'fund-beta': 'Beta',
    };
    return labels[category] || category;
  };

  useEffect(() => {
    if (!chartRef.current) return;

    // Initialize chart
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const filteredSeriesData = getFilteredSeriesData();
    console.log('📊 Chart Data:', { 
      seriesCount: filteredSeriesData.length,
      selectedMetrics,
      timeFrame,
      sample: filteredSeriesData[0]?.data.slice(0, 3)
    });

    if (filteredSeriesData.length === 0 || filteredSeriesData[0]?.data.length === 0) {
      console.warn('⚠️ No filtered data available');
      return;
    }
    
    // Utiliser les dates de la première série comme référence
    const dates = filteredSeriesData[0].data.map(d => d.date);

    // Séparer les métriques par grid
    const mainChartMetrics = selectedMetrics.filter(m => METRIC_CONFIG[m].isMainChart);
    const indicatorMetrics = selectedMetrics.filter(m => !METRIC_CONFIG[m].isMainChart);
    const hasIndicators = indicatorMetrics.length > 0;

    // Build series
    const series: any[] = [];
    
    // Couleurs pour multi-OPCVM
    const MULTI_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];
    
    console.log('[TechnicalAnalysisChart] Building series:', {
      mainChartMetrics,
      indicatorMetrics,
      filteredSeriesDataCount: filteredSeriesData.length,
      dates: dates.slice(0, 5)
    });
    
    // Main chart series (VL) - Area chart pour chaque OPCVM
    mainChartMetrics.forEach(metric => {
      const config = METRIC_CONFIG[metric];
      
      filteredSeriesData.forEach((seriesItem, index) => {
        const metricData = seriesItem.data.map(d => d[metric] ?? null);
        const seriesColor = seriesItem.color || MULTI_COLORS[index % MULTI_COLORS.length];
        const seriesName = filteredSeriesData.length > 1 ? `${seriesItem.name} - ${config.name}` : config.name;
        
        console.log(`[TechnicalAnalysisChart] Main series "${seriesName}":`, {
          metric,
          dataPoints: metricData.length,
          sampleValues: metricData.slice(0, 5),
          nullCount: metricData.filter(v => v === null).length
        });

        series.push({
          name: seriesName,
          type: 'line',
          xAxisIndex: 0,
          yAxisIndex: 0,
          data: metricData,
          smooth: true,
          symbol: 'none',
          areaStyle: filteredSeriesData.length === 1 ? {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: `${seriesColor}40` },
                { offset: 1, color: `${seriesColor}05` }
              ]
            }
          } : undefined,
          lineStyle: {
            width: 2,
            color: seriesColor,
          },
          itemStyle: {
            color: seriesColor,
          },
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 3,
            },
          },
          tooltip: {
            valueFormatter: (value: any) => {
              if (value === null) return 'N/A';
              return `${Number(value).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${config.unit}`;
            }
          }
        });
      });
    });

    // Indicator series - Line charts pour chaque OPCVM
    indicatorMetrics.forEach(metric => {
      const config = METRIC_CONFIG[metric];
      
      console.log(`[TechnicalAnalysisChart] Processing indicator metric: ${metric}`, config);
      
      filteredSeriesData.forEach((seriesItem, index) => {
        const metricData = seriesItem.data.map(d => d[metric] ?? null);
        const seriesColor = seriesItem.color || MULTI_COLORS[index % MULTI_COLORS.length];
        const seriesName = filteredSeriesData.length > 1 ? `${seriesItem.name} - ${config.name}` : config.name;
        
        console.log(`[TechnicalAnalysisChart] Indicator series "${seriesName}":`, {
          metric,
          dataPoints: metricData.length,
          sampleValues: metricData.slice(0, 5),
          nullCount: metricData.filter(v => v === null).length,
          hasValues: metricData.some(v => v !== null)
        });

        series.push({
          name: seriesName,
          type: 'line',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: metricData,
          smooth: true,
          symbol: 'circle',
          symbolSize: 3,
          showSymbol: false,
          lineStyle: {
            width: 2,
            color: seriesColor,
          },
          itemStyle: {
            color: seriesColor,
          },
          emphasis: {
            focus: 'series',
            lineStyle: {
              width: 3,
            },
          },
          tooltip: {
            valueFormatter: (value: any) => {
              const formatValue = (value: number | null | undefined, unit: string): string => {
                if (value === null || value === undefined) return 'N/A';
                if (unit === '%') return `${value.toFixed(2)}%`;
                if (unit === 'XOF' || unit === '$') return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${unit}`;
                if (unit === 'x') return `${value.toFixed(2)}x`;
                if (unit === 'Md') return `${value.toFixed(1)}Md`;
                return value.toFixed(2);
              };
              return formatValue(value, config.unit);
            }
          }
        });
      });
    });

    console.log('[TechnicalAnalysisChart] Total series created:', {
      totalCount: series.length,
      mainChartCount: series.filter(s => s.yAxisIndex === 0).length,
      indicatorCount: series.filter(s => s.yAxisIndex === 1).length,
      seriesNames: series.map(s => s.name),
      hasIndicators
    });

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      title: {
        show: false,
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          link: [{ xAxisIndex: 'all' }],
          crossStyle: {
            color: '#999'
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: {
          color: '#fff',
          fontSize: 12
        },
        padding: 12,
      },
      legend: {
        data: series.map(s => s.name), // Utiliser les noms réels des séries
        top: 10,
        right: 20,
        textStyle: {
          color: 'var(--text-primary)',
          fontSize: 12
        },
        itemWidth: 20,
        itemHeight: 12,
      },
      // 2 Grids: Main chart (haut) et Indicators (bas)
      grid: [
        {
          left: '3%',
          right: '4%',
          top: '15%',
          height: hasIndicators ? '50%' : '77%',
          containLabel: true
        },
        {
          left: '3%',
          right: '4%',
          top: '70%',
          height: '22%',
          show: hasIndicators,
          containLabel: true
        }
      ],
      // 2 xAxis (un par grid)
      xAxis: [
        {
          type: 'category',
          gridIndex: 0,
          data: dates,
          boundaryGap: false,
          axisLine: {
            lineStyle: {
              color: '#ffffff',
              width: 1
            }
          },
          axisLabel: {
            show: false // Masquer les labels sur le graphe du haut
          },
          splitLine: {
            show: false
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: dates,
          boundaryGap: false,
          axisLine: {
            lineStyle: {
              color: '#ffffff',
              width: 1
            }
          },
          axisLabel: {
            color: '#ffffff',
            fontSize: 10,
            formatter: (value: string) => {
              const date = new Date(value);
              return `${date.getDate()}/${date.getMonth() + 1}`;
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      // 2 yAxis (un par grid)
      yAxis: [
        {
          type: 'value',
          gridIndex: 0,
          name: 'VL (XOF)',
          nameLocation: 'middle',
          nameGap: 50,
          nameTextStyle: {
            color: '#ffffff',
            fontSize: 11
          },
          axisLine: {
            show: true,
            lineStyle: { 
              color: '#ffffff',
              width: 1
            }
          },
          axisLabel: {
            color: '#ffffff',
            fontSize: 10,
            formatter: (value: number) => value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })
          },
          splitLine: {
            lineStyle: { 
              type: 'dashed', 
              opacity: 0.15,
              color: '#ffffff'
            }
          }
        },
        {
          type: 'value',
          gridIndex: 1,
          name: 'Indicateurs',
          nameLocation: 'middle',
          nameGap: 35,
          nameTextStyle: {
            color: '#ffffff',
            fontSize: 10
          },
          axisLine: {
            show: true,
            lineStyle: { 
              color: '#ffffff',
              width: 1
            }
          },
          axisLabel: {
            color: '#ffffff',
            fontSize: 10,
            formatter: (value: number) => value.toFixed(1)
          },
          splitLine: {
            lineStyle: { 
              type: 'dashed', 
              opacity: 0.15,
              color: '#ffffff'
            }
          }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1], // Synchroniser les 2 xAxis
          start: 0,
          end: 100,
          minValueSpan: 10
        }
      ],
      toolbox: showToolbox ? {
        feature: {
          saveAsImage: {
            title: 'Télécharger',
            backgroundColor: 'var(--background)',
          },
          restore: {
            title: 'Réinitialiser'
          },
        },
        right: 20,
        top: 50,
        iconStyle: {
          borderColor: 'var(--text-secondary)'
        }
      } : undefined,
      series: series.length > 0 ? series : []
    };

    console.log('📈 Setting chart option:', {
      seriesCount: series.length,
      dates: dates.length,
      hasIndicators,
      mainChartMetrics,
      indicatorMetrics
    });

    chartInstanceRef.current.setOption(option, { notMerge: false, replaceMerge: ['series'] });

    // Force resize after setting option to ensure proper rendering
    setTimeout(() => {
      chartInstanceRef.current?.resize();
    }, 100);

    // Handle resize
    const handleResize = () => {
      chartInstanceRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [actualSeriesData, selectedMetrics, timeFrame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className="technical-analysis-chart" style={{ height }}>
      {/* Controls */}
      <div className="chart-controls">
        {/* Selected Metrics Pills */}
        <div className="selected-metrics">
          <label className="metrics-label">Indicateurs sélectionnés :</label>
          <div className="metrics-pills">
            {selectedMetrics.map(metric => {
              const config = METRIC_CONFIG[metric];
              return (
                <div
                  key={metric}
                  className="metric-pill"
                  style={{
                    '--metric-color': config.color,
                  } as React.CSSProperties}
                >
                  <span className="metric-pill__indicator"></span>
                  <span className="metric-pill__label">{config.name}</span>
                  <button
                    className="metric-pill__remove"
                    onClick={() => removeMetric(metric)}
                    aria-label="Retirer"
                  >
                    ×
                  </button>
                </div>
              );
            })}
            
            {/* Add Metric Dropdown */}
            <div className="metric-dropdown" ref={dropdownRef}>
              <button
                className="add-metric-btn"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Ajouter un indicateur
              </button>
              
              {isDropdownOpen && (
                <div className="metric-dropdown__panel">
                  {/* Category Selector */}
                  <div className="dropdown-categories">
                    {Object.keys(metricsByCategory).filter(cat => cat !== 'main').map(category => (
                      <button
                        key={category}
                        className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        {getCategoryLabel(category)}
                      </button>
                    ))}
                  </div>
                  
                  {/* Metric Selector */}
                  <div className="dropdown-metrics">
                    {metricsByCategory[selectedCategory]?.map(({ key, config }) => (
                      <button
                        key={key}
                        className={`metric-option ${selectedMetrics.includes(key) ? 'selected' : ''}`}
                        onClick={() => addMetric(key)}
                        style={{
                          '--metric-color': config.color,
                        } as React.CSSProperties}
                        disabled={selectedMetrics.includes(key)}
                      >
                        <span className="metric-option__indicator"></span>
                        <span className="metric-option__label">{config.name}</span>
                        {selectedMetrics.includes(key) && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="timeframe-selector-wrapper">
          <label className="timeframe-label">Période :</label>
          <div className="timeframe-selector">
          {(Object.keys(TIMEFRAME_CONFIG) as TimeFrame[]).map(tf => (
            <button
              key={tf}
              className={`timeframe-btn ${timeFrame === tf ? 'active' : ''}`}
              onClick={() => setTimeFrame(tf)}
            >
              {tf}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartRef} className="chart-container" />
    </div>
  );
}
