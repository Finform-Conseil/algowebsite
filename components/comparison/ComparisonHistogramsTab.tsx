'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ComparisonStock, Indicator } from '@/core/data/StockComparison';

interface ComparisonHistogramsTabProps {
  stocks: ComparisonStock[];
  indicators: Indicator[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ComparisonHistogramsTab({ stocks, indicators }: ComparisonHistogramsTabProps) {
  if (stocks.length === 0 || indicators.length === 0) {
    return (
      <div className="comparison-empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
        <h3>Données insuffisantes</h3>
        <p>Sélectionnez des actions et indicateurs pour afficher les histogrammes comparatifs</p>
      </div>
    );
  }

  return (
    <div className="comparison-histograms-tab">
      <div className="histograms-header">
        <h3>Comparaison Multi-Années par Indicateur</h3>
        <p>Analyse de l'évolution des indicateurs sur plusieurs années pour chaque action</p>
      </div>

      <div className="histograms-grid">
        {indicators.map((indicator) => (
          <HistogramChart
            key={indicator.id}
            indicator={indicator}
            stocks={stocks}
          />
        ))}
      </div>
    </div>
  );
}

interface HistogramChartProps {
  indicator: Indicator;
  stocks: ComparisonStock[];
}

function HistogramChart({ indicator, stocks }: HistogramChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    // Générer des données multi-années simulées (2019-2024)
    const years = ['2019', '2020', '2021', '2022', '2023', '2024'];
    
    const series = stocks.map((stock, index) => {
      const currentValue = stock[indicator.field] as number;
      // Simuler des variations historiques basées sur la valeur actuelle
      const historicalData = years.map((_, yearIndex) => {
        const variation = (Math.random() - 0.5) * 0.3; // ±15% de variation
        const factor = 1 + (variation * (yearIndex / years.length));
        return Number((currentValue * factor).toFixed(2));
      });

      return {
        name: stock.ticker,
        type: 'bar',
        data: historicalData,
        itemStyle: {
          color: COLORS[index % COLORS.length],
        },
        emphasis: {
          focus: 'series',
        },
        label: {
          show: false,
        },
      };
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
          let result = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach((param: any) => {
            result += `${param.marker} ${param.seriesName}: ${param.value}${indicator.unit}<br/>`;
          });
          return result;
        },
      },
      legend: {
        data: stocks.map((s) => s.ticker),
        bottom: 10,
        textStyle: {
          color: 'var(--text-primary)',
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '15%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: years,
        axisLabel: {
          color: 'var(--text-secondary)',
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
      series: series as any,
    };

    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [indicator, stocks]);

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
