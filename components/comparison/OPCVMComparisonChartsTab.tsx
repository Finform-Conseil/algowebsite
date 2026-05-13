'use client';

import { useState, useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { OPCVMIndicator } from '@/core/data/StockComparison';
import { OPCVMEntity, OPCVMMetricEntity } from '@/core/domain/entities/opcvm.entity';
import TechnicalAnalysisChart from '@/components/charts/TechnicalAnalysisChart';
import { useOpcvmMetricRepository } from '@/core/infra/repositories/opcvm.repository.impl';

type ChartMode = 'individual' | 'technical';

interface OPCVMComparisonChartsTabProps {
  opcvms: OPCVMEntity[];
  indicators: OPCVMIndicator[];
}

export default function OPCVMComparisonChartsTab({ opcvms, indicators }: OPCVMComparisonChartsTabProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<OPCVMIndicator | null>(
    indicators.length > 0 ? indicators[0] : null
  );
  const [chartMode, setChartMode] = useState<ChartMode>('individual');

  if (opcvms.length === 0) {
    return (
      <div className="comparison-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        <h3>No fund selected yet</h3>
        <p>Select at least 2 funds to display comparative charts</p>
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="comparison-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h3>No Indicator selected yet</h3>
        <p>Select indicators to display charts</p>
      </div>
    );
  }

  const formatValue = (value: number | null | undefined, unit: string): string => {
    if (value === null || value === undefined) return 'N/A';
    if (unit === '%') return `${value.toFixed(2)}%`;
    if (unit === '$') return `$${value.toFixed(2)}`;
    if (unit === 'x') return `${value.toFixed(2)}x`;
    if (unit === 'Md') return `${value.toFixed(1)}Md`;
    return value.toFixed(2);
  };

  return (
    <div className="comparison-charts-tab">
      {/* Header avec Indicator Selector et Mode Switcher */}
      <div className="comparison-charts-header">
        {/* Indicator Selector - Gauche */}
        <div className="indicator-selector">
          <label className="selector-label">Comparaison criteria :</label>
          <div className="indicator-buttons">
            {indicators.map((indicator) => (
              <button
                key={indicator.id}
                className={`indicator-btn ${selectedIndicator?.id === indicator.id ? 'active' : ''}`}
                onClick={() => setSelectedIndicator(indicator)}
              >
                <span className="indicator-btn__name">{indicator.name}</span>
                <span className="indicator-btn__unit">{indicator.unit}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Indicator Info avec Mode Switcher - Droite */}
        {selectedIndicator && (
          <div className="indicator-info">
            <div className="indicator-info__header">
              <div className="indicator-info__text">
                <h3>{selectedIndicator.name}</h3>
                <span className="indicator-info__category">{selectedIndicator.category}</span>
              </div>
              <div className="chart-mode-switcher">
                <button
                  className={`mode-btn ${chartMode === 'individual' ? 'active' : ''}`}
                  onClick={() => setChartMode('individual')}
                  title="Individual Charts"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`mode-btn ${chartMode === 'technical' ? 'active' : ''}`}
                  onClick={() => setChartMode('technical')}
                  title="Technical Analysis"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </button>
              </div>
            </div>
            <p className="indicator-info__description">{selectedIndicator.description}</p>
          </div>
        )}
      </div>

      {selectedIndicator && (
        <>
          {chartMode === 'individual' ? (
            /* Mode Individual Charts */
            <div className="charts-grid">
              {opcvms.map((opcvm) => {
                const value = opcvm.latest_metrics?.[selectedIndicator.field as keyof typeof opcvm.latest_metrics];
                const numValue = value !== null && value !== undefined ? Number(value) : null;
                
                return (
                  <OPCVMChart
                    key={opcvm.id}
                    opcvm={opcvm}
                    indicator={selectedIndicator}
                    value={numValue}
                    formatValue={formatValue}
                  />
                );
              })}
            </div>
          ) : (
            /* Mode Technical Analysis */
            <OPCVMTechnicalAnalysis
              opcvms={opcvms}
              indicator={selectedIndicator}
            />
          )}
        </>
      )}
    </div>
  );
}

interface OPCVMChartProps {
  opcvm: OPCVMEntity;
  indicator: OPCVMIndicator;
  value: number | null;
  formatValue: (value: number | null | undefined, unit: string) => string;
}

function OPCVMChart({ opcvm, indicator, value, formatValue }: OPCVMChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Générer des données simulées pour la sparkline (à remplacer par de vraies données historiques)
    const simulatedData = Array.from({ length: 12 }, (_, i) => {
      const baseValue = value || 0;
      const variation = (Math.random() - 0.5) * 0.2 * baseValue;
      return Number((baseValue + variation).toFixed(2));
    });

    const option: echarts.EChartsOption = {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-primary)',
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.value}${indicator.unit}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '3%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        show: false,
      },
      yAxis: {
        type: 'value',
        show: false,
      },
      series: [
        {
          type: 'line',
          data: simulatedData,
          smooth: true,
          lineStyle: {
            color: '#3b82f6',
            width: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
              ],
            },
          },
          symbol: 'none',
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [value, indicator]);

  return (
    <div className="chart-card">
      <div className="chart-card__header">
        <div className="stock-info">
          <div className="stock-logo">
            {opcvm.intitule.substring(0, 2).toUpperCase()}
          </div>
          <div className="stock-details">
            <h4>{opcvm.intitule}</h4>
            <span className="stock-name">{opcvm.isin}</span>
          </div>
        </div>
        <div className="indicator-value">
          <span className="value-label">{indicator.name}</span>
          <span className="value-number">{formatValue(value, indicator.unit)}</span>
        </div>
      </div>
      
      <div className="chart-card__body">
        <div ref={chartRef} style={{ width: '100%', height: '280px' }} />
      </div>
      
      <div className="chart-card__footer">
        <div className="stat-item">
          <span className="stat-label">Nature</span>
          <span className="stat-value">{opcvm.nature}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Type</span>
          <span className="stat-value">{opcvm.type}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">AUM</span>
          <span className="stat-value">{(opcvm.aum / 1000000).toFixed(1)}M</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Risque</span>
          <span className="stat-value">{opcvm.niveau_risque}/10</span>
        </div>
      </div>
    </div>
  );
}

