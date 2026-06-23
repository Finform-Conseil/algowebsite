'use client';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts';

interface BarChartProps {
  data: {
    categories: string[];
    values?: number[];
    series?: Array<{
      name: string;
      values: number[];
      color?: string;
    }>;
  };
  title?: string;
  height?: string;
  color?: string;
}

export default function BarChart({ data, title, height = '200px', color }: BarChartProps) {
  // Support both single series (values) and multiple series
  const seriesData = data.series 
    ? data.series.map(s => ({
        name: s.name,
        type: 'bar' as const,
        data: s.values,
        itemStyle: {
          color: s.color || color || '#00BFFF',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            opacity: 0.8,
          },
        },
      }))
    : [{
        type: 'bar' as const,
        data: data.values || [],
        itemStyle: {
          color: color || '#00BFFF',
          borderRadius: [4, 4, 0, 0],
        },
        emphasis: {
          itemStyle: {
            color: color || '#00BFFF',
            opacity: 0.8,
          },
        },
      }];

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    title: title ? {
      text: title,
      textStyle: {
        color: 'var(--text-color)',
        fontSize: 14,
        fontWeight: 600,
      },
      left: 'center',
    } : undefined,
    legend: data.series ? {
      top: title ? '12%' : '5%',
      textStyle: {
        color: '#ffffff',
        fontSize: 11,
      },
    } : undefined,
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: data.series ? (title ? '20%' : '15%') : (title ? '15%' : '10%'),
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.categories,
      axisLabel: {
        color: '#ffffff',
        fontSize: 10,
        rotate: 45,
      },
      axisLine: {
        lineStyle: {
          color: '#ffffff',
          width: 1,
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#ffffff',
        fontSize: 10,
      },
      axisLine: {
        lineStyle: {
          color: '#ffffff',
          width: 1,
        },
      },
      splitLine: {
        lineStyle: {
          color: '#ffffff',
          opacity: 0.15,
        },
      },
    },
    series: seriesData,
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--card-background)',
      borderColor: 'var(--border-color)',
      textStyle: {
        color: 'var(--text-color)',
      },
    },
  };

  return <ReactECharts option={option} style={{ height }} />;
}
