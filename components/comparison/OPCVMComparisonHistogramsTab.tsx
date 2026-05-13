'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import {OPCVMIndicator } from '@/core/data/StockComparison';
import { OPCVMEntity } from '@/core/domain/entities/opcvm.entity';

interface OPCVMComparisonHistogramsTabProps {
  opcvms: OPCVMEntity[];
  indicators: OPCVMIndicator[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function OPCVMComparisonHistogramsTab({ opcvms, indicators }: OPCVMComparisonHistogramsTabProps) {
  if (opcvms.length === 0 || indicators.length === 0) {
    return (
      <div className="comparison-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <h3>Insufficient Data</h3>
        <p>Select funds and indicators to display comparative histograms</p>
      </div>
    );
  }

  return (
    <div className="comparison-histograms-tab">
      {/* <div className="histograms-header">
        <h3>Comparison by Indicator</h3>
        <p>Analysis of indicator evolution over multiple years for each fund</p>
      </div> */}

      <div className="histograms-grid">
        {indicators.map((indicator) => (
          <OPCVMHistogramChart
            key={indicator.id}
            indicator={indicator}
            opcvms={opcvms}
          />
        ))}
      </div>
    </div>
  );
}

interface OPCVMHistogramChartProps {
  indicator: OPCVMIndicator;
  opcvms: OPCVMEntity[];
}

function OPCVMHistogramChart({ indicator, opcvms }: OPCVMHistogramChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Extraire les intitulés des OPCVMs pour l'axe X
    const opcvmNames = opcvms.map((opcvm) => opcvm.intitule.substring(0, 5));
    
    // Extraire les valeurs de la métrique pour chaque OPCVM
    const values = opcvms.map((opcvm) => {
      const metricValue = opcvm.latest_metrics?.[indicator.field as keyof typeof opcvm.latest_metrics];
      return metricValue !== null && metricValue !== undefined ? Number(metricValue) : null;
    });

    const option: echarts.EChartsOption = {
      title: {
        text: indicator.name,
        left: 'center',
        textStyle: {
          color: 'var(--text-primary)',
          fontSize: 16,
          fontWeight: 600,
        },
        subtextStyle: {
          color: 'var(--text-secondary)',
        },
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
        },
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-primary)',
        },
        formatter: (params: any) => {
          const param = params[0];
          const value = param.value !== null ? `${param.value}${indicator.unit}` : 'N/A';
          return `<strong>${param.axisValue}</strong><br/>${param.marker} ${indicator.name}: ${value}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '20%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: opcvmNames,
        axisLabel: {
          color: 'var(--text-secondary)',
          rotate: 45,
          interval: 0,
          fontSize: 11,
        },
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)',
          },
        },
      },
      yAxis: {
        type: 'value',
        name: indicator.unit,
        nameTextStyle: {
          color: 'var(--text-secondary)',
        },
        axisLabel: {
          color: 'var(--text-secondary)',
          formatter: (value: number) => `${value}${indicator.unit}`,
        },
        splitLine: {
          lineStyle: {
            color: 'var(--border-color)',
            type: 'dashed',
          },
        },
      },
      series: [
        {
          name: indicator.name,
          type: 'bar',
          data: values,
          itemStyle: {
            color: (params: any) => {
              return COLORS[params.dataIndex % COLORS.length];
            },
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
            },
          },
          label: {
            show: true,
            position: 'top',
            formatter: (params: any) => {
              return params.value !== null ? `${params.value}${indicator.unit}` : 'N/A';
            },
            fontSize: 10,
            color: 'var(--text-secondary)',
          },
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
  }, [indicator, opcvms]);

  return (
    <div className="histogram-card">
      <div className="histogram-card__info">
        <span className="info-badge">{indicator.category}</span>
        <p className="info-description">{indicator.description}</p>
      </div>
      <div ref={chartRef} className="histogram-chart" style={{ width: '100%', height: '350px' }} />
    </div>
  );
}