// Composant pour le mode Technical Analysis
interface OPCVMTechnicalAnalysisProps {
  opcvms: OPCVMEntity[];
  indicator: OPCVMIndicator;
}

function OPCVMTechnicalAnalysis({ opcvms, indicator }: OPCVMTechnicalAnalysisProps) {
  const { getAllOpcvmMetrics } = useOpcvmMetricRepository();
  const [metricsDataByOpcvm, setMetricsDataByOpcvm] = useState<Record<string, OPCVMMetricEntity[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Charger les métriques pour tous les OPCVMs
  useEffect(() => {
    const loadAllMetrics = async () => {
      setIsLoading(true);
      const metricsMap: Record<string, OPCVMMetricEntity[]> = {};
      
      try {
        // Charger les métriques pour chaque OPCVM
        await Promise.all(
          opcvms.map(async (opcvm) => {
            const result = await getAllOpcvmMetrics({ 
              opcvm: opcvm.id, 
              page: 1, 
              page_size: 1000 
            });
            metricsMap[opcvm.id] = result.data || [];
          })
        );
        
        setMetricsDataByOpcvm(metricsMap);
      } catch (error) {
        console.error('Error loading OPCVM metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (opcvms.length > 0) {
      loadAllMetrics();
    }
  }, [opcvms.map(o => o.id).join(',')]);

  // Préparer les données pour le TechnicalAnalysisChart
  const seriesData = opcvms.map((opcvm, index) => {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
    
    // Récupérer les vraies données pour cet OPCVM
    const data = metricsDataByOpcvm[opcvm.id] || [];
    
    console.log(`[OPCVMComparisonChartsTab] OPCVM ${opcvm.intitule} (${opcvm.id}):`, {
      rawDataCount: data.length,
      firstItem: data[0],
      lastItem: data[data.length - 1]
    });
    
    // Trier par date (timestamp) croissante
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      name: opcvm.intitule,
      data: sortedData, // OPCVMMetricEntity[] - sera transformé automatiquement par TechnicalAnalysisChart
      color: COLORS[index % COLORS.length],
    };
  });

  console.log('[OPCVMComparisonChartsTab] Final seriesData:', {
    count: seriesData.length,
    series: seriesData.map(s => ({ name: s.name, dataCount: s.data.length })),
    fullData: seriesData
  });

  // Vérifier si on a des données
  const hasData = seriesData.some(series => series.data.length > 0);
  
  console.log('[OPCVMComparisonChartsTab] hasData:', hasData, 'isLoading:', isLoading);

  if (isLoading) {
    return (
      <div className="technical-analysis-container">
        <div className="comparison-empty-state" style={{ minHeight: '400px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <h3>Data Loading...</h3>
          <p>Historical data are loading</p>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="technical-analysis-container">
        <div className="comparison-empty-state" style={{ minHeight: '400px' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 3v18h18" />
            <path d="M18 17l-5-5-4 4-5-5" />
          </svg>
          <h3>Data Loading...</h3>
          <p>Historical data are loading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="technical-analysis-container">
      <TechnicalAnalysisChart
        seriesData={seriesData}
        defaultMetrics={['liquidative_value']}
        defaultTimeFrame="ALL"
        showToolbox={true}
        height='600px'
      />
    </div>
  );
}
