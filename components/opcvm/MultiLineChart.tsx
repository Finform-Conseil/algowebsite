'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { Candle } from '@/core/data/TechnicalAnalysis';

interface DataSeries {
  name: string;
  data: Candle[];
  color: string;
}

interface MultiLineChartProps {
  series: DataSeries[];
  type?: 'top' | 'flop';
}

export default function MultiLineChart({ series, type = 'top' }: MultiLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chart, setChart] = useState<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = echarts.init(chartRef.current, 'light');
    setChart(myChart);

    return () => {
      myChart.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chart || !series.length) return;

    // Utiliser les dates de la première série comme référence
    const dates = series[0].data.map((d) => d.date);

    // Normaliser toutes les séries à 100 au départ pour comparer les performances relatives
    const normalizedSeries = series.map((s) => {
      const firstPrice = s.data[0].close;
      return {
        name: s.name,
        color: s.color,
        data: s.data.map((d) => ((d.close / firstPrice) * 100).toFixed(2))
      };
    });

    const option: echarts.EChartsOption = {
      backgroundColor: {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: type === 'top' 
          ? [
              { offset: 0, color: 'rgba(16, 185, 129, 0.03)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
            ]
          : [
              { offset: 0, color: 'rgba(239, 68, 68, 0.03)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.01)' },
            ],
      },
      animation: true,
      legend: {
        top: 10,
        left: 'center',
        textStyle: {
          color: 'var(--text-color)',
          fontSize: 11,
        },
        data: normalizedSeries.map(s => s.name),
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          animation: false,
          label: {
            backgroundColor: 'var(--primary-color)',
          },
        },
        backgroundColor: 'var(--card-background)',
        borderColor: 'var(--border-color)',
        textStyle: {
          color: 'var(--text-color)',
        },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          
          const dateIndex = params[0].dataIndex;
          const date = dates[dateIndex];
          
          let html = `<div style="padding: 8px;">`;
          html += `<div style="font-weight: 700; margin-bottom: 8px;">${new Date(date).toLocaleDateString('fr-FR')}</div>`;
          html += `<div style="display: grid; grid-template-columns: auto 1fr; gap: 8px 16px;">`;
          
          params.forEach((param: any) => {
            const seriesIndex = param.seriesIndex;
            const originalData = series[seriesIndex].data[dateIndex];
            const normalizedValue = param.value;
            const change = ((normalizedValue - 100)).toFixed(2);
            const color = parseFloat(change) >= 0 ? 'var(--positive-color)' : 'var(--negative-color)';
            
            html += `<span style="color: ${param.color};">●</span>`;
            html += `<span style="font-weight: 600;">${param.seriesName}</span>`;
            html += `<span></span>`;
            html += `<span style="color: ${color}; font-weight: 600;">${change >= '0' ? '+' : ''}${change}%</span>`;
          });
          
          html += `</div></div>`;
          return html;
        },
      },
      grid: {
        left: '8%',
        right: '5%',
        top: '15%',
        bottom: '12%',
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: 'var(--border-color)',
          },
        },
        axisLabel: {
          color: 'var(--text-secondary)',
          fontSize: 10,
          formatter: (value: string) => {
            const date = new Date(value);
            return `${date.getDate()}/${date.getMonth() + 1}`;
          },
        },
        splitLine: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        position: 'right',
        axisLabel: {
          color: 'var(--text-secondary)',
          fontSize: 10,
          formatter: (value: number) => `${value.toFixed(0)}`,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: 'var(--border-color)',
            opacity: 0.2,
          },
        },
        axisLine: {
          show: false,
        },
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
      ],
      series: normalizedSeries.map((s) => ({
        name: s.name,
        type: 'line',
        data: s.data,
        smooth: true,
        showSymbol: false,
        lineStyle: {
          width: 2.5,
          color: s.color,
        },
        emphasis: {
          lineStyle: {
            width: 3.5,
          },
        },
      })),
    };

    chart.setOption(option as any);

    // Resize handler
    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart, series, type]);

  // Resize chart when container size changes
  useEffect(() => {
    if (!chart) return;

    const resizeObserver = new ResizeObserver(() => {
      chart.resize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [chart]);

  return (
    <div ref={containerRef} className="multi-line-chart-container" style={{ width: '100%', height: '100%' }}>
      <div ref={chartRef} className="multi-line-chart" style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
